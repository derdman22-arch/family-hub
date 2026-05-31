# Family Hub — Project Plan

## Features

- Weekly view dashboard
- Family calendar
- Finances and budget tracker
- Future expenses planner
- Automated grocery list
- Things to do in St. Petersburg FL
- Family messaging and notes board (post, reply, assign action items)
- File uploads — upload PDFs and documents; app reads and extracts content (receipts, bank statements, bills, recipes, etc.)

---

## Build Order

Pages are built in this sequence:

1. **Finance Tracker** ← _first page to build_ (details below)
2. Dashboard
3. Calendar
4. Expenses planner
5. Grocery list
6. St. Pete activities
7. Messages board

---

## Finance Tracker — Feature Spec

The Finance Tracker is the first page built and serves as the financial command center for the family.

### Sections

#### 1. Investment Portfolio (Shared, Real-Time)
- Shared stock portfolio table — any family member can add/edit tickers and position sizes
- Columns: **Ticker**, **Shares**, **Avg Cost**, **Current Price**, **Day Change %**, **Market Value**, **Gain/Loss $/%**
- Prices fetched in real time via **Finnhub API** (free tier; WebSocket for live quotes)
- Portfolio totals row: total market value, total gain/loss
- Sheet tab: `Portfolio` — columns: `ticker, shares, avgCost, addedBy`; prices are live-fetched, not stored

#### 2. Salary & 401(k) Configuration (Per User)
- Each family member configures their own:
  - **Take-home salary** (monthly net after tax)
  - **401(k) contribution %** (pre-tax, used to show gross → take-home breakdown)
- Settings stored in `FamilyFinanceConfig` Sheet tab and in user profile
- Displayed as a card per member: take-home, 401k %, and estimated monthly 401k contribution
- Fields are editable inline — tap/click to update, saved back to Sheets

#### 3. Upcoming Expenses (Budget Planning)
- Users enter planned future expenses with: **name**, **amount**, **due date**, **category**, **notes**
- Displayed as a timeline sorted by due date
- Running total shows how upcoming expenses impact the monthly take-home budget
- Each item shows: days until due, amount, and which budget category it hits
- On save, entry also written to the `PlannedExpenses` Sheet tab (shared with the Expenses page)

### New Components (finances/)
```
finances/
├── Finances.jsx                  # Page root — tabs for Portfolio, Budget, Upcoming
├── PortfolioTable.jsx            # Real-time stock table (ticker, shares, value, P&L)
├── TickerRow.jsx                 # Single stock row with live price update
├── AddTickerForm.jsx             # Add ticker + shares + avg cost
├── PortfolioSummary.jsx          # Total value + total gain/loss card
├── SalaryConfig.jsx              # Per-user take-home + 401k % settings card
├── FamilyIncomePanel.jsx         # Side-by-side income cards for all members
├── BudgetOverview.jsx            # Total income vs. spent (existing, expanded)
├── BudgetCategory.jsx            # Per-category row with progress bar (existing)
├── TransactionList.jsx           # (existing)
├── TransactionForm.jsx           # (existing)
├── SpendingChart.jsx             # Bar/pie chart via Recharts (existing)
├── MonthSelector.jsx             # (existing)
├── UpcomingExpenseForm.jsx       # Add a planned expense (name, amount, due date, category)
├── UpcomingExpenseList.jsx       # Timeline of upcoming expenses sorted by due date
└── BudgetImpactBar.jsx           # Shows take-home minus upcoming expenses = remaining
```

### New Services / Hooks
- `portfolioService.js` — read/write `Portfolio` sheet tab; fetch live prices from Finnhub
- `usePortfolio.js` — manages tickers list, triggers real-time price polling/WebSocket
- `useFinanceConfig.js` — reads/writes per-user salary + 401k % from `FamilyFinanceConfig` tab

### Stock Data API
| | |
|---|---|
| **Provider** | Finnhub (`finnhub.io`) |
| **Free tier** | 60 API calls/min; WebSocket for real-time quotes |
| **Usage** | `GET /quote?symbol=AAPL` on page load; WebSocket subscription for open-market updates |
| **Env var** | `REACT_APP_FINNHUB_KEY` |
| **Market hours** | Outside market hours prices show last close; badge indicates "Market Closed" |

## Requirements

