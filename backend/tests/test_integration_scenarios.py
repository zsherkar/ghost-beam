from fastapi.testclient import TestClient

from ghostbeam.api.main import app
from ghostbeam.api.runtime import load_scenario, runtime


client = TestClient(app)


def payload(scenario_id: str):
    data = load_scenario(scenario_id)
    return {
        "scenario_id": scenario_id,
        "current_settings": data["current_settings"],
        "proposed_action": data["proposed_action"],
    }


def evaluate(scenario_id: str):
    response = client.post("/plan/evaluate", json=payload(scenario_id))
    assert response.status_code == 200
    return response.json()


def test_green_zone_approves_safe_action():
    record = evaluate("green_zone")
    assert record["virtual_diagnostic"]["trust_state"] == "GREEN"
    assert record["gate_decision"]["decision"] in {"APPROVE", "APPROVE_SMALL_STEP"}


def test_drifted_twin_requests_calibration():
    runtime.calibration_weights.pop("drifted_twin", None)
    record = evaluate("drifted_twin")
    assert record["virtual_diagnostic"]["trust_state"] == "RED"
    assert record["gate_decision"]["decision"] == "REQUEST_CALIBRATION"
    assert "calibration" in record["gate_decision"]["safe_next_step"].lower()


def test_elog_conflict_requires_review():
    record = evaluate("elog_conflict")
    assert any("quad_conflict" in hit["risk_tags"] for hit in record["elog_hits"])
    assert record["gate_decision"]["decision"] in {"REQUIRE_HUMAN_REVIEW", "BLOCK"}
    assert any("elog" in reason.lower() for reason in record["gate_decision"]["reasons"])


def test_unsafe_write_blocks():
    record = evaluate("unsafe_write")
    assert record["gate_decision"]["decision"] == "BLOCK"


def test_calibration_recovery_before_after_behavior():
    runtime.calibration_weights.pop("calibration_recovery", None)
    before = evaluate("calibration_recovery")
    assert before["gate_decision"]["decision"] == "REQUEST_CALIBRATION"
    client.post(
        "/calibration/apply",
        json={
            "scenario_id": "calibration_recovery",
            "current_settings": load_scenario("calibration_recovery")["current_settings"],
        },
    )
    after = evaluate("calibration_recovery")
    assert after["virtual_diagnostic"]["trust_state"] in {"GREEN", "YELLOW"}
    assert after["gate_decision"]["decision"] in {"APPROVE", "APPROVE_SMALL_STEP", "REQUIRE_HUMAN_REVIEW"}
    assert after["virtual_diagnostic"]["ood_score"] < before["virtual_diagnostic"]["ood_score"]
