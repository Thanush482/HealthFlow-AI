"""
A1. Intake / Understand layer.

Converts unstructured patient complaint text into structured clinical
information: normalized symptom phrases, duration, and self-reported
severity. This is a deterministic, dependency-free NLP extractor
(keyword/phrase + regex based) so the platform works fully offline with
no external LLM API key required. In a production deployment this module
is the natural place to plug in a biomedical NER model (e.g. scispaCy)
or an LLM extraction call without changing the downstream contract.
"""
import json
import os
import re
from typing import List, Tuple

_ONTOLOGY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ontology.json")
with open(_ONTOLOGY_PATH) as f:
    _ONTOLOGY = json.load(f)

# Build the full vocabulary of known symptom phrases from every pathway,
# longest phrase first so multi-word phrases are matched before substrings.
_ALL_SYMPTOM_PHRASES = sorted(
    {kw for p in _ONTOLOGY["pathways"] for kw in p["keywords"]},
    key=len,
    reverse=True,
)

_DURATION_PATTERN = re.compile(
    r"(\d+)\s*(minute|min|hour|hr|day|week|month|year)s?", re.IGNORECASE
)

_SEVERITY_KEYWORDS = {
    "severe": ["severe", "excruciating", "worst", "unbearable", "extreme", "10/10", "can't move"],
    "moderate": ["moderate", "significant", "considerable", "getting worse", "worsening"],
    "mild": ["mild", "slight", "a little", "minor", "occasional"],
}


def extract_symptoms(text: str) -> List[str]:
    """Extract normalized symptom phrases present in the complaint text."""
    lowered = text.lower()
    found = []
    remaining = lowered
    for phrase in _ALL_SYMPTOM_PHRASES:
        if phrase in remaining:
            found.append(phrase)
            # prevent double counting overlapping substrings of the same phrase
            remaining = remaining.replace(phrase, " ")
    # de-duplicate while preserving order
    seen = set()
    ordered = []
    for s in found:
        if s not in seen:
            seen.add(s)
            ordered.append(s)
    return ordered


def extract_duration(text: str) -> str:
    match = _DURATION_PATTERN.search(text.lower())
    if match:
        return f"{match.group(1)} {match.group(2)}(s)"
    if "since this morning" in text.lower():
        return "since this morning"
    if "just now" in text.lower() or "sudden" in text.lower():
        return "sudden onset"
    return "unspecified"


def extract_severity(text: str) -> str:
    lowered = text.lower()
    for level, keywords in _SEVERITY_KEYWORDS.items():
        for kw in keywords:
            if kw in lowered:
                return level
    return "unspecified"


def structured_extract(text: str) -> Tuple[List[str], str, str]:
    """Run the full extraction pipeline and return (symptoms, duration, severity)."""
    symptoms = extract_symptoms(text)
    duration = extract_duration(text)
    severity = extract_severity(text)
    return symptoms, duration, severity
