from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import AwareDatetime, BaseModel, ConfigDict


SessionStatus = Literal[
    "IN_PROGRESS",
    "COMPLETED",
    "INCOMPLETE",
    "UNABLE_TO_ASSESS",
]

TerminalSessionStatus = Literal[
    "COMPLETED",
    "INCOMPLETE",
    "UNABLE_TO_ASSESS",
]


class RehabSessionCreate(BaseModel):
    patient_id: UUID
    prescription_id: UUID
    client_session_id: UUID
    started_at: AwareDatetime


class RehabSessionFinish(BaseModel):
    status: TerminalSessionStatus
    completed_at: AwareDatetime | None = None


class RehabSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    prescription_id: UUID
    status: SessionStatus
    started_at: datetime
    completed_at: datetime | None
    synced_at: datetime | None
    client_session_id: UUID
    created_at: datetime
