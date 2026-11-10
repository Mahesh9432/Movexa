from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.database.connection import get_db
from app.main import app


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def records():
    now = datetime.now(timezone.utc)

    patient_user = SimpleNamespace(
        id=uuid4(), role="PATIENT", is_active=True
    )
    physiotherapist_user = SimpleNamespace(
        id=uuid4(), role="PHYSIOTHERAPIST", is_active=True
    )
    patient = SimpleNamespace(
        id=uuid4(), user_id=patient_user.id
    )
    other_patient = SimpleNamespace(
        id=uuid4(), user_id=uuid4()
    )
    physiotherapist = SimpleNamespace(
        id=uuid4(), user_id=physiotherapist_user.id
    )
    assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
    )
    session = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        prescription_id=uuid4(),
        status="IN_PROGRESS",
        started_at=now,
        completed_at=None,
        synced_at=None,
        client_session_id=uuid4(),
        created_at=now,
    )

    return SimpleNamespace(
        now=now,
        patient_user=patient_user,
        physiotherapist_user=physiotherapist_user,
        patient=patient,
        other_patient=other_patient,
        physiotherapist=physiotherapist,
        assignment=assignment,
        session=session,
    )


def authenticate(user):
    app.dependency_overrides[get_current_user] = lambda: user


def mock_query(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    return query


def test_create_session_returns_201(client, records, monkeypatch):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )
    monkeypatch.setattr(
        sessions, "start_session",
        lambda db, data: (records.session, True),
    )

    response = client.post(
        "/api/sessions",
        json={
            "prescription_id": str(records.session.prescription_id),
            "client_session_id": str(records.session.client_session_id),
            "started_at": records.now.isoformat(),
        },
    )

    assert response.status_code == 201
    assert response.json()["patient_id"] == str(records.patient.id)


def test_duplicate_session_retry_returns_200(
    client, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )
    monkeypatch.setattr(
        sessions, "start_session",
        lambda db, data: (records.session, False),
    )

    response = client.post(
        "/api/sessions",
        json={
            "prescription_id": str(records.session.prescription_id),
            "client_session_id": str(records.session.client_session_id),
            "started_at": records.now.isoformat(),
        },
    )

    assert response.status_code == 200


def test_create_session_rejects_client_patient_id(
    client, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )

    response = client.post(
        "/api/sessions",
        json={
            "patient_id": str(records.patient.id),
            "prescription_id": str(records.session.prescription_id),
            "client_session_id": str(records.session.client_session_id),
            "started_at": records.now.isoformat(),
        },
    )

    assert response.status_code == 422


def test_patient_can_read_own_session(client, records, monkeypatch):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )

    response = client.get(
        f"/api/sessions/{records.session.id}"
    )

    assert response.status_code == 200


def test_patient_cannot_read_another_patients_session(
    client, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.other_patient,
    )

    response = client.get(
        f"/api/sessions/{records.session.id}"
    )

    assert response.status_code == 404


def test_patient_can_complete_own_session(
    client, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )

    completed = SimpleNamespace(**{
        **vars(records.session),
        "status": "COMPLETED",
        "completed_at": records.now,
    })

    monkeypatch.setattr(
        sessions, "finish_session",
        lambda db, session_id, data: completed,
    )

    response = client.patch(
        f"/api/sessions/{records.session.id}/complete",
        json={"status": "COMPLETED"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"


def test_patient_can_sync_own_session(
    client, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.patient_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )
    monkeypatch.setattr(
        sessions, "_get_patient",
        lambda db, user: records.patient,
    )

    synced = SimpleNamespace(**{
        **vars(records.session),
        "synced_at": records.now,
    })

    monkeypatch.setattr(
        sessions, "mark_session_synced",
        lambda db, session_id: synced,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/sync"
    )

    assert response.status_code == 200
    assert response.json()["synced_at"] is not None


def test_assigned_physiotherapist_can_read_session(
    client, db, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.physiotherapist_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )

    db.query.side_effect = [
        mock_query(records.physiotherapist),
        mock_query(records.assignment),
    ]

    response = client.get(
        f"/api/sessions/{records.session.id}"
    )

    assert response.status_code == 200


def test_unassigned_physiotherapist_cannot_read_session(
    client, db, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.physiotherapist_user)
    monkeypatch.setattr(
        sessions, "get_session",
        lambda db, session_id: records.session,
    )

    db.query.side_effect = [
        mock_query(records.physiotherapist),
        mock_query(None),
    ]

    response = client.get(
        f"/api/sessions/{records.session.id}"
    )

    assert response.status_code == 403


def test_physiotherapist_cannot_create_session(
    client, records
):
    authenticate(records.physiotherapist_user)

    response = client.post(
        "/api/sessions",
        json={
            "prescription_id": str(uuid4()),
            "client_session_id": str(uuid4()),
            "started_at": records.now.isoformat(),
        },
    )

    assert response.status_code == 403
