from __future__ import annotations

from fastapi import FastAPI
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
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
