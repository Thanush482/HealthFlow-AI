"""Great-circle distance calculation for ambulance routing."""
import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def estimate_eta_minutes(distance_km: float, avg_speed_kmh: float = 35.0) -> int:
    """Rough urban-ambulance ETA estimate (default 35 km/h average with traffic/lights)."""
    if distance_km <= 0:
        return 1
    return max(1, round((distance_km / avg_speed_kmh) * 60))
