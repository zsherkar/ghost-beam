from fastapi.testclient import TestClient

from ghostbeam.api.main import app


client = TestClient(app)


def test_recorded_runs_fixture_can_load_and_evaluate_step():
    listing = client.get("/recorded-runs")
    assert listing.status_code == 200
    runs = listing.json()["runs"]
    assert any(run["run_id"] == "sample_recorded_drifted_twin" for run in runs)

    loaded = client.post("/recorded-runs/load", json={"run_id": "sample_recorded_drifted_twin"})
    assert loaded.status_code == 200
    load_payload = loaded.json()
    assert load_payload["state"]["data_source"] == "recorded_fixture"
    assert load_payload["state"]["recorded_run_id"] == "sample_recorded_drifted_twin"

    evaluated = client.post(
        "/recorded-runs/evaluate-step",
        json={"run_id": "sample_recorded_drifted_twin", "step": 3},
    )
    assert evaluated.status_code == 200
    payload = evaluated.json()
    assert payload["state"]["data_source"] == "recorded_fixture"
    assert payload["decision_record"]["gate_decision"]["decision"] in {
        "APPROVE",
        "APPROVE_SMALL_STEP",
        "REQUIRE_HUMAN_REVIEW",
        "REQUEST_CALIBRATION",
        "BLOCK",
    }


def test_platform_capabilities_surface_recorded_run_ingestion():
    capabilities = client.get("/platform/capabilities").json()
    assert capabilities["capabilities"]["recorded_run_ingestion"] is True
    version = client.get("/platform/version").json()
    assert version["recorded_run_ingestion_enabled"] is True
