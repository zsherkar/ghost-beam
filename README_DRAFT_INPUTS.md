# Ghost Beam README Source Packet

This file is the source-of-truth input for drafting the final GitHub README, landing page copy, and judge-facing explanation. It reflects the repository state validated on 2026-04-26 during the final packaging pass.

## 1. Project Name

Ghost Beam

## 2. One-Liner

Ghost Beam gates autonomous accelerator actions using digital-twin trust, uncertainty/OOD scoring, eLog memory, hard safety limits, and evidence-producing policy decisions.

## 3. Short Description

Ghost Beam is an accelerator trust agent. It sits between an autonomous optimizer and a simulated accelerator control layer, evaluates each proposed action with twin trust, diagnostics, eLog memory, and deterministic policy, then approves, shrinks, blocks, requests calibration, or escalates the action before any simulated write occurs.

The live demo is local-only and synthetic for safety, but the platform includes read-only public-data adapters, facility connector stubs, schema validation, and evidence/provenance exports.

## 4. Problem

Autonomous accelerator agents need digital twins, optimizers, and virtual diagnostics to propose useful actions. Those systems can fail when the digital twin drifts, uncertainty is underestimated, or the machine state moves outside the model's trusted region.

Naive optimizers can propose actions that look locally useful but violate hard PV limits, worsen beam halo, or conflict with historical operator experience. That operator knowledge is often buried in eLogs and is not naturally part of an optimizer's action loop.

Ghost Beam provides the missing trust gate. It checks proposed actions before they touch the simulated machine and records why each decision was made.

## 5. What Ghost Beam Does

- Runs a synthetic JAX transfer-matrix accelerator twin.
- Produces virtual diagnostic predictions for beam quality, beam size, beam loss, uncertainty, and OOD score.
- Runs a beam-profile/vision diagnostic over synthetic profile images.
- Retrieves relevant synthetic operator eLog entries using local TF-IDF retrieval.
- Checks hard PV limits and policy rules deterministically.
- Requests calibration when the twin is outside its trusted envelope.
- Requires human review when eLog evidence conflicts with the proposed action.
- Blocks unsafe writes.
- Approves safe actions or smaller safer steps.
- Exports a machine-readable Decision Record JSON.
- Exports human-readable Ghost Beam Diagnosis Markdown.
- Generates backend-persisted Mission Reports.
- Runs a naive-vs-Ghost-Beam benchmark.
- Exports a full Evidence Bundle with manifests, schemas, provenance, and platform metadata.

## 6. Demo Experiment: Drifted Twin Test

1. Nominal baseline: L1 Transfer Line begins inside a trusted green operating region.
2. Drift appears: the machine moves outside the digital twin's familiar envelope.
3. Naive proposal: an optimizer proposes a quadrupole correction that looks plausible for a diffuse beam.
4. Ghost Beam evaluation: Ghost Beam checks virtual diagnostic uncertainty, OOD score, beam profile, eLog memory, hard limits, and policy.
5. eLog evidence: Ghost Beam retrieves a synthetic eLog warning that similar diffuse-beam symptoms were caused by RF phase drift and that increasing `quad_2` worsened halo.
6. Calibration: Ghost Beam requests a calibration measurement instead of trusting a stale twin.
7. Safer correction: after calibration improves trust/OOD, Ghost Beam approves a safer correction path rather than blindly applying the naive quadrupole move.
8. Export artifact: Ghost Beam exports a Decision Record, Diagnosis, Mission Report, Benchmark, and Evidence Bundle.

## 7. Architecture

Text diagram:

```text
Ghost Beam UI
  -> FastAPI backend
  -> stateful experiment runner
  -> synthetic JAX digital twin
  -> virtual diagnostic
  -> uncertainty / OOD scoring
  -> synthetic eLog memory
  -> deterministic policy gate
  -> Decision Record / Diagnosis / Mission Report / Evidence Bundle
```

Action flow:

```text
current machine state
  -> proposed autonomous action
  -> virtual diagnostic prediction
  -> uncertainty and OOD scoring
  -> vision / beam profile diagnostic
  -> eLog retrieval
  -> policy gate
  -> APPROVE / APPROVE_SMALL_STEP / REQUIRE_HUMAN_REVIEW / REQUEST_CALIBRATION / BLOCK
  -> simulated apply only if allowed
  -> artifact export
```

## 8. Key Features

- React/TypeScript 3D control-room UI with light and dark themes.
- Guided Drifted Twin Test demo.
- Live Scenario Mode for Green Zone, Drifted Twin, eLog Conflict, Unsafe Write, and Calibration Recovery.
- Scenario-specific diagnosis and evidence.
- Benchmark comparing naive optimizer behavior against Ghost Beam.
- Mission Report generation.
- Evidence Bundle export.
- Decision Record JSON schema endpoint.
- Human-readable Diagnosis Markdown.
- Recorded-run fixture ingestion and replay.
- BOOSTR-compatible public data adapter path for local slices.
- Federated data-source registry for core, public, facility-stub, validation, and provenance sources.
- Platform readiness/version panel and endpoints.
- Local-only safety boundaries.

## 9. Data Sources

