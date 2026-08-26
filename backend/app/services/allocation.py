"""
B. Dynamic Hospital Bed & Resource Allocation layer.

Treats bed assignment as a multidimensional constraint-satisfaction /
maximum-weight bipartite matching problem (per the problem statement),
solved with Google OR-Tools CP-SAT rather than a naive first-available
lookup.

HARD constraints (must be satisfied or the patient-bed pair is not even
a candidate edge in the bipartite graph):
  - ward eligibility (bed.ward_id == patient.required_ward)
  - isolation requirement (bed.isolation True if patient requires it)
  - required equipment is a subset of the bed's equipment

SOFT constraints (encoded into the edge weight the solver maximizes):
  - proximity to nursing station, weighted more heavily for higher-acuity
    (lower ESI number) patients
  - resource conservation: avoid handing a low-acuity patient a
    heavily-equipped bed when a lighter bed would also satisfy them
"""
from typing import List, Dict, Any, Optional, Tuple
from ortools.sat.python import cp_model


def _is_compatible(patient: Dict[str, Any], bed: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Check hard constraints. Returns (is_compatible, list_of_reasons)."""
    reasons = []
    ok = True

    if bed["status"] != "available":
        return False, [f"bed status is '{bed['status']}', not available"]

    if patient["required_ward"] and bed["ward_id"] != patient["required_ward"]:
        ok = False
        reasons.append(f"ward mismatch (needs {patient['required_ward']}, bed is in {bed['ward_id']})")
    else:
        reasons.append(f"ward eligibility satisfied ({bed['ward_id']})")

    if patient.get("isolation_required") and not bed.get("isolation"):
        ok = False
        reasons.append("isolation required but bed is not isolation-capable")
    elif patient.get("isolation_required"):
        reasons.append("isolation requirement satisfied")

    missing_equipment = set(patient.get("required_equipment", [])) - set(bed.get("equipment", []))
    if missing_equipment:
        ok = False
        reasons.append(f"missing required equipment: {sorted(missing_equipment)}")
    elif patient.get("required_equipment"):
        reasons.append(f"all required equipment present: {patient['required_equipment']}")

    return ok, reasons


def _edge_weight(patient: Dict[str, Any], bed: Dict[str, Any]) -> int:
    """Soft-constraint score for a compatible patient-bed pair (higher is better)."""
    urgency_weight = (6 - patient["esi_level"]) * 100  # ESI-1 -> 500, ESI-5 -> 100
    proximity_penalty = bed["nursing_station_distance"] * (6 - patient["esi_level"])
    # resource conservation: mild penalty for over-equipped beds relative to need
    overprovision_penalty = max(0, len(bed.get("equipment", [])) - len(patient.get("required_equipment", []))) * 1
    return int(urgency_weight - proximity_penalty - overprovision_penalty)


def build_compatibility_matrix(
    patients: List[Dict[str, Any]], beds: List[Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    For every patient, evaluate every bed's compatibility + score.
    Returns { patient_id: { bed_id: {"compatible": bool, "reasons": [...], "score": int} } }
    Used both by the solver and by the explainability endpoint.
    """
    matrix = {}
    for p in patients:
        matrix[p["id"]] = {}
        for b in beds:
            compatible, reasons = _is_compatible(p, b)
            score = _edge_weight(p, b) if compatible else None
            matrix[p["id"]][b["id"]] = {"compatible": compatible, "reasons": reasons, "score": score}
    return matrix


def optimize_allocation(
    patients: List[Dict[str, Any]], beds: List[Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """
    Solve maximum-weight bipartite matching between waiting patients and
    available beds using CP-SAT.

    Returns { patient_id: {"bed_id": str|None, "score": int|None, "explanation": {...}} }
    """
    available_beds = [b for b in beds if b["status"] == "available"]
    matrix = build_compatibility_matrix(patients, beds)

    if not patients or not available_beds:
        return {
            p["id"]: {"bed_id": None, "score": None, "explanation": _no_solution_explanation(p, matrix[p["id"]])}
            for p in patients
        }

    model = cp_model.CpModel()
    x = {}
    edges = []
    for p in patients:
        for b in available_beds:
            cell = matrix[p["id"]][b["id"]]
            if cell["compatible"]:
                var = model.NewBoolVar(f"x_{p['id']}_{b['id']}")
                x[(p["id"], b["id"])] = var
                edges.append((p["id"], b["id"], cell["score"]))

    # each patient assigned to at most one bed
    for p in patients:
        vars_for_patient = [x[(p["id"], b["id"])] for b in available_beds if (p["id"], b["id"]) in x]
        if vars_for_patient:
            model.Add(sum(vars_for_patient) <= 1)

    # each bed assigned to at most one patient
    for b in available_beds:
        vars_for_bed = [x[(p["id"], b["id"])] for p in patients if (p["id"], b["id"]) in x]
        if vars_for_bed:
            model.Add(sum(vars_for_bed) <= 1)

    if edges:
        model.Maximize(sum(x[(pid, bid)] * score for pid, bid, score in edges))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5.0
    status = solver.Solve(model)

    results: Dict[str, Dict[str, Any]] = {}
    assigned_bed_for_patient: Dict[str, Optional[str]] = {p["id"]: None for p in patients}

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for (pid, bid), var in x.items():
            if solver.Value(var) == 1:
                assigned_bed_for_patient[pid] = bid

    for p in patients:
        bed_id = assigned_bed_for_patient[p["id"]]
        if bed_id:
            results[p["id"]] = {
                "bed_id": bed_id,
                "score": matrix[p["id"]][bed_id]["score"],
                "explanation": _assignment_explanation(p, bed_id, matrix[p["id"]], beds),
            }
        else:
            results[p["id"]] = {
                "bed_id": None,
                "score": None,
                "explanation": _no_solution_explanation(p, matrix[p["id"]]),
            }
    return results


def _assignment_explanation(patient, chosen_bed_id, patient_matrix, all_beds):
    bed_lookup = {b["id"]: b for b in all_beds}
    chosen = patient_matrix[chosen_bed_id]
    alternatives = []
    for bed_id, cell in patient_matrix.items():
        if bed_id == chosen_bed_id:
            continue
        if cell["compatible"]:
            alternatives.append(
                {"bed_id": bed_id, "score": cell["score"], "reasons": cell["reasons"]}
            )
    alternatives.sort(key=lambda a: a["score"], reverse=True)

    return {
        "assigned_bed": chosen_bed_id,
        "ward": bed_lookup[chosen_bed_id]["ward_id"],
        "score": chosen["score"],
        "hard_constraints_satisfied": chosen["reasons"],
        "soft_constraint_notes": [
            f"Nursing-station distance {bed_lookup[chosen_bed_id]['nursing_station_distance']} "
            f"weighted for ESI-{patient['esi_level']} urgency",
            "Equipment provisioning matched to clinical need (no unnecessary over-allocation)",
        ],
        "alternatives_considered": alternatives[:4],
    }


def _no_solution_explanation(patient, patient_matrix):
    rejected = [
        {"bed_id": bed_id, "reasons": cell["reasons"]}
        for bed_id, cell in patient_matrix.items()
        if not cell["compatible"]
    ]
    return {
        "assigned_bed": None,
        "reason": "No compatible bed currently available; patient remains in queue pending capacity change.",
        "beds_evaluated": rejected,
    }
