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
    patient_user = SimpleNamespace(
        id=uuid4(), role="PATIENT", is_active=True
    )
    physiotherapist_user = SimpleNamespace(
        id=uuid4(), role="PHYSIOTHERAPIST", is_active=True
    )
    session = SimpleNamespace(
        id=uuid4(),
        patient_id=uuid4(),
        status="IN_PROGRESS",
    )

    return SimpleNamespace(
        patient_user=patient_user,
        physiotherapist_user=physiotherapist_user,
        session=session,
    )


def authenticate(user):
    app.dependency_overrides[get_current_user] = lambda: user


def sample_payload():
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
                "detected_issues": [],
                "feedback": "Landmarks not visible",
            },
        ]
    }


def test_patient_can_submit_session_metrics(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: records.session,
    )

    saved_records = [
        SimpleNamespace(
            id=uuid4(),
            session_id=records.session.id,
            rep_number=1,
            assessment_status="ASSESSED",
            range_of_motion=85.5,
            confidence=0.92,
            movement_data={"knee_angle": 85.5},
            compensation_flags={"forward_lean": False},
            detected_issues=[],
            feedback="Good movement",
        ),
        SimpleNamespace(
            id=uuid4(),
            session_id=records.session.id,
            rep_number=2,
            assessment_status="UNABLE_TO_ASSESS",
            range_of_motion=None,
            confidence=0.25,
            movement_data={},
            compensation_flags={},
            detected_issues=[],
            feedback="Landmarks not visible",
        ),
    ]

    monkeypatch.setattr(
        metrics,
        "save_rep_metrics",
        lambda db, session, data: saved_records,
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=sample_payload(),
    )

    assert response.status_code == 201
    assert response.json()["total_repetitions"] == 2
    assert len(response.json()["repetitions_data"]) == 2


def test_patient_can_retrieve_session_metrics(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: records.session,
    )

    saved_records = [
        SimpleNamespace(
            id=uuid4(),
            session_id=records.session.id,
            rep_number=1,
            assessment_status="ASSESSED",
            range_of_motion=85.5,
            confidence=0.92,
            movement_data={},
            compensation_flags={},
            detected_issues=[],
            feedback="Good",
        ),
        SimpleNamespace(
            id=uuid4(),
            session_id=records.session.id,
            rep_number=2,
            assessment_status="ASSESSED",
            range_of_motion=90.0,
            confidence=0.95,
            movement_data={},
            compensation_flags={},
            detected_issues=[],
            feedback="Good",
        ),
    ]

    monkeypatch.setattr(
        metrics,
        "get_rep_metrics",
        lambda db, session_id: saved_records,
    )

    response = client.get(
        f"/api/sessions/{records.session.id}/metrics"
    )

    assert response.status_code == 200
    assert response.json()["total_repetitions"] == 2
    assert [
        item["rep_number"]
        for item in response.json()["repetitions_data"]
    ] == [1, 2]


def test_duplicate_metrics_return_409(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: records.session,
    )

    def raise_duplicate(db, session, data):
        raise metrics.DuplicateRepMetricError(
            "One or more repetition numbers have already been recorded"
        )

    monkeypatch.setattr(
        metrics, "save_rep_metrics", raise_duplicate
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=sample_payload(),
    )

    assert response.status_code == 409


def test_completed_session_rejects_metrics(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    completed_session = SimpleNamespace(
        id=records.session.id,
        patient_id=records.session.patient_id,
        status="COMPLETED",
    )

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: completed_session,
    )

    def raise_invalid(db, session, data):
        raise metrics.InvalidMetricsSessionError(
            "Metrics can only be added to an in-progress session"
        )

    monkeypatch.setattr(
        metrics, "save_rep_metrics", raise_invalid
    )

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=sample_payload(),
    )

    assert response.status_code == 409


def test_physiotherapist_cannot_submit_metrics(
    client, records
):
    authenticate(records.physiotherapist_user)

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=sample_payload(),
    )

    assert response.status_code == 403


def test_unassigned_physiotherapist_cannot_read_metrics(
    client, db, records, monkeypatch
):
    from app.api import sessions

    authenticate(records.physiotherapist_user)

    monkeypatch.setattr(
        sessions,
        "get_session",
        lambda db, session_id: records.session,
    )

    physiotherapist = SimpleNamespace(
        id=uuid4(),
        user_id=records.physiotherapist_user.id,
    )

    def mock_query(result):
        query = MagicMock()
        query.filter.return_value.first.return_value = result
        return query

    db.query.side_effect = [
        mock_query(physiotherapist),
        mock_query(None),
    ]

    response = client.get(
        f"/api/sessions/{records.session.id}/metrics"
    )

    assert response.status_code == 403


