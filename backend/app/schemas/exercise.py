from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExerciseBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    target_joint: str = Field(min_length=1, max_length=100)
    min_angle_threshold: float | None = Field(default=None, ge=0)
    max_angle_threshold: float | None = Field(default=None, ge=0)
    instructions: str | None = None
    is_active: bool = True

    @model_validator(mode="after")
    def validate_angle_range(self):
        if (
            self.min_angle_threshold is not None
            and self.max_angle_threshold is not None
            and self.min_angle_threshold > self.max_angle_threshold
        ):
            raise ValueError("Minimum angle cannot exceed maximum angle")
        return self


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    target_joint: str | None = Field(default=None, min_length=1, max_length=100)
    min_angle_threshold: float | None = Field(default=None, ge=0)
    max_angle_threshold: float | None = Field(default=None, ge=0)
    instructions: str | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def validate_angle_range(self):
        if (
            self.min_angle_threshold is not None
            and self.max_angle_threshold is not None
            and self.min_angle_threshold > self.max_angle_threshold
        ):
            raise ValueError("Minimum angle cannot exceed maximum angle")
        return self


class ExerciseResponse(ExerciseBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
