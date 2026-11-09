# Backend Architecture Decision Record (ADR)
**JalSetu AI | PCCOE IGC 2026**
**Document:** `docs/BACKEND_ARCHITECTURE_DECISION.md`
**Status:** Approved & Implemented
**Date:** 2026-11-09
**Architects:** Ameya Palande & Team Byte_Me

---

## 1. Context and Problem Statement

During the development of JalSetu AI, two distinct backend implementations emerged across branches:
1. **The `main` branch implementation (Vivek & team):** Developed alongside the React + TypeScript frontend. It is structured around FastAPI, SQLite via SQLAlchemy models (`backend/app/db/`), canonical JSON fixture loaders (`backend/app/services/data_loader.py`), and API routers mounted under both `/api/v1` and root (`/`). It includes 46 comprehensive unit and E2E regression tests (`backend/tests/`).
2. **The `feature/ameya-core` implementation (Ameya):** Developed as the core decision and governance engine (Milestones A1–A6). It features pure Python in-memory fixtures, advanced LP / Simplex and greedy water allocation algorithms, dual-schema compatibility (`budget_m3` and `budget_units`), Shapley-style explainability point decomposition, and a standalone JSON event ledger with 65 unit tests.

Maintaining two independent, competing backend implementations violates project guidelines, leads to code drift, and confuses release packaging. A unified, authoritative backend architecture must be selected and documented.

---

## 2. Feature-by-Feature Evaluation Matrix

| Capability | Existing `main` Implementation | Ameya `feature/ameya-core` Implementation | Selected Architecture | Technical Rationale |
|---|---|---|---|---|
| **Entrypoint & Routing** | FastAPI with lifespan manager, mounting routers under both `/api/v1` and root (`/`). | FastAPI mounting under `/`. | **`main` baseline with unified routers** | Preserves seamless compatibility with the React frontend (which calls `/fields`, `/water-plan`, etc.) and OpenAPI v1 documentation. |
| **Field Data & Cadastre** | `DataLoader` parses `data/fields.geojson` and populates SQLite `FieldModel`. Exposes standard GeoJSON `FieldFeatureCollection`. | In-memory Python fixtures in `fixtures.py`. Exposes flat field objects. | **`main` GeoJSON via `DataLoader`** | GeoJSON `FeatureCollection` is strictly required by the frontend spatial map canvas (`FieldMap.tsx`) and registry (`FieldRegistry.tsx`). |
| **Stress Assessment & Forecast** | 5-variable weighted heuristic (`stress_engine.py`) producing `risk_score` (0–100), `stress_status` (green/amber/red/blue), and 7-day daily projections (`forecast_service.py`). | Agronomic heuristic with uncertainty bands (`uncertainty_band: { p10, p50, p90 }`) and freshness degradation. | **Unified Heuristic Engine** | Combine `main`'s 7-day daily projection curve (which the frontend expects) with Ameya's uncertainty bands and explicit stale-data penalties. |
| **Scenario Simulation** | `scenario_mgr.py` managing stateful and ephemeral replay of `normal_01`, `rainfall_deficit_heat_01`, and `heavy_rain_pause_01` without mutating baseline observations. | Ephemeral counterfactual evaluator in `scenario_service.py`. | **`main` Scenario Manager** | Already validated by `test_master_prompt_5_e2e.py` for non-mutating idempotency across all three scenarios. |
| **Water Allocation Optimizer** | Stress-prioritized greedy allocation (`allocator.py`) supporting `ai` and `fixed_equal` methods, capacity limits, and baseline comparison. | Constrained LP / Simplex + greedy fallback (`optimizer_service.py`) supporting dual-schema (`budget_units`, `allocated_units`, contract rows). | **Unified Optimizer with Dual-Schema Support** | Retain `allocator.py` as core engine; integrate Ameya's LP / dual-schema aliases (`budget_units`, `allocated_units`, `rows[]`) so both team contract and UI schemas work transparently. |
| **Explainability** | `GET /explain/{id}` returning `FieldAssessmentResponse` with driver statements, freshness table, and PRD policy disclaimer. | Driver point decomposition with natural-language narrative. | **Unified Explainability Service** | Serve complete `FieldAssessmentResponse` matching frontend modal while providing detailed attribution narratives. |
| **Event Storage & Governance** | SQLite `action_events` table with SQL transactions, auto-generated UUIDs, and mandatory `override_reason` enforcement. | Append-only JSON file store (`event_store.py`) with corruption recovery. | **SQLite Persistence Layer** | SQLite provides ACID guarantees, avoids file lock contention during concurrent test runs, and cleanly integrates with SQLAlchemy session dependency injection. |
| **Metrics & Analytics** | `GET /metrics` computing live database counts, adherence rates, and override reason breakdowns. | Event store metrics aggregator. | **Unified Metrics Service** | Directly aggregates persisted SQLite events and cluster risk distribution with zero synthetic fabrication. |

---

## 3. Persistence Strategy: Database vs. JSON File Store

### Decision: SQLite via SQLAlchemy (`jalsetu.db`)
- **Single Source of Truth:** Having both a SQLite database and a separate JSON event store causes synchronization inconsistencies. SQLite serves as the unified persistence engine.
- **Data Safety:** SQLite handles atomic writes safely across multi-process environments and server restarts.
- **Demo Reset Simplicity:** On startup, `Base.metadata.create_all()` initializes tables, and `seed_database()` populates fields, observations, and scenarios from canonical `data/` files if empty.
- **Git Hygiene:** `jalsetu.db` is strictly excluded from version control via `.gitignore`.

---

## 4. Contract Reconciliation & Backward Compatibility

To ensure zero breaking changes between the frontend, Ameya's test suite, and the team role plan contract, the following additive compatibility layers are implemented:
1. **Dual Schema for Water Planning:**
   - Request accepts: `budget` (m³) OR `budget_units`, `scenario_id`, `planning_window_days`, `method` (`ai`, `fixed_equal`).
   - Response provides:
     - `requested_budget_m3` AND `budget_units`
     - `total_allocated_m3` AND `allocated_units`
     - `allocations[]` AND `rows[]`
     - Each allocation includes `allocated_volume_m3`, `allocated_units`, `priority_rank`, `action_recommendation`, `reason`.
2. **Dual Schema for Healthcheck:**
   - Response provides: `{ "status": "ok", "app": "JalSetu AI", "service": "jalsetu-core", "environment": "development", "version": "0.1.0", "database": "connected" }`.
3. **Canonical Action Mappings:**
   - Backend recognizes canonical actions: `irrigate_now` (alias `irrigate`), `protect_pause` (alias `pause`), `wait`, `inspect`.
4. **Risk State to UI Color Mapping:**
   - `HIGH` / `Critical` -> `red`
   - `MODERATE` -> `amber`
   - `LOW` -> `green`
   - Deluge / Pause -> `blue`

---

## 5. Summary
The unified architecture preserves the frontend user experience and component models developed on `main`, while elevating the algorithmic rigor, constraint guarantees, and dual-schema compatibility authored by Ameya on `feature/ameya-core`.
