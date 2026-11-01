from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Farm
from app.schemas.farm import FarmRead, FarmCreate

router = APIRouter(prefix="/farms", tags=["Farms"])

@router.get("", response_model=List[FarmRead])
def list_farms(db: Session = Depends(get_db)):
    return db.query(Farm).all()

@router.get("/{farm_id}", response_model=FarmRead)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Farm {farm_id} not found")
    return farm

@router.post("", response_model=FarmRead, status_code=status.HTTP_201_CREATED)
def create_farm(farm_in: FarmCreate, db: Session = Depends(get_db)):
    farm = Farm(**farm_in.model_dump())
    db.add(farm)
    db.commit()
    db.refresh(farm)
    return farm
