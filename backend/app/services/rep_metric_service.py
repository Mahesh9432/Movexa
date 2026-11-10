from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.rep_metric import RepMetric
from app.models.rehab_session import RehabSession
from app.schemas.rep_metric import RepMetricsBatchCreate


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
