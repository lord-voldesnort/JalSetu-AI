# JalSetu AI — Product Requirements Document (PRD)

**Version:** 1.0 · **Context:** PCCOE International Grand Challenge 2026 — AI for Climate Action / SDG 13  
**Team:** Byte_Me (Ameya Palande, Vivek Gulhane, Vishwajeet Rajput, Namrata Sitaphale, Sneha Shinde)  
**Faculty Mentor:** Yadneysh Khotre · **Institute:** Indira College of Engineering and Management, Pimpri-Chinchwad, Pune  
**Doc purpose:** Single source of truth for *what* we are building. Read this before the TRD, App Flow, UI/UX Brief, Backend Schema and Implementation Plan.

---

## 0. Reading notes & resolved ambiguities (IMPORTANT for the AI agent)

The source slides contain a few typographic collisions (lost dashes). These are resolved as follows and must be used everywhere:

| Source text | Interpreted as | Reason |
|---|---|---|
| "1030 fields" | **10–30 demonstration fields** | The blueprint's MVP says "10–30 demonstration fields" |
| "37 days early" / "next-37-day" | **next 3–7 days** | The blueprint's forecast layer says "Next 3–7 day stress estimate" |
| "Crop Protection)" etc. | SDG list | Cosmetic only |

If any later doc or prompt conflicts with this table, this table wins.

---

## 1. App overview

| Item | Value |
|---|---|
| **App name** | JalSetu AI ("jal" = water, "setu" = bridge) |
| **One-line idea** | Predict water stress early, prioritize scarce water across fields, protect crops before climate shocks become losses. |
| **Tagline** | *Predict water stress early. Prioritize scarce water. Protect crops.* |
| **Category** | AgriTech · Water Resilience · Climate Intelligence · Food Security |
| **Prototype scope** | Tomato / vegetable cluster of 10–30 demonstration fields in Pimpri-Chinchwad peri-urban cluster, Pune. Deterministic replay of cached data. |
| **Core claim** | A **closed-loop water decision system**: Observe → estimate field state → forecast stress → allocate scarce water → explain the trade-off → record the outcome. |
| **What it is NOT** | Not a chatbot. Not a generic weather app. Not a satellite viewer. AI is the decision engine. |

## 2. Problem statement

Climate variability makes fixed irrigation schedules unreliable. Heavy rain makes scheduled irrigation wasteful or harmful; rainfall deficit and heat push crops into stress before a grower notices. Neighboring fields differ in soil, crop stage and rainfall history, yet decisions rely on late visual inspection or generic forecasts.

**PPT problem question:** *How can AI combine rainfall, weather, soil and satellite signals to predict where water stress will emerge and recommend where scarce irrigation should go first?*

Three gaps the product closes:

1. **Atmospheric vs field stress** — weather forecasts describe the sky, not stress inside a specific field.
2. **Observation vs action** — satellite imagery shows change but not "what do I do next?"
3. **Scarcity vs allocation** — water managers lack a portfolio view to prioritize limited water across many fields.

## 3. Target users & personas

| Persona | Role key | Core question | What they need |
|---|---|---|---|
| **Farmer** | `farmer` | "Irrigate now, wait, inspect, or protect crop?" | A simple, plain-language decision for *their* fields, with a reason. |
| **FPO / Cluster coordinator** | `fpo_manager` | "Which fields in our network need attention first?" | Ranked field list, water demand forecast, stress map. |
| **Water manager** | `water_manager` | "How should we allocate the limited cluster budget?" | Cluster water budget, scenario simulator, allocation plan. |
| **Agriculture researcher / Judge / Evaluator** | `researcher` | "Is this reproducible and honest?" | Feature history, model metrics, baseline comparison, audit log. |
| *(System)* | `admin` | Seed data, replay control, model version. | Admin utilities (hidden in demo). |

## 4. Product pillars (the four decisions)

| Pillar | What the system does |
|---|---|
| **DETECT** | Estimate field-level water-stress probability from multi-source climate and vegetation signals. |
| **FORECAST** | Provide a next-3–7-day stress / crop-risk estimate with **explicit uncertainty** and **freshness flags**. |
| **PRIORITIZE** | Rank fields and allocate irrigation volume under an **explicit, fixed cluster water budget**. |
| **LEARN** | Record planned vs actual actions and override reasons to build a local ground-truth dataset. |

**SDG alignment:** SDG 13 Climate Action (primary) · SDG 2 Zero Hunger · SDG 6 Clean Water · SDG 12 Responsible Consumption.

## 5. Feature list (with priority and acceptance criteria)

Priority: **P0** = must work in the demo · **P1** = should have for finale · **P2** = nice-to-have / backlog.

### F1 — Field cluster map (P0)
- Shows 10–30 field polygons colored Green / Amber / Red by current stress status.
- Click a polygon → opens Field Detail.
- **Accept:** all fields render within 2 s; legend present; status uses color **and** icon/label (accessibility).

### F2 — Stress detection & forecast (P0)
- Per field: current stress probability and next-3/5/7-day stress estimate.
- Shows uncertainty band (p10–p90) and a calibrated probability.
- **Accept:** `GET /forecast/{field_id}` returns probability, band, horizon, model version, data freshness in < 300 ms (precomputed or cached inference).

