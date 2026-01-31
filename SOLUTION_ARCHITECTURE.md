# 🏦 Bank Sentinel - Social Signal Intelligence System

## 📋 Problem Statement Alignment

**Challenge**: AI for Social Signal Intelligence in Banking  
**Goal**: Detect, interpret, and responsibly respond to public social signals that may impact brand trust, customer experience, or operational risk.

---

## 🎯 Solution Overview

Bank Sentinel is a **Responsible AI Multi-Agent System** that monitors social media signals and provides explainable, human-supervised insights to banking operations teams.

### Core Principles ✓
- ✅ **No Real Social Media**: Uses synthetic/simulated social platform
- ✅ **No Personal Data**: Aggregated signals only, no individual profiling
- ✅ **Human-in-the-Loop**: All actions require operator approval
- ✅ **Explainable AI**: Clear reasoning for every decision
- ✅ **Confidence Scoring**: Uncertainty handling at every step
- ✅ **No Automated Actions**: System provides recommendations, humans decide

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SOCIAL MEDIA PLATFORM (Port 8001)               │
│              (Simulated - No Real Data Used)                 │
│  API Endpoints:                                             │
│  - GET /api/sync     → Returns new posts/comments           │
│  - GET /posts/       → List all posts                       │
│  - POST /posts/      → Create new post                      │
│  - GET /comments/{post_id}  → Get post comments             │
│  - POST /comments/{post_id} → Add comment                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  FDA (Front-line Detection Agent)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Monitors social media platform (/api/sync)           │ │
│  │ • Detects signal patterns (fraud, sentiment, service)  │ │
│  │ • Analyzes drivers and context                         │ │
│  │ • Outputs: Signal Type + Confidence + Drivers          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          IAA (Internal Analysis Agent) - REDESIGNED          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ SOCIAL SIGNAL VERIFICATION & ANALYSIS                  │ │
│  │                                                         │ │
│  │ 1. Fetches MORE social posts from platform             │ │
│  │ 2. Analyzes patterns:                                  │ │
│  │    • Spread velocity (posts per hour)                  │ │
│  │    • Geographic/channel distribution                   │ │
│  │    • Account credibility patterns                      │ │
│  │    • Keyword clustering & sentiment trajectory         │ │
│  │    • Similar past incidents                            │ │
│  │                                                         │ │
│  │ 3. Risk Assessment Framework:                          │ │
│  │    • Risk Level: CRITICAL/HIGH/MEDIUM/LOW              │ │
│  │    • Impact Categories:                                │ │
│  │      - Brand Trust                                     │ │
│  │      - Customer Safety                                 │ │
│  │      - Operational Continuity                          │ │
│  │      - Financial Loss Potential                        │ │
│  │                                                         │ │
│  │ 4. Explainability Output:                              │ │
│  │    • "Why This Matters" narrative                      │ │
│  │    • Potential consequences                            │ │
│  │    • Recommended actions                               │ │
│  │    • Confidence + Uncertainty indicators               │ │
│  │                                                         │ │
│  │ 5. Escalation Routing:                                 │ │
│  │    • CRITICAL → Immediate executive briefing           │ │
│  │    • HIGH → PR team + compliance review                │ │
│  │    • MEDIUM → Standard response workflow               │ │
│  │    • LOW → Monitor and log                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EBA (Executive Briefing Agent)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Generates leadership briefings                       │ │
│  │ • Creates public response drafts (if needed)           │ │
│  │ • Summarizes key insights                              │ │
│  │ • Formats for executive consumption                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              HUMAN OPERATOR DASHBOARD                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ APPROVAL WORKFLOW:                                     │ │
│  │ • Review IAA Analysis                                  │ │
│  │ • Understand "Why This Matters"                        │ │
│  │ • Check Risk Level & Impact                            │ │
│  │ • See Recommended Actions                              │ │
│  │                                                         │ │
│  │ DECISION OPTIONS:                                      │ │
│  │ 1. Approve & Post Response                             │ │
│  │ 2. Escalate to Management                              │ │
│  │ 3. Escalate to Legal/Compliance                        │ │
│  │ 4. Flag for Investigation                              │ │
│  │ 5. Discard (False Positive)                            │ │
│  │                                                         │ │
│  │ AUDIT TRAIL:                                           │ │
│  │ • All decisions logged with timestamp                  │ │
│  │ • Operator name recorded                               │ │
│  │ • Full context preserved                               │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Covered Scenarios (Requirement: Minimum 2)

