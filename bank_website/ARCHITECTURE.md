# Bank Sentinel - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BANK SENTINEL SYSTEM                              │
│                     Multi-Agent PR Management Platform                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL LAYER                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                    ┌─────────────────────┐         │
│  │   FDA AGENT         │                    │   SOCIAL MEDIA      │         │
│  │   (Simulator)       │                    │   (Simulator)       │         │
│  │                     │                    │                     │         │
│  │ - Monitors social   │                    │ - Receives posts    │         │
│  │   media             │                    │ - Publishes content │         │
│  │ - Detects sentiment │                    │ - Tracking metrics  │         │
│  │ - Sends signals     │                    │                     │         │
│  │   every 30s         │                    │ Port: 8001          │         │
│  └──────────┬──────────┘                    └──────────▲──────────┘         │
│             │                                          │                    │
│             │ POST /send_social_sentiment              │ POST /api/posts    │
│             │                                          │                    │
└─────────────┼──────────────────────────────────────────┼────────────────────┘
              │                                          │
              ▼                                          │
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER (FastAPI)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │                    API GATEWAY (main.py)                       │         │
│  │  - Request routing                                             │         │
│  │  - CORS handling                                               │         │
│  │  - WebSocket management                                        │         │
│  └─────┬────────────────────────────────────────────┬─────────────┘         │
│        │                                            │                       │
│        │                                            │                       │
│  ┌─────▼──────────────────┐             ┌──────────▼──────────┐            │
│  │  SENTIMENT ROUTES      │             │  DATABASE ROUTES    │            │
│  │                        │             │                     │            │
│  │ - /send_sentiment      │             │ - /transactions     │            │
│  │ - /workflows           │             │ - /reviews          │            │
│  │ - /workflows/:id/      │             │ - /sentiments       │            │
│  │   approve              │             │ - CRUD operations   │            │
│  │ - /ws (WebSocket)      │             │                     │            │
│  └─────┬──────────────────┘             └──────────┬──────────┘            │
│        │                                           │                       │
│        │                                           │                       │
│  ┌─────▼───────────────────────────────────────────▼──────────┐            │
│  │              WORKFLOW ORCHESTRATOR                          │            │
│  │                                                             │            │
│  │  - Receives FDA signal                                     │            │
│  │  - Creates workflow record                                 │            │
│  │  - Triggers IAA agent                                      │            │
│  │  - Triggers EBA agent                                      │            │
│  │  - Broadcasts WebSocket updates                            │            │
│  │  - Handles approvals                                       │            │
│  │  - Posts to social media                                   │            │
│  └─────┬───────────────────────────────────┬──────────────────┘            │
│        │                                   │                               │
│        │                                   │                               │
│  ┌─────▼──────────┐              ┌────────▼──────────┐                     │
│  │  IAA AGENT     │              │   EBA AGENT       │                     │
│  │                │              │                   │                     │
│  │ 1. Search DBs  │──────────┐   │ 1. Receive IAA    │                     │
│  │ 2. Find matches│          │   │    analysis       │                     │
│  │ 3. Call LLM    │          │   │ 2. Call LLM       │                     │
│  │ 4. Stream      │          │   │ 3. Stream post    │                     │
│  │    analysis    │          │   │ 4. Return result  │                     │
│  └────────┬───────┘          │   └────────┬──────────┘                     │
│           │                  │            │                                │
│           ▼                  ▼            ▼                                │
│  ┌────────────────┐   ┌─────────────┐   ┌──────────────┐                  │
│  │   DATABASE     │   │   OLLAMA    │   │  WEBSOCKET   │                  │
│  │   (SQLite)     │   │   CLIENT    │   │  MANAGER     │                  │
│  │                │   │             │   │              │                  │
│  │ - Transactions │   │ - LLM calls │   │ - Broadcast  │                  │
│  │ - Reviews      │   │ - Streaming │   │ - Connect    │                  │
│  │ - Sentiments   │   │ - Tool use  │   │ - Disconnect │                  │
│  │ - Workflows    │   │             │   │              │                  │
│  └────────────────┘   └─────┬───────┘   └──────┬───────┘                  │
│                             │                  │                          │
│                             │                  │                          │
│                  Port: 8000 │                  │ WS                        │
└─────────────────────────────┼──────────────────┼──────────────────────────┘
                              │                  │
                              │                  │
                              ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                    ┌─────────────────────┐         │
│  │   OLLAMA SERVER     │                    │   (Future)          │         │
│  │                     │                    │   EMBEDDING API     │         │
│  │ - LLM inference     │                    │   VECTOR DB         │         │
│  │ - Model: llama3.2   │                    │   ANALYTICS         │         │
│  │ - Streaming support │                    │                     │         │
│  │                     │                    │                     │         │
│  │ Port: 11434         │                    │                     │         │
│  └─────────────────────┘                    └─────────────────────┘         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │ WS + HTTP
                              │
