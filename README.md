# Playto KYC (Django + React) — Deployable

Hindi/English: Yeh repo Playto Founding Engineering Intern Challenge 2026 ke liye ek working KYC onboarding pipeline ship karta hai. Focus **correctness + edge cases** pe hai: strict state machine, secure file uploads, reviewer queue, SLA flagging, role-based auth, aur notification logging. UI modern/futuristic (sidebar + header + live search + toast + graphs) hai, but core logic backend pe enforce hota hai.

## What’s inside (features)

- **Merchant**
  - Unified **Login/Register**
  - KYC form (save progress in draft / more-info)
  - Document upload (PAN/Aadhaar/Bank Statement) with server-side validation
  - Submit → reviewer queue
  - SLA view for active submission + last approved/rejected summary
  - “Start new KYC” after approved/rejected
- **Reviewer/Admin**
  - Queue (oldest-first) + SLA “at risk” flag
  - Submission detail page: view form + open docs + approve/reject/hold/request-info
  - Dashboard graphs (stats endpoint)
  - User management + Add User page
- **System**
  - Notification events stored in DB on state changes (no email sending needed)
  - JWT auth (Bearer) + role-based permissions

## Tech stack

- **Backend**: Django 6 + DRF + SimpleJWT + CORS headers (SQLite for simplicity)
- **Frontend**: React (Vite) + Tailwind + Chart.js + react-hot-toast

## Repo structure (high level)

```text
backend/
  requirements.txt
  backend/
    manage.py
    seed.py
    backend/          # Django project
    kyc/              # main app (models/serializers/views/state machine)
frontend/
  netlify.toml
  .env.example
  src/
    api/client.js
    context/AuthContext.jsx
    components/...
    pages/...
EXPLAINER.md
render.yaml
netlify.toml
```

## Quickstart (Local)

### Backend (Django/DRF)

```bash
cd backend/backend
pip3 install -r ../requirements.txt
python3 manage.py migrate
python3 manage.py shell < seed.py
python3 manage.py runserver 8000
```

- **API base**: `http://127.0.0.1:8000/api/v1/`
- **Media**: documents served in debug at `http://127.0.0.1:8000/media/...`

### Frontend (React/Vite)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- **Frontend**: `http://127.0.0.1:5173`

### Seeded logins (after `seed.py`)

- **Reviewer**: `reviewer / reviewer123`
- **Admin**: `admin / admin123`
- **Merchant (draft)**: `merchant_draft / merchant123`
- **Merchant (under_review)**: `merchant_review / merchant123`

## Core API endpoints (high-signal)

### Auth
- `POST /api/v1/auth/register/` (merchant register)
- `POST /api/v1/auth/login/` (JWT pair: access/refresh)
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/auth/me/`

### KYC
- `GET /api/v1/submissions/` (merchant: own, admin: all)
- `POST /api/v1/submissions/` (create draft)
- `PATCH /api/v1/submissions/:id/` (merchant edit only in draft / more_info_requested)
- `POST /api/v1/submissions/:id/upload_document/` (PDF/JPG/PNG ≤ 5MB)
- `POST /api/v1/submissions/:id/submit/`
- `POST /api/v1/submissions/:id/review/` (admin actions: start_review/hold/request_info/approve/reject)

### Admin
- `GET /api/v1/admin/stats/` (graphs data)
- `GET /api/v1/admin/search/?q=...` (live search)
- `GET /api/v1/admin/users/` (user management)
- `POST /api/v1/admin/users/` (admin create user)

### Notifications
- `GET /api/v1/notifications/`
- `POST /api/v1/notifications/:id/read/`

## State machine (Playto core)

- **Location**: `backend/backend/kyc/state_machine.py`
- **Rule**: Every status change checks `can_transition(from, to)`. If false → **400**.

States used:
- `draft → submitted → under_review → approved/rejected`
- `under_review → more_info_requested → submitted`
- `on_hold` supported for reviewer hold flow

## File upload validation (Playto core)

Backend enforces:
- **Types**: PDF / JPG / PNG (server-side)
- **Extensions**: `.pdf/.jpg/.jpeg/.png`
- **Size**: max **5MB**

Code:
- `backend/backend/kyc/utils.py` + `backend/backend/kyc/serializers.py`

## SLA tracking (Playto core)

- SLA = **24 hours from first submit**
- `is_at_risk` computed dynamically (not stored) in `KYCSubmission.is_at_risk`
