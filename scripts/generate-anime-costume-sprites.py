import cv2
import numpy as np
import os

PUBLIC_ASSETS = '/home/aewol/moonfull_run/public/assets'
ACTIONS = ['run_f1', 'run_f2', 'run_f3', 'run_f4', 'jump', 'slide']

def get_base_image(action):
    path = os.path.join(PUBLIC_ASSETS, f'luna_{action}.png')
    if not os.path.exists(path):
        path = os.path.join(PUBLIC_ASSETS, 'luna_run_f1.png')
    return cv2.imread(path, cv2.IMREAD_UNCHANGED)

def transform_character_action(base_rgba, char_id, costume_id):
    img = base_rgba.copy()
    b, g, r, a = cv2.split(img)
    h_len, w_len = b.shape
    y_coords, x_coords = np.mgrid[0:h_len, 0:w_len]

    # Convert to HSV
    rgb = cv2.merge([b, g, r])
    hsv = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV).astype(np.float32)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    # Region segmentations
    # 1. Blue cape / tunic / ribbon: H in [95, 140], S > 40
    blue_mask = (H >= 95) & (H <= 140) & (S > 40) & (a > 50)
    
    # 2. Silver Hair: low saturation S < 45, high value V > 110, y in upper 65%
    hair_mask = (S < 45) & (V > 110) & (y_coords < h_len * 0.65) & (a > 50) & (~blue_mask)
    
    # 3. Gold Trim / Armor / Buckles: H in [15, 45], S > 50, V > 100
    gold_mask = (H >= 15) & (H <= 45) & (S > 50) & (V > 100) & (a > 50)
    
    # 4. Boots & Leather: H in [5, 25], S > 30, V in [30, 140]
    leather_mask = (H >= 5) & (H <= 25) & (S > 30) & (V >= 30) & (V <= 140) & (a > 50) & (y_coords > h_len * 0.4)
    
    # 5. Stockings / Legs:
    stocking_mask = (y_coords > h_len * 0.48) & (y_coords < h_len * 0.78) & (x_coords > 360) & (x_coords < 560) & (S < 40) & (V > 150) & (a > 180)

    # 6. Cosmic Stardust trail at feet (isolated strictly to the starry sparkle cloud)
    dust_mask = (y_coords > h_len * 0.6) & (a > 20) & (~stocking_mask) & (~leather_mask) & ((V < 75) | ((H >= 90) & (H <= 145) & (S > 30)))

    # 7. Head ribbon (Luna's blue bow) & Leg skin
    head_ribbon = blue_mask & (y_coords < 310)
    skin_mask = (H >= 0) & (H <= 25) & (S >= 15) & (S <= 100) & (V > 160) & (a > 100) & (y_coords > 520) & (y_coords < 850)

    if char_id == 'solaris':
        if costume_id == 'solaris_default':
            # Blond hair, crimson cape, brilliant gold trim, white trousers, golden dust
            H[hair_mask] = 22
            S[hair_mask] = np.clip(S[hair_mask] * 3.5 + 110, 0, 220)
            V[hair_mask] = np.clip(V[hair_mask] * 1.05, 0, 255)

            # Cape & Tunic (excluding head ribbon)
            cape_tunic = blue_mask & (~head_ribbon)
            H[cape_tunic] = 178
            S[cape_tunic] = np.clip(S[cape_tunic] * 1.35, 150, 255)
            V[cape_tunic] = np.clip(V[cape_tunic] * 1.1, 80, 240)

            # Head: replace ribbon with golden hair
            H[head_ribbon] = 22
            S[head_ribbon] = 180
            V[head_ribbon] = 225

            H[gold_mask] = 24
            S[gold_mask] = 245
            V[gold_mask] = np.clip(V[gold_mask] * 1.15, 0, 255)

            # Trousers & Legs: knight plate white/gold armor
            S[stocking_mask] = 15
            V[stocking_mask] = 240
            S[skin_mask] = 15
            V[skin_mask] = 240

            # Dust: warm golden sunburst
            H[dust_mask] = 22
            S[dust_mask] = 240
            V[dust_mask] = np.clip(V[dust_mask] * 1.2, 0, 255)

        elif costume_id == 'solaris_obsidian':
            H[hair_mask] = 15
            S[hair_mask] = 20
            V[hair_mask] = np.clip(V[hair_mask] * 0.35, 15, 60)

            cape_tunic = blue_mask & (~head_ribbon)
            H[cape_tunic] = 2
            S[cape_tunic] = 200
            V[cape_tunic] = np.clip(V[cape_tunic] * 0.45, 20, 100)

            H[head_ribbon] = 15
            S[head_ribbon] = 25
            V[head_ribbon] = 45

            H[gold_mask] = 14
            S[gold_mask] = 255
            V[gold_mask] = 255

            V[leather_mask] = np.clip(V[leather_mask] * 0.35, 10, 50)
            S[stocking_mask] = 20
            V[stocking_mask] = 35
            S[skin_mask] = 20
            V[skin_mask] = 35

            H[dust_mask] = 14
            S[dust_mask] = 255
            V[dust_mask] = 255

        elif costume_id == 'solaris_phoenix':
            H[hair_mask] = 18
            S[hair_mask] = 230
            V[hair_mask] = 255

            cape_tunic = blue_mask & (~head_ribbon)
            H[cape_tunic] = 175
            S[cape_tunic] = 240
            V[cape_tunic] = 240

            H[head_ribbon] = 18
            S[head_ribbon] = 230
            V[head_ribbon] = 255

            H[gold_mask] = 22
            S[gold_mask] = 250
            V[gold_mask] = 255

            S[stocking_mask] = 20
            V[stocking_mask] = 245
            S[skin_mask] = 20
            V[skin_mask] = 245

            H[dust_mask] = 16
            S[dust_mask] = 255
            V[dust_mask] = 255

    elif char_id == 'nyx':
        if costume_id == 'nyx_default':
            # Dark hair, midnight suit, glowing cyan trim, dark trousers, cyan dust
            H[hair_mask] = 105
            S[hair_mask] = 30
            V[hair_mask] = np.clip(V[hair_mask] * 0.3, 10, 50)

            S[blue_mask] = 40
            V[blue_mask] = np.clip(V[blue_mask] * 0.3, 15, 60)

            H[head_ribbon] = 105
            S[head_ribbon] = 30
            V[head_ribbon] = 35

            H[gold_mask] = 92
            S[gold_mask] = 255
            V[gold_mask] = 255

            V[leather_mask] = np.clip(V[leather_mask] * 0.35, 10, 50)
            S[stocking_mask] = 30
            V[stocking_mask] = 35
            S[skin_mask] = 30
            V[skin_mask] = 35

            H[dust_mask] = 92
            S[dust_mask] = 255
            V[dust_mask] = 255

        elif costume_id == 'nyx_cyber':
            H[hair_mask] = 100
            S[hair_mask] = 35
            V[hair_mask] = np.clip(V[hair_mask] * 0.35, 15, 55)

            H[blue_mask] = 105
            S[blue_mask] = 50
            V[blue_mask] = np.clip(V[blue_mask] * 0.35, 20, 70)

            H[head_ribbon] = 100
            S[head_ribbon] = 35
            V[head_ribbon] = 35

            H[gold_mask] = 94
            S[gold_mask] = 255
            V[gold_mask] = 255

            V[leather_mask] = np.clip(V[leather_mask] * 0.3, 10, 50)
            S[stocking_mask] = 40
            V[stocking_mask] = 45
            S[skin_mask] = 40
            V[skin_mask] = 45

            H[dust_mask] = 94
            S[dust_mask] = 255
            V[dust_mask] = 255

        elif costume_id == 'nyx_bloodmoon':
            H[hair_mask] = 176
            S[hair_mask] = 30
            V[hair_mask] = np.clip(V[hair_mask] * 0.35, 10, 50)

            # Robes: blood red
            H[blue_mask] = 176
            S[blue_mask] = 230
            V[blue_mask] = np.clip(V[blue_mask] * 0.8, 40, 160)

            H[head_ribbon] = 176
            S[head_ribbon] = 220
            V[head_ribbon] = 90

            H[gold_mask] = 176
            S[gold_mask] = 255
            V[gold_mask] = 255

            V[leather_mask] = np.clip(V[leather_mask] * 0.3, 10, 45)
            S[stocking_mask] = 30
            V[stocking_mask] = 35
            S[skin_mask] = 30
            V[skin_mask] = 35

            H[dust_mask] = 176
            S[dust_mask] = 255
            V[dust_mask] = 255

    elif char_id == 'stella':
        if costume_id == 'stella_archmage':
            H[hair_mask] = 142
            S[hair_mask] = 60
            V[hair_mask] = np.clip(V[hair_mask] * 1.05, 160, 255)

            H[blue_mask] = 146
            S[blue_mask] = 220
            V[blue_mask] = np.clip(V[blue_mask] * 0.95, 60, 210)

            H[gold_mask] = 24
            S[gold_mask] = 230
            V[gold_mask] = 255

            H[leather_mask] = 145
            S[leather_mask] = 150

            H[stocking_mask] = 145
            S[stocking_mask] = 120
            V[stocking_mask] = 200

            H[dust_mask] = 145
            S[dust_mask] = 230
            V[dust_mask] = 255

        elif costume_id == 'stella_chronos':
            H[hair_mask] = 78
            S[hair_mask] = 95
            V[hair_mask] = np.clip(V[hair_mask] * 1.05, 160, 245)

            H[blue_mask] = 68
            S[blue_mask] = 190
            V[blue_mask] = np.clip(V[blue_mask] * 0.85, 50, 180)

            H[gold_mask] = 20
            S[gold_mask] = 210
            V[gold_mask] = 230

            H[leather_mask] = 55
            S[leather_mask] = 130

            H[stocking_mask] = 70
            S[stocking_mask] = 60
            V[stocking_mask] = 210

            H[dust_mask] = 85
            S[dust_mask] = 230
            V[dust_mask] = 255

    # Reconstruct BGR
    hsv_out = cv2.merge([H, S, V]).astype(np.uint8)
    bgr_out = cv2.cvtColor(hsv_out, cv2.COLOR_HSV2BGR)
    
    return cv2.merge([bgr_out[:, :, 0], bgr_out[:, :, 1], bgr_out[:, :, 2], a])

def main():
    print("=== Generating Full Anime Action Sprite Sets for All Heroes & Costumes ===")
    
    CHAR_COSTUMES = [
        ('solaris', 'solaris_default', 'solaris'),
        ('solaris', 'solaris_obsidian', 'solaris_obsidian'),
        ('solaris', 'solaris_phoenix', 'solaris_phoenix'),
        ('nyx', 'nyx_default', 'nyx'),
        ('nyx', 'nyx_cyber', 'nyx_cyber'),
        ('nyx', 'nyx_bloodmoon', 'nyx_bloodmoon'),
        ('stella', 'stella_archmage', 'stella_archmage'),
        ('stella', 'stella_chronos', 'stella_chronos'),
    ]

    for char_id, costume_id, prefix in CHAR_COSTUMES:
        print(f"Synthesizing costume: {costume_id} (prefix: {prefix})...")
        for act in ACTIONS:
            base_img = get_base_image(act)
            out_rgba = transform_character_action(base_img, char_id, costume_id)
            out_name = f'{prefix}_{act}.png'
            out_path = os.path.join(PUBLIC_ASSETS, out_name)
            cv2.imwrite(out_path, out_rgba)

    print("🎉 All 48 Action Animation Sprites Successfully Synthesized!")

if __name__ == '__main__':
    main()
