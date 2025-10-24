import subprocess
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # dossier racine du projet
FRONTEND = ROOT / "frontend"
OUT = FRONTEND / "out"
DIST = ROOT / "backend" / "frontend_dist"

def run(cmd, cwd=None):
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)

def main():
    # 1) Build + export Next (génère frontend/out)
    run(["npm", "install"], cwd=FRONTEND)          # respecte ton package-lock.json
    run(["npm", "run", "build"], cwd=FRONTEND)     # next build
    run(["npx", "next", "export"], cwd=FRONTEND)   # next export → out/

    # 2) Copie vers backend/frontend_dist (clean + copy)
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)
    shutil.copytree(OUT, DIST, dirs_exist_ok=True)
    print(f"✅ Copié: {OUT} → {DIST}")

if __name__ == "__main__":
    main()
