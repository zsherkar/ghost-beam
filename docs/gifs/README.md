# Ghost Beam GIF Capture Plan

Do not add GIF links to `README.md` until the files exist. This directory is a capture plan and placeholder target.

Recommended capture settings:

- Browser: external desktop browser, not the narrow in-app preview.
- Frontend: `http://127.0.0.1:5173/`
- Backend: `http://127.0.0.1:8000/`
- Viewport: `1440x900` for README, `1920x1080` for presentation.
- Theme: dark for the primary hero flow; light for data-source/theme parity.
- Keep the browser toolbar/bookmark bar hidden if possible.
- Keep each GIF under 10 to 20 seconds for GitHub readability.

## 1. `guided_drifted_twin_test.gif`

Capture Guided Demo from Naive Proposal through Ghost Beam Evaluation, Calibration, and Safer Correction.

Caption: Ghost Beam catches a stale/drifted twin, retrieves eLog evidence, requests calibration, and supports a safer correction path.

## 2. `decision_record_diagnosis.gif`

Capture the Decision Record drawer, Diagnosis tab, What Ghost Beam Did timeline, Evidence tab, and JSON tab.

Caption: Every gate decision exports both human-readable diagnosis and machine-readable audit data.

## 3. `benchmark_run.gif`

Capture the Benchmark panel running the naive-vs-Ghost-Beam benchmark and showing summary metrics.

Caption: The benchmark quantifies how often Ghost Beam blocks, modifies, calibrates, or escalates risky actions.

## 4. `evidence_bundle_export.gif`

Capture the Evidence Bundle export action and success/filename confirmation.

Caption: Evidence Bundle packages Decision Record, Diagnosis, Mission Report, benchmark, manifests, schema, and provenance metadata.

## 5. `data_sources_panel.gif`

Capture Settings to Data Sources & Provenance, including active synthetic sources, BOOSTR, Fermilab BPM/IPM, EPICS stubs, and standards.

Caption: Ghost Beam separates the live synthetic demo from read-only public-data adapters, disabled facility stubs, and provenance standards.

## README Policy

Only embed a GIF in `README.md` after the exact file exists under `docs/gifs/`.

Recommended Markdown once generated:

```markdown
![Guided Drifted Twin Test](docs/gifs/guided_drifted_twin_test.gif)
```
