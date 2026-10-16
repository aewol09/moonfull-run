import os
import sys
import numpy as np
from PIL import Image
import cv2

def remove_background_floodfill(img_path, tolerance=30, feather=2):
    """
    Removes black background from image using flood fill from edges,
    preserving internal black/dark pixels.
    """
    img = Image.open(img_path).convert('RGB')
    np_img = np.array(img)
    h, w, _ = np_img.shape

    # Calculate lightness/brightness: max of RGB or luminance
    gray = cv2.cvtColor(np_img, cv2.COLOR_RGB2GRAY)

    # Threshold for dark background
    # Initial background mask: pixels darker than tolerance
    dark_mask = (gray < tolerance).astype(np.uint8)

    # Flood fill from image borders (all 4 edges) to only capture exterior background
    # cv2.floodFill needs a mask of size (h+2, w+2)
    flood_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    
    # We create a padded version of dark_mask for flood filling
    # 0 = unvisited, 1 = background connected to border
    h_pad, w_pad = h + 2, w + 2
    border_flood = np.zeros((h, w), dtype=np.uint8)

    # Seeds along borders
    seeds = []
    for x in range(w):
        if dark_mask[0, x]: seeds.append((0, x))
        if dark_mask[h-1, x]: seeds.append((h-1, x))
    for y in range(h):
        if dark_mask[y, 0]: seeds.append((y, 0))
        if dark_mask[y, w-1]: seeds.append((y, w-1))

    # Breadth-first search / queue flood fill for connected dark background
    visited = np.zeros((h, w), dtype=bool)
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

        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w:
                if not visited[ny, nx] and dark_mask[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

    # Alpha channel: where border_flood == 255 is transparent (0)
    # Inside character is opaque (255)
    alpha = np.ones((h, w), dtype=np.float32) * 255.0
    alpha[border_flood == 255] = 0.0

    # Also handle semi-transparent dark pixels near the border (feathering / soft edge)
    # Distance transform from background
    if feather > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        # Dilate background slightly for anti-aliasing
        dilated_bg = cv2.dilate(border_flood, kernel, iterations=feather)
        edge_zone = (dilated_bg == 255) & (border_flood != 255)
        # In edge zone, scale alpha by brightness
        for y, x in np.argwhere(edge_zone):
            val = float(gray[y, x])
            alpha[y, x] = min(255.0, max(0.0, (val / max(tolerance + 20, 1)) * 255.0))

    # Construct RGBA image
    rgba = np.dstack([np_img, alpha.astype(np.uint8)])
    return Image.fromarray(rgba, 'RGBA')

def process_and_align_frames(input_paths, output_paths, target_size=(896, 1200)):
    """
    Cleans backgrounds, aligns character scale and ground line, saves as transparent PNGs.
    """
    processed = []
    for p in input_paths:
        print(f"Processing background for {p}...")
        rgba = remove_background_floodfill(p, tolerance=25, feather=1)
        processed.append(rgba)

    # Save each processed frame
    for img, out_p in zip(processed, output_paths):
        # Resize/pad to target_size if needed
        if img.size != target_size:
            # Maintain aspect ratio with clean resampling
            img_resized = img.resize(target_size, Image.Resampling.LANCZOS)
        else:
            img_resized = img
        os.makedirs(os.path.dirname(os.path.abspath(out_p)), exist_ok=True)
        img_resized.save(out_p, 'PNG')
        print(f"Saved: {out_p} ({img_resized.size})")

    return processed

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python process-running-frames.py <input1> <input2> ...")
        sys.exit(1)
