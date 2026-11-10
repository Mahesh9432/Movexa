# Movexa

### AI-Assisted Physiotherapy and Rehabilitation Movement Monitoring

Movexa is a web-based physiotherapy prototype that helps patients perform prescribed exercises with browser-based pose tracking while giving physiotherapists a way to assign patients, create prescriptions, and review movement progress.

## Current Prototype Scope

Implemented:

- Patient and physiotherapist registration and JWT authentication.
- Role-based access control with patient ownership and physiotherapist assignment checks.
- Patient assignment and prescription creation for physiotherapists.
- Prescribed exercise sessions with browser camera input.
- MediaPipe pose tracking with a live skeleton overlay.
- Automatic rep counting from range-of-motion cycles.
- Manual rep fallback when camera or pose tracking is unavailable.
- Low-confidence reps flagged as `UNABLE_TO_ASSESS` instead of producing unreliable ROM values.
- Trunk-lean and knee-valgus compensation flags.
- Session completion, incomplete, and unable-to-assess states.
- Patient progress history, per-rep ROM charts, and average-ROM trends.
- Session resume after page refresh, with abandoned sessions closed when a new one starts.
- Patient names in physiotherapist-facing assignment and progress views.

Not implemented in this prototype:

- Offline session storage and synchronization.
- Multilingual exercise instructions.
- Physiotherapist verification or administration workflows.
- Production deployment configuration, media storage, or medical-grade security hardening.
- Exercise-creation UI. Exercises are seeded; the API can create additional exercises.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, JavaScript |
| Styling | Tailwind CSS v4 |
| Backend | Python, FastAPI |
| Pose Tracking | MediaPipe Tasks Vision in the browser |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2 |
| Migrations | Alembic |
| Charts | Recharts |
| Authentication | JWT with bcrypt password hashing |

## Project Structure

```text
Movexa/
├── backend/
│   ├── app/                  # FastAPI application, routes, models, schemas
│   ├── migrations/           # Alembic environment and revisions
│   ├── seed.py               # Demo users, exercises, and prescription
│   └── requirements.txt
├── frontend/
│   ├── public/               # Generated MediaPipe assets (gitignored)
│   ├── scripts/              # MediaPipe setup and pose-math checks
│   └── src/                  # React pages, components, hooks, and utilities
├── docker-compose.yml        # PostgreSQL service
└── README.md
```

## Important Note

Movexa is an AI-assisted monitoring prototype, not a replacement for professional medical assessment or physiotherapist supervision. It does not store exercise video.

## Local Development

Prerequisites: Python 3.12+, Node.js 20+, and Docker Desktop.

### 1. Database

```powershell
docker compose up -d db
```

The default local database is available at `localhost:5432` with database `movexa` and user/password `postgres`.

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs>

### 3. Frontend

```powershell
cd frontend
npm install
npm run setup:mediapipe
npm run dev
```

`setup:mediapipe` copies the MediaPipe WASM runtime into `public/wasm` and downloads the pose landmarker model into `public/models`. These generated assets are gitignored. You can run the individual steps with `npm run setup:wasm` and `npm run setup:model`.

The frontend calls the backend at `http://localhost:8000` by default. To point it elsewhere, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

Open <http://localhost:5173> and allow camera access when starting an exercise session.

### Demo Accounts

- Patient: `patient@movexa.dev` / `patient123`
- Physiotherapist: `physio@movexa.dev` / `physio123`

If the demo accounts are missing, run `python seed.py` again from `backend`; the seed script is idempotent.

## Manual Acceptance Checklist

Run this checklist with a camera-enabled browser before treating the prototype as demo-ready.

### Physiotherapist flow

- [ ] Log in as the physiotherapist.
- [ ] Confirm the patient list shows patient names rather than UUID prefixes.
- [ ] Assign a patient to yourself.
- [ ] Create a prescription with a target rep count.
- [ ] Open the patient's progress view.
- [ ] Confirm the patient selector shows names and only assigned patients.

### Patient flow

- [ ] Log in as the patient.
- [ ] Confirm the new prescription appears on the dashboard.
- [ ] Start the session and allow camera access.
- [ ] Confirm the skeleton overlay appears and tracking status becomes active.
- [ ] Perform a full range-of-motion cycle and confirm a rep is saved.
- [ ] Refresh the page mid-session and confirm the same session and saved reps resume.
- [ ] Finish the session.
- [ ] Confirm the progress page shows the session, rep count, per-rep ROM chart, and trend.

### Failure and fallback checks

- [ ] Deny camera access and confirm manual rep entry remains usable.
- [ ] Start a session, leave it without finishing, then start the same prescription again; confirm the old in-progress session is marked incomplete rather than duplicated.
- [ ] Confirm reps with confidence below `0.5` are saved as `UNABLE_TO_ASSESS`.
- [ ] Confirm missing MediaPipe assets show the setup guidance instead of crashing the page.

## Verification Commands

```powershell
cd frontend
npm run lint
npm run check:pose
npm run build
```

```powershell
cd backend
pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m compileall app
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\alembic.exe current
```

Backend tests run against a separate `movexa_test` database, which is created automatically. Set `TEST_DATABASE_URL` to override it. CI runs these checks from `.github/workflows/ci.yml`.

## Troubleshooting

- **Camera does not start:** Use `localhost` or `127.0.0.1`, allow camera permission, and check that another application is not holding the camera.
- **Pose model fails to load:** Run `npm run setup:mediapipe` from `frontend` and reload the page.
- **Database connection fails:** Confirm `docker compose ps` shows the `movexa-db` container as healthy and that `backend/.env` matches the Compose credentials.
- **API requests fail from the frontend:** Confirm the backend is running on `http://localhost:8000` and the frontend is running on `http://localhost:5173`.
- **Duplicate in-progress sessions from older builds:** Start the prescription again; the new session creation closes older in-progress sessions for that prescription.
