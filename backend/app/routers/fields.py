from typing import List
from fastapi import APIRouter, HTTPException
from app.schemas.field import FieldResponse, FieldStatusResponse
from app.data.fixtures import get_all_fields, get_field_status

router = APIRouter(tags=["fields"])


@router.get("/fields", response_model=List[FieldResponse])
@router.get("/api/v1/fields", response_model=List[FieldResponse], include_in_schema=False)
def list_fields() -> List[FieldResponse]:
    """Retrieve all demonstration fields with GeoJSON geometry."""
    return get_all_fields()


@router.get("/fields/{field_id}/status", response_model=FieldStatusResponse)
@router.get("/api/v1/fields/{field_id}/status", response_model=FieldStatusResponse, include_in_schema=False)
def get_field_status_endpoint(field_id: str) -> FieldStatusResponse:
    """Retrieve field status and recent observation freshness metadata for a specific field."""
    status_data = get_field_status(field_id)
    if not status_data:
        raise HTTPException(
            status_code=404,
            detail=f"Field '{field_id}' not found"
        )
    return status_data
