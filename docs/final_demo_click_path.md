# Final Demo Click Path

1. Start backend and frontend:
   - `.\scripts\start_ghostbeam.ps1`
   - open `http://127.0.0.1:5173`
2. Confirm topbar says `Accelerator trust agent.`
3. Click **Judge Demo Mode**.
4. Click **Health Check**.
   - Say: "This is a non-mutating dry-run check."
5. Start **Guided Drifted Twin Test**.
6. Step to **Nominal Baseline**.
   - Show trusted green state.
7. Step to **Drift Appears**.
   - Show elevated OOD/trust risk.
8. Step to **Naive Proposal**.
   - Show naive `quad_2` correction.
9. Step to **Ghost Beam Evaluation**.
   - Show Trust Gate and Gate Evidence.
10. Step to **Calibration**.
    - Apply calibration and show OOD improvement.
11. Step to **Safer Correction**.
    - Apply only if Ghost Beam approves or approves small step.
12. Step to **Export Artifact**.
    - Open DecisionRecord JSON.
13. Click **Generate Mission Report**.
    - Confirm report source is backend artifact.
14. Click **Benchmark**.
    - Run benchmark and show naive-vs-Ghost-Beam metrics.
15. Click **Evidence Bundle**.
    - Export the judge-ready evidence bundle.
16. Optional fallback: click **Load Replay**.
    - Say: "This is a replay artifact, not a live backend action."
