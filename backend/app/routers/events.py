"""
Events Router for JalSetu AI.

Provides POST /events and GET /events (with /api/v1 aliases) for action logging,
audit tracking, and recommendation overrides.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.data.fixtures import DEMO_FIELDS_RAW
from app.schemas.events import EventCreateRequest, EventResponse, create_event_record_from_request
from app.services.event_store import EventStore, get_event_store

router = APIRouter(tags=["events"])


@router.post(
    "/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/api/v1/events",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_event_endpoint(
    request: EventCreateRequest,
    store: EventStore = Depends(get_event_store),
) -> EventResponse:
    """
    Log an agronomic action, recommendation override, or planning audit event.
    Returns the server-sealed event record with unique event_id and UTC timestamp.
    """
    known_fields = {f["id"] for f in DEMO_FIELDS_RAW}
    if request.field_id and request.field_id not in known_fields:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{request.field_id}' not found in cluster registry"
        )

    event_record = create_event_record_from_request(request)
    saved_event = store.append(event_record)
    return saved_event


@router.get("/events", response_model=List[EventResponse])
@router.get("/api/v1/events", response_model=List[EventResponse], include_in_schema=False)
def list_events_endpoint(
    field_id: Optional[str] = Query(None, description="Filter events by field ID"),
    event_type: Optional[str] = Query(None, description="Filter events by event type"),
    limit: int = Query(50, ge=1, le=1000, description="Maximum events to return"),
    store: EventStore = Depends(get_event_store),
) -> List[EventResponse]:
    """
    Retrieve audit trail and logged actions with optional field, event_type, and limit filters.
    """
    known_fields = {f["id"] for f in DEMO_FIELDS_RAW}
    if field_id and field_id not in known_fields:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{field_id}' not found in cluster registry"
        )

    return store.list(field_id=field_id, event_type=event_type, limit=limit)

