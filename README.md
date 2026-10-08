# JalSetu-AI
JalSetu AI is a climate-resilience copilot for agriculture. It combines rainfall, weather, soil, satellite, crop-stage, and field signals to forecast near-term water stress, explain the key drivers, and prioritize scarce irrigation under a fixed water budget. Built for transparent, actionable decisions.
JalSetu AI


Predict water stress early. Prioritize scarce water. Protect crops.

JalSetu AI is a climate-resilience copilot for agriculture. It combines rainfall, weather, soil, satellite, crop-stage, and field signals to forecast near-term water stress, explain the key drivers, and prioritize scarce irrigation under a fixed water budget. Built for transparent, actionable decisions.

Why JalSetu AI?

Climate variability makes fixed irrigation schedules unreliable. Neighboring fields can experience different rainfall, heat, soil, crop-stage, and vegetation conditions, yet water is often allocated equally or after visible crop stress appears.

Existing tools usually provide only one part of the decision:

•
Weather applications show atmospheric forecasts.

•
Satellite platforms show vegetation or crop-condition changes.

•
Fixed schedules distribute water predictably.

•
Manual inspection provides local knowledge but does not scale across a field cluster.

JalSetu AI connects these signals into one decision loop:

Plain Text


Observe → Forecast stress → Prioritize water → Explain the decision → Log the outcome



Core Problem


When water is limited and field conditions are changing, which fields should receive attention first, how urgent are they, and what evidence supports that decision?

MVP

The MVP is a deterministic field-cluster digital twin for a Pimpri-Chinchwad peri-urban agricultural cluster in Pune.

It demonstrates:

•
10–30 field polygons with green, amber, and red status.

•
Tomato/vegetable crop context.

•
Cached or replayed weather and satellite-derived observations.

•
Near-term 3–7-day water-stress forecasting.

•
Explainable field-level recommendations.

•
A hard water-budget constraint.

•
A ranked irrigation priority plan.

•
A comparison between equal allocation and JalSetu prioritization.

•
Manual override and action logging.

How It Works

1.
Collect signals — rainfall, forecast weather, soil context, vegetation observations, crop stage, and field actions.

2.
Quality-check data — track timestamps, source, quality, missingness, staleness, and imputation.

3.
Build field-time features — rainfall deficit, heat load, vegetation trend, soil-water context, crop stage, and time since irrigation.

4.
Forecast stress — use an interpretable gradient-boosting model to estimate stress and crop-risk probabilities.

5.
Explain the prediction — show the main drivers, confidence, and freshness of important inputs.

6.
Optimize allocation — rank or allocate water under a hard cluster budget using linear or integer optimization.

7.
Record feedback — store the recommendation, action, override reason, and observation for future validation.

Technical Architecture

Plain Text


Climate + field data
        ↓
Quality control and freshness layer
        ↓
Field-time feature store
        ↓
Stress probability and short-horizon forecast
        ↓
Risk score and explanation
        ↓
Constrained water-allocation optimizer
        ↓
Map, priority plan, audit log, and feedback



Recommended Stack

Layer
Technology
Purpose
Frontend
React + TypeScript
Field map, scenario controls, recommendations
Maps
MapLibre + GeoJSON
Field polygons and stress layers
Backend
FastAPI + Pydantic
Typed APIs and validation
Machine Learning
Python, scikit-learn, XGBoost/LightGBM
Stress forecasting and calibration
Optimization
OR-Tools or linear programming
Water-budget allocation
Geospatial Processing
GeoPandas, Rasterio
Vector and raster feature preparation
Storage
SQLite/Parquet for demo; PostgreSQL/PostGIS for scale
Field, observation, prediction, plan, and action history




Optimization Logic

For each field, JalSetu calculates a priority score from stress probability, crop risk, heat/rainfall shock, crop-stage sensitivity, and data quality.

For a limited water budget, the optimizer solves a constrained allocation problem:

Plain Text


maximize   Σ priority_i × allocation_i
subject to Σ allocation_i ≤ available_budget
           0 ≤ allocation_i ≤ field_capacity_i
           allocation_i = 0 for fields flagged “pause” or “inspect” after heavy rainfall



The system never allows the generated plan to exceed the available budget.

Demo Scenario

