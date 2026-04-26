# Ghost Beam Updates

--------------------------------------------------------------------------------
## Update 2026-04-26 01:30 local time — Current-state assessment before visibility pass

### Objective
Record the starting point for the next Ghost Beam pass before changing rendering or interaction behavior.

### Files changed
- Updates.md — Created persistent project change log for technical stage tracking.

### Backend changes
- No backend code changed in this entry.
- Current backend already has stateful `/experiment/*` routes for start, state, propose, evaluate, apply, calibrate, reset, history, export, device registry, trajectory, and beam profile.

### Frontend changes
- No frontend code changed in this entry.
- Current frontend has a polished dark dashboard, right rail, Trust Gate, Evidence & eLog carousel, Decision Summary, scenario switching, experiment controls, and backend-connected state.

### 3D / digital twin changes
- No 3D code changed in this entry.
- Current central L1 Transfer Line uses procedural React Three Fiber geometry plus a dim static backdrop image.
- Current issue: 3D hardware is too dark and selected-device inspector blocks too much of the beamline view.

### Commands run
- `Get-Date -Format "yyyy-MM-dd HH:mm"` — Used to timestamp this entry.

### Validation
- Current state assessed from the existing implementation and latest user feedback.

### Known limitations
- Beamline visibility is not yet acceptable.
- Selected-device card is too large by default.
- Static backdrop is still present as atmosphere.
- CAD/GLB assets are not integrated; geometry is procedural.

### Next recommended step
Improve 3D lighting/material/camera visibility and replace the large selected-device card with a compact chip plus collapsible/dockable inspector.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 01:33 local time — 3D visibility and device inspector pass

### Objective
Make the L1 Transfer Line easier to read at a glance and remove the large selected-device card from the default beamline view.

### Files changed
- frontend/src/components/scene/ControlRoom3D.tsx — Added brighter procedural 3D lighting, camera presets, trust-colored beam envelope, selected-device focus behavior, compact selected-device chip, and collapsible/pinnable inspector drawer.
- frontend/src/styles/globals.css — Added styles for camera preset controls, compact device chip, dockable inspector drawer, improved viewport contrast, and reduced the dark vignette strength.

### Backend changes
- No backend code changed in this stage.

### Frontend changes
- Central 3D scene now exposes view presets: Isometric, Top, Side, Diagnostic, and Selected Device.
- Selected-device metadata is collapsed by default into a small chip with an Expand action.
- Full inspector now opens only on demand and supports pin, collapse, close, propose trim, evaluate, apply, calibration, reset, and policy actions.

### 3D / digital twin changes
- Increased ambient, hemisphere, directional, spot, and device accent lighting while retaining the dark control-room style.
- Brightened beam pipe, quadrupole, RF cavity, BPM/BCM, diagnostic screen, supports, and floor grid materials.
- Added trust-colored transparent beam envelope and brighter line/particle beam path.
- Added selected-device glow ring.
- Kept the static beamline image only as a dim atmospheric backdrop.

### Commands run
- `npm run build` from `frontend/` — Passed. Vite reported the existing large chunk warning from the Three/R3F bundle.

### Validation
- TypeScript and Vite production build completed successfully.
- Camera preset and inspector behavior compiled without type errors.

### Known limitations
- Visual validation was build-based in this stage; no screenshot diff tool was used.
- Geometry is still procedural, not CAD/GLB.
- Zoom buttons are present as viewport controls, while primary camera interaction is OrbitControls and preset buttons.

### Next recommended step
Verify the experiment loop still works after the rendering changes, then add/confirm artifact-readiness messaging and append final validation results.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 01:45 local time — Experiment readiness and validation pass

### Objective
Verify the interactive experiment loop after rendering changes, make synthetic-data status explicit in the UI, improve startup reliability, and record final validation.

### Files changed
- backend/ghostbeam/api/runtime.py — `start_experiment()` now clears scenario calibration freshness so scenario switches/reset states return to true initial conditions.
- backend/ghostbeam/diagnostics/virtual_diagnostic.py — Reduced default synthetic RF training size from 2400 samples/64 trees to 1200 samples/40 trees to improve local demo responsiveness while keeping tests green.
- frontend/src/App.tsx — Added a boot guard so React dev StrictMode does not start overlapping experiment sessions; passed session export into the JSON drawer.
- frontend/src/components/panels/ExperimentControlPanel.tsx — Added explicit synthetic-data/no-live-EPICS/no-real-eLogs disclosure.
- frontend/src/components/panels/DecisionRecordDrawer.tsx — Added Export Session action alongside Copy and Download for the latest DecisionRecord.
- frontend/src/styles/globals.css — Styled synthetic-data disclosure.

### Backend changes
- No new endpoints were added in this pass; existing `/experiment/*` endpoints were verified.
- Scenario start/reset behavior now clears calibration freshness for the selected scenario.
- Virtual diagnostic training is lighter for faster local demo startup.

### Frontend changes
- Boot flow is guarded against duplicate dev-mode initialization.
- Experiment control panel now visibly labels data as synthetic JAX digital-twin data.
- DecisionRecord drawer can export the full experiment session artifact.

### 3D / digital twin changes
- No additional 3D geometry changes in this validation pass beyond the previous visibility/inspector update.

### Commands run
- `npm run build` from `frontend/` — Passed. Vite reported the existing large Three/R3F chunk warning.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` — Passed, 42 tests.
- Restarted local backend on `127.0.0.1:8000` using project-local dependency path.
- Live API smoke sequence:
  - `POST /experiment/start` for `green_zone`
  - `POST /experiment/evaluate` with manual `quad_1=+0.03`
  - `POST /experiment/apply`
  - `POST /experiment/evaluate` with unsafe `quad_1=+99`
  - `POST /experiment/export`
  - `POST /experiment/start` for `drifted_twin`
  - `POST /experiment/calibrate`

### Validation
- Frontend build passed.
- Backend tests passed: 42 passed.
- Live API smoke result: manual green-zone trim returned APPROVE; apply succeeded; unsafe large quad action returned BLOCK.
- Drifted-twin smoke result: initial state returned REQUEST_CALIBRATION; calibration reduced OOD from 10.74 to 3.74.
- Frontend dev server responded at `http://127.0.0.1:5173/`.

### Known limitations
- Visual verification was not screenshot-diffed in this pass.
- 3D device geometry is procedural; text-to-CAD/GLB assets are still not integrated.
- Vite build still warns that the main JS chunk is large because Three/R3F are bundled into the app.
- Live EPICS, real facility logs, and real camera feeds are intentionally not used.

### Next recommended step
Use browser-based visual inspection to tune camera framing, label density, and right-rail spacing; then consider code-splitting Three/R3F or adding optional CAD/GLB models for higher-fidelity hardware.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 01:58 local time — Start right-rail workflow and digital-twin clarity pass

### Objective
Begin a product-story refinement pass focused on right-rail operator workflow hierarchy and clearer L1 Transfer Line digital-twin communication.

### Files changed
- Updates.md — Appended this starting entry before implementation.

### Backend changes
- No backend code changed in this starting entry.
- Existing `/experiment/*` session API remains the source of state, trajectory, device registry, history, export, and DecisionRecord data.

### Frontend changes
- No frontend code changed in this starting entry.
- Current right rail still needs reordering from component-category order to operator-workflow order.
- Current separate Next Action card should be merged into Experiment Runner.

### 3D / digital twin changes
- No 3D code changed in this starting entry.
- Planned changes include label density modes, digital-twin inspection modes, clearer beam state visual language, and device-class differentiation refinements.

### Commands run
- `Get-Date -Format "yyyy-MM-dd HH:mm"` — Used to timestamp this entry.

### Validation
- Not applicable yet; this is the pre-change log entry.

### Known limitations
- Trust Gate language can currently appear confusing when the twin is trusted but policy/eLog requires human review.
- eLog evidence is mostly visible in the bottom carousel instead of a prominent right-rail story card.
- 3D labels can still crowd the beamline.

### Next recommended step
Reorder the right rail, merge action controls into Experiment Runner, add a Gate Evidence card, and then refine 3D label/inspection modes.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 02:04 local time — Right-rail story hierarchy and digital-twin clarity pass

### Objective
Reorder the right rail around the operator workflow, merge duplicate action UI into Experiment Runner, clarify twin-trust versus gate-decision language, add prominent eLog evidence, and refine 3D label/inspection modes.

### Files changed
- frontend/src/App.tsx — Reordered right rail to Decision Summary, Experiment Runner, Trust Gate, Gate Evidence, Naive vs Ghost Beam, Beam Profile, Twin State, Scenario; removed `NextActionCard` from the rail.
- frontend/src/components/panels/DecisionSummaryCard.tsx — Added one-line decision reason and changed display from ambiguous trust status to explicit twin trust plus score.
- frontend/src/components/panels/ExperimentControlPanel.tsx — Merged Next Action behavior into Experiment Runner with source, Ghost Beam decision, affected PV chips, primary CTA state, editable deltas, secondary controls, and synthetic-data disclosure.
- frontend/src/components/panels/TrustGateCard.tsx — Renamed primary state language to Twin Trust, added Gate Decision metric, and added explainer text for trusted-twin/human-review cases.
- frontend/src/components/panels/GateEvidenceCard.tsx — New compact right-rail card showing top eLog match, similarity, risk tags, historical recommendation, and action impact.
- frontend/src/components/scene/ControlRoom3D.tsx — Added label density modes, digital-twin inspection modes, policy/diagnostics/twin overlays, proposed-device highlights, leader lines, and more nuanced beam envelope rendering.
- frontend/src/utils/trust.ts — Added twin-only trust display and decision-reason helpers; adjusted beam color logic so human-review with trusted twin is not treated as full red.
- frontend/src/styles/globals.css — Added styles for new right-rail hierarchy, Gate Evidence card, Experiment Runner summary/CTA, Trust Gate explainer, label mode controls, label hover/proposed states, and scene mode controls.
- Updates.md — Appended starting and final entries for this pass.

### Backend changes
- No backend implementation files changed in this pass.
- Existing experiment endpoints were preserved and used for validation.

### Frontend changes
- Right rail now follows demo workflow:
  1. Sticky Decision Summary
  2. Experiment Runner
  3. Trust Gate
  4. Gate Evidence
  5. Naive vs Ghost Beam
  6. Beam Profile
  7. Twin State
  8. Scenario
- Separate Next Action card is no longer rendered in the main rail; its proposed-action/CTA responsibilities now live in Experiment Runner.
- Experiment Runner now has a single primary action state: Apply Approved Action, Request Calibration, Needs Human Review, Blocked, or Evaluate First.
- Trust Gate now distinguishes Twin Trust from Gate Decision.
- Decision Summary now gives a one-line explanation such as low-risk approval, hard-limit block, calibration required, or eLog/policy review.
- Gate Evidence card makes eLog retrieval visible near the Trust Gate instead of only in the bottom carousel.

### 3D / digital twin changes
- Added label density modes: Minimal, Active, Full. Default is Active.
- Added inspection modes: Physical, Twin, Diagnostics, Policy.
- Labels now show leader lines, fade when not selected/proposed, brighten on hover, and highlight proposed-action devices.
- Beam path now has a more nuanced trust/policy envelope:
  - green core for trusted/approved paths
  - amber envelope for human review or calibration
  - red safety highlighting for blocks
  - larger halo envelope for HALO/DIFFUSE vision labels
- Twin Overlay mode shows model/trust envelope.
- Diagnostics mode emphasizes BPM/BCM/screen devices.
- Policy mode highlights proposed or blocked devices and safety annotation line.

### Commands run
- `npm run build` from `frontend/` — Passed. Existing Vite large chunk warning remains because Three/R3F are bundled.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` — Passed, 42 tests.
- `Invoke-WebRequest http://127.0.0.1:5173/` — Returned 200.
- Live API smoke commands against `http://127.0.0.1:8000`:
  - `POST /experiment/start` green_zone
  - `POST /experiment/evaluate` manual `quad_1=+0.03`
  - `POST /experiment/apply`
  - `POST /experiment/evaluate` unsafe `quad_1=+99`
  - `POST /experiment/start` drifted_twin
  - `POST /experiment/calibrate`
  - `POST /experiment/start` elog_conflict

### Validation
- Frontend build passed.
- Backend tests passed: 42 passed.
- Frontend dev server responded with HTTP 200.
- Green-zone smoke: manual `quad_1=+0.03` returned APPROVE; apply succeeded.
- Unsafe-write smoke: manual `quad_1=+99` returned BLOCK.
- Drifted-twin smoke: initial state returned REQUEST_CALIBRATION; calibration reduced OOD from 10.74 to 3.74.
- eLog-conflict smoke: returned REQUIRE_HUMAN_REVIEW; top eLog match was "Diffuse beam spot after quad_2 drift" with tags `quad_conflict, rf_phase_check, halo`.

### Known limitations
- Visual validation was not screenshot-diffed in this pass.
- 3D geometry is still procedural rather than CAD/GLB.
- Viewport zoom buttons remain mostly decorative; camera interaction is through OrbitControls and preset buttons.
- Experiment-loop animation is represented by stateful highlights/beam-envelope changes, not a full temporal animation sequence for every evaluate/apply/calibration event.
- Vite still reports a large JavaScript chunk warning from the Three/R3F bundle.

### Next recommended step
Do a browser-based visual QA pass on the right-rail density and 3D label overlap, then add event-driven pulse animations for Evaluate, Apply, and Calibration using a small frontend event state rather than increasing backend complexity.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 02:13 local time — Start guided experiment and theme/lighting pass

### Objective
Begin a pass to add Guided Experiment Mode for the Drifted Twin Test, event-driven frontend pulses, global theme controls, digital-twin lighting modes, export polish, and presentation-oriented visual QA refinements.

### Files changed
- Updates.md — Appended this starting entry before implementation.

### Backend changes
- No backend code changed in this starting entry.
- Existing `/experiment/*` endpoints will be used for guided demo steps; guided mode must remain backend-driven.

### Frontend changes
- No frontend code changed in this starting entry.
- Planned changes include guided demo controller, theme toggle, twin lighting toggle, event pulse state, and export confirmation UX.

### 3D / digital twin changes
- No 3D code changed in this starting entry.
- Planned changes include lighting modes, event pulses, and visual refinements for beamline readability.

### Theme changes
- No theme code changed in this starting entry.
- Planned global theme modes: Dark, Light, System.
- Planned twin lighting modes: Control Room, Inspection Light, Presentation.

### Commands run
- `Get-Date -Format "yyyy-MM-dd HH:mm"` — Used to timestamp this entry.

### Validation
- Not applicable yet; this is the pre-change log entry.

### Known limitations
- Guided demo does not exist yet.
- Event animations are currently state/highlight changes rather than explicit evaluate/calibrate/apply pulses.
- Global theme and twin lighting mode persistence are not implemented yet.

### Next recommended step
Add a Guided Drifted Twin Test controller that calls real experiment endpoints, then bind event pulses and theme/lighting toggles into the existing app shell and 3D scene.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 02:26 local time - Guided experiment mode, pulses, themes, and export polish

### Objective
Complete the next-stage pass for Guided Experiment Mode, event-driven visual pulses, global theme controls, digital-twin lighting controls, and clearer DecisionRecord/session export access.

