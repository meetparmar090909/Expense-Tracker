# API Examples

## Base URLs

Local frontend usually runs on:

- `http://localhost:5173`

Local backend usually runs on:

- `http://localhost:5001/api`

## Auth

### Register

`POST /api/auth/register`

```json
{
  "name": "Meet Parmar",
  "email": "meet@example.com",
  "password": "secret123",
  "monthlyBudget": 12000,
  "currency": "INR",
  "themePreference": "monochrome"
}
```

Response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "user_id",
    "name": "Meet Parmar",
    "email": "meet@example.com",
    "monthlyBudget": 12000,
    "currency": "INR",
    "themePreference": "monochrome"
  }
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "meet@example.com",
  "password": "secret123"
}
```

### Google Login

`POST /api/auth/google`

```json
{
  "credential": "google-id-token",
  "monthlyBudget": 12000,
  "currency": "INR",
  "themePreference": "forest"
}
```

### Update Settings

`PUT /api/auth/update-budget`

Headers:

```http
Authorization: Bearer <token>
```

Body:

```json
{
  "monthlyBudget": 15000,
  "currency": "USD",
  "themePreference": "ivory"
}
```

## Expenses

### Create Expense

`POST /api/expenses`

```json
{
  "title": "Dinner",
  "amount": 850,
  "category": "Food",
  "date": "2026-04-20",
  "note": "Team dinner"
}
```

### List Expenses

`GET /api/expenses`

Optional query params:

- `category`
- `month`
- `year`
- `page`
- `limit`

Example:

`GET /api/expenses?month=4&year=2026&page=1&limit=20`

### Expense Stats

`GET /api/expenses/stats`

Example response:

```json
{
  "success": true,
  "stats": {
    "categoryBreakdown": [
      { "_id": "Food", "total": 2400, "count": 6 }
    ],
    "dailySpending": [
      { "_id": 2, "total": 500 },
      { "_id": 3, "total": 1200 }
    ],
    "totalSpent": 3700,
    "month": 4,
    "year": 2026
  }
}
```

## Trips

### Create Trip

`POST /api/trips`

```json
{
  "title": "Goa Trip",
  "destination": "Goa",
  "currency": "INR",
  "startDate": "2026-05-10",
  "endDate": "2026-05-14",
  "note": "Friends trip",
  "participants": [
    { "name": "Meet", "contributedAmount": 5000 },
    { "name": "Amit", "contributedAmount": 4500 },
    { "name": "Riya", "contributedAmount": 4000 }
  ],
  "expenses": [
    {
      "title": "Hotel",
      "amount": 7000,
      "paidBy": "Meet",
      "date": "2026-05-10",
      "note": "2 nights"
    },
    {
      "title": "Cab",
      "amount": 1500,
      "paidBy": "Meet",
      "date": "2026-05-10",
      "note": "Airport to hotel"
    }
  ]
}
```

### List Trips

`GET /api/trips`

Example response:

```json
{
  "success": true,
  "trips": [
    {
      "_id": "trip_id",
      "title": "Goa Trip",
      "destination": "Goa",
      "currency": "INR",
      "participants": [
        { "name": "Meet", "contributedAmount": 5000 },
        { "name": "Amit", "contributedAmount": 4500 }
      ],
      "expenses": [
        {
          "title": "Hotel",
          "amount": 7000,
          "paidBy": "Meet",
          "date": "2026-05-10T00:00:00.000Z",
          "note": "2 nights"
        }
      ],
      "summary": {
        "totalContributed": 9500,
        "totalSpent": 7000,
        "remainingBalance": 2500,
        "sharePerPerson": 3500,
        "participantCount": 2,
        "settlements": [
          {
            "name": "Meet",
            "contributedAmount": 5000,
            "share": 3500,
            "net": 1500,
            "status": "gets back"
          },
          {
            "name": "Amit",
            "contributedAmount": 4500,
            "share": 3500,
            "net": 1000,
            "status": "gets back"
          }
        ]
      }
    }
  ]
}
```

### Delete Trip

`DELETE /api/trips/:id`

## Theme Values

Allowed `themePreference` values:

- `monochrome`
- `forest`
- `ivory`
