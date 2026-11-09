"""
Deterministic local demo fixtures for JalSetu AI fields and observations.

DISCLAIMER:
All data provided in this fixture module is synthetic/cached/replayed
demonstration data for the Pimpri-Chinchwad agricultural cluster.
It does NOT represent real farmer observations or live sensor feeds.
"""

from typing import Dict, List, Optional
from app.schemas.field import FieldResponse, FieldStatusResponse, FreshnessMeta
from app.schemas.observation import ObservationResponse

DEMO_FIELDS_RAW = [
    {
        "id": "PC-001",
        "name": "Field 1 - Tomato Alpha",
        "crop": "Tomato",
        "stage": "Flowering",
        "area_acres": 1.5,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.812, 18.712], [73.815, 18.712], [73.815, 18.715], [73.812, 18.715], [73.812, 18.712]]]
        }
    },
    {
        "id": "PC-002",
        "name": "Field 2 - Tomato Beta",
        "crop": "Tomato",
        "stage": "Fruiting",
        "area_acres": 2.0,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.816, 18.712], [73.819, 18.712], [73.819, 18.715], [73.816, 18.715], [73.816, 18.712]]]
        }
    },
    {
        "id": "PC-003",
        "name": "Field 3 - Eggplant North",
        "crop": "Eggplant",
        "stage": "Vegetative",
        "area_acres": 1.2,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.820, 18.712], [73.823, 18.712], [73.823, 18.715], [73.820, 18.715], [73.820, 18.712]]]
        }
    },
    {
        "id": "PC-004",
        "name": "Field 4 - Onion Plot A",
        "crop": "Onion",
        "stage": "Bulb Development",
        "area_acres": 2.5,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.812, 18.716], [73.815, 18.716], [73.815, 18.719], [73.812, 18.719], [73.812, 18.716]]]
        }
    },
    {
        "id": "PC-005",
        "name": "Field 5 - Chili South",
        "crop": "Chili",
        "stage": "Flowering",
        "area_acres": 1.8,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.816, 18.716], [73.819, 18.716], [73.819, 18.719], [73.816, 18.719], [73.816, 18.716]]]
        }
    },
    {
        "id": "PC-006",
        "name": "Field 6 - Capsicum Green",
        "crop": "Capsicum",
        "stage": "Fruiting",
        "area_acres": 1.4,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.820, 18.716], [73.823, 18.716], [73.823, 18.719], [73.820, 18.719], [73.820, 18.716]]]
        }
    },
    {
        "id": "PC-007",
        "name": "Field 7 - Tomato Gamma",
        "crop": "Tomato",
        "stage": "Sowing",
        "area_acres": 3.0,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.812, 18.720], [73.815, 18.720], [73.815, 18.723], [73.812, 18.723], [73.812, 18.720]]]
        }
    },
    {
        "id": "PC-008",
        "name": "Field 8 - Cucumber West",
        "crop": "Cucumber",
        "stage": "Vegetative",
        "area_acres": 1.1,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.816, 18.720], [73.819, 18.720], [73.819, 18.723], [73.816, 18.723], [73.816, 18.720]]]
        }
    },
    {
        "id": "PC-009",
        "name": "Field 9 - Cabbage East",
        "crop": "Cabbage",
        "stage": "Head Formation",
        "area_acres": 2.2,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.820, 18.720], [73.823, 18.720], [73.823, 18.723], [73.820, 18.723], [73.820, 18.720]]]
        }
    },
    {
        "id": "PC-010",
        "name": "Field 10 - Tomato Delta",
        "crop": "Tomato",
        "stage": "Harvesting",
        "area_acres": 1.7,
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[73.824, 18.712], [73.827, 18.712], [73.827, 18.715], [73.824, 18.715], [73.824, 18.712]]]
        }
    }
]

