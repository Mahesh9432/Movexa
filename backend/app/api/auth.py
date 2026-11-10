from datetime import date
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import create_access_token
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.physiotherapist import Physiotherapist
from app.schemas.auth import (
    PatientRegister,
    PhysiotherapistRegister,
    LoginRequest,
    AuthUserResponse,
    TokenResponse,
)
from app.services.auth_service import (
    register_patient,
    register_physiotherapist,
    authenticate_user,
)


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def build_auth_user(db: Session, user: User) -> AuthUserResponse:
    verification_status = None

    if user.role == "PHYSIOTHERAPIST":
        profile = (
            db.query(Physiotherapist)
            .filter(Physiotherapist.user_id == user.id)
            .first()
        )

        verification_status = (
            profile.verification_status if profile else "PENDING"
        )

    return AuthUserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        verification_status=verification_status,
    )


def build_token_response(
    db: Session,
    user: User,
    token: str,
) -> TokenResponse:
    return TokenResponse(
        access_token=token,
        user=build_auth_user(db, user),
    )


@router.post(
    "/register/patient",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def patient_registration(
    data: PatientRegister,
    db: Session = Depends(get_db),
):
    user = register_patient(db, data)
    token = create_access_token(user.id, user.role)

    return build_token_response(db, user, token)


@router.post(
    "/register/physiotherapist",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def physiotherapist_registration(
    data: PhysiotherapistRegister,
    db: Session = Depends(get_db),
):
    user = register_physiotherapist(db, data)
    token = create_access_token(user.id, user.role)

    return build_token_response(db, user, token)


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user, token = authenticate_user(db, data)

    return build_token_response(db, user, token)


@router.get("/me", response_model=AuthUserResponse)
def get_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_auth_user(db, current_user)
