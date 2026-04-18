from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..core.database import Base

class DocumentStatus(str, enum.Enum):
    DRAFT = "Draft"
    REVIEW = "Review"
    APPROVED = "Approved"
    PUBLISHED = "Published"

class TaskStatus(str, enum.Enum):
    TODO = "Todo"
    IN_PROGRESS = "In Progress"
    IN_REVIEW = "In Review"
    DONE = "Done"

class SpecificationDocument(Base):
    __tablename__ = "specification_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT)
    content = Column(JSON, default=dict)
    confluence_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tasks = relationship("DevelopmentTask", back_populates="document")


class DevelopmentTask(Base):
    __tablename__ = "development_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("specification_documents.id"))
    title = Column(String)
    description = Column(String)
    priority = Column(String)
    dependencies = Column(JSON, default=list) # List of Task IDs
    jira_issue_key = Column(String, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)

    document = relationship("SpecificationDocument", back_populates="tasks")
