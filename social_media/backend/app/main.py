from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import posts, comments, reactions, api_index

# ✅ Create DB Tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.options("/{path:path}")
async def options_handler(path: str, request: Request):
    return Response(status_code=200)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_index.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(reactions.router)