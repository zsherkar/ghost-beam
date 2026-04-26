# Ghost Beam Synthetic Data

This directory contains only synthetic accelerator-control data for the local Ghost Beam MVP.

The demo data are generated from Ghost Beam's JAX transfer-matrix digital twin and local scenario fixtures. The eLog corpus is synthetic operator-memory text created for the hackathon demo.

No real ALS, SLAC, Fermilab, Jefferson Lab, EPICS, camera, beamline, or facility eLog data are included.

## Contents

- `elogs.csv` - synthetic operator eLog corpus used by TF-IDF retrieval.
- `scenarios/*.yaml` - synthetic initial conditions for the five demo scenarios.
- `synthetic_data_manifest.json` - formal provenance manifest for judges and future platform adapters.
- `replays/drifted_twin_replay.json` - static replay artifact describing the Drifted Twin Test sequence.

## Safety Boundary

Ghost Beam does not connect to real accelerator hardware in this MVP. The EPICS adapter is a stub, real hardware writes are disabled, and all UI/API flows operate on simulated state.
