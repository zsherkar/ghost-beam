# Ghost Beam

Trust the twin before you touch the beam.

Ghost Beam is a trust-and-memory engine for autonomous accelerator agents. It sits between an optimizer or AI operator and a simulated accelerator control layer, then decides whether a proposed write should be approved, clipped to a smaller step, escalated for review, sent to calibration, or blocked.

The key demo is the **Drifted Twin Test**: a naive optimizer proposes increasing quadrupole focusing for a diffuse beam. Ghost Beam detects that the virtual diagnostic is outside its trust envelope, retrieves a synthetic operator eLog warning that similar symptoms were previously caused by RF phase drift, requests calibration, then approves a safer RF correction.

## Quick Start

Backend:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
cd backend
pytest tests -q
uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL, usually `http://127.0.0.1:5173`, while the backend is running on `http://127.0.0.1:8000`.

## Judge Demo Flow

1. Open Ghost Beam.
2. Click **Judge Demo Mode** in the top bar.
3. Click **Run Guided Demo** or use the guided panel.
4. Step through **Drifted Twin Test**:
   - Nominal Baseline
   - Drift Appears
   - Naive Proposal
   - Ghost Beam Evaluation
   - Calibration
   - Safer Correction
   - Export Artifact
5. Click **Generate Mission Report**.
6. Download Markdown or JSON, or copy the summary.
7. Open the DecisionRecord drawer to show the machine-readable gate artifact.
8. Run **Benchmark** to show naive-vs-Ghost-Beam utility across deterministic synthetic trials.
9. Export the **Evidence Bundle** for judges.

Before presenting, click **Demo Health Check**. It runs a non-mutating dry-run smoke test over health, scenarios, green-zone approval/apply, unsafe-write block, drifted calibration, eLog conflict, and export in an isolated temporary backend session.

## What Is Real

- FastAPI backend
- Pydantic schemas and `DecisionRecord` JSON
- JAX CPU transfer-matrix synthetic accelerator twin
- Virtual diagnostic with uncertainty and OOD scoring
- Synthetic beam-profile image generation and image-moment vision diagnostic
- TF-IDF retrieval over local synthetic eLogs
- Deterministic policy gate
- Stateful experiment runner
- React / TypeScript / React Three Fiber frontend
- Guided demo transcript and mission report export
- Backend-persisted Mission Report artifacts under `backend/artifacts/reports/`
- Naive-vs-Ghost-Beam benchmark over deterministic synthetic trials
- Evidence bundle export with report, benchmark, schema, manifest, and platform status
- Platform adapter/capability endpoints that expose active simulated mode and disabled real hardware writes
- DecisionRecord JSON schema and validation status in session exports
- Backend tests covering schemas, physics, virtual diagnostic, vision, retrieval, policy, API, and scenarios

## What Is Simulated

- Accelerator plant
- EPICS process variables
- Historical operator eLogs
- Calibration screen measurement
- Beam-profile camera
- Proposed optimizer action

No real facility logs, live EPICS data, hardware writes, accounts, paid APIs, or external telemetry are used.

See `backend/data/synthetic_data_manifest.json` for the formal synthetic data provenance manifest. It states exactly which PV-like fields, hidden outputs, beam-profile images, eLogs, and scenarios are generated locally.

## Architecture

```text
AI operator / optimizer
        |
        v
 ProposedAction
        |
        v
+---------------- Ghost Beam ----------------+
| Stateful simulated EPICS session            |
| JAX transfer-matrix beamline twin           |
| Virtual diagnostic + UQ/OOD                 |
| Beam-profile vision diagnostic              |
| Synthetic eLog memory retrieval             |
| Deterministic policy gate                   |
+--------------------------------------------+
        |
        v
DecisionRecord + Mission Report + 3D UI
```

## Demo Scenarios

- `green_zone`: safe trim path, expected `APPROVE` or `APPROVE_SMALL_STEP`
- `drifted_twin`: out-of-distribution twin state, expected `REQUEST_CALIBRATION`
- `elog_conflict`: trusted twin but eLog warning, expected `REQUIRE_HUMAN_REVIEW`
- `unsafe_write`: hard PV limit violation, expected `BLOCK`
- `calibration_recovery`: calibration lowers OOD and enables a safer path

## Tests

```powershell
cd backend
$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'
python -m pytest tests -q
```

Expected current result: `42 passed`.

## Important API Endpoints

- `GET /health`
- `GET /scenarios`
- `POST /experiment/start`
- `POST /experiment/propose`
- `POST /experiment/evaluate`
- `POST /experiment/apply`
- `POST /experiment/calibrate`
- `POST /experiment/export`
- `POST /experiment/health-check`
- `POST /experiment/report/generate`
- `POST /experiment/evidence-bundle`
- `GET /experiment/replay/drifted-twin`
- `POST /benchmark/run`
- `GET /benchmark/latest`
- `GET /platform/adapters`
- `GET /platform/capabilities`
- `GET /platform/data-manifest`
- `GET /platform/version`
- `GET /artifacts/schemas/decision-record`
- `GET /experiment/state`

See [docs/api.md](docs/api.md) for details.

## Artifacts

Ghost Beam exports:

- latest `DecisionRecord` JSON
- full session JSON
- guided demo transcript
- backend-persisted guided demo mission report JSON
- backend-persisted guided demo mission report Markdown
- benchmark JSON
- evidence bundle JSON with minimal RO-Crate-style provenance metadata
- DecisionRecord schema validation status

See [docs/artifact_schema.md](docs/artifact_schema.md).

## Safety And Scope

Ghost Beam is a local-only simulated environment. It does not read secrets, use paid APIs, upload logs, create public tunnels, scan hardware, or connect to real control systems. `SimulatedEPICS` is the active adapter; `EPICSStub` exists only to document a future integration boundary and intentionally raises for all real EPICS operations.

## Replacing the Simulator Later

The backend uses an adapter boundary under `backend/ghostbeam/adapters`.

For a real facility integration:

1. Replace `SimulatedEPICS` with a facility-approved read-only EPICS adapter.
2. Map real PVs into `MachineSettings` and `SafeSignals`.
3. Train the virtual diagnostic on approved facility data.
4. Connect real eLog export/search with privacy review.
5. Keep writes disabled until a facility hardware-safety gate approves them.
6. Wrap the policy gate as an Osprey-compatible pre-action check.

## Known Limitations

- All facility data are synthetic.
- The 3D beamline uses procedural geometry for hackathon reliability, not CAD/GLB assets.
- The guided demo previous button replays a step; it is not a reversible experiment timeline.
- Light theme is supported but the dark control-room theme is the primary demo target.
- Vite warns about large Three/R3F chunks; this is acceptable for the local MVP.

## Future Work

- Real read-only EPICS adapter
- Facility-trained virtual diagnostic
- Signed audit trail
- Richer RO-Crate/Frictionless export
- Xopt/Osprey wrappers
- Procedural-to-CAD asset replacement using text-to-cad or GLB models
