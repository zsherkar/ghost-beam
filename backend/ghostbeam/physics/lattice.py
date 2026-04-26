from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LatticeElement:
    name: str
    kind: str
    length: float


SYNTHETIC_INJECTOR_LATTICE = [
    LatticeElement("gun_to_rf", "drift", 0.6),
    LatticeElement("quad_1", "thin_quad", 0.0),
    LatticeElement("rf_to_steerer", "drift", 0.35),
    LatticeElement("corrector", "steerer", 0.0),
    LatticeElement("steerer_to_quad_2", "drift", 0.45),
    LatticeElement("quad_2", "thin_quad", 0.0),
    LatticeElement("quad_2_to_bpm", "drift", 0.75),
    LatticeElement("rf_cavity", "rf", 0.0),
    LatticeElement("bpm_to_screen", "drift", 0.25),
]


def lattice_summary() -> list[dict[str, float | str]]:
    return [element.__dict__ for element in SYNTHETIC_INJECTOR_LATTICE]
