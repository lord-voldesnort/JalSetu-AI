# JALSETU AI
## Predictive Water-Allocation Copilot for Climate-Resilient Agriculture

**Team:** Byte_Me  
**Institute:** Indira College of Engineering and Management, Pimpri-Chinchwad, Pune  
**Team members:** Ameya Palande, Vivek Gulhane, Vishwajeet Rajput, Namrata Sitaphale, Sneha Shinde  
**Faculty Mentor:** Yadneysh Khotre  
**Challenge alignment:** PCCOE IGC 2026 — AI for Climate Action / SDG 13  
**Pilot context:** Pimpri-Chinchwad peri-urban agricultural cluster, Pune  
**MVP crop context:** Tomato / vegetable cluster

> **Tagline:** Predict water stress early. Prioritize scarce water. Protect crops.

---

## 1. Executive Decision

JalSetu AI is not another weather app, satellite viewer, or fixed irrigation scheduler. It is a **climate-resilience decision system** that answers a specific operational question:

> **When water is limited and field conditions are changing, which fields should receive attention first, how urgent are they, and what evidence supports that decision?**

The system creates a digital state for every field from rainfall history, weather forecasts, soil context, vegetation observations, crop stage, and logged actions. It forecasts near-term water stress, then converts the forecast into an explainable irrigation priority plan under a hard water-budget constraint.

The differentiator is the complete decision loop:

> **Observe → estimate field state → forecast stress → allocate scarce water → explain the trade-off → record the outcome.**

The first prototype will model one Pimpri-Chinchwad demonstration cluster with **10–30 fields**, a tomato/vegetable crop context, deterministic cached/replayed data, and a visible fixed-budget scenario. The scope is intentionally narrow so that the team can demonstrate an end-to-end system rather than a collection of disconnected features.

---

## 2. The Problem: Climate Variability Breaks Equal Treatment

A fixed irrigation schedule assumes that fields behave similarly and that weather will follow a predictable pattern. Climate variability breaks both assumptions.

Within the same cluster:

- One field may experience cumulative rainfall deficit and heat stress.
- A neighboring field may have sufficient soil-water context.
- Another field may have recently received intense rainfall and should not be irrigated immediately.
- Crop stage and soil properties can change the urgency of the same weather event.

The result is a decision gap. Existing approaches provide individual signals, but rarely provide the complete answer:

| Existing approach | What it can show | What remains unanswered |
|---|---|---|
| Fixed irrigation schedule | A repeatable routine | Which field is actually at risk today? |
| Weather application | Temperature and rainfall forecast | What does this mean for a specific field? |
| Satellite dashboard | Vegetation or surface-condition change | What should the user do next? |
| Manual inspection | Local observations | How should scarce water be prioritized across many fields? |

### The problem statement

> **How can AI combine climate, soil, crop, satellite, and field-observation signals to predict where water stress will emerge and prioritize scarce irrigation before stress becomes visible crop damage?**

This is not only a precision-farming problem. It is a **resource-allocation problem under climate uncertainty**.

---

## 3. Why This Needs to Exist

A user does not need one more dashboard full of charts. The user needs a decision that can be acted on and defended.

JalSetu AI is needed because it can:

1. **Move intervention earlier:** estimate stress before a field becomes visibly damaged.
2. **Make scarcity explicit:** show what happens when only a limited amount of water is available.
3. **Avoid unnecessary irrigation:** recognize rainfall or adequate-condition signals that justify waiting.
4. **Support different users:** provide a simple field action for a grower and a ranked portfolio view for an FPO or water manager.
5. **Make AI accountable:** expose the main drivers, data freshness, confidence, model version, and human override.

### Why a user should use JalSetu

A farmer or cluster manager should use JalSetu when the cost of treating every field equally is too high. The system is valuable even before it claims measured water savings because it creates a transparent basis for comparing decisions:

- fixed schedule versus risk-prioritized allocation;
- current field state versus forecast state;
- available water versus requested priority;
- recommendation versus actual action.

The prototype will present recommendations as **planning support**, not as an unvalidated agronomic prescription.

---

## 4. Product Promise and User Experience

### Product promise

> **JalSetu AI converts fragmented climate signals into a ranked, explainable water plan for a field cluster.**

