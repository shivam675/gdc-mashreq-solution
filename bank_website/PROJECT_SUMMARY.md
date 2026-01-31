# Bank Sentinel - Complete Project Summary

## 🎯 Project Overview

**Bank Sentinel** is a sophisticated multi-agent system designed for real-time social media sentiment analysis and automated PR response generation for banking institutions. The system combines external sentiment monitoring, internal data analysis, AI-powered content generation, and human oversight in a seamless workflow.

## 🏗️ Architecture

### System Components

1. **FDA Agent (Fraud Detection & Analysis)** - External sentiment monitor
2. **IAA Agent (Internal Analysis Agent)** - Database searcher and analyst
3. **EBA Agent (Executive Briefing Agent)** - PR post generator
4. **FastAPI Backend** - Orchestration and API layer
5. **React Frontend** - Operator control panel
6. **SQLite Database** - Transaction and review storage
7. **Ollama LLM** - AI inference engine

### Data Flow

```
FDA Agent → Backend API → IAA Agent → EBA Agent → Human Approval → Social Media
                ↓              ↓           ↓            ↓
            Database      Ollama LLM   Ollama LLM   Frontend
                              ↓           ↓            ↓
                         WebSocket Broadcasting ───────┘
```

## 📁 Project Structure

```
bank_website/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── iaa_agent.py          # Internal Analysis Agent
│   │   │   └── eba_agent.py          # Executive Briefing Agent
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── sentiment_routes.py   # Main workflow endpoints
│   │   │   └── database_routes.py    # CRUD endpoints
│   │   ├── __init__.py
│   │   ├── config.py                 # Configuration manager
│   │   ├── database.py               # SQLAlchemy setup
│   │   ├── models.py                 # Database models
│   │   ├── schemas.py                # Pydantic schemas
│   │   ├── websocket.py              # WebSocket manager
│   │   └── seed_data.py              # Database seeding
│   ├── main.py                       # FastAPI application
│   ├── requirements.txt
│   ├── config.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx            # Main layout with navigation
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts       # WebSocket hook
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Real-time workflow view
│   │   │   ├── PostsManagement.tsx   # Human-in-the-loop editor
│   │   │   └── DatabaseManagement.tsx # CRUD interface
│   │   ├── api.ts                    # API client
│   │   ├── types.ts                  # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── fda_agent_simulator.py            # FDA agent simulator
├── social_media_simulator.py         # Social media mock server
├── start.ps1                         # Quick start script
├── SETUP_GUIDE.md                    # Complete setup guide
└── README.md
```

## 🗄️ Database Schema

### Tables

1. **transactions** - Bank transaction records
   - 1000 seeded records
   - Statuses: completed, inprocess, pending, flagged, failed
   - Fields: transaction_id, customer info, amount, type, status, timestamps

2. **customer_reviews** - Customer feedback
   - 200 seeded records
   - Sentiments: positive, negative, neutral
   - Categories: service, fraud_concern, app_issue, general

3. **sentiments** - FDA agent signals
   - Dynamic records from FDA agent
   - Fields: signal_type, confidence, drivers, escalation flag

4. **agent_workflows** - Workflow tracking
   - Links sentiment → IAA → EBA → approval → posting
   - Stores both original and edited posts
   - Tracks approver and timestamps

## 🔄 Workflow Details

### Step 1: FDA Agent Signal (Every 30 seconds)

```json
{
  "signal_type": "potential_scam_rumor",
  "confidence": 0.65,
  "drivers": ["social_media_chatter", "fraud_concerns"],
  "uncertainty_notes": "...",
  "recommend_escalation": true
}
```

### Step 2: IAA Agent Processing

1. **Searches Transactions Database**
   - Looks for flagged/pending transactions
   - Fuzzy matches based on sentiment drivers
   - Returns up to 10 matching records

2. **Searches Customer Reviews**
   - Finds negative reviews about fraud/service
   - Semantic matching on review text
   - Returns up to 10 matching reviews

3. **Generates Analysis (Streaming)**
   - Uses Ollama LLM to analyze correlations
   - Identifies patterns and red flags
   - Provides recommendations
   - Streams to frontend in real-time

### Step 3: EBA Agent Post Generation

1. **Receives IAA Analysis**
   - Sentiment data
   - Matched records
   - IAA's analysis paragraph

2. **Generates PR Post (Streaming)**
   - Creates professional markdown post
   - Reassuring tone for public
   - No sensitive customer data
   - Streams to frontend in real-time

### Step 4: Human Approval

