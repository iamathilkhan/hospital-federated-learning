Write-Host "Starting Auralis (GMIS) Raft Consensus Cluster (5 nodes)..."

$basePath = "c:\Users\athin\argos-v1\auralis\raft_leader"

for ($i=0; $i -lt 5; $i++) {
    Write-Host "Launching Raft Node $i (port $(4321 + $i))..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $basePath; python leader_node.py $i"
    Start-Sleep -Seconds 1
}

Write-Host "Consensus layer initialization complete."
