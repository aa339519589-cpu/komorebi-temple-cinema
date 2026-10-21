#!/usr/bin/env python3
"""Preserve a ten-view board of genuine completed native reference frames.

Run with a Pillow-capable Python and a NEW output directory. Each frame keeps
its individual source identity; the board never claims a coherent movie build.
"""
import argparse
import datetime
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('output')
args = parser.parse_args()
root = Path.cwd()
out = root / args.output
out.mkdir(parents=True, exist_ok=False)
scenes = json.loads((root / 'reconstructions/ten-scenes.json').read_text())['scenes']
paths = subprocess.check_output(['rg', '--files', 'qa/ten-reference', '-g', 'report.json'], text=True).splitlines()
choices = {}
for relative in paths:
    try:
        path = root / relative
        report = json.loads(path.read_text())
        number = int(report.get('reference', 0))
        frame = next((f for f in report.get('frames', []) if f.get('name') == 'reference' and f.get('valid')), None)
        if number not in range(1, 11) or report.get('status') != 'rendered-review' or frame is None or not (path.parent / 'reference.png').is_file():
            continue
        started = report.get('startedAt', '')
        if started > choices.get(number, {}).get('startedAt', ''):
            choices[number] = dict(reference=number, startedAt=started,
                native=str((path.parent / 'reference.png').relative_to(root)), report=relative,
                sourceHash=report.get('source', {}).get('hash', report.get('sourceHash')),
                nativeDimensions=[frame.get('width'), frame.get('height')], visualAccepted=False)
    except (ValueError, KeyError, TypeError):
        continue
if len(choices) != 10:
    raise RuntimeError('All ten genuine source-camera frames are required')
board = Image.new('RGB', (1440, 1980), (18, 20, 16))
draw = ImageDraw.Draw(board)
for index, scene in enumerate(scenes):
    number, x, y = index + 1, (index % 2) * 720, (index // 2) * 396
    frame = choices[number]
    draw.text((x + 8, y + 8), f"{number:02d} REFERENCE | REAL 3D {frame['sourceHash'][:8]} / IN PROGRESS", fill=(232, 218, 184))
    for side, relative in enumerate([scene['referenceFile'].lstrip('/'), frame['native']]):
        image = Image.open(root / relative).convert('RGB').resize((360, 360), Image.Resampling.LANCZOS)
        board.paste(image, (x + side * 360, y + 29))
board.save(out / 'all-ten-reference-left-render-right.jpg', quality=94)
manifest = dict(status='in-progress-not-photographically-accepted',
    createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    scope='Latest completed native reference-camera still per scene; independent source identities, not a newly rendered movie or unified source snapshot',
    frames=[choices[i] for i in range(1, 11)])
(out / 'frames.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(out)
