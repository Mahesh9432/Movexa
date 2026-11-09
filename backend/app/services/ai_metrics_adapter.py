from collections.abc import Mapping
from typing import Any

from pydantic import ValidationError

from app.schemas.rep_metric import RepMetricsBatchCreate


class AIEngineIntegrationError(ValueError):
    """Raised when AI output does not match the backend metrics contract."""


def adapt_ai_result(
    ai_result: Mapping[str, Any],
) -> RepMetricsBatchCreate:
    """
    Validate per-repetition AI output against the existing backend contract.

    Expected input:
    {
        "repetitions_data": [
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 85.5,
                "confidence": 0.92,
                "movement_data": {"knee_angle": 85.5},
                "compensation_flags": {},
                "detected_issues": [],
                "feedback": "Good movement"
            }
        ]
    }

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