- Component-based React architecture
- Service layer for REST API integration
- **Phase 1 data layer: Google Sheets** — all features read/write via Google Sheets as a shared family backend; no server required to get started
- **Phase 2 data layer: MongoDB** — swap in Mongoose models when ready for a proper backend; service layer is designed so this is a connector swap, not a rewrite
- Mobile and desktop responsive
- **Available on iPhone via PWA** — installable from Safari, works offline, home screen icon
- Scalable and easy to extend
- **File upload + PDF reading** — drag-and-drop or tap-to-upload; `pdfjs-dist` extracts text; Google Drive stores the files (Phase 1); feature-aware parsing per section

---

## Folder Structure

```
family-hub/
├── public/
│   └── index.html
│
├── src/
│   ├── index.js
│   ├── App.jsx
│   ├── routes.jsx                       # Centralized React Router config
│   │
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   │
│   ├── components/
│   │   │
│   │   ├── common/                      # Shared UI primitives
│   │   │   ├── Layout/
│   │   │   │   ├── Layout.jsx           # App shell (sidebar + main)
│   │   │   │   ├── Sidebar.jsx          # Nav links, family member switcher
│   │   │   │   ├── Navbar.jsx           # Top bar (mobile)
│   │   │   │   └── Footer.jsx
│   │   │   ├── Button/Button.jsx
│   │   │   ├── Card/Card.jsx
│   │   │   ├── Modal/Modal.jsx
│   │   │   ├── Form/
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Select.jsx
│   │   │   │   └── DatePicker.jsx
│   │   │   ├── LoadingSpinner/LoadingSpinner.jsx
│   │   │   ├── ErrorBoundary/ErrorBoundary.jsx
│   │   │   └── FileUpload/
│   │   │       ├── FileUpload.jsx           # Drag-and-drop + tap-to-upload zone
│   │   │       ├── FilePreview.jsx          # PDF viewer (react-pdf) + image preview
│   │   │       └── ParsedDataReview.jsx     # Show extracted fields before saving
│   │   │
│   │   ├── dashboard/                   # Weekly view dashboard
│   │   │   ├── Dashboard.jsx            # Page root, composes widgets
│   │   │   ├── WeeklyOverview.jsx       # 7-column week strip
│   │   │   ├── DayColumn.jsx            # Single day with events
│   │   │   ├── EventCard.jsx            # Compact event pill
│   │   │   ├── QuickStats.jsx           # Budget snapshot, task count, etc.
│   │   │   └── UpcomingEvents.jsx       # Next 5 events list
│   │   │
│   │   ├── calendar/                    # Family calendar
│   │   │   ├── Calendar.jsx             # View switcher (month/week/day)
│   │   │   ├── MonthView.jsx
│   │   │   ├── WeekView.jsx
│   │   │   ├── DayView.jsx
│   │   │   ├── EventForm.jsx            # Create / edit event modal
│   │   │   ├── EventDetail.jsx          # Read-only event popover
│   │   │   └── FamilyMemberFilter.jsx   # Color-coded member toggles
│   │   │
│   │   ├── finances/                    # Finance tracker (built first)
│   │   │   ├── Finances.jsx             # Page root — tabbed: Portfolio / Budget / Upcoming
│   │   │   ├── PortfolioTable.jsx       # Real-time shared stock portfolio
│   │   │   ├── TickerRow.jsx            # Single stock row with live price
│   │   │   ├── AddTickerForm.jsx        # Add ticker + shares + avg cost
│   │   │   ├── PortfolioSummary.jsx     # Total market value + gain/loss
│   │   │   ├── SalaryConfig.jsx         # Per-user take-home + 401k % card
│   │   │   ├── FamilyIncomePanel.jsx    # Side-by-side income cards per member
│   │   │   ├── BudgetOverview.jsx       # Total income vs. spent
│   │   │   ├── BudgetCategory.jsx       # Per-category row with progress bar
│   │   │   ├── TransactionList.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── SpendingChart.jsx        # Bar/pie chart (recharts)
│   │   │   ├── MonthSelector.jsx
│   │   │   ├── UpcomingExpenseForm.jsx  # Add upcoming expense (name, amount, due date)
│   │   │   ├── UpcomingExpenseList.jsx  # Timeline of upcoming expenses by due date
│   │   │   └── BudgetImpactBar.jsx      # Take-home minus upcoming = remaining
│   │   │
│   │   ├── expenses/                    # Future expenses planner
│   │   │   ├── Expenses.jsx
│   │   │   ├── ExpenseTimeline.jsx      # Chronological upcoming expenses
│   │   │   ├── ExpenseCard.jsx
│   │   │   ├── ExpenseForm.jsx
│   │   │   └── SavingsGoal.jsx          # Goal + progress toward a target
│   │   │
│   │   ├── grocery/                     # Automated grocery list
│   │   │   ├── Grocery.jsx
│   │   │   ├── GroceryList.jsx          # Full list with check-off
│   │   │   ├── GroceryItem.jsx          # Single row (check, name, qty, aisle)
│   │   │   ├── AddItemForm.jsx
│   │   │   ├── CategoryGroup.jsx        # Grouped by aisle/category
│   │   │   ├── MealPlanner.jsx          # Recipes → auto-add ingredients
│   │   │   └── StoreSelector.jsx        # Switch between store layouts
│   │   │
│   │   ├── stpete/                      # Things to do in St. Pete FL
│   │   │   ├── StPete.jsx
│   │   │   ├── ActivityFeed.jsx         # Card grid of activities
│   │   │   ├── ActivityCard.jsx         # Image, title, category, link
│   │   │   ├── ActivityFilter.jsx       # Filter by category/season/cost
│   │   │   ├── ActivityForm.jsx         # Add custom family activity
│   │   │   ├── FavoritesList.jsx        # Family's saved favorites
│   │   │   └── CategoryTabs.jsx         # Outdoors, food, arts, events, etc.
│   │   │
│   │   └── messages/                    # Family board + action items
│   │       ├── Messages.jsx
│   │       ├── MessageBoard.jsx         # Scrollable board of posts
│   │       ├── MessageCard.jsx          # Post with reactions + action status
│   │       ├── MessageForm.jsx          # Compose new post / note
│   │       ├── ActionItem.jsx           # Checkbox + assignee + due date
│   │       ├── ActionItemList.jsx       # All open action items
│   │       ├── NoteThread.jsx           # Threaded replies on a post
│   │       └── MemberAvatar.jsx         # Avatar + name chip (reused broadly)
│   │
│   ├── pages/                           # Route-level thin wrappers
│   │   ├── DashboardPage.jsx
│   │   ├── CalendarPage.jsx
│   │   ├── FinancesPage.jsx
│   │   ├── ExpensesPage.jsx
│   │   ├── GroceryPage.jsx
│   │   ├── StPetePage.jsx
│   │   ├── MessagesPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── services/                        # Data layer (swappable connector pattern)
│   │   ├── api.js                       # Axios instance, base URL, interceptors (Phase 2)
│   │   ├── sheetsClient.js              # Google Sheets API client + auth (Phase 1)
│   │   ├── calendarService.js           # CRUD for events
│   │   ├── financeService.js            # Budgets + transactions
│   │   ├── portfolioService.js          # Read/write Portfolio sheet; fetch live prices from Finnhub
│   │   ├── financeConfigService.js      # Read/write FamilyFinanceConfig (salary + 401k per member)
│   │   ├── expenseService.js            # Planned future expenses
│   │   ├── groceryService.js            # List + meal plan → ingredient gen
│   │   ├── stPeteService.js             # Activities (custom + seeded data)
│   │   ├── messageService.js            # Posts, replies, action items
│   │   ├── familyService.js             # Members, profiles, auth
│   │   └── fileService.js               # Upload to Google Drive, extract text via pdfjs-dist
│   │
│   ├── hooks/                           # Custom React hooks (data + UI)
│   │   ├── useCalendar.js
│   │   ├── useFinances.js
│   │   ├── usePortfolio.js              # Tickers list + real-time price polling/WebSocket
│   │   ├── useFinanceConfig.js          # Per-user salary + 401k % read/write
│   │   ├── useExpenses.js
│   │   ├── useGrocery.js
│   │   ├── useStPete.js
│   │   ├── useMessages.js
│   │   ├── useFamily.js
│   │   └── useLocalStorage.js           # Offline-first persistence fallback
│   │
│   ├── context/                         # Global state via React Context
│   │   ├── AppContext.jsx               # Theme, loading state, error state
│   │   ├── FamilyContext.jsx            # Active family, current member
│   │   ├── CalendarContext.jsx
│   │   ├── FinanceContext.jsx
│   │   └── MessageContext.jsx
│   │
│   ├── utils/
│   │   ├── dateUtils.js                 # Week/month math, formatting
│   │   ├── currencyUtils.js             # Format, parse, calculate
│   │   ├── formatters.js                # Generic display helpers
│   │   └── validators.js               # Form validation rules
│   │
│   ├── constants/
│   │   ├── routes.js                    # Route path strings
│   │   ├── categories.js                # Budget categories, activity tags
│   │   └── config.js                   # Feature flags, API base URL
│   │
│   └── styles/
│       ├── globals.css
│       └── variables.css               # CSS custom properties (spacing, colors)
│
├── server/                              # Express + MongoDB backend
│   ├── index.js                         # Entry point, app + server setup
│   ├── config/
│   │   ├── db.js                        # Mongoose connection
│   │   └── env.js                       # Env var validation
│   │
│   ├── models/                          # Mongoose schemas
│   │   ├── FamilyMember.js
│   │   ├── Event.js
│   │   ├── Transaction.js
│   │   ├── Budget.js
│   │   ├── Expense.js
│   │   ├── GroceryItem.js
│   │   ├── MealPlan.js
│   │   ├── Activity.js
│   │   └── Message.js
│   │
│   ├── routes/                          # Express route registrations
│   │   ├── family.js
│   │   ├── calendar.js
│   │   ├── finances.js
│   │   ├── expenses.js
│   │   ├── grocery.js
│   │   ├── stpete.js
│   │   └── messages.js
│   │
│   ├── controllers/                     # Route handler logic
│   │   ├── familyController.js
│   │   ├── calendarController.js
│   │   ├── financeController.js
│   │   ├── expenseController.js
│   │   ├── groceryController.js
│   │   ├── stPeteController.js
│   │   └── messageController.js
│   │
│   └── middleware/
│       ├── auth.js                      # JWT / session guard
│       ├── errorHandler.js             # Centralized error responses
│       └── validation.js               # Request body validation (Joi/Zod)
│
├── public/
│   ├── manifest.json                    # PWA manifest (name, icons, theme color)
│   └── service-worker.js               # Offline cache + install prompt
├── .env.example
├── .gitignore
├── PLAN.md
└── package.json
```

