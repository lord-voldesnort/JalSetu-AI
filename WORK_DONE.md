# JalSetu AI — Backend Implementation Progress & Milestones (A1–A6)

**Project:** JalSetu AI — Predictive, Closed-Loop Water Allocation Decision Copilot  
**Context:** PCCOE International Grand Challenge 2026 (AI for Climate Action / SDG 13)  
**Cluster:** Pimpri-Chinchwad Peri-Urban Tomato/Vegetable Cluster (10 Demonstration Fields: `PC-001` through `PC-010`)  
**Branch:** `feature/ameya-core`  
**Lead:** Ameya Palande (Core Backend, ML and Optimization Lead)

---

## 1. Overview & Milestones Completed

All backend core milestones **A1 through A6** are fully implemented, verified, and passing 65 automated tests:

- **A1: Fields Cadastre & Geometry:** GeoJSON polygons, crop stages, and demo plot catalog (`GET /fields`).
- **A2: Observation & Quality Telemetry:** Signal freshness metadata, stale/missing/suspect indicators (`GET /fields/{id}/status`).
- **A3: Stress Forecasting Baseline:** Deterministic agronomic heuristic baseline, confidence scoring, uncertainty bands, and top-driver attribution (`GET /forecast/{id}`).
- **A4: Scenario Replay:** Deterministic climate shock simulation (rainfall deficit, heat waves, simulated irrigation) without fixture mutation (`POST /scenario/replay`).
- **A5: Constrained Water Allocation Optimizer:** Mathematical water-budget optimizer under scarce limits, supporting `ai_priority`, `equal_share`, and `proportional` methods, integer exactness for 100 units, pause/inspect safety gates, constraint overrides, and baseline comparison metrics (`POST /water-plan`).
- **A6: Explainability, Governance Ledger & Metrics:** Transparent farmer-facing Why cards (`GET /explain/{id}`), atomic append-only event governance ledger with corrupt file recovery (`POST /events`, `GET /events`), and real-time operational telemetry (`GET /metrics`).

---

## 2. API Endpoint Catalog

All operational endpoints provide direct routes and `/api/v1/` route parity:

| Method | Canonical Route | Alias Route (`/api/v1`) | Purpose & Response Summary |
|---|---|---|---|
| `GET` | `/health` | — | Service heartbeat (`{"status":"ok","service":"jalsetu-core"}`) |
| `GET` | `/fields` | `/api/v1/fields` | List all 10 demonstration fields with EPSG:4326 GeoJSON polygons |
| `GET` | `/fields/{field_id}/status` | `/api/v1/fields/{field_id}/status` | Field stress state (`green`/`amber`/`red`), observations & freshness flags |
| `GET` | `/forecast/{field_id}` | `/api/v1/forecast/{field_id}` | 7-day stress probability, uncertainty band (p10/p50/p90), top drivers |
| `POST` | `/scenario/replay` | `/api/v1/scenario/replay` | Replay what-if rainfall/heat shocks; returns baseline vs scenario delta |
| `POST` | `/water-plan` | `/api/v1/water-plan` | Constrained water-budget optimizer; enforces $\sum \text{alloc} \le B$ |
| `GET` | `/explain/{field_id}` | `/api/v1/explain/{field_id}` | Plain-language Why card, driver directions, and data-quality inspection notes |
| `POST` | `/events` | `/api/v1/events` | Log farmer actions, overrides, plans, and acknowledgements (HTTP 201) |
| `GET` | `/events` | `/api/v1/events` | Retrieve audit trail filtered by `field_id`, `event_type`, and `limit` |
| `GET` | `/metrics` | `/api/v1/metrics` | System telemetry, signal freshness counts, persistent event counts, process counters |

---

## 3. Optimization Architecture & Formulation (A5)

