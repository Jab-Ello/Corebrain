# backend/routes/project.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Project, User, Note
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["Projects"])


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
class ProjectCreate(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    context: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = 0
    plannedEndDate: Optional[datetime] = None


class ProjectRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    context: Optional[str]
    color: Optional[str]
    priority: int
    status: str
    user_id: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True  # ✅ pour Pydantic v2


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    context: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    plannedEndDate: Optional[datetime] = None
    endDate: Optional[datetime] = None


###############################################################
# ROUTES
###############################################################

# 🔹 Créer un projet
@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_project = Project(
        user_id=payload.user_id,
        name=payload.name,
        description=payload.description,
        context=payload.context,
        color=payload.color,
        priority=payload.priority or 0,
        plannedEndDate=payload.plannedEndDate,
        status="ACTIVE",
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


# 🔹 Lister tous les projets d’un utilisateur
@router.get("/user/{user_id}", response_model=List[ProjectRead])
def get_projects_by_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    projects = (
        db.query(Project)
        .filter(Project.user_id == user_id)
        .order_by(Project.createdAt.desc())
        .all()
    )
    return projects


# 🔹 Obtenir un projet spécifique (par ID)
@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return project


# 🔹 Mettre à jour un projet
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(project, field, value)

    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project


# 🔹 Supprimer un projet
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    db.delete(project)
    db.commit()
    return {"message": "Projet supprimé"}


###############################################################
# Notes liées à un projet
###############################################################

# 🔹 Ajouter une note existante à un projet
@router.post("/{project_id}/notes/{note_id}")
def attach_note_to_project(project_id: int, note_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    note = db.query(Note).filter(Note.id == note_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")

    # Vérifie que la note et le projet appartiennent au même utilisateur
    if note.user_id != project.user_id:
        raise HTTPException(status_code=403, detail="Note et projet n’appartiennent pas au même utilisateur")

    if note not in project.notes:
        project.notes.append(note)
        db.commit()

    return {"message": f"Note '{note.title}' liée au projet '{project.name}'"}


# 🔹 Récupérer toutes les notes liées à un projet
@router.get("/{project_id}/notes")
def get_project_notes(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    return [
        {
            "note_id": note.id,
            "title": note.title,
            "content": note.content,
            "createdAt": note.createdAt,
        }
        for note in project.notes
    ]
