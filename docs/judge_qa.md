# Judge Q&A

## Is this just Xopt?

No. Xopt proposes candidates. Ghost Beam decides whether any candidate may touch the machine. It can approve, clip to a smaller step, require human review, request calibration, or block outright.

## Is this just Osprey?

No. Osprey-style systems orchestrate plans and human-gated workflows. Ghost Beam is the local pre-action trust gate that can sit inside an Osprey workflow before a hardware write.

## Is this just RAG over eLogs?

No. eLog retrieval is one evidence channel. The final decision is deterministic and also uses JAX physics, virtual diagnostic uncertainty, OOD scoring, beam-image labels, hard PV limits, and policy rules.

## Is this real accelerator data?

No. The demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. The eLogs are synthetic and clearly labeled as such. No live EPICS data, real facility logs, or real accelerator hardware are used.

## Why use synthetic data?

Real accelerator controls and eLogs require facility authorization, safety review, privacy review, and hardware access. Synthetic data lets the team demonstrate the architecture, interfaces, policy logic, and failure modes without risking a real machine or exposing facility records.

## Why does uncertainty matter?

A digital twin can be accurate near its training distribution and confidently wrong after maintenance, aging, hysteresis, RF drift, or calibration changes. OOD and uncertainty scores tell the autonomous agent when the model should stop acting and ask for verification.

## Why does this matter to Genesis / autonomous facilities?

Autonomous facilities need more than optimizers. They need trustworthy pre-action gates that can combine model trust, machine limits, diagnostics, and operator memory before allowing control writes. Ghost Beam is a compact version of that trust layer.

## What would be required for real deployment?

- Facility-approved read-only EPICS adapter
- Facility-trained virtual diagnostic
- Verified calibration workflow
- Privacy-reviewed eLog ingestion
- Hardware-safety signoff for any write path
- Audit signing and access control
- Integration into an Osprey/MOAT/Genesis-style orchestration layer

## What is novel?

Ghost Beam combines virtual diagnostic trust, OOD detection, beam-profile semantics, eLog memory, hard limits, and deterministic action gating into one structured pre-write decision record. The novelty is the trust-and-memory layer around the twin, not a new optimizer.

## What does the Mission Report prove?

The Guided Demo Mission Report records the step-by-step experiment transcript, before/after OOD and trust metrics, the naive proposed action, top eLog evidence, calibration event, final decision, and synthetic-data disclosure. It is a judge-readable artifact generated from live backend interactions.