### User journey

1. Select the Pimpri-Chinchwad demonstration cluster.
2. View field polygons with green, amber, and red stress status.
3. Select a field and inspect its current state, forecast, drivers, and data freshness.
4. Replay a rainfall-deficit and heat-stress scenario.
5. Enter the available water budget.
6. Generate a constrained priority plan.
7. Compare the AI plan with equal allocation or a fixed schedule.
8. Accept, override, or annotate an action.
9. Review the audit trail of planned versus observed actions.

### Four user-facing outputs

| Output | What the user sees | Decision enabled |
|---|---|---|
| Field status | Green / amber / red map layer | Which field should I inspect? |
| Stress forecast | Near-term stress probability and crop-risk status | How urgent is the situation? |
| Why card | Top drivers, confidence, and freshness | Why should I trust or question this? |
| Water plan | Ranked fields under available budget | Where should water go first? |

---

## 5. Pinpoint MVP

### MVP definition

> **A deterministic field-cluster digital twin that forecasts near-term water stress for 10–30 fields, ranks irrigation priority under a fixed water budget, explains the recommendation, and logs the resulting decision.**

The MVP is complete only when a judge can follow one field from input data to recommendation to logged outcome.

### MVP acceptance tests

| Capability | Acceptance test |
|---|---|
| Cluster map | 10–30 demonstration fields render with field ID, crop context, and stress status. |
| Field state | Each selected field shows recent observations, feature freshness, and crop stage. |
| Stress model | The system returns a reproducible 3–7-day stress estimate. |
| Priority engine | A fixed water budget produces a ranked plan whose allocation cannot exceed the budget. |
| Explanation | The recommendation exposes the top 3–4 drivers and uncertainty/freshness. |
| Scenario replay | A rainfall-deficit/heat event changes field priority in a visible, deterministic way. |
| Audit trail | The system stores recommendation, model version, action, override reason, and timestamp. |
| Baseline | The demo compares JalSetu priority against equal allocation or fixed schedule. |

### Explicitly out of MVP scope

- District-scale deployment.
- Fully automated irrigation hardware control.
- Universal crop models.
- Deep satellite computer vision as the main model.
- Unvalidated crop-specific irrigation-volume prescriptions.
- Voice assistant, multilingual interface, and autonomous retraining.

These are valuable later, but including them in the first demo would reduce reliability and make the core decision less visible.

---

## 6. What We Do Differently: USP

### Primary USP

> **JalSetu AI is a forecast-to-allocation system: it does not merely predict field stress; it decides how scarce water should be prioritized and shows the reasoning behind that trade-off.**

### Three defensible differentiators

#### 1. Closed-loop climate decisioning
Most tools stop at monitoring or prediction. JalSetu carries the prediction into a plan, then stores what actually happened. This creates an auditable learning loop.

#### 2. Water-budget intelligence
The system treats water as a constrained resource. The same field rankings can change when the available budget changes. The trade-off is visible instead of being hidden in a score.

#### 3. Human-trust layer
Every output carries:

- freshness of each important signal;
- top contributing factors;
- confidence or uncertainty indicator;
- model version and source metadata;
- manual override with a reason.

### Competitive comparison

| Solution type | Strength | JalSetu’s added layer |
|---|---|---|
| Weather app | Forecasts atmospheric variables | Converts them into field-level risk with local context |
| Satellite viewer | Shows spatial crop-condition change | Converts observation into a next action |
| Fixed scheduler | Simple and repeatable | Adapts priority to climate signals and scarcity |
| Black-box recommendation | Can produce a score | Explains drivers, freshness, constraint, and override |

---

## 7. Technical Architecture

### 7.1 System flow

```text
Open climate + field data
        ↓
Quality control and freshness layer
        ↓
Field-time feature store
        ↓
Stress probability + short-horizon forecast
        ↓
Calibrated risk score and explanation
        ↓
Constrained water-allocation optimizer
        ↓
Map, priority plan, audit log, and feedback
```

### 7.2 Data inputs

