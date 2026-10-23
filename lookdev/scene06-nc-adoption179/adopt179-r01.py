"""Selective NC statue adoption; source positions/normals/indices copied unchanged.
No Blender, renderer, GPU, or scene capture is invoked by this preparation script.
"""
from pathlib import Path
import json,shutil,hashlib,datetime
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
STUDY=Path('/Users/mima1234/temple-cinema-scene06-isolated-nc-context172-study-r01')
SCENE=ROOT/'reconstructions/scene-06'
NAME='nc-sainsbury-amida179-CC-BY-NC-SA-4.0'
DEST=SCENE/'assets'/NAME
SRC=STUDY/'reconstructions/scene-06/assets/isolated-nc-context172-CC-BY-NC-SA-4.0'
DEST.mkdir(exist_ok=True)
for name in ['central-sainsbury-r09-CC-BY-NC-SA-4.0-3e33b700a894f466.bin','paired-source-arms-CC-BY-NC-SA-4.0.glb','provenance.json']:
 if (DEST/name).exists(): (DEST/name).chmod(0o644)
 shutil.copy2(SRC/name,DEST/name)
 if name=='provenance.json': (DEST/name).chmod(0o644)
primary=ROOT/'lookdev/scene06-statue-foundation-v2/noncommercial-sainsbury-r01-source-gold/source-CC-BY-NC-SA-4.0'
for a,b in [('primary-zenodo-record.json','primary-zenodo-record.json'),('edm.xml','primary-edm.xml'),('a0044f43bef4d53b7248c6c798ad01d5.glb','original-source-CC-BY-NC-SA-4.0.glb')]:
 shutil.copy2(primary/a,DEST/b)
