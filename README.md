# Bio Gatekeeper (MVP)

Bio Gatekeeper is a mobile-first creator monetization platform built specifically for Nigerian creators, campus micro-influencers, lifestyle creators, and independent artists.

Each creator gets a public link: `/[username]` (e.g. `gate.ng/chioma_x`).

Visitors can:
- Send paid **Priority Messages** with a guaranteed response window.
- Make **Quick Tips** with preset amounts (₦2,000, ₦5,000, ₦10,000 or custom).
- Opt in to be featured on the creator's public **Odogwu Supporter Wall** (Weekly, Monthly, All-Time).
- Pay directly in Nigerian Naira (NGN) via Paystack inside Instagram, TikTok, Snapchat, or WhatsApp in-app browsers without installing an app or registering.

Creators can:
- Sign up and log in without mandatory email verification.
- Claim a unique handle and configure avatar, bio, and custom interaction pricing.
- Connect their Nigerian bank account directly through Paystack Subaccounts to receive automated split settlements (90% to creator, 10% platform fee).
- Receive verified messages and tips in a private creator inbox.
- Configure notification alerts via WhatsApp Cloud API and email.
- Track gross earnings, platform fees, and net payouts with real transactional verification.

---

## Architecture & Repository Structure

The repository is structured as a full-stack monorepo:

```
bio-gk/
├── backend/                  # Django 5 + Django REST Framework API
│   ├── config/               # Settings, WSGI, root URLs
│   ├── apps/
│   │   ├── creators/         # Creator profiles, auth, banking subaccounts, leaderboard
│   │   ├── interactions/     # Paid interactions, messages, tips, creator inbox
│   │   ├── payments/         # Paystack client, checkout initialization, verify, webhooks
│   │   └── notifications/    # WhatsApp Cloud API & email notification dispatch
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Next.js 15 (App Router), React 19, Tailwind CSS
│   ├── src/
│   │   ├── app/              # Routes: /[username], /dashboard, /login, /signup, etc.
│   │   ├── components/       # UI shell and reusable controls
│   │   └── lib/api.ts        # Type-safe API client (HttpOnly cookie credentials)
│   ├── package.json
│   └── eslint.config.mjs
├── .env.example              # Comprehensive environment configuration template
└── README.md
```

---

## Prerequisites

- **Node.js**: v20.0+ (Tested on v22)
- **Python**: 3.12+ (Tested on v3.14)
- **PostgreSQL**: Local PostgreSQL or Supabase PostgreSQL instance (SQLite supported for offline development)
- **Paystack Account**: Registered business or starter account (Test keys for staging)

---

## Local Installation & Setup

### 1. Clone the repository and configure environment

```bash
git clone https://github.com/your-username/bio-gk.git
cd bio-gk
cp .env.example .env
```

### 2. Backend Setup (Django)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run migrations to initialize the database
python3 manage.py migrate

# (Optional) Create a superuser for Django admin
python3 manage.py createsuperuser

# Start the API development server (runs on port 8000)
python3 manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup (Next.js)

```bash
cd ../frontend
npm install
cp .env.example .env.local

# Start Next.js development server (runs on port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## Environment Variables Specification

All sensitive configuration is handled via environment variables. Secret keys are strictly backend-only.

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | Backend | Cryptographic signing key for sessions, CSRF, and tokens. Must be a 64+ char random string in production. |
| `DJANGO_DEBUG` | Backend | Set to `False` in production. When `True`, exposes development reset links. |
| `DJANGO_ALLOWED_HOSTS` | Backend | Comma-separated list of allowed hostnames (e.g. `api.yourdomain.com,localhost`). |
| `DATABASE_URL` | Backend | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname`). |
| `FRONTEND_URL` | Backend | Canonical URL of the Next.js frontend (e.g. `https://gate.ng` or `http://localhost:3000`). Configures CORS and CSRF trusted origins. |
| `NEXT_PUBLIC_API_URL` | Frontend | Base URL of the Django REST API (e.g. `http://localhost:8000/api` or `https://api.gate.ng/api`). |
| `PAYSTACK_SECRET_KEY` | Backend | Paystack secret API key (`sk_test_...` or `sk_live_...`). **Never expose to frontend.** |
| `PAYSTACK_PUBLIC_KEY` | Backend/Staging | Paystack public key (`pk_test_...` or `pk_live_...`). |
| `PLATFORM_FEE_PERCENT` | Backend | Integer percentage retained by Bio Gatekeeper (default: `10` for 10% fee). |
| `DJANGO_EMAIL_BACKEND` | Backend | Email backend (`django.core.mail.backends.smtp.EmailBackend` in prod, `console` in dev). |
| `DEFAULT_FROM_EMAIL` | Backend | From address for outgoing transactional emails. |
| `WHATSAPP_CLOUD_API_TOKEN` | Backend | Meta Graph API access token for WhatsApp Business Cloud API alerts. |
| `WHATSAPP_PHONE_NUMBER_ID` | Backend | Meta Phone Number ID associated with the approved WhatsApp sender. |

---

## Authentication & Session Security

