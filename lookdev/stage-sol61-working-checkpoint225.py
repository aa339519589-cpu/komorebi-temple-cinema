"""Stage only released scene boundaries and retained reconstruction evidence."""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path('/Users/mima1234/temple-cinema-live-sync')

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

def read(name):
    return json.loads((ROOT / name).read_text())

identities = {
    '05': read('lookdev/scene05-rebuild220/source220-r12-identity.json'),
    '06': read('qa/ten-reference/06/iteration-scene06-integration225-r02-ornament-personal-nc/report.json')['source'],
    '09': read('lookdev/scene09-rebuild221/r10-source-identity.json'),
    '10': read('qa/ten-reference/10/iteration-scene10-rain210-r14-hero/report.json')['source'],
}
paths = set()
for scene, identity in identities.items():
    for name, expected in identity['files'].items():
        assert sha(ROOT / name) == expected, 'Released source changed: ' + name
        if name.startswith('reconstructions/scene-' + scene + '/'):
            paths.add(name)

paths.update(['.gitignore', 'film.html', 'lookdev/stage-sol61-working-checkpoint225.py',
    'reconstructions/scene-06/ATTRIBUTION-AND-ASSET-LICENSES.md',
    'reconstructions/scene-09/README.md', 'reconstructions/scene-10/README.md',
    'lookdev/integrate-sculpture199-r08a-225.py', 'lookdev/integrate-ornament224-225.py'])
for directory in [
    'reconstructions/scene-06/assets/sculpture199-r08a-continuous-source-fit-mixed-licenses',
    'reconstructions/scene-06/assets/ornament224-r01',
    'lookdev/scene05-rebuild220', 'lookdev/scene09-rebuild221', 'lookdev/scene10-support207',
    'lookdev/scene06-integration225', 'lookdev/scene06-lotus222',
    'lookdev/scene06-ornament224/authoring',
    'lookdev/scene06-ornament224/baseline',
    'lookdev/scene06-ornament224/r01-source-snapshot',
    'lookdev/scene06-ornament224/r02-source-snapshot',
    'lookdev/scene06-ornament224/r03-source-snapshot',
    'lookdev/scene06-sculpture199/handoff-sol61-199-r08a-continuous-reviewed',
    'lookdev/scene06-sculpture199/r08a-frozen-delta',
    'lookdev/export-storage216/apfs-cache-compression-remaining',
    'lookdev/export-storage216/lossless-git-packing',
    'lookdev/export-storage216/retained-blend-storage',
    'lookdev/export-storage216/diagnostic-blend-deltas',
    'qa/ten-reference/working-model-review-20261024-i',
    'qa/ten-reference/working-model-review-20261024-j',
]:
    for path in (ROOT / directory).rglob('*'):
        if path.is_file() and not path.is_symlink() and path.suffix not in ('.log', '.blend', '.blend1', '.zst') and '__pycache__' not in path.parts:
            assert path.stat().st_size < 95 * 1048576, 'Unexpected large checkpoint file: ' + str(path)
            paths.add(str(path.relative_to(ROOT)))
for pattern in [
    'lookdev/export-storage216/*.py', 'lookdev/export-storage216/*inventory.json',
    'lookdev/export-storage216/*candidates.json', 'lookdev/export-storage216/release-notes-20261024.md',
    'lookdev/retained-model-selection-20261024-[ij].json',
    'lookdev/scene06-ornament224/r0[123]-*.json',
    'lookdev/scene06-ornament224/r03-local198-family.patch',
    'lookdev/scene06-sculpture199/r08a-held-delta-vs-j.json',
    'qa/ten-reference/05/iteration-scene05-rebuild220-r*/**/*',
    'qa/ten-reference/06/iteration-scene06-integration225*/**/*',
    'qa/ten-reference/06/iteration-scene06-lotus222-r0[67]*/**/*',
    'qa/ten-reference/09/iteration-scene09-rebuild221-r*/**/*',
    'qa/ten-reference/10/iteration-scene10-rain210-r*/**/*',
]:
    for path in ROOT.glob(pattern):
        if path.is_file() and not path.is_symlink() and path.suffix not in ('.log', '.blend', '.blend1', '.zst'):
            assert path.stat().st_size < 95 * 1048576
            paths.add(str(path.relative_to(ROOT)))

# Keep all isolated sculpture/ornament source-camera evidence without staging
# either worker's large copied scene/server tree.
for subtree, pattern in [
    ('lookdev/scene06-sculpture199/r06-candidate-root/qa/ten-reference/06', 'iteration-scene06-sculpture199-r08a-*'),
    ('lookdev/scene06-ornament224/candidate-root/qa/ten-reference/06', 'iteration-ornament224-r0[123]-*'),
]:
    for directory in (ROOT / subtree).glob(pattern):
        for path in directory.rglob('*'):
            if path.is_file() and path.suffix != '.log': paths.add(str(path.relative_to(ROOT)))

protected = ['qa/depth-field-film-v02/assets.json', 'lookdev/scene06-statue-foundation-v2/README.md', 'reconstructions/scene-08/README.md']
assert not set(protected).intersection(paths)
ordered = sorted(paths)
for start in range(0, len(ordered), 64):
    subprocess.run(['git', 'add', '--', *ordered[start:start + 64]], cwd=ROOT, check=True)
staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=ROOT, text=True).splitlines()
assert not set(protected).intersection(staged)
receipt = {'status': 'released-scenes-and-retained-native-evidence-staged',
    'sceneSourceIdentities': {scene: identity['hash'] for scene, identity in identities.items()},
    'stagedFiles': len(staged), 'protectedPathsNotStaged': protected,
    'photographicAcceptance': False, 'newMovie': False}
(ROOT / 'lookdev/scene06-integration225/public-checkpoint-boundary.json').write_text(json.dumps(receipt, indent=2) + '\n')
subprocess.run(['git', 'add', '--', 'lookdev/scene06-integration225/public-checkpoint-boundary.json'], cwd=ROOT, check=True)
print(json.dumps(receipt), flush=True)
