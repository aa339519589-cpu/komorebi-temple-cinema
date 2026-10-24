"""Integrate one reviewed ornament family without replacing the current room."""
from pathlib import Path
import hashlib, json, subprocess

ROOT = Path('/Users/mima1234/temple-cinema-live-sync')
WORKER = ROOT / 'lookdev/scene06-ornament224'
CANDIDATE = WORKER / 'candidate-root/reconstructions/scene-06'
CURRENT = ROOT / 'reconstructions/scene-06'
HERE = ROOT / 'lookdev/scene06-integration225/ornament224-r03'
HERE.mkdir(exist_ok=False)

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

old = CURRENT / 'src/altar-joinery198.js'
assert sha(old) == sha(WORKER / 'baseline/altar-joinery198.js')
protected = ['reference6-scene.js', 'sculptural-cast-assets.js', 'restoration-altar.js', 'mandorla205.js', 'lotus-throne222.js', 'lotus-gilt222.js', 'floor-varnish.js', 'daylight-scattering195.js', 'reference6-camera-shot.js']
held = {name: sha(CURRENT / 'src' / name) for name in protected}
subprocess.run(['cp', '-c', '-p', str(old), str(HERE / 'before-altar-joinery198.js')], check=True)
added = []
assetdir = CANDIDATE / 'assets/ornament224-r01'
for original in assetdir.iterdir():
    assert original.is_file() and not original.is_symlink()
    target = CURRENT / 'assets/ornament224-r01' / original.name
    assert not target.exists()
    target.parent.mkdir(exist_ok=True, parents=True)
    subprocess.run(['cp', '-c', '-p', str(original), str(target)], check=True)
    assert sha(original) == sha(target)
    added.append({'path': str(target.relative_to(ROOT)), 'sha256': sha(target), 'bytes': target.stat().st_size})
module = WORKER / 'r03-source-snapshot/ornament224.js'
assert not (CURRENT / 'src/ornament224.js').exists()
subprocess.run(['cp', '-c', '-p', str(module), str(CURRENT / 'src/ornament224.js')], check=True)
added.append({'path': 'reconstructions/scene-06/src/ornament224.js', 'sha256': sha(module), 'bytes': module.stat().st_size})
new = WORKER / 'r03-source-snapshot/altar-joinery198.js'
assert sha(new) == '665aeaaf73eed736b8566a2b098e1813d3f0fc5cf052612d4b1afbe7e8c07812'
old.write_bytes(new.read_bytes())
assert held == {name: sha(CURRENT / 'src' / name) for name in protected}
receipt = {'status': 'single-left-long-panel-working-integration-awaiting-current-native-review',
    'workerSource': '48bd6ade4d829f281015b6fc93b670913f0202b599f10dade7265139a45fd1fa',
    'added': added, 'changedPath': str(old.relative_to(ROOT)),
    'before': sha(HERE / 'before-altar-joinery198.js'), 'after': sha(old),
    'protectedCurrentRuntime': held,
    'rootViewedWorkerActual': ['r02-low-oblique', 'r03-full-detail-subfrustum', 'r03-low-oblique'],
    'limits': ['One left long panel only; not distributed across the cabinet', 'Authored inferred scalar to closed3D geometry; not a reference artifact scan', 'Reference/guide RGB is not used as a material or scene frame', 'Cloud network and motif likeness remain unlike reference'],
    'visualAccepted': False, 'photographicAccepted': False}
(HERE / 'integration.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'status': receipt['status'], 'added': len(added), 'protectedCurrentRuntimeHeld': True}))
