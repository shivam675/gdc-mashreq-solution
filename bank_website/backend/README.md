# Bank Sentinel Backend

Multi-agent system for bank sentiment analysis and PR management.

## Features

- **FDA Agent Integration**: Receives social media sentiment data
- **IAA Agent**: Internal Analysis Agent with semantic search
- **EBA Agent**: Executive Briefing Agent for PR post generation
- **Real-time WebSocket**: Live updates of the entire workflow
- **Database Management**: CRUD operations for all data

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure settings in `config.json`

3. Seed the database:
```bash
python -m app.seed_data
```

4. Run the server:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `POST /api/send_social_sentiment` - FDA agent sends sentiment
- `GET /api/workflows` - Get all workflows
- `POST /api/workflows/{id}/approve` - Approve PR post
- `WS /api/ws` - WebSocket connection
- `/api/database/*` - CRUD operations

## Architecture

```
FDA Agent (External)
    ↓
Backend API (/send_social_sentiment)
    ↓
IAA Agent (searches DBs + LLM analysis)
    ↓
EBA Agent (generates PR post)
    ↓
Human Approval (Frontend)
    ↓
Social Media POST
```
