from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AlertEventBase(BaseModel):
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    message: str
    is_acknowledged: bool = False
    is_resolved: bool = False

class AlertEventCreate(AlertEventBase):
    zone_id: Optional[int] = None

class AlertEventUpdate(BaseModel):
    is_acknowledged: Optional[bool] = None
    is_resolved: Optional[bool] = None

class AlertEventRead(AlertEventBase):
    id: int
    zone_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
