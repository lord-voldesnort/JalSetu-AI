# JalSetu AI — Backend Schema Document

**Database:** PostgreSQL 15 + PostGIS 3. **ORM:** SQLAlchemy 2 + GeoAlchemy2 + Alembic.
**Core entities from the blueprint:** `field`, `observation`, `prediction`, `water_plan`, `action_log` — extended below with supporting tables.

---

## 1. Design rules

1. **Two schemas.** `identity` holds anything that could identify a person; `core` holds all analytics. Analytics tables never store names/phones; they reference a pseudonymous `owner_group` / `owner_ref`.
2. **Everything is auditable.** Predictions and plans store `model_version_id`, `data_version`, and source info.
3. **Budget is enforced in the database too** (CHECK + trigger), not only in code.
4. **Time-indexed.** Observations and predictions are keyed by field + date.
5. **UUID primary keys** (`gen_random_uuid()`), `timestamptz` for timestamps, `date` for as-of dates, SRID 4326 for geometry.
6. **Prototype data volume is tiny** (≤30 fields), but indexes are included for correctness and finale-grade polish.

## 2. Setup

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS core;
```

## 3. Enumerations

```sql
CREATE TYPE core.user_role        AS ENUM ('farmer','fpo_manager','water_manager','researcher','admin');
CREATE TYPE core.stress_status    AS ENUM ('green','amber','red');
CREATE TYPE core.action_type      AS ENUM ('irrigate_now','wait','inspect','protect_pause');
CREATE TYPE core.quality_flag     AS ENUM ('good','filled_forward','cloudy','suspect','missing');
CREATE TYPE core.plan_method      AS ENUM ('ai','fixed_equal_area','rain_threshold','oracle');
CREATE TYPE core.scenario_type    AS ENUM ('baseline','rainfall_deficit','heat_wave','intense_rain','combined');
CREATE TYPE core.override_reason  AS ENUM ('soil_felt_moist','rain_expected_locally','water_unavailable','crop_stage','other');
CREATE TYPE core.data_origin      AS ENUM ('nasa_power','sentinel2','soilgrids','india_ogd','mosdac','user_log','derived','synthetic');
```

## 4. Tables

### 4.1 `identity.farmer_identity` (separate from analytics)
```sql
CREATE TABLE identity.farmer_identity (
  owner_ref      uuid PRIMARY KEY DEFAULT gen_random_uuid(),   -- pseudonymous key used by core.*
  display_alias  text NOT NULL,                                -- demo alias, e.g. "Farmer A"
  village        text,                                         -- coarse location only
  contact_hash   text,                                         -- optional salted hash; no raw phone/email stored
  created_at     timestamptz NOT NULL DEFAULT now()
);
```
> Demo only: coarse/demo identities. No financial or sensitive data.

### 4.2 `core.app_user`
```sql
CREATE TABLE core.app_user (
  user_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username       text NOT NULL UNIQUE,
  password_hash  text NOT NULL,                  -- argon2/bcrypt
  role           core.user_role NOT NULL,
  cluster_id     uuid,                           -- FK added after core.cluster
  owner_ref      uuid REFERENCES identity.farmer_identity(owner_ref),  -- only for farmers
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz
);
CREATE INDEX ix_app_user_role ON core.app_user(role);
```

### 4.3 `core.cluster`
```sql
CREATE TABLE core.cluster (
  cluster_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,                  -- e.g. "Pimpri-Chinchwad Demo Cluster"
  region         text,
  centroid       geometry(Point,4326) NOT NULL,
  boundary       geometry(Polygon,4326),
  default_crop   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE core.app_user
  ADD CONSTRAINT fk_user_cluster FOREIGN KEY (cluster_id) REFERENCES core.cluster(cluster_id);
CREATE INDEX gix_cluster_centroid ON core.cluster USING GIST (centroid);
```

### 4.4 `core.field`
```sql
CREATE TABLE core.field (
  field_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_code     text NOT NULL UNIQUE,           -- human-friendly "f_014"
  cluster_id     uuid NOT NULL REFERENCES core.cluster(cluster_id) ON DELETE CASCADE,
  owner_group    text,                           -- coarse group label for analytics (not identity)
  owner_ref      uuid REFERENCES identity.farmer_identity(owner_ref),   -- pseudonymous link for farmer ownership
  name           text NOT NULL,                  -- "Field 14"
  geometry       geometry(Polygon,4326) NOT NULL,
  centroid       geometry(Point,4326) GENERATED ALWAYS AS (ST_Centroid(geometry)) STORED,
  area_ha        numeric(8,3) NOT NULL CHECK (area_ha > 0),
  crop           text NOT NULL,                  -- e.g. 'tomato' (vegetable cluster)
  stage          text NOT NULL,                  -- e.g. 'flowering','fruiting'
  sowing_date    date,
  is_demo        boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gix_field_geom     ON core.field USING GIST (geometry);
CREATE INDEX ix_field_cluster   ON core.field (cluster_id);
CREATE INDEX ix_field_owner_ref ON core.field (owner_ref);
```

### 4.5 `core.field_soil` (static soil context)
```sql
CREATE TABLE core.field_soil (
  field_id       uuid PRIMARY KEY REFERENCES core.field(field_id) ON DELETE CASCADE,
  sand_pct       numeric(5,2), silt_pct numeric(5,2), clay_pct numeric(5,2),
  organic_carbon numeric(6,2),
  whc_proxy      numeric(5,3),                   -- derived water-holding proxy 0..1
  source         core.data_origin NOT NULL DEFAULT 'soilgrids',
  data_version   text NOT NULL
);
```

### 4.6 `core.crop_stage_ref` (lookup)
```sql
CREATE TABLE core.crop_stage_ref (
  crop           text NOT NULL,
  stage          text NOT NULL,
  kc_stage       numeric(4,2) NOT NULL,          -- crop coefficient
  sensitivity    numeric(4,2) NOT NULL DEFAULT 1.0,  -- stage_sensitivity used in priority weight
  PRIMARY KEY (crop, stage)
);
```

### 4.7 `core.data_source` (provenance registry)
```sql
CREATE TABLE core.data_source (
  source_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin         core.data_origin NOT NULL,
  name           text NOT NULL,
  data_version   text NOT NULL,
  description    text,
  retrieved_at   timestamptz,
  UNIQUE (origin, data_version)
);
```

### 4.8 `core.observation` (long format, per blueprint & JalSetu AI §7.3)
```sql
CREATE TABLE core.observation (
  observation_id bigserial PRIMARY KEY,
  field_id       uuid NOT NULL REFERENCES core.field(field_id) ON DELETE CASCADE,
  observed_at    timestamptz NOT NULL,           -- the "timestamp" in the blueprint
  source         core.data_origin NOT NULL,
  variable       text NOT NULL,                  -- 'rain_mm','tmax_c','tmin_c','rh_pct','wind_ms','ndvi','fc_rain_mm',...
  value          double precision,               -- NULL allowed when quality_flag='missing'
  quality_flag   core.quality_flag NOT NULL DEFAULT 'good',
  freshness_age  integer,                        -- age in days at observation time (JalSetu AI §7.3)
  imputation_flag boolean NOT NULL DEFAULT false, -- true if value carried forward or imputed (JalSetu AI §7.3)
  data_version   text NOT NULL,
  ingested_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, observed_at, source, variable, data_version)
);
CREATE INDEX ix_obs_field_var_time ON core.observation (field_id, variable, observed_at DESC);
CREATE INDEX ix_obs_time           ON core.observation (observed_at);
```

### 4.9 `core.feature_snapshot` (materialized field-date feature vector)
```sql
CREATE TABLE core.feature_snapshot (
  snapshot_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id       uuid NOT NULL REFERENCES core.field(field_id) ON DELETE CASCADE,
  as_of_date     date NOT NULL,
  features       jsonb NOT NULL,                 -- {rain_14d, rain_deficit_14d, heat_load_7d, ndvi_latest, ndvi_delta_14d, ...}
  freshness      jsonb NOT NULL,                 -- {"weather":{"age_days":0,"stale":false}, "satellite":{...}, ...}
  stress_index   numeric(5,4),                   -- proxy stress index at as_of_date
  stress_label   boolean,                        -- proxy label at as_of_date
  data_version   text NOT NULL,
  scenario_id    uuid,                           -- FK below; NULL = baseline
  UNIQUE (field_id, as_of_date, data_version, scenario_id)
);
CREATE INDEX ix_fs_field_date ON core.feature_snapshot (field_id, as_of_date);
```

### 4.10 `core.model_version`
```sql
CREATE TABLE core.model_version (
  model_version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version    text NOT NULL UNIQUE,         -- 'xgb-20261105-a1b2c3'
  algo             text NOT NULL,
  trained_at       timestamptz NOT NULL,
  data_version     text NOT NULL,
  git_sha          text,
  params           jsonb,
  metrics          jsonb,                        -- precision/recall/F1/PR-AUC/MAE/RMSE/Brier
  artifact_path    text,
  is_active        boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX ux_model_active ON core.model_version (is_active) WHERE is_active;
```

### 4.11 `core.scenario`
```sql
CREATE TABLE core.scenario (
  scenario_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id     uuid NOT NULL REFERENCES core.cluster(cluster_id) ON DELETE CASCADE,
  type           core.scenario_type NOT NULL,
  intensity      text CHECK (intensity IN ('mild','moderate','severe')),
  params         jsonb NOT NULL DEFAULT '{}',    -- e.g. {"rain_multiplier":0.4,"tmax_delta_c":4}
  as_of_date     date NOT NULL,
  created_by     uuid REFERENCES core.app_user(user_id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  is_active      boolean NOT NULL DEFAULT true
);
ALTER TABLE core.feature_snapshot
  ADD CONSTRAINT fk_fs_scenario FOREIGN KEY (scenario_id) REFERENCES core.scenario(scenario_id) ON DELETE CASCADE;
CREATE INDEX ix_scenario_cluster ON core.scenario (cluster_id, is_active);
```

### 4.12 `core.prediction`
```sql
CREATE TABLE core.prediction (
  prediction_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id         uuid NOT NULL REFERENCES core.field(field_id) ON DELETE CASCADE,
  as_of_date       date NOT NULL,                 -- the "timestamp" in the blueprint
  horizon_days     smallint NOT NULL CHECK (horizon_days BETWEEN 0 AND 14),
  stress_prob      numeric(5,4) NOT NULL CHECK (stress_prob BETWEEN 0 AND 1),
  si_p10           numeric(5,4), si_p50 numeric(5,4), si_p90 numeric(5,4),
  crop_risk        numeric(5,4) CHECK (crop_risk BETWEEN 0 AND 1),
  confidence       numeric(5,4),                  -- 1 - normalized band width, or calibration-based
  status           core.stress_status NOT NULL,
  action           core.action_type NOT NULL,
  model_version_id uuid NOT NULL REFERENCES core.model_version(model_version_id),
  data_version     text NOT NULL,
  scenario_id      uuid REFERENCES core.scenario(scenario_id) ON DELETE CASCADE,
  freshness        jsonb NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (field_id, as_of_date, horizon_days, model_version_id, scenario_id)
);
CREATE INDEX ix_pred_field_date ON core.prediction (field_id, as_of_date DESC);
CREATE INDEX ix_pred_scenario   ON core.prediction (scenario_id);
```
> `UNIQUE NULLS NOT DISTINCT` requires PostgreSQL 15+. For older versions use a partial unique index per `scenario_id IS NULL`.

### 4.13 `core.prediction_driver` (explanations)
```sql
CREATE TABLE core.prediction_driver (
  prediction_id  uuid NOT NULL REFERENCES core.prediction(prediction_id) ON DELETE CASCADE,
  rank           smallint NOT NULL,              -- 1 = strongest
  feature        text NOT NULL,                  -- 'rain_deficit_14d'
  label          text NOT NULL,                  -- plain language: 'Rainfall deficit (14 days)'
  value          double precision,
  contribution   double precision NOT NULL,      -- SHAP value (signed)
  direction      text CHECK (direction IN ('increases_risk','decreases_risk')),
  PRIMARY KEY (prediction_id, rank)
);
```

### 4.14 `core.water_plan` and `core.water_plan_item`
```sql
CREATE TABLE core.water_plan (
  plan_id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id         uuid NOT NULL REFERENCES core.cluster(cluster_id) ON DELETE CASCADE,
  as_of_date         date NOT NULL,
  window_days        smallint NOT NULL DEFAULT 7,
  budget_m3          numeric(12,2) NOT NULL CHECK (budget_m3 >= 0),
  total_demand_m3    numeric(12,2) NOT NULL CHECK (total_demand_m3 >= 0),
  total_allocated_m3 numeric(12,2) NOT NULL CHECK (total_allocated_m3 >= 0),
  method             core.plan_method NOT NULL,
  solver             text,                         -- 'ortools-glop' / 'cp-sat'
  solver_status      text,
  model_version_id   uuid REFERENCES core.model_version(model_version_id),
  data_version       text NOT NULL,
  scenario_id        uuid REFERENCES core.scenario(scenario_id),
  baseline_summary   jsonb,                        -- {"share_to_high_risk_pct":..., "ai_share_to_high_risk_pct":...}
  created_by         uuid REFERENCES core.app_user(user_id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_budget_respected CHECK (total_allocated_m3 <= budget_m3 + 0.001)
);
CREATE INDEX ix_plan_cluster_date ON core.water_plan (cluster_id, as_of_date DESC);

CREATE TABLE core.water_plan_item (
  plan_id          uuid NOT NULL REFERENCES core.water_plan(plan_id) ON DELETE CASCADE,
  field_id         uuid NOT NULL REFERENCES core.field(field_id),
  rank             smallint NOT NULL,
  priority_score   numeric(6,4) NOT NULL,
  demand_m3        numeric(12,2) NOT NULL CHECK (demand_m3 >= 0),
  suggested_volume numeric(12,2) NOT NULL CHECK (suggested_volume >= 0),   -- "allocated" ("indicative planning units")
  action           core.action_type NOT NULL,
  reasons          jsonb NOT NULL DEFAULT '[]',     -- ["14-day rain deficit high", ...]
  unfunded_reason  text,                            -- 'low_stress'|'rain_expected'|'budget_exhausted'
  prediction_id    uuid REFERENCES core.prediction(prediction_id),
  PRIMARY KEY (plan_id, field_id),
  CONSTRAINT chk_item_within_demand CHECK (suggested_volume <= demand_m3 + 0.001)
);
CREATE INDEX ix_plan_item_field ON core.water_plan_item (field_id);
```

**DB-level enforcement that the sum respects the budget (defense in depth):**
```sql
CREATE OR REPLACE FUNCTION core.enforce_plan_total() RETURNS trigger AS $$
DECLARE s numeric; b numeric;
BEGIN
  SELECT COALESCE(SUM(suggested_volume),0) INTO s FROM core.water_plan_item WHERE plan_id = NEW.plan_id;
  SELECT budget_m3 INTO b FROM core.water_plan WHERE plan_id = NEW.plan_id;
  IF s > b + 0.001 THEN
    RAISE EXCEPTION 'Plan % allocates % m3 which exceeds budget % m3', NEW.plan_id, s, b;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_plan_item_budget
AFTER INSERT OR UPDATE ON core.water_plan_item
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION core.enforce_plan_total();
```

### 4.15 `core.action_log` (the feedback loop)
```sql
CREATE TABLE core.action_log (
  action_id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id         uuid NOT NULL REFERENCES core.field(field_id) ON DELETE CASCADE,
  action           core.action_type NOT NULL,        -- action actually taken
  recommended_action core.action_type,               -- what the system recommended
  prediction_id    uuid REFERENCES core.prediction(prediction_id),
  plan_id          uuid REFERENCES core.water_plan(plan_id),
  planned_volume_m3 numeric(12,2),
  actual_volume_m3  numeric(12,2) CHECK (actual_volume_m3 IS NULL OR actual_volume_m3 >= 0),
  followed_recommendation boolean NOT NULL,
  override_reason  core.override_reason,
  note             text,
  observed_condition text,                           -- optional field observation: 'wilting','normal',...
  created_by       uuid NOT NULL REFERENCES core.app_user(user_id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_override_needs_reason CHECK (followed_recommendation OR override_reason IS NOT NULL)
);
CREATE INDEX ix_action_field_time ON core.action_log (field_id, created_at DESC);
CREATE INDEX ix_action_followed   ON core.action_log (followed_recommendation);
```

### 4.16 `core.metric_run` (evaluation results)
```sql
CREATE TABLE core.metric_run (
  metric_run_id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id uuid NOT NULL REFERENCES core.model_version(model_version_id),
  data_version     text NOT NULL,
  split            text NOT NULL,                    -- 'test' | 'val'
  detection        jsonb,                            -- precision/recall/F1/PR-AUC/confusion
  forecast         jsonb,                            -- MAE/RMSE/Brier/coverage
  allocation       jsonb,                            -- top-k recall, regret, share-to-high-risk by budget level
  baselines        jsonb,                            -- fixed/rain-threshold/persistence results
  seed             int,
  git_sha          text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

### 4.17 `core.audit_event` (generic audit trail)
```sql
CREATE TABLE core.audit_event (
  event_id     bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES core.app_user(user_id),
  event_type   text NOT NULL,         -- 'login','plan_generated','scenario_applied','action_logged'
  entity_type  text,
  entity_id    text,
  payload      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ix_audit_time ON core.audit_event (created_at DESC);
```

## 5. Relationships (summary)

```
identity.farmer_identity 1─* core.field (via owner_ref)         identity.farmer_identity 1─1 core.app_user (farmer)
core.cluster 1─* core.field 1─1 core.field_soil
core.field 1─* core.observation
core.field 1─* core.feature_snapshot
core.field 1─* core.prediction 1─* core.prediction_driver
core.model_version 1─* core.prediction
core.scenario 1─* core.prediction / core.feature_snapshot / core.water_plan
core.cluster 1─* core.water_plan 1─* core.water_plan_item *─1 core.field
core.field 1─* core.action_log  (optional links: prediction_id, plan_id)
core.model_version 1─* core.metric_run
```

## 6. Mapping to the blueprint's core schema

| Blueprint entity | Table(s) | Notes |
|---|---|---|
| `field` (id, geometry, crop, stage, area, owner_group) | `core.field` | + soil in `field_soil` |
| `observation` (timestamp, field_id, source, variable, value, quality_flag) | `core.observation` | exact fields, plus `data_version` |
| `prediction` (timestamp, field_id, stress_prob, crop_risk, confidence) | `core.prediction` | + horizon, bands, versions |
| `water_plan` (date, budget, field_id, priority, suggested_volume) | `core.water_plan` + `core.water_plan_item` | header/item split for correctness |
| `action_log` (field_id, action, actual_volume, note, created_at) | `core.action_log` | + override fields and links |

## 7. Permissions & data-ownership rules

| Resource | farmer | fpo_manager | water_manager | researcher | admin |
|---|---|---|---|---|---|
| `field`, `prediction`, `feature_snapshot` | read **own** fields (by `owner_ref`) | read cluster | read cluster | read all | read/write |
| `water_plan(+item)` | read items for own fields | read cluster, create | read/create cluster | read | read/write |
| `scenario` | – | create/read cluster | create/read cluster | read | read/write |
| `action_log` | create/read **own** | create/read cluster | create/read cluster | read | read/write |
| `metric_run`, `model_version` | – | read | read | read | read/write |
| `identity.*` | **never** exposed via API (only `display_alias` through a view) | – | – | – | admin only |

Rules:
1. **Ownership:** a farmer's reachable `field_id`s = fields where `field.owner_ref = app_user.owner_ref`.
2. **Cluster scope:** non-farmer roles are limited to `app_user.cluster_id` (admin = all).
3. **Immutability:** `prediction`, `water_plan`, `water_plan_item`, `audit_event` are append-only in the API (no UPDATE/DELETE endpoints).
4. **Analytics views never join to `identity.*`**; a restricted view `core.v_field_public` exposes `display_alias` only for farmer views.
5. **No secrets in tables** other than `password_hash`.

**Optional Row-Level Security (defense in depth):**
```sql
ALTER TABLE core.field ENABLE ROW LEVEL SECURITY;
-- App sets: SET LOCAL app.role = 'farmer'; SET LOCAL app.owner_ref = '<uuid>'; SET LOCAL app.cluster_id = '<uuid>';
CREATE POLICY field_farmer_own ON core.field FOR SELECT
  USING (current_setting('app.role', true) <> 'farmer'
         OR owner_ref = NULLIF(current_setting('app.owner_ref', true),'')::uuid);
CREATE POLICY field_cluster_scope ON core.field FOR SELECT
  USING (current_setting('app.role', true) = 'admin'
         OR cluster_id = NULLIF(current_setting('app.cluster_id', true),'')::uuid);
```
(Application-level checks in FastAPI dependencies are mandatory; RLS is a stretch goal.)

## 8. Useful views

```sql
-- Latest prediction per field for the as-of date and active model
CREATE VIEW core.v_latest_prediction AS
SELECT DISTINCT ON (p.field_id, p.horizon_days, p.scenario_id)
       p.*, mv.model_version
FROM core.prediction p JOIN core.model_version mv USING (model_version_id)
WHERE mv.is_active
ORDER BY p.field_id, p.horizon_days, p.scenario_id, p.as_of_date DESC;

-- Field GeoJSON for the map
CREATE VIEW core.v_field_geojson AS
SELECT f.field_id, f.field_code, f.name, f.crop, f.stage, f.area_ha,
       ST_AsGeoJSON(f.geometry)::jsonb AS geometry
FROM core.field f;

-- Freshness summary
CREATE VIEW core.v_field_freshness AS
SELECT field_id, as_of_date, freshness FROM core.feature_snapshot;
```

## 9. Seed data (what `scripts/seed_db.py` must create)

1. 1 cluster ("Pimpri-Chinchwad Demo Cluster") with centroid and boundary.
2. 20 fields (config: 10–30) with polygons, crop (tomato / vegetable cluster), stage, area, sowing date; `field_soil` rows from cached SoilGrids samples.
3. `crop_stage_ref` rows for the demo crop (stages with `kc_stage`, `sensitivity`).
4. `data_source` rows for each cached dataset + `data_version`.
5. Observations for the replay season (weather, NDVI per field with cloud gaps/quality flags, forecast variables).
6. `feature_snapshot` for each field-date; `model_version` (active) and precomputed `prediction` (+ drivers) for the default as-of date and baseline scenario; scenario predictions precomputed for each preset scenario for speed.
7. Demo users: `farmer_demo` (linked to `farmer_identity` + 3 fields), `fpo_demo`, `waterman_demo`, `researcher_demo`, `admin_demo`.
8. A few historical `action_log` rows (mix of followed/overridden) so the Audit screen is not empty at first load.

## 10. Migration & integrity checklist

- [ ] Alembic migration 001: extensions, schemas, enums.
- [ ] 002: identity + cluster + user + field + soil + refs.
- [ ] 003: observation, feature_snapshot, model_version, scenario, prediction, drivers.
- [ ] 004: water_plan, items, trigger, action_log, metric_run, audit_event, views, indexes.
- [ ] Test: inserting a plan whose items exceed budget fails.
- [ ] Test: override without reason fails.
- [ ] Test: farmer API can't read another owner's field.
