from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..database import SessionLocal
from ..models import Post, Reaction, Comment
from ..schemas import PostCreate

router = APIRouter(prefix="/posts", tags=["Posts"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_post(data: PostCreate, db: Session = Depends(get_db)):
    post = Post(
        content=data.content,
        image_url=data.image_url,
        channel_id=data.channel_id,
        scheduled_at=data.scheduled_at
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/")
def get_posts(channel_id: Optional[str] = None, db: Session = Depends(get_db)):
    # Start query
    query = db.query(Post)

    # Filter by channel if provided
    if channel_id:
        query = query.filter(Post.channel_id == channel_id)

    posts = query.order_by(Post.created_at.desc()).all()

    result = []
    for post in posts:
        reaction_count = (
            db.query(func.count(Reaction.id))
            .filter(Reaction.post_id == post.id)
            .scalar()
        )

        comment_count = (
            db.query(func.count(Comment.id))
            .filter(Comment.post_id == post.id)
            .scalar()
        )

        result.append({
            "id": post.id,
            "content": post.content,
            "image_url": post.image_url,
            "created_at": post.created_at,
            "scheduled_at": post.scheduled_at,
            "channel_id": post.channel_id,
            "reaction_count": reaction_count,
            "comment_count": comment_count,
        })

    return result