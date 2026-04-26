# Final Judge Answers

## Is this real accelerator data?

No. The MVP uses synthetic accelerator-control data generated from Ghost Beam's local JAX digital twin. This is intentional: no real facility logs, live EPICS data, cameras, or hardware writes are included.

## Why synthetic?

The goal is to demonstrate the architecture safely without touching real hardware or exposing facility/operator data. The simulator is explicitly swappable for a facility-approved adapter later.

## Is this just Xopt?

No. Xopt-style optimizers propose actions. Ghost Beam decides whether a proposed action is trustworthy enough to apply.

## Is this just Osprey?

No. Osprey-style systems orchestrate plans and human gates. Ghost Beam is the local pre-action trust layer: uncertainty, OOD, eLog memory, hard limits, and deterministic policy.

## Is this just RAG over eLogs?

No. eLog retrieval is one evidence source. The decision also uses virtual diagnostics, uncertainty, OOD scoring, beam-profile vision, hard PV limits, calibration state, and deterministic policy.

## What is novel?

Ghost Beam combines digital twin trust, operator memory, calibration awareness, and machine-action policy into a structured DecisionRecord before an autonomous action reaches the accelerator.

## What is the national impact?

Autonomous scientific facilities will need reliability and auditability. Ghost Beam helps facilities move toward AI-assisted operation without blindly trusting optimizers or opaque agents.

## How would this connect to EPICS?

The backend already exposes an adapter boundary. `SimulatedEPICS` is active. `EPICSStub` documents the future interface but disables real reads/writes. A facility deployment would start read-only, map approved PVs, and require hardware-safety review before any writes.

## What is needed for deployment?

Facility-approved data, trained virtual diagnostics, privacy-reviewed eLog ingestion, read-only EPICS integration, operator validation, signed audit artifacts, and formal machine-protection review.
