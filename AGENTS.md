# Ghost Beam Agent Notes

Ghost Beam is a local, no-spend, simulated accelerator safety MVP. Build and run only inside this project directory.

## Mission

Ghost Beam is a trust-and-memory gate for autonomous accelerator agents. It evaluates proposed control actions before any simulated machine write by combining:

- JAX transfer-matrix beamline physics
- virtual diagnostic prediction, uncertainty, and OOD scoring
- synthetic beam-profile vision diagnostics
- TF-IDF retrieval over synthetic operator eLogs
- deterministic policy gating
- FastAPI endpoints and a React Three Fiber control-room UI

The output is always a structured `DecisionRecord` with one of:

- `APPROVE`
- `APPROVE_SMALL_STEP`
- `REQUIRE_HUMAN_REVIEW`
- `REQUEST_CALIBRATION`
- `BLOCK`

## Build Order

1. Backend schemas
2. JAX transfer-matrix physics core
3. Synthetic injector scenarios
4. Virtual diagnostic with uncertainty and OOD scoring
5. Vision diagnostic
6. eLog retrieval over local CSV
7. Deterministic policy gate
8. FastAPI endpoints
9. Integration tests for five scenarios
10. React / Vite / React Three Fiber frontend
11. CAD/text-to-cad prompts with procedural fallback
12. README and docs
13. Final polish

## Safety Rules

- Stay inside this project directory.
- Do not read secrets or personal files.
- Do not spend money or create paid resources.
- Do not control real hardware or discover devices.
- Do not expose public tunnels or non-localhost servers.
- Use synthetic data only.
- Keep EPICS support as a stub; real hardware writes are forbidden.
- Prefer deterministic, local, offline behavior after dependencies install.
- Use fallbacks when optional dependencies fail.

## Development Commands

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

## Engineering Notes

- The simulator is replaceable by an EPICS adapter later, but this MVP must not import or call real EPICS libraries by default.
- The policy gate must remain deterministic and unit-tested.
- The optimizer proposes only; it never applies.
- `SimulatedEPICS` may apply only approved simulated writes.
- eLogs are synthetic and must not be represented as real facility records.
- Core safety decisions must not depend on an LLM.
