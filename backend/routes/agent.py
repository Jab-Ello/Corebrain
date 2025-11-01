# backend/routes/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.llm_services import get_llm_response
from services.conversation_services import (
    get_or_create_conversation,
    get_conversation_history_with_project_context,
    add_message,
)

router = APIRouter(prefix="/api/agent", tags=["Agent"])


class ChatRequest(BaseModel):
    user_id: str
    conversation_id: Optional[str] = None
    project_id: Optional[str] = None  # ✅ UUID string, plus integer !
    project_context: Optional[dict] = None  # ✅ données du projet
    message: str


@router.post("/chat")
def chat_with_agent(request: ChatRequest):
    try:
        # 1️⃣ Créer / récupérer la conversation associée à l’utilisateur et au projet
        conv_id = get_or_create_conversation(
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            project_id=request.project_id,  # ✅ UUID string, accepté
        )

        # 2️⃣ Charger l’historique + contexte du projet
        history = get_conversation_history_with_project_context(conv_id, request.project_id)

        # 3️⃣ Injecter les métadonnées du projet dans le contexte LLM
        if request.project_context:
            ctx = request.project_context
            project_info = (
                f"Nom du projet : {ctx.get('name')}\n"
                f"Description : {ctx.get('description')}\n"
                f"Contexte : {ctx.get('context')}\n"
                f"Priorité : {ctx.get('priority')}\n"
                f"Statut : {ctx.get('status')}\n"
            )
            history.insert(1, {
                "role": "system",
                "content": f"Voici le contexte du projet sur lequel l'utilisateur travaille :\n{project_info}"
            })

        # 4️⃣ Ajouter le message utilisateur
        add_message(conv_id, "user", request.message)

        # 5️⃣ Appeler le modèle IA
        messages = history + [{"role": "user", "content": request.message}]
        reply = get_llm_response(messages)

        # 6️⃣ Sauvegarder la réponse
        add_message(conv_id, "assistant", reply)

        return {"reply": reply, "conversation_id": conv_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
