from __future__ import annotations

from functools import lru_cache

import numpy as np

from ghostbeam.core.schemas import MachineSettings, SafeSignals, VirtualDiagnosticResult
from ghostbeam.diagnostics.ood import StandardizedOODScorer
from ghostbeam.diagnostics.uq import ensemble_mean_and_uncertainty
from ghostbeam.physics.synthetic_injector import sample_operating_settings
from ghostbeam.physics.transfer_jax import generate_beam_truth, generate_safe_signals

try:
    from sklearn.ensemble import RandomForestRegressor

    SKLEARN_AVAILABLE = True
except Exception:  # pragma: no cover
    RandomForestRegressor = None
    SKLEARN_AVAILABLE = False


FEATURE_NAMES = (
    "quad_1",
    "quad_2",
    "steer_x",
    "steer_y",
    "rf_phase",
    "rf_amplitude",
    "bpm_x_1",
    "bpm_y_1",
    "bpm_x_2",
    "bpm_y_2",
    "charge",
    "temperature",
    "rf_readback",
    "beam_current_proxy",
)


def feature_vector(settings: MachineSettings, safe_signals: SafeSignals) -> np.ndarray:
    values = [
        settings.quad_1,
        settings.quad_2,
        settings.steer_x,
        settings.steer_y,
        settings.rf_phase,
        settings.rf_amplitude,
        safe_signals.bpm_x_1,
        safe_signals.bpm_y_1,
        safe_signals.bpm_x_2,
        safe_signals.bpm_y_2,
        safe_signals.charge,
        safe_signals.temperature,
        safe_signals.rf_readback,
        safe_signals.beam_current_proxy,
    ]
    return np.asarray(values, dtype=float)


class VirtualDiagnostic:
    def __init__(self, n_samples: int = 1200, seed: int = 17):
        self.n_samples = n_samples
        self.seed = seed
        self.model_version = f"rf-synthetic-{n_samples}-{seed}"
        self.model = None
        self.ood_scorer: StandardizedOODScorer | None = None
        self.training_features: np.ndarray | None = None
        self.training_targets: np.ndarray | None = None
        self._train()

    def _train(self) -> None:
        rows: list[np.ndarray] = []
        targets: list[list[float]] = []
        for settings, drift in sample_operating_settings(self.n_samples, self.seed):
            safe = generate_safe_signals(settings, drift)
            truth = generate_beam_truth(settings, drift)
            rows.append(feature_vector(settings, safe))
            targets.append(
                [
                    truth.beam_quality,
                    truth.beam_size_x,
                    truth.beam_size_y,
                    truth.beam_loss,
                ]
            )

        self.training_features = np.vstack(rows)
        self.training_targets = np.asarray(targets, dtype=float)
        self.ood_scorer = StandardizedOODScorer.fit(self.training_features)

        if SKLEARN_AVAILABLE:
            self.model = RandomForestRegressor(
                n_estimators=40,
                max_depth=14,
                min_samples_leaf=3,
                random_state=self.seed,
                n_jobs=1,
            )
            self.model.fit(self.training_features, self.training_targets)

    def predict(
        self,
        settings: MachineSettings,
        safe_signals: SafeSignals | None = None,
        drift: float = 0.0,
        calibration_weight: float = 0.0,
    ) -> VirtualDiagnosticResult:
        safe = safe_signals or generate_safe_signals(settings, drift)
        feature = feature_vector(settings, safe)

        if self.model is not None:
            tree_predictions = [
                estimator.predict(feature.reshape(1, -1))[0]
                for estimator in self.model.estimators_
            ]
            mean, uncertainty = ensemble_mean_and_uncertainty(tree_predictions)
        else:  # pragma: no cover
            truth = generate_beam_truth(settings, drift)
            mean = np.asarray(
                [truth.beam_quality, truth.beam_size_x, truth.beam_size_y, truth.beam_loss],
                dtype=float,
            )
            uncertainty = 0.06

        raw_ood = self.ood_scorer.score(feature) if self.ood_scorer else 0.0
        drift_penalty = max(0.0, abs(drift) - 0.25)
        adjusted_ood = max(0.0, raw_ood + 2.7 * drift_penalty - 7.0 * calibration_weight)
        adjusted_uncertainty = max(0.0, uncertainty + 0.032 * drift_penalty - 0.045 * calibration_weight)

        predicted_quality = float(np.clip(mean[0], 0.0, 1.0))
        predicted_size_x = float(max(0.01, mean[1]))
        predicted_size_y = float(max(0.01, mean[2]))
        predicted_beam_loss = float(np.clip(mean[3], 0.0, 1.0))

        reasons: list[str] = []
        if adjusted_uncertainty >= 0.12:
            reasons.append("model uncertainty exceeds red threshold")
        elif adjusted_uncertainty >= 0.05:
            reasons.append("model uncertainty is elevated")
        else:
            reasons.append("model uncertainty is low")

        if adjusted_ood >= 4.0:
            reasons.append("machine state is outside the training envelope")
        elif adjusted_ood >= 2.5:
            reasons.append("machine state is near the edge of the training envelope")
        else:
            reasons.append("machine state is inside the training envelope")

        if predicted_beam_loss >= 0.28:
            reasons.append("predicted beam loss is high")
        elif predicted_beam_loss >= 0.12:
            reasons.append("predicted beam loss is moderate")
        else:
            reasons.append("predicted beam loss is low")

        if calibration_weight > 0.0:
            reasons.append("recent synthetic calibration measurement reduces local trust risk")

        if adjusted_uncertainty >= 0.12 or adjusted_ood >= 4.0 or predicted_beam_loss >= 0.28:
            trust_state = "RED"
        elif adjusted_uncertainty >= 0.05 or adjusted_ood >= 2.5 or predicted_beam_loss >= 0.12:
            trust_state = "YELLOW"
        else:
            trust_state = "GREEN"

        return VirtualDiagnosticResult(
            predicted_quality=predicted_quality,
            predicted_size_x=predicted_size_x,
            predicted_size_y=predicted_size_y,
            predicted_beam_loss=predicted_beam_loss,
            uncertainty=float(adjusted_uncertainty),
            ood_score=float(adjusted_ood),
            trust_state=trust_state,
            reasons=reasons,
        )


@lru_cache(maxsize=1)
def get_default_diagnostic() -> VirtualDiagnostic:
    return VirtualDiagnostic()