### Files changed
- frontend/src/App.tsx - Added guided Drifted Twin Test orchestration, frontend event state, localStorage-backed app theme state, localStorage-backed twin lighting state, export notices, and guided demo step execution through real `/experiment/*` endpoints.
- frontend/src/components/layout/TopBar.tsx - Added theme cycling control and Run Guided Demo button.
- frontend/src/components/panels/GuidedDemoPanel.tsx - New compact guided demo controller with stepper, progress bar, previous/next, auto play, pause, reset, and exit controls.
- frontend/src/components/panels/ExperimentControlPanel.tsx - Added Guided button alongside propose/evaluate/calibrate/reset/export controls.
- frontend/src/components/panels/DecisionSummaryCard.tsx - Added event-pulse class support for apply/evaluate/block feedback.
- frontend/src/components/panels/TrustGateCard.tsx - Added evaluating pulse support.
- frontend/src/components/panels/GateEvidenceCard.tsx - Added evaluate/block pulse support so eLog evidence flashes when the gate updates.
- frontend/src/components/panels/TwinStateCard.tsx - Added calibration pulse support.
- frontend/src/components/panels/DecisionRecordDrawer.tsx - Added scenario/step/generated/decision metadata, clearer Copy JSON / Export Latest Decision / Export Full Session actions, and inline export confirmation.
- frontend/src/components/scene/ControlRoom3D.tsx - Added twin lighting modes, event-driven beam pulse marker, event highlights on selected/proposed/calibration devices, and defensive lighting fallback for stale runtime state.
- frontend/src/styles/tokens.css - Added light-theme CSS variables.
- frontend/src/styles/globals.css - Added light theme overrides, topbar layout updates, guided demo panel styles, export metadata styles, event pulse animations, responsive guided panel behavior, and scene event glow styles.
- Updates.md - Appended start and final entries for this pass.

### Backend changes
- No backend source files changed.
- Existing endpoints used by the guided demo and smoke checks:
  - `POST /experiment/start`
  - `POST /experiment/propose`
  - `POST /experiment/evaluate`
  - `POST /experiment/apply`
  - `POST /experiment/calibrate`
  - `POST /experiment/export`
  - `GET /experiment/state`
- Guided mode remains backend-driven; it does not fake decisions in the frontend.

### Frontend changes
- Added Guided Experiment Mode named "Drifted Twin Test".
- Guided steps implemented:
  1. Nominal Baseline: starts `green_zone`.
  2. Drift Appears: starts `drifted_twin`.
  3. Naive Proposal: calls `/experiment/propose` with a `quad_2` increase.
  4. Ghost Beam Evaluation: calls `/experiment/evaluate`.
  5. Calibration: calls `/experiment/calibrate`.
  6. Safer Correction: proposes and evaluates `rf_phase=-0.35`; applies only when backend returns APPROVE or APPROVE_SMALL_STEP.
  7. Export Artifact: calls `/experiment/export` and opens the DecisionRecord drawer.
- Added frontend event state: `evaluating`, `calibrating`, `applying`, `blocked`.
- Event state now drives panel glow, beam pulse, device highlighting, and calibration-screen emphasis.
- Added global theme toggle in the top bar: Dark, Light, System.
- Theme choice persists in `localStorage`.
- Added compact responsive behavior for the guided panel so it remains usable in the in-app browser's narrow preview.

### 3D / digital twin changes
- Added digital-twin lighting modes:
  - Control Room: current cinematic dark look.
  - Inspection: brighter ambient/key lighting, clearer grid and hardware.
  - Presentation: balanced readability for projector/demo use.
- Twin lighting choice persists in `localStorage`.
- Added a moving pulse sphere along the beamline during evaluate/apply/calibration/block events.
- Highlighted selected/proposed devices during event pulses.
- Calibration event highlights the diagnostic screen.
- Added fallback to Control Room lighting when runtime state is stale or localStorage contains an older invalid value.

### Theme changes
- Dark theme remains the default.
- Light theme uses an off-white scientific-dashboard palette with dark readable text, soft card surfaces, and preserved green/amber/red accents.
- System mode resolves from `prefers-color-scheme` and updates when the OS preference changes.
- The 3D scene lighting mode is independent of global app theme.

### Commands run
- `npm run build` from `frontend/` - Passed twice. Existing Vite large chunk warning remains because Three/R3F are bundled.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- `Invoke-RestMethod http://127.0.0.1:8000/health` - Returned `{"status":"ok","service":"ghost-beam"}`.
- Live API smoke sequence against `http://127.0.0.1:8000`:
  - green_zone start, manual `quad_1=+0.03`, evaluate, apply.
  - unsafe manual `quad_1=+99`, evaluate.
  - drifted_twin start, evaluate, calibrate, safer RF correction, evaluate.
  - elog_conflict start and evaluate.
  - experiment export.
- In-app browser QA via Browser Use:
  - Reloaded `http://127.0.0.1:5173/`.
  - Verified guided controller appears.
  - Stepped guided demo through Ghost Beam Evaluation.
  - Stepped to Export Artifact and verified DecisionRecord drawer with export buttons.
  - Toggled Light theme and returned preview to Dark.

### Validation
- Frontend build passed.
- Backend tests passed: 42 passed.
- Browser smoke verified Guided Experiment panel renders and calls real flows.
- API smoke results:
  - green_zone manual `quad_1=+0.03`: APPROVE; apply succeeded and step advanced to 1.
  - unsafe manual `quad_1=+99`: BLOCK due hard limit.
  - drifted_twin before calibration: REQUEST_CALIBRATION with OOD 10.74.
  - drifted_twin after calibration plus safer RF correction: APPROVE_SMALL_STEP with OOD 3.74 and trust YELLOW.
  - elog_conflict: REQUIRE_HUMAN_REVIEW with top eLog match "Diffuse beam spot after quad_2 drift".
- Browser QA caught one runtime issue: stale/undefined twin lighting state crashed the R3F scene. Fixed by adding a defensive Control Room fallback.
- DecisionRecord drawer now exposes Copy JSON, Export Latest Decision, Export Full Session, timestamp, scenario ID, step number, and decision.

### Known limitations
- Browser visual QA was performed in the narrow in-app preview, not a full 16:9 desktop screenshot diff.
- The previous-step guided action replays the selected step rather than providing a true reversible experiment timeline.
- Auto Play is intentionally simple and advances on a fixed frontend timer while each step calls backend endpoints.
- Light theme is usable but still secondary to the polished dark control-room theme.
- 3D assets remain procedural rather than CAD/GLB.
- Vite still reports a large JS chunk warning due Three/R3F bundle size.

### Next recommended step
Run a full-width visual QA pass in a desktop viewport, then add a small guided-demo transcript/export summary that packages the seven guided steps, decisions, top eLog evidence, and before/after OOD/trust metrics into one judge-ready artifact.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 07:55 local time - Start judge-ready demo hardening pass

### Objective
Begin a judge-readiness pass focused on Mission Report generation, deterministic guided demo transcript capture, Demo Health Check, Judge Demo Mode, runtime hardening, export package polish, visual QA, and judging docs.

### Files changed
- Updates.md - Appended this starting entry before implementation.

### Backend changes
- No backend code changed in this starting entry.
- Planned work should reuse existing experiment, export, and health endpoints unless a missing capability is discovered.

### Frontend changes
- No frontend code changed in this starting entry.
- Planned changes include Mission Report UI, health-check UI, Judge Demo Mode, transcript state, request hardening, and robust fallbacks.

### 3D / digital twin changes
- No 3D code changed in this starting entry.
- Planned visual QA includes presentation lighting, label density behavior in Judge Demo Mode, and screenshot capture if browser tooling permits.

### Artifact/export changes
- Planned Guided Demo Mission Report in JSON and Markdown.
- Planned improved filenames and export confirmation for judge-ready artifacts.

### Commands run
- `Get-Date -Format 'yyyy-MM-dd HH:mm'` - Used to timestamp this entry.

### Validation
- Not applicable yet; this is the pre-change log entry.

### Known limitations
- Mission report generation is not implemented yet.
- Health check is not implemented yet.
- Judge Demo Mode is not implemented yet.
- Full-width screenshot QA has not been performed in this pass yet.

### Next recommended step
Implement transcript-backed Guided Demo Mission Report generation, then wire Demo Health Check and Judge Demo Mode around the existing real backend endpoints.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 08:15 local time - Judge-ready demo hardening and artifact package

### Objective
Complete the judge-readiness pass by adding a real Guided Drifted Twin Mission Report, deterministic guided transcript capture, one-click Judge Demo Mode, Demo Health Check, runtime/3D error hardening, export package polish, browser QA screenshots, and judge-facing docs.

### Files changed
- frontend/src/App.tsx - Added guided transcript state, Mission Report generation/download/copy, Demo Health Check orchestration, Judge Demo Mode, loading guards, error banner handling, enriched session export, and safer request flows.
- frontend/src/main.tsx - Wrapped the app with a React error boundary.
- frontend/src/utils/missionReport.ts - Added GuidedDemoReport/GuidedTranscriptEntry utilities, Markdown/JSON report serialization, summary copy text, timestamped filenames, and synthetic-data disclosure text.
- frontend/src/components/panels/GuidedDemoPanel.tsx - Added transcript-backed artifact controls, Generate Mission Report, Markdown/JSON downloads, Copy Summary, Replay from Start, and Health Check trigger.
- frontend/src/components/panels/DemoHealthCheckPanel.tsx - Added pre-demo readiness checklist UI.
- frontend/src/components/layout/TopBar.tsx - Added Judge Demo Mode and Health Check controls.
- frontend/src/components/panels/ExperimentControlPanel.tsx - Added busy/disabled handling to prevent duplicate live-demo actions.
- frontend/src/components/panels/DecisionSummaryCard.tsx - Added busy-aware primary action state.
- frontend/src/components/scene/ControlRoom3D.tsx - Added Judge Demo Mode presentation defaults and busy-aware twin lighting controls.
- frontend/src/components/system/ErrorBoundary.tsx - Added recoverable React/R3F fallback boundary.
- frontend/src/components/panels/EvidenceStrip.tsx - Fixed duplicate React keys for replayed session-history/evidence cards.
- frontend/src/components/panels/NavigationPanelDrawer.tsx - Fixed duplicate row keys for repeated drawer rows.
- frontend/src/components/panels/PolicyBreakdownDrawer.tsx - Fixed duplicate reason keys.
- frontend/src/styles/globals.css - Added Judge Demo Mode, health-check, mission-report, error, loading, focus, and responsive presentation styles.
- README.md - Rewritten for judge/demo use with real-vs-simulated scope, commands, Drifted Twin Test, artifacts, and EPICS/Osprey integration path.
- docs/demo_script.md - Updated with 90-second pitch, 3-minute guided demo script, health-check step, and fallback narration.
- docs/judge_qa.md - Updated judging Q&A for Xopt/Osprey/RAG/synthetic data/Genesis/deployment questions.
- docs/api.md - Updated with experiment-runner and export endpoints.
- docs/artifact_schema.md - Added DecisionRecord, GuidedDemoReport, and session export schema notes.
- docs/screenshots/qa_01_dark_green_zone.png - Browser QA screenshot.
- docs/screenshots/qa_02_judge_mode_guided_open.png - Browser QA screenshot.
- docs/screenshots/qa_03_health_check_open.png - Browser QA screenshot.
- docs/screenshots/qa_04_health_check_state.png - Browser QA screenshot.
- docs/screenshots/qa_05_guided_report_generated.png - Browser QA screenshot.
- Updates.md - Added start and final entries for this pass.

### Backend changes
- No backend source code changed.
- Reused existing real endpoints: /health, /experiment/start, /experiment/propose, /experiment/evaluate, /experiment/apply, /experiment/calibrate, /experiment/export, and existing scenario flows.
- Verified backend behavior through pytest and live API smoke tests.

### Frontend changes
- Added Judge Demo Mode that switches to dark theme, presentation lighting, active label density, opens the guided controller, and preserves real backend state.
- Added Guided Demo transcript capture for each guided step with endpoint, decision, trust metrics, OOD score, top eLog evidence, and notes.
- Added Generate Mission Report, Markdown download, JSON download, and Copy Summary from the guided panel.
- Added Demo Health Check checklist for backend reachability, scenarios, evaluate/apply, unsafe block, calibration, eLog conflict, export, and frontend settings.
- Added request loading guards and button disabling for start/evaluate/apply/calibrate/export/guided actions.
- Added app-level error banner and 3D-scene-specific fallback with retry.
- Fixed duplicate React keys surfaced during browser QA.

### 3D / digital twin changes
- Judge Demo Mode now drives the twin toward presentation lighting and active label density for demo readability.
- ControlRoom3D is protected by a local error boundary, so a rendering failure no longer kills the whole app.
- 3D geometry remains procedural for hackathon reliability; no CAD/GLB work was attempted in this pass.

### Artifact/export changes
- Guided Mission Report can be generated as JSON and Markdown with filenames:
  - ghostbeam_drifted_twin_report_YYYYMMDD_HHMMSS.json
  - ghostbeam_drifted_twin_report_YYYYMMDD_HHMMSS.md
- Latest DecisionRecord export uses ghostbeam_<scenario>_decision_YYYYMMDD_HHMMSS.json.
- Full session export uses ghostbeam_session_YYYYMMDD_HHMMSS.json and enriches backend export data with frontend package metadata, guided transcript, optional mission report, synthetic-data disclosure, theme, and twin lighting mode.
- Report content includes before/after OOD and trust metrics, naive action, top eLog evidence, calibration event, safer action, final decision, and synthetic-data disclosure.

### Commands run
- `npm run build` from `frontend/` - Passed after TypeScript and Vite build. Vite still reports the known large Three/R3F chunk warning.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- `Invoke-RestMethod http://127.0.0.1:8000/health` through live smoke script - Returned ok.
- Live API smoke sequence against localhost:
  - start green_zone, evaluate manual quad_1=+0.03, apply approved action.
  - start green_zone, evaluate unsafe quad_1=+99.
  - start drifted_twin, evaluate, calibrate, evaluate safer rf_phase correction.
  - start elog_conflict and evaluate.
  - export session.
- In-app browser QA against `http://127.0.0.1:5173/` - Captured screenshots under docs/screenshots and verified mission report controls, health check, and guided demo visibility.
- Browser console inspection - Found old duplicate-key warnings, patched key generation, rebuilt, and verified no new console errors after the patch window.

### Validation
- Frontend build passed.
- Backend tests passed: 42 passed.
- API smoke outcomes:
  - green_zone manual `quad_1=+0.03`: APPROVE and apply succeeded.
  - unsafe manual `quad_1=+99`: BLOCK due hard PV limit.
  - drifted_twin before calibration: REQUEST_CALIBRATION with OOD 10.74.
  - drifted_twin after calibration plus safer RF correction: APPROVE_SMALL_STEP with OOD 3.74.
  - elog_conflict: REQUIRE_HUMAN_REVIEW with top eLog match "Diffuse beam spot after quad_2 drift".
  - export returned session data with history.