DEMO_STATUS_RAW = {
    "PC-001": {
        "status": "green",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-001",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 14.2,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-10-07T10:30:00Z",
                "field_id": "PC-001",
                "source": "SENTINEL_2",
                "variable": "ndvi",
                "value": 0.72,
                "quality_flag": "GOOD",
                "freshness_age": "34h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-10-08T06:00:00Z",
                "field_id": "PC-001",
                "source": "SOIL_GRIDS",
                "variable": "soil_moisture_pct",
                "value": 28.5,
                "quality_flag": "GOOD",
                "freshness_age": "6h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T06:00:00Z"}
        }
    },
    "PC-002": {
        "status": "amber",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-002",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 2.1,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-10-07T10:30:00Z",
                "field_id": "PC-002",
                "source": "SENTINEL_2",
                "variable": "ndvi",
                "value": 0.58,
                "quality_flag": "GOOD",
                "freshness_age": "34h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 2, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-06T06:00:00Z"}
        }
    },
    "PC-003": {
        "status": "green",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-003",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 18.0,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 2, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-06T10:30:00Z"},
            "soil": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T06:00:00Z"}
        }
    },
    "PC-004": {
        "status": "red",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-004",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 0.0,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-10-07T10:30:00Z",
                "field_id": "PC-004",
                "source": "SENTINEL_2",
                "variable": "ndvi",
                "value": 0.41,
                "quality_flag": "SUSPECT",
                "freshness_age": "34h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "SUSPECT", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T06:00:00Z"}
        }
    },
    "PC-005": {
        "status": "green",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-005",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 8.5,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 3, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-05T10:30:00Z"},
            "soil": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T06:00:00Z"}
        }
    },
    "PC-006": {
        "status": "amber",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-006",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 1.2,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 2, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-06T10:30:00Z"},
            "soil": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T06:00:00Z"}
        }
    },
    "PC-007": {
        "status": "green",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-007",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 25.0,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T06:00:00Z"}
        }
    },
    "PC-008": {
        "status": "amber",
        "observations": [
            {
                "timestamp": "2026-10-04T00:00:00Z",
                "field_id": "PC-008",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 0.0,
                "quality_flag": "STALE",
                "freshness_age": "96h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-09-25T10:00:00Z",
                "field_id": "PC-008",
                "source": "SENTINEL_2",
                "variable": "ndvi",
                "value": None,
                "quality_flag": "MISSING",
                "freshness_age": "312h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 4, "stale": True, "quality_flag": "STALE", "last_updated": "2026-10-04T00:00:00Z"},
            "satellite": {"age_days": 13, "stale": True, "quality_flag": "MISSING", "last_updated": "2026-09-25T10:00:00Z"},
            "soil": {"age_days": 4, "stale": True, "quality_flag": "STALE", "last_updated": "2026-10-04T06:00:00Z"}
        }
    },
    "PC-009": {
        "status": "green",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-009",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 11.0,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T06:00:00Z"}
        }
    },
    "PC-010": {
        "status": "red",
        "observations": [
            {
                "timestamp": "2026-10-08T00:00:00Z",
                "field_id": "PC-010",
                "source": "NASA_POWER",
                "variable": "rainfall_mm",
                "value": 0.0,
                "quality_flag": "GOOD",
                "freshness_age": "12h",
                "imputation_flag": False
            },
            {
                "timestamp": "2026-10-07T10:30:00Z",
                "field_id": "PC-010",
                "source": "SENTINEL_2",
                "variable": "ndvi",
                "value": 0.35,
                "quality_flag": "GOOD",
                "freshness_age": "34h",
                "imputation_flag": False
            }
        ],
        "freshness": {
            "weather": {"age_days": 0, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-08T00:00:00Z"},
            "satellite": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T10:30:00Z"},
            "soil": {"age_days": 1, "stale": False, "quality_flag": "GOOD", "last_updated": "2026-10-07T06:00:00Z"}
        }
    }
}


def get_all_fields() -> List[FieldResponse]:
    """Return list of all demo fields parsed through Pydantic FieldResponse."""
    return [FieldResponse(**item) for item in DEMO_FIELDS_RAW]


def get_field_status(field_id: str) -> Optional[FieldStatusResponse]:
    """
    Return status for specified field_id, including observations and freshness metadata.
    Returns None if field_id is unknown.
    """
    field_item = next((f for f in DEMO_FIELDS_RAW if f["id"] == field_id), None)
    if not field_item:
        return None

    status_info = DEMO_STATUS_RAW.get(field_id)
    if not status_info:
        # Fallback default status for known field with no specific observations
        status_info = {
            "status": "green",
            "observations": [],
            "freshness": {
                "weather": {"age_days": None, "stale": True, "quality_flag": "MISSING", "last_updated": None},
                "satellite": {"age_days": None, "stale": True, "quality_flag": "MISSING", "last_updated": None},
                "soil": {"age_days": None, "stale": True, "quality_flag": "MISSING", "last_updated": None}
            }
        }

    return FieldStatusResponse(
        field=FieldResponse(**field_item),
        status=status_info["status"],
        observations=[ObservationResponse(**obs) for obs in status_info["observations"]],
        freshness={k: FreshnessMeta(**v) for k, v in status_info["freshness"].items()}
    )
