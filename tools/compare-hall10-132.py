"""Native pixel QA crops only; actual GPU images are never retouched."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
qa = root / 'qa/ten-reference/10'
out = qa / 'hall132'
rect = (590, 110, 1220, 640)
items = {
    'reference': ('SUPPLIED REFERENCE', root / 'references/hd/9-照片-10.jpg'),
    'before': ('BASELINE ACTUAL LAYOUT125-D', qa / 'iteration-layout125-d/shot--1250.png'),
    'a': ('ACTUAL HALL132-A - INTERMEDIATE', qa / 'iteration-hall132-a/shot--1250.png'),
    'b': ('ACTUAL HALL132-B - REVIEW DRAFT', qa / 'iteration-hall132-b/shot--1250.png'),
}

def pair(left, right, name):
    canvas = Image.new('RGB', (1260, 562), '#222222')
    draw = ImageDraw.Draw(canvas)
    for i, key in enumerate((left, right)):
        label, path = items[key]
        original = Image.open(path).convert('RGB')
        assert original.size == (1254, 1254), (path, original.size)
        canvas.paste(original.crop(rect), (630 * i, 32))
        draw.text((630 * i + 8, 10), label + ' - NATIVE 1:1', fill='white')
    canvas.save(out / name)

pair('before', 'b', 'before-vs-final-native.png')
pair('reference', 'b', 'reference-vs-final-native.png')
pair('a', 'b', 'a-vs-b-native.png')
provenance = {'scope': 'Comparison contact sheets only. Exact native 630x530 crops from original 1254 images; no resizing, retouching, relighting or generated pixels.', 'crop': rect, 'inputs': {k: str(p.relative_to(root)) for k, (_, p) in items.items()}}
(out / 'comparison-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