- Browser QA verified:
  - Judge Demo Mode button is visible and opens the guided controller.
  - Demo Health Check panel is visible and reports green checks during connected local runs.
  - Guided Mission Report generation enables Markdown/JSON/Copy controls.
  - DecisionRecord drawer remains readable.
  - No new browser console errors appeared after the duplicate-key fix.

### Known limitations
- Browser QA screenshots were captured in the in-app browser preview, not a true 1920x1080 external desktop viewport.
- Vite still warns about the large Three/R3F bundle; code splitting remains a future optimization.
- Guided Previous/Replay replays endpoint steps rather than applying a true reversible experiment timeline.
- Mission Report is generated from the frontend guided transcript plus latest backend state; backend does not yet persist a first-class mission-report object.
- 3D accelerator hardware remains procedural rather than CAD/GLB.
- Light theme is usable for presentation but the dark control-room theme is still the primary polished path.
- Health Check mutates the simulated session as part of its verification sequence, which is acceptable for the demo but should be documented before use in a real operator workflow.

### Next recommended step
Run a full-width 1920x1080 visual QA pass in an external browser, then add optional Vite code splitting for the R3F scene and a backend-persisted mission-report artifact if the hackathon schedule allows.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 08:41 local time - UX correctness, light theme parity, and twin control pass

### Objective
Fix incomplete light mode, make the 3D view controls functional, reduce 3D overlay obstruction, make Evidence View All work, clarify topbar semantics, and remove dead/toggle-broken UI interactions.

### Current known issues
- View card blocks the 3D twin.
- Light mode has dark-mode residue.
- Evidence View All is inert.
- Chips/badges/stickers can look squeezed.
- Topbar title/tagline is cramped.
- Sidebar drawer toggles only open, not close.
- Run timestamp is static.
- Mode dropdown is unclear/inert.
- Orbit/zoom/reset buttons are not fully wired.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 08:51 local time - UX correctness, light parity, evidence drawer, and camera controls complete

### Objective
Finish the UX correctness pass by reducing 3D overlay obstruction, improving light theme parity, making Evidence View All functional, clarifying the topbar, adding a real local-time clock, turning Mode into a real Scenario selector, fixing sidebar toggles, and wiring the 3D orbit/zoom/reset controls.

### Files changed
- frontend/src/App.tsx - Added resolved theme state, Evidence drawer state, Escape-to-close behavior, sidebar toggle behavior, Scenario dropdown handling, and EvidenceStrip/EvidenceDrawer wiring.
- frontend/src/components/layout/TopBar.tsx - Replaced fake Run field with a live local-time clock, replaced inert Mode with a Scenario select, and updated the product description.
- frontend/src/components/scene/ControlRoom3D.tsx - Added compact/collapsible View HUD, light/dark scene palettes, app-theme-aware scene rendering, auto-orbit toggle, zoom in/out, reset camera command, fullscreen handling, and Judge Mode HUD collapse.
- frontend/src/components/panels/EvidenceStrip.tsx - Wired View All/Close behavior into app state.
- frontend/src/components/panels/EvidenceDrawer.tsx - Added a new theme-aware Evidence drawer with event history, retrieved eLogs, latest DecisionRecord metadata, filters, search, copy JSON, and download JSON.
- frontend/src/components/panels/NavigationPanelDrawer.tsx - Added click-outside close behavior.
- frontend/src/styles/tokens.css - Added semantic variables for raised/sunken surfaces, chips, evidence cards, inputs, controls, and scene labels in both dark and light themes.
- frontend/src/styles/globals.css - Added light theme parity rules, compact View HUD styles, Evidence drawer styles, badge/chip anti-squeeze rules, topbar spacing, scenario select styles, scene light-theme integration, and camera-control active states.
- frontend/src/utils/format.ts - Replaced static `nowRunLabel` with real local datetime formatting.
- docs/screenshots/qa_evidence_drawer.png - Added browser QA screenshot for the functional Evidence drawer.
- docs/screenshots/qa_light_integrated_twin.png - Added browser QA screenshot for light-theme integration in the current in-app preview.
- Updates.md - Added start and final entries for this pass.

### Frontend changes
- The 3D View card is now collapsed by default into a compact HUD chip showing camera, label density, twin mode, and lighting mode.
- Expanded View controls still expose camera presets, label density, twin mode, and twin lighting.
- Judge Demo Mode forces the View HUD collapsed so the beamline is not blocked.
- Topbar description now says: "An agent that gates autonomous accelerator actions using twin trust and eLog memory."
- Topbar Run was renamed to Local Time and updates every second in local browser time.
- Topbar Mode was replaced with a real Scenario dropdown wired to `chooseScenario` and `/experiment/start`.
- Evidence View All opens a real drawer and toggles closed through the Evidence panel button or drawer close button.
- Sidebar items now toggle off when clicked again; Trust Gate toggles the policy drawer and Evidence toggles the Evidence drawer.
- Escape closes policy, JSON, navigation, evidence, and health overlays.

### 3D / digital twin changes
- Added app-theme-aware scene palettes for dark and light modes across Control Room, Inspection, and Presentation lighting.
- Light + Inspection/Presentation now uses lighter scene backgrounds/floor/grid values instead of looking like a leftover dark cave.
- Device labels use theme variables for label background and text.
- Camera buttons now perform real actions:
  - Reset returns to isometric/default camera.
  - Zoom in/out adjusts camera distance around the current target.
  - Orbit toggles slow auto-rotate while preserving manual controls.
  - Fullscreen requests fullscreen on the beamline card.
- Existing camera presets remain available: Iso, Top, Side, Diag, Selected.

### Theme changes
- Added semantic theme variables for `--surface-raised`, `--surface-sunken`, `--chip-bg`, `--chip-border`, `--evidence-card-bg`, `--input-bg`, `--control-bg`, `--scene-label-bg`, and `--scene-label-text`.
- Evidence cards now use light-theme evidence backgrounds instead of dark cards pasted into a light shell.
- Inputs, chips, badges, right-rail cards, drawers, and evidence rows now rely more on semantic variables.
- INFO/WARN/CRIT badges and PV/eLog chips have minimum widths, no-wrap behavior, and ellipsis protection.

### Interaction fixes
- Evidence View All is no longer inert; it opens a searchable/filterable Evidence drawer.
- Sidebar drawer behavior is now open/switch/close rather than one-way open.
- Topbar Scenario dropdown is functional and starts the selected scenario.
- Local Time is a live clock.
- 3D orbit/zoom/reset buttons are functional rather than decorative.
- The compact View HUD persists collapsed/expanded state in localStorage.

### Commands run
- `npm run build` from `frontend/` - Passed. Vite still reports the known large Three/R3F chunk warning.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- In-app browser QA against `http://127.0.0.1:5173/`:
  - Reloaded app after changes.
  - Verified Local Time, Scenario, and new product description render.
  - Opened Evidence View All drawer.
  - Toggled light theme.
  - Selected `unsafe_write` from the topbar Scenario control.
  - Verified no new console errors after final reload.
  - Captured `docs/screenshots/qa_evidence_drawer.png` and `docs/screenshots/qa_light_integrated_twin.png`.

### Validation
- Frontend build passed.
- Backend tests still pass: 42 passed.
- Browser smoke verified:
  - Evidence View All opens a real drawer.
  - Light theme is active and coherent in the in-app preview.
  - Topbar Scenario selector exists and accepts scenario selection.
  - Local Time and new product description render.
  - No new browser console errors after final CSS/build reload.

### Known limitations
- The in-app browser preview is narrow, so it hides the desktop sidebar and 3D View HUD under responsive rules; full desktop verification should still be done in an external 1440p/1080p browser window.
- Light theme parity is much improved, but final projector tuning should still be checked at full width.
- Evidence drawer click-outside close was intentionally not used for the Evidence drawer so the underlying View All/Close button remains usable; Escape and drawer close still close it.
- Vite's large Three/R3F bundle warning remains.
- The 3D scene remains procedural rather than CAD/GLB.

### Next recommended step
Run full-width external-browser QA at 1920x1080 and 1440x900, then make any last projector-specific spacing tweaks before the final demo recording.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 08:59 local time - Final visual QA and interaction semantics pass

### Objective
Polish topbar fit, shorten product description, resolve remaining light-theme artifacts, audit card/drawer spacing, and add pointer/hover semantics to clickable 3D twin elements.

### Current known issues
- Topbar description truncates awkwardly.
- Top-right controls can squeeze against viewport edge.
- Light twin/evidence surfaces need final polish.
- Clickable 3D objects do not always show pointer cursor.
- Cards/chips/drawers need final spacing audit.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 09:07 local time - Final visual QA pass completed

### Objective
Finish the pre-recording visual and interaction polish pass: make the topbar fit at demo widths, use the compact product description, improve light-theme surfaces, add 3D hover semantics, verify drawer/sidebar/scenario/camera interactions, and keep the existing experiment loop intact.

### Files changed
- `frontend/src/components/layout/TopBar.tsx` - Replaced the long product description with the compact topbar wording, added short fallback text, and marked low-priority icon buttons as collapsible secondary controls.
- `frontend/src/components/scene/ControlRoom3D.tsx` - Added shared hovered-device state, pointer cursor handling, hover highlighting for clickable procedural hardware, and pointer-enabled floating device labels.
- `frontend/src/styles/globals.css` - Tightened topbar grid/flex behavior, added responsive hiding for lower-priority toolbar buttons, polished light-theme evidence/scene surfaces, improved drawer max-height behavior, and added pointer/hover styling for clickable 3D HUD elements.
- `Updates.md` - Added start and final entries for this pass.
- `docs/screenshots/final_light_1440.png` - Captured the light-theme in-app preview after final polish.
- `docs/screenshots/final_dark_1440.png` - Captured the dark-theme in-app preview after final polish.
- `docs/screenshots/final_evidence_drawer.png` - Captured the final Evidence drawer in the in-app preview.

### Backend changes
- No backend routes, schemas, diagnostics, physics, experiment-runner behavior, or tests were changed.

### Frontend changes
- Topbar description now uses `Autonomous accelerator trust agent.` with `Accelerator trust agent.` as the narrow fallback.
- Topbar layout now prioritizes product identity, system status, local clock, scenario selector, theme selector, guided/judge/health controls, and hides lower-priority icons as width tightens.
- Icon buttons have fixed hit targets and no longer shrink against the right viewport edge.
- Evidence cards and light-theme card surfaces received final contrast, border, and shadow polish.
- Drawer panels now use safer max-height constraints and wrapped action rows to reduce clipping risk.
- Sidebar Evidence toggle was smoke-tested: click opens the drawer, click again closes it.
- Scenario dropdown was smoke-tested through the topbar and still calls the scenario-selection path.
- Local Time was smoke-tested and ticks every second without obvious layout shift.

### 3D / digital twin changes
- Clickable R3F device groups now set hovered state through `onPointerOver` and `onPointerOut`.
- Device meshes and outlines visually brighten when hovered or selected.
- Floating device labels are pointer-enabled, clickable, and share the same hover state with the corresponding 3D object.
- Body cursor is set to `pointer` while hovering 3D devices and reset on leave/unmount.
- Light-theme Inspection/Presentation scene backgrounds now use a lighter neutral gradient so the twin feels integrated with the light app shell.
- Dark + Control Room remains a dark embedded control-room viewport.
- Camera reset, zoom, and orbit controls were smoke-tested; orbit toggles between start/stop states.

### Theme changes
- Light evidence cards now use true light surfaces with subtle shadows instead of dark pasted-in cards.
- Light scene wrappers now have lighter neutral backgrounds for Inspection/Presentation lighting.
- INFO badges and evidence text remain crisp in light mode.
- Dark theme quality was preserved in a fresh screenshot and reload.

### Interaction fixes
- Evidence View All opens the Evidence drawer and Escape closes it.
- Sidebar Evidence toggles open and closed rather than sticking open.
- Scenario selector is labeled `Scenario`, accepts scenario options, and was smoke-tested with `unsafe_write` and restored to `green_zone`.
- Local Time ticker changed between readings, confirming live behavior.
- Camera buttons exist with accessible labels for reset, zoom, orbit, and fullscreen; orbit toggled to active and back.
- Browser reload after the final code state produced no fresh console errors.

### Commands run
- `Invoke-WebRequest -Uri http://127.0.0.1:5173/ -UseBasicParsing -TimeoutSec 5 | Select-Object -ExpandProperty StatusCode` from project root - Passed, returned `200`.
- `git status --short` from project root - Failed because `D:\Building\Ghost Beam` is not a git repository.
- `npm run build` from `frontend/` - Passed. Vite still reports the known large Three/R3F chunk warning.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- In-app browser QA against `http://127.0.0.1:5173/`:
  - Reloaded the app after final frontend edits.
  - Verified the compact description appears and the old long description does not.
  - Opened Evidence View All and verified the Evidence drawer content.
  - Saved Evidence drawer, light-theme, and dark-theme screenshots.
  - Verified Escape closes the Evidence drawer.
  - Smoke-tested Scenario dropdown with `unsafe_write`, then restored `green_zone`.
  - Verified Local Time ticks.
  - Smoke-tested camera reset and orbit toggle controls.
  - Verified sidebar Evidence opens and closes.
  - Reloaded and confirmed zero fresh browser console errors after the final state.

### Validation
- Frontend build passed.
- Backend tests passed: 42 passed.
- Browser smoke verified:
  - short topbar description visible
  - Evidence drawer opens/closes
  - Scenario dropdown is interactive
  - Local Time ticks
  - sidebar Evidence toggles
  - camera reset/orbit controls are interactive
  - light and dark screenshots capture the final visual state
  - no fresh console errors after reload

### Known limitations
- Full external 1440px/1600px/1920px QA was not available through the in-app browser viewport; screenshots were captured from the in-app preview and named for the requested final screenshot set.
- The right rail still scrolls internally at narrow preview widths, which is expected because it contains the full demo workflow.
- Hover cursor behavior was implemented in code and partially smoke-tested visually; exact pointer cursor style is difficult to assert from the in-app browser API without direct computed-style evaluation.
- The Vite large-bundle warning remains because Three/R3F are still bundled into the main app chunk.
- The 3D twin remains procedural rather than CAD/GLB.

### Next recommended step
Record the final demo in a true external 1440p or 1080p browser window, then make only projector-specific spacing tweaks if that recording reveals any new topbar or right-rail compression.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 09:25 local time - Platform realism and topbar hotfix pass

### Objective
Fix the topbar description overlap, strengthen Ghost Beam as a realistic autonomous-facility platform, make health checks non-mutating, persist mission reports server-side, improve artifact schemas, harden adapter boundaries, and reduce remaining demo reliability risks.

### Current known issues
- Topbar description can slip under the content card.
- Full external 1920/1440 QA is still incomplete.
- Health check mutates simulated session.
- Mission report is frontend-generated rather than backend-persisted.
- 3D assets remain procedural.
- Vite warns about large Three/R3F bundle.
- No first-class platform adapter contract surfaced in UI/docs.
- Synthetic data provenance could be more formal.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 09:37 local time - Platform realism and topbar hotfix completed

### Objective
Complete the platform-realism pass without changing real hardware boundaries: fix the topbar overlap, add a non-mutating health check, add backend-persisted mission reports, surface adapter/capability status, formalize synthetic data provenance, expose DecisionRecord schema validation, code-split the 3D scene, and document full-width visual QA.

