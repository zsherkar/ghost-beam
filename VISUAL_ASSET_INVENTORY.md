# Ghost Beam Visual Asset Inventory

This file inventories existing screenshots under `docs/screenshots/` and lists the remaining target captures for README, demo, and presentation use.

## Existing Screenshots

| Filename | Size | What it shows | Recommended README caption | Recommended use |
| --- | --- | --- | --- | --- |
| `docs/screenshots/final_dark_1440.png` | 1235x750 | Dark theme release-candidate dashboard at desktop-like width. | Ghost Beam dark control-room dashboard with the synthetic accelerator twin and trust panels. | README hero candidate, UI walkthrough. |
| `docs/screenshots/final_light_1440.png` | 1235x750 | Light theme release-candidate dashboard at desktop-like width. | Light-mode Ghost Beam dashboard showing the same trust-gate workflow in a scientific dashboard theme. | README theme parity section, appendix. |
| `docs/screenshots/final_evidence_drawer.png` | 1235x750 | Evidence drawer open with eLog/event content. | Evidence drawer showing the audit trail and retrieved eLog memory behind a gate decision. | Evidence/artifact section. |
| `docs/screenshots/final_guided_inline_dark.png` | 1440x900 | Guided demo controls visible inline in the right rail in dark mode. | Guided Drifted Twin Test with controls docked beside the 3D twin instead of blocking the beamline. | Demo flow section, presentation slide. |
| `docs/screenshots/final_guided_inline_light.png` | 1440x900 | Guided demo controls visible inline in light mode. | Light-mode guided demo with the Drifted Twin story visible and controls docked in the right rail. | Theme parity/demo slide. |
| `docs/screenshots/final_topbar_aligned.png` | 1440x900 | Final topbar alignment after the emergency rebuild. | Final topbar layout with System, Local Time, Scenario, Theme, and toolbar controls aligned in one row. | UI polish appendix, QA proof. |
| `docs/screenshots/final_ui_light_guided_docked.png` | 319x750 | Narrow in-app preview of light guided docked layout. | Narrow preview confirming guided controls remain docked and visible. | QA appendix only. |
| `docs/screenshots/inapp_dark_topbar_rc.png` | 1235x750 | In-app dark release-candidate topbar/workspace check. | Dark release-candidate app shell with topbar containment and workspace separation. | QA appendix. |
| `docs/screenshots/inapp_light_recorded_fixture.png` | 1235x750 | Light mode with recorded fixture state visible. | Recorded fixture mode in light theme, showing offline trace ingestion without live hardware. | Data source/recorded fixture section. |
| `docs/screenshots/platform_topbar_hotfix.png` | 1235x750 | Platform-realism pass topbar hotfix proof. | Topbar hotfix confirming product title and controls stay contained above the workspace. | QA appendix. |
| `docs/screenshots/qa_01_dark_green_zone.png` | 319x750 | Narrow dark Green Zone QA state. | Green Zone scenario in dark theme during narrow QA smoke. | QA appendix only. |
| `docs/screenshots/qa_02_judge_mode_guided_open.png` | 319x750 | Narrow judge/guided mode open state. | Judge Demo controls opened during narrow smoke testing. | QA appendix only. |
| `docs/screenshots/qa_03_health_check_open.png` | 319x750 | Health check panel open. | Demo Health Check panel before dry-run validation. | QA appendix, health check docs. |
| `docs/screenshots/qa_04_health_check_state.png` | 319x750 | Health check results visible. | Non-mutating dry-run health check results. | QA appendix, safety section. |
| `docs/screenshots/qa_05_guided_report_generated.png` | 319x750 | Guided report generated in narrow preview. | Mission report generated after the guided Drifted Twin Test. | Mission report appendix. |
| `docs/screenshots/qa_evidence_drawer.png` | 319x750 | Evidence drawer in narrow preview. | Evidence drawer works in the narrow in-app browser. | QA appendix. |
| `docs/screenshots/qa_light_integrated_twin.png` | 319x750 | Light integrated twin check in narrow preview. | Light theme twin integration smoke check. | QA appendix. |

## Final README Visual Order

1. Hero / dark guided twin: `docs/screenshots/final_guided_inline_dark.png`
2. Diagnosis and audit trail: `docs/screenshots/final_evidence_drawer.png`
3. Light theme twin: `docs/screenshots/final_guided_inline_light.png`

