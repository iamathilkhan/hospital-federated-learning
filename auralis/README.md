# Auralis: Federated Learning with Raft Consensus

Auralis is a decentralized, privacy-preserving federated learning platform. It features a fault-tolerant leader election layer based on the Raft consensus protocol.

## Project Structure

- `raft_leader/`: Core leader election and gradient aggregation logic.
  - `leader_node.py`: GMISLeaderNode implementation using `pysyncobj`.
  - `stake_weights.py`: Contribution scoring based on quality, drift, and uptime.
  - `gradient_cache.py`: Local thread-safe caching for mid-round recovery.
  - `election_monitor.py`: Heartbeat watcher for leader status events.
- `drift_detector/`: Logic for detecting data drift in worker nodes.
- `fhir_adapter/`: Adapter for healthcare data integration.
- `dashboard/`: Monitoring UI.

## Getting Started

### Prerequisites

- Python 3.8+
- `pip install pysyncobj numpy pytest`

### Running a 5-node Cluster Locally

To simulate a cluster on localhost (ports 4321-4325), open 5 terminals and run:

```bash
# Terminal 1
python raft_leader/leader_node.py 0
# Terminal 2
python raft_leader/leader_node.py 1
...
# Terminal 5
python raft_leader/leader_node.py 4
```

### Running Tests

```bash
pytest raft_leader/tests/
```