| Data source | Role | Active? | Real/public? | Notes |
| --- | --- | --- | --- | --- |
| Synthetic JAX Digital Twin | Live demo, benchmark, virtual diagnostic training/testing | Yes | Synthetic | Local JAX transfer-matrix environment. Simulated writes only after policy approval. |
| Synthetic eLogs | Operator-memory retrieval | Yes | Synthetic | Local CSV; no real facility logs. |
| Synthetic Recorded Fixture | Deterministic replay and recorded-run ingestion demo | Yes | Synthetic | Local CSV/eLog trace generated by Ghost Beam. |
| BOOSTR | Public accelerator-control dataset adapter | Adapter-ready | Public, local-slice only | Manifest references DOI `10.5281/zenodo.4382663`; no full dataset bundled or downloaded. |
| Fermilab BPM/IPM | Public beam-position/profile diagnostics manifest | Manifest-ready | Public, local-slice future path | Manifest references DOI `10.5281/zenodo.17429707`; no files bundled. |
| EPICS Archiver Stub | Future read-only archived PV retrieval connector | Stub disabled | Facility connector shape | Does not connect to any network or live control system. |
| pyarchappl-compatible Stub | Future Python client compatibility layer | Stub disabled | Facility connector shape | Read-only future interface only. |
| openPMD | Future beam-physics artifact compatibility | Manifest-ready | Standard | Included as compatibility manifest only. |
| Frictionless | Tabular validation layer | Active or manifest-ready | Standard | Reports installed/not-installed status without requiring heavy dependency. |
| RO-Crate | Evidence/provenance bundle layer | Active | Standard | Evidence bundle includes RO-Crate-style metadata. |
| WorkflowHub | Future workflow publication/provenance registry compatibility | Manifest-ready | Standard/future extension | Not active in the live control loop. |
| Materials Project | Future Genesis materials context | Manifest-ready | Public/future extension | Not used for accelerator control. No API key or runtime call. |

## 10. APIs / Endpoints

Experiment:

- `GET /experiment/state`
- `POST /experiment/start`
- `POST /experiment/propose`
- `POST /experiment/evaluate`
- `POST /experiment/apply`
- `POST /experiment/calibrate`
- `POST /experiment/export`
- `POST /experiment/health-check`
- `POST /experiment/report/generate`
- `GET /experiment/report/latest`
- `POST /experiment/evidence-bundle`

Benchmark:

- `POST /benchmark/run`
- `GET /benchmark/latest`
- `GET /benchmark/{benchmark_id}`

Platform:

- `GET /health`
- `GET /platform/version`
- `GET /platform/adapters`
- `GET /platform/capabilities`
- `GET /platform/data-manifest`

Data sources:

- `GET /data-sources`
- `GET /data-sources/summary`
- `GET /public-data/sources`
- `POST /public-data/boostr/import-local`
- `POST /public-data/boostr/evaluate-window`
- `GET /recorded-runs`
- `POST /recorded-runs/load`
- `POST /recorded-runs/evaluate-step`

Artifacts:

- `GET /artifacts/schemas/decision-record`
- `POST /experiment/evidence-bundle`

## 11. How To Run

Backend:

```powershell
cd "D:\Building\Ghost Beam"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd backend
python -m pytest tests -q
python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd "D:\Building\Ghost Beam\frontend"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

One-command local launch:

```powershell
cd "D:\Building\Ghost Beam"
powershell -ExecutionPolicy Bypass -File .\scripts\start_ghostbeam.ps1
```

Smoke test:

```powershell
cd "D:\Building\Ghost Beam"
powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1
```

URLs:

- Frontend: `http://127.0.0.1:5173/`
- Backend API: `http://127.0.0.1:8000/`
- API docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

## 12. How To Demo

1. Open the app at `http://127.0.0.1:5173/`.
2. Run Health Check and state that it is non-mutating.
3. Show Live Scenario Mode and run a quick scenario sweep if needed.
4. Click Guided: Drifted Twin Test.
5. Step through baseline, drift, naive proposal, Ghost Beam evaluation, calibration, safer correction, and export.
6. Open Decision Record and show the Diagnosis tab first.
7. Show the "What Ghost Beam Did" timeline.
8. Generate Mission Report.
9. Run Benchmark.
10. Export Evidence Bundle.
11. Open Settings / Data Sources & Provenance to show core vs external data layers.

## 13. What Is Real vs Simulated

Real:

- FastAPI backend.
- Pydantic schemas and Decision Record schema endpoint.
- JAX CPU synthetic digital twin.
- Virtual diagnostic, uncertainty, and OOD scoring.
- Synthetic image/beam-profile diagnostic.
- TF-IDF retrieval over local synthetic eLogs.
- Deterministic policy gate.
- Stateful experiment runner.
- Scenario runner, benchmark runner, recorded fixture loader, public data registry, and artifact exporters.
- React/TypeScript UI and 3D scene.
- Backend-persisted reports and evidence bundles.

Simulated:

- Accelerator plant.
- EPICS PVs.
- Historical eLogs.
- Beam camera and image stream.
- Calibration screen measurement.
- Proposed optimizer action.
- Recorded-run fixture data.

