
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api import auth as auth_api
from app.core.security import create_access_token
from app.database.connection import get_db
from app.main import app
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


def make_user(role="PATIENT", full_name="Test User"):
    return SimpleNamespace(
        id=uuid4(),
        full_name=full_name,
        email="test@example.com",
        role=role,
        is_active=True,
    )


def test_patient_registration_endpoint(client, db, monkeypatch):
    user = make_user(role="PATIENT", full_name="Test Patient")

    monkeypatch.setattr(
        auth_api,
        "register_patient",
        lambda db, data: user,
    )
    monkeypatch.setattr(
        auth_api,
        "create_access_token",
        lambda user_id, role: "test-access-token",
    )

    response = client.post(
        "/api/auth/register/patient",
        json={
            "full_name": "Test Patient",
            "email": "patient@example.com",
            "password": "Patient@123",
        },
    )

    assert response.status_code == 201
    assert response.json()["access_token"] == "test-access-token"
    assert response.json()["user"]["role"] == "PATIENT"
    assert response.json()["user"]["full_name"] == "Test Patient"


def test_patient_registration_rejects_invalid_email(client):
    response = client.post(
        "/api/auth/register/patient",
        json={
            "full_name": "Test Patient",
            "email": "invalid-email",
            "password": "Patient@123",
        },
    )

    assert response.status_code == 422


def test_physiotherapist_registration_endpoint(
    client,
    db,
    monkeypatch,
):
    user = make_user(
        role="PHYSIOTHERAPIST",
        full_name="Test Physiotherapist",
    )

    monkeypatch.setattr(
        auth_api,
        "register_physiotherapist",
        lambda db, data: user,
    )
    monkeypatch.setattr(
        auth_api,
        "create_access_token",
        lambda user_id, role: "test-physio-token",
    )

    db.query.return_value.filter.return_value.first.return_value = (
        SimpleNamespace(verification_status="PENDING")
    )

    response = client.post(
        "/api/auth/register/physiotherapist",
        json={
            "full_name": "Test Physiotherapist",
            "email": "physio@example.com",
            "password": "Physio@123",
            "qualification": "BPT",
            "registration_number": "MH-12345",
            "years_experience": 3,
        },
    )

    assert response.status_code == 201
    assert response.json()["access_token"] == "test-physio-token"
    assert response.json()["user"]["role"] == "PHYSIOTHERAPIST"
    assert response.json()["user"]["verification_status"] == "PENDING"


def test_physiotherapist_registration_rejects_blank_registration_number(
    client,
    monkeypatch,
):
    register_mock = MagicMock()

    monkeypatch.setattr(
        auth_api,
        "register_physiotherapist",
        register_mock,
    )

    response = client.post(
        "/api/auth/register/physiotherapist",
        json={
            "full_name": "Test Physiotherapist",
            "email": "physio@example.com",
            "password": "Physio@123",
            "qualification": "BPT",
            "registration_number": "     ",
        },
    )

    assert response.status_code == 422
    register_mock.assert_not_called()


def test_login_endpoint(client, monkeypatch):
    user = make_user(role="PATIENT", full_name="Test Patient")

    monkeypatch.setattr(
        auth_api,
        "authenticate_user",
        lambda db, data: (user, "login-access-token"),
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "patient@example.com",
            "password": "Patient@123",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "login-access-token"
    assert response.json()["user"]["role"] == "PATIENT"


def test_login_endpoint_rejects_invalid_credentials(
    client,
    monkeypatch,
):
    def reject_login(db, data):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    monkeypatch.setattr(
        auth_api,
        "authenticate_user",
        reject_login,
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": "patient@example.com",
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code == 401


def test_me_endpoint_returns_authenticated_user(client, db):
    user = make_user(role="PATIENT", full_name="Test Patient")

    db.query.return_value.filter.return_value.first.return_value = user

    token = create_access_token(user.id, user.role)

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(user.id)
    assert response.json()["email"] == user.email
    assert response.json()["role"] == "PATIENT"


def test_me_endpoint_rejects_missing_token(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_me_endpoint_rejects_invalid_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
