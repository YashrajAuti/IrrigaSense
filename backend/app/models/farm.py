from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    total_area_sqm = Column(Float, nullable=False, default=10000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    name = Column(String(100), nullable=False)
    crop_type = Column(String(100), nullable=False)
    area_sqm = Column(Float, nullable=False, default=2500.0)
    soil_type = Column(String(100), nullable=False, default="Clay Loam")
    lower_moisture_threshold = Column(Float, nullable=False, default=35.0)
    upper_moisture_threshold = Column(Float, nullable=False, default=65.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    farm = relationship("Farm", back_populates="fields")
    zones = relationship("IrrigationZone", back_populates="field", cascade="all, delete-orphan")


class IrrigationZone(Base):
    __tablename__ = "irrigation_zones"

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="Idle")  # Idle, Active, Paused, Offline
    operating_mode = Column(String(50), nullable=False, default="Manual")  # Manual, Automatic
    flow_rate_lpm = Column(Float, nullable=False, default=45.0)
    last_irrigation_at = Column(DateTime, nullable=True)
    simulated_pump_state = Column(String(50), nullable=False, default="OFF")  # OFF, ON, EMERGENCY_STOPPED
    current_runtime_minutes = Column(Integer, default=0)
    max_runtime_minutes = Column(Integer, default=120)

    field = relationship("Field", back_populates="zones")
    sensors = relationship("SensorDevice", back_populates="zone", cascade="all, delete-orphan")
    readings = relationship("SensorReading", back_populates="zone", cascade="all, delete-orphan")
    irrigation_events = relationship("IrrigationEvent", back_populates="zone", cascade="all, delete-orphan")
    schedules = relationship("IrrigationSchedule", back_populates="zone", cascade="all, delete-orphan")
    alerts = relationship("AlertEvent", back_populates="zone", cascade="all, delete-orphan")
