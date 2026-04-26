from __future__ import annotations

import numpy as np


class StandardizedOODScorer:
    def __init__(self, mean: np.ndarray, std: np.ndarray):
        self.mean = np.asarray(mean, dtype=float)
        self.std = np.asarray(std, dtype=float)
        self.std[self.std < 1e-6] = 1.0

    @classmethod
    def fit(cls, features: np.ndarray) -> "StandardizedOODScorer":
        return cls(np.mean(features, axis=0), np.std(features, axis=0))

    def score(self, feature: np.ndarray) -> float:
        z = (np.asarray(feature, dtype=float) - self.mean) / self.std
        return float(np.linalg.norm(z) / np.sqrt(z.shape[0]))