- **No Email Verification Requirement**: Creators can immediately sign up, claim their handle, and begin receiving messages.
- **Secure Cookie Strategy**: Access tokens are stored in secure, `HttpOnly`, `SameSite=Lax` cookies (`bg_token`) across authenticated requests (`credentials: 'include'`). Access tokens are **never** stored in browser `localStorage`.
- **API Token Fallback**: Non-browser API clients can pass `Authorization: Token <key>` headers.
- **Single-Use Password Reset**: Cryptographic tokens expire after 1 hour and are tied to user state. Setting a new password revokes past active tokens.
- **Enumeration Prevention**: Forgot-password endpoints always return the identical generic status message regardless of whether an email exists.
- **Rate Limiting**: Scoped rate throttles (`30/minute`) safeguard signup, login, password recovery, and payment checkout initialization.

---

## Payment Architecture & Paystack Split Payments

Bio Gatekeeper enforces strict server-side transaction control:

1. **Amount Authority**: The server determines the minimum fee and tip preset amounts. Client-submitted prices are rejected if below creator rules.
2. **Transaction Initialization (`POST /api/payments/initialize/`)**:
   - Generates an unpredictable reference (`bg_<uuid4_hex>`).
   - Calculates the platform fee: 10% platform, 90% creator.
   - If creator has an active subaccount, passes `subaccount: ACCT_xxxx` and `bearer: subaccount` to Paystack so payouts settle directly.
   - Atomically records the pending interaction and pending payment record before contacting Paystack.
   - Returns Paystack's `authorization_url` to redirect the payer.
3. **Verification Endpoint (`GET /api/payments/verify/<reference>/`)**:
   - Polled by the return page `/[username]/payment/return?reference=...`.
   - Directly checks Paystack's server verification API (`/transaction/verify/<reference>`) to confirm settlement status.
   - Reconciles amount, currency (`NGN`), and reference before transitioning status.
4. **Idempotent Webhook Processing (`POST /api/payments/webhook/`)**:
   - Validates `x-paystack-signature` using HMAC-SHA512 of the unmodified raw request body.
   - Checks `WebhookEvent` table for event idempotency to prevent duplicate fulfillment or double-crediting.
   - Uses row-level database locking (`select_for_update`) within an atomic transaction.
   - Dispatches post-commit creator notifications.
   - Handles `charge.success`, `refund.processed`, and `charge.reversed`.

---

## Running Automated Tests

### Run Backend Tests (18 unit and integration tests)

```bash
cd backend
python3 manage.py test
```

Test coverage includes:
- Creator registration, login, logout, cookie authentication, and handle collision prevention.
- Password reset, token expiration, single-use invalidation, and password updates.
- Public vs. private serializer field masking (guaranteeing zero bank or credential leakage).
- Bank resolution and subaccount creation mocks.
- Odogwu Leaderboard public attribution filtering, pseudonym support, and period grouping.
- Payment initialization server pricing, split calculations, and chat pass rejection.
- Server-side transaction verification and amount/currency reconciliation.
- Webhook signature validation, replay attack deduplication, and atomic fulfillment.
- Creator inbox privacy segregation and read status toggling.
- Email and WhatsApp Cloud API notification dispatch and provider fault-tolerance.

### Run Frontend Lint & Build Checks

```bash
cd frontend
npm run lint    # ESLint flat config check
npm run build   # Next.js production compilation and type check
```

---

## Webhook Configuration (Paystack Dashboard)

1. Log into your Paystack Dashboard (use Test Mode first).
2. Go to **Settings > API Keys & Webhooks**.
3. Under **Webhook URL**, configure:
   `https://api.yourdomain.com/api/payments/webhook/`
4. Ensure your server's `PAYSTACK_SECRET_KEY` matches the secret key displayed on the same page.
5. Click **Test Webhook** in Paystack to verify end-to-end connectivity.

---

## Production Deployment Guide

### Backend (Railway, Render, Fly.io, or VPS)
1. Configure environment variables using `.env.example`.
2. Run database migrations:
   ```bash
   python3 manage.py migrate
   ```
3. Collect static files:
   ```bash
   python3 manage.py collectstatic --noinput
   ```
4. Run with a production WSGI/ASGI server (e.g. Gunicorn):
   ```bash
   gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
   ```
5. Ensure SSL/TLS is active so `SESSION_COOKIE_SECURE = True` functions as expected.

### Frontend (Vercel)
1. Link repository to Vercel.
2. Set root directory to `frontend`.
3. Set environment variable `NEXT_PUBLIC_API_URL` to your production backend URL (e.g. `https://api.gate.ng/api`).
4. Deploy!

---

## Production Launch Checklist

- [ ] Switch `DJANGO_DEBUG` to `False`.
- [ ] Set a strong random `DJANGO_SECRET_KEY` (64+ characters).
- [ ] Ensure `DJANGO_ALLOWED_HOSTS` matches your backend domain.
- [ ] Ensure `FRONTEND_URL` and `NEXT_PUBLIC_API_URL` match your production domains.
- [ ] Configure live Paystack API credentials (`sk_live_...` and `pk_live_...`).
- [ ] Register and verify the Paystack Webhook URL in your live Paystack dashboard.
- [ ] Verify outbound SMTP email settings for password resets and creator alerts.
- [ ] (Optional) Add Meta WhatsApp Cloud API credentials for instant creator WhatsApp alerts.
- [ ] Confirm SSL certificates (HTTPS) are active on both frontend and backend domains.
