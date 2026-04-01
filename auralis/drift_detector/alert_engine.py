import httpx
from datetime import datetime
from typing import List, Dict, Any

# Alert storage
_fired_alerts: List[Dict[str, Any]] = []

def fire_clinical_alert(node_id: str, drift_score: float, specialty: str = "general") -> Dict[str, Any]:
    """
    Creates a clinical alert dictionary and saves to local history.
    """
    severity = "HIGH" if drift_score > 0.25 else "MEDIUM"
    alert = {
        "node_id": node_id,
        "drift_score": drift_score,
        "severity": severity,
        "specialty": specialty,
        "timestamp": datetime.now().isoformat(),
        "message": f"Drift detected at node {node_id}: {drift_score:.4f}",
        "recommended_action": "Specialist escalation"
    }
    _fired_alerts.append(alert)
    return alert

async def send_alert_to_websocket(alert: Dict[str, Any], websocket_url: str):
    """
    Async POST to FastAPI broadcast endpoint.
    """
    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "type": "DRIFT_ALERT",
                "data": alert
            }
            # The FastAPI endpoint is /broadcast
            await client.post(websocket_url, json=payload, timeout=2)
        except Exception as e:
            print(f"Failed to send alert to websocket: {e}")

def get_alerts() -> List[Dict[str, Any]]:
    """
    Returns the list of all fired alerts.
    """
    return _fired_alerts
