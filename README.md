# 🏦 SLM Desk - Social Signal Intelligence System

> **GDC Dubai 2026 Hackathon Solution**  
> **Challenge**: GBank Bounty - AI for Social Signal Intelligence in Banking  
> **Team**: SLM Desk

---

## 📋 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Architecture](#-architecture)
- [Responsible AI Framework](#-responsible-ai-framework)
- [How Each Problem is Solved](#-how-each-problem-is-solved)
- [Technical Stack](#-technical-stack)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [Demonstration Scenarios](#-demonstration-scenarios)
- [Compliance & Constraints](#-compliance--constraints)

---

## 🎯 Problem Statement

### Challenge: AI for Social Signal Intelligence in Banking

**Goal**: Detect, interpret, and responsibly respond to public social signals that may impact:
- Brand trust
- Customer experience
- Operational risk
- Financial stability

### Key Requirements
1. **Minimum 2 Scenarios**: Fraud rumors, sentiment shifts, service incidents, executive insights
2. **Responsible AI**: No automated actions, explainable decisions, human-in-the-loop
3. **No Real Data**: Synthetic/simulated social platform only
4. **Confidence Handling**: Uncertainty management at every step
5. **Audit Trail**: Full accountability and logging

### Bounty Constraints We Respect

#### ✅ Privacy & Ethics
- **NO real social media platforms** - We use a simulated social network
- **NO personal data** - Aggregated signals only, no individual profiling
- **NO individual tracking** - Population-level pattern analysis only
- **NO demographic biasing** - Fair treatment regardless of customer segment

#### ✅ Human Control
- **NO automated public responses** - All posts require human approval
- **NO automated account actions** - No blocking, suspending, or modifying accounts
- **NO autonomous decisions** - Human operator makes final call on every workflow
- **ALL actions logged** - Complete audit trail with timestamps and operator names

#### ✅ Transparency
- **Explainable AI** - Clear reasoning for every decision ("Why This Matters")
- **Confidence scores** - 0-100% with Low/Medium/High bands
- **Uncertainty indicators** - Data quality flags, context gaps, temporal uncertainty
- **Non-action boundaries** - Explicit list of what AI will NEVER do automatically

#### ✅ Accountability
- **Human-in-the-loop checkpoints** - Mandatory review before any action
- **Operator identification** - Every decision records who approved it
- **Full audit trail** - Timestamped logs of all workflows and decisions
- **Escalation framework** - Clear routing based on risk level

---

## 💡 Solution Overview

**Bank Sentinel** is a Responsible AI Multi-Agent System that monitors social media signals and provides explainable, human-supervised insights to banking operations teams.

### Core Principles
1. **Simulated Environment**: Custom social media platform (no real data scraping)
2. **Multi-Agent Architecture**: Three specialized agents working in sequence
3. **Human-Supervised**: All critical decisions require operator approval
4. **Explainable by Design**: Every analysis includes "Why This Matters"
5. **Risk-Based Routing**: CRITICAL/HIGH/MEDIUM/LOW escalation framework
6. **Real-Time Monitoring**: WebSocket streaming for live updates

### What Makes This Solution Stand Out
- ✅ **Complete multi-agent system** - Not just detection, but verification and briefing
- ✅ **Social pattern analysis** - Analyzes spread velocity, channel distribution, sentiment trajectory
- ✅ **Risk assessment framework** - Structured impact categories (brand, customer, operational, financial)
- ✅ **Explainability** - Clear narratives for why signals matter and what to do
- ✅ **No training data required** - Uses reasoning over simulated scenarios
- ✅ **Production-ready UI** - Operator dashboard with approval workflow

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│         SOCIAL MEDIA PLATFORM (Simulated - Port 8001)        │
│              FastAPI + SQLAlchemy + SQLite                   │
│                                                              │
│  Channels: Chirper, Photogram, Facespace, LinkedUp,         │
│            Threadit, Bank-Official                           │
│                                                              │
│  API Endpoints:                                             │
│  • GET  /api/sync         → Returns new posts/comments      │
│  • GET  /posts/           → List all posts                  │
│  • POST /posts/           → Create new post                 │
│  • GET  /comments/{id}    → Get post comments               │
│  • POST /comments/{id}    → Add comment                     │
│  • DELETE /api/reset/all  → Database reset                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                FDA (Front-line Detection Agent)              │
│               Python Script (fda_agent.py)                   │
│              Ollama LLM (llama3.2:latest)                    │
│                                                              │
│  RESPONSIBILITIES:                                          │
│  • Monitors social platform via /api/sync endpoint          │
│  • Detects signal patterns in posts/comments                │
│  • Classifies signal types:                                 │
│    - potential_scam_rumor                                   │
│    - service_outage_complaint                               │
│    - negative_sentiment_trend                               │
│    - positive_feedback                                      │
│  • Analyzes drivers and context                             │
│  • Recommends escalation (true/false)                       │
│                                                              │
│  OUTPUT:                                                    │
│  {                                                          │
│    "signal_type": "potential_scam_rumor",                   │
│    "confidence": 0.92,                                      │
│    "drivers": ["Phishing SMS", "Fake domain", "CVV theft"], │
│    "recommend_escalation": true                             │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│          IAA (Internal Analysis Agent) - SOCIAL FOCUS        │
│              Part of Bank Backend (iaa_agent.py)             │
│                Ollama LLM (llama3.2:latest)                  │
│                                                              │
│  RESPONSIBILITIES:                                          │
│  1. Social Signal Verification                              │
│     • Fetches MORE social posts (100+ from platform)        │
│     • NOT transaction data - purely social analysis         │
│                                                              │
│  2. Pattern Analysis                                        │
│     • Spread velocity (posts per hour)                      │
│     • Geographic/channel distribution                       │
│     • Account credibility patterns                          │
│     • Keyword clustering                                    │
│     • Sentiment trajectory over time                        │
│     • Similar past incidents                                │
│                                                              │
│  3. Risk Assessment Framework                               │
│     • Risk Level: CRITICAL / HIGH / MEDIUM / LOW            │
│     • Impact Categories:                                    │
│       - Brand Trust (reputation damage)                     │
│       - Customer Safety (fraud exposure)                    │
│       - Operational Continuity (service disruption)         │
│       - Financial Loss Potential (monetary risk)            │
│                                                              │
│  4. Explainability Generation                               │
│     • "Why This Matters" narrative                          │
│     • Potential consequences                                │
│     • Recommended actions                                   │
│     • Confidence + uncertainty indicators                   │
│                                                              │
│  5. Escalation Routing                                      │
│     • CRITICAL → Executive + Security + PR (15 min SLA)     │
│     • HIGH     → PR + Compliance (1 hour SLA)               │
│     • MEDIUM   → Standard workflow (4 hours SLA)            │
│     • LOW      → Monitor and log only                       │
│                                                              │
│  OUTPUT:                                                    │
│  {                                                          │
│    "risk_level": "CRITICAL",                                │
│    "impact": {                                              │
│      "brand_trust": "HIGH",                                 │
│      "customer_safety": "CRITICAL"                          │
│    },                                                       │
│    "why_matters": "Active phishing campaign...",            │
│    "consequences": ["Customer data theft", "..."],          │
│    "actions": ["Issue security alert", "..."],              │
│    "escalate_to": ["Security", "PR", "Executive"],          │
│    "urgency": "immediate",                                  │
│    "sla_minutes": 15                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              EBA (Executive Briefing Agent)                  │
│              Part of Bank Backend (eba_agent.py)             │
│                Ollama LLM (llama3.2:latest)                  │
│                                                              │
│  RESPONSIBILITIES:                                          │
│  • Generates executive-level briefings                      │
│  • Creates public response drafts (if needed)               │
│  • Summarizes key insights for leadership                   │
│  • Formats for non-technical stakeholders                   │
│  • Provides action recommendations                          │
│                                                              │
│  OUTPUT:                                                    │
│  {                                                          │
│    "executive_summary": "Phishing campaign detected...",    │
│    "recommended_response": "Dear customers, we are aware...",│
│    "key_points": ["50+ reports", "Fake SMS", "..."],        │
│    "recommended_channels": ["Twitter", "Website", "SMS"]    │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BANK BACKEND API (Port 8000)                    │
│              FastAPI + SQLAlchemy + WebSocket                │
│                                                              │
│  RESPONSIBILITIES:                                          │
│  • Orchestrates 3 agents (FDA → IAA → EBA)                  │
│  • Manages database (AgentWorkflow, Sentiment)              │
│  • Provides REST API for dashboard                          │
│  • Streams real-time updates via WebSocket                  │
│  • Handles approval/escalation/discard actions              │
│  • Maintains audit trail                                    │
│                                                              │
│  KEY ENDPOINTS:                                             │
│  • POST /api/sentiment/workflow → Trigger FDA analysis      │
│  • GET  /api/sentiment/pending  → Get awaiting approvals    │
│  • POST /api/sentiment/approve  → Approve response          │
│  • POST /api/sentiment/escalate → Escalate to team          │
│  • POST /api/sentiment/discard  → Mark as false positive    │
│  • GET  /api/sentiment/executive → Dashboard metrics        │
│  • WS   /ws                     → Real-time updates          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           OPERATOR DASHBOARD (Port 5173)                     │
│         React 18 + TypeScript + TailwindCSS                  │
│                                                              │
│  FEATURES:                                                  │
│  1. Authentication                                          │
│     • Login: bankop / bankop123                             │
│     • Session management                                    │
│                                                              │
│  2. Awaiting Approval Tab                                   │
│     • Real-time WebSocket updates (new signals)             │
│     • Risk-based color coding (CRITICAL/HIGH/MEDIUM/LOW)    │
│     • Confidence bands (High/Medium/Low)                    │
│     • Data quality indicators (Excellent/Good/Fair/Poor)    │
│     • Explainability sections:                              │
│       - "Why This Matters"                                  │
│       - Impact categories                                   │
│       - Recommended actions                                 │
│       - Uncertainty indicators                              │
│     • Action buttons:                                       │
│       - Approve & Post (with 5s countdown)                  │
│       - Escalate to Management                              │
│       - Escalate to Legal/Compliance                        │
│       - Flag for Investigation                              │
│       - Discard                                             │
│     • Responsible AI notice (expandable)                    │
│                                                              │
│  3. Executive Dashboard                                     │
│     • Top 5 concerns by risk level                          │
│     • Risk distribution chart (CRITICAL/HIGH/MEDIUM/LOW)    │
│     • Recent activity timeline                              │
│     • Key metrics summary                                   │
│                                                              │
│  4. Audit Trail                                             │
│     • Complete action history                               │
│     • Operator identification                               │
│     • Decision timestamps                                   │
│     • Full context preservation                             │
│                                                              │
│  5. Dark/Light Theme                                        │
│     • User preference toggle                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (End-to-End Example)

**Scenario**: Phishing SMS Campaign Detection

```
1. SOCIAL MEDIA ACTIVITY (T+0:00)
   Posts appear on platform:
   - "Beware! Got fake Mashreq SMS about rewards - SCAM!"
   - "Don't click mashreq-rewards-portal.com - phishing!"
   - "Lost 5000 AED to fake site. Be careful!"

2. FDA DETECTION (T+0:05)
   Agent monitors /api/sync, analyzes posts:
   → Detects pattern: "potential_scam_rumor"
   → Confidence: 0.92
   → Drivers: ["Phishing SMS", "Fake domain", "CVV theft"]
   → Sends to Bank Backend API

3. IAA VERIFICATION (T+0:10)
   Agent fetches 100+ social posts:
   → Velocity: 50 posts in 2 hours (high spread)
   → Channels: #ScamAlert, Twitter, Facebook
   → Credibility: Mix of verified + regular accounts
   → Keywords: "scam", "phishing", "fake", "SMS"
   → Sentiment: 95% negative, rapid escalation
   → Risk: CRITICAL
   → Impact: Brand Trust (HIGH) + Customer Safety (CRITICAL)
   → Why Matters: "Active fraud campaign targeting customers"
   → Actions: ["Issue security alert", "Public warning", "Report domains"]
   → Escalate to: [Security, PR, Executive]
   → SLA: 15 minutes

4. EBA BRIEFING (T+0:15)
   Agent generates executive briefing:
   → Summary: "Phishing campaign detected with 50+ reports"
   → Response: "Dear customers, we are aware of fraudulent SMS..."
   → Channels: ["Twitter", "Website", "SMS Broadcast"]
   → Key Points: ["Fake domain identified", "No customer data compromised"]

5. OPERATOR REVIEW (T+0:20)
   Dashboard shows pending approval:
   → Operator "John Smith" logs in
   → Reviews risk assessment (CRITICAL badge shown in red)
   → Reads "Why This Matters" explanation
   → Checks confidence: 92% (High)
   → Reviews recommended actions
   → Operator name required for accountability

6. HUMAN DECISION (T+0:25)
   Operator chooses: "Approve & Post"
   → 5-second countdown shown (allows cancel)
   → Countdown completes
   → Response published to social channels
   → Security team notified
   → Audit log created:
     * Action: "approved"
     * Operator: "John Smith"
     * Timestamp: 2025-01-15 14:25:03
     * Reasoning: "Confirmed phishing campaign, immediate response needed"

7. AUDIT TRAIL (T+0:26)
   Complete record saved:
   ✓ FDA detection logged
   ✓ IAA analysis preserved
   ✓ EBA briefing archived
   ✓ Operator decision recorded
   ✓ Full workflow traceable
```

---

## 🛡️ Responsible AI Framework

### 1. Confidence & Uncertainty Handling

#### Confidence Scoring
- **Range**: 0-100% based on signal strength
- **Visual Bands**:
  - 🟢 **High Confidence** (80-100%): Strong signal, multiple indicators
  - 🟡 **Medium Confidence** (60-80%): Moderate signal, some uncertainty
  - 🔴 **Low Confidence** (0-60%): Weak signal, high uncertainty

#### Uncertainty Indicators
- **Data Quality Flags**:
  - Limited sample size (< 10 posts)
  - Unverified sources
  - Incomplete context
- **Temporal Uncertainty**:
  - Emerging pattern (< 1 hour old)
  - Established pattern (> 24 hours)
- **Context Gaps**:
  - Missing geographic data
  - Unknown account credibility
  - Ambiguous language

#### Implementation
```typescript
// Frontend: AwaitingApproval.tsx
<ConfidenceBand score={workflow.confidence_score}>
  {score >= 80 && <Badge color="green">High Confidence</Badge>}
  {score >= 60 && score < 80 && <Badge color="yellow">Medium</Badge>}
  {score < 60 && <Badge color="red">Low Confidence</Badge>}
</ConfidenceBand>

// Tooltip: Explains what confidence means
"High: ≥80% - Strong signal with multiple indicators
 Medium: 60-79% - Moderate signal with some uncertainty
 Low: <60% - Weak signal or high uncertainty"
```

### 2. Non-Action Boundaries (What AI Will NEVER Do)

#### Prohibited Autonomous Actions
- ❌ **Post public responses** - All posts require human approval
- ❌ **Contact individuals** - No direct messaging to customers
- ❌ **Make financial decisions** - No account modifications or transactions
- ❌ **Modify customer data** - No profile or record changes
- ❌ **Block accounts** - No suspensions or restrictions
- ❌ **Escalate without review** - Even CRITICAL risks show to human first

#### Always Require Human Approval
- ✅ **Response publishing** - 5-second countdown with cancel option
- ✅ **Escalation routing** - Operator chooses team to notify
- ✅ **Risk validation** - Human confirms AI assessment
- ✅ **Action prioritization** - Operator decides what to do first

#### Implementation
```python
# Backend: sentiment_routes.py
@router.post("/approve")
async def approve_response(workflow_id: int, operator: str):
    # ALWAYS requires:
    # 1. Workflow ID (which signal to approve)
    # 2. Operator name (who is approving)
    # 3. Human-initiated request (no auto-approval)
    
    workflow = db.query(AgentWorkflow).filter_by(id=workflow_id).first()
    workflow.status = "approved"
    workflow.approved_by = operator  # Accountability
    workflow.approved_at = datetime.now()  # Audit trail
    
    # Log to audit trail
    audit_log.write({
        "action": "approved",
        "operator": operator,
        "workflow_id": workflow_id,
        "timestamp": datetime.now()
    })
```

### 3. Explainability Requirements

Every analysis includes these components:

#### "What" - Signal Description
```json
{
  "signal_type": "potential_scam_rumor",
  "detected_at": "2025-01-15T14:05:00Z",
  "source": "social_media_platform"
}
```

#### "Why" - Drivers and Context
```json
{
  "drivers": [
    "Phishing SMS mentioning fake rewards",
    "Fraudulent domain gbank-rewards-portal.com",
    "Multiple CVV disclosure reports"
  ],
  "context": {
    "volume": "50+ posts in 2 hours",
    "channels": ["#ScamAlert", "Twitter", "Facebook"],
    "sentiment": "95% negative"
  }
}
```

#### "Impact" - Why This Matters
```json
{
  "why_matters": "Active phishing campaign targeting customers with fake SMS messages. Fraudulent domain is actively collecting customer credentials and CVV codes.",
  "consequences": [
    "Customer financial data theft",
    "Brand reputation damage",
    "Regulatory compliance issues",
    "Customer trust erosion"
  ]
}
```

#### "Risk" - Level and Categories
```json
{
  "risk_level": "CRITICAL",
  "impact_categories": {
    "brand_trust": "HIGH",
    "customer_safety": "CRITICAL",
    "operational_continuity": "MEDIUM",
    "financial_loss": "HIGH"
  }
}
```

#### "Recommendation" - Suggested Actions
```json
{
  "actions": [
    "Issue immediate security alert on official channels",
    "Report fraudulent domain to hosting provider",
    "Notify affected customers via SMS",
    "Prepare public statement for media"
  ],
  "escalate_to": ["Security Team", "PR Team", "Executive Leadership"],
  "urgency": "immediate",
  "sla_minutes": 15
}
```

#### "Uncertainty" - What We Don't Know
```json
{
  "data_quality": "Good (75%)",
  "gaps": [
    "Exact number of affected customers unknown",
    "Domain registration details pending",
    "Full geographic spread unclear"
  ],
  "assumptions": [
    "Assuming SMS sender spoofed bank number",
    "Assuming campaign started < 24 hours ago"
  ]
}
```

### 4. Human Escalation Checkpoints

#### Automatic Alerts (No Action Taken)
- **CRITICAL Risk**: Dashboard notification + sound alert
- **HIGH Risk**: Dashboard badge (yellow)
- **MEDIUM Risk**: Dashboard entry (standard)
- **LOW Risk**: Logged only

#### Mandatory Review Points
1. **Before Response**: Human must approve draft
2. **Before Escalation**: Human chooses team/urgency
3. **Before Discard**: Human confirms false positive
4. **All Decisions**: Operator name required

#### Approval Workflow
```typescript
// Frontend: 5-second countdown for "Approve & Post"
const handleApprove = async () => {
  setIsApproving(true);
  setCountdown(5);
  
  // 5-second countdown allows operator to cancel
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        clearInterval(interval);
        // Only execute after countdown completes
        executeApproval();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  // Cancel button visible during countdown
  setCancelAvailable(true);
};

// Operator name REQUIRED
<Input 
  placeholder="Your name (required for audit trail)"
  value={operatorName}
  required
/>
```

### 5. Ethical Considerations

#### Privacy Protection
- **No Individual Profiling**: Only aggregate patterns analyzed
- **No Personal Data**: No names, emails, phone numbers stored
- **No Tracking**: No user behavior monitoring
- **Aggregation Only**: Population-level signals (e.g., "50 users reported", not "John Smith reported")

#### Fairness & Bias
- **No Demographic Biasing**: Equal treatment regardless of customer segment
- **No Sentiment Discrimination**: Negative feedback treated objectively
- **No Account Profiling**: No "high-risk customer" labels

#### Transparency
- **AI vs. Human Decisions**: Clear labels on who made what decision
- **Model Limitations**: Explicit uncertainty indicators
- **Data Sources**: All signals show source (social media platform)

#### Accountability
- **Full Audit Trail**: Every action logged with timestamp + operator
- **Reversible Decisions**: Can discard false positives retroactively
- **Operator Identification**: Every approval/escalation records who did it

---

## 🎯 How Each Problem is Solved

### Problem 1: Fraud or Scam Rumors

**Requirement**: Detect and respond to fraud-related social signals

#### Detection (FDA Agent)
```python
# fda_agent.py
keywords = ["scam", "phishing", "fraud", "fake", "theft"]
if any(kw in post.content.lower() for kw in keywords):
    signal_type = "potential_scam_rumor"
    confidence = 0.9  # High confidence due to clear fraud indicators
```

#### Verification (IAA Agent)
```python
# iaa_agent.py
posts = await fetch_social_posts(limit=100)
scam_posts = [p for p in posts if "scam" in p.content.lower()]

# Pattern analysis
velocity = len(scam_posts) / hours_elapsed  # Posts per hour
if velocity > 10:  # High spread velocity
    risk_level = "CRITICAL"
    
impact = {
    "brand_trust": "HIGH",  # Reputation damage
    "customer_safety": "CRITICAL"  # Financial loss risk
}

# Explainability
why_matters = f"Active fraud campaign with {len(scam_posts)} reports in {hours_elapsed} hours"
actions = [
    "Issue immediate security alert",
    "Report fraudulent domains",
    "Notify affected customers"
]
```

#### Human Decision
- Operator reviews risk assessment (CRITICAL)
- Reads "Why This Matters" explanation
- Approves security alert + public warning
- Audit trail logs decision

**Result**: Fraud campaign detected and neutralized within 30 minutes

---

### Problem 2: Brand Sentiment Shift

**Requirement**: Monitor sentiment trends and detect negative shifts

#### Detection (FDA Agent)
```python
# fda_agent.py
sentiment_scores = [analyze_sentiment(post) for post in recent_posts]
avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)

if avg_sentiment < 0.5 and previous_avg > 0.7:
    signal_type = "negative_sentiment_trend"
    confidence = 0.85
    drivers = ["App crashes", "Login failures", "Service disruption"]
```

#### Verification (IAA Agent)
```python
# iaa_agent.py
posts = await fetch_social_posts(limit=100)

# Trend analysis
timeline = group_posts_by_hour(posts)
sentiment_trajectory = [calc_sentiment(hour) for hour in timeline]

# Driver identification
keywords = extract_keywords(posts)  # ["crash", "broken", "down"]
channels = [p.channel for p in posts]  # ["Twitter", "Facebook"]

# Risk assessment
if sentiment_drop > 30% and keywords in ["crash", "down"]:
    risk_level = "HIGH"
    impact = {
        "brand_trust": "MEDIUM",
        "customer_experience": "HIGH"
    }
    
    # Explainability
    why_matters = "App quality perception declining rapidly due to crash reports"
    actions = ["PR acknowledgment", "IT escalation", "Status update"]
```

#### Human Decision
- Operator sees HIGH risk badge (yellow)
- Reviews sentiment drop: 70% → 40% (30% decline)
- Checks drivers: App crashes (200+ mentions)
- Escalates to IT + PR teams
- Audit trail preserved

**Result**: Service issue acknowledged publicly, IT team notified, sentiment recovered

---

### Problem 3: Service or Incident Signals

**Requirement**: Detect service outages and operational issues

#### Detection (FDA Agent)
```python
# fda_agent.py
outage_keywords = ["down", "not working", "broken", "outage", "offline"]
if any(kw in post.content.lower() for kw in outage_keywords):
    signal_type = "service_outage_complaint"
    confidence = 0.88
    drivers = ["ATM network", "Multiple locations", "Customer frustration"]
```

#### Verification (IAA Agent)
```python
# iaa_agent.py
posts = await fetch_social_posts(limit=100)
outage_posts = [p for p in posts if "ATM" in p.content and "down" in p.content]

# Geographic analysis
locations = extract_locations(outage_posts)  # ["Dubai", "Abu Dhabi", "Sharjah"]
if len(locations) >= 3:  # Multi-location impact
    risk_level = "HIGH"
    
# Velocity check
posts_per_hour = len(outage_posts) / hours
if posts_per_hour > 20:  # Rapid spread
    urgency = "immediate"
    
# Impact assessment
impact = {
    "operational_continuity": "HIGH",
    "customer_experience": "HIGH",
    "brand_trust": "MEDIUM"
}

# Explainability
why_matters = "Service disruption affecting 3+ cities with 30+ complaints in 30 minutes"
actions = [
    "Post service status update",
    "Alert operations team",
    "Investigate ATM network"
]
```

#### Human Decision
- Operator reviews HIGH risk (operational impact)
- Sees geographic spread: 3 cities affected
- Checks velocity: 30 posts in 30 minutes (high urgency)
- Escalates to Operations + posts status update
- Audit trail created

**Result**: IT team investigates, status update published, customer frustration addressed

---

### Problem 4: Executive Insight Briefing

**Requirement**: Provide leadership with aggregated signal summaries

#### EBA Agent
```python
# eba_agent.py
async def generate_executive_briefing(workflows):
    # Aggregate signals
    critical_count = len([w for w in workflows if w.risk_level == "CRITICAL"])
    high_count = len([w for w in workflows if w.risk_level == "HIGH"])
    
    # Top 5 concerns
    top_concerns = sorted(workflows, key=lambda w: risk_priority(w.risk_level))[:5]
    
    # Trend analysis
    trends = {
        "24h": analyze_period(workflows, hours=24),
        "7d": analyze_period(workflows, days=7),
        "30d": analyze_period(workflows, days=30)
    }
    
    # Risk heatmap
    heatmap = {
        "fraud": count_by_type(workflows, "scam"),
        "sentiment": count_by_type(workflows, "sentiment"),
        "service": count_by_type(workflows, "outage")
    }
    
    return {
        "executive_summary": f"{critical_count} critical and {high_count} high-risk signals detected",
        "top_5_concerns": top_concerns,
        "trends": trends,
        "risk_heatmap": heatmap,
        "recommended_actions": ["Review critical signals", "Approve pending responses"]
    }
```

#### Dashboard Visualization
```typescript
// ExecutiveDashboard.tsx
<div className="grid gap-6">
  {/* Top Concerns */}
  <section>
    <h2>Top 5 Concerns</h2>
    {concerns.map(concern => (
      <ConcernCard 
        title={concern.signal_type}
        risk={concern.risk_level}
        impact={concern.impact}
        confidence={concern.confidence}
      />
    ))}
  </section>
  
  {/* Risk Distribution */}
  <section>
    <h2>Risk Distribution</h2>
    <BarChart data={[
      { level: "CRITICAL", count: 2 },
      { level: "HIGH", count: 5 },
      { level: "MEDIUM", count: 12 }
    ]} />
  </section>
  
  {/* Recent Activity */}
  <section>
    <h2>Recent Activity (24h)</h2>
    <Timeline events={recentWorkflows} />
  </section>
</div>
```

**Result**: Executives see real-time dashboard with prioritized concerns

---

## 🛠️ Technical Stack

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: SQLAlchemy + SQLite
- **LLM**: Ollama (llama3.2:latest) - local deployment
- **WebSocket**: FastAPI WebSocket for real-time updates
- **HTTP Client**: httpx for async API calls

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (@tanstack/react-query)
- **Icons**: Lucide React
- **Routing**: React Router v6

### Infrastructure
- **Social Media Backend**: FastAPI (Port 8001)
- **Bank Backend**: FastAPI (Port 8000)
- **Bank Frontend**: Vite Dev Server (Port 5173)
- **Social Media Frontend**: HTTP Server (Port 5174)
- **FDA Agent**: Python script (standalone)

### Development Tools
- **Python Package Manager**: pip + virtual environment
- **Node Package Manager**: npm
- **Version Control**: Git
- **Database**: SQLite (local files)

---

## 📦 Installation & Setup

### Prerequisites
1. **Python 3.11+** (for backend and agents)
2. **Node.js 18+** (for frontend)
3. **Ollama** (for LLM inference)
4. **Git** (for cloning repository)

### Step 1: Install Ollama
```bash
# Download from https://ollama.ai
# Pull required model
ollama pull llama3.2:latest
```

### Step 2: Clone Repository
```bash
git clone https://github.com/your-org/slm-desk.git
cd slm-desk
```

### Step 3: Setup Social Media Backend
```bash
cd social_media/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py  # Runs on http://localhost:8001
```

### Step 4: Setup Social Media Frontend
```bash
cd social_media/frontend
npm install
python -m http.server 5174 --bind 0.0.0.0  # Runs on http://localhost:5174
```

### Step 5: Setup Bank Backend
```bash
cd bank_website/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000  # Runs on http://localhost:8000
```

### Step 6: Setup Bank Frontend
```bash
cd bank_website/frontend
npm install
npm run dev -- --host 0.0.0.0  # Runs on http://localhost:5173
```

### Step 7: Run FDA Agent
```bash
cd fda_agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python fda_agent.py  # Monitors social media platform
```

### Quick Start (All-in-One Script)

**Windows (Batch)**:
```cmd
start.bat
```

**PowerShell**:
```powershell
.\bank_website\start.ps1
```

### Network Access (For Demo on Other Devices)
The start script automatically detects your local IP. Access from other devices on your network:
- **Bank Dashboard**: `http://<YOUR_IP>:5173`
- **Social Media Frontend**: `http://<YOUR_IP>:5174`
- **Bank Backend API**: `http://<YOUR_IP>:8000`
- **Social Media API**: `http://<YOUR_IP>:8001`

---

## 🚀 Usage

### 1. Generate Test Data
```bash
cd fda_agent
python generate_posts.py --count 50
```

This creates 50 synthetic social media posts across channels:
- **Chirper** (Twitter-like)
- **Photogram** (Instagram-like)
- **Facespace** (Facebook-like)
- **LinkedUp** (LinkedIn-like)
- **Threadit** (Reddit-like)
- **Bank-Official** (Bank's official channel)

### 2. Start FDA Agent
```bash
python fda_agent.py
```

FDA agent will:
- Monitor social media platform every 30 seconds
- Detect signal patterns in new posts
- Send analysis to Bank Backend API

### 3. Access Operator Dashboard
1. Open browser: `http://localhost:5173`
2. Login:
   - **Username**: `bankop`
   - **Password**: `bankop123`
3. Navigate to "Awaiting Approval" tab
4. Review pending signals

### 4. Approve/Escalate Workflows
For each signal:
1. **Review Risk Level**: CRITICAL (red) / HIGH (yellow) / MEDIUM (blue) / LOW (green)
2. **Check Confidence**: Score + band (High/Medium/Low)
3. **Read "Why This Matters"**: Explainability section
4. **Review Impact**: Brand, Customer, Operational, Financial
5. **Choose Action**:
   - **Approve & Post**: Publish response (5-second countdown)
   - **Escalate to Management**: Send to senior team
   - **Escalate to Legal/Compliance**: Compliance review
   - **Flag for Investigation**: Deeper analysis
   - **Discard**: Mark as false positive

### 5. View Executive Dashboard
1. Navigate to "Executive Dashboard" tab
2. See:
   - **Top 5 Concerns**: Highest priority signals
   - **Risk Distribution**: CRITICAL/HIGH/MEDIUM/LOW counts
   - **Recent Activity**: Timeline of workflows

### 6. Audit Trail
1. Navigate to "Audit Trail" tab
2. Filter by:
   - Date range
   - Operator name
   - Action type (approved/escalated/discarded)
3. Export to CSV for compliance

---

## 🎬 Demonstration Scenarios

### Demo Scenario 1: Phishing Campaign (CRITICAL)

**Setup**:
```bash
# Generate fraud-related posts
cd fda_agent
python generate_posts.py --type fraud --count 25
```

**Expected Flow**:
1. **T+0:00**: 25 posts appear mentioning "scam", "phishing", "fake SMS"
2. **T+0:30**: FDA agent detects pattern → `signal_type: potential_scam_rumor`
3. **T+1:00**: IAA verifies:
   - Velocity: 25 posts in 1 hour (high spread)
   - Channels: Chirper, Facespace (#ScamAlert)
   - Risk: **CRITICAL**
   - Impact: Brand Trust (HIGH) + Customer Safety (CRITICAL)
4. **T+1:30**: Workflow appears on dashboard with **RED** badge
5. **Operator Action**: Reviews "Why This Matters", approves security alert
6. **T+2:00**: Response published, security team notified, audit logged

**Demo Points**:
- ✅ Multi-agent collaboration (FDA → IAA → EBA)
- ✅ Risk assessment (CRITICAL level)
- ✅ Explainability ("Active phishing campaign...")
- ✅ Human-in-the-loop (approval required)
- ✅ Audit trail (operator name + timestamp)

---

### Demo Scenario 2: App Crash Sentiment Shift (HIGH)

**Setup**:
```bash
# Generate service complaint posts
cd fda_agent
python generate_posts.py --type service --count 30
```

**Expected Flow**:
1. **T+0:00**: 30 posts about "app crash", "can't login", "broken"
2. **T+0:30**: FDA detects sentiment drop: 70% → 40% negative
3. **T+1:00**: IAA analyzes:
   - Keywords: "crash", "login", "broken"
   - Timeline: Started 6 hours ago
   - Volume: 30 mentions
   - Risk: **HIGH**
   - Impact: Brand Trust (MEDIUM) + Customer Experience (HIGH)
4. **T+1:30**: Workflow on dashboard with **YELLOW** badge
5. **Operator Action**: Escalates to IT + PR teams
6. **T+2:00**: Status update drafted, IT investigates

**Demo Points**:
- ✅ Sentiment trend analysis
- ✅ Driver identification (app quality issues)
- ✅ Escalation routing (IT + PR)
- ✅ SLA assignment (1 hour)

---

### Demo Scenario 3: ATM Outage (HIGH)

**Setup**:
```bash
# Generate outage posts
cd fda_agent
python generate_posts.py --type outage --count 20
```

**Expected Flow**:
1. **T+0:00**: 20 posts about "ATM down", "not working"
2. **T+0:30**: FDA detects service outage pattern
3. **T+1:00**: IAA verifies:
   - Geographic: Dubai, Abu Dhabi, Sharjah (3 cities)
   - Velocity: 20 posts in 30 minutes
   - Risk: **HIGH**
   - Impact: Operational (HIGH) + Customer Experience (HIGH)
4. **T+1:30**: Dashboard shows HIGH risk workflow
5. **Operator Action**: Posts service status + alerts Operations
6. **T+2:00**: IT team investigates ATM network

**Demo Points**:
- ✅ Geographic distribution analysis
- ✅ Operational impact assessment
- ✅ Multi-team escalation
- ✅ Public communication (status update)

---

### Demo Scenario 4: Executive Briefing

**Setup**:
```bash
# Generate mixed signals
cd fda_agent
python generate_posts.py --type mixed --count 100
```

**Expected Flow**:
1. **T+0:00**: 100 posts with mixed signals (fraud, sentiment, service)
2. **T+5:00**: Multiple workflows processed by agents
3. **Dashboard View**:
   - Top 5 Concerns: 2 CRITICAL + 3 HIGH shown
   - Risk Distribution: 2 CRITICAL, 5 HIGH, 12 MEDIUM, 8 LOW
   - Recent Activity: Timeline of last 24 hours
   - Recommended Actions: "Review 2 critical signals immediately"

**Demo Points**:
- ✅ Aggregated view for executives
- ✅ Risk prioritization
- ✅ Trend visualization
- ✅ Actionable insights

---

## ✅ Compliance & Constraints

### What We Do NOT Do (Bounty Constraints)

#### ❌ No Real Social Media
- **Not Used**: Twitter API, Facebook Graph API, Instagram scraping
- **Instead**: Custom simulated social platform (FastAPI + SQLite)
- **Why**: Privacy, ethics, terms of service compliance

#### ❌ No Personal Data
- **Not Collected**: Names, emails, phone numbers, IP addresses
- **Instead**: Aggregated signals only (e.g., "50 users", not "John Smith")
- **Why**: Privacy protection, GDPR/data protection compliance

#### ❌ No Individual Profiling
- **Not Done**: Tracking individual users, building user profiles
- **Instead**: Population-level pattern analysis (e.g., "sentiment drop in Dubai")
- **Why**: Ethical AI, no discrimination or bias

#### ❌ No Automated Actions
- **Not Automated**: Posting responses, contacting customers, blocking accounts
- **Instead**: All actions require human approval with operator name
- **Why**: Human accountability, responsible AI

### What We DO (Solution Features)

#### ✅ Simulated Social Platform
- **Custom Platform**: FastAPI backend with SQLite database
- **Synthetic Data**: Team-created posts, no real user data
- **Controlled Environment**: Full visibility into data sources

#### ✅ Multi-Agent Architecture
- **FDA**: Front-line detection from social patterns
- **IAA**: Internal analysis of social spread (NOT transactions)
- **EBA**: Executive briefing generation

#### ✅ Explainable AI
- **Every Analysis**: "Why This Matters" narrative
- **Clear Drivers**: What triggered the signal
- **Impact Assessment**: Why it's important
- **Recommended Actions**: What to do next

#### ✅ Human-in-the-Loop
- **Approval Workflow**: 5-second countdown with cancel
- **Operator Identification**: Name required for accountability
- **Escalation Routing**: Human chooses team/urgency
- **Audit Trail**: Full history of decisions

#### ✅ Confidence Scoring
- **0-100% Range**: Based on signal strength
- **Visual Bands**: High (green) / Medium (yellow) / Low (red)
- **Uncertainty Indicators**: Data quality, context gaps, assumptions

#### ✅ Risk Framework
- **4 Levels**: CRITICAL / HIGH / MEDIUM / LOW
- **4 Impact Categories**: Brand Trust, Customer Safety, Operational, Financial
- **Color Coding**: Red / Yellow / Blue / Green for quick recognition

### Compliance Checklist

- ✅ **No live social media platforms used**
- ✅ **No real posts or feeds scraped**
- ✅ **No personal data or PII collected**
- ✅ **No individual profiling or tracking**
- ✅ **No automated public responses**
- ✅ **Synthetic/team-created data only**
- ✅ **Aggregated signals only**
- ✅ **Human-in-the-loop controls**
- ✅ **Clear confidence scoring**
- ✅ **Explicit non-action boundaries**
- ✅ **Human approval checkpoints**
- ✅ **Explainability & auditability**
- ✅ **Ethical risk considerations**
- ✅ **Full audit trail with timestamps**
- ✅ **Operator accountability**

---

## 🏆 Competitive Advantages

1. **Complete Multi-Agent System**: Not just detection, but verification (IAA) + briefing (EBA)
2. **Social Pattern Analysis**: Analyzes spread velocity, channel distribution, sentiment trajectory
3. **Risk Assessment Framework**: Structured CRITICAL/HIGH/MEDIUM/LOW with 4 impact categories
4. **Explainability by Design**: Every decision has "Why This Matters" narrative
5. **Real-Time WebSocket**: Live streaming updates to dashboard
6. **Production-Ready UI**: Professional React dashboard with approval workflow
7. **Audit Trail**: Full compliance with operator names and timestamps
8. **No Training Required**: Uses reasoning over simulated scenarios (no ML training)
9. **Network-Accessible**: Deploy on local network for team access

---

## 📞 Support & Contact

**Built for GDC Dubai 2026 Hackathon**  
**Challenge**: GBank Bounty - AI for Social Signal Intelligence  
**Repository**: https://github.com/your-org/slm-desk

---

## 📄 License

This project was created for the GDC Dubai 2026 Hackathon and is subject to the competition's terms and conditions.

---

**Last Updated**: January 15, 2025  
**Version**: 1.0.0  
**Status**: Production-Ready for Demo
