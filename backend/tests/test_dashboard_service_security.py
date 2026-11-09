from unittest.mock import MagicMock
from uuid import uuid4

from sqlalchemy.sql.elements import BinaryExpression

from app.models.patient import Patient
from app.models.patient_therapist_assignment import PatientTherapistAssignment
from app.models.prescription import Prescription
from app.models.rehab_session import RehabSession
from app.models.user import User
from app.services import dashboard_service


def _run_dashboard_function(monkeypatch, function_name):
    physiotherapist_id = uuid4()
    patient_id = uuid4()

    user = MagicMock(id=uuid4())
    physiotherapist = MagicMock(
        id=physiotherapist_id,
        verification_status="VERIFIED",
    )

    assignment = MagicMock(patient_id=patient_id)

    patient = MagicMock(
        id=patient_id,
        user_id=uuid4(),
        affected_area="Knee",
        injury="Knee injury",
    )

    patient_user = MagicMock(
        id=patient.user_id,
        full_name="Test Patient",
        email="patient@example.com",
        phone_number="9999999999",
    )

    query_records = []

    def create_query(model):
        query = MagicMock()
        query.filter.return_value = query
        query.join.return_value = query
        query.order_by.return_value = query
        query.all.return_value = []

        query_records.append((model, query))
        return query

    db = MagicMock()
    db.query.side_effect = create_query

    monkeypatch.setattr(
        dashboard_service,
        "_get_physiotherapist",
        lambda db, user: physiotherapist,
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_metrics_by_session",
        lambda db, session_ids: {},
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_prescription_exercises",
        lambda db, prescriptions: {},
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_exercises",
        lambda db, exercise_ids: {},
    )

    if function_name == "get_physiotherapist_dashboard":
        def assignment_results(model):
            if model is PatientTherapistAssignment:
                return [assignment]
            return []

        db.query.side_effect = lambda model: create_query(model)
        query = create_query(PatientTherapistAssignment)
        query.all.return_value = [assignment]

        original_create_query = create_query

        def dashboard_query(model):
            if model is PatientTherapistAssignment:
                return query
            return original_create_query(model)

        db.query.side_effect = dashboard_query

    elif function_name == "get_physiotherapist_patients":
        original_create_query = create_query

        def patients_query(model):
            query = original_create_query(model)

            if model is PatientTherapistAssignment:
                query.all.return_value = [assignment]
            elif model is Patient:
                query.all.return_value = [patient]
            elif model is User:
                query.all.return_value = [patient_user]

            return query

        db.query.side_effect = patients_query

    elif function_name == "get_patient_progress":
        original_create_query = create_query

        def progress_query(model):
            query = original_create_query(model)

            if model is PatientTherapistAssignment:
                query.first.return_value = assignment
            elif model is Patient:
                query.first.return_value = patient
            elif model is User:
                query.first.return_value = patient_user

            return query

        db.query.side_effect = progress_query

    function = getattr(dashboard_service, function_name)

    if function_name == "get_patient_progress":
        function(db, user, patient_id)
    else:
        function(db, user)

    session_queries = [
        query
        for model, query in query_records
        if model is RehabSession
    ]

    assert session_queries, "No RehabSession query was executed."

    return session_queries, physiotherapist_id


def _assert_owner_filter(session_queries, physiotherapist_id):
    owner_filter_found = False

    for query in session_queries:
        for call in query.filter.call_args_list:
            for expression in call.args:
                if not isinstance(expression, BinaryExpression):
                    continue

                column = str(expression.left)
                value = getattr(expression.right, "value", None)

                if (
                    column == "prescriptions.physiotherapist_id"
                    and value == physiotherapist_id
                ):
                    owner_filter_found = True

    assert owner_filter_found, (
        "Session query must filter by the current "
        "physiotherapist's prescription ownership."
    )


def test_physiotherapist_dashboard_filters_sessions_by_prescription_owner(
    monkeypatch,
):
    queries, physiotherapist_id = _run_dashboard_function(
        monkeypatch,
        "get_physiotherapist_dashboard",
    )
    _assert_owner_filter(queries, physiotherapist_id)