### Files changed
- `backend/ghostbeam/api/main.py` - Registered the new platform router.
- `backend/ghostbeam/api/routes_experiment.py` - Added dry-run health check and backend mission-report endpoints.
- `backend/ghostbeam/api/routes_artifacts.py` - Added `GET /artifacts/schemas/decision-record`.
- `backend/ghostbeam/api/routes_platform.py` - Added adapter, capability, and synthetic-data manifest endpoints.
- `backend/ghostbeam/api/runtime.py` - Added isolated dry-run health check logic and DecisionRecord validation metadata in session exports.
- `backend/ghostbeam/artifacts/decision_record.py` - Added schema versioning, Pydantic schema export, and validation helper.
- `backend/ghostbeam/artifacts/mission_report.py` - Added backend Mission Report construction, Markdown rendering, local persistence, latest lookup, and report lookup by ID.
- `backend/ghostbeam/artifacts/schemas/decision_record.schema.json` - Added repository DecisionRecord JSON schema.
- `backend/data/README.md` - Documented synthetic data contents and safety boundary.
- `backend/data/synthetic_data_manifest.json` - Added formal synthetic-data provenance manifest.
- `backend/data/replays/drifted_twin_replay.json` - Added static replay artifact for the Drifted Twin Test story.
- `frontend/src/api/client.ts` - Added dry-run health, backend report, platform, manifest, and schema client functions/types.
- `frontend/src/App.tsx` - Lazy-loaded the 3D scene, wired backend dry-run health check, wired backend Mission Report generation with frontend fallback, fetched platform metadata, and passed platform/provenance data into the Settings drawer.
- `frontend/src/components/layout/TopBar.tsx` - Replaced the topbar description with the exact short phrase `Accelerator trust agent.`
- `frontend/src/components/panels/DemoHealthCheckPanel.tsx` - Added dry-run/non-mutating language.
- `frontend/src/components/panels/GuidedDemoPanel.tsx` - Allowed async report generation handlers.
- `frontend/src/components/panels/NavigationPanelDrawer.tsx` - Surfaced platform adapter, real-hardware-disabled state, EPICS stub status, synthetic eLogs, and data manifest provenance in Settings.
- `frontend/src/styles/globals.css` - Hotfixed topbar containment/line-height, added 3D lazy-loading fallback styling, and improved health-check copy spacing.
- `README.md` - Updated health check, platform, artifact, schema, provenance, and local-only safety language.
- `docs/api.md` - Documented dry-run health check, backend report, platform, manifest, and schema endpoints.
- `docs/artifact_schema.md` - Documented schema endpoint/file, backend mission reports, validation status, and synthetic data manifest.
- `docs/demo_script.md` - Updated narration for dry-run health and backend-persisted reports.
- `docs/safety_model.md` - Added platform endpoint safety notes and non-mutating health check boundary.
- `docs/visual_qa_checklist.md` - Added external full-width QA checklist and screenshot target names.
- `docs/screenshots/platform_topbar_hotfix.png` - Captured in-app smoke screenshot after the topbar hotfix.
- `backend/artifacts/reports/ghostbeam_drifted_twin_report_20260426_093605.json` - Generated backend report artifact during API smoke validation.
- `backend/artifacts/reports/ghostbeam_drifted_twin_report_20260426_093605.md` - Generated backend Markdown report artifact during API smoke validation.

### Backend changes
- Added `POST /experiment/health-check`.
  - Runs in a temporary `GhostBeamRuntime`.
  - Verifies scenarios, green-zone approve/apply, unsafe write block, drifted calibration improvement, eLog conflict human review, and export validation.
  - Returns `dry_run: true` and `mutates_active_session: false`.
- Added `POST /experiment/report/generate`.
  - Accepts guided transcript, latest DecisionRecord, session export, and frontend metadata.
  - Persists Markdown and JSON under `backend/artifacts/reports/`.
  - Returns report ID, Markdown, JSON, suggested filenames, paths, and `report_source: backend artifact`.
- Added `GET /experiment/report/latest` and `GET /experiment/report/{report_id}`.
- Added `GET /platform/adapters`.
  - Reports active `simulated` adapter and disabled `epics_stub`/future EPICS boundaries.
- Added `GET /platform/capabilities`.
  - Reports enabled Ghost Beam capabilities and `real_hardware_writes_enabled: false`.
- Added `GET /platform/data-manifest`.
- Added `GET /artifacts/schemas/decision-record`.
- Session export now includes DecisionRecord validation status and synthetic-data disclosure.

### Frontend changes
- Topbar now uses only `Accelerator trust agent.` and the title block is contained inside the 76px topbar.
- Demo Health Check now calls the backend dry-run endpoint instead of mutating the visible experiment session.
- Health check panel explicitly states that it does not alter the current experiment.
- Generate Mission Report now calls the backend report endpoint and shows report source; if the backend call fails, the existing frontend report fallback remains.
- Mission Report download buttons prefer backend-persisted Markdown/JSON when available.
- Settings drawer now doubles as the platform/about surface:
  - active adapter
  - real hardware writes disabled
  - EPICS stub only
  - synthetic eLogs active
  - synthetic data manifest/provenance
- Platform metadata fetch is non-fatal; if an already-running old backend has not been restarted, the core experiment UI still boots.

### Data/provenance changes
- Added `backend/data/synthetic_data_manifest.json` documenting generator, PV-like settings, safe signals, hidden outputs, beam profile images, synthetic eLog corpus size, scenario list, privacy disclosure, hardware disclosure, and replacement path.
- Added `backend/data/README.md`.
- Added `backend/data/replays/drifted_twin_replay.json` as a clearly labeled replay artifact, not a fake replacement for live backend evaluation.
- Docs now explicitly state that no real ALS, SLAC, Fermilab, Jefferson Lab, EPICS, camera, beamline, or facility eLog data are included.

### Build/performance changes
- Implemented safe React lazy-loading for `ControlRoom3D`.
- Main Vite app chunk dropped to roughly 304 kB.
- The 3D scene now builds as its own `ControlRoom3D-*.js` chunk around 940 kB.
- Vite still warns because the 3D scene chunk is larger than 500 kB, but the critical non-3D UI now loads separately.

### Commands run
- `npm run build` from `frontend/` - Passed.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- FastAPI TestClient smoke against the current app object:
  - `POST /experiment/start`
  - `POST /experiment/health-check`
  - `GET /experiment/state`
  - `GET /platform/adapters`
  - `GET /platform/capabilities`
  - `GET /artifacts/schemas/decision-record`
  - `POST /experiment/export`
  - `POST /experiment/report/generate`
- In-app browser smoke against `http://127.0.0.1:5173/`:
  - Verified `Accelerator trust agent.` is present.
  - Verified the previous longer description is absent.
  - Verified Scenario still appears.
  - Captured `docs/screenshots/platform_topbar_hotfix.png`.
  - Reloaded and confirmed zero fresh browser console errors.

### Validation
- Backend tests passed: 42 passed.
- Frontend build passed.
- Dry-run health check returned:
  - `summary.status: pass`
  - `dry_run: true`
  - `mutates_active_session: false`
  - active session remained `green_zone`, step `0` before and after.
- Platform smoke returned:
  - active adapter `simulated`
  - real hardware writes `false`
  - DecisionRecord schema version `0.1.0`
- Backend report smoke returned:
  - `report_source: backend artifact`
  - report ID `GBR-20260426_093605`
  - Markdown and JSON files persisted locally.
- Browser smoke verified the topbar hotfix in the live frontend.

### Known limitations
- The already-running localhost backend on port 8000 may need a restart to expose newly added routes; FastAPI TestClient validated the updated app code directly.
- Full external 1920x1080/1440x900 QA is still documented but not completed from this in-app browser environment.
- The 3D scene chunk remains over 500 kB because Three/R3F are large, although it is now lazy-loaded outside the main UI chunk.
- The replay artifact is a static JSON artifact for realism/documentation; it is not yet a separate interactive replay mode.
- 3D hardware remains procedural rather than CAD/GLB.

### Next recommended step
Restart the backend and frontend, run `docs/visual_qa_checklist.md` in a true external 1920x1080 browser window, then record the final Drifted Twin Test demo using Judge Demo Mode and the backend-persisted Mission Report.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 12:53 local time - Benchmark, evidence bundle, replay, and release hardening pass

### Objective
Add a quantitative naive-vs-Ghost-Beam benchmark, interactive replay artifact viewer, one-click evidence bundle export, local launch scripts, version/readiness metadata, and final demo docs.

### Current known issues / opportunities
- Drifted Twin Test proves one guided scenario, but does not yet quantify utility across multiple synthetic trials.
- Replay artifact exists as JSON but is not interactive.
- Mission report exists, but there is no one-click full evidence bundle.
- Local launch still requires manual backend/frontend commands.
- Backend route restart warning should be made clearer with version/readiness metadata.
- Full external QA is documented but not yet operationalized.
- No local git checkpoint exists because folder may not be a git repository.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 13:05 local time - Benchmark, evidence bundle, replay, and release hardening complete

### Objective
Add the final proof and release-hardening layer: deterministic naive-vs-Ghost-Beam benchmark metrics, interactive replay viewing, one-click evidence bundle export, local launch/smoke/reset scripts, backend readiness/version metadata, final demo docs, and a local-only git checkpoint.

### Files changed
- `backend/ghostbeam/artifacts/benchmark.py` - Added deterministic synthetic benchmark runner, persistence, latest-result loading, trial summaries, intervention summaries, and aggregate utility metrics.
- `backend/ghostbeam/artifacts/evidence_bundle.py` - Added evidence bundle builder with session export, latest DecisionRecord, mission report, benchmark, manifest, schema, adapters/capabilities, guided transcript, eLog evidence, README text, and minimal RO-Crate metadata.
- `backend/ghostbeam/api/routes_benchmark.py` - Added `/benchmark/run`, `/benchmark/latest`, and `/benchmark/{benchmark_id}`.
- `backend/ghostbeam/api/routes_experiment.py` - Added `/experiment/evidence-bundle` and `/experiment/replay/drifted-twin`.
- `backend/ghostbeam/api/routes_platform.py` - Added `/platform/version` readiness metadata and surfaced benchmark/evidence/replay capability flags.
- `backend/ghostbeam/api/main.py` - Registered benchmark routes.
- `frontend/src/api/client.ts` - Added Benchmark, Replay, PlatformVersion, and EvidenceBundle types and API helpers.
- `frontend/src/App.tsx` - Wired benchmark run/export, replay mode loading, evidence bundle export, platform version fetch, and new panels.
- `frontend/src/components/panels/BenchmarkPanel.tsx` - Added benchmark UI with run/export controls, summary metrics, and top interventions.
- `frontend/src/components/panels/ReplayPanel.tsx` - Added interactive Drifted Twin replay artifact viewer.
- `frontend/src/components/panels/DecisionRecordDrawer.tsx` - Added Export Evidence Bundle action.
- `frontend/src/components/panels/GuidedDemoPanel.tsx` - Added Benchmark, Load Replay, and Evidence Bundle actions.
- `frontend/src/components/panels/NavigationPanelDrawer.tsx` - Surfaced platform version/readiness fields in Settings.
- `frontend/src/styles/globals.css` - Added benchmark and replay panel styling.
- `scripts/start_ghostbeam.ps1` - Added local-only backend/frontend launcher for `127.0.0.1`.
- `scripts/run_smoke.ps1` - Added local API smoke script for health, dry-run health check, benchmark, bundle, and readiness endpoints.
- `scripts/reset_demo.ps1` - Added safe generated-artifact reset helper that only moves project-local artifacts to `.project-trash`.
- `scripts/README.md` - Documented launch, smoke, and reset scripts.
- `docs/final_demo_click_path.md` - Added exact final demo click sequence.
- `docs/final_pitch_90s.md` - Added 90-second pitch.
- `docs/final_pitch_3min.md` - Added 3-minute click-aligned pitch.
- `docs/final_judge_answers.md` - Added concise judge Q&A.
- `docs/final_risk_disclosure.md` - Added local-only simulated-scope disclosure.
- `docs/api.md` - Documented benchmark, replay, evidence bundle, and platform version endpoints.
- `docs/artifact_schema.md` - Documented BenchmarkResult and EvidenceBundle artifacts.
- `docs/visual_qa_checklist.md` - Added benchmark/evidence bundle checks and external screenshot targets.
- `README.md` - Updated with benchmark, evidence bundle, launch scripts, readiness, final demo docs, and safety language.
- `.gitignore` - Excluded generated reports, benchmarks, evidence bundles, caches, logs, virtualenvs, and dependency folders.

### Backend changes
- Added a deterministic benchmark subsystem using isolated `GhostBeamRuntime` instances so benchmark trials do not mutate the active UI session.
- Added benchmark persistence under `backend/artifacts/benchmarks/`.
- Added benchmark routes:
  - `POST /benchmark/run`
  - `GET /benchmark/latest`
  - `GET /benchmark/{benchmark_id}`
- Added evidence bundle route:
  - `POST /experiment/evidence-bundle`
- Added replay route:
  - `GET /experiment/replay/drifted-twin`
- Added readiness/version route:
  - `GET /platform/version`
- Evidence bundles include platform adapters/capabilities, DecisionRecord schema, synthetic data manifest, mission report, latest benchmark when available, guided transcript, eLog evidence, README text, and minimal RO-Crate metadata.
- No real hardware, EPICS writes, paid services, public tunnels, or external APIs were added.

### Frontend changes
- Added Benchmark panel with a run button, deterministic seed/trial count, metric cards, top interventions, and benchmark JSON export.
- Added Replay panel that reads the Drifted Twin replay artifact and lets the user step through the timeline without mutating the live experiment session.
- Added one-click Evidence Bundle export from the DecisionRecord drawer and Guided Demo panel.
- Added platform version/readiness details in Settings so judges can confirm backend capability state after restart.
- Added non-fatal platform-version fetch so stale/old local backends do not crash the app.

### Artifact/export changes
- Benchmark JSON now contains aggregate metrics, trial table, top interventions, synthetic-data disclosure, seed, benchmark ID, and runtime.
- Evidence Bundle JSON now acts as a judge-ready package when zip export is not needed.
- Bundle contains `README_BUNDLE.md` and `ro-crate-metadata.json` text payloads.
- Export filenames use timestamped `ghostbeam_*` names.
- Existing DecisionRecord, Mission Report, and session export flows remain intact.

### Scripts
- `scripts/start_ghostbeam.ps1` starts the backend and frontend locally on loopback only.
- `scripts/run_smoke.ps1` validates core release endpoints without public network use.
- `scripts/reset_demo.ps1` moves generated artifact folders to project-local trash without deleting source, dependencies, or unrelated files.

### Docs
- Added final click path, 90-second pitch, 3-minute pitch, judge answers, and risk disclosure.
- Updated API and artifact docs for benchmark/replay/evidence bundle/version surfaces.
- Updated README with local-only launch/smoke commands and the platform evidence story.
- Updated visual QA checklist with benchmark/evidence-bundle checks and screenshot target names.

