# Testing IAA Driver Analysis

## Quick Test Script

Run this to test the IAA agent with dynamic driver analysis:

```bash
cd E:\gdc-mashreq-solution\bank_website\backend
python main.py
```

Then in another terminal, test the FDA simulator with delay complaints:

```python
import requests
import json

# Test FDA signal: Transaction delay complaints
fda_signal = {
    "signal_type": "transaction_delay_complaints",
    "confidence": 0.662,
    "recommend_escalation": True,
    "drivers": ["delayed_transactions", "customer_frustration", "service_issues"],
    "keywords": ["delay", "slow", "pending", "frustrated"]
}

response = requests.post(
    "http://localhost:8000/api/sentiment/",
    json=fda_signal
)

print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

## Expected IAA Behavior

### Step 1: Driver Analysis
```
Message: "Analyzing FDA drivers to determine search strategy..."

LLM analyzes:
- Drivers: ["delayed_transactions", "customer_frustration", "service_issues"]
- Signal: "transaction_delay_complaints"

Returns:
{
    "search_intent": "delay",
    "transaction_status_filter": ["pending", "failed", "inprocess"],
    "review_sentiment_filter": "negative",
    "keywords": ["delay", "delayed", "slow", "pending", "frustrated", "service", "issue", "complaint"],
    "explanation": "Searching for delayed/pending transactions and negative reviews about service delays"
}
```

### Step 2: Transaction Search
```
Message: "Searching transaction database..."

Query:
- Status IN ["pending", "failed", "inprocess"]
- OR description ILIKE '%delay%'
- OR description ILIKE '%slow%'
- OR description ILIKE '%pending%'

Expected: Find pending/failed transactions (5% of 1000 = ~50 transactions)
```

### Step 3: Review Search
```
Message: "Searching customer reviews..."

Query:
- sentiment = 'negative'
- AND (
    review_text ILIKE '%delay%' OR category ILIKE '%delay%'
    OR review_text ILIKE '%frustrated%' OR category ILIKE '%frustrated%'
    OR review_text ILIKE '%service%' OR category ILIKE '%service%'
  )

Expected: Find negative reviews with service/delay keywords (~10-20 reviews)
```

### Step 4: Confidence Calculation
```
Message: "Confidence score: X%"

Formula: (matched_reviews / 300 total) × 100
Expected: 10-20 reviews / 300 = 3.3% - 6.7%
Verification: CONFIRMED (if >= 5%)
```

### Step 5: Results
```
Sanitized Summary (to EBA):
{
    "transactions_found": 50,
    "reviews_found": 15,
    "sentiment_match_count": 15,
    "confidence_score": 5.0,
    "verification": "CONFIRMED",
    "sentiment": "negative",
    "search_intent": "delay",
    "keywords_used": ["delay", "slow", "pending", "frustrated", "service"]
}

Detailed Data (to operator dashboard):
- matched_transactions: [... 50 pending/failed transactions ...]
- matched_reviews: [... 15 negative reviews about service/delays ...]
- confidence_score: 5.0
- analysis: "LLM analysis based on sanitized summary"
```

## Dashboard UI Display

### Verification Cards:
```
┌─────────────────┬────────────┬──────────────┬───────────────┬──────────────┐
│ Transactions    │ Reviews    │ Sentiment    │ Confidence    │ Verification │
│ Found           │ Found      │ Match        │ Score         │              │
├─────────────────┼────────────┼──────────────┼───────────────┼──────────────┤
│ 50              │ 15         │ 15           │ 5.0%          │ CONFIRMED    │
└─────────────────┴────────────┴──────────────┴───────────────┴──────────────┘
```

### Matched Transactions Table (7 rows max):
```
Date         Type      Amount       Status    Description
─────────────────────────────────────────────────────────────────
01/30/2026   transfer  AED 1494.21  pending   Bill payment transfer
01/29/2026   transfer  AED 5879.37  pending   Domestic fund transfer
01/28/2026   transfer  AED 3200.00  failed    Vendor payment transfer
01/27/2026   transfer  AED 8500.00  pending   Loan repayment transfer
01/26/2026   transfer  AED 2100.00  inprocess Business payment transfer
01/25/2026   transfer  AED 4600.00  pending   Insurance premium transfer
01/24/2026   transfer  AED 1800.00  failed    International wire transfer

... and 43 more transactions
```

### Matched Reviews Table (7 rows max):
```
Date       Customer   Category         Sentiment  Rating  Review
──────────────────────────────────────────────────────────────────────────────
01/30/2026 Ahmed K.   customer_support negative   2/5     "Very frustrated with slow service..."
01/29/2026 Fatima M.  mobile_app       negative   1/5     "Transfer delays are unacceptable..."
01/28/2026 Omar S.    branch_service   negative   2/5     "Waited too long for pending transaction..."
01/27/2026 Layla H.   customer_support negative   2/5     "Poor service, always delayed..."
01/26/2026 Hassan A.  mobile_app       negative   1/5     "Frustrated with app performance..."
01/25/2026 Noura B.   loan_service     negative   3/5     "Loan processing too slow..."
01/24/2026 Khalid R.  customer_support negative   2/5     "Service issues keep happening..."

... and 8 more reviews
```

## Debug Checklist

If you see 0 reviews found:

1. ✅ Check driver analysis output in backend logs
2. ✅ Verify keywords extracted: Should include "delay", "service", "frustrated"
3. ✅ Check review search query: Should search review_text AND category
4. ✅ Verify database has reviews with those keywords:
   ```sql
   SELECT COUNT(*) FROM customer_reviews 
   WHERE sentiment = 'negative' 
   AND (review_text ILIKE '%delay%' OR review_text ILIKE '%service%' OR review_text ILIKE '%frustrated%');
   ```

If you see completed transactions instead of pending:

1. ✅ Check driver analysis: transaction_status_filter should be ["pending", "failed", "inprocess"]
2. ✅ Verify transaction search query uses status filter
3. ✅ Check database for pending transactions:
   ```sql
   SELECT COUNT(*) FROM transactions WHERE status IN ('pending', 'failed', 'inprocess');
   ```

## Monitoring Backend Logs

Look for these log messages:

```
INFO: Driver analysis: {
    "search_intent": "delay",
    "transaction_status_filter": ["pending", "failed", "inprocess"],
    "review_sentiment_filter": "negative",
    "keywords": ["delay", "slow", "pending", "frustrated", "service", "issue"],
    "explanation": "..."
}

INFO: Transaction search: found 50 matches
INFO: Review search: found 15 matches
INFO: Confidence calculated: 5.0%
INFO: Verification: CONFIRMED
```

## Success Criteria

✅ Driver analysis extracts relevant keywords
✅ Transaction search finds pending/failed transactions
✅ Review search finds negative reviews with service/delay keywords
✅ Confidence > 0% (not 0%)
✅ Reviews found > 0 (not 0)
✅ Dashboard shows 5 verification cards
✅ Tables display with 7 rows max
✅ "... and X more" footer appears if > 7 items
✅ EBA receives only sanitized summary (no customer names/amounts)
