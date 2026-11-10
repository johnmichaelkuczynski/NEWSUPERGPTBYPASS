import assert from "node:assert/strict";
import { after, test } from "node:test";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import passport from "passport";
import type { Express } from "express";

// Tests use dummy configuration and never connect to a real database/provider.
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
delete process.env.NEON_DATABASE_URL;
process.env.SESSION_SECRET = randomBytes(32).toString("hex");
process.env.NODE_ENV = "production";
process.env.PUBLIC_BASE_URL = "https://canonical.example";
for (const key of ["GOOGLE_LOGIN_CLIENT_ID", "GOOGLE_LOGIN_CLIENT_SECRET",
  "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) process.env[key] = "test-only";

const { setupAuth } = await import("./auth");
const { pool } = await import("./db");
after(() => pool.end());

function authRoutes() {
  const routes = new Map<string, any[]>();
  const settings = new Map();
  const app = {
    set: (key: string, value: unknown) => settings.set(key, value),
    use: () => {},
    post: () => {},
    get: (paths: string | string[], ...handlers: any[]) => {
      for (const route of [paths].flat()) routes.set(route, handlers);
    },
  };
  setupAuth(app as unknown as Express);
  assert.equal(settings.get("trust proxy"), 1);
  return routes;
}

test("OAuth uses PUBLIC_BASE_URL, never a forwarded Host header", () => {
  const routes = authRoutes();
  const original = passport.authenticate;
  try {
    passport.authenticate = ((_strategy: string, options: any) => {
      assert.equal(options.callbackURL, "https://canonical.example/auth/google/callback");
      return () => {};
    }) as any;
    routes.get("/auth/google")![0](
      { headers: { host: "attacker.example", "x-forwarded-host": "attacker.example" } },
      {}, () => {},
    );
  } finally { passport.authenticate = original; }
});

test("OAuth saves its session before the success redirect", () => {
  const routes = authRoutes();
  const original = passport.authenticate;
  const events: string[] = [];
  try {
    passport.authenticate = ((_strategy: string, _options: any, done: any) => {
      return () => done(null, { id: "test-user", username: "test" });
    }) as any;
    const req = {
      logIn: (_user: unknown, done: any) => done(),
      session: { save: (done: any) => { events.push("saved"); done(); } },
    };
    routes.get("/auth/google/callback")![0](req, {
      redirect: (url: string) => events.push(`redirect:${url}`),
    }, () => {});
    assert.deepEqual(events, ["saved", "redirect:/"]);
  } finally { passport.authenticate = original; }
});

test("OAuth logs the actual failure and does not report success", () => {
  const routes = authRoutes();
  const original = passport.authenticate;
  const originalError = console.error;
  const failure = new Error("test callback failure");
  const logged: unknown[] = [];
  let redirect = "";
  try {
    console.error = (...args) => { logged.push(...args); };
    passport.authenticate = ((_strategy: string, _options: any, done: any) =>
      () => done(failure)) as any;
    routes.get("/auth/google/callback")![0]({}, {
      redirect: (url: string) => { redirect = url; },
    }, () => {});
    assert.ok(logged.includes(failure));
    assert.equal(redirect, "/?error=auth_failed");
  } finally {
    passport.authenticate = original;
    console.error = originalError;
  }
});

test("Production starts without optional keys or platform environment variables", async () => {
  const socket = createServer();
  await new Promise<void>((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>((resolve) => socket.close(() => resolve()));
  const cwd = await mkdtemp(path.join(tmpdir(), "coolify-startup-"));
  const child = spawn(process.execPath, [path.resolve("dist/index.js")], {
    cwd,
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "production",
      PORT: String(port),
      DATABASE_URL: "postgresql://test:test@127.0.0.1:1/test",
      SESSION_SECRET: randomBytes(32).toString("hex"),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (data) => { output += data; });
  child.stderr.on("data", (data) => { output += data; });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(`Startup failed: ${output}`);
      try {
        const result = await fetch(`http://127.0.0.1:${port}/healthz`);
        if (result.status === 200) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, output);
    for (const route of ["/", "/healthz", "/api/auth/user"]) {
      const response = await fetch(`http://127.0.0.1:${port}${route}`);
      assert.equal(response.status, 200, route);
      if (route === "/") {
        const html = await response.text();
        assert.match(html, /<html/);
        assert.doesNotMatch(html, /replit-dev-banner/);
      }
    }
    const login = await fetch(`http://127.0.0.1:${port}/auth/google`);
    assert.equal(login.status, 503);
    assert.match(output, /serving on port/);
  } finally {
    const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    if (child.exitCode === null) { child.kill(); await exited; }
    await rm(cwd, { recursive: true, force: true });
  }
});
