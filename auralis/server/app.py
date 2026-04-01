import asyncio
import threading
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import JSONResponse
import uvicorn
import requests

app = FastAPI()

# Global state
server_state = {
    "current_round": 0,
    "connected_nodes": 3,
    "raft_leader": None,
    "accuracy_history": []
}

connected_websockets = set()
loop = None

async def broadcast_event(event_type: str, data: dict):
    payload = {"type": event_type, "data": data}
    for ws in connected_websockets.copy():
        try:
            await ws.send_json(payload)
        except Exception:
            pass

@app.get("/status")
def get_status():
    leader = None
    api_ports = [9000, 9001, 9002, 9003, 9004]
    for port in api_ports:
        try:
            res = requests.get(f"http://localhost:{port}/leader", timeout=0.1)
            if res.status_code == 200:
                leader = res.json().get("leader")
                break
        except Exception:
            pass
    server_state["raft_leader"] = leader
    return server_state

@app.get("/nodes")
def get_nodes():
    # Mock node details for dashboard visualization
    nodes = []
    locations = ["Chennai", "Nairobi", "São Paulo", "Oslo", "Chicago"]
    leader = get_status()["raft_leader"]
    
    for i in range(5):
        node_id = f"node_{i}"
        nodes.append({
            "id": node_id,
            "name": f"Hospital {locations[i]}",
            "drift_score": 0.05 + (i * 0.02), # Mock initial drift
            "uptime": 99.8,
            "contribution_score": 0.95,
            "is_leader": leader == f"localhost:{4321 + i}"
        })
    return nodes

@app.get("/diagnosis/sample")
def get_diagnosis_sample():
    # Return mock GradCAM and confidence data for DiagnosticView
    return {
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e6/Normal_posteroanterior_chest_radiograph.jpg",
        "confidence": 89.4,
        "top_diagnosis": "No Finding",
        "differential_diagnoses": [
            {"name": "No Finding", "prob": 0.89},
            {"name": "Atelectasis", "prob": 0.05}
        ],
        "driving_signals": "SHAP analysis indicates high density in lung fields is consistent with normal aeration."
    }

@app.post("/audit/log")
async def audit_log(request: Request):
    data = await request.json()
    action = data.get("action")
    print(f"CLINICAL AUDIT LOG: Action [{action}] recorded for diagnosis.")
    return {"status": "ok"}

@app.get("/accuracy")
def get_accuracy():
    return server_state["accuracy_history"]

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except Exception:
         connected_websockets.remove(websocket)

@app.post("/update_metrics")
async def update_metrics(request: Request):
    data = await request.json()
    accuracy = data.get("accuracy", 0.0)
    
    server_state["current_round"] += 1
    accuracy_record = {"round": server_state["current_round"], "accuracy": accuracy}
    server_state["accuracy_history"].append(accuracy_record)
    
    global loop
    if loop is not None and loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast_event("round_complete", accuracy_record), loop)
        
    return {"status": "ok"}

@app.post("/broadcast")
async def broadcast(request: Request):
    data = await request.json()
    event_type = data.get("type", "unknown")
    payload = data.get("data", {})
    
    global loop
    if loop is not None and loop.is_running():
        asyncio.run_coroutine_threadsafe(broadcast_event(event_type, payload), loop)
        
    return {"status": "ok"}

def run_api_server():
    global loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, loop="asyncio")
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    t = threading.Thread(target=run_api_server, daemon=False)
    t.start()
    t.join()
