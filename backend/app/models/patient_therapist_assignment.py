import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    Uuid,
    func,
    text,
)

from app.database.connection import Base


class PatientTherapistAssignment(Base):
    __tablename__ = "patient_therapist_assignments"

    __table_args__ = (
        CheckConstraint(
            "status IN ('ACTIVE', 'ENDED')",
            name="ck_assignment_status",
        ),
        CheckConstraint(
            "(status = 'ACTIVE' AND ended_at IS NULL) OR "
            "(status = 'ENDED' AND ended_at IS NOT NULL)",
            name="ck_assignment_end_time",
        ),
        CheckConstraint(
            "ended_at IS NULL OR ended_at >= assigned_at",
            name="ck_assignment_timestamp_order",
        ),
        Index(
            "uq_active_primary_assignment_per_patient",
            "patient_id",
            unique=True,
            postgresql_where=text("status = 'ACTIVE'"),
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

    status = Column(
        String(20),
        nullable=False,
        default="ACTIVE",
    )

    assigned_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    ended_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
