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


def _adapt_individual_repetitions(
    ai_result: Mapping[str, Any],
) -> list[dict[str, Any]]:
    repetitions = ai_result.get("individual_repetitions")

    if not isinstance(repetitions, list):
        raise AIEngineIntegrationError(
            "AI result must contain an individual_repetitions list"
        )

    if not repetitions:
        raise AIEngineIntegrationError(
            "AI result contains no per-repetition measurements"
        )

    compensation_issues = ai_result.get("compensation_issues", [])

    if not isinstance(compensation_issues, list):
        raise AIEngineIntegrationError(
            "AI compensation_issues must be a list"
        )

    adapted = []

    for repetition in repetitions:
        if not isinstance(repetition, Mapping):
            raise AIEngineIntegrationError(
                "Each AI repetition must be a mapping"
            )

        status = repetition.get("assessment_status")
        rom = repetition.get("rom_degrees")

        movement_data = {
            "min_knee_angle": repetition.get("min_knee_angle"),
            "max_knee_angle": repetition.get("max_knee_angle"),
            "rom_degrees": rom,
            "duration_seconds": repetition.get("duration_seconds"),
            "sample_count": repetition.get("sample_count"),
        }

        if compensation_issues:
            movement_data["session_level"] = {
                "compensation_issues": compensation_issues
            }

        adapted.append(
            {
                "rep_number": repetition.get("rep_number"),
                "assessment_status": status,
                "range_of_motion": (
                    rom if status == "ASSESSED" else None
                ),
                "confidence": None,
                "movement_data": movement_data,
                "compensation_flags": None,
                "detected_issues": None,
                "feedback": None,
            }
        )

    return adapted


def adapt_ai_result(
    ai_result: Mapping[str, Any],
) -> RepMetricsBatchCreate:
    """
    Adapt and validate per-repetition AI output.

    Supports both the backend repetitions_data contract and the
    AI engine individual_repetitions format.
    """

    if not isinstance(ai_result, Mapping):
        raise AIEngineIntegrationError(
            "AI result must be a mapping containing per-repetition data"
        )

    if "repetitions_data" in ai_result:
        repetitions_data = ai_result["repetitions_data"]

        if not isinstance(repetitions_data, list):
            raise AIEngineIntegrationError(
                "AI result must contain a repetitions_data list"
            )

        if not repetitions_data:
            raise AIEngineIntegrationError(
                "AI result contains no per-repetition measurements"
            )

    elif "individual_repetitions" in ai_result:
        repetitions_data = _adapt_individual_repetitions(ai_result)

    else:
        raise AIEngineIntegrationError(
            "AI result must contain a repetitions_data list "
            "or individual_repetitions list"
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
    Validate and persist per-repetition AI results through the
    existing persistence service.
    """

    metrics_data = adapt_ai_result(ai_result)

    return save_rep_metrics(db, session, metrics_data)
