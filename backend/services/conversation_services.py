# backend/services/conversation_services.py
from typing import List, Optional
from datetime import datetime
from uuid import uuid4
from sqlalchemy.orm import Session
from database.database import SessionLocal
from database.models import Conversation, Message

SYSTEM_PROMPT = "Tu es un assistant utile, concis et amical."


###############################################################
# Créer ou récupérer une conversation
###############################################################
def get_or_create_conversation(user_id: int, conversation_id: Optional[int]) -> int:
    """
    Retourne l'ID numérique d'une conversation existante, 
    ou en crée une nouvelle si aucun ID n’est fourni.
    """
    db: Session = SessionLocal()
    try:
        # ✅ Si une conversation existante est fournie, la retourner
        if conversation_id is not None:
            existing = db.query(Conversation).filter(Conversation.id == conversation_id).first()
            if existing:
                return existing.id

        # ✅ Sinon, créer une nouvelle conversation
        new_conv = Conversation(
            uuid=str(uuid4()),
            title="Nouvelle conversation",
            user_id=user_id,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
        )

        db.add(new_conv)
        db.commit()
        db.refresh(new_conv)
        return new_conv.id
    finally:
        db.close()


###############################################################
# Récupérer l’historique complet d’une conversation
###############################################################
def get_conversation_history(conv_id: int) -> List[dict]:
    """
    Retourne l’historique complet sous forme de liste de messages.
    On préfixe toujours avec le message système.
    """
    db: Session = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conv_id)
            .order_by(Message.createdAt.asc())
            .all()
        )

        history = [{"role": m.role, "content": m.content} for m in messages]

        # Ajouter le message système en premier si absent
        if not history or history[0].get("role") != "system":
            history.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

        return history
    finally:
        db.close()


###############################################################
# Ajouter un message à une conversation
###############################################################
def add_message(conv_id: int, role: str, content: str) -> None:
    """
    Ajoute un message (user ou assistant) à une conversation existante.
    """
    db: Session = SessionLocal()
    try:
        message = Message(
            role=role,
            content=content,
            conversation_id=conv_id,
            createdAt=datetime.utcnow(),
        )
        db.add(message)

        # Met à jour la date de dernière activité de la conversation
        conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
        if conv:
            conv.updatedAt = datetime.utcnow()

        db.commit()
    finally:
        db.close()


###############################################################
# Supprimer une conversation et ses messages
###############################################################
def delete_conversation(user_id: int, conv_id: int) -> bool:
    """
    Supprime une conversation et tous ses messages (cascade SQL).
    Retourne True si supprimé, False si introuvable.
    """
    db: Session = SessionLocal()
    try:
        conv = (
            db.query(Conversation)
            .filter(Conversation.id == conv_id, Conversation.user_id == user_id)
            .first()
        )

        if not conv:
            return False

        db.delete(conv)
        db.commit()
        return True
    finally:
        db.close()

###############################################################
# Récupérer toutes les conversations d’un utilisateur
###############################################################
def get_user_conversations(user_id: int):
    """
    Retourne la liste des conversations d’un utilisateur, triées par date.
    """
    db: Session = SessionLocal()
    try:
        convs = (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updatedAt.desc())
            .all()
        )
        return [
            {
                "id": c.id,
                "title": c.title,
                "createdAt": c.createdAt,
                "updatedAt": c.updatedAt,
            }
            for c in convs
        ]
    finally:
        db.close()