"""Publish already verified archive components; never delete local evidence."""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / 'lookdev/export-storage216/diagnostic-blend-deltas'
manifest = json.loads((HERE / 'archive-manifest.json').read_text())
assert manifest['status'] == 'complete'

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

base = ROOT / manifest['base']
assert sha(base) == manifest['baseSha256']
assets = [base]
for item in manifest['passes']:
    delta = ROOT / item['delta']
    assert sha(delta) == item['deltaSha256']
    assets.append(delta)
assets += [HERE / 'archive-manifest.json']
repo = 'aa339519589-cpu/komorebi-temple-cinema'
tag = 'modeling-progress-2026-10-24-sol61'
probe = subprocess.run(['gh', 'release', 'view', tag, '--repo', repo, '--json', 'url'], capture_output=True)
if probe.returncode:
    subprocess.run(['gh', 'release', 'create', tag, '--repo', repo,
        '--target', 'work/ten-view-reconstruction-20261018', '--prerelease',
        '--title', '十景模型制作检查点 · 2026-10-24 · 未验收',
        '--notes-file', str(ROOT / 'lookdev/export-storage216/release-notes-20261024.md')], check=True)
subprocess.run(['gh', 'release', 'upload', tag, '--repo', repo, *map(str, assets)], check=True)
result = json.loads(subprocess.check_output(['gh', 'release', 'view', tag, '--repo', repo, '--json', 'url,assets'], text=True))
remote = {x['name']: x for x in result['assets']}
for path in assets:
    assert remote[path.name]['size'] == path.stat().st_size
    expected = 'sha256:' + sha(path)
    actual = remote[path.name].get('digest')
    if actual is not None:
        assert actual == expected
receipt = {'status': 'uploaded-size-and-server-digest-when-available-verified',
    'url': result['url'], 'assets': [{k: remote[p.name].get(k) for k in ['name', 'size', 'digest', 'url']} for p in assets],
    'localEvidenceRetained': True, 'photographicAcceptance': False}
(HERE / 'publication-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'url': receipt['url'], 'verifiedAssets': len(assets)}), flush=True)
