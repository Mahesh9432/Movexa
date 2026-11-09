from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth_router,
    users_router,
    patients_router,
    physio_router,
    assignments_router,
    exercises_router,
    prescriptions_router,
    sessions_router,
    reps_router,
)

app = FastAPI(
    title="Movexa API",
    description="Backend API for AI-Powered Physiotherapy and Rehabilitation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(patients_router)
app.include_router(physio_router)
app.include_router(assignments_router)
app.include_router(exercises_router)
app.include_router(prescriptions_router)
app.include_router(sessions_router)
app.include_router(reps_router)


@app.get("/")
def root():
    return {"message": "Welcome to Movexa API", "status": "running", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Movexa Backend"}