### F3 — Explainable "Why" card (P0)
- Top 3–4 drivers in plain language (e.g., "14-day rainfall deficit", "Heat load", "Vegetation declining", "Light sandy soil").
- Per-input **freshness badge** (fresh / stale + age in days).
- **Accept:** every recommendation displays drivers + freshness + model version.

### F4 — Recommended action (P0)
- One of: **Irrigate now · Wait · Inspect · Protect crop / pause irrigation**, with recommended window and priority level.
- Labeled as a **planning aid**, not an agronomic prescription.
- **Accept:** action label always accompanied by a reason and a manual override control.

### F5 — Water-budget optimizer & priority list (P0)
- User enters a cluster water budget (slider + numeric input).
- System returns a ranked list and per-field allocation such that **total allocation ≤ budget (mathematically enforced)**.
- Shows how a high-risk field moves ahead of lower-priority fields as the budget changes.
- **Accept:** automated test proves `sum(allocated) <= budget` for 100 random budgets; UI displays budget used / remaining.

### F6 — Baseline comparison (P0)
- Side-by-side: **Fixed schedule (equal/area-proportional split)** vs **JalSetu priority**.
- Metric: share of water going to truly high-risk fields; top-k recall vs oracle.
- **Accept:** at least one baseline comparison visible on the Planner or Evidence screen; clearly labeled "scenario simulation, not measured field savings".

### F7 — Shock / scenario simulator (P0 for flow, P1 for polish)
- Toggle: rainfall deficit, heat wave, intense-rain event; scrub replay date.
- Field status and plan update accordingly.
- **Accept:** triggering "heat + deficit" turns at least one demo field Amber→Red and re-ranks the plan.

### F8 — Action log & audit view (P0)
- Record planned vs actual irrigation, action taken, override reason, note.
- Audit view lists recommendation → model version → data sources → user action.
- **Accept:** logging an action persists and appears in the audit view immediately.

### F9 — Evidence / metrics dashboard (P1)
- Precision / Recall / F1 on held-out periods; MAE/RMSE for stress index; top-k recall / regret vs oracle; override rate.
- **Accept:** numbers are produced by a reproducible script and displayed with the dataset version; no invented figures.

### F10 — Farmer simple view (P1)
- Mobile-first card: field name, traffic light, one action sentence, reason, "I did this / I did something else" buttons.

### F11 — Shock alerts (P1)
- Alert banner for drought or intense-rain conditions: "Protect crop / pause irrigation".

### F12 — Methods & data page (P1)
- Lists data sources, versions, limitations, "what we don't claim".

### Backlog (P2 — do not build in v1)
District-scale map · deep sequence models · automatic multi-period planning · voice / local-language assistant · outcome-based retraining · reservoir/groundwater modules · crop-insurance integration · real payments or financial data.

## 6. User stories

**Farmer**
- As a farmer, I want a single clear action for each of my fields so that I don't need to interpret a model.
- As a farmer, I want to see *why* the app suggests it so that I can trust or question it.
- As a farmer, I want to override the recommendation and say why, so the system respects my local practice.

**FPO / cluster coordinator**
- As an FPO coordinator, I want a ranked list of all fields so that I can send help to the neediest first.
- As an FPO coordinator, I want a forecast of total water demand for the next days so that I can plan supply.

**Water manager**
- As a water manager, I want to enter a limited budget and see which fields get water so that scarcity decisions are transparent.
- As a water manager, I want to simulate a heat wave or rain deficit so that I can see how priorities change.
- As a water manager, I want to compare against a fixed schedule so that I can justify the plan.

**Researcher / evaluator**
- As an evaluator, I want to see data freshness, model version, and metrics so that I can judge credibility.
- As an evaluator, I want an audit trail of planned vs actual actions so that I can see the feedback loop.

## 7. User roles & permissions (summary)

| Capability | farmer | fpo_manager | water_manager | researcher | admin |
|---|---|---|---|---|---|
| View own fields | ✔ | ✔ (cluster) | ✔ (cluster) | ✔ (all, read-only) | ✔ |
| View cluster map | – | ✔ | ✔ | ✔ | ✔ |
| Run water-plan / budget simulator | – | ✔ (view) | ✔ | ✔ (read) | ✔ |
| Run shock scenarios | – | ✔ | ✔ | ✔ | ✔ |
| Log action / override | ✔ (own) | ✔ | ✔ | – | ✔ |
| View metrics & audit | – | ✔ | ✔ | ✔ | ✔ |
| Manage data/replay/model | – | – | – | – | ✔ |

Farmer **identity is separated from field analytics**; the prototype uses coarse/demo identities only.

## 8. MVP scope (build this first)

> **One field-cluster digital twin with 10–30 demonstration fields:**
> field map → latest observations → stress forecast → water priority → explainable recommendation → water-budget simulation → action log.

**In v1:** F1–F8 (P0). **Stretch for finale:** F9–F12.
**Not in v1:** everything in the backlog above, plus real user signup, payments, SMS/WhatsApp notifications (a *simulated* notification card is acceptable for the "notification" visual).

