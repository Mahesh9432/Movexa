from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PatientRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone_number: str | None = Field(default=None, max_length=20)

    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=30)
    injury: str | None = None
    affected_area: str | None = Field(default=None, max_length=150)
    treatment_start_date: date | None = None
    emergency_contact_name: str | None = Field(default=None, max_length=100)
    emergency_contact_relationship: str | None = Field(default=None, max_length=50)
    emergency_contact_phone: str | None = Field(default=None, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class PhysiotherapistRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone_number: str | None = Field(default=None, max_length=20)

    qualification: str = Field(min_length=2, max_length=150)
    specialization: str | None = Field(default=None, max_length=150)
    registration_number: str = Field(min_length=1, max_length=100)
    years_experience: int = Field(default=0, ge=0)
    clinic_name: str | None = Field(default=None, max_length=150)
    clinic_address: str | None = None
    professional_bio: str | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()

    @field_validator("registration_number")
    @classmethod
    def normalize_registration_number(cls, value: str) -> str:
        return value.strip().upper()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).lower()


class AuthUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    role: Literal["PATIENT", "PHYSIOTHERAPIST"]
    verification_status: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
