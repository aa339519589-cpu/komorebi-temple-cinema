"""Package existing native evidence; never render or modify runtime source."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
QA = ROOT / 'qa/ten-reference/09'
POSES = QA / 'iteration-scene09-solmax-grounded-site-dolly-r17-poses-20261021'
MOTION = QA / 'iteration-scene09-solmax-grounded-site-dolly-r17-motion-20261021'
BASE = QA / 'iteration-scene09-solmax-bearing-return-poses-r14-20261021'
EXPECTED = '8822979b57630f702d82493a4181b5f22bbd4ab68a42423146539a9ee56bfb06'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def read(path):
    return json.loads(path.read_text())

pose = read(POSES / 'report.json')
assert pose['source']['hash'] == EXPECTED
assert len(pose['frames']) == 5 and not pose['errors']
source = pose['source']
changed = [p for p, digest in source['files'].items() if sha(ROOT / p) != digest]
assert not changed, f'Source no longer held: {changed}'

archive = HERE / 'retained-r17-source'
copied = []
for relative in source['files']:
    path = ROOT / relative
    if path.suffix in {'.js', '.mjs', '.json', '.html', '.py'}:
        destination = archive / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.exists():
            assert sha(destination) == sha(path), f'Archive changed: {relative}'
        else:
            shutil.copy2(path, destination)
        copied.append(relative)
(archive / 'source-manifest.json').write_text(json.dumps({
    'source': source, 'textFilesRetained': copied,
    'binaryAssets': 'Retained at original declared project paths; SHA-256 recorded in source.files',
    'renderReports': [str(POSES.relative_to(ROOT) / 'report.json'), str(MOTION.relative_to(ROOT) / 'report.json')],
}, indent=2) + '\n')

font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
font = ImageFont.truetype(font_path, 22)
small = ImageFont.truetype(font_path, 17)

def board(items, out, width=640, columns=3):
    rows = (len(items) + columns - 1) // columns
    label_height, gap = 38, 12
    result = Image.new('RGB', (columns * (width + gap) + gap, rows * (width + label_height + gap) + gap), (21, 24, 29))
    draw = ImageDraw.Draw(result)
    for index, (path, label) in enumerate(items):
        image = Image.open(path).convert('RGB')
        assert image.width == image.height
        if image.width != width:
            image = image.resize((width, width), Image.Resampling.LANCZOS)
        x, y = gap + (index % columns) * (width + gap), gap + (index // columns) * (width + label_height + gap)
        result.paste(image, (x, y + label_height))
        draw.text((x + 4, y + 7), label, fill=(235, 237, 240), font=font)
    result.save(out)

board([(POSES / f'{f["name"]}.png', f'R17 native {f["localTime"]:g} s') for f in pose['frames']], HERE / 'five-poses-r17.jpg')
board([(BASE / 'shot-0.png', 'R14 opening: empty outer site'), (POSES / 'shot-0.png', 'R17 opening: real temple/garden behind finial')], HERE / 'opening-r14-left-r17-right.jpg', width=960, columns=2)

base = read(BASE / 'report.json')
common_changed = [p for p, digest in base['source']['files'].items() if p in source['files'] and source['files'][p] != digest]
added = sorted(set(source['files']) - set(base['source']['files']))
record = {
    'revision': 'scene09-site-backed-cinematic-dolly144-r17',
    'source': source,
    'sourceHeld': True,
    'visualAccepted': False,
    'scope': 'Native shot/site continuity repair; no claim of photographic fidelity acceptance',
    'retainedReferenceCamera': {'position': [6, 2.7, 33], 'target': [0, 5.5, -10], 'fov': 52},
    'geometryChanges': 'Actual closed eastern/western soil banks, 156 seated scanned rocks, 78 rooted shrubs, 30 branch/leaf trees; same-elevation reflective pond surface extends to actual outer banks.',
    'cameraChanges': 'Occupied-deck finial close-up with temple/garden behind it; curved retreat rises gently behind the rail end and settles to retained 7 s reference pose.',
    'modifiedCommonSourceFilesAgainstR14': common_changed,
    'addedSourceFilesAgainstR14': added,
    'contactPreflight': read(HERE / 'camera-contact-r16.json'),
    'poses': {'report': str((POSES / 'report.json').relative_to(ROOT)), 'status': pose['status'],
              'frames': [{'time': f['localTime'], 'path': str((POSES / f'{f["name"]}.png').relative_to(ROOT)),
                          'width': f['width'], 'height': f['height'], 'glError': f['glError'],
                          'sha256': sha(POSES / f'{f["name"]}.png')} for f in pose['frames']],
              'inspection': 'All five actual images reviewed: near finial backed by modeled temple/garden, mid-shot finials leave through lower foreground, outer banks close visible site. Exact 7 s reference camera retained.'},
    'movie': None,
    'reviewBoards': ['five-poses-r17.jpg', 'opening-r14-left-r17-right.jpg'],
    'limits': 'Outer site is inferred continuity beyond the photograph. Temple/material/garden fidelity remains unaccepted. Native planar reflection and shared source camera are retained; no image plate, painted reflection, screen mask or fade is added.',
}
if (MOTION / 'report.json').exists():
    motion = read(MOTION / 'report.json')
    assert motion['source']['hash'] == EXPECTED and not motion['errors']
    assert motion['status'] == 'motion-review-rendered' and len(motion['frames']) == 168
    probe = motion['motion']['probe']
    stream = probe['streams'][0]
    assert (stream['width'], stream['height'], stream['r_frame_rate'], int(stream['nb_read_frames'])) == (960, 960, '24/1', 168)
    assert abs(float(probe['format']['duration']) - 7) < .002
    assert motion['motion']['decodeErrors'] == 0
    assert all(f['glError'] == 0 and not f['contextLost'] for f in motion['frames'])
    record['movie'] = {'report': str((MOTION / 'report.json').relative_to(ROOT)),
                       'path': str((MOTION / 'motion-review.mp4').relative_to(ROOT)),
                       'status': motion['status'], 'sha256': sha(MOTION / 'motion-review.mp4'),
                       'actualRenderedFrames': len(motion['frames']), 'probe': probe,
                       'decodeErrors': motion['motion']['decodeErrors'], 'allFrameGLErrors': 0,
                       'renderSampling': motion['renderSampling']}
    if (HERE / 'movie-decoded-frames.json').exists():
        record['movie']['decodedReview'] = read(HERE / 'movie-decoded-frames.json')
        record['reviewBoards'].append('movie-nine-frames-r17.jpg')
        record['movie']['inspection'] = 'Nine actual encoded-film frames at indices 0,21,42,63,84,105,126,147,167 visually inspected. Temple/garden back the finial opening, the camera turn keeps foreground caps below the architecture, the physical banks close the visible pond, and the retained wide view is reached. This is acceptance of the scoped framing repair only; photographic fidelity remains false.'
(HERE / 'checkpoint-r17.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'source': EXPECTED, 'retainedTextFiles': len(copied), 'modifiedCommon': common_changed, 'added': added, 'movieReady': record['movie'] is not None}))
