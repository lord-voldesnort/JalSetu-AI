# JalSetu AI — UI/UX Design Brief

**Goal:** A calm, trustworthy, decision-first interface that a farmer can read in 5 seconds and a judge can understand in 60. It should feel like a modern climate-tech civic dashboard — **not** a generic admin template and **not** a chatbot.

---

## 1. Design principles

1. **Decision first.** Every screen answers "what should I do next?" before showing data.
2. **Explain, don't dazzle.** Every recommendation has a visible reason, freshness and uncertainty.
3. **Honest by design.** "Planning aid", "scenario simulation", "proxy labels" are visible, never hidden in fine print.
4. **Scarcity made visible.** Budget meter and rank changes are the hero interaction.
5. **Glanceable status.** Traffic light + icon + word (never color alone).
6. **Mobile-capable.** Farmer view is thumb-friendly; dashboard degrades gracefully.
7. **Quiet confidence.** Generous whitespace, restrained motion, one accent color.

## 2. Visual style

- **Mood:** Deep navy + teal "water & data" identity, soft light backgrounds, crisp cards, subtle shadows, map as the hero.
- **Shape language:** 12 px card radius, 8 px controls, 999 px pills for status/chips.
- **Elevation:** 1 level (cards `0 1px 2px rgba(15,42,67,.06), 0 4px 12px rgba(15,42,67,.05)`); overlays/drawers slightly stronger.
- **Imagery:** No stock photos. Use simple SVG line icons (lucide-react) and the map. Optional faint contour/wave pattern in the landing hero.
- **Inspiration (patterns, not copying):** Google Earth Engine apps' map-first layouts · Linear's calm density · Stripe dashboard clarity · Planet Labs / Sentinel Hub field monitoring UIs.

## 3. Color system (design tokens)

```css
:root {
  /* Brand */
  --navy-900: #0F2A43;   /* headings, top bar, table headers */
  --navy-700: #1B3D5C;
  --teal-600: #0B8A8F;   /* primary accent, links, active nav, primary buttons */
  --teal-700: #08707A;
  --teal-100: #DFF3F3;

  /* Status (water-stress traffic light) */
  --green-600: #2E9E5B;  --green-100: #E3F4EA;   /* Low stress */
  --amber-500: #E0A21B;  --amber-100: #FBF1D8;   /* Watch / moderate */
  --red-600:   #D64545;  --red-100:   #FBE4E4;   /* High stress */
  --blue-600:  #3B6FD4;  --blue-100:  #E4ECFB;   /* Rain / pause irrigation / info */

  /* Neutrals */
  --bg:        #F5F8FB;  /* app background */
  --surface:   #FFFFFF;  /* cards */
  --border:    #DDE5EC;
  --text:      #0F2A43;
  --text-muted:#5B7083;
  --stale:     #9AA9B8;  /* stale/freshness dim */
}
```
**Usage rules**
- Primary buttons = teal; destructive/alert = red; never use red/green as the only differentiator.
- Status pills use `*-100` background + `*-600` text + icon: Green ✓ "Low", Amber ⚠ "Watch", Red ● "High" (use shape differences: check, triangle, octagon-ish).
- Map fills: Green `#2E9E5B` @ 55% opacity, Amber `#E0A21B` @ 60%, Red `#D64545` @ 65%, selected field outline `--navy-900` 3 px; stale-data fields get a diagonal hatch overlay pattern.
- Contrast: all text ≥ WCAG AA (4.5:1). Check teal on white (use `--teal-700` for small text).
- **Optional dark mode:** not in v1.

## 4. Typography

| Role | Font | Size / weight |
|---|---|---|
| UI & body | **Inter** (fallback system-ui) | 14–16 px, 400/500 |
| Headings | **Inter** semi-bold (optionally "Source Serif 4" for landing hero title only to echo the deck) | H1 28/32, H2 22/28, H3 18/24 |
| Numbers/metrics | Inter with `font-variant-numeric: tabular-nums` (or IBM Plex Mono for budget meter) | KPI 28–32 / 600 |
| Micro labels | Inter 12 px uppercase 0.04em tracking, `--text-muted` | – |

