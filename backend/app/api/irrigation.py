from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import IrrigationZone, Field
from app.models.sensor import SensorReading
from app.models.irrigation import IrrigationEvent, IrrigationSchedule
from app.schemas.irrigation import (
    IrrigationCommandRequest, IrrigationCommandResponse,
    IrrigationEventRead, IrrigationScheduleRead, IrrigationScheduleCreate,
    WaterCalcRequest, WaterCalcResponse, RecommendationResponse
)
from app.services.irrigation_service import execute_irrigation_command
from app.services.water_calculator import calculate_water_requirement
from app.services.recommendation_engine import evaluate_irrigation_recommendation

router = APIRouter(prefix="/irrigation", tags=["Irrigation Control & Calculations"])

@router.post("/command", response_model=IrrigationCommandResponse)
def handle_irrigation_command(
    request: IrrigationCommandRequest,
    db: Session = Depends(get_db)
):
    try:
        return execute_irrigation_command(db, request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.get("/events", response_model=List[IrrigationEventRead])
def list_irrigation_events(
    zone_id: Optional[int] = Query(None, description="Filter events by Zone ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(IrrigationEvent)
    if zone_id is not None:
        query = query.filter(IrrigationEvent.zone_id == zone_id)
    return query.order_by(IrrigationEvent.started_at.desc()).limit(limit).all()

@router.get("/schedules", response_model=List[IrrigationScheduleRead])
def list_schedules(
    zone_id: Optional[int] = Query(None, description="Filter schedules by Zone ID"),
    db: Session = Depends(get_db)
):
    query = db.query(IrrigationSchedule)
    if zone_id is not None:
        query = query.filter(IrrigationSchedule.zone_id == zone_id)
    return query.all()

@router.post("/schedules", response_model=IrrigationScheduleRead, status_code=status.HTTP_201_CREATED)
def create_schedule(schedule_in: IrrigationScheduleCreate, db: Session = Depends(get_db)):
    schedule = IrrigationSchedule(**schedule_in.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

@router.patch("/schedules/{schedule_id}/toggle", response_model=IrrigationScheduleRead)
def toggle_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(IrrigationSchedule).filter(IrrigationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    schedule.is_active = not schedule.is_active
    db.commit()
    db.refresh(schedule)
    return schedule

@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    schedule = db.query(IrrigationSchedule).filter(IrrigationSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return None

@router.post("/calculate-water", response_model=WaterCalcResponse)
def calculate_water_volume(request: WaterCalcRequest):
    """
    Transparent water requirement calculation.
    Water volume in litres = Irrigation depth in mm × Field area in square metres.
    Gross volume = Net Litres / (Efficiency / 100).
    """
    try:
        return calculate_water_requirement(request)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

@router.get("/recommendation/{zone_id}", response_model=RecommendationResponse)
def get_zone_recommendation(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(IrrigationZone).filter(IrrigationZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Zone {zone_id} not found")

    field = db.query(Field).filter(Field.id == zone.field_id).first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Field associated with zone not found")

    latest_reading = (
        db.query(SensorReading)
        .filter(SensorReading.zone_id == zone.id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )

    hours_since_last = None
    if zone.last_irrigation_at:
        hours_since_last = (datetime.utcnow() - zone.last_irrigation_at).total_seconds() / 3600.0

    return evaluate_irrigation_recommendation(zone, field, latest_reading, hours_since_last)