“100 water units. 10 fields. One decision that protects the cluster.”

1.
Open the demonstration field cluster.

2.
Show the baseline equal-allocation schedule.

3.
Replay a rainfall-deficit and heat-stress event.

4.
Select a field and show its stress forecast, main drivers, and freshness indicators.

5.
Enter a water budget of 100 units.

6.
Generate the JalSetu priority plan.

7.
Show a high-risk field moving ahead of a lower-priority field.

8.
Select a low-confidence field and show an “inspect before irrigating” recommendation.

9.
Log the planned action, actual action, and override reason.

10.
Compare JalSetu against the fixed schedule.

The prototype uses cached or replayed data so the demonstration remains deterministic and does not depend on live API availability.

USP

JalSetu AI is not only a weather app, satellite dashboard, or irrigation scheduler.

Its core differentiator is:


Prediction becomes useful only when it changes how scarce water is allocated.

JalSetu combines:

1.
Forecast-to-action: converts stress probability into a priority plan.

2.
Water-budget intelligence: makes scarcity and trade-offs explicit.

3.
Trust by design: shows drivers, freshness, uncertainty, model version, and human override.

4.
Closed-loop learning: stores planned and observed actions for later validation.

Evaluation Plan

The project will report evidence that can be generated by the prototype:

•
Stress detection: precision, recall, and F1 on held-out periods where labels permit.

•
Forecasting: MAE/RMSE or calibration error against an observed proxy.

•
Prioritization: top-k recall, priority agreement, or regret against a scenario/oracle baseline.

•
Constraint correctness: zero valid-plan budget violations.

•
Responsiveness: plan-generation latency after budget input.

•
Trust: accepted and overridden recommendations with reasons.

•
Data reliability: fresh, stale, and imputed feature proportions.

Scenario comparisons will not be presented as proven real-world water savings. Field savings and yield effects require controlled pilot validation.

Data and Reliability Principles

•
Cache required demonstration data.

•
Store source, timestamp, quality flag, and model version.

•
Mark satellite observations as fresh or stale.

•
Carry forward only the latest valid observation when appropriate.

•
Reduce confidence when important data are missing or old.

•
Recommend inspection instead of forcing a low-confidence action.

•
Keep farmer identity separate from field analytics.

•
Do not collect financial or unnecessary sensitive data in the prototype.

Future Roadmap

Phase 1 — Hackathon MVP

•
One cluster and 10–30 fields.

•
One tomato/vegetable crop context.

•
Cached data and deterministic replay.

•
Stress forecasting, optimization, explanation, and action logging.

Phase 2 — Pilot Validation

•
Partner with an FPO, campus farm, or local agricultural network.

•
Collect real irrigation and field-observation logs.

•
Validate proxy labels with agronomy guidance.

•
Compare fixed schedules, expert decisions, and JalSetu plans.

•
Calibrate by crop stage and soil context.

Phase 3 — District Resilience Layer

•
District-scale spatial database.

•
Multi-period water planning.

•
Reservoir and community-water assets.

•
Drought and flood shock modules.

•
Crop-specific models with expert review.

•
FPO and water-manager dashboards.

Phase 4 — Responsible Automation

•
Local-language and low-bandwidth access.

•
Optional sensor integrations.

•
Human-approved irrigation workflows.

•
Outcome-based retraining after sufficient field data.

•
Monitoring for drift, regional bias, and stale-data failure.

Limitations

JalSetu AI is decision support, not an autonomous agronomist. The prototype does not claim guaranteed water savings, guaranteed yield improvement, or universally accurate irrigation volumes. Recommendations must be reviewed in local context, especially when observations are stale or field labels are weak.

Project Context

•
Challenge: PCCOE Indradhanu International Grand Challenge 2026

•
Theme: AI for Climate Action

•
Primary SDG: SDG 13 — Climate Action

•
Pilot location: Pimpri-Chinchwad, Pune

•
Team: Byte_Me

•
Institute: Indira College of Engineering and Management

•
Faculty Mentor: Yadneysh Khotre

Team

•
Ameya Palande — Team Leader

•
Vivek Gulhane

•
Vishwajeet Rajput

•
Namrata Sitaphale

•
Sneha Shinde

All team members are second-year B.Tech Computer Engineering students.



