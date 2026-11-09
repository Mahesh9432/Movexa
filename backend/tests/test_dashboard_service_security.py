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
