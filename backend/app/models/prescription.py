import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Uuid,
    func,
)

from app.database.connection import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

    __table_args__ = (
        CheckConstraint(
            "target_reps > 0",
            name="ck_prescription_target_reps",
        ),
        CheckConstraint(
            "target_sets > 0",
            name="ck_prescription_target_sets",
        ),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    patient_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id"),
        nullable=False,
        index=True,
    )

    physiotherapist_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("physiotherapists.id"),
        nullable=False,
        index=True,
    )

    exercise_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("exercises.id"),
        nullable=False,
        index=True,
    )

    target_reps = Column(
        Integer,
        nullable=False,
        default=10,
    )

    target_sets = Column(
        Integer,
        nullable=False,
        default=3,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
