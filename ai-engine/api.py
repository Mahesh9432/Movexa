
from pydantic import BaseModel, Field
from fastapi import WebSocket, WebSocketDisconnect
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="Movexa AI Movement Analysis API",
    description="API for AI-powered squat analysis",
    version="1.0.0"
)


# Session summary model
class SessionSummary(BaseModel):
    total_reps: int
    duration_seconds: float
    reps_per_minute: float

class IndividualRep(BaseModel):
    rep_number: int
    min_knee_angle: float
    max_knee_angle: float
    rom_degrees: float
    duration_seconds: float
    assessment_status: str
    sample_count: int

# AI result model
class AIResult(BaseModel):
    session_id: str
    exercise: str
    repetitions: int
    current_phase: str
    knee_angle: Optional[float] = None
    feedback: str
    session_summary: SessionSummary
    individual_repetitions: list[IndividualRep] = Field(default_factory=list)
    



@app.get("/")
def home():
    return {
        "message": "Welcome to Movexa AI API",
        "status": "Running successfully"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Movexa AI Engine"
    }


@app.get("/api/ai/status")
def ai_status():
    return {
        "ai_engine": "Active",
        "exercise_supported": ["Squat"],
        "pose_detection": "MediaPipe",
        "status": "Ready"
    }


# Receive AI analysis results
@app.post("/api/ai/results")
def receive_ai_result(result: AIResult):
    return {
        "message": "AI result received successfully",
        "data": result
    }


# WebSocket for real-time AI updates
@app.websocket("/ws/ai/live")
async def live_ai_updates(websocket: WebSocket):

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()

            await websocket.send_json({
                "message": "Live AI data received",
                "data": data
            })

    except WebSocketDisconnect:
        print("Frontend disconnected from AI WebSocket")
