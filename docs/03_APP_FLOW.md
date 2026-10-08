# JalSetu AI — App Flow Document

**Purpose:** Enumerate every screen, action, navigation path and UI state so an AI coding agent can build the front end without guessing. Companion docs: PRD (what), TRD (how), UI/UX Brief (look), Schema (data).

---

## 1. Screen inventory

| ID | Screen | Route | Roles | Priority |
|---|---|---|---|---|
| S0 | App shell (top bar + nav + footer disclaimer) | – | all | P0 |
| S1 | Landing / Login (role picker) | `/` , `/login` | public | P0 |
| S2 | Cluster Dashboard (map + KPIs + ranked list) | `/dashboard` | fpo, water, researcher, admin | P0 |
| S3 | Field Detail (status, forecast, Why card, action) | `/fields/:id` | all (farmer: own only) | P0 |
| S4 | Water Budget Planner | `/planner` | water, fpo, researcher, admin | P0 |
| S5 | Shock Simulator (panel + date scrubber) | `/dashboard?sim=1` (overlay) & `/simulator` | water, fpo, researcher, admin | P0 |
| S6 | Action Log & Audit | `/audit` | fpo, water, researcher, admin (farmer: own) | P0 |
| S7 | Evidence / Metrics | `/evidence` | fpo, water, researcher, admin | P1 |
| S8 | Farmer Home (mobile-first) | `/me` | farmer | P1 |
| S9 | Methods & Data | `/methods` | all | P1 |
| S10 | Not Found / Forbidden / Error | `/404`, `/403`, `/error` | all | P0 |

Global rule: a persistent footer/line reads **"Planning aid — not an agronomic prescription. Demonstration fields; labels are proxy-based."**

## 2. Global navigation

**Top bar (desktop):** Logo "JalSetu AI" · nav: Dashboard · Planner · Simulator · Audit · Evidence · Methods · (right) data-version chip, **As-of date chip**, role badge, user menu (Switch role, Logout).
**Mobile:** bottom tab bar: Home (Map) · Planner · Log · More.
**As-of date chip:** shows replay date; clicking opens date scrubber (limits = available replay range). Changing date refetches all data.
**Data/Model chip:** "Data replay-… · Model xgb-…" (click → Methods).

## 3. Authentication flow

1. User opens `/` → **Landing** with product pitch (tagline + 3-line value) and **"Enter demo"**.
2. Click **Enter demo** → role picker cards: Farmer · FPO Coordinator · Water Manager · Researcher/Judge. (Admin hidden behind `?admin=1`.)
3. Selecting a role calls `POST /auth/login` with the seeded demo account → store JWT in memory (+ sessionStorage fallback) → route:
   - farmer → `/me`
   - others → `/dashboard`
4. Optional standard login form (username/password) available under "Sign in with credentials".
5. **Errors:** invalid credentials → inline message "Wrong username or password"; network error → "Can't reach server. Continue in replay mode?" with button **Use offline replay** (loads bundled static snapshot and sets Replay-mode banner).
6. **Logout:** clears token → `/`. **Session expiry (401):** modal "Session expired" → button **Sign in again** → `/login` and return to previous route.
7. **Forbidden route** → `/403` with "Your role can't open this page" + button **Back to dashboard**.
No signup / payment / upgrade flows in v1.

## 4. Screen specifications

### S1 — Landing / Login
- **Content:** hero (tagline), 3 pillars (Detect · Prioritize · Protect), "Enter demo" CTA, small "How it works" strip (data → forecast → plan → log).
- **Buttons:** *Enter demo* → role picker; role card click → login → redirect; *Sign in with credentials* → form.
- **States:** loading (spinner on role click), error (see §3), success (redirect).

### S2 — Cluster Dashboard
**Layout (desktop):** left = ranked field list; center = MapLibre map; right = summary KPIs / selected-field mini panel. **Mobile:** map full-screen, KPI strip on top, list in bottom sheet.
- **KPI strip:** # fields · # Red / Amber / Green · total forecast demand (m³) · cluster water budget (if set) · data freshness summary.
- **Map:** polygons colored by status (Green/Amber/Red) with status icon; hover tooltip: field name, crop, stress %, action; click → select field (highlight + right panel) ; double-click or **Open details** → S3. Layer toggle: *Stress now* · *7-day forecast* · *Data freshness*. Legend always visible. Zoom/pan controls; **Reset view** button.
- **Ranked list:** sorted by priority; columns: rank, field, crop/stage, stress %, action chip, freshness dot. Click row = select on map. Sort/filter: status, crop, stale-only.
- **Primary buttons:** **Plan water** → S4 · **Simulate shock** → opens S5 panel · **View audit** → S6.
- **Alert banner (P1):** if any field in shock condition: "⚠ Heat + rainfall deficit detected in N fields — Protect crop" with **Review** button (filters list to those fields).
- **States:**
  - *Loading:* skeleton map + skeleton rows.
  - *Empty (no fields for cluster):* "No fields in this cluster yet" + admin hint "Run seed script".
  - *Error:* "Couldn't load fields." **Retry** button + **Use offline replay**.
  - *All green:* success tone "No emerging stress in the next 7 days" + still shows list.
  - *Stale data:* amber banner "Satellite data is N days old for X fields."

