from __future__ import annotations

import math
from typing import Any

import numpy as np

try:
    import jax
    import jax.numpy as jnp

    JAX_AVAILABLE = True
except Exception:  # pragma: no cover - exercised only when JAX is absent
    jax = None
    jnp = np
    JAX_AVAILABLE = False

from ghostbeam.core.schemas import BeamTruth, MachineSettings, SafeSignals
from ghostbeam.physics.beam_state import settings_to_vector, vector_to_settings


def _array(values: Any):
    return jnp.array(values, dtype=jnp.float32)


def drift_matrix(length: float):
    return _array(
        [
            [1.0, length, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, length, 0.0],
            [0.0, 0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 1.0],
        ]
    )


def thin_quad_matrix(k: float):
    return _array(
        [
            [1.0, 0.0, 0.0, 0.0, 0.0],
            [-k, 1.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, k, 1.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 1.0],
        ]
    )


def steer_kick(dxprime: float, dyprime: float):
    return _array([0.0, dxprime, 0.0, dyprime, 0.0])


def rf_perturbation(phase: float, amplitude: float):
    phase_rad = phase * math.pi / 180.0
    return 0.04 * (amplitude - 1.0) + 0.015 * jnp.sin(phase_rad)


def drifted_target(drift: float):
    return _array([0.35 + 0.18 * drift, -0.25 - 0.22 * drift, 0.02 * drift, -0.02 * drift, 0.4 + 1.4 * drift, 1.0 + 0.04 * drift])


def _initial_state(drift: float):
    return _array([0.018 * drift, 0.003 * drift, -0.014 * drift, -0.002 * drift, 0.0])


def propagate_vector(settings_vector, drift: float = 0.0):
    quad_1, quad_2, steer_x, steer_y, rf_phase, rf_amplitude = settings_vector
    state = _initial_state(drift)
    state = drift_matrix(0.6) @ state
    state = thin_quad_matrix(quad_1) @ state
    state = drift_matrix(0.35) @ state
    state = state + steer_kick(0.012 * steer_x, 0.012 * steer_y)
    state = drift_matrix(0.45) @ state
    state = thin_quad_matrix(quad_2) @ state
    state = drift_matrix(0.75) @ state
    state = state.at[4].add(rf_perturbation(rf_phase - 1.4 * drift, rf_amplitude))
    state = drift_matrix(0.25) @ state
    return state


def _beam_metrics_from_vector(settings_vector, drift: float = 0.0):
    state = propagate_vector(settings_vector, drift)
    target = drifted_target(drift)
    delta = settings_vector - target
    x, xp, y, yp, energy_delta = state

    optics_penalty_x = 0.08 * delta[0] ** 2 + 0.05 * delta[1] ** 2
    optics_penalty_y = 0.05 * delta[0] ** 2 + 0.08 * delta[1] ** 2
    beam_size_x = 0.13 + optics_penalty_x + 0.7 * jnp.abs(x) + 0.18 * jnp.abs(energy_delta)
    beam_size_y = 0.13 + optics_penalty_y + 0.7 * jnp.abs(y) + 0.18 * jnp.abs(energy_delta)

    offset_penalty = 18.0 * (x**2 + y**2) + 4.0 * (xp**2 + yp**2)
    size_penalty = 2.3 * ((beam_size_x - 0.14) ** 2 + (beam_size_y - 0.14) ** 2)
    settings_penalty = 0.17 * jnp.sum(delta * delta)
    hard_push = jnp.maximum(0.0, jnp.abs(settings_vector[0]) - 1.7) ** 2
    hard_push += jnp.maximum(0.0, jnp.abs(settings_vector[1]) - 1.7) ** 2
    hard_push += jnp.maximum(0.0, jnp.abs(settings_vector[2]) - 0.85) ** 2
    hard_push += jnp.maximum(0.0, jnp.abs(settings_vector[3]) - 0.85) ** 2
    hard_push += jnp.maximum(0.0, jnp.abs(settings_vector[4]) - 8.5) ** 2 * 0.15
    hard_push += jnp.maximum(0.0, jnp.abs(settings_vector[5] - 1.0) - 0.38) ** 2 * 3.0

    beam_loss = jnp.clip(
        0.02
        + 0.9 * jnp.maximum(0.0, beam_size_x - 0.34)
        + 0.9 * jnp.maximum(0.0, beam_size_y - 0.34)
        + 0.05 * hard_push
        + 0.12 * jnp.abs(energy_delta),
        0.0,
        0.95,
    )
    quality = jnp.exp(-(size_penalty + offset_penalty + settings_penalty + 2.4 * beam_loss))
    quality = jnp.clip(quality, 0.0, 1.0)
    emittance_proxy = jnp.sqrt(beam_size_x * beam_size_y) * (1.0 + beam_loss)
    return state, quality, beam_size_x, beam_size_y, beam_loss, emittance_proxy


def objective(settings_vector, drift: float = 0.0) -> float:
    vector = _array(settings_vector)
    _, quality, _, _, _, _ = _beam_metrics_from_vector(vector, drift)
    return quality


