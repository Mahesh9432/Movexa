from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PatientBase(BaseModel):
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    injury: str | None = None
    affected_area: str | None = Field(default=None, max_length=150)
    treatment_start_date: date | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_relationship: str | None = Field(default=None, max_length=50)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    injury: str | None = None
    affected_area: str | None = Field(default=None, max_length=150)
    treatment_start_date: date | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_relationship: str | None = Field(default=None, max_length=50)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
