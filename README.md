# Movexa

### AI-Powered Physiotherapy and Rehabilitation Movement Monitoring

Movexa is a web-based AI-assisted physiotherapy and rehabilitation platform designed to help patients perform prescribed exercises correctly while enabling physiotherapists to monitor movement quality and progress.

## Problem Statement

Patients often struggle to perform physiotherapy exercises correctly at home. Physiotherapists also face challenges in monitoring exercise technique, identifying compensatory movements, and tracking patient progress between appointments.

## Proposed Solution

Movexa aims to provide:

- **AI-Based Movement Monitoring:** Analyze body posture and exercise movements using computer vision.
- **Compensation Detection:** Identify potential compensatory movements during exercises.
- **Reliable Assessments:** Flag low-confidence recordings as "Unable to Assess".
- **Progress Tracking:** Monitor patient-specific progress across sessions.
- **Offline-First Sessions:** Store exercise session data locally and synchronize when connectivity returns.
- **Multilingual Support:** Provide instructions in English, Hindi, and Marathi.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Python, FastAPI |
| AI / Computer Vision | MediaPipe, OpenCV, NumPy |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Migrations | Alembic |
| Offline Storage | IndexedDB |
| Charts | Recharts |
| Version Control | Git, GitHub |

## Project Structure

```text
Movexa/
├── frontend/       # React web application
├── backend/        # FastAPI backend
├── ai-engine/      # Movement analysis and AI modules
├── database/       # Database documentation and seed data
├── docs/           # Project documentation
└── .github/        # GitHub workflows
```

## Development Goals

1. Build a responsive and accessible web application.
2. Implement reliable movement and posture analysis.
3. Track exercise sessions and patient progress.
4. Support offline session recording and synchronization.
5. Protect patient information and minimize unnecessary video storage.

## Important Note

Movexa is an AI-assisted monitoring project, not a replacement for professional medical assessment or physiotherapist supervision.

## Project Status

Currently in the initial project setup and development phase.