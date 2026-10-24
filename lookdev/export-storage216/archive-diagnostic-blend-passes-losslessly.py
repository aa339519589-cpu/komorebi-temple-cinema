"""Reversibly archive only old Scene01 diagnostic passes, preserving exact bytes.

Selected final/base Blend files, all assets, code and rendered images stay in place.
Every archived pass is fully decoded and SHA-256 checked before its raw file is
unlinked. The self-contained reference is an independent APFS clone, not a link
to the selected project. restore-diagnostic-blend-pass.py restores original paths.
"""
from pathlib import Path
import datetime, hashlib, json, os, re, shutil, stat, subprocess, time

ROOT = Path('/Users/mima1234/temple-cinema-live-sync')
HERE = ROOT / 'lookdev/export-storage216/diagnostic-blend-deltas'
OLD = ROOT / 'lookdev/scene01-cycles-current-20261021/cycles'
BASE = HERE / 'immutable-reference.blend'
BASE_SHA = 'd1e352506df7911ae804e8b3f13637cddc5756135b174f5e73aa3c479d87b6e1'
JOURNAL = HERE / 'archive-manifest.json'
FLOOR = 256 * 1048576
PATTERN = re.compile(r'scene01-cycles-(?:linked|key-repair|moderate-bounce|instance-attribute-repair|instance-attribute-repair-no-key)-pass\d+\.blend\Z')

def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1048576), b''):
            h.update(block)
    return h.hexdigest()

def save(data):
    tmp = JOURNAL.with_suffix('.json.tmp')
    with tmp.open('w') as stream:
        json.dump(data, stream, indent=2)
        stream.write('\n'); stream.flush(); os.fsync(stream.fileno())
    os.replace(tmp, JOURNAL)

def decoded_digest(delta):
    h, count = hashlib.sha256(), 0
    process = subprocess.Popen(['zstd', '-d', '--patch-from=' + str(BASE), '--stdout', str(delta)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    for block in iter(lambda: process.stdout.read(1048576), b''):
        h.update(block); count += len(block)
    error = process.stderr.read().decode()
    if process.wait() != 0:
        raise RuntimeError(error)
    return h.hexdigest(), count

assert not JOURNAL.exists(), 'Archive run is non-reentrant; inspect the existing receipt.'
assert BASE.is_file() and not BASE.is_symlink() and BASE.stat().st_nlink == 1
assert digest(BASE) == BASE_SHA
selected = [p for p in OLD.rglob('*.blend') if not PATTERN.fullmatch(p.name)]
assert len(selected) == 4, [str(p) for p in selected]
passes = sorted(p for p in OLD.rglob('*.blend') if PATTERN.fullmatch(p.name))
assert len(passes) == 19, len(passes)
receipt = {'status': 'running', 'startedUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'base': str(BASE.relative_to(ROOT)), 'baseSha256': BASE_SHA,
    'method': 'zstd --patch-from independent immutable APFS clone; full streamed replay verified before archival',
    'selectedProjectsRetained': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p), 'bytes': p.stat().st_size} for p in selected],
    'freeBefore': shutil.disk_usage(ROOT).free, 'passes': []}
save(receipt)
try:
    for original in passes:
        before = original.stat()
        identity = (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns)
        assert stat.S_ISREG(before.st_mode) and not original.is_symlink()
        sha = digest(original)
        open_check = subprocess.run(['/usr/sbin/lsof', '-Fn', '--', str(original)], capture_output=True, text=True)
        assert open_check.returncode == 1 and not open_check.stdout and not open_check.stderr, 'Open or uninspectable original: ' + str(original)
        delta = HERE / (sha[:16] + '-' + original.name + '.delta.zst')
        assert not delta.exists()
        with (HERE / 'archive-zstd.log').open('a') as log:
            process = subprocess.Popen(['zstd', '--patch-from=' + str(BASE), '--long=27', '-10', '-T2', str(original), '-o', str(delta)], stdout=log, stderr=log)
            while process.poll() is None:
                if shutil.disk_usage(ROOT).free < FLOOR:
                    process.terminate(); process.wait()
                    raise RuntimeError('Storage floor reached; current original retained')
                time.sleep(.2)
            assert process.returncode == 0
        verified_sha, verified_size = decoded_digest(delta)
        assert verified_sha == sha and verified_size == before.st_size
        now = original.stat()
        assert (now.st_dev, now.st_ino, now.st_size, now.st_mtime_ns) == identity and digest(original) == sha
        assert delta.stat().st_size < before.st_size / 2, 'Unhelpful delta; original retained'
        os.chmod(delta, 0o444)
        item = {'path': str(original.relative_to(ROOT)), 'sha256': sha, 'bytes': before.st_size,
            'delta': str(delta.relative_to(ROOT)), 'deltaSha256': digest(delta), 'deltaBytes': delta.stat().st_size,
            'mode': stat.S_IMODE(before.st_mode), 'mtimeNs': before.st_mtime_ns, 'atimeNs': before.st_atime_ns,
            'completeByteReconstructionVerified': True, 'status': 'verified-before-raw-file-archival'}
        receipt['passes'].append(item); save(receipt)
        original.unlink()
        item['status'] = 'archived-losslessly-original-path-restorable'
        item['freeAfter'] = shutil.disk_usage(ROOT).free; save(receipt)
        print(json.dumps(item), flush=True)
    for item in receipt['selectedProjectsRetained']:
        assert digest(ROOT / item['path']) == item['sha256']
    assert digest(BASE) == BASE_SHA
    receipt.update(status='complete', freeAfter=shutil.disk_usage(ROOT).free,
        exactBytesArchived=sum(x['bytes'] for x in receipt['passes']), deltaBytes=sum(x['deltaBytes'] for x in receipt['passes']))
except BaseException as error:
    receipt.update(status='stopped-current-original-retained', error=str(error), freeAfter=shutil.disk_usage(ROOT).free)
    raise
finally:
    save(receipt)
