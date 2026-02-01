# Quick Start Script
# Run this to start all components of SLM Desk (Network Accessible)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SLM Desk - Quick Start" -ForegroundColor Cyan
Write-Host "   (Network Accessible Mode)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host "Local IP Address: $localIP" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is running
Write-Host "[1/6] Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Ollama is not running!" -ForegroundColor Red
    Write-Host "Please start Ollama first: ollama serve" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/6] Starting Bank Backend API Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website\backend; uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[3/6] Starting Bank Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website\frontend; npm run dev -- --host 0.0.0.0"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[4/6] Starting Social Media Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\social_media\backend; python run.py"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[5/6] Starting Social Media Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\social_media\frontend\dist; python -m http.server 5174 --bind 0.0.0.0"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[6/6] Starting FDA Agent..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\fda_agent; python fda_agent.py"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All Components Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points (Local):" -ForegroundColor Cyan
Write-Host "  Bank Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host "  Bank Backend API:      http://localhost:8000" -ForegroundColor White
Write-Host "  Social Media Frontend: http://localhost:5174" -ForegroundColor White
Write-Host "  Social Media Backend:  http://localhost:8001" -ForegroundColor White
Write-Host "  Ollama:                http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Network Access Points:" -ForegroundColor Cyan
Write-Host "  Bank Frontend:         http://${localIP}:5173" -ForegroundColor Yellow
Write-Host "  Bank Backend API:      http://${localIP}:8000" -ForegroundColor Yellow
Write-Host "  Social Media Frontend: http://${localIP}:5174" -ForegroundColor Yellow
Write-Host "  Social Media Backend:  http://${localIP}:8001" -ForegroundColor Yellow
Write-Host ""
Write-Host "WARNING: Make sure Windows Firewall allows incoming connections on these ports!" -ForegroundColor Red
Write-Host ""
Write-Host "Press any key to exit (components will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