### Commands run
- `npm run build` from `frontend/` - Passed.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- FastAPI TestClient API smoke - Passed:
  - `/health`
  - `/experiment/health-check`
  - `/benchmark/run`
  - `/benchmark/latest`
  - `/experiment/replay/drifted-twin`
  - `/platform/version`
  - `/platform/adapters`
  - `/platform/capabilities`
  - `/platform/data-manifest`
  - `/artifacts/schemas/decision-record`
  - `/experiment/report/generate`
  - `/experiment/evidence-bundle`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` - Passed.
- `git init` - Created local repository inside `D:\Building\Ghost Beam`.
- `git commit -m "checkpoint: Ghost Beam judge-ready prototype"` - Created local checkpoint commit `55a4a92`.

### Validation
- Backend tests passed: 42 passed.
- Frontend build passed.
- Smoke benchmark with 30 trials and seed 42 produced:
  - total trials: 30
  - approved: 5
  - blocked: 5
  - calibration requested: 10
  - human review required: 10
  - hard-limit violations prevented: 5
  - eLog conflicts caught: 10
  - unsafe actions prevented: 25
  - average naive projected quality: 0.645
  - average Ghost Beam projected quality: 0.702
  - average naive projected beam loss: 0.175
  - average Ghost Beam projected beam loss: 0.021
  - average OOD before calibration: 9.741
  - average OOD after calibration: 2.741
  - percent modified or blocked: 83.33
  - percent safe actions allowed: 16.67
- Replay endpoint returned the Drifted Twin replay artifact.
- Evidence bundle endpoint returned `exported: true` and included the latest benchmark.
- Platform version endpoint reports benchmark, evidence bundle, replay, report persistence, synthetic manifest, and real-hardware-write-disabled state.
- Smoke script confirmed the benchmark and evidence bundle can be generated locally.

### Known limitations
- The benchmark uses deterministic synthetic scenario/trial generation; it is a utility proof for the MVP, not a claim about real facility performance.
- Replay Mode is an artifact viewer and presentation fallback, not a true rollback/branching live experiment timeline.
- Evidence bundle currently exports as JSON with embedded Markdown/RO-Crate metadata rather than a physical zip file.
- The Three/R3F scene is lazy-loaded but the 3D chunk remains large because the graphics stack is inherently heavy.
- Full external 1920x1080/1440x900 projector QA is documented and screenshot targets exist, but the final external-window rehearsal still needs to be performed by the human/demo machine.

### Next recommended step
Restart the backend and frontend with `scripts/start_ghostbeam.ps1`, run `scripts/run_smoke.ps1`, then rehearse the final click path in `docs/final_demo_click_path.md` once end-to-end before recording or judging.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 13:26 local time - Blank screen recovery and boot hardening

### Objective
Fix localhost blank white screen, add boot-level fallback, harden localStorage, harden lazy 3D loading, improve backend-offline behavior, and make the local launch script force-refresh Vite's module graph.

### Actual root cause
Browser console showed the fatal runtime load error:
`SyntaxError: The requested module '/src/api/client.ts?t=1777210227729' does not provide an export named 'exportEvidenceBundle'`.

The production code already exported `exportEvidenceBundle` and `npm run build` passed, so the white screen was caused by a stale Vite dev/HMR module graph serving an older `client.ts` module to `App.tsx`. Because `main.tsx` statically imported `App`, that import failure happened before the top-level React ErrorBoundary could render a visible fallback. The console also contained an earlier runtime crash in `TopBar`: `TypeError: Cannot read properties of undefined (reading 'map')`, so TopBar/scenario rendering was hardened too.

### Files changed
- `frontend/src/main.tsx` - Converted `App` to a lazy-loaded boot chunk behind a top-level ErrorBoundary and Suspense fallback; added inline boot diagnostics shell with reload, clear local UI state, backend health, and API docs buttons.
- `frontend/src/App.tsx` - Added safe localStorage get/set helpers, guarded `matchMedia`, backend disconnected banner with health/docs links, and Settings clear-local-UI-state handler.
- `frontend/src/components/layout/TopBar.tsx` - Made scenario list defensive, disabled scenario select when scenarios are unavailable, and prevented `scenarios.map` from crashing.
- `frontend/src/components/panels/ScenarioPicker.tsx` - Added safe empty-state rendering for unavailable scenarios.
- `frontend/src/components/panels/NavigationPanelDrawer.tsx` - Added Settings action to clear local UI state and made simulation scenario rows defensive.
- `frontend/src/components/scene/ControlRoom3D.tsx` - Wrapped view-HUD localStorage access so stale/blocked storage cannot crash the 3D chunk.
- `frontend/src/styles/globals.css` - Added backend-offline banner and scenario empty-state styling.
- `scripts/start_ghostbeam.ps1` - Now prints Frontend MVP, Backend API, API Docs, and Health URLs, and starts Vite with `--force`.

### Frontend changes
- The full app is now booted through `React.lazy(() => import('./App'))`; App import failures now render a recovery shell instead of a white page.
- Boot fallback is inline-styled and independent of backend state, app theme, R3F, localStorage, and lazy 3D loading.
- Boot fallback shows:
  - frontend URL
  - backend health URL
  - API docs URL
  - 3D chunk status
  - local UI state status
  - last error message
  - Reload
  - Clear Local UI State
  - Open Backend Health
  - Open API Docs
- Backend-offline state now renders the normal Ghost Beam shell with a visible disconnected banner.
- Bad or blocked localStorage cannot crash theme, twin lighting, or view HUD state.
- 3D scene remains wrapped in its own ErrorBoundary and Suspense loading card, so R3F/chunk failures do not blank the rest of the UI.

### Backend changes
- None. Backend routes and engine behavior were not changed.

### Scripts changed
- `scripts/start_ghostbeam.ps1` now prints:
  - `Frontend MVP: http://127.0.0.1:5173/`
  - `Backend API:  http://127.0.0.1:8000/`
  - `API Docs:     http://127.0.0.1:8000/docs`
  - `Health:       http://127.0.0.1:8000/health`
- Frontend launch now uses `npm run dev -- --host 127.0.0.1 --port 5173 --force`.

### Commands run
- `npm run build` from `frontend/` - Passed.
- Restarted the Vite dev server on `127.0.0.1:5173` with `--force --strictPort`.
- Stopped backend temporarily to verify backend-offline rendering.
- Restarted backend on `127.0.0.1:8000` with `python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000`.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend/` - Passed, 42 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` - Passed.

### Validation
- Browser at `http://127.0.0.1:5173/` no longer shows a blank white page.
- Before dev-server force restart, the new boot fallback rendered and displayed the stale import error instead of a blank page.
- After force restart, the full Ghost Beam control room rendered live green-zone state.
- Backend-offline smoke:
  - stopped port 8000
  - reloaded frontend
  - verified Ghost Beam shell still rendered
  - verified visible disconnected banner with Health and API Docs links
- Backend-connected smoke:
  - restarted backend
  - reloaded frontend
  - verified Decision Summary `APPROVE`, green-zone scenario, Experiment Runner, Trust Gate, 3D twin labels, Evidence strip, and Local Time were visible.
- Frontend build passed.
- Backend tests passed: 42 passed.
- Smoke script passed, including health, dry-run health check, benchmark, evidence bundle, and platform version.

### Known limitations
- Browser console history still includes old stale Vite errors from before the restart; no current blank-screen failure remains.
- The 3D chunk is still large, but it is isolated behind lazy loading and a scene ErrorBoundary.
- The boot fallback cannot make a syntactically invalid `main.tsx` render; it protects App chunk failures and React/runtime failures after `main.tsx` loads.

### Next recommended step
Use `scripts/start_ghostbeam.ps1` for demo startup so Vite always force-refreshes dependencies, then run `scripts/run_smoke.ps1` before opening the app for rehearsal.
--------------------------------------------------------------------------------

--------------------------------------------------------------------------------
## Update 2026-04-26 13:36 local time - Release candidate visual fixes and recorded-data realism pass

### Objective
Fix topbar/workspace overlap, make light-mode 3D scene coherent, add recorded-data ingestion/replay path, perform full-width visual QA, and preserve the current working benchmark/evidence/guided-demo stack.

### Current known issues
- System card is pushed downward into the 3D twin/workspace border.
- Light theme shell is coherent, but 3D twin still feels dark-mode-native.
- Synthetic data is well documented, but there is not yet a recorded-run ingestion path.
- Full external 1920/1440 visual QA is still incomplete.
- Vite still warns about large Three/R3F chunk.
- 3D geometry is procedural.

### Local git checkpoint
- Working tree was clean before edits.
- Creating local branch `release-candidate-polish` for this pass.
- No remote, push, upload, public tunnel, paid service, real EPICS, or hardware access is used.

--------------------------------------------------------------------------------
## Update 2026-04-26 13:51 local time - Release candidate visual fixes and recorded-data realism complete

### Objective
Fix the topbar/workspace overlap, make the light-mode 3D scene feel integrated, add a recorded-run fixture ingestion path, update platform/artifact surfaces, and preserve the benchmark/evidence/guided-demo stack.

### Root UI fixes
- Increased the app topbar row from 76px to 84px, clamped system/control card heights, centered topbar children, and added a slightly larger workspace top gap so the System card no longer collides with the 3D twin border.
- Kept the short topbar description as `Accelerator trust agent.`.
- Added Auto twin lighting mode: dark theme resolves to Control Room; light theme resolves to Inspection unless the user chooses a manual mode.
- Light + Inspection now uses the existing light scene palette by default, with light floor/grid/backdrop integration and readable labels.

### Backend changes
- Added `/recorded-runs`, `/recorded-runs/load`, and `/recorded-runs/evaluate-step`.
- Added recorded-run parsing helpers and runtime state fields: `data_source`, `recorded_run_id`, `recorded_step`, and `recorded_manifest`.
- Added recorded-run capability metadata to `/platform/capabilities` and `/platform/version`.
- Updated evidence bundle output to include `data_source`, `recorded_run_id`, and the recorded-run manifest.

### Frontend changes
- Added recorded-run API client types/functions.
- Added Settings drawer controls for data source, loading the recorded fixture, and evaluating fixture steps.
- Updated the topbar scenario label to follow the active experiment state after a recorded fixture load.
- Updated the 3D scene to support `auto`, `control-room`, `inspection`, and `presentation` lighting modes.

### Data/provenance changes
- Added `backend/data/recorded_runs/sample_recorded_drifted_twin.csv`.
- Added `backend/data/recorded_runs/sample_recorded_drifted_twin_elogs.csv`.
- Added `backend/data/recorded_runs/sample_recorded_drifted_twin_manifest.json`.
- Added `backend/data/recorded_runs/README.md`.
- All recorded-run files are explicitly labeled as synthetic JAX-twin fixtures with no real facility data, EPICS, or hardware writes.

### Docs/scripts
- Updated `README.md`, `docs/api.md`, `docs/artifact_schema.md`, and `docs/visual_qa_checklist.md`.
- Added `scripts/capture_visual_qa.ps1`; it captures screenshots if Playwright CLI is installed and otherwise prints manual external-browser QA instructions.
- Updated `scripts/README.md`.

### Commands run
- `git status --short --branch` - confirmed branch and dirty state.
- `git branch release-candidate-polish; git checkout release-candidate-polish` - created local checkpoint branch before edits.
- `python -m pytest tests -q` from `backend` with `PYTHONPATH=D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend` - `44 passed in 21.95s`.
- `npm run build` from `frontend` - passed; Vite still warns that the lazy `ControlRoom3D` chunk is larger than 500 kB.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` - passed.
- Inline FastAPI TestClient smoke for `/recorded-runs`, `/recorded-runs/load`, `/recorded-runs/evaluate-step`, `/platform/capabilities`, and `/experiment/evidence-bundle` - all returned 200.
- `powershell -ExecutionPolicy Bypass -File .\scripts\capture_visual_qa.ps1` - completed; Playwright CLI was not installed, so the script printed manual QA instructions.
- Restarted local backend on `127.0.0.1:8000` and restarted Vite dev server on `127.0.0.1:5173 --force` for browser smoke.

### Validation
- Backend tests passed: 44 tests.
- Frontend build passed.
- Smoke script passed, including health, non-mutating health check, benchmark, evidence bundle, and version metadata.
- Recorded-run API smoke passed and evidence bundle reported `recorded_fixture` after a recorded step evaluation.
- In-app browser smoke confirmed the app renders, dark topbar no longer overlaps the workspace, light theme integrates the 3D scene, Settings can load the recorded fixture, and recorded step 3 evaluates as `REQUEST_CALIBRATION`.
- Captured in-app QA screenshots:
  - `docs/screenshots/inapp_dark_topbar_rc.png`
  - `docs/screenshots/inapp_light_recorded_fixture.png`

### Known limitations
- True external 1920x1080 and 1440x900 screenshots were not captured in this run because Playwright CLI is not installed; manual instructions are documented.
- Vite still warns about the large lazy-loaded Three/R3F chunk.
- 3D geometry remains procedural rather than CAD/GLB.
- Recorded-run ingestion is a synthetic fixture replay/evaluation path, not a live or real facility connector.

### Next recommended step
Run one final live external-browser rehearsal at 1920x1080 using `docs/visual_qa_checklist.md`, capture the named screenshots, then record the demo with Judge Demo Mode, Guided Demo, Benchmark, recorded fixture, Mission Report, and Evidence Bundle.

--------------------------------------------------------------------------------
## Update 2026-04-26 13:59 local time - Final UI stabilization and guided panel docking pass

### Objective
Dock or move the guided experiment panel so it does not block the 3D twin, fix topbar System-card alignment, remove right-rail ghost card artifacts, make the 3D twin genuinely adapt to light mode, and preserve all existing release-candidate functionality.

### Current known issues
- Guided demo card overlays the beamline.
- System card droops below the topbar row.
- Small hidden card tops appear above Decision Summary.
- Light theme still has dark-mode 3D twin behavior.
- Core backend/benchmark/artifact functionality is working and must not be disturbed.

### Safety checkpoint
- `git status --short --branch` showed the previous release-candidate recorded-run pass is still uncommitted on `master`.
- No checkpoint commit was created because the working tree is not clean and contains prior uncommitted changes that must be preserved.
- No push, remote, public tunnel, paid service, real EPICS, or hardware action is used.

--------------------------------------------------------------------------------
## Update 2026-04-26 14:05 local time - Final UI stabilization and guided panel docking complete

### Objective
Dock the guided controller away from the 3D twin, correct topbar System-card alignment, remove right-rail ghost-card bleed, harden light-mode twin appearance, and preserve all backend/artifact/demo functionality.

### Files changed
- `frontend/src/App.tsx` - moved `GuidedDemoPanel` into the right rail after Experiment Runner, added twin-lighting manual override handling, and kept light-theme Auto fallback from stale localStorage.
- `frontend/src/components/scene/ControlRoom3D.tsx` - brightened the light Inspection/Presentation scene palettes.
- `frontend/src/styles/globals.css` - adjusted app/topbar rows, standardized topbar card heights, docked guided panel styling, strengthened sticky Decision Summary backdrop, and polished light scene CSS.
- `Updates.md` - added start and final technical log entries for this pass.
- `docs/screenshots/final_ui_light_guided_docked.png` - in-app browser QA capture showing the light UI with guided mode active.

### Frontend changes
- Guided Drifted Twin Test controller is now docked inside the right rail, immediately below Experiment Runner.
- The full guided controller no longer mounts as a fixed overlay over the L1 Transfer Line.
- Topbar row increased to 88px with consistent 56px topbar card/control heights and centered alignment.
- Decision Summary sticky card now has a stronger backdrop, higher z-index, overflow clipping, and right-rail isolation so lower cards do not peek through above it.
- Existing guided controls are preserved: Previous, Next, Auto Play, Pause, Reset, Replay, Health Check, Benchmark, Load Replay, Mission Report, and Evidence Bundle.

### 3D / digital twin changes
- Auto lighting remains the default route: dark theme resolves to Control Room and light theme resolves to Inspection.
- Stale localStorage lighting values no longer force Control Room unless the user explicitly chose a twin lighting mode through the View HUD.
- Light Inspection and Presentation palettes were brightened with a lighter background/floor, clearer grid, and stronger illumination.
- Dark Control Room remains available and unchanged as the primary cinematic mode.

### Validation
- `npm run build` from `frontend` - passed. Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `python -m pytest tests -q` from `backend` with `PYTHONPATH=D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend` - `44 passed in 16.81s`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` - passed health, dry-run health check, benchmark, evidence bundle, and version checks.
- Restarted Vite dev server with `npm run dev -- --host 127.0.0.1 --port 5173 --force`.
- In-app browser smoke:
  - App loaded at `http://127.0.0.1:5173/`.
  - No fresh console errors on the active QA tab.
  - Guided demo opened without covering the beamline; it is docked in the rail.
  - Light theme rendered with a light-compatible beamline surface.
  - Decision Summary, Experiment Runner, and Evidence & eLog remained visible.

