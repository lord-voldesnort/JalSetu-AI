import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from app.core.config import settings
from app.schemas.field import FieldFeatureCollection, FieldFeature, FieldProperties, GeoJSONPolygon
from app.schemas.observation import ObservationRecord
from app.schemas.scenario import ScenarioDefinition

logger = logging.getLogger(__name__)


class DataLoadError(Exception):
    """Raised when fixture data cannot be found, parsed, or validated."""
    pass


class DataLoader:
    """Service to discover, load, and validate deterministic prototype data fixtures."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.resolved_data_dir

    def _get_file_path(self, filename: str) -> Path:
        """Resolve file path within configured data directory with fallback search."""
        primary_path = self.data_dir / filename
        if primary_path.is_file():
            return primary_path

        # Fallback search locations
        search_roots = [
            Path.cwd() / "data" / filename,
            Path(__file__).resolve().parent.parent.parent.parent / "data" / filename,
            Path.cwd() / filename,
        ]
        for candidate in search_roots:
            if candidate.is_file():
                return candidate

        raise DataLoadError(
            f"Fixture file '{filename}' could not be located in '{self.data_dir}' or standard fallback paths."
        )

    def load_raw_json(self, filename: str) -> Any:
        """Read and parse JSON from a fixture file."""
        file_path = self._get_file_path(filename)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise DataLoadError(f"Malformed JSON syntax in '{filename}': {e}") from e
        except Exception as e:
            raise DataLoadError(f"Failed to read file '{filename}': {e}") from e

    def load_fields(self) -> FieldFeatureCollection:
        """Load and validate the 10 demonstration fields from data/fields.geojson."""
        raw_data = self.load_raw_json("fields.geojson")

        if not isinstance(raw_data, dict) or raw_data.get("type") != "FeatureCollection":
            raise DataLoadError("fields.geojson must be a GeoJSON FeatureCollection")

        features_raw = raw_data.get("features", [])
        if len(features_raw) != 10:
            raise DataLoadError(f"Expected exactly 10 fields in fields.geojson, found {len(features_raw)}")

        features: List[FieldFeature] = []
        for idx, feat in enumerate(features_raw):
            try:
                # Derive area_ha if not present (1 acre = 0.404686 ha)
                props = feat.get("properties", {})
                if "area_ha" not in props and "area_acres" in props:
                    props["area_ha"] = round(props["area_acres"] * 0.404686, 3)

                feature_obj = FieldFeature.model_validate(feat)
                features.append(feature_obj)
            except Exception as e:
                raise DataLoadError(f"Validation error in field index {idx}: {e}") from e

        return FieldFeatureCollection(type="FeatureCollection", features=features)

    def load_observations(self) -> List[ObservationRecord]:
        """Load and validate observation records from data/observations.json."""
        raw_data = self.load_raw_json("observations.json")

        if not isinstance(raw_data, list):
            raise DataLoadError("observations.json must contain a JSON array of observations")

        if len(raw_data) != 170:
            logger.warning(f"Expected 170 observations, found {len(raw_data)}")

        records: List[ObservationRecord] = []
        for idx, item in enumerate(raw_data):
            try:
                record = ObservationRecord.model_validate(item)
                records.append(record)
            except Exception as e:
                raise DataLoadError(f"Validation error in observation record {idx}: {e}") from e

        return records

    def load_scenarios(self) -> List[ScenarioDefinition]:
        """Load and validate scenario definitions from data/scenarios.json."""
        raw_data = self.load_raw_json("scenarios.json")

        scenarios_list = raw_data if isinstance(raw_data, list) else raw_data.get("scenarios", [])
        if not isinstance(scenarios_list, list) or len(scenarios_list) != 3:
            raise DataLoadError(f"Expected exactly 3 scenarios in scenarios.json, found {len(scenarios_list)}")

        scenarios: List[ScenarioDefinition] = []
        for idx, s in enumerate(scenarios_list):
            try:
                scenario = ScenarioDefinition.model_validate(s)
                scenarios.append(scenario)
            except Exception as e:
                raise DataLoadError(f"Validation error in scenario index {idx}: {e}") from e

        return scenarios


data_loader = DataLoader()

