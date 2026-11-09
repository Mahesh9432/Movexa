import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    String,
    Uuid,
    func,
)

from app.database.connection import Base


class RehabSession(Base):
    __tablename__ = "rehab_sessions"

    __table_args__ = (
        CheckConstraint(
            "status IN ('IN_PROGRESS', 'COMPLETED', "
            "'INCOMPLETE', 'UNABLE_TO_ASSESS')",
            name="ck_rehab_session_status",
        ),
        CheckConstraint(
            "completed_at IS NULL OR completed_at >= started_at",
            name="ck_rehab_session_completion_time",
        ),
        CheckConstraint(
            "(status = 'IN_PROGRESS' AND completed_at IS NULL) OR "
            "(status IN ('COMPLETED', 'INCOMPLETE', 'UNABLE_TO_ASSESS') "
            "AND completed_at IS NOT NULL)",
            name="ck_rehab_session_status_completion_consistency",
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

    prescription_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("prescriptions.id"),
        nullable=False,
        index=True,
    )

    status = Column(
        String(30),
        nullable=False,
        default="IN_PROGRESS",
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    synced_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    client_session_id = Column(
        Uuid(as_uuid=True),
        nullable=False,
        unique=True,
        default=uuid.uuid4,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
