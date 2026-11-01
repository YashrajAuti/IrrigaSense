from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.alert import AlertEvent
from app.schemas.alert import AlertEventRead, AlertEventCreate, AlertEventUpdate

router = APIRouter(prefix="/alerts", tags=["Alerts & Events"])

@router.get("", response_model=List[AlertEventRead])
def list_alerts(
    unresolved_only: bool = Query(False, description="Filter for unresolved alerts only"),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(AlertEvent)
    if unresolved_only:
        query = query.filter(AlertEvent.is_resolved == False)
    return query.order_by(AlertEvent.created_at.desc()).limit(limit).all()

@router.post("", response_model=AlertEventRead, status_code=status.HTTP_201_CREATED)
def create_alert(alert_in: AlertEventCreate, db: Session = Depends(get_db)):
    alert = AlertEvent(**alert_in.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

@router.patch("/{alert_id}", response_model=AlertEventRead)
def update_alert(alert_id: int, alert_in: AlertEventUpdate, db: Session = Depends(get_db)):
    alert = db.query(AlertEvent).filter(AlertEvent.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert {alert_id} not found")
    
    update_data = alert_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(alert, key, value)
        
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/acknowledge", response_model=AlertEventRead)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(AlertEvent).filter(AlertEvent.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Alert {alert_id} not found")
    alert.is_acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
