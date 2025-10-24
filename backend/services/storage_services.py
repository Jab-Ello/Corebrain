# Manages the recording and storage of notes# backend/services/storage_services.py
# Stockage minimal en RAM pour démarrer (remplace ensuite par ta DB)

from typing import Dict, List

# conversations[conv_id] = [{"role": "...", "content": "..."}]
_conversations: Dict[str, List[dict]] = {}

def get_conversation(conv_id: str) -> List[dict]:
    return _conversations.get(conv_id, [])

def create_conversation(conv_id: str) -> None:
    if conv_id not in _conversations:
        _conversations[conv_id] = []

def add_message(conv_id: str, role: str, content: str) -> None:
    if conv_id not in _conversations:
        _conversations[conv_id] = []
    _conversations[conv_id].append({"role": role, "content": content})
