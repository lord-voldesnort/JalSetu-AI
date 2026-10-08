# JalSetu AI — Technical Requirements Document (TRD)

**Companion to:** `01_PRD.md`. Defines *how* the system is built. Where PRD and TRD disagree on scope, the PRD wins; on technology, the TRD wins.  
**Pilot Context:** Pimpri-Chinchwad peri-urban agricultural cluster, Pune (Tomato / vegetable cluster).

---

## 1. Architecture overview

```
 OPEN CLIMATE + FIELD DATA
         ↓
 Quality control & freshness layer (source, timestamp, variable, value, quality_flag, freshness_age, imputation_flag)
         ↓
 Field-time feature store (SQLite/Parquet for demo; PostgreSQL+PostGIS for scale)
         ↓
 Stress probability + short-horizon forecast (XGBoost / LightGBM)
         ↓
 Calibrated risk score & explanation (SHAP drivers, confidence band)
         ↓
 Constrained water-allocation optimizer (OR-Tools GLOP/CP-SAT)
         ↓
 Map, priority plan, audit log, and feedback loop
```

**Pattern:** offline batch pipeline (ingest → features → train) + online lightweight API (precomputed/cached predictions + live optimization) + SPA frontend. **Replay mode** is the default for demos.

```
[React SPA + MapLibre] ⇄ HTTPS/JSON ⇄ [FastAPI] ⇄ [PostgreSQL + PostGIS / SQLite + Parquet]
                                         │
                                         ├─ services/features  (pandas, GeoPandas, rasterio)
                                         ├─ services/model     (XGBoost, scikit-learn, SHAP)
                                         ├─ services/optimizer (OR-Tools)
                                         └─ data/cache/        (parquet, GeoTIFF, CSV — versioned)
```

## 2. Technology stack (with reasons)

| Layer | Choice | Reason |
|---|---|---|
| Frontend | **React 18 + TypeScript + Vite** | Fast dev, typed contracts, mobile-friendly (Flutter is the documented alternative; not used) |
| Styling | **Tailwind CSS** + small custom component set (shadcn/ui acceptable) | Rapid, consistent UI |
| Maps | **MapLibre GL JS** + GeoJSON polygons | Open-source, no API key needed with raster OSM/Carto tiles |
| Charts | **Recharts** | Simple forecast/band charts |
| State/data | **TanStack Query** + Zustand (UI state) | Caching, loading/error states |
| Backend | **Python 3.11 + FastAPI + Pydantic v2** | ML inference, field registry, plan generation |
| ORM/DB access | **SQLAlchemy 2 + Alembic** + GeoAlchemy2 | Migrations, PostGIS types |
| DB | **SQLite / Parquet** (local demo cache) · **PostgreSQL 15 + PostGIS 3** (scalable deployment) | Field, observation, plan, history |
| Geo | **GeoPandas, Shapely, Rasterio** (Earth Engine only for offline extraction) | Raster→field features |
| ML | **scikit-learn + XGBoost / LightGBM** | Strong on mixed tabular data with missing values & feature ranking |
| Explainability | **SHAP (TreeExplainer)** | Driver ranking for the Why card |
| Optimization | **OR-Tools** (GLOP LP; CP-SAT for integer variant) | Hard budget constraint, explicit trade-off |
| Packaging | **Docker + docker-compose** | Reproducible environment (finale hour 0–4) |
| Tests | **pytest, httpx, Playwright (smoke), Vitest** | Robustness evidence for the finale |
| CI | GitHub Actions: lint + tests + build | Modular codebase proof |

**Auth:** lightweight JWT with seeded demo role accounts (see §8). **No** third-party identity provider in v1.

## 3. Repository layout (monorepo)

```
jalsetu-ai/
├─ README.md
├─ docker-compose.yml
├─ .env.example
├─ docs/                      # the six planning docs live here
├─ data/
│  ├─ raw/                    # downloaded source files (git-ignored, large)
│  ├─ cache/                  # versioned, replay-ready parquet/csv (committed if small)
│  └─ fields/cluster.geojson  # demo field polygons
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ api/                 # routers: fields, forecast, water_plan, explain, events, metrics, scenarios, auth
│  │  ├─ core/                # config, security, logging
│  │  ├─ db/                  # models, session, migrations (alembic)
│  │  ├─ schemas/             # pydantic request/response models
│  │  ├─ services/
│  │  │  ├─ ingestion/        # nasa_power.py, sentinel2.py, soilgrids.py, ogd_rain.py, mosdac.py
│  │  │  ├─ features/         # builder.py, freshness.py
│  │  │  ├─ labels/           # stress_index.py
│  │  │  ├─ model/            # train.py, predict.py, calibrate.py, explain.py
│  │  │  ├─ optimizer/        # allocate.py, baselines.py
│  │  │  └─ scenarios/        # shocks.py
│  │  └─ tests/
│  ├─ scripts/                # seed_db.py, build_features.py, train_model.py, evaluate.py
│  └─ pyproject.toml
├─ frontend/
│  ├─ src/{pages,components,api,hooks,store,styles,types}
│  └─ package.json
└─ .github/workflows/ci.yml
```

