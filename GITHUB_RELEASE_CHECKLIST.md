# Ghost Beam GitHub Release Checklist

## Pre-Push Checklist

- [ ] Run backend tests: `cd backend; python -m pytest tests -q`
- [ ] Run frontend build: `cd frontend; npm run build`
- [ ] Run smoke script: `powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1`
- [ ] Confirm `LICENSE` exists and is proprietary/all-rights-reserved.
- [ ] Confirm no MIT, Apache, BSD, GPL, AGPL, MPL, Creative Commons, or other open-source license is present.
- [ ] Confirm `COPYRIGHT.md`, `NOTICE.md`, `CONTRIBUTING.md`, and `docs/legal_notice.md` exist.
- [ ] Confirm README says: `Proprietary demo. All rights reserved. No license is granted.`
- [ ] Confirm `/health` responds.
- [ ] Confirm `/platform/version` responds.
- [ ] Confirm `/data-sources` and `/data-sources/summary` respond.
- [ ] Confirm `/experiment/evidence-bundle` exports.
- [ ] Confirm no secrets or API keys are present.
- [ ] Confirm `.env` is ignored and only `.env.example` is included.
- [ ] Confirm `node_modules/` is excluded.
- [ ] Confirm `.venv/` is excluded.
- [ ] Confirm `.pytest_cache/`, `.vite/`, and temporary browser profiles are excluded.
- [ ] Confirm no full public datasets are bundled.
- [ ] Confirm no real facility eLogs are bundled.
- [ ] Confirm no screenshots expose personal data.
- [ ] Confirm local-only safety statement appears in README.
- [ ] Confirm README does not claim real hardware, live EPICS, or real facility logs.
- [ ] Confirm screenshot paths referenced in README exist.
- [ ] Confirm README has no broken GIF links.
- [ ] Confirm README media paths are repo-relative.
- [ ] Confirm `GITHUB_PUSH_COMMANDS.md` has been reviewed before any push.
- [ ] Confirm `.gitignore` covers local caches, logs, virtualenvs, node modules, and temp browser QA profiles.

## Files To Include

- `backend/ghostbeam/` source.
- `backend/tests/` tests.
- `frontend/src/` source.
- `frontend/package.json` and lockfile if present.
- `docs/` documentation.
- `scripts/` launch/smoke/reset helpers.
- `cad/` prompts/procedural fallback docs if present.
- `backend/data/elogs.csv` synthetic eLogs.
- `backend/data/synthetic_data_manifest.json`.
- `backend/data/scenarios/` scenario YAML files.
- `backend/data/recorded_runs/` small synthetic recorded fixture.
- `backend/data/public_datasets/*manifest*.json`.
- `backend/data/standards/` compatibility manifests.
- `docs/screenshots/` curated small screenshots.
- `README_DRAFT_INPUTS.md`, `README_FINAL_OUTLINE.md`, `DEMO_ASSET_PACKET.md`, `VISUAL_ASSET_INVENTORY.md`, and this checklist if useful.

## Files To Exclude

- `.venv/`
- `node_modules/`
- `__pycache__/`
- `.pytest_cache/`
- `frontend/node_modules/.vite/`
- `frontend/dist/` unless the hackathon explicitly wants a static build artifact.
- `.tmp-chrome-qa*/`
- `.tmp/`
- `.npm-cache/`
- `.pip-cache/`
- `*.log`
- `.env`
- local secrets or credentials.
- full BOOSTR or Fermilab datasets.
- large generated artifacts not needed for the repository.
- temporary Chrome profiles.

## Suggested Commit Message

```text
docs: finalize Ghost Beam README and proprietary release materials
```

## Suggested Repo Description

```text
Trust-and-memory gate for autonomous accelerator agents: digital twin confidence, eLog memory, policy gating, and evidence artifacts.
```

## Suggested README Hero Caption

```text
Ghost Beam gates a proposed accelerator action by checking twin trust, uncertainty/OOD, eLog memory, hard limits, and policy before simulated write.
```

## Suggested Topics

- accelerator
- controls
- digital-twin
- autonomy
- safety
- fastapi
- react
- threejs
- jax
- provenance
- evidence

## Release Notes Skeleton

```markdown
# Ghost Beam Release Candidate

Ghost Beam is a local, synthetic, no-hardware autonomous accelerator trust-agent demo.

Highlights:
- Guided Drifted Twin Test.
- Deterministic policy gate with APPROVE, APPROVE_SMALL_STEP, REQUIRE_HUMAN_REVIEW, REQUEST_CALIBRATION, and BLOCK.
- Naive-vs-Ghost-Beam benchmark.
- Decision Record JSON and human-readable Diagnosis.
- Backend Mission Report and Evidence Bundle.
- Recorded-run fixture ingestion.
- Federated data-source registry with BOOSTR/Fermilab manifests and disabled EPICS stubs.
- Local-only safety boundary.

Validation:
- Backend tests: 48 passed.
- Frontend build: passed.
- Smoke script: passed.
```