---

## File Upload & PDF Reading

### Libraries

| Library | Purpose |
|---|---|
| `pdfjs-dist` | Extract raw text from uploaded PDFs (runs in-browser, no server needed) |
| `react-pdf` | Render PDF pages visually inside the app |
| Google Drive API | Store uploaded files (Phase 1 — OAuth already in use) |

### How It Works

1. User taps/drops a file onto a `FileUpload` zone
2. `fileService.js` uploads the binary to Google Drive and returns a file ID + URL
3. `pdfjs-dist` reads the file in-browser and extracts text
4. `ParsedDataReview` shows the extracted fields for the user to confirm before saving to the relevant sheet

### Where Uploads Are Used Per Feature

| Feature | Upload Use Case | What Gets Extracted |
|---|---|---|
| **Finances** | Bank statement PDF, receipt photo | Transactions (date, amount, merchant) auto-populated |
| **Future Expenses** | Bill or invoice PDF | Due date, amount, payee |
| **Grocery** | Recipe PDF | Ingredients auto-added to grocery list |
| **Messages / Notes** | Any document | Attached to a message thread; text searchable |
| **General** | Any PDF | Raw text shown in `FilePreview` viewer |

### Notes

- PDF text extraction runs entirely in the browser via `pdfjs-dist` — no file is sent to a third-party server
- Google Drive provides the persistent file store; the Drive file ID is saved alongside the relevant Sheets row
- On iPhone, users tap the upload zone → iOS Files / Photos picker appears (standard browser file input behavior)

