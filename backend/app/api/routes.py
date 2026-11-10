from datetime import datetime, timezone
from typing import List, Literal, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.connection import get_db
from app.models import *
from app.schemas.common import *
from app.core.security import verify_password, get_password_hash, create_access_token


# ---------- Helpers ----------
def _require_role(user: User, role: str):
    if user.role != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires {role} role",
        )


def _get_patient_profile(db: Session, user: User) -> Patient:
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return patient


def _get_physio_profile(db: Session, user: User) -> Physiotherapist:
    physio = db.query(Physiotherapist).filter(Physiotherapist.user_id == user.id).first()
    if not physio:
        raise HTTPException(status_code=404, detail="Physiotherapist profile not found")
    return physio


def _active_assignment(db: Session, patient_id: UUID, physio_id: UUID):
    return (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == patient_id,
            PatientTherapistAssignment.physiotherapist_id == physio_id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )


def _assert_patient_access(db: Session, user: User, patient_id: UUID):
    if user.role == "PATIENT":
        if _get_patient_profile(db, user).id != patient_id:
            raise HTTPException(status_code=403, detail="Not allowed to access this patient")
    elif user.role == "PHYSIOTHERAPIST":
        physio = _get_physio_profile(db, user)
        if not _active_assignment(db, patient_id, physio.id):
            raise HTTPException(status_code=403, detail="Patient is not assigned to you")
    else:
        raise HTTPException(status_code=403, detail="Not allowed")


def _assert_session_access(db: Session, user: User, session: RehabSession):
    _assert_patient_access(db, user, session.patient_id)


# ---------- Auth ----------
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        phone_number=payload.phone_number,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if payload.role == "PATIENT":
        db.add(Patient(user_id=user.id))
        db.commit()
    elif payload.role == "PHYSIOTHERAPIST":
        db.add(
            Physiotherapist(
                user_id=user.id,
                qualification="Not provided",
                registration_number=f"PENDING-{user.id}",
                years_experience=0,
                verification_status="PENDING",
            )
        )
        db.commit()
    return user


@auth_router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email, "role": user.role})
    return Token(access_token=token)


@auth_router.post("/token", response_model=Token)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email, "role": user.role})
    return Token(access_token=token)


# ---------- Users ----------
users_router = APIRouter(prefix="/users", tags=["users"])


@users_router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------- Patients ----------
patients_router = APIRouter(prefix="/patients", tags=["patients"])


