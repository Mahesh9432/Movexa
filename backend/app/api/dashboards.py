from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.database.connection import get_db
from app.models.user import User
from app.services.dashboard_service import (
    get_patient_dashboard,
    get_patient_progress,
    get_physiotherapist_dashboard,
    get_physiotherapist_patients,
)


router = APIRouter(prefix="/api", tags=["Dashboards"])


class PatientSummary(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    affected_area: str | None
    injury: str | None


class DashboardSummary(BaseModel):
    active_prescriptions: int = 0
    active_patients: int = 0
    total_sessions: int = 0
    completed_sessions: int = 0
    in_progress_sessions: int = 0
    incomplete_sessions: int = 0
    unable_to_assess_sessions: int = 0
    total_repetitions: int = 0
    assessed_repetitions: int = 0
    unable_to_assess_repetitions: int = 0


class PrescriptionDashboardItem(BaseModel):
    id: UUID
    exercise_id: UUID
    exercise_name: str | None
    target_reps: int
    target_sets: int
    created_at: datetime


class SessionDashboardItem(BaseModel):
    id: UUID
    prescription_id: UUID
    exercise_id: UUID | None
    exercise_name: str | None
    status: str
    started_at: datetime
    completed_at: datetime | None
    synced_at: datetime | None
    total_repetitions: int
    assessed_repetitions: int
    unable_to_assess_repetitions: int


class PatientDashboardResponse(BaseModel):
    patient: PatientSummary
    summary: DashboardSummary
    active_prescriptions: list[PrescriptionDashboardItem]
    recent_sessions: list[SessionDashboardItem]


class PhysiotherapistSummary(BaseModel):
    active_patients: int
    active_prescriptions: int
    total_sessions: int
    completed_sessions: int
    in_progress_sessions: int
    incomplete_sessions: int
    unable_to_assess_sessions: int
    total_repetitions: int
    assessed_repetitions: int
    unable_to_assess_repetitions: int


class PhysiotherapistIdentity(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    verification_status: str


class PhysiotherapistDashboardResponse(BaseModel):
    physiotherapist: PhysiotherapistIdentity
    summary: PhysiotherapistSummary
    recent_sessions: list[SessionDashboardItem]


class PhysiotherapistPatientItem(BaseModel):
    patient_id: UUID
    user_id: UUID
    full_name: str
    email: str
    phone_number: str | None
    affected_area: str | None
    injury: str | None
    assigned_at: datetime
    active_prescriptions: int
    total_sessions: int
    last_session_at: datetime | None


class RepetitionProgressItem(BaseModel):
    id: UUID
    rep_number: int
    assessment_status: str
    range_of_motion: float | None
    confidence: float | None
    movement_data: Any | None
    compensation_flags: Any | None
    detected_issues: Any | None
    feedback: str | None


class ProgressSessionItem(SessionDashboardItem):
    repetitions_data: list[RepetitionProgressItem]


class ProgressPatientIdentity(BaseModel):
    id: UUID
    user_id: UUID
    full_name: str
    email: str
    phone_number: str | None
    affected_area: str | None
    injury: str | None


class PatientProgressResponse(BaseModel):
    patient: ProgressPatientIdentity
    summary: DashboardSummary
    sessions: list[ProgressSessionItem]


@router.get(
    "/patients/me/dashboard",
    response_model=PatientDashboardResponse,
)
def read_patient_dashboard(
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    return get_patient_dashboard(db, current_user)


@router.get(
    "/physiotherapists/me/dashboard",
    response_model=PhysiotherapistDashboardResponse,
)
def read_physiotherapist_dashboard(
    current_user: User = Depends(require_role("PHYSIOTHERAPIST")),
    db: Session = Depends(get_db),
):
    return get_physiotherapist_dashboard(db, current_user)


@router.get(
    "/physiotherapists/me/patients",
    response_model=list[PhysiotherapistPatientItem],
)
def read_physiotherapist_patients(
    current_user: User = Depends(require_role("PHYSIOTHERAPIST")),
    db: Session = Depends(get_db),
):
    return get_physiotherapist_patients(db, current_user)


@router.get(
    "/physiotherapists/me/patients/{patient_id}/progress",
    response_model=PatientProgressResponse,
)
def read_patient_progress(
    patient_id: UUID,
    current_user: User = Depends(require_role("PHYSIOTHERAPIST")),
    db: Session = Depends(get_db),
):
    return get_patient_progress(db, current_user, patient_id)