Line-height 1.5 body. Max line length ~70 chars for prose cards.

## 5. Layout rules

- **Grid:** 12-column desktop (max 1440 px), 8 px spacing scale (4, 8, 12, 16, 24, 32, 48).
- **Dashboard (≥1024 px):** `[ Ranked list 340px | Map flexible | Detail/KPI panel 360px ]`, top bar 56 px, KPI strip 72 px above map.
- **Tablet (640–1023):** map full width; list and detail as collapsible side drawers.
- **Mobile (<640):** map full-screen; KPI chips scroll horizontally; ranked list in a **bottom sheet** (peek 96 px → half → full); Field Detail is a full-screen page with sticky action buttons at the bottom.
- **Planner (desktop):** two-column — left (controls + priority table), right (budget meter + baseline comparison). Mobile: stacked, table becomes cards.
- Cards have a clear title row, optional subtitle, content, and footer with source/freshness text in `--text-muted` 12 px.

## 6. Components

### 6.1 Status pill
`[icon] Label` — height 24, radius 999, bg `*-100`, text `*-600`. Variants: Low (green), Watch (amber), High (red), Pause (blue), Stale (grey).

### 6.2 Action chip
Larger (32 px) with icon: **Irrigate now** (droplet, teal), **Wait** (clock, grey/blue), **Inspect before irrigating** (magnifier/alert, amber), **Protect crop / Pause** (shield/cloud-rain, blue/red).

### 6.3 Field card / list row
Name, crop·stage, area; stress % with a thin horizontal gauge (0–100); action chip; freshness dot (green/amber/grey). Selected row has teal left border and `--teal-100` background.

### 6.4 "Why" card
Title "Why this field?"; 3–4 rows: icon · plain sentence · contribution bar (teal for increasing risk, blue for decreasing). Footer: "Model xgb-… · Data replay-…". Tooltip explains "contribution".  
*Actionable Uncertainty Variant:* When satellite data are stale (>20 days) or recent heavy rainfall occurred, the card displays: **"Inspect before irrigating: satellite observation is stale / heavy recent rainfall reduces confidence"**, demonstrating responsible AI decision support.

### 6.5 Freshness badge
Dot + "Satellite · 9 days ago". Fresh = green dot; Stale = amber dot + text "Stale"; Static (soil) = grey "Static dataset".

### 6.6 Forecast chart
Line (median p50) with shaded p10–p90 band in `--teal-100`; threshold dashed line at 0.60 labeled "Stress threshold"; "Today" vertical marker; x-axis day labels; y-axis 0–100%. Tooltip lists p10/p50/p90 and probability.

### 6.7 Budget meter (hero component)
Horizontal bar: allocated (teal) / remaining (light) / over-demand marker. Big numbers: "**84 m³** used of **100 m³**". Subtle tick at "total demand". When demand > budget: badge "Constrained by budget".

### 6.8 Priority table
Sticky header, zebra off, row height 52. Allocation column shows number + inline bar. Rank delta chips ▲2 / ▼1 with green/red text; animate row reorder (200 ms ease). Unfunded section collapsible.

### 6.9 Baseline comparison card
Two horizontal stacked bars "Water to high-risk fields": JalSetu vs Fixed schedule; caption in italic "Scenario simulation — not measured field savings".

### 6.10 Buttons
- Primary: teal solid, white text, 40 px height, radius 8.
- Secondary: white with border `--border`, navy text.
- Ghost: text-only teal.
- Danger: red outline.
- Loading: spinner replaces icon, label stays; disabled at 50% opacity.

### 6.11 Inputs
Numeric budget input with unit suffix "m³"; slider with teal thumb and preset chips below; focus ring 2 px `--teal-600` @ 40%.

### 6.12 Overrides modal
Centered 480 px; radio list for action, select for reason, optional note; primary **Save**, ghost **Cancel**.

