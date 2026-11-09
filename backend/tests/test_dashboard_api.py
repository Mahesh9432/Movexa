from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException

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
        id=uuid4(),
        role="PATIENT",
        is_active=True,
    )

    physiotherapist_user = SimpleNamespace(
        id=uuid4(),
        role="PHYSIOTHERAPIST",
        is_active=True,
    )

    return SimpleNamespace(
        now=now,
        patient_user=patient_user,
        physiotherapist_user=physiotherapist_user,
    )


def authenticate(user):
    app.dependency_overrides[get_current_user] = lambda: user


def test_patient_can_read_own_dashboard(
    client,
    records,
    monkeypatch,
):
    from app.api import dashboards

    authenticate(records.patient_user)

    patient_id = uuid4()

    payload = {
        "patient": {
            "id": str(patient_id),
            "user_id": str(records.patient_user.id),
            "full_name": "Test Patient",
            "affected_area": "Knee",
            "injury": "Knee injury",
        },
        "summary": {
            "active_prescriptions": 1,
            "total_sessions": 2,
            "completed_sessions": 1,
            "in_progress_sessions": 1,
            "incomplete_sessions": 0,
            "unable_to_assess_sessions": 0,
            "total_repetitions": 10,
            "assessed_repetitions": 8,
            "unable_to_assess_repetitions": 2,
        },
        "active_prescriptions": [],
        "recent_sessions": [],
    }

    monkeypatch.setattr(
        dashboards,
        "get_patient_dashboard",
        lambda db, user: payload,
    )

    response = client.get("/api/patients/me/dashboard")

    assert response.status_code == 200
    assert response.json()["patient"]["full_name"] == "Test Patient"
    assert response.json()["summary"]["total_sessions"] == 2
    assert response.json()["summary"]["total_repetitions"] == 10


def test_physiotherapist_can_read_own_dashboard(
    client,
    records,
    monkeypatch,
):
    from app.api import dashboards

    authenticate(records.physiotherapist_user)

    payload = {
        "physiotherapist": {
            "id": str(uuid4()),
            "user_id": str(records.physiotherapist_user.id),
            "full_name": "Test Physiotherapist",
            "verification_status": "VERIFIED",
        },
        "summary": {
            "active_patients": 3,
            "active_prescriptions": 5,
            "total_sessions": 10,
            "completed_sessions": 7,
            "in_progress_sessions": 2,
            "incomplete_sessions": 1,
            "unable_to_assess_sessions": 0,
            "total_repetitions": 100,
            "assessed_repetitions": 90,
            "unable_to_assess_repetitions": 10,
        },
        "recent_sessions": [],
    }

    monkeypatch.setattr(
        dashboards,
        "get_physiotherapist_dashboard",
        lambda db, user: payload,
    )

    response = client.get("/api/physiotherapists/me/dashboard")

    assert response.status_code == 200
    assert response.json()["summary"]["active_patients"] == 3
    assert response.json()["summary"]["completed_sessions"] == 7


def test_patient_cannot_access_physiotherapist_dashboard(
    client,
    records,
):
    authenticate(records.patient_user)

    response = client.get("/api/physiotherapists/me/dashboard")

    assert response.status_code == 403


def test_physiotherapist_cannot_access_patient_dashboard(
    client,
    records,
):
    authenticate(records.physiotherapist_user)

    response = client.get("/api/patients/me/dashboard")

    assert response.status_code == 403


def test_physiotherapist_can_list_assigned_patients(
    client,
    records,
    monkeypatch,
):
    from app.api import dashboards

    authenticate(records.physiotherapist_user)

    patient_id = uuid4()

    payload = [
        {
            "patient_id": patient_id,
            "user_id": uuid4(),
            "full_name": "Assigned Patient",
            "email": "patient@example.com",
            "phone_number": "9999999999",
            "affected_area": "Knee",
            "injury": "Knee injury",
            "assigned_at": records.now,
            "active_prescriptions": 2,
            "total_sessions": 5,
            "last_session_at": records.now,
        }
    ]

    monkeypatch.setattr(
        dashboards,
        "get_physiotherapist_patients",
        lambda db, user: payload,
    )

    response = client.get("/api/physiotherapists/me/patients")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["patient_id"] == str(patient_id)
    assert response.json()[0]["active_prescriptions"] == 2


def test_physiotherapist_can_read_patient_progress(
    client,
    records,
    monkeypatch,
):
    from app.api import dashboards

    authenticate(records.physiotherapist_user)

    patient_id = uuid4()

    payload = {
        "patient": {
            "id": patient_id,
            "user_id": uuid4(),
            "full_name": "Assigned Patient",
            "email": "patient@example.com",
            "phone_number": "9999999999",
            "affected_area": "Knee",
            "injury": "Knee injury",
        },
        "summary": {
            "total_sessions": 1,
            "completed_sessions": 1,
            "in_progress_sessions": 0,
            "incomplete_sessions": 0,
            "unable_to_assess_sessions": 0,
            "total_repetitions": 2,
            "assessed_repetitions": 1,
            "unable_to_assess_repetitions": 1,
        },
        "sessions": [
            {
                "id": uuid4(),
                "prescription_id": uuid4(),
                "exercise_id": uuid4(),
                "exercise_name": "Knee Extension",
                "status": "COMPLETED",
                "started_at": records.now,
                "completed_at": records.now,
                "synced_at": records.now,
                "total_repetitions": 2,
                "assessed_repetitions": 1,
                "unable_to_assess_repetitions": 1,
                "repetitions_data": [
                    {
                        "id": uuid4(),
                        "rep_number": 1,
                        "assessment_status": "ASSESSED",
                        "range_of_motion": 85.5,
                        "confidence": 0.95,
                        "movement_data": {"knee_angle": 85.5},
                        "compensation_flags": [],
                        "detected_issues": [],
                        "feedback": "Good movement",
                    },
                    {
                        "id": uuid4(),
                        "rep_number": 2,
                        "assessment_status": "UNABLE_TO_ASSESS",
                        "range_of_motion": None,
                        "confidence": 0.2,
                        "movement_data": None,
                        "compensation_flags": [],
                        "detected_issues": [],
                        "feedback": "Unable to assess",
                    },
                ],
            }
        ],
    }

    monkeypatch.setattr(
        dashboards,
        "get_patient_progress",
        lambda db, user, requested_patient_id: payload,
    )

    response = client.get(
        f"/api/physiotherapists/me/patients/{patient_id}/progress"
    )

    assert response.status_code == 200
    assert response.json()["summary"]["total_repetitions"] == 2
    assert (
        response.json()["sessions"][0]["repetitions_data"][1][
            "assessment_status"
        ]
        == "UNABLE_TO_ASSESS"
    )


def test_patient_progress_returns_404_for_unassigned_patient(
    client,
    records,
    monkeypatch,
):
    from app.api import dashboards

    authenticate(records.physiotherapist_user)

    def reject_unassigned_patient(db, user, patient_id):
        raise HTTPException(
            status_code=404,
            detail="Patient not found in your active caseload",
        )

    monkeypatch.setattr(
        dashboards,
        "get_patient_progress",
        reject_unassigned_patient,
    )

    response = client.get(
        f"/api/physiotherapists/me/patients/{uuid4()}/progress"
    )

    assert response.status_code == 404