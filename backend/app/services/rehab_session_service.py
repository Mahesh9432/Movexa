from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.prescription import Prescription
from app.models.rehab_session import RehabSession
from app.schemas.rehab_session import RehabSessionCreate, RehabSessionFinish


class SessionNotFoundError(Exception):
    pass


class SessionConflictError(Exception):
    pass


class InvalidSessionOperationError(Exception):
    pass


def start_session(
    db: Session,
    session_data: RehabSessionCreate,
) -> tuple[RehabSession, bool]:
    """
    Create a rehabilitation session.

    Returns:
        (session, created)
        created is False when an identical client_session_id already exists.
    """

    existing_session = (
        db.query(RehabSession)
        .filter(
            RehabSession.client_session_id == session_data.client_session_id
        )
        .first()
    )

    if existing_session:
        if (
            existing_session.patient_id != session_data.patient_id
            or existing_session.prescription_id != session_data.prescription_id
        ):
            raise SessionConflictError(
                "This client session ID is already associated with another session."
            )

        return existing_session, False

    prescription = (
        db.query(Prescription)
        .filter(Prescription.id == session_data.prescription_id)
        .first()
    )

    if prescription is None:
        raise SessionNotFoundError("Prescription not found.")

    if not prescription.is_active:
        raise InvalidSessionOperationError("Prescription is inactive.")

    if prescription.patient_id != session_data.patient_id:
        raise InvalidSessionOperationError(
            "Prescription does not belong to the specified patient."
        )

    session = RehabSession(
        patient_id=session_data.patient_id,
        prescription_id=session_data.prescription_id,
        client_session_id=session_data.client_session_id,
        status="IN_PROGRESS",
        started_at=session_data.started_at,
    )

    try:
        db.add(session)
        db.commit()
        db.refresh(session)
        return session, True

    except IntegrityError:
        db.rollback()

        # A concurrent retry may have created the same session.
        existing_session = (
            db.query(RehabSession)
            .filter(
                RehabSession.client_session_id
                == session_data.client_session_id
            )
            .first()
        )

        if existing_session:
            if (
                existing_session.patient_id != session_data.patient_id
                or existing_session.prescription_id
                != session_data.prescription_id
            ):
                raise SessionConflictError(
                    "This client session ID is already associated with another session."
                )

            return existing_session, False

        raise


def get_session(
    db: Session,
    session_id: UUID,
) -> RehabSession:
    session = (
        db.query(RehabSession)
        .filter(RehabSession.id == session_id)
        .first()
    )

    if session is None:
        raise SessionNotFoundError("Rehabilitation session not found.")

    return session


def finish_session(
    db: Session,
    session_id: UUID,
    finish_data: RehabSessionFinish,
) -> RehabSession:
    session = get_session(db, session_id)

    if session.status != "IN_PROGRESS":
        raise InvalidSessionOperationError(
            "Only an in-progress session can be finished."
        )

    completed_at = finish_data.completed_at or datetime.now(timezone.utc)

    if completed_at < session.started_at:
        raise InvalidSessionOperationError(
            "Completion time cannot be earlier than session start time."
        )

    session.status = finish_data.status
    session.completed_at = completed_at

    try:
        db.commit()
        db.refresh(session)
        return session
    except Exception:
        db.rollback()
        raise


def mark_session_synced(
    db: Session,
    session_id: UUID,
) -> RehabSession:
    session = get_session(db, session_id)

    if session.synced_at is None:
        session.synced_at = datetime.now(timezone.utc)

        try:
            db.commit()
            db.refresh(session)
        except Exception:
            db.rollback()
            raise

    return session
