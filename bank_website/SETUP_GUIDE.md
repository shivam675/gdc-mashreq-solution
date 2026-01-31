# Bank Sentinel - Complete Setup & Run Guide

## Prerequisites

1. **Python 3.10+** installed
2. **Node.js 18+** and npm installed  
3. **Ollama** installed and running ([ollama.ai](https://ollama.ai))

## Step-by-Step Setup

### 1. Install Ollama Model

```powershell
# Pull the model (8B parameter model, ~4.7GB)
ollama pull llama3.2:8b

# Verify Ollama is running
ollama list
```

Ollama should now be running on `http://localhost:11434`

### 2. Backend Setup

```powershell
# Navigate to backend
cd E:\gdc-mashreq-solution\bank_website\backend

# Create virtual environment (optional but recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed the database with 1000 transactions and 200 reviews
python -m app.seed_data
```

**Expected output:**
```
✓ Created 1000 transactions
✓ Created 200 customer reviews
Database seeding completed!
```

### 3. Frontend Setup

```powershell
# Open new terminal
cd E:\gdc-mashreq-solution\bank_website\frontend

# Install dependencies
npm install
```

## Running the Application

You need **4 terminals** running simultaneously:

### Terminal 1: Backend API Server

```powershell
cd E:\gdc-mashreq-solution\bank_website\backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify:** Open http://localhost:8000 - you should see API info

### Terminal 2: Frontend Dev Server

```powershell
cd E:\gdc-mashreq-solution\bank_website\frontend
npm run dev
```

**Verify:** Open http://localhost:5173 - you should see the dashboard

### Terminal 3: Social Media Simulator

```powershell
cd E:\gdc-mashreq-solution\bank_website
python social_media_simulator.py
```

**Verify:** Running on http://localhost:8001

### Terminal 4: FDA Agent Simulator

```powershell
cd E:\gdc-mashreq-solution\bank_website
python fda_agent_simulator.py
```

**This will send sentiment data every 30 seconds**

## Using the Application

### 1. Dashboard (Main View)

1. Open http://localhost:5173
2. You'll see the real-time dashboard
3. Watch as FDA agent sends sentiment signals every 30 seconds
4. See IAA agent analyze the data (streaming text)
5. See EBA agent generate PR posts (streaming markdown)

### 2. PR Posts Management

1. Navigate to "PR Posts" tab
2. Enter your name in the "Approver" field
3. Review AI-generated posts
4. **Option A:** Click "Approve As-Is" to approve without editing
5. **Option B:** Click "Edit Post" to modify the content
   - Edit the markdown content
   - Click "Approve Edited" to save and approve
6. Approved posts will be sent to the social media simulator

### 3. Database Management

1. Navigate to "Database" tab
2. **Transactions Tab:**
   - View all 1000 transactions
   - Click edit icon to change status or flag transactions
   - Click delete icon to remove records
3. **Customer Reviews Tab:**
   - View 200 customer reviews
   - Delete reviews as needed
4. **Sentiments Tab:**
   - View all FDA agent signals
   - Delete old sentiments

## Workflow Example

1. **FDA Agent** sends sentiment about "potential_scam_rumor" (every 30s)
2. **Backend** receives it and creates a workflow
3. **IAA Agent** searches:
   - Flagged transactions in database
   - Negative customer reviews about fraud
   - Generates analysis paragraph (streaming to frontend)
4. **EBA Agent** creates PR post based on IAA analysis (streaming)
5. **Human Operator** (you):
   - Sees the post in "PR Posts" tab
   - Edits if needed
   - Approves the post
6. **Backend** sends post to Social Media Simulator
7. **Social Media Simulator** receives and displays the post

## Troubleshooting

### Backend won't start

```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill the process if needed
taskkill /PID <PID> /F
```

### Frontend won't start

```powershell
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

### Ollama connection error

```powershell
# Check if Ollama is running
ollama list

# Start Ollama if not running
ollama serve
```

### WebSocket not connecting

- Check backend is running on port 8000
- Check browser console for errors
- Refresh the frontend page

## Configuration

### Change Ollama Model

Edit `backend/config.json`:

```json
{
  "ollama": {
    "model": "llama3.2:8b",  // Change to your preferred model
    ...
  }
}
```

### Change FDA Agent Frequency

Edit `fda_agent_simulator.py`:

```python
await asyncio.sleep(30)  # Change from 30 seconds to your preference
```

### Change Social Media URL

Edit `backend/config.json`:

```json
{
  "agents": {
    "eba": {
      "social_media_url": "http://localhost:8001/api/posts"
    }
  }
}
```

## API Endpoints

- `POST /api/send_social_sentiment` - FDA agent posts here
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/{id}` - Get specific workflow
- `POST /api/workflows/{id}/approve` - Approve a post
- `WS /api/ws` - WebSocket for real-time updates
- `GET /api/database/transactions` - Get transactions
- `POST /api/database/transactions` - Create transaction
- `PUT /api/database/transactions/{id}` - Update transaction
- `DELETE /api/database/transactions/{id}` - Delete transaction

## Architecture Diagram

```
┌─────────────────┐
│  FDA Agent      │ (Simulator - sends sentiment every 30s)
│  Simulator      │
└────────┬────────┘
         │ POST /send_social_sentiment
         ▼
┌─────────────────────────────────────────────────┐
│              FastAPI Backend                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   IAA    │→ │   EBA    │→ │WebSocket │     │
│  │  Agent   │  │  Agent   │  │ Manager  │     │
│  └──────────┘  └──────────┘  └────┬─────┘     │
│       │             │              │            │
│   ┌───▼─────┐   ┌──▼──────┐       │            │
│   │Database │   │ Ollama  │       │            │
│   │ SQLite  │   │  LLM    │       │            │
│   └─────────┘   └─────────┘       │            │
└────────────────────────────────────┼───────────┘
                                     │
                          WebSocket  │  HTTP
                                     ▼
┌─────────────────────────────────────────────────┐
│           React Frontend (Vite)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │Dashboard │  │PR Posts  │  │ Database │     │
│  │Real-time │  │ Editor   │  │   CRUD   │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└────────────┬────────────────────────────────────┘
             │ POST /approve
             ▼
┌─────────────────────┐
│ Social Media        │
│ Simulator           │
│ (http://8001)       │
└─────────────────────┘
```

## Features Implemented

✅ **Multi-Agent Architecture**
- FDA Agent (external sentiment monitoring)
- IAA Agent (internal analysis with DB search)
- EBA Agent (executive briefing / PR generation)

✅ **Real-Time Streaming**
- WebSocket connections
- Ollama LLM streaming
- Live dashboard updates

✅ **Human-in-the-Loop**
- Post editing interface
- Approval workflow
- Original vs edited comparison

✅ **Database Management**
- 1000 transactions (various statuses)
- 200 customer reviews
- CRUD operations via UI
- SQLite with SQLAlchemy

✅ **Error Handling**
- Retry logic for agents
- WebSocket reconnection
- Error boundaries

## Next Steps

1. **Customize the data**: Edit `backend/app/seed_data.py` to change transaction/review data
2. **Add more signal types**: Edit `fda_agent_simulator.py` to add new sentiment types
3. **Customize UI**: Edit frontend components in `frontend/src/pages/`
4. **Change LLM prompts**: Edit `backend/app/agents/iaa_agent.py` and `eba_agent.py`

## Support

For issues:
1. Check all 4 terminals are running
2. Check Ollama is running (`ollama list`)
3. Check ports 8000, 8001, 5173, 11434 are available
4. Check browser console for errors

Enjoy using Bank Sentinel! 🚀
