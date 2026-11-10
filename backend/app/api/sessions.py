from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import AwareDatetime, BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.database.connection import get_db
from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.models.patient_therapist_assignment import PatientTherapistAssignment
from app.models.user import User
from app.schemas.rehab_session import (
    RehabSessionCreate,
    RehabSessionFinish,
    RehabSessionResponse,
)
from app.services.rehab_session_service import (
    InvalidSessionOperationError,
    SessionConflictError,
    SessionNotFoundError,
    finish_session,
    get_session,
    mark_session_synced,
    start_session,
)


router = APIRouter(prefix="/api", tags=["Sessions"])


class SessionStartRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prescription_id: UUID
    client_session_id: UUID
    started_at: AwareDatetime


def _get_patient(db: Session, user: User) -> Patient:
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user.id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found",
        )

    return patient


def _get_owned_session(
    db: Session,
    session_id: UUID,
    user: User,
):
    try:
        session = get_session(db, session_id)
    except SessionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Rehabilitation session not found",
        )

    if user.role == "PATIENT":
        patient = _get_patient(db, user)

        if session.patient_id != patient.id:
            raise HTTPException(
                status_code=404,
                detail="Rehabilitation session not found",
            )

        return session

    if user.role == "PHYSIOTHERAPIST":
        physiotherapist = (
            db.query(Physiotherapist)
            .filter(Physiotherapist.user_id == user.id)
            .first()
        )

        if physiotherapist is None:
            raise HTTPException(
                status_code=404,
                detail="Physiotherapist profile not found",
            )

        assignment = (
            db.query(PatientTherapistAssignment)
            .filter(
                PatientTherapistAssignment.patient_id == session.patient_id,
                PatientTherapistAssignment.physiotherapist_id
                == physiotherapist.id,
                PatientTherapistAssignment.status == "ACTIVE",
            )
            .first()
        )

        if assignment is None:
            raise HTTPException(
                status_code=403,
                detail="You do not have an active assignment for this patient",
            )

        return session

    raise HTTPException(
        status_code=403,
        detail="You do not have permission to access rehabilitation sessions",
    )


@router.post(
    "/sessions",
    response_model=RehabSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    data: SessionStartRequest,
    response: Response,
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    patient = _get_patient(db, current_user)

    session_data = RehabSessionCreate(
        patient_id=patient.id,
        prescription_id=data.prescription_id,
        client_session_id=data.client_session_id,
        started_at=data.started_at,
    )

    try:
        session, created = start_session(db, session_data)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except SessionConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except InvalidSessionOperationError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    response.status_code = (
        status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )

    return session


@router.get(
    "/sessions/{session_id}",
    response_model=RehabSessionResponse,
)
def read_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_session(db, session_id, current_user)


@router.patch(
    "/sessions/{session_id}/complete",
    response_model=RehabSessionResponse,
)
def complete_session(
    session_id: UUID,
    data: RehabSessionFinish,
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, current_user)

    try:
        return finish_session(db, session.id, data)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except InvalidSessionOperationError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post(
    "/sessions/{session_id}/sync",
    response_model=RehabSessionResponse,
)
def sync_session(
    session_id: UUID,
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, current_user)

    try:
        return mark_session_synced(db, session.id)
    except SessionNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
