import sqlite3
import pandas as pd
import torch
import numpy as np
from torch.utils.data import DataLoader, TensorDataset, Subset
import os

def load_sql_data(db_path: str, node_id: int, total_nodes: int = 3, batch_size: int = 16):
    """
    Load FHIR-based hospital data from SQLite.
    Predicts Condition based on Observation values.
    """
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found. Falling back to dummy data.")
        X = torch.randn(100, 10) # 10 features
        y = torch.randint(0, 2, (100, 14)).float() # 14 conditions
        dataset = TensorDataset(X, y)
    else:
        conn = sqlite3.connect(db_path)
        
        # Load observations (features)
        # We'll pivot observations so that each patient has a feature vector of diverse lab results
        obs_df = pd.read_sql_query(\"\"\"
            SELECT subject_patient_id, code_display, value_quantity_value 
            FROM Observation 
            WHERE value_quantity_value IS NOT NULL
        \"\"\", conn)
        
        # Pivot to get one row per patient
        features_df = obs_df.pivot_table(
            index='subject_patient_id', 
            columns='code_display', 
            values='value_quantity_value',
            aggfunc='mean'
        ).fillna(0)
        
        # Select top 10 most common features to keep it simple and consistent
        common_features = features_df.columns[:10]
        X_df = features_df[common_features]
        
        # Load conditions (labels)
        cond_df = pd.read_sql_query(\"\"\"
            SELECT subject_patient_id, code_display 
            FROM Condition
        \"\"\", conn)
        
        # Get top 14 conditions (to match previous model's output count for consistency)
        top_14_conds = cond_df['code_display'].value_counts().nlargest(14).index.tolist()
        
        # Create multi-label y
        y_rows = []
        for pat_id in X_df.index:
            pat_conds = cond_df[cond_df['subject_patient_id'] == pat_id]['code_display'].tolist()
            label = [1 if c in pat_conds else 0 for c in top_14_conds]
            y_rows.append(label)
        
        X = torch.tensor(X_df.values).float()
        y = torch.tensor(y_rows).float()
        conn.close()
        
        # Standardize X
        X = (X - X.mean(dim=0)) / (X.std(dim=0) + 1e-6)
        
        dataset = TensorDataset(X, y)
        print(f"Loaded SQL data: {len(dataset)} patients, {X.shape[1]} features, {y.shape[1]} classes.")

    # Split dataset based on node_id (same logic as data_loader.py)
    total_len = len(dataset)
    subset_size = total_len // total_nodes
    indices = list(range(total_len))
    start_idx = node_id * subset_size
    end_idx = start_idx + subset_size if node_id < total_nodes - 1 else total_len
    
    node_indices = indices[start_idx:end_idx]
    
    np.random.seed(42 + node_id)
    np.random.shuffle(node_indices)
    split_point = int(0.8 * len(node_indices))
    train_idx = node_indices[:split_point]
    val_idx = node_indices[split_point:]
    
    train_data = Subset(dataset, train_idx)
    val_data = Subset(dataset, val_idx)
    
    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader
