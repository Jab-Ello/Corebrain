# backend/routes/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llm_services import get_llm_response
from services.conversation_services import (
    get_or_create_conversation,
    get_conversation_history,
    add_message,
    delete_conversation,
    get_user_conversations  # ✅ n’oublie pas d'importer cette fonction
)

router = APIRouter(prefix="/api/agent", tags=["Agent"])


###############################################################
# SCHEMAS (Pydantic)
###############################################################
class ChatRequest(BaseModel):
    user_id: int
    conversation_id: Optional[int] = None
    message: str


class DeleteConversationRequest(BaseModel):
    user_id: int
    conversation_id: int


###############################################################
# ROUTES
###############################################################

# 🔹 Envoi d’un message au LLM et création automatique de conversation
@router.post("/chat")
def chat_with_agent(request: ChatRequest):
    try:
        conv_id = get_or_create_conversation(request.user_id, request.conversation_id)

        # 1) on persiste d'abord le message utilisateur
        add_message(conv_id, "user", request.message)

        # 2) on relit l'historique complet (incluant le message qu'on vient d'ajouter)
        history = get_conversation_history(conv_id)

        # 3) on appelle le LLM
        reply = get_llm_response(history)

        # 4) on persiste la réponse
        add_message(conv_id, "assistant", reply)

        return {"reply": reply, "conversation_id": conv_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")


# 🔹 Récupérer l’historique d’une conversation
@router.get("/history/{conversation_id}")
def get_history(conversation_id: int):
    try:
        history = get_conversation_history(conversation_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de l’historique: {str(e)}")


# 🔹 Supprimer une conversation et ses messages (cascade)
@router.delete("/conversation")
def delete_conversation_route(request: DeleteConversationRequest):
    try:
        ok = delete_conversation(request.user_id, request.conversation_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Conversation introuvable")
        return {"message": "Conversation supprimée avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")

@router.get("/conversations/{user_id}")
def list_conversations(user_id: int):
    try:
        conversations = get_user_conversations(user_id)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du chargement des conversations : {str(e)}")