## 4. Data sources & ingestion

| Source | Use | Access strategy (prototype) | Failure handling |
|---|---|---|---|
| **NASA POWER** (Daily API) | T2M, T2M_MAX/MIN, RH2M, WS2M, PRECTOTCORR, solar radiation | REST daily API → cached parquet per cluster centroid | Cached files; never call live in demo |
| **MOSDAC GSMaP / INSAT** | India-focused rainfall / remote sensing | Open-access products where accessible; **cache selected files** for reproducibility | Optional enrichment; pipeline works without it |
| **Sentinel-2 L2A (Earth Engine, `COPERNICUS/S2_SR_HARMONIZED`)** | NDVI (and optionally NDMI/NDWI) per field polygon | Offline extraction with cloud/clear-pixel filter (SCL/QA60 + cloud probability); store per-field time series | Missing scenes → carry forward latest valid with `age_days` |
| **SoilGrids** | Sand/silt/clay, organic carbon, soil context at 250 m | **Downloadable/WebDAV files, NOT the REST API** (service pause noted in blueprint); sample per field, cache | Static cached table |
| **India OGD rainfall** | Historical rainfall baselines, event windows | Published datasets → climatology/normal per month | Static cached table |
| **Field action logs** | Planned vs actual irrigation, overrides | From app `action_log` | – |

**Every cached artifact is versioned** (`data_version` string, e.g. `replay-2026-10-v1`) and the version is stored with each prediction.

### Demonstration-field strategy
1. Define cluster bounding area near Pimpri-Chinchwad; create 10–30 polygons (default 20).
2. Weather/rain come from the cluster centroid (or a small grid) with optional per-field perturbation; **NDVI is sampled per polygon** from Sentinel-2 so fields genuinely differ; soil sampled per polygon from SoilGrids.
3. Assign crop, sowing date, crop stage, area per field in `field` seed.
4. A **scenario engine** can inject shocks (rainfall deficit, heat wave, intense rain) into replayed weather for the shock-mode demo.
5. Be explicit in the UI/pitch that fields are demonstration fields and labels are proxy-based.

## 5. Feature engineering (field × date)

All features are computed using information available **up to and including date *t*** (no leakage).

| Feature | Definition |
|---|---|
| `rain_7d`, `rain_14d`, `rain_30d` | Cumulative rainfall (mm) over rolling windows |
| `et0_proxy_*d` | ET₀ proxy via Hargreaves–Samani from Tmax/Tmin/Ra (or POWER evapotranspiration variable if used consistently) |
| `rain_deficit_7d/14d/30d` | `max(0, ΣET0_proxy − Σrain)` over window (water-balance deficit, mm) |
| `rain_anomaly_30d` | Rain vs OGD climatological normal for the period |
| `heat_load_7d` | Σ max(0, Tmax − T_threshold) over 7 days (T_threshold configurable, default 35 °C) |
| `tmax_mean_7d`, `rh_mean_7d`, `wind_mean_7d` | Weather aggregates |
| `fc_rain_3d`, `fc_rain_7d`, `fc_tmax_3d` | Forecast variables (in replay: the "forecast" is the true future values with optional noise to emulate forecast error — documented) |
| `ndvi_latest`, `ndvi_delta_14d`, `ndvi_anomaly` | Vegetation level, trend, deviation from the field's own season baseline/cluster median |
| `ndvi_age_days` | **Freshness**: days since latest valid satellite observation |
| `soil_sand_pct`, `soil_clay_pct`, `soil_silt_pct`, `soil_oc`, `whc_proxy` | Soil context; water-holding proxy derived from texture |
| `crop_type`, `crop_stage`, `days_since_sowing`, `kc_stage` | Crop context; `kc_stage` = stage-based crop coefficient lookup |
| `area_ha` | Field area |
| `days_since_irrigation`, `last_irrigation_mm` | From action log (default null/seeded) |