def test_invalid_metrics_payload_returns_422(
    client, records
):
    authenticate(records.patient_user)

    payload = {
        "repetitions_data": [
            {
                "rep_number": 1,
                "assessment_status": "UNABLE_TO_ASSESS",
                "range_of_motion": 45.0,
            }
        ]
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 422

def test_assigned_physiotherapist_can_retrieve_session_metrics(
    client, db, records, monkeypatch
):
    from app.api import metrics, sessions

    authenticate(records.physiotherapist_user)

    physiotherapist = SimpleNamespace(
        id=uuid4(),
        user_id=records.physiotherapist_user.id,
    )

    assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=records.session.patient_id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
    )

    def mock_query(result):
        query = MagicMock()
        query.filter.return_value.first.return_value = result
        return query

    monkeypatch.setattr(
        sessions,
        "get_session",
        lambda db, session_id: records.session,
    )

    db.query.side_effect = [
        mock_query(physiotherapist),
        mock_query(assignment),
    ]

    metric = SimpleNamespace(
        id=uuid4(),
        session_id=records.session.id,
        rep_number=1,
        assessment_status="ASSESSED",
        range_of_motion=85.5,
        confidence=0.95,
        movement_data={"knee_angle": 85.5},
        compensation_flags=[],
        detected_issues=[],
        feedback="Good movement",
    )

    monkeypatch.setattr(
        metrics,
        "get_rep_metrics",
        lambda db, session_id: [metric],
    )

    response = client.get(
        f"/api/sessions/{records.session.id}/metrics"
    )

    assert response.status_code == 200
    assert response.json()["total_repetitions"] == 1
    assert response.json()["repetitions_data"][0]["rep_number"] == 1


def test_duplicate_rep_numbers_in_batch_return_422(
    client, records
):
    authenticate(records.patient_user)

    payload = {
        "repetitions_data": [
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 85.5,
                "confidence": 0.95,
            },
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 82.0,
                "confidence": 0.90,
            },
        ]
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 422


@pytest.mark.parametrize("confidence", [-0.1, 1.1])
def test_confidence_outside_allowed_range_returns_422(
    client, records, confidence
):
    authenticate(records.patient_user)

    payload = {
        "repetitions_data": [
            {
                "rep_number": 1,
                "assessment_status": "ASSESSED",
                "range_of_motion": 85.5,
                "confidence": confidence,
            }
        ]
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 422


def test_patient_can_submit_darshan_ai_metrics(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: records.session,
    )

    saved_records = [
        SimpleNamespace(
            id=uuid4(),
            session_id=records.session.id,
            rep_number=1,
            assessment_status="ASSESSED",
            range_of_motion=82.5,
            confidence=None,
            movement_data={
                "min_knee_angle": 65.0,
                "max_knee_angle": 147.5,
                "rom_degrees": 82.5,
                "duration_seconds": 2.4,
                "sample_count": 30,
            },
            compensation_flags=None,
            detected_issues=None,
            feedback=None,
        )
    ]

    captured = {}

    def mock_save(db, session, data):
        captured["session"] = session
        captured["data"] = data
        return saved_records

    monkeypatch.setattr(metrics, "save_rep_metrics", mock_save)

    payload = {
        "session_id": str(records.session.id),
        "exercise": "squat",
        "repetitions": 1,
        "current_phase": "standing",
        "individual_repetitions": [
            {
                "rep_number": 1,
                "min_knee_angle": 65.0,
                "max_knee_angle": 147.5,
                "rom_degrees": 82.5,
                "duration_seconds": 2.4,
                "sample_count": 30,
                "assessment_status": "ASSESSED",
            }
        ],
        "compensation_issues": ["Forward lean"],
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 201
    assert response.json()["total_repetitions"] == 1
    assert captured["session"] is records.session

    adapted = captured["data"].repetitions_data[0]

    assert adapted.rep_number == 1
    assert adapted.assessment_status == "ASSESSED"
    assert adapted.range_of_motion == 82.5
    assert adapted.confidence is None
    assert adapted.movement_data["sample_count"] == 30
    assert adapted.movement_data["session_level"]["compensation_issues"] == [
        "Forward lean"
    ]


def test_darshan_ai_metrics_reject_mismatched_session_id(
    client, records, monkeypatch
):
    from app.api import metrics

    authenticate(records.patient_user)

    monkeypatch.setattr(
        metrics,
        "_get_owned_session",
        lambda db, session_id, user: records.session,
    )

    payload = {
        "session_id": str(uuid4()),
        "exercise": "squat",
        "individual_repetitions": [
            {
                "rep_number": 1,
                "min_knee_angle": 65.0,
                "max_knee_angle": 147.5,
                "rom_degrees": 82.5,
                "duration_seconds": 2.4,
                "sample_count": 30,
                "assessment_status": "ASSESSED",
            }
        ],
        "compensation_issues": [],
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 422
    assert "does not match" in response.json()["detail"]


def test_invalid_darshan_ai_metrics_return_422(
    client, records
):
    authenticate(records.patient_user)

    payload = {
        "session_id": str(records.session.id),
        "exercise": "squat",
        "individual_repetitions": [],
        "compensation_issues": [],
    }

    response = client.post(
        f"/api/sessions/{records.session.id}/metrics",
        json=payload,
    )

    assert response.status_code == 422
    assert "no per-repetition measurements" in response.json()["detail"]
