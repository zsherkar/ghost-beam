# Safety Model

## Hard Limits

Every machine setting has min/max limits in `ghostbeam.core.registry`. Any proposed action outside those limits is blocked before uncertainty or memory logic is considered.

## Trust States

- `GREEN`: low uncertainty, low OOD score, low predicted beam loss.
- `YELLOW`: elevated uncertainty, edge-of-envelope state, or moderate loss.
- `RED`: high uncertainty, high OOD score, or high predicted loss.

## Human Review

Ghost Beam requires human review when retrieved synthetic eLogs conflict with the proposed action or vision evidence suggests risk that is not severe enough to block outright.

## Calibration Request

Calibration is requested when the twin is RED, when a clipped image makes evidence unreliable, or when similar eLogs indicate calibration is required.

## No Real Hardware Write

The MVP never imports real EPICS libraries and never discovers or controls hardware. `SimulatedEPICS` is the only active adapter. `EPICSStub` raises `NotImplementedError` for every operation.

The platform endpoints make this explicit:

- `GET /platform/adapters` reports `Simulated JAX Twin` as active.
- `GET /platform/capabilities` reports `real_hardware_writes_enabled: false`.
- `GET /platform/data-manifest` reports that all logs, PVs, and beam images are synthetic.

## Deterministic Gate

The policy gate does not use an LLM. It is deterministic, unit-tested, and produces explicit reasons plus safe next steps.

## Non-Mutating Health Check

`POST /experiment/health-check` runs the demo readiness smoke test inside an isolated temporary runtime. It does not alter the active operator session, scenario, calibration freshness, step number, or latest DecisionRecord.
