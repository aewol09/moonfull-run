import os
import sys
from PIL import Image

PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'

def deploy_background(src_path, stage_num, target_size=(1600, 900)):
    if not os.path.exists(src_path):
        print(f"Warning: {src_path} does not exist.")
        return False
    
    img = Image.open(src_path).convert('RGB')
    # Resize with high quality Lanczos resampling to crisp 16:9 dimension
    img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
    
    out_path = os.path.join(PUBLIC_ASSETS, f'bg_stage{stage_num}.png')
    img_resized.save(out_path, 'PNG', optimize=True)
    print(f"Successfully deployed: {out_path} ({img_resized.size}, {os.path.getsize(out_path) // 1024} KB)")
    return True

if __name__ == '__main__':
    print("Stage background deployer ready.")
