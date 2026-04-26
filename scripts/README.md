# Ghost Beam Local Scripts

These scripts are local-only helpers for demo day. They do not require Administrator privileges, do not create public tunnels, do not bind outside localhost, and do not connect to real hardware.

## `start_ghostbeam.ps1`

Starts the FastAPI backend on `127.0.0.1:8000` and the Vite frontend on `127.0.0.1:5173` as local PowerShell jobs.

```powershell
.\scripts\start_ghostbeam.ps1
```

## `run_smoke.ps1`

Runs local readiness checks:

- imports the FastAPI app
- verifies `/health`
- runs the non-mutating dry-run health check
- runs benchmark
- generates an evidence bundle
- verifies the BOOSTR public-data source registry
- verifies the federated `/data-sources` registry and missing-slice handling
- prints pass/fail summary

```powershell
.\scripts\run_smoke.ps1
```

## `reset_demo.ps1`

Clears only generated demo artifacts inside project-owned artifact folders. It does not delete source code, dependencies, caches, or files outside this project.

```powershell
.\scripts\reset_demo.ps1
```

## `capture_visual_qa.ps1`

Creates `docs/screenshots/` if needed. If Playwright CLI is available in `frontend/node_modules`, it captures baseline 1920x1080 and 1440x900 screenshots. Otherwise it prints the manual external-browser checklist and exits successfully.

```powershell
.\scripts\capture_visual_qa.ps1
```

## `backend/scripts/create_boostr_shaped_sample.py`

Generates a tiny BOOSTR-shaped synthetic CSV for testing the local public-data importer UI. It is not actual BOOSTR data and should not be described as public facility data.

```powershell
python backend/scripts/create_boostr_shaped_sample.py
```
