from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Reaction
from ..schemas import ReactionCreate

router = APIRouter(prefix="/reactions")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/{post_id}")
def react_to_post(
    post_id: int,
    data: ReactionCreate,
    db: Session = Depends(get_db)
):
    reaction = Reaction(
        post_id=post_id,
        emoji=data.emoji
    )
    db.add(reaction)
    db.commit()
    return {"status": "reacted"}
