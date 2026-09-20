# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # frontend (http://localhost:3000) + API (http://localhost:5000) together
npm start          # frontend only — sign-in will fail without the API running
npm run server     # API only (node server/index.js)
npm run build      # production build
npm test -- --watchAll=false  # run tests once (CI mode)
```

Known issue: `src/App.test.js` fails because Jest can't resolve `react-router-dom` v7 (predates the current work).

## Environment Variables

Copy `.env.example` → `.env.local` (frontend) and `server/.env.example` → `server/.env` (API) before running locally. Both `.env` files are gitignored.

**Frontend** (`REACT_APP_*` values ship in the public JS bundle — never put secrets here):

| Variable | Purpose |
|---|---|
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (Web application type) |
| `REACT_APP_GOOGLE_CALENDAR_ID` | Calendar to display (defaults to `primary`) |
| `REACT_APP_GOOGLE_PLACES_KEY` | Google Places API (New) key — restrict by HTTP referrer + Places API in Cloud Console |

**Server** (`server/.env`, set in the Render dashboard in production):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string (`prod` database, direct non-SRV format) |
| `JWT_SECRET` | JWT signing secret — server refuses to start without it |
| `GOOGLE_CLIENT_ID` | Must equal `REACT_APP_GOOGLE_CLIENT_ID`; server refuses to start without it |
| `CLIENT_ORIGIN` | Allowed CORS origin (defaults to `http://localhost:3000`) |
| `PORT` | Optional, defaults to 5000 |

## Architecture

**Auth flow** — `App.js` wraps the app in `GoogleOAuthProvider`. On Google sign-in, `AuthenticatedApp` POSTs the access token to `/api/auth/google`. The server (`server/routes/auth.js`) checks with Google that the token was issued to *this* client ID and that the email is verified, then looks the email up in the MongoDB `users` collection. There is no auto-create: **only emails already in that collection can sign in**. On success it returns a 7-day JWT. The frontend stores `{ access_token, name, picture, email, jwt_token }` in `sessionStorage` under `fh_user`. Sign-in **fails closed** — if the API is unreachable or returns anything but a token, the user stays signed out, and a stored session without a `jwt_token` is discarded on load. `server/middleware/auth.js` (`requireAuth`) verifies the JWT *and* re-checks the user still exists, so removing someone from the collection cuts them off immediately. To add a family member, insert a `users` document with their (lowercase) Google email.

**Backend** (`server/`) — Express + Mongoose. Routes: `/api/auth` (rate-limited, keyed on the client IP Vercel forwards), `/api/notes` (behind `requireAuth`), `/api/health`. Notes are shared by all family members by design.

**Data layer** — A thin `services/` layer (pure async functions calling external APIs or the backend) consumed by `hooks/` (React state wrappers):
- `calendarService` / `useCalendar` — Google Calendar API, using the user's Google `access_token` directly (read + create events).
- `todosService` / `useTodos` (exports `useNotes`) — the backend `/api/notes` endpoint, using the `jwt_token`. Despite the file name this is the notes API; it powers the Messages page.
- `weatherService` / `useWeather` — Open-Meteo, no auth.
- `placesService` / `useActivities` — Google Places API (New). Both St. Pete hooks are fire-and-forget on mount with no caching.

**Routing** — All routes are declared in `AppShell` inside `App.js`: `/` Home, `/calendar`, `/messages` (shared to-do list), `/st-pete`. `/dashboard`, `/expenses` and `/grocery` render a `<ComingSoon>` placeholder. Unknown paths redirect to `/`.

**Styling** — Tailwind CSS v3, dark theme (`bg-gray-950` base). No CSS modules; all styles are utility classes inline. `src/index.css` holds the Tailwind directives plus a few global rules.

**Mobile** — The `md` breakpoint (768px) is the phone/desktop switch. Below it, `NavBar` shows a fixed bottom tab bar (the top bar keeps only the logo and account controls) and the Calendar week renders as a per-day agenda list instead of a 7-column grid. `AppShell` pads the bottom of the page to clear the tab bar, and fixed-position elements use `env(safe-area-inset-bottom)` for the iPhone home bar. Inputs are forced to 16px on small screens to stop iOS Safari zooming on focus. New pages should not assume a fixed bottom offset.

## Deployment

Frontend on Vercel, API on Render, database on MongoDB Atlas. `vercel.json` rewrites `/api/*` to the Render service (the frontend calls relative `/api/...` URLs; the CRA `"proxy"` setting only exists in dev) and sets security headers. See `DEPLOY.md` for the full guide.

## Planned but not yet built

Dashboard, Expenses and Grocery (currently `<ComingSoon>`). The St. Pete page also has placeholder widgets for Restaurants and Events (defined in the `WIDGETS` array in `StPetePage.js`).
