"""Freeze the reviewed R11 integration contract without changing model or captures.

CPU-only: validates recorded source identities, preserves the old R06 handoff,
and writes explicit provenance/material/review sidecars for the scene owner.
"""
from pathlib import Path
import hashlib
import json
import shutil

LANE = Path(__file__).resolve().parent
ROOT = LANE.parents[1]
OUT = LANE / 'r11-joined-cloth-sculpture'


def read(path):
    return json.loads(path.read_text())


def write(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')


def identity(path, role):
    raw = path.read_bytes()
    return {'file': str(path.relative_to(LANE)), 'role': role,
            'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


report = read(OUT / 'report.json')
validation = read(OUT / 'geometry-validation.json')
manifest = read(OUT / 'sc07/manifest.json')
source = read(LANE / 'sources/ccby-beachmouse-japanese-head/provenance.json')
native_evidence = []
for directory, views in [
    ('iteration-scene06-monumental-altar-v3-r10-r11-joined-triad-native', ['reference.png', 'detail-native.png']),
    ('iteration-scene06-monumental-altar-v3-r10-three-quarter-native', ['inspection-view.png'])
]:
    receipt = ROOT / 'qa/ten-reference/06' / directory / 'report.json'
    if receipt.exists():
        evidence = read(receipt)
        native_evidence.append({'report': str(receipt.relative_to(ROOT)),
                                'sourceHash': evidence['source']['hash'],
                                'completedAt': evidence.get('completedAt'),
                                'actualViews': [str((receipt.parent / v).relative_to(ROOT)) for v in views],
                                'visualAccepted': False})
builder = LANE / 'build-statue-r11-joined-cloth.py'
helper = LANE / 'statue_r11_geometry.py'
assert identity(builder, '')['sha256'] == report['builderSha256']
assert identity(helper, '')['sha256'] == report['geometryHelperSha256']
assert validation['weldedSkinConnectivity']['components'] == 1
assert report['topology']['boundaryEdges'] == 0
assert report['topology']['nonManifoldEdges'] == 0
assert report['renderedSourceVertexMaxDeltaAfterRetopology'] == 0
assert all(g['imageMaps'] == 0 for g in validation['glb'])

history = LANE / 'handoff-history/r06'
history.mkdir(parents=True, exist_ok=True)
for name in ('README.md', 'handoff.json', 'handoff-assets.json'):
    old = LANE / name
    if old.exists() and not (history / name).exists():
        shutil.copyfile(old, history / name)

review = {
    'revision': 'R11',
    'status': 'frozen-for-provisional-native-integration-unaccepted',
    'visualAccepted': False,
    'actualViews': ['front.png', 'three-quarter.png'],
    'positiveChanges': [
        'R09 cracked patch boundary and R10 detached rear cards are absent in both actual R11 views.',
        'Knee fan/hem relief now changes the existing closed leg/core vertices; no separate cloth sheet or return card is created.',
        'R10 lower/outward connected hands and compact raised collar retained; actual scan face surface and placement unchanged.',
        'Welded source-head/neck/body skin is closed and has one connected component.'
    ],
    'remainingVisualDifferences': [
        'Knee relief is still rippled/foil-like, while the reference has broad, weighted carved cloth folds.',
        'Torso folds remain regular and idealized; sleeve and crossed-foot shapes need more reference-specific carving.',
        'Optional lotus petals are thinner and pointed relative to early revisions, but their sections remain blocky and the repeated layering is too regular.',
        'The actual licensed head is a different sculpture from the reference; its facial proportions and quiet expression are not an exact match.',
        'Studio gold highlights exaggerate repeated volumes. Native lighting/material assessment belongs to the full scene comparison.'
    ],
    'generatedReportWordingCorrection': {
        'file': 'report.json',
        'reason': 'The frozen builder inherited two R09/R10 descriptions while its R11 geometry helper replaced that construction.',
        'staleText': [
            'Weighted closed knee-robe shells sampled from actual authored limb geometry, with deep irregular carved folds and rolled hems.',
            'Knee sheath relief fades to zero at real limb boundaries; broad fan folds replace the serrated raised upper patch edge.'
        ],
        'actualR11Construction': 'No knee shell/sheath mesh is generated. Fan folds and hem returns directly displace existing closed leg/core vertices; ray tests only locate the local limb contour. The geometry helper and actual views are authoritative.'
    },
    'integrationDecision': 'Scene06 owner reviewed both actual views and selected R11 for provisional native full/altar comparison, with visualAccepted:false.',
    'nativeIntegrationEvidence': native_evidence,
    'nativeViewFinding': 'R11 actual altar and low three-quarter retain no detached card/cracked knee edge. Knees still read as long polished bars, lap cloth lacks broad fan drape, torso folds repeat, and source facial type/under-jaw prominence differs from the target.',
    'nextGate': 'Parent and scene owner review actual full-sculpture scan candidates before choosing a donor. Preserve frozen R11 and completed native views; no further isolated GPU job unless a blocking geometry fault is found.',
    'priorFailuresPreserved': {
        'R09': '../r09-draped-sculpture/review-findings.json',
        'R10': '../r10-reference-pose-sculpture/review-findings.json'
    }
}
write(OUT / 'review-findings.json', review)

materials = {
    'revision': 'scene06-foundation-r11',
    'visualAccepted': False,
    'colorSpace': 'baseColorLinear is linear RGB; hex values below are sRGB.',
    'materials': manifest['materials'],
    'sRGBHex': {'cloth': '#c5a04c', 'face': '#cfa952', 'hand': '#cba650',
                'hair': '#211c15', 'gold': '#d5b15c', 'oldgold': '#b18c3e',
                'burnished_detail': '#d8b868'},
    'bodyBatchMapping': {'cloth': 'cloth', 'face': 'face', 'hand': 'hand',
                         'hair': 'hair', 'gold': 'burnished_detail'},
    'lotusBatchMapping': {'cloth': 'cloth', 'gold': 'gold', 'oldgold': 'oldgold'},
    'scopeMappingNote': 'The body SC07 gold tag represents burnished_detail (.95 metalness/.31 roughness); the lotus gold tag represents gold (.94/.42). Resolve material by batch scope. The original generated manifest retains both material records.',
    'sourceTexturesUsed': False,
    'rendererLimit': 'Cycles scalar values are a starting material contract; they do not establish native WebGL pixel equivalence.'
}
write(OUT / 'material-contract.json', materials)

provenance = {
    'revision': 'scene06-foundation-r11',
    'visualAccepted': False,
    'assetPathsRelativeTo': str(LANE.relative_to(ROOT)),
    'actualGeometrySource': source,
    'preservedSource': identity(LANE / 'sources/ccby-beachmouse-japanese-head/source-objaverse.glb', 'unchanged licensed source GLB'),
    'sourcePrimaryMetadata': identity(LANE / 'sources/ccby-beachmouse-japanese-head/creator-primary-metadata.json', 'primary creator metadata/license receipt'),
    'sourceProvenanceLimit': 'Creator records a Japanese tea garden in California. Maker, date, period and place of manufacture are undocumented; this is not the CMA Heian sculpture or the supplied target statue.',
    'requiredAttribution': 'Buddha Head by beachmouse, licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/), via Sketchfab (https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab) and the public Objaverse dataset. Modified for temple-cinema statue foundation R11.',
    'modifications': [
        'Source bytes preserved unchanged; derived copies weld coincident UV seams and remove all scan textures.',
        'Rigid centering/normalization, uniform scale, neck and scalp crop, two Catmull-Clark subdivision levels, uniform physical regilding.',
        'Source face/jaw/ears/lobes above the crop retain their shape and placement; source-neck opening is joined by quad/zipper bridge to authored compact collar/body.',
        'New torso, robe, continuous arms, paired inward thumb-index-loop hands, crossed legs/feet, dense fine hair curls, ornament and optional lotus are authored geometry.',
        'R11 knee/hem relief is sculpted directly into the existing closed limb/core surface.'
    ],
    'sourceFaceCageWarped': False,
    'renderedSourceVertexMaxDeltaAfterRetopology': report['renderedSourceVertexMaxDeltaAfterRetopology'],
    'originalCageRetainedInBlend': True,
    'referenceOnly': {
        'target': 'references/hd/4-照片-5.jpg',
        'CMA': 'Cleveland Museum of Art, 1973.85.a Seated Buddha (sculpture), CC0 collection images; seven original files and hashes in sources/image-provenance.json.',
        'CMA3DDownload': 'Official Sketchfab original download required authentication (HTTP401). No official CMA 3D source was acquired.',
        'imageReceipt': identity(LANE / 'sources/image-provenance.json', 'museum reference image URL/SHA receipt'),
        'use': 'Visual form comparison only. No photographs are projected, textured, used as geometry/displacement, or passed off as a rendered scene.'
    },
    'derivedImageMaps': 0,
    'builder': identity(builder, 'frozen R11 build/reproducer'),
    'geometryHelper': identity(helper, 'frozen R11 authored geometry'),
    'licensePropagation': 'Keep this provenance and the beachmouse CC BY attribution alongside any redistributed derived central statue or reused face core. New authored additions do not remove the source attribution requirement.'
}
write(OUT / 'provenance.json', provenance)

contract = {
    'status': 'frozen-for-provisional-native-integration-unaccepted',
    'revision': manifest['revision'],
    'visualAccepted': False,
    'packageDirectory': str(OUT.relative_to(ROOT)),
    'generatedGeometryManifest': 'sc07/manifest.json',
    'coordinateSystem': manifest['coordinateSystem'],
    'seatAnchor': manifest['seatAnchor'],
    'aboveSeatHeight': validation['aboveSeatHeight'],
    'bodyBounds': manifest['bodyBounds']['threeYUp'],
    'assemblyBounds': manifest['assemblyBounds']['threeYUp'],
    'negativeYMinimum': 'The body apron hangs .103117 units below the seat; the optional lotus extends .700000 units below it.',
    'bodyOnly': manifest['bodyOnly'],
    'lotusOnlyOptional': manifest['lotusOnly'],
    'faceCore': manifest['faceCore'],
    'faceCoreReuseLimit': 'This core includes the R11 shorter authored throat down to neckAnchorY2.25 and no hair/crown. It is not an automatic replacement for the R08 core (neckAnchorY2.07) already fitted to attendants by the scene owner.',
    'materialContract': 'material-contract.json',
    'provenance': 'provenance.json',
    'visualReview': 'review-findings.json',
    'binaryValidation': 'geometry-validation.json',
    'nativeIntegrationEvidence': native_evidence,
    'editedByThisLane': 'Only lookdev/scene06-statue-foundation-v2; canonical integration is owned by scene06_monumental_altar_v3.',
    'pendingOwnRenderJobs': 0
}
write(OUT / 'integration-manifest.json', contract)

paths = [
    ('sources/ccby-beachmouse-japanese-head/source-objaverse.glb', 'unchanged CC BY source'),
    ('sources/ccby-beachmouse-japanese-head/provenance.json', 'source delivery/license metadata'),
    ('sources/ccby-beachmouse-japanese-head/creator-primary-metadata.json', 'primary creator metadata'),
    ('sources/image-provenance.json', 'official CC0 comparison-image receipts'),
    ('build-statue-r11-joined-cloth.py', 'frozen R11 builder'),
    ('statue_r11_geometry.py', 'frozen R11 authored geometry helper'),
    ('verify_r11_outputs.py', 'independent CPU geometry/export verification'),
    ('finalize_r11_handoff.py', 'CPU-only documentation/handoff reproducer'),
]
for name, role in [
    ('front.png', 'actual Cycles front view'), ('three-quarter.png', 'actual Cycles three-quarter view'),
    ('editable-coherent-statue.blend', 'editable source and actual studio scene'),
    ('japanese-buddha-body.glb', 'body-only generated mesh'),
    ('japanese-buddha-with-lotus.glb', 'generated mesh with optional lotus'),
    ('actual-face-ears-neck-core.glb', 'separately identifiable face/ears/neck core'),
    ('report.json', 'frozen builder receipt; see review sidecar wording correction'),
    ('boundary-loops.json', 'actual join boundary receipt'),
    ('geometry-validation.json', 'independent export/skin-connectivity verification'),
    ('sc07/manifest.json', 'generated material-batched geometry manifest'),
    ('material-contract.json', 'scope-specific material mapping'),
    ('provenance.json', 'source and modification attribution'),
    ('review-findings.json', 'honest visual review and prior-failure links'),
    ('integration-manifest.json', 'current integration contract'),
]:
    paths.append((str((OUT / name).relative_to(LANE)), role))
for scope in ('bodyOnly', 'lotusOnly'):
    for part in manifest[scope]:
        path = OUT / 'sc07' / part['file']
        item = identity(path, scope + ' ' + part['material'] + ' SC07 geometry')
        assert item['sha256'] == part['sha256'] and item['bytes'] == part['bytes']
        paths.append((str(path.relative_to(LANE)), item['role']))
for part in manifest['faceCore']['parts']:
    path = OUT / 'sc07' / part['file']
    item = identity(path, 'separate face-core SC07 geometry')
    assert item['sha256'] == part['sha256'] and item['bytes'] == part['bytes']
    paths.append((str(path.relative_to(LANE)), item['role']))
assets = {'revision': 'R11', 'visualAccepted': False,
          'assetPathsRelativeTo': str(LANE.relative_to(ROOT)),
          'assets': [identity(LANE / p, role) for p, role in paths]}
write(LANE / 'handoff-assets.json', assets)
write(OUT / 'handoff-assets.json', assets)

handoff = {
    'status': contract['status'],
    'revision': 'R11',
    'visualAccepted': False,
    'assetPathsRelativeTo': str(LANE.relative_to(ROOT)),
    'integrationAccepted': False,
    'isolatedBuilderChangedCanonical': False,
    'canonicalOwner': '/root/scene06_monumental_altar_v3',
    'integrationDecision': review['integrationDecision'],
    'pendingOwnRenderJobs': 0,
    'currentPackage': str(OUT.relative_to(LANE)),
    'currentIntegrationManifest': 'r11-joined-cloth-sculpture/integration-manifest.json',
    'bodyOnlySC07': 'r11-joined-cloth-sculpture/sc07/manifest.json',
    'bodyGLB': 'r11-joined-cloth-sculpture/japanese-buddha-body.glb',
    'bodyAndLotusGLB': 'r11-joined-cloth-sculpture/japanese-buddha-with-lotus.glb',
    'faceCoreGLB': 'r11-joined-cloth-sculpture/actual-face-ears-neck-core.glb',
    'editableProject': 'r11-joined-cloth-sculpture/editable-coherent-statue.blend',
    'actualViews': ['r11-joined-cloth-sculpture/front.png', 'r11-joined-cloth-sculpture/three-quarter.png'],
    'coordinateSystem': contract['coordinateSystem'],
    'seatAnchor': contract['seatAnchor'],
    'aboveSeatHeight': contract['aboveSeatHeight'],
    'bodyBounds': contract['bodyBounds'],
    'substantiveChanges': review['positiveChanges'],
    'remainingDifferences': review['remainingVisualDifferences'],
    'sourceAttribution': provenance['requiredAttribution'],
    'sourceProvenanceLimit': provenance['sourceProvenanceLimit'],
    'validation': {
        'file': 'r11-joined-cloth-sculpture/geometry-validation.json',
        'skinTopology': report['topology'],
        'weldedSkinConnectivity': validation['weldedSkinConnectivity'],
        'sourceFaceVertexDelta': 0,
        'derivedImageMaps': 0,
        'scope': validation['scope']
    },
    'revisionHistory': {
        'R01-R06': 'Preserved originals and previous handoff in handoff-history/r06; neck flange and other visual failures rejected.',
        'R08': 'Source-preserving welded head-neck-body bridge; actual paired raised gesture; still cylindrical legs. Provisionally integrated.',
        'R09': 'Bent weighted leg foundations; failed serrated knee patch seam. Preserved with review-findings.json.',
        'R10': 'Lower/outward hands and compact collar; failed detached rear return cards. Preserved with review-findings.json.',
        'R11': 'No separate knee sheath; direct relief in closed limbs. Reviewed for provisional integration, still unaccepted.'
    },
    'reproducers': [
        '/usr/bin/python3 lookdev/scene06-statue-foundation-v2/fetch-japanese-head.py',
        'node tools/run-blender-queued.mjs lookdev/scene06-statue-foundation-v2/build-statue-r11-joined-cloth.py',
        '/usr/bin/python3 lookdev/scene06-statue-foundation-v2/verify_r11_outputs.py',
        '/usr/bin/python3 lookdev/scene06-statue-foundation-v2/finalize_r11_handoff.py'
    ],
    'queuePolicy': 'All Blender/native work uses the official shared FIFO/mutex. R11 two-view Blender job is complete; no further own GPU job is planned unless actual native comparison reveals a blocking geometry fault.',
    'nextGate': review['nextGate']
}
write(LANE / 'handoff.json', handoff)
write(OUT / 'handoff.json', handoff)
print(json.dumps({'status': handoff['status'], 'visualAccepted': False,
                  'assetsHashed': len(assets['assets']),
                  'integrationManifest': handoff['currentIntegrationManifest'],
                  'sourceAndGeometryHashesUnchanged': True}))
