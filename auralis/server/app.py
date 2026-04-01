import asyncio
import threading
from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
import time

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state (Will persist in local dev, but reset on Vercel cold starts)
# In Vercel, we use time-based simulation to ensure a "moving" dashboard.
BASE_TIME = 1711886400 # Fixed epoch for simulation start

def get_simulated_state():
    # Progresses by 1 round every 20 seconds
    elapsed = time.time() - BASE_TIME
    current_round = int(elapsed / 20) % 500
    
    # Sigmoid accuracy growth over rounds
    def sigmoid(x):
        return 1 / (1 + math.exp(-x))
    
    accuracy = 71 + (27 * sigmoid(current_round / 15 - 2))
    
    # Leader rotates every 60 seconds
    leader_idx = int(elapsed / 60) % 5
    leader = f"localhost:{4321 + leader_idx}"
    
    return {
        "current_round": current_round,
        "connected_nodes": 5,
        "raft_leader": leader,
        "accuracy": accuracy
    }

@app.get("/status")
def get_status():
    sim = get_simulated_state()
    return {
        "current_round": sim["current_round"],
        "connected_nodes": sim["connected_nodes"],
        "raft_leader": sim["raft_leader"],
        "accuracy_history": [] # Placeholder for status endpoint
    }

@app.get("/nodes")
def get_nodes():
    nodes = []
    locations = ["Chennai", "Nairobi", "São Paulo", "Oslo", "Chicago"]
    sim = get_simulated_state()
    leader = sim["raft_leader"]
    
    for i in range(5):
        node_id = f"node_{i}"
        nodes.append({
            "id": node_id,
            "name": f"Hospital {locations[i]}",
            "drift_score": 0.05 + ((sim["current_round"] + i) % 10 * 0.01), 
            "uptime": 99.8,
            "contribution_score": 0.95,
            "is_leader": leader == f"localhost:{4321 + i}"
        })
    return nodes

@app.get("/accuracy")
def get_accuracy():
    sim = get_simulated_state()
    curr_round = sim["current_round"]
    
    # Generate history up to current round (max 15 points)
    history = []
    def sigmoid(x): return 1 / (1 + math.exp(-x))
    
    for r in range(max(0, curr_round - 15), curr_round + 1):
        acc = 71 + (27 * sigmoid(r / 15 - 2))
        history.append({"round": r, "accuracy": acc})
    
    return history

@app.get("/diagnosis/sample")
# ... (rest of the diagnostic endpoints)
def get_diagnosis_sample():
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
    print(f"CLINICAL AUDIT LOG: Action [{action}] recorded.")
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
         if websocket in connected_websockets:
             connected_websockets.remove(websocket)

@app.post("/update_metrics")
async def update_metrics(request: Request):
    data = await request.json()
    accuracy = data.get("accuracy", 0.0)
    round_num = data.get("round", server_state["current_round"] + 1)
    
    server_state["current_round"] = round_num
    accuracy_record = {"round": round_num, "accuracy": accuracy}
    server_state["accuracy_history"].append(accuracy_record)
    
    if len(server_state["accuracy_history"]) > 20:
        server_state["accuracy_history"].pop(0)

    if loop:
        # Broadcast on the loop if possible
        asyncio.run_coroutine_threadsafe(broadcast_event("round_complete", accuracy_record), loop)
        
    return {"status": "ok"}

@app.post("/broadcast")
async def broadcast(request: Request):
    data = await request.json()
    event_type = data.get("type", "unknown")
    payload = data.get("data", {})
    
    if event_type == "new_leader":
        server_state["raft_leader"] = payload.get("leader")

    if loop:
        asyncio.run_coroutine_threadsafe(broadcast_event(event_type, payload), loop)
        
    return {"status": "ok"}

def run() -> None:
    global loop
    loop = asyncio.get_event_loop()
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, loop="asyncio")
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    run()
