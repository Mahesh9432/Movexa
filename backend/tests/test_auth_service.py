
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.models.user import User
from app.models.patient import Patient
from app.models.physiotherapist import Physiotherapist
from app.schemas.auth import (
    PatientRegister,
    PhysiotherapistRegister,
    LoginRequest,
)
from app.services import auth_service


@pytest.fixture
def db():
    return MagicMock()


@pytest.fixture
def patient_data():
    return PatientRegister(
        full_name="Test Patient",
        email="patient@example.com",
        password="Patient@123",
        gender="Male",
    )


@pytest.fixture
def physio_data():
    return PhysiotherapistRegister(
        full_name="Test Physiotherapist",
        email="physio@example.com",
        password="Physio@123",
        qualification="BPT",
        registration_number="MH-12345",
        years_experience=3,
    )


def make_query(result=None):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    return query


def prepare_user_id_on_flush(db):
    def add_side_effect(obj):
        if isinstance(obj, User) and obj.id is None:
            obj.id = uuid4()

    db.add.side_effect = add_side_effect


def test_register_patient_success(db, patient_data, monkeypatch):
    monkeypatch.setattr(auth_service, "hash_password", lambda password: "hashed-password")

    db.query.return_value = make_query()
    prepare_user_id_on_flush(db)

    result = auth_service.register_patient(db, patient_data)

    assert result.full_name == "Test Patient"
    assert result.email == "patient@example.com"
    assert result.role == "PATIENT"
    assert result.hashed_password == "hashed-password"

    added_objects = [call.args[0] for call in db.add.call_args_list]

    assert any(isinstance(obj, Patient) for obj in added_objects)
    assert any(isinstance(obj, User) for obj in added_objects)

    patient = next(obj for obj in added_objects if isinstance(obj, Patient))
    assert patient.user_id == result.id

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(result)


def test_register_patient_rejects_duplicate_email(
    db, patient_data
):
    db.query.return_value = make_query(
        SimpleNamespace(id=uuid4())
    )

    with pytest.raises(HTTPException) as exc:
        auth_service.register_patient(db, patient_data)

    assert exc.value.status_code == 409
    db.add.assert_not_called()


def test_register_physiotherapist_success(
    db, physio_data, monkeypatch
):
    monkeypatch.setattr(auth_service, "hash_password", lambda password: "hashed-password")

    db.query.side_effect = [
        make_query(),
        make_query(),
    ]

    prepare_user_id_on_flush(db)

    result = auth_service.register_physiotherapist(db, physio_data)

    assert result.role == "PHYSIOTHERAPIST"
    assert result.hashed_password == "hashed-password"

    added_objects = [call.args[0] for call in db.add.call_args_list]

    physio = next(
        obj for obj in added_objects
        if isinstance(obj, Physiotherapist)
    )

    assert physio.registration_number == "MH-12345"
    assert physio.verification_status == "PENDING"
    assert physio.user_id == result.id

    db.commit.assert_called_once()


def test_register_physiotherapist_rejects_duplicate_email(
    db, physio_data
):
    db.query.return_value = make_query(
        SimpleNamespace(id=uuid4())
    )

    with pytest.raises(HTTPException) as exc:
        auth_service.register_physiotherapist(db, physio_data)

    assert exc.value.status_code == 409
    db.add.assert_not_called()


def test_register_physiotherapist_rejects_duplicate_registration_number(
    db, physio_data
):
    db.query.side_effect = [
        make_query(),
        make_query(SimpleNamespace(id=uuid4())),
    ]

    with pytest.raises(HTTPException) as exc:
        auth_service.register_physiotherapist(db, physio_data)

    assert exc.value.status_code == 409
    db.add.assert_not_called()


def test_authenticate_user_success(db, monkeypatch):
    user = SimpleNamespace(
        id=uuid4(),
        email="patient@example.com",
        hashed_password="stored-hash",
        role="PATIENT",
        is_active=True,
    )

    db.query.return_value = make_query(user)

    monkeypatch.setattr(
        auth_service,
        "verify_password",
        lambda plain, hashed: plain == "Patient@123" and hashed == "stored-hash",
    )
    monkeypatch.setattr(
        auth_service,
        "create_access_token",
        lambda user_id, role: "test-access-token",
    )

    data = LoginRequest(
        email="patient@example.com",
        password="Patient@123",
    )

    result_user, token = auth_service.authenticate_user(db, data)

    assert result_user is user
    assert token == "test-access-token"


def test_authenticate_user_rejects_wrong_password(db, monkeypatch):
    user = SimpleNamespace(
        id=uuid4(),
        email="patient@example.com",
        hashed_password="stored-hash",
        role="PATIENT",
        is_active=True,
    )

    db.query.return_value = make_query(user)
    monkeypatch.setattr(
        auth_service,
        "verify_password",
        lambda plain, hashed: False,
    )

    data = LoginRequest(
        email="patient@example.com",
        password="WrongPassword@123",
    )

    with pytest.raises(HTTPException) as exc:
        auth_service.authenticate_user(db, data)

    assert exc.value.status_code == 401


def test_authenticate_user_rejects_inactive_account(db, monkeypatch):
    user = SimpleNamespace(
        id=uuid4(),
        email="patient@example.com",
        hashed_password="stored-hash",
        role="PATIENT",
        is_active=False,
    )

    db.query.return_value = make_query(user)
    monkeypatch.setattr(
        auth_service,
        "verify_password",
        lambda plain, hashed: True,
    )

    data = LoginRequest(
        email="patient@example.com",
        password="Patient@123",
    )

    with pytest.raises(HTTPException) as exc:
        auth_service.authenticate_user(db, data)

    assert exc.value.status_code == 403
