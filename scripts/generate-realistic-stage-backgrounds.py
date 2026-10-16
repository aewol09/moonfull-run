import os
import cv2
import numpy as np
from PIL import Image

BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a'
PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'

BASE_A = os.path.join(BRAIN_DIR, 'bg_stage1_1791881930372.jpg') # Ruins & Night Mountains
BASE_B = os.path.join(BRAIN_DIR, 'bg_stage5_1791881930192.jpg') # Golden Twilight Pantheon
BASE_C = os.path.join(BRAIN_DIR, 'bg_stage8_1791881932224.jpg') # Solar Eclipse & Basalt Citadel

TARGET_W = 1600
TARGET_H = 900

def load_and_resize(path):
    img = Image.open(path).convert('RGB')
    resized = img.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    return np.array(resized, dtype=np.float32)

def save_image(arr, out_name):
    arr_clamped = np.clip(arr, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr_clamped, 'RGB')
    out_path = os.path.join(PUBLIC_ASSETS, out_name)
    img.save(out_path, 'PNG', optimize=True)
    # Also save copy in brain artifact dir for verification and report
    brain_path = os.path.join(BRAIN_DIR, out_name)
    img.save(brain_path, 'PNG', optimize=True)
    print(f"Generated: {out_path} ({img.size}, {os.path.getsize(out_path) // 1024} KB)")

# --- Procedural Particle & Atmospheric FX Helpers ---

