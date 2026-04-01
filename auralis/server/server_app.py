from flwr.server import ServerApp, ServerConfig, ServerAppComponents
from strategy import RaftFedAvg
import requests

def evaluate_metrics(metrics):
    if not metrics:
        return {}
        
    total_examples = sum(num for num, _ in metrics)
    weighted_acc = sum(num * m["accuracy"] for num, m in metrics) / total_examples
    
    # Send metric to independent FastAPI server running on port 8000
    try:
        requests.post("http://localhost:8000/update_metrics", json={"accuracy": weighted_acc}, timeout=2)
        print(f"Sent accuracy {weighted_acc} to FastAPI server.")
    except Exception as e:
        print(f"Failed to send metrics to FastAPI server: {e}")
        
    return {"accuracy": weighted_acc}

def server_fn(context):
    strategy = RaftFedAvg(
        raft_nodes=["localhost:4321", "localhost:4322", "localhost:4323", "localhost:4324", "localhost:4325"],
        fraction_fit=1.0,
        fraction_evaluate=1.0,
        min_fit_clients=3,
        min_evaluate_clients=3,
        min_available_clients=3,
        evaluate_metrics_aggregation_fn=evaluate_metrics
    )
    config = ServerConfig(num_rounds=3)
    return ServerAppComponents(strategy=strategy, config=config)

app = ServerApp(server_fn=server_fn)
