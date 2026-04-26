from __future__ import annotations

from functools import lru_cache

import numpy as np

from ghostbeam.core.schemas import ElogHit, ProposedAction, VirtualDiagnosticResult, VisionDiagnosticResult
from ghostbeam.memory.elog_store import ElogEntry, load_elogs

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    SKLEARN_AVAILABLE = True
except Exception:  # pragma: no cover
    TfidfVectorizer = None
    cosine_similarity = None
    SKLEARN_AVAILABLE = False


def _entry_text(entry: ElogEntry) -> str:
    tags = " ".join(entry.symptom_tags + entry.risk_tags)
    return f"{entry.title} {tags} {tags} {entry.text} {entry.recommended_action}"


class ElogRetriever:
    def __init__(self, entries: list[ElogEntry] | None = None):
        self.entries = entries or load_elogs()
        self.corpus = [_entry_text(entry) for entry in self.entries]
        self.vectorizer = None
        self.matrix = None
        if SKLEARN_AVAILABLE:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
            self.matrix = self.vectorizer.fit_transform(self.corpus)

    def search(self, query: str, top_k: int = 3) -> list[ElogHit]:
        if not query.strip():
            query = "beam uncertainty calibration"
        if self.vectorizer is not None and self.matrix is not None:
            query_vec = self.vectorizer.transform([query])
            scores = cosine_similarity(query_vec, self.matrix)[0]
        else:  # pragma: no cover
            query_terms = set(query.lower().split())
            scores = np.asarray(
                [
                    len(query_terms.intersection(set(text.lower().split()))) / max(1, len(query_terms))
                    for text in self.corpus
                ],
                dtype=float,
            )
        order = np.argsort(scores)[::-1][:top_k]
        return [
            ElogHit(
                date=self.entries[i].date,
                title=self.entries[i].title,
                text=self.entries[i].text,
                recommended_action=self.entries[i].recommended_action,
                similarity=float(scores[i]),
                risk_tags=self.entries[i].risk_tags,
            )
            for i in order
        ]


@lru_cache(maxsize=1)
def get_default_retriever() -> ElogRetriever:
    return ElogRetriever()


def retrieve_elogs(query: str, top_k: int = 3) -> list[ElogHit]:
    return get_default_retriever().search(query, top_k)


def build_elog_query(
    action: ProposedAction,
    diagnostic: VirtualDiagnosticResult,
    vision: VisionDiagnosticResult,
) -> str:
    action_terms = " ".join(action.delta_settings.keys())
    direction_terms = []
    for name, delta in action.delta_settings.items():
        direction_terms.append(f"increase {name}" if delta > 0 else f"decrease {name}")
    return " ".join(
        [
            action.intent,
            action_terms,
            " ".join(direction_terms),
            diagnostic.trust_state,
            " ".join(diagnostic.reasons),
            " ".join(vision.labels),
        ]
    )
