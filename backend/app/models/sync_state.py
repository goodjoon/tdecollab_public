from sqlalchemy import Column, String, DateTime
from datetime import datetime
from ..core.database import Base

class SyncState(Base):
    __tablename__ = "sync_states"

    project_id = Column(String, primary_key=True)
    last_commit_checked_at = Column(DateTime, default=datetime.utcnow)
    last_mr_checked_at = Column(DateTime, default=datetime.utcnow)
