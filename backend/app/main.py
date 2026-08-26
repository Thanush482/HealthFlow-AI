import json
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models, seed as seed_module
from .database import engine, SessionLocal
from .routers import intake, beds, patients, audit as audit_router, ws, auth as auth_router, analytics, ambulance, hospitals

app = FastAPI(
    title="HealthFlow AI",
    description="AI-Powered Clinical Triage, Hospital Capacity & Healthcare Decision Intelligence Platform. "
    "This system provides clinical and operational DECISION SUPPORT only — it does not perform "
    "autonomous diagnosis or treatment, and all triage/allocation output requires authorized "
    "clinical staff sign-off.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)

app.include_router(intake.router)
app.include_router(beds.router)
app.include_router(patients.router)
app.include_router(audit_router.router)
app.include_router(ws.router)
app.include_router(auth_router.router)
app.include_router(analytics.router)
app.include_router(ambulance.router)
app.include_router(hospitals.router)


def _seed_hospitals_and_beds_if_empty():
    db = SessionLocal()
    try:
        if db.query(models.Hospital).count() > 0:
            return

        hosp_path = os.path.join(os.path.dirname(__file__), "data", "hospitals.json")
        with open(hosp_path) as f:
            hosp_data = json.load(f)

        for h in hosp_data["hospitals"]:
            db.add(models.Hospital(
                id=h["id"], name=h["name"], address=h["address"],
                latitude=h["latitude"], longitude=h["longitude"], phone=h["phone"],
            ))
        db.commit()

        for h in hosp_data["hospitals"]:
            for b in seed_module.generate_beds_for_hospital(h["id"]):
                db.add(models.Bed(**b))
        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    _seed_hospitals_and_beds_if_empty()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "HealthFlow AI backend"}


@app.get("/api/wards")
def get_wards():
    """Ward type definitions shared across every hospital in the network."""
    return seed_module.WARDS


@app.get("/api/ontology/pathways")
def get_pathways():
    """Expose the grounding ontology for transparency (used by the dashboard's 'Ontology' tab)."""
    ont_path = os.path.join(os.path.dirname(__file__), "data", "ontology.json")
    with open(ont_path) as f:
        data = json.load(f)
    return {"pathways": data["pathways"], "red_flag_rules": data["red_flag_rules"]}
