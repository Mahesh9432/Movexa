from collections import defaultdict
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.patient import Patient
from app.models.patient_therapist_assignment import PatientTherapistAssignment
from app.models.physiotherapist import Physiotherapist
from app.models.prescription import Prescription
from app.models.rep_metric import RepMetric
from app.models.rehab_session import RehabSession
from app.models.user import User


def _get_patient(db: Session, user: User) -> Patient:
    patient = (
        db.query(Patient)
        .filter(Patient.user_id == user.id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found",
        )

    return patient


def _get_physiotherapist(db: Session, user: User) -> Physiotherapist:
    physiotherapist = (
        db.query(Physiotherapist)
        .filter(Physiotherapist.user_id == user.id)
        .first()
    )

    if physiotherapist is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physiotherapist profile not found",
        )

    return physiotherapist


def _get_metrics_by_session(
    db: Session,
    session_ids: list[UUID],
) -> dict:
    if not session_ids:
        return {}

    metrics = (
        db.query(RepMetric)
        .filter(RepMetric.session_id.in_(session_ids))
        .order_by(RepMetric.rep_number.asc())
        .all()
    )

    grouped = defaultdict(list)

    for metric in metrics:
        grouped[metric.session_id].append(metric)

    return grouped


def _get_exercises(
    db: Session,
    exercise_ids: list[UUID],
) -> dict:
    if not exercise_ids:
        return {}

    exercises = (
        db.query(Exercise)
        .filter(Exercise.id.in_(exercise_ids))
        .all()
    )

    return {exercise.id: exercise for exercise in exercises}


def _get_prescription_exercises(
    db: Session,
    prescriptions: list[Prescription],
) -> dict:
    exercise_ids = list({
        prescription.exercise_id
        for prescription in prescriptions
    })

    return _get_exercises(db, exercise_ids)


def _metric_counts(metrics: list[RepMetric]) -> dict:
    assessed = sum(
        1 for metric in metrics
        if metric.assessment_status == "ASSESSED"
    )

    unable = sum(
        1 for metric in metrics
        if metric.assessment_status == "UNABLE_TO_ASSESS"
    )

    return {
        "total_repetitions": len(metrics),
        "assessed_repetitions": assessed,
        "unable_to_assess_repetitions": unable,
    }


def _session_summary(
    session: RehabSession,
    prescription_map: dict,
    exercise_map: dict,
    metrics_map: dict,
) -> dict:
    prescription = prescription_map.get(session.prescription_id)

    exercise = (
        exercise_map.get(prescription.exercise_id)
        if prescription is not None
        else None
    )

    metrics = metrics_map.get(session.id, [])

    return {
        "id": session.id,
        "prescription_id": session.prescription_id,
        "exercise_id": prescription.exercise_id if prescription else None,
        "exercise_name": exercise.name if exercise else None,
        "status": session.status,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
        "synced_at": session.synced_at,
        **_metric_counts(metrics),
    }


def get_patient_dashboard(db: Session, user: User) -> dict:
    patient = _get_patient(db, user)

    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.patient_id == patient.id,
            Prescription.is_active.is_(True),
        )
        .order_by(Prescription.created_at.desc())
        .all()
    )

    sessions = (
        db.query(RehabSession)
        .filter(RehabSession.patient_id == patient.id)
        .order_by(RehabSession.started_at.desc())
        .all()
    )

    prescription_map = {
        prescription.id: prescription
        for prescription in prescriptions
    }

    # Include prescriptions referenced by historical sessions too.
    all_prescription_ids = list({
        session.prescription_id for session in sessions
    } | set(prescription_map.keys()))

    if all_prescription_ids:
        all_prescriptions = (
            db.query(Prescription)
            .filter(Prescription.id.in_(all_prescription_ids))
            .all()
        )
        prescription_map.update({
            prescription.id: prescription
            for prescription in all_prescriptions
        })

    exercise_map = _get_prescription_exercises(
        db,
        list(prescription_map.values()),
    )

    metrics_map = _get_metrics_by_session(
        db,
        [session.id for session in sessions],
    )

    all_metrics = [
        metric
        for session_metrics in metrics_map.values()
        for metric in session_metrics
    ]

    active_prescriptions = []

    for prescription in prescriptions:
        exercise = exercise_map.get(prescription.exercise_id)

        active_prescriptions.append({
            "id": prescription.id,
            "exercise_id": prescription.exercise_id,
            "exercise_name": exercise.name if exercise else None,
            "target_reps": prescription.target_reps,
            "target_sets": prescription.target_sets,
            "created_at": prescription.created_at,
        })

    session_summaries = [
        _session_summary(
            session,
            prescription_map,
            exercise_map,
            metrics_map,
        )
        for session in sessions
    ]

    return {
        "patient": {
            "id": patient.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "affected_area": patient.affected_area,
            "injury": patient.injury,
        },
        "summary": {
            "active_prescriptions": len(prescriptions),
            "total_sessions": len(sessions),
            "completed_sessions": sum(
                1 for session in sessions
                if session.status == "COMPLETED"
            ),
            "in_progress_sessions": sum(
                1 for session in sessions
                if session.status == "IN_PROGRESS"
            ),
            "incomplete_sessions": sum(
                1 for session in sessions
                if session.status == "INCOMPLETE"
            ),
            "unable_to_assess_sessions": sum(
                1 for session in sessions
                if session.status == "UNABLE_TO_ASSESS"
            ),
            **_metric_counts(all_metrics),
        },
        "active_prescriptions": active_prescriptions,
        "recent_sessions": session_summaries[:5],
    }


