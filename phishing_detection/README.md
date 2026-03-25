# Threat Shield Frontend + Node Backend

This app now includes a small Express backend for Gmail OTP login.

## Run locally

Open two terminals inside [phishing_detection](C:/Users/Rupam/Documents/projects/gmail_threat_detection/phishing_detection):

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend on `http://localhost:5000`.

## Backend routes

- `GET /api/health`
- `GET /api/auth/session`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/logout`

## Real Gmail OTP delivery

Without SMTP config, the backend still works in demo mode and returns a preview OTP to the UI.

To send real emails in PowerShell before starting the server:

```powershell
$env:SMTP_USER="your-gmail@gmail.com"
$env:SMTP_PASS="your-app-password"
$env:SMTP_FROM="your-gmail@gmail.com"
$env:SESSION_SECRET="replace-this-secret"
npm run dev:server
```

If you deploy this, move OTP/session storage from in-memory state to a database or Redis.
