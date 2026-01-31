# IAA Agent Enhancement Summary

## Overview
Complete rewrite of the Internal Analysis Agent (IAA) to add sentiment verification, confidence scoring, and data sanitization. The EBA agent now receives ONLY sanitized data (no sensitive customer information).

## Key Changes

### 1. IAA Agent Enhancements (`backend/app/agents/iaa_agent.py`)

#### Sentiment-Based Search
- **Positive Signal**: Searches for positive reviews + completed transactions
- **Negative Signal**: Searches for negative reviews + failed/flagged/pending transactions
- **Keyword Matching**: Customer service keywords (refund, complaint, service, delay, etc.) in transaction descriptions

#### Confidence Scoring
- **Formula**: `(matching_reviews / total_reviews_in_db) × 100`
- **Verification Status**:
  - `CONFIRMED`: Confidence ≥ 5.0%
  - `NOT CONFIRMED`: Confidence < 5.0%

#### Dual-Output Architecture
```python
{
    "type": "completed",
    "data": {
        # FOR OPERATOR DASHBOARD (full details)
        "matched_transactions": [...],      # Full transaction objects
        "matched_reviews": [...],           # Full review objects with customer names
        "confidence_score": 15.3,           # Percentage
        "analysis": "LLM analysis text",    # Full analysis
        
        # FOR EBA AGENT (sanitized - NO sensitive data)
        "sanitized_summary": {
            "transactions_found": 12,
            "reviews_found": 46,
            "sentiment_match_count": 46,
            "confidence_score": 15.3,
            "verification": "CONFIRMED",
            "sentiment": "positive"
        }
    }
}
```

#### New Methods
1. **`_search_transactions()`**: Sentiment-based transaction query
   - Negative signal → flagged/pending/failed/inprocess transactions
   - Positive signal → completed successful transactions

2. **`_search_reviews()`**: Sentiment-matching review query
   - Match review sentiment with signal sentiment
   - Keyword search in review text and category

3. **`_calculate_confidence()`**: Calculate verification confidence
   - Returns percentage: (matching_reviews / total_reviews) × 100

4. **`_create_sanitized_summary()`**: Strip sensitive data
   - Returns ONLY counts, confidence, verification status, sentiment
   - NO customer names, amounts, review text, transaction IDs

5. **`_generate_analysis_stream()`**: LLM analysis
   - Uses ONLY sanitized data (prevents LLM from seeing sensitive info)

### 2. EBA Agent Updates (`backend/app/agents/eba_agent.py`)

#### Method Signature Change
```python
# OLD
async def generate_post(
    sentiment_data, 
    iaa_analysis,      # Removed
    matched_data       # Removed
)

# NEW
async def generate_post(
    sentiment_data,
    sanitized_summary  # ONLY sanitized data
)
```

#### Prompt Enhancement
- Uses sanitized verification data (transactions_found, reviews_found, confidence_score, verification)
- NO customer names, transaction amounts, or review text in prompt
- Confidence score influences response strength (higher confidence = more acknowledgment)

### 3. Route Updates (`backend/app/routes/sentiment_routes.py`)

#### Data Flow Change
```python
# Extract both detailed and sanitized data from IAA
matched_transactions = update["data"]["matched_transactions"]   # For operator
matched_reviews = update["data"]["matched_reviews"]             # For operator
sanitized_summary = update["data"]["sanitized_summary"]         # For EBA
confidence_score = update["data"]["confidence_score"]           # For operator

# Broadcast full details to operator dashboard
await manager.broadcast({
    "type": "iaa_completed",
    "data": {
        "matched_transactions": matched_transactions,
        "matched_reviews": matched_reviews,
        "confidence_score": confidence_score,
        "sanitized_summary": sanitized_summary
    }
})

# Pass ONLY sanitized summary to EBA
async for update in eba_agent.generate_post(
    sentiment_data,
    sanitized_summary  # NO sensitive data
)
```

### 4. Dashboard UI Refactor (`frontend/src/pages/Dashboard.tsx`)

#### New Features

1. **Verification Summary Cards** (5 metrics):
   - Transactions Found
   - Reviews Found
   - Sentiment Match Count
   - Confidence Score (green highlight)
   - Verification Status (CONFIRMED/NOT CONFIRMED)

