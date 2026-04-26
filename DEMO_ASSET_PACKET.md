# Ghost Beam Demo Asset Packet

## 1. 90-Second Pitch

Ghost Beam is an accelerator trust agent. Autonomous optimizers can propose useful machine actions, but a facility still needs to know whether the digital twin is trustworthy, whether the machine is out of distribution, whether operator history warns against the move, and whether the action is safe to apply.

Ghost Beam sits between the optimizer and the machine. For every proposed action it runs a virtual diagnostic, checks uncertainty and OOD, retrieves relevant synthetic eLog memory, applies deterministic safety policy, and then approves, shrinks, blocks, requests calibration, or requires human review. The key demo is the Drifted Twin Test: a naive optimizer proposes a quadrupole correction, but Ghost Beam detects that the twin is outside its trusted region and finds eLog evidence that similar symptoms were caused by RF phase drift. It requests calibration, then approves a safer correction path.

The output is not just a UI state. Ghost Beam exports a Decision Record, human-readable Diagnosis, Mission Report, Benchmark, and Evidence Bundle. The live demo is synthetic and local-only for safety, while the platform also exposes read-only public-data adapters and provenance standards for future facility integration.

## 2. 3-Minute Pitch With Clicks

1. Open Ghost Beam.
   - "This is a local autonomous accelerator trust-agent prototype."
2. Click Health Check.
   - "This dry-run health check does not mutate the active session."
3. Show Live Scenario Mode.
   - "The scenario selector runs the selected case: Green Zone, Unsafe Write, Drifted Twin, eLog Conflict, or Calibration Recovery."
4. Click Guided: Drifted Twin Test.
   - "Guided mode is the fixed judging story."
5. Step to Naive Proposal.
   - "The optimizer proposes a quadrupole correction."
6. Step to Ghost Beam Evaluation.
   - "Ghost Beam checks twin trust, OOD, uncertainty, beam profile, hard limits, and eLog memory before allowing any write."
7. Show Gate Evidence.
   - "The eLog memory warns that a similar diffuse-beam case was RF phase drift, not a quadrupole fix."
8. Step to Calibration.
   - "Instead of trusting a stale twin, Ghost Beam requests calibration."
9. Step to Safer Correction.
   - "With trust improved, Ghost Beam approves a safer correction path."
10. Open Decision Record.
    - "The Diagnosis tab explains what happened in human language. The JSON tab is the machine-readable audit trail."
11. Run Benchmark.
    - "Across 50 synthetic trials, Ghost Beam prevented or modified 82% of naive actions and reduced projected beam loss from 0.1874 to 0.0206."
12. Export Evidence Bundle.
    - "This packages the Decision Record, Diagnosis, Mission Report, Benchmark, manifests, schema, and provenance metadata."
13. Open Data Sources & Provenance.
    - "The live demo is synthetic. External sources like BOOSTR and Fermilab BPM/IPM are read-only adapters/manifests and cannot write to hardware."

## 3. Exact Click Path

1. Start backend and frontend:
   - `powershell -ExecutionPolicy Bypass -File .\scripts\start_ghostbeam.ps1`
2. Open `http://127.0.0.1:5173/`.
3. Confirm topbar says `Accelerator trust agent.`
4. Click Health Check.
5. Confirm health check passes.
6. Confirm Mode says Live Scenario and Scenario says Green Zone.
7. Optional scenario sweep:
   - Green Zone -> Evaluate -> expected APPROVE or APPROVE_SMALL_STEP.
   - Unsafe Write -> Evaluate -> expected BLOCK.
   - Drifted Twin -> Evaluate -> expected REQUEST_CALIBRATION.
   - eLog Conflict -> Evaluate -> expected REQUIRE_HUMAN_REVIEW.
8. Click Guided: Drifted Twin Test.
9. If prompted, click Start Guided Demo.
10. Step through:
    - Nominal Baseline
    - Drift Appears
    - Naive Proposal
    - Ghost Beam Evaluation
    - Calibration
    - Safer Correction
    - Export Artifact
11. Open Decision Record.
12. Show Diagnosis tab.
13. Show What Ghost Beam Did timeline.
14. Show JSON tab briefly.
15. Generate Mission Report.
16. Run Benchmark.
17. Export Evidence Bundle.
18. Open Settings / Data Sources & Provenance.
19. Show Synthetic JAX Twin active, BOOSTR adapter-ready, Fermilab BPM/IPM manifest-ready, EPICS stubs disabled, RO-Crate/Frictionless/openPMD/WorkflowHub standards.

## 4. Backup Demo Path

If the guided demo UI fails:

