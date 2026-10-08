# JalSetu AI — Implementation Plan

**Version:** 1.0 · **Context:** PCCOE International Grand Challenge 2026 — AI for Climate Action / SDG 13  
**Team:** Byte_Me (Ameya Palande, Vivek Gulhane, Vishwajeet Rajput, Namrata Sitaphale, Sneha Shinde)  
**Faculty Mentor:** Yadneysh Khotre · **Institute:** Indira College of Engineering and Management, Pimpri-Chinchwad, Pune  
**Pilot Context:** Pimpri-Chinchwad peri-urban agricultural cluster, Pune (Tomato / vegetable cluster, 10–30 demonstration fields)

**Use with:** PRD, TRD, App Flow, UI/UX Brief, Backend Schema. Build **phase by phase**; do not generate the whole app in one shot. Each phase ends with a verifiable deliverable and a "Definition of Done".

---

## 0. Timeline anchors (from the competition roadmap)

| Window | Milestone | Our output |
|---|---|---|
| Sep 17, 2026 | Stage I idea PPT locked | Done (deck + blueprint) |
| Sep 30, 2026 | Shortlisting | Prepare demonstration field set + technical backlog |
| **Oct 1 – Nov 10, 2026** | **Stage II: prototype video** | Working field digital twin, stress model, optimizer, 7-scene video |
| Nov 15 – Nov 30 | Expert judging | Polish evidence, baseline comparisons, demo reliability |
| Dec 15 – Dec 20 | Finalists announced | Freeze baseline, plan advanced features |
| **Jan 20 – 21, 2027** | **Grand Finale (24-hour hackathon)** | Shock mode, monitoring, polish, final presentation |
| Feb 2027 | Optional 2-week mentorship | Pilot refinement, agronomy validation, partnership plan |

> This plan assumes the team proceeds with Stage II. Dates below are targets for ~5 weeks before Nov 10 (starting the week of **Oct 7, 2026**); adjust if the schedule changes.

## 1. Team roles (map names to roles as you decide)

| Role | Owns | Primary deliverable |
|---|---|---|
| **ML / Data** | ingestion, features, labels, stress & crop risk models, evaluation | Stress model + metrics |
| **Optimization** | optimizer, priority score, baselines, backtests | Allocation engine |
| **Frontend / GIS** | map, screens, components, Why card, Inspect UI | Demo UI |
| **Backend / DevOps** | API, DB/storage, auth, Docker, CI, deploy | Reliable system |
| **Pitch / Research** | deck, video, Methods copy, references, validation | PPT + video + final pitch |

## 2. Ground rules for AI coding agents

1. **Read all six docs first.** Then reply with: (a) a summary of understanding, (b) missing details / assumptions, (c) a build plan — *before writing code*.
2. **Build one phase at a time.** After each phase: run tests, show how to run it, list what changed.
3. **Contracts first:** API schemas (Pydantic) and TypeScript types are generated/kept in sync before UI wiring.
4. **Never invent results.** Metrics must come from `evaluate.py`; UI numbers come from the API.
5. **Respect the PRD's "do not claim" list** in all copy.
6. **Keep modules small and tested;** no giant files; follow the TRD repo layout.
7. **Determinism:** fixed seeds; replay data versioned.

### Kickoff prompt (paste to your AI coding tool)
> Read all six documents carefully (PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan). Do not start coding yet. First summarize what you understood, identify missing details or conflicts, list your assumptions, and propose the build plan for Phase 0. After I approve, we will build phase by phase, and after each phase you must run tests and tell me exactly how to run and verify it.

### Per-phase prompt template
> We are now on **Phase N: <name>**. Implement only what the plan lists for this phase, following TRD/Schema/App Flow. When done: (1) list files created/changed, (2) give commands to run, (3) run tests and report results, (4) list anything deferred.

---

## PHASE 0 — Project setup & repo (≈ 0.5 day)

**Tasks**
- Create monorepo per TRD §3; add `docs/` with the six documents.
- `docker-compose.yml` with `db` (postgis/sqlite), `api`, `web`; `.env.example`.
- Backend skeleton: FastAPI app, `/health`, config loader, logging, Pydantic base schemas, error format.
- Frontend skeleton: Vite + React + TS + Tailwind, router, layout shell (S0), API client with replay-mode switch.
- CI: lint (ruff, eslint), pytest, vitest, build.

**Deliverables:** `docker-compose up` shows blank app + `/health` OK; CI green.  
**Done when:** a fresh clone runs with one command; README has run instructions.

## PHASE 1 — Database & seed scaffolding (≈ 1 day)

