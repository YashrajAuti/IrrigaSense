import csv
import io
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.irrigation import IrrigationEvent
from app.models.farm import IrrigationZone, Field

router = APIRouter(prefix="/analytics", tags=["Analytics & Water Savings"])

@router.get("/water-usage")
def get_water_usage_analytics(
    zone_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db)
):
    query = db.query(IrrigationEvent)
    if zone_id:
        query = query.filter(IrrigationEvent.zone_id == zone_id)

    since = datetime.utcnow() - timedelta(days=days)
    events = query.filter(IrrigationEvent.started_at >= since).all()

    actual_liters = sum(e.estimated_water_liters for e in events)
    # Conventional baseline assumption: uncontrolled surface flood uses ~38% more water
    baseline_liters = round(actual_liters * 1.38, 1) if actual_liters > 0 else 0.0
    water_saved_liters = max(0.0, round(baseline_liters - actual_liters, 1))
    savings_pct = round((water_saved_liters / baseline_liters) * 100, 1) if baseline_liters > 0 else 0.0

    return {
        "days": days,
        "actual_liters": actual_liters,
        "baseline_liters": baseline_liters,
        "water_saved_liters": water_saved_liters,
        "savings_percentage": savings_pct,
        "total_events": len(events),
        "is_baseline_estimated": True,
        "methodology": "Comparative delta against conventional flood irrigation benchmark (1.38x multiplier)."
    }

@router.get("/export-csv")
def export_irrigation_events_csv(db: Session = Depends(get_db)):
    """Exports all recorded irrigation runs to a downloadable CSV file."""
    events = db.query(IrrigationEvent).order_by(IrrigationEvent.started_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Event ID", "Zone ID", "Trigger Type", "Action",
        "Runtime (Minutes)", "Target Depth (mm)", "Estimated Litres",
        "Status", "Started At (UTC)", "Stopped At (UTC)", "Is Simulated", "Notes"
    ])

    for e in events:
        writer.writerow([
            e.id,
            e.zone_id,
            e.trigger_type,
            e.action,
            e.runtime_minutes,
            e.target_depth_mm,
            e.estimated_water_liters,
            e.status,
            e.started_at.isoformat() if e.started_at else "",
            e.stopped_at.isoformat() if e.stopped_at else "",
            e.is_simulated,
            e.notes or ""
        ])

    csv_data = output.getvalue()
    filename = f"irrigasense_events_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
