from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base


class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    content = Column(Text)
    # Added missing fields
    channel_id = Column(String, default="general")
    scheduled_at = Column(DateTime, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    reactions = relationship("Reaction", back_populates="post")
    comments = relationship("Comment", back_populates="post")


class Reaction(Base):
    __tablename__ = "reactions"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    emoji = Column(String)
    post = relationship("Post", back_populates="reactions")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id"))
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    text = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    post = relationship("Post", back_populates="comments")
    replies = relationship("Comment")