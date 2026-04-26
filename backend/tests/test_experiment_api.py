from fastapi.testclient import TestClient

from ghostbeam.api.main import app


client = TestClient(app)


def test_experiment_start_returns_stateful_twin():
    response = client.post("/experiment/start", json={"scenario_id": "green_zone"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["scenario_id"] == "green_zone"
    assert payload["step_number"] == 0
    assert "current_settings" in payload
    assert "latest_decision_record" in payload
    assert len(payload["device_registry"]) >= 6
    assert len(payload["trajectory"]) >= 8


def test_experiment_manual_action_can_apply_then_block_unsafe_action():
    client.post("/experiment/start", json={"scenario_id": "green_zone"})
    proposed = {
        "intent": "manual trim quad_1",
        "source": "human",
        "delta_settings": {"quad_1": 0.03},
    }
    decision = client.post("/experiment/evaluate", json={"proposed_action": proposed}).json()
    assert decision["gate_decision"]["decision"] in {"APPROVE", "APPROVE_SMALL_STEP"}

    apply_response = client.post(
        "/experiment/apply",
        json={"decision_record_id": client.get("/experiment/state").json()["latest_decision_record_id"]},
    )
    assert apply_response.status_code == 200
    applied = apply_response.json()
    assert applied["applied"] is True
    assert applied["state"]["step_number"] >= 1

    unsafe = {
        "intent": "unsafe manual quad shove",
        "source": "human",
        "delta_settings": {"quad_1": 99.0},
    }
    blocked = client.post("/experiment/evaluate", json={"proposed_action": unsafe}).json()
    assert blocked["gate_decision"]["decision"] == "BLOCK"
    rejected = client.post(
        "/experiment/apply",
        json={"decision_record_id": client.get("/experiment/state").json()["latest_decision_record_id"]},
    ).json()
    assert rejected["applied"] is False


def test_experiment_calibration_changes_drifted_path():
    start = client.post("/experiment/start", json={"scenario_id": "drifted_twin"}).json()
    before = start["latest_decision_record"]
    assert before["gate_decision"]["decision"] == "REQUEST_CALIBRATION"

    calibrated = client.post("/experiment/calibrate").json()
    assert calibrated["calibration_applied"] is True
    after = calibrated["state"]["latest_decision_record"]
    assert after["virtual_diagnostic"]["ood_score"] < before["virtual_diagnostic"]["ood_score"]
