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

Bundle includes session export, latest DecisionRecord, latest mission report, latest benchmark, synthetic data manifest, recorded-run manifest when available, federated data-source registry, public dataset manifests, standards/provenance manifests, DecisionRecord schema, platform status, top eLog evidence, data source label, and `README_BUNDLE.md`.

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

## Recorded-Run Endpoints

Recorded-run endpoints load local CSV/eLog fixtures generated by Ghost Beam's synthetic JAX twin. They do not use real facility data or EPICS writes.

### `GET /recorded-runs`

Lists available recorded-run fixtures.

### `POST /recorded-runs/load`

Loads a recorded fixture into the current simulated session and evaluates the first row.

```json
{"run_id": "sample_recorded_drifted_twin"}
```

### `POST /recorded-runs/evaluate-step`

Evaluates a selected recorded fixture step through the same virtual diagnostic, eLog retrieval, and policy gate.

```json
{"run_id": "sample_recorded_drifted_twin", "step": 3}
```

## Public Data Endpoints

Public data endpoints expose a read-only BOOSTR-compatible local importer. Ghost Beam does not auto-download the full BOOSTR dataset and does not enable hardware actions from this mode.

### `GET /public-data/sources`

Returns available public data adapters, currently `boostr`, plus local-slice status and the latest public-data analysis artifact if one exists.

### `POST /public-data/boostr/import-local`

Imports a local BOOSTR-compatible CSV/Parquet slice. The path must resolve under `backend/data/public_datasets/boostr/`.

```json
{"path": "backend/data/public_datasets/boostr/local_sample.csv"}
```

Returns row count, column list, timestamp range if available, detected numeric signals, mapping status, and disclosure.

### `POST /public-data/boostr/evaluate-window`

Evaluates a read-only window from an imported BOOSTR-compatible run.

```json
{"run_id": "public-boostr-12345678", "start_index": 0, "window_size": 100}
```

Returns anomaly/trust metrics and one of `WINDOW_OK`, `ANALYZE`, or `FLAG_FOR_REVIEW`. Missing local slices return `NO_LOCAL_SLICE`. The artifact states that no writes are permitted.

## Federated Data Source Endpoints

### `GET /data-sources`

Returns Ghost Beam's non-invasive data-source registry. The registry separates the active core synthetic demo from read-only external/public data adapters, facility connector stubs, artifact standards, validation standards, and future extensions.

Required source IDs include:

- `synthetic_jax_twin`
- `synthetic_recorded_fixture`
- `boostr`
- `fermilab_bpm_ipm`
- `epics_archiver_stub`
- `pyarchappl_compatible`
- `openpmd`
- `frictionless`
- `ro_crate`
- `workflowhub`
- `materials_project`

### `GET /data-sources/summary`

Returns source groups, active source IDs, safety flags, and whether the Evidence Bundle includes the registry.

## Platform Endpoints

### `GET /platform/adapters`

Returns active and available adapter boundaries:

- `simulated`: active local JAX twin adapter
- `replay`: static replay artifact adapter
- `recorded_fixture`: synthetic recorded-run fixture adapter
- `public_boostr`: local read-only BOOSTR public data adapter
- `epics_archiver_stub`: disabled read-only archived-PV connector stub
- `pyarchappl_compatible`: disabled future retrieval interface
- `epics_stub`: disabled EPICS placeholder
- `future_epics`: planned facility-reviewed adapter boundary

Real hardware writes are disabled.

### `GET /platform/capabilities`

Returns feature flags for virtual diagnostics, UQ/OOD, eLog memory, policy gate, calibration simulation, mission reports, recorded-run ingestion, public BOOSTR adapter status, schema validation, and adapter mode.

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
- recorded-run ingestion enabled
- public data adapters enabled

### `GET /artifacts/schemas/decision-record`

Returns the runtime Pydantic JSON schema for the Ghost Beam `DecisionRecord`.
