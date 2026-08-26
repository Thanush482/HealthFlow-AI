# HealthFlow AI

AI-powered clinical triage, hospital capacity, and healthcare decision-intelligence platform for
a **multi-hospital network**, with four distinct logins: Hospital Admin, Doctor/Staff, Patient,
and Ambulance. Software-only decision support (not autonomous diagnosis/treatment).

Everything runs **fully offline** — no external LLM API keys, no paid services. All triage/NLP,
grounding, optimization, and forecasting are real, self-contained algorithms (see "How it works"
below), matching the MVP constraint of a synthetic-data, software-only demo.

---

## The four logins

| Role | How to sign in | What it does |
|---|---|---|
| 🏥 **Hospital Admin** | Demo account `admin` / `admin123` | Manage the hospital network (add hospitals), full clinical + operational access, audit CSV export |
| 🩺 **Doctor / Staff** | Demo accounts `doctor`/`doctor123`, `nurse`/`nurse123` | Doctor: intake, triage, condition-change, vitals/medications/treatment plans. Nurse: bed operations, ambulance arrival confirmation |
| 🧾 **Patient** | Patient ID (given at intake, e.g. `PT-A1B2C3`) + password `patient123` | Read-only: own triage summary, current hospital/bed, vitals trend, medications, treatment plan |
| 🚑 **Ambulance** | Demo account `ambulance` / `ambulance123` | Enter patient condition + location → get every network hospital ranked by distance **and** live compatible-bed availability → dispatch → confirm arrival |

All roles are enforced **server-side** via JWT + a permission-check dependency
(`backend/app/auth.py`) — the frontend disables/labels restricted actions to match, but the real
enforcement is on the API.

---

## Architecture

```
backend/
  app/
    main.py                 FastAPI app, multi-hospital seeding, CORS
    models.py                SQLAlchemy models: Hospital, Bed, Patient, VitalSign,
                              MedicationRecord, TreatmentPlanItem, AuditEntry
    seed.py                    Generates each hospital's ward/bed inventory (varied capacity)
    schemas.py                  Pydantic request/response schemas
    database.py                  SQLite engine/session
    auth.py                       JWT issuing/verification + role permission table
    data/
      hospitals.json               4 seeded hospitals with real-shaped geo-coordinates
      ontology.json                 16 clinical pathways (SNOMED CT + ICD-10) + 5 red-flag rules
    services/
      intake.py                A1 Understand  — regex/keyword structured extraction
      ontology.py                A2 Ground      — TF-IDF retrieval over the ontology
      triage.py                    A3 Triage      — ESI 1-5 scoring, confidence, evidence
      guardrails.py                  A4 Guard       — deterministic red-flag override engine
      allocation.py                    B  Allocate    — OR-Tools CP-SAT max-weight bipartite matching
      state.py                           C  Adapt       — per-hospital WebSocket broadcast + reallocation
      audit.py                             D  Audit       — append-only decision trail
      analytics.py                           Live KPIs + numpy linear-trend capacity forecast
      geo.py                                   Haversine distance + ETA estimate for ambulance routing
    routers/                 intake, beds, patients (+ vitals/meds/treatment-plan/portal),
                              audit, ws, auth, analytics, ambulance, hospitals

src/
  App.tsx                   marketing landing page (unchanged)
  dashboard/
    Dashboard.tsx             role router: Login -> StaffDashboard | AmbulanceDispatch | PatientPortal
    api.ts, types.ts, theme.ts
    components/
      Login.tsx                Hospital/Ambulance tab + Patient Portal tab
      StaffDashboard.tsx         Doctor/Nurse/Admin: hospital selector + tabs
      AmbulanceDispatch.tsx        condition + location -> ranked hospitals -> dispatch -> arrival
      PatientPortal.tsx             read-only patient record view
      PatientChart.tsx                vitals/medications/treatment-plan editor (modal)
      HospitalsAdmin.tsx                network overview + add-hospital (admin)
      IntakeForm.tsx, TriageQueue.tsx, BedMap.tsx, ExplainPanel.tsx, AuditLog.tsx, Analytics.tsx
```

### How it works (per hospital, then across the network)

