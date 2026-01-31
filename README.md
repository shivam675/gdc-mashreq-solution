# 🏦 Bank Sentinel - Social Signal Intelligence System

## 🎯 Competition: GDC Dubai 2026 - Mashreq Bounty
**Challenge**: AI for Social Signal Intelligence in Banking

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Ollama with llama3.2 model (or compatible LLM)

### 1. Start Social Media Platform (Port 8001)
```bash
cd social_media/backend
python run.py
```

### 2. Start Backend (Port 8000)
```bash
cd bank_website/backend
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend (Port 5174)
```bash
cd bank_website/frontend
npm run dev
```

### 4. Test the Solution
```bash
python test_winning_solution.py
```

### 5. Access Dashboard
- URL: http://localhost:5174
- Login: `bankop` / `bankop123`

---

## 🏗️ Architecture

### The Winning Flow

```
SOCIAL MEDIA PLATFORM (Port 8001)
    ↓ /api/sync - provides posts
FDA AGENT
    ↓ detects signals from social patterns
IAA AGENT (NEW - Social Signal Analysis)
    ↓ fetches MORE social posts
    ↓ analyzes patterns (velocity, spread, keywords)
    ↓ assesses risk (CRITICAL/HIGH/MEDIUM/LOW)
    ↓ generates "Why This Matters" explainability
EBA AGENT
    ↓ creates executive briefing
HUMAN OPERATOR
    ↓ approves/escalates/discards
AUDIT TRAIL
```

### ⚠️ CRITICAL: What We DON'T Do

❌ NO transaction database analysis  
❌ NO customer review analysis  
❌ NO internal banking operations data  

### ✅ What We DO

✅ Social media post pattern analysis  
✅ Spread velocity tracking (posts/hour)  
✅ Risk assessment framework  
✅ Explainability ("Why This Matters")  
✅ Human-in-the-loop approval  
✅ Audit trail logging  

---

## 📊 Covered Scenarios (Requirement: 2 minimum)

### ✅ 1. Fraud or Scam Rumors
**Example**: Phishing SMS campaign

**Flow**:
1. FDA detects spike in "scam", "phishing" posts
2. IAA analyzes social patterns:
   - Volume: 50+ posts in 2 hours
   - Channels: Twitter, Facebook, #ScamAlert
   - Keywords: "fake SMS", "phishing", bank name
3. Risk: **CRITICAL** (customer safety + brand trust)
4. Recommendation: Security escalation + public warning
5. Human approves immediate response

### ✅ 2. Brand Sentiment Shift
**Example**: App crashes causing negative sentiment

**Flow**:
1. FDA detects sentiment drop (70% → 40% positive)
2. IAA analyzes patterns:
   - Driver: App crash complaints spike
   - Volume: 200+ mentions
   - Keywords: "can't login", "crashes"
3. Risk: **HIGH** (brand trust + customer experience)
4. Recommendation: PR acknowledgment + IT escalation
5. Human reviews and approves response

### ✅ 3. Service or Incident Signals
**Example**: ATM network outage

**Flow**:
1. FDA detects "ATM down" clustering
2. IAA verifies:
   - Geographic: 3 cities affected
   - Velocity: 30 posts/30 min
   - Sentiment: Frustration + confusion
3. Risk: **HIGH** (operations + customer experience)
4. Recommendation: Service status update
5. Human escalates to IT operations

### ✅ 4. Executive Insight Briefing
**Dashboard Feature**: Aggregated signal view

- Top 5 signals by risk level
- Trend analysis (24h, 7d, 30d)
- Risk heatmap
- Recommended actions summary

---

## 🛡️ Responsible AI Framework

### 1. Human-in-the-Loop (MANDATORY)
- ✅ All signals require operator review
- ✅ No automated public responses
- ✅ No automated customer contact
- ✅ No automated financial decisions

### 2. Explainability
Every analysis includes:
- **What**: Signal description
- **Why**: "Why This Matters" narrative
- **Impact**: Risk categories (brand/customer/operational/financial)
- **Recommendation**: Suggested actions with reasoning
- **Uncertainty**: Confidence score + what we don't know

### 3. Risk Framework
- **CRITICAL**: Executive escalation, 15min SLA
- **HIGH**: PR + compliance, 60min SLA
- **MEDIUM**: Standard workflow, 4hr SLA
- **LOW**: Monitor only, 24hr SLA

### 4. Privacy & Ethics
- ✅ No personal data collection
- ✅ No individual profiling
- ✅ Aggregated signals only
- ✅ No real social media scraping
- ✅ Synthetic data only

### 5. Audit Trail
- Who made what decision
- When it was made
- Why it was made
- Full context preserved

---

## 🔍 Key Differentiators

### vs. Generic Social Monitoring
- ✅ Banking-specific risk assessment
- ✅ Multi-agent verification (FDA → IAA → EBA)
- ✅ Structured escalation workflow
- ✅ Explainable decision-making

### vs. Transaction Fraud Detection
- ✅ Focuses on SOCIAL signals, not internal data
- ✅ Proactive brand protection
- ✅ Rumor/misinformation detection
- ✅ Public sentiment monitoring

### Competition Alignment
- ✅ 2+ scenarios covered (fraud, sentiment, service, executive)
- ✅ Responsible AI with human-in-loop
- ✅ Clear explainability framework
- ✅ No real social media data
- ✅ Synthetic/team-created only

---

## 🧪 Testing

### Manual Test Flow
1. Run `python test_winning_solution.py`
2. Check console output shows social pattern analysis
3. Login to dashboard
4. Review IAA analysis - should show:
   - Posts analyzed: X
   - Spread velocity: Y posts/hour
   - Risk level: CRITICAL/HIGH/MEDIUM/LOW
   - "Why This Matters" explanation
5. Approve/escalate/discard

### Sample FDA Signal (Included)
```json
{
  "signal_type": "potential_scam_rumor",
  "confidence": 0.98,
  "drivers": [
    "Phishing SMS with fake domain",
    "Rapid spread across #ScamAlert",
    "CVV disclosure reports"
  ],
  "recommend_escalation": true
}
```

---

## 📁 Project Structure

```
gdc-mashreq-solution/
├── SOLUTION_ARCHITECTURE.md       # Full architecture doc
├── README.md                       # This file
├── WHAT_CHANGED.md                 # Detailed change log
├── test_winning_solution.py       # Test script
├── start.bat                       # Windows startup script
├── start.sh                        # Linux/Mac startup script
├── social_media/                   # Simulated social network
│   ├── backend/
│   │   ├── app/
│   │   │   ├── routes/
│   │   │   │   ├── api_index.py   # /api/sync endpoint
│   │   │   │   ├── posts.py       # POST /posts, GET /posts
│   │   │   │   └── comments.py    # POST/GET comments
│   │   │   ├── models.py          # Post, Comment, Reaction
│   │   │   └── main.py            # FastAPI app
│   │   └── run.py                 # Port 8001 server
│   └── frontend/                   # React social UI (optional)
└── bank_website/
    ├── backend/                   # FastAPI backend
    │   ├── app/
    │   │   ├── agents/
    │   │   │   ├── fda_agent.py   # ✅ Detects signals
    │   │   │   ├── iaa_agent.py   # ✅ Analyzes SOCIAL patterns
    │   │   │   └── eba_agent.py   # ✅ Generates briefings
    │   │   ├── models.py          # Database models
    │   │   ├── routes/            # API endpoints
    │   │   └── main.py            # FastAPI app
    │   └── run.py                 # Server entry
    └── frontend/                  # React dashboard
        ├── src/
        │   ├── pages/
        │   │   ├── Dashboard.tsx  # Real-time monitoring
        │   │   ├── PRPosts.tsx    # Approval workflow
        │   │   └── Login.tsx      # Authentication
        │   └── components/
        └── package.json