### 6.13 Toasts, banners, skeletons
Toasts bottom-center (desktop: bottom-right) 3 s. Banners full-width under top bar (replay mode = blue-100, stale = amber-100, scenario = teal-100). Skeletons: grey-blue shimmer, respects reduced-motion.

### 6.14 Map
- MapLibre with light, low-saturation raster basemap (Carto Positron / OSM) so status colors pop.
- Controls: zoom, reset view, layer toggle (Stress now / 7-day forecast / Freshness).
- Legend card bottom-left; scale bar; attribution as required by tile provider.
- Hover: elevate polygon outline; Tooltip card.

### 6.15 Landing hero
Large headline "Predict water stress. Prioritize water. Protect crops." Subhead one sentence. Primary CTA **Enter demo**. Right side: stylized mini map graphic with Green/Amber/Red fields. Below: 3 pillars + 4-step strip.

## 7. Dashboard structure

1. **Top bar:** logo, nav, as-of chip, scenario chip (if active), data/model chip, role badge.
2. **KPI strip:** Fields · Red · Amber · Green · Forecast demand (m³) · Budget (if set).
3. **Main area:** list | map | context panel (selected field summary + quick actions).
4. **Footer line:** planning-aid disclaimer.

## 8. Mobile / desktop behavior

| Element | Desktop | Mobile |
|---|---|---|
| Nav | Top bar | Bottom tab bar |
| Dashboard | 3 panes | Map + bottom sheet |
| Field detail | Two-column | Single column, sticky bottom action bar |
| Planner | 2-column | Stacked; table → cards |
| Tap targets | 32–40 px | ≥ 44 px |
| Charts | Full | Simplified labels, horizontal scroll avoided |

## 9. Interaction & motion

- Transitions 150–250 ms ease-out; map polygon recolor 300 ms fade; row reorder 200 ms.
- Slider release triggers a debounced plan fetch; show subtle "Updating…" in the budget meter, not full-page loaders.
- Respect `prefers-reduced-motion`.
- Success feedback: toast + brief highlight on changed element.

## 10. Content & tone

- Plain, calm, non-technical for farmer views; slightly more technical in Evidence/Methods.
- Use "Likely/Possible", sentences ≤ 16 words in action cards.
- Example action sentence: "Irrigate within 2 days — rainfall has been 62 mm below need and heat is rising."
- Icons: lucide (`Droplets`, `CloudRain`, `Thermometer`, `Satellite`, `Sprout`, `ShieldAlert`, `Search`, `Clock`, `MapPin`).

## 11. Accessibility

- WCAG AA contrast; focus-visible outlines; full keyboard nav on lists/tables; the map list is the accessible alternative to map clicks.
- Status communicated with icon + text; hatch pattern for stale.
- ARIA live region for scenario/plan updates ("Plan updated: 6 fields funded").
- Min font 14 px; scalable units (rem).
- Alt text/labels for charts with a "table view" toggle (P2).

## 12. Do / Don't

**Do:** keep one accent color; show source/version in card footers; use skeletons; keep copy honest.
**Don't:** use pie-chart clutter; use red/green only; add chatbot bubbles; show fake savings numbers; use gradients/glassmorphism heavy effects; autoplay animations.

## 13. Suggested frontend implementation notes for the AI builder

- Tailwind config extends colors with the tokens above; define CSS variables in `:root` and map Tailwind theme to them.
- Component library: shadcn/ui primitives (Dialog, Drawer, Tabs, Toast, Slider) styled with tokens.
- Create `components/` folder: `StatusPill`, `ActionChip`, `FieldRow`, `WhyCard`, `FreshnessBadge`, `ForecastChart`, `BudgetMeter`, `PriorityTable`, `BaselineCard`, `ScenarioPanel`, `OverrideModal`, `MapView`, `Banner`, `Kpi`.
- Keep all status → color/icon mapping in one `statusTheme.ts`.
- Provide a `ReplayModeProvider` that swaps API client for bundled JSON snapshot.
