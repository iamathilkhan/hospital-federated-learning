# GMIS: Global Medical Intelligence Swarm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Python](https://img.shields.io/badge/python-3670A0?style=flat&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)
![Flower](https://img.shields.io/badge/Flower-Federated_Learning-orange)

> A decentralized, privacy-preserving federated learning platform for healthcare, featuring fault-tolerant leader election and real-time clinical drift detection.

## Key Features

- **Consensus Orchestration**: Fault-tolerant leader election ensuring reliable gradient aggregation across distributed nodes.
- **Weighted Federated Averaging**: Advanced aggregation weighting systems based on data quality, clinical drift, and node uptime.
- **Clinical Drift Monitoring**: Real-time statistical analysis to detect and mitigate data distribution shifts across hospital sites.
- **Model Explainability**: Integrated confidence scoring and tabular SHAP-based diagnostic interpretability.
- **Executive Dashboard**: Professional interface for real-time swarm monitoring and diagnostic auditing.
- **Interoperability**: Standardized adapters for integration with existing healthcare data ecosystems.

## Technical Architecture

The system utilizes a decentralized architecture where patient data remains isolated within hospital firewalls. Model updates are synchronized via a secure consensus protocol, ensuring that no raw data is ever disclosed to the network. Detailed design specifications can be found in the [ARCHITECTURE.md](auralis/ARCHITECTURE.md) document.

## Infrastructure Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Vercel CLI (for cloud deployment)

### Local Implementation
```bash
# Clone the repository
git clone https://github.com/iamathilkhan/hospital-federated-learning.git
cd hospital-federated-learning

# Install core dependencies
pip install -r requirements.txt

# Configure the dashboard
cd auralis/dashboard && npm install
```

## Running the Platform

### Integrated Environment
The platform can be launched from the root directory using the unified build script:
```powershell
npm run dev
```

### Production Deployment
The GMIS platform is configured for automated deployment on Vercel.
```bash
# Deploy to production environment
vercel deploy --prod
```

## Project Organization

```
api/                     # Vercel serverless entry points
auralis/
├── dashboard/           # React professional monitoring interface
├── server/              # FastAPI backend and consensus logic
├── model/               # Tabular MLP architectures with explainability
├── raft_leader/         # Consensus protocol implementation
├── drift_detector/      # Statistical monitoring suite
├── fhir_adapter/        # Medical data interoperability layer
└── database-fhir/       # SQL-based FHIR hospital database
```

## Verification and Testing

Comprehensive test suites are provided to ensure the integrity of the consensus and diagnostic protocols:

```bash
# Validate consensus protocols
pytest auralis/raft_leader/tests/

# Validate drift detection accuracy
pytest auralis/drift_detector/tests/
```

## Governance and Contributions

Guidelines for contributing to the GMIS infrastructure:
1. Fork the repository
2. Implement features in a dedicated branch
3. Submit a pull request for peer review

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete details.

## Authorship

**Global Medical Intelligence Swarm (GMIS)**
Contact: [systems@gmis.medical](mailto:systems@gmis.medical)

---
*Distributed Intelligence for Privacy-Preserving Healthcare AI*
