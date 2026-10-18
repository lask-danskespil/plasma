# Plasma v2 — Methylphenidate PK Simulator & Interactive Time-Slot UI

## Context & Original Repository Analysis

The original `plasma` project (`https://bitbucket.org/Largorate/games/src/master/plasma/`, local copy at `C:\Privat\games\plasma`) was a vanilla JavaScript HTML5 `<canvas>` tool that plotted Methylphenidate plasma concentration (`ng/mL`) curves over time:
- **Original models (`models/ritalin.js`, `models/concerta.js`, `models/medikinet.js`)**:
  - `Ritalin`: `Instant_Release_10mg`, `12_5mg`, `15mg`, `35mg` (note: `15mg` and `35mg` had copy-paste name strings `'Ritalin 10 mg Instant Release'`), `Moderate_Release_2080_25mg`, and `Moderate_Release_5050_20mg` (Ritalin UNO).
  - `Concerta`: `Extended_Release_18mg` (had name typo `'Concerta 36 mg Extended Release (calculated)'`), `36mg`, `54mg`, `72mg`.
  - `Medikinet`: `CR_20mg` and `CR_10mg` (had name typo `'Medikinet CR/LA 20 mg'`).
- **Original UI limitation**:
  - In `style/main.css`, `.product-selector` had `display: none;`, and `#apply` had no event listener in `js/main.js`.
  - Adding or moving doses across time slots required editing `products.push({ product: ..., delay: ... })` directly in `js/main.js`.

## What Changed & Why

1. **TypeScript + Vite Architecture (`src/types/`, `src/models/`, `src/engine/`, `src/ui/`)**:
   - Explicitly typed interfaces (`DataPoint`, `MedicineModel`, `ScheduledDose`, `RegimenPreset`, `SimulationResult`, `SimulatorState`) in `src/types/models.ts`.
   - Fixed the original model naming typos while preserving all original data points and reference images (`/public/reference/*`).

2. **Expanded Methylphenidate Product Catalog (55 Models across 9 Formulations)**:
   - **Medikinet CR** (50:50 IR : Enteric-coated ER, EU PAR NL/H/0529): `5, 10, 20, 30, 40, 50, 60 mg`.
   - **Concerta** (22:78 IR : OROS Osmotic ER, FDA NDA 021121): `18, 27, 36, 54, 72 mg`.
   - **Ritalin IR** (100% Immediate Release, US06344215): `5, 10, 12.5, 15, 20, 35 mg`.
   - **Ritalin SR / MR** (20:80 Release, US06344215): `25 mg`.
   - **Ritalin LA / UNO** (50:50 SODAS Bimodal Release, FDA NDA 021284 & Markowitz et al. 2003): `10, 20, 30, 40, 60 mg` + original `UNO 20 mg` model.
   - **Equasym XL / Metadate CD** (30:70 Diffucaps Biphasic Release, FDA NDA 021259 & Gonzalez et al. 2002): `10, 20, 30, 40, 50, 60 mg`.
   - **Aptensio XR / Foquest** (40:60 Multilayer Beads, FDA NDA 205831): `10, 15, 20, 30, 40, 50, 60, 80 mg`.
   - **Quillivant XR** (20:80 ER Oral Suspension, FDA NDA 202100): `20, 30, 40, 60 mg`.
   - **Daytrana Transdermal Patch** (9-hour wear time, FDA NDA 021514): `10, 15, 20, 30 mg / 9h`.
   - **Jornay PM** (Evening Delayed-Release + Extended-Release, FDA NDA 209311): `20, 40, 60, 80, 100 mg`.
   - **Focalin XR** (50:50 d-threo-methylphenidate Bimodal Release, FDA NDA 021802): `10, 20, 30, 40 mg`.
   - **Custom Model Creator**: Users can add custom time-concentration profiles directly in the UI (`localStorage` backed).

3. **Pharmacokinetic Superposition Engine (`src/engine/pharmacokinetics.ts`)**:
   - Evaluates individual models using Cardinal / Catmull-Rom cubic Bezier splines matching the original `0.5` tension parameter, clamped to non-negative concentrations.
   - Supports arbitrary 15-minute / 30-minute time-slot offsets (`timeSlotHours`) and dose multipliers (`0.5×` to `3×`).
   - Computes combined total plasma concentration (`ng/mL`), per-dose contributions, $C_{\max}$, $T_{\max}$ (formatted as clock time), trapezoidal $\text{AUC}$, and hours inside the optional reference window.

4. **Interactive Time-Slot Scheduler & High-DPI Canvas (`src/ui/schedulerView.ts`, `src/ui/graphCanvas.ts`)**:
   - Users can add doses to any time slot via:
     1. The right-hand **Add Medicine to Time Slot** panel (Brand -> Strength -> Clock Time Slot / Quick Slot chips -> Multiplier).
     2. Clicking or double-clicking any hour cell in the **Interactive Time-Slot Schedule Track**.
     3. Clicking directly on the `<canvas>` chart at the desired time of day.
   - Scheduled doses appear both as **draggable horizontal bars** in the timeline lanes (drag left/right to shift across half-hour slots in real time) and as cards in the **Scheduled Doses** list with `-30m` / `+30m` steppers, time dropdowns, dose multipliers, mute toggles, `+4h Copy` duplication, and deletion.

5. **English / Danish (`EN` / `DA`) Language Switch (`src/i18n/translations.ts`)**:
   - Added a header segmented switch (`EN` / `DA`) persisted in `SimulatorState` (`localStorage` + URL hash).
   - Localizes all UI controls, KPI cards, time-slot scheduler hints, modals, preset names, hover tooltips, and `<canvas>` axis/badge labels (`Plasmakoncentration (ng/mL)`, `Top:`, `Målområde`).

6. **Fixed Y-Axis Option (`src/ui/graphCanvas.ts`, `src/ui/schedulerView.ts`)**:
   - Added `fixedYMax?: number | null` to `SimulatorState` and a toolbar toggle (`Fix Y-axis max:` / `Lås Y-akse maks.:`) paired with a numeric `ng/mL` input so users can lock the vertical axis to a specific concentration ceiling when comparing regimens across changes.

### Yolocat commit ledger
- f92cdda - Implement Plasma v2 Methylphenidate PK simulator and time-slot UI
- 1cc29c8 - Configure Vite dev server host 127.0.0.1:5173
- 1db33e1 - Add English and Danish language switch
- 4b63891 - Add option to fix Y-axis at a given value

