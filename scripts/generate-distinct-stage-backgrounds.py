#!/usr/bin/env python3
import os
import sys
import math
import urllib.request
import urllib.parse
import json
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw

BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a'
ASSETS_DIR = '/home/aewol/moonfull_run/public/assets'
RAW_CACHE = os.path.join(BRAIN_DIR, 'raw_sources')
os.makedirs(RAW_CACHE, exist_ok=True)

TARGET_W = 2048
TARGET_H = 1024

USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

import time

def download_file(url, target_path):
    if not url:
        return None
    if os.path.exists(target_path) and os.path.getsize(target_path) > 10000:
        print(f"Already cached: {target_path} ({os.path.getsize(target_path)} bytes)")
        return target_path
    time.sleep(1.0)
    print(f"Downloading: {url} -> {target_path}")
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            with open(target_path, 'wb') as f:
                f.write(data)
        print(f"Successfully downloaded {target_path} ({len(data)} bytes)")
        return target_path
    except Exception as e:
        print(f"Download failed for {url}: {e}")
        return None

def get_wikimedia_direct_url(title):
    api_url = f'https://commons.wikimedia.org/w/api.php?action=query&format=json&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&iiurlwidth=2560'
    req = urllib.request.Request(api_url, headers={'User-Agent': USER_AGENT})
    try:
        data = json.loads(urllib.request.urlopen(req, timeout=10).read().decode('utf-8'))
        for pid, p in data.get('query', {}).get('pages', {}).items():
            info = p.get('imageinfo', [{}])[0]
            return info.get('thumburl') or info.get('url')
    except Exception as e:
        print(f"Failed to get URL for {title}: {e}")
    return None

def crop_and_resize(img, target_w=TARGET_W, target_h=TARGET_H):
    # Center crop to target aspect ratio (2:1) and resize with high-quality Lanczos
    w, h = img.size
    target_aspect = target_w / target_h
    current_aspect = w / h
    
    if current_aspect > target_aspect:
        # Image is wider than target: crop sides
        new_w = int(h * target_aspect)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    else:
        # Image is taller than target: crop top/bottom with bias toward horizon (center-upper)
        new_h = int(w / target_aspect)
        top = int((h - new_h) * 0.4)
        top = max(0, min(top, h - new_h))
        img = img.crop((0, top, w, top + new_h))
        
    return img.resize((target_w, target_h), Image.Resampling.LANCZOS)

def make_seamless_horizontal(img, blend_width=120):
    """Blends left and right edges so cylindrical wrapping has no harsh seam."""
    arr = np.array(img).astype(np.float32)
    h, w, c = arr.shape
    for x in range(blend_width):
        alpha = (x / blend_width) * 0.5
        left_col = arr[:, x, :].copy()
        right_col = arr[:, w - 1 - (blend_width - 1 - x), :].copy()
        arr[:, x, :] = (1.0 - alpha) * left_col + alpha * right_col
        arr[:, w - 1 - (blend_width - 1 - x), :] = alpha * left_col + (1.0 - alpha) * right_col
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

def add_floating_particles(img, count=250, color=(160, 220, 255), size_range=(2, 6), y_range=(0.2, 0.85)):
    # Pristine photorealistic landscapes: no artificial round dots stamped on backgrounds
    return img

def apply_color_grade(img, tint_rgb, brightness=1.0, contrast=1.1, saturation=1.2):
    img = ImageEnhance.Brightness(img).enhance(brightness)
    img = ImageEnhance.Contrast(img).enhance(contrast)
    img = ImageEnhance.Color(img).enhance(saturation)
    
    arr = np.array(img).astype(np.float32)
    # Apply soft tint multiplier
    tint = np.array(tint_rgb, dtype=np.float32) / 255.0
    # Blend 65% original, 35% tinted
    tinted = arr * tint
    arr = arr * 0.65 + tinted * 0.35
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

print("Step 1: Downloading distinct high-resolution raw base images...")

# Stage 2: Misty Redwood / Evergreen Forest
s2_title = 'File:Misty pines – Panorama (Greg Zaal via Poly Haven).jpg'
s2_url = get_wikimedia_direct_url(s2_title)
s2_path = download_file(s2_url, os.path.join(RAW_CACHE, 'stage2_misty_forest.jpg'))

# Stage 3: Naica Giant Crystals
s3_title = 'File:Cristales cueva de Naica.JPG'
s3_url = get_wikimedia_direct_url(s3_title)
s3_path = download_file(s3_url, os.path.join(RAW_CACHE, 'stage3_naica_crystals.jpg'))

