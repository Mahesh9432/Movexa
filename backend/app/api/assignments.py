from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import (
    require_role,
    require_verified_physiotherapist,
)
from app.database.connection import get_db
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentEnd,
    AssignmentResponse,
)
from app.services.assignment_service import (
    create_assignment,
    end_assignment,
    get_patient_active_assignment,
)


router = APIRouter(prefix="/api", tags=["Assignments"])


@router.post(
    "/assignments",
    response_model=AssignmentResponse,
    status_code=201,
)
def create_patient_assignment(
    data: AssignmentCreate,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return create_assignment(
        db=db,
        user=current_user,
        assignment_data=data,
    )


@router.patch(
    "/assignments/{assignment_id}/end",
    response_model=AssignmentResponse,
)
def end_patient_assignment(
    assignment_id: UUID,
    data: AssignmentEnd | None = None,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return end_assignment(
        db=db,
        user=current_user,
        assignment_id=assignment_id,
        end_data=data,
    )


@router.get(
    "/patients/me/assignment",
    response_model=AssignmentResponse | None,
)
def read_patient_active_assignment(
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    return get_patient_active_assignment(
        db=db,
        user=current_user,
    )