def get_physiotherapist_dashboard(db: Session, user: User) -> dict:
    physiotherapist = _get_physiotherapist(db, user)

    assignments = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.physiotherapist_id
            == physiotherapist.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .all()
    )

    patient_ids = list({
        assignment.patient_id for assignment in assignments
    })

    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.physiotherapist_id == physiotherapist.id,
            Prescription.is_active.is_(True),
        )
        .all()
    )

    if patient_ids:
        sessions = (
            db.query(RehabSession)
            .filter(RehabSession.patient_id.in_(patient_ids))
            .order_by(RehabSession.started_at.desc())
            .all()
        )
    else:
        sessions = []

    metrics_map = _get_metrics_by_session(
        db,
        [session.id for session in sessions],
    )

    all_metrics = [
        metric
        for session_metrics in metrics_map.values()
        for metric in session_metrics
    ]

    prescription_ids = list({
        session.prescription_id for session in sessions
    } | {
        prescription.id for prescription in prescriptions
    })

    if prescription_ids:
        all_prescriptions = (
            db.query(Prescription)
            .filter(Prescription.id.in_(prescription_ids))
            .all()
        )
    else:
        all_prescriptions = []

    prescription_map = {
        prescription.id: prescription
        for prescription in all_prescriptions
    }

    exercise_map = _get_prescription_exercises(
        db,
        all_prescriptions,
    )

    recent_sessions = [
        _session_summary(
            session,
            prescription_map,
            exercise_map,
            metrics_map,
        )
        for session in sessions[:5]
    ]

    return {
        "physiotherapist": {
            "id": physiotherapist.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "verification_status": physiotherapist.verification_status,
        },
        "summary": {
            "active_patients": len(patient_ids),
            "active_prescriptions": len(prescriptions),
            "total_sessions": len(sessions),
            "completed_sessions": sum(
                1 for session in sessions
                if session.status == "COMPLETED"
            ),
            "in_progress_sessions": sum(
                1 for session in sessions
                if session.status == "IN_PROGRESS"
            ),
            "incomplete_sessions": sum(
                1 for session in sessions
                if session.status == "INCOMPLETE"
            ),
            "unable_to_assess_sessions": sum(
                1 for session in sessions
                if session.status == "UNABLE_TO_ASSESS"
            ),
            **_metric_counts(all_metrics),
        },
        "recent_sessions": recent_sessions,
    }


