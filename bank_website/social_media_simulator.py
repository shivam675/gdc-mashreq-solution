"""
Social Media Simulator
Mock server that receives PR posts from the EBA agent
"""
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime
import uvicorn

app = FastAPI(title="Social Media Simulator")

class Post(BaseModel):
    content: str
    timestamp: str
    platform: str

posts = []

@app.post("/api/posts")
async def receive_post(post: Post):
    """Receive a post from the EBA agent"""
    posts.append({
        **post.dict(),
        "received_at": datetime.utcnow().isoformat(),
        "post_id": f"POST-{len(posts) + 1:04d}"
    })
    
    print("\n" + "="*60)
    print(f"NEW POST RECEIVED (#{len(posts)})")
    print("="*60)
    print(post.content)
    print("="*60)
    print()
    
    return {
        "status": "posted",
        "post_id": posts[-1]["post_id"],
        "message": "Post successfully published to social media"
    }

@app.get("/api/posts")
async def get_all_posts():
    """Get all posted content"""
    return {"posts": posts, "total": len(posts)}

@app.get("/")
async def root():
    return {
        "name": "Social Media Simulator",
        "total_posts": len(posts),
        "endpoint": "/api/posts"
    }

if __name__ == "__main__":
    print("Starting Social Media Simulator on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
