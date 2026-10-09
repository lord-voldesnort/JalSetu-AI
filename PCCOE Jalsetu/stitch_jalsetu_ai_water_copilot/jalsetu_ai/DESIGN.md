---
name: JalSetu AI
colors:
  surface: '#f0fcf8'
  surface-dim: '#d0ddd9'
  surface-bright: '#f0fcf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eaf6f3'
  surface-container: '#e4f1ed'
  surface-container-high: '#deebe7'
  surface-container-highest: '#d9e5e2'
  on-surface: '#131e1c'
  on-surface-variant: '#3f4948'
  inverse-surface: '#273330'
  inverse-on-surface: '#e7f3f0'
  outline: '#6f7979'
  outline-variant: '#bec9c8'
  surface-tint: '#0a6969'
  primary: '#005151'
  on-primary: '#ffffff'
  primary-container: '#0e6b6b'
  on-primary-container: '#9be9e8'
  inverse-primary: '#86d4d3'
  secondary: '#82542d'
  on-secondary: '#ffffff'
  secondary-container: '#febf90'
  on-secondary-container: '#794c26'
  tertiary: '#52329c'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a4cb6'
  on-tertiary-container: '#e2d4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a2f0ef'
  primary-fixed-dim: '#86d4d3'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f50'
  secondary-fixed: '#ffdcc4'
  secondary-fixed-dim: '#f8ba8b'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#673d18'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#cfbcff'
  on-tertiary-fixed: '#22005c'
  on-tertiary-fixed-variant: '#50309b'
  background: '#f0fcf8'
  on-background: '#131e1c'
  surface-variant: '#d9e5e2'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 44px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  metric-numeral-xl:
    fontFamily: Manrope
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.03em
  metric-numeral-lg:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  title-md:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-badge:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies a calm, authoritative, and scientific agricultural decision-support ethos. Designed for agronomists, basin managers, and agricultural enterprise operators, the interface translates complex hydrological modeling into clear executive advisory briefs.

The visual style blends restrained modern minimalism with scientific editorial structure:
- **Atmospheric Clarity**: High signal-to-noise ratio using natural earth tones, purposeful whitespace, and precise typographic cadence.
- **Scientific Trust**: Authoritative editorial typography paired with tabular numeric discipline to validate high-stakes allocation models.
- **Strict Semantic Containment**: Vivid alert colors are quarantined exclusively for hydrological stress states, preventing visual fatigue and decision errors.

## Colors

The palette grounds modern hydrological analytics in natural earthen elements.

### Base Palettes (Light Mode)
- **Background**: Canvas warm off-white `#F7F4EC`.
- **Surfaces**: Primary white `#FFFFFF`, elevated resting surface `#FCFBF7`, structural border `#E3DED0`.
- **Primary Brand**: Deep teal `#0E6B6B`, interactive hover `#0A5252`, background tint `#E6F3F3`.
- **Secondary Accent**: Soil brown `#8A5A33`, badge/tonal tint `#F4ECE6`.
- **Text & Hierarchy**: Primary dark slate/green-black `#1F2A28`, secondary muted `#5C6B68`, subtle boundary `#94A3A0`.

### Strict Hydrological Stress Scales
These tokens are isolated exclusively for physical field state assessments:
- **Low Risk**: `#2E9E5B` (Surface: `#EDF8F2`)
- **Medium Risk**: `#F2A900` (Surface: `#FEF8EC`)
- **High Risk**: `#D64545` (Surface: `#FCEEEE`)
- **Inspect Before Irrigating (Field Anomaly)**: `#7A5CC7` (Surface: `#F4F0FB`)

### Dark Mode (Field & Control Room)
- **Background**: Deep void `#0B1620`.
- **Surfaces**: Panel `#132633`, card `#1B3142`, borders `#233D50`.
- **Text**: Contrast text `#E6EEF2`, muted text `#8BA4B5`.
- **Accent**: Hydrologic cyan `#3CC8E0`.

## Typography

The typographical framework balances humanistic editorial pacing with rigorous numeric readability:
- **Headlines (`Newsreader`)**: Evokes the credibility of national resource registries, scientific agricultural whitepapers, and advisory documents.
- **Interface & Metrics (`Manrope`)**: Provides geometric clarity for tabular readings, sensor feeds, volumetric metrics (e.g., m³, ML, evapotranspiration indices), and field operation instructions.
- All numeric measurements must be displayed using tabular figures (`font-variant-numeric: tabular-nums`) to ensure vertical alignment across data grids and meters.

