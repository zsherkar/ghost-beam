# Ghost Beam CAD Notes

The MVP is designed to work without generated CAD assets. The frontend renders procedural React Three Fiber geometry for:

- quadrupole magnets
- RF cavity
- BPM rings
- OTR diagnostic screen
- beam pipe and animated beam path

The prompts in `cad/prompts/` are prepared for a future text-to-cad attempt using the explicitly requested open-source project at `https://github.com/earthtojake/text-to-cad`.

For the hackathon MVP, CAD generation is optional and non-blocking. If generated `.glb` assets are produced later, copy them into `frontend/public/models/` using these names:

- `quadrupole.glb`
- `rf_cavity.glb`
- `bpm.glb`
- `otr_screen.glb`

The app continues to work when those files are absent.
