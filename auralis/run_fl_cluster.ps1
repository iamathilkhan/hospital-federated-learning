Write-Host "Cleaning up all Auralis/GMIS processes..."
Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -match 'python' -or $_.CommandLine -match 'flwr' -or $_.CommandLine -match 'vite' -or $_.CommandLine -match 'node' } | Invoke-WmiMethod -Name Terminate | Out-Null
Start-Sleep -Seconds 2

$basePath = "c:\Users\athin\argos-v1\auralis"

Write-Host "1/4 Starting Raft Consensus Cluster (5 nodes)..."
Start-Process powershell -ArgumentList "-Command", "cd $basePath\raft_leader; .\start_cluster.ps1"

Start-Sleep -Seconds 3

Write-Host "2/4 Generating Mock Multi-label Dataset..."
Start-Process powershell -ArgumentList "-Command", "cd $basePath; python generate_dataset.py" -Wait

Write-Host "3/4 Starting FastAPI Monitoring Server on port 8000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $basePath; python server/app.py"

Start-Sleep -Seconds 2

Write-Host "4/4 Starting Modern Flower Execution (Superlink + Apps)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $basePath; flwr run ."

Start-Sleep -Seconds 5

Write-Host "--- Launching Physician Dashboard (Vite) ---"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $basePath/dashboard; npm run dev"

Write-Host "Auralis (GMIS) platform is now FULLY OPERATIONAL."
Write-Host "Access Dashboard at http://localhost:5173"
