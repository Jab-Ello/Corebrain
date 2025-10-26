import os
from openai import OpenAI

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_llm_response(messages: list[dict], model: str = "gpt-4o-mini", temperature: float = 0.7) -> str:
    """
    messages: liste de dicts au format OpenAI
    Retourne le texte de la réponse de l'assistant
    """
    resp = _client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
    )
    return (resp.choices[0].message.content or "").strip()
