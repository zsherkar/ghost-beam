# Ghost Beam Deployment Notes

Ghost Beam deployment targets are author-managed only.

This repository is proprietary. No license is granted to clone, run, host, deploy, benchmark, modify, reuse, or operate Ghost Beam. These notes document the intended deployment architecture for Ziauddin Sherkar's own review/demo environments; they are not public deployment instructions.

## Maintainer-Managed Targets

Ghost Beam has two intended deployment targets:

1. **Full live app service**
   - Serves the React/Three.js frontend and FastAPI backend from one service.
   - Preserves the experiment runner, guided Drifted Twin Test, benchmark, Mission Report, Decision Record, Diagnosis, Evidence Bundle, recorded fixtures, public data registry, and backend endpoints.
   - Remains synthetic and local/sandboxed by design.

2. **Static visual demo**
   - Serves a read-only React build with embedded fixture data.
   - Preserves the main UI/UX, guided story, diagnosis preview, benchmark preview, evidence preview, and data-source panels.
   - Does not run the FastAPI/JAX backend and cannot generate live backend artifacts.

The static GitHub Pages target is not advertised in the public README until it is enabled, deployed, and verified.

The Pages workflow is manual-only so pushes do not publish or republish a static demo by accident.

## Safety Boundary

Deployment does not change the Ghost Beam safety model:

- no real accelerator hardware
- no EPICS writes
- no live facility eLogs
- no live camera feeds
- no automatic public dataset downloads
- no paid APIs
- no external uploads
- no public tunnels required
- public data adapters are read-only/local-slice only

## Maintainer Checklist

Before publishing or sharing any deployment link, verify:

- frontend build passes
- static build passes if the static demo is being published
- backend tests pass
- smoke checks pass
- the deployed root page loads
- health/readiness endpoints respond if using the full backend service
- no generated private artifacts, logs, local paths, secrets, or large datasets are included
- README links point only to verified live URLs

Any public deployment link should be shared only after human review.
