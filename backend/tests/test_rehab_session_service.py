from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.schemas.rehab_session import RehabSessionCreate, RehabSessionFinish
from app.services.rehab_session_service import (
    InvalidSessionOperationError,
    SessionConflictError,
    SessionNotFoundError,
    finish_session,
    get_session,
    mark_session_synced,
    start_session,
)


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def session_data():
    return RehabSessionCreate(
        patient_id=uuid4(),
        prescription_id=uuid4(),
        client_session_id=uuid4(),
        started_at=datetime.now(timezone.utc),
    )


def test_start_session_creates_new_session(db, session_data):
    existing_query = MagicMock()
    existing_query.filter.return_value.first.return_value = None

    prescription = SimpleNamespace(
        id=session_data.prescription_id,
        patient_id=session_data.patient_id,
        is_active=True,
    )
    prescription_query = MagicMock()
    prescription_query.filter.return_value.first.return_value = prescription

    db.query.side_effect = [existing_query, prescription_query]

    result = start_session(db, session_data)

    assert result[1] is True
    assert result[0].status == "IN_PROGRESS"
    assert result[0].patient_id == session_data.patient_id
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()


def test_start_session_returns_existing_session_for_retry(db, session_data):
    existing = SimpleNamespace(
        patient_id=session_data.patient_id,
        prescription_id=session_data.prescription_id,
    )
    query = MagicMock()
    query.filter.return_value.first.return_value = existing
    db.query.return_value = query

    result = start_session(db, session_data)

    assert result == (existing, False)
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_start_session_rejects_reused_id_for_different_patient(db, session_data):
    existing = SimpleNamespace(
        patient_id=uuid4(),
        prescription_id=session_data.prescription_id,
    )
    query = MagicMock()
    query.filter.return_value.first.return_value = existing
    db.query.return_value = query

    with pytest.raises(SessionConflictError):
        start_session(db, session_data)


def test_start_session_rejects_missing_prescription(db, session_data):
    existing_query = MagicMock()
    existing_query.filter.return_value.first.return_value = None

    prescription_query = MagicMock()
    prescription_query.filter.return_value.first.return_value = None

    db.query.side_effect = [existing_query, prescription_query]

    with pytest.raises(SessionNotFoundError):
        start_session(db, session_data)


def test_start_session_rejects_inactive_prescription(db, session_data):
    existing_query = MagicMock()
    existing_query.filter.return_value.first.return_value = None

    prescription = SimpleNamespace(
        patient_id=session_data.patient_id,
        is_active=False,
    )
    prescription_query = MagicMock()
    prescription_query.filter.return_value.first.return_value = prescription

    db.query.side_effect = [existing_query, prescription_query]

    with pytest.raises(InvalidSessionOperationError):
        start_session(db, session_data)


def test_start_session_rejects_prescription_for_another_patient(db, session_data):
    existing_query = MagicMock()
    existing_query.filter.return_value.first.return_value = None

    prescription = SimpleNamespace(
        patient_id=uuid4(),
        is_active=True,
    )
    prescription_query = MagicMock()
    prescription_query.filter.return_value.first.return_value = prescription

    db.query.side_effect = [existing_query, prescription_query]

    with pytest.raises(InvalidSessionOperationError):
        start_session(db, session_data)


def test_get_session_returns_session(db):
    expected = SimpleNamespace(id=uuid4())
    query = MagicMock()
    query.filter.return_value.first.return_value = expected
    db.query.return_value = query

    assert get_session(db, expected.id) is expected


def test_get_session_raises_when_missing(db):
    query = MagicMock()
    query.filter.return_value.first.return_value = None
    db.query.return_value = query

    with pytest.raises(SessionNotFoundError):
        get_session(db, uuid4())


def test_finish_session_updates_in_progress_session(db):
    started_at = datetime.now(timezone.utc)
    session = SimpleNamespace(
        status="IN_PROGRESS",
        started_at=started_at,
        completed_at=None,
    )
    query = MagicMock()
    query.filter.return_value.first.return_value = session
    db.query.return_value = query

    result = finish_session(
        db,
        uuid4(),
        RehabSessionFinish(status="COMPLETED"),
    )

    assert result.status == "COMPLETED"
    assert result.completed_at is not None
    assert result.completed_at >= started_at
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(session)


def test_finish_session_rejects_already_finished_session(db):
    session = SimpleNamespace(
        status="COMPLETED",
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
    )
    query = MagicMock()
    query.filter.return_value.first.return_value = session
    db.query.return_value = query

    with pytest.raises(InvalidSessionOperationError):
        finish_session(
            db,
            uuid4(),
            RehabSessionFinish(status="INCOMPLETE"),
        )

    db.commit.assert_not_called()


def test_finish_session_rejects_completion_before_start(db):
    started_at = datetime.now(timezone.utc)
    session = SimpleNamespace(
        status="IN_PROGRESS",
        started_at=started_at,
        completed_at=None,
    )
    query = MagicMock()
    query.filter.return_value.first.return_value = session
    db.query.return_value = query

    with pytest.raises(InvalidSessionOperationError):
        finish_session(
            db,
            uuid4(),
            RehabSessionFinish(
                status="COMPLETED",
                completed_at=started_at - timedelta(minutes=1),
            ),
        )

    db.commit.assert_not_called()


def test_mark_session_synced_sets_timestamp_once(db):
    session = SimpleNamespace(synced_at=None)
    query = MagicMock()
    query.filter.return_value.first.return_value = session
    db.query.return_value = query

    result = mark_session_synced(db, uuid4())

    assert result.synced_at is not None
    db.commit.assert_called_once()


def test_mark_session_synced_does_not_overwrite_existing_timestamp(db):
    original_timestamp = datetime.now(timezone.utc)
    session = SimpleNamespace(synced_at=original_timestamp)
    query = MagicMock()
    query.filter.return_value.first.return_value = session
    db.query.return_value = query

    result = mark_session_synced(db, uuid4())

    assert result.synced_at == original_timestamp
    db.commit.assert_not_called()
