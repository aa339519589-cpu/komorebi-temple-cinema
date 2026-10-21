"""Fetch original public CC0 model bytes and verify provider checksums."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import subprocess

HERE = Path(__file__).resolve().parent
UA = 'TempleCinemaReconstruction/1.0 (CC0 asset provenance verification)'
FILES_URL = 'https://api.polyhaven.com/files/fir_sapling'
INFO_URL = 'https://api.polyhaven.com/info/fir_sapling'

def fetch(url):
    return subprocess.check_output(['curl', '-fsSL', '--retry', '2', '-A', UA, url], timeout=180)

listing = json.loads((HERE / 'provider-files.json').read_text())
info = json.loads((HERE / 'provider-info.json').read_text())
model = listing['gltf']['4k']['gltf']
requested = [('fir_sapling_4k.gltf', model)] + list(model['include'].items())

def download(item):
    name, expected = item
    path = HERE / name
    if path.exists():
        data = path.read_bytes()
    else:
        data = fetch(expected['url'])
    digest = hashlib.md5(data).hexdigest()
    if digest != expected['md5'] or len(data) != expected['size']:
        raise RuntimeError('Provider checksum/size mismatch: ' + name)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    record = dict(file=name, url=expected['url'], bytes=len(data), md5=digest,
                  sha256=hashlib.sha256(data).hexdigest(), providerMd5Verified=True)
    print(json.dumps(dict(file=name, bytes=len(data), providerMd5Verified=True)), flush=True)
    return record

with ThreadPoolExecutor(max_workers=4) as pool:
    records = list(pool.map(download, requested))

provenance = dict(provider='Poly Haven', asset='fir_sapling', source='https://polyhaven.com/a/fir_sapling',
                  authors=info['authors'], license='CC0-1.0', licenseSource='https://polyhaven.com/license',
                  licenseUrl='https://creativecommons.org/publicdomain/zero/1.0/',
                  primaryMetadata='provider-info.json', primaryFileListing='provider-files.json',
                  metadataUrls=[INFO_URL, FILES_URL],
                  resolution='Original4K glTF model, original unchanged binary mesh and original4K atlases; no mesh decimation.',
                  use='Three-dimensional conifer woodland on the actual finite ridges. No supplied reference-scene image is used as radiance, backdrop or projection.',
                  buildSource='fetch-original.py', files=records)
(HERE / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
gltf = json.loads((HERE / 'fir_sapling_4k.gltf').read_text())
print(json.dumps(dict(status='all-original-provider-bytes-verified', files=len(records),
                      modelNodes=gltf['nodes'], materials=gltf['materials'],
                      triangles=sum(gltf['accessors'][p['indices']]['count']//3 for m in gltf['meshes'] for p in m['primitives']))))
