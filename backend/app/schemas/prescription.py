from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PrescriptionCreate(BaseModel):
    patient_id: UUID
    physiotherapist_id: UUID
    exercise_id: UUID
    target_reps: int = Field(default=10, gt=0)
    target_sets: int = Field(default=3, gt=0)
    is_active: bool = True


class PrescriptionUpdate(BaseModel):
    target_reps: int | None = Field(default=None, gt=0)
    target_sets: int | None = Field(default=None, gt=0)
    is_active: bool | None = None


class PrescriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    physiotherapist_id: UUID
    exercise_id: UUID
    target_reps: int
    target_sets: int
    is_active: bool
    created_at: datetime
