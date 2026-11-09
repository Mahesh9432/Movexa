import pytest

from app.schemas.rep_metric import RepMetricsBatchCreate
from app.services import ai_metrics_adapter
from app.services.ai_metrics_adapter import (
    AIEngineIntegrationError,
    adapt_ai_result,
    save_ai_metrics,
)
from app.services.rep_metric_service import (
    DuplicateRepMetricError,
    InvalidMetricsSessionError,
)


def valid_ai_result():
    return {
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


def test_adapt_valid_ai_repetition_results():
    result = adapt_ai_result(valid_ai_result())

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
            {"repetitions_data": [repetition, repetition]}
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


def test_save_ai_metrics_validates_and_persists(
    monkeypatch,
):
    db = object()
    session = object()
    expected_records = [object(), object()]
    captured = {}

    def fake_save(db_arg, session_arg, metrics_data):
        captured["db"] = db_arg
        captured["session"] = session_arg
        captured["metrics_data"] = metrics_data
        return expected_records

    monkeypatch.setattr(
        ai_metrics_adapter,
        "save_rep_metrics",
        fake_save,
    )

    result = save_ai_metrics(db, session, valid_ai_result())

    assert result == expected_records
    assert captured["db"] is db
    assert captured["session"] is session
    assert isinstance(
        captured["metrics_data"],
        RepMetricsBatchCreate,
    )
    assert len(captured["metrics_data"].repetitions_data) == 2


def test_save_ai_metrics_rejects_aggregate_before_persistence(
    monkeypatch,
):
    called = False

    def fake_save(*args):
        nonlocal called
        called = True

    monkeypatch.setattr(
        ai_metrics_adapter,
        "save_rep_metrics",
        fake_save,
    )

    with pytest.raises(AIEngineIntegrationError):
        save_ai_metrics(
            object(),
            object(),
            {"repetitions": 10, "knee_angle": 90},
        )

    assert called is False


def test_save_ai_metrics_propagates_duplicate_error(
    monkeypatch,
):
    def fake_save(*args):
        raise DuplicateRepMetricError("Duplicate repetition")

    monkeypatch.setattr(
        ai_metrics_adapter,
        "save_rep_metrics",
        fake_save,
    )

    with pytest.raises(
        DuplicateRepMetricError,
        match="Duplicate repetition",
    ):
        save_ai_metrics(
            object(),
            object(),
            valid_ai_result(),
        )


def test_save_ai_metrics_propagates_invalid_session_error(
    monkeypatch,
):
    def fake_save(*args):
        raise InvalidMetricsSessionError(
            "Session is not in progress"
        )

    monkeypatch.setattr(
        ai_metrics_adapter,
        "save_rep_metrics",
        fake_save,
    )

    with pytest.raises(
        InvalidMetricsSessionError,
        match="Session is not in progress",
    ):
        save_ai_metrics(
            object(),
            object(),
            valid_ai_result(),
        )