- Historical and forecast precipitation.
- Temperature, humidity, wind, and heat-load indicators.
- Rolling rainfall deficit over 3, 7, and 14-day windows.
- Soil texture and water-related properties.
- Field geometry, area, crop, and crop stage.
- Satellite vegetation or crop-condition proxy such as NDVI trend, after cloud/quality filtering.
- Recent irrigation events and field observations.
- Demonstration scenario controls for deterministic rainfall deficit and heat replay.

### 7.3 Quality and freshness layer

Each observation is stored with:

```text
source, timestamp, variable, value, quality_flag, freshness_age, imputation_flag
```

The feature layer should not silently treat missing observations as current truth. If satellite data are cloudy or stale, the system carries forward the latest valid observation and visibly marks its age. This prevents false precision.

### 7.4 Feature engineering

For each field and time step, construct features such as:

- cumulative rainfall deficit over rolling windows;
- forecast precipitation over the next 3–7 days;
- maximum temperature and heat-load index;
- humidity and evapotranspiration proxy;
- vegetation trend and latest-valid observation age;
- soil water-retention proxy;
- crop stage and field area;
- days since last recorded irrigation;
- recent field observation and quality flag.

The output is a **field-time feature vector**, not a single static farm label.

### 7.5 Stress model

For the hackathon baseline, use a calibrated gradient-boosting model such as XGBoost or LightGBM over engineered tabular features. This is deliberate:

- it handles mixed climate, soil, crop, and temporal features;
- it is faster to train and debug than a deep sequence model;
- feature contributions can be shown to judges;
- it works with a small prototype dataset more realistically than a large vision model.

The model outputs:

```text
stress_probability ∈ [0, 1]
crop_risk_probability ∈ [0, 1]
forecast_horizon = 3–7 days
confidence / calibration band
```

Labels for the prototype should be transparent proxies or field-note-derived indicators, not invented ground truth. Use rolling time splits so future observations do not leak into training.

### 7.6 Risk score

A practical prioritization score can combine predicted risk, urgency, and confidence:

```text
priority_score_i =
    w1 × stress_probability_i
  + w2 × crop_risk_probability_i
  + w3 × heat_or_rainfall_shock_i
  + w4 × crop_stage_sensitivity_i
  + w5 × data_freshness_quality_i
```

The final implementation should document the weights or learn them from validation scenarios. The freshness term must not reward stale data; it should lower confidence or trigger an “inspect” state when data quality is weak.

### 7.7 Constrained water optimizer

Let each field `i` have:

- `x_i`: allocated water or allocation decision;
- `d_i`: estimated need or scenario demand;
- `p_i`: priority score;
- `B`: available cluster water budget;
- `c_i`: field-specific capacity or maximum allocation.

A simple constrained objective is:

```text
maximize   Σ p_i × x_i
subject to Σ x_i ≤ B
           0 ≤ x_i ≤ c_i
           x_i = 0 for fields flagged as “pause / inspect” after intense rainfall
```

For a binary “serve first” demonstration, use a mixed-integer formulation:

```text
maximize   Σ p_i × y_i
subject to Σ demand_i × y_i ≤ B
           y_i ∈ {0, 1}
```

This makes the demo technically meaningful: the model predicts risk, but the optimizer determines which fields can be served under scarcity. Use OR-Tools or a linear-programming solver.

### 7.8 Explainability

For every plan row, return:

```text
field_id
priority
stress_probability
risk_state
top_drivers[]
freshness_flags[]
recommended_action
budget_context
model_version
```

The “why” card should say something like:

> **High priority because rainfall deficit is increasing, forecast heat load is elevated, vegetation trend is declining, and the last valid satellite observation is recent.**

It should also be able to say:

> **Inspect before irrigating: satellite observation is stale and heavy recent rainfall reduces confidence.**

This second type of output is important because trustworthy AI should sometimes recommend inspection instead of pretending to know.

### 7.9 Data model

```text
Field
  id, geometry, crop, stage, area, owner_group

Observation
  timestamp, field_id, source, variable, value,
  quality_flag, freshness_age, imputation_flag

Prediction
  timestamp, field_id, stress_probability,
  crop_risk_probability, confidence, model_version

WaterPlan
  date, budget, field_id, priority,
  allocated_amount, constraint_status

ActionLog
  field_id, action, actual_amount,
  override_reason, note, created_at
```