The remaining screenshots are useful QA/proof assets but are not embedded in the main README because the final release README should reflect only the small captured visual set available for GitHub.

## Target Screenshot List

Capture these if there is time before final README/presentation:

| Target filename | UI state | Purpose |
| --- | --- | --- |
| `docs/screenshots/hero_dark_guided_demo.png` | 1440x900 or 1920x1080, dark theme, guided Drifted Twin Test active, 3D twin visible. | Primary README/GitHub hero. |
| `docs/screenshots/hero_light_data_sources.png` | Light theme, Settings/Data Sources & Provenance panel open. | Public/federated data-source section. |
| `docs/screenshots/evidence_drawer.png` | Evidence drawer open after Drifted Twin evaluation. | Evidence/eLog explanation. |
| `docs/screenshots/diagnosis_tab.png` | Decision Record drawer, Diagnosis tab active. | Human-readable diagnosis section. |
| `docs/screenshots/benchmark_panel.png` | Benchmark panel after running 50-trial benchmark. | Quantitative utility section. |
| `docs/screenshots/data_sources_panel.png` | Data Sources & Provenance panel open. | External data and standards layer. |
| `docs/screenshots/evidence_bundle_export.png` | Evidence Bundle export confirmation or drawer area. | Judge artifact export section. |
| `docs/screenshots/mission_report.png` | Mission Report generated. | Mission report section. |
| `docs/screenshots/3d_twin_dark.png` | Dark Control Room twin only, beamline readable. | 3D twin feature section. |
| `docs/screenshots/3d_twin_light.png` | Light Inspection/Auto twin, beamline readable. | Light theme parity section. |

## Manual Screenshot Capture Instructions

General setup:

1. Start the backend:
   ```powershell
   cd "D:\Building\Ghost Beam\backend"
   $env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"
   python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Start the frontend:
   ```powershell
   cd "D:\Building\Ghost Beam\frontend"
   npm run dev -- --host 127.0.0.1 --port 5173 --force
   ```
3. Open `http://127.0.0.1:5173/` in an external browser.
4. Use viewport `1440x900` for README screenshots and `1920x1080` for presentation screenshots.
5. Hide browser bookmarks/toolbars if possible.
6. Do not crop out the topbar unless the screenshot is specifically for a panel/detail.

Specific captures:

- Hero dark guided demo:
  - Dark theme.
  - Start Guided: Drifted Twin Test.
  - Advance to Ghost Beam Evaluation or Calibration.
  - Ensure guided controls are docked in the right rail and the 3D twin is visible.
  - Save as `docs/screenshots/hero_dark_guided_demo.png`.

- Light data sources:
  - Switch to Light theme.
  - Open Settings / Platform drawer.
  - Show Data Sources & Provenance.
  - Save as `docs/screenshots/hero_light_data_sources.png`.

- Diagnosis tab:
  - Run Drifted Twin evaluation.
  - Open Decision Record.
  - Select Diagnosis tab.
  - Save as `docs/screenshots/diagnosis_tab.png`.

- Benchmark:
  - Open Benchmark panel.
  - Run benchmark.
  - Show summary cards/table.
  - Save as `docs/screenshots/benchmark_panel.png`.

- Evidence bundle:
  - Generate Evidence Bundle.
  - Show confirmation/export area.
  - Save as `docs/screenshots/evidence_bundle_export.png`.

## Presentation Visual Recommendations

- Slide 1: `final_guided_inline_dark.png` as hero.
- Slide 2: Mermaid architecture diagram from `docs/architecture_diagram_source.md`.
- Slide 3: Drifted Twin Test sequence using `final_guided_inline_dark.png`.
- Slide 4: Diagnosis/evidence screenshot, preferably new `diagnosis_tab.png`.
- Slide 5: Benchmark metrics from `packaging/artifacts/latest_benchmark.json`.
- Slide 6: Data Sources & Provenance screenshot, preferably new `data_sources_panel.png`.
- Slide 7: Evidence Bundle contents and safety disclosure.

## Known Visual Limitations

- Several existing QA screenshots are narrow in-app captures at 319x750 and should not be used as README hero images.
- Full projector-width screenshots should still be captured manually in an external browser.
- The 3D scene is procedural, not CAD/GLB.
- Vite still reports a large lazy `ControlRoom3D` chunk, but the frontend build passes.
