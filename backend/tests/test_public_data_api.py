from pathlib import Path

from fastapi.testclient import TestClient

from ghostbeam.api.main import app


client = TestClient(app)


def test_public_data_sources_include_boostr():
    payload = client.get("/public-data/sources").json()
    assert payload["adapters_enabled"] is True
    assert payload["sources"][0]["dataset_id"] == "boostr"
    assert payload["sources"][0]["doi"] == "10.5281/zenodo.4382663"


def test_missing_boostr_slice_is_optional_status():
    response = client.post(
        "/public-data/boostr/import-local",
        json={"path": "backend/data/public_datasets/boostr/local_sample.csv"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["decision"] == "NO_LOCAL_SLICE"
    assert payload["row_count"] == 0


def test_boostr_import_is_path_restricted_and_window_evaluates(tmp_path):
    rejected = client.post("/public-data/boostr/import-local", json={"path": str(tmp_path / "outside.csv")})
    assert rejected.status_code == 400

    project_root = Path(__file__).resolve().parents[2]
    sample = project_root / "backend" / "data" / "public_datasets" / "boostr" / "test_boostr_slice.csv"
    sample.write_text(
        "\n".join(
            [
                "timestamp,device_001_readback,rf_phase_proxy,loss_monitor_proxy",
                "2026-04-26T12:00:00.000,1.0,0.1,0.02",
                "2026-04-26T12:00:00.067,1.1,0.2,0.03",
                "2026-04-26T12:00:00.133,1.2,0.9,0.21",
                "2026-04-26T12:00:00.200,1.3,1.0,0.23",
            ]
        ),
        encoding="utf-8",
    )
    try:
        imported = client.post(
            "/public-data/boostr/import-local",
            json={"path": "backend/data/public_datasets/boostr/test_boostr_slice.csv"},
        )
        assert imported.status_code == 200
        payload = imported.json()
        assert payload["dataset_id"] == "boostr"
        assert payload["row_count"] == 4
        assert "rf_phase_proxy" in payload["detected_numeric_signals"]

        evaluated = client.post(
            "/public-data/boostr/evaluate-window",
            json={"run_id": payload["run_id"], "start_index": 2, "window_size": 2},
        )
        assert evaluated.status_code == 200
        artifact = evaluated.json()
        assert artifact["data_source"] == "public_boostr"
        assert artifact["hardware_write_permitted"] is False
        assert artifact["decision"] in {"WINDOW_OK", "ANALYZE", "FLAG_FOR_REVIEW"}
        assert artifact["writes_allowed"] is False
        assert artifact["artifact_type"] == "PublicDataAnalysisRecord"
    finally:
        sample.unlink(missing_ok=True)


def test_data_sources_registry_and_summary_include_required_sources():
    registry = client.get("/data-sources").json()
    source_ids = {source["id"] for source in registry["sources"]}
    assert {
        "synthetic_jax_twin",
        "synthetic_recorded_fixture",
        "boostr",
        "fermilab_bpm_ipm",
        "epics_archiver_stub",
        "pyarchappl_compatible",
        "openpmd",
        "frictionless",
        "ro_crate",
        "workflowhub",
        "materials_project",
    }.issubset(source_ids)
    assert registry["summary"]["no_real_hardware"] is True
    assert registry["summary"]["no_runtime_downloads"] is True

    summary = client.get("/data-sources/summary").json()
    assert "boostr" in summary["public_dataset_adapters"]
    assert "epics_archiver_stub" in summary["facility_connector_stubs"]
    assert "ro_crate" in summary["artifact_standards"]
