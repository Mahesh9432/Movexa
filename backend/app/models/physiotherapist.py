import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    func,
)

from app.database.connection import Base


class Physiotherapist(Base):
    __tablename__ = "physiotherapists"

    __table_args__ = (
        CheckConstraint(
            "years_experience >= 0",
            name="ck_physiotherapist_years_experience",
        ),
    )

    id = Column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        Uuid(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    qualification = Column(
        String(150),
        nullable=False,
    )

    specialization = Column(
        String(150),
        nullable=True,
    )

    registration_number = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    years_experience = Column(
        Integer,
        nullable=False,
        default=0,
    )

    clinic_name = Column(
        String(150),
        nullable=True,
    )

    clinic_address = Column(
        Text,
        nullable=True,
    )

    professional_bio = Column(
        Text,
        nullable=True,
    )

    verification_status = Column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
