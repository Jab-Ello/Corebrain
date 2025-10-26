# backend/app.py (extrait)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pathlib import Path
from database.database import engine
from database import models

app = FastAPI()
models.Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

from routes.agent import router as agent_router
from routes.user import router as user_router
app.include_router(agent_router)
app.include_router(user_router)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend_dist"
INDEX_FILE = FRONTEND_DIST / "index.html"

for sub in ["_next", "assets", "static"]:
    p = FRONTEND_DIST / sub
    if p.exists():
        app.mount(f"/{sub}", StaticFiles(directory=p), name=sub)

@app.get("/", include_in_schema=False)
def root():
    return FileResponse(INDEX_FILE)


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    candidate = FRONTEND_DIST / full_path
    if candidate.is_dir():
        candidate = candidate / "index.html"
    if candidate.exists():
        return FileResponse(candidate)
    return FileResponse(INDEX_FILE)
