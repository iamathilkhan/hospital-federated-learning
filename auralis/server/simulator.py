import requests
import time
import random
import math

API_URL = "http://localhost:8000"

def sigmoid(x):
    return 1 / (1 + math.exp(-x))

def run_simulation():
    print("Starting GMIS Swarm Simulation...")
    round_count = 0
    accuracy = 0.71
    
    locations = ["Chennai", "Nairobi", "São Paulo", "Oslo", "Chicago"]
    
    while True:
        try:
            round_count += 1
            # Sigmoid-ish accuracy growth
            accuracy = 0.7 + (0.28 * sigmoid(round_count / 5 - 2)) 
            
            # 1. Update Learning Metrics
            requests.post(f"{API_URL}/update_metrics", json={
                "round": round_count,
                "accuracy": accuracy * 100
            })
            print(f"Round {round_count}: Accuracy {accuracy*100:.2f}%")

            # 2. Random Drift Alerts (30% chance per round)
            if random.random() < 0.3:
                node_idx = random.randint(0, 4)
                requests.post(f"{API_URL}/broadcast", json={
                    "type": "DRIFT_ALERT",
                    "data": {
                        "node_id": node_idx,
                        "message": f"Statistical drift detected in {locations[node_idx]} clinic dataset.",
                        "recommended_action": "Retrain local weights with augmented baseline."
                    }
                })
                print(f"Alert: Drift detected at Node {node_idx}")

            # 3. Consensus Failover Simulation (Every 4 rounds)
            if round_count % 4 == 0:
                term = random.randint(10, 50)
                requests.post(f"{API_URL}/broadcast", json={
                    "type": "leader_failover",
                    "data": {"term": term}
                })
                print("Event: Triggering leader failover...")
                
                time.sleep(2)
                
                new_leader_idx = random.randint(0, 4)
                new_leader = f"localhost:{4321 + new_leader_idx}"
                requests.post(f"{API_URL}/broadcast", json={
                    "type": "new_leader",
                    "data": {"leader": new_leader}
                })
                print(f"Event: New leader elected: {new_leader}")

            # 4. Byzantine Quarantine (Rare)
            if random.random() < 0.1:
                node_idx = random.randint(0, 4)
                requests.post(f"{API_URL}/broadcast", json={
                    "type": "BYZANTINE_QUARANTINE",
                    "data": {
                        "node_id": node_idx,
                        "norm": random.uniform(15.0, 45.0)
                    }
                })
                print(f"Alert: Node {node_idx} quarantined (Byzantine behavior)")

        except Exception as e:
            print(f"Simulation tick failed: {e}")
            
        time.sleep(10)

if __name__ == "__main__":
    # Wait for server to be ready
    for _ in range(10):
        try:
            requests.get(f"{API_URL}/status")
            break
        except:
            print("Waiting for API server...")
            time.sleep(2)
            
    run_simulation()
