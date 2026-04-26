import numpy as np

from ghostbeam.core.schemas import MachineSettings
from ghostbeam.physics.transfer_jax import (
    drift_matrix,
    generate_beam_image,
    generate_beam_truth,
    gradient_suggestion,
    propagate,
    settings_after_delta,
    thin_quad_matrix,
)


def nominal_settings():
    return MachineSettings(
        quad_1=0.35,
        quad_2=-0.25,
        steer_x=0.0,
        steer_y=0.0,
        rf_phase=0.4,
        rf_amplitude=1.0,
    )


def test_drift_length_zero_identity_like():
    matrix = np.asarray(drift_matrix(0.0), dtype=float)
    assert np.allclose(matrix, np.eye(5))


def test_quadrupole_changes_focusing():
    identity = np.eye(5)
    quad = np.asarray(thin_quad_matrix(0.7), dtype=float)
    assert not np.allclose(identity, quad)
    assert quad[1, 0] < 0
    assert quad[3, 2] > 0


def test_propagate_returns_finite_values_and_quality_range():
    result = propagate(nominal_settings())
    assert all(np.isfinite(value) for value in result.values())
    assert 0.0 <= result["beam_quality"] <= 1.0


def test_gradient_suggestion_improves_off_optimum_state():
    settings = MachineSettings(
        quad_1=-0.15,
        quad_2=0.25,
        steer_x=0.12,
        steer_y=-0.08,
        rf_phase=-0.6,
        rf_amplitude=0.93,
    )
    before = generate_beam_truth(settings).beam_quality
    suggestion = gradient_suggestion(settings)
    after_settings = settings_after_delta(settings, suggestion)
    after = generate_beam_truth(after_settings).beam_quality
    assert after > before


def test_drift_changes_optimum():
    settings = nominal_settings()
    no_drift = generate_beam_truth(settings, drift=0.0).beam_quality
    drifted = generate_beam_truth(settings, drift=1.1).beam_quality
    assert drifted < no_drift


def test_generated_beam_image_shape_and_finite():
    image = generate_beam_image(nominal_settings(), size=96)
    assert image.shape == (96, 96)
    assert np.isfinite(image).all()
    assert 0.0 <= float(image.min()) <= float(image.max()) <= 1.0
