import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from datetime import datetime, timezone

from app.database.connection import SessionLocal
from app.models import User, Patient, Physiotherapist, PatientTherapistAssignment, Exercise, Prescription
from app.core.security import get_password_hash

db = SessionLocal()

if db.query(User).count() == 0:
    patient_user = User(
        full_name="Demo Patient",
        email="patient@movexa.dev",
        hashed_password=get_password_hash("patient123"),
        role="PATIENT",
    )
    physio_user = User(
        full_name="Demo Physiotherapist",
        email="physio@movexa.dev",
        hashed_password=get_password_hash("physio123"),
        role="PHYSIOTHERAPIST",
    )
    db.add_all([patient_user, physio_user])
    db.commit()
    db.refresh(patient_user)
    db.refresh(physio_user)

    patient = Patient(user_id=patient_user.id, injury="Knee rehab", affected_area="Knee")
    physio = Physiotherapist(
        user_id=physio_user.id,
        qualification="BPT",
        registration_number="REG-001",
        years_experience=5,
        verification_status="VERIFIED",
    )
    db.add_all([patient, physio])
    db.commit()
    db.refresh(patient)
    db.refresh(physio)

    assignment = PatientTherapistAssignment(
        patient_id=patient.id, physiotherapist_id=physio.id, status="ACTIVE"
    )
    db.add(assignment)
    db.commit()

    exercises = [
        Exercise(name="Knee Flexion", target_joint="Knee", min_angle_threshold=30, max_angle_threshold=120, instructions="Flex knee slowly.", video_url=None),
        Exercise(name="Shoulder Abduction", target_joint="Shoulder", min_angle_threshold=20, max_angle_threshold=160, instructions="Raise arm to side."),
    ]
    db.add_all(exercises)
    db.commit()
    for e in exercises:
        db.refresh(e)

    prescription = Prescription(
        patient_id=patient.id,
        physiotherapist_id=physio.id,
        exercise_id=exercises[0].id,
        target_reps=10,
        target_sets=3,
    )
    db.add(prescription)
    db.commit()
    print("Seeded demo data")
else:
    print("Database already has users; skipping seed")

db.close()