# Stage 4: Aurora Borealis over Fjord Mountains
s4_title = 'File:Aurora borealis above Storfjorden and the Lyngen Alps in moonlight, 2012 March.jpg'
s4_url = get_wikimedia_direct_url(s4_title)
s4_path = download_file(s4_url, os.path.join(RAW_CACHE, 'stage4_aurora_canyon.jpg'))

# Stage 6: Corvin Castle Gothic Night Fortress
s6_title = 'File:Corvin Castel.jpg'
s6_url = get_wikimedia_direct_url(s6_title)
s6_path = download_file(s6_url, os.path.join(RAW_CACHE, 'stage6_corvin_castle.jpg'))

# Stage 7: Antarctic Glacier Mountains Panorama
s7_title = 'File:0I7A4869-Pano (25698809700).jpg'
s7_url = get_wikimedia_direct_url(s7_title)
s7_path = download_file(s7_url, os.path.join(RAW_CACHE, 'stage7_antarctic_glacier.jpg'))

# Stage 9: James Webb Space Telescope Cosmic Cliffs in Carina Nebula
s9_title = 'File:“Cosmic Cliffs” in the Carina Nebula (NIRCam and MIRI Composite Image).png'
s9_url = get_wikimedia_direct_url(s9_title)
s9_path = download_file(s9_url, os.path.join(RAW_CACHE, 'stage9_webb_nebula.png'))

# Stage 10: Hubble Deep Space Colliding Galaxies
s10_title = 'File:Galaxy history revealed by the Hubble Space Telescope (GOODS-ERS2).jpg'
s10_url = get_wikimedia_direct_url(s10_title)
s10_path = download_file(s10_url, os.path.join(RAW_CACHE, 'stage10_hubble_galaxies.jpg'))

# Local Master Bases for Stage 1, 5, 8
s1_master = os.path.join(BRAIN_DIR, 'bg_stage1_1791881930372.jpg')
s5_master = os.path.join(BRAIN_DIR, 'bg_stage5_1791881930192.jpg')
s8_master = os.path.join(BRAIN_DIR, 'bg_stage8_1791881932224.jpg')

print("Step 2: Processing 10 distinct, thematic 2048x1024 cylindrical panoramas...")

stages_output = {}

# 1. Stage 1: 달빛 유적지 (Moonlit Ancient Ruins)
print("Processing Stage 1: Moonlit Ruins...")
img1 = Image.open(s1_master).convert('RGB')
img1 = crop_and_resize(img1)
img1 = apply_color_grade(img1, tint_rgb=(170, 215, 255), brightness=1.05, contrast=1.15, saturation=1.1)
img1 = add_floating_particles(img1, count=180, color=(140, 220, 255), size_range=(2, 5), y_range=(0.15, 0.75))
img1 = make_seamless_horizontal(img1)
stages_output[1] = img1

# 2. Stage 2: 별빛 안개 숲 (Starlight Misty Forest)
print("Processing Stage 2: Starlight Forest...")
img2 = Image.open(s2_path).convert('RGB')
img2 = crop_and_resize(img2)
# Emerald & cyan starlight forest grade
img2 = apply_color_grade(img2, tint_rgb=(100, 245, 180), brightness=0.92, contrast=1.2, saturation=1.35)
img2 = add_floating_particles(img2, count=320, color=(80, 255, 160), size_range=(2, 6), y_range=(0.25, 0.9))
img2 = make_seamless_horizontal(img2)
stages_output[2] = img2

# 3. Stage 3: 보랏빛 성역 (Amethyst Crystal Sanctuary)
print("Processing Stage 3: Amethyst Sanctuary...")
img3 = Image.open(s3_path).convert('RGB')
img3 = crop_and_resize(img3)
# Vibrant royal violet and magenta crystal grade
img3 = apply_color_grade(img3, tint_rgb=(215, 120, 255), brightness=1.1, contrast=1.3, saturation=1.5)
img3 = add_floating_particles(img3, count=280, color=(220, 140, 255), size_range=(2, 7), y_range=(0.2, 0.85))
img3 = make_seamless_horizontal(img3)
stages_output[3] = img3

# 4. Stage 4: 비취석 협곡 (Jade Aurora Canyon)
print("Processing Stage 4: Jade Aurora Canyon...")
img4 = Image.open(s4_path).convert('RGB')
img4 = crop_and_resize(img4)
# Turquoise & jade aurora night grade
img4 = apply_color_grade(img4, tint_rgb=(120, 240, 230), brightness=1.08, contrast=1.2, saturation=1.3)
img4 = add_floating_particles(img4, count=220, color=(100, 255, 230), size_range=(2, 5), y_range=(0.1, 0.6))
img4 = make_seamless_horizontal(img4)
stages_output[4] = img4

