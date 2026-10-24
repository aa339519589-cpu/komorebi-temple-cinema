from pathlib import Path
import subprocess,json,hashlib,ctypes,os
root=Path(__file__).resolve().parents[2]
candidate=root/'lookdev/scene06-room248/combined-prototype-root'
identity=json.loads((root/'lookdev/scene06-room248/combined-r01-source248.json').read_text())['source']
base='62ba98d17d71dc0e11262d9c3307c72ef2ac43e6'
assert identity['hash']=='53b7228f6bbd25fac1069a5308d0d0b03cf8bb7b89424d096be3ceed473bbcbd'
out=root/'lookdev/scene06-combined256/public-source53'
assert not out.exists(),'Preserve source packets'
out.mkdir()
entries=subprocess.check_output(['git','ls-tree','-rz','--full-tree',base],cwd=root)
objects={}
for entry in entries.split(b'\0'):
 if not entry:continue
 meta,path=entry.split(b'\t',1);objects[path.decode()]=meta.split()[2].decode()
clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile
clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int]
changed=[];held=[]
for name,expected in identity['files'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts
 src=candidate/rel
 if not src.is_file():src=root/rel
 data=src.read_bytes();assert hashlib.sha256(data).hexdigest()==expected,(name,'changed')
 blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 if objects.get(name)==blob:held.append({'path':name,'sha256':expected,'gitBlob':blob});continue
 dst=out/'files'/rel;dst.parent.mkdir(parents=True,exist_ok=True)
 assert clone(os.fsencode(src),os.fsencode(dst),0)==0,ctypes.get_errno()
 assert src.stat().st_ino!=dst.stat().st_ino
 changed.append({'path':name,'sha256':expected,'bytes':len(data),'gitBlob':blob,'baseBlob':objects.get(name)})
manifest={'baseCommit':base,'source':identity,'changed':changed,'held':held,'status':'exact-public-source-overlay-not-canonical-promotion','photographicAccepted':False,'instructions':'Checkout baseCommit in a separate directory, then overlay files/ preserving relative paths. Verify the official Scene06 reconstructionSourceIdentity hash equals source.hash before rendering.'}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'README.md').write_text('# 佛堂整屋研究原型源码\n\n基于公开提交 `'+base+'`，将本目录 files/ 内文件按原相对路径覆盖到独立检出目录。完整内容哈希见 manifest.json。全部源几何来自真实3D运行时；不是照片深度片或画面替身。\n\n当前仍未达到参考：供桌、跪垫、柱头、佛像、背光、柜面和整体照明均继续重建，不能作为成品。第三方NC/BY各许可、来源与生成资产提示词随源保留；项目代码许可不重新许可第三方资产。\n')
print(json.dumps({'packet':str(out),'source':identity['hash'],'deltaFiles':len(changed),'deltaBytes':sum(x['bytes']for x in changed),'baseFilesHeld':len(held),'largestDelta':sorted(changed,key=lambda x:x['bytes'],reverse=True)[:5]}))