**Missing data policy:** tree models receive NaNs natively; satellite features are carried forward with `ndvi_age_days`; if age > 20 days mark `stale` in UI. No silent imputation without a flag.

**Freshness record:** for each source variable store `observed_at`, `age_days`, `is_stale` (age > source-specific threshold: weather 2 d, satellite 12 d, soil n/a-static).

## 6. Labels, model & evaluation

### 6.1 Stress index (proxy label — transparent & configurable)
```
stress_index(t) = 0.40 * norm(rain_deficit_14d)
                + 0.25 * norm(-ndvi_anomaly)
                + 0.20 * norm(heat_load_7d)
                + 0.15 * (1 - norm(whc_proxy))      # soil dryness susceptibility
stress_label(t) = 1 if stress_index(t) >= STRESS_THRESHOLD (default 0.60) else 0
```
- Weights/threshold live in `config/labels.yaml` and are reported on the Methods page.
- If real field notes exist (logged observations), they override/validate proxy labels for those field-dates.
- **Forecast target:** for horizon `h ∈ {3, 5, 7}`, `y_h(t) = stress_label(t + h)` and `si_h(t) = stress_index(t + h)`.
- **Leakage guard:** features use data ≤ *t*; target uses values at *t + h*; use a **purged time split** (gap = max horizon).
- **Honesty note:** because labels are formula-derived proxies, high scores partly reflect predicting a known function. Always report persistence and rainfall-threshold baselines next to the model, and describe labels as proxy.

### 6.2 Models
| Layer | Technique | Output |
|---|---|---|
| Water stress | XGBoost classifier per horizon (or single model with `horizon` feature) + **isotonic calibration** | `stress_prob_h` |
| Stress index forecast | XGBoost quantile regression (`reg:quantileerror`, α = 0.1/0.5/0.9) | `si_p10, si_p50, si_p90` per horizon |
| Crop risk | Gradient boosting on stress history + stage + extremes | `crop_risk` ∈ [0,1] |
| Explanation | SHAP TreeExplainer → top 3–4 drivers mapped to human text | `drivers[]` |

Headline `stress_prob` on the UI = 7-day-ahead probability; all three horizons shown in the forecast chart.

### 6.3 Validation protocol
1. Build field-date examples for the full replay season(s).
2. **Rolling/time-based split**: e.g., train 70% earliest dates, validation 15%, test 15% latest, with purge gap.
3. Baselines: **fixed schedule**, **rainfall threshold**, **persistence**.
4. Metrics: precision, recall, F1, PR-AUC, Brier score + reliability curve; MAE/RMSE for stress index; interval coverage of p10–p90.
5. Backtest irrigation priority under several budget scenarios (e.g., 25/50/75% of total demand): top-k recall, regret vs oracle, share of water to truly high-risk fields.
6. `scripts/evaluate.py` writes `metrics.json` + plots; `/metrics` serves it; the file stores `data_version`, `model_version`, `git_sha`, `seed`.

### 6.4 Model versioning
`model_version` = `{algo}-{YYYYMMDD}-{short_hash}`; artifacts in `backend/artifacts/{model_version}/` (model.json, calibrator.pkl, feature_list.json, metrics.json). Stored with every prediction.

## 7. Optimizer specification

**Inputs per field *i* (for planning window):**
- `stress_prob_i`, `crop_risk_i`, `area_ha_i`, `kc_stage_i`, forecast rain, `soil whc_proxy`
- `need_mm_i = clamp( max(0, rain_deficit_net_i) * kc_stage_i, 0, NEED_CAP_MM )`, where `rain_deficit_net_i = deficit − expected forecast rain in window`
- `demand_m3_i = 10 * area_ha_i * need_mm_i`   (1 mm over 1 ha = 10 m³)
- Eligibility: if `stress_prob_i < LOW_THRESHOLD (0.25)` **or** forecast heavy rain ≥ threshold → `demand_m3_i = 0` and action = Wait / Pause irrigation / Inspect before irrigating.
- **Priority score formula (JalSetu AI §7.6):**
  `priority_score_i = w1 × stress_prob_i + w2 × crop_risk_i + w3 × shock_i + w4 × stage_sensitivity_i + w5 × freshness_quality_i`
- `priority_weight_i = priority_score_i` (used as objective weight in optimizer)

**Decision variables:** `x_i ∈ [0, demand_m3_i]` allocated m³.

**Objective:** maximize `Σ priority_weight_i * (x_i / demand_m3_i)` (weighted fraction of need satisfied).

