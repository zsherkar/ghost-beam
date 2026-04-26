# Final Judge Answers

## Is this real accelerator data?

No. The MVP uses synthetic accelerator-control data generated from Ghost Beam's local JAX digital twin. This is intentional: no real facility logs, live EPICS data, cameras, or hardware writes are included.

## Are you using actual public data?

The live control demo uses synthetic JAX-twin data for safety and repeatability. Ghost Beam also includes read-only adapters/manifests for BOOSTR, Fermilab BPM/IPM, EPICS Archiver, openPMD, Frictionless, RO-Crate, WorkflowHub, and a future Materials Project context adapter. Public datasets are local-import only and never write to hardware. We do not auto-download the full datasets during the hackathon because they are large and should stay optional.

## Why synthetic?

The goal is to demonstrate the architecture safely without touching real hardware or exposing facility/operator data. The simulator is explicitly swappable for a facility-approved adapter later.

## Is this just Xopt?

No. Xopt-style optimizers propose actions. Ghost Beam decides whether a proposed action is trustworthy enough to apply.

## Is this just Osprey?

No. Osprey-style systems orchestrate plans and human gates. Ghost Beam is the local pre-action trust layer: uncertainty, OOD, eLog memory, hard limits, and deterministic policy.

## Is this just RAG over eLogs?

No. eLog retrieval is one evidence source. The decision also uses virtual diagnostics, uncertainty, OOD scoring, beam-profile vision, hard PV limits, calibration state, and deterministic policy.

## What is novel?

Ghost Beam combines digital twin trust, operator memory, calibration awareness, and machine-action policy into a structured Decision Record before an autonomous action reaches the accelerator.

## Is Ghost Beam only stopping actions?

No. It gates actions. Depending on evidence, it may approve, approve a smaller step, request calibration, require human review, or block. In the Drifted Twin Test it requests calibration first, then approves a safer RF correction after trust improves.

## Why does the guided demo always use Drifted Twin?

Guided Demo is a fixed judging story. It intentionally switches to Drifted Twin Test so the evaluator sees diagnosis, calibration, safer correction, and artifact export in sequence. The Scenario selector is separate and still supports Green Zone, Unsafe Write, eLog Conflict, Calibration Recovery, and recorded fixture evaluation.

## What is the national impact?

Autonomous scientific facilities will need reliability and auditability. Ghost Beam helps facilities move toward AI-assisted operation without blindly trusting optimizers or opaque agents.

## How would this connect to EPICS?

The backend already exposes an adapter boundary. `SimulatedEPICS` is active. `EPICSStub` documents the future interface but disables real reads/writes. A facility deployment would start read-only, map approved PVs, and require hardware-safety review before any writes.

## What is needed for deployment?

Facility-approved data, trained virtual diagnostics, privacy-reviewed eLog ingestion, read-only EPICS integration, operator validation, signed audit artifacts, and formal machine-protection review.
