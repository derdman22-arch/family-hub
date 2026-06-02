# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server on http://localhost:3000
npm run build      # production build
npm test           # run tests (watch mode)
npm test -- --watchAll=false  # run tests once (CI mode)
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values before running locally:

| Variable | Purpose |
|---|---|
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (Web application type) |
| `REACT_APP_SPREADSHEET_ID` | Google Sheets spreadsheet ID |
| `REACT_APP_FINNHUB_API_KEY` | Finnhub stock price API key (free tier) |
| `REACT_APP_GOOGLE_PLACES_KEY` | Google Places API (New) key |

## Architecture

**Auth flow** — `App.js` wraps the app in `GoogleOAuthProvider`. On sign-in, `AuthenticatedApp` fetches the user profile from the Google userinfo endpoint and stores `{ access_token, name, picture, email }` in `sessionStorage` under `fh_user`. The access token is threaded through to any component that calls the Sheets API.

**Data layer** — Two-tier: a thin `services/` layer (pure async functions that call external APIs) consumed by `hooks/` (React state wrappers). This means service functions can be called directly in tests or from multiple components without re-fetching.

**Finance page data flow:**
1. `usePortfolio(accessToken)` calls `portfolioService.getPortfolio()`
2. `getPortfolio` reads positions from Google Sheets tab `Portfolio!A2:C` (cols: ticker, shares, avgCost) via `sheetsClient.readRange()`
3. Live prices are fetched from Finnhub and cached in `localStorage` under `fh_portfolio_price_cache` with a 24-hour TTL
4. `clearPriceCache()` + re-fetch is exposed as `refresh()` for the manual refresh button

**St. Pete page** — Uses `useWeather()` → `weatherService.fetchWeather()` (Open-Meteo, no auth needed) and `useActivities()` → `placesService.fetchActivities()` (Google Places API New, `REACT_APP_GOOGLE_PLACES_KEY`). Both hooks are fire-and-forget on mount with no caching.

**Routing** — All routes are declared in `AppShell` inside `App.js`. Routes without a page component render a `<ComingSoon>` placeholder. Default redirect is `/` → `/finance`.

**Styling** — Tailwind CSS v3, dark theme (`bg-gray-950` base). No CSS modules; all styles are utility classes inline. `src/index.css` contains the Tailwind directives.

## Google Sheets Schema

The Finance page expects a Google Sheet shared with the authenticated user. The `Portfolio` tab must have:
- Row 1: header (skipped)
- Column A: ticker symbol
- Column B: share count
- Column C: average cost basis per share

## Planned but not yet built

Routes that currently show `<ComingSoon>`: Dashboard, Calendar, Expenses, Grocery, Messages. The St. Pete page also has placeholder widgets for Restaurants and Events (defined in `WIDGETS` array in `StPetePage.js`).
