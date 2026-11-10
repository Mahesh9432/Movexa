
from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas.auth import (
    PatientRegister,
    PhysiotherapistRegister,
    LoginRequest,
)


def test_valid_patient_registration():
    data = PatientRegister(
        full_name="Test Patient",
        email="PATIENT@EXAMPLE.COM",
        password="Patient@123",
        date_of_birth=date(2000, 5, 10),
        gender="Male",
    )

    assert data.full_name == "Test Patient"
    assert data.email == "patient@example.com"
    assert data.date_of_birth == date(2000, 5, 10)


def test_patient_registration_rejects_short_password():
    with pytest.raises(ValidationError):
        PatientRegister(
            full_name="Test Patient",
            email="patient@example.com",
            password="short",
        )


def test_patient_registration_rejects_invalid_email():
    with pytest.raises(ValidationError):
        PatientRegister(
            full_name="Test Patient",
            email="invalid-email",
            password="Patient@123",
        )


def test_patient_registration_rejects_invalid_date():
    with pytest.raises(ValidationError):
        PatientRegister(
            full_name="Test Patient",
            email="patient@example.com",
            password="Patient@123",
            date_of_birth="not-a-date",
        )


def test_valid_physiotherapist_registration():
    data = PhysiotherapistRegister(
        full_name="Test Physiotherapist",
        email="PHYSIO@EXAMPLE.COM",
        password="Physio@123",
        qualification="BPT",
        registration_number=" mh-12345 ",
        years_experience=3,
    )

    assert data.email == "physio@example.com"
    assert data.registration_number == "MH-12345"
    assert data.years_experience == 3


def test_physiotherapist_rejects_whitespace_registration_number():
    with pytest.raises(ValidationError):
        PhysiotherapistRegister(
            full_name="Test Physiotherapist",
            email="physio@example.com",
            password="Physio@123",
            qualification="BPT",
            registration_number="     ",
        )


def test_physiotherapist_rejects_empty_registration_number():
    with pytest.raises(ValidationError):
        PhysiotherapistRegister(
            full_name="Test Physiotherapist",
            email="physio@example.com",
            password="Physio@123",
            qualification="BPT",
            registration_number="",
        )


def test_physiotherapist_normalizes_registration_number():
    data = PhysiotherapistRegister(
        full_name="Test Physiotherapist",
        email="physio@example.com",
        password="Physio@123",
        qualification="BPT",
        registration_number="  mh-pune-12345  ",
    )

    assert data.registration_number == "MH-PUNE-12345"


def test_physiotherapist_rejects_negative_experience():
    with pytest.raises(ValidationError):
        PhysiotherapistRegister(
            full_name="Test Physiotherapist",
            email="physio@example.com",
            password="Physio@123",
            qualification="BPT",
            registration_number="MH-12345",
            years_experience=-1,
        )


def test_valid_login_request_normalizes_email():
    data = LoginRequest(
        email="USER@EXAMPLE.COM",
        password="Password@123",
    )

    assert data.email == "user@example.com"


def test_login_rejects_empty_password():
    with pytest.raises(ValidationError):
        LoginRequest(
            email="user@example.com",
            password="",
        )
