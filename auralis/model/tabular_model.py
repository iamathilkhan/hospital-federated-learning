import torch
import torch.nn as nn
from typing import Tuple, Dict
import numpy as np

class TabularModel(nn.Module):
    def __init__(self, input_dim: int = 10, num_classes: int = 14):
        super(TabularModel, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, num_classes)
        )
        
    def forward(self, x):
        return self.fc(x)

def get_tabular_model(input_dim: int = 10, num_classes: int = 14) -> nn.Module:
    return TabularModel(input_dim=input_dim, num_classes=num_classes)

def train_one_epoch(model, dataloader, optimizer, device):
    model.train()
    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0
    for features, labels in dataloader:
        features, labels = features.to(device), labels.to(device).float()
        optimizer.zero_grad()
        outputs = model(features)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    return total_loss / len(dataloader)

def evaluate(model, dataloader, device) -> Tuple[float, float, Dict[int, float], np.ndarray]:
    model.eval()
    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0
    correct = 0
    total = 0
    
    num_classes = 14
    per_class_correct = {i: 0 for i in range(num_classes)}
    per_class_total = {i: 0 for i in range(num_classes)}
    all_probs = []

    with torch.no_grad():
        for features, labels in dataloader:
            features, labels = features.to(device), labels.to(device).float()
            outputs = model(features)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            
            # Multi-label probability
            probs = torch.sigmoid(outputs).cpu().numpy()
            all_probs.append(probs)
            
            # Predicted labels
            preds = (torch.sigmoid(outputs) > 0.5).float()
            total += labels.numel()
            correct += (preds == labels).sum().item()
            
            for i in range(num_classes):
                per_class_total[i] += labels.size(0)
                per_class_correct[i] += (preds[:, i] == labels[:, i]).sum().item()

    accuracy = correct / total if total > 0 else 0
    per_class_acc = {i: per_class_correct[i] / per_class_total[i] for i in range(num_classes)}
    
    if all_probs:
        mean_dist = np.mean(np.concatenate(all_probs), axis=0)
    else:
        mean_dist = np.zeros(num_classes)
        
    return total_loss / len(dataloader), accuracy, per_class_acc, mean_dist
