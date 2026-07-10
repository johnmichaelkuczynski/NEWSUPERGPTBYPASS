---
name: Google OAuth via Passport.js (user's canonical pattern)
description: This user has a fixed, non-negotiable server/auth.ts implementation for Google login and gets very frustrated if it's substituted with a different auth system.
---

The user maintains a specific canonical `server/auth.ts` (Passport.js `passport-google-oauth20` + `express-session` + `connect-pg-simple`, Postgres-backed sessions in a `user_sessions` table) that they paste in full when they want Google login added to any of their apps.

**Why:** They've explicitly said not to rewrite/regenerate it and never to substitute Clerk, Replit Auth, Auth.js, or other Passport variants — doing so previously caused significant frustration and repeated back-and-forth.

**How to apply:** When this user asks for Google login, expect them to paste their canonical auth.ts. Only adapt app-specific values (production/www domain, `getCallbackURL()` fallback, `trustedHosts`) — leave OAuth logic, session handling, routes, and admin analytics untouched. Their auth.ts expects storage methods `getUserById`, `getUserByGoogleId`, `getUserByEmail`, `createUserWithGoogle`, `updateUserGoogle`, `recordVisit`, `getVisits`, `getVisitTimestampsSince`, plus an `isAdmin` middleware gated on a hardcoded owner email — implement these in `storage.ts`/`schema.ts` to match whatever id type (uuid vs serial) the app's existing tables use. Best practice: derive callback URL/trusted hosts dynamically from `REPLIT_DOMAINS`/`REPLIT_DEV_DOMAIN` rather than hardcoding a domain, since these apps often don't have a fixed custom domain yet.