## Layout & Spacing

The system utilizes an asymmetrical 12-column grid for desktop views (reflowing to 6 columns on tablet and 4 columns on mobile), optimizing display of spatial mapping engines alongside analytical sidebars.

- **Desktop (≥1280px)**: 12-column structure with fixed 360px contextual copilot inspector, 24px gutters, and 32px canvas margins.
- **Tablet (768px - 1279px)**: 6-column fluid structure, 16px gutters, and 24px margins with stacked data drawers.
- **Mobile (<768px)**: 4-column flow, 16px margins, and sticky bottom intervention bars ensuring thumb-accessible emergency actions.
- **Vertical Rhythm**: Built upon a strict 4px/8px sub-grid, governing metric clusters, driver bars, and tabular ledger rows.

## Elevation & Depth

Visual hierarchy is maintained via structural low-contrast borders complemented by soft, diffused warm shadows that prevent harsh digital glare:

- **Surface Level 0 (Canvas)**: Background tint `#F7F4EC` creates an organic, paper-grade field foundation.
- **Surface Level 1 (Panels & Base Cards)**: `#FFFFFF` bounded by an explicit 1px `#E3DED0` border. No shadow required in high-density grids.
- **Surface Level 2 (Elevated Active Cards & Tooltips)**: `#FCFBF7` with 1px border `#E3DED0` and ambient shadow: `0px 4px 16px -2px rgba(31, 42, 40, 0.05), 0px 2px 6px -1px rgba(31, 42, 40, 0.03)`.
- **Surface Level 3 (Flyouts & Copilot Drawers)**: `#FFFFFF` floating layer with border `#D5CFC0` and elevation shadow: `0px 12px 32px -4px rgba(31, 42, 40, 0.08), 0px 4px 12px -2px rgba(31, 42, 40, 0.04)`.

## Shapes

The roundedness token (`2`) creates disciplined 8px default radii across containers and interactive components, matching precision field instrumentation:

- **Base Elements (Buttons, Inputs, Checkboxes)**: 8px border radius (`0.5rem`).
- **Cards & Data Modules (`rounded-lg`)**: 12px border radius (`0.75rem`) as requested for core analytical containers.
- **Inspectors & Drawers (`rounded-xl`)**: 16px border radius (`1rem`).
- **Pill Badges & Status Chips**: Fully rounded pill shapes (`9999px`) to maintain clear cognitive separation from rectangular metric tiles.

## Components

### Buttons
- **Primary Action**: Deep teal `#0E6B6B`, text `#FFFFFF`, 44px min-height, 16px horizontal padding, 8px radius. Hover: `#0A5252`. Focus ring: 2px offset `#0E6B6B`.
- **Secondary Action**: Background `#F4ECE6`, text `#8A5A33`, border 1px solid transparent. Hover: `#EAE0D7`.
- **Outline Action**: Background `#FFFFFF`, text `#1F2A28`, border 1px solid `#E3DED0`. Hover: `#F7F4EC`.

### Badges & Status Chips
- **Dimensions**: 12px `label-badge` typography, 24px height, 10px horizontal padding, pill radius.
- **Data Freshness Indicators**:
  - *Fresh*: `#E6F3F3` background, `#0E6B6B` text with 6px solid teal pulsating indicator dot.
  - *Stale*: `#FEF8EC` background, `#B57D00` text with warning icon.
  - *Imputed (Model-Derived)*: `#F4F0FB` background, `#7A5CC7` text with italic marker.

### Hydrological Allocation Meter (Budget Bar)
- Horizontal dual-track bar: 12px height, 6px track radius, background `#E6F3F3`.
- Fill bar: `#0E6B6B` representing utilized quota, shifting to semantic `#D64545` when exceeding the dynamic environmental limit.
- Overlaid delta marker: 2px dashed indicator in `#8A5A33` denoting projected crop-evapotranspiration requirement.

### Explainable AI Driver Bars
- Compact row items with 13px label, tabular coefficient value, and a 6px-tall horizontal distribution bar.
- Positive hydrological drivers styled in muted teal (`#2F8E8E`); negative impact factors in muted earth (`#A37550`).

### Cards & Analytical Panels
- White `#FFFFFF` or elevated `#FCFBF7` background, 12px border radius, 1px `#E3DED0` hairline border, 20px internal padding.
- Card headers pair Newsreader titles (`title-md`) with high-contrast tabular metric units (`metric-numeral-lg`).