import torch
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights
from opacus import PrivacyEngine
from typing import Tuple, Dict

def get_resnet18(num_classes: int = 14) -> nn.Module:
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)
    num_ftrs = model.fc.in_features
    model.fc = nn.Linear(num_ftrs, num_classes)
    return model

def train_one_epoch(model, dataloader, optimizer, device, privacy_engine=None):
    model.train()
    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0
    for images, labels in dataloader:
        images, labels = images.to(device), labels.to(device).float()
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    
    avg_loss = total_loss / len(dataloader)
    if privacy_engine:
        epsilon = privacy_engine.get_epsilon(delta=1e-5)
        print(f"DP Epsilon spent: {epsilon:.2f}")
    return avg_loss

def evaluate(model, dataloader, device) -> Tuple[float, float, Dict[int, float], np.ndarray]:
    model.eval()
    criterion = nn.BCEWithLogitsLoss()
    total_loss = 0
    correct = 0
    total = 0
    # For per-class AUC (simplified for now to per-class accuracy)
    per_class_correct = {i: 0 for i in range(14)}
    per_class_total = {i: 0 for i in range(14)}
    
    all_probs = []

    with torch.no_grad():
        for images, labels in dataloader:
            images, labels = images.to(device), labels.to(device).float()
            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            
            # Record probabilities for drift detection
            batch_probs = torch.sigmoid(outputs).cpu().numpy()
            all_probs.append(batch_probs)
            
            # Multi-label thresholding at 0.5
            preds = (torch.sigmoid(outputs) > 0.5).float()
            total += labels.numel()
            correct += (preds == labels).sum().item()
            
            for i in range(14):
                per_class_total[i] += labels.size(0)
                per_class_correct[i] += (preds[:, i] == labels[:, i]).sum().item()

    accuracy = correct / total if total > 0 else 0
    per_class_acc = {i: per_class_correct[i] / per_class_total[i] for i in range(14)}
    
    # Calculate mean probability distribution across the entire validation set
    if all_probs:
        mean_dist = np.mean(np.concatenate(all_probs), axis=0)
    else:
        mean_dist = np.zeros(14)
        
    return total_loss / len(dataloader), accuracy, per_class_acc, mean_dist