def propagate(settings: MachineSettings, drift: float = 0.0) -> dict[str, float]:
    vector = _array(settings_to_vector(settings))
    state, quality, size_x, size_y, loss, emittance = _beam_metrics_from_vector(vector, drift)
    state_np = np.asarray(state, dtype=float)
    return {
        "x": float(state_np[0]),
        "x_prime": float(state_np[1]),
        "y": float(state_np[2]),
        "y_prime": float(state_np[3]),
        "delta": float(state_np[4]),
        "beam_quality": float(quality),
        "beam_size_x": float(size_x),
        "beam_size_y": float(size_y),
        "beam_loss": float(loss),
        "emittance_proxy": float(emittance),
    }


def generate_safe_signals(settings: MachineSettings, drift: float = 0.0) -> SafeSignals:
    metrics = propagate(settings, drift)
    charge = float(np.clip(0.78 + 0.06 * (settings.rf_amplitude - 1.0) - 0.16 * metrics["beam_loss"], 0.05, 1.2))
    return SafeSignals(
        bpm_x_1=metrics["x"] * 0.55 + 0.012 * drift,
        bpm_y_1=metrics["y"] * 0.55 - 0.01 * drift,
        bpm_x_2=metrics["x"],
        bpm_y_2=metrics["y"],
        charge=charge,
        temperature=31.0 + 1.8 * abs(drift) + 0.8 * abs(settings.quad_1) + 0.7 * abs(settings.quad_2),
        rf_readback=settings.rf_amplitude + 0.015 * drift - 0.002 * settings.rf_phase,
        beam_current_proxy=charge * (1.0 - metrics["beam_loss"]),
    )


def generate_beam_truth(settings: MachineSettings, drift: float = 0.0) -> BeamTruth:
    metrics = propagate(settings, drift)
    return BeamTruth(
        beam_quality=metrics["beam_quality"],
        beam_size_x=metrics["beam_size_x"],
        beam_size_y=metrics["beam_size_y"],
        beam_loss=metrics["beam_loss"],
        emittance_proxy=metrics["emittance_proxy"],
    )


def _seed_from_settings(settings: MachineSettings, drift: float, size: int) -> int:
    values = settings_to_vector(settings) + [drift, float(size)]
    return int(abs(sum((i + 1) * v * 1000.0 for i, v in enumerate(values)))) % (2**32 - 1)


def generate_beam_image(settings: MachineSettings, drift: float = 0.0, size: int = 96) -> np.ndarray:
    metrics = propagate(settings, drift)
    coords = np.linspace(-1.0, 1.0, size)
    xx, yy = np.meshgrid(coords, coords)
    cx = float(np.clip(metrics["x"] * 5.0, -0.9, 0.9))
    cy = float(np.clip(metrics["y"] * 5.0, -0.9, 0.9))
    sx = float(np.clip(metrics["beam_size_x"] * 1.15, 0.05, 0.55))
    sy = float(np.clip(metrics["beam_size_y"] * 1.15, 0.05, 0.55))
    image = np.exp(-(((xx - cx) ** 2) / (2 * sx**2) + ((yy - cy) ** 2) / (2 * sy**2)))

    if metrics["beam_loss"] > 0.12 or settings.rf_amplitude > 1.18:
        radius = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        halo = np.exp(-((radius - 0.52) ** 2) / (2 * 0.09**2))
        image += 0.28 * halo * min(1.0, 2.0 * metrics["beam_loss"] + 0.2)

    rng = np.random.default_rng(_seed_from_settings(settings, drift, size))
    image += rng.normal(0.0, 0.008, image.shape)
    image = np.clip(image, 0.0, None)
    max_value = float(image.max()) or 1.0
    return np.clip(image / max_value, 0.0, 1.0).astype(np.float32)


def gradient_suggestion(settings: MachineSettings, drift: float = 0.0) -> dict[str, float]:
    vector = _array(settings_to_vector(settings))
    if JAX_AVAILABLE:
        gradient = jax.grad(lambda v: objective(v, drift))(vector)
        gradient_np = np.asarray(gradient, dtype=float)
    else:  # pragma: no cover
        base = float(objective(vector, drift))
        gradient_np = np.zeros(6, dtype=float)
        for i in range(6):
            probe = np.asarray(vector, dtype=float).copy()
            probe[i] += 1e-3
            gradient_np[i] = (float(objective(probe, drift)) - base) / 1e-3

    step_limits = np.array([0.08, 0.08, 0.04, 0.04, 0.35, 0.025])
    step = np.clip(0.22 * gradient_np, -step_limits, step_limits)
    names = ("quad_1", "quad_2", "steer_x", "steer_y", "rf_phase", "rf_amplitude")
    return {name: float(value) for name, value in zip(names, step) if abs(value) > 1e-5}


def settings_after_delta(settings: MachineSettings, delta: dict[str, float]) -> MachineSettings:
    vector = np.asarray(settings_to_vector(settings), dtype=float)
    names = ("quad_1", "quad_2", "steer_x", "steer_y", "rf_phase", "rf_amplitude")
    for i, name in enumerate(names):
        vector[i] += float(delta.get(name, 0.0))
    return vector_to_settings(vector.tolist())