@patients_router.get("", response_model=List[PatientRead])
def list_patients(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role == "PATIENT":
        patient = db.query(Patient).filter(Patient.user_id == current.id).first()
        return [patient] if patient else []
    _require_role(current, "PHYSIOTHERAPIST")
    return db.query(Patient).all()


@patients_router.post("", response_model=PatientRead, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PATIENT")
    existing = db.query(Patient).filter(Patient.user_id == current.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    patient = Patient(user_id=current.id, **payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@patients_router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: UUID, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    _assert_patient_access(db, current, patient_id)
    return p


# ---------- Physiotherapists ----------
physio_router = APIRouter(prefix="/physiotherapists", tags=["physiotherapists"])


@physio_router.get("", response_model=List[PhysiotherapistRead])
def list_physio(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Physiotherapist).all()


@physio_router.get("/me", response_model=PhysiotherapistRead)
def my_physio_profile(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PHYSIOTHERAPIST")
    return _get_physio_profile(db, current)


@physio_router.post("", response_model=PhysiotherapistRead, status_code=201)
def create_physio(payload: PhysiotherapistCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PHYSIOTHERAPIST")
    existing = db.query(Physiotherapist).filter(Physiotherapist.user_id == current.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    p = Physiotherapist(user_id=current.id, **payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ---------- Assignments ----------
assignments_router = APIRouter(prefix="/assignments", tags=["assignments"])


@assignments_router.get("", response_model=List[AssignmentRead])
def list_assignments(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    if current.role == "PATIENT":
        patient = _get_patient_profile(db, current)
        return (
            db.query(PatientTherapistAssignment)
            .filter(PatientTherapistAssignment.patient_id == patient.id)
            .all()
        )
    physio = _get_physio_profile(db, current)
    return (
        db.query(PatientTherapistAssignment)
        .filter(PatientTherapistAssignment.physiotherapist_id == physio.id)
        .all()
    )


@assignments_router.post("", response_model=AssignmentRead, status_code=201)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PHYSIOTHERAPIST")
    physio = _get_physio_profile(db, current)
    if payload.physiotherapist_id != physio.id:
        raise HTTPException(status_code=403, detail="You can only assign patients to yourself")
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    active = (
        db.query(PatientTherapistAssignment)
        .filter(
            PatientTherapistAssignment.patient_id == payload.patient_id,
            PatientTherapistAssignment.status == "ACTIVE",
        )
        .first()
    )
    if active:
        active.status = "ENDED"
        active.ended_at = datetime.now(timezone.utc)
    a = PatientTherapistAssignment(
        patient_id=payload.patient_id,
        physiotherapist_id=physio.id,
        status="ACTIVE",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@assignments_router.patch("/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: UUID,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_role(current, "PHYSIOTHERAPIST")
    physio = _get_physio_profile(db, current)
    assignment = (
        db.query(PatientTherapistAssignment)
        .filter(PatientTherapistAssignment.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Not found")
    if assignment.physiotherapist_id != physio.id:
        raise HTTPException(status_code=403, detail="Assignment belongs to another physiotherapist")

    if payload.status == "ENDED":
        if assignment.status == "ACTIVE":
            assignment.status = "ENDED"
            assignment.ended_at = datetime.now(timezone.utc)
    else:
        if assignment.status == "ACTIVE":
            return assignment
        other_active = (
            db.query(PatientTherapistAssignment)
            .filter(
                PatientTherapistAssignment.patient_id == assignment.patient_id,
                PatientTherapistAssignment.status == "ACTIVE",
            )
            .first()
        )
        if other_active:
            raise HTTPException(status_code=400, detail="Patient already has an active assignment")
        assignment.status = "ACTIVE"
        assignment.ended_at = None

    db.commit()
    db.refresh(assignment)
    return assignment


# ---------- Exercises ----------
exercises_router = APIRouter(prefix="/exercises", tags=["exercises"])


@exercises_router.get("", response_model=List[ExerciseRead])
def list_exercises(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    query = db.query(Exercise)
    if include_inactive and current.role == "PHYSIOTHERAPIST":
        return query.all()
    return query.filter(Exercise.is_active == True).all()


@exercises_router.post("", response_model=ExerciseRead, status_code=201)
def create_exercise(payload: ExerciseCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PHYSIOTHERAPIST")
    e = Exercise(**payload.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e


@exercises_router.get("/{exercise_id}", response_model=ExerciseRead)
def get_exercise(exercise_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    e = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Not found")
    return e


@exercises_router.patch("/{exercise_id}", response_model=ExerciseRead)
def update_exercise(
    exercise_id: UUID,
    payload: ExerciseUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_role(current, "PHYSIOTHERAPIST")
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Not found")

    data = payload.model_dump(exclude_unset=True)
    for required in ("name", "target_joint", "is_active"):
        if required in data and data[required] is None:
            raise HTTPException(status_code=400, detail=f"{required} cannot be null")

    min_angle = data.get("min_angle_threshold", exercise.min_angle_threshold)
    max_angle = data.get("max_angle_threshold", exercise.max_angle_threshold)
    if min_angle is not None and max_angle is not None and min_angle > max_angle:
        raise HTTPException(
            status_code=400,
            detail="min_angle_threshold cannot exceed max_angle_threshold",
        )

    for key, value in data.items():
        setattr(exercise, key, value)
    db.commit()
    db.refresh(exercise)
    return exercise


# ---------- Prescriptions ----------
prescriptions_router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@prescriptions_router.get("", response_model=List[PrescriptionRead])
def list_prescriptions(patient_id: UUID = None, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    q = db.query(Prescription)
    if current.role == "PATIENT":
        patient = _get_patient_profile(db, current)
        if patient_id and patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not allowed to access this patient")
        return q.filter(
            Prescription.patient_id == patient.id,
            Prescription.is_active == True,
        ).all()
    physio = _get_physio_profile(db, current)
    if patient_id:
        _assert_patient_access(db, current, patient_id)
        return q.filter(Prescription.patient_id == patient_id).all()
    return q.filter(Prescription.physiotherapist_id == physio.id).all()


@prescriptions_router.post("", response_model=PrescriptionRead, status_code=201)
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PHYSIOTHERAPIST")
    physio = _get_physio_profile(db, current)
    if payload.physiotherapist_id != physio.id:
        raise HTTPException(status_code=403, detail="You can only prescribe as yourself")
    if not _active_assignment(db, payload.patient_id, physio.id):
        raise HTTPException(status_code=403, detail="Patient is not assigned to you")
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == payload.exercise_id, Exercise.is_active == True)
        .first()
    )
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    p = Prescription(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@prescriptions_router.patch("/{prescription_id}", response_model=PrescriptionRead)
def update_prescription(
    prescription_id: UUID,
    payload: PrescriptionUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    _require_role(current, "PHYSIOTHERAPIST")
    physio = _get_physio_profile(db, current)
    prescription = (
        db.query(Prescription).filter(Prescription.id == prescription_id).first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Not found")
    if prescription.physiotherapist_id != physio.id:
        raise HTTPException(status_code=403, detail="Prescription belongs to another physiotherapist")

    data = payload.model_dump(exclude_unset=True)
    for required in ("target_reps", "target_sets", "is_active"):
        if required in data and data[required] is None:
            raise HTTPException(status_code=400, detail=f"{required} cannot be null")
    if data.get("target_reps") is not None and data["target_reps"] < 1:
        raise HTTPException(status_code=400, detail="target_reps must be at least 1")
    if data.get("target_sets") is not None and data["target_sets"] < 1:
        raise HTTPException(status_code=400, detail="target_sets must be at least 1")

    if data.get("is_active") is True:
        if not _active_assignment(db, prescription.patient_id, physio.id):
            raise HTTPException(status_code=403, detail="Patient is not assigned to you")
        exercise = (
            db.query(Exercise)
            .filter(
                Exercise.id == prescription.exercise_id,
                Exercise.is_active == True,
            )
            .first()
        )
        if not exercise:
            raise HTTPException(status_code=400, detail="Exercise is inactive")

    for key, value in data.items():
        setattr(prescription, key, value)
    db.commit()
    db.refresh(prescription)
    return prescription


# ---------- Rehab Sessions ----------
sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])


@sessions_router.get("", response_model=List[RehabSessionRead])
def list_sessions(
    patient_id: UUID = None,
    session_status: Optional[SessionStatus] = Query(None, alias="status"),
    limit: Optional[int] = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    q = db.query(RehabSession)
    if current.role == "PATIENT":
        patient = _get_patient_profile(db, current)
        if patient_id and patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Not allowed to access this patient")
        q = q.filter(RehabSession.patient_id == patient.id)
    else:
        physio = _get_physio_profile(db, current)
        if patient_id:
            _assert_patient_access(db, current, patient_id)
            q = q.filter(RehabSession.patient_id == patient_id)
        else:
            assigned_ids = [
                a.patient_id
                for a in db.query(PatientTherapistAssignment)
                .filter(
                    PatientTherapistAssignment.physiotherapist_id == physio.id,
                    PatientTherapistAssignment.status == "ACTIVE",
                )
                .all()
            ]
            if not assigned_ids:
                return []
            q = q.filter(RehabSession.patient_id.in_(assigned_ids))

    if session_status:
        q = q.filter(RehabSession.status == session_status)
    q = q.order_by(RehabSession.started_at.desc()).offset(offset)
    if limit is not None:
        q = q.limit(limit)
    return q.all()


@sessions_router.post("", response_model=RehabSessionRead, status_code=201)
def create_session(payload: RehabSessionCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PATIENT")
    patient = _get_patient_profile(db, current)
    if payload.patient_id != patient.id:
        raise HTTPException(status_code=403, detail="You can only start your own session")
    prescription = (
        db.query(Prescription)
        .filter(
            Prescription.id == payload.prescription_id,
            Prescription.patient_id == patient.id,
            Prescription.is_active == True,
        )
        .first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if payload.client_session_id:
        existing = (
            db.query(RehabSession)
            .filter(RehabSession.client_session_id == payload.client_session_id)
            .first()
        )
        if existing:
            if existing.patient_id != patient.id:
                raise HTTPException(status_code=400, detail="Session belongs to another patient")
            return existing
    now = datetime.now(timezone.utc)
    stale_sessions = (
        db.query(RehabSession)
        .filter(
            RehabSession.patient_id == patient.id,
            RehabSession.prescription_id == prescription.id,
            RehabSession.status == "IN_PROGRESS",
        )
        .all()
    )
    for stale in stale_sessions:
        stale.status = "INCOMPLETE"
        stale.completed_at = max(now, stale.started_at)
        stale.synced_at = now

    cid = payload.client_session_id or uuid4()
    s = RehabSession(
        patient_id=payload.patient_id,
        prescription_id=payload.prescription_id,
        started_at=payload.started_at,
        client_session_id=cid,
        status="IN_PROGRESS",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@sessions_router.get("/summary", response_model=List[SessionSummaryRead])
def list_session_summaries(
    patient_id: UUID = None,
    session_status: Optional[SessionStatus] = Query(None, alias="status"),
    limit: Optional[int] = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    sessions = list_sessions(
        patient_id=patient_id,
        session_status=session_status,
        limit=limit,
        offset=offset,
        db=db,
        current=current,
    )
    session_ids = [session.id for session in sessions]
    if not session_ids:
        return []

    rows = (
        db.query(
            RehabSession.id,
            RehabSession.patient_id,
            RehabSession.prescription_id,
            RehabSession.status,
            RehabSession.started_at,
            RehabSession.completed_at,
            Exercise.id.label("exercise_id"),
            Exercise.name.label("exercise_name"),
            Exercise.target_joint,
            Prescription.target_reps,
            Prescription.target_sets,
            func.count(RepMetric.id).label("rep_count"),
            func.count(RepMetric.id)
            .filter(RepMetric.assessment_status == "ASSESSED")
            .label("assessed_count"),
            func.avg(RepMetric.range_of_motion).label("avg_rom"),
            func.max(RepMetric.range_of_motion).label("best_rom"),
            func.avg(RepMetric.confidence).label("avg_confidence"),
            func.max(RepMetric.created_at).label("last_rep_at"),
        )
        .join(Prescription, Prescription.id == RehabSession.prescription_id)
        .join(Exercise, Exercise.id == Prescription.exercise_id)
        .outerjoin(RepMetric, RepMetric.session_id == RehabSession.id)
        .filter(RehabSession.id.in_(session_ids))
        .group_by(
            RehabSession.id,
            RehabSession.patient_id,
            RehabSession.prescription_id,
            RehabSession.status,
            RehabSession.started_at,
            RehabSession.completed_at,
            Exercise.id,
            Exercise.name,
            Exercise.target_joint,
            Prescription.target_reps,
            Prescription.target_sets,
        )
        .order_by(RehabSession.started_at.desc())
        .all()
    )

    return [
        SessionSummaryRead(
            id=row.id,
            patient_id=row.patient_id,
            prescription_id=row.prescription_id,
            exercise_id=row.exercise_id,
            exercise_name=row.exercise_name,
            target_joint=row.target_joint,
            target_reps=row.target_reps,
            target_sets=row.target_sets,
            status=row.status,
            started_at=row.started_at,
            completed_at=row.completed_at,
            rep_count=int(row.rep_count or 0),
            assessed_count=int(row.assessed_count or 0),
            unable_count=int((row.rep_count or 0) - (row.assessed_count or 0)),
            avg_rom=round(row.avg_rom, 2) if row.avg_rom is not None else None,
            best_rom=round(row.best_rom, 2) if row.best_rom is not None else None,
            avg_confidence=(
                round(row.avg_confidence, 3)
                if row.avg_confidence is not None
                else None
            ),
            last_rep_at=row.last_rep_at,
        )
        for row in rows
    ]


@sessions_router.get("/{session_id}", response_model=RehabSessionRead)
def get_session(session_id: UUID, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    s = db.query(RehabSession).filter(RehabSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    _assert_session_access(db, current, s)
    return s


@sessions_router.post("/{session_id}/complete", response_model=RehabSessionRead)
def complete_session(
    session_id: UUID,
    status: Literal["COMPLETED", "INCOMPLETE", "UNABLE_TO_ASSESS"] = "COMPLETED",
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    s = db.query(RehabSession).filter(RehabSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    _assert_session_access(db, current, s)
    if s.status != "IN_PROGRESS":
        if s.status == status:
            return s
        raise HTTPException(status_code=400, detail="Session already completed")
    now = datetime.now(timezone.utc)
    s.status = status
    s.completed_at = now
    s.synced_at = now
    db.commit()
    db.refresh(s)
    return s


# ---------- Rep Metrics ----------
reps_router = APIRouter(prefix="/rep-metrics", tags=["rep-metrics"])


@reps_router.get("", response_model=List[RepMetricRead])
def list_reps(
    session_id: UUID = None,
    rep_assessment_status: Optional[AssessmentStatus] = Query(
        None, alias="assessment_status"
    ),
    limit: Optional[int] = Query(None, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    q = db.query(RepMetric)
    if current.role == "PATIENT":
        patient = _get_patient_profile(db, current)
        if session_id:
            session = db.query(RehabSession).filter(RehabSession.id == session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            _assert_session_access(db, current, session)
            q = q.filter(RepMetric.session_id == session_id)
        else:
            session_ids = [
                row[0]
                for row in db.query(RehabSession.id)
                .filter(RehabSession.patient_id == patient.id)
                .all()
            ]
            if not session_ids:
                return []
            q = q.filter(RepMetric.session_id.in_(session_ids))
    else:
        physio = _get_physio_profile(db, current)
        if session_id:
            session = db.query(RehabSession).filter(RehabSession.id == session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            _assert_session_access(db, current, session)
            q = q.filter(RepMetric.session_id == session_id)
        else:
            assigned_ids = [
                a.patient_id
                for a in db.query(PatientTherapistAssignment)
                .filter(
                    PatientTherapistAssignment.physiotherapist_id == physio.id,
                    PatientTherapistAssignment.status == "ACTIVE",
                )
                .all()
            ]
            if not assigned_ids:
                return []
            session_ids = [
                row[0]
                for row in db.query(RehabSession.id)
                .filter(RehabSession.patient_id.in_(assigned_ids))
                .all()
            ]
            if not session_ids:
                return []
            q = q.filter(RepMetric.session_id.in_(session_ids))

    if rep_assessment_status:
        q = q.filter(RepMetric.assessment_status == rep_assessment_status)
    q = q.order_by(RepMetric.rep_number.asc()).offset(offset)
    if limit is not None:
        q = q.limit(limit)
    return q.all()


@reps_router.post("", response_model=RepMetricRead, status_code=201)
def create_rep(payload: RepMetricCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    _require_role(current, "PATIENT")
    patient = _get_patient_profile(db, current)
    session = (
        db.query(RehabSession)
        .filter(
            RehabSession.id == payload.session_id,
            RehabSession.patient_id == patient.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "IN_PROGRESS":
        raise HTTPException(status_code=400, detail="Session is not in progress")

    data = payload.model_dump(exclude={"rep_number", "session_id"})
    if data.get("set_number") is None:
        data["set_number"] = 1
    elif data["set_number"] < 1:
        raise HTTPException(status_code=400, detail="set_number must be at least 1")
    if data.get("confidence") is not None and data["confidence"] < 0.5:
        data["assessment_status"] = "UNABLE_TO_ASSESS"
    if data["assessment_status"] == "ASSESSED" and data.get("range_of_motion") is None:
        data["assessment_status"] = "UNABLE_TO_ASSESS"
    if data["assessment_status"] == "UNABLE_TO_ASSESS":
        data["range_of_motion"] = None

    next_number = (
        db.query(func.max(RepMetric.rep_number))
        .filter(RepMetric.session_id == session.id)
        .scalar()
        or 0
    ) + 1
    r = RepMetric(session_id=session.id, rep_number=next_number, **data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
