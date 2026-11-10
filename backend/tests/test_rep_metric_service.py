from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.rep_metric import RepMetric
from app.schemas.rep_metric import RepMetricsBatchCreate
from app.services.rep_metric_service import (
    DuplicateRepMetricError,
    InvalidMetricsSessionError,
    get_rep_metrics,
    save_rep_metrics,
)


@pytest.fixture
def session():
    return SimpleNamespace(
        id=uuid4(),
        status="IN_PROGRESS",
    )


@pytest.fixture
def metrics_data():
    return RepMetricsBatchCreate(
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


def empty_metrics_query(db):
    query = MagicMock()
    query.filter.return_value.all.return_value = []
    db.query.return_value = query


def test_save_metrics_success(db=None):
    db = MagicMock()
    empty_metrics_query(db)

    session = SimpleNamespace(id=uuid4(), status="IN_PROGRESS")
    data = RepMetricsBatchCreate(
        repetitions_data=[
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 85.5,
                "confidence": 0.92,
                "feedback": "Good",
            }
        ]
    )

    records = save_rep_metrics(db, session, data)

    assert len(records) == 1
    assert records[0].session_id == session.id
    assert records[0].rep_number == 1
    db.add_all.assert_called_once_with(records)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(records[0])
    db.rollback.assert_not_called()


def test_save_metrics_rejects_existing_repetition(
    session, metrics_data
):
    db = MagicMock()
    query = MagicMock()
    query.filter.return_value.all.return_value = [
        SimpleNamespace(rep_number=1)
    ]
    db.query.return_value = query

    with pytest.raises(DuplicateRepMetricError):
        save_rep_metrics(db, session, metrics_data)

    db.add_all.assert_not_called()
    db.commit.assert_not_called()


def test_save_metrics_rejects_completed_session(
    metrics_data
):
    db = MagicMock()
    session = SimpleNamespace(
        id=uuid4(),
        status="COMPLETED",
    )

    with pytest.raises(InvalidMetricsSessionError):
        save_rep_metrics(db, session, metrics_data)

    db.query.assert_not_called()
    db.add_all.assert_not_called()
    db.commit.assert_not_called()


def test_integrity_error_rolls_back_and_raises_duplicate(
    session, metrics_data
):
    db = MagicMock()
    empty_metrics_query(db)
    db.commit.side_effect = IntegrityError(
        "duplicate",
        {},
        Exception("unique constraint"),
    )

    with pytest.raises(DuplicateRepMetricError):
        save_rep_metrics(db, session, metrics_data)

    db.rollback.assert_called_once()


def test_unexpected_error_rolls_back_and_propagates(
    session, metrics_data
):
    db = MagicMock()
    empty_metrics_query(db)
    db.commit.side_effect = RuntimeError("Database unavailable")

    with pytest.raises(RuntimeError, match="Database unavailable"):
        save_rep_metrics(db, session, metrics_data)

    db.rollback.assert_called_once()


def test_get_metrics_returns_repetition_order():
    db = MagicMock()
    expected = [
        SimpleNamespace(rep_number=1),
        SimpleNamespace(rep_number=2),
    ]

    query = MagicMock()
    db.query.return_value = query
    query.filter.return_value = query
    query.order_by.return_value.all.return_value = expected

    result = get_rep_metrics(db, uuid4())

    assert result == expected
    query.order_by.assert_called_once()
    ordering = query.order_by.call_args.args[0]

    assert ordering.element.name == "rep_number"
    assert ordering.modifier.__name__ == "asc_op"
