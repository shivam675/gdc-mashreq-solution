"""
Test script to trigger IAA agent workflow
Sends a POST request to the backend sentiment endpoint
"""
import requests
import json
from datetime import datetime

# Backend API URL
API_URL = "http://localhost:8000/api/send_social_sentiment"

# Sample sentiment data to trigger the workflow
test_sentiment_data = {
    "signal_type": "negative_spike",
    "confidence": 0.87,
    "drivers": [
        "increased complaints about ATM fees",
        "long wait times at branches",
        "mobile app crashes"
    ],
    "uncertainty_notes": "Sample may be skewed toward specific demographic",
    "recommend_escalation": True,
    "raw_data": {
        "source": "test_script",
        "sample_size": 1500,
        "time_window": "24h",
        "sentiment_breakdown": {
            "negative": 65,
            "neutral": 25,
            "positive": 10
        }
    }
}

def test_iaa_workflow():
    """Send a test sentiment signal to trigger IAA agent"""
    print("=" * 60)
    print("Testing IAA Agent Workflow")
    print("=" * 60)
    print(f"\nTimestamp: {datetime.now().isoformat()}")
    print(f"\nSending POST request to: {API_URL}")
    print("\nPayload:")
    print(json.dumps(test_sentiment_data, indent=2))
    print("\n" + "-" * 60)
    
    try:
        # Send POST request
        response = requests.post(
            API_URL,
            json=test_sentiment_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Check response
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✓ Success! Workflow initiated.")
            print(f"\nWorkflow ID: {result.get('workflow_id')}")
            print(f"Status: {result.get('status')}")
            print(f"Message: {result.get('message')}")
            print("\n" + "=" * 60)
            print("Check the frontend Dashboard to see real-time progress!")
            print("URL: http://localhost:5173")
            print("=" * 60)
        else:
            print(f"\n✗ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Connection Error!")
        print("Make sure the backend server is running on http://localhost:8000")
        print("\nStart it with:")
        print("  cd backend")
        print("  uvicorn main:app --reload")
        
    except requests.exceptions.Timeout:
        print("\n✗ Request Timeout!")
        print("The backend took too long to respond.")
        
    except Exception as e:
        print(f"\n✗ Unexpected Error: {e}")

if __name__ == "__main__":
    test_iaa_workflow()
