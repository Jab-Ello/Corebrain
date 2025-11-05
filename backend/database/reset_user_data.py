from .database import SessionLocal, engine
from .models import User, Project, Note, Area, Tag
from sqlalchemy import text

TARGET_USER_ID = "87ffb41b-3efb-45b8-a411-2f714d074d67"

def reset_user_data():
    print("[reset_user] DB URL:", getattr(engine, "url", "unknown"))
    db = SessionLocal()
    try:
        db.execute(text("PRAGMA foreign_keys = ON;"))
        db.commit()

        user = db.query(User).filter(User.id == TARGET_USER_ID).one_or_none()
        if not user:
            print(f"❌ Aucun utilisateur trouvé avec id = {TARGET_USER_ID}")
            return

        print(f"[reset_user] Suppression des données pour {user.email} ({user.id})...")

        db.execute(text("""
            DELETE FROM project_notes
            WHERE note_id IN (SELECT id FROM notes WHERE user_id = :uid)
               OR project_id IN (SELECT id FROM projects WHERE user_id = :uid);
        """), {"uid": TARGET_USER_ID})

        db.execute(text("""
            DELETE FROM area_notes
            WHERE note_id IN (SELECT id FROM notes WHERE user_id = :uid)
               OR area_id IN (SELECT id FROM areas WHERE user_id = :uid);
        """), {"uid": TARGET_USER_ID})

        db.execute(text("""
            DELETE FROM note_tags
            WHERE note_id IN (SELECT id FROM notes WHERE user_id = :uid);
        """), {"uid": TARGET_USER_ID})

        db.execute(text("DELETE FROM notes WHERE user_id = :uid;"), {"uid": TARGET_USER_ID})
        db.execute(text("DELETE FROM projects WHERE user_id = :uid;"), {"uid": TARGET_USER_ID})
        db.execute(text("DELETE FROM areas WHERE user_id = :uid;"), {"uid": TARGET_USER_ID})

        db.commit()
        print("✅ Données supprimées pour l'utilisateur spécifié (autres comptes intacts).")

    except Exception as e:
        db.rollback()
        print("❌ Erreur durant la suppression :", e)
    finally:
        db.close()

if __name__ == "__main__":
    reset_user_data()