def get_physiotherapist_patients(
    db: Session,
    user: User,
) -> list[dict]:
    physiotherapist = _get_physiotherapist(db, user)

    assignments = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.physiotherapist_id
            == physiotherapist.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .order_by(PatientTherapistAssignment.assigned_at.desc())
        .all()
    )

    if not assignments:
        return []

    patient_ids = [assignment.patient_id for assignment in assignments]

    patients = (
        db.query(Patient)
        .filter(Patient.id.in_(patient_ids))
        .all()
    )

    patient_map = {patient.id: patient for patient in patients}
    user_ids = [patient.user_id for patient in patients]

    users = (
        db.query(User)
        .filter(User.id.in_(user_ids))
        .all()
    ) if user_ids else []

    user_map = {item.id: item for item in users}

    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.physiotherapist_id == physiotherapist.id,
            Prescription.patient_id.in_(patient_ids),
            Prescription.is_active.is_(True),
        )
        .all()
    )

    prescription_counts = defaultdict(int)

    for prescription in prescriptions:
        prescription_counts[prescription.patient_id] += 1

    sessions = (
        db.query(RehabSession)
        .filter(RehabSession.patient_id.in_(patient_ids))
        .order_by(RehabSession.started_at.desc())
        .all()
    )

    session_counts = defaultdict(int)
    latest_sessions = {}

    for session in sessions:
        session_counts[session.patient_id] += 1

        if session.patient_id not in latest_sessions:
            latest_sessions[session.patient_id] = session.started_at

    results = []

    for assignment in assignments:
        patient = patient_map.get(assignment.patient_id)

        if patient is None:
            continue

        patient_user = user_map.get(patient.user_id)

        if patient_user is None:
            continue

        results.append({
            "patient_id": patient.id,
            "user_id": patient_user.id,
            "full_name": patient_user.full_name,
            "email": patient_user.email,
            "phone_number": patient_user.phone_number,
            "affected_area": patient.affected_area,
            "injury": patient.injury,
            "assigned_at": assignment.assigned_at,
            "active_prescriptions": prescription_counts[patient.id],
            "total_sessions": session_counts[patient.id],
            "last_session_at": latest_sessions.get(patient.id),
        })

    return results


def get_patient_progress(
    db: Session,
    user: User,
    patient_id: UUID,
) -> dict:
    physiotherapist = _get_physiotherapist(db, user)

    assignment = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient_id,
            PatientTherapistAssignment.physiotherapist_id
            == physiotherapist.id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )

    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found in your active caseload",
        )

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    patient_user = (
        db.query(User)
        .filter(User.id == patient.user_id)
        .first()
    )

    if patient_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient user not found",
        )

    sessions = (
        db.query(RehabSession)
        .filter(RehabSession.patient_id == patient.id)
        .order_by(RehabSession.started_at.desc())
        .all()
    )

    prescription_ids = list({
        session.prescription_id for session in sessions
    })

    prescriptions = (
        db.query(Prescription)
        .filter(Prescription.id.in_(prescription_ids))
        .all()
    ) if prescription_ids else []

    prescription_map = {
        prescription.id: prescription
        for prescription in prescriptions
    }

    exercise_map = _get_prescription_exercises(db, prescriptions)

    metrics_map = _get_metrics_by_session(
        db,
        [session.id for session in sessions],
    )

    all_metrics = [
        metric
        for session_metrics in metrics_map.values()
        for metric in session_metrics
    ]

    session_results = []

    for session in sessions:
        summary = _session_summary(
            session,
            prescription_map,
            exercise_map,
            metrics_map,
        )

        summary["repetitions_data"] = [
            {
                "id": metric.id,
                "rep_number": metric.rep_number,
                "assessment_status": metric.assessment_status,
                "range_of_motion": metric.range_of_motion,
                "confidence": metric.confidence,
                "movement_data": metric.movement_data,
                "compensation_flags": metric.compensation_flags,
                "detected_issues": metric.detected_issues,
                "feedback": metric.feedback,
            }
            for metric in metrics_map.get(session.id, [])
        ]

        session_results.append(summary)

    return {
        "patient": {
            "id": patient.id,
            "user_id": patient_user.id,
            "full_name": patient_user.full_name,
            "email": patient_user.email,
            "phone_number": patient_user.phone_number,
            "affected_area": patient.affected_area,
            "injury": patient.injury,
        },
        "summary": {
            "total_sessions": len(sessions),
            "completed_sessions": sum(
                1 for session in sessions
                if session.status == "COMPLETED"
            ),
            "in_progress_sessions": sum(
                1 for session in sessions
                if session.status == "IN_PROGRESS"
            ),
            "incomplete_sessions": sum(
                1 for session in sessions
                if session.status == "INCOMPLETE"
            ),
            "unable_to_assess_sessions": sum(
                1 for session in sessions
                if session.status == "UNABLE_TO_ASSESS"
            ),
            **_metric_counts(all_metrics),
        },
        "sessions": session_results,
    }