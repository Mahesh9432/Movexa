
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.models.patient_therapist_assignment import (
    PatientTherapistAssignment,
)

from app.schemas.user import UserUpdate
from app.schemas.patient import PatientUpdate
from app.schemas.physiotherapist import PhysiotherapistUpdate


def _get_assigned_physiotherapist(db: Session, patient: Patient):
    """
    Return the patient's currently active physiotherapist details.

    Returns None when the patient has no active assignment
    or when the related records are unavailable.
    """

    assignment = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )

    if assignment is None:
        return None

    if not getattr(assignment, "physiotherapist_id", None):
        return None

    physiotherapist = (
        db.query(Physiotherapist)
        .filter(
            Physiotherapist.id == assignment.physiotherapist_id
        )
        .first()
    )

    if physiotherapist is None:
        return None

    physiotherapist_user = (
        db.query(User)
        .filter(User.id == physiotherapist.user_id)
        .first()
    )

    if physiotherapist_user is None:
        return None

    return {
        "id": str(physiotherapist.id),
        "full_name": physiotherapist_user.full_name,
        "qualification": physiotherapist.qualification,
        "specialization": physiotherapist.specialization,
        "clinic_name": physiotherapist.clinic_name,
        "phone_number": physiotherapist_user.phone_number,
        "assignment_status": assignment.status,
    }


def get_patient_profile(db: Session, user: User):
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user.id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return {
        "user": user,
        "profile": patient,
        "assigned_physiotherapist": _get_assigned_physiotherapist(
            db,
            patient,
        ),
    }


def update_patient_profile(
    db: Session,
    user: User,
    user_data: UserUpdate,
    profile_data: PatientUpdate,
):
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user.id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    user_updates = user_data.model_dump(exclude_unset=True)
    profile_updates = profile_data.model_dump(exclude_unset=True)

    if "full_name" in user_updates:
        if user_updates["full_name"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be null",
            )

        user.full_name = user_updates["full_name"].strip()

        if not user.full_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be empty",
            )

    if "phone_number" in user_updates:
        user.phone_number = user_updates["phone_number"]

    for field, value in profile_updates.items():
        setattr(patient, field, value)

    try:
        db.commit()
        db.refresh(user)
        db.refresh(patient)
    except Exception:
        db.rollback()
        raise

    return {
        "user": user,
        "profile": patient,
        "assigned_physiotherapist": _get_assigned_physiotherapist(
            db,
            patient,
        ),
    }


def get_physiotherapist_profile(db: Session, user: User):
    physiotherapist = (
        db.query(Physiotherapist)
        .filter(Physiotherapist.user_id == user.id)
        .first()
    )

    if physiotherapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physiotherapist profile not found",
        )

    return {
        "user": user,
        "profile": physiotherapist,
    }


def update_physiotherapist_profile(
    db: Session,
    user: User,
    user_data: UserUpdate,
    profile_data: PhysiotherapistUpdate,
):
    physiotherapist = (
        db.query(Physiotherapist)
        .filter(Physiotherapist.user_id == user.id)
        .first()
    )

    if physiotherapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physiotherapist profile not found",
        )

    user_updates = user_data.model_dump(exclude_unset=True)
    profile_updates = profile_data.model_dump(exclude_unset=True)

    if "full_name" in user_updates:
        if user_updates["full_name"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be null",
            )

        user.full_name = user_updates["full_name"].strip()

        if not user.full_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Full name cannot be empty",
            )

    if "phone_number" in user_updates:
        user.phone_number = user_updates["phone_number"]

    if (
        "qualification" in profile_updates
        and profile_updates["qualification"] is None
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Qualification cannot be null",
        )

    if (
        "years_experience" in profile_updates
        and profile_updates["years_experience"] is None
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Years of experience cannot be null",
        )

    for field, value in profile_updates.items():
        setattr(physiotherapist, field, value)

    try:
        db.commit()
        db.refresh(user)
        db.refresh(physiotherapist)
    except Exception:
        db.rollback()
        raise

    return {
        "user": user,
        "profile": physiotherapist,
    }