### Known limitations
- Draggable/pop-out guided behavior was not added; the accepted behavior is docked right-rail mode.
- In-app browser viewport is narrow, so true external 1440/1600/1920 visual QA still needs the documented manual screenshot pass.
- Vite still warns about the large lazy-loaded Three/R3F scene chunk.
- The prior recorded-run/backend release-candidate changes remain uncommitted in the same working tree; no remote push was performed.

### Next recommended step
Do a final external-browser rehearsal at 1440x900 and 1920x1080, capture the checklist screenshots, then record the demo using Judge Demo Mode, Guided Demo, Benchmark, Mission Report, recorded fixture, and Evidence Bundle.
--------------------------------------------------------------------------------
## Update 2026-04-26 14:15 local time - Emergency topbar rebuild and guided demo visibility fix

### Objective
Rebuild the topbar layout so all controls align in one contained row, and move Guided Experiment controls into an always-visible position inside Experiment Runner.

### Current known issues
- System card droops below the topbar row.
- Topbar/workspace boundary visually collides.
- Guided Experiment card is mounted too low or hidden in right-rail scroll.
- User cannot reliably run the guided demo without hunting for the controller.

## Update 2026-04-26 14:26 local time - Emergency topbar rebuild and guided demo visibility fix final

### Objective
Fix the two active demo blockers: the drooping System card/topbar collision and the Guided Demo controller being hidden too low in the right rail.

### Root cause
- System card droop: the topbar used three separate grid columns (`brand-lockup`, standalone `system-card`, and a hard-coded `topbar-controls` grid). Under desktop-width pressure, the standalone System card and later media/display rules could get visually out of sync with the rest of the toolbar. A later `.icon-button { display: grid }` rule also overrode the intended secondary-icon collapse, keeping too many icons visible at 1440px and squeezing the toolbar.
- Guided Demo hidden: `GuidedDemoPanel` rendered as a separate card after `ExperimentControlPanel` in the scrollable right rail. Clicking Guided activated the panel, but the full controller could be below the visible rail area, so the live demo depended on scrolling.

### Files changed
- `frontend/src/components/layout/TopBar.tsx` - rebuilt DOM structure into product block plus one topbar controls row containing System, Local Time, Scenario, Theme, and icon toolbar.
- `frontend/src/styles/globals.css` - rebuilt topbar CSS around a fixed 96px grid row, 58px control cards, flex-based toolbar, explicit workspace separation, inline guided styles, and corrected desktop icon hiding.
- `frontend/src/components/panels/ExperimentControlPanel.tsx` - added Guided Experiment Runner mode with step badge, title, one-line explanation, progress, Previous/Next, Auto Play/Pause, Reset Demo, Generate Report, Exit Guided, and collapsed manual controls.
- `frontend/src/App.tsx` - removed the lower standalone `GuidedDemoPanel` render, wired guided state into `ExperimentControlPanel`, scrolls the right rail to top when Guided is opened, and added Reset Twin Appearance plumbing.
- `frontend/src/components/scene/ControlRoom3D.tsx` - renamed the HUD control to Scene Appearance and added a Reset button to clear stale scene appearance override.
- `docs/screenshots/final_topbar_aligned.png` - 1440x900 dark screenshot showing topbar contained and aligned.
- `docs/screenshots/final_guided_inline_dark.png` - 1440x900 dark screenshot showing Guided controls inline in Experiment Runner.
- `docs/screenshots/final_guided_inline_light.png` - 1440x900 light screenshot showing Guided controls inline and the twin resolved to light inspection.
- `Updates.md` - start and final entries for this emergency pass.

### Topbar changes
- Topbar now uses `grid-template-columns: minmax(260px, 1fr) auto` with one `.topbar-product` block and one flex `.topbar-controls` row.
- `.app-shell` now uses `grid-template-rows: 96px minmax(0, 1fr)`.
- System, Local Time, Scenario, Theme, and icon controls share a 58px height family with no top margins, no transforms, and no absolute positioning.
- Workspace starts at grid row 2 with top at 96px, so the L1 Transfer Line card cannot intersect the System card.
- Secondary topbar icons now collapse reliably below 1760px; at 1440px only the core Guided/Judge/Health icons remain visible.

### Guided demo changes
- Guided controls now render directly inside `ExperimentControlPanel` as an inline Guided Experiment Runner state.
- Manual action editing remains available behind a `Show manual controls` toggle while guided mode is active.
- The separate lower `GuidedDemoPanel` card is no longer rendered in the right rail, removing the duplicate/hidden guided-card issue.
- Opening Guided from the topbar or runner sets guided mode active, scrolls the right rail to top, and runs the real backend-driven guided step sequence.

### Light twin changes
- Scene Appearance supports `Auto`, `Ctrl`, `Inspect`, and `Present`; Auto resolves to `control-room` in dark theme and `inspection` in light theme.
- Reset Twin Appearance clears the stale user-override flag and restores Auto, preventing old localStorage from forcing a dark twin in light mode.
- Browser diagnostics confirmed light guided state uses `scene-theme-light twin-lighting-inspection twin-lighting-auto`.

### Commands run
- `npm run build` from `frontend` - passed; Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'; python -m pytest tests -q` from `backend` - passed, 44 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` - passed health, dry-run health, benchmark, evidence bundle, and platform version checks.
- Restarted frontend dev server with `npm run dev -- --host 127.0.0.1 --port 5173 --force`.
- In-app browser smoke at `http://127.0.0.1:5173/` - no console errors; Guided inline state appeared; advancing to step 2 showed drifted-twin/calibration state.
- Headless Chrome CDP visual smoke at 1440x900 - saved three screenshots and confirmed System card is within topbar, above workspace, Guided is inline, no lower Guided panel is visible, and light theme resolves the twin to inspection.
- Headless Chrome geometry smoke at 1366x768, 1440x900, 1600x900, and 1920x1080 - confirmed topbar height 96px, workspace top 96px, System card within topbar, and System card above workspace.

### Validation
- System card alignment: confirmed at 1366x768, 1440x900, 1600x900, and 1920x1080 with DOM geometry checks.
- Guided visibility: confirmed at 1440x900 with Guided controls visible directly inside Experiment Runner and no visible lower `GuidedDemoPanel`.
- Guided backend behavior: clicked Next in browser; the UI advanced to Guided 2/7 and showed drift/calibration state from the live experiment flow.
- Light twin behavior: switching to Light produced `scene-theme-light twin-lighting-inspection twin-lighting-auto`, and screenshot shows a light-compatible inspection viewport.
- Dark theme: screenshot confirms dark Control Room remains intact.

### Known limitations
- Vite still warns that the lazy `ControlRoom3D` chunk is larger than 500 kB.
- The old `GuidedDemoPanel` component file remains in the codebase but is no longer rendered by default; it can be removed in a cleanup pass if no longer needed.
- Full screenshot captures were saved at 1440x900; other desktop sizes were validated with geometry checks rather than image files.

### Next recommended step
Run one final live rehearsal from a clean browser profile: open the app, click Guided, advance through all seven guided steps, generate mission report, run benchmark, export evidence bundle, and record the demo.
## Update 2026-04-26 14:38 local time - Scenario semantics, diagnosis report, and beam outcome clarity pass

### Objective
Fix user-facing DecisionRecord naming, add a human-readable Ghost Beam Diagnosis/Intervention Report, separate Scenario behavior from Guided Drifted Twin Test behavior, and make post-intervention beam visualization clearly show safe recovery rather than a beam leaving the pipe.

### Current known issues
- User-facing title says DECISIONRECORD JSON instead of Decision Record.
- JSON export exists, but human-readable diagnosis is not prominent enough.
- Selecting other scenarios may still appear to run Drifted Twin.
- Guided Demo should explicitly be Drifted Twin Test, but normal scenario selection should honor the selected scenario.
- Beam visualization can look like the beam is aligned out of the tunnel/pipe.
- The UI needs more explicit "what Ghost Beam did" timeline.

## Update 2026-04-26 14:54 local time - Scenario semantics, diagnosis report, and beam outcome clarity pass final

### Objective
Fix scenario semantics, user-facing artifact naming, human-readable diagnosis/reporting, evidence-bundle diagnosis inclusion, guided Drifted Twin Test confirmation, and beam visualization clarity without changing core backend experiment logic.

### Root causes
- DecisionRecord naming leaked into the UI because the first artifact drawer was built around internal schema names and defaulted straight to raw JSON. The drawer now separates product labels from internal TypeScript/Pydantic names.
- Scenarios appeared to route to Drifted Twin because Guided Demo and Scenario selection shared visible controls without a clear mode boundary. Guided is now explicitly labeled Drifted Twin Test and asks for confirmation before intentionally switching from another live scenario.
- Beam visualization looked ambiguous because the current trajectory line scaled offsets too aggressively and used the same visual language for current beam and projected risky action. The current beam is now clamped inside the pipe, while risky naive outcomes render as a separate translucent dashed projection.

### Files changed
- `frontend/src/utils/diagnosis.ts` - new diagnosis/timeline/Markdown utility built from live Decision Record and experiment state.
- `frontend/src/components/panels/DecisionRecordDrawer.tsx` - renamed user-facing drawer surfaces, added Diagnosis/JSON/Evidence/Export tabs, copy summary, export Diagnosis Markdown, evidence list, and "What Ghost Beam did" timeline.
- `frontend/src/components/panels/ExperimentControlPanel.tsx` - added Live Scenario vs Guided Drifted Twin Test mode status and guided scenario-switch confirmation.
- `frontend/src/components/panels/EvidenceDrawer.tsx` - changed user-facing DecisionRecord strings to Decision Record.
- `frontend/src/components/layout/TopBar.tsx` - changed Guided action accessible label/title to `Guided: Drifted Twin Test`.
- `frontend/src/App.tsx` - separated normal scenario selection from guided flow, added confirmation before Guided switches scenarios, passed diagnosis into backend mission report and evidence bundle metadata, and refreshed guided step copy.
- `frontend/src/components/scene/ControlRoom3D.tsx` - clamped current beam path inside the pipe, added dashed naive-projection overlay, and added calibration/stabilized outcome labels.
- `frontend/src/styles/globals.css` - styled diagnosis tabs, diagnosis panels, timeline rows, guided mode status/confirmation, and beam outcome labels.
- `frontend/src/utils/missionReport.ts` - added optional human diagnosis to frontend fallback mission reports and Markdown.
- `frontend/src/utils/trust.ts` - changed fallback user-facing text to Decision Record.
- `backend/ghostbeam/artifacts/mission_report.py` - persisted frontend human diagnosis in backend report payload and Markdown.
- `backend/ghostbeam/artifacts/evidence_bundle.py` - included human diagnosis and diagnosis Markdown in evidence bundles and bundle README.
- `README.md` - updated artifact/demo wording to Decision Record + Diagnosis.
- `docs/artifact_schema.md` - documented the Ghost Beam Diagnosis artifact and timeline fields.
- `docs/final_demo_click_path.md` - added Diagnosis tab/timeline and Guided Drifted Twin Test switch language.
- `docs/final_judge_answers.md` - added answers explaining that Ghost Beam gates rather than merely stops actions and why Guided Demo uses Drifted Twin.
- `docs/demo_script.md`, `docs/final_pitch_3min.md`, `docs/final_pitch_90s.md` - refreshed demo/pitch language around Diagnosis and Decision Record.
- `Updates.md` - start and final entries for this pass.

### Frontend changes
- The Decision Record drawer now opens to a human-readable `Ghost Beam Diagnosis` view with:
  - What happened
  - Why Ghost Beam intervened
  - Evidence used
  - Decision
  - Action taken
  - Outcome
  - Next recommended step
  - Copy Diagnosis Summary
  - Export Diagnosis Markdown
- The drawer keeps machine-readable JSON available under a `JSON` tab and moves the intervention timeline into the `Evidence` tab.
- Evidence drawer labels now say `Decision Record`, not raw `DecisionRecord`.
- Experiment Runner now shows `Mode: Live Scenario` and current scenario during ordinary operation.
- When guided mode is active, Experiment Runner shows `Mode: Guided Drifted Twin Test`, current step, progress, and controls.
- Clicking Guided from any non-`drifted_twin` scenario now displays: `Guided Demo will switch to Drifted Twin Test.` with Start Guided Demo / Cancel buttons.
- Normal Scenario dropdown and Scenario panel selection now clear guided mode by default and load the selected scenario directly.

### Backend changes
- Backend Mission Report generation accepts and persists frontend-provided `human_diagnosis`.
- Backend Mission Report Markdown now includes `## Ghost Beam Diagnosis` and `### What Ghost Beam Did`.
- Evidence Bundle now includes:
  - `human_diagnosis`
  - `human_diagnosis_markdown`
  - `human_diagnosis.md` in RO-Crate-style metadata
  - diagnosis summary in `README_BUNDLE.md`
- No core policy/physics/experiment endpoint behavior was changed.

### Artifact/export changes
- Decision Record drawer can export `ghostbeam_<scenario>_diagnosis_YYYYMMDD_HHMMSS.md`.
- Evidence Bundle export includes the human-readable diagnosis when generated from the UI.
- Mission Report backend payload and Markdown include the diagnosis/timeline when generated from the UI.
- Frontend fallback mission report Markdown also includes a Ghost Beam Diagnosis and What Ghost Beam Did section when diagnosis is available.

