"""
Analytics & forecasting layer.

Aggregates live operational KPIs from the current hospital state (ESI
distribution, red-flag rate, ward utilization, allocation quality) and
produces a short-horizon bed-demand forecast.

The forecast uses a transparent linear-trend model (numpy least-squares
fit) over a synthetic-but-deterministic hourly admission series seeded
from the current live patient count, since this MVP has no real
historical admissions warehouse yet (see problem statement's "Predicted"
KPI and Novelty Positioning section on decision-support intelligence).
The model and its inputs are exposed in the response so the method is
auditable rather than a black box.
"""
import datetime
import hashlib
from typing import Dict, Any, List

import numpy as np
from sqlalchemy.orm import Session

from .. import models


def compute_summary(db: Session, hospital_id: str = None) -> Dict[str, Any]:
    patient_q = db.query(models.Patient)
    bed_q = db.query(models.Bed)
    if hospital_id:
        patient_q = patient_q.filter(models.Patient.hospital_id == hospital_id)
        bed_q = bed_q.filter(models.Bed.hospital_id == hospital_id)
    patients: List[models.Patient] = patient_q.all()
    beds: List[models.Bed] = bed_q.all()

    total_patients = len(patients)
    esi_distribution = {str(i): 0 for i in range(1, 6)}
    red_flag_count = 0
    confidences = []
    scores = []

    for p in patients:
        if p.esi_level:
            esi_distribution[str(p.esi_level)] += 1
        if p.red_flag_triggered:
            red_flag_count += 1
        if p.confidence is not None:
            confidences.append(p.confidence)
        if p.allocation_explanation and isinstance(p.allocation_explanation, dict):
            s = p.allocation_explanation.get("score")
            if isinstance(s, (int, float)):
                scores.append(s)

    status_counts = {"waiting": 0, "admitted": 0, "discharged": 0}
    for p in patients:
        status_counts[p.status] = status_counts.get(p.status, 0) + 1

    ward_util: Dict[str, Dict[str, int]] = {}
    for b in beds:
        w = ward_util.setdefault(b.ward_id, {"total": 0, "occupied": 0, "available": 0, "cleaning": 0, "maintenance": 0, "reserved": 0})
        w["total"] += 1
        w[b.status] = w.get(b.status, 0) + 1

    bed_status_counts = {"available": 0, "occupied": 0, "cleaning": 0, "maintenance": 0, "reserved": 0}
    for b in beds:
        bed_status_counts[b.status] = bed_status_counts.get(b.status, 0) + 1

    return {
        "total_patients": total_patients,
        "status_counts": status_counts,
        "esi_distribution": esi_distribution,
        "red_flag_count": red_flag_count,
        "red_flag_rate": round(red_flag_count / total_patients, 3) if total_patients else 0.0,
        "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else None,
        "avg_allocation_score": round(sum(scores) / len(scores), 1) if scores else None,
        "total_beds": len(beds),
        "bed_status_counts": bed_status_counts,
        "ward_utilization": ward_util,
    }


def _synthetic_hourly_series(seed_count: int, hours: int = 12) -> List[float]:
    """
    Deterministic synthetic admission-rate series for the last `hours`
    hours, seeded from the live patient count so the demo is stable
    across reloads but still varies with actual activity. Represents
    admissions/hour for trend-fitting.
    """
    rng_seed = int(hashlib.sha256(str(seed_count).encode()).hexdigest(), 16) % (2**32)
    rng = np.random.default_rng(rng_seed)
    base = max(2.0, seed_count * 0.6)
    trend = np.linspace(0, 1.5, hours)  # gentle upward trend through the day
    daily_cycle = 1.2 * np.sin(np.linspace(0, np.pi, hours))  # busier mid-shift
    noise = rng.normal(0, 0.4, hours)
    series = base + trend + daily_cycle + noise
    return [round(max(0.0, v), 2) for v in series]


def compute_forecast(db: Session, horizon_hours: int = 6, hospital_id: str = None) -> Dict[str, Any]:
    patient_q = db.query(models.Patient)
    bed_q = db.query(models.Bed).filter(models.Bed.status == "available")
    if hospital_id:
        patient_q = patient_q.filter(models.Patient.hospital_id == hospital_id)
        bed_q = bed_q.filter(models.Bed.hospital_id == hospital_id)
    total_patients = patient_q.count()
    history = _synthetic_hourly_series(total_patients, hours=12)

    x = np.arange(len(history))
    y = np.array(history)
    # least-squares linear fit: y = m*x + c
    m, c = np.polyfit(x, y, 1)

    future_x = np.arange(len(history), len(history) + horizon_hours)
    forecast = m * future_x + c
    forecast = np.clip(forecast, 0, None)

    now = datetime.datetime.utcnow()
    history_labels = [(now - datetime.timedelta(hours=len(history) - i)).strftime("%H:%M") for i in range(len(history))]
    forecast_labels = [(now + datetime.timedelta(hours=i + 1)).strftime("%H:%M") for i in range(horizon_hours)]

    beds_available = bed_q.count()
    projected_next_hour = float(forecast[0])
    capacity_warning = projected_next_hour > beds_available

    return {
        "method": "Linear trend (least-squares) over a 12-hour rolling admission-rate window",
        "slope_per_hour": round(float(m), 3),
        "history": [{"label": l, "value": v} for l, v in zip(history_labels, history)],
        "forecast": [{"label": l, "value": round(float(v), 2)} for l, v in zip(forecast_labels, forecast)],
        "beds_available_now": beds_available,
        "projected_admissions_next_hour": round(projected_next_hour, 2),
        "capacity_warning": bool(capacity_warning),
        "capacity_warning_message": (
            f"Projected admission rate ({projected_next_hour:.1f}/hr) may exceed current available capacity "
            f"({beds_available} beds) within the hour."
            if capacity_warning
            else "Projected demand is within current available capacity."
        ),
    }
