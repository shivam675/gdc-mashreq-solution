# Bank Sentinel - Multi-Agent System

Complete bank sentiment analysis and PR management system with AI agents.

## Architecture

```
FDA Agent (Simulator) ──POST──> Backend API
                                    │
                                    ├─> IAA Agent (Ollama)
                                    │   └─> Search DBs + Analysis
                                    │
                                    ├─> EBA Agent (Ollama)
                                    │   └─> Generate PR Post
                                    │
                                    └─> WebSocket ──> Frontend
                                            │
                                            └─> Human Approval ──> Social Media
```

## Components

### Backend (FastAPI)
- RESTful API endpoints
- WebSocket for real-time updates
- IAA Agent (Internal Analysis)
- EBA Agent (Executive Briefing)
- SQLite database

### Frontend (React + Vite)
- Real-time dashboard
- PR post editing & approval
- Database management UI

### Agents
- **FDA Agent**: External sentiment monitor (simulator)
- **IAA Agent**: Searches DBs, generates analysis
- **EBA Agent**: Creates PR posts for social media

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed database with 1000 transactions & reviews
python -m app.seed_data

# Start backend server
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Start Simulators

```bash
# Terminal 1: Social Media Simulator
python social_media_simulator.py

# Terminal 2: FDA Agent Simulator
python fda_agent_simulator.py
```

### 4. Start Ollama

Make sure Ollama is running with a model:

```bash
# Pull model (if not already installed)
ollama pull llama3.2:8b

# Ollama should be running on http://localhost:11434
```

## Usage

1. **Dashboard** (`http://localhost:5173/`): Watch real-time workflow
2. **PR Posts** (`/posts`): Edit and approve AI-generated posts
3. **Database** (`/database`): Manage transactions, reviews, sentiments

## Configuration

Edit `backend/config.json` to customize:
- Ollama model and URL
- Agent settings
- Social media endpoint

## Features

- ✅ Real-time WebSocket updates
- ✅ Streaming LLM responses (Ollama)
- ✅ Human-in-the-loop post editing
- ✅ Full database CRUD
- ✅ 1000+ seeded transactions
- ✅ Customer review database
- ✅ Workflow tracking & audit trail

## Tech Stack

**Backend:**
- FastAPI
- SQLAlchemy + SQLite
- Ollama (LLM)
- WebSockets

**Frontend:**
- React 18
- TypeScript
- Vite
- TailwindCSS
- TanStack Query

## Ports

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Social Media Sim: `http://localhost:8001`
- Ollama: `http://localhost:11434`

## License

MIT
