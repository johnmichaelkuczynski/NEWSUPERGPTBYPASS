import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      googleId?: string | null;
      email?: string | null;
      displayName?: string | null;
    }
  }
}

export function setupAuth(app: Express) {
  // Strip invisible characters (non-breaking spaces, zero-width chars, BOM) and
  // surrounding whitespace that often sneak in when secrets are copy-pasted.
  const sanitizeSecret = (v?: string) =>
    (v || "").replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, "").trim();

  // Google OAuth client credentials (owner-provided).
  // GOOGLE_LOGIN_* names take priority — reusable across the owner's apps and
  // free of collisions with stale account-vault entries under older GOOGLE_* names.
  const clientID = sanitizeSecret(
    process.env.GOOGLE_LOGIN_CLIENT_ID ||
      process.env.GOOGLE_OAUTH_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID
  );
  const clientSecret = sanitizeSecret(
    process.env.GOOGLE_LOGIN_CLIENT_SECRET ||
      process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET
  );

  const isProduction = process.env.NODE_ENV === "production";
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || (!isProduction ? `http://localhost:${process.env.PORT || "5000"}` : "");
  let validPublicBaseUrl = false;
  try {
    const parsed = new URL(publicBaseUrl);
    validPublicBaseUrl = ["http:", "https:"].includes(parsed.protocol) &&
      (!isProduction || parsed.protocol === "https:") &&
      !parsed.username && !parsed.password && !parsed.search && !parsed.hash &&
      parsed.pathname === "/";
  } catch { /* Missing/invalid public URL disables optional OAuth, not the app. */ }
  const googleEnabled = !!(clientID && clientSecret && validPublicBaseUrl);

  if (!googleEnabled) {
    console.warn(
      "Google login disabled: configure Google credentials and a valid PUBLIC_BASE_URL (HTTPS in production)."
    );
  }

  // Coolify terminates HTTPS at Traefik, one trusted reverse-proxy hop away.
  app.set('trust proxy', 1);

  // Database-backed session store
  const PgSession = connectPgSimple(session);
  // Session setup with database storage
  const pgStore = new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    errorLog: console.error.bind(console, 'Session store error:'),
  });

  if (isProduction && !process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required in production");
  }

  app.use(
    session({
      store: pgStore,
      secret: process.env.SESSION_SECRET || "text-intelligence-studio-secret-key",
      proxy: true,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    })
  );

  console.log(`Session configured. Secure cookies: ${isProduction}`);

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // --- Google OAuth 2.0 (optional login: the app itself is fully open) ---
  if (googleEnabled) {
    // Callback path is /auth/google/callback to match the redirect URIs
    // registered in the owner's Google Cloud Console OAuth client.
    const CALLBACK_PATH = "/auth/google/callback";

    // Never derive OAuth redirects from untrusted Host/forwarded headers.
    const getCallbackURL = () => new URL(CALLBACK_PATH, publicBaseUrl).toString();

    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL: getCallbackURL(),
          state: true, // CSRF protection via session-stored state parameter
          passReqToCallback: false,
        } as any,
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value || null;
            const displayName = profile.displayName || null;
            const googleId = profile.id;

            let user = await storage.getUserByGoogleId(googleId);

            if (!user) {
              if (email) {
                user = await storage.getUserByEmail(email);
              }

              if (!user) {
                const username = email?.split("@")[0] || `user_${googleId.substring(0, 8)}`;
                user = await storage.createUserWithGoogle({
                  username,
                  googleId,
                  email,
                  displayName,
                });
                console.log(`Google OAuth: Created new user ${user.id} (${user.username})`);
              } else {
                user = await storage.updateUserGoogle(user.id, {
                  googleId,
                  displayName,
                });
              }
            } else {
              user = await storage.updateUserGoogle(user.id, {
                displayName,
              });
            }

            console.log(`Google OAuth: Login successful for user ${user.id}`);
            done(null, user);
          } catch (error) {
            console.error("Google auth error:", error);
            done(error as Error);
          }
        }
      )
    );

    // Click 1: button links here -> 302 straight to Google's account chooser.
    // Always use the configured public origin, including behind Traefik.
    const loginHandler = (req: any, res: any, next: any) =>
      passport.authenticate("google", {
        scope: ["openid", "email", "profile"],
        prompt: "select_account",
        callbackURL: getCallbackURL(),
      } as any)(req, res, next);
    app.get("/api/auth/google", loginHandler);
    app.get("/auth/google", loginHandler);

    // Click 2 happens on Google; the callback lands the user inside the app
    const callbackHandler: RequestHandler = (req, res, next) => {
      passport.authenticate("google", { callbackURL: getCallbackURL() } as any,
        (error: any, user: Express.User | false, info: any) => {
          if (error || !user) {
            console.error("Google OAuth callback failed:", error || info || req.query.error || "No user returned");
            return res.redirect("/?error=auth_failed");
          }
          req.logIn(user, (loginError) => {
            if (loginError) {
              console.error("Google OAuth session login failed:", loginError);
              return res.redirect("/?error=auth_failed");
            }
            // Record a login event on every successful sign-in.
            (async () => {
              try {
                if (req.user) {
                  await storage.recordVisit(req.user.id, req.user.email ?? null);
                }
              } catch (visitErr) {
                console.error("Failed to record login event:", visitErr);
              }
            })();
            req.session.save((saveError) => {
              if (saveError) {
                console.error("Google OAuth session save failed:", saveError);
                return res.redirect("/?error=auth_failed");
              }
              res.redirect("/");
            });
          });
        })(req, res, next);
    };
    app.get(CALLBACK_PATH, callbackHandler);
    // Legacy alias in case the /api-prefixed URI is registered instead
    app.get("/api/auth/google/callback", callbackHandler);

    console.log("Google OAuth configured. Callback URL:", getCallbackURL());
  } else {
    app.get(["/auth/google", "/api/auth/google", "/auth/google/callback", "/api/auth/google/callback"],
      (_req, res) => res.status(503).json({ error: "Google login is not configured on this deployment." }));
  }

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          displayName: req.user.displayName,
        },
      });
    } else {
      res.json({ authenticated: false, user: null });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ success: true });
      });
    });
  });

  // --- Admin: visitor analytics (restricted to the site owner) ---
  app.get("/api/admin/visits", isAdmin, async (_req, res) => {
    try {
      const now = Date.now();
      const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const yearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000);

      const [visitList, allTimestamps] = await Promise.all([
        storage.getVisits(500),
        storage.getVisitTimestampsSince(null),
      ]);

      const times = allTimestamps.map((t) => new Date(t).getTime());
      const stats = {
        allTime: times.length,
        last24Hours: times.filter((t) => t >= dayAgo.getTime()).length,
        lastMonth: times.filter((t) => t >= monthAgo.getTime()).length,
        lastYear: times.filter((t) => t >= yearAgo.getTime()).length,
      };

      // Build bucketed series for graphs
      const buildSeries = (start: number, bucketMs: number, buckets: number, labelFn: (d: Date) => string) => {
        const counts = new Array(buckets).fill(0);
        for (const t of times) {
          if (t >= start) {
            const idx = Math.min(Math.floor((t - start) / bucketMs), buckets - 1);
            counts[idx]++;
          }
        }
        return counts.map((count, i) => ({
          label: labelFn(new Date(start + i * bucketMs)),
          count,
        }));
      };

      const HOUR = 60 * 60 * 1000;
      const DAY = 24 * HOUR;
      const series = {
        last24Hours: buildSeries(now - 24 * HOUR, HOUR, 24, (d) =>
          d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true })),
        lastMonth: buildSeries(now - 30 * DAY, DAY, 30, (d) =>
          d.toLocaleDateString("en-US", { month: "short", day: "numeric" })),
        lastYear: buildSeries(now - 365 * DAY, 365 / 12 * DAY, 12, (d) =>
          d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })),
        allTime: (() => {
          const earliest = times.length ? Math.min(...times) : now;
          const span = Math.max(now - earliest, DAY);
          const buckets = Math.min(24, Math.max(6, Math.ceil(span / (30 * DAY))));
          return buildSeries(earliest, span / buckets, buckets, (d) =>
            d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }));
        })(),
      };

      res.json({
        stats,
        series,
        visits: visitList.map((v) => ({
          id: v.id,
          email: v.email,
          visitedAt: v.visitedAt,
        })),
      });
    } catch (error) {
      console.error("Admin visits error:", error);
      res.status(500).json({ error: "Failed to load visitor data" });
    }
  });
}

const ADMIN_EMAIL = "johnmichaelkuczynski@gmail.com";

export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.email?.toLowerCase() === ADMIN_EMAIL) {
    return next();
  }
  res.status(403).json({ error: "Not authorized" });
};

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Not authenticated" });
};
