# Expense Tracker

## Local setup

Create these env files before running the app:

- `client/.env`
- `server/.env`

Use the included example values as a starting point.

## Google sign-in

This app uses Google Identity Services from the frontend, so the Google OAuth client must be a **Web application** client.

Required config:

- `client/.env`: `VITE_GOOGLE_CLIENT_ID`
- `server/.env`: `GOOGLE_CLIENT_ID`

Both values must be the same Google Web client ID.

If Google sign-in shows `Error 401: invalid_client` or `no registered origin`, open the Google Cloud Console for that OAuth client and add your frontend dev URL to **Authorized JavaScript origins**.

For local development with Vite, that is usually:

- `http://localhost:5173`

Then restart the frontend after changing `client/.env`.
