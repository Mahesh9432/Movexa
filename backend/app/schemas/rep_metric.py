from typing import Any, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


AssessmentStatus = Literal["ASSESSED", "UNABLE_TO_ASSESS"]


class RepMetricCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rep_number: int = Field(gt=0)
    assessment_status: AssessmentStatus
    range_of_motion: float | None = Field(default=None, ge=0)
    confidence: float | None = Field(default=None, ge=0, le=1)
    movement_data: dict[str, Any] | list[Any] | None = None
    compensation_flags: dict[str, Any] | list[Any] | None = None
    detected_issues: dict[str, Any] | list[Any] | None = None
    feedback: str | None = None

    @model_validator(mode="after")
    def validate_assessment(self):
        if (
            self.assessment_status == "UNABLE_TO_ASSESS"
            and self.range_of_motion is not None
        ):
            raise ValueError(
                "range_of_motion must be null when assessment is "
                "UNABLE_TO_ASSESS"
            )

        return self


class RepMetricsBatchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    repetitions_data: list[RepMetricCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_repetitions(self):
        numbers = [
            item.rep_number for item in self.repetitions_data
        ]

        if len(numbers) != len(set(numbers)):
            raise ValueError(
                "Each repetition number must be unique within the request"
            )

        return self


class OfflineSessionSyncRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    repetitions_data: list[RepMetricCreate] = Field(
        default_factory=list
    )

    @model_validator(mode="after")
    def validate_unique_repetitions(self):
        numbers = [
            item.rep_number for item in self.repetitions_data
        ]

        if len(numbers) != len(set(numbers)):
            raise ValueError(
                "Each repetition number must be unique within the request"
            )

        return self


class RepMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    rep_number: int
    assessment_status: AssessmentStatus
    range_of_motion: float | None
    confidence: float | None
    movement_data: dict[str, Any] | list[Any] | None
    compensation_flags: dict[str, Any] | list[Any] | None
    detected_issues: dict[str, Any] | list[Any] | None
    feedback: str | None


class RepMetricsBatchResponse(BaseModel):
    session_id: UUID
    total_repetitions: int
    repetitions_data: list[RepMetricResponse]