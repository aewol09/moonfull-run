import os
import sys
import numpy as np
from PIL import Image
import cv2

ARTIFACT_DIR = '/home/aewol/.gemini/antigravity-cli/brain/02f75fb4-6812-4f6d-900b-c1d5cd233e36'
ASSETS_DIR = '/home/aewol/moonfull_run/public/assets'

def process_image(src_path, dest_filename, tolerance=24, is_wide_barrier=False):
    print(f"Processing: {src_path} -> {dest_filename}")
    img = Image.open(src_path).convert('RGB')
    np_img = np.array(img)
    h, w, _ = np_img.shape

    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    if is_wide_barrier:
        # For the wide barrier wall, top and outer borders have black background
        # We want to remove outer black background while preserving inner glow
        # Threshold: anything strictly below tolerance on top edge
        dark_mask = (gray < tolerance).astype(np.uint8)
        visited = np.zeros((h, w), dtype=bool)
        queue = []
        for x in range(w):
            if dark_mask[0, x]:
                visited[0, x] = True
                queue.append((0, x))
            if dark_mask[h-1, x]:
                visited[h-1, x] = True
                queue.append((h-1, x))
        for y in range(h):
            if dark_mask[y, 0]:
                visited[y, 0] = True
                queue.append((y, 0))
            if dark_mask[y, w-1]:
                visited[y, w-1] = True
                queue.append((y, w-1))

        head = 0
        while head < len(queue):
            cy, cx = queue[head]
            head += 1
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w:
                    if not visited[ny, nx] and dark_mask[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))

        alpha = np.where(visited, 0, 255).astype(np.uint8)
    else:
        # Standard floodfill from outer borders for single-lane sprites
        dark_mask = (gray < tolerance).astype(np.uint8)
        visited = np.zeros((h, w), dtype=bool)
        queue = []
        for x in range(w):
            if dark_mask[0, x]:
                visited[0, x] = True
                queue.append((0, x))
            if dark_mask[h-1, x]:
                visited[h-1, x] = True
                queue.append((h-1, x))
        for y in range(h):
            if dark_mask[y, 0]:
                visited[y, 0] = True
                queue.append((y, 0))
            if dark_mask[y, w-1]:
                visited[y, w-1] = True
                queue.append((y, w-1))

        head = 0
        while head < len(queue):
            cy, cx = queue[head]
            head += 1
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                ny, nx = cy + dy, cx + dx
                if 0 <= ny < h and 0 <= nx < w:
                    if not visited[ny, nx] and dark_mask[ny, nx]:
                        visited[ny, nx] = True
                        queue.append((ny, nx))

        alpha = np.where(visited, 0, 255).astype(np.uint8)

    # Soften alpha edges slightly with a 3x3 gaussian blur for crisp rendering
    alpha_soft = cv2.GaussianBlur(alpha, (3, 3), 0)
    # Combine RGBA
    rgba = np.dstack([np_img, alpha_soft])
    res_img = Image.fromarray(rgba, 'RGBA')

    # Crop out pure transparent borders to maximize resolution
    bbox = res_img.getbbox()
    if bbox:
        res_img = res_img.crop(bbox)

    dest_path = os.path.join(ASSETS_DIR, dest_filename)
    res_img.save(dest_path, 'PNG', optimize=True)
    print(f"Saved: {dest_path} (Size: {res_img.size})")

def main():
    items = [
        ('runic_seal_barrier_wall_1792082471535.jpg', 'obs_skill_barrier.png', 28, True),
        ('obstacle_thorn_barrier_1792082469760.jpg', 'obs_vine_barrier.png', 24, False),
        ('volcanic_magma_pillar_1792082469765.jpg', 'obs_magma_pillar.png', 24, False),
        ('cosmic_void_abyssal_spire_1792082479510.jpg', 'obs_void_obelisk.png', 24, False)
    ]

    for src_file, dest_file, tol, is_wide in items:
        src_path = os.path.join(ARTIFACT_DIR, src_file)
        if not os.path.exists(src_path):
            print(f"ERROR: {src_path} not found!")
            continue
        process_image(src_path, dest_file, tolerance=tol, is_wide_barrier=is_wide)

    print("🎉 All stage obstacle assets processed successfully!")

if __name__ == '__main__':
    main()
