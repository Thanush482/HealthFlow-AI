"""
A2. Ground layer (Medical RAG / Ontology grounding).

Retrieves the most clinically relevant pathway for a structured symptom
set using TF-IDF cosine similarity over the local verified ontology
(analogous to a SNOMED CT / ICD-10 grounded pathway index). This gives
transparent, reproducible retrieval scores without requiring an external
vector database or network access, matching the MVP constraint of a
self-contained, auditable demo.
"""
import json
import os
from typing import List, Optional, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_ONTOLOGY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ontology.json")
with open(_ONTOLOGY_PATH) as f:
    ONTOLOGY = json.load(f)

PATHWAYS = ONTOLOGY["pathways"]
RED_FLAG_RULES = ONTOLOGY["red_flag_rules"]

_PATHWAY_DOCS = [" ".join(p["keywords"]) for p in PATHWAYS]
_VECTORIZER = TfidfVectorizer()
_PATHWAY_MATRIX = _VECTORIZER.fit_transform(_PATHWAY_DOCS)


def get_pathway_by_id(pathway_id: str) -> Optional[Dict[str, Any]]:
    for p in PATHWAYS:
        if p["id"] == pathway_id:
            return p
    return None


def retrieve_pathway(symptoms: List[str]) -> Optional[Dict[str, Any]]:
    """
    Retrieve the best-matching clinical pathway for a list of extracted
    symptoms. Returns the pathway dict with an added '_match_score' key,
    or None if no symptoms were extracted / no meaningful match found.
    """
    if not symptoms:
        return None

    query = " ".join(symptoms)
    query_vec = _VECTORIZER.transform([query])
    sims = cosine_similarity(query_vec, _PATHWAY_MATRIX)[0]

    best_idx = int(sims.argmax())
    best_score = float(sims[best_idx])

    if best_score <= 0.0:
        return None

    best_pathway = dict(PATHWAYS[best_idx])
    best_pathway["_match_score"] = round(best_score, 3)
    return best_pathway


def rank_pathways(symptoms: List[str], top_k: int = 3) -> List[Dict[str, Any]]:
    """Return the top_k ranked pathways with scores, for explainability."""
    if not symptoms:
        return []
    query = " ".join(symptoms)
    query_vec = _VECTORIZER.transform([query])
    sims = cosine_similarity(query_vec, _PATHWAY_MATRIX)[0]
    ranked_idx = sims.argsort()[::-1][:top_k]
    results = []
    for idx in ranked_idx:
        if sims[idx] <= 0:
            continue
        p = dict(PATHWAYS[idx])
        p["_match_score"] = round(float(sims[idx]), 3)
        results.append(p)
    return results
