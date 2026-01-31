#!/bin/bash
# Quick start script for the entire solution

echo "🚀 Starting Bank Sentinel - Social Signal Intelligence System"
echo "=============================================================="
echo ""

# Check if running in Git Bash or WSL
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    # Windows Git Bash
    PYTHON="python"
else
    # Linux/WSL
    PYTHON="python3"
fi

echo "1️⃣  Starting Social Media Platform (Port 8001)..."
cd social_media/backend
start cmd /k "$PYTHON run.py"
cd ../..
sleep 2

echo "2️⃣  Starting Bank Sentinel Backend (Port 8000)..."
cd bank_website/backend
start cmd /k "$PYTHON -m uvicorn app.main:app --reload --port 8000"
cd ../..
sleep 2

echo "3️⃣  Starting Frontend Dashboard (Port 5174)..."
cd bank_website/frontend
start cmd /k "npm run dev"
cd ../..

echo ""
echo "✅ All services starting..."
echo ""
echo "📍 Services:"
echo "   - Social Media: http://localhost:8001"
echo "   - Backend API:  http://localhost:8000"
echo "   - Dashboard:    http://localhost:5174"
echo ""
echo "🔑 Login: bankop / bankop123"
echo ""
echo "🧪 Test: python test_winning_solution.py"
echo ""
echo "Press any key to continue..."
read -n 1
