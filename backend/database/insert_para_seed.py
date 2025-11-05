# backend/database/insert_para_seed.py
from .database import SessionLocal, engine
from .models import User, Project, Area, Note, Tag
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, text
import random
import string

TARGET_USER_ID = "87ffb41b-3efb-45b8-a411-2f714d074d67"

SEED_PREFIX = "[para]"   
RANDOM_SEED = 1337       

COUNTS = {
    "projects_work": 8,       
    "projects_personal": 6,   
    "areas": 10,              
    "notes": 420,             
    "tags": 60,               
}

NOTE_MIX = {
    "meeting": 0.15,
    "todo": 0.25,
    "review_weekly": 0.10,
    "review_monthly": 0.04,
    "learning": 0.16,
    "resource": 0.18,
    "retro": 0.07,
    "daily_log": 0.05,    
}

BATCH_SIZE = 200
DAYS_HISTORY = 360

def gen_id() -> str:
    return str(uuid4())

def now_utc():
    return datetime.now(timezone.utc)

def random_past_datetime(days_back=DAYS_HISTORY):
    d = random.randint(0, days_back)
    base = now_utc() - timedelta(days=d)
    hour_choices = [8,9,10,10,11,14,14,15,16,19,19,20,21]
    h = random.choice(hour_choices)
    m = random.randint(0, 59)
    s = random.randint(0, 59)
    return base.replace(hour=h, minute=m, second=s, microsecond=0)

def pick(lst, k=1):
    return random.sample(lst, k=min(k, len(lst)))

def safe_token(n=6):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

def titleize(words):
    return " ".join(w.capitalize() for w in words.split())

def ensure_user(db, uid: str) -> User:
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise RuntimeError(f"Utilisateur {uid} introuvable — crée-le avant de lancer ce seed.")
    return u

def get_or_create_tag(db, name: str) -> Tag:
    t = db.query(Tag).filter(Tag.name == name).first()
    if t: return t
    t = Tag(id=gen_id(), name=name, createdAt=random_past_datetime())
    db.add(t)
    return t

def clear_existing_seed(db, user_id: str, prefix: str):
    """Supprime toutes les données SEED (avec le prefix) pour un user, sans toucher le reste."""
    like = f"{prefix} %"

    db.execute(text("""
        DELETE FROM note_tags
        WHERE note_id IN (
            SELECT id FROM notes
            WHERE user_id = :uid AND title LIKE :prefx
        );
    """), {"uid": user_id, "prefx": like})

    db.execute(text("""
        DELETE FROM project_notes
        WHERE note_id IN (SELECT id FROM notes WHERE user_id = :uid AND title LIKE :prefx)
           OR project_id IN (SELECT id FROM projects WHERE user_id = :uid AND name LIKE :prefx);
    """), {"uid": user_id, "prefx": like})

    db.execute(text("""
        DELETE FROM area_notes
        WHERE note_id IN (SELECT id FROM notes WHERE user_id = :uid AND title LIKE :prefx)
           OR area_id IN (SELECT id FROM areas WHERE user_id = :uid AND name LIKE :prefx);
    """), {"uid": user_id, "prefx": like})

    db.execute(text("DELETE FROM notes    WHERE user_id = :uid AND title LIKE :prefx;"),
               {"uid": user_id, "prefx": like})
    db.execute(text("DELETE FROM projects WHERE user_id = :uid AND name  LIKE :prefx;"),
               {"uid": user_id, "prefx": like})
    db.execute(text("DELETE FROM areas    WHERE user_id = :uid AND name  LIKE :prefx;"),
               {"uid": user_id, "prefx": like})

    db.execute(text("""
        DELETE FROM tags
        WHERE name LIKE :prefx
          AND id NOT IN (SELECT DISTINCT tag_id FROM note_tags);
    """), {"prefx": like})

    db.commit()

WORK_PROJECT_NAMES = [
    "Refonte du site vitrine",
    "Client mobile — MVP",
    "Tableau de bord Analytics",
    "Automatisation de la facturation",
    "Proof of Concept IA",
    "Migration base de données",
    "Performance front-end",
    "Refactoring API",
]

STUDY_PROJECT_NAMES = [
    "Projet Machine Learning",
    "Algorithmes avancés",
    "Systèmes distribués",
    "Dév Web moderne",
]

PERSONAL_PROJECT_NAMES = [
    "Préparation semi-marathon",
    "Aménagement appartement",
    "Budget personnel",
    "Routine sommeil",
    "Défi lecture",
    "Album photo familial",
]

AREA_NAMES = [
    "Santé & Sport",
    "Carrière & Études",
    "Finances",
    "Famille & Amis",
    "Maison & Logement",
    "Apprentissages",
    "Créativité & Écriture",
    "Administratif",
    "Voyages",
    "Routines & Systèmes",
]

BASE_TAGS = [
    "meeting", "todo", "review", "weekly", "monthly", "learning", "resource", "retro",
    "pro", "perso", "priorité-haute", "priorité-moyenne", "priorité-basse",
    "ml", "python", "fastapi", "nextjs", "sqlite", "pytorch", "nlp", "vision",
    "temps", "habitudes", "course", "musculation", "nutrition", "sommeil",
    "budget", "lecture", "écriture", "voyage", "app"
]

PEOPLE = ["Alice", "Bruno", "Camille", "David", "Emma", "Farid", "Gaëlle", "Hugo", "Inès", "Jonas", "Lina", "Maya"]

def generate_tags(db):
    tags = []
    base = set(BASE_TAGS)
    while len(base) < COUNTS["tags"]:
        base.add(f"t{safe_token(3)}")
    for name in list(base)[:COUNTS["tags"]]:
        tname = f"{SEED_PREFIX} {name}"
        tag = db.query(Tag).filter(Tag.name == tname).first()
        if not tag:
            tag = Tag(id=gen_id(), name=tname, createdAt=random_past_datetime())
            db.add(tag)
        tags.append(tag)
    db.flush()
    return tags

def ensure_projects(db, user: User):
    projects = []
    for base_name in WORK_PROJECT_NAMES + STUDY_PROJECT_NAMES:
        name = f"{SEED_PREFIX} {base_name}"
        existing = db.query(Project).filter(Project.user_id == user.id, Project.name == name).first()
        if existing:
            projects.append(existing); continue
        created = random_past_datetime()
        status = random.choices(["ACTIVE","PAUSED","COMPLETED"], weights=[0.6,0.2,0.2])[0]
        p = Project(
            id=gen_id(), name=name,
            description=f"Objectif: {base_name} — cadrage, planning, livrables.",
            context=f"Notes, specs et décisions liées à {base_name}.",
            status=status,
            startDate=created,
            plannedEndDate=created + timedelta(days=random.randint(30,120)) if random.random()<0.7 else None,
            endDate=created + timedelta(days=random.randint(45,200)) if status=="COMPLETED" else None,
            priority=random.randint(0,3),
            color=f"#{random.randint(0, 0xFFFFFF):06X}",
            createdAt=created,
            updatedAt=created + timedelta(days=random.randint(0,60)),
            user_id=user.id,
        )
        db.add(p); projects.append(p)

    for base_name in PERSONAL_PROJECT_NAMES[:COUNTS["projects_personal"]]:
        name = f"{SEED_PREFIX} {base_name}"
        existing = db.query(Project).filter(Project.user_id == user.id, Project.name == name).first()
        if existing:
            projects.append(existing); continue
        created = random_past_datetime()
        status = random.choices(["ACTIVE","PAUSED","COMPLETED"], weights=[0.55,0.2,0.25])[0]
        p = Project(
            id=gen_id(), name=name,
            description=f"Projet personnel: {base_name}",
            context=f"Contexte, routines et suivi liés à {base_name}.",
            status=status,
            startDate=created,
            plannedEndDate=created + timedelta(days=random.randint(21,150)) if random.random()<0.6 else None,
            endDate=created + timedelta(days=random.randint(30,180)) if status=="COMPLETED" else None,
            priority=random.randint(0,3),
            color=f"#{random.randint(0, 0xFFFFFF):06X}",
            createdAt=created,
            updatedAt=created + timedelta(days=random.randint(0,60)),
            user_id=user.id,
        )
        db.add(p); projects.append(p)

    db.flush()
    return projects

def ensure_areas(db, user: User):
    areas = []
    for base_name in AREA_NAMES[:COUNTS["areas"]]:
        name = f"{SEED_PREFIX} {base_name}"
        existing = db.query(Area).filter(Area.user_id == user.id, Area.name == name).first()
        if existing:
            areas.append(existing); continue
        created = random_past_datetime()
        a = Area(
            id=gen_id(), name=name,
            description=f"Domaine de responsabilité: {base_name}",
            color=f"#{random.randint(0, 0xFFFFFF):06X}",
            createdAt=created,
            updatedAt=created + timedelta(days=random.randint(0,60)),
            user_id=user.id,
        )
        db.add(a); areas.append(a)
    db.flush()
    return areas

def meeting_content(project_name="Général"):
    date = random_past_datetime().strftime("%d/%m/%Y %H:%M")
    participants = ", ".join(pick(PEOPLE, k=random.randint(3,5)))
    decisions = [
        "Valider la portée du sprint",
        "Décaler la livraison de 48h pour tests",
        "Adopter la convention de nommage",
        "Créer un job d’ETL nocturne",
        "Prioriser correctifs P1 avant nouvelles features"
    ]
    actions = [
        "Préparer la maquette Figma v2",
        "Écrire les tests d’intégration API",
        "Mettre à jour la documentation",
        "Analyser les logs de performance",
        "Planifier la démo client"
    ]
    owners = pick(PEOPLE, k=5)
    lines = [
        f"# Réunion {project_name} — {date}",
        f"**Participants**: {participants}",
        "## Décisions",
    ]
    for d in pick(decisions, k=random.randint(2,4)):
        lines.append(f"- {d}.")
    lines.append("## Actions")
    for a, o in zip(pick(actions, k=random.randint(3,5)), owners):
        due = (now_utc() + timedelta(days=random.randint(1,10))).date().isoformat()
        lines.append(f"- [ ] {a} — _Responsable: {o}_ — **Échéance**: {due}")
    lines.append("## Questions ouvertes")
    lines.append("- Points à clarifier côté client (accès staging, données d’essai).")
    lines.append("- Choix final du provider d’hébergement.")
    return "\n".join(lines)

def todo_content():
    pool = [
        "Répondre aux emails importants",
        "Revoir le plan de la semaine",
        "Écrire la spec de la fonctionnalité",
        "Faire la séance de course (45')",
        "Préparer meal-prep pour 3 jours",
        "Mettre à jour le budget mensuel",
        "Lire 20 pages du livre en cours",
        " Ranger le bureau / câbles",
        "Sauvegarder le projet"
    ]
    lines = ["# À faire"]
    lines.append("## Aujourd’hui")
    for _ in range(random.randint(2,4)):
        t = random.choice(pool)
        checkbox = "[x]" if random.random() < 0.4 else "[ ]"
        lines.append(f"- {checkbox} {t}")
    lines.append("## Cette semaine")
    for _ in range(random.randint(3,6)):
        t = random.choice(pool)
        est = random.choice(["(~30min)", "(~1h)", "(~2h)", ""])
        prio = random.choice(["(P1)", "(P2)", "(P3)"])
        lines.append(f"- [ ] {t} {est} {prio}".strip())
    lines.append("\nNotes: éviter réunions le matin, gros focus block 10h–12h.")
    return "\n".join(lines)

def review_content(kind="weekly"):
    head = f"# Revue {kind.capitalize()}\n"
    lines = [head]
    lines.append("## Ce qui a bien fonctionné")
    lines += [f"- Bon focus {random.randint(6,12)}h en deep work.",
              "- Sport maintenu (3 séances).",
              "- Communication plus claire avec l’équipe."]
    lines.append("## À améliorer")
    lines += ["- Bloquer le scroll le soir.",
              "- Clarifier les objectifs avant de démarrer."]
    lines.append("## Priorités clés")
    lines += ["- Finaliser une feature de bout en bout.",
              "- Préparer la démo/présentation.",
              "- Routine sommeil stable."]
    if kind == "weekly":
        lines.append("## Indicateurs")
        lines += [f"- Kilométrage course: {random.randint(15,40)} km",
                  f"- Pages lues: {random.randint(40,120)}",
                  f"- Sessions de code: {random.randint(5,12)}"]
    else:
        lines.append("## Bilan du mois")
        lines += [f"- Projets avancés: {random.randint(2,5)}",
                  f"- Apprentissage: {random.choice(['FastAPI', 'Pandas', 'Next.js'])}",
                  "- Points d’attention: surcharge la dernière semaine."]
    return "\n".join(lines)

def learning_content():
    topic = random.choice(["Python", "FastAPI", "SQL", "Next.js", "Pandas", "Pydantic"])
    snippets = {
        "Python": """```python
def chunks(seq, n):
    for i in range(0, len(seq), n):
        yield seq[i:i+n]
```""",
        "FastAPI": """```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
def health():
    return {"ok": True}
```""",
        "SQL": """```sql
SELECT p.id, p.name, COUNT(n.id) AS notes
FROM projects p
LEFT JOIN project_notes pn ON pn.project_id = p.id
LEFT JOIN notes n ON n.id = pn.note_id
GROUP BY p.id, p.name
ORDER BY notes DESC;
```""",
        "Next.js": """```tsx
export default function Page() {
  return <main className="p-6">Hello 👋</main>
}
```""",
        "Pandas": """```python
import pandas as pd
df = pd.DataFrame({"a":[1,2,3]})
df["b"] = df["a"].rolling(2).mean()
```""",
        "Pydantic": """```python
from pydantic import BaseModel

class Project(BaseModel):
    id: str
    name: str
```"""
    }
    lines = [
        f"# Notes d’apprentissage — {topic}",
        "- Concepts clés:",
        f"  - {titleize(safe_token(5))}",
        f"  - {titleize(safe_token(5))}",
        "- Exemples & snippets:",
        snippets[topic],
        "- À pratiquer cette semaine:",
        "  - Refaire un petit projet d’exercice",
        "  - Écrire des tests unitaires"
    ]
    return "\n".join(lines)

def resource_content():
    sources = [
        ("Documentation FastAPI", "https://fastapi.tiangolo.com/"),
        ("Docs Python", "https://docs.python.org/3/"),
        ("Pandas User Guide", "https://pandas.pydata.org/docs/"),
        ("Next.js Docs", "https://nextjs.org/docs"),
        ("SQL Tutorial", "https://www.sqltutorial.org/")
    ]
    title, url = random.choice(sources)
    why = random.choice([
        "explications claires + exemples",
        "meilleure pratique pour structurer un projet",
        "référence fiable pour les méthodes",
        "guides étape par étape"
    ])
    lines = [
        f"# Ressource: {title}",
        f"- Type: {random.choice(['article','documentation','vidéo','podcast','outil'])}",
        f"- Lien: {url}",
        f"- Pourquoi utile: {why}",
        "- À retenir:",
        f"  - {titleize(safe_token(6))}",
        f"  - {titleize(safe_token(6))}",
    ]
    return "\n".join(lines)

def retro_content(project_name="Général"):
    lines = [
        f"# Rétrospective — {project_name}",
        "## Faits marquants",
        "- Livraison de la v1 en staging.",
        "- Retour positif du client sur la navigation.",
        "## Points de douleur",
        "- Délais sur les tests end-to-end.",
        "- Petite dette technique accumulée.",
        "## Idées d’amélioration",
        "- Définir une Definition of Done plus stricte.",
        "- Pair programming 2x/semaine.",
        "## Expériences à tenter",
        "- Daily asynchrone sur 3 jours.",
        "- Démo interne courte chaque vendredi."
    ]
    return "\n".join(lines)

def daily_log_content():
    mood = random.choice(["👍 énergique", "😐 moyen", "🫥 fatigué"])
    focus = random.choice(["bon focus", "focus moyen", "focus difficile"])
    lines = [
        "# Journal du jour",
        f"- Humeur: {mood}",
        f"- Focus: {focus}",
        "- 1 chose importante accomplie: ",
        f"  - {titleize(safe_token(6))}",
        "- À faire demain:",
        "  - Continuer la tâche en cours",
        "  - Bloquer un créneau de deep work (10h–12h)"
    ]
    return "\n".join(lines)

