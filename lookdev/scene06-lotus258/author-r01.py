from pathlib import Path
import ctypes,os,json,hashlib
root=Path('/Users/mima1234/temple-cinema-live-sync')
base=root/'lookdev/scene06-room248/combined-prototype-root'
out=root/'lookdev/scene06-lotus258/candidate-r01'
if out.exists(): raise SystemExit('Preserve candidate; choose new revision')
clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile
clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int]
records=[]
def copy(a,b):
 if a.is_symlink(): b.symlink_to(os.readlink(a));return
 if a.is_dir():
  b.mkdir();
  for x in a.iterdir():copy(x,b/x.name)
 else:
  if clone(os.fsencode(a),os.fsencode(b),0):raise OSError(ctypes.get_errno(),str(a))
  records.append({'path':str(b.relative_to(out)),'sha256':hashlib.sha256(a.read_bytes()).hexdigest(),'independentInode':a.stat().st_ino!=b.stat().st_ino})
out.mkdir()
for name in ['reconstructions','tools','vendor','assets']:copy(base/name,out/name)
p=out/'reconstructions/scene-06/src/lotus-throne222.js'
s=p.read_text();s=s.replace("'lotus222-r07-'","'lotus258-r01-'")
s=s.replace('const meridian=(1.61+.018*kind)*v-(.82+.012*kind)*v*v+.02*v*v*v;','const meridian=(.30+.012*kind)*v+(.55-.012*kind)*Math.sin(Math.PI*.84*v);')
s=s.replace('const width=[.455,.415,.435][kind]*outline;','const width=[.455,.415,.435][kind]*outline*.72;')
s=s.replace("const rings=[{n:15,base:.025,span:.88,rr:.58,scale:.47,phase:.13},{n:14,base:.30,span:.62,rr:.52,scale:.42,phase:.66},{n:15,base:.68,span:.31,rr:.50,scale:.38,phase:.18}];","const rings=[{n:22,base:.015,span:.64,rr:.61,scale:.50,phase:.13},{n:21,base:.23,span:.69,rr:.54,scale:.50,phase:.66},{n:20,base:.59,span:.40,rr:.46,scale:.51,phase:.18}];")
s=s.replace("revision:'r07',rows:3,petals:44","revision:'root258-r01',rows:3,petals:63")
s=s.replace('Outward-pointing apex remains in front of its own shoulder in the low\n  // reference camera. R05 returned its apex into the inflated silhouette,\n  // hiding the point and making the closed leaves read like round balloons.','R01 study: short convex cast leaves return toward a narrower pointed\n  // crown. Separate vertically staggered tiers expose the return instead of\n  // hiding every upper tier behind one long outer tulip cup.')
s=s.replace('with flared pointed apexes','with shorter convex bodies, returned pointed apexes and staggered visible tiers')
p.chmod(0o644);p.write_text(s)
p=out/'reconstructions/scene-06/src/lotus-gilt222.js';s=p.read_text().replace("==='r07'","==='root258-r01'").replace("='r07'","='root258-r01'").replace('lotus222-r07-beaten-gilt-','lotus258-r01-beaten-gilt-')
s=s.replace("['lotusGold',[.72,.46,.145],.43]","['lotusGold',[.72,.46,.145],.28]").replace("['lotusGiltSoft',[.63,.38,.105],.46]","['lotusGiltSoft',[.63,.38,.105],.31]").replace("['lotusEdge',[.80,.56,.21],.39]","['lotusEdge',[.80,.56,.21],.25]").replace('m.metalness=.94','m.metalness=.99')
p.chmod(0o644);p.write_text(s)
proof={'baseSourceHash':'53b7228f6bbd25fac1069a5308d0d0b03cf8bb7b89424d096be3ceed473bbcbd','clone':records,'changedOnly':['src/lotus-throne222.js','src/lotus-gilt222.js'],'scope':'Actual three-layer closed carved meshes; reference picture used only for side-by-side shape study. Geometry and material values inferred, not measured.','contactCoreAndSourceHemUnchanged':True,'bodyAndRoomAndCameraAndLightUnchanged':True,'photographicAccepted':False}
(root/'lookdev/scene06-lotus258/r01-authoring-receipt.json').write_text(json.dumps(proof,indent=2)+'\n')
print(json.dumps({'candidate':str(out),'files':len(records),'independentInodes':all(r['independentInode'] for r in records)}))
