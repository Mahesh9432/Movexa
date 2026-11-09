from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.api.sessions import _get_patient
from app.database.connection import get_db
from app.main import app
from app.services.rep_metric_service import (
    DuplicateRepMetricError,
    InvalidMetricsSessionError,
)


@pytest.fixture
def records():
    now = datetime.now(timezone.utc)

    user = SimpleNamespace(
        id=uuid4(),
        role="PATIENT",
        is_active=True,
    )

    patient = SimpleNamespace(
        id=uuid4(),
        user_id=user.id,
    )

    session = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        prescription_id=uuid4(),
        status="COMPLETED",
        started_at=now,
        completed_at=now,
        synced_at=None,
        client_session_id=uuid4(),
        created_at=now,
    )

    return SimpleNamespace(
        now=now,
        user=user,
        patient=patient,
        session=session,
    )


@pytest.fixture
def client(records, monkeypatch):
    db = MagicMock()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = (
        lambda: records.user
    )

    from app.api import sessions

    monkeypatch.setattr(
        sessions,
        "get_session",
        lambda db, session_id: records.session,
    )
    monkeypatch.setattr(
        sessions,
        "_get_patient",
        lambda db, user: records.patient,
    )

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_patient_can_sync_offline_metrics(
    client, records, monkeypatch
):
    from app.api import sessions

    def fake_sync(db, session, repetitions_data):
        assert len(repetitions_data) == 1
        session.synced_at = records.now
        return session

    monkeypatch.setattr(
        sessions,
        "sync_session_metrics",
        fake_sync,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/sync",
        json={
            "repetitions_data": [
                {
                    "rep_number": 1,
                    "assessment_status": "ASSESSED",
                    "range_of_motion": 85.5,
                    "confidence": 0.92,
                    "movement_data": {"knee_angle": 85.5},
                    "compensation_flags": {},
                    "detected_issues": [],
                    "feedback": "Good movement",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json()["synced_at"] is not None


def test_patient_can_sync_empty_offline_batch(
    client, records, monkeypatch
):
    from app.api import sessions

    def fake_sync(db, session, repetitions_data):
        assert repetitions_data == []
        session.synced_at = records.now
        return session

    monkeypatch.setattr(
        sessions,
        "sync_session_metrics",
        fake_sync,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/sync",
        json={"repetitions_data": []},
    )

    assert response.status_code == 200


def test_conflicting_offline_metrics_return_409(
    client, records, monkeypatch
):
    from app.api import sessions

    def fake_sync(db, session, repetitions_data):
        raise DuplicateRepMetricError(
            "Repetition already exists with different data"
        )

    monkeypatch.setattr(
        sessions,
        "sync_session_metrics",
        fake_sync,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/sync",
        json={"repetitions_data": []},
    )

    assert response.status_code == 409
    assert "different data" in response.json()["detail"]


def test_in_progress_session_sync_returns_409(
    client, records, monkeypatch
):
    from app.api import sessions

    def fake_sync(db, session, repetitions_data):
        raise InvalidMetricsSessionError(
            "Only a completed session can be synchronized"
        )

    monkeypatch.setattr(
        sessions,
        "sync_session_metrics",
        fake_sync,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/sync",
        json={"repetitions_data": []},
    )

    assert response.status_code == 409


def test_invalid_offline_batch_returns_422(
    client, records
):
    response = client.post(
        f"/api/sessions/{records.session.id}/sync",
        json={
            "repetitions_data": [
                {
                    "rep_number": 0,
                    "assessment_status": "ASSESSED",
                    "range_of_motion": 85.5,
                }
            ]
        },
    )

    assert response.status_code == 422
