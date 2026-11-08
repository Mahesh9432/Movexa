from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.profiles import router as profiles_router
from app.api.assignments import router as assignments_router


app = FastAPI(
    title="Movexa API",
    description="Backend API for AI-Powered Physiotherapy and Rehabilitation",
    version="1.0.0",
)

# Register API routers
app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(assignments_router)


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
