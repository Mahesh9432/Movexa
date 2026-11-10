from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate


def list_exercises(db: Session, include_inactive: bool = False):
    query = db.query(Exercise)

    if not include_inactive:
        query = query.filter(Exercise.is_active.is_(True))

    return query.order_by(Exercise.name.asc()).all()


def get_exercise(db: Session, exercise_id: UUID):
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id)
        .first()
    )

    if exercise is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercise not found",
        )

    return exercise


def create_exercise(db: Session, data: ExerciseCreate):
    exercise = Exercise(**data.model_dump())

    try:
        db.add(exercise)
        db.commit()
        db.refresh(exercise)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to create exercise",
        )
    except Exception:
        db.rollback()
        raise

    return exercise


def update_exercise(
    db: Session,
    exercise_id: UUID,
    data: ExerciseUpdate,
):
    exercise = get_exercise(db, exercise_id)

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(exercise, field, value)

    try:
        db.commit()
        db.refresh(exercise)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Unable to update exercise",
        )
    except Exception:
        db.rollback()
        raise

    return exercise