**Hard constraint:** `Σ x_i ≤ B` (cluster budget, m³). Optional: minimum useful allocation `x_i ≥ 0.5 * demand_i` or 0 (integer variant via CP-SAT in 1 m³·k units).

**Output:** per-field `rank` (by priority weight), `allocated_m3`, `suggested action`, and `reason`. Header stores `budget_m3`, `total_allocated_m3`, `solver`, `status`.

**Verification:** an assertion + DB CHECK ensures `total_allocated_m3 ≤ budget_m3`; unit tests with random budgets; monotonicity test (increasing budget never reduces any field's allocation in LP variant).

**Baselines in the same module:**
- `fixed_equal_area`: allocate `B` proportional to area irrespective of stress.
- `rain_threshold`: irrigate fields where `rain_7d < R_thr`, split equally.
- Oracle: same optimizer but with true labels (for regret / top-k recall).

Volumes are presented as **"indicative planning units"** — see PRD §11.

## 8. API specification (FastAPI, JSON, prefix `/api/v1`)

| Method & path | Purpose |
|---|---|
| `POST /auth/login` | Demo login → JWT (role in claims) |
| `GET /fields` | Field registry + GeoJSON geometry + current status (query: `cluster_id`, `as_of`) |
| `GET /fields/{id}/status` | Current stress status, drivers summary, freshness |
| `GET /forecast/{id}` | Stress probability & band for h = 3/5/7 d; model/data version |
| `GET /water-plan?budget=100&as_of=...&scenario_id=...&method=ai|fixed|rain` | Constrained priority plan |
| `GET /explain/{prediction_id}` | Top drivers (SHAP) + freshness per input |
| `POST /events` | Log action/override (action_log) |
| `GET /events?field_id=` | Audit / action history |
| `GET /metrics` | Model & allocation evaluation results |
| `GET /scenarios` · `POST /scenarios` | List / apply shock scenario (rainfall deficit, heat wave, intense rain) |
| `GET /health` | Liveness + DB + data_version |

### Example: `GET /api/v1/forecast/{id}`
```json
{
  "field_id": "f_014",
  "as_of": "2027-01-12",
  "model_version": "xgb-20261105-a1b2c3",
  "data_version": "replay-2026-10-v1",
  "horizons": [
    {"days": 3, "stress_prob": 0.41, "si_p10": 0.35, "si_p50": 0.52, "si_p90": 0.66},
    {"days": 5, "stress_prob": 0.58, "si_p10": 0.40, "si_p50": 0.61, "si_p90": 0.74},
    {"days": 7, "stress_prob": 0.71, "si_p10": 0.46, "si_p50": 0.68, "si_p90": 0.82}
  ],
  "status": "red",
  "freshness": {"weather": {"age_days": 0, "stale": false},
                "satellite": {"age_days": 9, "stale": false},
                "soil": {"age_days": null, "stale": false}}
}
```

### Example: `GET /api/v1/water-plan?budget=100`
```json
{
  "plan_id": "p_0007",
  "as_of": "2027-01-12",
  "budget_m3": 100,
  "total_allocated_m3": 99.2,
  "method": "ai",
  "solver": "ortools-glop",
  "items": [
    {"rank": 1, "field_id": "f_014", "priority_score": 0.83, "demand_m3": 40, "allocated_m3": 40,
     "action": "irrigate_now", "reason": ["14-day rain deficit high", "Heat load rising", "NDVI falling"]},
    {"rank": 2, "field_id": "f_003", "priority_score": 0.77, "demand_m3": 30, "allocated_m3": 30, "action": "irrigate_now", "reason": ["..."]}
  ],
  "baseline": {"method": "fixed", "share_to_high_risk_pct": 38.0, "ai_share_to_high_risk_pct": 81.0}
}
```

### Error format (all endpoints)
```json
{"error": {"code": "BUDGET_INVALID", "message": "budget must be >= 0", "details": {}}}
```
Standard codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `BUDGET_INVALID`, `DATA_STALE`, `MODEL_UNAVAILABLE`, `INTERNAL`.

## 9. Authentication & authorization

- `POST /auth/login` with demo credentials → short-lived JWT (HS256, secret from env) containing `sub`, `role`, `cluster_id`, `field_ids` (for farmers).
- FastAPI dependencies enforce role-based access (matrix in PRD §7).
- Passwords hashed with argon2/bcrypt; seeded accounts: `farmer_demo`, `fpo_demo`, `waterman_demo`, `researcher_demo`, `admin_demo`.
- Optional: PostgreSQL Row-Level Security mirror of ownership rules (see schema doc).
- A "demo mode" flag can bypass login by role-picker on the landing screen for judges.

## 10. Security & privacy requirements

- **Farmer identity separated from analytics**: identity data in separate schema/table; analytics tables only reference `owner_group` / pseudonymous `owner_ref`.
- Collect **no** financial or sensitive personal data; coarse/demo identities only.
- Input validation via Pydantic; parameterized queries only (SQLAlchemy); CORS allow-list; basic rate limiting (slowapi); HTTPS in deployment.
- Secrets only from environment variables; `.env` never committed.
- Every recommendation stores `model_version`, `data_version` and source list (audit).
- Dependency scanning in CI (pip-audit / npm audit) — best effort.

## 11. Performance & reliability requirements

| Requirement | Target |
|---|---|
| `GET /fields` (≤30 fields + geometry) | p95 < 300 ms |
| `GET /forecast/{id}` | p95 < 300 ms (precomputed predictions or in-memory model) |
| `GET /water-plan` (≤30 fields) | p95 < 500 ms |
| Frontend first meaningful map render | < 2 s on broadband |
| Determinism | Fixed random seeds; replay data versioned; same input → same output |
| Degradation | If DB/API fails → frontend shows "Replay mode" using bundled static JSON snapshot |
| Backup demo | Pre-recorded screen capture + static build of the frontend using snapshot data |

## 12. Deployment

- **Local/dev:** `docker-compose up` → services `db` (postgis/postgis:15-3.4), `api` (uvicorn), `web` (vite preview or nginx).
- **Hosted demo:** API + DB on a single small VM or Render/Railway/Fly; frontend on Vercel/Netlify/Cloudflare Pages (env `VITE_API_URL`). Keep a docker-compose single-VM option as the primary fallback.
- **Environments:** `local`, `demo`. Config via `.env` (see below).
- **Migrations:** Alembic on container start; `scripts/seed_db.py` loads fields, cached observations, predictions, and the default scenario.

`.env.example`:
```
DATABASE_URL=postgresql+psycopg://jalsetu:jalsetu@db:5432/jalsetu
JWT_SECRET=change-me
JWT_EXPIRE_MIN=240
DATA_VERSION=replay-2026-10-v1
MODEL_VERSION=latest
STRESS_THRESHOLD=0.60
HEAT_T_THRESHOLD_C=35
CORS_ORIGINS=http://localhost:5173
DEFAULT_AS_OF_DATE=2027-01-12
DEMO_MODE=true
```

## 13. Observability & monitoring (finale-grade extras)

- Structured JSON logging (request id, route, latency, status).
- `/health` and `/metrics` (model metrics) endpoints; optional Prometheus-style counters.
- Log prediction drift summary (feature means vs training) in `/metrics` as a stretch.

## 14. Testing strategy

| Level | Tools | Must cover |
|---|---|---|
| Unit | pytest | feature functions, stress index, freshness logic, optimizer constraint |
| Property/randomized | pytest + hypothesis (optional) | `Σ alloc ≤ budget` for random budgets; monotonicity |
| API | httpx/TestClient | all endpoints, auth/roles, error format |
| Model | pytest | metrics reproducible within tolerance, no leakage test (features' max date ≤ t) |
| Frontend | Vitest + React Testing Library | key components (Why card, planner) |
| E2E smoke | Playwright | the 6-step demo flow runs |

## 15. Key technical decisions (log)

| # | Decision | Reason |
|---|---|---|
| D1 | Gradient boosting + optimizer, not a vision model | Handles mixed tabular signals & missing observations; satellite features treated as observations |
| D2 | Optimization explicit, not hidden in a score | Makes scarcity/trade-off visible and verifiable |
| D3 | Replay/cached data | Deterministic, robust demo; avoids API downtime |
| D4 | SoilGrids via downloaded files | REST API reported paused |
| D5 | Volumes as "indicative planning units" | No validated crop-water model; avoids over-claiming |
| D6 | Proxy labels documented + baselines shown | Honest evaluation under sparse ground truth |
| D7 | Identity separated from analytics | Trust by design |

## 16. Definition of "technically done" for MVP

1. `docker-compose up` brings up DB, API, web with seeded data and no manual steps.
2. All P0 endpoints return valid data and pass tests.
3. `scripts/train_model.py` and `scripts/evaluate.py` run end-to-end and produce `metrics.json`.
4. Water-plan constraint verified by tests.
5. Frontend completes the 6-step demo flow without errors in replay mode.
