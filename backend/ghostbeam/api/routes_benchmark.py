from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ghostbeam.artifacts.benchmark import get_benchmark, latest_benchmark, run_benchmark

router = APIRouter(prefix="/benchmark", tags=["benchmark"])


class BenchmarkRunRequest(BaseModel):
    total_trials: int = Field(default=50, ge=1, le=100)
    seed: int = 42


@router.post("/run")
def run_benchmark_route(request: BenchmarkRunRequest):
    return run_benchmark(total_trials=request.total_trials, seed=request.seed)


@router.get("/latest")
def latest_benchmark_route():
    result = latest_benchmark()
    if result is None:
        raise HTTPException(status_code=404, detail="no benchmark has been run yet")
    return result


@router.get("/{benchmark_id}")
def benchmark_by_id(benchmark_id: str):
    result = get_benchmark(benchmark_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"unknown benchmark_id {benchmark_id}")
    return result
