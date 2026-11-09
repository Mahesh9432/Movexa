from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.models.patient_therapist_assignment import PatientTherapistAssignment
from app.models.prescription import Prescription
from app.models.user import User
from app.schemas.prescription import PrescriptionCreate, PrescriptionUpdate


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


def _get_patient_for_user(db: Session, user: User) -> Patient:
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

    return patient


def _get_physiotherapist_for_user(
    db: Session,
    user: User,
) -> Physiotherapist:
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


def list_prescriptions(db: Session, user: User):
    if user.role == "PATIENT":
        patient = _get_patient_for_user(db, user)

        return (
            db.query(Prescription)
            .filter(Prescription.patient_id == patient.id)
            .order_by(Prescription.created_at.desc())
            .all()
        )

    if user.role == "PHYSIOTHERAPIST":
        physiotherapist = _get_physiotherapist_for_user(db, user)

        return (
            db.query(Prescription)
            .filter(
                Prescription.physiotherapist_id == physiotherapist.id
            )
            .order_by(Prescription.created_at.desc())
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view prescriptions",
    )


def get_prescription(
    db: Session,
    user: User,
    prescription_id: UUID,
) -> Prescription:
    prescription = (
        db.query(Prescription)
        .filter(Prescription.id == prescription_id)
        .first()
    )

    if prescription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found",
        )

    if user.role == "PATIENT":
        patient = _get_patient_for_user(db, user)

        if prescription.patient_id != patient.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found",
            )

        return prescription

    if user.role == "PHYSIOTHERAPIST":
        physiotherapist = _get_physiotherapist_for_user(db, user)

        if prescription.physiotherapist_id != physiotherapist.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Prescription not found",
            )

        return prescription

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to view this prescription",
    )


def create_prescription(
    db: Session,
    user: User,
    data: PrescriptionCreate,
) -> Prescription:
    physiotherapist = _get_physiotherapist_for_user(db, user)

    if data.physiotherapist_id != physiotherapist.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot create a prescription on behalf of another physiotherapist",
        )

    patient = _get_patient(db, data.patient_id)

    exercise = (
        db.query(Exercise)
        .filter(
            Exercise.id == data.exercise_id,
            Exercise.is_active.is_(True),
        )
        .first()
    )

    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active exercise not found",
        )

    assignment = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient.id,
            PatientTherapistAssignment.physiotherapist_id
            == physiotherapist.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An active patient assignment is required to create a prescription",
        )

    prescription = Prescription(
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        exercise_id=exercise.id,
        target_reps=data.target_reps,
        target_sets=data.target_sets,
        is_active=data.is_active,
    )

    try:
        db.add(prescription)
        db.commit()
        db.refresh(prescription)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create prescription",
        )
    except Exception:
        db.rollback()
        raise

    return prescription


def update_prescription(
    db: Session,
    user: User,
    prescription_id: UUID,
    data: PrescriptionUpdate,
) -> Prescription:
    prescription = get_prescription(db, user, prescription_id)
    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if value is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field} cannot be null",
            )

        setattr(prescription, field, value)

    try:
        db.commit()
        db.refresh(prescription)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update prescription",
        )
    except Exception:
        db.rollback()
        raise

    return prescription
