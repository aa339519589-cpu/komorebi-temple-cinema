"""Retain an already verified ten-shot working film in the local preview root.

Original capture paths/bytes remain. Independent APFS clones retain the two
masters and actual source end frames; the gallery never substitutes a photo.
This does not activate the player or claim photographic acceptance.
"""
from pathlib import Path
import ctypes,hashlib,json,os,re,sys

root=Path(__file__).resolve().parents[1]
capture=Path(os.environ['FILM_CAPTURE_ROOT']).resolve()
iteration=sys.argv[1]
assert re.fullmatch(r'[A-Za-z0-9_-]+',iteration)
original=capture/'output'/iteration
report=json.loads((original/'film-build.json').read_text())
media=json.loads((original/'media-receipt.json').read_text())
assert report['status']=='ten-scene-draft-rendered'
assert report['sourceCommit']==media['sourceCommit']
assert [s['reference']for s in report['shots']]==list(range(1,11))
assert len(media['masters'])==2 and len(media['shots'])==10
output=root/'output'/iteration;output.mkdir(parents=True,exist_ok=True)
gallery=root/'qa/ten-reference'/('film-review-'+iteration);gallery.mkdir(parents=True,exist_ok=True)
lib=ctypes.CDLL(None,use_errno=True);clone=lib.clonefile
clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_uint];clone.restype=ctypes.c_int
proof=[]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def retain(src,dst,expected=None):
 src=src.resolve();assert src.is_file() and src.is_relative_to(capture)
 expected=expected or sha(src)
 if dst.exists():assert sha(dst)==expected
 else:
  assert clone(os.fsencode(src),os.fsencode(dst),0)==0,ctypes.get_errno()
  assert sha(dst)==expected
 assert src.stat().st_ino!=dst.stat().st_ino and dst.stat().st_nlink==1
 proof.append({'original':str(src),'retained':str(dst),'sha256':expected,'bytes':dst.stat().st_size,'independentExactByteClone':True})

for master in media['masters']:
 retain(original/master['file'],output/master['file'],master['sha256'])
for name in ['film-build.json','media-receipt.json','shot-storyboard.jpg','references-left-renders-right.jpg']:
 retain(original/name,output/name)
scenes=json.loads((capture/'reconstructions/ten-scenes.json').read_text())['scenes'];frames=[]
for shot,scene in zip(report['shots'],scenes):
 n=shot['reference'];file=Path(shot['file']).resolve()
 assert sha(file)==shot['videoSha256']
 native=file.parent/('frame-%04d.png'%(shot['frames']-1))
 target=gallery/('scene-%02d-end.png'%n);retain(native,target)
 item={'reference':n,'name':scene['name'],'referenceFile':scene['referenceFile'],'nativeFile':str(target.relative_to(root)),'sourceHash':shot['source']['hash'],'sourceVideoSha256':shot['videoSha256'],'sourceFrame':shot['frames']-1,'scope':'Actual native last source-shot frame, not a replacement renderReference or authored scene image','visualAccepted':False}
 if n in [4,6]:item.update(license='CC-BY-NC-SA-4.0',licenseUrl='https://creativecommons.org/licenses/by-nc-sa/4.0/',attribution='Scan-the-World / Sainsbury Centre Seated Amida; https://doi.org/10.5281/zenodo.21353739 . Original source and declared sculpture adaptations retained; no endorsement implied.',personalNoncommercialUseOnly=True)
 frames.append(item)
manifest={'status':'working-film-native-source-frames','sourceCommit':report['sourceCommit'],'filmIteration':iteration,'frames':frames,'visualAccepted':False}
(gallery/'frames.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
receipt={'status':'verified-working-film-retained-for-local-review','sourceCommit':report['sourceCommit'],'iteration':iteration,'masterMediaReceipt':'output/'+iteration+'/media-receipt.json','gallery':str((gallery/'frames.json').relative_to(root)),'files':proof,'playerActivated':False,'photographicAccepted':False}
(output/'local-retention.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':receipt['status'],'masters':str(output),'gallery':receipt['gallery'],'files':len(proof),'photographicAccepted':False}))
