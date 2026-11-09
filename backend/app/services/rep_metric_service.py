from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.rep_metric import RepMetric
from app.models.rehab_session import RehabSession
from app.schemas.rep_metric import (
    RepMetricCreate,
    RepMetricsBatchCreate,
)


class DuplicateRepMetricError(Exception):
    pass


class InvalidMetricsSessionError(Exception):
    pass


def save_rep_metrics(
    db: Session,
    session: RehabSession,
    metrics_data: RepMetricsBatchCreate,
) -> list[RepMetric]:

    if session.status != "IN_PROGRESS":
        raise InvalidMetricsSessionError(
            "Metrics can only be added to an in-progress session"
        )

    rep_numbers = [
        item.rep_number for item in metrics_data.repetitions_data
    ]

    existing_metrics = (
        db.query(RepMetric)
        .filter(
            RepMetric.session_id == session.id,
            RepMetric.rep_number.in_(rep_numbers),
        )
        .all()
    )

    if existing_metrics:
        raise DuplicateRepMetricError(
            "One or more repetition numbers have already been recorded"
        )

    records = [
        RepMetric(
            session_id=session.id,
            rep_number=item.rep_number,
            assessment_status=item.assessment_status,
            range_of_motion=item.range_of_motion,
            confidence=item.confidence,
            movement_data=item.movement_data,
            compensation_flags=item.compensation_flags,
            detected_issues=item.detected_issues,
            feedback=item.feedback,
        )
        for item in metrics_data.repetitions_data
    ]

    try:
        db.add_all(records)
        db.commit()

        for record in records:
            db.refresh(record)

        return records

    except IntegrityError as exc:
        db.rollback()
        raise DuplicateRepMetricError(
            "One or more repetition numbers have already been recorded"
        ) from exc

    except Exception:
        db.rollback()
        raise


def sync_session_metrics(
    db: Session,
    session: RehabSession,
    repetitions_data: list[RepMetricCreate],
) -> RehabSession:
    """
    Persist offline repetition metrics and the session sync timestamp
    in one database transaction.

    Identical existing repetitions are accepted.
    Conflicting existing repetitions are rejected.
    Missing repetitions are inserted.
    """

    if session.status == "IN_PROGRESS":
        raise InvalidMetricsSessionError(
            "Only a completed session can be synchronized"
        )

    rep_numbers = [
        item.rep_number for item in repetitions_data
    ]

    existing_metrics = []

    if rep_numbers:
        existing_metrics = (
            db.query(RepMetric)
            .filter(
                RepMetric.session_id == session.id,
                RepMetric.rep_number.in_(rep_numbers),
            )
            .all()
        )

    existing_by_number = {
        metric.rep_number: metric
        for metric in existing_metrics
    }

    fields_to_compare = (
        "assessment_status",
        "range_of_motion",
        "confidence",
        "movement_data",
        "compensation_flags",
        "detected_issues",
        "feedback",
    )

    new_records = []

    for item in repetitions_data:
        existing = existing_by_number.get(item.rep_number)

        if existing is not None:
            incoming_data = item.model_dump()

            is_identical = all(
                getattr(existing, field) == incoming_data[field]
                for field in fields_to_compare
            )

            if not is_identical:
                raise DuplicateRepMetricError(
                    f"Repetition {item.rep_number} already exists "
                    "with different data"
                )

            continue

        new_records.append(
            RepMetric(
                session_id=session.id,
                rep_number=item.rep_number,
                assessment_status=item.assessment_status,
                range_of_motion=item.range_of_motion,
                confidence=item.confidence,
                movement_data=item.movement_data,
                compensation_flags=item.compensation_flags,
                detected_issues=item.detected_issues,
                feedback=item.feedback,
            )
        )

    try:
        if new_records:
            db.add_all(new_records)

        session.synced_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(session)

        for record in new_records:
            db.refresh(record)

        return session

    except IntegrityError as exc:
        db.rollback()
        raise DuplicateRepMetricError(
            "A repetition conflict occurred during synchronization"
        ) from exc

    except Exception:
        db.rollback()
        raise


def get_rep_metrics(
    db: Session,
    session_id: UUID,
) -> list[RepMetric]:

    return (
        db.query(RepMetric)
        .filter(RepMetric.session_id == session_id)
        .order_by(RepMetric.rep_number.asc())
        .all()
    )