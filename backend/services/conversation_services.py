from typing import List, Optional
from .storage_services import get_conversation, create_conversation, add_message as _add_message

SYSTEM_PROMPT = "Tu es un assistant utile, concis et amical."

def get_or_create_conversation(user_id: str, conversation_id: Optional[str]) -> str:
    """
    Retourne l'ID de conversation. Si rien fourni, on crée un ID simple basé sur le user.
    """
    conv_id = conversation_id or f"{user_id}-conv"
    create_conversation(conv_id)
    return conv_id

def get_conversation_history(conv_id: str) -> List[dict]:
    """
    Retourne l'historique prêt à être envoyé au LLM (avec le system prompt en tête).
    """
    history = get_conversation(conv_id)
    if not history or history[0].get("role") != "system":
        # On préfixe par un message system si absent
        return [{"role": "system", "content": SYSTEM_PROMPT}] + history
    return history

def add_message(conv_id: str, role: str, content: str) -> None:
    _add_message(conv_id, role, content)
