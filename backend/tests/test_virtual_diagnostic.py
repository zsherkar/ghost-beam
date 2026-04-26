import numpy as np

from ghostbeam.core.schemas import MachineSettings
from ghostbeam.diagnostics.virtual_diagnostic import get_default_diagnostic
from ghostbeam.physics.transfer_jax import generate_safe_signals


def nominal_settings():
    return MachineSettings(
        quad_1=0.36,
        quad_2=-0.26,
        steer_x=0.0,
        steer_y=0.0,
        rf_phase=0.45,
        rf_amplitude=1.0,
    )


def test_training_like_state_returns_green():
    diagnostic = get_default_diagnostic()
    settings = nominal_settings()
    result = diagnostic.predict(settings, generate_safe_signals(settings))
    assert result.trust_state == "GREEN"


def test_far_out_state_returns_red():
    diagnostic = get_default_diagnostic()
    settings = MachineSettings(
        quad_1=1.9,
        quad_2=-1.85,
        steer_x=0.85,
        steer_y=-0.8,
        rf_phase=8.5,
        rf_amplitude=1.42,
    )
    result = diagnostic.predict(settings, generate_safe_signals(settings, drift=0.4), drift=0.4)
    assert result.trust_state == "RED"


def test_prediction_values_are_finite():
    diagnostic = get_default_diagnostic()
    result = diagnostic.predict(nominal_settings())
    values = [
        result.predicted_quality,
        result.predicted_size_x,
        result.predicted_size_y,
        result.predicted_beam_loss,
        result.uncertainty,
        result.ood_score,
    ]
    assert np.isfinite(values).all()


def test_increased_drift_raises_ood_or_uncertainty():
    diagnostic = get_default_diagnostic()
    settings = nominal_settings()
    base = diagnostic.predict(settings, drift=0.0)
    drifted = diagnostic.predict(settings, drift=1.0)
    assert drifted.ood_score > base.ood_score or drifted.uncertainty > base.uncertainty


def test_calibration_reduces_trust_risk_for_drifted_region():
    diagnostic = get_default_diagnostic()
    settings = nominal_settings()
    before = diagnostic.predict(settings, drift=1.35, calibration_weight=0.0)
    after = diagnostic.predict(settings, drift=1.35, calibration_weight=1.0)
    assert before.trust_state == "RED"
    assert after.ood_score < before.ood_score
    assert after.uncertainty < before.uncertainty
