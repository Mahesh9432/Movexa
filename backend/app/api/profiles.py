
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.api.dependencies import require_role
from app.models.user import User

from app.schemas.user import UserUpdate, UserResponse
from app.schemas.patient import PatientUpdate, PatientResponse
from app.schemas.physiotherapist import (
    PhysiotherapistUpdate,
    PhysiotherapistResponse,
)

from app.services.profile_service import (
    get_patient_profile,
    update_patient_profile,
    get_physiotherapist_profile,
    update_physiotherapist_profile,
)


router = APIRouter(prefix="/api", tags=["Profiles"])


# RESPONSE SCHEMAS

class AssignedPhysiotherapistResponse(BaseModel):
    id: str
    full_name: str
    qualification: str
    specialization: str | None
    clinic_name: str | None
    phone_number: str | None
    assignment_status: str


class PatientProfileResponse(BaseModel):
    user: UserResponse
    profile: PatientResponse
    assigned_physiotherapist: AssignedPhysiotherapistResponse | None = None


class PhysiotherapistProfileResponse(BaseModel):
    user: UserResponse
    profile: PhysiotherapistResponse


# REQUEST SCHEMAS

class PatientProfileUpdate(UserUpdate, PatientUpdate):
    pass


class PhysiotherapistProfileUpdate(UserUpdate, PhysiotherapistUpdate):
    pass


# PATIENT PROFILE

@router.get(
    "/patients/me",
    response_model=PatientProfileResponse,
)
def read_patient_profile(
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    return get_patient_profile(db, current_user)


@router.patch(
    "/patients/me",
    response_model=PatientProfileResponse,
)
def edit_patient_profile(
    data: PatientProfileUpdate,
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)

    user_data = UserUpdate.model_validate(updates)
    profile_data = PatientUpdate.model_validate(updates)

    return update_patient_profile(
        db=db,
        user=current_user,
        user_data=user_data,
        profile_data=profile_data,
    )


# PHYSIOTHERAPIST PROFILE

@router.get(
    "/physiotherapists/me",
    response_model=PhysiotherapistProfileResponse,
)
def read_physiotherapist_profile(
    current_user: User = Depends(
        require_role("PHYSIOTHERAPIST")
    ),
    db: Session = Depends(get_db),
):
    return get_physiotherapist_profile(db, current_user)


@router.patch(
    "/physiotherapists/me",
    response_model=PhysiotherapistProfileResponse,
)
def edit_physiotherapist_profile(
    data: PhysiotherapistProfileUpdate,
    current_user: User = Depends(
        require_role("PHYSIOTHERAPIST")
    ),
    db: Session = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)

    user_data = UserUpdate.model_validate(updates)
    profile_data = PhysiotherapistUpdate.model_validate(updates)

    return update_physiotherapist_profile(
        db=db,
        user=current_user,
        user_data=user_data,
        profile_data=profile_data,
    )
