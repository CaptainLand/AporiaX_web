# AporiaX Web

Product website and Aporia Account Center for [AporiaX](https://github.com/CaptainLand/AporiaX), the local-first desktop coding agent.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

The Account experience expects AporiaX Cloud at `http://localhost:4100` by default. Start the `CaptainLand/AporiaX_Cloud` account-integration branch first with PostgreSQL and Redis.

## Account flow

The website now has a real Cloud-backed account path:

```text
Landing
  -> Sign in / Create account
  -> email OTP
  -> HttpOnly refresh cookie
  -> /account
     -> Overview
     -> Credits & Usage
     -> Devices
     -> Security / Sessions
     -> Preferences
```

Browser refresh credentials are never stored in `localStorage`; the Cloud API writes the refresh token as an HttpOnly cookie, while the short-lived access token stays only in React memory.

In local development, the OTP is printed in the AporiaX Cloud API terminal. The Credits page also exposes a development-only helper to grant 100 test Credits when the Cloud development endpoint is enabled.

## Build

```bash
npm run build
```

## Visual language

The landing site and Account Center follow the desktop AporiaX identity:

- the welcome particle ocean is adapted from the desktop particle field;
- primary surfaces use blue-black rather than a uniform black-purple fill;
- violet is used for depth/sidebar separation and ice blue for active/status emphasis;
- account surfaces borrow the desktop dialogue UI's cool-gray typography and restrained blue glow;
- the navbar uses the canonical desktop AporiaX icon directly rather than the previously downscaled/cropped web asset.

## Environment

```env
VITE_APORIA_API_URL=http://localhost:4100
VITE_ENABLE_DEV_CREDIT_GRANT=true
```

Set `VITE_ENABLE_DEV_CREDIT_GRANT=false` for non-development builds. Production deployment should point `VITE_APORIA_API_URL` at the deployed Aporia Account API.

## Current Preview boundary

The browser account, Credits, ledger, device list, session management and profile settings are connected. Production email delivery, phone verification, subscriptions, weekly grants, invitations and Remote Relay are still Cloud-side follow-up work.