### 7.10 API contract

```text
GET  /fields
GET  /fields/{id}/status
GET  /forecast/{id}
POST /scenario/replay
POST /water-plan?budget=100
GET  /explain/{prediction_id}
POST /events
GET  /metrics
```

The API separation makes the architecture credible: forecasting and allocation are separate services, so future optimizers or crop models can be introduced without rewriting the user interface.

### 7.11 Recommended implementation stack

| Layer | Prototype choice | Purpose |
|---|---|---|
| UI | React + TypeScript | Map, field detail, scenario controls, priority table |
| Maps | MapLibre + GeoJSON | Field polygons and status layers |
| Backend | FastAPI + Pydantic | Typed APIs and validation |
| ML | Python, scikit-learn, XGBoost/LightGBM | Stress model and calibration |
| Optimization | OR-Tools / linear programming | Hard-budget allocation |
| Geo processing | GeoPandas, Rasterio | Field and raster features |
| Storage | SQLite/Parquet for demo; PostgreSQL/PostGIS for scale | Reproducible local demo and future spatial history |
| Deployment | Containerized backend + static frontend | Repeatable judging environment |

### 7.12 Security and reliability

- Keep farmer identity separate from field analytics.
- Use demo identities and do not collect sensitive or financial data.
- Store data source, timestamp, quality flag, and model version.
- Provide manual override and reason capture.
- Fail visibly when data are stale instead of silently using them as current.
- Cache required data so the demo does not depend on live API uptime.

---

## 8. The Demo That Judges Should Remember

### Demo title

> **“100 water units. 10 fields. One decision that protects the cluster.”**

This gives the judges a simple constraint to follow and turns the demo into a story rather than a feature tour.

### Demo setup

- Pimpri-Chinchwad demonstration cluster.
- 10 tomato/vegetable fields represented as polygons.
- 100 water units available.
- Baseline: equal allocation or fixed schedule.
- Scenario: rainfall deficit plus heat shock affecting a subset of fields.
- Data source: cached/replayed observations, clearly labeled as a deterministic prototype scenario.

### 90-second video sequence

#### Scene 1 — The hook: equal treatment fails

Show 10 fields and a fixed schedule distributing water equally. Say:

> “A fixed schedule treats every field as equally urgent. Climate does not.”

Highlight that neighboring fields can have different rainfall, soil, crop-stage, and vegetation conditions.

#### Scene 2 — The shock

Trigger a rainfall-deficit and heat scenario. Do not merely change a label; show the affected input signals:

- rainfall deficit rises;
- forecast heat load rises;
- vegetation trend weakens for selected fields;
- freshness indicators remain visible.

#### Scene 3 — The prediction

Select one field and show:

- current state;
- predicted 3–7-day stress probability;
- crop-risk status;
- top three drivers;
- confidence/freshness.

The key line:

> “JalSetu does not only say that this field is red. It shows why.”

#### Scene 4 — The trade-off

Enter `100` water units. Generate the plan. Show the ranked fields and the budget constraint.

The key line:

> “The prediction becomes useful only when it changes the allocation.”

Show a high-risk field move ahead of a lower-priority field. Show the total allocation never exceeds 100.

#### Scene 5 — The surprise: uncertainty is actionable

Select a field with stale satellite data or heavy recent rainfall. Instead of forcing irrigation, JalSetu outputs:

> “Inspect before irrigating — confidence reduced by stale observation / recent rainfall.”

This demonstrates that the system is designed to support judgment, not automate blindly.

#### Scene 6 — The audit trail

Log the planned action, actual action, and override reason. Open the audit view.

The key line:

> “Every decision leaves evidence for the next decision.”

#### Scene 7 — Baseline comparison

Show fixed schedule versus JalSetu priority using the same 100-unit budget. Label the comparison as a scenario evaluation, not proven real-world water savings.

### What judges must see on screen

1. A cluster map.
2. A changing climate scenario.
3. A field-level forecast.
4. A visible explanation.
5. A hard budget input.
6. A ranked plan.
7. A baseline comparison.
8. An action/audit log.

### Demo failure protection

