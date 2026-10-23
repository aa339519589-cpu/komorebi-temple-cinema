from pathlib import Path
import json,hashlib,os,subprocess,datetime,shutil,re
root=Path('/Users/mima1234/temple-cinema-live-sync');base=root/'lookdev/scene06-solmax-cycles-20261021/export';report=json.loads((base/'export-report.json').read_text())
assert report['sourceHash']=='061e581d9b6fdf04e08a8133ad6f45b28bc9c6531c6a41aefd3b142ca2deefe0'
receipt=base/'duplicate-buffers-linked-20261023.json';assert not receipt.exists()
handles=subprocess.run(['lsof','+D',str(base)],capture_output=True,text=True);assert handles.returncode==1 and not handles.stdout.strip()
def digest(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
source_inodes={(p.stat().st_dev,p.stat().st_ino)for n in report['source']['files']if(p:=root/n).exists()}
groups={};records=[];previouslyAbsent=[]
for n,r in report['exportedAssets'].items():
 if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',n):continue
 p=base/'assets'/n
 if not p.exists():previouslyAbsent.append(n);continue
 assert p.is_file() and not p.is_symlink();s=p.stat();assert(s.st_dev,s.st_ino)not in source_inodes,n
 assert s.st_size==r['bytes'] and digest(p)==r['sha256'],n
 leader=groups.setdefault(r['sha256'],n);records.append({'file':n,'leader':leader,**r})
free0=shutil.disk_usage(root).free
receipt.write_text(json.dumps({'status':'all-input-bytes-verified-before-dedup','sourceHash':report['sourceHash'],'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Only identical derived buffers inside this one obsolete readonly export. Every filename and byte remains; no live assets, originals, images or source data removed.','previouslyAbsentBeforeThisOperation':previouslyAbsent,'verifiedNoOpenHandles':True,'verifiedNoLiveSourceInodeAliases':True,'files':records},indent=2)+'\n')
linked=0
for r in records:
 if r['file']==r['leader']:continue
 p=base/'assets'/r['file'];leader=base/'assets'/r['leader']
 if p.stat().st_ino==leader.stat().st_ino:continue
 temp=p.with_name(p.name+'.dedup-temporary');assert not temp.exists();os.link(leader,temp);os.replace(temp,p);linked+=1
for n in groups.values():(base/'assets'/n).chmod(0o444)
for r in records:
 p=base/'assets'/r['file'];assert p.stat().st_size==r['bytes'] and p.stat().st_ino==(base/'assets'/r['leader']).stat().st_ino
result=json.loads(receipt.read_text());result.update(status='all-export-paths-and-bytes-preserved-identical-buffers-linked',linkedDuplicateFiles=linked,freeBytesBefore=free0,freeBytesAfter=shutil.disk_usage(root).free)
receipt.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'linked':linked,'freeGiB':shutil.disk_usage(root).free/2**30,'receipt':str(receipt)}))