### S3 — Field Detail
**Header:** field name, crop, stage, area (ha), status pill (Green/Amber/Red + icon + text), **Back to map**.
**Sections (top→bottom on mobile; two columns on desktop):**
1. **Recommended action card:** large action label (*Irrigate now / Wait / Inspect / Protect crop*), recommended window ("next 48 h"), priority level, indicative volume ("≈ 40 m³ planning units"), buttons **I did this**, **I did something else** (override), **Inspect checklist** (P2).
2. **Forecast chart:** stress probability for 3/5/7 days with p10–p90 band; "now" marker; tooltip.
3. **"Why this field?" card:** 3–4 driver rows, each = icon + plain sentence + contribution bar (SHAP-scaled) — e.g., "Rainfall deficit (14 d): 62 mm below need", "Heat load rising", "Vegetation declining", "Light sandy soil".
4. **Data freshness table:** weather · satellite (NDVI) · soil · forecast, each with last observed date, age, badge Fresh/Stale.
5. **Recent history:** mini timeline of stress index and logged actions.
6. **Model info (collapsed):** model version, data version, "How confident? calibrated probability".
- **Override flow:** click *I did something else* → modal: select action (Irrigated, Waited, Inspected, Protected, Other), input actual volume (optional), **Reason** dropdown (Soil felt moist · Rain expected locally · Water unavailable · Crop stage · Other), note (optional) → **Save** → `POST /events` → toast "Logged. Thank you — this improves local accuracy." → card shows "Logged" chip.
- **I did this:** one-click log with `followed_recommendation = true` (confirmation toast + Undo for 5 s).
- **States:** loading skeleton; error "Couldn't load this field" + Retry; not found → S10; stale inputs → amber "Based on satellite data from N days ago"; forecast unavailable → "Forecast unavailable; showing current status only"; low confidence (band wide) → note "High uncertainty — inspect field".

