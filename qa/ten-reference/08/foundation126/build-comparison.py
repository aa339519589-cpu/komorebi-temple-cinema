"""Comparison assembly only; actual wrapper frames, no retouch/synthetic pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
font_path = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font = ImageFont.truetype(str(font_path), 17) if font_path.exists() else ImageFont.load_default()
panels = [
    ('Supplied photo', ROOT/'references/hd/7-照片-8.jpg'),
    ('Before: actual layout122-v3', ROOT/'qa/ten-reference/08/iteration-layout122-v3/reference.png'),
    ('Unaccepted actual foundation126', ROOT/'qa/ten-reference/08/iteration-foundation126/reference.png'),
]
canvas = Image.new('RGB', (1200, 445), '#eeeeea')
draw = ImageDraw.Draw(canvas)
for i, (label, path) in enumerate(panels):
    crop = Image.open(path).convert('RGB').crop((560, 750, 960, 1150))
    canvas.paste(crop, (i*400, 45))
    draw.text((i*400+8, 13), label, font=font, fill='#20251f')
canvas.save(HERE/'photo-v3-foundation126-native-crop.png')
