from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ElogEntry:
    date: str
    title: str
    symptom_tags: list[str]
    text: str
    recommended_action: str
    risk_tags: list[str]


def default_elog_path() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "elogs.csv"


def _split_tags(value: str) -> list[str]:
    return [part.strip() for part in value.split(";") if part.strip()]


def load_elogs(path: Path | None = None) -> list[ElogEntry]:
    source = path or default_elog_path()
    with source.open("r", newline="", encoding="utf-8") as handle:
        rows = csv.DictReader(handle)
        return [
            ElogEntry(
                date=row["date"],
                title=row["title"],
                symptom_tags=_split_tags(row["symptom_tags"]),
                text=row["text"],
                recommended_action=row["recommended_action"],
                risk_tags=_split_tags(row["risk_tags"]),
            )
            for row in rows
        ]
