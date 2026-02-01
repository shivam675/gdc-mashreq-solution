from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from app.database import init_db
from app.routes import sentiment_router, database_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting SLM Desk API...")
    await init_db()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down SLM Desk API...")

# Create FastAPI app
app = FastAPI(
    title="SLM Desk API",
    description="Multi-Agent System for Bank Sentiment Analysis and PR Management",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sentiment_router, prefix="/api", tags=["Sentiment & Workflows"])
app.include_router(database_router, prefix="/api", tags=["Database"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "SLM Desk API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "sentiment": "/api/send_social_sentiment",
            "workflows": "/api/workflows",
            "websocket": "/api/ws",
            "database": "/api/database"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
