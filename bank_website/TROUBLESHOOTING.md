# Bank Sentinel - Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Won't Start

#### Issue: Port 8000 already in use

**Error:**
```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)
```

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn main:app --reload --port 8001
```

#### Issue: Module not found errors

**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```powershell
cd backend
pip install -r requirements.txt
```

#### Issue: Database not initialized

**Error:**
```
sqlite3.OperationalError: no such table: transactions
```

**Solution:**
```powershell
cd backend
python -m app.seed_data
```

### 2. Frontend Won't Start

#### Issue: Port 5173 already in use

**Solution:**
```powershell
# Kill the process or edit vite.config.ts to use different port
# vite.config.ts:
server: {
  port: 5174,  // Change this
  ...
}
```

#### Issue: npm install fails

**Error:**
```
npm ERR! code ENOENT
```

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# Reinstall
npm install
```

#### Issue: TypeScript errors

**Solution:**
```powershell
# Clear TypeScript cache
rm -r .vite
rm -r dist

# Restart dev server
npm run dev
```

### 3. Ollama Issues

#### Issue: Ollama not running

**Error:**
```
httpx.ConnectError: Connection refused
```

**Solution:**
```powershell
# Start Ollama
ollama serve

# Verify it's running
ollama list
```

#### Issue: Model not found

**Error:**
```
Error: model 'llama3.2:8b' not found
```

**Solution:**
```powershell
# Pull the model
ollama pull llama3.2:8b

# List available models
ollama list
```

#### Issue: Ollama responses are slow

**Solutions:**
- Use a smaller model: `ollama pull llama3.2:3b`
- Update `backend/config.json` to use the smaller model
- Check CPU/GPU usage
- Reduce `num_predict` in agent code

### 4. WebSocket Issues

#### Issue: WebSocket not connecting

**Symptoms:**
- Dashboard shows "Disconnected"
- No real-time updates

**Solution:**
```
1. Check backend is running on port 8000
2. Check browser console for errors (F12)
3. Refresh frontend page
4. Check CORS settings in backend/main.py
```

**Browser Console Check:**
```javascript
// Open browser console and try:
const ws = new WebSocket('ws://localhost:8000/api/ws');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

#### Issue: WebSocket disconnects frequently

**Solution:**
- Check network stability
- Increase ping interval in `useWebSocket.ts`
- Check for firewall/antivirus interference

### 5. Database Issues

#### Issue: Database locked

**Error:**
```
sqlite3.OperationalError: database is locked
```

**Solution:**
```powershell
# Close all connections to database
# Stop backend server
# Delete database and reseed

cd backend
rm bank_database.db
python -m app.seed_data
```

#### Issue: Can't edit transactions in UI

**Symptoms:**
- Edit button doesn't work
- Save fails

**Solution:**
- Check browser console for errors
- Verify backend is running
- Check API endpoint is accessible: `http://localhost:8000/api/database/transactions`

### 6. FDA Agent Simulator Issues

#### Issue: FDA agent not sending data

**Symptoms:**
- No new workflows appearing
- Terminal shows no output

**Solution:**
```powershell
# Check backend URL in fda_agent_simulator.py
# Should be: http://localhost:8000/api/send_social_sentiment

# Test manually:
curl -X POST http://localhost:8000/api/send_social_sentiment \
  -H "Content-Type: application/json" \
  -d '{
    "signal_type": "test",
    "confidence": 0.7,
    "drivers": ["test"],
    "recommend_escalation": true
  }'
```

#### Issue: httpx module not found

**Error:**
```
ModuleNotFoundError: No module named 'httpx'
```

**Solution:**
```powershell
pip install httpx
```

### 7. Social Media Simulator Issues

#### Issue: EBA can't post to social media

**Error in backend logs:**
```
Social media posting error: Connection refused
```

**Solution:**
```powershell
# Check social media simulator is running on port 8001
# Visit http://localhost:8001

# If not running:
python social_media_simulator.py
```

