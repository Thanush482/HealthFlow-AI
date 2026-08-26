"""
A3. Triage / Clinical Reasoning layer.

Produces a standardized Emergency Severity Index (ESI 1-5, where 1 is
most urgent) classification with a confidence score and human-readable
evidence, grounded in the retrieved clinical pathway. Severity language
in the patient's own words nudges the base ESI up/down by at most one
level, capturing clinician-style judgement while remaining fully
transparent and reproducible (no black-box scoring).

NOTE: this layer is intentionally probabilistic/heuristic-scored -- it is
the layer the deterministic Guard (guardrails.py) is designed to
override when a hard safety rule fires.
"""
from typing import List, Optional, Dict, Any

_SEVERITY_ADJUST = {"severe": -1, "moderate": 0, "mild": 1, "unspecified": 0}

_DEFAULT_RESULT = {
    "esi_level": 5,
    "confidence": 0.25,
    "evidence": "No clinically significant symptom pattern was matched against the ontology; "
    "defaulting to non-urgent triage pending clinician review.",
    "required_ward": "General Medicine",
    "required_equipment": [],
    "isolation_required": False,
    "matched_pathway_id": None,
    "matched_pathway_name": None,
    "match_score": 0.0,
}


def run_triage(symptoms: List[str], severity: str, pathway: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not pathway:
        return dict(_DEFAULT_RESULT)

    base_esi = pathway["base_esi"]
    adjust = _SEVERITY_ADJUST.get(severity, 0)
    esi_level = max(1, min(5, base_esi + adjust))

    match_score = pathway.get("_match_score", 0.0)
    # confidence blends retrieval strength with how many known symptoms matched
    symptom_coverage = min(1.0, len(symptoms) / max(1, len(pathway["keywords"][:4])))
    confidence = round(min(0.97, 0.5 * match_score + 0.5 * symptom_coverage + 0.15), 2)

    evidence = pathway["evidence"]
    if adjust != 0:
        direction = "escalated" if adjust < 0 else "de-escalated"
        evidence += f" Patient-reported '{severity}' severity {direction} the base ESI-{base_esi} by {abs(adjust)} level."

    return {
        "esi_level": esi_level,
        "confidence": confidence,
        "evidence": evidence,
        "required_ward": pathway["required_ward"],
        "required_equipment": pathway["required_equipment"],
        "isolation_required": pathway.get("isolation_required", False),
        "matched_pathway_id": pathway["id"],
        "matched_pathway_name": pathway["name"],
        "match_score": match_score,
    }
