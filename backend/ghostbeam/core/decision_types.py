from typing import Literal

DecisionType = Literal[
    "APPROVE",
    "APPROVE_SMALL_STEP",
    "REQUIRE_HUMAN_REVIEW",
    "REQUEST_CALIBRATION",
    "BLOCK",
]

TrustState = Literal["GREEN", "YELLOW", "RED"]
