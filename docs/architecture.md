# Ghost Beam Architecture

## Module Diagram

```text
frontend React Three Fiber
        |
        v
FastAPI routes
        |
        v
runtime pipeline
  |-- simulated EPICS adapter
  |-- JAX transfer-matrix synthetic injector
  |-- random-forest virtual diagnostic
  |-- OOD and uncertainty scorer
  |-- image-moment vision diagnostic
  |-- TF-IDF synthetic eLog retriever
  |-- deterministic policy gate
        |
        v
DecisionRecord JSON
```

## Data Flow

1. A scenario or optimizer proposes a `ProposedAction`.
2. The runtime reads `MachineSettings` from the simulated adapter.
3. The physics core generates `SafeSignals`, hidden truth, and a synthetic beam image.
4. The virtual diagnostic predicts hidden beam quality and trust state.
5. The vision module labels the beam image.
6. The eLog module retrieves similar synthetic operator incidents.
7. The deterministic policy gate emits a `GateDecision`.
8. The API returns a full `DecisionRecord`.

## Decision Flow

```text
hard limit violation -> BLOCK
high predicted loss -> BLOCK
RED trust -> REQUEST_CALIBRATION
calibration-required memory -> REQUEST_CALIBRATION
clipped image -> REQUEST_CALIBRATION
halo plus risky action -> REQUIRE_HUMAN_REVIEW
eLog action conflict -> REQUIRE_HUMAN_REVIEW
YELLOW trust -> APPROVE_SMALL_STEP
GREEN plus low-risk action -> APPROVE
fallback -> REQUIRE_HUMAN_REVIEW
```

## Simulator-To-EPICS Swap

The adapter boundary is `ghostbeam.adapters.base.AcceleratorAdapter`. `SimulatedEPICS` implements local reads and bounded simulated writes. `EPICSStub` documents the future interface and intentionally refuses all real hardware access.

A real facility integration should first add a read-only EPICS adapter, then a facility-approved write gate. The deterministic policy should remain upstream of any write call.
