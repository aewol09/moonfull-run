import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance

ASSETS_DIR = '/home/aewol/moonfull_run/public/assets'
BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a'

def remove_dark_bg(img_pil, tolerance=24, feather=2):
    """Accurately removes pure black/dark background using edge flood-fill."""
    np_img = np.array(img_pil.convert('RGB'))
    h, w, _ = np_img.shape
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    dark_mask = (gray < tolerance).astype(np.uint8)
    border_flood = np.zeros((h, w), dtype=np.uint8)
    visited = np.zeros((h, w), dtype=bool)

    queue = []
    for x in range(w):
        if dark_mask[0, x]: queue.append((0, x)); visited[0, x] = True
        if dark_mask[h-1, x]: queue.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if dark_mask[y, 0]: queue.append((y, 0)); visited[y, 0] = True
        if dark_mask[y, w-1]: queue.append((y, w-1)); visited[y, w-1] = True

    head = 0
    while head < len(queue):
        cy, cx = queue[head]; head += 1
        border_flood[cy, cx] = 255
        for dy, dx in ((-1,0),(1,0),(0,-1),(0,1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and dark_mask[ny, nx]:
                visited[ny, nx] = True; queue.append((ny, nx))

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dilated = cv2.dilate(border_flood, kernel, iterations=feather)
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[border_flood == 255] = 0.0
    edge_zone = (dilated == 255) & (border_flood != 255)
    for y, x in np.argwhere(edge_zone):
        val = float(gray[y, x])
        alpha[y, x] = min(255.0, max(0.0, (val / max(tolerance + 10, 1)) * 255.0))

    rgba = np.dstack([np_img, alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')

def create_running_cycle(base_img):
    """Creates a 4-frame dynamic running stride cycle, jump, and slide from a clean base back-view sprite."""
    w, h = base_img.size
    frames = {}

    frames['run_f1'] = base_img.copy()

    # Frame 2: Mid-stride airborne lift
    f2 = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    upper = base_img.crop((0, 0, w, int(h * 0.62)))
    f2.paste(upper, (0, -18), upper)
    lower = base_img.crop((0, int(h * 0.52), w, h)).resize((w, int((h - int(h * 0.52)) * 0.94)), Image.Resampling.LANCZOS)
    f2.paste(lower, (0, int(h * 0.52) - 20), lower)
    frames['run_f2'] = f2

    # Frame 3: Mirrored stride
    f3 = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    f3.paste(upper, (0, 0), upper)
    lower_flipped = base_img.crop((0, int(h * 0.50), w, h)).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    f3.paste(lower_flipped, (0, int(h * 0.50)), lower_flipped)
    frames['run_f3'] = f3

    # Frame 4: Second passing airborne leap
    f4 = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    f4.paste(upper, (0, -14), upper)
    lower_f4 = lower_flipped.resize((w, int(lower_flipped.size[1] * 0.94)), Image.Resampling.LANCZOS)
    f4.paste(lower_f4, (0, int(h * 0.50) - 16), lower_f4)
    frames['run_f4'] = f4

    # Jump: Tucked airborne leap
    jump = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    scaled_body = base_img.resize((int(w * 0.96), int(h * 0.88)), Image.Resampling.LANCZOS)
    jump.paste(scaled_body, (int(w * 0.02), int(h * 0.03)), scaled_body)
    frames['jump'] = jump

    # Slide: Low crouch dash pose
    slide = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    crouched = base_img.resize((int(w * 1.12), int(h * 0.62)), Image.Resampling.LANCZOS)
    slide.paste(crouched, (-int(w * 0.06), int(h * 0.38)), crouched)
    frames['slide'] = slide

    return frames

def build_all_sprites():
    # 1. Base Nyx
    nyx_path = os.path.join(BRAIN_DIR, 'nyx_back_run_f1_1791909543653.jpg')
    nyx_base = remove_dark_bg(Image.open(nyx_path), tolerance=22).resize((896, 1200), Image.Resampling.LANCZOS)
    for k, img in create_running_cycle(nyx_base).items():
        img.save(os.path.join(ASSETS_DIR, f'nyx_{k}.png'))

    # Nyx Cyber (Matte dark carbon + laser cyan)
    np_nyx = np.array(nyx_base)
    a_nyx = np_nyx[:, :, 3]
    hsv_nyx = cv2.cvtColor(np_nyx[:, :, :3], cv2.COLOR_RGB2HSV)
    H, S, V = hsv_nyx[:, :, 0], hsv_nyx[:, :, 1], hsv_nyx[:, :, 2]
    is_cyan = (H >= 80) & (H <= 115) & (S > 40)
    V[is_cyan] = np.clip(V[is_cyan] * 1.25, 0, 255).astype(np.uint8)
    S[is_cyan] = 255
    is_dark = (a_nyx > 40) & ~is_cyan
    V[is_dark] = np.clip(V[is_dark] * 0.75, 0, 60).astype(np.uint8)
    cyber_base = Image.fromarray(np.dstack([cv2.cvtColor(np.dstack([H, S, V]), cv2.COLOR_HSV2RGB), a_nyx]), 'RGBA')
    for k, img in create_running_cycle(cyber_base).items():
        img.save(os.path.join(ASSETS_DIR, f'nyx_cyber_{k}.png'))

    # Nyx Blood Moon (Pitch-black shinobi robes + glowing ruby red daggers & runes)
    dark_nyx = ImageEnhance.Brightness(nyx_base).enhance(0.72)
    bm_dark = ImageEnhance.Color(dark_nyx).enhance(0.4)
    np_bm = np.array(bm_dark)
    cyan_glow = (np_nyx[:, :, 1] > 70) & (np_nyx[:, :, 2] > 90) & (a_nyx > 40)
    np_bm[cyan_glow, 0] = np.clip(np_nyx[cyan_glow, 2] * 1.1 + 50, 0, 255)
    np_bm[cyan_glow, 1] = np.clip(np_nyx[cyan_glow, 1] * 0.12, 0, 35)
    np_bm[cyan_glow, 2] = np.clip(np_nyx[cyan_glow, 0] * 0.12, 0, 35)

    bm_base = Image.fromarray(np_bm, 'RGBA')
    for k, img in create_running_cycle(bm_base).items():
        img.save(os.path.join(ASSETS_DIR, f'nyx_bloodmoon_{k}.png'))

    # 2. Base Solaris
    w, h = 896, 1200
    y_grid = np.repeat(np.arange(h)[:, None], w, axis=1)
    H_sol = H.copy()
    S_sol = S.copy()
    V_sol = V.copy()

    # Spiky golden hair
    is_hair = (y_grid < 210) & (a_nyx > 40)
    H_sol[is_hair] = 22
    S_sol[is_hair] = np.clip(S_sol[is_hair] * 1.5 + 130, 0, 240).astype(np.uint8)
    V_sol[is_hair] = np.clip(V_sol[is_hair] * 1.8 + 100, 0, 255).astype(np.uint8)

    # Golden plate armor
    H_sol[is_cyan] = 24
    S_sol[is_cyan] = 230
    V_sol[is_cyan] = np.clip(V_sol[is_cyan] * 1.2, 0, 255).astype(np.uint8)

    # Crimson paladin cape
    is_cape = (y_grid >= 210) & (y_grid <= 740) & (a_nyx > 40) & ~is_cyan
    H_sol[is_cape] = 3
    S_sol[is_cape] = np.clip(S_sol[is_cape] + 140, 0, 240).astype(np.uint8)
    V_sol[is_cape] = np.clip(V_sol[is_cape] * 1.4 + 40, 0, 210).astype(np.uint8)

    # Leg greaves
    is_legs = (y_grid >= 700) & (a_nyx > 40)
    H_sol[is_legs] = 23
    S_sol[is_legs] = np.clip(S_sol[is_legs] + 80, 0, 200).astype(np.uint8)
    V_sol[is_legs] = np.clip(V_sol[is_legs] * 1.3 + 30, 0, 220).astype(np.uint8)

    sol_base = Image.fromarray(np.dstack([cv2.cvtColor(np.dstack([H_sol, S_sol, V_sol]), cv2.COLOR_HSV2RGB), a_nyx]), 'RGBA')
    for k, img in create_running_cycle(sol_base).items():
        img.save(os.path.join(ASSETS_DIR, f'solaris_{k}.png'))

    # Solaris Obsidian (Charcoal armor + fiery lava orange veins)
    dark_sol = ImageEnhance.Brightness(sol_base).enhance(0.55)
    obs_dark = ImageEnhance.Color(dark_sol).enhance(0.25)
    np_sol = np.array(sol_base)
    np_obs = np.array(obs_dark)
    bright_gold = (np_sol[:, :, 0] > 180) & (np_sol[:, :, 1] > 140) & (np_sol[:, :, 3] > 40)
    np_obs[bright_gold, 0] = np.clip(np_sol[bright_gold, 0] * 1.2, 0, 255)
    np_obs[bright_gold, 1] = np.clip(np_sol[bright_gold, 1] * 0.55, 0, 150)
    np_obs[bright_gold, 2] = 20
    obs_base = Image.fromarray(np_obs, 'RGBA')
    for k, img in create_running_cycle(obs_base).items():
        img.save(os.path.join(ASSETS_DIR, f'solaris_obsidian_{k}.png'))

    # Solaris Phoenix (Sun-gold plate & blazing crimson phoenix wings)
    phx_boost = ImageEnhance.Color(sol_base).enhance(1.4)
    np_phx = np.array(phx_boost)
    is_cape_phx = (y_grid >= 210) & (y_grid <= 740) & (a_nyx > 40)
    np_phx[is_cape_phx, 0] = np.clip(np_phx[is_cape_phx, 0] * 1.3 + 40, 0, 255)
    phx_base = Image.fromarray(np_phx, 'RGBA')
    for k, img in create_running_cycle(phx_base).items():
        img.save(os.path.join(ASSETS_DIR, f'solaris_phoenix_{k}.png'))

    # 3. Base Stella
    luna_base = Image.open('public/assets/luna_run_f1.png').convert('RGBA')
    np_luna = np.array(luna_base)
    a_luna = np_luna[:, :, 3]
    hsv_luna = cv2.cvtColor(np_luna[:, :, :3], cv2.COLOR_RGB2HSV)
    H_st, S_st, V_st = hsv_luna[:, :, 0], hsv_luna[:, :, 1], hsv_luna[:, :, 2]
    y_luna_grid = np.repeat(np.arange(h)[:, None], w, axis=1)

    # Wavy Lavender Hair
    is_hair_st = (y_luna_grid < 340) & (S_st < 65) & (V_st > 100) & (a_luna > 30)
    H_st[is_hair_st] = 145
    S_st[is_hair_st] = np.clip(S_st[is_hair_st] + 45, 0, 120).astype(np.uint8)

    # Imperial Archmage Violet Cape & Tunic
    is_blue_st = (H_st >= 95) & (H_st <= 135) & (S_st > 40) & (a_luna > 30)
    H_st[is_blue_st] = 145

    # Star-pin
    is_bow_st = is_blue_st & (y_luna_grid < 180)
    H_st[is_bow_st] = 24
    S_st[is_bow_st] = 220
    V_st[is_bow_st] = 240

    stella_base = Image.fromarray(np.dstack([cv2.cvtColor(np.dstack([H_st, S_st, V_st]), cv2.COLOR_HSV2RGB), a_luna]), 'RGBA')
    for k, img in create_running_cycle(stella_base).items():
        img.save(os.path.join(ASSETS_DIR, f'stella_{k}.png'))
        img.save(os.path.join(ASSETS_DIR, f'stella_archmage_{k}.png'))

    # Stella Chronos (Mint-green hair & emerald timekeeper robe)
    H_chr = H_st.copy()
    S_chr = S_st.copy()
    V_chr = V_st.copy()
    H_chr[is_blue_st] = 80
    S_chr[is_blue_st] = 200
    H_chr[is_hair_st] = 78
    S_chr[is_hair_st] = 80
    chr_base = Image.fromarray(np.dstack([cv2.cvtColor(np.dstack([H_chr, S_chr, V_chr]), cv2.COLOR_HSV2RGB), a_luna]), 'RGBA')
    for k, img in create_running_cycle(chr_base).items():
        img.save(os.path.join(ASSETS_DIR, f'stella_chronos_{k}.png'))

    print('All authentic character back sprites regenerated successfully!')

if __name__ == '__main__':
    build_all_sprites()
