# Data Integration Report & Provenance Manifest
**JalSetu AI | PCCOE IGC 2026**
**Document:** `docs/DATA_INTEGRATION_REPORT.md`
**Status:** Verified & Integrated
**Author:** Ameya Palande & Namrata Sitaphale

---

## 1. Executive Summary

This report establishes the canonical data baseline for JalSetu AI, reconciling Namrata Sitaphale's data package (`feature/namrata-data`), the database seed mechanisms, and the backend fixture expectations.

All spatial, agronomic, and sensor fixtures originate from the canonical `data/` directory:
- `data/fields.geojson`
- `data/observations.json`
- `data/scenarios.json`
- `data/README.md`

All demonstration data is explicitly labelled as **synthetic demonstration data** (`synthetic_demo_data`). No claims of live telemetry, real-time satellite orbital passes, or measured on-farm yield data are made.

---

## 2. Canonical Field Registry (`data/fields.geojson`)

The demonstration cluster comprises exactly 10 synthetic vegetable farms in the Pimpri-Chinchwad agricultural peri-urban belt.

| Field ID | Name | Crop | Stage | Area (Acres) | Area (Ha) | Centroid (Lng, Lat) | Baseline Stress | Action |
|---|---|---|---|---|---|---|---|---|
| `PC-001` | Malekar Farm (Block A) | Tomato | Flowering | 3.5 | 1.42 | (73.7818, 18.6612) | High (Red) | `irrigate_now` |
| `PC-002` | Kute Plots (North) | Tomato | Vegetative | 2.8 | 1.13 | (73.7824, 18.6617) | Low (Green) | `wait` |
| `PC-003` | Thorat Agro 1 | Cabbage | Head Formation | 4.2 | 1.70 | (73.7831, 18.6608) | Moderate (Amber) | `wait` |
| `PC-004` | Thorat Agro 2 | Cabbage | Vegetative | 3.0 | 1.21 | (73.7838, 18.6614) | Moderate (Amber) | `inspect` |
| `PC-005` | Pawale Krishi Kendra | Cauliflower | Curd Formation | 2.5 | 1.01 | (73.7845, 18.6605) | Moderate (Amber) | `wait` |
| `PC-006` | Jadhav Bagayat | Tomato | Fruiting | 4.0 | 1.62 | (73.7851, 18.6611) | High (Red) | `irrigate_now` |
| `PC-007` | Shinde Vasti Farmland | Okra | Flowering | 3.2 | 1.30 | (73.7822, 18.6602) | Moderate (Amber) | `wait` |
| `PC-008` | Landge Farm (Canal Side)| Tomato | Flowering | 2.1 | 0.85 | (73.7835, 18.6601) | Stale (Amber) | `inspect` |
| `PC-009` | Gawade Patil Farm | Chili | Fruit Development| 3.8 | 1.54 | (73.7848, 18.6598) | Low (Green) | `wait` |
| `PC-0010`| Chinchwad Greens Co-op | Tomato | Seedling | 3.4 | 1.38 | (73.7856, 18.6604) | Low (Green) | `wait` |

**Total Cluster Acreage:** 32.5 Acres (13.15 Hectares).  
**Coordinate Reference System:** WGS 84 (`EPSG:4326`), standardized GeoJSON Polygon coordinate format.

---

## 3. Observation Dataset (`data/observations.json`)

The observation fixture contains 170 multi-variable time-series records (17 records per field across the 7-day retrospective window):
- **Soil Moisture (`soil_moisture`):** Calibrated in volumetric water content percentage (`%`). Wilting thresholds calibrated by crop growth stage.
- **Canopy Temperature (`canopy_temp`):** Calibrated in degrees Celsius (`°C`). Elevated differential above air temperature indicates stomatal closure and transpiration deficit.
- **Reference Evapotranspiration (`et0`):** Calibrated in millimeters per day (`mm/day`).
- **Normalized Difference Vegetation Index (`ndvi`):** Dimensionless ratio (-1.0 to +1.0) simulating multispectral canopy reflectance.
- **Precipitation (`rainfall`):** Cumulative millimeters (`mm`).
- **Weather Forecast:** Maximum temperature (`forecast_tmax`, `°C`) and anticipated precipitation (`forecast_rain`, `mm`).

### Intentional Data Quality Flags
- **`PC-008` (Stale / Missing Data Case):** Modeled with 4-day-old weather observation and 13-day-old satellite NDVI observation (`quality_flag: "stale"`, `age_days: 4` and `13`). The heuristic engine explicitly penalizes confidence and issues an `inspect` recommendation before authorizing irrigation.
- **`PC-004` (Stale Observation Case):** Modeled with aged sensor readings to verify system robustness under imperfect data connectivity.

---

## 4. Scenario Definitions (`data/scenarios.json`)

| Scenario ID | Name & Title | Agricultural Shock | Expected Heuristic Behavior |
|---|---|---|---|
| `normal_01` | Baseline Conditions | Standard dry-season weather without acute shocks. | Baseline stress distribution: 2 Red, 5 Amber, 3 Green. Standard water plan prioritizes `PC-001` and `PC-006`. |
| `rainfall_deficit_heat_01`| 40% Rain Deficit + Heatwave (+3°C) | Extended dry spell with elevated evaporative demand. | Stress escalates across flowering tomatoes (`PC-001`, `PC-007`). Stressed fields count increases. Replay diff shows +10 to +25 risk point surge. |
| `heavy_rain_pause_01` | Heavy Rainfall Deluge (65 mm) | Cloudburst / unseasonal monsoon inundation. | Fields exceed saturation; irrigation is actively hazardous (waterlogging risk). Recommended action transitions to `protect_pause` (blue). Water plan allocates **0 m³** to paused fields. |

---

## 5. Verification of Non-Mutating Replay Idempotency

Both the test suite (`test_master_prompt_5_e2e.py`) and manual verification confirm:
1. Replaying a scenario modifies only runtime assessment calculations or ephemeral simulation parameters.
2. The underlying raw fixtures in `data/observations.json` and SQLite `observations` table are **never mutated**.
3. Calling `POST /scenario/reset` cleanly restores the active scenario state to `normal_01`.

---

## 6. Synthetic Data & Regulatory Disclaimer

> [!IMPORTANT]
> All field boundaries, coordinates, sensor readings, weather projections, and farmer profiles are synthetic demonstration artifacts designed for the PCCOE IGC 2026 hackathon. They serve to demonstrate algorithmic behavior, constraint enforcement, and explainability workflows. They do not represent real-time agricultural telemetry or guaranteed crop yields.
