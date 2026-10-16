import cv2
import numpy as np
import os
from PIL import Image

BRAIN_DIR = '/home/aewol/.gemini/antigravity-cli/brain/29f39f5e-6880-496d-8559-8facfd6b177a'
OUTPUT_DIR = '/home/aewol/moonfull_run/public/assets'

ASSETS = [
    {
        'src': os.path.join(BRAIN_DIR, 'solaris_anime_front_black_1791900179010.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'solaris_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'solaris_obsidian_anime_front_1791900454700.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'solaris_obsidian_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'solaris_phoenix_anime_front_1791900459261.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'solaris_phoenix_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'nyx_anime_front_1791900284056.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'nyx_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'nyx_cyber_anime_front_1791900457376.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'nyx_cyber_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'nyx_bloodmoon_anime_front_1791900456025.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'nyx_bloodmoon_front.png'),
        'bg': 'white',
        'thresh': 235,
        'crop_ground': True
    },
    {
        'src': os.path.join(BRAIN_DIR, 'stella_archmage_anime_front_pitch_black_1791900390409.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'stella_archmage_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': False
    },
    {
        'src': os.path.join(BRAIN_DIR, 'stella_chronos_anime_front_1791900287535.jpg'),
        'out': os.path.join(OUTPUT_DIR, 'stella_chronos_front.png'),
        'bg': 'black',
        'thresh': 18,
        'crop_ground': False,
        'allow_large_interior': True
    }
]

def process_image(item):
    src = item['src']
    out = item['out']
    bg_type = item['bg']
    thresh = item['thresh']
    crop_ground = item.get('crop_ground', False)

    if not os.path.exists(src):
        print(f"File not found: {src}")
        return

    img = cv2.imread(src)
    h, w = img.shape[:2]

    if bg_type == 'black':
        max_val = np.max(img, axis=2)
        is_bg_candidate = (max_val <= thresh).astype(np.uint8)
    else:  # white
        min_val = np.min(img, axis=2)
        is_bg_candidate = (min_val >= thresh).astype(np.uint8)

    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(is_bg_candidate)
    
    border_labels = set()
    border_labels.update(labels[0, :])
    border_labels.update(labels[-1, :])
    border_labels.update(labels[:, 0])
    border_labels.update(labels[:, -1])

    bg_mask = np.zeros((h, w), dtype=bool)
    allow_interior = item.get('allow_large_interior', False)
    for lbl in border_labels:
        bg_mask[labels == lbl] = True

    if allow_interior:
        for lbl in range(1, num_labels):
            if lbl not in border_labels:
                area = stats[lbl, cv2.CC_STAT_AREA]
                if area >= 1500:
                    bg_mask[labels == lbl] = True

    if crop_ground:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        for y in range(int(h * 0.95), h):
            for x in range(w):
                if bg_type == 'black' and gray[y, x] < 55:
                    bg_mask[y, x] = True
                elif bg_type == 'white' and gray[y, x] > 210:
                    bg_mask[y, x] = True

    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)

    # Anti-alias feathering
    dist = cv2.distanceTransform((~bg_mask).astype(np.uint8), cv2.DIST_L2, 3)
    feather = np.clip(dist * 120, 0, 255).astype(np.uint8)
    final_alpha = np.minimum(alpha, feather)

    # Convert to RGBA
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    rgba = np.dstack((rgb, final_alpha))

    if w != 896 or h != 1200:
        rgba = cv2.resize(rgba, (896, 1200), interpolation=cv2.INTER_LANCZOS4)

    out_img = Image.fromarray(rgba)
    out_img.save(out)
    print(f"Processed: {os.path.basename(out)} ({rgba.shape[1]}x{rgba.shape[0]})")

def main():
    print("--- Processing All 8 Hero and Costume Anime Illustrations ---")
    for item in ASSETS:
        process_image(item)
    print("All illustrations successfully processed!")

if __name__ == '__main__':
    main()
