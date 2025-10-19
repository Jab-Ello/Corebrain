from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # pendant le dev uniquement
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = os.path.join(os.path.dirname(__file__), "frontend_dist")
# sert les fichiers statiques (JS, CSS…)
app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="assets")

# renvoie l'index.html pour la racine
@app.get("/")
def main():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="Index not found")

# fallback SPA : toutes les routes (sauf /api/* et /assets/*) renvoient index.html
@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("assets/"):
        raise HTTPException(status_code=404)
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file, media_type="text/html")
    raise HTTPException(status_code=404, detail="Index not found")
