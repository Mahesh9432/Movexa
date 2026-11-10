
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
import jwt

from fastapi import HTTPException

from app.api import dependencies
from app.core.security import create_access_token


@pytest.fixture
def db():
    return MagicMock()


def make_user(role="PATIENT", is_active=True):
    return SimpleNamespace(
        id=uuid4(),
        role=role,
        is_active=is_active,
    )


def make_credentials(user, token_role=None):
    token = create_access_token(
        user.id,
        token_role or user.role,
    )

    return SimpleNamespace(credentials=token)


def test_get_current_user_success(db, monkeypatch):
    user = make_user()
    db.query.return_value.filter.return_value.first.return_value = user

    result = dependencies.get_current_user(
        credentials=make_credentials(user),
        db=db,
    )

    assert result is user


def test_get_current_user_rejects_missing_credentials(db):
    with pytest.raises(HTTPException) as exc:
        dependencies.get_current_user(
            credentials=None,
            db=db,
        )

    assert exc.value.status_code == 401


def test_get_current_user_rejects_inactive_user(db):
    user = make_user(is_active=False)
    db.query.return_value.filter.return_value.first.return_value = user

    with pytest.raises(HTTPException) as exc:
        dependencies.get_current_user(
            credentials=make_credentials(user),
            db=db,
        )

    assert exc.value.status_code == 401


def test_get_current_user_rejects_missing_user(db):
    user = make_user()
    db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc:
        dependencies.get_current_user(
            credentials=make_credentials(user),
            db=db,
        )

    assert exc.value.status_code == 401


def test_get_current_user_rejects_role_mismatch(db):
    user = make_user(role="PATIENT")
    db.query.return_value.filter.return_value.first.return_value = user

    with pytest.raises(HTTPException) as exc:
        dependencies.get_current_user(
            credentials=make_credentials(user, "PHYSIOTHERAPIST"),
            db=db,
        )

    assert exc.value.status_code == 401


def test_require_role_allows_matching_role():
    user = make_user(role="PATIENT")

    result = dependencies.require_role("PATIENT")(current_user=user)

    assert result is user


def test_require_role_rejects_wrong_role():
    user = make_user(role="PATIENT")

    with pytest.raises(HTTPException) as exc:
        dependencies.require_role("PHYSIOTHERAPIST")(
            current_user=user
        )

    assert exc.value.status_code == 403


def test_pending_physiotherapist_is_rejected(db):
    user = make_user(role="PHYSIOTHERAPIST")

    db.query.return_value.filter.return_value.first.return_value = (
        SimpleNamespace(
            verification_status="PENDING"
        )
    )

    with pytest.raises(HTTPException) as exc:
        dependencies.require_verified_physiotherapist(
            current_user=user,
            db=db,
        )

    assert exc.value.status_code == 403


def test_verified_physiotherapist_is_allowed(db):
    user = make_user(role="PHYSIOTHERAPIST")

    db.query.return_value.filter.return_value.first.return_value = (
        SimpleNamespace(
            verification_status="VERIFIED"
        )
    )

    result = dependencies.require_verified_physiotherapist(
        current_user=user,
        db=db,
    )

    assert result is user
