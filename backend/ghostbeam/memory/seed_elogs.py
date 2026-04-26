from __future__ import annotations

from pathlib import Path

from ghostbeam.memory.elog_store import default_elog_path


def seed_path() -> Path:
    return default_elog_path()


if __name__ == "__main__":
    print(seed_path())
