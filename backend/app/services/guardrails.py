"""
A4. Guard layer (Safety Guardrail).

CRITICAL DESIGN PRINCIPLE: this layer is 100% deterministic, plain
if/else rule evaluation over the extracted symptom set. It never calls
an LLM or any probabilistic model. It runs AFTER the probabilistic
triage/reasoning layer and can unconditionally override its output when
a hard-coded critical-symptom combination is present. This is the single
most important safety/credibility point of the platform.
"""
from typing import List, Optional, Dict, Any
from .ontology import RED_FLAG_RULES


def check_red_flags(symptoms: List[str]) -> Optional[Dict[str, Any]]:
    """
    Evaluate every deterministic red-flag rule against the extracted
    symptom set. Returns the first matching rule (rules are evaluated in
    a fixed, auditable order) or None if no rule fires.
    """
    symptom_set = set(symptoms)
    for rule in RED_FLAG_RULES:
        any_of = set(rule["any_of"])
        with_any_of = set(rule["with_any_of"])
        primary_hit = bool(symptom_set & any_of)
        secondary_hit = bool(symptom_set & with_any_of)
        # require at least the primary trigger, and (primary OR a second
        # co-occurring criterion) so a single ambiguous keyword alone
        # doesn't force a false escalation unless it's on both lists.
        if primary_hit and secondary_hit:
            return {
                "rule_id": rule["id"],
                "rule_name": rule["name"],
                "forced_esi": rule["forced_esi"],
                "required_ward": rule["required_ward"],
                "required_equipment": rule["required_equipment"],
                "isolation_required": rule["isolation_required"],
                "message": rule["message"],
            }
    return None
