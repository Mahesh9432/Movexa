
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.schemas.auth import PatientRegister, PhysiotherapistRegister, LoginRequest


def _check_duplicate_email(db: Session, email: str):
    existing = db.query(User).filter(User.email == email).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )


def register_patient(db: Session, data: PatientRegister):
    _check_duplicate_email(db, str(data.email))

    user = User(
        full_name=data.full_name.strip(),
        email=str(data.email),
        hashed_password=hash_password(data.password),
        phone_number=data.phone_number,
        role="PATIENT",
    )

    patient = Patient(
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        injury=data.injury,
        affected_area=data.affected_area,
        treatment_start_date=data.treatment_start_date,
        emergency_contact_name=data.emergency_contact_name,
        emergency_contact_relationship=data.emergency_contact_relationship,
        emergency_contact_phone=data.emergency_contact_phone,
    )

    try:
        db.add(user)
        db.flush()

        patient.user_id = user.id
        db.add(patient)
        db.commit()
        db.refresh(user)

        return user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create patient account because of a conflicting record",
        )


def register_physiotherapist(
    db: Session,
    data: PhysiotherapistRegister,
):
    _check_duplicate_email(db, str(data.email))

    existing_registration = (
        db.query(Physiotherapist)
        .filter(
            Physiotherapist.registration_number
            == data.registration_number
        )
        .first()
    )

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This professional registration number is already registered",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=str(data.email),
        hashed_password=hash_password(data.password),
        phone_number=data.phone_number,
        role="PHYSIOTHERAPIST",
    )

    physiotherapist = Physiotherapist(
        qualification=data.qualification,
        specialization=data.specialization,
        registration_number=data.registration_number,
        years_experience=data.years_experience,
        clinic_name=data.clinic_name,
        clinic_address=data.clinic_address,
        professional_bio=data.professional_bio,
        verification_status="PENDING",
    )

    try:
        db.add(user)
        db.flush()

        physiotherapist.user_id = user.id
        db.add(physiotherapist)
        db.commit()
        db.refresh(user)

        return user

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create physiotherapist account because of a conflicting record",
        )


def authenticate_user(db: Session, data: LoginRequest):
    user = (
        db.query(User)
        .filter(User.email == str(data.email))
        .first()
    )

    if not user or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated",
        )

    token = create_access_token(user.id, user.role)

    return user, token
