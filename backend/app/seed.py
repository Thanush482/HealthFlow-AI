"""
Generates the multi-hospital bed inventory. Each hospital gets the same
six ward types but different capacity, so the ambulance nearest-hospital
router has genuinely different availability to reason about across the
network (matches the problem statement's "public hospitals and healthcare
networks" target users).
"""
from typing import List, Dict, Any

WARDS = [
    {"id": "Emergency", "name": "Emergency Department", "isolation_capable": True},
    {"id": "ICU", "name": "Intensive Care Unit", "isolation_capable": True},
    {"id": "General Surgery", "name": "General Surgery Ward", "isolation_capable": False},
    {"id": "General Medicine", "name": "General Medicine Ward", "isolation_capable": False},
    {"id": "Pediatrics", "name": "Pediatric Ward", "isolation_capable": True},
    {"id": "Psychiatric", "name": "Psychiatric Safety Unit", "isolation_capable": False},
]

_ED_EQUIPMENT_CYCLE = [
    ["cardiac_monitor", "ecg", "airway_kit", "trauma_bay", "blood_bank_access"],
    ["cardiac_monitor", "ecg", "iv_pump"],
    ["cardiac_monitor", "iv_pump", "glucose_monitor"],
    ["nebulizer", "pulse_oximeter"],
    ["cardiac_monitor", "airway_kit", "ct_scanner_access"],
    ["trauma_bay", "blood_bank_access", "cardiac_monitor"],
]
_ICU_EQUIPMENT_CYCLE = [
    ["cardiac_monitor", "ventilator", "iv_pump", "blood_bank_access"],
    ["cardiac_monitor", "ventilator", "iv_pump"],
    ["cardiac_monitor", "ventilator"],
]
_SURGERY_EQUIPMENT_CYCLE = [
    ["ultrasound_access", "iv_pump"],
    ["ultrasound_access"],
]
_GM_EQUIPMENT_CYCLE = [
    ["xray_access", "splint_kit"],
    ["suture_kit"],
    [],
    ["xray_access"],
]
_PED_EQUIPMENT_CYCLE = [["pediatric_monitor"]]
_PSY_EQUIPMENT_CYCLE = [["safe_room"]]

# (ward_id, count, equipment_cycle, isolation_pattern)
_WARD_SPECS = [
    ("Emergency", _ED_EQUIPMENT_CYCLE, [False, False, True, False, False, False]),
    ("ICU", _ICU_EQUIPMENT_CYCLE, [True, False, True]),
    ("General Surgery", _SURGERY_EQUIPMENT_CYCLE, [False, False]),
    ("General Medicine", _GM_EQUIPMENT_CYCLE, [False, False, False, False]),
    ("Pediatrics", _PED_EQUIPMENT_CYCLE, [True, False, True]),
    ("Psychiatric", _PSY_EQUIPMENT_CYCLE, [False, False]),
]

# hospital short code -> bed counts per ward (Emergency, ICU, Surgery, GM, Peds, Psych)
HOSPITAL_CAPACITY: Dict[str, Dict[str, int]] = {
    "HOSP-CTR": {"Emergency": 6, "ICU": 3, "General Surgery": 3, "General Medicine": 5, "Pediatrics": 3, "Psychiatric": 2},
    "HOSP-RIV": {"Emergency": 4, "ICU": 2, "General Surgery": 2, "General Medicine": 4, "Pediatrics": 2, "Psychiatric": 1},
    "HOSP-NGT": {"Emergency": 3, "ICU": 2, "General Surgery": 2, "General Medicine": 3, "Pediatrics": 2, "Psychiatric": 1},
    "HOSP-EST": {"Emergency": 3, "ICU": 1, "General Surgery": 1, "General Medicine": 3, "Pediatrics": 1, "Psychiatric": 1},
}

_WARD_PREFIX = {"Emergency": "ED", "ICU": "ICU", "General Surgery": "SUR", "General Medicine": "GM", "Pediatrics": "PED", "Psychiatric": "PSY"}

# A few beds are pre-occupied/cleaning per hospital so the network shows
# realistic variety immediately (rather than every bed starting available).
_PRESET_STATUS_OFFSETS: Dict[str, List[int]] = {
    "HOSP-CTR": [3],       # 4th Emergency bed starts occupied
    "HOSP-RIV": [1, 5],    # a couple of beds busy at Riverside
    "HOSP-NGT": [],
    "HOSP-EST": [2],
}


def generate_beds_for_hospital(hospital_id: str) -> List[Dict[str, Any]]:
    capacity = HOSPITAL_CAPACITY[hospital_id]
    beds = []
    global_index = 0
    busy_offsets = set(_PRESET_STATUS_OFFSETS.get(hospital_id, []))

    for ward_id, equipment_cycle, isolation_pattern in _WARD_SPECS:
        count = capacity.get(ward_id, 0)
        prefix = _WARD_PREFIX[ward_id]
        for i in range(count):
            bed_num = i + 1
            equipment = equipment_cycle[i % len(equipment_cycle)]
            isolation = isolation_pattern[i % len(isolation_pattern)]
            status = "occupied" if global_index in busy_offsets else "available"
            beds.append(
                {
                    "id": f"{hospital_id.split('-')[1]}-{prefix}-{bed_num:02d}",
                    "hospital_id": hospital_id,
                    "ward_id": ward_id,
                    "equipment": equipment,
                    "isolation": isolation,
                    "nursing_station_distance": 1 + (i % 5),
                    "status": status,
                }
            )
            global_index += 1
    return beds
