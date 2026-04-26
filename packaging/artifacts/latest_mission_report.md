# Ghost Beam Mission Report: Drifted Twin Test

Report ID: `GBR-20260426_162318`
Created: 2026-04-26T20:23:18Z

## Executive Summary

Ghost Beam blocked or held the naive quadrupole correction because the virtual diagnostic was outside its trusted envelope or operator memory warned against that action class. After one synthetic calibration measurement, Ghost Beam evaluated a smaller RF correction and preserved the audit trail as a backend mission-report artifact.

> Demo uses synthetic accelerator-control data generated from Ghost Beam's JAX digital twin. No live EPICS writes, real facility logs, or real accelerator hardware are used.

## Key Results

- Scenarios used: not recorded
- Initial OOD score: not recorded
- Naive action: not recorded
- Ghost Beam decision: not recorded
- Top eLog match: Diffuse beam spot after quad_2 drift (0.26947793996103264)
- Risk tags: quad_conflict, rf_phase_check, halo
- Post-calibration OOD score: not recorded
- Safer action: not recorded
- Final decision: not recorded

## Ghost Beam Diagnosis

Diagnosis summary was not provided.

### What Ghost Beam Did


## Guided Transcript

### 1. Nominal Baseline

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: L1 Transfer Line begins in a trusted operating region.

### 1. Drift Appears

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: The machine drifts outside the twin's familiar envelope.

### 1. Naive Proposal

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: Optimizer proposes a quadrupole correction.

### 1. Ghost Beam Evaluation

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: Ghost Beam checks uncertainty, OOD, eLog memory, and policy.

### 1. Calibration

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: Ghost Beam requests calibration before allowing a write.

### 1. Safer Correction

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: A smaller RF correction path is preferred after trust improves.

### 1. Export Artifact

- Endpoint: `not recorded`
- Scenario: not recorded
- Decision: not evaluated
- OOD: not recorded
- Trust: not recorded (not recorded)
- Top eLog: none
- Note: Decision Record, Diagnosis, Mission Report, and Evidence Bundle are exported.