Explicitly not used:

- Real hardware.
- Real EPICS writes.
- Real facility eLogs.
- Public tunnels.
- Paid APIs.
- External uploads.
- Automatic public dataset downloads.

## 14. Safety / Scope

Ghost Beam is local-only. The active adapter is simulated. Public data paths are read-only and local-slice based. Facility connector stubs are disabled. No live EPICS/ACNET connection is made. No public datasets are auto-downloaded. No hardware write path exists outside the simulated environment.

## 15. Benchmark Metrics

Latest packaging benchmark:

- Benchmark ID: `GB-BENCH-20260426_162318`
- Trials: `50`
- Seed: `42`
- Naive actions applied: `50`
- Ghost Beam approved: `9`
- Ghost Beam approved small step: `0`
- Ghost Beam blocked: `9`
- Ghost Beam requested calibration: `16`
- Ghost Beam required human review: `16`
- Hard-limit violations prevented: `9`
- eLog conflicts caught: `16`
- Drifted twin calibrations requested: `8`
- Unsafe actions prevented: `41`
- Average naive projected quality: `0.6380684232711792`
- Average Ghost Beam projected quality: `0.7037931048870086`
- Average naive projected beam loss: `0.18742102831602098`
- Average Ghost Beam projected beam loss: `0.020589309558272362`
- Average OOD before calibration: `9.74102773395509`
- Average OOD after calibration: `2.7410277339550895`
- Percent actions modified or blocked: `82.0%`
- Percent safe actions allowed: `18.0%`
- Runtime: `5093.05 ms`

Short quote:

Across 50 deterministic synthetic accelerator-control trials, Ghost Beam prevented or modified 82% of naive actions, blocked 9 unsafe/hard-limit actions, requested calibration in 16 high-OOD cases, caught 16 eLog conflicts, and reduced average projected beam loss from 0.1874 to 0.0206.

## 16. Evidence Bundle Contents

The evidence bundle includes:

- Session export JSON.
- Latest Decision Record JSON.
- Human-readable Diagnosis Markdown.
- Mission Report JSON and Markdown if generated.
- Latest Benchmark JSON if available.
- Guided transcript JSON.
- Top eLog evidence.
- Synthetic data manifest.
- Decision Record schema.
- Platform adapters/capabilities/version metadata.
- Data-source registry.
- BOOSTR manifest.
- Fermilab BPM/IPM manifest.
- Public-data import status.
- Frictionless validation report or not-installed status.
- RO-Crate-style metadata.
- openPMD compatibility manifest.
- WorkflowHub compatibility manifest.
- Synthetic/no-hardware/no-real-logs disclosure.

Packaging artifacts are indexed in `packaging/artifacts/ARTIFACTS_INDEX.md`.

## 17. Known Limitations

- All live demo facility data are synthetic.
- Public BOOSTR and Fermilab BPM/IPM datasets are not bundled; users must provide local slices.
- Public-data analysis is read-only and lightweight; it is not a retrained public-data virtual diagnostic.
- EPICS/Archiver connectors are stubs only and do not connect to networks.
- 3D beamline geometry is procedural, not CAD/GLB.
- Vite still warns that the lazy-loaded Three/R3F scene chunk is larger than 500 kB.
- In-app browser QA is narrower than full projector desktop; external 1440/1600/1920 QA should be done manually before recording.

## 18. Future Work

- Facility-approved read-only EPICS Archiver integration.
- Actual BOOSTR local slice import and analysis examples.
- Real facility eLog connector with privacy review.
- Osprey-compatible pre-action trust gate wrapper.
- Xopt optimizer integration where Xopt proposes and Ghost Beam gates.
- openPMD/openPMD-beamphysics import/export.
- Signed evidence bundles and stronger RO-Crate generation.
- CAD/GLB hardware assets.
- Full external projector QA and final screen recording.

## Validation Snapshot

Commands run during packaging:

- `python -m pytest tests -q` from `backend`: passed, `48 passed in 28.23s`.
- `npm run build` from `frontend`: passed. Known Vite warning: lazy `ControlRoom3D` chunk is larger than 500 kB.
- `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1`: passed health, dry-run health, benchmark, evidence bundle, version, public-data source status, data-source registry, data-source summary, and missing BOOSTR slice checks.
- Direct API smoke passed for `GET /health`, `GET /platform/version`, `GET /platform/adapters`, `GET /platform/capabilities`, `GET /data-sources`, `GET /data-sources/summary`, `GET /public-data/sources`, `GET /artifacts/schemas/decision-record`, `POST /experiment/health-check`, `POST /benchmark/run`, and `POST /experiment/evidence-bundle`.
- In-app browser smoke at `http://127.0.0.1:5173/`: page title `Ghost Beam`, product description visible, Live Scenario present, Guided control available, and zero console errors captured.
- Backend browser URL smoke: `http://127.0.0.1:8000/health` responded with ok status through shell verification; `http://127.0.0.1:8000/docs` loaded as `Ghost Beam - Swagger UI`.

Local preview URLs:

- Frontend: `http://127.0.0.1:5173/`
- Backend docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`
