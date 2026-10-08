# JalSetu AI — Data Module

## Demo Field Registry (`fields.geojson`)

**Notice:**
> **Fictional synthetic/replayed prototype data for demonstration purposes; not real field measurements.**  
> The coordinates, boundaries, and properties in this dataset do not represent actual farms, private land ownership, or real agricultural operations. They are designed strictly as an engineering testbed and interactive map demonstration for the JalSetu AI Pimpri-Chinchwad pilot scenario.

### Field Registry Overview

- **Cluster:** Pimpri-Chinchwad peri-urban vegetable cluster, Pune
- **Field Count:** 10 demonstration fields (`PC-001` through `PC-010`)
- **Primary Crop Context:** Tomato and peri-urban vegetables (tomato, chili, brinjal, onion, capsicum)
- **Geometry Format:** GeoJSON RFC 7946 `Polygon`
- **Coordinate Reference System:** WGS 84 (EPSG:4326)

### Properties Contract

| Field Name | Type | Description | Example |
|---|---|---|---|
| `id` | `string` | Unique field identifier | `"PC-001"` |
| `name` | `string` | Human-readable field label | `"Field 01"` |
| `crop` | `string` | Crop planted | `"tomato"` |
| `stage` | `string` | Current crop growth stage | `"flowering"` |
| `area_acres` | `number` | Field area in acres | `1.5` |
| `geometry` | `Polygon` | Closed GeoJSON polygon `[lon, lat]` coordinates | `{"type": "Polygon", "coordinates": [...]}` |

---

## Observations & Freshness Fixtures (`observations.json`)

**Notice:**
> **Fictional synthetic/replayed prototype data for demonstration purposes; not real field measurements.**  
> Weather, satellite vegetation, soil moisture, and irrigation values are fixtures for deterministic prototype demonstration. They are NOT live API measurements or claims of actual sensor telemetry.

### Overview

- **File:** `data/observations.json`
- **Fields Represented:** All 10 demonstration fields (`PC-001` through `PC-010`)
- **Total Observations:** 170 records (17 observations per field)
- **Reference Date (As-Of):** `2026-10-08T00:00:00Z` (deterministic replay timeline)

### Schema Contract

Each observation in `observations.json` conforms to the following structure:

```json
{
  "field_id": "PC-001",
  "timestamp": "2026-10-07T00:00:00Z",
  "source": "synthetic_weather_replay",
  "variable": "rainfall_daily",
  "value": 0.0,
  "unit": "mm",
  "quality_flag": "good",
  "age_days": 1
}
```

| Key | Type | Description | Example |
|---|---|---|---|
| `field_id` | `string` | Corresponding field ID from `fields.geojson` | `"PC-001"` |
| `timestamp` | `string` | ISO-8601 UTC timestamp of observation/event | `"2026-10-08T00:00:00Z"` |
| `source` | `string` | Category of synthetic/replayed data origin | `"synthetic_weather_replay"` |
| `variable` | `string` | Agronomic/environmental variable observed | `"rainfall_daily"` |
| `value` | `number` | Numeric observation measurement | `12.4` |
| `unit` | `string` | Explicit physical or normalized measurement unit | `"mm"`, `"deg_C"` |
| `quality_flag` | `string` | Quality/reliability status (`"good"` or `"stale"`) | `"good"` |
| `age_days` | `integer` | Age in days relative to the reference date `2026-10-08` | `0`, `2`, `25` |

### Variables & Units Dictionary

| Variable | Description | Unit | Sample Range | Source Label |
|---|---|---|---|---|
| `rainfall_daily` | Daily cumulative rainfall over the past 7 days | `mm` | `0.0` – `8.5` | `synthetic_weather_replay` |
| `forecast_tmax` | Forecast maximum daily temperature (3-day horizon) | `deg_C` | `33.0` – `38.0` | `synthetic_weather_replay` |
| `forecast_rainfall` | Forecast daily precipitation (3-day horizon) | `mm` | `0.0` – `2.0` | `synthetic_weather_replay` |
| `soil_moisture_proxy` | Current soil moisture availability index | `fraction_0_to_1` | `0.22` – `0.64` | `synthetic_soil_proxy` |
| `ndvi` | Normalized Difference Vegetation Index (satellite proxy) | `index_-1_to_1` | `0.42` – `0.65` | `synthetic_satellite_replay` |
| `ndvi_trend_14d` | 14-day change in vegetation index | `delta` | `-0.07` – `+0.05` | `synthetic_satellite_replay` |
| `last_irrigation_depth` | Depth applied during most recent irrigation event | `mm` | `15.0` – `30.0` | `synthetic_irrigation_replay` |

### Source Labels

- **`synthetic_weather_replay`**: Simulated past rainfall and forecast weather (representing NASA POWER / AWS replayed signals).
- **`synthetic_satellite_replay`**: Simulated vegetation indices (representing Sentinel-2 NDVI time series).
- **`synthetic_soil_proxy`**: Simulated soil moisture context (representing SoilGrids + water balance derivation).
- **`synthetic_irrigation_replay`**: Simulated farm management records (representing logged field actions).

### Quality Flags & Freshness Handling

- **`good`**: Observation is recent and within fresh operational thresholds.
- **`stale`**: Observation exceeds freshness threshold (satellite age $> 12$ days per TRD §5).

### Stale Satellite Demonstration Case (`PC-004`)

To support the product requirement for handling stale satellite observations and triggering the **"Inspect before irrigating"** recommendation (per TRD §5 and Implementation Plan Phase 7/8):
- **Field:** `PC-004` (Field 04, chili, flowering)
- **Variable:** `ndvi` & `ndvi_trend_14d`
- **Timestamp:** `2026-09-13T10:00:00Z`
- **Age:** `25` days (`age_days: 25`, exceeding the 12-day threshold)
- **Quality Flag:** `"stale"`
- **Behavioral Intent:** The backend and UI can flag this field with low observation confidence and recommend manual inspection before scarce water allocation.