def test_physiotherapist_patient_list_filters_sessions_by_prescription_owner(
    monkeypatch,
):
    queries, physiotherapist_id = _run_dashboard_function(
        monkeypatch,
        "get_physiotherapist_patients",
    )
    _assert_owner_filter(queries, physiotherapist_id)


def test_patient_progress_filters_sessions_by_prescription_owner(
    monkeypatch,
):
    queries, physiotherapist_id = _run_dashboard_function(
        monkeypatch,
        "get_patient_progress",
    )
    _assert_owner_filter(queries, physiotherapist_id)

def test_dashboard_excludes_sessions_from_previous_physiotherapist(
    monkeypatch,
):
    from datetime import datetime, timezone
    from uuid import uuid4

    current_physio_id = uuid4()
    previous_physio_id = uuid4()
    patient_id = uuid4()

    current_user = MagicMock(id=uuid4())
    current_physio = MagicMock(
        id=current_physio_id,
        verification_status="VERIFIED",
    )

    assignment = MagicMock(patient_id=patient_id)

    current_prescription = MagicMock(
        id=uuid4(),
        patient_id=patient_id,
        exercise_id=uuid4(),
        physiotherapist_id=current_physio_id,
    )
    previous_prescription = MagicMock(
        id=uuid4(),
        patient_id=patient_id,
        exercise_id=uuid4(),
        physiotherapist_id=previous_physio_id,
    )

    now = datetime.now(timezone.utc)
    current_session = MagicMock(
        id=uuid4(),
        patient_id=patient_id,
        prescription_id=current_prescription.id,
        status="COMPLETED",
        started_at=now,
        completed_at=now,
        synced_at=now,
    )
    previous_session = MagicMock(
        id=uuid4(),
        patient_id=patient_id,
        prescription_id=previous_prescription.id,
        status="COMPLETED",
        started_at=now,
        completed_at=now,
        synced_at=now,
    )

    assignment_query = MagicMock()
    assignment_query.filter.return_value = assignment_query
    assignment_query.all.return_value = [assignment]

    prescription_query = MagicMock()
    prescription_query.filter.return_value = prescription_query
    prescription_query.all.return_value = [current_prescription]

    session_query = MagicMock()
    session_query.join.return_value = session_query
    session_query.order_by.return_value = session_query
    session_filters = []

    def capture_session_filters(*criteria):
        session_filters.extend(criteria)
        return session_query

    session_query.filter.side_effect = capture_session_filters
    session_query.all.return_value = [current_session]

    prescription_lookup_query = MagicMock()
    prescription_lookup_query.filter.return_value = (
        prescription_lookup_query
    )
    prescription_lookup_query.all.return_value = [current_prescription]

    def query_router(model):
        if model is PatientTherapistAssignment:
            return assignment_query

        if model is Prescription:
            if not hasattr(query_router, "prescription_calls"):
                query_router.prescription_calls = 0
            query_router.prescription_calls += 1

            if query_router.prescription_calls == 1:
                return prescription_query
            return prescription_lookup_query

        if model is RehabSession:
            return session_query

        raise AssertionError(f"Unexpected query model: {model}")

    db = MagicMock()
    db.query.side_effect = query_router

    monkeypatch.setattr(
        dashboard_service,
        "_get_physiotherapist",
        lambda db, user: current_physio,
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_metrics_by_session",
        lambda db, session_ids: {},
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_prescription_exercises",
        lambda db, prescriptions: {},
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_exercises",
        lambda db, exercise_ids: {},
    )

    result = dashboard_service.get_physiotherapist_dashboard(
        db,
        current_user,
    )

    assert result["summary"]["total_sessions"] == 1
    assert result["summary"]["completed_sessions"] == 1
    assert len(result["recent_sessions"]) == 1
    assert result["recent_sessions"][0]["id"] == current_session.id
    assert previous_session.id not in [
        session["id"] for session in result["recent_sessions"]
    ]

    assert session_query.join.called
    assert any(
        getattr(getattr(criteria, "left", None), "name", None)
        == "physiotherapist_id"
        and getattr(
            getattr(criteria, "right", None),
            "value",
            None,
        ) == current_physio_id
        for criteria in session_filters
    )
    assert previous_physio_id != current_physio_id
