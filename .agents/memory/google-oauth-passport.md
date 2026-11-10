---
name: Google OAuth via Passport.js (user's canonical pattern)
description: This user has a fixed, non-negotiable server/auth.ts implementation for Google login and gets very frustrated if it's substituted with a different auth system.
---

The user maintains a specific canonical `server/auth.ts` (Passport.js `passport-google-oauth20` + `express-session` + `connect-pg-simple`, Postgres-backed sessions in a `user_sessions` table) that they paste in full when they want Google login added to any of their apps.

**Why:** They've explicitly said not to rewrite/regenerate it and never to substitute Clerk, Replit Auth, Auth.js, or other Passport variants — doing so previously caused significant frustration and repeated back-and-forth.

**How to apply:** Preserve direct Google OAuth with Passport, PostgreSQL sessions, existing user records, and admin analytics. For Coolify the user explicitly requested callbacks from `PUBLIC_BASE_URL`, secure proxy-aware cookies, session saves before redirecting, and real callback-error logging. Do not restore the older `REPLIT_*` or request-host-derived callback behavior. The requested portability/security changes are an exception to the earlier preference to leave the pasted auth file unchanged.
