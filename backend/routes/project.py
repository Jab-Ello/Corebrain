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

###############################################################
# RÉCEPTION DE L'ANALYSE ENVOYÉE PAR N8N
###############################################################
last_agent_analysis = None

@router.post("/{project_id}/agent/analysis/latest", status_code=status.HTTP_200_OK)
async def receive_agent_analysis(project_id: str, request: Request, db: Session = Depends(get_db)):
    """
    🔹 Reçoit depuis N8N l'analyse générée par l'agent Analyste.
    """
    global last_agent_analysis

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    payload = await request.json()

    last_agent_analysis = {
        "project_id": project_id,
        "analyse": payload.get("analyse", payload),  # accepte {"analysis": {...}} ou JSON brut
        "receivedAt": datetime.utcnow().isoformat()
    }

    print(f"📥 Analyse reçue pour le projet {project_id} :", last_agent_analysis)
    return {"ok": True, "stored": True, "project_id": project_id}


@router.get("/agent/analysis/latest", status_code=status.HTTP_200_OK)
def get_last_agent_analysis():
    """
    🔹 Permet de consulter la dernière analyse reçue (tous projets confondus).
    """
    if not last_agent_analysis:
        raise HTTPException(status_code=404, detail="Aucune analyse reçue de N8N pour le moment.")
    return last_agent_analysis


###############################################################
# RÉCEPTION DES OBJECTIFS ENVOYÉS PAR N8N
###############################################################
last_agent_objectives = None

@router.post("/{project_id}/agent/objectives/latest", status_code=status.HTTP_200_OK)
async def receive_agent_objectives(project_id: str, request: Request, db: Session = Depends(get_db)):
    """
    🔹 Reçoit depuis N8N les objectifs générés par l'agent Objectives.
    """
    global last_agent_objectives

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    payload = await request.json()

    last_agent_objectives = {
        "project_id": project_id,
        "objectives": payload.get("objectives", payload),
        "receivedAt": datetime.utcnow().isoformat()
    }

    print(f"📥 Objectifs reçus pour le projet {project_id} :", last_agent_objectives)
    return {"ok": True, "stored": True, "project_id": project_id}


@router.get("/agent/objectives/latest", status_code=status.HTTP_200_OK)
def get_last_agent_objectives():
    """
    🔹 Permet de consulter les derniers objectifs reçus (tous projets confondus).
    """
    if not last_agent_objectives:
        raise HTTPException(status_code=404, detail="Aucun objectif reçu de N8N pour le moment.")
    return last_agent_objectives

###############################################################
# RÉCEPTION DES DEADLINES ENVOYÉES PAR N8N
###############################################################
last_agent_deadlines = None

@router.post("/{project_id}/agent/todos/latest", status_code=status.HTTP_200_OK)
async def receive_agent_todos(project_id: str, request: Request, db: Session = Depends(get_db)):
    """
    🔹 Reçoit depuis N8N la To-Do list générée par l’agent Deadline.
    """
    global last_agent_deadlines

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    payload = await request.json()

    last_agent_deadlines = {
        "project_id": project_id,
        "todos": payload.get("todos", payload),
        "receivedAt": datetime.utcnow().isoformat()
    }

    print(f"📥 Deadlines reçues pour le projet {project_id} :", last_agent_deadlines)
    return {"ok": True, "stored": True, "project_id": project_id}


@router.get("/agent/todos/latest", status_code=status.HTTP_200_OK)
def get_last_agent_todos():
    """
    🔹 Permet de consulter la dernière To-Do reçue (tous projets confondus).
    """
    if not last_agent_deadlines:
        raise HTTPException(status_code=404, detail="Aucune To-Do reçue pour le moment.")
    return last_agent_deadlines

###############################################################
# RÉCEPTION DES CONSEILS ENVOYÉS PAR N8N
###############################################################
last_agent_advices = None

@router.post("/{project_id}/agent/advices/latest", status_code=status.HTTP_200_OK)
async def receive_agent_advices(project_id: str, request: Request, db: Session = Depends(get_db)):
    """
    🔹 Reçoit depuis N8N les conseils générés par l'agent Advices.
    """
    global last_agent_advices

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")

    payload = await request.json()

    last_agent_advices = {
        "project_id": project_id,
        "advices": payload.get("advices", payload),
        "receivedAt": datetime.utcnow().isoformat()
    }

    print(f"📥 Conseils reçus pour le projet {project_id} :", last_agent_advices)
    return {"ok": True, "stored": True, "project_id": project_id}


@router.get("/agent/advices/latest", status_code=status.HTTP_200_OK)
def get_last_agent_advices():
    """
    🔹 Permet de consulter les derniers conseils reçus (tous projets confondus).
    """
    if not last_agent_advices:
        raise HTTPException(status_code=404, detail="Aucun conseil reçu pour le moment.")
    return last_agent_advices
