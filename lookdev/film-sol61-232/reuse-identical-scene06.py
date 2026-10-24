from pathlib import Path
import ctypes,hashlib,json,os
root=Path('/Users/mima1234/temple-cinema-live-sync')
target=Path('/Users/mima1234/temple-cinema-film-f-sol61-232')
iteration='scene06-ceiling228-motion-r01-personal-nc'
src=root/'qa/ten-reference/06'/('iteration-'+iteration)
dst=target/'qa/ten-reference/06'/('iteration-'+iteration)
proof=json.loads((root/'lookdev/film-sol61-232/snapshot-proof.json').read_text())
assert proof['status']=='snapshot-materialized-source-verified'
report=json.loads((src/'report.json').read_text())
source=next(v['actualSnapshot']['hash'] for v in proof['sourceIdentities'] if v['reference']==6)
assert report['source']['hash']==source=='bc7476cb7a26058d916744ed6b56a3e04349160a6668ddc090eae462aeb495e9'
assert report['status']=='motion-review-rendered' and report['size']==1080
assert report['motion']['fps']==24 and report['motion']['expectedFrames']==168 and report['motion']['decodeErrors']==0
assert report['renderSampling']['nativeWidth']==1620
assert not dst.exists();dst.mkdir(parents=True)
lib=ctypes.CDLL(None,use_errno=True);fn=lib.clonefile;fn.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_uint];fn.restype=ctypes.c_int
for old,new in [(src/'motion-review.mp4',dst/'motion-review.mp4'),(src/'report.json',dst/'original-native-report.json')]:
 assert fn(os.fsencode(old),os.fsencode(new),0)==0,(ctypes.get_errno(),old)
 assert old.stat().st_ino!=new.stat().st_ino
 assert hashlib.sha256(old.read_bytes()).digest()==hashlib.sha256(new.read_bytes()).digest()
video_sha=hashlib.sha256((dst/'motion-review.mp4').read_bytes()).hexdigest()
report['motion']['file']=str(dst/'motion-review.mp4')
report['cacheTransfer']={'method':'Independent exact-byte APFS clone of already-rendered identical source clip; no newly rendered or re-encoded pixels','originalReport':str(src/'report.json'),'originalReportSha256':hashlib.sha256((src/'report.json').read_bytes()).hexdigest(),'videoSha256':video_sha,'snapshotSceneSourceHash':source,'sourceCommitAndWorktreePreservedAsOriginalRenderProvenance':True,'visualAccepted':False}
(dst/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(root/'lookdev/film-sol61-232/scene06-identical-clip-reuse.json').write_text(json.dumps(report['cacheTransfer'],ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'identical-source-clip-cache-ready','source':source,'file':report['motion']['file'],'sha256':video_sha}))
