import os
import cv2
import numpy as np
from PIL import Image

BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a'
PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'

INPUT_FRAMES = [
    os.path.join(BRAIN_DIR, 'luna_run_frame1_1791879575927.jpg'),
    os.path.join(BRAIN_DIR, 'luna_run_frame2_1791879726033.jpg'),
    os.path.join(BRAIN_DIR, 'luna_run_frame3_1791879859813.jpg'),
    os.path.join(BRAIN_DIR, 'luna_run_frame4_1791879894408.jpg')
]

def remove_white_bg(img_path, tol=238):
    img = Image.open(img_path).convert('RGB')
    np_img = np.array(img)
    h, w, _ = np_img.shape

    min_rgb = np.min(np_img, axis=2)
    is_white = min_rgb >= tol

    border_flood = np.zeros((h, w), dtype=np.uint8)
    visited = np.zeros((h, w), dtype=bool)

    seeds = []
    for x in range(w):
        if is_white[0, x]: seeds.append((0, x))
        if is_white[h-1, x]: seeds.append((h-1, x))
    for y in range(h):
        if is_white[y, 0]: seeds.append((y, 0))
        if is_white[y, w-1]: seeds.append((y, w-1))

    queue = []
    for y, x in seeds:
        if not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))

    head = 0
    while head < len(queue):
        cy, cx = queue[head]
        head += 1
        border_flood[cy, cx] = 255

        for dy, dx in ((-1,0), (1,0), (0,-1), (0,1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and is_white[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    alpha = np.ones((h, w), dtype=np.uint8) * 255
    alpha[border_flood == 255] = 0

    # Smooth anti-aliased edge feathering
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dilated_bg = cv2.dilate(border_flood, kernel, iterations=1)
    edge_zone = (dilated_bg == 255) & (border_flood != 255)
    for y, x in np.argwhere(edge_zone):
        val = int(min_rgb[y, x])
        if val >= 210:
            alpha[y, x] = int((1.0 - (val - 210) / 45.0) * 255)

    rgba = np.dstack([np_img, alpha])
    return Image.fromarray(rgba, 'RGBA')

def align_and_center_frames(images, target_size=(896, 1200)):
    tw, th = target_size
    aligned = []

    # Find the bounding boxes of each image
    bboxes = []
    for img in images:
        arr = np.array(img)
        alpha = arr[:, :, 3]
        pts = np.where(alpha > 20)
        if len(pts[0]) > 0:
            ymin, ymax = pts[0].min(), pts[0].max()
            xmin, xmax = pts[1].min(), pts[1].max()
            bboxes.append((xmin, ymin, xmax, ymax))
        else:
            bboxes.append((0, 0, img.width, img.height))

    # Reference bottom (foot contact line) from Frame 1
    ref_bot = bboxes[0][3]
    ref_cx = (bboxes[0][0] + bboxes[0][2]) // 2

    for img, bbox in zip(images, bboxes):
        xmin, ymin, xmax, ymax = bbox
        cx = (xmin + xmax) // 2
        # Align bottom contact line and center X
        dx = ref_cx - cx
        dy = ref_bot - ymax
        # For airborne frames (2 and 4), keep them slightly higher up naturally
        # If the original frame already placed the foot higher, dy would pull it down.
        # So we only correct X centering, and adjust Y gently:
        shift_x = dx
        shift_y = 0  # Preserve artist's vertical leap bounce

        # Create canvas of target_size
        canvas = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
        # Paste with offset
        canvas.paste(img, (shift_x, shift_y), img)
        aligned.append(canvas)

    return aligned

def shift_guardian(img):
    arr = np.array(img, dtype=np.uint8)
    alpha = arr[:, :, 3]
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)

    # Blue/cyan cape, tunic, ribbon pixels -> Royal Violet
    # Distinguish blue fabric from silver hair: fabric has saturated blue (b significantly higher than r and g)
    sat_blue = (b - np.maximum(r, g))
    mask_blue = (sat_blue > 15) & (b > 50) & (alpha > 20)
    arr[:, :, 0][mask_blue] = np.clip(b[mask_blue] * 0.95, 0, 255).astype(np.uint8) # red up -> violet
    arr[:, :, 1][mask_blue] = np.clip(g[mask_blue] * 0.35, 0, 255).astype(np.uint8) # green down
    arr[:, :, 2][mask_blue] = np.clip(b[mask_blue] * 1.15, 0, 255).astype(np.uint8) # deep royal purple

    return Image.fromarray(arr, 'RGBA')

def shift_dawn(img):
    arr = np.array(img, dtype=np.uint8)
    alpha = arr[:, :, 3]
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)

    # Blue cape/tunic -> Radiant Golden Amber
    mask_blue = (b > r) & (b > 50) & (alpha > 20)
    arr[:, :, 0][mask_blue] = np.clip(b[mask_blue] * 1.30, 0, 255).astype(np.uint8) # amber red
    arr[:, :, 1][mask_blue] = np.clip(b[mask_blue] * 0.88, 0, 255).astype(np.uint8) # amber green
    arr[:, :, 2][mask_blue] = np.clip(b[mask_blue] * 0.18, 0, 255).astype(np.uint8) # low blue

    # Silver hair highlights -> Blonde Sunlit Gold
    mask_hair = (r > 165) & (g > 165) & (b > 165) & (alpha > 20)
    arr[:, :, 0][mask_hair] = np.clip(r[mask_hair] * 1.10, 0, 255).astype(np.uint8)
    arr[:, :, 1][mask_hair] = np.clip(g[mask_hair] * 0.96, 0, 255).astype(np.uint8)
    arr[:, :, 2][mask_hair] = np.clip(b[mask_hair] * 0.45, 0, 255).astype(np.uint8)

    return Image.fromarray(arr, 'RGBA')

def main():
    print("1. Extracting transparent PNG frames...")
    raw_pngs = [remove_white_bg(p) for p in INPUT_FRAMES]

    print("2. Aligning and centering frames...")
    aligned_frames = align_and_center_frames(raw_pngs)

    # Save default costume frames (luna_run_f1.png .. luna_run_f4.png)
    for idx, f in enumerate(aligned_frames, 1):
        target_path = os.path.join(PUBLIC_ASSETS, f'luna_run_f{idx}.png')
        f.save(target_path, 'PNG')
        print(f"Saved: {target_path}")

    # Generate Guardian costume frames
    print("3. Generating Guardian costume run frames...")
    guardian_frames = [shift_guardian(f) for f in aligned_frames]
    for idx, f in enumerate(guardian_frames, 1):
        target_path = os.path.join(PUBLIC_ASSETS, f'luna_run_guardian_f{idx}.png')
        f.save(target_path, 'PNG')
        print(f"Saved: {target_path}")

    # Generate Dawn costume frames
    print("4. Generating Dawn costume run frames...")
    dawn_frames = [shift_dawn(f) for f in aligned_frames]
    for idx, f in enumerate(dawn_frames, 1):
        target_path = os.path.join(PUBLIC_ASSETS, f'luna_run_dawn_f{idx}.png')
        f.save(target_path, 'PNG')
        print(f"Saved: {target_path}")

    # Create animated GIF previews for user
    print("5. Generating animated GIF previews...")
    # Convert frames for crisp GIF output
    aligned_frames[0].save(
        os.path.join(BRAIN_DIR, 'luna_run_anim.gif'),
        save_all=True,
        append_images=aligned_frames[1:],
        duration=160,
        loop=0,
        disposal=2
    )
    guardian_frames[0].save(
        os.path.join(BRAIN_DIR, 'luna_run_guardian_anim.gif'),
        save_all=True,
        append_images=guardian_frames[1:],
        duration=160,
        loop=0,
        disposal=2
    )
    dawn_frames[0].save(
        os.path.join(BRAIN_DIR, 'luna_run_dawn_anim.gif'),
        save_all=True,
        append_images=dawn_frames[1:],
        duration=160,
        loop=0,
        disposal=2
    )
    print("All frames and animations generated successfully!")

if __name__ == '__main__':
    main()
