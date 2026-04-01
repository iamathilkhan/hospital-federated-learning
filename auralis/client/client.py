import yaml
import sys
import torch
import torch.nn as nn
import flwr as fl
from collections import OrderedDict
import requests
import pickle
import base64
import os
from opacus import PrivacyEngine

from data_loader import load_data
from model.cnn import get_resnet18, train_one_epoch, evaluate

def set_parameters(model, parameters):
    params_dict = zip(model.state_dict().keys(), parameters)
    state_dict = OrderedDict({k: torch.tensor(v) for k, v in params_dict})
    model.load_state_dict(state_dict, strict=True)

class AuralisClient(fl.client.NumPyClient):
    def __init__(self, config_path: str, override_node_id: int = None):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
            
        self.node_id = override_node_id if override_node_id is not None else self.config["node_id"]
        
        # Load the new 14-class model
        self.model = get_resnet18(num_classes=14)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        
        self.train_loader, self.val_loader = load_data(
            self.config["data_path"], 
            self.node_id
        )
        
        # Set up Opacus for Differential Privacy
        self.privacy_engine = PrivacyEngine()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        
        # Prepare for DP training
        self.model, self.optimizer, self.train_loader = self.privacy_engine.make_private(
            module=self.model,
            optimizer=self.optimizer,
            data_loader=self.train_loader,
            noise_multiplier=self.config.get("privacy_epsilon", 1.0),
            max_grad_norm=1.0,
        )

    def get_parameters(self, config):
        # Opacus might wrap the model, so we need to access the inner module sometimes
        # But for state_dict it's usually fine
        return [val.cpu().numpy() for _, val in self.model.state_dict().items()]

    def fit(self, parameters, config):
        set_parameters(self.model, parameters)
        old_params = parameters
        
        # Train for 1 epoch using the DP-aware train_one_epoch
        avg_loss = train_one_epoch(
            self.model, 
            self.train_loader, 
            self.optimizer, 
            self.device, 
            self.privacy_engine
        )
        
        new_params = self.get_parameters(config)
        
        # Calculate gradients (weight updates)
        # Note: We return these to the server for BFT filtering, 
        # but the server will then push them to Raft.
        # We also serialize it as a string context for metadata if needed, 
        # but returning it as the first item (parameters) is standard for FedAvg.
        gradient = [n - o for n, o in zip(new_params, old_params)]
        
        # We'll return the new parameters (weights) to the server.
        # The server strategy will calculate gradients internally to filter.
        return new_params, len(self.train_loader.dataset), {"loss": avg_loss}

    def evaluate(self, parameters, config):
        set_parameters(self.model, parameters)
        loss, accuracy, per_class_acc, mean_dist = evaluate(self.model, self.val_loader, self.device)
        return float(loss), len(self.val_loader.dataset), {
            "accuracy": float(accuracy),
            "distribution": mean_dist.tolist()
        }

if __name__ == "__main__":
    node_id = int(sys.argv[1]) if len(sys.argv) > 1 else None
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "node_config.yaml")
    client = AuralisClient(config_path, node_id)
    server_addr = client.config["flower_server_addr"]
    
    print(f"Starting Auralis Flower client {client.node_id} connecting to {server_addr}")
    # Using the non-deprecated form
    fl.client.start_client(server_address=server_addr, client=client.to_client())