## 9. Prototype data assumptions

- **Demo crop:** **Tomato / vegetable cluster** in Pimpri-Chinchwad peri-urban cluster context; crop parameters are configurable (e.g., wheat, soybean).
- **Fields:** 10–30 demonstration polygons in Pimpri-Chinchwad cluster (synthetic/representative geometry; real coordinates only where team has permission). Default: **20 fields**.
- **Data is cached/replayed** → deterministic demo, no live API dependency.
- **Labels are transparent proxies** (composite stress index from agronomic proxies + any logged field notes). Real stress labels are sparse; this is stated openly.
- **Freshness:** satellite gaps (clouds) are handled by carrying forward the latest valid observation with a freshness flag.

## 10. Success metrics

### Demo/product success (must be shown)
| Criterion | Target |
|---|---|
| Deterministic end-to-end demo | Same inputs → same outputs on every run |
| Plan generation latency | < 500 ms for 30 fields (feels live) |
| Budget constraint | Enforced in code and verified by test |
| Baseline comparison | ≥ 1 shown (fixed schedule vs AI priority) |
| Explainability | Every recommendation shows drivers + freshness + model version |

### Model/evaluation metrics (report honestly, including weak results)
| Metric | Definition |
|---|---|
| Stress detection | Precision / Recall / F1 (and PR-AUC) on held-out periods |
| Forecast error | MAE / RMSE of stress index; calibration (reliability curve / Brier score) |
| Water prioritization | Top-k recall and regret vs oracle allocation (where labels permit) |
| Water-use efficiency | Share of water allocated to high-risk fields vs baseline (**scenario simulation only**) |
| User trust | Share of recommendations accepted vs overridden with reason (pilot interaction metric) |

Compare against baselines: **fixed schedule, rainfall threshold, persistence**.

## 11. What we must NOT claim (compliance rules for UI copy and pitch)

- No guaranteed yield increase or water savings without a controlled field trial.
- Not a substitute for agronomist expertise.
- No exact irrigation-volume prescriptions without a validated crop-water model and local calibration → volumes are shown as **"indicative planning units"**.
- Never present simulated results as measured results.

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Weak/sparse field labels | Transparent proxy labels; log field notes; expert review |
| Cloudy satellite scenes | Cloud filtering, last-valid carry-forward, freshness flag |
| Overconfident recommendations | Show uncertainty, manual override, "planning aid" wording |
| SoilGrids REST API downtime | Use downloaded/cached SoilGrids files |
| Live API failure during demo | Cached/replayed data + backup recorded demo |
| Label leakage (model just re-learns the label formula) | Strict time-based split; label defined on *future* values; features only up to time *t* |

## 13. Competition framing (for the product narrative)

| Evaluation component | Weight | Product evidence |
|---|---|---|
| PPT / idea | 30% | One visual story: problem → AI → action → measurable impact |
| Prototype | 30% | Working end-to-end flow on live/replayed data with model inference and action output |
| Grand Finale (24 h) | 40% | Depth, robustness, teamwork: modular code, tests, monitoring, backlog |

**60-second pitch:** *A fixed irrigation schedule assumes the weather will behave predictably. JalSetu AI does the opposite: it continuously estimates field condition, forecasts short-term water stress and then prioritizes scarce irrigation under a real water budget. Our MVP shows exactly which field should receive attention first, why, and how the plan changes when water availability changes.*

**Prepared judge Q&A (keep consistent in UI copy):**
- *Just precision agriculture?* → No: focus is climate resilience and **allocation under scarcity**.
- *Why satellite?* → Vegetation condition and recent change reveal differences between neighboring fields.
- *Clouds?* → Quality filter + latest-valid + freshness shown.
- *Prove savings?* → We report simulated results; causal claims need a field trial.
- *How is the plan constrained?* → Hard budget in the optimizer; trade-off is explicit.

## 14. Scale path (vision, not v1)

Stage 1: pilot fields → Stage 2: farm cluster / FPO → Stage 3: district resilience layer. Later: reservoir & community water assets, drought/flood modes, crop-specific calibrated models, FPO dashboards, multilingual voice.

## 15. Glossary

- **Stress probability** — calibrated probability that a field's water-stress index exceeds the stress threshold in the horizon.
- **Stress index** — 0–1 composite proxy of water stress.
- **Freshness flag** — marks whether an input is current or carried forward, with age in days.
- **Water budget** — hard cap (m³) of water available to the cluster for the planning window.
- **Oracle allocation** — allocation computed with true labels; upper-bound benchmark.
- **Regret** — objective gap between oracle allocation and JalSetu allocation.
- **Digital twin (field-time state)** — time-indexed feature vector per field.

## 16. Assumptions the AI agent should take (unless told otherwise)

1. Demo crop = tomato / vegetable cluster; 20 fields; planning window = 7 days; budget unit = m³ (cluster total).
2. Auth is lightweight demo auth with seeded role accounts.
3. Replay date default is a fixed "as-of" date chosen in seed data; a date scrubber moves it.
4. English UI only in v1.
