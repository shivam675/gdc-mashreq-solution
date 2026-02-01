@echo off
REM Quick start script for Windows - Bank Sentinel (Network Accessible)

echo ============================================================
echo Starting Bank Sentinel - Social Signal Intelligence
echo Network Accessible Mode
echo ============================================================
echo.

echo [1/6] Starting Bank Backend API (Port 8000)...
start "Bank Backend API" cmd /k "cd bank_website\backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

echo [2/6] Starting Bank Frontend (Port 5173)...
start "Bank Frontend" cmd /k "cd bank_website\frontend && npm run dev -- --host 0.0.0.0"
timeout /t 3 /nobreak >nul

echo [3/6] Starting Social Media Backend (Port 8001)...
start "Social Media Backend" cmd /k "cd social_media\backend && python run.py"
timeout /t 3 /nobreak >nul

echo [4/6] Starting Social Media Frontend (Port 5174)...
start "Social Media Frontend" cmd /k "cd social_media\frontend\dist && python -m http.server 5174 --bind 0.0.0.0"
timeout /t 2 /nobreak >nul

echo [5/6] Starting FDA Agent...
start "FDA Agent" cmd /k "cd fda_agent && python fda_agent.py"
timeout /t 2 /nobreak >nul

echo.
echo ============================================================
echo All Components Started Successfully!
echo ============================================================
echo.
echo Local Access:
echo    - Bank Frontend:         http://localhost:5173
echo    - Bank Backend API:      http://localhost:8000
echo    - Social Media Frontend: http://localhost:5174
echo    - Social Media Backend:  http://localhost:8001
echo.
echo Network Access (use your local IP):
echo    - Bank Frontend:         http://YOUR_IP:5173
echo    - Bank Backend API:      http://YOUR_IP:8000
echo    - Social Media Frontend: http://YOUR_IP:5174
echo    - Social Media Backend:  http://YOUR_IP:8001
echo.
echo Login: bankop / bankop123
echo.
echo WARNING: Ensure Windows Firewall allows connections on these ports!
echo.
pause
