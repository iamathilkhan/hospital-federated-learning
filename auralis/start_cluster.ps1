$basePath = "c:\Users\athin\argos-v1\auralis"
for ($i=0; $i -lt 5; $i++) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $basePath; python raft_leader/leader_node.py $i"
}
