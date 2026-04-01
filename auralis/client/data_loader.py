import os
import torch
import numpy as np
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset, TensorDataset

def load_data(data_path: str, node_id: int, total_nodes: int = 3, batch_size: int = 16):
    """
    Load NIH Chest X-ray dataset (multi-label), fallback to dummy data if path invalid.
    Splits into equal partitions assigned to node_id.
    """
    
    # Standard normalization for ResNet18
    mean = [0.485, 0.456, 0.406]
    std = [0.229, 0.224, 0.225]
    
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std)
    ])

    # Check if dataset path exists and is populated
    if os.path.exists(data_path) and len(os.listdir(data_path)) > 0:
        # Use ImageFolder for real data, but it only works for single class per folder
        # For actual NIH CXR, we'd need a custom CSV loader, but here we'll assume ImageFolder
        # for training structure if the user has organized it, or use the dummy fallback.
        try:
            dataset = datasets.ImageFolder(root=data_path, transform=transform)
            print(f"Loaded {len(dataset)} items from {data_path}.")
        except Exception:
            dataset = None
    else:
        dataset = None

    if dataset is None:
        # Fallback to multi-label dummy data (14 classes)
        print(f"Dataset path {data_path} not found or empty. Using dummy multi-label dataset for testing.")
        # Create a small dataset of 60 items, 14 classes
        X = torch.randn(60, 3, 224, 224)
        y = torch.randint(0, 2, (60, 14)).float() # 14 classes multi-label
        dataset = TensorDataset(X, y)

    # Split dataset based on node_id
    total_len = len(dataset)
    subset_size = total_len // total_nodes
    
    indices = list(range(total_len))
    start_idx = node_id * subset_size
    # Make sure last node gets remainder
    end_idx = start_idx + subset_size if node_id < total_nodes - 1 else total_len
    
    node_indices = indices[start_idx:end_idx]
    
    # 80/20 train/val split for the local subset
    np.random.seed(42 + node_id) # ensures deterministic split
    np.random.shuffle(node_indices)
    split_point = int(0.8 * len(node_indices))
    train_idx = node_indices[:split_point]
    val_idx = node_indices[split_point:]
    
    train_data = Subset(dataset, train_idx)
    val_data = Subset(dataset, val_idx)
    
    train_loader = DataLoader(train_data, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_data, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader
