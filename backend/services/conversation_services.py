# backend/services/conversation_services.py
from typing import List, Optional
from datetime import datetime

from .storage_services import (
    get_conversation,
    create_conversation,
    add_message as _add_message,
)

# ✅ On lit le contexte projet + notes depuis la DB
from database.database import SessionLocal
from database.models import Project, Note, project_notes

DEFAULT_SYSTEM_PROMPT = "Tu es un assistant utile, concis et amical."

# ------------------------------------------------------------
# Construit un prompt système spécifique au projet
# ------------------------------------------------------------
def _build_project_system_prompt(project_id: Optional[str]) -> str:
    if not project_id:
        return DEFAULT_SYSTEM_PROMPT

    db = SessionLocal()
    try:
        proj = db.query(Project).filter(Project.id == project_id).first()
        if not proj:
            return DEFAULT_SYSTEM_PROMPT

        # Notes liées: pinned d'abord, puis plus récentes
        notes_q = (
            db.query(Note)
            .join(project_notes, Note.id == project_notes.c.note_id)
            .filter(project_notes.c.project_id == project_id)
            .order_by(Note.pinned.desc(), Note.updatedAt.desc())
            .limit(8)
        )
        notes = notes_q.all()

        notes_block = []
        for n in notes:
            # on préfère summary si dispo, sinon un extrait court du contenu
            preview = (n.summary or (n.content or "")[:300]).replace("\n", " ").strip()
            notes_block.append(f"- {n.title}: {preview}")

        notes_text = "\n".join(notes_block) if notes_block else "Aucune note liée."
        ctx = (proj.context or "").strip()
        desc = (proj.description or "").strip()

        return (
            f"Tu es l'agent du projet '{proj.name}'.\n"
            f"Description: {desc or '(non renseignée)'}\n"
            f"Contexte: {ctx or '(non renseigné)'}\n"
            f"Priorité: {proj.priority}\n"
            f"Consigne: réponds uniquement à propos de CE projet.\n"
            f"Notes liées (pinned d'abord, puis récentes):\n{notes_text}\n"
            f"Si l'utilisateur s'éloigne du sujet, recentre vers le projet."
        )
    finally:
        db.close()


# ------------------------------------------------------------
# Créer / retrouver une conversation (clé isolée par projet)
# ------------------------------------------------------------
def get_or_create_conversation(
    user_id: str,
    conversation_id: Optional[str],
    project_id: Optional[str] = None,
) -> str:
    """
    Clé de conversation:
    - si conversation_id fourni -> on l’utilise
    - sinon -> clé déterministe par (user, project) pour éviter les mélanges
    """
    if conversation_id:
        conv_id = conversation_id
    else:
        conv_id = f"{user_id}::proj::{project_id}" if project_id is not None else f"{user_id}::global"

    create_conversation(conv_id)
    return conv_id


# ------------------------------------------------------------
# Historique + message système (contexte projet)
# ------------------------------------------------------------
def get_conversation_history_with_project_context(
    conv_id: str,
    project_id: Optional[str],
) -> List[dict]:
    history = get_conversation(conv_id)
    system = _build_project_system_prompt(project_id)

    if not history or history[0].get("role") != "system":
        return [{"role": "system", "content": system}] + history

    # Si un système existe déjà mais ne correspond pas (changement de projet), on remplace
    if history[0]["content"] != system:
        history = [{"role": "system", "content": system}] + history[1:]
    return history


# ------------------------------------------------------------
# Ajouter un message
# ------------------------------------------------------------
def add_message(conv_id: str, role: str, content: str) -> None:
    # NB: le stockage en RAM ne gère pas de timestamp -> on se contente du rôle + contenu
    _add_message(conv_id, role, content)