```

---

## 🎬 Demonstration Plan

### 2-Minute Video
1. **Problem** (15s): Social signals impact brand trust
2. **Architecture** (30s): FDA → IAA (social analysis) → EBA → Human
3. **Live Demo** (45s): Fraud detection flow with dashboard
4. **Responsible AI** (30s): Human-in-loop + explainability

### 10-Minute Pitch
1. **Problem Alignment** (2 min): Why social intelligence matters
2. **Architecture** (3 min): Multi-agent approach + tech stack
3. **Live Demo** (3 min): 
   - Fraud rumor scenario
   - Dashboard walkthrough
   - Approval workflow
4. **Responsible AI** (2 min): Guardrails + audit trail

---

## ✅ Compliance Checklist

- ✅ No live social media platforms used
- ✅ No real posts or feeds scraped
- ✅ No PII or personal data
- ✅ Synthetic/team-created data only
- ✅ No automated public responses
- ✅ Human approval checkpoints
- ✅ Clear confidence scoring
- ✅ Explainability framework
- ✅ Audit trail logging
- ✅ Ethical risk considerations

---

## 🏆 Why This Wins

### 1. Perfectly Aligned
- Addresses SOCIAL SIGNAL intelligence (not internal operations)
- Covers 4 scenarios (fraud, sentiment, service, executive)
- Demonstrates responsible AI principles

### 2. Complete Solution
- Full multi-agent architecture
- Real-time WebSocket updates
- Modern React dashboard
- Structured risk framework

### 3. Production-Ready Features
- Authentication system
- Audit trail
- Escalation workflow
- Clean UI/UX

### 4. Clear Explainability
- "Why This Matters" for every signal
- Risk-based color coding
- Impact categories (brand/customer/ops/financial)
- Recommended actions

### 5. Responsible by Design
- Human-in-loop mandatory
- No automated actions
- Privacy-first approach
- Full auditability

---

## 📝 Notes

### What Changed from Original
**BEFORE**: IAA analyzed internal transactions/reviews (WRONG)  
**AFTER**: IAA analyzes social media patterns (CORRECT)

**Why**: Competition requires social signal intelligence, not banking operations fraud detection.

### FDA Agent
**Q**: Do we need FDA?  
**A**: YES - FDA is your front-line detector. It:
- Monitors social media platform
- Identifies patterns (fraud, sentiment, service issues)
- Outputs structured signals with confidence scores
- Triggers the IAA verification workflow

FDA is ESSENTIAL and correctly implemented.

### Social Media Platform
**Q**: Why do we need it?  
**A**: Competition rules require NO real social media scraping. Our simulated platform:
- Provides realistic test data
- Demonstrates social pattern detection
- Shows we're not violating privacy/terms of service
- Allows controlled demonstration scenarios

---

## 🚀 Next Steps for Competition

1. **Test thoroughly**: Run `test_winning_solution.py`
2. **Prepare demo data**: Add more social posts to platform
3. **Record video**: 2-minute walkthrough
4. **Prepare pitch**: 10-minute presentation
5. **Document**: Ensure GitHub README is complete

---

**Built for GDC Dubai 2026**  
**Deadline**: February 1st, 2026 3pm  
**Team**: [Your Team Name]  
**Challenge**: Mashreq Bounty - AI for Social Signal Intelligence

---

## 📞 Support

For questions or issues:
1. Check `SOLUTION_ARCHITECTURE.md` for detailed docs
2. Run test script: `python test_winning_solution.py`
3. Verify all 3 servers running (8001, 8000, 5174)
