from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.rep_metric import RepMetric
from app.schemas.rep_metric import OfflineSessionSyncRequest
from app.services.rep_metric_service import (
    DuplicateRepMetricError,
    InvalidMetricsSessionError,
    sync_session_metrics,
)


@pytest.fixture
def completed_session():
    return SimpleNamespace(
        id=uuid4(),
        status="COMPLETED",
        synced_at=None,
    )


@pytest.fixture
def offline_data():
    return OfflineSessionSyncRequest(
        repetitions_data=[
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
                "detected_issues": [],
                "feedback": "Landmarks not visible",
            },
        ]
    )


def configure_existing_metrics(db, records):
    query = MagicMock()
    query.filter.return_value.all.return_value = records
    db.query.return_value = query


def test_sync_saves_new_metrics_and_timestamp(
    completed_session, offline_data
):
    db = MagicMock()
    configure_existing_metrics(db, [])

    result = sync_session_metrics(
        db, completed_session, offline_data.repetitions_data
    )

    assert result is completed_session
    assert completed_session.synced_at is not None
    assert len(db.add_all.call_args.args[0]) == 2
    assert db.commit.call_count == 1
    assert db.refresh.call_count == 3
    db.rollback.assert_not_called()


def test_sync_accepts_identical_existing_repetitions(
    completed_session, offline_data
):
    db = MagicMock()

    existing_records = [
        RepMetric(
            session_id=completed_session.id,
            rep_number=item.rep_number,
            assessment_status=item.assessment_status,
            range_of_motion=item.range_of_motion,
            confidence=item.confidence,
            movement_data=item.movement_data,
            compensation_flags=item.compensation_flags,
            detected_issues=item.detected_issues,
            feedback=item.feedback,
        )
        for item in offline_data.repetitions_data
    ]

    configure_existing_metrics(db, existing_records)

    result = sync_session_metrics(
        db, completed_session, offline_data.repetitions_data
    )

    assert result is completed_session
    assert completed_session.synced_at is not None
    db.add_all.assert_not_called()
    db.commit.assert_called_once()
    db.rollback.assert_not_called()


def test_sync_rejects_conflicting_existing_repetition(
    completed_session, offline_data
):
    db = MagicMock()

    existing = SimpleNamespace(
        rep_number=1,
        assessment_status="ASSESSED",
        range_of_motion=70.0,
        confidence=0.92,
        movement_data={"knee_angle": 70.0},
        compensation_flags={"forward_lean": False},
        detected_issues=[],
        feedback="Different movement",
    )

    configure_existing_metrics(db, [existing])

    with pytest.raises(
        DuplicateRepMetricError,
        match="already exists with different data",
    ):
        sync_session_metrics(
            db, completed_session, offline_data.repetitions_data
        )

    db.add_all.assert_not_called()
    db.commit.assert_not_called()


def test_sync_inserts_missing_repetitions_only(
    completed_session, offline_data
):
    db = MagicMock()

    existing = SimpleNamespace(
        rep_number=1,
        assessment_status="ASSESSED",
        range_of_motion=85.5,
        confidence=0.92,
        movement_data={"knee_angle": 85.5},
        compensation_flags={"forward_lean": False},
        detected_issues=[],
        feedback="Good movement",
    )

    configure_existing_metrics(db, [existing])

    sync_session_metrics(
        db, completed_session, offline_data.repetitions_data
    )

    inserted_records = db.add_all.call_args.args[0]

    assert len(inserted_records) == 1
    assert inserted_records[0].rep_number == 2
    db.commit.assert_called_once()


def test_sync_accepts_empty_batch(completed_session):
    db = MagicMock()

    sync_session_metrics(db, completed_session, [])

    assert completed_session.synced_at is not None
    db.query.assert_not_called()
    db.add_all.assert_not_called()
    db.commit.assert_called_once()


def test_sync_rejects_in_progress_session(offline_data):
    db = MagicMock()

    session = SimpleNamespace(
        id=uuid4(),
        status="IN_PROGRESS",
        synced_at=None,
    )

    with pytest.raises(
        InvalidMetricsSessionError,
        match="Only a completed session",
    ):
        sync_session_metrics(
            db, session, offline_data.repetitions_data
        )

    db.query.assert_not_called()
    db.add_all.assert_not_called()
    db.commit.assert_not_called()


def test_sync_integrity_error_rolls_back(
    completed_session, offline_data
):
    db = MagicMock()
    configure_existing_metrics(db, [])

    db.commit.side_effect = IntegrityError(
        "duplicate", {}, Exception("unique constraint")
    )

    with pytest.raises(DuplicateRepMetricError):
        sync_session_metrics(
            db, completed_session, offline_data.repetitions_data
        )

    db.rollback.assert_called_once()


def test_sync_unexpected_error_rolls_back(
    completed_session, offline_data
):
    db = MagicMock()
    configure_existing_metrics(db, [])

    db.commit.side_effect = RuntimeError("Database unavailable")

    with pytest.raises(
        RuntimeError, match="Database unavailable"
    ):
        sync_session_metrics(
            db, completed_session, offline_data.repetitions_data
        )

    db.rollback.assert_called_once()

