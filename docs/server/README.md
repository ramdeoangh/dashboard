# Server documentation

Node.js **Express** REST API with **MySQL** (mysql2), **JWT** access tokens, and **httpOnly** refresh cookies.

## Stack

- **Express 4** — routing, JSON body, static files for uploads
- **mysql2** — connection pool, parameterized queries
- **bcryptjs** — password hashing
- **jsonwebtoken** — access + refresh JWTs
- **zod** — request validation (routes)
- **multer** — multipart uploads (logo, project photos)
- **helmet**, **cors**, **express-rate-limit** — security headers, CORS, login throttling

## Scripts

Run from the `server/` directory:

| Command | Purpose |
|---------|---------|
| `npm start` | Run API (`node src/server.js`) |
| `npm run dev` | Run API with **nodemon** (auto-restart on `src/**` and `.env` changes) |
| `npm run db:migrate` | Create database (if needed) and apply [`db/schema.sql`](../../server/db/schema.sql) |
| `npm run db:seed` | Run [`db/seed.sql`](../../server/db/seed.sql) and create default admin if missing |
| `npm run db:patch:logs` | Add [`application_logs`](../../server/db/patch_application_logs.sql) table on **existing** DBs (no full remigrate) |
| `npm run validate-login` | Smoke-test `POST /api/auth/login` against a running server ([`scripts/validate-login.mjs`](../../server/scripts/validate-login.mjs)) |

Migration and seed load [`server/.env`](../../server/.env) with **`override: true`** so file values win over inherited shell variables.

### Server-side logging (MySQL)

HTTP requests under `/api` (except `/api/health`) append a row to **`application_logs`**: correlation id, method, path, status, duration, optional `user_id`, IP, user agent. **5xx errors** are logged separately with error details (stack in non-production) and skip the duplicate HTTP row.

Environment flags (see [`.env.example`](../../server/.env.example)):

- `LOG_HTTP_TO_DB` — set to `false` to disable HTTP audit rows (default: enabled).
- `LOG_ERRORS_TO_DB` — set to `false` to disable DB rows for 5xx from the error handler (default: enabled).

Fresh installs: the table is created by [`db/schema.sql`](../../server/db/schema.sql). Existing databases: run `npm run db:patch:logs` once.

Responses include header **`X-Correlation-Id`** (or echo a valid client `X-Correlation-Id` when provided).

## Environment variables

Copy `.env.example` to `.env` and set at least:

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4000`) |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS (e.g. `http://localhost:5173`) |
| `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` | MySQL connection |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Long random strings (required in production) |
| `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES_DAYS` | Token lifetimes |
| `UPLOAD_DIR` | Filesystem path for uploads (default `./uploads`) |
| `MAX_UPLOAD_MB` | Max upload size per file |
| `SEED_ADMIN_PASSWORD` | Optional; overrides default password when seed creates the admin user |

## API layout (summary)

- `GET /api/health` — liveness
- `/api/auth` — login, refresh, logout, me
- `/api/portal/*` — portal data (requires `projects.view`)
- `/api/admin/*` — admin CRUD (permission-checked per resource)
- `/uploads/*` — static files from `UPLOAD_DIR`

## Database

- Schema: [`server/db/schema.sql`](../../server/db/schema.sql)
- Seed data: [`server/db/seed.sql`](../../server/db/seed.sql)
- Tables include users, roles, permissions, menus, submenus, settings, states, locations, projects (with `old_photo_path` / `new_photo_path`), pages, refresh_tokens.

## Uploads

Project images are stored under `UPLOAD_DIR/projects/<id>/`. Logo uploads go under `UPLOAD_DIR/branding/`. Only allowed image MIME types and size limits are enforced in middleware.

## Production checklist

- Set `NODE_ENV=production`, strong JWT secrets, and `secure` cookies (HTTPS).
- Restrict `CLIENT_ORIGIN` to your real frontend URL.
- Back up MySQL and `UPLOAD_DIR`.
- Run `npm run db:migrate` once per environment; seed only when appropriate (avoid re-seeding production blindly).
