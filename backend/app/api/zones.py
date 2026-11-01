from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import IrrigationZone
from app.schemas.farm import IrrigationZoneRead, IrrigationZoneCreate, IrrigationZoneUpdate

router = APIRouter(prefix="/zones", tags=["Irrigation Zones"])

@router.get("", response_model=List[IrrigationZoneRead])
def list_zones(
    field_id: Optional[int] = Query(None, description="Filter zones by Field ID"),
    db: Session = Depends(get_db)
):
    query = db.query(IrrigationZone)
    if field_id is not None:
        query = query.filter(IrrigationZone.field_id == field_id)
    return query.all()

@router.get("/{zone_id}", response_model=IrrigationZoneRead)
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(IrrigationZone).filter(IrrigationZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Irrigation Zone {zone_id} not found")
    return zone

@router.post("", response_model=IrrigationZoneRead, status_code=status.HTTP_201_CREATED)
def create_zone(zone_in: IrrigationZoneCreate, db: Session = Depends(get_db)):
    zone = IrrigationZone(**zone_in.model_dump())
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone

@router.patch("/{zone_id}", response_model=IrrigationZoneRead)
def update_zone(zone_id: int, zone_in: IrrigationZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(IrrigationZone).filter(IrrigationZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Irrigation Zone {zone_id} not found")
    
    update_data = zone_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(zone, key, value)
        
    db.commit()
    db.refresh(zone)
    return zone
