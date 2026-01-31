"""
Social Media Platform Server
Runs on port 8001

Provides simulated social media data for FDA agent to monitor.
"""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8001,
        reload=True
    )
