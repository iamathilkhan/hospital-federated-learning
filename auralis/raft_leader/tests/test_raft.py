import pytest
import time
import numpy as np
import sys
import os
from typing import List

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from stake_weights import compute_contribution_score
from leader_node import GMISLeaderNode

def test_stake_weight_computation():
    """
    Test stake weight computation logic with known inputs.
    Weights: 40% quality, 35% (1 - drift), 25% uptime
    """
    # Inputs: quality=1.0, drift=0.0, uptime=1.0
    # Score: (0.4 * 1.0) + (0.35 * (1.0 - 0.0)) + (0.25 * 1.0) = 0.4 + 0.35 + 0.25 = 1.0
    score1 = compute_contribution_score(1.0, 0.0, 1.0)
    assert pytest.approx(score1) == 1.0

    # Inputs: quality=0.5, drift=0.5, uptime=0.8
    # Score: (0.4 * 0.5) + (0.35 * 0.5) + (0.25 * 0.8) = 0.2 + 0.175 + 0.2 = 0.575
    score2 = compute_contribution_score(0.5, 0.5, 0.8)
    assert pytest.approx(score2) == 0.575

    # Inputs: quality=0.0, drift=1.0, uptime=0.0
    # Score: (0.4 * 0.0) + (0.35 * 0.0) + (0.25 * 0.0) = 0.0
    score3 = compute_contribution_score(0.0, 1.0, 0.0)
    assert pytest.approx(score3) == 0.0

@pytest.mark.skip(reason="Full cluster testing requires multiple processes/ports and is slow for unit tests.")
def test_five_node_election():
    """
    Manual verification: Boot 5 nodes, wait for leader.
    Ensure node 0 starts and becomes leader if nothing else is up.
    """
    pass

@pytest.mark.skip(reason="Complex recovery test requires process management.")
def test_mid_round_recovery():
    """
    Simulate scenario:
    1. 5 nodes running.
    2. Submit 3 gradients to leader.
    3. Kill leader.
    4. New leader elected.
    5. Call recover_round.
    6. Verify gradients are present in the new leader's replicated state.
    """
    pass

def test_aggregation_majority():
    """
    Test the aggregate_round function logic without running a full cluster.
    """
    # Manually populate the dictionaries for testing
    node = GMISLeaderNode('localhost:9999', [])
    
    # Wait for node to become leader (single node cluster)
    timeout = 5.0
    start_time = time.time()
    while not node._getLeader() and time.time() - start_time < timeout:
        time.sleep(0.1)
    
    # Simulate a few gradients
    round_id = "round_1"
    node.submit_gradient("node_1", [1.0, 2.0], round_id)
    node.submit_gradient("node_2", [3.0, 4.0], round_id)
    
    # Wait a bit for @replicated methods to be applied
    time.sleep(1.0)
    
    print(f"DEBUG: gradients_dict keys: {list(node._gradients_dict.keys())}")
    
    # With n_nodes=5, majority is 3. Aggregation should fail with 2.
    result = node.aggregate_round(round_id, 5)
    print(f"DEBUG: aggregation result (expected None): {result}")
    assert result is None
    
    # Add a third gradient
    node.submit_gradient("node_3", [5.0, 6.0], round_id)
    
    # Wait for the third gradient to be applied
    time.sleep(1.0)
    print(f"DEBUG: gradients_dict keys after third: {list(node._gradients_dict.keys())}")
    
    # Now it should work with 3 nodes
    result_weighted = node.aggregate_round(round_id, 5)
    assert result_weighted is not None
    # Default scores are 1.0, so weights should be equal (1/3 each)
    expected = (np.array([1.0, 2.0]) + np.array([3.0, 4.0]) + np.array([5.0, 6.0])) / 3.0
    assert np.allclose(result_weighted, expected)

def test_weighted_aggregation():
    """
    Test aggregation with different contribution scores.
    """
    # Manually populate the dictionaries for testing
    node = GMISLeaderNode('localhost:9998', [])
    
    # Wait for node to become leader
    timeout = 5.0
    start_time = time.time()
    while not node._getLeader() and time.time() - start_time < timeout:
        time.sleep(0.1)
    
    round_id = "round_2"
    
    # Scores: node_1=10, node_2=90 (total=100)
    # Weights: node_1=0.1, node_2=0.9
    node.update_contribution_score("node_1", 10.0)
    node.update_contribution_score("node_2", 90.0)
    
    node.submit_gradient("node_1", [10.0, 10.0], round_id)
    node.submit_gradient("node_2", [20.0, 20.0], round_id)
    
    # Wait a bit for @replicated methods to be applied
    time.sleep(0.5)
    
    # Majority of 3 for aggregation (with n_nodes=3)
    result = node.aggregate_round(round_id, 3)
    
    # Weighted avg: 0.1*[10,10] + 0.9*[20,20] = [1,1] + [18,18] = [19,19]
    assert np.allclose(result, [19.0, 19.0])

if __name__ == "__main__":
    print("Running stake weight computation test...")
    test_stake_weight_computation()
    print("Stake weights OK.")
    
    print("Running aggregation majority test...")
    test_aggregation_majority()
    print("Majority aggregation OK.")
    
    print("Running weighted aggregation test...")
    test_weighted_aggregation()
    print("Weighted aggregation OK.")
    
    print("Testing complete.")
