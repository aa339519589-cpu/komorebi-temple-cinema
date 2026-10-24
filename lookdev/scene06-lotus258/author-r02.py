from pathlib import Path
import ctypes,os,json,hashlib
root=Path('/Users/mima1234/temple-cinema-live-sync');base=root/'lookdev/scene06-lotus258/candidate-r01';out=root/'lookdev/scene06-lotus258/candidate-r02'
if out.exists():raise SystemExit('Preserve existing candidate')
clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile;clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int]
def copy(a,b):
 if a.is_symlink():b.symlink_to(os.readlink(a));return
 if a.is_dir():
  b.mkdir()
  for x in a.iterdir():copy(x,b/x.name)
 else:
  if clone(os.fsencode(a),os.fsencode(b),0):raise OSError(ctypes.get_errno(),str(a))
out.mkdir()
for name in ['reconstructions','tools','vendor','assets']:copy(base/name,out/name)
p=out/'reconstructions/scene-06/src/lotus-gilt222.js';s=p.read_text().replace('root258-r01','root258-r02').replace('lotus258-r01-beaten-gilt-','lotus258-r02-beaten-gilt-')
s=s.replace("['lotusGold',[.72,.46,.145],.28]","['lotusGold',[.72,.46,.145],.35]").replace("['lotusGiltSoft',[.63,.38,.105],.31]","['lotusGiltSoft',[.63,.38,.105],.38]").replace("['lotusEdge',[.80,.56,.21],.25]","['lotusEdge',[.80,.56,.21],.32]")
p.chmod(0o644);p.write_text(s)
(root/'lookdev/scene06-lotus258/r02-authoring-receipt.json').write_text(json.dumps({'parentSourceHash':'a5810912da64501b9e1c93b17f59d29195a06a6fdafa5043de04e8f9e6df78e3','changedOnly':'src/lotus-gilt222.js','reason':'Root personally viewed actual full and true crop. R01 exposed layered sculpture but strong repeated rectangular interior probe highlights made leaves appear machined. Intermediate roughness keeps all explicit geometric tiers and gold linear albedo fixed.','notAGlobalLightingSolution':True,'photographicAccepted':False},indent=2)+'\n')
