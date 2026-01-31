# IAA Driver Analysis Enhancement

## Problem Identified

**User Issue:**
```
FDA Drivers: delayed_transactions, customer_frustration, service_issues
IAA Results: 20 completed transactions, 0 reviews, 0% confidence
```

**Root Cause:**
- IAA was using **hardcoded sentiment-based search** (positive → positive reviews, negative → negative reviews)
- **Ignored FDA driver keywords** completely
- Did NOT extract search intent from dynamic driver values
- Searched for wrong transaction types (completed instead of delayed/pending)

## Solution Implemented

### 1. Dynamic Driver Analysis (`_analyze_drivers` method)

**Purpose:** Use LLM to analyze FDA drivers and extract:
- Search intent (fraud, delay, service_complaint, positive_feedback)
- Transaction status filter (flagged, pending, failed, completed)
- Review sentiment filter (positive, negative, neutral, any)
- Keywords to search in descriptions and review text

**LLM Prompt:**
```python
prompt = f"""You are analyzing social media sentiment drivers to determine how to search internal bank data.

SENTIMENT SIGNAL:
- Type: {signal_type}
- Confidence: {confidence * 100:.1f}%
- Drivers: {', '.join(drivers)}

TASK: Extract search intent and keywords.

1. Determine if this is about:
   - fraud/security (search flagged transactions)
   - delays/pending (search pending/failed transactions)
   - service complaints (search reviews with negative sentiment + keywords)
   - positive feedback (search reviews with positive sentiment + keywords)

2. Extract keywords to search in:
   - Transaction descriptions
   - Customer review text
   - Review categories

3. Determine sentiment to match in reviews (positive/negative/neutral/any)

RETURN ONLY JSON (no explanation):
{{
    "search_intent": "fraud" | "delay" | "service_complaint" | "positive_feedback" | "general",
    "transaction_status_filter": ["flagged", "pending", "failed", "inprocess", "completed"],
    "review_sentiment_filter": "positive" | "negative" | "neutral" | "any",
    "keywords": ["keyword1", "keyword2", ...],
    "explanation": "brief explanation of search strategy"
}}
"""
```

**Example Output for FDA Drivers: `["delayed_transactions", "customer_frustration", "service_issues"]`**
```json
{
    "search_intent": "delay",
    "transaction_status_filter": ["pending", "failed", "inprocess"],
    "review_sentiment_filter": "negative",
    "keywords": ["delay", "delayed", "slow", "pending", "frustrated", "frustration", "service", "issue", "complaint"],
    "explanation": "Searching for delayed/pending transactions and negative reviews about service delays"
}
```

### 2. Updated Transaction Search (`_search_transactions`)

**Before:**
```python
# Hardcoded: negative signal → flagged/pending, positive → completed
if signal_type == 'negative':
    query = select(Transaction).where(
        Transaction.status.in_(['flagged', 'pending', 'failed', 'inprocess'])
    )
```

**After:**
```python
# Dynamic: use analyzed driver intent
status_filter = driver_analysis.get('transaction_status_filter', [])  # e.g., ["pending", "failed"]
keywords = driver_analysis.get('keywords', [])  # e.g., ["delay", "slow"]

conditions = []
if status_filter:
    conditions.append(Transaction.status.in_(status_filter))

# Search descriptions for keywords
keyword_conditions = []
for keyword in keywords:
    if keyword:
        keyword_conditions.append(Transaction.description.ilike(f'%{keyword}%'))

if keyword_conditions:
    conditions.append(or_(*keyword_conditions))

query = select(Transaction).where(or_(*conditions)).limit(20)
```

### 3. Updated Review Search (`_search_reviews`)

**Before:**
```python
# Hardcoded: match signal_type with sentiment
target_sentiment = signal_type  # "negative" → search negative reviews
conditions.append(CustomerReview.sentiment == target_sentiment)
```

**After:**
```python
# Dynamic: use analyzed sentiment filter
sentiment_filter = driver_analysis.get('review_sentiment_filter', 'any')  # e.g., "negative"
keywords = driver_analysis.get('keywords', [])  # e.g., ["delay", "service", "frustrated"]

conditions = []

# Add sentiment filter (unless 'any')
if sentiment_filter and sentiment_filter != 'any':
    conditions.append(CustomerReview.sentiment == sentiment_filter)

# Search review text AND category for keywords
keyword_conditions = []
for keyword in keywords:
    if keyword:
        keyword_conditions.append(
            or_(
                CustomerReview.review_text.ilike(f'%{keyword}%'),
                CustomerReview.category.ilike(f'%{keyword}%')
            )
        )

if keyword_conditions:
    conditions.append(or_(*keyword_conditions))

query = select(CustomerReview).where(or_(*conditions)).limit(20)
```

