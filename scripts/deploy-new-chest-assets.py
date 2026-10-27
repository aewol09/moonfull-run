#!/usr/bin/env python3
import os
import cv2
import numpy as np
from PIL import Image

CLOSED_SRC = '/home/aewol/.gemini/antigravity-cli/brain/c1e388a1-ec45-402b-8547-fdc23a9946bd/celestial_treasure_chest_1792502016484.jpg'
OPEN_SRC = '/home/aewol/.gemini/antigravity-cli/brain/c1e388a1-ec45-402b-8547-fdc23a9946bd/celestial_treasure_chest_open_1792502060942.jpg'
PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'

def extract_alpha_cutout(img_path):
    img = cv2.imread(img_path)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]
    
    # Distance from white (255, 255, 255)
    diff = np.abs(rgb.astype(np.float32) - 255.0)
    max_diff = np.max(diff, axis=2)
    
    # White background seed from borders
    bg_seed = (max_diff < 32).astype(np.uint8)
    flood_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    
    for x in range(w):
        if bg_seed[0, x]:
            cv2.floodFill(bg_seed, flood_mask, (x, 0), 2)
        if bg_seed[h-1, x]:
            cv2.floodFill(bg_seed, flood_mask, (x, h-1), 2)
    for y in range(h):
        if bg_seed[y, 0]:
            cv2.floodFill(bg_seed, flood_mask, (0, y), 2)
        if bg_seed[y, w-1]:
            cv2.floodFill(bg_seed, flood_mask, (w-1, y), 2)
            
    is_outer_bg = (flood_mask[1:-1, 1:-1] == 1)
    
    # Floor shadow handling:
    # Shadow is near bottom (y > 870), has high brightness (min RGB > 175) and near neutral grey
    shadow_mask = (np.arange(h)[:, None] > 870) & (np.min(rgb, axis=2) > 175) & ((np.max(rgb, axis=2) - np.min(rgb, axis=2)) < 18)
    is_bg_final = is_outer_bg | shadow_mask
    
    alpha = np.where(is_bg_final, 0, 255).astype(np.uint8)
    
    # Distance transform for smooth antialiased edge
    dist_to_bg = cv2.distanceTransform(alpha, cv2.DIST_L2, 3)
    alpha_smooth = np.clip(dist_to_bg * 85, 0, 255).astype(np.uint8)
    
    # Defringe: Un-blend white background from edge pixels
    alpha_norm = (alpha_smooth / 255.0)[:, :, None]
    recovered_rgb = np.clip((rgb.astype(np.float32) - 255.0 * (1.0 - alpha_norm)) / np.maximum(alpha_norm, 0.01), 0, 255)
    final_rgb = np.where(alpha_smooth[:, :, None] == 255, rgb, recovered_rgb.astype(np.uint8))
    
    rgba = np.dstack([final_rgb, alpha_smooth])
    res = Image.fromarray(rgba, 'RGBA')
    
    # Crop to non-empty bounding box
    bbox = res.getbbox()
    return res.crop(bbox)

def main():
    print("✂️ Extracting closed chest...")
    closed_crop = extract_alpha_cutout(CLOSED_SRC)
    print("✂️ Extracting open chest...")
    open_crop = extract_alpha_cutout(OPEN_SRC)
    
    # Align and fit into 512x512
    # Determine base width
    cw, ch = closed_crop.size
    ow, oh = open_crop.size
    print(f"Closed raw size: {cw}x{ch}, Open raw size: {ow}x{oh}")
    
    # Target size 512x512, inner chest target width approx 440px
    target_w = 440
    scale = target_w / float(cw)
    
    closed_scaled = closed_crop.resize((int(cw * scale), int(ch * scale)), Image.Resampling.LANCZOS)
    open_scaled = open_crop.resize((int(ow * scale), int(oh * scale)), Image.Resampling.LANCZOS)
    
    scw, sch = closed_scaled.size
    sow, soh = open_scaled.size
    
    canvas_size = 512
    # Place base at fixed Y position (e.g. y = 475)
    base_y = 475
    
    closed_final = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    closed_x = (canvas_size - scw) // 2
    closed_y = base_y - sch
    closed_final.paste(closed_scaled, (closed_x, closed_y), closed_scaled)
    
    open_final = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    open_x = (canvas_size - sow) // 2
    open_y = base_y - soh
    open_final.paste(open_scaled, (open_x, open_y), open_scaled)
    
    # Also create shop icon (256x256)
    icon_final = closed_final.resize((256, 256), Image.Resampling.LANCZOS)
    
    os.makedirs(PUBLIC_ASSETS, exist_ok=True)
    
    closed_out = os.path.join(PUBLIC_ASSETS, 'chest_mystery.png')
    open_out = os.path.join(PUBLIC_ASSETS, 'chest_open.png')
    icon_out = os.path.join(PUBLIC_ASSETS, 'icon_chest.png')
    
    closed_final.save(closed_out, 'PNG', optimize=True)
    open_final.save(open_out, 'PNG', optimize=True)
    icon_final.save(icon_out, 'PNG', optimize=True)
    
    print(f"✅ Saved: {closed_out} ({closed_final.size})")
    print(f"✅ Saved: {open_out} ({open_final.size})")
    print(f"✅ Saved: {icon_out} ({icon_final.size})")

if __name__ == '__main__':
    main()
