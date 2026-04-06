import os
import sys
import torch

# Add auralis to path
sys.path.append(os.path.join(os.getcwd(), "auralis"))
sys.path.append(os.path.join(os.getcwd(), "auralis", "client"))

from auralis.client.client import AuralisClient

def verify_integration():
    try:
        # Mocking config and node_id
        config_path = os.path.join("auralis", "client", "node_config.yaml")
        client = AuralisClient(config_path, override_node_id=0)
        
        print("Integration Verified: Client instantiated successfully.")
        print(f"Model: {client.model}")
        print(f"Train Loader len: {len(client.train_loader)}")
        
    except Exception as e:
        print(f"Integration Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify_integration()