1. **Operator Reviews Post**
   - Sees original AI-generated content
   - Can edit the markdown directly
   - Comparison view available

2. **Approval Options**
   - "Approve As-Is" - Use original post
   - "Edit Post" - Modify and approve edited version

3. **Audit Trail**
   - Both original and edited versions stored
   - Approver name recorded
   - Timestamp captured

### Step 5: Social Media Publishing

- Approved post sent to social media simulator
- Real production would integrate with actual platforms
- Status updated to "posted"

## 🎨 Frontend Features

### Dashboard Page

- **Real-Time WebSocket Updates**
  - FDA signal reception
  - IAA analysis streaming
  - EBA post generation streaming
  
- **Workflow Visualization**
  - Color-coded status badges
  - Progress indicators
  - Error handling display

- **Content Display**
  - FDA signal details with drivers
  - IAA analysis with matched records
  - EBA markdown-formatted posts

### PR Posts Management Page

- **Pending Approvals**
  - List of posts awaiting review
  - Edit interface with markdown support
  - Side-by-side original vs edited comparison

- **Approval History**
  - All approved and posted content
  - Shows who approved and when
  - Displays original and edited versions

- **Human-in-the-Loop Editing**
  - Full markdown editor
  - Live preview
  - Approval workflow

### Database Management Page

- **Transactions Tab**
  - View 1000 transactions
  - Edit status and flags
  - Delete records
  - Status filtering

- **Customer Reviews Tab**
  - View 200 reviews
  - Rating display
  - Sentiment badges
  - Delete capability

- **Sentiments Tab**
  - View all FDA signals
  - Confidence scores
  - Driver tags
  - Delete old records

## 🤖 AI Agents Deep Dive

### IAA Agent (Internal Analysis Agent)

**Purpose:** Correlate social sentiment with internal bank data

**Capabilities:**
- Fuzzy search across transactions and reviews
- Semantic matching using keywords
- LLM-powered analysis generation
- Streaming response to frontend

**Search Strategy:**
1. Extract keywords from FDA signal
2. Query transactions for:
   - Flagged transactions
   - In-process/pending transactions
   - Description/reason matches
3. Query reviews for:
   - Negative sentiment
   - Fraud/service categories
   - Text content matches
4. Generate contextual analysis

**LLM Prompt Structure:**
```
You are an Internal Analysis Agent...

Sentiment Signal: [FDA data]
Matching Transactions: [search results]
Matching Reviews: [search results]

Provide analysis on:
1. Correlation with internal data
2. Patterns or red flags
3. Recommendations
```

### EBA Agent (Executive Briefing Agent)

**Purpose:** Generate professional PR posts for public communication

**Capabilities:**
- LLM-powered content generation
- Markdown formatting
- Streaming response
- Professional tone calibration

**Content Guidelines:**
1. Acknowledge concern without admission
2. Highlight security commitment
3. Provide reassurance
4. Invite customer contact
5. Maintain calm, confident tone

**LLM Prompt Structure:**
```
You are an Executive Briefing Agent...

Sentiment Detected: [FDA signal]
Internal Analysis: [IAA analysis]
Matched Data: [summary stats]

Create professional social media post:
- Acknowledge concern
- Reassure customers
- Highlight safeguards
- Professional markdown format
```

## 🔧 Technical Implementation Details

### Backend (FastAPI)

**Key Technologies:**
- FastAPI for async API
- SQLAlchemy ORM with async support
- Pydantic for validation
- WebSockets for real-time updates
- httpx for async HTTP calls
- Ollama Python client

**Design Patterns:**
- Async/await throughout
- Background tasks for agent processing
- Connection manager for WebSocket
- Repository pattern for database
- Configuration management

**Error Handling:**
- Try/except in all agent methods
- Retry logic with configurable attempts
- Error status in workflows
- WebSocket error broadcasting

### Frontend (React + TypeScript)

**Key Technologies:**
- React 18 with hooks
- TypeScript for type safety
- Vite for fast dev experience
- TanStack Query for data fetching
- React Router for navigation
- Tailwind CSS for styling
- WebSocket native API

**State Management:**
- React Query for server state
- Local useState for UI state
- WebSocket hook for real-time data
- No global state library (not needed)

**Performance Optimizations:**
- Code splitting by route
- React.memo for expensive components
- Debounced inputs
- Efficient WebSocket handling

## 📊 Demo Scenarios

### Scenario 1: Fraud Rumor

1. FDA sends "potential_scam_rumor" signal
2. IAA finds 2 flagged transactions + 3 negative reviews about fraud
3. IAA analysis: "Correlation detected - recommend immediate investigation"
4. EBA generates reassuring post about security measures
5. Operator edits to add specific contact info
6. Post approved and published