Within one hospital, every request flows through the same pipeline as before:
**Understand → Ground → Triage → Guard → Allocate → Adapt → Explain → Audit** (see inline
docstrings in `backend/app/services/` for details on each stage — TF-IDF grounding, ESI scoring,
deterministic red-flag rules, and OR-Tools CP-SAT bipartite matching for bed assignment).

**What's new for the multi-hospital network:**
- Every `Bed` and `Patient` row now belongs to a `Hospital`. Allocation recalculation
  (`services/state.py`) is scoped per-hospital — City Central's queue never competes with
  Riverside's beds.
- **Ambulance routing** (`routers/ambulance.py`) runs the full triage pipeline *before* creating
  a patient record, then for every hospital in the network computes: great-circle distance
  (`services/geo.py`), estimated ETA, and — critically — how many of that hospital's *currently
  available* beds actually satisfy this patient's ward/equipment/isolation requirements. Hospitals
  are ranked by having a compatible bed first, then by distance. This means a closer hospital with
  no matching capacity is correctly ranked below a farther one that can actually take the patient.
- On dispatch, the best bed at the chosen hospital is marked `reserved` immediately (visible on
  that hospital's Bed Map in purple, pulsing) and confirmed to `occupied` on arrival.
- **Healthcare monitoring**: doctors/nurses can record vitals, prescribe medications, and manage
  a treatment-plan checklist per patient (`routers/patients.py`), all visible to that patient in
  their own portal.

---

## Running it

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

On first startup this seeds 4 hospitals (City Central, Riverside General, Northgate Medical
Center, Eastside Community — fictional, placed around Vadodara) each with its own ward/bed
inventory of varying size, and creates `app/healthflow.db` (SQLite). API docs: http://localhost:8000/docs

### Frontend

```bash
npm install
npm run dev
```

- Landing page: http://localhost:5173/
- App (all 4 logins): **http://localhost:5173/app**

The dashboard talks to `http://localhost:8000` by default; override with `VITE_API_BASE`.

---

## Demo script

1. **Admin** (`admin`/`admin123`) → **Hospitals** tab: see all 4 hospitals with live capacity;
   optionally add a 5th hospital live.
2. **Doctor** (`doctor`/`doctor123`) → pick a hospital from the header dropdown → **Intake**:
   quick-fill "Chest pain (red-flag ACS)" → watch the pipeline animate → ESI-1 override → bed
   assigned. Open **Chart** on the patient from the Triage Queue → record vitals, prescribe a
   medication, add a treatment-plan item.
3. Log out, log back in as **Patient** using that patient's ID (shown in the Triage Queue /
   Intake result) and password `patient123` → see the exact vitals/medication/treatment-plan just
   entered, read-only.
4. Log out, log in as **Ambulance** (`ambulance`/`ambulance123`) → describe a stroke case → click
   "Use my location" (or leave default) → the ranked hospital list often shows the *closest*
   hospital has zero compatible beds while a farther one has a matching ICU bed — dispatch to the
   right one, watch the reservation land on that hospital's Bed Map, then confirm arrival.
5. **Nurse** (`nurse`/`nurse123`) → **Bed Map** → discharge/clean/restore a bed → watch the
   optimizer re-run for that hospital's queue live.
6. **Admin** → **Analytics** → capacity forecast + ESI distribution; **Audit Trail** → export CSV.

---

## MVP scope & safety positioning

- Decision support only — every recommendation is intended for **authorized clinical staff
  sign-off**, not autonomous diagnosis or treatment.
- All data is synthetic/demo data entered live in the UI — no real patient data.
- The Guard layer is 100% deterministic Python (`guardrails.py`) — never an LLM/ML call, by design.
- Ontology (`data/ontology.json`) is a small demo set of 16 pathways for illustration — production
  would need a licensed terminology service (UMLS/SNOMED International, WHO ICD-API) and clinical
  validation.
- Patient portal auth uses a shared demo password (`patient123`) for every patient — clearly a
  hackathon simplification, not a real per-patient credential system.
- The capacity forecast's underlying admission-rate series is deterministic synthetic data (no
  historical warehouse exists yet); the forecasting *method* (numpy linear trend) is real and its
  inputs/methodology are exposed in the API response rather than hidden.
- Real-time events are simulated through the dashboard UI rather than integrated with a live
  hospital EHR/HMIS, per the MVP constraint.
