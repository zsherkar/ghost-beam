from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from ghostbeam.api.routes_benchmark import router as benchmark_router
from ghostbeam.api.routes_artifacts import router as artifacts_router
from ghostbeam.api.routes_data_sources import router as data_sources_router
from ghostbeam.api.routes_diagnostic import router as diagnostic_router
from ghostbeam.api.routes_elog import router as elog_router
from ghostbeam.api.routes_experiment import router as experiment_router
from ghostbeam.api.routes_plan import router as plan_router
from ghostbeam.api.routes_platform import router as platform_router
from ghostbeam.api.routes_public_data import router as public_data_router
from ghostbeam.api.routes_recorded_runs import router as recorded_runs_router
from ghostbeam.api.routes_state import router as state_router
from ghostbeam.api.routes_vision import router as vision_router

app = FastAPI(title="Ghost Beam", version="0.1.0")

DEFAULT_CORS_ORIGINS = ["http://127.0.0.1:5173", "http://localhost:5173"]
configured_origins = [
    origin.strip()
    for origin in os.getenv("GHOSTBEAM_CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins or DEFAULT_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ghost-beam"}


app.include_router(state_router)
app.include_router(diagnostic_router)
app.include_router(vision_router)
app.include_router(elog_router)
app.include_router(plan_router)
app.include_router(artifacts_router)
app.include_router(experiment_router)
app.include_router(platform_router)
app.include_router(benchmark_router)
app.include_router(recorded_runs_router)
app.include_router(public_data_router)
app.include_router(data_sources_router)


def frontend_dist_dir() -> Path:
    configured = os.getenv("GHOSTBEAM_FRONTEND_DIST")
    if configured:
        return Path(configured).expanduser().resolve()
    return (Path(__file__).resolve().parents[3] / "frontend" / "dist").resolve()


FRONTEND_DIST = frontend_dist_dir()
FRONTEND_INDEX = FRONTEND_DIST / "index.html"
API_PREFIXES = (
    "health",
    "registry",
    "scenarios",
    "state",
    "diagnostic",
    "vision",
    "elog",
    "control",
    "plan",
    "calibration",
    "artifacts",
    "experiment",
    "platform",
    "benchmark",
    "recorded-runs",
    "public-data",
    "data-sources",
    "docs",
    "redoc",
    "openapi.json",
)

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")


@app.get("/", include_in_schema=False)
def serve_frontend_root():
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {
        "service": "ghost-beam",
        "frontend": "not_built",
        "detail": "Build the frontend or set GHOSTBEAM_FRONTEND_DIST to serve the React app.",
    }


@app.get("/{full_path:path}", include_in_schema=False)
def serve_frontend_fallback(full_path: str):
    first_segment = full_path.split("/", 1)[0]
    if first_segment in API_PREFIXES or full_path.startswith("assets/"):
        raise HTTPException(status_code=404, detail="Not Found")
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {"detail": "frontend not built"}
