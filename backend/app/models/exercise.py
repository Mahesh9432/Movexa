import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    String,
    Text,
    Uuid,
    func,
)

from app.database.connection import Base


class Exercise(Base):
    __tablename__ = "exercises"

    __table_args__ = (
        CheckConstraint(
            "min_angle_threshold IS NULL OR "
            "min_angle_threshold >= 0",
            name="ck_exercise_min_angle",
        ),
        CheckConstraint(
            "max_angle_threshold IS NULL OR "
            "max_angle_threshold >= 0",
            name="ck_exercise_max_angle",
        ),
        CheckConstraint(
            "min_angle_threshold IS NULL OR "
            "max_angle_threshold IS NULL OR "
            "min_angle_threshold <= max_angle_threshold",
            name="ck_exercise_angle_range",
        ),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    target_joint = Column(
        String(100),
        nullable=False,
    )

    min_angle_threshold = Column(
        Float,
        nullable=True,
    )

    max_angle_threshold = Column(
        Float,
        nullable=True,
    )

    instructions = Column(
        Text,
        nullable=True,
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
