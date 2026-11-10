from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.api.sessions import _get_owned_session
from app.database.connection import get_db
from app.models.user import User
from app.schemas.rep_metric import (
    RepMetricsBatchCreate,
    RepMetricsBatchResponse,
)
from app.services.ai_metrics_adapter import (
    AIEngineIntegrationError,
    adapt_ai_result,
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
    data: dict[str, Any],
    current_user: User = Depends(require_role("PATIENT")),
    db: Session = Depends(get_db),
):
    try:
        if "individual_repetitions" in data:
            metrics_data = adapt_ai_result(data)
        else:
            metrics_data = RepMetricsBatchCreate.model_validate(data)

    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(include_context=False),
        ) from exc

    except AIEngineIntegrationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    session = _get_owned_session(db, session_id, current_user)

    if "individual_repetitions" in data:
        ai_session_id = data.get("session_id")

        if ai_session_id is not None:
            try:
                payload_session_id = UUID(str(ai_session_id))
            except (ValueError, TypeError, AttributeError):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="AI result contains an invalid session_id",
                )

            if payload_session_id != session.id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "AI result session_id does not match "
                        "the requested session"
                    ),
                )

    try:
        records = save_rep_metrics(db, session, metrics_data)

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
