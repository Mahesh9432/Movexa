from datetime import date, datetime
from typing import Any, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

Role = Literal["PATIENT", "PHYSIOTHERAPIST"]
SessionStatus = Literal["IN_PROGRESS", "COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"]
AssessmentStatus = Literal["ASSESSED", "UNABLE_TO_ASSESS"]


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None
    role: Role = "PATIENT"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone_number: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PatientCreate(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    injury: Optional[str] = None
    affected_area: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class PatientRead(BaseModel):
    id: UUID
    user_id: UUID
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    injury: Optional[str] = None
    affected_area: Optional[str] = None
    treatment_start_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PhysiotherapistCreate(BaseModel):
    qualification: str
    specialization: Optional[str] = None
    registration_number: str
    years_experience: int = 0
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    professional_bio: Optional[str] = None


class PhysiotherapistRead(BaseModel):
    id: UUID
    user_id: UUID
    qualification: str
    specialization: Optional[str] = None
    registration_number: str
    years_experience: int
    clinic_name: Optional[str] = None
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssignmentCreate(BaseModel):
    patient_id: UUID
    physiotherapist_id: UUID


class AssignmentRead(BaseModel):
    id: UUID
    patient_id: UUID
    physiotherapist_id: UUID
    status: str
    assigned_at: datetime

    class Config:
        from_attributes = True


class AssignmentUpdate(BaseModel):
    status: Literal["ACTIVE", "ENDED"]


class ExerciseCreate(BaseModel):
    name: str
    target_joint: str
    min_angle_threshold: Optional[float] = None
    max_angle_threshold: Optional[float] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = None
    is_active: bool = True


class ExerciseRead(BaseModel):
    id: UUID
    name: str
    target_joint: str
    min_angle_threshold: Optional[float] = None
    max_angle_threshold: Optional[float] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    target_joint: Optional[str] = None
    min_angle_threshold: Optional[float] = None
    max_angle_threshold: Optional[float] = None
    instructions: Optional[str] = None
    video_url: Optional[str] = None
    is_active: Optional[bool] = None


class PrescriptionCreate(BaseModel):
    patient_id: UUID
    physiotherapist_id: UUID
    exercise_id: UUID
    target_reps: int = 10
    target_sets: int = 3
    is_active: bool = True


class PrescriptionRead(BaseModel):
    id: UUID
    patient_id: UUID
    physiotherapist_id: UUID
    exercise_id: UUID
    target_reps: int
    target_sets: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PrescriptionUpdate(BaseModel):
    target_reps: Optional[int] = None
    target_sets: Optional[int] = None
    is_active: Optional[bool] = None


class RehabSessionCreate(BaseModel):
    patient_id: UUID
    prescription_id: UUID
    started_at: datetime
    client_session_id: Optional[UUID] = None


class RehabSessionRead(BaseModel):
    id: UUID
    patient_id: UUID
    prescription_id: UUID
    status: SessionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    synced_at: Optional[datetime] = None
    client_session_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class SessionSummaryRead(BaseModel):
    id: UUID
    patient_id: UUID
    prescription_id: UUID
    exercise_id: UUID
    exercise_name: str
    target_joint: str
    target_reps: int
    target_sets: int
    status: SessionStatus
    started_at: datetime
    completed_at: Optional[datetime] = None
    rep_count: int
    assessed_count: int
    unable_count: int
    avg_rom: Optional[float] = None
    best_rom: Optional[float] = None
    avg_confidence: Optional[float] = None
    last_rep_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RepMetricCreate(BaseModel):
    session_id: UUID
    rep_number: Optional[int] = None
    set_number: Optional[int] = None
    assessment_status: AssessmentStatus
    range_of_motion: Optional[float] = None
    confidence: Optional[float] = None
    movement_data: Optional[dict] = None
    compensation_flags: Optional[dict] = None
    detected_issues: Optional[Any] = None
    feedback: Optional[str] = None


class RepMetricRead(BaseModel):
    id: UUID
    session_id: UUID
    rep_number: int
    set_number: int
    assessment_status: AssessmentStatus
    range_of_motion: Optional[float]
    confidence: Optional[float]
    movement_data: Optional[dict]
    compensation_flags: Optional[dict]
    detected_issues: Optional[Any]
    feedback: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
