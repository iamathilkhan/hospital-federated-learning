"# Auralis: Federated Learning with Raft Consensus

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Decentralized, privacy-preserving federated learning platform with fault-tolerant leader election using Raft consensus.

## 🚀 Features

- **Raft Consensus**: Fault-tolerant leader election for reliable gradient aggregation
- **Weighted FedAvg**: Stake-based aggregation weighting (quality, drift, uptime metrics)
- **Drift Detection**: Real-time monitoring of data distribution shifts
- **Model Explainability**: Confidence scoring and interpretability features
- **Interactive Dashboard**: React-based UI for cluster monitoring and diagnostics
- **Healthcare Integration**: FHIR adapter for medical data interoperability
- **Flower Framework**: Built on Flower for scalable federated learning

## 🏗️ Architecture

See [ARCHITECTURE.md](auralis/ARCHITECTURE.md) for detailed system design and Raft implementation.

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+ (for dashboard)
- Docker (optional)

### Setup
```bash
# Clone repository
git clone https://github.com/iamathilkhan/hospital-federated-learning.git
cd hospital-federated-learning

# Install Python dependencies
pip install -r auralis/requirements.txt

# Install dashboard dependencies
cd auralis/dashboard && npm install && cd ..
```

## 🏃 Usage

### Local Raft Cluster
```bash
# Start 5-node cluster simulation
./auralis/start_cluster.ps1

# Or run manually in separate terminals:
python auralis/raft_leader/leader_node.py 0
python auralis/raft_leader/leader_node.py 1
# ... nodes 2-4
```

### Federated Learning Simulation
```bash
# Run with Flower
flwr run auralis/pyproject.toml
```

### Dashboard
```bash
cd auralis/dashboard
npm run dev
# Open http://localhost:5173
```

### Docker Deployment
```bash
docker-compose -f auralis/docker-compose.yml up
```

## 📁 Project Structure

```
auralis/
├── client/              # Federated clients & data loading
├── server/              # Aggregation server & strategies
├── model/               # CNN model with confidence & explainability
├── raft_leader/         # Raft consensus implementation
├── drift_detector/      # Data drift monitoring
├── dashboard/           # React monitoring UI
├── data/                # NIH CXR-14 dataset
├── fhir_adapter/        # Healthcare data integration
└── tests/               # Test suites
```

## 🧪 Testing

```bash
# Raft leader tests
pytest auralis/raft_leader/tests/

# Drift detector tests
pytest auralis/drift_detector/tests/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

**Auralis Team** - [admin@auralis.com](mailto:admin@auralis.com)

---

*Built with ❤️ for privacy-preserving healthcare AI* 
