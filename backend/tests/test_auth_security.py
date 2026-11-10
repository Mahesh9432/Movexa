
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_password_is_hashed():
    password = "MovexaTest@123"

    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$argon2")


def test_correct_password_is_verified():
    password = "MovexaTest@123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True


def test_incorrect_password_is_rejected():
    hashed = hash_password("MovexaTest@123")

    assert verify_password("WrongPassword@123", hashed) is False


def test_access_token_contains_correct_user_data():
    user_id = uuid4()

    token = create_access_token(user_id, "PATIENT")
    payload = decode_access_token(token)

    assert payload["sub"] == str(user_id)
    assert payload["role"] == "PATIENT"
    assert "iat" in payload
    assert "exp" in payload


def test_expired_token_is_rejected():
    user_id = uuid4()

    expired_payload = {
        "sub": str(user_id),
        "role": "PATIENT",
        "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }

    token = jwt.encode(
        expired_payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    with pytest.raises(jwt.ExpiredSignatureError):
        decode_access_token(token)


def test_invalid_token_is_rejected():
    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token("invalid.token.value")


def test_token_signed_with_wrong_secret_is_rejected():
    token = jwt.encode(
        {
            "sub": str(uuid4()),
            "role": "PATIENT",
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        "incorrect-secret-for-movexa-testing-32-bytes-minimum",
        algorithm=settings.JWT_ALGORITHM,
    )

    with pytest.raises(jwt.InvalidTokenError):
        decode_access_token(token)
