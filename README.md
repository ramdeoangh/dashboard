# Project reporting dashboard

Full-stack web application for **project reporting**: admin-managed data, **role-based access**, portal dashboards, and reports with **previous vs current** site photos.

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), React Router, Context API, Axios |
| Backend | Node.js, Express, JWT + refresh cookie, Zod validation |
| Database | MySQL |

Detailed docs: [`docs/README.md`](docs/README.md) — [Client](docs/client/README.md) · [Server](docs/server/README.md).

---

## Prerequisites

- **Node.js** 18+ (or 20+ recommended)
- **MySQL** 8.x (or compatible) running locally or reachable on the network
- **npm** (comes with Node)

---

## Quick start

### 1. Clone and install dependencies

From the repository root:

```bash
npm run install:all
```

This installs dependencies for `server/` and `client/`. Alternatively:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure the API environment

```bash
cd server
copy .env.example .env
```

On macOS/Linux use `cp .env.example .env`.

Edit **`server/.env`** and set:

- **MySQL:** `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (e.g. `project_dashboard`)
- **CORS:** `CLIENT_ORIGIN` — one origin or **comma-separated** list (e.g. `https://dashboard.y4dinfo.org,http://localhost:5173`). Values are normalized (trailing slashes ignored).
- **Swagger servers (optional):** `PUBLIC_API_URL` — first entry in Swagger “Servers”; omit to rely on same-origin `/`.
- **Production docs (optional):** `SWAGGER_DOCS_TOKEN` — if set, `GET /api/docs` and `GET /api/openapi.json` also accept header `X-API-Docs-Token` (otherwise use `Authorization: Bearer` after login). In `NODE_ENV=development`, docs stay open without this gate.
- **JWT:** `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — use long random strings (required for production)
- **Audit (optional):** `LOG_HTTP_TO_DB` / `LOG_ERRORS_TO_DB` — set to `false` to turn off writing API/error rows to MySQL (`application_logs`)

If the database was created **before** audit logging existed, run once: `cd server && npm run db:patch:logs`.

### 3. Create schema and seed data

With MySQL running and credentials correct:

```bash
cd server
npm run db:migrate
npm run db:seed
```

- **`db:migrate`** — creates the database (if missing) and applies `server/db/schema.sql`
- **`db:seed`** — loads `server/db/seed.sql` and creates the default admin user if it does not exist

### 4. Run API + web UI (development)

From the **repository root**:

```bash
npm run dev
```

This starts:

- **API:** http://localhost:4000 (or the `PORT` in `server/.env`)
- **Client:** http://localhost:5173 (Vite; proxies `/api` and `/uploads` to the API)

Open **http://localhost:5173** in the browser.

### API health check & Swagger (OpenAPI)

With the API running, base URL is **`http://localhost:{PORT}`** (default **`http://localhost:4000`**; set `PORT` in `server/.env`).

| What | URL | Notes |
|------|-----|--------|
| **Health (process)** | `GET /api/health` | e.g. `http://localhost:4000/api/health` — `{ "ok": true }`. No auth. |
| **Health (database)** | `GET /api/health/db` | Runs `SELECT 1` against MySQL. `{ "ok": true, "database": "connected" }` or **503** if DB is down. No auth. |
| **Swagger UI** | `/api/docs` | Interactive docs. **Development:** open freely. **Production:** requires `Authorization: Bearer <accessToken>` (e.g. browser extension adding the header) or `X-API-Docs-Token` if `SWAGGER_DOCS_TOKEN` is set. Health routes above stay public. |
| **OpenAPI JSON** | `/api/openapi.json` | Same protection as Swagger UI in production. |
| **Servers in Swagger** | (dropdown) | If `PUBLIC_API_URL` is set, it appears as a server entry; **Same origin** (`/`) is always listed for Try it out on the API host. |

In production, replace the host with your deployed API origin (same paths).

**Run separately (optional):**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### 5. Production build (client)

```bash
npm run build:client
```

Output: `client/dist/`. Serve that folder with your static host and point `/api` and `/uploads` to the Node server (see [`docs/client/README.md`](docs/client/README.md)).

---

## Default admin account

After **`npm run db:seed`** (first run, when no admin user exists yet):

| Field | Value |
|--------|--------|
| **Username** | `admin` |
| **Email** | `admin@example.com` |
| **Password** | `ChangeMe!123` |

**Change this password immediately** in any shared or production environment.

To set a different password **when the admin is first created**, add to `server/.env` before seeding:

```env
SEED_ADMIN_PASSWORD=YourSecurePasswordHere
```

If the admin user **already exists**, `db:seed` does **not** change the password — so `ChangeMe!123` only applies when that user was first created. To fix **“Invalid credentials”** for `admin` / `admin@example.com`:

1. **Reset password (recommended)** — in `server/.env` set `ADMIN_PASSWORD=YourNewPassword` (8+ chars), then:
   ```bash
   cd server && npm run db:reset-admin
   ```
   Remove `ADMIN_PASSWORD` from `.env` after use.

2. **Or** re-seed with update flag — set `SEED_ADMIN_PASSWORD` and run:
   ```bash
   cd server
   set SEED_UPDATE_ADMIN_PASSWORD=1
   npm run db:seed
   ```
   (PowerShell: `$env:SEED_UPDATE_ADMIN_PASSWORD=1; npm run db:seed`)

You can sign in with **either** username `admin` **or** email `admin@example.com` (same password).

### Password in the request body (HTTPS)

Login sends the password as **plain JSON** over HTTP. That is normal: **encryption in transit** is provided by **TLS (HTTPS)** in production, not by “encrypting” the password field in JavaScript. Client-side encryption of the password does **not** replace HTTPS and is easy to get wrong. **Use HTTPS** for the API and site in production; keep using bcrypt **only on the server** for storage.

---

## Useful commands (reference)

| Command | Where | Purpose |
|---------|--------|---------|
| `npm run install:all` | repo root | Install server + client deps |
| `npm run dev` | repo root | API + Vite together |
| `npm run db:migrate` | `server/` | Apply MySQL schema |
| `npm run db:seed` | `server/` | Seed data + default admin |
| `npm run db:reset-admin` | `server/` | Set admin password from `ADMIN_PASSWORD` in `.env` |
| `npm run validate-login` | `server/` | POST login to running API (default `admin@example.com` / `ChangeMe!123`) |
| `npm run db:patch:logs` | `server/` | Add `application_logs` table on existing DB (DB audit) |
| `npm start` | `server/` | Start API (no auto-reload) |
| `npm run dev` | `server/` | API with **nodemon** (reload on code / `.env` changes) |
| `npm run build` | `client/` | Production frontend build |

---

## Project layout

```
dashboard/
  README.md                 # This file
  package.json              # Root scripts (concurrently dev)
  docs/
    client/README.md        # Frontend details
    server/README.md        # API & database details
  server/                   # Express API, schema, seeds, .env
  client/                   # Vite + React SPA
```

---

## License

Private / internal — adjust as needed for your organization.
