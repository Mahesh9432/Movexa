import uuid

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    String,
    Text,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.database.connection import Base


class Patient(Base):
    __tablename__ = "patients"

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

    user = relationship("User", lazy="joined")

    @property
    def full_name(self):
        return self.user.full_name if self.user else None

    date_of_birth = Column(
        Date,
        nullable=True,
    )

    gender = Column(
        String(30),
        nullable=True,
    )

    injury = Column(
        Text,
        nullable=True,
    )

    affected_area = Column(
        String(150),
        nullable=True,
    )

    treatment_start_date = Column(
        Date,
        nullable=True,
    )

    emergency_contact_name = Column(
        String(100),
        nullable=True,
    )

    emergency_contact_relationship = Column(
        String(50),
        nullable=True,
    )

    emergency_contact_phone = Column(
        String(20),
        nullable=True,
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
