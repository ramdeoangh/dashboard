# Client documentation

React single-page application (Vite) for the project reporting portal and admin panel.

## Stack

- **React 18** with **React Router 6**
- **Vite 6** for dev server and production builds
- **Axios** for HTTP (`/api` and `/uploads` proxied in development)
- **Context API** (`AuthContext`) for authentication and user session

## Scripts

Run from the `client/` directory (or use `npm run <script> --prefix client` from the repo root):

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (default: http://localhost:5173) |
| `npm run build` | Production build to `client/dist/` |
| `npm run preview` | Preview the production build locally |

## Development proxy

[`vite.config.js`](../../client/vite.config.js) proxies:

- `/api` → `http://localhost:4000` (Express API)
- `/uploads` → `http://localhost:4000` (uploaded images)

The API must be running on the configured port for the UI to load data. Ensure `CLIENT_ORIGIN` in `server/.env` matches this dev URL (e.g. `http://localhost:5173`).

## Folder structure (high level)

```
client/
  index.html
  vite.config.js
  src/
    api/client.js       # Axios instance, Bearer token, refresh on 401
    context/            # AuthContext
    layouts/            # PortalLayout, AdminLayout
    pages/              # Login, portal/*, admin/*
    components/         # Shared UI (Spinner, KpiStrip, PhotoPair, …)
    styles/theme.css    # Design tokens (navy / teal / gold)
    main.jsx            # Router and route tree
```

## Authentication (browser)

- **Access token** is kept in memory and sent as `Authorization: Bearer <token>`.
- **Refresh token** is an **httpOnly** cookie scoped to `/api/auth` (set by the server on login).
- On load, the app calls `POST /api/auth/refresh` with credentials to restore the session.

## Routes (summary)

- `/login` — sign in
- `/` — portal home (dashboard, KPIs)
- `/reports` — filtered project reports (state → location → table with previous/current photos)
- `/admin/*` — admin panel (visible only if the user has menu entries from the server)

## Production notes

- Serve `client/dist/` as static files, **or** run behind a reverse proxy that forwards `/api` and `/uploads` to the Node server.
- Set the API base URL if the client and API are on different origins (may require CORS and cookie `Secure` / `SameSite` adjustments).
