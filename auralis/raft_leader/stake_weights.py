def compute_contribution_score(gradient_quality: float, drift_score: float, uptime: float) -> float:
    """
    Computes a weighted contribution score based on gradient quality, drift, and uptime.
    All inputs should be normalized between 0 and 1.
    
    Weights:
    - 40% Gradient Quality
    - 35% (1 - Drift Score)
    - 25% Uptime
    """
    # Clamp inputs to [0, 1] to ensure normalization
    q = max(0.0, min(1.0, gradient_quality))
    d = max(0.0, min(1.0, drift_score))
    u = max(0.0, min(1.0, uptime))
    
    score = (0.40 * q) + (0.35 * (1.0 - d)) + (0.25 * u)
    return float(score)