2. **Matched Transactions Table**:
   - Displays max 7 rows
   - Shows: Date, Type, Amount, Status, Description
   - "... and X more transactions" footer if exceeds 7 rows
   - Color-coded status badges (completed=green, pending=yellow, flagged=red)

3. **Matched Reviews Table**:
   - Displays max 7 rows
   - Shows: Date, Customer Name, Category, Sentiment, Rating, Review Text
   - "... and X more reviews" footer if exceeds 7 rows
   - Color-coded sentiment badges (positive=green, neutral=yellow, negative=red)

4. **Layout Improvements**:
   - Grid layout for summary cards (2 columns on mobile, 5 on desktop)
   - No scrolling required - everything visible at once
   - Clean table design with hover effects
   - Truncated long text with ellipsis

#### Type Updates
```typescript
interface WorkflowState {
  // ... existing fields
  iaa_matched_transactions?: any[];
  iaa_matched_reviews?: any[];
  iaa_confidence_score?: number;
  iaa_sanitized_summary?: any;
}
```

## Security Improvements

### Data Sanitization
- **EBA Agent**: Receives NO sensitive customer data
  - ✅ Counts (transactions_found, reviews_found)
  - ✅ Confidence score
  - ✅ Verification status
  - ✅ Sentiment type
  - ❌ Customer names
  - ❌ Transaction amounts
  - ❌ Review text content
  - ❌ Transaction descriptions

### Operator Dashboard
- **Full Visibility**: Operators see all matched data in tables
- **Context**: Complete transaction and review details for decision-making
- **Trust**: Confidence score shows verification strength

## Testing Scenarios

### Test 1: Positive Sentiment Signal
```python
{
    "signal_type": "positive",
    "confidence": 0.82,
    "drivers": ["excellent service", "fast transfers"]
}
```
**Expected IAA Behavior**:
- Search positive reviews
- Search completed transactions
- Calculate confidence: (positive_reviews / total_reviews) × 100
- Show tables with 7 rows max

**Expected EBA Input**:
```python
{
    "transactions_found": 950,
    "reviews_found": 210,
    "sentiment_match_count": 210,
    "confidence_score": 70.0,
    "verification": "CONFIRMED",
    "sentiment": "positive"
}
```

### Test 2: Negative Sentiment Signal
```python
{
    "signal_type": "negative",
    "confidence": 0.75,
    "drivers": ["poor service", "delayed transfers"]
}
```
**Expected IAA Behavior**:
- Search negative reviews
- Search failed/flagged/pending transactions
- Calculate confidence
- Show tables with customer service transaction matches

**Expected EBA Input**:
```python
{
    "transactions_found": 50,
    "reviews_found": 30,
    "sentiment_match_count": 30,
    "confidence_score": 10.0,
    "verification": "CONFIRMED",
    "sentiment": "negative"
}
```

## Benefits

1. **Security**: EBA never sees sensitive customer data
2. **Trust**: Confidence score quantifies verification strength
3. **Transparency**: Operator sees full details in elegant tables
4. **Intelligence**: Sentiment-based matching improves relevance
5. **Usability**: No scrolling required, everything visible at once
6. **Scalability**: Table truncation prevents UI overload (7 row limit)

## File Changes Summary

| File | Lines Changed | Type |
|------|--------------|------|
| `iaa_agent.py` | ~150 | Complete rewrite |
| `eba_agent.py` | ~60 | Prompt + signature update |
| `sentiment_routes.py` | ~25 | Data flow modification |
| `Dashboard.tsx` | ~180 | UI refactor + table components |

## Next Steps

1. ✅ Backend integration complete
2. ✅ Frontend UI refactored
3. ⏳ Test end-to-end workflow with FDA simulator
4. ⏳ Verify confidence calculation accuracy
5. ⏳ Test table display with various data sizes
6. ⏳ Validate EBA receives only sanitized data

## Migration Notes

- **Breaking Change**: EBA agent signature changed (remove `iaa_analysis` and `matched_data` parameters)
- **Database**: No schema changes required
- **Frontend**: New TypeScript types added to WorkflowState interface
- **Backward Compatibility**: None (complete rewrite of IAA logic)
