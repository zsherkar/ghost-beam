# Ghost Beam Full-Width Visual QA Checklist

Use this checklist for the final external-browser pass. The in-app browser is useful for smoke testing, but the final demo should be checked in a real desktop browser window.

## Setup

1. Start backend:

   ```powershell
   cd D:\Building\Ghost Beam\backend
   $env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'
   uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Start frontend:

   ```powershell
   cd D:\Building\Ghost Beam\frontend
   npm run dev
   ```

3. Open an external browser at:

   ```text
   http://127.0.0.1:5173
   ```

## Viewport Targets

Check at minimum:

- 1920x1080
- 1600x900
- 1440x900
- 1366x768 if available

## Required Screenshots

Save screenshots to `docs/screenshots/`:

- `external_1920_dark_green_zone.png`
- `external_1920_light_green_zone.png`
- `external_1920_guided_demo.png`
- `external_1920_evidence_drawer.png`
- `external_1920_mission_report.png`
- `external_1920_benchmark.png`
- `external_1920_evidence_bundle.png`

## Checks

1. Dark theme, `green_zone`
   - Topbar description says `Accelerator trust agent.`
   - No topbar text overlaps the beamline card.
   - Local Time ticks.
   - Scenario selector is visible.
   - Decision Summary is sticky and readable.
   - 3D beamline is visible and hover/click affordances work.

2. Light theme, `green_zone`
   - Evidence cards are light-native, not muddy/dark pasted-in cards.
   - 3D scene feels integrated in Inspection or Presentation lighting.
   - Chips/badges are readable.

3. Evidence drawer
   - Click `View All`.
   - Drawer opens with event history, eLog evidence, and DecisionRecord area.
   - Escape closes it.

4. Guided demo
   - Enable Judge Demo Mode.
   - Step through Drifted Twin Test.
   - Verify Naive Proposal highlights `Q7FF2`.
   - Verify Ghost Beam Evaluation shows `REQUEST_CALIBRATION` or human review.
   - Verify Calibration lowers OOD/trust risk.
   - Verify Safer Correction is approved or approved small step.

5. Mission report
   - Click Generate Mission Report.
   - Confirm report source is backend artifact.
   - Download Markdown and JSON.

6. Platform drawer
   - Open Settings.
   - Confirm Active Adapter is Simulated JAX Twin.
   - Confirm real hardware writes are disabled.
   - Confirm data manifest/provenance is visible.

7. Risk scenarios
   - Select `unsafe_write`; evaluate/apply path must remain blocked.
   - Select `elog_conflict`; Gate Evidence should explain human review.

8. Benchmark and evidence bundle
   - Open the guided panel and click `Benchmark`.
   - Run the benchmark and verify summary metrics render.
   - Export Benchmark JSON.
   - Click `Evidence Bundle`.
   - Verify export confirmation appears.

## Pass Criteria

- No bright browser page scrollbar.
- No topbar overlap.
- No critical right-rail controls hidden at 1440x900 or wider.
- No drawer clipping.
- No console errors after fresh reload.
- Dark theme remains the primary control-room look.
- Light theme is coherent enough for judge inspection.
