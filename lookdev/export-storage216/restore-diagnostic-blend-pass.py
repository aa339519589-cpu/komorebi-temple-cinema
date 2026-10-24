"""Restore one losslessly archived diagnostic pass without overwriting any file.

Usage: python3 restore-diagnostic-blend-pass.py --list
       python3 restore-diagnostic-blend-pass.py <original repository-relative path>
"""
from pathlib import Path
import hashlib, json, os, shutil, subprocess, sys

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent / 'diagnostic-blend-deltas'
manifest = json.loads((HERE / 'archive-manifest.json').read_text())

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

if len(sys.argv) != 2 or sys.argv[1] == '--list':
    for item in manifest['passes']:
        print(item['path'], item['status'], item['bytes'])
    sys.exit(0 if len(sys.argv) == 2 else 2)
matches = [x for x in manifest['passes'] if x['path'] == sys.argv[1]]
assert len(matches) == 1, 'Select one exact path from --list'
item = matches[0]
base, delta, target = ROOT / manifest['base'], ROOT / item['delta'], ROOT / item['path']
assert digest(base) == manifest['baseSha256'] and digest(delta) == item['deltaSha256']
assert not target.exists() and not target.is_symlink(), 'Refusing to overwrite'
assert shutil.disk_usage(ROOT).free > item['bytes'] + 384 * 1048576, 'Insufficient restoration headroom'
tmp = target.with_name(target.name + '.restore-partial')
assert not tmp.exists()
target.parent.mkdir(parents=True, exist_ok=True)
with tmp.open('xb') as stream:
    subprocess.run(['zstd', '-d', '--patch-from=' + str(base), '--stdout', str(delta)], stdout=stream, check=True)
    stream.flush(); os.fsync(stream.fileno())
assert tmp.stat().st_size == item['bytes'] and digest(tmp) == item['sha256']
os.chmod(tmp, item['mode']); os.utime(tmp, ns=(item['atimeNs'], item['mtimeNs']))
os.link(tmp, target); tmp.unlink()
print(json.dumps({'restored': str(target), 'sha256': item['sha256'], 'bytes': item['bytes']}))
