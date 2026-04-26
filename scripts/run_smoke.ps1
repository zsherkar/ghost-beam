$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
  $Python = "python"
}

$env:PYTHONPATH = "$Backend\.deps;$Backend"

@'
from fastapi.testclient import TestClient
from ghostbeam.api.main import app

client = TestClient(app)

checks = []

def check(name, condition, detail):
    checks.append((name, bool(condition), detail))

health = client.get("/health").json()
check("health", health.get("status") == "ok", health)

dry = client.post("/experiment/health-check").json()
check("dry_run_health", dry["summary"]["status"] == "pass" and dry["mutates_active_session"] is False, dry["summary"])

benchmark = client.post("/benchmark/run", json={"total_trials": 30, "seed": 42}).json()
check("benchmark", benchmark["metrics"]["total_trials"] == 30 and benchmark["metrics"]["unsafe_actions_prevented"] > 0, benchmark["metrics"])

bundle = client.post("/experiment/evidence-bundle", json={"guided_transcript": [], "frontend_metadata": {"smoke": True}}).json()
check("evidence_bundle", bundle["exported"] is True and bundle["bundle_id"], {"bundle_id": bundle["bundle_id"]})

version = client.get("/platform/version").json()
check("version", version["real_hardware_writes_enabled"] is False and version["benchmark_enabled"] is True, version)

failed = [item for item in checks if not item[1]]
for name, passed, detail in checks:
    print(f"{'PASS' if passed else 'FAIL'} {name}: {detail}")

if failed:
    raise SystemExit(1)

print("Ghost Beam smoke checks passed.")
'@ | & $Python -