### 3.1 Mathematical Formulation
The optimization engine solves a constrained continuous knapsack linear relaxation:
$$\max \sum_{i=1}^N \text{priority\_score}_i \cdot x_i$$
Subject to:
1. **Total Budget Constraint:** $\sum_{i=1}^N x_i \le B$ (enforced strictly without floating-point overflow).
2. **Individual Field Headroom:** $\text{min\_allocation}_i \le x_i \le \text{effective\_cap}_i$.
3. **Safety Gates (Zero Allocation):**
   - **Excluded fields:** $x_i = 0$ when marked with `exclude: true`.
   - **Paused fields:** $x_i = 0$ when recent or simulated rainfall $\ge 35\text{ mm}$ (waterlogging hazard).
   - **Inspect fields:** $x_i = 0$ by default when telemetry is stale or missing, unless an explicit manager override provides $\text{min\_allocation}_i > 0$.
4. **Feasibility Validation:** If $\sum \text{min\_allocation}_i > B$, the optimizer safely returns `constraint_status: "infeasible"` with a clear explanation rather than crashing or exceeding the budget.

### 3.2 Allocation Strategies
- **`ai_priority`:** Greedy priority water-filling by rank. Provably optimal for the defined linear objective $\sum p_i x_i$ under bounds and a hard budget.
- **`equal_share`:** Equal water-filling split among eligible uncapped plots, redistributing leftover from capped plots.
- **`proportional`:** Split proportional to estimated crop water demand.
- **Integer Exactness (Demo Story):** When the budget is an integer (e.g. 100 units), the largest-remainder method allocates exact integer units with zero overflow. For continuous budgets ($m^3$), downward truncation (`Decimal` / `floor`) guarantees $\sum x_i \le B$.

---

## 4. Governance, Explainability & Event Ledger (A6)

### 4.1 Explainability (`GET /explain/{field_id}`)
- Reuses the A3 stress forecast and A4 scenario simulation engines.
- Generates natural-language Why cards detailing why irrigation is recommended, paused, delayed, or flagged for inspection.
- Shares the canonical `derive_field_action()` rule engine with `/water-plan` to guarantee 100% action consistency across endpoints (`irrigate`, `wait`, `inspect`, `pause`).

### 4.2 Persistent Event Store (`POST /events`, `GET /events`)
- **Storage:** `JsonFileEventStore` using `pathlib.Path` pointing to `backend/app/data/runtime_events.json` (ignored via `.gitignore`).
- **Thread Safety:** Mutex lock (`threading.Lock`) protects concurrent reads and writes.
- **Atomic Disk Writes:** Writes to a named temporary file in the target directory, followed by atomic `os.replace()` to prevent partial corruption on Windows.
- **Crash Recovery:** If a file is malformed, it moves the damaged file to a timestamped `.corrupt` backup and reinitializes cleanly without service interruption.
- **Strict Business Validation:**
  - `irrigation_planned` strictly forbids `actual_amount`.
  - `irrigation_completed` strictly requires `actual_amount`.
  - `recommendation_overridden` and `recommendation_rejected` strictly require a non-empty `override_reason`.
  - Unknown fields are rejected with HTTP 422 (`extra="forbid"`).

### 4.3 Honest Telemetry (`GET /metrics`)
- Surfaces persistent event totals, signal quality rates (fresh vs stale vs missing), and in-process counters (`since_process_start`).
- Sets `ml_performance: "not_evaluated"`. Never fabricates accuracy metrics or claims proven water savings without field trials.

---

## 5. How to Test

Run the full automated test suite from the `backend/` directory:

```powershell
cd D:\Projects\jalsetu\backend
python -m pytest -v
```

Expected result: **65 passed, 1 warning (Starlette testclient deprecation warning).**

---

## 6. Assumptions & Limitations Boundary

1. **Synthetic Demonstration Data:** All field observations, soil proxies, and weather data are synthetic/cached demonstration fixtures for Pimpri-Chinchwad.
2. **Planning Aid Disclaimer:** All outputs are planning aids and scenario simulations; they are neither agronomic prescriptions nor validated ML models.
3. **No Unwarranted Causal Claims:** Outputs must not claim verified real-world water savings or yield gains prior to controlled multi-season field pilots.

