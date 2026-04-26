# 90-Second Pitch

Ghost Beam is an accelerator trust agent. It sits between an autonomous optimizer and a scientific facility, and decides whether a proposed machine action is trustworthy before it touches the beam.

The problem is that future autonomous facilities will rely on digital twins, virtual diagnostics, and AI agents, but twins can be confidently wrong when the real machine drifts. Also, decades of operator knowledge are buried in eLogs. A naive optimizer may see a diffuse beam and immediately push a quadrupole. Ghost Beam checks uncertainty, out-of-distribution risk, beam-profile evidence, hard PV limits, calibration status, and similar operator eLogs first.

In the Drifted Twin Test, the optimizer proposes a quadrupole correction. Ghost Beam sees the twin is outside its trust envelope and retrieves synthetic eLog evidence warning that similar symptoms were caused by RF phase drift. It requests calibration instead of applying the risky action. After calibration lowers OOD risk, Ghost Beam approves a safer RF correction and exports a Decision Record, human-readable Diagnosis, Mission Report, benchmark result, and evidence bundle.

The core idea is simple: autonomous science should not just know how to act. It should know when not to act.
