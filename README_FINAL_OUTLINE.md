# Ghost Beam Final README Outline

Do not overwrite `README.md` automatically from this file. Use it as the draft structure for the final GitHub landing page.

## 1. Hero Title

# Ghost Beam

**Accelerator trust agent.**

Recommended subtitle:

Ghost Beam gates autonomous accelerator actions using digital-twin trust, uncertainty/OOD scoring, eLog memory, hard safety limits, and evidence-producing policy decisions.

Hero image placeholder:

```markdown
![Ghost Beam guided demo](docs/screenshots/final_guided_inline_dark.png)
```

## 2. One-Liner

Ghost Beam sits between an autonomous optimizer and a simulated accelerator, deciding whether proposed actions should be approved, shrunk, blocked, calibrated, or sent to human review before any simulated write occurs.

## 3. Problem

Autonomous accelerator tools can propose machine actions faster than operators can manually inspect every detail. But digital twins drift, out-of-distribution states happen, and optimizers can miss historical operator warnings buried in eLogs.

Facilities need a trust gate: a layer that checks whether an action is safe, explainable, and auditable before it reaches the machine.

## 4. Solution

Ghost Beam combines:

- A synthetic JAX accelerator twin.
- Virtual diagnostics.
- Uncertainty and OOD scoring.
- Beam-profile diagnostics.
- Synthetic operator eLog retrieval.
- Hard PV limit checks.
- Deterministic policy gating.
- Calibration requests and human-review escalation.
- Evidence artifacts for every decision.

## 5. Demo: Drifted Twin Test

The key demo is the Drifted Twin Test:

1. The machine starts in a nominal state.
2. Drift pushes the state outside the twin's trusted region.
3. A naive optimizer proposes a quadrupole correction.
4. Ghost Beam sees high OOD and retrieves eLog evidence warning that similar symptoms came from RF phase drift.
5. Ghost Beam requests calibration before any write.
6. Trust improves after calibration.
7. Ghost Beam approves a safer correction path.
8. The system exports a Decision Record, Diagnosis, Mission Report, Benchmark, and Evidence Bundle.

## 6. Architecture

Use Mermaid diagram from `docs/architecture_diagram_source.md`.

Short text:

```text
UI -> FastAPI backend -> experiment runner -> JAX twin -> virtual diagnostic -> UQ/OOD -> eLog memory -> policy gate -> artifacts
```

## 7. Features

- 3D digital twin UI.
- Dark and light themes.
- Guided Drifted Twin Test.
- Live scenario runner.
- Demo Health Check.
- Human-readable Diagnosis tab.
- Decision Record JSON.
- Mission Report.
- Naive-vs-Ghost-Beam Benchmark.
- Evidence Bundle export.
- Recorded-run fixture and replay.
- BOOSTR-compatible public data adapter path.
- Federated data-source registry.
- Platform/version/adapters/capabilities endpoints.
- Local launch and smoke scripts.

## 8. Data Sources

Explain the separation:

- Core demo layer: synthetic JAX twin, synthetic eLogs, local scenarios, guided demo, benchmark, evidence artifacts.
- External data layer: read-only adapters, manifests, validation layers, and provenance standards.

Include table from `README_DRAFT_INPUTS.md`.

## 9. Real vs Simulated

Real:

- Backend engine.
- Experiment runner.
- JAX twin.
- Virtual diagnostic.
- Policy gate.
- eLog retrieval over local synthetic corpus.
- Benchmark.
- Evidence artifacts.
- UI.
- Data-source registry.

Simulated:

- Accelerator plant.
- EPICS PVs.
- eLogs.
- Beam camera.
- Calibration measurement.
- Recorded fixture.

## 10. Quickstart

Backend:

```powershell
cd backend
python -m pytest tests -q
python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Scripts:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start_ghostbeam.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1
```

## 11. Demo Flow

1. Run health check.
2. Show Live Scenario Mode.
3. Start Guided Drifted Twin Test.
4. Show Ghost Beam Evaluation.
5. Show calibration request.
6. Show safer correction.
7. Open Decision Record Diagnosis.
8. Generate Mission Report.
9. Run Benchmark.
10. Export Evidence Bundle.
11. Show Data Sources & Provenance.

## 12. Benchmark

Latest quote:

Across 50 deterministic synthetic accelerator-control trials, Ghost Beam prevented or modified 82% of naive actions, blocked 9 unsafe/hard-limit actions, requested calibration in 16 high-OOD cases, caught 16 eLog conflicts, and reduced average projected beam loss from 0.1874 to 0.0206.

## 13. Evidence Artifacts

Ghost Beam exports:

- Decision Record JSON.
- Ghost Beam Diagnosis Markdown.
- Mission Report JSON and Markdown.
- Benchmark JSON.
- Evidence Bundle JSON.
- Data-source registry.
- Synthetic/public manifests.
- Schema and validation metadata.
- RO-Crate-style provenance metadata.

## 14. Public Data Layer

Ghost Beam includes a federated data-source registry:

- BOOSTR adapter-ready, local-slice only.
- Fermilab BPM/IPM manifest-ready.
- EPICS Archiver read-only stub, disabled.
- pyarchappl-compatible stub, disabled.
- openPMD, Frictionless, RO-Crate, WorkflowHub compatibility.
- Materials Project future context adapter only.

No public data is auto-downloaded. Public Data Mode is read-only and cannot apply actions.

## 15. Safety and Scope

Ghost Beam is local-only. It does not connect to real hardware, write to EPICS, use paid APIs, upload data, expose public tunnels, auto-download large datasets, or include real facility eLogs.

## 16. Repo Structure

```text
backend/      FastAPI backend, physics, diagnostics, policy, artifacts, tests
frontend/     React/TypeScript/R3F UI
backend/data/ Synthetic eLogs, scenarios, manifests, recorded fixtures
docs/         API docs, demo docs, diagrams, safety notes, screenshots
scripts/      Local launch, smoke, reset, screenshot helpers
packaging/    Final packaging artifacts and README/demo source material
cad/          CAD/text-to-cad prompts and procedural fallback material
```

## 17. Future Work

- Facility-approved read-only EPICS Archiver integration.
- Real facility eLog connector with privacy review.
- Actual local BOOSTR slice example.
- Osprey-compatible trust-gate wrapper.
- Xopt proposal integration.
- openPMD import/export.
- Signed evidence bundles.
- CAD/GLB hardware assets.
- Full projector QA screenshots.

## 18. Acknowledgments / References

Reference public-data compatibility without implying bundled data:

- BOOSTR: public Fermilab Booster accelerator-control dataset, DOI `10.5281/zenodo.4382663`.
- Fermilab BPM/IPM Booster diagnostics dataset manifest, DOI `10.5281/zenodo.17429707`.
- openPMD / openPMD-beamphysics compatibility as future artifact standard.
- RO-Crate and WorkflowHub as provenance/workflow-publication compatibility targets.
