from pathlib import Path
import ctypes,json,hashlib
root=Path(__file__).resolve().parents[2];out=root/'lookdev/current-scenes264';clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile;clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int]
import os
items=[('04','lookdev/scene04-rebuild212/r28-handoff237.json','iteration-scene04-rebuild212-r28-237-reviewed'),('06','lookdev/scene06-room248/r05b-handoff248.json','iteration-scene06-room248-r05b-reviewed')]
rows=[]
for id,handoff,name in items:
 d=json.loads((root/handoff).read_text());path=root/'qa/ten-reference'/id/name;assert not path.exists();path.mkdir(parents=True)
 for view in d['actualViews']:
  a=Path(view['png']);b=path/a.name;assert clone(os.fsencode(a),os.fsencode(b),0)==0
  digest=hashlib.sha256(b.read_bytes()).hexdigest();assert digest==view['sha256']
  r=Path(view['report']);rname='report-low.json'if a.name=='inspection-view.png'else'report.json'
  if not(path/rname).exists():assert clone(os.fsencode(r),os.fsencode(path/rname),0)==0
  rows.append({'reference':int(id),'sourceHash':view['sourceHash'],'originalNative':str(a),'retainedNative':str(b.relative_to(root)),'sha256':digest,'rootPersonallyViewed':True,'independentExactByteRetainedImage':True,'visualAccepted':False})
(out/'retained-native-views.json').write_text(json.dumps({'status':'fixed-source-working-images-retained','images':rows,'photographicAccepted':False,'scope':'Source04R28 and06R05b are current working models, still visibly CG and materially different from reference.'},indent=2)+'\n')
print({'images':len(rows)})