---

## Tech Stack Decisions

| Concern | Choice | Notes |
|---|---|---|
| Styling | Tailwind CSS | Utility-first, excellent responsive support |
| Charts | Recharts | Lightweight, React-native charting |
| State | React Context + custom hooks | Zustand can replace if needs grow |
| Routing | React Router v6 | Nested routes for section layouts |
| HTTP client | Axios | Centralized in `services/api.js` |
| **Phase 1 data** | **Google Sheets API v4** | One shared spreadsheet per feature area; family edits sheets directly too |
| **Phase 2 data** | **MongoDB + Mongoose** | Drop-in swap via service layer; schemas already defined |
| Backend | Express.js | Thin REST API layer (Phase 2) |
| Auth | Google OAuth 2.0 | Sign in with Google; gates Sheets access naturally |
| **Mobile (iPhone)** | **PWA** | `manifest.json` + service worker; "Add to Home Screen" in Safari |

### Google Sheets Layout (Phase 1)

Each tab in a single shared Google Sheet maps to a feature:

| Sheet Tab | Feature | Key Columns |
|---|---|---|
| `Events` | Calendar | date, title, member, color, allDay |
| `Transactions` | Finances | date, amount, category, description, member |
| `Budget` | Finances | category, limit, month |
| `Portfolio` | Finances — stocks | ticker, shares, avgCost, addedBy _(live prices fetched from Finnhub, not stored)_ |
| `FamilyFinanceConfig` | Finances — salary/401k | member, takeHomeSalary, contribution401kPct |
| `PlannedExpenses` | Finances upcoming / Expenses page | name, amount, dueDate, category, notes, member |
| `Grocery` | Grocery list | item, qty, category, checked, addedBy |
| `Meals` | Meal planner | meal, day, ingredients |
| `Activities` | St. Pete | name, category, cost, season, url, favorited |
| `Messages` | Message board | id, author, body, timestamp, actionAssignee, actionDue, resolved |
| `Family` | Members | name, email, color, avatar |