# 5. Stage 5: 황혼의 고대 신전 (Twilight Pantheon Temple)
print("Processing Stage 5: Twilight Temple...")
img5 = Image.open(s5_master).convert('RGB')
img5 = crop_and_resize(img5)
img5 = apply_color_grade(img5, tint_rgb=(255, 180, 110), brightness=1.05, contrast=1.15, saturation=1.2)
img5 = add_floating_particles(img5, count=200, color=(255, 210, 120), size_range=(2, 5), y_range=(0.2, 0.8))
img5 = make_seamless_horizontal(img5)
stages_output[5] = img5

# 6. Stage 6: 붉은 달의 회랑 (Crimson Moon Gothic Abbey)
print("Processing Stage 6: Crimson Moon Abbey...")
img6 = Image.open(s6_path).convert('RGB')
img6 = crop_and_resize(img6)
# Dark gothic scarlet & crimson bloodmoon grade
img6 = apply_color_grade(img6, tint_rgb=(255, 75, 75), brightness=0.9, contrast=1.35, saturation=1.45)
# Add sinister crimson embers
img6 = add_floating_particles(img6, count=300, color=(255, 80, 60), size_range=(2, 6), y_range=(0.2, 0.9))
img6 = make_seamless_horizontal(img6)
stages_output[6] = img6

# 7. Stage 7: 얼어붙은 별의 빙하 (Glacial Frost Hollow)
print("Processing Stage 7: Glacial Frost Hollow...")
img7 = Image.open(s7_path).convert('RGB')
img7 = crop_and_resize(img7)
# Polar cyan & ice blue frost grade
img7 = apply_color_grade(img7, tint_rgb=(160, 230, 255), brightness=1.12, contrast=1.2, saturation=1.1)
img7 = add_floating_particles(img7, count=350, color=(220, 245, 255), size_range=(2, 5), y_range=(0.15, 0.85))
img7 = make_seamless_horizontal(img7)
stages_output[7] = img7

# 8. Stage 8: 태양의 일식 신전 (Solar Eclipse Citadel)
print("Processing Stage 8: Solar Eclipse Citadel...")
img8 = Image.open(s8_master).convert('RGB')
img8 = crop_and_resize(img8)
img8 = apply_color_grade(img8, tint_rgb=(255, 140, 60), brightness=1.05, contrast=1.25, saturation=1.35)
img8 = add_floating_particles(img8, count=260, color=(255, 180, 50), size_range=(2, 6), y_range=(0.2, 0.85))
img8 = make_seamless_horizontal(img8)
stages_output[8] = img8

# 9. Stage 9: 공허의 심연 제단 (James Webb Cosmic Cliffs)
print("Processing Stage 9: Void Cosmic Cliffs...")
img9 = Image.open(s9_path).convert('RGB')
img9 = crop_and_resize(img9)
# Deep space indigo, violet & magenta void rift grade
img9 = apply_color_grade(img9, tint_rgb=(190, 130, 255), brightness=1.05, contrast=1.25, saturation=1.4)
img9 = add_floating_particles(img9, count=300, color=(220, 160, 255), size_range=(2, 6), y_range=(0.1, 0.85))
img9 = make_seamless_horizontal(img9)
stages_output[9] = img9

# 10. Stage 10: 끝없는 별빛의 시련 (Hubble Deep Space Galaxies)
print("Processing Stage 10: Infinite Galaxies...")
img10 = Image.open(s10_path).convert('RGB')
img10 = crop_and_resize(img10)
# Multi-color galactic starfire grade
img10 = apply_color_grade(img10, tint_rgb=(230, 170, 255), brightness=1.2, contrast=1.3, saturation=1.5)
img10 = add_floating_particles(img10, count=400, color=(255, 240, 200), size_range=(2, 6), y_range=(0.05, 0.95))
img10 = make_seamless_horizontal(img10)
stages_output[10] = img10

print("Step 3: Saving all 10 distinct panoramas to public/assets and brain directory...")
for s_num, s_img in stages_output.items():
    asset_file = os.path.join(ASSETS_DIR, f"bg_stage{s_num}.png")
    brain_file = os.path.join(BRAIN_DIR, f"bg_stage{s_num}.png")
    s_img.save(asset_file, "PNG", optimize=True)
    s_img.save(brain_file, "PNG", optimize=True)
    print(f"Saved Stage {s_num}: {asset_file} ({s_img.size})")

print("All 10 distinct stage panoramas successfully created and deployed!")
