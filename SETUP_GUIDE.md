# 🚀 COMPLETE SETUP GUIDE

## Prerequisites Check

### 1. Python 3.10+
```bash
python --version
# Should show: Python 3.10.x or higher
```

### 2. Node.js 18+
```bash
node --version
# Should show: v18.x.x or higher
```

### 3. Ollama (or compatible LLM)
```bash
ollama --version
# Should show: ollama version x.x.x

# Pull required model
ollama pull llama3.2
```

---

## Step-by-Step Setup

### 1. Install Python Dependencies

#### Social Media Platform
```bash
cd social_media/backend
pip install fastapi uvicorn sqlalchemy pydantic
cd ../..
```

#### Bank Sentinel Backend
```bash
cd bank_website/backend
pip install -r requirements.txt
# OR manually:
pip install fastapi uvicorn sqlalchemy asyncpg httpx python-multipart websockets pydantic
cd ../..
```

### 2. Install Frontend Dependencies

```bash
cd bank_website/frontend
npm install
cd ../..
```

---

## Running the Solution

### Option A: Automatic Startup (Recommended)

#### Windows:
```bash
start.bat
```

#### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

### Option B: Manual Startup (3 Terminals)

#### Terminal 1: Social Media Platform
```bash
cd social_media/backend
python run.py
```
✅ Running on http://localhost:8001

#### Terminal 2: Bank Sentinel Backend
```bash
cd bank_website/backend
python -m uvicorn app.main:app --reload --port 8000
```
✅ Running on http://localhost:8000

#### Terminal 3: Frontend Dashboard
```bash
cd bank_website/frontend
npm run dev
```
✅ Running on http://localhost:5174

---

## Verification

### 1. Test All Services Running
```bash
python test_winning_solution.py
```

Expected output:
```
✅ Social media platform running: X posts available
✅ FDA signal processed
✅ CORRECT: IAA analyzing SOCIAL signals
```

### 2. Access Dashboard
- URL: http://localhost:5174
- Login: `bankop` / `bankop123`

### 3. Verify Social Media API
```bash
curl http://localhost:8001/api/
# Should return: {"service":"Social Signal Chatroom API","status":"running"}

curl http://localhost:8001/api/sync
# Should return: [...list of posts...]
```

### 4. Verify Backend API
```bash
curl http://localhost:8000/api/health
# Should return: {"status":"healthy"}
```

---

## Troubleshooting

### Problem: Social media platform won't start

**Solution**:
```bash
cd social_media/backend
pip install fastapi uvicorn sqlalchemy
python run.py
```

### Problem: Backend shows "Cannot connect to Ollama"

**Solution**:
```bash
# Check if Ollama is running
ollama list

# Start Ollama if not running
ollama serve

# Pull the model
ollama pull llama3.2
```

### Problem: Frontend shows "Cannot connect to backend"

**Solution**:
1. Check backend is running on port 8000
2. Check CORS is enabled in backend
3. Check `bank_website/frontend/src/api.ts` has correct URL:
   ```typescript
   const api = axios.create({
     baseURL: 'http://localhost:8000'
   });
   ```

### Problem: IAA analysis doesn't show social patterns

**Solution**:
1. Restart backend server
2. Check that new `iaa_agent.py` is loaded
3. Look for log: "Fetched X social media posts from sync"
4. If still showing transaction analysis, the old code is cached

### Problem: No posts in social media platform

**Solution**:
```bash
# Add sample posts via API
curl -X POST http://localhost:8001/posts/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Beware of fake Mashreq SMS - phishing scam!",
    "channel_id": "fraud-watch"
  }'
```

---

## Database Reset (If Needed)

### Social Media Database
```bash
cd social_media/backend
rm -f social_chat.db history.json
python run.py
# Fresh database created
```

### Bank Sentinel Database
```bash
cd bank_website/backend
rm -f bank_sentinel.db
python -m uvicorn app.main:app --reload --port 8000
# Fresh database created
```

---

## Configuration Files

### Social Media Platform Config
Location: `social_media/backend/app/database.py`
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./social_chat.db"
```

### Bank Sentinel Backend Config
Location: `bank_website/backend/app/config.py`
```python
ollama_base_url = "http://localhost:11434"
ollama_model = "llama3.2"
```

### Frontend Config
Location: `bank_website/frontend/src/api.ts`
```typescript
baseURL: 'http://localhost:8000'
```

---

## Environment Variables (Optional)

Create `.env` files if you need custom configuration:

### `social_media/backend/.env`
```
DATABASE_URL=sqlite:///./social_chat.db
```

### `bank_website/backend/.env`
```
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
DATABASE_URL=sqlite:///./bank_sentinel.db
```

---

## Testing Workflow

### 1. Create Test Social Posts
```bash
# Run this after starting social media platform
curl -X POST http://localhost:8001/posts/ \
  -H "Content-Type: application/json" \
  -d '{
    "content": "@SecurityAlert says: URGENT! Fake Mashreq rewards SMS circulating - phishing scam targeting customers!",
    "channel_id": "fraud-watch"
  }'
```

### 2. Trigger FDA Detection
```bash
python test_winning_solution.py
```

### 3. Monitor Dashboard
1. Login: http://localhost:5174
2. Watch Dashboard for new signals
3. Review IAA analysis
4. Approve/escalate/discard

---

## Next Steps

### For Competition Demo:

1. ✅ Verify all 3 servers running
2. ✅ Run test script successfully
3. ✅ Login to dashboard works
4. ✅ IAA shows social pattern analysis (NOT transactions!)
5. 📝 Prepare demo data (interesting social posts)
6. 🎥 Record 2-minute video
7. 📊 Prepare 10-minute pitch

### For Development:

1. Add more sample social posts
2. Customize risk thresholds in `iaa_agent.py`
3. Adjust LLM prompts for better explanations
4. Add more scenarios to test
5. Improve UI/UX if needed

---

## Success Criteria

✅ All 3 servers start without errors  
✅ Test script shows "IAA analyzing SOCIAL signals"  
✅ Dashboard shows risk levels and social patterns  
✅ No transaction/review analysis in IAA output  
✅ Human approval workflow works  
✅ Audit trail logs decisions  

---

**You're ready to win! 🏆**