### 8. Performance Issues

#### Issue: Slow LLM responses

**Solutions:**
1. Use smaller Ollama model:
   ```powershell
   ollama pull llama3.2:3b
   ```

2. Update `backend/config.json`:
   ```json
   {
     "ollama": {
       "model": "llama3.2:3b"
     }
   }
   ```

3. Reduce token limit in agent code:
   ```python
   'options': {
     'temperature': 0.7,
     'num_predict': 300  # Reduce from 500
   }
   ```

#### Issue: Frontend lagging

**Solutions:**
- Clear browser cache
- Close unnecessary browser tabs
- Check browser console for errors
- Disable React DevTools

### 9. Build Issues

#### Backend won't build

**Solution:**
```powershell
# Reinstall all dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

#### Frontend won't build

**Error:**
```
TypeScript error in ...
```

**Solution:**
```powershell
# Fix TypeScript errors or ignore for build
npm run build -- --mode production
```

### 10. API Issues

#### Issue: CORS errors

**Error in browser console:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
Edit `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Issue: 404 Not Found on API calls

**Solution:**
- Check API URL in `frontend/src/api.ts`
- Verify backend endpoints in `http://localhost:8000/docs`
- Check network tab in browser DevTools

### 11. Agent Processing Issues

#### Issue: IAA agent not finding matches

**Possible Causes:**
- No relevant data in database
- Search threshold too high

**Solution:**
```python
# Edit backend/app/agents/iaa_agent.py
# Lower search threshold in config.json:
{
  "agents": {
    "iaa": {
      "search_threshold": 0.4  // Lower from 0.6
    }
  }
}
```

#### Issue: EBA agent generating poor posts

**Solution:**
- Adjust temperature in `backend/app/agents/eba_agent.py`
- Modify the prompt to be more specific
- Use a different/larger Ollama model

### 12. Environment Issues

#### Issue: Wrong Python version

**Error:**
```
SyntaxError: invalid syntax
```

**Solution:**
```powershell
# Check Python version (need 3.10+)
python --version

# Use specific Python version
py -3.10 -m venv venv
```

#### Issue: Wrong Node version

**Solution:**
```powershell
# Check Node version (need 18+)
node --version

# Install nvm and switch version if needed
```

## Diagnostic Commands

### Check All Services

```powershell
# Backend
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173

# Social Media
curl http://localhost:8001

# Ollama
curl http://localhost:11434/api/version
```

### View Logs

```powershell
# Backend logs (if running in terminal, check terminal output)

# Frontend logs (browser console)
# Press F12 → Console tab

# Database queries
# Check backend terminal for SQLAlchemy echo logs
```

### Check Ports

```powershell
# Check which ports are in use
netstat -ano | findstr "8000 8001 5173 11434"
```

## Getting Help

### Debug Mode

**Backend:**
```python
# In main.py, set:
engine = create_async_engine(
    config.database_url,
    echo=True,  # Shows all SQL queries
    future=True
)
```

**Frontend:**
```typescript
// Add console.log in components
console.log('WebSocket message:', message);
console.log('API response:', response.data);
```

### Reset Everything

```powershell
# Nuclear option - fresh start

# 1. Stop all services (Ctrl+C in all terminals)

# 2. Backend reset
cd backend
rm bank_database.db
pip install -r requirements.txt
python -m app.seed_data

# 3. Frontend reset
cd ../frontend
rm -r node_modules
rm package-lock.json
npm install

# 4. Restart everything
.\start.ps1
```

## Still Having Issues?

1. Check all prerequisites are installed:
   - Python 3.10+
   - Node.js 18+
   - Ollama with llama3.2:8b model

2. Verify all services are running:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:5173
   - Social Media: http://localhost:8001
   - Ollama: http://localhost:11434

3. Check logs in all terminal windows

4. Review error messages carefully

5. Search error messages online

6. Check PROJECT_SUMMARY.md and SETUP_GUIDE.md for more details
