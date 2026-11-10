from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.models.patient_therapist_assignment import (
    PatientTherapistAssignment,
)
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentEnd


def _get_physiotherapist(db: Session, user: User) -> Physiotherapist:
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

    return physiotherapist


def _get_patient(db: Session, patient_id: UUID) -> Patient:
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return patient


def create_assignment(
    db: Session,
    user: User,
    assignment_data: AssignmentCreate,
):
    physiotherapist = _get_physiotherapist(db, user)
    patient = _get_patient(db, assignment_data.patient_id)

    existing_assignment = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )

    if existing_assignment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient already has an active physiotherapist assignment",
        )

    assignment = PatientTherapistAssignment(
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
    )

    try:
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Patient already has an active physiotherapist assignment",
        )

    return assignment


def get_patient_active_assignment(
    db: Session,
    user: User,
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

    return (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )


def end_assignment(
    db: Session,
    user: User,
    assignment_id: UUID,
    end_data: AssignmentEnd | None = None,
):
    physiotherapist = _get_physiotherapist(db, user)

    assignment = (
        db.query(PatientTherapistAssignment)
        .filter(PatientTherapistAssignment.id == assignment_id)
        .first()
    )

    if (
        assignment is None
        or assignment.physiotherapist_id != physiotherapist.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    if assignment.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Assignment has already ended",
        )

    ended_at = (
        end_data.ended_at
        if end_data is not None and end_data.ended_at is not None
        else datetime.now(timezone.utc)
    )

    assigned_at = assignment.assigned_at

    if assigned_at is not None:
        if assigned_at.tzinfo is None:
            assigned_at = assigned_at.replace(tzinfo=timezone.utc)

        if ended_at.tzinfo is None:
            ended_at = ended_at.replace(tzinfo=timezone.utc)

        if ended_at < assigned_at:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="End time cannot be earlier than assignment time",
            )

    assignment.status = "ENDED"
    assignment.ended_at = ended_at

    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to end this assignment",
        )

    return assignment
