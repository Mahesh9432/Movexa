from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_verified_physiotherapist,
)
from app.database.connection import get_db
from app.models.user import User
from app.schemas.exercise import (
    ExerciseCreate,
    ExerciseResponse,
    ExerciseUpdate,
)
from app.services.exercise_service import (
    create_exercise,
    get_exercise,
    list_exercises,
    update_exercise,
)


router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


@router.get("", response_model=list[ExerciseResponse])
def read_exercises(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_exercises(db)


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def read_exercise(
    exercise_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exercise = get_exercise(db, exercise_id)

    if not exercise.is_active:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    return exercise


@router.post(
    "",
    response_model=ExerciseResponse,
    status_code=201,
)
def add_exercise(
    data: ExerciseCreate,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return create_exercise(db, data)


@router.patch(
    "/{exercise_id}",
    response_model=ExerciseResponse,
)
def edit_exercise(
    exercise_id: UUID,
    data: ExerciseUpdate,
    current_user: User = Depends(require_verified_physiotherapist),
    db: Session = Depends(get_db),
):
    return update_exercise(db, exercise_id, data)
