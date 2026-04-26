from __future__ import annotations

from fastapi import APIRouter

from ghostbeam.data_sources import data_sources_registry, data_sources_summary

router = APIRouter(prefix="/data-sources", tags=["data-sources"])


@router.get("")
def data_sources():
    return data_sources_registry()


@router.get("/summary")
def summary():
    return data_sources_summary()
