from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.profiles import router as profiles_router
from app.api.assignments import router as assignments_router
from app.api.sessions import router as sessions_router
from app.api.metrics import router as metrics_router


app = FastAPI(
    title="Movexa API",
    description="Backend API for AI-Powered Physiotherapy and Rehabilitation",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(assignments_router)
app.include_router(sessions_router)
app.include_router(metrics_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Movexa API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Movexa Backend",
    }
