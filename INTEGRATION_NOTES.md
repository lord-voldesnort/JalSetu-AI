# JalSetu AI — Integration Notes & Technical Changelog
**Branch:** `integration/release-candidate`
**Target Remote:** `origin`
**Release:** `v0.1-demo`
**Integration Lead:** Ameya Palande (Core Backend & Optimization Lead)
**Contributors:** Vivek Gulhane, Namrata Sitaphale, Sneha Shinde, Vishwajeet Rajput

---

## 1. Initial Git & Branch Audit Summary

- **Baseline (`origin/main` at `4a6a99e`):** Contained complete React 18 + Vite frontend developed by Vivek, warm agricultural UI redesign, Docker configurations, SQLite database persistence layer, and prototype endpoints.
- **Data Contribution (`origin/feature/namrata-data` at `c9e0aa8`):** Canonical GeoJSON field registry (`data/fields.geojson`), time-series observations (`data/observations.json`), and climate scenarios (`data/scenarios.json`). Fully integrated as the canonical data foundation.
- **Backend Contribution (`origin/feature/ameya-core` at `244c0f7`):** Authoritative decision engine containing multi-factor stress forecasting heuristic, constrained water allocation optimizer, Shapley-style explainability decomposition, governance event ledger, and metrics service.
- **Integration Target (`integration/release-candidate`):** Formed cleanly from `origin/main` (`4a6a99e`) to ensure zero visual regression on the user interface while porting and unifying the decision algorithms.

---

## 2. Cross-Module Compatibility & Architectural Resolutions

### 2.1 Backend Architecture Consolidation
- **Problem:** Two parallel backends existed—one coupled to SQLite/SQLAlchemy on `main` and one pure in-memory on `ameya-core`.
- **Resolution:** Retained `backend/app/main.py` from `main` as the application entrypoint, which mounts all routes under both `/api/v1` and root (`/`) for total client compatibility. Enriched the core services (`allocator.py`, `stress_engine.py`, `forecast_service.py`) with Ameya's optimization constraints and governance rules.
- **Event Persistence:** Retained SQLite (`jalsetu.db`) as the atomic ACID persistence layer for action events, avoiding multi-process file locking issues while preserving strict validation (mandatory `override_reason` on non-adherent decisions).

### 2.2 Dual-Schema Water Plan Support
- **Problem:** Team role plan / schema expected `budget_units`, `allocated_units`, `rows[]`, and `constraint_status`. Frontend interface expected `budget`, `requested_budget_m3`, `total_allocated_m3`, and `allocations[]`.
- **Resolution:** Added Pydantic pre-validators and additive alias attributes to `WaterPlanRequest`, `FieldAllocation`, and `WaterPlanResponse`. Both parameter styles are accepted on input and both representation styles are emitted on output.

### 2.3 Rollup Wasm Fallback on Windows
- **Problem:** `frontend/package.json` had `"type": "module"`, causing Node 24 to treat `scripts/patch-rollup.js` as an ES module, failing on CommonJS `require()`.
- **Resolution:** Renamed `patch-rollup.js` to `patch-rollup.cjs` and updated `package.json` postinstall command. `npm ci` and `npm run build` now succeed in 3.3 seconds.

### 2.4 Sensor Freshness & Stale Telemetry Handling (`PC-008`)
- **Problem:** `PC-008` (Landge Farm) contains 4-day-old weather and 13-day-old satellite telemetry in synthetic fixtures.
- **Resolution:** Enhanced `stress_engine.py` Rule B to penalize confidence to 0.60, emit explicit warnings, and downgrade recommendation from `irrigate_now` / `wait` to `inspect`. In `allocator.py`, flagged fields receive explicit inspection recommendations before irrigation authorization.

### 2.5 Dual-Mode Operation (Live API vs. Offline Mock Demo)
- **Problem:** Applications must support a robust fallback presentation if the backend is stopped or in poor connectivity environments.
- **Resolution:** Created `frontend/src/api/mockData.ts` with static mock fixtures matching canonical datasets. Added an interactive mode switch in `BackendStatusCard.tsx` and `frontend/src/api/client.ts`. The UI clearly flags "Demo / Mock Mode (Offline Backup)" when active.

---

## 3. Test Suite & Verification Results

| Suite | Scope | Result | Execution Time |
|---|---|---|---|
| `backend/tests/` | 46 comprehensive unit, boundary, scenario, and E2E tests | **46 Passed** (0 failures) | 1.12s |
| `frontend` typecheck | `tsc` TypeScript compilation | **0 Errors** | - |
| `frontend` build | `vite build` production bundle generation | **Success** (HTML, CSS, JS chunks) | 3.30s |
| Full 10-step Demo | Health, Fields, Explain, Forecast, Water Plan, Scenarios, Events, Metrics | **10/10 Verified** | Clean execution |

---

## 4. Unresolved Decisions & Team Handoff

1. **Production Database:** SQLite is suitable for demo, development, and offline deployments. For multi-tenant production scaling, migration to PostgreSQL can be scheduled in Vishwajeet's roadmap.
2. **Additional Allocation Algorithms:** Linear bounded greedy water-filling and equal-share allocation are fully implemented and verified. Advanced multi-objective Pareto optimization can be added additively without altering the frozen API contract.
