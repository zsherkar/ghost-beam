from __future__ import annotations

import numpy as np


def ensemble_mean_and_uncertainty(tree_predictions: list[np.ndarray]) -> tuple[np.ndarray, float]:
    stacked = np.asarray(tree_predictions, dtype=float)
    mean = stacked.mean(axis=0)
    std = stacked.std(axis=0)
    # Normalize output scales so quality, size, and loss contribute comparably.
    scale = np.array([1.0, 0.45, 0.45, 0.35], dtype=float)
    uncertainty = float(np.mean(std / scale))
    return mean, uncertainty
