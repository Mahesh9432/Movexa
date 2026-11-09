from collections.abc import Mapping
from typing import Any

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.rehab_session import RehabSession
from app.models.rep_metric import RepMetric
from app.schemas.rep_metric import RepMetricsBatchCreate
from app.services.rep_metric_service import save_rep_metrics


class AIEngineIntegrationError(ValueError):
    """Raised when AI output does not match the backend metrics contract."""


def adapt_ai_result(
    ai_result: Mapping[str, Any],
) -> RepMetricsBatchCreate:
    """
    Validate genuine per-repetition AI output against the backend contract.

    Aggregate session summaries are intentionally not accepted.
    """

    if not isinstance(ai_result, Mapping):
        raise AIEngineIntegrationError(
            "AI result must be a mapping containing repetitions_data"
        )

    repetitions_data = ai_result.get("repetitions_data")

    if not isinstance(repetitions_data, list):
        raise AIEngineIntegrationError(
            "AI result must contain a repetitions_data list. "
            "Aggregate repetition counts cannot be used as "
            "individual repetition measurements."
        )

    if not repetitions_data:
        raise AIEngineIntegrationError(
            "AI result contains no per-repetition measurements"
        )

    try:
        return RepMetricsBatchCreate.model_validate(
            {"repetitions_data": repetitions_data}
        )
    except ValidationError as exc:
        raise AIEngineIntegrationError(
            f"AI repetition data failed backend validation: {exc}"
        ) from exc


def save_ai_metrics(
    db: Session,
    session: RehabSession,
    ai_result: Mapping[str, Any],
) -> list[RepMetric]:
    """
    Validate and persist per-repetition AI results.

    Uses the existing repetition-metric persistence service so that
    session-status checks, duplicate detection and transaction handling
    remain consistent across the application.
    """

    metrics_data = adapt_ai_result(ai_result)

    return save_rep_metrics(db, session, metrics_data)
