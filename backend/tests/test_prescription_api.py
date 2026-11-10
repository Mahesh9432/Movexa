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

    exercise = SimpleNamespace(
        id=uuid4(),
        name="Knee Extension",
        is_active=True,
    )

    assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
    )

    return SimpleNamespace(
        now=now,
        patient_user=patient_user,
        physiotherapist_user=physiotherapist_user,
        patient=patient,
        physiotherapist=physiotherapist,
        exercise=exercise,
        assignment=assignment,
    )


def configure_queries(db, results):
    queries = []

    for result in results:
        query = MagicMock()
        query.filter.return_value.first.return_value = (
            result if not isinstance(result, list) else None
        )
        query.filter.return_value.order_by.return_value.all.return_value = (
            result if isinstance(result, list) else []
        )
        queries.append(query)

    db.query.side_effect = queries


def authenticate_as_physiotherapist(user):
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[
        require_verified_physiotherapist
    ] = lambda: user


def authenticate_as_patient(user):
    app.dependency_overrides[get_current_user] = lambda: user


def prescription_payload(records):
    return {
        "patient_id": str(records.patient.id),
        "physiotherapist_id": str(records.physiotherapist.id),
        "exercise_id": str(records.exercise.id),
        "target_reps": 12,
        "target_sets": 3,
        "is_active": True,
    }


def test_create_prescription_success(client, db, records):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [
            records.physiotherapist,
            records.patient,
            records.exercise,
            records.assignment,
        ],
    )

    def add_prescription(prescription):
        prescription.id = uuid4()
        prescription.created_at = records.now

    db.add.side_effect = add_prescription
    db.refresh.side_effect = (
        lambda prescription: setattr(
            prescription, "created_at", records.now
        )
    )

    response = client.post(
        "/api/prescriptions",
        json=prescription_payload(records),
    )

    assert response.status_code == 201
    assert response.json()["patient_id"] == str(records.patient.id)
    assert response.json()["physiotherapist_id"] == str(
        records.physiotherapist.id
    )
    assert response.json()["exercise_id"] == str(records.exercise.id)
    assert response.json()["target_reps"] == 12

    db.add.assert_called_once()
    db.commit.assert_called_once()


def test_create_prescription_rejects_another_physio_id(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)
    configure_queries(db, [records.physiotherapist])

    payload = prescription_payload(records)
    payload["physiotherapist_id"] = str(uuid4())

    response = client.post("/api/prescriptions", json=payload)

    assert response.status_code == 403
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_create_prescription_requires_active_assignment(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [
            records.physiotherapist,
            records.patient,
            records.exercise,
            None,
        ],
    )

    response = client.post(
        "/api/prescriptions",
        json=prescription_payload(records),
    )

    assert response.status_code == 403
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_create_prescription_rejects_inactive_exercise(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    configure_queries(
        db,
        [
            records.physiotherapist,
            records.patient,
            None,
        ],
    )

    response = client.post(
        "/api/prescriptions",
        json=prescription_payload(records),
    )

    assert response.status_code == 404
    db.add.assert_not_called()


def test_patient_can_list_own_prescriptions(
    client, db, records
):
    authenticate_as_patient(records.patient_user)

    saved = [
        SimpleNamespace(
            id=uuid4(),
            patient_id=records.patient.id,
            physiotherapist_id=records.physiotherapist.id,
            exercise_id=records.exercise.id,
            target_reps=12,
            target_sets=3,
            is_active=True,
            created_at=records.now,
        )
    ]

    configure_queries(db, [records.patient, saved])

    response = client.get("/api/prescriptions")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["patient_id"] == str(records.patient.id)


def test_physiotherapist_can_list_own_prescriptions(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    saved = [
        SimpleNamespace(
            id=uuid4(),
            patient_id=records.patient.id,
            physiotherapist_id=records.physiotherapist.id,
            exercise_id=records.exercise.id,
            target_reps=12,
            target_sets=3,
            is_active=True,
            created_at=records.now,
        )
    ]

    configure_queries(db, [records.physiotherapist, saved])

    response = client.get("/api/prescriptions")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["physiotherapist_id"] == str(
        records.physiotherapist.id
    )


def test_patient_cannot_create_prescription(
    client, records
):
    authenticate_as_patient(records.patient_user)

    response = client.post(
        "/api/prescriptions",
        json=prescription_payload(records),
    )

    assert response.status_code == 403


def test_physiotherapist_cannot_update_another_physios_prescription(
    client, db, records
):
    authenticate_as_physiotherapist(records.physiotherapist_user)

    another_prescription = SimpleNamespace(
        id=uuid4(),
        patient_id=records.patient.id,
        physiotherapist_id=uuid4(),
        exercise_id=records.exercise.id,
        target_reps=10,
        target_sets=3,
        is_active=True,
        created_at=records.now,
    )

    configure_queries(
        db,
        [
            another_prescription,
            records.physiotherapist,
        ],
    )

    response = client.patch(
        f"/api/prescriptions/{another_prescription.id}",
        json={"target_reps": 15},
    )

    assert response.status_code == 404
    db.commit.assert_not_called()
