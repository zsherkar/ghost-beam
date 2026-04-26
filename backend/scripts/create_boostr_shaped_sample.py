from __future__ import annotations

import csv
import math
from datetime import datetime, timedelta
from pathlib import Path


def main() -> None:
    root = Path(__file__).resolve().parents[1] / "data" / "public_datasets" / "boostr"
    root.mkdir(parents=True, exist_ok=True)
    output = root / "boostr_shaped_sample.csv"
    start = datetime(2026, 4, 26, 12, 0, 0)
    fields = [
        "timestamp",
        "device_001_readback",
        "device_002_readback",
        "rf_phase_proxy",
        "beam_intensity_proxy",
        "loss_monitor_proxy",
        "event_label",
    ]
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for index in range(180):
            anomaly = 82 <= index <= 96
            writer.writerow(
                {
                    "timestamp": (start + timedelta(seconds=index / 15)).isoformat(timespec="milliseconds"),
                    "device_001_readback": f"{1.0 + 0.015 * math.sin(index / 9):.6f}",
                    "device_002_readback": f"{0.8 + 0.018 * math.cos(index / 11):.6f}",
                    "rf_phase_proxy": f"{-0.2 + (0.28 if anomaly else 0.0) + 0.01 * math.sin(index / 7):.6f}",
                    "beam_intensity_proxy": f"{0.92 - (0.18 if anomaly else 0.0) + 0.006 * math.cos(index / 6):.6f}",
                    "loss_monitor_proxy": f"{0.03 + (0.18 if anomaly else 0.0) + 0.003 * math.sin(index / 5):.6f}",
                    "event_label": "synthetic_anomaly" if anomaly else "synthetic_nominal",
                }
            )
    print(f"Wrote BOOSTR-shaped synthetic sample: {output}")
    print("Disclosure: this is not actual BOOSTR data; it only tests the local importer.")


if __name__ == "__main__":
    main()