### 4. Enhanced Sanitized Summary

**Added Fields:**
```python
{
    "transactions_found": 12,
    "reviews_found": 46,
    "sentiment_match_count": 46,
    "confidence_score": 15.3,
    "verification": "CONFIRMED",
    "sentiment": "negative",
    "search_intent": "delay",              # NEW
    "keywords_used": ["delay", "slow"]     # NEW
}
```

### 5. Workflow Progress Updates

**New Progress Message:**
```python
yield {
    "type": "progress",
    "stage": "search_strategy",
    "message": "Searching for delayed/pending transactions and negative reviews about service delays",
    "data": {
        "intent": "delay",
        "keywords": ["delay", "delayed", "slow", "pending", "frustrated", "frustration", "service"],
        "transaction_filter": ["pending", "failed", "inprocess"],
        "review_filter": "negative"
    }
}
```

## Test Cases

### Test Case 1: Delay Complaints

**FDA Input:**
```json
{
    "signal_type": "transaction_delay_complaints",
    "confidence": 0.662,
    "drivers": ["delayed_transactions", "customer_frustration", "service_issues"]
}
```

**Expected Driver Analysis:**
```json
{
    "search_intent": "delay",
    "transaction_status_filter": ["pending", "failed", "inprocess"],
    "review_sentiment_filter": "negative",
    "keywords": ["delay", "delayed", "slow", "pending", "frustrated", "service", "issue"]
}
```

**Expected Results:**
- ✅ Transactions: Pending/failed/inprocess transactions with "delay", "slow", "pending" in descriptions
- ✅ Reviews: Negative reviews containing "delay", "frustrated", "service", "issue" keywords
- ✅ Confidence: Based on matched review count (should be > 0%)

### Test Case 2: Fraud Concerns

**FDA Input:**
```json
{
    "signal_type": "security_concerns",
    "confidence": 0.78,
    "drivers": ["fraud_reports", "suspicious_activity", "account_security"]
}
```

**Expected Driver Analysis:**
```json
{
    "search_intent": "fraud",
    "transaction_status_filter": ["flagged", "failed"],
    "review_sentiment_filter": "negative",
    "keywords": ["fraud", "suspicious", "security", "unauthorized", "hack"]
}
```

**Expected Results:**
- ✅ Transactions: Flagged/failed transactions with fraud-related keywords
- ✅ Reviews: Negative reviews about security/fraud
- ✅ Confidence: Based on matched reviews

### Test Case 3: Positive Feedback

**FDA Input:**
```json
{
    "signal_type": "excellent_service",
    "confidence": 0.85,
    "drivers": ["fast_transfers", "helpful_staff", "good_experience"]
}
```

**Expected Driver Analysis:**
```json
{
    "search_intent": "positive_feedback",
    "transaction_status_filter": ["completed"],
    "review_sentiment_filter": "positive",
    "keywords": ["fast", "quick", "helpful", "excellent", "good", "great"]
}
```

**Expected Results:**
- ✅ Transactions: Completed successful transactions
- ✅ Reviews: Positive reviews with keywords
- ✅ Confidence: Based on positive review matches

## Benefits

1. **Dynamic Adaptation**: IAA adapts search strategy based on FDA driver content
2. **Keyword Intelligence**: Extracts meaningful keywords from driver terms
3. **Context-Aware**: Understands intent (fraud vs delay vs positive feedback)
4. **Better Accuracy**: Finds relevant data instead of generic sentiment matches
5. **Transparent**: Shows operator the search strategy used

## Fallback Mechanism

If LLM analysis fails:
```python
return {
    "search_intent": "general",
    "transaction_status_filter": ["flagged", "pending", "failed", "inprocess"],
    "review_sentiment_filter": "negative",
    "keywords": [d.replace('_', ' ') for d in drivers],  # "delayed_transactions" → "delayed transactions"
    "explanation": "Fallback: using driver terms as keywords"
}
```

## Files Modified

1. **`backend/app/agents/iaa_agent.py`**:
   - Added `_analyze_drivers()` method
   - Updated `_search_transactions()` to use driver_analysis
   - Updated `_search_reviews()` to use driver_analysis
   - Updated `_calculate_confidence()` signature
   - Updated `_create_sanitized_summary()` to include search_intent and keywords
   - Updated `analyze()` method to call driver analysis first

## Next Steps

1. ✅ Code implemented and tested
2. ⏳ Test with real FDA signals
3. ⏳ Verify LLM driver analysis accuracy
4. ⏳ Monitor keyword extraction quality
5. ⏳ Tune fallback mechanism if needed
