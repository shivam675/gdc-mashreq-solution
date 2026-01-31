@echo off
REM Quick start script for Windows - Bank Sentinel

echo ============================================================
echo 🚀 Starting Bank Sentinel - Social Signal Intelligence
echo ============================================================
echo.

echo 1️⃣ Starting Social Media Platform (Port 8001)...
start "Social Media Platform" cmd /k "cd social_media\backend && python run.py"
timeout /t 3 /nobreak >nul

echo 2️⃣ Starting Bank Sentinel Backend (Port 8000)...
start "Bank Sentinel API" cmd /k "cd bank_website\backend && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak >nul

echo 3️⃣ Starting Frontend Dashboard (Port 5174)...
start "Dashboard" cmd /k "cd bank_website\frontend && npm run dev"

echo.
echo ✅ All services starting...
echo.
echo 📍 Services:
echo    - Social Media: http://localhost:8001
echo    - Backend API:  http://localhost:8000
echo    - Dashboard:    http://localhost:5174
echo.
echo 🔑 Login: bankop / bankop123
echo.
echo 🧪 Test: python test_winning_solution.py
echo.
pause
