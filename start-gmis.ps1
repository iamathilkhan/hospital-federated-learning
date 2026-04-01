# GMIS Local Infrastructure Startup Script
# This script launches the Backend, Simulator, and Frontend for local development.

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "GMIS: GLOBAL MEDICAL INTELLIGENCE SWARM - LOCAL STARTUP" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 1. Start Fast API Backend
Write-Host "[1/3] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auralis/server; python app.py"

# 2. Start Swarm Simulator
Write-Host "[2/3] Launching Swarm Node Simulator..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auralis/server; python simulator.py"

# 3. Start React Dashboard (Vite)
Write-Host "[3/3] Launching React Dashboard on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd auralis/dashboard; npm run dev"

Write-Host "`n✔ GMIS Infrastructure successfully initialized." -ForegroundColor Green
Write-Host "Please check the individual terminal windows for log output." -ForegroundColor Gray
Write-Host "Dashboard will be available at: http://localhost:5173" -ForegroundColor Cyan
