from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_verified_physiotherapist,
)
from app.database.connection import get_db
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse,
    PrescriptionUpdate,
)
from app.services.prescription_service import (
    create_prescription,
    get_prescription,
    list_prescriptions,
    update_prescription,
)


router = APIRouter(
    prefix="/api/prescriptions",
    tags=["Prescriptions"],
)


@router.get(
    "",
    response_model=list[PrescriptionResponse],
)
def read_prescriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_prescriptions(db, current_user)


@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
)
def read_prescription(
    prescription_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_prescription(db, current_user, prescription_id)


@router.post(
    "",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_prescription(
    data: PrescriptionCreate,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return create_prescription(db, current_user, data)


@router.patch(
    "/{prescription_id}",
    response_model=PrescriptionResponse,
)
def edit_prescription(
    prescription_id: UUID,
    data: PrescriptionUpdate,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return update_prescription(
        db,
        current_user,
        prescription_id,
        data,
    )
