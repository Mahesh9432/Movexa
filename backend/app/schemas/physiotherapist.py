from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PhysiotherapistBase(BaseModel):
    qualification: str = Field(min_length=1, max_length=150)
    specialization: str | None = Field(default=None, max_length=150)
    registration_number: str = Field(min_length=1, max_length=100)
    years_experience: int = Field(default=0, ge=0)
    clinic_name: str | None = Field(default=None, max_length=150)
    clinic_address: str | None = None
    professional_bio: str | None = None


class PhysiotherapistCreate(PhysiotherapistBase):
    pass


class PhysiotherapistUpdate(BaseModel):
    qualification: str | None = Field(default=None, min_length=1, max_length=150)
    specialization: str | None = Field(default=None, max_length=150)
    years_experience: int | None = Field(default=None, ge=0)
    clinic_name: str | None = Field(default=None, max_length=150)
    clinic_address: str | None = None
    professional_bio: str | None = None


class PhysiotherapistResponse(PhysiotherapistBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    verification_status: str
    created_at: datetime
    updated_at: datetime
