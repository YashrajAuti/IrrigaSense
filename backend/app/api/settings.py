from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.settings import SystemSetting
from app.services.demo_data import seed_demonstration_dataset

router = APIRouter(prefix="/settings", tags=["Settings & Demo Control"])

class SettingItem(BaseModel):
    key: str
    value: str
    description: str

class ResetDemoRequest(BaseModel):
    confirm_reset: bool

@router.get("", response_model=List[SettingItem])
def get_system_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    return [
        SettingItem(key=s.key, value=s.value, description=s.description or "")
        for s in settings_records
    ]

@router.post("/reset-demo-data")
def reset_demo_dataset(request: ResetDemoRequest, db: Session = Depends(get_db)):
    if not request.confirm_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required. 'confirm_reset' must be True to reset demonstration data."
        )

    seed_demonstration_dataset(db, force_reset=True)
    return {
        "success": True,
        "message": "Demonstration dataset has been successfully reset to initial baseline values.",
        "simulated": True,
    }
