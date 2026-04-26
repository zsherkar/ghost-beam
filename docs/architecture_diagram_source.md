# Ghost Beam Architecture Diagram Source

These Mermaid diagrams are designed to be pasted into a README, GitHub issue, slide generator, or documentation site.

## 1. System Architecture

```mermaid
flowchart LR
    U["User / Optimizer"] --> UI["Ghost Beam UI<br/>React + TypeScript + R3F"]
    UI --> API["FastAPI Backend"]
    API --> RUN["Stateful Experiment Runner"]
    RUN --> TWIN["Synthetic JAX Digital Twin"]
    RUN --> VD["Virtual Diagnostic"]
    VD --> UQ["Uncertainty + OOD Scoring"]
    RUN --> VISION["Beam Profile / Vision Diagnostic"]
    RUN --> ELOG["Synthetic eLog Memory<br/>TF-IDF Retrieval"]
    RUN --> POLICY["Deterministic Policy Gate"]
    UQ --> POLICY
    VISION --> POLICY
    ELOG --> POLICY
    POLICY --> DEC["Decision Record JSON"]
    POLICY --> DX["Human Diagnosis Markdown"]
    POLICY --> REPORT["Mission Report"]
    POLICY --> BUNDLE["Evidence Bundle"]
```

## 2. Core vs External Data Architecture

```mermaid
flowchart TB
    subgraph CORE["Core / Manual / Live Demo Layer"]
        SJT["Synthetic JAX Twin<br/>active"]
        SCEN["Local Scenarios<br/>green, drifted, conflict, unsafe, recovery"]
        GUIDE["Guided Drifted Twin Test"]
        BENCH["Naive-vs-Ghost-Beam Benchmark"]
        ART["Decision Record + Diagnosis + Mission Report + Evidence Bundle"]
    end

    subgraph PUBLIC["External Public Data Layer"]
        BOOSTR["BOOSTR Adapter<br/>local slice only"]
        BPM["Fermilab BPM/IPM Manifest<br/>local slice future path"]
        PDR["PublicDataAnalysisRecord<br/>read-only"]
    end

    subgraph FACILITY["Facility Connector Layer"]
        EPICS["EPICS Archiver Stub<br/>disabled, read-only shape"]
        PYARCH["pyarchappl-compatible Stub<br/>disabled"]
    end

    subgraph PROV["Artifact / Provenance / Standards Layer"]
        SCHEMA["Decision Record Schema"]
        FRICTION["Frictionless Validation Status"]
        ROC["RO-Crate Evidence Metadata"]
        OPENPMD["openPMD Compatibility Manifest"]
        WF["WorkflowHub Compatibility Manifest"]
    end

    CORE --> PROV
    PUBLIC --> PROV
    FACILITY --> PROV
    BOOSTR --> PDR
    BPM --> PDR
```

## 3. Decision Flow

```mermaid
flowchart TD
    A["Proposed Action"] --> B["Hard PV Limit Check"]
    B -->|violation| BLOCK["BLOCK"]
    B -->|within limits| C["Virtual Diagnostic"]
    C --> D["Uncertainty + OOD"]
    D -->|outside trust envelope| CAL["REQUEST_CALIBRATION"]
    D -->|trusted enough| E["eLog Memory Retrieval"]
    E -->|conflicting evidence| REVIEW["REQUIRE_HUMAN_REVIEW"]
    E -->|no conflict| F["Calibration Freshness"]
    F -->|stale or missing| CAL
    F -->|fresh| G["Policy Gate"]
    G --> APPROVE["APPROVE"]
    G --> SMALL["APPROVE_SMALL_STEP"]
    G --> REVIEW
    G --> BLOCK
```

## 4. Guided Drifted Twin Test Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as Ghost Beam UI
    participant API as FastAPI Backend
    participant Twin as JAX Twin
    participant ELog as eLog Memory
    participant Gate as Policy Gate
    participant Artifacts

    User->>UI: Start Guided Drifted Twin Test
    UI->>API: POST /experiment/start drifted_twin
    API->>Twin: Initialize drifted machine state
    User->>UI: Step to Naive Proposal
    UI->>API: POST /experiment/propose
    User->>UI: Step to Ghost Beam Evaluation
    UI->>API: POST /experiment/evaluate
    API->>Twin: Predict beam response
    API->>ELog: Retrieve similar synthetic operator entries
    API->>Gate: Evaluate hard limits, OOD, eLog risk, calibration
    Gate-->>API: REQUEST_CALIBRATION
    API-->>UI: Decision, evidence, diagnosis state
    User->>UI: Apply Calibration
    UI->>API: POST /experiment/calibrate
    API->>Twin: Reduce OOD / refresh trust
    User->>UI: Safer Correction
    UI->>API: Evaluate safer RF correction
    Gate-->>API: APPROVE_SMALL_STEP or APPROVE
    User->>UI: Export Artifact
    UI->>API: POST /experiment/report/generate
    UI->>API: POST /experiment/evidence-bundle
    API->>Artifacts: Persist report and evidence bundle
```

## 5. Evidence Bundle Composition

```mermaid
flowchart LR
    SESSION["Session Export"] --> BUNDLE["Evidence Bundle"]
    DECISION["Decision Record JSON"] --> BUNDLE
    DIAG["Human Diagnosis Markdown"] --> BUNDLE
    REPORT["Mission Report JSON/MD"] --> BUNDLE
    BENCH["Benchmark Result"] --> BUNDLE
    MANIFEST["Synthetic Data Manifest"] --> BUNDLE
    SOURCES["Data Sources Registry"] --> BUNDLE
    PUBLIC["BOOSTR + BPM/IPM Manifests"] --> BUNDLE
    SCHEMA["Decision Record Schema"] --> BUNDLE
    ROC["RO-Crate Metadata"] --> BUNDLE
    VALID["Frictionless Validation Status"] --> BUNDLE
    STANDARDS["openPMD + WorkflowHub Manifests"] --> BUNDLE
```

## 6. Safety Boundary Diagram

```mermaid
flowchart TD
    UI["Ghost Beam UI"] --> SIM["SimulatedEPICS Adapter<br/>active"]
    SIM --> SYN["Synthetic JAX Twin"]
    UI -. no live connection .-> EPICS["EPICS Archiver Stub<br/>disabled"]
    UI -. no live connection .-> PUBLIC["Public Dataset Adapters<br/>local slice only"]
    PUBLIC --> ANALYSIS["Read-only Analysis<br/>writes_allowed=false"]
    EPICS --> STATUS["Not configured<br/>writes_allowed=false"]
    SYN --> SAFE["Simulated writes only after policy approval"]
```