### 3D / beam visualization changes
- Current beam trajectory now stays inside the visible beam pipe by clamping the main core path.
- Risk is represented by halo/envelope, amber/red policy coloring, diagnostic labels, and target-device/interlock emphasis rather than showing the main current beam leaving the pipe.
- Naive risky outcome is a separate dashed translucent overlay labeled `Naive projected path`.
- `REQUEST_CALIBRATION` shows `Calibration required before write`.
- Post-calibration approved states show `Post-intervention stabilized`.
- Dark/light scene behavior and existing camera controls were preserved.

### Commands run
- `npm run build` from `frontend` - passed. Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"; python -m pytest tests -q` from `backend` - passed, 44 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` from repo root - passed health, dry-run health, benchmark, evidence bundle, and platform version checks.
- Inline FastAPI TestClient scenario sweep - passed expected scenario decisions listed below.
- In-app browser smoke at `http://127.0.0.1:5173/` - app rendered, Guided confirmation appeared in Experiment Runner, Guided started inline, Decision Record drawer showed Diagnosis copy/export, and Evidence tab showed the intervention timeline.

### Validation
- `green_zone` evaluate with safe `quad_1 +0.03` - `APPROVE`, OOD `0.2136`.
- `unsafe_write` evaluate with `quad_1 +99` - `BLOCK`, hard-limit reason `hard limit violation for quad_1`.
- `drifted_twin` evaluate - `REQUEST_CALIBRATION`, OOD `10.7364`.
- `elog_conflict` evaluate - `REQUIRE_HUMAN_REVIEW`, top eLog `Diffuse beam spot after quad_2 drift`.
- `calibration_recovery` before calibration - `REQUEST_CALIBRATION`, OOD `8.7456`.
- `calibration_recovery` after calibration - `APPROVE`, OOD `1.7456`.
- Guided Demo browser smoke - non-drifted scenario prompted before switching, then Guided Drifted Twin Test controls were visible inline and called the live backend flow.
- Decision Record drawer browser smoke - Diagnosis tab, Copy Diagnosis Summary, Export Diagnosis Markdown, Evidence tab, and What Ghost Beam Did timeline were visible.

### Known limitations
- Vite still warns that the lazy-loaded `ControlRoom3D` chunk is larger than 500 kB.
- The older `GuidedDemoPanel` component still exists but remains unrendered by default after the inline Experiment Runner migration.
- Internal code and API docs still use `DecisionRecord` as a schema/type name where appropriate; user-facing UI labels now use `Decision Record`.
- Browser smoke was targeted rather than a full visual recording pass.

### Next recommended step
Run the final live rehearsal and recording: Green Zone, Unsafe Write, eLog Conflict, Drifted Twin, Guided Drifted Twin Test, Diagnosis tab, Mission Report, Benchmark, and Evidence Bundle.
## Update 2026-04-26 15:11 local time - Final scenario routing and public data adapter pass

### Objective
Fix scenario selection/routing, clean scenario UI layout, add a BOOSTR-compatible public accelerator dataset import path, and clarify Live Scenario vs Guided Drifted Twin vs Recorded Fixture vs Public Data modes.

### Current known issues
- Scenario selection appears to keep running Drifted Twin behavior.
- Scenario buttons/keys are visually messy in the bottom-right UI.
- Guided Demo is fixed to Drifted Twin but not visually distinct enough from normal scenario execution.
- Public accelerator data ingestion is not yet surfaced.
- Existing synthetic JAX twin, benchmark, and evidence bundle must remain intact.

## Update 2026-04-26 15:37 local time - Final scenario routing and public data adapter pass complete

### Objective
Final scenario routing fix and public data adapter.

### Root causes
- Scenario state was not represented as a first-class UI mode, so guided, recorded, and live scenario states could visually blur together even when backend calls were correct.
- Judge Demo Mode was too eager about opening guided presentation state, which made it easier for normal scenario selection to look like the Drifted Twin story was still in charge.
- The right-rail scenario card reused the `.scenario-card` class that also styled the compact topbar scenario control, causing bottom-right scenario controls to inherit unsuitable sizing and look squeezed/overlapped.
- Public data credibility was not surfaced because the platform only exposed synthetic-live and recorded-fixture paths.

### Files changed
- `backend/data/public_datasets/boostr_manifest.json`
- `backend/data/public_datasets/README.md`
- `backend/data/public_datasets/boostr/.gitkeep`
- `backend/scripts/create_boostr_shaped_sample.py`
- `backend/ghostbeam/api/routes_public_data.py`
- `backend/ghostbeam/api/main.py`
- `backend/ghostbeam/api/routes_platform.py`
- `backend/ghostbeam/artifacts/evidence_bundle.py`
- `backend/tests/test_public_data_api.py`
- `frontend/src/api/client.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/panels/ExperimentControlPanel.tsx`
- `frontend/src/components/panels/NavigationPanelDrawer.tsx`
- `frontend/src/components/panels/ScenarioPicker.tsx`
- `frontend/src/styles/globals.css`
- `README.md`
- `docs/api.md`
- `docs/artifact_schema.md`
- `docs/final_demo_click_path.md`
- `docs/final_judge_answers.md`
- `docs/visual_qa_checklist.md`
- `scripts/README.md`
- `scripts/run_smoke.ps1`
- `Updates.md`

### Backend changes
- Added `GET /public-data/sources`.
- Added `POST /public-data/boostr/import-local`.
- Added `POST /public-data/boostr/evaluate-window`.
- BOOSTR import is path-restricted to `backend/data/public_datasets/boostr/`.
- Public BOOSTR mode is read-only and returns analysis/review/flag artifacts only; it never enables hardware writes.
- `/platform/adapters`, `/platform/capabilities`, and `/platform/version` now surface the BOOSTR public data adapter.
- Evidence Bundle now includes public dataset manifest/status and latest public-data analysis artifact when available.

### Frontend changes
- Added explicit workspace mode state for `Live Scenario`, `Guided Drifted Twin Test`, `Recorded Fixture`, and `Public Data`.
- Normal scenario selection now exits guided/replay state, clears guided confirmation state, and starts the selected local scenario directly.
- Guided mode remains explicitly labeled as `Guided Drifted Twin Test` and prompts before switching away from a non-drifted live scenario.
- Recorded fixture loading sets `Recorded Fixture` mode.
- Public BOOSTR import/evaluation sets `Public Data` mode only when a local slice is actually imported or analyzed.
- Scenario panel was rebuilt as a compact `scenario-panel` with current mode, current scenario, clean active state, and non-overlapping buttons.
- Settings/Platform drawer now includes a `Public Dataset: BOOSTR` panel with DOI, license, install status, local import/evaluate actions, and read-only disclosure.

### Data/provenance changes
- Added a BOOSTR public dataset manifest with DOI `10.5281/zenodo.4382663`, license `CC BY 4.0`, expected local file formats, mapped capabilities, and safety disclosure.
- Added public dataset README explaining that Ghost Beam does not bundle or auto-download the full BOOSTR dataset.
- Added an optional BOOSTR-shaped synthetic sample generator for importer UI testing, clearly labeled as not actual BOOSTR data.
- Updated README, API docs, artifact schema, judge answers, and visual QA checklist for the public-data mode.

### Validation
- `green_zone` safe trim -> `APPROVE`, OOD `0.2136`.
- `unsafe_write` hard-limit action -> `BLOCK`, OOD `2.8052`.
- `drifted_twin` naive quad correction -> `REQUEST_CALIBRATION`, OOD `10.7364`.
- `elog_conflict` quad increase -> `REQUIRE_HUMAN_REVIEW`, top eLog `Operator warning on quad_2 increase`.
- `calibration_recovery` before calibration -> `REQUEST_CALIBRATION`, OOD `8.7456`.
- `calibration_recovery` after calibration -> OOD improved to `1.7456`; policy still required human review for the tested action, preserving evidence-based gating.
- `/public-data/sources`, `/platform/capabilities`, `/platform/version`, and `/experiment/evidence-bundle` returned 200.
- Missing default BOOSTR local slice returned a controlled 404 and did not crash the UI or API.
- In-app browser smoke loaded `http://127.0.0.1:5173/` with no console errors, selected `unsafe_write`, evaluated `BLOCK`, and showed the guided Drifted Twin confirmation before switching modes.

### Commands run
- `npm run build` from `frontend` - passed. Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"; python -m pytest tests -q` from `backend` - passed, 46 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` from repo root - passed health, dry-run health, benchmark, evidence bundle, platform version, and public data source checks.
- Inline FastAPI TestClient API/scenario sweep - passed the route and scenario checks listed above.
- In-app browser smoke through Browser plugin - passed app load, console-error check, `unsafe_write` live scenario evaluation, and guided confirmation visibility.

### Known limitations
- No actual BOOSTR data slice is bundled, downloaded, or required; users must place a local slice under `backend/data/public_datasets/boostr/`.
- The optional shaped sample generator creates BOOSTR-shaped synthetic data for UI/importer testing only, not real public data.
- Public-data evaluation is a lightweight window analysis adapter, not a retrained BOOSTR virtual diagnostic.
- Vite still warns that the lazy-loaded `ControlRoom3D` chunk is larger than 500 kB.
- Browser smoke was targeted in the in-app browser; full external 1920/1440 manual QA remains documented in `docs/visual_qa_checklist.md`.

### Next recommended step
Run the final live rehearsal and screen recording: select each Live Scenario, show Guided Drifted Twin Test as a separate mode, show Settings -> Public Dataset: BOOSTR, then export Mission Report, Benchmark, and Evidence Bundle.

## Update 2026-04-26 15:54 local time - Federated data-source registry and final bug sweep

### Objective
Add a non-invasive federated data-source registry for public accelerator datasets, facility connector stubs, artifact standards, validation standards, and optional materials context while preserving the stable Ghost Beam core demo.

### Current known risks
- External data must not hijack the working synthetic JAX demo.
- Guided Demo must remain opt-in, not default.
- Public data adapters must be read-only/local-import only.
- BOOSTR support exists but should be organized in a larger source registry.
- Scenario routing must remain correct for all scenarios.
- UI must not regress after recent topbar/guided fixes.

### Checkpoint status
- Local checkpoint commit was skipped because the working tree already contains many modified and untracked release-candidate files from prior passes; creating a partial `git commit -am` would omit untracked files and risk a misleading checkpoint.

## Update 2026-04-26 16:07 local time - Federated data-source registry and final bug sweep complete

### Objective
Federated public data source registry and final bug sweep.

### Files changed
- `backend/ghostbeam/data_sources.py`
- `backend/ghostbeam/api/routes_data_sources.py`
- `backend/ghostbeam/api/main.py`
- `backend/ghostbeam/api/routes_platform.py`
- `backend/ghostbeam/api/routes_public_data.py`
- `backend/ghostbeam/artifacts/evidence_bundle.py`
- `backend/ghostbeam/adapters/epics_archiver_stub.py`
- `backend/data/public_datasets/boostr/.gitkeep`
- `backend/data/public_datasets/README.md`
- `backend/data/public_datasets/fermilab_bpm_ipm/.gitkeep`
- `backend/data/public_datasets/fermilab_bpm_ipm_README.md`
- `backend/data/public_datasets/fermilab_bpm_ipm_manifest.json`
- `backend/data/public_datasets/materials_project_context_manifest.json`
- `backend/data/standards/openpmd_compatibility_manifest.json`
- `backend/data/standards/workflowhub_compatibility_manifest.json`
- `backend/tests/test_public_data_api.py`
- `frontend/src/api/client.ts`
- `frontend/src/App.tsx`
- `frontend/src/components/panels/DecisionSummaryCard.tsx`
- `frontend/src/components/panels/ExperimentControlPanel.tsx`
- `frontend/src/components/panels/NavigationPanelDrawer.tsx`
- `frontend/src/styles/globals.css`
- `README.md`
- `docs/api.md`
- `docs/artifact_schema.md`
- `docs/connectors_epics_archiver.md`
- `docs/final_demo_click_path.md`
- `docs/final_judge_answers.md`
- `docs/final_risk_disclosure.md`
- `docs/visual_qa_checklist.md`
- `scripts/README.md`
- `scripts/run_smoke.ps1`
- `Updates.md`

### Backend changes
- Added `GET /data-sources`.
- Added `GET /data-sources/summary`.
- Added a central `ghostbeam.data_sources` registry covering core demo sources, public datasets, facility connector stubs, artifact standards, validation standards, and future extensions.
- Added manifest-ready Fermilab BPM/IPM diagnostics source with DOI `10.5281/zenodo.17429707`.
- Added manifest-only Materials Project future context source, explicitly inactive for accelerator control.
- Added openPMD and WorkflowHub compatibility manifests.
- Added disabled `EPICSArchiverReadOnlyStub` with `get_pv_window`, `get_pv_at_time`, and `status`; it performs no network calls and allows no writes.
- Updated platform adapters/capabilities/version metadata to expose data-source registry, public data adapters, EPICS Archiver stub, pyarchappl-compatible stub, standards manifests, and safety flags.
- Hardened BOOSTR public-data analysis vocabulary to `WINDOW_OK`, `ANALYZE`, `FLAG_FOR_REVIEW`, `IMPORT_ERROR`, and `NO_LOCAL_SLICE`.
- Missing BOOSTR local slice now returns controlled optional status instead of an exception path.
- Evidence Bundle now includes `data_sources_registry`, `data_sources_summary`, BOOSTR/Fermilab BPM-IPM manifests, Frictionless validation status, openPMD manifest, and WorkflowHub manifest.

### Frontend changes
- Added Data Sources & Provenance section in the Settings/Platform drawer.
- UI groups sources into Active Demo Sources, Public Dataset Adapters, Facility Connector Stubs, Artifact & Validation Standards, and Future Genesis Extensions.
- Public Data mode remains separate from Live Scenario mode and does not make external data mandatory.
- Public Data mode disables live Apply/evaluate/propose/calibrate controls and displays a read-only notice.
- Settings still includes the detailed Public Dataset: BOOSTR panel with DOI/license/status and local-slice import/evaluate actions.

### Data/provenance changes
- BOOSTR remains adapter-ready and local-slice only; no actual BOOSTR data are bundled.
- Fermilab BPM/IPM is manifest-ready only; no files are bundled.
- EPICS Archiver and pyarchappl-compatible retrieval are disabled stubs only.
- openPMD and WorkflowHub are compatibility manifests only.
- Materials Project is a future Genesis context manifest only and is not active in the accelerator-control loop.
- Frictionless validation status is reported without adding a hard dependency.

### Safety checks
- No real hardware connection was added.
- No EPICS or Archiver network calls are made.
- No real EPICS writes are possible.
- No public dataset is downloaded automatically.
- No external API calls or uploads are required at runtime.
- Public-data artifacts explicitly set writes disabled / no hardware write permitted.

### Commands run
- `npm run build` from `frontend` - passed. Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"; python -m pytest tests -q` from `backend` - passed, 48 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` from repo root - passed health, dry-run health, benchmark, evidence bundle, platform version, public-data source status, data-source registry, data-source summary, and missing BOOSTR slice checks.
- Inline FastAPI TestClient sweep - passed `/data-sources`, `/data-sources/summary`, `/public-data/sources`, `/platform/capabilities`, `/platform/version`, `/experiment/evidence-bundle`, missing BOOSTR local slice, and all scenario checks.
- In-app browser smoke at `http://127.0.0.1:5173/` - app loaded with no console errors, defaulted to `Live Scenario` / `green_zone`, selected `unsafe_write`, evaluated `BLOCK`, and showed Guided Drifted Twin confirmation before switching modes.

