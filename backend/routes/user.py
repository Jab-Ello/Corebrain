# backend/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database.database import SessionLocal
from database.models import User
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


# ===========================================================
# DB SESSION
# ===========================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ===========================================================
# PYDANTIC MODELS
# ===========================================================
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    avatarUrl: Optional[str] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: str
    avatarUrl: Optional[str]
    createdAt: datetime

    class Config:
        from_attributes = True  # ✅ pour Pydantic v2 (remplace orm_mode)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatarUrl: Optional[str] = None
    password: Optional[str] = None


# ===========================================================
# UTILS
# ===========================================================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ===========================================================
# USER ROUTES
# ===========================================================

# CREATE USER
@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    user = User(
        name=payload.name,
        email=payload.email,
        avatarUrl=payload.avatarUrl,
        passwordHash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# LOGIN USER
@router.post("/login")
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.passwordHash):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    return {"message": "Connexion réussie ✅", "user_id": user.id, "name": user.name}


# GET ALL USERS
@router.get("/", response_model=List[UserRead])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(User).all()


# GET USER BY ID
@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    return user


# UPDATE USER
@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if payload.name:
        user.name = payload.name
    if payload.avatarUrl:
        user.avatarUrl = payload.avatarUrl
    if payload.password:
        user.passwordHash = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return user


# DELETE USER
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}
