import numpy as np
from scipy.stats import entropy
from datetime import datetime
from typing import Dict, List, Optional

# Thread-safe (using simple dict for now) rolling history
_drift_history: Dict[str, List[Dict[str, Any]]] = {}

def compute_drift_score(local_probs: np.ndarray, global_probs: np.ndarray) -> float:
    """
    Computes KL divergence between local and global probability distributions.
    Expects arrays of shape (num_classes,).
    """
    # Clip to avoid log(0) or division by zero
    local_p = np.clip(local_probs, 1e-10, 1.0)
    global_p = np.clip(global_probs, 1e-10, 1.0)
    
    # Normalize just in case
    local_p /= np.sum(local_p)
    global_p /= np.sum(global_p)
    
    # Scipy entropy(pk, qk) computes KL divergence if qk is provided
    # KL(P || Q) = sum(P * log(P/Q))
    drift_score = float(entropy(local_p, global_p))
    return drift_score

def monitor_node(node_id: str, local_dist: np.ndarray, global_dist: np.ndarray, threshold: float = 0.15) -> Dict[str, Any]:
    """
    Monitors a single node's drift and updates its history.
    """
    score = compute_drift_score(local_dist, global_dist)
    is_drifting = score > threshold
    
    result = {
        "node_id": node_id,
        "drift_score": score,
        "is_drifting": is_drifting,
        "timestamp": datetime.now().isoformat()
    }
    
    # Update rolling history (last 10)
    if node_id not in _drift_history:
        _drift_history[node_id] = []
    
    _drift_history[node_id].append({"round_time": result["timestamp"], "score": score})
    if len(_drift_history[node_id]) > 10:
        _drift_history[node_id].pop(0)
        
    return result

def run_drift_monitor(nodes_dict: Dict[str, np.ndarray], global_dist: np.ndarray, threshold: float = 0.15) -> List[Dict[str, Any]]:
    """
    Runs drift monitoring for all active nodes.
    """
    results = []
    for node_id, local_dist in nodes_dict.items():
        results.append(monitor_node(node_id, local_dist, global_dist, threshold))
    return results

def get_drift_history(node_id: str) -> List[Dict[str, Any]]:
    """
    Returns the rolling history of drift scores for a specific node.
    """
    return _drift_history.get(node_id, [])

# Necessary for typing in monitor_node or elsewhere
import typing
from typing import Any