### Validation
- `/data-sources` returned all required IDs: `synthetic_jax_twin`, `synthetic_recorded_fixture`, `boostr`, `fermilab_bpm_ipm`, `epics_archiver_stub`, `pyarchappl_compatible`, `openpmd`, `frictionless`, `ro_crate`, `workflowhub`, and `materials_project`.
- `/data-sources/summary` confirmed no real hardware, no runtime downloads, no external runtime calls, and Evidence Bundle registry inclusion.
- Evidence Bundle included data-source registry, BOOSTR manifest, Fermilab BPM/IPM manifest, Frictionless validation status, openPMD manifest, and WorkflowHub manifest.
- `green_zone` safe trim -> `APPROVE`, OOD `0.2136`.
- `unsafe_write` hard-limit action -> `BLOCK`, OOD `2.8052`.
- `drifted_twin` naive quad correction -> `REQUEST_CALIBRATION`, OOD `10.7364`.
- `elog_conflict` quad increase -> `REQUIRE_HUMAN_REVIEW`, top eLog `Operator warning on quad_2 increase`.
- `calibration_recovery` before calibration -> `REQUEST_CALIBRATION`, OOD `8.7456`.
- `calibration_recovery` after calibration -> OOD improved to `1.7456`; policy still required human review for the tested action, preserving evidence-based gating.

### Known limitations
- No full public dataset is bundled; BOOSTR and Fermilab BPM/IPM require local slices for real data analysis.
- Public-data evaluation is a lightweight read-only window analysis adapter, not a retrained public-data virtual diagnostic.
- Frictionless validation is reported as installed/not-installed status; no heavyweight validation dependency was added.
- Materials Project is only a future context manifest and is not used by the live accelerator-control demo.
- The in-app browser viewport is narrow, so Settings/Data Sources visual confirmation was primarily API/build verified; the full external desktop QA checklist remains in `docs/visual_qa_checklist.md`.
- Vite still warns that the lazy-loaded `ControlRoom3D` chunk is larger than 500 kB.

### Next recommended step
Final rehearsal and GitHub/demo packaging: record the demo path, export an Evidence Bundle, and make a clean local commit that intentionally includes all release-candidate files.

## Update 2026-04-26 16:18 local time — Final packaging and README asset inventory pass

### Objective
Generate a complete source-of-truth packet for README, GitHub, visuals, demo script, architecture explanation, screenshots, artifacts, data-source documentation, and final push checklist.

### Scope
Documentation/inventory only. No core backend/frontend behavior changes unless a blocking issue is discovered.

### Current project state
Ghost Beam is feature-complete for the hackathon demo: the synthetic JAX twin, virtual diagnostic, uncertainty/OOD gating, synthetic eLog retrieval, deterministic policy gate, guided Drifted Twin Test, benchmark, mission report, evidence bundle, recorded-run fixture, public BOOSTR adapter path, federated data-source registry, platform/version/adapters/capabilities endpoints, Decision Record schema, human-readable diagnosis, local launch/smoke scripts, dark/light UI, and 3D twin are in place. The previous pass validated frontend build, backend tests, smoke script, API sweeps, scenario routing, and the data-source registry. Known limitations remain: public datasets are not bundled, BOOSTR/BPM-IPM require local slices, external connectors are read-only stubs/manifests, the in-app browser is narrow for full-width visual QA, and the lazy Three/R3F scene chunk still triggers a Vite size warning.

## Update 2026-04-26 16:29 local time — Final README and demo asset inventory generated

### Objective
Generate source-of-truth packaging files for README, visuals, architecture diagrams, demo script, GitHub release, artifacts, and copy safety audit.

### Files created
- `README_DRAFT_INPUTS.md`
- `VISUAL_ASSET_INVENTORY.md`
- `docs/architecture_diagram_source.md`
- `DEMO_ASSET_PACKET.md`
- `GITHUB_RELEASE_CHECKLIST.md`
- `README_FINAL_OUTLINE.md`
- `docs/copy_safety_audit.md`
- `packaging/artifacts/ARTIFACTS_INDEX.md`
- `packaging/artifacts/latest_drifted_twin_evaluation.json`
- `packaging/artifacts/latest_session_export.json`
- `packaging/artifacts/latest_decision_record.json`
- `packaging/artifacts/latest_benchmark.json`
- `packaging/artifacts/latest_mission_report.json`
- `packaging/artifacts/latest_mission_report.md`
- `packaging/artifacts/latest_evidence_bundle_response.json`
- `packaging/artifacts/data_sources_registry.json`
- `packaging/artifacts/data_sources_summary.json`
- `packaging/artifacts/public_data_sources.json`
- `packaging/artifacts/platform_version.json`
- `packaging/artifacts/platform_capabilities.json`
- `packaging/artifacts/decision_record_schema.json`
- `packaging/artifacts/dry_run_health_check.json`

### Validation
- `$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"; python -m pytest tests -q` from `backend` - passed, `48 passed in 15.97s`.
- `npm run build` from `frontend` - passed. Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` from repo root - passed health, dry-run health, benchmark, evidence bundle, version, public data, data-source registry, data-source summary, and missing BOOSTR slice checks.
- Direct API packaging check - passed `GET /data-sources`, `GET /data-sources/summary`, `POST /benchmark/run`, and `POST /experiment/evidence-bundle`.
- In-app browser smoke - `http://127.0.0.1:5173/` loaded with title `Ghost Beam`, product description visible, Live Scenario present, Guided control available, and zero captured console errors.
- Local endpoint checks - `http://127.0.0.1:8000/health` returned ok status and `http://127.0.0.1:8000/docs` loaded as `Ghost Beam - Swagger UI`.

### Artifacts generated
- Benchmark artifact `GB-BENCH-20260426_162318` saved to `packaging/artifacts/latest_benchmark.json`.
- Benchmark metrics: 50 trials, seed 42, 9 approved, 9 blocked, 16 calibration requests, 16 human-review escalations, 41 unsafe actions prevented, 82.0% actions modified or blocked, projected beam loss reduced from `0.18742102831602098` to `0.020589309558272362`.
- Mission Report artifact `GBR-20260426_162318` saved to JSON and Markdown under `packaging/artifacts/`.
- Evidence Bundle response `GB-BUNDLE-20260426_162318` saved to `packaging/artifacts/latest_evidence_bundle_response.json`.
- Latest Drifted Twin evaluation, session export, latest Decision Record, data-source registry, platform metadata, schema, and health-check snapshots saved under `packaging/artifacts/`.

### Visual assets inventoried
Inventoried existing screenshots in `docs/screenshots/`, including `final_guided_inline_dark.png`, `final_guided_inline_light.png`, `final_topbar_aligned.png`, `final_evidence_drawer.png`, `final_dark_1440.png`, `final_light_1440.png`, `inapp_light_recorded_fixture.png`, and narrow QA captures. `VISUAL_ASSET_INVENTORY.md` recommends README hero usage, appendix usage, target missing captures, and manual screenshot instructions for 1440x900 and 1920x1080.

### Copy safety audit
Created `docs/copy_safety_audit.md`. No false claims were found for real ALS data, live hardware enabled, EPICS writes enabled, BOOSTR auto-downloads, public tunnels, paid APIs, or background async work. Internal `DecisionRecord` references remain in code/API/schema docs where appropriate; product-facing final README should use `Decision Record`. Existing `README.md` still has an older `42 passed` test expectation line, but the generated source packet records the current `48 passed` validation.

### Known limitations
- This pass generated documentation/source packets and artifacts only; it did not overwrite the existing `README.md`.
- Full external projector-width screenshots should still be captured manually for the final GitHub README/presentation.
- In-app browser QA is narrower than true desktop, though existing 1440 screenshots are present.
- Public datasets are not bundled; BOOSTR and Fermilab BPM/IPM remain local-slice only.
- The lazy Three/R3F scene chunk still triggers the known Vite chunk-size warning.

### Next recommended step
Human should paste `README_DRAFT_INPUTS.md`, `VISUAL_ASSET_INVENTORY.md`, `DEMO_ASSET_PACKET.md`, `README_FINAL_OUTLINE.md`, and `GITHUB_RELEASE_CHECKLIST.md` into ChatGPT to generate the final README, presentation visuals, and push checklist, then capture final full-width screenshots before committing/releasing.

## Update 2026-04-26 16:46 local time — Final GitHub README, legal, and visual packaging pass

### Objective
Finalize the GitHub README, strict proprietary/all-rights-reserved legal files, visual/GIF capture plans, GitHub push preparation commands, and copy safety audit while preserving the working Ghost Beam app.

### Scope
Documentation, legal, visual packaging, and release-prep only. No backend experiment logic, frontend interaction logic, hardware adapters, public dataset downloads, external services, pushes, remotes, or application features will be changed.

### Current state
The repository is already in a dirty release-candidate state with prior backend/frontend/docs changes and untracked generated assets. Current branch is `master`. `git remote -v` returned no configured remotes in the local checkout, so GitHub push commands will be prepared for manual review rather than executed. The previous packaging pass validated backend tests, frontend build, smoke script, API checks, artifact generation, and browser smoke.

## Update 2026-04-26 16:51 local time — Final README, legal, and GitHub packaging complete

### Objective
Finalize README, legal ownership files, visual plan, GIF plan, GitHub push prep, and copy safety audit.

### Files created/changed
- Rewrote `README.md`.
- Created `LICENSE`.
- Created `COPYRIGHT.md`.
- Created `NOTICE.md`.
- Created `CONTRIBUTING.md`.
- Created `docs/legal_notice.md`.
- Created `docs/gifs/README.md`.
- Created `docs/readme_visual_plan.md`.
- Created `GITHUB_PUSH_COMMANDS.md`.
- Updated `GITHUB_RELEASE_CHECKLIST.md`.
- Updated `docs/copy_safety_audit.md`.
- Updated `Updates.md`.
- Staged README/legal/visual/push-prep docs, source packet files, referenced screenshots, and generated `packaging/artifacts/` files for manual review. No commit or push was run.

### README changes
- README now opens with the Genesis Mission / digital-twin / ALS-U virtual diagnostic story and positions Ghost Beam as the trust-and-memory gate for stale or uncertain twin actions.
- Added prominent proprietary notice near the top: "Proprietary demo. All rights reserved. No license is granted."
- Added existing screenshots only: `final_guided_inline_dark.png`, `final_guided_inline_light.png`, `final_evidence_drawer.png`, `inapp_light_recorded_fixture.png`, and `final_topbar_aligned.png`.
- Added Mermaid diagrams for system architecture, decision flow, core vs external data architecture, and Evidence Bundle composition.
- Added sections for the problem, action gating decision vocabulary, Drifted Twin Test, features, screenshots/GIFs, data sources, real vs simulated, benchmark, evidence artifacts, quickstart, demo flow, API surface, repo structure, safety/scope, public data/standards compatibility, known limitations, future work, copyright/use restrictions, and safety/affiliation disclaimer.
- Benchmark table uses the latest packaging metrics: 50 trials, 9 approved, 9 blocked, 16 calibration requests, 16 human-review escalations, 41 unsafe actions prevented, average projected beam loss reduced from `0.1874` to `0.0206`, and `82.0%` actions modified or blocked.

### Legal changes
- Added strict all-rights-reserved `LICENSE` with no license granted, no patent/trademark license, no Ghost Beam branding rights, no AI/ML training/scraping/dataset/distillation/embedding-index generation, no safety-critical use, no warranty, and no affiliation/endorsement claims.
- Added `COPYRIGHT.md` listing owned assets: code, UI/UX, architecture, concept, screenshots, docs, artifacts, diagrams, demo, generated synthetic data design, README text, and Ghost Beam name/branding.
- Added `NOTICE.md` for independent prototype, third-party descriptive references, synthetic data, no real facility data, no live EPICS, no hardware writes, and no safety-critical use.
- Added `CONTRIBUTING.md` stating external contributions are not accepted unless a separate written contributor agreement is executed with Ziauddin Sherkar.
- Added `docs/legal_notice.md` as a plain-language proprietary/no-use/no-safety-critical-use summary.

### Visual changes
- Added `docs/gifs/README.md` with capture plans for `guided_drifted_twin_test.gif`, `decision_record_diagnosis.gif`, `benchmark_run.gif`, `evidence_bundle_export.gif`, and `data_sources_panel.gif`.
- Added `docs/readme_visual_plan.md` with screenshot order, captions, slide visual recommendations, remaining visual gaps, and README media path rules.
- README does not link to missing GIF files.
- README media audit found 7 image references, all repo-relative, all existing, and no GIF links.

### GitHub prep
- Current branch: `master`.
- `git remote -v` returned no configured remotes in this local checkout.
- Created `GITHUB_PUSH_COMMANDS.md` with review commands, optional remote-add command for `https://github.com/zsherkar/ghost-beam.git`, suggested staging commands, commit command, and manual push command.
- Prepared but did not run `git commit` or `git push`.
- Staged final README/legal/packaging docs and README-referenced screenshots for manual review; earlier backend/frontend release-candidate source changes remain unstaged and should be reviewed before a full release commit.

### Validation
- README media path check passed: all referenced PNGs exist, no absolute Windows image paths, and no broken GIF links.
- Legal file existence check passed: `LICENSE`, `COPYRIGHT.md`, `NOTICE.md`, `CONTRIBUTING.md`, and `docs/legal_notice.md` exist.
- README section check passed for Opening Story, Problem, What Ghost Beam Does, Drifted Twin Test, Architecture, Data Sources, Benchmark, Quickstart, Safety and Scope, Copyright and Use Restrictions, and Safety/Affiliation Disclaimer.
- Copy safety audit updated: no false claims found for real ALS data, EPICS writes enabled, live hardware enabled, public tunnels, paid APIs, auto-downloaded BOOSTR, real facility logs, production readiness, safety certification, or institutional endorsement.
- `$env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"; python -m pytest tests -q` from `backend` passed with `48 passed in 26.00s`.
- `npm run build` from `frontend` passed; Vite still reports the known large lazy `ControlRoom3D` chunk warning.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1` passed health, dry-run health, benchmark, evidence bundle, version, public-data source status, data-source registry, data-source summary, and missing BOOSTR slice checks.

### Known limitations
- Final GIFs have not been captured yet; only the capture plan exists.
- Full external 1920x1080 projector screenshots should still be captured manually for final slides.
- `git remote -v` is empty locally, so a remote must be reviewed/added manually before push.
- The working tree still contains unstaged backend/frontend/docs changes from prior feature passes and untracked release-candidate files; review them before a complete release commit.
- Vite still warns that the lazy-loaded Three/R3F scene chunk is larger than 500 kB.

### Next step
Human should review `README.md`, `LICENSE`, `COPYRIGHT.md`, `NOTICE.md`, `CONTRIBUTING.md`, `docs/legal_notice.md`, and `GITHUB_PUSH_COMMANDS.md`, capture any final GIFs/screenshots desired, then manually commit and push to GitHub only after confirming the staged and unstaged file set.