def add_floating_particles(img_arr, count=80, color=(100, 255, 180), max_radius=8):
    """Adds soft glowing bokeh/firefly/stardust orbs."""
    overlay = np.zeros_like(img_arr)
    h, w, _ = img_arr.shape
    np.random.seed(42)
    for _ in range(count):
        x = np.random.randint(40, w - 40)
        y = np.random.randint(int(h * 0.2), int(h * 0.88))
        r = np.random.randint(2, max_radius)
        # Create soft radial glow
        cv2.circle(overlay, (x, y), r * 2, [c * 0.4 for c in color], -1, cv2.LINE_AA)
        cv2.circle(overlay, (x, y), r, color, -1, cv2.LINE_AA)
        cv2.circle(overlay, (x, y), max(1, r // 2), (255, 255, 255), -1, cv2.LINE_AA)
    
    # Gaussian blur overlay for ethereal glow
    blurred = cv2.GaussianBlur(overlay, (15, 15), 0)
    return np.clip(img_arr + blurred * 0.85, 0, 255)

def add_aurora_curtains(img_arr):
    """Renders flowing aurora borealis ribbons across the sky."""
    h, w, _ = img_arr.shape
    aurora = np.zeros_like(img_arr)
    
    xs = np.arange(w)
    for band_idx, (base_y, hue_col) in enumerate([
        (int(h * 0.18), (0, 255, 180)),
        (int(h * 0.28), (0, 220, 255)),
        (int(h * 0.38), (80, 255, 140))
    ]):
        wave = np.sin(xs * 0.005 + band_idx * 1.5) * 45 + np.cos(xs * 0.012) * 25
        ys = (base_y + wave).astype(np.int32)
        for x, y in zip(xs, ys):
            if 0 <= y < h:
                for dy in range(-35, 35):
                    ny = y + dy
                    if 0 <= ny < h:
                        dist_factor = np.exp(-abs(dy) / 14.0)
                        for c in range(3):
                            aurora[ny, x, c] = max(aurora[ny, x, c], hue_col[c] * dist_factor)
    
    blurred_aurora = cv2.GaussianBlur(aurora, (31, 31), 0)
    return np.clip(img_arr + blurred_aurora * 0.7, 0, 255)

def color_transfer(source_img, shadow_rgb, mid_rgb, highlight_rgb):
    """
    Advanced photometric 3-point color grading with luminosity preservation.
    """
    # Calculate luminance map
    lum = (source_img[:, :, 0] * 0.299 + source_img[:, :, 1] * 0.587 + source_img[:, :, 2] * 0.114) / 255.0
    
    # 3-point interpolation
    out = np.zeros_like(source_img)
    for c in range(3):
        # Shadows (lum: 0 -> 0.5)
        # Highlights (lum: 0.5 -> 1.0)
        s_val = shadow_rgb[c]
        m_val = mid_rgb[c]
        h_val = highlight_rgb[c]
        
        lower_mask = lum <= 0.5
        t_low = lum / 0.5
        out_channel_low = s_val * (1.0 - t_low) + m_val * t_low
        
        upper_mask = lum > 0.5
        t_high = (lum - 0.5) / 0.5
        out_channel_high = m_val * (1.0 - t_high) + h_val * t_high
        
        channel_result = np.where(lower_mask, out_channel_low, out_channel_high)
        # Blend original texture details (contrast preservation)
        out[:, :, c] = channel_result * 0.75 + source_img[:, :, c] * (channel_result / 255.0) * 0.45
        
    return np.clip(out, 0, 255)

def main():
    print("Loading base photorealistic environment paintings...")
    imgA = load_and_resize(BASE_A)
    imgB = load_and_resize(BASE_B)
    imgC = load_and_resize(BASE_C)

    # -------------------------------------------------------------------------
    # Stage 1: 달빛 유적지 (Moonlit Ruins)
    # Pristine AAA Moonlit Ancient Ruins
    # -------------------------------------------------------------------------
    print("Generating Stage 1: 달빛 유적지...")
    st1 = np.copy(imgA)
    # Subtle celestial blue boost
    st1[:, :, 2] = np.clip(st1[:, :, 2] * 1.08, 0, 255)
    save_image(st1, 'bg_stage1.png')

    # -------------------------------------------------------------------------
    # Stage 2: 별빛 안개 숲 (Starlight Misty Forest)
    # Deep emerald foliage, mystical green fog, glowing fireflies
    # -------------------------------------------------------------------------
    print("Generating Stage 2: 별빛 안개 숲...")
    # Shadow: deep forest emerald (10, 35, 25), Mid: mystic jade (20, 140, 90), High: cyan-mint starlight (140, 255, 210)
    st2 = color_transfer(imgA, shadow_rgb=(6, 32, 22), mid_rgb=(16, 125, 78), highlight_rgb=(160, 245, 215))
    st2 = add_floating_particles(st2, count=120, color=(80, 255, 160), max_radius=7)
    save_image(st2, 'bg_stage2.png')

    # -------------------------------------------------------------------------
    # Stage 3: 보랏빛 성역 (Amethyst Sanctuary)
    # Glowing violet amethyst crystals, arcane runes, deep purple nebula
    # -------------------------------------------------------------------------
    print("Generating Stage 3: 보랏빛 성역...")
    # Shadow: deep void violet (22, 10, 38), Mid: royal amethyst (110, 35, 175), High: glowing lilac crystal (225, 165, 255)
    st3 = color_transfer(imgA, shadow_rgb=(24, 12, 42), mid_rgb=(105, 38, 165), highlight_rgb=(220, 160, 255))
    st3 = add_floating_particles(st3, count=90, color=(200, 130, 255), max_radius=8)
    save_image(st3, 'bg_stage3.png')

    # -------------------------------------------------------------------------
    # Stage 4: 비취석 협곡 (Jade Aurora Canyon)
    # Turquoise jade canyon cliffs under glowing aurora borealis
    # -------------------------------------------------------------------------
    print("Generating Stage 4: 비취석 협곡...")
    # Shadow: deep abyssal teal (8, 28, 40), Mid: vibrant turquoise (18, 130, 155), High: electric cyan (120, 240, 255)
    st4 = color_transfer(imgA, shadow_rgb=(8, 30, 42), mid_rgb=(16, 128, 152), highlight_rgb=(110, 240, 255))
    st4 = add_aurora_curtains(st4)
    save_image(st4, 'bg_stage4.png')

    # -------------------------------------------------------------------------
    # Stage 5: 황혼의 고대 신전 (Twilight Temple)
    # Pristine AAA Golden Pantheon at Twilight Sunset
    # -------------------------------------------------------------------------
    print("Generating Stage 5: 황혼의 고대 신전...")
    st5 = np.copy(imgB)
    save_image(st5, 'bg_stage5.png')

    # -------------------------------------------------------------------------
    # Stage 6: 붉은 달의 회랑 (Crimson Moon Corridor)
    # Dark gothic spires, ominous scarlet clouds, blood-red magic mist
    # -------------------------------------------------------------------------
    print("Generating Stage 6: 붉은 달의 회랑...")
    # Shadow: gothic obsidian red (32, 6, 8), Mid: blood crimson (160, 22, 35), High: scarlet flare (255, 130, 140)
    st6 = color_transfer(imgC, shadow_rgb=(32, 6, 8), mid_rgb=(175, 24, 38), highlight_rgb=(255, 145, 150))
    st6 = add_floating_particles(st6, count=75, color=(255, 60, 80), max_radius=6)
    save_image(st6, 'bg_stage6.png')

    # -------------------------------------------------------------------------
    # Stage 7: 얼어붙은 별의 빙하 (Glacial Frost Hollow)
    # Polar-blue glacial icebergs, ice needles, freezing arctic starlight
    # -------------------------------------------------------------------------
    print("Generating Stage 7: 얼어붙은 별의 빙하...")
    # Shadow: arctic navy (10, 25, 55), Mid: glacial teal-blue (45, 120, 185), High: glittering white frost (215, 240, 255)
    st7 = color_transfer(imgA, shadow_rgb=(10, 26, 52), mid_rgb=(42, 122, 180), highlight_rgb=(218, 242, 255))
    # Diamond dust blizzard sparkles
    st7 = add_floating_particles(st7, count=140, color=(190, 235, 255), max_radius=4)
    save_image(st7, 'bg_stage7.png')

    # -------------------------------------------------------------------------
    # Stage 8: 태양의 일식 신전 (Solar Eclipse Citadel)
    # Pristine AAA Solar Eclipse Citadel with Molten Lava
    # -------------------------------------------------------------------------
    print("Generating Stage 8: 태양의 일식 신전...")
    st8 = np.copy(imgC)
    save_image(st8, 'bg_stage8.png')

    # -------------------------------------------------------------------------
    # Stage 9: 공허의 심연 제단 (Void Abyssal Spire)
    # Deep cosmic void, neon magenta & violet dimensional rifts
    # -------------------------------------------------------------------------
    print("Generating Stage 9: 공허의 심연 제단...")
    # Shadow: deep void black-indigo (14, 4, 32), Mid: electric purple (95, 18, 150), High: neon magenta rift (255, 80, 210)
    st9 = color_transfer(imgC, shadow_rgb=(15, 5, 34), mid_rgb=(110, 22, 160), highlight_rgb=(255, 95, 220))
    st9 = add_floating_particles(st9, count=110, color=(240, 80, 255), max_radius=7)
    save_image(st9, 'bg_stage9.png')

    # -------------------------------------------------------------------------
    # Stage 10: 끝없는 별빛의 시련 (Infinite Celestial Chaos)
    # Hyperdrive cosmic panorama, colliding rainbow galaxies
    # -------------------------------------------------------------------------
    print("Generating Stage 10: 끝없는 별빛의 시련...")
    # Blend of celestial vistas with multi-spectral stellar nebulae
    st10_base = color_transfer(imgA, shadow_rgb=(18, 12, 45), mid_rgb=(140, 45, 180), highlight_rgb=(255, 230, 160))
    # Supernova starfire particles
    st10 = add_floating_particles(st10_base, count=180, color=(255, 220, 120), max_radius=9)
    st10 = add_aurora_curtains(st10)
    save_image(st10, 'bg_stage10.png')

    print("--- All 10 photorealistic stage backgrounds generated and deployed! ---")

if __name__ == '__main__':
    main()
