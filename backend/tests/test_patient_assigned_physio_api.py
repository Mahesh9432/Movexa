
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.database.connection import get_db
from app.main import app
from app.models.patient import Patient
from app.models.patient_therapist_assignment import PatientTherapistAssignment
from app.models.physiotherapist import Physiotherapist
from app.models.user import User


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
        full_name="Test Patient",
        email="patient@example.com",
        phone_number="9876543210",
        role="PATIENT",
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    patient = SimpleNamespace(
        id=uuid4(),
        user_id=patient_user.id,
        date_of_birth=date(2003, 5, 15),
        gender="Male",
        injury="Knee injury",
        affected_area="Right knee",
        treatment_start_date=date(2026, 1, 10),
        emergency_contact_name="Test Contact",
        emergency_contact_relationship="Father",
        emergency_contact_phone="9876500000",
        created_at=now,
        updated_at=now,
    )

    physio_user = SimpleNamespace(
        id=uuid4(),
        full_name="Dr. Test Physiotherapist",
        email="physio@example.com",
        phone_number="9999999999",
        role="PHYSIOTHERAPIST",
        is_active=True,
        created_at=now,
        updated_at=now,
    )

    physiotherapist = SimpleNamespace(
        id=uuid4(),
        user_id=physio_user.id,
        qualification="MPT",
        specialization="Orthopedic Physiotherapy",
        registration_number="MH-12345",
        years_experience=5,
        clinic_name="Movexa Clinic",
        clinic_address="Pune, Maharashtra",
        professional_bio="Experienced physiotherapist.",
        verification_status="VERIFIED",
        created_at=now,
        updated_at=now,
    )

    assignment = SimpleNamespace(
        id=uuid4(),
        patient_id=patient.id,
        physiotherapist_id=physiotherapist.id,
        status="ACTIVE",
    )

    return SimpleNamespace(
        patient_user=patient_user,
        patient=patient,
        physio_user=physio_user,
        physiotherapist=physiotherapist,
        assignment=assignment,
    )


def authenticate_as(user):
    app.dependency_overrides[get_current_user] = lambda: user


def configure_queries(db, results):
    queries = []

    for result in results:
        query = MagicMock()
        query.filter.return_value.first.return_value = result
        queries.append(query)

    db.query.side_effect = queries


def test_patient_profile_returns_assigned_physiotherapist(
    client,
    db,
    records,
):
    authenticate_as(records.patient_user)

    configure_queries(
        db,
        [
            records.patient,
            records.assignment,
            records.physiotherapist,
            records.physio_user,
        ],
    )

    response = client.get("/api/patients/me")

    assert response.status_code == 200

    assigned = response.json()["assigned_physiotherapist"]

    assert assigned["id"] == str(records.physiotherapist.id)
    assert assigned["full_name"] == "Dr. Test Physiotherapist"
    assert assigned["qualification"] == "MPT"
    assert assigned["specialization"] == "Orthopedic Physiotherapy"
    assert assigned["clinic_name"] == "Movexa Clinic"
    assert assigned["phone_number"] == "9999999999"
    assert assigned["assignment_status"] == "ACTIVE"


def test_patient_profile_returns_null_without_active_assignment(
    client,
    db,
    records,
):
    authenticate_as(records.patient_user)

    configure_queries(
        db,
        [
            records.patient,
            None,
        ],
    )

    response = client.get("/api/patients/me")

    assert response.status_code == 200
    assert response.json()["assigned_physiotherapist"] is None


def test_patient_profile_returns_null_if_assigned_physio_is_missing(
    client,
    db,
    records,
):
    authenticate_as(records.patient_user)

    configure_queries(
        db,
        [
            records.patient,
            records.assignment,
            None,
        ],
    )

    response = client.get("/api/patients/me")

    assert response.status_code == 200
    assert response.json()["assigned_physiotherapist"] is None
