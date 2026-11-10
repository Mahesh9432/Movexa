from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import (
    get_current_user,
    require_verified_physiotherapist,
)
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

    patient = SimpleNamespace(
        id=uuid4(),
        user_id=patient_user.id,
    )

    physiotherapist = SimpleNamespace(
        id=uuid4(),
        user_id=physiotherapist_user.id,
        verification_status="VERIFIED",
    )

    assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
        assigned_at=now,
        ended_at=None,
        created_at=now,
    )

    return SimpleNamespace(
        now=now,
        patient_user=patient_user,
        physiotherapist_user=physiotherapist_user,
        patient=patient,
        physiotherapist=physiotherapist,
        assignment=assignment,
    )


def configure_queries(db, results):
    queries = []

    for result in results:
        query = MagicMock()
        query.filter.return_value.first.return_value = result
        queries.append(query)

    db.query.side_effect = queries


def authenticate_as_physiotherapist(user):
    app.dependency_overrides[
        require_verified_physiotherapist
    ] = lambda: user


def authenticate_as_patient(user):
    app.dependency_overrides[get_current_user] = lambda: user


def test_create_assignment_success(client, db, records):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [
            records.physiotherapist,
            records.patient,
            None,
        ],
    )

    def add_assignment(assignment):
        assignment.id = uuid4()

    def refresh_assignment(assignment):
        assignment.assigned_at = records.now
        assignment.created_at = records.now

    db.add.side_effect = add_assignment
    db.refresh.side_effect = refresh_assignment

    response = client.post(
        "/api/assignments",
        json={"patient_id": str(records.patient.id)},
    )

    assert response.status_code == 201

    data = response.json()
    assert data["patient_id"] == str(records.patient.id)
    assert data["physiotherapist_id"] == str(records.physiotherapist.id)
    assert data["status"] == "ACTIVE"

    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.refresh.assert_called_once()


def test_create_assignment_rejects_existing_active_assignment(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [
            records.physiotherapist,
            records.patient,
            records.assignment,
        ],
    )

    response = client.post(
        "/api/assignments",
        json={"patient_id": str(records.patient.id)},
    )

    assert response.status_code == 409
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_create_assignment_rejects_frontend_physio_id(
    client, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    response = client.post(
        "/api/assignments",
        json={
            "patient_id": str(records.patient.id),
            "physiotherapist_id": str(records.physiotherapist.id),
        },
    )

    assert response.status_code == 422


def test_patient_can_retrieve_active_assignment(client, db, records):
    authenticate_as_patient(records.patient_user)

    configure_queries(
        db,
        [records.patient, records.assignment],
    )

    response = client.get("/api/patients/me/assignment")

    assert response.status_code == 200
    assert response.json()["id"] == str(records.assignment.id)
    assert response.json()["status"] == "ACTIVE"


def test_patient_without_assignment_receives_null(client, db, records):
    authenticate_as_patient(records.patient_user)

    configure_queries(db, [records.patient, None])

    response = client.get("/api/patients/me/assignment")

    assert response.status_code == 200
    assert response.json() is None


def test_physiotherapist_can_end_own_assignment(client, db, records):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [records.physiotherapist, records.assignment],
    )

    response = client.patch(
        f"/api/assignments/{records.assignment.id}/end"
    )

    assert response.status_code == 200
    assert response.json()["status"] == "ENDED"
    assert records.assignment.ended_at is not None

    db.commit.assert_called_once()
    db.refresh.assert_called_once()


def test_physiotherapist_cannot_end_another_physios_assignment(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    other_assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=records.patient.id,
        physiotherapist_id=uuid4(),
        status="ACTIVE",
        assigned_at=records.now,
        ended_at=None,
        created_at=records.now,
    )

    configure_queries(
        db,
        [records.physiotherapist, other_assignment],
    )

    response = client.patch(
        f"/api/assignments/{other_assignment.id}/end"
    )

    assert response.status_code == 404
    db.commit.assert_not_called()


def test_ended_assignment_cannot_be_ended_again(client, db, records):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    ended_assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=records.patient.id,
        physiotherapist_id=records.physiotherapist.id,
        status="ENDED",
        assigned_at=records.now,
        ended_at=records.now,
        created_at=records.now,
    )

    configure_queries(
        db,
        [records.physiotherapist, ended_assignment],
    )

    response = client.patch(
        f"/api/assignments/{ended_assignment.id}/end"
    )

    assert response.status_code == 409
    db.commit.assert_not_called()