- Pre-cache every input file.
- Use a fixed scenario ID and deterministic random seed.
- Prepare a screen-recorded backup path.
- Keep a static JSON response fallback for every API endpoint.
- Do not depend on live satellite retrieval during the video.
- Keep a one-slide architecture backup ready if the live UI fails.

---

## 9. Metrics and Evidence

The team should report evidence that can actually be generated by the prototype.

| Dimension | Measure | Honest evidence |
|---|---|---|
| Stress detection | Precision, recall, F1 | Held-out time periods where labels/proxies permit |
| Forecasting | MAE/RMSE or calibration error | Predicted stress versus observed proxy |
| Prioritization | Top-k recall, regret, or priority agreement | Scenario or oracle comparison |
| Constraint correctness | Budget violations | Must be zero in valid plans |
| Responsiveness | Plan-generation latency | Time from budget input to result |
| Trust | Accepted/overridden plan share | Action-log interaction metric |
| Data reliability | Fresh/stale/imputed feature share | Report missingness transparently |

Do not claim measured water savings or yield improvement without a field trial. During the hackathon, show **scenario allocation evidence** and clearly label it.

---

## 10. Post-Demo Roadmap

### Phase 1 — Hackathon MVP

- 10–30 fields.
- One tomato/vegetable cluster.
- Cached/replayed weather and satellite features.
- Calibrated tabular stress model.
- Hard water-budget optimizer.
- Explanation, freshness, override, and audit log.

### Phase 2 — Pilot validation

- Partner with an FPO, campus farm, or local agricultural network.
- Collect real irrigation and field-observation logs.
- Validate proxy labels with agronomy guidance.
- Compare fixed schedules, expert decisions, and JalSetu priority.
- Calibrate by crop stage and soil context.

### Phase 3 — Resilience infrastructure

- District-scale spatial database and monitoring.
- Multi-period water planning.
- Reservoir and community-water assets.
- Drought and flood shock modules.
- Crop-specific models with expert review.
- FPO and water-manager dashboards.

### Phase 4 — Responsible automation

- Local-language and low-bandwidth experience.
- Optional sensor integrations.
- Human-approved irrigation workflows.
- Outcome-based retraining after sufficient field data.
- Monitoring for model drift, regional bias, and stale-data failure.

---

## 11. Anticipated Judge Questions

### Is this just precision farming?

No. Precision farming usually optimizes field input or monitoring. JalSetu’s central problem is **climate-resilient water allocation under scarcity**. The model predicts stress, but the differentiating layer is the constrained decision plan across a cluster.

### Why satellite data?

Satellite observations provide spatial crop-condition context and recent change between neighboring fields. They are treated as one imperfect signal, not as unquestionable truth. Cloud filtering, latest-valid carry-forward, and freshness flags are part of the design.

### What if the data are missing?

The quality layer records staleness and imputation. The product can downgrade confidence or recommend inspection rather than produce a false-precision action.

### Can you prove water savings?

Not from the first prototype. We will show a deterministic scenario comparison against equal allocation/fixed scheduling. Real savings require a controlled pilot with field measurements.

### Why not use deep learning?

A large deep model is not automatically more credible. With a small, mixed-source prototype dataset, an interpretable gradient-boosting baseline plus constrained optimization is more feasible, testable, and explainable. Deep temporal or vision models are future extensions after local data accumulate.

### Is the recommendation a prescription?

No. It is decision support. Users can inspect, override, and log the reason. Crop-specific volume recommendations require agronomic validation.

---

## 12. Final Positioning

JalSetu AI should be remembered as:

> **The system that turns “which field is at risk?” into “where should our limited water go first, and can we explain that decision?”**

It is technically serious because it contains:

- a field-time digital twin;
- quality-aware multi-source feature engineering;
- calibrated stress forecasting;
- a mathematically constrained optimizer;
- explainable recommendations;
- human override and auditability;
- a deterministic, testable demo.

It is hackathon-feasible because the first release deliberately uses one cluster, one crop context, 10–30 fields, cached data, and one visible decision loop.

It is scalable because the water-budget engine, audit model, and API boundaries can later support FPOs, reservoirs, district planning, and drought/flood resilience modules.

> **JalSetu AI does not need perfect weather prediction to create value. It needs to help the next water decision become earlier, more targeted, and more accountable.**
