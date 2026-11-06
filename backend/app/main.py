from fastapi import FastAPI

app = FastAPI(
    title="Movexa API",
    description="Backend API for AI-Powered Physiotherapy and Rehabilitation",
    version="1.0.0",
)


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