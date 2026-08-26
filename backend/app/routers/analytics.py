from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
def summary(hospital_id: str = None, db: Session = Depends(get_db)):
    return analytics.compute_summary(db, hospital_id=hospital_id)


@router.get("/forecast")
def forecast(horizon_hours: int = 6, hospital_id: str = None, db: Session = Depends(get_db)):
    return analytics.compute_forecast(db, horizon_hours=horizon_hours, hospital_id=hospital_id)
