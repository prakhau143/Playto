# Playto KYC (Django + React) — Deployable

Hindi/English: yeh repo Playto KYC challenge ke core parts (state machine, file validation, review queue, SLA, auth) + bonus UI (futuristic sidebar/header, live search, notifications, graphs, toast) implement karta hai.

## Backend (Django/DRF)

```bash
cd backend/backend
pip3 install -r ../requirements.txt
python3 manage.py migrate
python3 manage.py shell < seed.py
python3 manage.py runserver 8000
```

API base: `http://127.0.0.1:8000/api/v1/`

## Frontend (React/Vite)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: `http://127.0.0.1:5173`

## Core API Endpoints (high-signal)

- **Auth**
  - `POST /api/v1/auth/register/` (merchant register)
  - `POST /api/v1/auth/login/` (JWT pair)
  - `GET /api/v1/auth/me/`
- **KYC**
  - `GET /api/v1/submissions/` (merchant: own, admin: all)
  - `POST /api/v1/submissions/` (create draft)
  - `PATCH /api/v1/submissions/:id/` (merchant edit in draft / more_info_requested)
  - `POST /api/v1/submissions/:id/upload_document/` (file validation: pdf/jpg/png ≤ 5MB)
  - `POST /api/v1/submissions/:id/submit/`
  - `POST /api/v1/submissions/:id/review/` (admin actions: start_review/hold/request_info/approve/reject)
- **Admin**
  - `GET /api/v1/admin/stats/` (graphs)
  - `GET /api/v1/admin/search/?q=...` (live search)
  - `GET /api/v1/admin/users/` (user management)
- **Notifications**
  - `GET /api/v1/notifications/`
  - `POST /api/v1/notifications/:id/read/`

## State Machine

Backend rules live in `backend/backend/kyc/state_machine.py`. Illegal transitions return 400.

