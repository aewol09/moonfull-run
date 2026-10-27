#!/usr/bin/env python3
import os
import shutil
from PIL import Image, ImageDraw

ROOT = '/home/aewol/moonfull_run'
FRAMED_ICON_PATH = os.path.join(ROOT, 'store_assets/app_icon_512_framed.png')
RES_DIR = os.path.join(ROOT, 'android/app/src/main/res')
PUBLIC_DIR = os.path.join(ROOT, 'public')
ASSETS_DIR = os.path.join(PUBLIC_DIR, 'assets')

def create_round_icon(img):
    """Create a circular-masked icon."""
    size = img.size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size[0], size[1]), fill=255)
    
    # Composite over transparent or keep alpha
    result = img.copy()
    result.putalpha(mask)
    return result

def deploy_web_assets(src_img):
    print("🌐 Deploying web app icons...")
    # 1. Copy full 512x512 framed icon to public/ and public/assets/
    public_framed = os.path.join(PUBLIC_DIR, 'app_icon_512_framed.png')
    assets_framed = os.path.join(ASSETS_DIR, 'app_icon_512_framed.png')
    shutil.copy2(FRAMED_ICON_PATH, public_framed)
    shutil.copy2(FRAMED_ICON_PATH, assets_framed)
    print(f"  -> Copied to {public_framed}")
    print(f"  -> Copied to {assets_framed}")
    
    # 2. Favicons
    fav_192 = src_img.resize((192, 192), Image.Resampling.LANCZOS)
    fav_192.save(os.path.join(PUBLIC_DIR, 'favicon.png'), 'PNG')
    
    fav_32 = src_img.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(PUBLIC_DIR, 'favicon.ico'), format='ICO')
    print("  -> Generated favicon.png and favicon.ico")

def deploy_android_mipmaps(src_img):
    print("🤖 Deploying Android mipmaps...")
    densities = [
        ('mdpi', 48, 108),
        ('hdpi', 72, 162),
        ('xhdpi', 96, 216),
        ('xxhdpi', 144, 324),
        ('xxxhdpi', 192, 432),
    ]
    
    for name, icon_size, fg_size in densities:
        mipmap_folder = os.path.join(RES_DIR, f'mipmap-{name}')
        os.makedirs(mipmap_folder, exist_ok=True)
        
        # 1. ic_launcher.png (standard)
        launcher_img = src_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        launcher_img.save(os.path.join(mipmap_folder, 'ic_launcher.png'), 'PNG')
        
        # 2. ic_launcher_round.png (round)
        round_img = create_round_icon(launcher_img)
        round_img.save(os.path.join(mipmap_folder, 'ic_launcher_round.png'), 'PNG')
        
        # 3. ic_launcher_foreground.png (adaptive icon foreground)
        # Safe zone is 66-70% of fg_size
        safe_zone_size = int(fg_size * 0.70)
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        scaled_icon = src_img.resize((safe_zone_size, safe_zone_size), Image.Resampling.LANCZOS)
        offset = (fg_size - safe_zone_size) // 2
        fg_canvas.paste(scaled_icon, (offset, offset), scaled_icon)
        fg_canvas.save(os.path.join(mipmap_folder, 'ic_launcher_foreground.png'), 'PNG')
        
        print(f"  -> Generated {name}: launcher ({icon_size}x{icon_size}), foreground ({fg_size}x{fg_size})")

    # Update background color in values/ic_launcher_background.xml to dark celestial navy
    bg_xml_path = os.path.join(RES_DIR, 'values/ic_launcher_background.xml')
    bg_xml_content = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b1226</color>
</resources>
"""
    with open(bg_xml_path, 'w', encoding='utf-8') as f:
        f.write(bg_xml_content)
    print("  -> Updated values/ic_launcher_background.xml to #0b1226")

def main():
    src_img = Image.open(FRAMED_ICON_PATH).convert('RGBA')
    print(f"Source icon: {FRAMED_ICON_PATH} ({src_img.size}, {src_img.mode})")
    deploy_web_assets(src_img)
    deploy_android_mipmaps(src_img)
    print("✨ All app icon assets deployed successfully!")

if __name__ == '__main__':
    main()
