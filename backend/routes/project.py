# backend/routes/project.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Body, Request
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Project, User, Note
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from services.n8n_notify import notify_n8n
import uuid

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
    user_id: str
    name: str
    description: Optional[str] = None
    context: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = 0
    plannedEndDate: Optional[datetime] = None


class ProjectRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    context: Optional[str]
    color: Optional[str]
    priority: int
    status: str
    user_id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    context: Optional[str] = None
    color: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    plannedEndDate: Optional[datetime] = None
    endDate: Optional[datetime] = None


# --- Nouveau : payload optionnel depuis le bouton (pour le futur) ---
class AgentTrigger(BaseModel):
    action: Optional[str] = None        # ex: "analyze", "summarize"...
    max_tokens: Optional[int] = None    # tu peux l’ignorer côté n8n si non géré
    dry_run: Optional[bool] = None      # idem


###############################################################
# ROUTES PROJETS
###############################################################

# Créer un projet (❌ plus de notify ici)
@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    new_project = Project(
        id=str(uuid.uuid4()),
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


@router.get("/user/{user_id}", response_model=List[ProjectRead])
def get_projects_by_user(user_id: str, db: Session = Depends(get_db)):
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


# Obtenir un projet
@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return project


@router.post("/_test-n8n")
def test_n8n(background: BackgroundTasks):
    print("[TEST] /_test-n8n hit")
    notify_n8n(event="ping", project_id="demo")
    return {"ok": True}


# Mettre à jour un projet (❌ plus de notify ici)
@router.put("/{project_id}", response_model=ProjectRead)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    for field, value in payload.dict(exclude_unset=True).items():
        setattr(project, field, value)

    project.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    db.delete(project)
    db.commit()
    return {"message": "Projet supprimé"}


###############################################################
# NOTES LIÉES À UN PROJET
###############################################################

# Lier une note à un projet (❌ plus de notify ici)
@router.post("/{project_id}/notes/{note_id}")
def attach_note_to_project(project_id: str, note_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    note = db.query(Note).filter(Note.id == note_id).first()

    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    if not note:
        raise HTTPException(status_code=404, detail="Note introuvable")
    if note.user_id != project.user_id:
        raise HTTPException(status_code=403, detail="Note et projet n’appartiennent pas au même utilisateur")

    if note not in project.notes:
        project.notes.append(note)
        db.commit()
    return {"message": f"Note '{note.title}' liée au projet '{project.name}'"}


# Récupérer les notes du projet
@router.get("/{project_id}/notes")
def get_project_notes(project_id: str, db: Session = Depends(get_db)):
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


###############################################################
# 🔔 Nouveau : bouton → déclencheur N8N
###############################################################
@router.post("/{project_id}/trigger", status_code=202)
def trigger_project_workflow(
    project_id: str,
    trigger: AgentTrigger = Body(default=AgentTrigger()),
    background: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    background.add_task(notify_n8n, event="project_button_pressed", project_id=project_id)
    return {"ok": True, "queued": True, "project_id": project_id}


###############################################################
# RÉCEPTION DE LA TODO ENVOYÉE PAR N8N
###############################################################
last_agent_todo = None

@router.post("/{project_id}/agent/todos/latest", status_code=status.HTTP_200_OK)
async def receive_agent_todo(project_id: str, request: Request, db: Session = Depends(get_db)):
    """
    🔹 Reçoit depuis N8N la To-Do générée par l'agent Analyste.
    """
    global last_agent_todo
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    payload = await request.json()
    last_agent_todo = {
        "project_id": project_id,
        "todos": payload.get("todos", payload),  # accepte {"todos": [...]} ou le JSON brut
        "receivedAt": datetime.utcnow().isoformat()
    }
    print(f"📥 To-Do reçue pour le projet {project_id} :", last_agent_todo)
    return {"ok": True, "stored": True, "project_id": project_id}


@router.get("/agent/todos/latest", status_code=status.HTTP_200_OK)
def get_last_agent_todo():
    """
    🔹 Permet de consulter la dernière To-Do reçue (tous projets confondus).
    """
    if not last_agent_todo:
        raise HTTPException(status_code=404, detail="Aucune To-Do reçue de N8N pour le moment.")
    return last_agent_todo
