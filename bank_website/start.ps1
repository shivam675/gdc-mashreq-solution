# Quick Start Script
# Run this to start all components of Bank Sentinel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Bank Sentinel - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is running
Write-Host "[1/4] Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-WebRequest -Uri "http://localhost:11434" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Ollama is not running!" -ForegroundColor Red
    Write-Host "Please start Ollama first: ollama serve" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "[2/4] Starting Backend API Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website\backend; ..\..\..\env\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[3/4] Starting Frontend Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website\frontend; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "[4/4] Starting Simulators..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website; ..\..\..\env\Scripts\Activate.ps1; python social_media_simulator.py"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\gdc-mashreq-solution\bank_website; ..\..\..\env\Scripts\Activate.ps1; python fda_agent_simulator.py"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All Components Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:  http://localhost:8000" -ForegroundColor White
Write-Host "  Social Media: http://localhost:8001" -ForegroundColor White
Write-Host "  Ollama:       http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit (components will keep running)..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
