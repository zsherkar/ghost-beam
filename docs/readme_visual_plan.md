# README Visual Plan

This plan maps existing screenshots and future GIFs to the final GitHub README and presentation.

## Screenshot Order for README

1. `docs/screenshots/final_guided_inline_dark.png`
   - Use as the hero image.
   - Caption: Ghost Beam guided Drifted Twin Test with the 3D twin visible and guided controls docked.
2. `docs/screenshots/final_evidence_drawer.png`
   - Use in the Screenshots and Evidence Artifacts sections.
   - Caption: Evidence drawer showing eLog memory and event history behind a gate decision.
3. `docs/screenshots/final_guided_inline_light.png`
   - Use in the Screenshots section for light-theme parity.
   - Caption: Light theme with Guided Drifted Twin Test controls and trust panels.

Additional QA/proof screenshots may remain in `docs/screenshots/`, but the final README should embed only the three captured release visuals above unless more screenshots are intentionally captured.

## GIF Capture Plan

GIF instructions live in [docs/gifs/README.md](gifs/README.md).

Recommended final GIF order:

1. `docs/gifs/guided_drifted_twin_test.gif`
2. `docs/gifs/decision_record_diagnosis.gif`
3. `docs/gifs/benchmark_run.gif`
4. `docs/gifs/evidence_bundle_export.gif`
5. `docs/gifs/data_sources_panel.gif`

Do not embed these GIFs in the README until the files exist.

## Slide Visuals

Suggested slide sequence:

1. Hero/problem: `final_guided_inline_dark.png`
2. Architecture: Mermaid System Architecture from `docs/architecture_diagram_source.md`
3. Decision flow: Mermaid Decision Flow
4. Drifted Twin Test: `final_guided_inline_light.png` or future `guided_drifted_twin_test.gif`
5. Evidence/artifacts: `final_evidence_drawer.png`
6. Benchmark: metrics from `packaging/artifacts/latest_benchmark.json`
7. Data sources: `inapp_light_recorded_fixture.png` or future `data_sources_panel.gif`
8. Safety/legal: concise local-only / no hardware / all-rights-reserved slide

## Remaining Visual Gaps

- Capture a full-width `diagnosis_tab.png`.
- Capture a full-width `benchmark_panel.png`.
- Capture a full-width `data_sources_panel.png`.
- Capture final GIFs listed above.
- Optional: capture a clean 1920x1080 projector version of the hero.

## README Media Path Rules

- Use repo-relative paths only.
- Do not use absolute Windows paths.
- Do not link to missing GIFs.
- Do not link to external image hosting.
- Prefer PNG screenshots under `docs/screenshots/`.
