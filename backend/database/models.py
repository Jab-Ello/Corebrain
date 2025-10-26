# backend/database/models.py
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
    context = Column(Text)  # Contexte global du projet pour l’IA
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

    notes = relationship("Note", secondary="project_notes", back_populates="projects")

    def __repr__(self):
        return f"<Project(name={self.name}, status={self.status})>"


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

    notes = relationship("Note", secondary="area_notes", back_populates="areas")

    def __repr__(self):
        return f"<Area(name={self.name})>"


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

    projects = relationship("Project", secondary="project_notes", back_populates="notes")
    areas = relationship("Area", secondary="area_notes", back_populates="notes")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")

    def __repr__(self):
        return f"<Note(title={self.title}, pinned={self.pinned})>"


###############################################################
# TAG MODEL
###############################################################
class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

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
