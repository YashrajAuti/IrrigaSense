from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False)
    trigger_type = Column(String(50), nullable=False)  # MANUAL, AUTOMATIC, SCHEDULED
    action = Column(String(50), nullable=False)        # START, STOP, EMERGENCY_STOP
    runtime_minutes = Column(Integer, default=0)
    target_depth_mm = Column(Float, default=0.0)
    estimated_water_liters = Column(Float, default=0.0)
    status = Column(String(50), default="COMPLETED")   # COMPLETED, ACTIVE, EMERGENCY_STOPPED, FAILED
    notes = Column(String(255), nullable=True)
    is_simulated = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    stopped_at = Column(DateTime, nullable=True)

    zone = relationship("IrrigationZone", back_populates="irrigation_events")


class IrrigationSchedule(Base):
    __tablename__ = "irrigation_schedules"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False)
    name = Column(String(100), nullable=False)
    scheduled_time = Column(String(10), nullable=False)  # HH:MM format e.g. "06:00"
    duration_minutes = Column(Integer, nullable=False, default=30)
    target_depth_mm = Column(Float, nullable=False, default=4.0)
    days_of_week = Column(String(50), nullable=False, default="Mon,Wed,Fri")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    zone = relationship("IrrigationZone", back_populates="schedules")
