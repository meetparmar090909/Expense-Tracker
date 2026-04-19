# Expense Tracker Working Guide

## What This Project Does

This project is a full-stack expense tracker with:

- personal expense tracking
- budget management
- Google or email/password login
- PDF export for expense history
- trip/group expense management

The app lets one signed-in user manage personal expenses and also create trip workspaces where multiple people contribute money, trip expenses are recorded, and the app calculates who owes money or should get money back.

## Project Structure

### Root

- `package.json`
  Runs both frontend and backend together in development.
- `README.md`
  Basic setup notes.
- `WORKING.md`
  This file.

### Frontend

Frontend lives in `client/`.

Important files:

- `client/src/App.tsx`
  Main application UI and frontend logic.
- `client/src/index.css`
  Global styling.
- `client/.env`
  Frontend environment variables like:
  - `VITE_API_URL`
  - `VITE_GOOGLE_CLIENT_ID`

### Backend

Backend lives in `server/`.

Important files:

- `server/src/index.ts`
  Express app setup and route registration.
- `server/src/controllers/authController.ts`
  Login, register, Google auth, and budget update.
- `server/src/controllers/expenseController.ts`
  Personal expense APIs and stats.
- `server/src/controllers/tripController.ts`
  Trip/group expense APIs and settlement logic.
- `server/src/models/User.ts`
  User schema.
- `server/src/models/Expense.ts`
  Personal expense schema.
- `server/src/models/Trip.ts`
  Trip schema with participants and trip expenses.
- `server/src/routes/auth.ts`
  Auth routes.
- `server/src/routes/expenses.ts`
  Expense routes.
- `server/src/routes/trips.ts`
  Trip routes.
- `server/.env`
  Backend environment variables.

## How The App Works

## 1. Authentication Flow

There are two login methods:

- local email/password
- Google sign-in

Frontend sends login/register requests to:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

Backend returns:

- a JWT token
- user profile data

Frontend stores these in `localStorage`:

- `token`
- `user`

After that, the app loads protected data using the token in the `Authorization` header.

## 2. Personal Expense Flow

The user can create normal expenses with:

- title
- amount
- category
- date
- note

Frontend submits to:

- `POST /api/expenses`

Backend stores the expense in MongoDB with the current authenticated `userId`.

Other expense routes:

- `GET /api/expenses`
- `GET /api/expenses/stats`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

Stats are calculated monthly and include:

- category totals
- daily totals
- total spent

## 3. Budget Flow

Every user has:

- `monthlyBudget`
- `currency`

Budget is set:

- during registration
- during first Google sign-in
- later from the Settings screen

Frontend updates budget using:

- `PUT /api/auth/update-budget`

## 4. Trip / Group Expense Flow

This is the new shared-expense feature.

Each trip contains:

- trip title
- destination
- currency
- start date
- end date
- note
- participants
- trip expenses

### Participants

Each participant has:

- `name`
- `contributedAmount`

This represents how much money that person gave to the trip admin or shared pool.

### Trip Expenses

Each trip expense has:

- `title`
- `amount`
- `paidBy`
- `date`
- `note`

This represents actual spending during the trip.

### Trip Summary Logic

Backend calculates:

- `totalContributed`
- `totalSpent`
- `remainingBalance`
- `sharePerPerson`
- `settlements`

Settlement logic:

1. Add all participant contributions
2. Add all trip expenses
3. Divide total spent by number of participants
4. Compare each person’s contribution to their share
5. Decide whether that person:
   - owes money
   - gets money back
   - is settled

Trip routes:

- `GET /api/trips`
- `POST /api/trips`
- `PUT /api/trips/:id`
- `DELETE /api/trips/:id`

## Frontend UI Model

Main frontend file:

- `client/src/App.tsx`

This file currently contains:

- login page
- dashboard view
- add expense view
- trips view
- settings view
- top-level app state

### Main State Managed In Frontend

Important state variables:

- `user`
- `expenses`
- `stats`
- `trips`
- `expenseForm`
- `tripForm`
- `searchTerm`
- loading and saving states

### View Routing

The app uses simple internal view switching instead of React Router.

Possible views:

- `dashboard`
- `expenses`
- `add`
- `trips`
- `settings`

When sidebar navigation changes `view`, the main panel renders the matching section.

## Backend Data Model

## User Model

File:

- `server/src/models/User.ts`

Fields:

- `name`
- `email`
- `password`
- `googleId`
- `authProvider`
- `monthlyBudget`
- `currency`

## Expense Model

File:

- `server/src/models/Expense.ts`

Fields:

- `userId`
- `title`
- `amount`
- `category`
- `date`
- `note`

This model is for personal expenses only.

## Trip Model

File:

- `server/src/models/Trip.ts`

Top-level fields:

- `userId`
- `title`
- `destination`
- `currency`
- `startDate`
- `endDate`
- `note`
- `participants`
- `expenses`

Nested participant fields:

- `name`
- `contributedAmount`

Nested expense fields:

- `title`
- `amount`
- `paidBy`
- `date`
- `note`

## API Summary

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `PUT /api/auth/update-budget`

## Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/expenses/stats`

## Trips

- `GET /api/trips`
- `POST /api/trips`
- `PUT /api/trips/:id`
- `DELETE /api/trips/:id`

## Environment Variables

## Frontend `client/.env`

- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`

## Backend `server/.env`

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `NODE_ENV`
- `CLIENT_URL`
- `GOOGLE_CLIENT_ID`

## Current Working Model

The current app architecture is:

1. React frontend renders all pages from `App.tsx`
2. Axios sends requests to Express backend
3. Express validates auth using JWT middleware
4. MongoDB stores users, expenses, and trips
5. Backend calculates personal stats and trip settlements
6. Frontend displays dashboard cards, lists, charts, and trip summaries

## Limitations Right Now

Current code works, but these are the main technical limits:

- `App.tsx` is too large and should be split into components
- trip editing is not fully exposed in the UI yet
- expense editing is not exposed in the UI yet
- bundle size is still large
- there is no pagination UI for big trip or expense lists

## Recommended Next Improvements

Strong next steps:

1. Split `App.tsx` into components like:
   - `LoginPage`
   - `DashboardView`
   - `ExpensesView`
   - `TripsView`
   - `SettingsView`
2. Add edit functionality for trips and expenses
3. Add filters for trip history
4. Add per-person settlement export
5. Add mobile-specific navigation instead of the current responsive sidebar conversion
6. Reduce bundle size with code splitting

## Run The Project

From root:

```bash
npm run dev
```

This starts:

- frontend Vite app
- backend Express server

## Build The Project

Frontend:

```bash
cd client
npm run build
```

Backend:

```bash
cd server
npm run build
```

## Final Note

If you want, the next useful file I can create is a second document with:

- database schema diagrams
- API request/response examples
- frontend component breakdown
- future roadmap

