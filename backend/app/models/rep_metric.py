import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Uuid,
    func,
)

from sqlalchemy.dialects.postgresql import JSONB

from app.database.connection import Base


class RepMetric(Base):
    __tablename__ = "rep_metrics"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "rep_number",
            name="uq_rep_metric_session_rep",
        ),
        CheckConstraint(
            "rep_number > 0",
            name="ck_rep_metric_rep_number",
        ),
        CheckConstraint(
            "set_number > 0",
            name="ck_rep_metric_set_number",
        ),
        CheckConstraint(
            "assessment_status IN ('ASSESSED', 'UNABLE_TO_ASSESS')",
            name="ck_rep_metric_assessment_status",
        ),
        CheckConstraint(
            "confidence IS NULL OR "
            "(confidence >= 0 AND confidence <= 1)",
            name="ck_rep_metric_confidence",
        ),
        CheckConstraint(
            "range_of_motion IS NULL OR range_of_motion >= 0",
            name="ck_rep_metric_range_of_motion",
        ),
        CheckConstraint(
            "assessment_status != 'UNABLE_TO_ASSESS' "
            "OR range_of_motion IS NULL",
            name="ck_rep_metric_unassessable_rom",
        ),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    session_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("rehab_sessions.id"),
        nullable=False,
        index=True,
    )

    rep_number = Column(
        Integer,
        nullable=False,
    )

    set_number = Column(
        Integer,
        nullable=False,
        default=1,
        server_default="1",
    )

    assessment_status = Column(
        String(30),
        nullable=False,
    )

    range_of_motion = Column(
        Float,
        nullable=True,
    )

    confidence = Column(
        Float,
        nullable=True,
    )

    movement_data = Column(
        JSONB,
        nullable=True,
    )

    compensation_flags = Column(
        JSONB,
        nullable=True,
    )

    detected_issues = Column(
        JSONB,
        nullable=True,
    )

    feedback = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )