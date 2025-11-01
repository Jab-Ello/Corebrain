# backend/database/insert_para_seed.py
from .database import SessionLocal, engine
from .models import User, Project, Area, Note, Tag
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from sqlalchemy import func, text
import random
import string

# ============ CONFIG ============
TARGET_USER_ID = "87ffb41b-3efb-45b8-a411-2f714d074d67"

SEED_PREFIX = "[para]"  # permet d'identifier et éviter doublons
RANDOM_SEED = 1337      # reproductible

COUNTS = {
    "projects_work": 10,     # Projets "travail / études"
    "projects_personal": 8,  # Projets personnels
    "areas": 12,             # Domaines de responsabilité
    "notes": 650,            # Volume de notes
    "tags": 80,              # Vocabulaire
}

# répartition des types de notes
NOTE_MIX = {
    "meeting": 0.18,
    "todo": 0.20,
    "review_weekly": 0.10,
    "review_monthly": 0.05,
    "learning": 0.17,
    "resource": 0.22,
    "retro": 0.08,
}

BATCH_SIZE = 250
DAYS_HISTORY = 420

# ============ HELPERS ============
def gen_id() -> str:
    return str(uuid4())

def now_utc():
    return datetime.now(timezone.utc)

def random_past_datetime(days_back=DAYS_HISTORY):
    d = random.randint(0, days_back)
    s = random.randint(0, 86400)
    return now_utc() - timedelta(days=d, seconds=s)

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

    # liaisons d'abord
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

    # entités de cet utilisateur
    db.execute(text("DELETE FROM notes    WHERE user_id = :uid AND title LIKE :prefx;"),
               {"uid": user_id, "prefx": like})
    db.execute(text("DELETE FROM projects WHERE user_id = :uid AND name  LIKE :prefx;"),
               {"uid": user_id, "prefx": like})
    db.execute(text("DELETE FROM areas    WHERE user_id = :uid AND name  LIKE :prefx;"),
               {"uid": user_id, "prefx": like})

    # tags seed non utilisés
    db.execute(text("""
        DELETE FROM tags
        WHERE name LIKE :prefx
          AND id NOT IN (SELECT DISTINCT tag_id FROM note_tags);
    """), {"prefx": like})

    db.commit()

# ============ VOCAB & CATALOGS ============
WORK_PROJECT_NAMES = [
    "Refonte site vitrine", "Application mobile client", "Tableau de bord analytics",
    "Automatisation facturation", "Proof of Concept IA", "Migration base de données",
    "Amélioration performance front", "Refactoring API", "Accessibilité & RGAA",
    "Documentation & Playbook"
]
STUDY_PROJECT_NAMES = [
    "Cours d'Algorithmes avancés", "Projet Machine Learning", "Système distribué",
    "Développement Web moderne", "Projet Data Visualization"
]
PERSONAL_PROJECT_NAMES = [
    "Semi-marathon printemps", "Aménagement appartement", "Budget & finances",
    "Album photo familial", "Routine sommeil", "Défi lecture 12 livres",
    "Cuisine meal-prep", "Roadtrip d'été"
]

AREA_NAMES = [
    "Santé & Sport", "Carrière & Études", "Finances", "Famille & Amis",
    "Maison & Logement", "Apprentissages", "Créativité & Écriture", "Projets Long Terme",
    "Administratif", "Voyages", "Bénévolat & Communauté", "Routines & Systèmes"
]

RESOURCE_TOPICS = [
    "productivité", "méthode PARA", "prise de notes", "python", "fastapi",
    "nextjs", "sqlite", "mlflow", "pytorch", "scikit-learn", "nlp", "vision",
    "gestion du temps", "habitudes", "course à pied", "musculation", "nutrition",
    "sommeil", "finance perso", "investissement", "lecture active", "écriture"
]

MEETING_PHRASES = [
    "Décisions prises", "Actions à entreprendre", "Questions ouvertes", "Risques & dépendances",
    "Prochaines étapes", "Responsables", "Échéances", "Blocages", "Notes diverses"
]
TODO_PREFIX = [
    "Faire", "Vérifier", "Préparer", "Terminer", "Mettre à jour", "Relire", "Tester", "Planifier"
]
REVIEW_TEMPL = [
    "Ce qui a bien fonctionné", "Ce qui peut être amélioré", "Levier principal pour la semaine",
    "Top 3 priorités", "Choses à arrêter", "Choses à continuer", "Choses à commencer"
]
RETRO_TEMPL = [
    "Faits marquants", "Points de douleur", "Hypothèses", "Idées d'amélioration", "Expériences à tenter"
]

def generate_tags(db):
    tags = []
    base = set()
    base.update(RESOURCE_TOPICS)
    base.update(["meeting", "todo", "review", "weekly", "monthly", "learning", "resource", "retro",
                 "santé", "course", "musculation", "sommeil", "finance", "budget", "épargne",
                 "pro", "perso", "lecture", "écriture", "cuisine", "voyage", "app"])
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
            description=f"Projet: {base_name}",
            context=f"Contexte: {base_name} — ref {safe_token(5)}",
            status=status,
            startDate=created,
            plannedEndDate=created + timedelta(days=random.randint(14,120)) if random.random()<0.7 else None,
            endDate=created + timedelta(days=random.randint(30,200)) if status=="COMPLETED" else None,
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
        status = random.choices(["ACTIVE","PAUSED","COMPLETED"], weights=[0.5,0.2,0.3])[0]
        p = Project(
            id=gen_id(), name=name,
            description=f"Projet perso: {base_name}",
            context=f"Contexte perso — ref {safe_token(4)}",
            status=status,
            startDate=created,
            plannedEndDate=created + timedelta(days=random.randint(10,120)) if random.random()<0.6 else None,
            endDate=created + timedelta(days=random.randint(15,180)) if status=="COMPLETED" else None,
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
            description=f"Domaine: {base_name}",
            color=f"#{random.randint(0, 0xFFFFFF):06X}",
            createdAt=created,
            updatedAt=created + timedelta(days=random.randint(0,60)),
            user_id=user.id,
        )
        db.add(a); areas.append(a)
    db.flush()
    return areas

def meeting_content():
    pts = pick(MEETING_PHRASES, k=random.randint(3,6))
    lines = []
    for p in pts:
        lines.append(f"### {p}")
        for _ in range(random.randint(2,4)):
            lines.append(f"- {p} → {titleize(safe_token(5))} ({safe_token(3)})")
    return "\n".join(lines)

def todo_content():
    lines = []
    for _ in range(random.randint(4,8)):
        prefix = random.choice(TODO_PREFIX)
        lines.append(f"- [ ] {prefix} {titleize(safe_token(6))}")
    lines.append("\nPriorités: 1) urgent 2) important 3) opportunités")
    return "\n".join(lines)

def review_content(kind="weekly"):
    head = f"# Revue {kind}\n"
    sec = pick(REVIEW_TEMPL, k=random.randint(3,5))
    lines = [head]
    for s in sec:
        lines.append(f"## {s}")
        for _ in range(random.randint(2,4)):
            lines.append(f"- {titleize(safe_token(5))}")
    return "\n".join(lines)

def learning_content():
    topic = random.choice(RESOURCE_TOPICS)
    lines = [
        f"# Notes d'apprentissage — {topic}",
        f"- Concept clé: {titleize(safe_token(5))}",
        f"- Exemple: {safe_token(8)}",
        f"- Lien: https://example.com/{topic}/{safe_token(6)}",
        "- Exercices: ",
    ]
    for _ in range(random.randint(2,4)):
        lines.append(f"  - {titleize(safe_token(5))}")
    return "\n".join(lines)

def resource_content():
    topic = random.choice(RESOURCE_TOPICS)
    lines = [
        f"# Ressource: {titleize(topic)}",
        f"- Type: {random.choice(['article','vidéo','podcast','outil','livre'])}",
        f"- URL: https://example.com/{topic}/{safe_token(5)}",
        f"- Pourquoi utile: {titleize(safe_token(7))}",
        "- Idées d'usage:",
    ]
    for _ in range(random.randint(2,4)):
        lines.append(f"  - {titleize(safe_token(5))}")
    return "\n".join(lines)

def retro_content():
    sec = pick(RETRO_TEMPL, k=random.randint(3,5))
    lines = []
    for s in sec:
        lines.append(f"## {s}")
        for _ in range(random.randint(2,4)):
            lines.append(f"- {titleize(safe_token(6))}")
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

    n = Note(
        id=gen_id(),
        title=title,
        content=content,
        summary=content.split("\n", 1)[0][:180],
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

# ============ MAIN ============
def main():
    print("[para-seed] Engine:", getattr(engine, "url", "unknown"))
    random.seed(RANDOM_SEED)
    db = SessionLocal()
    try:
        user = ensure_user(db, TARGET_USER_ID)

        # Nettoie les anciens seeds pour cet utilisateur (évite doublons/conflits)
        clear_existing_seed(db, user.id, SEED_PREFIX)

        # Tags
        tags = generate_tags(db)

        # Projects & Areas
        projects = ensure_projects(db, user)
        areas = ensure_areas(db, user)

        # Tags utilitaires par nom
        tag_map = {t.name: t for t in tags}
        t_meeting   = tag_map.get(f"{SEED_PREFIX} meeting")
        t_todo      = tag_map.get(f"{SEED_PREFIX} todo")
        t_review    = tag_map.get(f"{SEED_PREFIX} review")
        t_weekly    = tag_map.get(f"{SEED_PREFIX} weekly")
        t_monthly   = tag_map.get(f"{SEED_PREFIX} monthly")
        t_learning  = tag_map.get(f"{SEED_PREFIX} learning")
        t_resource  = tag_map.get(f"{SEED_PREFIX} resource")
        t_retro     = tag_map.get(f"{SEED_PREFIX} retro")
        t_pro       = tag_map.get(f"{SEED_PREFIX} pro")
        t_perso     = tag_map.get(f"{SEED_PREFIX} perso")

        # Notes épinglées (rituels PARA)
        pinned_titles = [
            f"{SEED_PREFIX} Weekly Review — Modèle",
            f"{SEED_PREFIX} Monthly Review — Modèle",
            f"{SEED_PREFIX} Liste Projets actifs",
            f"{SEED_PREFIX} Routines quotidiennes",
        ]
        for pt in pinned_titles:
            make_note(
                db, user, pt,
                review_content("weekly" if "Weekly" in pt else "monthly") if "Review" in pt else
                "\n".join([
                    "- Matin: eau, mobilité, focus block",
                    "- Midi: marche, protéines, deep work",
                    "- Soir: déconnexion, journal, lecture"
                ]) if "Routines" in pt else
                "\n".join([f"- {p.name}" for p in projects if p.status == "ACTIVE"]) or "-",
                created=random_past_datetime(),
                updated=now_utc(),
                tags=[t_review or get_or_create_tag(db, f"{SEED_PREFIX} review")],
                pinned=True
            )

        # Génération massive
        total_notes = 0
        types = list(NOTE_MIX.keys())
        probs = list(NOTE_MIX.values())

        for i in range(COUNTS["notes"]):
            kind = random.choices(types, weights=probs)[0]
            created = random_past_datetime()
            updated = created + timedelta(days=random.randint(0, 45))

            proj = random.choice(projects) if random.random() < 0.75 else None
            ars = pick(areas, k=random.randint(0,2))
            tgs = []

            if kind == "meeting":
                title = f"{SEED_PREFIX} CR réunion — {proj.name.split(SEED_PREFIX+' ')[-1] if proj else 'Général'} — {created.date()}"
                content = meeting_content()
                tgs = [t_meeting or get_or_create_tag(db, f"{SEED_PREFIX} meeting"), t_pro if proj else t_perso]
            elif kind == "todo":
                title = f"{SEED_PREFIX} À faire — {safe_token(4)}"
                content = todo_content()
                tgs = [t_todo or get_or_create_tag(db, f"{SEED_PREFIX} todo")]
            elif kind == "review_weekly":
                title = f"{SEED_PREFIX} Weekly Review — Semaine {created.isocalendar()[1]} {created.year}"
                content = review_content("weekly")
                tgs = [t_review or get_or_create_tag(db, f"{SEED_PREFIX} review"), t_weekly or get_or_create_tag(db, f"{SEED_PREFIX} weekly")]
            elif kind == "review_monthly":
                title = f"{SEED_PREFIX} Monthly Review — {created.strftime('%B %Y')}"
                content = review_content("monthly")
                tgs = [t_review or get_or_create_tag(db, f"{SEED_PREFIX} review"), t_monthly or get_or_create_tag(db, f"{SEED_PREFIX} monthly")]
            elif kind == "learning":
                title = f"{SEED_PREFIX} Notes d'apprentissage — {safe_token(5)}"
                content = learning_content()
                tgs = [t_learning or get_or_create_tag(db, f"{SEED_PREFIX} learning")]
            elif kind == "resource":
                title = f"{SEED_PREFIX} Ressource — {safe_token(5)}"
                content = resource_content()
                tgs = [t_resource or get_or_create_tag(db, f"{SEED_PREFIX} resource")]
            elif kind == "retro":
                title = f"{SEED_PREFIX} Rétrospective — {proj.name.split(SEED_PREFIX+' ')[-1] if proj else 'Général'} — {created.date()}"
                content = retro_content()
                tgs = [t_retro or get_or_create_tag(db, f"{SEED_PREFIX} retro")]
            else:
                title = f"{SEED_PREFIX} Note — {safe_token(6)}"
                content = "Note"
                tgs = []

            tgs = [tg for tg in tgs if tg is not None]
            ps = [proj] if proj else []
            make_note(db, user, title, content, created, updated, tgs, projects=ps, areas=ars, pinned=False)
            total_notes += 1

            if total_notes % BATCH_SIZE == 0:
                db.flush(); db.commit()
                print(f"[para-seed] notes insérées: {total_notes}/{COUNTS['notes']}")

        db.commit()

        # Résumé
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
