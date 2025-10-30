# backend/routes/area.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Area, User, Note
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/areas", tags=["Areas"])


###############################################################
# DB Session
###############################################################
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


###############################################################
# SCHEMAS (Pydantic)
###############################################################
class AreaCreate(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None


class AreaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class AreaRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    user_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True  # ✅ Pydantic v2


###############################################################
# ROUTES CRUD AREAS
###############################################################

# 🔹 Créer une zone
@router.post("/", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_area = Area(
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


# 🔹 Lister toutes les zones d’un utilisateur
@router.get("/user/{user_id}", response_model=List[AreaRead])
def get_areas_by_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    areas = db.query(Area).filter(Area.user_id == user_id).order_by(Area.createdAt.desc()).all()
    return areas


# 🔹 Obtenir une zone spécifique
@router.get("/{area_id}", response_model=AreaRead)
def get_area(area_id: int, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")
    return area


# 🔹 Mettre à jour une zone
@router.put("/{area_id}", response_model=AreaRead)
def update_area(area_id: int, payload: AreaUpdate, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(area, field, value)

    area.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(area)
    return area


# 🔹 Supprimer une zone
@router.delete("/{area_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_area(area_id: int, db: Session = Depends(get_db)):
    area = db.query(Area).filter(Area.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Zone introuvable")

    db.delete(area)
    db.commit()
    return {"message": "Zone supprimée"}


###############################################################
# NOTES ASSOCIÉES
###############################################################

# 🔹 Lier une note existante à une zone
@router.post("/{area_id}/notes/{note_id}")
def attach_note_to_area(area_id: int, note_id: int, db: Session = Depends(get_db)):
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


# 🔹 Lister les notes d’une zone
@router.get("/{area_id}/notes")
def get_notes_in_area(area_id: int, db: Session = Depends(get_db)):
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
