from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest


def _register(client, email, role):
    response = client.post(
        "/auth/register",
        json={
            "full_name": email.split("@")[0],
            "email": email,
            "password": "secret123",
            "role": role,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _login(client, email):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "secret123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def accounts(client):
    patient = _register(client, "patient@test.dev", "PATIENT")
    physio = _register(client, "physio@test.dev", "PHYSIOTHERAPIST")
    return {
        "patient": patient,
        "physio": physio,
        "patient_headers": _headers(_login(client, "patient@test.dev")),
        "physio_headers": _headers(_login(client, "physio@test.dev")),
    }


def _create_exercise(client, headers, name="Knee Flexion"):
    response = client.post(
        "/exercises",
        json={
            "name": name,
            "target_joint": "Knee",
            "min_angle_threshold": 10,
            "max_angle_threshold": 90,
            "instructions": "Flex slowly.",
            "is_active": True,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def _assign_patient(client, headers):
    patient = client.get("/patients", headers=headers).json()[0]
    physio = client.get("/physiotherapists/me", headers=headers).json()
    response = client.post(
        "/assignments",
        json={"patient_id": patient["id"], "physiotherapist_id": physio["id"]},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return patient["id"], physio["id"], response.json()


def _create_prescription(client, headers, patient_id, physio_id, exercise_id):
    response = client.post(
        "/prescriptions",
        json={
            "patient_id": patient_id,
            "physiotherapist_id": physio_id,
            "exercise_id": exercise_id,
            "target_reps": 10,
            "target_sets": 3,
            "is_active": True,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_register_login_and_me(client, accounts):
    response = client.get("/users/me", headers=accounts["patient_headers"])
    assert response.status_code == 200
    assert response.json()["role"] == "PATIENT"
    assert response.json()["email"] == "patient@test.dev"


def test_patient_cannot_manage_exercises(client, accounts):
    response = client.post(
        "/exercises",
        json={"name": "Forbidden", "target_joint": "Knee"},
        headers=accounts["patient_headers"],
    )
    assert response.status_code == 403


def test_exercise_lifecycle(client, accounts):
    headers = accounts["physio_headers"]
    exercise = _create_exercise(client, headers)

    patched = client.patch(
        f"/exercises/{exercise['id']}",
        json={"name": "Updated Knee Flexion", "max_angle_threshold": 50},
        headers=headers,
    )
    assert patched.status_code == 200, patched.text
    assert patched.json()["name"] == "Updated Knee Flexion"
    assert patched.json()["max_angle_threshold"] == 50

    invalid = client.patch(
        f"/exercises/{exercise['id']}",
        json={"min_angle_threshold": 60, "max_angle_threshold": 10},
        headers=headers,
    )
    assert invalid.status_code == 400

    deactivated = client.patch(
        f"/exercises/{exercise['id']}",
        json={"is_active": False},
        headers=headers,
    )
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False

    active_ids = {
        item["id"] for item in client.get("/exercises", headers=headers).json()
    }
    all_ids = {
        item["id"]
        for item in client.get(
            "/exercises?include_inactive=true", headers=headers
        ).json()
    }
    assert exercise["id"] not in active_ids
    assert exercise["id"] in all_ids


def test_assignment_and_prescription_lifecycle(client, accounts):
    headers = accounts["physio_headers"]
    exercise = _create_exercise(client, headers)
    patient_id, physio_id, assignment = _assign_patient(client, headers)
    prescription = _create_prescription(
        client, headers, patient_id, physio_id, exercise["id"]
    )

    deactivated = client.patch(
        f"/prescriptions/{prescription['id']}",
        json={"is_active": False},
        headers=headers,
    )
    assert deactivated.status_code == 200, deactivated.text
    assert deactivated.json()["is_active"] is False

    patient_prescriptions = client.get(
        "/prescriptions", headers=accounts["patient_headers"]
    ).json()
    assert all(item["id"] != prescription["id"] for item in patient_prescriptions)

    reactivated = client.patch(
        f"/prescriptions/{prescription['id']}",
        json={"is_active": True},
        headers=headers,
    )
    assert reactivated.status_code == 200, reactivated.text
    assert reactivated.json()["is_active"] is True

    ended = client.patch(
        f"/assignments/{assignment['id']}",
        json={"status": "ENDED"},
        headers=headers,
    )
    assert ended.status_code == 200, ended.text
    assert ended.json()["status"] == "ENDED"

    active = client.patch(
        f"/assignments/{assignment['id']}",
        json={"status": "ACTIVE"},
        headers=headers,
    )
    assert active.status_code == 200, active.text
    assert active.json()["status"] == "ACTIVE"


def test_rep_metric_assessment_rules(client, accounts):
    headers = accounts["physio_headers"]
    patient_headers = accounts["patient_headers"]
    exercise = _create_exercise(client, headers)
    patient_id, physio_id, _ = _assign_patient(client, headers)
    prescription = _create_prescription(
        client, headers, patient_id, physio_id, exercise["id"]
    )

    started = client.post(
        "/sessions",
        json={
            "patient_id": patient_id,
            "prescription_id": prescription["id"],
            "started_at": datetime.now(timezone.utc).isoformat(),
            "client_session_id": str(uuid4()),
        },
        headers=patient_headers,
    )
    assert started.status_code == 201, started.text
    session_id = started.json()["id"]

    low_confidence = client.post(
        "/rep-metrics",
        json={
            "session_id": session_id,
            "assessment_status": "ASSESSED",
            "confidence": 0.2,
            "range_of_motion": 70,
        },
        headers=patient_headers,
    )
    assert low_confidence.status_code == 201, low_confidence.text
    assert low_confidence.json()["assessment_status"] == "UNABLE_TO_ASSESS"
    assert low_confidence.json()["range_of_motion"] is None

    missing_rom = client.post(
        "/rep-metrics",
        json={
            "session_id": session_id,
            "assessment_status": "ASSESSED",
            "confidence": 0.9,
        },
        headers=patient_headers,
    )
    assert missing_rom.status_code == 201, missing_rom.text
    assert missing_rom.json()["assessment_status"] == "UNABLE_TO_ASSESS"

    assessed = client.post(
        "/rep-metrics",
        json={
            "session_id": session_id,
            "assessment_status": "ASSESSED",
            "confidence": 0.9,
            "range_of_motion": 70,
            "set_number": 2,
        },
        headers=patient_headers,
    )
    assert assessed.status_code == 201, assessed.text
    assert assessed.json()["assessment_status"] == "ASSESSED"
    assert assessed.json()["range_of_motion"] == 70
    assert assessed.json()["set_number"] == 2


def test_session_and_rep_pagination_and_filters(client, accounts):
    headers = accounts["physio_headers"]
    patient_headers = accounts["patient_headers"]
    exercise = _create_exercise(client, headers)
    patient_id, physio_id, _ = _assign_patient(client, headers)
    prescription = _create_prescription(
        client, headers, patient_id, physio_id, exercise["id"]
    )

    session_ids = []
    base = datetime.now(timezone.utc)
    for index in range(3):
        started = client.post(
            "/sessions",
            json={
                "patient_id": patient_id,
                "prescription_id": prescription["id"],
                "started_at": (base + timedelta(seconds=index)).isoformat(),
                "client_session_id": str(uuid4()),
            },
            headers=patient_headers,
        )
        assert started.status_code == 201, started.text
        session_ids.append(started.json()["id"])

    first_page = client.get(
        "/sessions?limit=2&offset=0", headers=patient_headers
    ).json()
    second_page = client.get(
        "/sessions?limit=2&offset=2", headers=patient_headers
    ).json()
    assert len(first_page) == 2
    assert len(second_page) == 1
    assert {item["id"] for item in first_page} | {
        item["id"] for item in second_page
    } == set(session_ids)

    incomplete = client.get(
        "/sessions?status=INCOMPLETE", headers=patient_headers
    ).json()
    assert len(incomplete) == 2
    assert all(item["status"] == "INCOMPLETE" for item in incomplete)

    summary_page = client.get(
        "/sessions/summary?limit=1", headers=patient_headers
    ).json()
    assert len(summary_page) == 1

    newest_session_id = first_page[0]["id"]
    for confidence in (0.9, 0.2, 0.9):
        rep = client.post(
            "/rep-metrics",
            json={
                "session_id": newest_session_id,
                "assessment_status": "ASSESSED",
                "confidence": confidence,
                "range_of_motion": 60,
            },
            headers=patient_headers,
        )
        assert rep.status_code == 201, rep.text

    rep_first_page = client.get(
        f"/rep-metrics?session_id={newest_session_id}&limit=2",
        headers=patient_headers,
    ).json()
    rep_second_page = client.get(
        f"/rep-metrics?session_id={newest_session_id}&limit=2&offset=2",
        headers=patient_headers,
    ).json()
    assert len(rep_first_page) == 2
    assert len(rep_second_page) == 1

    unable = client.get(
        f"/rep-metrics?session_id={newest_session_id}"
        "&assessment_status=UNABLE_TO_ASSESS",
        headers=patient_headers,
    ).json()
    assert len(unable) == 1
    assert unable[0]["assessment_status"] == "UNABLE_TO_ASSESS"
