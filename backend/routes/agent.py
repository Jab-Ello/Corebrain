# backend/routes/agent.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_services import get_llm_response
from services.conversation_services import (
    get_or_create_conversation,
    get_conversation_history,
    add_message,
)

router = APIRouter(prefix="/api/agent", tags=["Agent"])

class ChatRequest(BaseModel):
    user_id: str
    conversation_id: str | None = None
    message: str

@router.post("/chat")
def chat_with_agent(request: ChatRequest):
    try:
        # 1) conversation
        conv_id = get_or_create_conversation(request.user_id, request.conversation_id)

        # 2) historique + nouveau message user
        history = get_conversation_history(conv_id)
        add_message(conv_id, "user", request.message)

        # 3) appel LLM
        messages = history + [{"role": "user", "content": request.message}]
        reply = get_llm_response(messages)

        # 4) persistance réponse
        add_message(conv_id, "assistant", reply)

        return {"reply": reply, "conversation_id": conv_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
