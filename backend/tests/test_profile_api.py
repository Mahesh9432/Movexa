
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_current_user
from app.database.connection import get_db
from app.main import app


# --------------------------------------------------
# FIXTURES
# --------------------------------------------------

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
def patient_user():
    now = datetime.now(timezone.utc)

    return SimpleNamespace(
        id=uuid4(),
        full_name="Test Patient",
        email="patient@example.com",
        phone_number="9876543210",
        role="PATIENT",
        is_active=True,
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def physiotherapist_user():
    now = datetime.now(timezone.utc)

    return SimpleNamespace(
        id=uuid4(),
        full_name="Test Physiotherapist",
        email="physio@example.com",
        phone_number="9876543211",
        role="PHYSIOTHERAPIST",
        is_active=True,
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def patient_profile(patient_user):
    now = datetime.now(timezone.utc)

    return SimpleNamespace(
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


@pytest.fixture
def physiotherapist_profile(physiotherapist_user):
    now = datetime.now(timezone.utc)

    return SimpleNamespace(
        id=uuid4(),
        user_id=physiotherapist_user.id,
        qualification="BPT",
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


def authenticate_as(user):
    app.dependency_overrides[get_current_user] = lambda: user


# --------------------------------------------------
# PATIENT PROFILE TESTS
# --------------------------------------------------

def test_get_patient_profile(
    client,
    db,
    patient_user,
    patient_profile,
):
    authenticate_as(patient_user)

    db.query.return_value.filter.return_value.first.return_value = (
        patient_profile
    )

    response = client.get("/api/patients/me")

    assert response.status_code == 200

    data = response.json()

    assert data["user"]["full_name"] == "Test Patient"
    assert data["user"]["email"] == "patient@example.com"
    assert data["profile"]["affected_area"] == "Right knee"
    assert data["profile"]["injury"] == "Knee injury"


def test_get_patient_profile_not_found(
    client,
    db,
    patient_user,
):
    authenticate_as(patient_user)

    db.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/api/patients/me")

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient profile not found"


def test_patient_profile_rejects_unauthenticated_request(client):
    response = client.get("/api/patients/me")

    assert response.status_code == 401


def test_patient_cannot_access_physiotherapist_profile(
    client,
    patient_user,
):
    authenticate_as(patient_user)

    response = client.get("/api/physiotherapists/me")

    assert response.status_code == 403


def test_update_patient_profile(
    client,
    db,
    patient_user,
    patient_profile,
):
    authenticate_as(patient_user)

    db.query.return_value.filter.return_value.first.return_value = (
        patient_profile
    )

    response = client.patch(
        "/api/patients/me",
        json={
            "full_name": "Updated Patient",
            "phone_number": "9999999999",
            "affected_area": "Left knee",
            "emergency_contact_name": "Updated Contact",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user"]["full_name"] == "Updated Patient"
    assert data["user"]["phone_number"] == "9999999999"
    assert data["profile"]["affected_area"] == "Left knee"
    assert data["profile"]["emergency_contact_name"] == "Updated Contact"

    assert patient_profile.injury == "Knee injury"

    db.commit.assert_called_once()
    assert db.refresh.call_count == 2


def test_patient_partial_update_preserves_other_fields(
    client,
    db,
    patient_user,
    patient_profile,
):
    authenticate_as(patient_user)

    db.query.return_value.filter.return_value.first.return_value = (
        patient_profile
    )

    response = client.patch(
        "/api/patients/me",
        json={
            "affected_area": "Left shoulder",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["profile"]["affected_area"] == "Left shoulder"
    assert data["profile"]["injury"] == "Knee injury"
    assert data["user"]["full_name"] == "Test Patient"

    db.commit.assert_called_once()


def test_patient_update_rejects_blank_full_name(
    client,
    patient_user,
):
    authenticate_as(patient_user)

    response = client.patch(
        "/api/patients/me",
        json={
            "full_name": "   ",
        },
    )

    assert response.status_code == 422


# --------------------------------------------------
# PHYSIOTHERAPIST PROFILE TESTS
# --------------------------------------------------

def test_get_physiotherapist_profile(
    client,
    db,
    physiotherapist_user,
    physiotherapist_profile,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = (
        physiotherapist_profile
    )

    response = client.get("/api/physiotherapists/me")

    assert response.status_code == 200

    data = response.json()

    assert data["user"]["full_name"] == "Test Physiotherapist"
    assert data["profile"]["qualification"] == "BPT"
    assert data["profile"]["specialization"] == (
        "Orthopedic Physiotherapy"
    )
    assert data["profile"]["verification_status"] == "VERIFIED"


def test_get_physiotherapist_profile_not_found(
    client,
    db,
    physiotherapist_user,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = None

    response = client.get("/api/physiotherapists/me")

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Physiotherapist profile not found"
    )


def test_physiotherapist_cannot_access_patient_profile(
    client,
    physiotherapist_user,
):
    authenticate_as(physiotherapist_user)

    response = client.get("/api/patients/me")

    assert response.status_code == 403


def test_update_physiotherapist_profile(
    client,
    db,
    physiotherapist_user,
    physiotherapist_profile,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = (
        physiotherapist_profile
    )

    response = client.patch(
        "/api/physiotherapists/me",
        json={
            "full_name": "Updated Physiotherapist",
            "phone_number": "9999999999",
            "qualification": "MPT",
            "specialization": "Sports Physiotherapy",
            "years_experience": 8,
            "clinic_name": "Updated Clinic",
            "clinic_address": "Mumbai, Maharashtra",
            "professional_bio": "Updated professional bio.",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["user"]["full_name"] == "Updated Physiotherapist"
    assert data["profile"]["qualification"] == "MPT"
    assert data["profile"]["specialization"] == (
        "Sports Physiotherapy"
    )
    assert data["profile"]["years_experience"] == 8
    assert data["profile"]["clinic_name"] == "Updated Clinic"

    db.commit.assert_called_once()
    assert db.refresh.call_count == 2


def test_physiotherapist_partial_update_preserves_other_fields(
    client,
    db,
    physiotherapist_user,
    physiotherapist_profile,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = (
        physiotherapist_profile
    )

    response = client.patch(
        "/api/physiotherapists/me",
        json={
            "clinic_name": "New Clinic",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["profile"]["clinic_name"] == "New Clinic"
    assert data["profile"]["qualification"] == "BPT"
    assert data["profile"]["specialization"] == (
        "Orthopedic Physiotherapy"
    )

    db.commit.assert_called_once()


def test_physiotherapist_cannot_update_read_only_fields(
    client,
    db,
    physiotherapist_user,
    physiotherapist_profile,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = (
        physiotherapist_profile
    )

    response = client.patch(
        "/api/physiotherapists/me",
        json={
            "specialization": "Sports Physiotherapy",
            "registration_number": "FAKE-99999",
            "verification_status": "VERIFIED",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["profile"]["specialization"] == (
        "Sports Physiotherapy"
    )
    assert data["profile"]["registration_number"] == "MH-12345"
    assert data["profile"]["verification_status"] == "VERIFIED"

    assert physiotherapist_profile.registration_number == "MH-12345"
    assert physiotherapist_profile.verification_status == "VERIFIED"


def test_physiotherapist_update_rejects_negative_experience(
    client,
    physiotherapist_user,
):
    authenticate_as(physiotherapist_user)

    response = client.patch(
        "/api/physiotherapists/me",
        json={
            "years_experience": -2,
        },
    )

    assert response.status_code == 422


def test_physiotherapist_update_rejects_null_qualification(
    client,
    db,
    physiotherapist_user,
    physiotherapist_profile,
):
    authenticate_as(physiotherapist_user)

    db.query.return_value.filter.return_value.first.return_value = (
        physiotherapist_profile
    )

    response = client.patch(
        "/api/physiotherapists/me",
        json={
            "qualification": None,
        },
    )

    assert response.status_code == 422

    db.commit.assert_not_called()
