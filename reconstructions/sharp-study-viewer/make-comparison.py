"""Arrange actual Gaussian PNGs beside the input photo; never synthesizes pixels.

Usage: python3 make-comparison.py /absolute/input.jpg /absolute/review/directory
The individual PNG files remain unmodified at their actual render resolution.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

photo, output = Path(sys.argv[1]), Path(sys.argv[2])
items = [
    (photo, "INPUT PHOTOGRAPH (comparison only)"),
    (output / "source.png", "3D GAUSSIANS / source camera"),
    (output / "left.png", "3D CAMERA / X -0.318834 m"),
    (output / "right.png", "3D CAMERA / X +0.318834 m"),
    (output / "near.png", "3D CAMERA / forward +0.510134 m"),
    (output / "far.png", "3D CAMERA / backward -0.765201 m"),
]
tile, bar = 627, 32
sheet = Image.new("RGB", (tile * 3, (tile + bar) * 2), "#101410")
draw = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 14)
except OSError:
    font = ImageFont.load_default()
for index, (path, label) in enumerate(items):
    x, y = index % 3 * tile, index // 3 * (tile + bar)
    draw.text((x + 10, y + 8), label, fill="#e8eadf", font=font)
    image = Image.open(path).convert("RGB")
    image.thumbnail((tile, tile), Image.Resampling.LANCZOS)
    sheet.paste(image, (x + (tile-image.width)//2, y + bar))
sheet.save(output / "comparison.png", optimize=True)
