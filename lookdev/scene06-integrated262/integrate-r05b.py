from pathlib import Path
import ctypes,os,json,hashlib,datetime
root=Path('/Users/mima1234/temple-cinema-live-sync');p=root/'lookdev/scene06-integrated262';out=p/'r05b';assert not out.exists();out.mkdir()
handoff=json.loads((root/'lookdev/scene06-room248/r05b-handoff248.json').read_text());mapping=json.loads((root/'lookdev/scene06-room248/r05b-complete-source-map248.json').read_text());entries={x['path']:x for x in mapping['files']}
assert handoff['sourceHash']=='9772e80bc709f911e1e2f17b00bf35a49e02631c7d880703ed8fc137872f2d12' and handoff['currentCanonicalHash']=='e27e7f8aa59e12ef688f400e74d8394ba1b33eff986e3b7bd99e07d7ebafd76f'
clone=ctypes.CDLL('/usr/lib/libSystem.B.dylib',use_errno=True).clonefile;clone.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_int]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def cow(a,b):
 b.parent.mkdir(parents=True,exist_ok=True);assert not b.exists();assert clone(os.fsencode(a),os.fsencode(b),0)==0,ctypes.get_errno();assert a.stat().st_ino!=b.stat().st_ino
rows=[]
for name in handoff['changedFiles']:
 assert name.startswith('reconstructions/scene-06/') and '..' not in Path(name).parts
 source=root/'lookdev/scene06-room248/r05b-frozen-delta'/name;assert source.is_file() and sha(source)==entries[name]['sha256']
 target=root/name;before=sha(target)if target.exists()else None
 if target.exists():cow(target,out/'before'/name)
 rows.append({'path':name,'before':before,'after':entries[name]['sha256'],'bytes':source.stat().st_size})
for row in rows:
 source=root/'lookdev/scene06-room248/r05b-frozen-delta'/row['path'];target=root/row['path'];tmp=target.with_name(target.name+'.integrate262');cow(source,tmp);tmp.chmod(0o644);assert sha(tmp)==row['after'];os.replace(tmp,target)
r={'status':'whole-room-working-source-integrated-awaiting-final-identity-check','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'previousCanonicalSource':handoff['currentCanonicalHash'],'expectedCanonicalSource':handoff['sourceHash'],'files':rows,'rootPersonallyViewed':['R05b full reference camera','R05b true column-capital subfrustum','R05b low oblique'],'photographicAccepted':False,'frozenSource53Unaffected':True,'unmet':'Table sculpture254, cushion255, altar260, side figures257 and physical lighting252 continue as independent candidates; these are not yet in this integration.'}
(out/'integration.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'files':len(rows),'expectedSource':handoff['sourceHash']}))
