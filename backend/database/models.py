from sqlalchemy import (
    Column, String, Text, Integer, Boolean, DateTime,
    ForeignKey, CheckConstraint, Table
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


###############################################################
# USER MODEL
###############################################################
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    avatarUrl = Column(String)
    passwordHash = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    projects = relationship("Project", back_populates="user", cascade="all, delete")
    notes = relationship("Note", back_populates="user", cascade="all, delete")
    areas = relationship("Area", back_populates="user", cascade="all, delete")

    def __repr__(self):
        return f"<User(name={self.name}, email={self.email})>"


###############################################################
# PROJECT MODEL
###############################################################
class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    context = Column(Text)
    status = Column(
        String,
        CheckConstraint("status IN ('ACTIVE', 'PAUSED', 'COMPLETED')"),
        default="ACTIVE",
        nullable=False,
    )
    startDate = Column(DateTime, default=datetime.utcnow, nullable=False)
    plannedEndDate = Column(DateTime)
    endDate = Column(DateTime)
    priority = Column(Integer, default=0, nullable=False)
    color = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 🔹 Relation : chaque projet appartient à un utilisateur
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="projects")

    # 🔹 Relation : un projet peut avoir plusieurs notes
    notes = relationship("Note", secondary="project_notes", back_populates="projects")

    def __repr__(self):
        return f"<Project(name={self.name}, user_id={self.user_id}, status={self.status})>"


###############################################################
# AREA MODEL
###############################################################
class Area(Base):
    __tablename__ = "areas"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 🔹 Chaque zone appartient à un utilisateur
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="areas")

    # 🔹 Relation N↔N avec les notes
    notes = relationship("Note", secondary="area_notes", back_populates="areas")

    def __repr__(self):
        return f"<Area(name={self.name}, user_id={self.user_id})>"


###############################################################
# NOTE MODEL
###############################################################
class Note(Base):
    __tablename__ = "notes"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text)
    wordCount = Column(Integer)
    pinned = Column(Boolean, default=False, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 🔹 Chaque note appartient à un utilisateur
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="notes")

    # 🔹 Une note peut être liée à plusieurs projets
    projects = relationship("Project", secondary="project_notes", back_populates="notes")

    # 🔹 Une note peut être liée à plusieurs zones
    areas = relationship("Area", secondary="area_notes", back_populates="notes")

    # 🔹 Une note peut être liée à plusieurs tags
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")

    def __repr__(self):
        return f"<Note(title={self.title}, user_id={self.user_id}, pinned={self.pinned})>"


###############################################################
# TAG MODEL
###############################################################
class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # 🔹 Relation avec les notes
    notes = relationship("Note", secondary="note_tags", back_populates="tags")

    def __repr__(self):
        return f"<Tag(name={self.name})>"


###############################################################
# ASSOCIATION TABLES
###############################################################
project_notes = Table(
    "project_notes",
    Base.metadata,
    Column("project_id", String, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("note_id", String, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("added_at", DateTime, default=datetime.utcnow, nullable=False),
)

area_notes = Table(
    "area_notes",
    Base.metadata,
    Column("area_id", String, ForeignKey("areas.id", ondelete="CASCADE"), primary_key=True),
    Column("note_id", String, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("added_at", DateTime, default=datetime.utcnow, nullable=False),
)

note_tags = Table(
    "note_tags",
    Base.metadata,
    Column("note_id", String, ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)
