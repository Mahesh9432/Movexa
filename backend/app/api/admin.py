import secrets
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.models.physiotherapist import Physiotherapist
from app.models.user import User


router = APIRouter(prefix="/api/admin", tags=["Admin Verification"])


class VerificationUpdate(BaseModel):
    verification_status: Literal["VERIFIED", "REJECTED"]


class PendingPhysiotherapistResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    full_name: str
    email: str
    phone_number: str | None
    qualification: str
    specialization: str | None
    registration_number: str
    years_experience: int
    clinic_name: str | None
    clinic_address: str | None
    professional_bio: str | None
    verification_status: str


class VerificationResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    verification_status: str
    message: str


def require_admin_key(
    admin_key: str | None = Header(
        default=None,
        alias="X-Admin-Verification-Key",
    ),
):
    configured_key = settings.ADMIN_VERIFICATION_KEY

    if not configured_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin verification is not configured",
        )

    if not admin_key or not secrets.compare_digest(
        admin_key,
        configured_key,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid administrator verification key",
        )


@router.get(
    "/physiotherapists/pending",
    response_model=list[PendingPhysiotherapistResponse],
    dependencies=[Depends(require_admin_key)],
)
def list_pending_physiotherapists(
    db: Session = Depends(get_db),
):
    records = (
        db.query(Physiotherapist, User)
        .join(User, Physiotherapist.user_id == User.id)
        .filter(Physiotherapist.verification_status == "PENDING")
        .order_by(Physiotherapist.created_at.asc())
        .all()
    )

    return [
        PendingPhysiotherapistResponse(
            id=profile.id,
            user_id=profile.user_id,
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            qualification=profile.qualification,
            specialization=profile.specialization,
            registration_number=profile.registration_number,
            years_experience=profile.years_experience,
            clinic_name=profile.clinic_name,
            clinic_address=profile.clinic_address,
            professional_bio=profile.professional_bio,
            verification_status=profile.verification_status,
        )
        for profile, user in records
    ]


@router.patch(
    "/physiotherapists/{physiotherapist_id}/verify",
    response_model=VerificationResponse,
    dependencies=[Depends(require_admin_key)],
)
def update_physiotherapist_verification(
    physiotherapist_id: UUID,
    data: VerificationUpdate,
    db: Session = Depends(get_db),
):
    record = (
        db.query(Physiotherapist, User)
        .join(User, Physiotherapist.user_id == User.id)
        .filter(Physiotherapist.id == physiotherapist_id)
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physiotherapist not found",
        )

    profile, user = record

    if profile.verification_status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending physiotherapist applications can be reviewed",
        )

    profile.verification_status = data.verification_status

    db.commit()
    db.refresh(profile)

    action = (
        "approved"
        if data.verification_status == "VERIFIED"
        else "rejected"
    )

    return VerificationResponse(
        id=profile.id,
        full_name=user.full_name,
        email=user.email,
        verification_status=profile.verification_status,
        message=f"Physiotherapist application {action} successfully",
    )