**Tasks**
- Alembic migrations / SQLite table creation from the Schema doc (extensions, schemas, enums, tables, trigger, views).
- SQLAlchemy/GeoAlchemy2 models; repository layer.
- `scripts/seed_db.py` creating cluster, **tomato/vegetable demonstration fields** (10–30 polygons), users, `crop_stage_ref`.
- Tests: budget trigger, override-reason check, farmer ownership query.

**Deliverables:** migrated DB with demo users and N fields.  
**Done when:** `GET /api/v1/fields` returns GeoJSON for seeded fields; tests pass.

## PHASE 2 — Authentication & roles (≈ 0.5 day)

**Tasks**
- `POST /auth/login`, JWT, role dependencies, 5 seeded accounts, demo role-picker support.
- 401/403 handling and the standard error shape.
- Frontend: S1 Landing/Login, token handling, route guards, S10 pages.

**Deliverables:** role picker → correct landing route; forbidden routes blocked.  
**Done when:** API tests for each role matrix cell pass; farmer sees only own fields.

## PHASE 3 — Data ingestion & cached replay dataset (≈ 4–5 days) — *ML/Data lead*

**Tasks**
1. Define cluster area and final demo field polygons (10–30; default 20) → `data/fields/cluster.geojson`.
2. **NASA POWER** daily pulls for the replay period → parquet in `data/cache/`.
3. **Sentinel-2** (Earth Engine, offline script): per-field NDVI time series with cloud/clear-pixel filtering → parquet with `quality_flag`, `freshness_age`, `imputation_flag`; keep gaps.
4. **SoilGrids** from downloadable files → per-field soil table (+ `whc_proxy` derivation).
5. **India OGD rainfall** → monthly normals; optional **MOSDAC** products if accessible.
6. Build `forecast` variables for replay (true future with controlled noise; document).
7. Version everything: `DATA_VERSION`; write `data/cache/MANIFEST.json`.
8. Load into `core.observation` (+ `data_source`).

**Deliverables:** reproducible cache + loader; data-quality report (missing %, cloud gaps, ranges).  
**Done when:** script rebuilds the cache from raw files; DB observation counts match MANIFEST; no live API calls needed at runtime.

## PHASE 4 — Feature engine, labels & model (≈ 5 days) — *ML/Data lead*

**Tasks**
- `features/builder.py` implementing TRD §5 with unit tests (rolling windows, deficit, heat load, NDVI trend, freshness age).
- `labels/stress_index.py` with config-driven weights/threshold; leakage tests.
- Training set builder: field-date rows; **purged time split**.
- Baselines: persistence, rainfall threshold, fixed schedule.
- Train XGBoost / LightGBM classifier(s) per horizon + isotonic calibration; quantile regressors for bands; crop-risk model; SHAP drivers → plain-language labels.
- Implement multi-factor priority score formula (JalSetu AI §7.6):  
  `priority_score = w1*stress_prob + w2*crop_risk + w3*shock + w4*stage_sensitivity + w5*freshness_quality`.
- `scripts/evaluate.py` → `metrics.json` and plots; write `model_version` + `metric_run` rows.
- `scripts/precompute_predictions.py` → fill `prediction`, `prediction_driver`, `feature_snapshot`.

**Deliverables:** trained artifacts, `metrics.json`, precomputed predictions in DB.  
**Done when:** model beats or is honestly compared to baselines; calibration plot and Brier reported; seeds fixed.

## PHASE 5 — Optimizer & plan API (≈ 3 days) — *Optimization lead*

**Tasks**
- `optimizer/allocate.py` (OR-Tools GLOP LP; CP-SAT integer variant behind a flag) s.t. $\sum x_i \le B$.
- `optimizer/baselines.py`: fixed equal/area-proportional, rain-threshold, oracle.
- Demand computation (`10 × area_ha × need_mm`), eligibility rules (low stress / heavy rain / stale satellite data → pause or inspect).
- Metrics: share of water to high-risk fields, top-k recall, regret vs oracle across budget levels (25/50/75/100%).
- Endpoints: `GET /water-plan`, optional `POST /water-plan` (save), `GET /explain/{prediction_id}`, `GET /forecast/{id}`, `GET /fields/{id}/status`.
- Tests: **$\sum$ allocation $\le$ budget for 100+ random budgets**; monotonicity; zero-budget; budget $\ge$ demand; determinism.

**Deliverables:** working plan API with baseline comparison payload.  
**Done when:** all optimizer tests pass; `/water-plan` p95 < 500 ms for 30 fields.

## PHASE 6 — Scenario engine & action log APIs (≈ 2 days)

**Tasks**
- `scenarios/shocks.py`: transformations to replay weather (rain multiplier, Tmax delta, intense-rain injection) → recompute features/predictions → status diff.
- Endpoints: `GET/POST /scenarios`, `POST/GET /events`, `GET /metrics`.
- Audit events for login, plan, scenario, action.
- Tests: scenario changes at least one demo field's status; override without reason rejected.

