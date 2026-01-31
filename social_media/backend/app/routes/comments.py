from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Comment
from ..schemas import CommentCreate

router = APIRouter(prefix="/comments", tags=["Comments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Create comment OR reply
@router.post("/{post_id}")
def add_comment(
    post_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db)
):
    comment = Comment(
        post_id=post_id,
        text=data.text,
        parent_id=data.parent_id  # <-- THIS enables replies
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"status": "ok", "id": comment.id}


# ✅ Fetch comments in threaded form
@router.get("/{post_id}")
def get_comments(post_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    # Build comment map
    comment_map = {}
    for c in comments:
        comment_map[c.id] = {
            "id": c.id,
            "text": c.text,
            "parent_id": c.parent_id,
            "replies": []
        }

    # Build tree
    roots = []
    for c in comment_map.values():
        if c["parent_id"]:
            parent = comment_map.get(c["parent_id"])
            if parent:
                parent["replies"].append(c)
        else:
            roots.append(c)

    return roots
