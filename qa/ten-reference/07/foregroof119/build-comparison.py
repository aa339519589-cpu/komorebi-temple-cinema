"""Comparison assembly only: no enhancement, scene-pixel synthesis or retouch.
All reconstruction panels come from actual shared-wrapper renders.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
font_file = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font = ImageFont.truetype(str(font_file), 19) if font_file.exists() else ImageFont.load_default()
panels = [
    ('Supplied photo', ROOT / 'references/hd/6-照片-7.jpg'),
    ('Before: actual mesh75b', ROOT / 'qa/ten-reference/07/iteration-mesh75b/reference.png'),
    ('After: actual foregroof119', ROOT / 'qa/ten-reference/07/iteration-foregroof119-v1/reference.png'),
]
canvas = Image.new('RGB', (1560, 622), '#efefeb')
draw = ImageDraw.Draw(canvas)
for index, (label, file) in enumerate(panels):
    crop = Image.open(file).convert('RGB').crop((0, 680, 520, 1254))
    canvas.paste(crop, (index * 520, 48))
    draw.text((index * 520 + 12, 13), label, fill='#20251f', font=font)
canvas.save(HERE / 'photo-before-after-native-crop.png')
