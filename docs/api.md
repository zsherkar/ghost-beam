# API

Base URL for local development:

```text
http://127.0.0.1:8000
```

## Endpoints

### `GET /health`

Returns service status.

```json
{"status": "ok", "service": "ghost-beam"}
```

### `GET /registry`

Returns PV limits and max no-approval deltas.

### `GET /scenarios`

Returns scenario IDs, descriptions, and expected behavior.

### `POST /scenarios/load`

```json
{"scenario_id": "drifted_twin"}
```

Returns current settings and proposed action.

### `GET /state/current`

Returns current simulated settings and safe signals.

### `POST /diagnostic/predict`

Input is a `MachineSettings` object. Returns `VirtualDiagnosticResult`.

### `POST /vision/analyze`

Input is a `MachineSettings` object. Returns `VisionDiagnosticResult`.

### `POST /elog/search`

```json
{"query": "diffuse beam quad drift", "top_k": 3}
```

Returns synthetic `ElogHit` records.

### `POST /control/propose`

```json
{
  "scenario_id": "green_zone",
  "intent": "improve beam quality",
  "current_settings": {
    "quad_1": 0.36,
    "quad_2": -0.26,
    "steer_x": 0.0,
    "steer_y": 0.0,
    "rf_phase": 0.45,
    "rf_amplitude": 1.0
  }
}
```

Returns a `ProposedAction`.

### `POST /plan/evaluate`

```json
{
  "scenario_id": "green_zone",
  "current_settings": {
    "quad_1": 0.36,
    "quad_2": -0.26,
    "steer_x": 0.0,
    "steer_y": 0.0,
    "rf_phase": 0.45,
    "rf_amplitude": 1.0
  },
  "proposed_action": {
    "intent": "small green-envelope quad_1 trim",
    "delta_settings": {"quad_1": 0.03},
    "source": "scenario"
  }
}
```

Returns a full `DecisionRecord`.

### `POST /control/apply-simulated`

Input is a `DecisionRecord`. Applies only `APPROVE` or `APPROVE_SMALL_STEP`.

### `POST /calibration/request`

Returns the recommended synthetic calibration measurement.

### `POST /calibration/apply`

Applies a synthetic calibration weight for the scenario and returns an improved diagnostic status.

### `GET /artifacts/latest`

Returns the latest enriched decision artifact.

### `POST /artifacts/export`

Writes the latest artifact to `backend/artifacts_output/latest_decision.json`.

## Stateful Experiment Endpoints

These power the interactive frontend and guided demo.

### `GET /experiment/state`

Returns the current simulated experiment session:

- scenario ID
- step number
- current settings
- safe signals
- latest diagnostics
- latest decision
- event history
- trajectory
- beam profile
- device registry

### `POST /experiment/start`

```json
{"scenario_id": "drifted_twin"}
```

Starts a deterministic simulated session from a scenario.

### `POST /experiment/propose`

```json
{
  "intent": "correct RF phase after calibration verification",
  "source": "human",
  "delta_settings": {"rf_phase": -0.35}
}
```

Returns a `ProposedAction`. If `delta_settings` is omitted, the local optimizer proposes a bounded action.

### `POST /experiment/evaluate`

```json
{
  "proposed_action": {
    "intent": "naive optimizer increase quad_2 focusing",
    "source": "optimizer",
    "delta_settings": {"quad_2": 0.22}
  }
}
```

Runs the full Ghost Beam gate and returns a `DecisionRecord`.

### `POST /experiment/apply`

```json
{"decision_record_id": "DR-0003", "force": false}
```

Applies only `APPROVE` or `APPROVE_SMALL_STEP` decisions in the simulated adapter.

### `POST /experiment/calibrate`

Simulates an interruptive calibration screen measurement and refreshes trust near the current state.

### `POST /experiment/reset`

Resets the active scenario session.

### `GET /experiment/history`

Returns the local simulated event history.

### `POST /experiment/export`

Returns the full session export including DecisionRecord validation status and synthetic-data disclosure. The frontend enriches this payload with guided transcript and mission report data when available.

### `POST /experiment/evidence-bundle`

Creates a judge-ready evidence bundle JSON under `backend/artifacts/evidence_bundles/`.

Input:

```json
{
  "guided_transcript": [],
  "frontend_metadata": {
    "theme_mode": "dark"
  }
}
```

Bundle includes session export, latest DecisionRecord, latest mission report, latest benchmark, synthetic data manifest, DecisionRecord schema, platform status, top eLog evidence, and `README_BUNDLE.md`.

### `POST /experiment/health-check`

Runs the pre-demo smoke check in an isolated temporary experiment session.

This endpoint is non-mutating: it does not change the visible/current experiment scenario, step number, calibration freshness, latest DecisionRecord, or history.

It verifies:

- scenarios load
- green-zone safe trim approves and applies in the dry-run context
- unsafe `quad_1=+99` blocks
- drifted twin requests calibration
- calibration lowers OOD risk
- eLog conflict requires human review
- session export validates

### `POST /experiment/report/generate`

Generates and persists a backend Mission Report artifact.

Input:

```json
{
  "guided_transcript": [],
  "latest_decision_record": {},
  "session_export": {},
  "frontend_metadata": {
    "theme_mode": "dark",
    "twin_lighting_mode": "presentation"
  }
}
```

Output includes:

- `report_id`
- `created_at`
- Markdown report
- JSON report
- filename suggestions
- local backend artifact paths under `backend/artifacts/reports/`

### `GET /experiment/report/latest`

Returns the latest backend-persisted mission report JSON.

### `GET /experiment/report/{report_id}`

Returns a specific backend-persisted mission report JSON by report ID.

### `GET /experiment/replay/drifted-twin`

Returns the static Drifted Twin Test replay artifact. This is a replay artifact viewer source, not a live backend action.

## Benchmark Endpoints

### `POST /benchmark/run`

Runs the deterministic naive-vs-Ghost-Beam synthetic benchmark.

```json
{"total_trials": 50, "seed": 42}
```

Returns summary metrics, trial table, top interventions, and synthetic-data disclosure.

### `GET /benchmark/latest`

Returns the latest benchmark result.

### `GET /benchmark/{benchmark_id}`

Returns a specific persisted benchmark by ID.

## Platform Endpoints

### `GET /platform/adapters`

Returns active and available adapter boundaries:

- `simulated`: active local JAX twin adapter
- `replay`: static replay artifact adapter
- `epics_stub`: disabled EPICS placeholder
- `future_epics`: planned facility-reviewed adapter boundary

Real hardware writes are disabled.

### `GET /platform/capabilities`

Returns feature flags for virtual diagnostics, UQ/OOD, eLog memory, policy gate, calibration simulation, mission reports, schema validation, and adapter mode.

### `GET /platform/data-manifest`

Returns `backend/data/synthetic_data_manifest.json`.

### `GET /platform/version`

Returns app/version/readiness metadata:

- app name/version
- schema version
- backend start time
- route groups
- adapter mode
- real hardware writes disabled
- report persistence enabled
- benchmark enabled
- evidence bundle enabled
- replay enabled

### `GET /artifacts/schemas/decision-record`

Returns the runtime Pydantic JSON schema for the Ghost Beam `DecisionRecord`.
