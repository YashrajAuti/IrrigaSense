from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False)
    device_serial = Column(String(100), unique=True, nullable=False)
    sensor_type = Column(String(100), nullable=False)  # Soil Moisture & Temp, Atmospheric Trio
    status = Column(String(50), nullable=False, default="Online")  # Online, Offline, Degraded
    battery_level = Column(Float, nullable=False, default=95.0)
    signal_dbm = Column(Integer, nullable=False, default=-65)
    firmware_version = Column(String(50), default="v1.4.2")
    is_simulated = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)

    zone = relationship("IrrigationZone", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("sensor_devices.id"), nullable=False)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    soil_moisture_percent = Column(Float, nullable=False)
    air_temperature_c = Column(Float, nullable=False)
    relative_humidity_percent = Column(Float, nullable=False)
    is_simulated = Column(Boolean, default=True)
    is_valid = Column(Boolean, default=True)

    device = relationship("SensorDevice", back_populates="readings")
    zone = relationship("IrrigationZone", back_populates="readings")
