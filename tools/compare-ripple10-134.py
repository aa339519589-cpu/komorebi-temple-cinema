"""Exact native QA crops; no altered actual-render pixels or resampling."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
qa = root / 'qa/ten-reference/10'
out = qa / 'ripple134'
out.mkdir(parents=True, exist_ok=True)
items = {
    'reference': ('SUPPLIED REFERENCE', root / 'references/hd/9-照片-10.jpg'),
    'before': ('BEFORE: ACTUAL HALL132-B', qa / 'iteration-hall132-b/shot--1250.png'),
    'after': ('AFTER: ACTUAL RIPPLE134-A', qa / 'iteration-ripple134-a/reference.png'),
}

def pair(left, right, rect, name):
    if not all(items[k][1].exists() for k in (left, right)):
        return
    w, h = rect[2]-rect[0], rect[3]-rect[1]
    canvas = Image.new('RGB', (w*2, h+32), '#222222')
    draw = ImageDraw.Draw(canvas)
    for i, key in enumerate((left, right)):
        label, path = items[key]
        im = Image.open(path).convert('RGB')
        assert im.size == (1254, 1254), (path, im.size)
        canvas.paste(im.crop(rect), (i*w, 32))
        draw.text((i*w+8, 10), label+' - NATIVE 1:1', fill='white')
    canvas.save(out/name)

near = (570, 940, 1030, 1254)
foreground = (100, 835, 1110, 1254)
pair('reference', 'before', near, 'reference-vs-before-native.png')
pair('before', 'after', near, 'before-vs-after-near-native.png')
pair('reference', 'after', near, 'reference-vs-after-native.png')
pair('before', 'after', foreground, 'before-vs-after-foreground-native.png')
data = {'scope': 'Native 1:1 QA crops with labels only. No scaling, photo retouching, relighting or generated pixels.', 'nearCropXYXY': near, 'foregroundCropXYXY': foreground, 'inputs': {key:str(p.relative_to(root)) for key, (_,p) in items.items()}, 'detailNative': 'The separate detail-native.png is a genuine wrapper-rendered 330x330 reference-camera subfrustum rendered at 1254, not an upscaled before/after crop.'}
(out/'comparison-provenance.json').write_text(json.dumps(data,indent=2)+'\n')
