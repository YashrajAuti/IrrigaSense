from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class AlertEvent(Base):
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=True)
    severity = Column(String(50), nullable=False)  # CRITICAL, WARNING, INFO
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    zone = relationship("IrrigationZone", back_populates="alerts")