**Deliverables:** shock mode works through API; audit trail populated.  
**Done when:** applying "heat wave + deficit (moderate)" turns $\ge 1$ Amber→Red and re-ranks the plan.

## PHASE 7 — Core UI: dashboard, map, field detail (≈ 5 days) — *Frontend/GIS lead*

**Tasks**
- Design tokens/Tailwind theme; build components: `StatusPill`, `ActionChip`, `FieldRow`, `Kpi`, `Banner`, `FreshnessBadge`, `WhyCard`, `ForecastChart`, `MapView`.
- **S2** Dashboard (MapLibre polygons colored by status, legend, layer toggle, ranked list, KPI strip, states).
- **S3** Field Detail (action card, forecast chart with band, Why card with "Inspect before irrigating" fallback for stale data/heavy rain, freshness table, history, override modal).
- Loading/empty/error/stale states per App Flow; mobile bottom-sheet behavior.

**Deliverables:** map + list + detail working against real API data.  
**Done when:** App Flow steps 1–4 of the judge demo run end-to-end.

## PHASE 8 — Planner, simulator, audit, evidence (≈ 4 days)

**Tasks**
- **S4** Planner: budget input (default 100 units) + slider + presets, method toggle, budget meter, priority table with rank-change animation, unfunded section, baseline comparison card, notify (demo preview), save/export.
- **S5** Shock simulator panel with diff strip and scenario chip.
- **S6** Audit table + drawer; **S7** Evidence tabs reading `/metrics`; **S9** Methods; **S8** Farmer home.
- Replay-mode fallback (static JSON snapshot generated by a script).

**Deliverables:** all P0 screens + P1 where time permits.  
**Done when:** the full 7-scene judge flow (App Flow J1 / JalSetu AI §8: "100 water units. 10 fields. One decision that protects the cluster.") runs with no manual intervention.

## PHASE 9 — Testing, hardening & deployment (≈ 3 days)

**Tasks**
- Backend: unit + API + role tests; frontend: component tests; Playwright smoke test for J1.
- Performance checks vs TRD §11; fix slow queries (indexes).
- Accessibility pass (keyboard, contrast, ARIA live updates).
- Deploy: API + DB (VM or Render/Railway/Fly) and frontend (Vercel/Netlify); production `.env`; seed; health check.
- Generate **offline snapshot build** + backup screen recording of the flow.

**Deliverables:** public demo URL, backup build, test report.  
**Done when:** a teammate on a fresh machine completes J1 using only the URL; backup works offline.

## PHASE 10 — Pitch assets & Stage II video (≈ 3–4 days, parallel from Phase 7) — *Pitch lead*

**Tasks**
- Script the 90-second / 7-scene prototype video following JalSetu AI §8:
  1. Equal treatment fails (fixed schedule)
  2. The shock (rainfall deficit + heat load)
  3. The prediction (3-7 day stress forecast + Why card)
  4. The trade-off (100 water units budget constraint & rank reorder)
  5. Uncertainty is actionable ("Inspect before irrigating" card)
  6. The audit trail (logged action + model version)
  7. Baseline comparison (AI priority vs fixed schedule).
- Record with the replay-mode build (deterministic); add captions highlighting "planning aid" and "scenario simulation".
- Update deck with real screenshots, real metrics, honest limitations slide.
- Prepare judge Q&A sheet (from PRD §13 / JalSetu AI §11).

**Deliverables:** video + updated deck by **Nov 10**.

---

## 3. Buffer & priorities (if time is tight)

**Cut order (last to first):** Farmer view (S8) → Evidence polish (S7) → CP-SAT integer variant → crop-risk model → PostgreSQL RLS → Export CSV.  
**Never cut:** field map, stress forecast with Why card, budget-constrained planner with baseline comparison, shock simulator, action log/audit, replay-mode determinism.

## 4. Global Definition of Done (MVP)

- [ ] One command brings up the stack with seeded data.
- [ ] 10–30 fields display on the map with Green/Amber/Red status.
- [ ] Field detail shows forecast band, Why card (3–4 drivers), freshness badges, model/data version, and "Inspect before irrigating" when applicable.
- [ ] Planner enforces hard budget (tests + DB CHECK) and shows rank changes + baseline comparison.
- [ ] Shock simulator changes statuses and re-ranks plan.
- [ ] Actions/overrides are logged; audit view shows planned vs actual.
- [ ] `metrics.json` generated by script; UI shows real numbers with proxy-label caveat.
- [ ] Replay mode works offline; backup recording exists.
- [ ] No unsupported claims (PRD §11) anywhere in UI/video/deck.
- [ ] Tests green in CI; README complete.
