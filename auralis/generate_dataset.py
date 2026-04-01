import os
import numpy as np
from PIL import Image

def generate():
    base_dir = "./data/nih_cxr_14"
    normal_dir = os.path.join(base_dir, "normal")
    abnormal_dir = os.path.join(base_dir, "abnormal")
    
    os.makedirs(normal_dir, exist_ok=True)
    os.makedirs(abnormal_dir, exist_ok=True)
    
    print("Generating synthetic NIH CXR-14 dataset (100 images) to fulfill datasets.ImageFolder requirements...")
    
    for i in range(50):
        # Normal
        img_arr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        img = Image.fromarray(img_arr)
        img.save(os.path.join(normal_dir, f"normal_{i}.png"))
        
        # Abnormal
        img_arr = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        img = Image.fromarray(img_arr)
        img.save(os.path.join(abnormal_dir, f"abnormal_{i}.png"))

if __name__ == "__main__":
    generate()
    print("Dataset generated successfully.")