┌─────────────────────────────┼──────────────────────────────────────────────┐
│                       FRONTEND LAYER (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                   MAIN APP (App.tsx)                         │          │
│  │  - React Router                                              │          │
│  │  - Query Client Provider                                     │          │
│  │  - Layout wrapper                                            │          │
│  └────┬───────────────────────────┬──────────────┬──────────────┘          │
│       │                           │              │                         │
│       ▼                           ▼              ▼                         │
│  ┌─────────────┐         ┌─────────────┐   ┌─────────────┐               │
│  │  DASHBOARD  │         │  PR POSTS   │   │  DATABASE   │               │
│  │   PAGE      │         │    PAGE     │   │    PAGE     │               │
│  │             │         │             │   │             │               │
│  │ - Real-time │         │ - Pending   │   │ - Trans.    │               │
│  │   workflow  │         │   posts     │   │ - Reviews   │               │
│  │ - FDA       │         │ - Approve   │   │ - Sentiments│               │
│  │   signal    │         │ - Edit      │   │ - CRUD ops  │               │
│  │ - IAA       │         │ - Compare   │   │             │               │
│  │   analysis  │         │ - History   │   │             │               │
│  │ - EBA post  │         │             │   │             │               │
│  └──────┬──────┘         └──────┬──────┘   └──────┬──────┘               │
│         │                       │                  │                       │
│         └───────────┬───────────┴──────────────────┘                       │
│                     │                                                      │
│              ┌──────▼──────────┐                                           │
│              │  SHARED HOOKS   │                                           │
│              │                 │                                           │
│              │ - useWebSocket  │                                           │
│              │ - useQuery      │                                           │
│              │ - useMutation   │                                           │
│              └──────┬──────────┘                                           │
│                     │                                                      │
│              ┌──────▼──────────┐                                           │
│              │   API CLIENT    │                                           │
│              │   (axios)       │                                           │
│              │                 │                                           │
│              │ - workflowsApi  │                                           │
│              │ - transactionsApi│                                          │
│              │ - reviewsApi    │                                           │
│              │ - sentimentsApi │                                           │
│              └─────────────────┘                                           │
│                                                                             │
│                           Port: 5173                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
STEP 1: FDA SIGNAL
┌─────────────┐
│ FDA Agent   │ Monitors social media, detects sentiment
└──────┬──────┘
       │ POST sentiment data
       ▼
┌─────────────┐
│ Backend API │ Receives signal, creates workflow
└──────┬──────┘
       │ Broadcast via WebSocket
       ▼
┌─────────────┐
│ Frontend    │ Displays: "FDA Received"
└─────────────┘


STEP 2: IAA ANALYSIS
┌─────────────┐
│ Backend     │ Triggers IAA Agent
└──────┬──────┘
       ▼
┌─────────────┐
│ IAA Agent   │ 1. Search transactions DB
│             │ 2. Search reviews DB
│             │ 3. Call Ollama LLM
└──────┬──────┘
       │ Stream analysis chunks
       ▼
┌─────────────┐
│ WebSocket   │ Broadcast each chunk
└──────┬──────┘
       ▼
┌─────────────┐
│ Frontend    │ Display streaming analysis
└─────────────┘


STEP 3: EBA POST GENERATION
┌─────────────┐
│ Backend     │ Triggers EBA Agent with IAA results
└──────┬──────┘
       ▼
┌─────────────┐
│ EBA Agent   │ 1. Receive IAA analysis
│             │ 2. Call Ollama LLM
│             │ 3. Generate markdown post
└──────┬──────┘
       │ Stream post chunks
       ▼
┌─────────────┐
│ WebSocket   │ Broadcast each chunk
└──────┬──────┘
       ▼
┌─────────────┐
│ Frontend    │ Display streaming post (markdown)
└─────────────┘


STEP 4: HUMAN APPROVAL
┌─────────────┐
│ Operator    │ Reviews post in "PR Posts" tab
└──────┬──────┘
       │ Edit (optional) + Approve
       ▼
┌─────────────┐
│ Frontend    │ POST /workflows/:id/approve
└──────┬──────┘
       ▼
┌─────────────┐
│ Backend API │ Updates workflow status
└──────┬──────┘
       │ POST to social media
       ▼
┌─────────────┐
│ Social Med. │ Receives post, displays
└─────────────┘


STEP 5: CONFIRMATION
┌─────────────┐
│ Backend     │ Updates workflow: "posted"
└──────┬──────┘
       │ Broadcast confirmation
       ▼
┌─────────────┐
│ Frontend    │ Shows "Posted" status
└─────────────┘
```

## Database Schema

```
┌────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────┐              │
│  │        TRANSACTIONS TABLE                │              │
│  │                                          │              │
│  │  - id (PK)                               │              │
│  │  - transaction_id (unique)               │              │
│  │  - customer_id                           │              │
│  │  - customer_name                         │              │
│  │  - amount, currency                      │              │
│  │  - transaction_type                      │              │
│  │  - status (enum)                         │              │
│  │  - flagged_reason                        │              │
│  │  - timestamps                            │              │
│  │                                          │              │
│  │  Records: ~1000                          │              │
│  └─────────────────────────────────────────┘              │
│                                                            │
│  ┌─────────────────────────────────────────┐              │
│  │     CUSTOMER_REVIEWS TABLE               │              │
│  │                                          │              │
│  │  - id (PK)                               │              │
│  │  - review_id (unique)                    │              │
│  │  - customer_id                           │              │
│  │  - customer_name                         │              │
│  │  - rating (1-5)                          │              │
│  │  - sentiment (enum)                      │              │
│  │  - category                              │              │
│  │  - review_text                           │              │
│  │  - source                                │              │
│  │  - timestamp                             │              │
│  │                                          │              │
│  │  Records: ~200                           │              │
│  └─────────────────────────────────────────┘              │
│                                                            │
│  ┌─────────────────────────────────────────┐              │
│  │        SENTIMENTS TABLE                  │              │
│  │                                          │              │
│  │  - id (PK)                               │              │
│  │  - signal_type                           │              │
│  │  - confidence                            │              │
│  │  - drivers (JSON array)                  │              │
│  │  - uncertainty_notes                     │              │
│  │  - recommend_escalation                  │              │
│  │  - raw_data (JSON)                       │              │
│  │  - timestamp                             │              │
│  │                                          │              │
│  │  Records: dynamic (from FDA)             │              │
│  └────────────┬────────────────────────────┘              │
│               │ 1:N                                        │
│  ┌────────────▼────────────────────────────┐              │
│  │     AGENT_WORKFLOWS TABLE                │              │
│  │                                          │              │
│  │  - id (PK)                               │              │
│  │  - workflow_id (unique)                  │              │
│  │  - sentiment_id (FK)                     │              │
│  │  - status (enum)                         │              │
│  │  - iaa_matched_transactions (JSON)       │              │
│  │  - iaa_matched_reviews (JSON)            │              │
│  │  - iaa_analysis (text)                   │              │
│  │  - iaa_completed_at                      │              │
│  │  - eba_original_post (text)              │              │
│  │  - eba_edited_post (text)                │              │
│  │  - eba_completed_at                      │              │
│  │  - approved_by                           │              │
│  │  - approved_at                           │              │
│  │  - posted_at                             │              │
│  │  - error_message                         │              │
│  │  - retry_count                           │              │
│  │  - timestamps                            │              │
│  │                                          │              │
│  │  Records: 1 per FDA signal               │              │
│  └─────────────────────────────────────────┘              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## WebSocket Message Flow

```
┌──────────┐                                      ┌──────────┐
│ Backend  │                                      │ Frontend │
└────┬─────┘                                      └─────┬────┘
     │                                                  │
     │ 1. fda_received                                  │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data, timestamp }         │
     │                                                  │
     │ 2. iaa_started                                   │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, message }                 │
     │                                                  │
     │ 3. iaa_progress (multiple)                       │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { chunk } }         │
     ├─────────────────────────────────────────────────>│
     ├─────────────────────────────────────────────────>│
     │                                                  │
     │ 4. iaa_completed                                 │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { analysis } }      │
     │                                                  │
     │ 5. eba_started                                   │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, message }                 │
     │                                                  │
     │ 6. eba_progress (multiple)                       │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { chunk } }         │
     ├─────────────────────────────────────────────────>│
     ├─────────────────────────────────────────────────>│
     │                                                  │
     │ 7. eba_completed                                 │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { post } }          │
     │                                                  │
     │                 [Human approves]                 │
     │                                                  │
     │ 8. post_approved                                 │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { final_post } }    │
     │                                                  │
     │ 9. post_posted                                   │
     ├─────────────────────────────────────────────────>│
     │   { type, workflow_id, data: { status } }        │
     │                                                  │
```

## Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                      TECHNOLOGY STACK                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  BACKEND                           FRONTEND                │
│  ├─ FastAPI 0.109                  ├─ React 18             │
│  ├─ Python 3.10+                   ├─ TypeScript 5.3       │
│  ├─ SQLAlchemy 2.0 (async)         ├─ Vite 5               │
│  ├─ Pydantic 2.5                   ├─ TailwindCSS 3.4      │
│  ├─ WebSockets                     ├─ TanStack Query 5     │
│  ├─ httpx (async HTTP)             ├─ React Router 6       │
│  ├─ Ollama client                  ├─ Axios 1.6            │
│  └─ Uvicorn (ASGI server)          └─ React Markdown 9     │
│                                                            │
│  DATABASE                          AI/ML                   │
│  ├─ SQLite 3                       ├─ Ollama               │
│  ├─ aiosqlite                      ├─ Llama 3.2 (8B)       │
│  └─ Faker (seeding)                └─ Tool calling         │
│                                                            │
│  DEPLOYMENT (Future)               TESTING (Future)        │
│  ├─ Docker                         ├─ pytest               │
│  ├─ Docker Compose                 ├─ pytest-asyncio       │
│  ├─ Nginx                          ├─ Jest                 │
│  └─ PostgreSQL (production)        └─ React Testing Lib    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

**For implementation details, see PROJECT_SUMMARY.md**
**For setup instructions, see SETUP_GUIDE.md**
**For troubleshooting, see TROUBLESHOOTING.md**