1. Use Live Scenario Mode.
2. Select Drifted Twin.
3. Propose/evaluate the naive action.
4. Open Decision Record and show REQUEST_CALIBRATION.
5. Select Unsafe Write and show BLOCK.
6. Select eLog Conflict and show REQUIRE_HUMAN_REVIEW.
7. Run Benchmark.
8. Export Evidence Bundle.
9. Open `packaging/artifacts/ARTIFACTS_INDEX.md` and show current generated artifacts.

If the backend is slow:

1. Use screenshots under `docs/screenshots/`.
2. Show `packaging/artifacts/latest_benchmark.json`.
3. Show `packaging/artifacts/latest_mission_report.md`.
4. Show `packaging/artifacts/latest_evidence_bundle_response.json`.

## 5. Panic Recovery

Blank screen:

1. Stop frontend.
2. Restart with Vite force rebuild:
   ```powershell
   cd "D:\Building\Ghost Beam\frontend"
   npm run dev -- --host 127.0.0.1 --port 5173 --force
   ```
3. In the browser, use the boot fallback to clear local UI state if needed.

Backend offline:

1. Start backend:
   ```powershell
   cd "D:\Building\Ghost Beam\backend"
   $env:PYTHONPATH="D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend"
   python -m uvicorn ghostbeam.api.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Open `http://127.0.0.1:8000/health`.
3. Open `http://127.0.0.1:8000/docs`.

Full smoke:

```powershell
cd "D:\Building\Ghost Beam"
powershell -ExecutionPolicy Bypass -File .\scripts\run_smoke.ps1
```

## 6. Judge Q&A

### Is this real accelerator data?

No. The live demo uses synthetic accelerator-control data generated by Ghost Beam's local JAX digital twin. That is intentional for safety and repeatability.

### Why synthetic?

Because the project demonstrates the trust-gate architecture without touching real hardware, facility eLogs, live EPICS data, or operator-private records.

### Is this just Xopt?

No. Xopt-style tools propose optimized actions. Ghost Beam decides whether a proposed action is safe and trustworthy enough to apply.

### Is this just Osprey?

No. Osprey-style systems orchestrate plans and human gates. Ghost Beam is the local pre-action trust layer that evaluates uncertainty, OOD, eLog memory, hard limits, calibration state, and policy before a write.

### Is this just RAG?

No. eLog retrieval is one evidence source. The decision also uses virtual diagnostics, uncertainty, OOD scoring, beam-profile diagnostics, hard PV limits, calibration state, and deterministic policy.

### What makes it novel?

It combines digital-twin trust, operator memory, calibration awareness, and deterministic machine-action policy into an exportable Decision Record before an autonomous action reaches the accelerator.

### What is the national impact?

Scientific facilities will increasingly use AI-assisted operation. Ghost Beam shows a path to safer autonomy: measurable gating, evidence trails, calibration requests, and human review rather than blind optimizer writes.

### How would it connect to EPICS?

The active adapter is simulated. Future deployment would start with a facility-approved read-only EPICS Archiver integration, map approved PVs into Ghost Beam schemas, validate the virtual diagnostic, and keep writes disabled until hardware-safety review.

### Why BOOSTR?

BOOSTR is a public Fermilab Booster accelerator-control dataset. Ghost Beam does not bundle or auto-download it, but includes a read-only local-slice adapter path to show that the evidence layer can analyze public recorded accelerator-control traces.

### What does Ghost Beam do beyond stopping?

It gates. It may approve safe actions, approve smaller steps, request calibration, require human review, or block. In the Drifted Twin Test, it requests calibration and then supports a safer correction path.

## 7. Metrics To Quote

Latest packaging benchmark:

- 50 deterministic synthetic trials.
- 9 low-risk actions approved.
- 9 unsafe/hard-limit actions blocked.
- 16 calibration requests.
- 16 human-review escalations.
- 41 unsafe actions prevented.
- 82.0% of naive actions modified or blocked.
- Average projected beam loss reduced from 0.1874 to 0.0206.
- OOD calibration improvement: 9.7410 to 2.7410 average on calibration trials.

Scenario validation:

- Green Zone -> APPROVE.
- Unsafe Write -> BLOCK.
- Drifted Twin -> REQUEST_CALIBRATION.
- eLog Conflict -> REQUIRE_HUMAN_REVIEW.
- Calibration Recovery -> OOD improves after calibration.

Safety statement:

Ghost Beam is local-only, synthetic, and no-spend. It does not connect to real hardware, perform real EPICS writes, auto-download public datasets, use paid services, upload artifacts, or expose public tunnels.
