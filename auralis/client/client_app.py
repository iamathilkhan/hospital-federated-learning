from flwr.client import ClientApp
from client import AuralisClient
import os

def client_fn(context):
    node_id_str = os.environ.get("FLOWER_NODE_ID", "0")
    node_id = int(node_id_str)
    
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "node_config.yaml")
    client = AuralisClient(config_path, node_id)
    return client.to_client()

app = ClientApp(client_fn=client_fn)