attr='Scan-the-World, Seated Amida, the Buddha of the Western Paradise at the Sainsbury Centre for Visual Arts, Norwich. Zenodo 21353739, https://doi.org/10.5281/zenodo.21353739 . CC BY-NC-SA 4.0, https://creativecommons.org/licenses/by-nc-sa/4.0/ . Modifications: previously curated paired-arm/robe/knee reflection with narrowly stitched retopology, native index curl and local fingertip contact; plinth separation; positive uniform viewing normalization; uniform gold PBR. Source face retained. Adoption179 keeps the prepared source anatomy, positions, normals and triangle indices unchanged; only a positive uniform scene scale and translation seat it on separately authored lotus geometry. No endorsement implied.'
manifest=json.loads((SRC/'manifest.json').read_text())
manifest.update({'revision':'scene06-nc-sainsbury-amida179-r01','isolatedNoncommercialOnly':False,'personalNoncommercialUseOnly':True,'productionIntegrated':True,'sourceAndProductionLicenseDecisionPending':False,'visualAccepted':False,'attribution':attr,'userAuthorization':{'date':'2026-10-23','text':'仅个人欣赏，允许使用非商用雕像素材','scope':'User personal noncommercial final video and source integration with explicit asset-specific CC BY-NC-SA 4.0 terms. No commercial permission or permissive relicensing.'},'canonicalPackageScope':'Actual source body SC07, original source and curated R09 GLB. These files and adaptations remain CC BY-NC-SA 4.0. Independently authored room/altar and separately licensed attendant assets keep their individual terms. The repository permissive license does not relicense this NC asset. Derived scene06 still/video imagery is marked CC BY-NC-SA 4.0.','recommendedCentralHaloCenterModelY':2.72,'recommendedCentralMandorlaZ':-.79,'recommendedMainLotusDepthAspect':.72,'recommendedUniformWorldHeight':2.50})
manifest['materials']['central'].update({'metalness':.88,'roughness':.47})
manifest['nativeMaterialStudyChange']='Adoption179 R01 uses uniform gold PBR metalness .88, roughness .47; no part masks, donor face replacement, image projection, or photo pixels. Actual source face/anatomy unchanged.'
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(DEST/'LICENSE-CC-BY-NC-SA-4.0.txt').write_text('CC BY-NC-SA 4.0\nhttps://creativecommons.org/licenses/by-nc-sa/4.0/\n\n'+attr+'\n\nAsset-specific license: the original scan and all prepared adaptations in this directory are licensed under CC BY-NC-SA 4.0. This license is not superseded by the repository license. User authorized personal noncommercial use on 2026-10-23. Reuse must retain attribution, modification notices, the NonCommercial condition, and ShareAlike terms.\n')
provenance=json.loads((DEST/'provenance.json').read_text())
provenance['historicalStudyProvenance']=True
provenance['adoption179']={'attribution':attr,'date':'2026-10-23','personalNoncommercialUseOnly':True,'productionIntegrated':True,'sourceAndProductionLicenseDecisionPending':False,'sourceGeometryBytesUnchanged':True,'sourceGeometrySha256':hashlib.sha256((DEST/manifest['variants']['central'][0]['file']).read_bytes()).hexdigest(),'uniformWorldHeight':2.50,'worldScale':2.50/3.26,'sourceBodyNonrigidDelta':0,'sourceFaceNonrigidDelta':0,'sourceNormalsOrIndicesEdited':False,'uniformMaterial':manifest['materials']['central'],'derivedImageryLicense':'CC-BY-NC-SA-4.0','historicalStudyFields':'Top-level isolated/pending fields describe the original immutable conversion study, superseded for adoption by this entry and manifest.'}
(DEST/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
loader=(SCENE/'src/sculptural-cast-assets.js').read_text()
loader=loader.replace(" // Main body uses measured CC0 Tang cloth and a actual CC BY source head,\n // local mounts/arms. Independent CC BY side-head bearings remain. All", " // Main body uses actual Scan-the-World Japanese Amida geometry (CC BY-NC-SA4).\n // User authorized personal noncommercial adoption; original face is unchanged. All")
loader=loader.replace("../assets/sculpture165-r07/",'../assets/'+NAME+'/').replace("foundation.revision!=='scene06-sculpture165-r07'","foundation.revision!=='scene06-nc-sainsbury-amida179-r01'").replace("Wrong measured-cloth/source-head revision","Wrong NC actual-source revision")
loader=loader.replace("revision:'scene06-sculpture165-r07-central-with-v4-attendant-bearings'","revision:'scene06-nc-adoption179-r01-CC-BY-NC-SA4-with-v4-attendants'")
loader=loader.replace("mainMetrics:{headAxis:foundation.modelHeadAxis,", "license:foundation.license,attribution:foundation.attribution,personalNoncommercialUseOnly:true,mainMetrics:{uniformWorldHeight:foundation.recommendedUniformWorldHeight,")
(SCENE/'src/sculptural-cast-assets.js').write_text('// Central source geometry and its adaptations: CC BY-NC-SA 4.0; see asset-specific license.\n'+loader)
p=SCENE/'src/reference6-scene.js';s=p.read_text();s=s.replace("revision:'scene-06-sculpture165-r07-measured-neck-join'","revision:'scene06-nc-adoption179-r01-personal-CC-BY-NC-SA4'")
a=s.index("sourceLimit:'");b=s.index("'});",a)
s=s[:a]+"sourceLimit:'Personal noncommercial adoption of the actual Scan-the-World Sainsbury Japanese Amida under CC BY-NC-SA4.0. Prepared source anatomy/face and curated hand pose unchanged; only uniform scale and translation. Source sculpture/scalp/drapery differ from reference; photographic fidelity remains unaccepted. Asset-specific license applies; no blanket permissive relicense."+s[b:]
s=s.replace('const mainFigureScale=2.27/3.26','const mainFigureScale=(sculptureMetrics?.uniformWorldHeight??2.50)/3.26')
s=s.replace('throneRadii:[1.14,.76]','throneRadii:[1.24,.76]')
s=s.replace('mainThroneHeight:.70','mainThroneHeight:.64')
s=s.replace("widthScale:i===0?1.04:.94,depthScale:1.02", "widthScale:i===0?1:.94,depthScale:i===0?1:1.02")
s=s.replace("Monumental altarV3 with CC0 measured main cloth, actual CC BY main head and independent CC BY attendant heads; photographic fidelity remains unaccepted.","Monumental altarV3 with actual Japanese Amida central source under asset-specific CC BY-NC-SA4 for personal noncommercial use; independent CC BY attendant heads retained. Photographic fidelity remains unaccepted.")
p.write_text(s)
p=SCENE/'src/restoration-altar.js';s=p.read_text()
s=s.replace("b.lathe('r9-concealed-lotus-seat',[[0,0],[.40,0],[.41,.015],[0,.015]],0,height-.015,0,radius,1,'oldgold',48);", "// A broad concealed bearing follows the actual scanned hem footprint;\n    // the source body is unchanged and is not suspended over a tiny seat cap.\n    const seatProfile=radius>1?[[0,-.012],[.76,-.012],[.81,-.006],[.81,.010],[.76,.018],[0,.018]]:[[0,0],[.40,0],[.41,.015],[0,.015]];\n    b.lathe('r179-concealed-source-lotus-bearing',seatProfile,0,height-.015,0,radius,1,'oldgold',radius>1?64:48);")
p.write_text(s)
p=SCENE/'asset-dependencies.json';d=json.loads(p.read_text());d['use']='Personal noncommercial scene06: actual Scan-the-World Sainsbury Japanese Amida central geometry (CC BY-NC-SA 4.0), original face/anatomy unchanged from curated R09 source, positive uniform normalization only. Independent V4 CC BY attendant heads and room/altar retained. No source photograph RGB, projected faces, image maps on the statue, or replacement frame. Photographic match remains unaccepted.'
for f in sorted(DEST.iterdir()):
 rel=str(f.relative_to(ROOT))
 if rel not in d['files']: d['files'].append(rel)
p.write_text(json.dumps(d,indent=2)+'\n')
(ROOT/'lookdev/scene06-nc-adoption179/license-and-adoption179.json').write_text(json.dumps({'status':'personal-noncommercial-adoption-in-progress','license':'CC-BY-NC-SA-4.0','licenseUrl':manifest['licenseUrl'],'sourceURL':'https://zenodo.org/records/21353739','primaryLicenseVerifiedOnline':'2026-10-23','attribution':attr,'authorization':manifest['userAuthorization'],'originalGeometryAndCuratedR09FilesPreserved':True,'currentScenePreserved':'preserved-canonical165-r07-before-adoption','rawRuntimeSha256':provenance['adoption179']['sourceGeometrySha256'],'visualAccepted':False,'fullFilmRendered':False,'commercialUseAuthorized':False,'blanketPermissiveRelicense':False},indent=2)+'\n')
print('Adoption R01 prepared. Actual source geometry unchanged; original whole canonical source preserved.')
