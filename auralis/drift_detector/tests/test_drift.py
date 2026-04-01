import numpy as np
import pytest
from drift_detector.detector import compute_drift_score, monitor_node, get_drift_history
from drift_detector.alert_engine import fire_clinical_alert, get_alerts

def test_kl_divergence_zero():
    """Test that identical distributions have zero KL divergence."""
    dist = np.array([0.1, 0.2, 0.7])
    score = compute_drift_score(dist, dist)
    assert score == pytest.approx(0.0)

def test_drift_threshold():
    """Test that a shifted distribution triggers drift detection."""
    global_dist = np.array([0.1, 0.2, 0.7])
    # Shift probability significantly
    local_dist = np.array([0.7, 0.2, 0.1])
    
    result = monitor_node("test_node", local_dist, global_dist, threshold=0.15)
    assert result["is_drifting"] is True
    assert result["drift_score"] > 0.15

def test_alert_generation():
    """Test that the alert engine correctly formats clinical alerts."""
    node_id = "hospital_01"
    drift_score = 0.35 # High drift
    alert = fire_clinical_alert(node_id, drift_score)
    
    assert alert["node_id"] == node_id
    assert alert["severity"] == "HIGH"
    assert "Drift detected" in alert["message"]
    assert alert in get_alerts()

def test_history_rolling():
    """Test that the detector keeps a rolling history of exactly 10 items."""
    node_id = "test_rolling_node"
    dist = np.array([0.5, 0.5])
    
    # Push 12 scores
    for _ in range(12):
        monitor_node(node_id, dist, dist)
        
    history = get_drift_history(node_id)
    assert len(history) == 10
