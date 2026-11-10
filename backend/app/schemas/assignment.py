from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


AssignmentStatus = Literal["ACTIVE", "ENDED"]


class AssignmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patient_id: UUID


class AssignmentEnd(BaseModel):
    ended_at: datetime | None = None


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    physiotherapist_id: UUID
    status: AssignmentStatus
    assigned_at: datetime
    ended_at: datetime | None
    created_at: datetime