### S4 — Water Budget Planner (core demo screen)
**Top controls:** Budget input (numeric, m³) + slider (0 → total cluster demand ×1.2), **preset chips** (25% · 50% · 75% · 100% of demand), method toggle **JalSetu AI | Fixed schedule | Rain threshold**, planning window (7 days, fixed v1), **Generate plan** button (auto-regenerates on slider release, debounced 300 ms).
**Center:** 
- *Budget meter:* used / budget / remaining (progress bar); turns red outline if a request would exceed budget (can't — optimizer enforces; show "Constrained by budget" badge when demand > budget).
- *Priority table:* rank, field, stress %, priority score, demand, **allocated** (m³), allocation bar, action chip, *Why* link (opens drawer with drivers). Fields with zero allocation grouped under "Not funded this window" with reason ("Low stress" or "Rain expected" or "Budget exhausted").
- *Rank-change highlight:* when budget/scenario changes, rows animate to new position with ▲/▼ rank delta chips (shows "high-risk field moves ahead").
**Right:** *Baseline comparison card* — AI vs Fixed: "Share of water to high-risk fields: 81% vs 38%", top-k recall vs oracle, small bar chart; caption "Scenario simulation — not measured field savings".
**Buttons:** **Export plan (CSV)** (P1) · **Save plan** (stores `water_plan`) · **Notify (demo)** shows simulated SMS/WhatsApp-style notification preview (no real sending) · **Open on map** → S2 with plan overlay.
**States:** *Budget empty* → "Enter a budget to generate a plan" (button disabled); *budget = 0* → "No water available — all fields unfunded; see risk list"; *budget ≥ total demand* → "Budget covers all demand; priority order still shown"; *error* → "Couldn't generate plan" + Retry; *loading* → table skeleton; *no stressed fields* → "No irrigation needed in this window."

### S5 — Shock Simulator
**Panel/overlay on S2 (and standalone page):**
- Controls: **Scenario selector** (Baseline replay · Rainfall deficit · Heat wave · Intense rain · Combined deficit + heat), **intensity** slider (mild/moderate/severe), **Date scrubber** (as-of date), **Apply** and **Reset to baseline**.
- On apply: calls `POST /scenarios` then refetches fields/plan; map re-colors with transition; toast "Scenario applied: Heat wave (severe)". A **diff strip** shows "N fields changed status: 2 Green→Amber, 3 Amber→Red".
- *Intense rain* scenario: fields flip to *Wait / Pause irrigation* with message "Heavy rain forecast — pause irrigation".
- **States:** loading, error (revert to baseline + toast), empty (no change: "No fields affected by this scenario").
- Active scenario shown as a **chip in top bar** with an ✕ to clear.

### S6 — Action Log & Audit
- **Table:** time, field, recommendation (action + model version), planned volume, actual volume, followed? (Yes/Overridden), reason, note, user role.
- **Filters:** field, date range, followed/overridden.
- **Row click** → drawer: full audit trail — recommendation → drivers snapshot → data sources & freshness → model/data version → user action.
- **Summary strip:** total logged · % followed · top override reasons.
- **Buttons:** **Add action** (manual log modal, same as override modal), **Export CSV** (P1).
- **States:** empty ("No actions logged yet — log one from a field page" + button to dashboard); loading; error + Retry.

### S7 — Evidence / Metrics
- Tabs: **Detection** (precision/recall/F1, PR curve, confusion matrix) · **Forecast** (MAE/RMSE, reliability/calibration, interval coverage) · **Allocation** (top-k recall, regret vs oracle, water share to high-risk by budget level, AI vs baselines chart) · **Trust** (accepted vs overridden).
- Each chart has caption of dataset/model version and "proxy labels" note.
- **States:** metrics file missing → "Metrics not generated yet. Run evaluate script." (admin hint); loading; error.

### S8 — Farmer Home (mobile-first)
- Greeting with farmer alias; list of "My fields" cards: name, traffic light, **one sentence action** ("Irrigate within 2 days"), one-line reason, freshness dot.
- Tap card → S3 (simplified layout). Bottom sticky buttons on S3: **I did this** / **I did something else**.
- **Empty:** "No fields assigned" (admin must assign). **Error:** Retry.

### S9 — Methods & Data
- Sections: data sources (name, use, last update/version), pipeline diagram, model summary, label definition (proxy), uncertainty & freshness explained, limitations, **"What we don't claim"**, team & acknowledgements.

### S10 — Error pages
- **404:** "We couldn't find that page" → **Go to dashboard**.
- **403:** "Your role can't open this" → **Back**.
- **Error boundary:** "Something went wrong" + **Reload** + **Use offline replay**.

## 5. Primary user journeys

### J1 — Judge demo flow (Headline: "100 water units. 10 fields. One decision that protects the cluster.")
The canonical 7-scene demo flow (JalSetu AI §8):
1. **Scene 1 — The hook (Equal treatment fails):** **S1** Enter demo → pick *Water Manager* → **S2** opens with 10–30 tomato/vegetable demonstration fields; show fixed schedule allocating water equally regardless of field state.
2. **Scene 2 — The shock:** Trigger a rainfall-deficit and heat scenario in **S5** → input signals change (deficit & heat load rise, NDVI trend weakens, freshness remains visible); map fields recolor.
3. **Scene 3 — The prediction:** Select a newly Red field → **S3** shows current state, predicted 3–7-day stress probability, crop-risk status, top drivers (**Why card**), and data freshness.
4. **Scene 4 — The trade-off:** Open **S4 Water Budget Planner** → enter `100` water units → generate constrained plan; show high-risk field move ahead of lower-priority fields, respecting total budget $\le 100$.
5. **Scene 5 — The surprise (Uncertainty is actionable):** Select a field with stale satellite data or recent heavy rainfall → system outputs **"Inspect before irrigating — confidence reduced by stale observation / heavy recent rainfall"**.
6. **Scene 6 — The audit trail:** Log action/override in **S3** → open **S6 Audit** → inspect recommendation vs actual action, model version, and timestamp.
7. **Scene 7 — Baseline comparison:** In **S4 / S7**, compare fixed schedule vs JalSetu priority under the same 100-unit budget (scenario evaluation).

### J2 — Farmer
Login as Farmer → S8 → tap red field → read action + reason → **I did this** → toast → return to S8 (card shows "Logged today").

### J3 — FPO coordinator
Dashboard → filter *Red + Amber* → read ranked list → Planner with 75% budget → Save plan → Notify (demo preview).

### J4 — Researcher
Dashboard → Methods → Evidence → Audit (verify planned vs actual, versions) → export CSV.

### J5 — Intense rain / pause irrigation
Simulator → *Intense rain* → dashboard banner "Heavy rain forecast: pause irrigation in N fields" → Planner shows those fields as "Not funded: rain expected".

## 6. Button & action behavior table (key controls)

| Control | Where | Behavior | API | Success | Failure |
|---|---|---|---|---|---|
| Enter demo | S1 | Opens role picker | – | picker shown | – |
| Role card | S1 | Login with seeded account | `POST /auth/login` | Redirect | Inline error / offline option |
| Open details | S2 | Navigate to S3 | `GET /fields/{id}/status`, `/forecast/{id}` | S3 renders | Error state w/ Retry |
| Plan water | S2/S3 | Navigate to S4 (preselect field if from S3) | – | S4 | – |
| Apply scenario | S5 | Apply shock, refetch | `POST /scenarios` | Map recolors, diff strip | Toast error, revert |
| Reset to baseline | S5 | Clears scenario | `POST /scenarios` (baseline) | Reset | Toast |
| Generate plan / slider | S4 | Compute allocation under budget | `GET /water-plan` | Table + meter update | Error + Retry |
| Method toggle | S4 | Re-run with `method` | `GET /water-plan` | Table + comparison | Error |
| Save plan | S4 | Persist plan | `POST /water-plan` (optional) | Toast "Plan saved" | Toast error |
| I did this | S3/S8 | Log followed action | `POST /events` | Toast + Undo 5s | Toast error, keep button |
| I did something else | S3/S8 | Open override modal → save | `POST /events` | Toast + "Logged" chip | Inline error |
| Export CSV | S4/S6 | Download client-side CSV | – | File downloads | – |
| Notify (demo) | S4 | Show simulated message preview modal | – | Modal with sample message | – |
| Use offline replay | any error | Switch to static snapshot data | – | "Replay mode" banner | – |

## 7. Cross-cutting UI states

- **Loading:** skeletons (not spinners) for lists/cards; map shows base tiles first, polygons after data arrives.
- **Empty:** every list has an explanatory empty message and a next-step button.
- **Error:** inline message + Retry; never raw stack traces.
- **Success:** toast (3 s) for logging, saving, scenario apply.
- **Stale data:** amber badge on any input older than threshold (weather > 2 d, satellite > 12 d).
- **Replay mode banner:** persistent slim banner "Replay mode — using cached data".
- **Scenario active banner/chip:** persistent until cleared.
- **Offline/no network:** connection chip + automatic fallback prompt.
- **Accessibility:** status never by color alone (icon + label); keyboard-focus on map list; ARIA labels for map markers/rows; reduced-motion respects OS.

## 8. Navigation map

```
S1 Landing/Login ──► S2 Dashboard ──► S3 Field Detail ──► (Override modal)
                       │   │  │              │
                       │   │  └─► S5 Simulator (overlay) ─► back to S2
                       │   └────► S4 Planner ──► (Why drawer) / S2 overlay
                       ├───────► S6 Audit ─► (Audit drawer)
                       ├───────► S7 Evidence
                       └───────► S9 Methods
S1 (farmer) ──► S8 Farmer Home ──► S3
Any error ──► S10
```

## 9. Data dependencies per screen (for wiring)

| Screen | Endpoints |
|---|---|
| S2 | `GET /fields`, `GET /water-plan` (summary ranks), `GET /scenarios` |
| S3 | `GET /fields/{id}/status`, `GET /forecast/{id}`, `GET /explain/{prediction_id}`, `GET /events?field_id=` |
| S4 | `GET /water-plan?budget=&method=`, `GET /metrics` (baseline numbers) |
| S5 | `GET/POST /scenarios` |
| S6 | `GET /events` |
| S7 | `GET /metrics` |
| S8 | `GET /fields` (own fields) |

## 10. Microcopy rules

- Action labels: **Irrigate now · Wait · Inspect · Protect crop / pause irrigation**.
- Always say "indicative planning units" next to volumes.
- Uncertainty wording: "Likely", "Possible", never "Will".
- Disclaimers: "Planning aid — local practice and agronomist advice take priority."
- Never display claimed savings; use "scenario simulation".
