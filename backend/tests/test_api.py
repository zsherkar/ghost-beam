from fastapi.testclient import TestClient

from ghostbeam.api.main import app
from ghostbeam.api.runtime import load_scenario


client = TestClient(app)


def _scenario_payload(scenario_id: str):
    data = load_scenario(scenario_id)
    return {
        "scenario_id": scenario_id,
        "current_settings": data["current_settings"],
        "proposed_action": data["proposed_action"],
    }


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "ghost-beam"


def test_registry():
    response = client.get("/registry")
    assert response.status_code == 200
    assert "quad_1" in response.json()["pvs"]


def test_plan_evaluate_basic():
    response = client.post("/plan/evaluate", json=_scenario_payload("green_zone"))
    assert response.status_code == 200
    payload = response.json()
    assert payload["scenario_id"] == "green_zone"
    assert "gate_decision" in payload


def test_unsafe_apply_rejected():
    record = client.post("/plan/evaluate", json=_scenario_payload("unsafe_write")).json()
    response = client.post("/control/apply-simulated", json=record)
    assert response.status_code == 200
    assert response.json()["applied"] is False


def test_calibration_improves_drifted_status():
    before = client.post("/plan/evaluate", json=_scenario_payload("calibration_recovery")).json()
    assert before["gate_decision"]["decision"] == "REQUEST_CALIBRATION"
    calibration = client.post(
        "/calibration/apply",
        json={
            "scenario_id": "calibration_recovery",
            "current_settings": load_scenario("calibration_recovery")["current_settings"],
        },
    )
    assert calibration.status_code == 200
    after = client.post("/plan/evaluate", json=_scenario_payload("calibration_recovery")).json()
    assert after["virtual_diagnostic"]["ood_score"] < before["virtual_diagnostic"]["ood_score"]
