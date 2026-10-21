"""Decode actual completed MP4 frames for human temporal review, on CPU."""
from pathlib import Path
import json
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
MOTION = ROOT / 'qa/ten-reference/09/iteration-scene09-solmax-grounded-site-dolly-r17-motion-20261021'
report = json.loads((MOTION / 'report.json').read_text())
assert report['status'] == 'motion-review-rendered' and not report['errors']
assert report['source']['hash'] == '8822979b57630f702d82493a4181b5f22bbd4ab68a42423146539a9ee56bfb06'
dest = HERE / 'movie-decoded'
dest.mkdir(exist_ok=True)
indices = [0, 21, 42, 63, 84, 105, 126, 147, 167]
select = '+'.join(f'eq(n\\,{i})' for i in indices)
subprocess.run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(MOTION / 'motion-review.mp4'),
                '-vf', f'select={select}', '-fps_mode', 'vfr', '-start_number', '0',
                '-frames:v', '9', str(dest / 'decoded-%02d.png'), '-y'], check=True)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 19)
width, gap, label = 480, 10, 34
board = Image.new('RGB', (3 * (width + gap) + gap, 3 * (width + label + gap) + gap), (21, 24, 29))
draw = ImageDraw.Draw(board)
records = []
for n, i in enumerate(indices):
    path = dest / f'decoded-{n:02d}.png'
    im = Image.open(path).convert('RGB')
    assert im.size == (960, 960)
    x, y = gap + (n % 3) * (width + gap), gap + (n // 3) * (width + label + gap)
    board.paste(im.resize((width, width), Image.Resampling.LANCZOS), (x, y + label))
    time = (i + .5) / 24
    draw.text((x + 3, y + 6), f'Actual movie frame {i} | {time:.3f} s', fill=(235, 237, 240), font=font)
    records.append({'frame': i, 'sourceRenderTime': time, 'decodedPNG': str(path.relative_to(ROOT))})
board.save(HERE / 'movie-nine-frames-r17.jpg')
(HERE / 'movie-decoded-frames.json').write_text(json.dumps({'method': 'Nine frames decoded directly from completed genuine 24 fps MP4; no interpolation or retouching', 'frames': records, 'visualAccepted': False}, indent=2) + '\n')
print(json.dumps({'decoded': len(records), 'board': str(HERE / 'movie-nine-frames-r17.jpg')}))
