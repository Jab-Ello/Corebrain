# backend/routes/note.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Note, User, Project, Area, Tag
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/notes", tags=["Notes"])


###############################################################
# DB SESSION
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
class NoteCreate(BaseModel):
    user_id: int
    title: str
    content: str
    summary: Optional[str] = None
    pinned: Optional[bool] = False
    project_ids: Optional[List[int]] = None
    area_ids: Optional[List[int]] = None
    tag_names: Optional[List[str]] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    pinned: Optional[bool] = None
    project_ids: Optional[List[int]] = None
    area_ids: Optional[List[int]] = None
    tag_names: Optional[List[str]] = None


class NoteRead(BaseModel):
    id: int
    title: str
    content: str
    summary: Optional[str]
    pinned: bool
    user_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True  # ✅ Pydantic v2


###############################################################
# ROUTES CRUD NOTES
###############################################################

# 🔹 Créer une note
@router.post("/", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(payload: NoteCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_note = Note(
        user_id=payload.user_id,
        title=payload.title,
        content=payload.content,
        summary=payload.summary,
        pinned=payload.pinned or False,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )

    # 🔸 Lier aux projets
    if payload.project_ids:
        projects = db.query(Project).filter(Project.id.in_(payload.project_ids)).all()
        for p in projects:
            if p.user_id != payload.user_id:
                raise HTTPException(status_code=403, detail="Projet n’appartient pas à l’utilisateur")
        new_note.projects = projects

    # 🔸 Lier aux zones
    if payload.area_ids:
        areas = db.query(Area).filter(Area.id.in_(payload.area_ids)).all()
        for a in areas:
            if a.user_id != payload.user_id:
                raise HTTPException(status_code=403, detail="Zone n’appartient pas à l’utilisateur")
        new_note.areas = areas

    # 🔸 Lier aux tags
    if payload.tag_names:
        tags = []
        for name in payload.tag_names:
            tag = db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
            tags.append(tag)
        new_note.tags = tags

    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note


# 🔹 Lister toutes les notes d’un utilisateur
@router.get("/user/{user_id}", response_model=List[NoteRead])
def get_notes_by_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    notes = db.query(Note).filter(Note.user_id == user_id).order_by(Note.createdAt.desc()).all()
    return notes


# 🔹 Obtenir une note par ID
@router.get("/{note_id}", response_model=NoteRead)
def get_note_by_id(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")
    return note


# 🔹 Mettre à jour une note
@router.put("/{note_id}", response_model=NoteRead)
def update_note(note_id: int, payload: NoteUpdate, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")

    # ✅ Mise à jour simple
    for field, value in payload.dict(exclude_unset=True).items():
        if field not in ["project_ids", "area_ids", "tag_names"]:
            setattr(note, field, value)

    note.updatedAt = datetime.utcnow()

    # 🔸 MAJ des projets
    if payload.project_ids is not None:
        projects = db.query(Project).filter(Project.id.in_(payload.project_ids)).all()
        for p in projects:
            if p.user_id != note.user_id:
                raise HTTPException(status_code=403, detail="Projet n’appartient pas à l’utilisateur")
        note.projects = projects

    # 🔸 MAJ des zones
    if payload.area_ids is not None:
        areas = db.query(Area).filter(Area.id.in_(payload.area_ids)).all()
        for a in areas:
            if a.user_id != note.user_id:
                raise HTTPException(status_code=403, detail="Zone n’appartient pas à l’utilisateur")
        note.areas = areas

    # 🔸 MAJ des tags
    if payload.tag_names is not None:
        tags = []
        for name in payload.tag_names:
            tag = db.query(Tag).filter(Tag.name == name).first()
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
            tags.append(tag)
        note.tags = tags

    db.commit()
    db.refresh(note)
    return note


# 🔹 Supprimer une note
@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")

    db.delete(note)
    db.commit()
    return {"message": "Note supprimée"}


###############################################################
# LIAISONS
###############################################################

# 🔹 Lier une note à un projet existant
@router.post("/{note_id}/project/{project_id}")
def attach_note_to_project(note_id: int, project_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    project = db.query(Project).filter(Project.id == project_id).first()

    if not note or not project:
        raise HTTPException(status_code=404, detail="Note ou projet introuvable")

    if note.user_id != project.user_id:
        raise HTTPException(status_code=403, detail="Les éléments n’appartiennent pas au même utilisateur")

    if project not in note.projects:
        note.projects.append(project)
        db.commit()

    return {"message": f"Note '{note.title}' liée au projet '{project.name}'"}


# 🔹 Lier une note à une zone existante
@router.post("/{note_id}/area/{area_id}")
def attach_note_to_area(note_id: int, area_id: int, db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == note_id).first()
    area = db.query(Area).filter(Area.id == area_id).first()

    if not note or not area:
        raise HTTPException(status_code=404, detail="Note ou zone introuvable")

    if note.user_id != area.user_id:
        raise HTTPException(status_code=403, detail="Les éléments n’appartiennent pas au même utilisateur")

    if area not in note.areas:
        note.areas.append(area)
        db.commit()

    return {"message": f"Note '{note.title}' liée à la zone '{area.name}'"}
