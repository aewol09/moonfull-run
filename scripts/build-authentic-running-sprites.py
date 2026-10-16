import os
import cv2
import numpy as np
from PIL import Image

BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36'
PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'

def remove_dark_bg_border_only(img_pil, tolerance=4):
    """Accurately removes pure black background from image borders without bleeding into dark suits."""
    np_img = np.array(img_pil.convert('RGB'))
    h, w, _ = np_img.shape
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    dark_mask = (gray <= tolerance).astype(np.uint8)
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

    # Clean bottom edge compression artifacts
    for y in range(h - 4, h):
        for x in range(w):
            if gray[y, x] <= tolerance + 4:
                border_flood[y, x] = 255

    alpha = np.ones((h, w), dtype=np.uint8) * 255
    alpha[border_flood == 255] = 0

    rgba = np.dstack([np_img, alpha])
    return Image.fromarray(rgba, 'RGBA')

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

def remove_white_bg(img_pil, tolerance=242):
    """Accurately removes pure white/light background using edge flood-fill."""
    np_img = np.array(img_pil.convert('RGB'))
    h, w, _ = np_img.shape
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    white_mask = (gray > tolerance).astype(np.uint8)
    border_flood = np.zeros((h, w), dtype=np.uint8)
    visited = np.zeros((h, w), dtype=bool)
    queue = []
    for x in range(w):
        if white_mask[0, x]: queue.append((0, x)); visited[0, x] = True
        if white_mask[h-1, x]: queue.append((h-1, x)); visited[h-1, x] = True
    for y in range(h):
        if white_mask[y, 0]: queue.append((y, 0)); visited[y, 0] = True
        if white_mask[y, w-1]: queue.append((y, w-1)); visited[y, w-1] = True

    head = 0
    while head < len(queue):
        cy, cx = queue[head]; head += 1
        border_flood[cy, cx] = 255
        for dy, dx in ((-1,0),(1,0),(0,-1),(0,1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and white_mask[ny, nx]:
                visited[ny, nx] = True; queue.append((ny, nx))

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dilated = cv2.dilate(border_flood, kernel, iterations=2)
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[border_flood == 255] = 0.0
    edge_zone = (dilated == 255) & (border_flood != 255)
    for y, x in np.argwhere(edge_zone):
        val = float(gray[y, x])
        alpha[y, x] = min(255.0, max(0.0, ((255.0 - val) / max(255.0 - tolerance, 1)) * 255.0))

    rgba = np.dstack([np_img, alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')

def align_image(img, target_size=(896, 1200), ref_center_x=448, ref_bottom_y=1120):
    """Aligns character horizontally centered and grounded."""
    arr = np.array(img)
    alpha = arr[:, :, 3]
    pts = np.where(alpha > 30)
    if len(pts[0]) == 0:
        return img.resize(target_size, Image.Resampling.LANCZOS)

    ymin, ymax = pts[0].min(), pts[0].max()
    xmin, xmax = pts[1].min(), pts[1].max()
    cx = (xmin + xmax) // 2

    dx = ref_center_x - cx
    dy = ref_bottom_y - ymax

    aligned = Image.new('RGBA', target_size, (0, 0, 0, 0))
    aligned.paste(img, (dx, dy), img)
    return aligned

def make_push_off_frame(base_img, target_size=(896, 1200), bounce_y=-14):
    """
    Creates an authentic athletic push-off / airborne rise frame without slicing or blending.
    Character is lifted slightly and has subtle athletic stride stretch.
    """
    w, h = target_size
    stretched = base_img.resize((int(w * 0.985), int(h * 1.015)), Image.Resampling.LANCZOS)
    frame = Image.new('RGBA', target_size, (0, 0, 0, 0))
    offset_x = (w - stretched.width) // 2
    offset_y = (h - stretched.height) // 2 + bounce_y
    frame.paste(stretched, (offset_x, offset_y), stretched)
    return frame

def make_jump_and_slide(base_img, target_size=(896, 1200)):
    w, h = target_size
    jump = Image.new('RGBA', target_size, (0, 0, 0, 0))
    scaled_jump = base_img.resize((int(w * 0.95), int(h * 0.88)), Image.Resampling.LANCZOS)
    jump.paste(scaled_jump, (int(w * 0.025), int(h * 0.04)), scaled_jump)

    slide = Image.new('RGBA', target_size, (0, 0, 0, 0))
    scaled_slide = base_img.resize((int(w * 1.15), int(h * 0.58)), Image.Resampling.LANCZOS)
    slide.paste(scaled_slide, (-int(w * 0.075), int(h * 0.42)), scaled_slide)

    return jump, slide

# Palette transformation helpers for costumes
def transform_hsv(img_rgba, transform_fn):
    np_rgba = np.array(img_rgba.convert('RGBA'))
    r, g, b, a = np_rgba[:, :, 0], np_rgba[:, :, 1], np_rgba[:, :, 2], np_rgba[:, :, 3]
    bgr = cv2.merge([b, g, r])
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(np.float32)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    h_len, w_len = r.shape
    y_coords, x_coords = np.mgrid[0:h_len, 0:w_len]

    H, S, V = transform_fn(H, S, V, a, y_coords, x_coords, h_len, w_len)

    hsv_out = cv2.merge([
        np.clip(H, 0, 179).astype(np.uint8),
        np.clip(S, 0, 255).astype(np.uint8),
        np.clip(V, 0, 255).astype(np.uint8)
    ])
    bgr_out = cv2.cvtColor(hsv_out, cv2.COLOR_HSV2BGR)
    ob, og, or_ = cv2.split(bgr_out)
    return Image.fromarray(np.dstack([or_, og, ob, a]), 'RGBA')

def build_character_sets():
    print("🚀 Building authentic, natural running stride sprites for all heroes...")

    # ----------------------------------------------------
    # 1. SOLARIS (Paladin Knight)
    # ----------------------------------------------------
    print("Building Solaris...")
    solaris_f1_src = os.path.join(BRAIN_DIR, 'solaris_back_run_1791960446377.jpg')
    solaris_f3_src = os.path.join(BRAIN_DIR, 'solaris_run_opposite_stride_png_1791960516410.jpg')

    sol_f1_clean = align_image(remove_dark_bg(Image.open(solaris_f1_src), tolerance=20))
    sol_f3_clean = align_image(remove_dark_bg(Image.open(solaris_f3_src), tolerance=20))
    sol_f2_clean = make_push_off_frame(sol_f1_clean, bounce_y=-14)
    sol_f4_clean = make_push_off_frame(sol_f3_clean, bounce_y=-14)
    sol_jump, sol_slide = make_jump_and_slide(sol_f1_clean)

    solaris_base_frames = {
        'run_f1': sol_f1_clean,
        'run_f2': sol_f2_clean,
        'run_f3': sol_f3_clean,
        'run_f4': sol_f4_clean,
        'jump': sol_jump,
        'slide': sol_slide
    }

    # Save Solaris Default
    for k, img in solaris_base_frames.items():
        img.save(os.path.join(PUBLIC_ASSETS, f'solaris_{k}.png'))

    # Solaris Obsidian Costume (Charcoal Magma Armor, Molten Orange Cape/Trim)
    def solaris_obsidian_hsv(H, S, V, a, y, x, h, w):
        vis = (a > 50)
        cape = vis & ((H >= 165) | (H <= 8)) & (S > 80)
        hair = vis & (H >= 10) & (H <= 35) & (S > 60) & (y < h * 0.32)
        gold_armor = vis & (H >= 8) & (H <= 40) & (S > 45) & ~hair & ~cape
        white_cloth = vis & (S <= 45) & (V > 120) & ~hair

        # Hair -> pure obsidian black
        S[hair] = 20
        V[hair] = np.clip(V[hair] * 0.25, 15, 55)

        # Cape -> dark obsidian charcoal
        H[cape] = 8
        S[cape] = 90
        V[cape] = np.clip(V[cape] * 0.35, 15, 65)

        # White cloth -> dark charcoal trousers
        S[white_cloth] = 15
        V[white_cloth] = np.clip(V[white_cloth] * 0.22, 18, 55)

        # Armor -> dark charcoal obsidian steel with glowing molten orange sun crest & edges
        crest = gold_armor & (V > 185)
        plates = gold_armor & ~crest
        H[crest] = 12
        S[crest] = 255
        V[crest] = 255
        S[plates] = np.clip(S[plates] * 0.25, 10, 45)
        V[plates] = np.clip(V[plates] * 0.32, 20, 75)
        return H, S, V

    # Solaris Phoenix Costume (Fiery Blazing Wing Cape & Gold Phoenix Armor)
    def solaris_phoenix_hsv(H, S, V, a, y, x, h, w):
        vis = (a > 50)
        cape = vis & ((H >= 165) | (H <= 8)) & (S > 80)
        hair = vis & (H >= 10) & (H <= 35) & (S > 60) & (y < h * 0.32)
        gold_armor = vis & (H >= 8) & (H <= 40) & (S > 45) & ~hair & ~cape

        # Hair -> flame orange
        H[hair] = 12
        S[hair] = 230
        V[hair] = np.clip(V[hair] * 1.1, 140, 255)

        # Cape -> blazing crimson scarlet
        H[cape] = 176
        S[cape] = 240
        V[cape] = np.clip(V[cape] * 1.15, 110, 255)

        # Armor -> glowing amber gold with rich fiery saturation
        H[gold_armor] = 19
        S[gold_armor] = 250
        V[gold_armor] = np.clip(V[gold_armor] * 1.15, 100, 255)
        return H, S, V

    for k, img in solaris_base_frames.items():
        obs_img = transform_hsv(img, solaris_obsidian_hsv)
        obs_img.save(os.path.join(PUBLIC_ASSETS, f'solaris_obsidian_{k}.png'))

        phx_img = transform_hsv(img, solaris_phoenix_hsv)
        phx_img.save(os.path.join(PUBLIC_ASSETS, f'solaris_phoenix_{k}.png'))

    # ----------------------------------------------------
    # 2. NYX (Phantom Shadow Assassin)
    # ----------------------------------------------------
    print("Building Nyx...")
    nyx_f1_src = os.path.join(BRAIN_DIR, 'nyx_running_backview_black_bg_1791960468626.jpg')
    nyx_f3_src = os.path.join(BRAIN_DIR, 'nyx_run_stride_2_1791960443875.jpg')

    nyx_f1_clean = align_image(remove_dark_bg_border_only(Image.open(nyx_f1_src), tolerance=4))
    nyx_f3_clean = align_image(remove_dark_bg_border_only(Image.open(nyx_f3_src), tolerance=4))
    nyx_f2_clean = make_push_off_frame(nyx_f1_clean, bounce_y=-14)
    nyx_f4_clean = make_push_off_frame(nyx_f3_clean, bounce_y=-14)
    nyx_jump, nyx_slide = make_jump_and_slide(nyx_f1_clean)

    nyx_base_frames = {
        'run_f1': nyx_f1_clean,
        'run_f2': nyx_f2_clean,
        'run_f3': nyx_f3_clean,
        'run_f4': nyx_f4_clean,
        'jump': nyx_jump,
        'slide': nyx_slide
    }

    # Save Nyx Default
    for k, img in nyx_base_frames.items():
        img.save(os.path.join(PUBLIC_ASSETS, f'nyx_{k}.png'))

    # Nyx Cyber Costume (Neon Cyan Circuitry Lines & Carbon Fiber Matte)
    def nyx_cyber_hsv(H, S, V, a, y, x, h, w):
        scarf_mask = (H >= 75) & (H <= 110) & (S > 50) & (a > 50)
        H[scarf_mask] = 88 # Neon Cyan
        S[scarf_mask] = 255
        V[scarf_mask] = np.clip(V[scarf_mask] * 1.35, 80, 255)
        suit_mask = (S < 40) & (V < 110) & (a > 50)
        V[suit_mask] = np.clip(V[suit_mask] * 0.85, 12, 60)
        return H, S, V

    # Nyx Bloodmoon Costume (Crimson Shadow Assassin & Blood Scarf)
    def nyx_bloodmoon_hsv(H, S, V, a, y, x, h, w):
        scarf_mask = (H >= 75) & (H <= 110) & (S > 40) & (a > 50)
        H[scarf_mask] = 178 # Blood red
        S[scarf_mask] = 245
        V[scarf_mask] = np.clip(V[scarf_mask] * 1.25, 70, 255)
        suit_mask = (S < 40) & (V < 120) & (a > 50)
        H[suit_mask] = 175
        S[suit_mask] = np.clip(S[suit_mask] + 35, 30, 80)
        V[suit_mask] = np.clip(V[suit_mask] * 0.9, 15, 65)
        return H, S, V

    for k, img in nyx_base_frames.items():
        cyb_img = transform_hsv(img, nyx_cyber_hsv)
        cyb_img.save(os.path.join(PUBLIC_ASSETS, f'nyx_cyber_{k}.png'))

        bld_img = transform_hsv(img, nyx_bloodmoon_hsv)
        bld_img.save(os.path.join(PUBLIC_ASSETS, f'nyx_bloodmoon_{k}.png'))

    # ----------------------------------------------------
    # 3. STELLA (Starlight Mage)
    # ----------------------------------------------------
    print("Building Stella...")
    stella_f1_src = os.path.join(BRAIN_DIR, 'stella_run_back_view_black_bg_1791960474679.jpg')
    stella_f3_src = os.path.join(BRAIN_DIR, 'stella_run_stride2_solid_black_1791960506360.jpg')

    stella_f1_clean = align_image(remove_dark_bg(Image.open(stella_f1_src), tolerance=20))
    stella_f3_clean = align_image(remove_dark_bg(Image.open(stella_f3_src), tolerance=20))
    stella_f2_clean = make_push_off_frame(stella_f1_clean, bounce_y=-14)
    stella_f4_clean = make_push_off_frame(stella_f3_clean, bounce_y=-14)
    stella_jump, stella_slide = make_jump_and_slide(stella_f1_clean)

    stella_base_frames = {
        'run_f1': stella_f1_clean,
        'run_f2': stella_f2_clean,
        'run_f3': stella_f3_clean,
        'run_f4': stella_f4_clean,
        'jump': stella_jump,
        'slide': stella_slide
    }

    # Save Stella Default
    for k, img in stella_base_frames.items():
        img.save(os.path.join(PUBLIC_ASSETS, f'stella_{k}.png'))

    # Stella Archmage Costume (Deep Midnight Velvet & Royal Gold Constellations)
    def stella_archmage_hsv(H, S, V, a, y, x, h, w):
        robe_mask = (H >= 120) & (H <= 165) & (S > 40) & (a > 50)
        H[robe_mask] = 135
        S[robe_mask] = np.clip(S[robe_mask] * 1.3, 140, 255)
        V[robe_mask] = np.clip(V[robe_mask] * 0.75, 20, 160)
        return H, S, V

    # Stella Chronos Costume (Emerald Time Weaver & Gold Gear Crests)
    def stella_chronos_hsv(H, S, V, a, y, x, h, w):
        robe_mask = (H >= 120) & (H <= 165) & (S > 40) & (a > 50)
        H[robe_mask] = 78 # emerald / teal
        S[robe_mask] = np.clip(S[robe_mask] * 1.25, 120, 240)
        V[robe_mask] = np.clip(V[robe_mask] * 0.9, 30, 200)
        return H, S, V

    for k, img in stella_base_frames.items():
        arc_img = transform_hsv(img, stella_archmage_hsv)
        arc_img.save(os.path.join(PUBLIC_ASSETS, f'stella_archmage_{k}.png'))

        chr_img = transform_hsv(img, stella_chronos_hsv)
        chr_img.save(os.path.join(PUBLIC_ASSETS, f'stella_chronos_{k}.png'))

    # ----------------------------------------------------
    # 4. LUNA (Silver Starlight Runner)
    # ----------------------------------------------------
    print("Building Luna...")
    luna_f1_src = os.path.join(BRAIN_DIR, 'luna_running_back_view_black_bg_1791960194346.jpg')
    luna_f3_src = os.path.join(BRAIN_DIR, 'luna_run_stride_black_bg_1791960499395.jpg')

    luna_f1_clean = align_image(remove_dark_bg(Image.open(luna_f1_src), tolerance=20))
    luna_f3_clean = align_image(remove_white_bg(Image.open(luna_f3_src), tolerance=242))
    luna_f2_clean = make_push_off_frame(luna_f1_clean, bounce_y=-14)
    luna_f4_clean = make_push_off_frame(luna_f3_clean, bounce_y=-14)
    luna_jump, luna_slide = make_jump_and_slide(luna_f1_clean)

    luna_base_frames = {
        'run_f1': luna_f1_clean,
        'run_f2': luna_f2_clean,
        'run_f3': luna_f3_clean,
        'run_f4': luna_f4_clean,
        'jump': luna_jump,
        'slide': luna_slide
    }

    # Save Luna Default
    for k, img in luna_base_frames.items():
        img.save(os.path.join(PUBLIC_ASSETS, f'luna_{k}.png'))

    # Luna Guardian Costume (Deep Violet Royal Cape & Silver Armor)
    def luna_guardian_hsv(H, S, V, a, y, x, h, w):
        blue_mask = (H >= 100) & (H <= 135) & (S > 50) & (a > 50)
        H[blue_mask] = 142 # Royal violet/purple
        S[blue_mask] = np.clip(S[blue_mask] * 1.25, 120, 255)
        V[blue_mask] = np.clip(V[blue_mask] * 0.85, 30, 180)
        return H, S, V

    # Luna Dawn Costume (Golden Dawn Cape & White Gold Armor)
    def luna_dawn_hsv(H, S, V, a, y, x, h, w):
        blue_mask = (H >= 100) & (H <= 135) & (S > 50) & (a > 50)
        H[blue_mask] = 20 # Warm Golden Amber
        S[blue_mask] = 230
        V[blue_mask] = np.clip(V[blue_mask] * 1.35, 90, 255)
        return H, S, V

    for k, img in luna_base_frames.items():
        grd_img = transform_hsv(img, luna_guardian_hsv)
        grd_img.save(os.path.join(PUBLIC_ASSETS, f'luna_guardian_{k}.png'))

        dwn_img = transform_hsv(img, luna_dawn_hsv)
        dwn_img.save(os.path.join(PUBLIC_ASSETS, f'luna_dawn_{k}.png'))

    print("✅ All 4 Heroes' authentic, natural running stride sprites built successfully!")

if __name__ == '__main__':
    build_character_sets()
