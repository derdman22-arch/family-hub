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

Known issue: `src/App.test.js` is the CRA boilerplate test and fails (Jest can't resolve `react-router-dom` v7).

## What it is

A home-screen web app (PWA) for two family members on iPhones: the shared Google family calendar, a to-do list per person, and a shared grocery list. Adding or completing a to-do sends a push notification to the other person.

## Environment Variables

Copy `.env.example` → `.env.local` (frontend) and `server/.env.example` → `server/.env` (API) before running locally. Both are gitignored. `server/.env.example` documents every server variable.

**Frontend** — only `REACT_APP_GOOGLE_CLIENT_ID` (ships in the public bundle; never put secrets in `REACT_APP_*`).

**Server** (`server/.env`, Render dashboard in production): `MONGODB_URI` (Atlas `prod` database, direct non-SRV format), `JWT_SECRET`, `GOOGLE_CLIENT_ID` (must equal the frontend's), `GOOGLE_CLIENT_SECRET`, `TOKEN_ENCRYPTION_KEY` (32 bytes base64; encrypts stored refresh tokens), `GOOGLE_CALENDAR_ID`, `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (web push; optional — push is disabled without them), `CLIENT_ORIGIN` (comma-separated allowed origins), `PORT`. The server refuses to start without the first five.

## Architecture

**Auth flow** — Google authorization-code flow with a full-page redirect (popups are unreliable in iOS home-screen apps). `authService.startGoogleSignIn` sends the browser to Google with a random `state` in `localStorage`; Google redirects to `/auth/callback`, which `App.js` handles before the router: it checks `state` and POSTs `{ code, redirect_uri }` to `/api/auth/google`. The server (`server/routes/auth.js`) only accepts redirect URIs of `CLIENT_ORIGIN` + `/auth/callback`, exchanges the code with the client secret, and looks the email up in the MongoDB `users` collection. There is no auto-create: **only emails already in that collection can sign in**. Google only returns a refresh token on the consent screen, so if the user has none stored the server replies `{ needsConsent: true }` and the frontend restarts with `prompt=consent`. The refresh token is stored AES-GCM-encrypted on the user (`googleRefreshToken`, `select: false`). The server returns a 60-day JWT; the frontend keeps `{ token, user }` in `localStorage` under `fh_session`. `requireAuth` verifies the JWT *and* re-checks the user still exists. Any 401 from the API (including `GOOGLE_REAUTH` when Google rejects the refresh token) clears the session and shows the sign-in screen with the reason. To add a family member, insert a `users` document with their lowercase Google email.

**Backend** (`server/`) — Express + Mongoose. Routes, all behind `requireAuth` except auth and health:
- `/api/auth` (rate-limited, keyed on the client IP Vercel forwards)
- `/api/calendar/events` — proxies Google Calendar (list/create/patch/delete) as the requesting user via `lib/google.js`, which refreshes and caches access tokens in memory
- `/api/notes` — to-dos (model `Note`, collection `notes`). `assignedTo` is whose list it's on; older notes without it belong to their creator (`Note.openFor`). Completed to-dos older than 30 days aren't returned. Creating or completing one calls `lib/push.notifyOthers`, which pushes to every other user's devices with their open-to-do count as the badge
- `/api/grocery` — one shared list (`GroceryItem`)
- `/api/push` — VAPID public key, subscribe/unsubscribe (`PushSubscription`, one per device)
- `/api/users` — family members, for the per-person to-do tabs
- `/api/health`

**Frontend data layer** — `services/` are thin async functions over `services/api.js` (adds the JWT, handles 401s); `hooks/` wrap them in React state. `useLiveRefresh` reloads data when the app returns to the foreground or the service worker relays a push (`{ type: 'refresh' }`). To-do and grocery changes are applied optimistically and reloaded on failure.

**PWA / push** — `public/sw.js` is a plain service worker (no offline caching): shows notifications, sets the app badge from the push payload, and focuses the app on tap. `services/pushService.js` registers it, subscribes (permission must be requested directly from a tap on iOS), re-syncs the subscription on launch, and unsubscribes on sign-out. iOS only supports push for apps added to the Home Screen (16.4+); `NotificationsBanner` explains that in Safari.

**Routing** — `AppShell` in `App.js`: `/` To-dos, `/calendar`, `/grocery`. Unknown paths redirect to `/`.

**Styling** — Tailwind CSS v3, dark theme (`bg-gray-950` base). No CSS modules; all styles are utility classes inline. `src/index.css` holds the Tailwind directives plus a few global rules.

**Mobile** — The `md` breakpoint (768px) is the phone/desktop switch. Below it, `NavBar` shows a fixed bottom tab bar and the Calendar week renders as a per-day agenda list (the week summary is desktop-only). `AppShell` pads the bottom of the page to clear the tab bar, and fixed-position elements use `env(safe-area-inset-bottom)` for the iPhone home bar. Inputs are forced to 16px on small screens to stop iOS Safari zooming on focus.

## Deployment

Frontend on Vercel, API on Render (Starter instance — it must not sleep), database on MongoDB Atlas. `vercel.json` rewrites `/api/*` to the Render service (the frontend calls relative `/api/...` URLs; the CRA `"proxy"` setting only exists in dev) and sets security headers. The Google OAuth client needs `<origin>/auth/callback` as an authorized redirect URI for each origin. See `DEPLOY.md` for the full guide.
