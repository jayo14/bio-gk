# Bio Gatekeeper

Mobile-first paid creator gateway. Monorepo: Next.js frontend + Django REST Framework backend.

## Requirements
- Node.js 20+
- Python 3.12+
- PostgreSQL (Supabase is supported)

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example .env
python manage.py makemigrations creators interactions payments notifications
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
cp ../.env.example .env.local
npm run dev
```

Frontend runs on http://localhost:3000, API on http://localhost:8000.

## Important
Payment initialization is server-side only. Never expose `PAYSTACK_SECRET_KEY` to the browser. Before production, configure HTTPS, real secrets, creator verification, webhook replay protection, rate limiting, consent/privacy controls, and provider-specific settlement terms.


## Authentication

Authentication uses Django REST Framework token authentication. New accounts are active immediately; email verification is intentionally disabled.

- `POST /api/auth/signup/` — create an account and creator profile
- `POST /api/auth/login/` — exchange email/password for an API token
- `POST /api/auth/logout/` — revoke the current token (send `Authorization: Token <token>`)
- `GET /api/auth/me/` — return the current account
- `POST /api/auth/forgot-password/` — generate a one-hour password-reset link
- `POST /api/auth/reset-password/` — set a new password using `uid`, `token`, and `password`

The frontend stores the token in local storage for this initial scaffold. For production, prefer secure, HttpOnly cookie-based sessions or carefully harden token storage, add login/reset throttling, and configure HTTPS. The reset email provider is not wired yet: Django's console email backend is configured, and while `DJANGO_DEBUG=True`, the forgot-password response returns a development-only reset URL. Never expose that URL when deployed with debug enabled.

### Run the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations creators interactions payments notifications
python manage.py migrate
python manage.py runserver
```

### Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000/api` by default. Set `NEXT_PUBLIC_API_URL` if your backend is hosted elsewhere.
