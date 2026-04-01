import torch
import torch.nn.functional as F

def calibrate_confidence(raw_logits, T: float = 1.5):
    # Apply temperature scaling
    calibrated_logits = raw_logits / T
    return torch.sigmoid(calibrated_logits)

def format_diagnosis_output(probs, class_names, threshold=0.82):
    probs_np = probs.cpu().numpy()
    top_idx = probs_np.argmax()
    confidence_pct = float(probs_np[top_idx]) * 100
    
    differential_diagnoses = [
        {"name": name, "prob": float(p)}
        for name, p in zip(class_names, probs_np) if p > 0.1
    ]
    
    below_baseline = probs_np[top_idx] < threshold
    
    return {
        "confidence_pct": round(confidence_pct, 2),
        "top_diagnosis": class_names[top_idx],
        "differential_diagnoses": differential_diagnoses,
        "below_baseline": below_baseline
    }
