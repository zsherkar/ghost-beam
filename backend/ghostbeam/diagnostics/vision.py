from __future__ import annotations

import numpy as np

from ghostbeam.core.schemas import VisionDiagnosticResult


def analyze_beam_image(image: np.ndarray) -> VisionDiagnosticResult:
    arr = np.asarray(image, dtype=float)
    if arr.ndim != 2:
        raise ValueError("beam image must be a 2D array")
    arr = np.clip(arr, 0.0, None)
    total = float(arr.sum())
    if total <= 1e-12:
        return VisionDiagnosticResult(
            centroid_x=0.0,
            centroid_y=0.0,
            sigma_x=0.0,
            sigma_y=0.0,
            ellipticity=1.0,
            halo_score=0.0,
            clipping_score=0.0,
            labels=["DIFFUSE"],
        )

    height, width = arr.shape
    xs = np.linspace(-1.0, 1.0, width)
    ys = np.linspace(-1.0, 1.0, height)
    xx, yy = np.meshgrid(xs, ys)
    cx = float((arr * xx).sum() / total)
    cy = float((arr * yy).sum() / total)
    sigma_x = float(np.sqrt(max(0.0, (arr * (xx - cx) ** 2).sum() / total)))
    sigma_y = float(np.sqrt(max(0.0, (arr * (yy - cy) ** 2).sum() / total)))
    ellipticity = float(max(sigma_x, sigma_y) / max(min(sigma_x, sigma_y), 1e-6))

    radius = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    outer = arr[(radius > 0.48) & (radius < 0.9)].sum()
    core = arr[radius < 0.35].sum()
    halo_score = float(outer / max(core + outer, 1e-9))

    edge = np.concatenate([arr[:4, :].ravel(), arr[-4:, :].ravel(), arr[:, :4].ravel(), arr[:, -4:].ravel()])
    clipping_score = float(edge.sum() / total)

    offset = float(np.sqrt(cx**2 + cy**2))
    labels: list[str] = []
    if offset > 0.24:
        labels.append("OFF_AXIS")
    if max(sigma_x, sigma_y) > 0.31:
        labels.append("DIFFUSE")
    if ellipticity > 1.45:
        labels.append("ASTIGMATIC")
    if halo_score > 0.20:
        labels.append("HALO")
    if clipping_score > 0.09:
        labels.append("CLIPPED")
    if not labels and offset <= 0.16:
        labels.append("CENTERED")
    if not labels:
        labels.append("CENTERED")

    return VisionDiagnosticResult(
        centroid_x=cx,
        centroid_y=cy,
        sigma_x=sigma_x,
        sigma_y=sigma_y,
        ellipticity=ellipticity,
        halo_score=halo_score,
        clipping_score=clipping_score,
        labels=labels,
    )


def gaussian_image(
    size: int = 96,
    cx: float = 0.0,
    cy: float = 0.0,
    sx: float = 0.14,
    sy: float = 0.14,
    halo: bool = False,
    clipped: bool = False,
) -> np.ndarray:
    coords = np.linspace(-1.0, 1.0, size)
    xx, yy = np.meshgrid(coords, coords)
    image = np.exp(-(((xx - cx) ** 2) / (2 * sx**2) + ((yy - cy) ** 2) / (2 * sy**2)))
    if halo:
        radius = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        image += 0.32 * np.exp(-((radius - 0.58) ** 2) / (2 * 0.06**2))
    if clipped:
        image[:, -4:] += 0.35
        image[-4:, :] += 0.25
    return np.clip(image / max(float(image.max()), 1.0), 0.0, 1.0).astype(np.float32)
