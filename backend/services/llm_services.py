# Manage prompt engineering + LLM calls# backend/services/llm_services.py
import os
from openai import OpenAI

# Assure-toi d'avoir exporté:  OPENAI_API_KEY=sk-...
_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_llm_response(messages: list[dict], model: str = "gpt-4o-mini", temperature: float = 0.7) -> str:
    """
    messages: liste de dicts au format OpenAI [{"role":"system|user|assistant","content":"..."}]
    Retourne le texte de la réponse de l'assistant.
    """
    resp = _client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()
