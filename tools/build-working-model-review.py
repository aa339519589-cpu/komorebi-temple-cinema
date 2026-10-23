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
parser.add_argument('--selection', help='Explicit ten retained native report paths and review notes; returned candidates remain separately preserved')
args = parser.parse_args()
root = Path.cwd()
out = root / args.output
out.mkdir(parents=True, exist_ok=False)
scenes = json.loads((root / 'reconstructions/ten-scenes.json').read_text())['scenes']
selection = json.loads((root / args.selection).read_text()) if args.selection else None
if selection and set(selection['reports']) != {str(i) for i in range(1, 11)}:
    raise RuntimeError('Explicit selection must cover all ten references')
paths = subprocess.check_output(['rg', '--files', 'qa/ten-reference', '-g', 'report.json'], text=True).splitlines()
choices = {}
for relative in paths:
    try:
        path = root / relative
        report = json.loads(path.read_text())
        number = int(report.get('reference', 0))
        if selection and selection['reports'].get(str(number)) != relative:
            continue
        frame_name = selection.get('referenceFrames', {}).get(str(number), 'reference') if selection else 'reference'
        if not isinstance(frame_name, str) or Path(frame_name).name != frame_name:
            raise RuntimeError('Reference frame selection must be a report frame name')
        frame = next((f for f in report.get('frames', []) if f.get('name') == frame_name and f.get('valid')), None)
        native_path = path.parent / (frame_name + '.png')
        if number not in range(1, 11) or report.get('status') != 'rendered-review' or frame is None or not native_path.is_file():
            continue
        started = report.get('startedAt', '')
        if started > choices.get(number, {}).get('startedAt', ''):
            choices[number] = dict(reference=number, startedAt=started,
                native=str(native_path.relative_to(root)), report=relative, nativeFrameName=frame_name,
                sourceHash=report.get('source', {}).get('hash', report.get('sourceHash')),
                nativeDimensions=[frame.get('width'), frame.get('height')], visualAccepted=False)
    except (ValueError, KeyError, TypeError):
        continue
if len(choices) != 10:
    raise RuntimeError('All ten genuine source-camera frames are required')
if selection:
    for number, metadata in selection.get('frameLicenses', {}).items():
        choices[int(number)].update(metadata)
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
if selection:
    manifest.update(scope='Explicit retained native reference-camera frames after visual review; returned candidates remain preserved separately. Independent source identities, not a new movie or unified source snapshot', selectionFile=args.selection, reviewNotes=selection.get('notes', {}))
    if selection.get('boardLicense'):
        manifest['boardLicense'] = selection['boardLicense']
(out / 'frames.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(out)
