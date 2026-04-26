# Packaging Artifacts Index

Generated: 2026-04-26 16:23:18 local time

These files were generated locally from the Ghost Beam FastAPI app through `fastapi.testclient` during the final packaging pass. They are small source-of-truth artifacts for README/demo preparation, not production exports.

## Benchmark Snapshot

- Benchmark ID: `GB-BENCH-20260426_162318`
- Trials: `50`
- Seed: `42`
- Approved: `9`
- Blocked: `9`
- Requested calibration: `16`
- Required human review: `16`
- Unsafe actions prevented: `41`
- Actions modified or blocked: `82.0%`
- Naive projected beam loss: `0.18742102831602098`
- Ghost Beam projected beam loss: `0.020589309558272362`

## Files

- `latest_drifted_twin_evaluation.json`
  - Source endpoint: `POST /experiment/evaluate`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Drifted Twin evaluation response with virtual diagnostic, eLog hits, and policy decision.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_session_export.json`
  - Source endpoint: `POST /experiment/export`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Full current session export after Drifted Twin evaluation.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_decision_record.json`
  - Source endpoint: `session export latest_decision_record`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Machine-readable Decision Record source.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_benchmark.json`
  - Source endpoint: `POST /benchmark/run`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Naive-vs-Ghost-Beam quantitative benchmark.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_mission_report.json`
  - Source endpoint: `POST /experiment/report/generate`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Backend-persisted mission report response.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_mission_report.md`
  - Source endpoint: `POST /experiment/report/generate`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Human-readable mission report Markdown.
  - Exists: yes
  - Included in README/demo packet: yes
- `latest_evidence_bundle_response.json`
  - Source endpoint: `POST /experiment/evidence-bundle`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Evidence bundle response with persisted bundle path and JSON payload.
  - Exists: yes
  - Included in README/demo packet: yes
- `data_sources_registry.json`
  - Source endpoint: `GET /data-sources`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Federated data-source registry snapshot.
  - Exists: yes
  - Included in README/demo packet: yes
- `data_sources_summary.json`
  - Source endpoint: `GET /data-sources/summary`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Registry summary and safety flags.
  - Exists: yes
  - Included in README/demo packet: yes
- `public_data_sources.json`
  - Source endpoint: `GET /public-data/sources`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: BOOSTR/public-data adapter status.
  - Exists: yes
  - Included in README/demo packet: yes
- `platform_version.json`
  - Source endpoint: `GET /platform/version`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Backend route/version/readiness metadata.
  - Exists: yes
  - Included in README/demo packet: yes
- `platform_capabilities.json`
  - Source endpoint: `GET /platform/capabilities`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Capability and safety metadata.
  - Exists: yes
  - Included in README/demo packet: yes
- `decision_record_schema.json`
  - Source endpoint: `GET /artifacts/schemas/decision-record`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Decision Record JSON schema.
  - Exists: yes
  - Included in README/demo packet: yes
- `dry_run_health_check.json`
  - Source endpoint: `POST /experiment/health-check`
  - Created: 2026-04-26 16:23:18 local time
  - Purpose: Non-mutating health check output.
  - Exists: yes
  - Included in README/demo packet: yes

## Notes

- No real accelerator data, real EPICS data, facility eLogs, paid APIs, public tunnels, or external uploads were used.
- Public datasets are represented through manifests/adapters only; no full public dataset is bundled.
- The evidence bundle response points to the backend-persisted bundle under `backend/artifacts/evidence_bundles/`.
