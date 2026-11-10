from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.api.sessions import _get_owned_session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.rep_metric import (
    RepMetricsBatchCreate,
    RepMetricsBatchResponse,
)
from app.services.rep_metric_service import (
    DuplicateRepMetricError,
    InvalidMetricsSessionError,
    get_rep_metrics,
    save_rep_metrics,
)


router = APIRouter(prefix="/api", tags=["Repetition Metrics"])


@router.post(
    "/sessions/{session_id}/metrics",
    response_model=RepMetricsBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session_metrics(
    session_id: UUID,
    data: RepMetricsBatchCreate,
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, current_user)

    try:
        records = save_rep_metrics(db, session, data)
    except DuplicateRepMetricError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except InvalidMetricsSessionError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return RepMetricsBatchResponse(
        session_id=session.id,
        total_repetitions=len(records),
        repetitions_data=records,
    )


@router.get(
    "/sessions/{session_id}/metrics",
    response_model=RepMetricsBatchResponse,
)
def read_session_metrics(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = _get_owned_session(db, session_id, current_user)
    records = get_rep_metrics(db, session.id)

    return RepMetricsBatchResponse(
        session_id=session.id,
        total_repetitions=len(records),
        repetitions_data=records,
    )
