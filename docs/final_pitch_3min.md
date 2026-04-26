# 3-Minute Demo Script

## 0:00 - 0:30

"This is Ghost Beam, an accelerator trust agent. It gates autonomous accelerator actions using virtual diagnostic trust, uncertainty, OOD detection, beam-profile vision, eLog memory, hard PV limits, and calibration status."

Click **Judge Demo Mode**.

## 0:30 - 0:50

Click **Health Check**.

"Before a live demo, Ghost Beam runs a non-mutating dry-run health check. It verifies scenarios, policy decisions, calibration, eLog conflict, benchmark/export readiness, and does not disturb the current experiment session."

## 0:50 - 1:40

Run **Guided Drifted Twin Test**.

Move through:

1. Nominal Baseline: "The twin is trusted."
2. Drift Appears: "The beam becomes diffuse and OOD increases."
3. Naive Proposal: "A naive optimizer proposes increasing quad_2."
4. Ghost Beam Evaluation: "Ghost Beam checks uncertainty and finds eLog evidence that similar symptoms came from RF phase drift."

## 1:40 - 2:15

Apply **Calibration**, then **Safer Correction**.

"Ghost Beam requests a calibration measurement, then approves a smaller RF correction after the trust envelope improves."

## 2:15 - 2:40

Generate **Mission Report** and open **Decision Record**.

"The Diagnosis tab explains what happened in plain English, the JSON tab is machine-readable, and both are locally persisted or exportable. This is not an LLM vibe check; the gate is deterministic."

## 2:40 - 3:00

Run **Benchmark**, then export **Evidence Bundle**.

"Across deterministic synthetic trials, Ghost Beam shows measurable utility: it allows safe actions, blocks hard-limit violations, requests calibration for drifted states, and catches eLog conflicts. The evidence bundle contains the report, benchmark, schema, manifest, platform status, and synthetic-data disclosure."
