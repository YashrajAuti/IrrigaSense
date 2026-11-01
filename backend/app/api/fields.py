from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.farm import Field
from app.schemas.farm import FieldRead, FieldCreate, FieldUpdate

router = APIRouter(prefix="/fields", tags=["Fields"])

@router.get("", response_model=List[FieldRead])
def list_fields(
    farm_id: Optional[int] = Query(None, description="Filter fields by Farm ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Field)
    if farm_id is not None:
        query = query.filter(Field.farm_id == farm_id)
    return query.all()

@router.get("/{field_id}", response_model=FieldRead)
def get_field(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Field {field_id} not found")
    return field

@router.post("", response_model=FieldRead, status_code=status.HTTP_201_CREATED)
def create_field(field_in: FieldCreate, db: Session = Depends(get_db)):
    field = Field(**field_in.model_dump())
    db.add(field)
    db.commit()
    db.refresh(field)
    return field

@router.patch("/{field_id}", response_model=FieldRead)
def update_field(field_id: int, field_in: FieldUpdate, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Field {field_id} not found")
    
    update_data = field_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)
        
    db.commit()
    db.refresh(field)
    return field
