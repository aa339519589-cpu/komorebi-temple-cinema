from pathlib import Path
import json,subprocess,hashlib,gzip
root=Path(__file__).resolve().parents[2];lane=root/'lookdev/scene06-integrated314';out=root/'qa/ten-reference/06/iteration-scene06-integrated314-published';out.mkdir(exist_ok=True)
s=lane/'candidate-r01/qa/ten-reference/06/iteration-scene06-integrated314-pose-halo';m=lane/'candidate-r01/qa/ten-reference/06/iteration-scene06-integrated314-motion1080';r=json.loads((m/'report.json').read_text());assert r['status']=='motion-review-rendered' and not r['errors'] and r['source']['hash']=='0b049dcf0bd0cace860bfb84afe1cb5c796b349b4fc6ff1bf9bf7d5f3b5e7022'
rows=[]
for source,name in [(s/'reference.png','full.png'),(s/'detail-native.png','main-detail-native.png'),(m/'frame-0000.png','motion-start-native.png'),(m/'frame-0084.png','motion-middle-native.png'),(m/'frame-0167.png','motion-end-native.png'),(m/'motion-review.mp4','motion-review.mp4')]:
 dest=out/name
 if not dest.exists():subprocess.run(['/bin/cp','-c',str(source),str(dest)],check=True)
 h=hashlib.sha256(source.read_bytes()).hexdigest();assert hashlib.sha256(dest.read_bytes()).hexdigest()==h
 rows.append({'file':str(dest.relative_to(root)),'original':str(source.relative_to(root)),'sha256':h,'bytes':dest.stat().st_size})
raw=(m/'report.json').read_bytes();archive=out/'original-motion-report.json.gz'
if not archive.exists():archive.write_bytes(gzip.compress(raw,compresslevel=6,mtime=0))
assert gzip.decompress(archive.read_bytes())==raw
(out/'media.json').write_text(json.dumps({'sourceHash':r['source']['hash'],'status':'working-native-3d-motion-not-final-film','durationSeconds':7,'fps':24,'frames':168,'dimensions':[1080,1080],'nativeDimensions':[1620,1620],'downsampling':'Lanczos','audio':False,'allFramesDecodedWithoutErrors':True,'rootVisualReview':'Full, main crop and motion first/middle/last native frames personally viewed. Not exhaustive temporal-fidelity or shimmer-free proof.','license':'CC-BY-NC-SA-4.0; component attribution retained','files':rows,'compressedOriginalReport':{'file':str(archive.relative_to(root)),'rawBytes':len(raw),'rawSha256':hashlib.sha256(raw).hexdigest()},'photographicAccepted':False,'mainPose295R06Included':True,'knownBoundedNewSelfContactPairs':304,'side257NewPosesIncluded':False},indent=2)+'\n')
f=root/'film.html';t=f.read_text().replace('qa/ten-reference/06/iteration-scene06-integrated309-published/','qa/ten-reference/06/iteration-scene06-integrated314-published/').replace('新柜面、连续背光雕刻、供桌与地垫。佛像姿态仍在重建','主佛手势、柜面、背光雕刻与地垫已更新。袖口、两侧像与光影仍在重建');f.write_text(t)
p=root/'README.md';t=p.read_text().replace('`19c197c5`','`0b049dcf`').replace('分层柜面与连续背光雕刻','分层柜面、连续背光雕刻，以及一手抬起、一手置于膝前的主佛姿态').replace('qa/ten-reference/06/iteration-scene06-integrated309-published/','qa/ten-reference/06/iteration-scene06-integrated314-published/').replace('iteration-scene06-integrated314-published/altar-detail-native.png','iteration-scene06-integrated314-published/main-detail-native.png').replace('主佛手势和胁侍造型仍在单独重建','主佛袖缘/指节、局部自交和胁侍造型仍需继续修进');p.write_text(t)
print(json.dumps({'source':r['source']['hash'],'videoBytes':(m/'motion-review.mp4').stat().st_size,'reportArchiveBytes':archive.stat().st_size}))
