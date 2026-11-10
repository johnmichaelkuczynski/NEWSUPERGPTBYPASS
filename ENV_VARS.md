# Coolify deployment

Select the repository's root `Dockerfile`, target `linux/arm64`, internal HTTP
port **5000**, and health-check path **/healthz**. Let Traefik terminate HTTPS;
the Node server listens on `0.0.0.0:$PORT`. Do not enable HTTPS inside Node.
Do not pass API keys or database credentials as Docker build arguments.

The image uses Node 22, installs npm 11 first, installs app dependencies once,
builds, and removes development-only packages. No Puppeteer dependency is present,
so no browser download or system Chrome installation is needed.

## Required to start production

| Variable | Expected value |
| --- | --- |
| `DATABASE_URL` | A PostgreSQL connection URL, e.g. `postgresql://USER:PASSWORD@postgres:5432/APP`. Use the existing app database to preserve records. For hosted databases requiring TLS, include the provider's SSL parameters, e.g. `?sslmode=require`. Plain internal Coolify PostgreSQL connections do not need forced TLS. |
| `SESSION_SECRET` | A long, random, persistent secret (at least 32 random bytes). Keep it unchanged across replicas and deployments. |

`NEON_DATABASE_URL` is supported as a legacy connection URL and takes precedence
when both database variables exist, so an existing workspace cannot accidentally
switch databases during migration. On Coolify set **only DATABASE_URL**.
The same PostgreSQL pool is used for app data and sessions.

The app expects its existing Drizzle schema (`shared/schema.ts`) in that database.
There are no deployment-time seed/reset operations. For a new empty database,
review/apply the schema separately using the repository's Drizzle tooling
(`npm run db:push`, configured by `DATABASE_URL`) before using data-backed
features. Back up any existing database before schema administration.
The session store creates `user_sessions` if missing when first used.

## Runtime settings

| Variable | Required? | Expected value / default |
| --- | --- | --- |
| `NODE_ENV` | Set by image | `production`. `development` enables Vite and non-secure local cookies; never use it in the runtime image. |
| `PORT` | No | `5000`, set by image. If overridden, update Coolify's internal port and health check accordingly. |
| `PUBLIC_BASE_URL` | Required for Google login in production | The single canonical external HTTPS origin, e.g. `https://your-domain.example`, without a path, query, credentials, or fragment. OAuth does not trust request Host headers. Optional if login is disabled. |
| `CI` | Build only | `true`, set in the build stage. |

## Optional provider keys

All of these may be absent at startup. Missing configuration disables the
corresponding optional capability or returns an explicit error when requested;
it does not prevent the landing page or health check from starting.
No Stripe code or Stripe environment variables are used by this app.

| Variables | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | A paired Google OAuth web client. Register `PUBLIC_BASE_URL/auth/google/callback` as an authorized redirect URI. |
| `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET` | Legacy higher-priority aliases for the Google pair. |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Legacy middle-priority aliases for the Google pair. Avoid mixing aliases; set only one complete pair. |
| `OPENAI_API_KEY` | OpenAI-backed rewriting/transformation. |
| `ANTHROPIC_API_KEY` | Optional Anthropic provider. |
| `PERPLEXITY_API_KEY` | Optional Perplexity provider. |
| `DEEPSEEK_API_KEY` | Optional DeepSeek provider. |
| `VENICE_API_KEY` | Optional Venice provider. |
| `GPTZERO_API_KEY` | GPTZero analysis for input, output, and style samples. |
| `WALTERWRITES_API_KEY` | Optional WalterWrites integration. |
| `OPENAI_API_KEY_ENV_VAR`, `ANTHROPIC_API_KEY_ENV_VAR`, `PERPLEXITY_API_KEY_ENV_VAR`, `DEEPSEEK_API_KEY_ENV_VAR` | Legacy lower-priority aliases for the respective provider keys. Prefer the standard names. |

Google login is disabled with a logged warning if its pair or valid public origin
is missing. Secure, HTTP-only, SameSite=Lax production cookies require HTTPS at
Traefik and `X-Forwarded-Proto: https`. Express trusts exactly one reverse-proxy
hop; do not expose the container port directly to untrusted internet traffic.
Login sessions are saved before the final redirect.

Optional persistent Coolify volumes: `/app/uploads` and `/app/writing_samples`
(writable by UID/GID 1000). The latter is an import folder: existing behavior
imports `.txt` files into PostgreSQL and removes successfully imported files.
User uploads, local secrets, and unrelated attached screenshots are excluded
from the Docker build context. The only bundled attachment is the logo used by
the header.
