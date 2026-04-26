from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ghostbeam.memory.retrieval import retrieve_elogs

router = APIRouter()


class ElogSearchRequest(BaseModel):
    query: str
    top_k: int = Field(default=3, ge=1, le=10)


@router.post("/elog/search")
def search_elog(request: ElogSearchRequest):
    return {"hits": retrieve_elogs(request.query, request.top_k)}
