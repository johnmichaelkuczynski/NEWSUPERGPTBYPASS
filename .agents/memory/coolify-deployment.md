---
name: Production deployment target
description: User's requested portable Coolify target and boundaries.
---

Prepare production for Coolify, Docker, linux/arm64, behind Traefik terminating
HTTPS. Keep the app portable rather than reintroducing Replit-only runtime
services or environment checks.

**Why:** The user explicitly requested this deployment target after repeated
publishing failures.

**How to apply:** Preserve the existing UI, rewrite behavior, direct Google
OAuth, and external PostgreSQL records. Support standard environment-based
configuration and optional provider keys. Do not treat migration preparation
or a successful local build as evidence that the external site is deployed.
