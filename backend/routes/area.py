from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Area, User, Note
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/areas", tags=["Areas"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AreaCreate(BaseModel):
    user_id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = None


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class AreaRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    user_id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True


@router.post("/", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_area = Area(
        id=str(uuid.uuid4()),
        user_id=payload.user_id,
        name=payload.name,
        description=payload.description,
        color=payload.color,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )

    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return new_area


@router.get("/user/{user_id}", response_model=List[AreaRead])
def get_areas_by_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    areas = db.query(Area).filter(Area.user_id == user_id).order_by(Area.createdAt.desc()).all()
    return areas


@router.get("/{area_id}", response_model=AreaRead)
def get_area(area_id: str, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")
    return area


@router.put("/{area_id}", response_model=AreaRead)
def update_area(area_id: str, payload: AreaUpdate, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(area, field, value)

    area.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(area)
    return area


@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(area_id: str, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")

    db.delete(area)
    db.commit()
    return {"message": "Zone supprimée"}


@router.post("/{area_id}/notes/{note_id}")
def attach_note_to_area(area_id: str, note_id: str, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    note = db.query(Note).filter(Note.id == note_id).first()

    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")
    if area.user_id != note.user_id:
        raise HTTPException(status_code=403, detail="Zone et note n’appartiennent pas au même utilisateur")

    if note not in area.notes:
        area.notes.append(note)
        db.commit()

    return {"message": f"Note '{note.title}' liée à la zone '{area.name}'"}


@router.get("/{area_id}/notes")
def get_notes_in_area(area_id: str, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")

    return [
        {
            "note_id": note.id,
            "title": note.title,
            "content": note.content,
            "createdAt": note.createdAt,
        }
        for note in area.notes
    ]