### ✅ 1. Fraud or Scam Rumors
**Example**: Phishing SMS campaign impersonating bank

**Flow**:
1. FDA detects spike in posts mentioning "scam", "phishing", "fake SMS"
2. IAA verifies by analyzing:
   - Volume: 50+ posts in 2 hours
   - Spread: Multiple channels (#ScamAlert, #BankingSecurity)
   - Credibility: Mix of verified and regular accounts
   - Pattern: Similar phishing URLs mentioned
3. Risk Assessment:
   - **Level**: CRITICAL
   - **Impact**: Brand Trust (HIGH) + Customer Safety (CRITICAL)
   - **Why**: Active fraud campaign targeting customers
4. Recommendation: Immediate security team escalation + public warning
5. Human operator approves response

### ✅ 2. Brand Sentiment Shift
**Example**: Mobile app crashes causing negative sentiment

**Flow**:
1. FDA detects sentiment drop from 70% positive to 40% negative
2. IAA analyzes social patterns:
   - Driver: App-related complaints spike
   - Keywords: "crashes", "can't login", "broken"
   - Timeline: Started 6 hours ago
   - Volume: 200+ mentions
3. Risk Assessment:
   - **Level**: HIGH
   - **Impact**: Brand Trust (MEDIUM) + Customer Experience (HIGH)
   - **Why**: Service quality perception declining rapidly
4. Recommendation: PR acknowledgment + IT escalation
5. Human operator reviews and approves

### ✅ 3. Service or Incident Signals
**Example**: ATM network outage

**Flow**:
1. FDA detects "ATM down" mentions clustering
2. IAA verifies:
   - Geographic: 3 cities affected
   - Velocity: 30 posts in 30 minutes
   - Channels: Twitter, Facebook, Instagram
   - Sentiment: Frustration + confusion
3. Risk Assessment:
   - **Level**: HIGH
   - **Impact**: Operational (HIGH) + Customer Experience (HIGH)
   - **Why**: Service disruption affecting multiple locations
4. Recommendation: Service status update + operations alert
5. Human operator escalates to IT operations

### ✅ 4. Executive Insight Briefing
**Dashboard Feature**: Aggregated signal summary

**Components**:
- Top 5 signals by risk level
- Trend analysis (24h, 7d, 30d)
- Risk heatmap by category
- Recommended actions summary
- Confidence distribution chart

---

## 🛡️ Responsible AI Framework

### 1. Confidence & Uncertainty Handling
- **Confidence Score**: 0-100% based on signal strength
- **Uncertainty Indicators**:
  - Data quality flags (limited sample, unverified sources)
  - Temporal uncertainty (emerging vs. established pattern)
  - Context gaps (missing information)
- **Confidence Bands**: Low (<60%), Medium (60-80%), High (>80%)

### 2. Non-Action Boundaries
**NEVER AUTOMATICALLY**:
- ❌ Post public responses
- ❌ Contact individuals
- ❌ Make financial decisions
- ❌ Modify customer data
- ❌ Block accounts

**ALWAYS REQUIRE HUMAN**:
- ✅ Response approval
- ✅ Escalation decisions
- ✅ Risk assessment validation
- ✅ Action prioritization

### 3. Explainability Requirements
Every analysis includes:
- **What**: Signal description
- **Why**: Drivers and context
- **Impact**: "Why This Matters" explanation
- **Risk**: Level + categories
- **Recommendation**: Suggested action with reasoning
- **Uncertainty**: What we don't know

### 4. Human Escalation Checkpoints
- **Automatic**: CRITICAL risk triggers immediate alert
- **Standard**: All signals require operator review
- **Audit**: Every decision logged with reasoning

### 5. Ethical Considerations
- **Privacy**: No individual profiling or tracking
- **Aggregation**: Population-level signals only
- **Transparency**: Clear AI vs. human decisions
- **Accountability**: Full audit trail
- **Fairness**: No demographic biasing

---

## 🔍 Data Flow Example

### Fraud Rumor Detection (End-to-End)

**T+0:00 - Social Media Activity**
```json
{
  "posts": [
    "Beware! Got fake Mashreq SMS about rewards expiry - SCAM!",
    "Don't click mashreq-rewards-portal-update.com - it's phishing!",
    "Lost 5000 AED to fake Mashreq site. Be careful!"
  ]
}
```

**T+0:05 - FDA Detection**
```json
{
  "signal_type": "potential_scam_rumor",
  "confidence": 0.98,
  "drivers": [
    "Phishing SMS with fake domain",
    "Rapid spread across #ScamAlert",
    "Multiple CVV disclosure reports"
  ],
  "recommend_escalation": true
}
```

**T+0:10 - IAA Analysis**
```json
{
  "verification": {
    "posts_analyzed": 47,
    "spread_velocity": "23 posts/hour",
    "channels": ["Twitter", "Facebook", "#ScamAlert"],
    "credibility": "High (verified accounts + regular users)",
    "similar_incidents": "Yes - 3 months ago"
  },
  "risk_assessment": {
    "level": "CRITICAL",
    "impact": {
      "brand_trust": "HIGH",
      "customer_safety": "CRITICAL",
      "financial_loss": "MEDIUM"
    }
  },
  "explainability": {
    "why_matters": "Active fraud campaign targeting customers with convincing phishing site. Immediate action needed to prevent financial losses and brand damage.",
    "potential_consequences": [
      "Customers lose money to phishing",
      "Brand reputation damage",
      "Regulatory scrutiny"
    ]
  },
  "recommendation": {
    "action": "ESCALATE_IMMEDIATE",
    "recipients": ["Security Team", "PR Team", "Executive"],
    "suggested_response": "Public fraud warning + SMS alert to customers"
  },
  "confidence": 0.98,
  "uncertainty": "Domain temporarily down but was active during peak"
}
```

**T+0:15 - EBA Briefing**
```markdown
## CRITICAL ALERT: Active Phishing Campaign

**Risk Level**: CRITICAL  
**Confidence**: 98%

### Situation
Active phishing campaign using fake "Mashreq Rewards" SMS with domain mashreq-rewards-portal-update.com. 47 social media posts in last 2 hours reporting scam.

### Why This Matters
- Customers actively losing money (confirmed reports)
- Convincing fake site with exact branding
- Viral spread (#ScamAlert trending)
- Brand trust at risk

### Recommended Actions
1. Immediate security team notification
2. Public fraud warning on official channels
3. SMS alert to customer base
4. Coordinate with authorities on domain takedown

### Timeline
- First detected: 2 hours ago
- Current velocity: 23 posts/hour
- Similar incident: 3 months ago (resolved)
```

**T+0:20 - Human Operator Decision**
```json
{
  "decision": "APPROVE_ESCALATE",
  "operator": "bankop",
  "actions": [
    "Escalated to Security Team",
    "Approved public warning post",
    "Flagged for executive briefing"
  ],
  "timestamp": "2026-01-31T19:50:00Z"
}
```

---

## 📈 Technical Implementation

### Technology Stack
- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Python FastAPI + SQLAlchemy
- **AI**: OpenAI/Ollama LLMs for analysis
- **Database**: SQLite (demo) / PostgreSQL (production)
- **WebSocket**: Real-time updates to dashboard

### Key Components
1. **Social Media Platform**: Simulated social network with posts/comments
2. **FDA Agent**: Pattern detection from social feed
3. **IAA Agent**: Social signal verification & risk assessment
4. **EBA Agent**: Executive briefing generation
5. **Operator Dashboard**: Human approval interface with audit trail

### Security & Privacy
- ✅ No real social media data
- ✅ No PII collection
- ✅ Synthetic data only
- ✅ Local processing (no external data sharing)
- ✅ Audit logs for compliance

---

## 🎯 Judging Criteria Alignment

### ✅ Relevance to Banking & Brand Trust
- Fraud rumor detection protects customers
- Sentiment monitoring preserves brand reputation
- Service incident response maintains trust

### ✅ Quality of Signal Interpretation
- Multi-dimensional risk assessment
- Pattern analysis (velocity, spread, credibility)
- Historical context integration

### ✅ Explainability & Transparency
- "Why This Matters" for every signal
- Clear confidence scores
- Uncertainty indicators
- Decision audit trail

### ✅ Responsible AI & Governance
- Human-in-the-loop mandatory
- No automated actions
- Ethical boundaries enforced
- Full auditability

### ✅ Usability & Clarity
- Clean dashboard interface
- Real-time WebSocket updates
- Risk-based color coding
- Executive summary format

---

## 🏆 Competitive Advantages

1. **Complete Multi-Agent Architecture**: Not just detection, but verification + briefing
2. **Risk Framework**: Structured CRITICAL/HIGH/MEDIUM/LOW with impact categories
3. **Explainable by Design**: Every decision has reasoning
4. **Real-Time System**: WebSocket streaming for live monitoring
5. **Audit Trail**: Full compliance readiness
6. **Escalation Workflow**: Smart routing based on risk
7. **No Training Required**: Uses simulated data, focuses on reasoning

---

## 📝 Demonstration Scenarios

### Demo 1: Fraud Rumor (Live)
1. Social media posts about phishing SMS
2. FDA detects scam pattern
3. IAA verifies with social analysis
4. Risk: CRITICAL
5. Operator approves security escalation
6. Public warning drafted

### Demo 2: Sentiment Shift (Live)
1. App crash complaints spike
2. FDA detects negative sentiment trend
3. IAA analyzes volume + timeline
4. Risk: HIGH
5. Operator escalates to IT + PR

### Demo 3: Executive Briefing (Dashboard)
1. Shows aggregated signals
2. Risk heatmap visualization
3. Top 5 priorities
4. Recommended actions

---

## 🎬 Submission Deliverables

### GitHub Repository
- ✅ Complete source code
- ✅ This architecture document
- ✅ Setup instructions
- ✅ Demo data + scripts

### 2-Minute Video
1. Problem overview (15s)
2. Architecture walkthrough (30s)
3. Live demo: Fraud detection flow (45s)
4. Responsible AI features (30s)

### Live Pitch (10 min)
1. Problem alignment (2 min)
2. Architecture + agents (3 min)
3. Live demo scenarios (3 min)
4. Responsible AI framework (2 min)

---

## ✅ Compliance Checklist

- ✅ No live social media platforms used
- ✅ No real posts or feeds scraped
- ✅ No personal data or PII
- ✅ No individual profiling
- ✅ No automated public responses
- ✅ Synthetic/team-created data only
- ✅ Aggregated signals only
- ✅ Human-in-the-loop controls
- ✅ Clear confidence scoring
- ✅ Explicit non-action boundaries
- ✅ Human approval checkpoints
- ✅ Explainability & auditability
- ✅ Ethical risk considerations

---

**Built for GDC Dubai 2026 Hackathon**  
**Team**: [Your Team Name]  
**Challenge**: Mashreq Bounty - AI for Social Signal Intelligence
