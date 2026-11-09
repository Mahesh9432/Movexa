import pytest

from app.schemas.rep_metric import RepMetricsBatchCreate
from app.services.ai_metrics_adapter import (
    AIEngineIntegrationError,
    adapt_ai_result,
)


def test_adapt_valid_ai_repetition_results():
    ai_result = {
        "repetitions_data": [
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 85.5,
                "confidence": 0.92,
                "movement_data": {"knee_angle": 85.5},
                "compensation_flags": {"forward_lean": False},
                "detected_issues": [],
                "feedback": "Good movement",
            },
            {
                "rep_number": 2,
                "assessment_status": "UNABLE_TO_ASSESS",
                "range_of_motion": None,
                "confidence": 0.25,
                "movement_data": {},
                "compensation_flags": {},
                "detected_issues": ["Landmarks not visible"],
                "feedback": "Unable to assess this repetition",
            },
        ]
    }

    result = adapt_ai_result(ai_result)

    assert isinstance(result, RepMetricsBatchCreate)
    assert len(result.repetitions_data) == 2
    assert result.repetitions_data[0].rep_number == 1
    assert result.repetitions_data[0].range_of_motion == 85.5
    assert (
        result.repetitions_data[1].assessment_status
        == "UNABLE_TO_ASSESS"
    )
    assert result.repetitions_data[1].range_of_motion is None


def test_rejects_aggregate_ai_result():
    ai_result = {
        "exercise": "squat",
        "repetitions": 10,
        "current_phase": "standing",
        "knee_angle": 172.5,
        "feedback": "Good movement",
        "session_summary": {
            "total_reps": 10,
            "duration_seconds": 45,
            "reps_per_minute": 13.33,
        },
    }

    with pytest.raises(
        AIEngineIntegrationError,
        match="repetitions_data list",
    ):
        adapt_ai_result(ai_result)


def test_rejects_empty_repetition_list():
    with pytest.raises(
        AIEngineIntegrationError,
        match="no per-repetition measurements",
    ):
        adapt_ai_result({"repetitions_data": []})


def test_rejects_duplicate_repetition_numbers():
    repetition = {
        "rep_number": 1,
        "assessment_status": "ASSESSED",
        "range_of_motion": 85.5,
        "confidence": 0.92,
    }

    with pytest.raises(
        AIEngineIntegrationError,
        match="backend validation",
    ):
        adapt_ai_result(
            {
                "repetitions_data": [
                    repetition,
                    repetition,
                ]
            }
        )


def test_rejects_invalid_confidence():
    with pytest.raises(
        AIEngineIntegrationError,
        match="backend validation",
    ):
        adapt_ai_result(
            {
                "repetitions_data": [
                    {
                        "rep_number": 1,
                        "assessment_status": "ASSESSED",
                        "range_of_motion": 85.5,
                        "confidence": 1.5,
                    }
                ]
            }
        )


def test_rejects_rom_for_unable_to_assess():
    with pytest.raises(
        AIEngineIntegrationError,
        match="backend validation",
    ):
        adapt_ai_result(
            {
                "repetitions_data": [
                    {
                        "rep_number": 1,
                        "assessment_status": "UNABLE_TO_ASSESS",
                        "range_of_motion": 45.0,
                    }
                ]
            }
        )
