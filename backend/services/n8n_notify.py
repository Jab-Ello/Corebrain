import requests

N8N_WEBHOOK_URL = "https://jabran-ellaoui.app.n8n.cloud/webhook/project-orchestrator"

def notify_n8n(event: str, project_id: str):
    payload = {"event": event, "project_id": project_id}
    print(f"[N8N] Attempting webhook → {N8N_WEBHOOK_URL}")
    print(f"[N8N] Payload: {payload}")

    try:
        response = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=10)
        print(f"[N8N] Status: {response.status_code}")
        print(f"[N8N] Response: {response.text}")
    except Exception as e:
        print(f"[N8N] Erreur d’envoi du webhook : {e}")
