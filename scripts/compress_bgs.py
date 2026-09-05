import os
from PIL import Image

ASSETS_DIR = os.path.join(os.getcwd(), 'public', 'assets')
OUTPUT_DIR = os.path.join(ASSETS_DIR, 'bgs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

IMAGES = [
    ("12 AM.jpeg", "campus_12am.webp"),
    ("3AM AND 9PM .jpeg", "campus_3am.webp"),
    ("6AM and PM.jpeg", "campus_6am.webp"),
    ("9AM.jpeg", "campus_9am.webp"),
    ("12PM.jpeg", "campus_12pm.webp"),
    ("3PM.jpeg", "campus_3pm.webp"),
]

TARGET_WIDTH = 1920
WEBP_QUALITY = 82

print(f"Target Directory: {OUTPUT_DIR}")

for src_name, dest_name in IMAGES:
    src_path = os.path.join(ASSETS_DIR, src_name)
    dest_path = os.path.join(OUTPUT_DIR, dest_name)
    
    if not os.path.exists(src_path):
        print(f"[MISSING] {src_path}")
        continue
        
    src_size = os.path.getsize(src_path) / (1024 * 1024)
    with Image.open(src_path) as img:
        orig_w, orig_h = img.size
        ratio = orig_h / orig_w
        target_h = int(TARGET_WIDTH * ratio)
        
        resized = img.resize((TARGET_WIDTH, target_h), Image.Resampling.LANCZOS)
        resized.save(dest_path, "WEBP", quality=WEBP_QUALITY, method=6)
        dest_size = os.path.getsize(dest_path) / 1024
        
        print(f"Compressed {src_name} ({orig_w}x{orig_h}, {src_size:.2f} MB) -> {dest_name} ({TARGET_WIDTH}x{target_h}, {dest_size:.1f} KB) - reduction: {((1 - (dest_size*1024)/(src_size*1024*1024))*100):.1f}%")

print("All time-of-day backgrounds successfully compressed!")
