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
- prints pass/fail summary

```powershell
.\scripts\run_smoke.ps1
```

## `reset_demo.ps1`

Clears only generated demo artifacts inside project-owned artifact folders. It does not delete source code, dependencies, caches, or files outside this project.

```powershell
.\scripts\reset_demo.ps1
```
