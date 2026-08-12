# AporiaX Web

Product website and Aporia Account Center for [AporiaX](https://github.com/CaptainLand/AporiaX), the local-first desktop coding agent.

## Local development

Start AporiaX Cloud first on its `agent/cloud-v0.1-foundation` branch. Docker is optional; the no-Docker Windows path only requires PostgreSQL:

```powershell
Copy-Item .env.no-docker.example .env -Force
npm install
npm run doctor
npm run db:push
npm run db:seed
npm run dev
```

Then start this web branch:

```powershell
Copy-Item .env.example .env -Force
npm install
npm run dev
```

Open `http://localhost:5173`.

## Account flow

The website has a real Cloud-backed account path:

```text
Landing
  -> Sign in / Create account
  -> optional invite code during account creation
  -> email OTP
  -> HttpOnly refresh cookie
  -> /account
     -> Overview
     -> Quota & Usage
     -> Devices
     -> Security / Sessions
     -> Preferences
```

Browser refresh credentials are never stored in `localStorage`; the Cloud API writes the refresh token as an HttpOnly cookie, while the short-lived access token stays only in React memory.

Pending OTP verification is kept in `sessionStorage`, so closing and reopening the auth modal or refreshing the same tab returns to the existing verification step instead of forcing another OTP request. In local development, no email is sent; the verification code is printed in the AporiaX Cloud terminal.

## Weekly quota

The Free Preview no longer exposes the internal Credit amount behind its free allowance. Account Center receives only a weekly quota ratio and reset time.

The visible quota bar always has a fixed 100% maximum. Invite rewards refill already-consumed quota rather than expanding the maximum:

```text
1st verified invite  -> +100% refill
2nd verified invite  -> +50% refill
3rd verified invite  -> +30% refill
4th+                 -> no refill
```

A refill stops at 100%, and overflow is discarded. For example, 40% remaining plus the second +50% refill becomes 90%; 85% remaining plus the third +30% refill becomes 100%.

The Quota & Usage page shows:

- remaining weekly percentage and fixed-width progress bar;
- next weekly reset time;
- the user's invite code and copyable invite link;
- the three lifetime refill tiers and which have been earned;
- request/token usage and available Cloud models without exposing internal Credit pricing.

Invite links use `?invite=CODE`; opening the landing page with that query pre-fills the invite field when the user chooses Create account.

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
- the navbar uses the canonical AporiaX icon source directly rather than the legacy `BrandMark` wrapper.

## Environment

```env
VITE_APORIA_API_URL=http://localhost:4100
```

Production deployment should point `VITE_APORIA_API_URL` at the deployed Aporia Account API.

## Current Preview boundary

The browser account, weekly quota, invite code/refill flow, usage, device list, session management and profile settings are connected. Production email delivery, phone verification, subscriptions, stronger referral anti-abuse, and Remote Relay are still Cloud-side follow-up work.
