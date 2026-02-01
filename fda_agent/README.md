# FDA Agent - Fraud Detection & Analysis

Standalone agent that monitors social media for security threats and sends signals to Bank Sentinel.

## Features

- 🔍 **Continuous Monitoring**: Polls social media every 30 seconds for new posts
- 🤖 **LLM-Powered Analysis**: Uses Ollama to detect threats intelligently
- 📊 **Confidence Scoring**: Provides 0-100% confidence for each detection
- 🎯 **Threat Detection**: Identifies phishing, fraud, brand impersonation, social engineering
- 📤 **Auto-Reporting**: Sends signals to Bank Sentinel backend automatically
- 💾 **State Tracking**: Remembers last processed timestamp to avoid duplicates

## Detected Threats

1. **Phishing Attempts** - Fake links, credential harvesting
2. **Fraud Warnings** - Scam reports, fake websites
3. **Brand Impersonation** - Pretending to be the bank
4. **Social Engineering** - Urgency tactics, CVV requests
5. **Security Complaints** - Customer reports of suspicious activity

## Installation

```bash
# No extra dependencies needed - uses same environment as bank backend
cd E:/gdc-mashreq-solution/fda_agent
```

## Usage

```bash
# Run the FDA agent (make sure Ollama, Social Media, and Bank Backend are running)
python fda_agent.py
```

The agent will:
1. Connect to social media simulator (localhost:8001)
2. Fetch new posts every 30 seconds
3. Analyze each post with Ollama
4. Send threat signals to Bank Backend (localhost:8000)
5. Trigger IAA→EBA workflow automatically

## Configuration

Edit the initialization in `fda_agent.py`:

```python
agent = FDAAgent(
    social_media_url="http://localhost:8001",
    bank_backend_url="http://localhost:8000",
    ollama_url="http://localhost:11434",
    ollama_model="ministral-3:3b",
    poll_interval=30  # seconds between checks
)
```

## State File

Creates `fda_state.json` to track last processed timestamp:
```json
{
  "last_processed_time": "2026-01-31T20:45:30.123456"
}
```

## Example Output

```
2026-02-01 00:30:15 - FDA Agent started - polling every 30 seconds
2026-02-01 00:30:15 - Fetched 42 posts from social media
2026-02-01 00:30:15 - Found 3 new posts since 2026-02-01 00:29:45
2026-02-01 00:30:16 - Analyzing post 123 from @SuspiciousUser
2026-02-01 00:30:18 - Threat detected: Phishing SMS Campaign (confidence: 87%)
2026-02-01 00:30:19 - ✅ Signal sent to bank: Phishing SMS Campaign - Workflow: WF-20260201-001
2026-02-01 00:30:20 - ✨ Cycle complete: 1 signals sent from 3 new posts
```

## Integration with Bank Sentinel

FDA Agent → Bank Backend `/api/fda/sentiment` → IAA Agent → EBA Agent → Human Approval

The FDA provides:
- `signal_type`: Threat classification
- `confidence`: 0-100% confidence score
- `drivers`: List of reasons for detection
- `uncertainty_notes`: Any classification concerns
- `recommend_escalation`: Whether to escalate (0/1)
- `raw_data`: Original post data for IAA verification