### Scenario 2: Service Complaints

1. FDA sends "transaction_delay_complaints" signal
2. IAA finds 5 pending transactions + 8 negative service reviews
3. IAA analysis: "Pattern of delays in international transfers confirmed"
4. EBA generates post acknowledging issue and timeline
5. Operator approves as-is
6. Post published immediately

### Scenario 3: Positive Sentiment

1. FDA sends "positive_sentiment_spike" signal
2. IAA finds recent positive reviews about new feature
3. IAA analysis: "No issues - positive response to app update"
4. EBA generates thank-you post highlighting feature
5. Operator approves
6. Post celebrates customer satisfaction

## 🚀 Deployment Considerations

### Production Readiness Checklist

- [ ] Replace SQLite with PostgreSQL/MySQL
- [ ] Add authentication and authorization
- [ ] Implement rate limiting
- [ ] Add request validation and sanitization
- [ ] Set up proper logging infrastructure
- [ ] Configure CORS properly
- [ ] Add monitoring and alerting
- [ ] Implement proper error tracking (Sentry)
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive testing
- [ ] Configure environment-based settings
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement caching layer
- [ ] Add database migrations
- [ ] Set up backup strategy

### Scaling Considerations

- Use Redis for WebSocket pub/sub
- Add message queue (RabbitMQ/Celery) for agent tasks
- Implement horizontal scaling for backend
- Add CDN for frontend assets
- Use managed database service
- Implement connection pooling
- Add load balancer

## 🎓 Learning Outcomes

This project demonstrates:

1. **Multi-Agent Architecture** - Coordinating multiple AI agents
2. **Real-Time Systems** - WebSocket streaming and live updates
3. **Human-in-the-Loop** - AI augmentation, not replacement
4. **Full-Stack Development** - FastAPI + React + TypeScript
5. **LLM Integration** - Ollama with streaming responses
6. **Modern Python** - Async/await, type hints, modern practices
7. **Modern React** - Hooks, TypeScript, React Query
8. **Database Design** - Relational schema with proper relationships
9. **API Design** - RESTful principles and WebSocket integration
10. **UI/UX** - Real-time feedback and intuitive workflows

## 📝 Key Files Explained

### Backend

- **main.py** - FastAPI app initialization, CORS, lifespan events
- **models.py** - SQLAlchemy models with relationships
- **schemas.py** - Pydantic models for validation
- **iaa_agent.py** - Database search + LLM analysis
- **eba_agent.py** - LLM post generation + social media posting
- **sentiment_routes.py** - Main workflow orchestration
- **websocket.py** - WebSocket connection management
- **seed_data.py** - Database population with realistic data

### Frontend

- **Dashboard.tsx** - Real-time workflow visualization
- **PostsManagement.tsx** - Human-in-the-loop editing
- **DatabaseManagement.tsx** - Full CRUD interface
- **useWebSocket.ts** - WebSocket connection hook
- **api.ts** - Axios-based API client

## 🔍 Code Quality Features

- **Type Safety** - TypeScript frontend, Python type hints
- **Error Handling** - Comprehensive try/catch blocks
- **Validation** - Pydantic models for API validation
- **Code Organization** - Clear separation of concerns
- **Reusability** - Modular components and functions
- **Documentation** - Inline comments and README files
- **Consistency** - Coding standards throughout

## 🎯 Hackathon Demo Script

1. **Show the Dashboard** - Explain real-time updates
2. **Trigger FDA Agent** - Watch workflow unfold
3. **Highlight IAA Search** - Show database correlation
4. **Show EBA Generation** - Streaming PR post
5. **Demo Human Editing** - Edit and approve
6. **Show Social Media Post** - Final output
7. **Open Database Tab** - Show CRUD operations
8. **Explain Architecture** - Multi-agent coordination

## 🏆 Innovation Highlights

1. **Streaming LLM Responses** - Lowest perceived latency
2. **Human-in-the-Loop** - AI augmentation philosophy
3. **Audit Trail** - Complete transparency and tracking
4. **Real-Time WebSocket** - Live operator awareness
5. **Semantic Search** - Intelligent data correlation
6. **Modular Agents** - Easy to extend and modify
7. **Modern Tech Stack** - Industry-standard tools
8. **Complete System** - From sensing to publishing

---

**Built for GDC Mashreq Hackathon 2026**

**Tech Stack:** FastAPI • React • TypeScript • Ollama • SQLite • WebSockets • Tailwind CSS
