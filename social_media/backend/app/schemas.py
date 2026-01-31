from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    channel_id: str = "general"
    scheduled_at: Optional[datetime] = None

class ReactionCreate(BaseModel):
    emoji: str

class CommentCreate(BaseModel):
    text: str
    parent_id: Optional[int] = None