### PWA / iPhone Setup

- `public/manifest.json` — app name, icons (192px + 512px), `display: standalone`, theme color
- `public/service-worker.js` — caches shell + assets for offline use
- iOS install: open app URL in Safari → Share → Add to Home Screen
- Push notifications not supported on iOS PWA (limitation of the platform); in-app notification badge used instead

---

## API Route Map

| Feature | Base Route |
|---|---|
| Family members | `GET/POST /api/family` |
| Calendar events | `GET/POST/PUT/DELETE /api/calendar/events` |
| Budget + transactions | `GET/POST/PUT/DELETE /api/finances` |
| Future expenses | `GET/POST/PUT/DELETE /api/expenses` |
| Grocery list | `GET/POST/PUT/DELETE /api/grocery` |
| St. Pete activities | `GET/POST/PUT/DELETE /api/stpete` |
| Messages + action items | `GET/POST/PUT/DELETE /api/messages` |

---

## Status

**Phase 1 — Google Sheets + PWA**
- [ ] Plan approved
- [ ] Project scaffolded (files + folders created)
- [ ] package.json configured and dependencies installed
- [ ] PWA manifest + service worker configured
- [ ] Google OAuth 2.0 login wired
- [ ] `sheetsClient.js` connector built (read/write/append)
- [ ] App shell (Layout, Sidebar, Router) built

**Finance Tracker page (first)**
- [ ] `Portfolio` + `FamilyFinanceConfig` + `PlannedExpenses` Sheet tabs created
- [ ] `portfolioService.js` — read/write Portfolio sheet, fetch quotes from Finnhub
- [ ] `financeConfigService.js` — read/write salary + 401k % per member
- [ ] `usePortfolio.js` hook — tickers list + live price refresh
- [ ] `useFinanceConfig.js` hook — per-user salary + 401k config
- [ ] `PortfolioTable` + `TickerRow` + `AddTickerForm` + `PortfolioSummary` components
- [ ] `SalaryConfig` + `FamilyIncomePanel` components (configurable take-home + 401k %)
- [ ] `UpcomingExpenseForm` + `UpcomingExpenseList` + `BudgetImpactBar` components
- [ ] `Finances.jsx` page wired with tabs: Portfolio / Budget / Upcoming
- [ ] Finnhub API key added to `.env` as `REACT_APP_FINNHUB_KEY`
- [ ] Market hours badge (live vs. last-close indicator)
- [ ] `FinancesPage.jsx` route registered

**Remaining pages**
- [ ] Dashboard page
- [ ] Calendar page
- [ ] Expenses page
- [ ] Grocery page
- [ ] St. Pete page
- [ ] Messages page
- [ ] iPhone install tested (Safari → Add to Home Screen)
- [ ] File upload component (FileUpload, FilePreview, ParsedDataReview)
- [ ] `fileService.js` — Google Drive upload + pdfjs-dist text extraction
- [ ] PDF parsing wired into Finances (receipts/statements), Expenses (bills), Grocery (recipes), Messages (attachments)

**Phase 2 — MongoDB backend**
- [ ] Express server scaffolded
- [ ] MongoDB models + routes wired
- [ ] Service layer connectors swapped from Sheets → Mongo
- [ ] Auth layer (JWT)
