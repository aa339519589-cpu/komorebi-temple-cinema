from pathlib import Path
import json,hashlib,struct
root=Path('.')
work=root/'lookdev/scene10-mass183'
identity=json.loads((work/'source183-r03-final-identity.json').read_text())
held=json.loads((work/'baseline-source-identity.json').read_text())
frames=[]
for name in ['scene10-mass183-r03-hall','scene10-mass183-r03-low3q']:
 directory=root/'qa/ten-reference/10'/('iteration-'+name)
 report=json.loads((directory/'report.json').read_text())
 assert report['status']=='rendered-review' and report['source']['hash']==identity['hash'] and not report['errors']
 assert not any('/references/' in p for p in report['requests'])
 for f in report['frames']:
  assert f['valid'] and f['width']==1254 and f['height']==1254 and f['glError']==0 and not f['contextLost']
  assert all(p['linked'] for p in f['programs'])
  path=directory/(f['name']+'.png');raw=path.read_bytes();assert struct.unpack('>II',raw[16:24])==(1254,1254)
  frames.append({'file':str(path),'report':str(directory/'report.json'),'name':f['name'],'nativeSize':[1254,1254],'valid':True,'pngSha256':hashlib.sha256(raw).hexdigest(),'rawRgbaSha256':f['rgbaSha256'],'pose':f['pose'],'detailCrop':f['detailCrop'],'sourceHash':identity['hash']})
actual=json.loads((root/'qa/ten-reference/10/iteration-scene10-mass183-r03-hall/report.json').read_text())['frames'][0]['info']
baseline=json.loads((root/'qa/ten-reference/10/iteration-scene10-monumental-rain142-r07-ground-20261022/report.json').read_text())['frames'][0]['info']
protected=['layout125.js','near-rain-stones.js','near-surface-reflection.js','paving-mask.js','maple-canopy136.js','rain-frame-maple142.js','licensed-pine141.js','licensed-groundcover142.js','water-film-ripples135.js','stone-lantern.js','solid-receiver142.js','stair-embankment137.js']
protectedFiles={p:held['files']['reconstructions/scene-10/src/'+p]==identity['files']['reconstructions/scene-10/src/'+p] for p in protected}
assert all(protectedFiles.values())
placementKeys=['nearStoneRecords','fallenLeaves142','towerHillPlantings142','bridgeHallPlan','bridgeEndSupports125','bridgeAbutment125','hallShoreline125','solmaxRockBank141','mapleCanopy136']
placements={k:actual[k]==baseline[k] for k in placementKeys}
placements['licensedForest141.placements']=actual['licensedForest141']['placements']==baseline['licensedForest141']['placements']
placements['licensedGroundcover142.placements']=actual['licensedGroundcover142']['placements']==baseline['licensedGroundcover142']['placements']
assert all(placements.values())
parts=actual['hall132']['mass183']['parts'];gaps=[abs(p['bearingGap']) for p in parts if p.get('kind')=='closed-square-cantilever' and 'bearingGap'in p]
assert gaps and max(gaps)<1e-10
changes=[p for p,h in identity['files'].items() if held['files'].get(p)!=h]
validation={'sourceHash':identity['hash'],'status':'actual-native-renders-valid-photography-unaccepted','visualAccepted':False,'nativeFrames':frames,'allValid':True,'referencePhotoRuntimeRequests':0,'protectedFilesByteIdentical':protectedFiles,'protectedRuntimePlacementsIdentical':placements,'modeledAngledBearingEndpoints':{'checked':len(gaps),'maxYGap':max(gaps),'scope':'Analytic true section endpoint in actual runtime receipt; not full collision or structural engineering certification.'},'mountedScan':actual['carvedCloud183'],'rendererTriangleDraws':actual['triangles'],'triangleCountScope':'Drawn triangles over scene, lighting and reflection passes; not unique triangles.','changedSourceFiles':changes,'noFilmOrPhysicalExports':True}
(work/'validation183-r03.json').write_text(json.dumps(validation,indent=2)+'\n')
print(json.dumps({'sourceHash':identity['hash'],'native1254Frames':len(frames),'valid':True,'protectedRuntimePlacementsIdentical':all(placements.values()),'maxModeledEndpointYGap':max(gaps),'changedSourceFiles':len(changes)}))
