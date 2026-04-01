import flwr as fl
import requests
import pickle
import base64
import numpy as np
from logging import INFO
from flwr.common.logger import log
from typing import List, Tuple, Optional, Dict, Union
from flwr.common import FitRes, Parameters, Scalar, ndarrays_to_parameters, parameters_to_ndarrays
import os

class RaftFedAvg(fl.server.strategy.FedAvg):
    def __init__(self, raft_nodes: List[str], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.raft_nodes = raft_nodes
        self.current_weights: Optional[List[np.ndarray]] = None
        # map raft tcp ports to api ports
        self.api_ports = {
            "localhost:4321": 9000,
            "localhost:4322": 9001,
            "localhost:4323": 9002,
            "localhost:4324": 9003,
            "localhost:4325": 9004
        }

    def _get_leader_api_url(self) -> str:
        for node in self.api_ports.values():
            try:
                resp = requests.get(f"http://localhost:{node}/leader", timeout=2)
                if resp.status_code == 200:
                    leader_addr = resp.json().get("leader")
                    if leader_addr and leader_addr in self.api_ports:
                        return f"http://localhost:{self.api_ports[leader_addr]}"
            except Exception:
                continue
        return ""

    def initialize_parameters(self, client_manager):
        params = super().initialize_parameters(client_manager)
        if params is not None:
            self.current_weights = parameters_to_ndarrays(params)
        return params

    def aggregate_fit(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, FitRes]],
        failures: List[Union[Tuple[fl.server.client_proxy.ClientProxy, FitRes], BaseException]],
    ) -> Tuple[Optional[Parameters], Dict[str, Scalar]]:
        
        if not results:
            return None, {}

        # 1. Byzantine Fault Tolerance: Filter gradients
        # We calculate the gradient as (new_weights - old_weights)
        if self.current_weights is None:
            # If for some reason we don't have weights, fallback to standard
            return super().aggregate_fit(server_round, results, failures)

        gradients = []
        client_ids = []
        norms = []

        for client, fit_res in results:
            new_weights = parameters_to_ndarrays(fit_res.parameters)
            grad = [n - o for n, o in zip(new_weights, self.current_weights)]
            # Flatten to compute norm
            flat_grad = np.concatenate([g.flatten() for g in grad])
            norm = np.linalg.norm(flat_grad)
            
            gradients.append(grad)
            client_ids.append(client.cid)
            norms.append(norm)

        # 2. 3-Sigma Rule to Quarantine Malicious Gradients
        clean_results = []
        if len(norms) > 2:
            mean_norm = np.mean(norms)
            std_norm = np.std(norms)
            threshold = mean_norm + 3 * std_norm
            
            for i, norm in enumerate(norms):
                if norm > threshold:
                    log(INFO, f"BYZANTINE_QUARANTINE: Node {client_ids[i]} (norm={norm:.4f}, threshold={threshold:.4f})")
                    # Send event to FastAPI
                    try:
                        requests.post("http://localhost:8000/broadcast", json={
                            "type": "BYZANTINE_QUARANTINE",
                            "data": {"node_id": client_ids[i], "norm": float(norm), "round": server_round}
                        }, timeout=2)
                    except Exception:
                        pass
                else:
                    clean_results.append(results[i])
        else:
            clean_results = results

        if not clean_results:
            log(INFO, "All gradients quarantined! This round is wasted.")
            return None, {}

        # 3. Pull Raft Leader
        leader_url = self._get_leader_api_url()
        if not leader_url:
            log(INFO, "No Raft leader found. Falling back to standard FedAvg.")
            return super().aggregate_fit(server_round, results, failures)

        # 4. Push Clean Gradients to Raft Leader
        round_id = f"round_{server_round}"
        for client, fit_res in clean_results:
            new_weights = parameters_to_ndarrays(fit_res.parameters)
            grad = [n - o for n, o in zip(new_weights, self.current_weights)]
            b64_grad = base64.b64encode(pickle.dumps(grad)).decode('utf-8')
            
            payload = {
                "node_id": f"node_{client.cid}",
                "round_id": round_id,
                "gradient": b64_grad
            }
            try:
                requests.post(f"{leader_url}/submit_gradient", json=payload, timeout=5)
            except Exception as e:
                log(INFO, f"Failed to push gradient for node {client.cid}: {e}")

        # 5. Call aggregate_round on Raft
        try:
            payload = {
                "round_id": round_id,
                "n_nodes": len(clean_results)
            }
            res = requests.post(f"{leader_url}/aggregate_round", json=payload, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data["status"] == "ok":
                    b64_res = data["aggregated_weights"]
                    aggregated_weights = pickle.loads(base64.b64decode(b64_res))
                    self.current_weights = aggregated_weights # Update local cache
                    log(INFO, f"Raft Aggregation Round {server_round} SUCCEEDED.")
                    return ndarrays_to_parameters(aggregated_weights), {}
        except Exception as e:
            log(INFO, f"Raft Aggregation FAILED: {e}. Falling back to standard FedAvg.")

        return super().aggregate_fit(server_round, results, failures)

    def aggregate_evaluate(
        self,
        server_round: int,
        results: List[Tuple[fl.server.client_proxy.ClientProxy, fl.common.EvaluateRes]],
        failures: List[Union[Tuple[fl.server.client_proxy.ClientProxy, fl.common.EvaluateRes], BaseException]],
    ) -> Tuple[Optional[float], Dict[str, Scalar]]:
        """
        Aggregate evaluation results and compute drift.
        """
        if not results:
            return None, {}

        # 1. Standard aggregation
        loss_aggregated, metrics_aggregated = super().aggregate_evaluate(server_round, results, failures)

        # 2. Extract distributions for drift detection
        node_distributions = {}
        for client, evaluate_res in results:
            if "distribution" in evaluate_res.metrics:
                # metrics dict stores lists; convert back to numpy
                node_distributions[client.cid] = np.array(evaluate_res.metrics["distribution"])

        if node_distributions:
            # Compute global baseline as average of current distributions
            global_dist = np.mean(list(node_distributions.values()), axis=0)
            
            from drift_detector.detector import monitor_node
            from drift_detector.alert_engine import fire_clinical_alert, send_alert_to_websocket
            from flwr.common import Scalar
            import asyncio
            import nest_asyncio
            nest_asyncio.apply()

            leader_url = self._get_leader_api_url()

            for node_id, local_dist in node_distributions.items():
                drift_result = monitor_node(node_id, local_dist, global_dist)
                drift_score = drift_result["drift_score"]
                
                # Check for alert
                if drift_result["is_drifting"]:
                    alert = fire_clinical_alert(node_id, drift_score)
                    # Broadcast to FastAPI dashboard
                    try:
                        asyncio.run(send_alert_to_websocket(alert, "http://localhost:8000/broadcast"))
                    except Exception as e:
                        log(INFO, f"Failed to broadcast drift alert: {e}")

                # Update Raft component
                if leader_url:
                    try:
                        requests.post(f"{leader_url}/update_drift", json={
                            "node_id": f"node_{node_id}",
                            "score": drift_score
                        }, timeout=2)
                    except Exception as e:
                        log(INFO, f"Failed to update drift score in Raft for node {node_id}: {e}")

        return loss_aggregated, metrics_aggregated
