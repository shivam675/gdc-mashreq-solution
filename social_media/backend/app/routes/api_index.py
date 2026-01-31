import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pathlib import Path
import re

from ..database import SessionLocal
from ..models import Post, Comment, Reaction  # Reaction model is needed for a full DB clear

# --- CONFIGURATION ---
HISTORY_FILE = Path("history.json")

router = APIRouter(prefix="/api", tags=["API & Sync"])


# --- DEPENDENCY ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- HELPER FUNCTIONS ---
def parse_author(content: str):
    """Extracts author like '@SignalStarter' from the start of a string."""
    match = re.match(r"^(@\w+)\s+says:", content)
    return match.group(1) if match else "Anonymous"


def format_db_state(db: Session):
    """Queries the entire DB and formats it into the target JSON structure."""
    all_posts = db.query(Post).order_by(Post.created_at.asc()).all()
    output_data = []
    for post in all_posts:
        post_data = {
            "post_id": post.id,
            "channel": post.channel_id,
            "author": parse_author(post.content),
            "content": post.content.split("\n\n", 1)[-1],
            "timestamp": post.created_at.strftime("%d-%m-%Y %H:%M:%S"),
            "comments": []
        }
        comments_query = db.query(Comment).filter(Comment.post_id == post.id).order_by(Comment.created_at.asc()).all()
        comment_map = {
            c.id: {
                "db_id": c.id, "json_comment_id": c.id, "parent_db_id": c.parent_id,
                "handler_id": parse_author(c.text), "type": "reply" if c.parent_id else "comment",
                "comment": c.text.split(": ", 1)[-1],
                "timestamp": c.created_at.strftime("%d-%m-%Y %H:%M:%S"),
                "replies": []
            } for c in comments_query
        }
        root_comments = []
        for c_data in comment_map.values():
            if c_data["parent_db_id"]:
                parent = comment_map.get(c_data["parent_db_id"])
                if parent: parent["replies"].append(c_data)
            else:
                root_comments.append(c_data)

        def flatten_comments(comments_list):
            flat_list = []
            for c in comments_list:
                parent_id = comment_map[c['parent_db_id']]['json_comment_id'] if c['parent_db_id'] else None
                flat_list.append({
                    "comment_id": c['json_comment_id'], "parent_comment_id": parent_id,
                    "handler_id": c['handler_id'], "type": c['type'], "comment": c['comment'],
                    "timestamp": c['timestamp'],
                })
                flat_list.extend(flatten_comments(c['replies']))
            return flat_list

        post_data["comments"] = flatten_comments(root_comments)
        output_data.append(post_data)
    return output_data


# --- API ENDPOINTS ---

@router.get("/")
def api_index_status():
    """Returns the basic status of the API."""
    return {"service": "Social Signal Chatroom API", "status": "running"}


@router.get("/sync", response_model=list)
def sync_data(db: Session = Depends(get_db)):
    """
    Synchronizes chat data. Returns only new posts/comments since the last sync.
    """
    current_db_state = format_db_state(db)
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, 'r') as f:
            try:
                history_state = json.load(f)
            except json.JSONDecodeError:
                history_state = []
    else:
        history_state = []

    history_posts = {p['post_id']: p for p in history_state}
    new_data_to_send = []
    for current_post in current_db_state:
        history_post = history_posts.get(current_post['post_id'])
        if not history_post or len(current_post['comments']) > len(history_post['comments']):
            new_data_to_send.append(current_post)

    if new_data_to_send:
        with open(HISTORY_FILE, 'w') as f:
            json.dump(current_db_state, f, indent=2)
    return new_data_to_send


# ==============================================================================
# ✅ NEW AND UPDATED RESET/CLEAR ENDPOINTS
# ==============================================================================

@router.delete("/database/clear")
def clear_database_only(db: Session = Depends(get_db)):
    """
    Clears the entire database (posts, comments, reactions) but leaves history.json untouched.
    """
    # Delete in order of dependencies: children first
    db.query(Reaction).delete()
    db.query(Comment).delete()
    db.query(Post).delete()
    db.commit()
    return {"status": "database_cleared", "detail": "All posts, comments, and reactions have been deleted."}


@router.delete("/history/clear")
def clear_history_only():
    """
    Clears the history.json file but leaves the database untouched.
    This will cause the next /sync call to resend all data.
    """
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
        return {"status": "history_cleared", "detail": "history.json has been deleted."}
    else:
        return {"status": "not_found", "detail": "history.json does not exist."}


@router.delete("/reset/all")
def reset_everything(db: Session = Depends(get_db)):
    """
    MASTER RESET: Clears the entire database AND the history.json file for a complete fresh start.
    """
    # Clear Database
    db.query(Reaction).delete()
    db.query(Comment).delete()
    db.query(Post).delete()
    db.commit()

    # Clear History
    history_cleared_message = "history.json does not exist."
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
        history_cleared_message = "history.json has been deleted."

    return {
        "status": "complete_reset_finished",
        "detail": {
            "database": "All posts, comments, and reactions have been deleted.",
            "history": history_cleared_message
        }
    }