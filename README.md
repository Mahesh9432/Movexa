
# Movexa
### AI-Powered Physiotherapy and Rehabilitation Movement Monitoring Platform

Movexa is an AI-assisted physiotherapy and rehabilitation platform designed to help patients perform prescribed exercises at home while enabling physiotherapists to monitor movement quality and track rehabilitation progress.

The platform aims to bridge the gap between patients and physiotherapists through computer vision, movement analysis, digital exercise management, and personalized progress tracking.

---

## Problem Statement

Patients performing physiotherapy exercises at home often struggle to maintain correct exercise techniques. Physiotherapists also face difficulties monitoring exercise performance, identifying compensatory movements, and tracking patient progress between appointments.

Movexa aims to address these challenges through an accessible digital rehabilitation monitoring platform.

## Proposed Solution

Movexa combines a patient-facing application, physiotherapist dashboard, backend services, and AI-assisted movement analysis.

### Key Features

- **AI-Based Movement Monitoring:** Camera-based body landmark detection and movement analysis.
- **Compensation Detection:** Identify potential compensatory movements during exercises.
- **Reliable Assessments:** Flag low-confidence recordings as "Unable to Assess".
- **Personalized Progress Tracking:** Establish patient-specific movement baselines and compare subsequent sessions.
- **Offline-First Sessions:** Support local session storage and synchronization when connectivity returns.
- **Multilingual Support:** Designed for English, Hindi, and Marathi.
- **Dual Dashboards:** Separate interfaces for patients and physiotherapists.
- **Exercise Management:** Support exercise prescriptions, patient assignments, and rehabilitation session tracking.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Migrations | Alembic |
| AI / Computer Vision | MediaPipe, OpenCV, NumPy |
| Offline Storage | IndexedDB |
| Charts | Recharts |
| Version Control | Git and GitHub |

## System Architecture

```text
                  MOVEXA PLATFORM
                         |
             +-----------+-----------+
             |                       |
       Patient Dashboard      Physiotherapist Dashboard
             |                       |
             +-----------+-----------+
                         |
                  React Frontend
                         |
                     FastAPI
                         |
          +--------------+--------------+
          |              |              |
       Authentication  Application   AI Movement
                         APIs          Analysis
          |              |              |
          +--------------+--------------+
                         |
                  PostgreSQL
```

## Project Structure

```text
Movexa/
|
├── frontend/
|   ├── src/
|   ├── public/
|   ├── package.json
|   └── vite.config.js
|
├── backend/
|   ├── app/
|   |   ├── api/
|   |   ├── core/
|   |   ├── models/
|   |   ├── schemas/
|   |   └── services/
|   ├── migrations/
|   ├── requirements.txt
|   ├── alembic.ini
|   └── .env.example
|
├── ai-engine/
|
├── database/
|
├── docs/
|
└── README.md
```

## Getting Started

Follow these instructions to run Movexa locally.

### Prerequisites

Install the following:

- Git
- Node.js and npm
- Python 3.11 or compatible version
- PostgreSQL database access
- VS Code (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/Mahesh9432/Movexa.git
cd Movexa
```

Use the latest main branch:

```bash
git switch main
git pull origin main
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

### 3. Backend Environment Configuration

Create a `.env` file inside the backend directory using `.env.example` as a reference.

Configure the following variables:

```env
APP_NAME=Movexa API
APP_VERSION=1.0.0
DATABASE_URL=postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/movexa
JWT_SECRET_KEY=YOUR_GENERATED_SECRET_HERE
```

Replace the database credentials with your own PostgreSQL connection details.

Generate a secure JWT secret instead of using a sample value.

Never commit your actual `.env` file or database credentials to GitHub.

### 4. Database Setup

Create or configure your PostgreSQL database.

Once the database connection is configured, run the migrations from the backend directory:

```bash
alembic upgrade head
```

Only run migrations against a database whose current schema and migration state have been checked.

### 5. Start the Backend

From the backend directory:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend URL:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

Health Check:

http://127.0.0.1:8000/health

### 6. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file if necessary:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the development server:

```bash
npm run dev
```

Frontend URL:

http://localhost:5173

### 7. Build the Frontend

To generate a production build:

```bash
npm run build
```

The generated production files will be available in the `dist` directory.

---

## API Documentation

Movexa uses FastAPI to provide backend services.

After starting the backend, visit:

http://127.0.0.1:8000/docs

The Swagger interface provides access to the available API endpoints.

## Testing

Run backend tests from the backend directory:

```bash
python -m pytest -q
```

Run the frontend production build:

```bash
npm run build
```

## Team Roles and Responsibilities

| Team Member | Responsibility |
|---|---|
| Mahesh | Team Leader, Backend and API Development |
| Prerana | Backend and API Development |
| Madhura | Frontend Development |
| Darshan | AI and Movement Analysis |
| Ashish | Database Development |
| Kaveri | Project Support and Documentation |
| Sanjana | Testing and Quality Assurance |

## Current Development Status

Movexa is being developed as a working software prototype.

The project includes frontend application development, backend API services, database integration, and ongoing development of AI-assisted movement analysis and rehabilitation monitoring capabilities.

Features under development should be distinguished from fully implemented and validated features during demonstrations.

## Future Enhancements

- Improved movement analysis and compensation detection.
- More robust patient-specific rehabilitation baselines.
- Improved offline session synchronization.
- Expanded multilingual exercise guidance.
- Performance optimization and broader device compatibility.

## Medical Disclaimer

Movexa is an AI-assisted rehabilitation monitoring platform. It is intended to support patients and physiotherapists and does not replace professional medical assessment, diagnosis, or physiotherapist supervision.

## Repository

GitHub: https://github.com/Mahesh9432/Movexa

---

**Movexa — Making Home Rehabilitation More Connected, Measurable, and Accessible.**
