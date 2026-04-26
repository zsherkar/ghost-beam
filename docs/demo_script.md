# Demo Script

## 90-Second Pitch

This is Ghost Beam, a trust-and-memory gate for autonomous accelerator agents.

Scientific facilities are moving toward AI-assisted control. Digital twins can estimate hidden beam quality, optimizers can propose machine settings, and LLM agents can orchestrate workflows. But there is a dangerous gap: a digital twin can be confidently wrong when an aging machine drifts outside its training data, and decades of operator knowledge are buried in unstructured eLogs.

Ghost Beam sits between the AI agent and the machine. Before any control action is approved, it checks the virtual diagnostic's uncertainty, detects out-of-distribution machine states, retrieves similar historical eLog incidents, and applies deterministic safety rules.

In this demo, a naive optimizer proposes increasing a quadrupole to improve a diffuse beam. Ghost Beam blocks or holds that action because the twin is uncertain and a similar eLog warns that this move previously worsened beam halo. It requests a calibration measurement instead. After calibration, uncertainty/OOD risk drops and Ghost Beam approves a smaller RF correction.

The principle is simple: autonomous science should not just know how to act. It should know when not to act.

## 3-Minute Guided Demo

1. Start the backend and frontend.
2. Click **Demo Health Check**. Say: "This verifies the local backend, scenarios, policy gate, calibration path, eLog conflict path, and export path in a non-mutating dry-run session before we present."
3. Click **Judge Demo Mode**. Say: "This switches to dark presentation lighting and opens the guided experiment controller."
4. Step 1, **Nominal Baseline**: show `green_zone`, trusted twin, green beam, approved safe trim.
5. Step 2, **Drift Appears**: show `drifted_twin`, diffuse/off-center beam profile, high OOD score, calibration pressure.
6. Step 3, **Naive Proposal**: show the proposed `quad_2` increase and highlighted quadrupole. Say: "A naive optimizer would apply this immediately."
7. Step 4, **Ghost Beam Evaluation**: run evaluation. Show `REQUEST_CALIBRATION` or human-review behavior, Trust Gate, and Gate Evidence.
8. Point to the top eLog match. Say: "The retrieved synthetic eLog says similar symptoms were caused by RF phase drift and increasing quad_2 worsened halo."
9. Step 5, **Calibration**: apply calibration. Show OOD dropping.
10. Step 6, **Safer Correction**: Ghost Beam evaluates a smaller RF correction and approves a small step.
11. Step 7, **Export Artifact**: open the Decision Record drawer, show the Diagnosis tab and "What Ghost Beam Did" timeline, then generate the backend-persisted Mission Report and download/copy the report.

## Platform Realism Talking Points

- Active adapter: Simulated JAX Twin.
- EPICS is present only as a disabled stub; real hardware writes are off.
- Mission Reports are persisted locally as backend artifacts.
- Decision Records have a JSON schema and validation status in session exports.
- Synthetic data provenance is documented in `backend/data/synthetic_data_manifest.json`.

## Fallback Narration If UI Fails

Run:

```powershell
cd backend
$env:PYTHONPATH='D:\Building\Ghost Beam\backend\.deps;D:\Building\Ghost Beam\backend'
python -m pytest tests -q
```

Then narrate:

- The backend tests cover physics, diagnostics, OOD, eLog retrieval, policy gate, API, and scenario integration.
- The five scenario outcomes are deterministic:
  - green safe trim approves
  - unsafe write blocks
  - drifted twin requests calibration
  - calibration reduces OOD
  - eLog conflict requires human review
- The UI is a frontend over those same `/experiment/*` endpoints, not a static animation.