def make_note(db, user, title, content, created, updated, tags, projects=None, areas=None, pinned=False):
    existing = db.query(Note).filter(Note.user_id == user.id, Note.title == title).first()
    if existing:
        for t in tags:
            if t and t not in existing.tags:
                existing.tags.append(t)
        for p in (projects or []):
            if p and p not in existing.projects:
                existing.projects.append(p)
        for a in (areas or []):
            if a and a not in existing.areas:
                existing.areas.append(a)
        db.add(existing)
        return existing

    first_line = content.split("\n", 1)[0]
    summary = first_line[:180] if first_line else ""
    n = Note(
        id=gen_id(),
        title=title,
        content=content,
        summary=summary,
        wordCount=len(content.split()),
        pinned=pinned,
        createdAt=created,
        updatedAt=updated,
        user_id=user.id,
    )
    for t in tags:
        if t: n.tags.append(t)
    for p in (projects or []):
        if p: n.projects.append(p)
    for a in (areas or []):
        if a: n.areas.append(a)
    db.add(n)
    return n

def main():
    print("[para-seed] Engine:", getattr(engine, "url", "unknown"))
    random.seed(RANDOM_SEED)
    db = SessionLocal()
    try:
        user = ensure_user(db, TARGET_USER_ID)

        clear_existing_seed(db, user.id, SEED_PREFIX)

        tags = generate_tags(db)

        projects = ensure_projects(db, user)
        areas = ensure_areas(db, user)

        tag_map = {t.name: t for t in tags}
        t_meeting   = tag_map.get(f"{SEED_PREFIX} meeting")   or get_or_create_tag(db, f"{SEED_PREFIX} meeting")
        t_todo      = tag_map.get(f"{SEED_PREFIX} todo")      or get_or_create_tag(db, f"{SEED_PREFIX} todo")
        t_review    = tag_map.get(f"{SEED_PREFIX} review")    or get_or_create_tag(db, f"{SEED_PREFIX} review")
        t_weekly    = tag_map.get(f"{SEED_PREFIX} weekly")    or get_or_create_tag(db, f"{SEED_PREFIX} weekly")
        t_monthly   = tag_map.get(f"{SEED_PREFIX} monthly")   or get_or_create_tag(db, f"{SEED_PREFIX} monthly")
        t_learning  = tag_map.get(f"{SEED_PREFIX} learning")  or get_or_create_tag(db, f"{SEED_PREFIX} learning")
        t_resource  = tag_map.get(f"{SEED_PREFIX} resource")  or get_or_create_tag(db, f"{SEED_PREFIX} resource")
        t_retro     = tag_map.get(f"{SEED_PREFIX} retro")     or get_or_create_tag(db, f"{SEED_PREFIX} retro")
        t_pro       = tag_map.get(f"{SEED_PREFIX} pro")       or get_or_create_tag(db, f"{SEED_PREFIX} pro")
        t_perso     = tag_map.get(f"{SEED_PREFIX} perso")     or get_or_create_tag(db, f"{SEED_PREFIX} perso")

        pinned_titles = [
            f"{SEED_PREFIX} Weekly Review — Modèle",
            f"{SEED_PREFIX} Monthly Review — Modèle",
            f"{SEED_PREFIX} Liste Projets actifs",
            f"{SEED_PREFIX} Routines quotidiennes",
            f"{SEED_PREFIX} Inbox — Captures rapides",
        ]
        for pt in pinned_titles:
            if "Weekly" in pt:
                content = review_content("weekly")
                tags_pt = [t_review, t_weekly]
            elif "Monthly" in pt:
                content = review_content("monthly")
                tags_pt = [t_review, t_monthly]
            elif "Routines" in pt:
                content = "\n".join([
                    "- Matin: eau, mobilité, focus block (10h–12h)",
                    "- Midi: marche 15', protéines",
                    "- Soir: déconnexion 21h, journal, lecture"
                ])
                tags_pt = [t_perso]
            elif "Liste Projets" in pt:
                actifs = [p.name for p in projects if p.status == "ACTIVE"]
                content = "\n".join([f"- {n}" for n in actifs]) or "- (aucun)"
                tags_pt = [t_pro]
            else:
                content = "\n".join([
                    "- Idée: …",
                    "- À lire: …",
                    "- À vérifier: …"
                ])
                tags_pt = [t_perso]

            make_note(
                db, user, pt, content,
                created=random_past_datetime(),
                updated=now_utc(),
                tags=tags_pt,
                pinned=True
            )

        total_notes = 0
        types = list(NOTE_MIX.keys())
        probs = list(NOTE_MIX.values())

        for _ in range(COUNTS["notes"]):
            kind = random.choices(types, weights=probs)[0]
            created = random_past_datetime()
            updated = created + timedelta(days=random.randint(0, 20))

            proj = random.choice(projects) if random.random() < 0.7 else None
            ars = pick(areas, k=random.randint(0,2))

            auto_tags = []
            if proj:
                auto_tags.append(t_pro)
            else:
                if random.random() < 0.5: auto_tags.append(t_perso)

            if kind == "meeting":
                base_name = proj.name.split(SEED_PREFIX+' ')[-1] if proj else 'Général'
                title = f"{SEED_PREFIX} CR réunion — {base_name} — {created.strftime('%Y-%m-%d')}"
                content = meeting_content(base_name)
                tags_note = [t_meeting] + auto_tags
            elif kind == "todo":
                title = f"{SEED_PREFIX} À faire — {created.strftime('%a %d %b')}"
                content = todo_content()
                tags_note = [t_todo] + auto_tags + [random.choice([t_pro, t_perso])]
            elif kind == "review_weekly":
                title = f"{SEED_PREFIX} Weekly Review — Semaine {created.isocalendar()[1]} {created.year}"
                content = review_content("weekly")
                tags_note = [t_review, t_weekly] + auto_tags
            elif kind == "review_monthly":
                title = f"{SEED_PREFIX} Monthly Review — {created.strftime('%B %Y')}"
                content = review_content("monthly")
                tags_note = [t_review, t_monthly] + auto_tags
            elif kind == "learning":
                title = f"{SEED_PREFIX} Notes d’apprentissage — {safe_token(5)}"
                content = learning_content()
                tags_note = [t_learning] + auto_tags
            elif kind == "resource":
                title = f"{SEED_PREFIX} Ressource — {safe_token(5)}"
                content = resource_content()
                tags_note = [t_resource] + auto_tags
            elif kind == "retro":
                base_name = proj.name.split(SEED_PREFIX+' ')[-1] if proj else 'Général'
                title = f"{SEED_PREFIX} Rétrospective — {base_name} — {created.strftime('%Y-%m-%d')}"
                content = retro_content(base_name)
                tags_note = [t_retro] + auto_tags
            elif kind == "daily_log":
                title = f"{SEED_PREFIX} Journal — {created.strftime('%Y-%m-%d')}"
                content = daily_log_content()
                tags_note = [t_perso]
            else:
                title = f"{SEED_PREFIX} Note — {safe_token(6)}"
                content = "Note"
                tags_note = auto_tags

            extra_tag_names = [
                f"{SEED_PREFIX} python", f"{SEED_PREFIX} fastapi", f"{SEED_PREFIX} nextjs",
                f"{SEED_PREFIX} sqlite", f"{SEED_PREFIX} ml", f"{SEED_PREFIX} nlp",
                f"{SEED_PREFIX} vision", f"{SEED_PREFIX} sommeil", f"{SEED_PREFIX} budget",
                f"{SEED_PREFIX} lecture"
            ]
            for _ in range(random.randint(0,2)):
                nm = random.choice(extra_tag_names)
                tags_note.append(get_or_create_tag(db, nm))

            tags_note = [t for t in set(tags_note) if t is not None]
            ps = [proj] if proj else []

            make_note(db, user, title, content, created, updated, tags_note, projects=ps, areas=ars, pinned=False)
            total_notes += 1

            if total_notes % BATCH_SIZE == 0:
                db.flush(); db.commit()
                print(f"[para-seed] notes insérées: {total_notes}/{COUNTS['notes']}")

        db.commit()

        n_projects = db.query(func.count(Project.id)).filter(Project.user_id == user.id).scalar()
        n_areas    = db.query(func.count(Area.id)).filter(Area.user_id == user.id).scalar()
        n_notes    = db.query(func.count(Note.id)).filter(Note.user_id == user.id).scalar()
        n_tags     = db.query(func.count(Tag.id)).scalar()

        print("✅ Seed PARA terminé.")
        print(f" - Projects (user): {n_projects}")
        print(f" - Areas    (user): {n_areas}")
        print(f" - Notes    (user): {n_notes}")
        print(f" - Tags       all : {n_tags}")

    except Exception as e:
        db.rollback()
        print("❌ Erreur durant le seed PARA :", e)
    finally:
        db.close()

if __name__ == "__main__":
    main()
