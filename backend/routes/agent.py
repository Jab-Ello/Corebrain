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
    project_id: Optional[str] = None 
    project_context: Optional[dict] = None  
    message: str


@router.post("/chat")
def chat_with_agent(request: ChatRequest):
    try:
        conv_id = get_or_create_conversation(
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            project_id=request.project_id,  
        )

        history = get_conversation_history_with_project_context(conv_id, request.project_id)

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

        add_message(conv_id, "user", request.message)

        messages = history + [{"role": "user", "content": request.message}]
        reply = get_llm_response(messages)

        add_message(conv_id, "assistant", reply)

        return {"reply": reply, "conversation_id": conv_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
