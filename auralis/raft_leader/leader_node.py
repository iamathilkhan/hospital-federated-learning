import os
import sys
import time
import numpy as np
from pysyncobj import SyncObj, replicated
from pysyncobj.batteries import ReplDict
from typing import List, Dict, Any, Optional

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from stake_weights import compute_contribution_score
from gradient_cache import store_gradient as local_store, get_cached as local_get
from election_monitor import start_monitor

class GMISLeaderNode(SyncObj):
    def __init__(self, self_addr: str, partners: List[str]):
        # Initialize replicated dictionaries as consumers
        self._gradients_dict = ReplDict()
        self._scores_dict = ReplDict()
        self._drift_scores_dict = ReplDict()
        
        super(GMISLeaderNode, self).__init__(self_addr, partners, consumers=[
            self._gradients_dict, 
            self._scores_dict,
            self._drift_scores_dict
        ])
        
        # Local non-replicated cache
        self._cached_gradients = {}
        self.node_id = self_addr

    @replicated
    def submit_gradient(self, node_id: str, gradient: Any, round_id: str):
        """
        Stores gradient in replicated dict and caches it locally.
        """
        key = f"{round_id}:{node_id}"
        self._gradients_dict[key] = gradient
        
        # Local caching
        if round_id not in self._cached_gradients:
            self._cached_gradients[round_id] = {}
        self._cached_gradients[round_id][node_id] = gradient
        local_store(node_id, gradient, round_id)

    @replicated
    def update_contribution_score(self, node_id: str, score: float):
        """
        Updates node contribution score in the replicated dict.
        """
        self._scores_dict[node_id] = score

    @replicated
    def update_drift_score(self, node_id: str, score: float):
        """
        Updates node drift score in the replicated dict.
        """
        self._drift_scores_dict[node_id] = score

    def aggregate_round(self, round_id: str, n_nodes: int) -> Optional[np.ndarray]:
        """
        Aggregates gradients for a round using weighted FedAvg.
        Requires a majority of gradients from the total n_nodes.
        """
        # Find all gradients for this round
        prefix = f"{round_id}:"
        round_gradients = {k.split(":")[1]: v for k, v in self._gradients_dict.items() if k.startswith(prefix)}
        
        # Majority check
        required_count = (n_nodes // 2) + 1
        if len(round_gradients) < required_count:
            print(f"Aggregation failed for round {round_id}: Only {len(round_gradients)}/{required_count} gradients received.")
            return None

        # Fetch scores for these nodes
        relevant_weights = {}
        for node_id in round_gradients.keys():
            # Calculate final contribution score using stake_weights.py
            # Default values: quality=1.0, drift=0.0, uptime=1.0
            drift = self._drift_scores_dict.get(node_id, 0.0)
            # For now, we assume quality and uptime are 1.0 unless we add more sensors
            score = compute_contribution_score(gradient_quality=1.0, drift_score=drift, uptime=1.0)
            relevant_weights[node_id] = score
        
        # Normalize scores to create weights
        total_weight = sum(relevant_weights.values())
        if total_weight == 0:
            weights = {node_id: 1.0 / len(relevant_weights) for node_id in relevant_weights.keys()}
        else:
            weights = {node_id: weight / total_weight for node_id, weight in relevant_weights.items()}

        # Perform weighted FedAvg

        # Perform weighted FedAvg
        # Assuming gradient is a numpy array or can be converted to one
        weighted_sum = None
        for node_id, gradient in round_gradients.items():
            g_array = np.array(gradient)
            weight = weights[node_id]
            if weighted_sum is None:
                weighted_sum = g_array * weight
            else:
                weighted_sum += g_array * weight
        
        return weighted_sum

    def recover_round(self, round_id: str):
        """
        Re-submits any locally cached gradients for the round to the replicated state.
        Used for mid-round recovery after a node crash or leader change.
        """
        cached = self._cached_gradients.get(round_id, {})
        if not cached:
            # Try getting from the disk/persistent local_get if needed
            cached = local_get(round_id)
            
        for node_id, gradient in cached.items():
            self.submit_gradient(node_id, gradient, round_id)
        
        print(f"Recovered {len(cached)} gradients for round {round_id}")

    def get_leader(self):
        """Helper to get current leader address"""
        return self._getLeader()

import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import base64
import pickle
import asyncio

app = FastAPI()
global_node = None

@app.get("/leader")
def get_leader():
    return {"leader": global_node._getLeader()}

@app.post("/submit_gradient")
async def submit_gradient_rpc(request: Request):
    data = await request.json()
    node_id = data["node_id"]
    round_id = data["round_id"]
    
    # decode pickle
    b64_grad = data["gradient"]
    gradient_bytes = base64.b64decode(b64_grad)
    gradient = pickle.loads(gradient_bytes)
    
    # Check if we are leader. Actually we don't have to be, pysyncobj redirects
    # BUT typically we send to leader.
    global_node.submit_gradient(node_id, gradient, round_id)
    return {"status": "ok"}

@app.post("/update_drift")
async def update_drift_rpc(request: Request):
    data = await request.json()
    node_id = data["node_id"]
    score = data["score"]
    global_node.update_drift_score(node_id, score)
    return {"status": "ok"}

@app.post("/aggregate_round")
async def aggregate_round_rpc(request: Request):
    data = await request.json()
    round_id = data["round_id"]
    n_nodes = data["n_nodes"]
    
    # Actually wait to make sure all replications finished gracefully
    await asyncio.sleep(0.5)
    
    result = global_node.aggregate_round(round_id, n_nodes)
    if result is None:
        return {"status": "failed", "reason": "majority not reached"}
    
    # encode result
    result_bytes = pickle.dumps(result)
    b64_res = base64.b64encode(result_bytes).decode('utf-8')
    return {"status": "ok", "aggregated_weights": b64_res}

if __name__ == '__main__':
    # Add simple __main__ block for booting a 5-node cluster locally
    if len(sys.argv) < 2:
        print("Usage: python leader_node.py <node_index>")
        print("Indices: 0 to 4 (representing ports 4321-4325)")
        sys.exit(1)

    node_idx = int(sys.argv[1])
    ports = [4321, 4322, 4323, 4324, 4325]
    self_port = ports[node_idx]
    self_addr = f'localhost:{self_port}'
    partners = [f'localhost:{p}' for p in ports if p != self_port]

    print(f"Starting node {node_idx} on {self_addr}...")
    global_node = GMISLeaderNode(self_addr, partners)
    
    api_port = 9000 + node_idx
    @app.on_event("startup")
    async def startup_event():
        start_monitor(global_node, self_addr, partners)
        
    uvicorn.run(app, host="0.0.0.0", port=api_port)
