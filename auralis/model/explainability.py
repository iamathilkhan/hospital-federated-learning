import torch
import torch.nn as nn
import numpy as np
import cv2
import shap

def get_gradcam(model: nn.Module, image_tensor: torch.Tensor, target_class: int) -> np.ndarray:
    model.eval()
    # Assuming ResNet18 and using model.layer4 for GradCAM
    target_layer = model.layer4[-1]
    
    # Hooks for feature maps and gradients
    feature_maps = []
    gradients = []
    
    def forward_hook(module, input, output):
        feature_maps.append(output)
    
    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0])
        
    f_hook = target_layer.register_forward_hook(forward_hook)
    b_hook = target_layer.register_full_backward_hook(backward_hook)
    
    # Forward pass
    output = model(image_tensor.unsqueeze(0))
    loss = output[0, target_class]
    
    model.zero_grad()
    loss.backward()
    
    f_hook.remove()
    b_hook.remove()
    
    # Process heatmap
    grads = gradients[0].cpu().data.numpy()[0]
    f_maps = feature_maps[0].cpu().data.numpy()[0]
    
    weights = np.mean(grads, axis=(1, 2))
    heatmap = np.zeros(f_maps.shape[1:], dtype=np.float32)
    
    for i, w in enumerate(weights):
        heatmap += w * f_maps[i]
        
    heatmap = np.maximum(heatmap, 0)
    heatmap /= np.max(heatmap) if np.max(heatmap) > 0 else 1
    
    # Resize heatmap to match input image
    heatmap = cv2.resize(heatmap, (image_tensor.shape[2], image_tensor.shape[1]))
    return heatmap

def get_shap_values(model: nn.Module, image_tensor: torch.Tensor, background_tensors: torch.Tensor) -> np.ndarray:
    model.eval()
    explainer = shap.DeepExplainer(model, background_tensors)
    shap_values = explainer.shap_values(image_tensor.unsqueeze(0))
    return np.array(shap_values)

def format_explanation(shap_values, prediction_probs, class_names):
    top_idx = np.argmax(prediction_probs)
    explanation = {
        "confidence": float(prediction_probs[top_idx]),
        "top_diagnosis": class_names[top_idx],
        "differential_list": [
            {"name": name, "prob": float(prob)}
            for name, prob in zip(class_names, prediction_probs) if prob > 0.1
        ],
        "driving_signals": "SHAP summary" # Placeholder for summarized SHAP data
    }
    return explanation
