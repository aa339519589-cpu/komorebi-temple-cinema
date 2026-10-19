"""Crop/label actual render evidence only; no retouch or synthetic scene pixels."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
font_file = Path('/System/Library/Fonts/Supplemental/Arial.ttf')
font = ImageFont.truetype(str(font_file), 20) if font_file.exists() else ImageFont.load_default()
panels = [
    ('Supplied photo', ROOT / 'references/hd/7-照片-8.jpg'),
    ('Before: actual neutral112b', ROOT / 'qa/ten-reference/08/iteration-neutral112b/reference.png'),
    ('Unaccepted layout122-v3 actual', ROOT / 'qa/ten-reference/08/iteration-layout122-v3/reference.png'),
]
overview = Image.new('RGB', (1881, 675), '#eeeede')
draw = ImageDraw.Draw(overview)
for i, (label, path) in enumerate(panels):
    im = Image.open(path).convert('RGB').resize((627, 627), Image.Resampling.LANCZOS)
    overview.paste(im, (i * 627, 48))
    draw.text((i * 627 + 10, 13), label, fill='#20251f', font=font)
overview.save(HERE / 'photo-before-after-overview.png')
for name, rect in [
    ('architecture-native', (150, 180, 1120, 700)),
    ('unresolved-water-foundations-native', (400, 650, 1120, 1130)),
]:
    width, height = rect[2] - rect[0], rect[3] - rect[1]
    out = Image.new('RGB', (width * 3, height + 48), '#eeeede')
    draw = ImageDraw.Draw(out)
    for i, (label, path) in enumerate(panels):
        out.paste(Image.open(path).convert('RGB').crop(rect), (i * width, 48))
        draw.text((i * width + 10, 13), label, fill='#20251f', font=font)
    out.save(HERE / (name + '.png'))
