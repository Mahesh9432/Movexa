from datetime import datetime, timezone
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.connection import get_db
from app.models import *
from app.schemas.common import *
from app.core.security import verify_password, get_password_hash, create_access_token


# ---------- Auth ----------
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.role not in ("PATIENT", "PHYSIOTHERAPIST"):
        raise HTTPException(status_code=400, detail="Invalid role")
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
    return user


@auth_router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
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
def list_patients(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Patient).all()


@patients_router.post("", response_model=PatientRead, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    existing = db.query(Patient).filter(Patient.user_id == current.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")
    patient = Patient(user_id=current.id, **payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@patients_router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return p


# ---------- Physiotherapists ----------
physio_router = APIRouter(prefix="/physiotherapists", tags=["physiotherapists"])


@physio_router.get("", response_model=List[PhysiotherapistRead])
def list_physio(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Physiotherapist).all()


@physio_router.post("", response_model=PhysiotherapistRead, status_code=201)
def create_physio(payload: PhysiotherapistCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    p = Physiotherapist(user_id=current.id, **payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ---------- Assignments ----------
assignments_router = APIRouter(prefix="/assignments", tags=["assignments"])


@assignments_router.get("", response_model=List[AssignmentRead])
def list_assignments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(PatientTherapistAssignment).all()


@assignments_router.post("", response_model=AssignmentRead, status_code=201)
def create_assignment(payload: AssignmentCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    active = db.query(PatientTherapistAssignment).filter(
        PatientTherapistAssignment.patient_id == payload.patient_id,
        PatientTherapistAssignment.status == "ACTIVE",
    ).first()
    if active:
        active.status = "ENDED"
        active.ended_at = datetime.now(timezone.utc)
    a = PatientTherapistAssignment(patient_id=payload.patient_id, physiotherapist_id=payload.physiotherapist_id, status="ACTIVE")
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


# ---------- Exercises ----------
exercises_router = APIRouter(prefix="/exercises", tags=["exercises"])


@exercises_router.get("", response_model=List[ExerciseRead])
def list_exercises(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Exercise).filter(Exercise.is_active == True).all()


@exercises_router.post("", response_model=ExerciseRead, status_code=201)
def create_exercise(payload: ExerciseCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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


# ---------- Prescriptions ----------
prescriptions_router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


@prescriptions_router.get("", response_model=List[PrescriptionRead])
def list_prescriptions(patient_id: UUID = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(Prescription)
    if patient_id:
        q = q.filter(Prescription.patient_id == patient_id)
    return q.all()


@prescriptions_router.post("", response_model=PrescriptionRead, status_code=201)
def create_prescription(payload: PrescriptionCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    p = Prescription(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


# ---------- Rehab Sessions ----------
sessions_router = APIRouter(prefix="/sessions", tags=["sessions"])


@sessions_router.get("", response_model=List[RehabSessionRead])
def list_sessions(patient_id: UUID = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(RehabSession)
    if patient_id:
        q = q.filter(RehabSession.patient_id == patient_id)
    return q.all()


@sessions_router.post("", response_model=RehabSessionRead, status_code=201)
def create_session(payload: RehabSessionCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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


@sessions_router.post("/{session_id}/complete", response_model=RehabSessionRead)
def complete_session(session_id: UUID, status: str = "COMPLETED", db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(RehabSession).filter(RehabSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    s.status = status
    s.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(s)
    return s


# ---------- Rep Metrics ----------
reps_router = APIRouter(prefix="/rep-metrics", tags=["rep-metrics"])


@reps_router.get("", response_model=List[RepMetricRead])
def list_reps(session_id: UUID = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(RepMetric)
    if session_id:
        q = q.filter(RepMetric.session_id == session_id)
    return q.all()


@reps_router.post("", response_model=RepMetricRead, status_code=201)
def create_rep(payload: RepMetricCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if payload.confidence is not None and payload.confidence < 0.5:
        payload.assessment_status = "UNABLE_TO_ASSESS"
        payload.range_of_motion = None
    r = RepMetric(**payload.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r
