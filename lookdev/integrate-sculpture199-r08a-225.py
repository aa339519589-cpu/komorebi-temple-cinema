"""Surgical current-room integration of the reviewed continuous R08a sculpture.

Does not replace room/light/floor/lotus/halo code from the older inspection tree.
"""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path('/Users/mima1234/temple-cinema-live-sync')
HERE = ROOT / 'lookdev/scene06-integration225'
DELTA = ROOT / 'lookdev/scene06-sculpture199/r08a-frozen-delta'
SPEC = json.loads((ROOT / 'lookdev/scene06-sculpture199/r08a-held-delta-vs-j.json').read_text())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

assert not HERE.exists(), 'Keep every integration attempt independently.'
HERE.mkdir()
before = HERE / 'before-current222-205'
before.mkdir()
scene_path = 'reconstructions/scene-06/src/reference6-scene.js'
cast_path = 'reconstructions/scene-06/src/sculptural-cast-assets.js'
protected = ['restoration-altar.js', 'lotus-throne222.js', 'mandorla205.js', 'floor-varnish.js', 'reference6-camera-shot.js', 'daylight-scattering195.js', 'window-canopy195.js']
protected_hashes = {name: digest(ROOT / 'reconstructions/scene-06/src' / name) for name in protected}
baseline_cast = next(x for x in SPEC['changed'] if x['file'] == cast_path)
assert digest(ROOT / cast_path) == baseline_cast['baselineSha256']
for name in [scene_path, cast_path]:
    subprocess.run(['cp', '-c', '-p', str(ROOT / name), str(before / Path(name).name)], check=True)
for item in SPEC['added']:
    original = DELTA / item['file']
    assert digest(original) == item['sha256']
    target = ROOT / item['file']
    assert not target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['cp', '-c', '-p', str(original), str(target)], check=True)
    assert digest(target) == item['sha256']
cast = DELTA / cast_path
assert digest(cast) == baseline_cast['sha256']
(ROOT / cast_path).write_bytes(cast.read_bytes())
text = (ROOT / scene_path).read_text()
candidate = (DELTA / scene_path).read_text()
old = next(line for line in text.splitlines() if line.startswith('export const REFERENCE6_FOUNDATION='))
new = next(line for line in candidate.splitlines() if line.startswith('export const REFERENCE6_FOUNDATION='))
assert 'r06j-ear-root-blend' in old and 'r08a-continuous-source-fit' in new
text = text.replace(old, new, 1)
assert "import {installCentralScalp199}" not in text
text = text.replace("import * as T from 'three';", "import * as T from 'three';\nimport {installCentralScalp199} from './central-sculpture-scalp199.js';", 1)
needle = 'm.roughness=definition.roughness;surfaceCache.set(cacheKey,m);'
assert text.count(needle) == 1
text = text.replace(needle, 'm.roughness=definition.roughness;installCentralScalp199(m,g,g.userData?.nativeScalpMaterial);surfaceCache.set(cacheKey,m);', 1)
(ROOT / scene_path).write_text(text)
assert protected_hashes == {name: digest(ROOT / 'reconstructions/scene-06/src' / name) for name in protected}
receipt = {'status': 'current-room-working-integration-awaiting-native-review',
    'beforeSource': 'f46bf4dea7d8cb5f0736a66db61de32ad70d3a6a9974e87a442b9d1e148c988f',
    'isolatedSculptureSource': SPEC['candidateSourceHash'], 'added': SPEC['added'],
    'changed': [{'path': name, 'before': digest(before / Path(name).name), 'after': digest(ROOT / name)} for name in [scene_path, cast_path]],
    'protectedCurrentRuntimeHashes': protected_hashes,
    'rootReviewedIsolatedViews': ['front', 'three-quarter', 'profile', 'left-profile'],
    'visualAccepted': False,
    'remaining': ['Soft ear bowls and temple transitions', 'Face anatomy and gold response differ from HD', 'Lotus, halo, furniture and room still photographically unaccepted'],
    'license': 'CC-BY-NC-SA-4.0 adaptation; donor173 remains CC-BY-4.0 with culture/period unspecified'}
(HERE / 'integration225.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'addedFiles': len(SPEC['added']), 'protectedCurrentRuntimeHeld': True}))
