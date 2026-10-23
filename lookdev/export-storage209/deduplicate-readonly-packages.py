from pathlib import Path
import json,hashlib,os,subprocess,datetime,shutil,re
ROOT=Path('/Users/mima1234/temple-cinema-live-sync')
PACKAGES={
'scene02-monumental-v2/export':'ab494e2ae55612c501a5823e1d8b1cc32568584cdc82f2981f38f28a6bd8c677',
'scene02-monumental-v2/export-r04':'8af0995aa25c3ea835b32cec4ee1a3a67e9a0c6c1f5fe5a28dc212fc2c2e2eb6',
'scene03-monumental-garden-v2/export':'4701698d2542b678da85e9bd5ad872d11d039afc317ed5c0030e8ff903b5cca9',
'scene03-monumental-garden-v2/export-r05':'3fe3cf8363370109963b6a4ea297f023f19abe017684e9ba2e137cec7da4bb59',
'scene08-monumental-court-v2/export-r04':'d28def9f4b1238876ccb02abac8353289521644e9b4a593497afda85ad9e73d0',
'scene08-monumental-court-v2/export-r05':'4823d9265316fcf5cd30aaa72f7ea5609edc0914beb1c768c226e1eb0790b9aa'}
OUT=ROOT/'lookdev/export-storage209/verified-deduplication.json';assert not OUT.exists()
def digest(p):
 h=hashlib.sha256()
 with p.open('rb')as f:
  for x in iter(lambda:f.read(1024*1024),b''):h.update(x)
 return h.hexdigest()
reports={};live_inodes=set();records=[];missing=[];groups={}
for name,expected in PACKAGES.items():
 base=ROOT/'lookdev'/name;r=json.loads((base/'export-report.json').read_text());assert r['sourceHash']==expected
 check=subprocess.run(['lsof','+D',str(base)],capture_output=True,text=True);assert check.returncode==1 and not check.stdout.strip(),name
 for n in r['source']['files']:
  p=ROOT/n
  if p.exists():s=p.stat();live_inodes.add((s.st_dev,s.st_ino))
 reports[name]=r
for name,r in reports.items():
 for n,v in r['exportedAssets'].items():
  if not re.fullmatch(r'(geometry-.*\.bin|instances-.*\.bin|instance-colors-.*\.bin|texture-.*\.png)',n):continue
  p=ROOT/'lookdev'/name/'assets'/n
  if not p.exists():missing.append(str(p.relative_to(ROOT)));continue
  assert p.is_file()and not p.is_symlink();s=p.stat();assert(s.st_dev,s.st_ino)not in live_inodes
  assert s.st_size==v['bytes']and digest(p)==v['sha256'],str(p)
  leader=groups.setdefault(v['sha256'],str(p.relative_to(ROOT)))
  records.append({'path':str(p.relative_to(ROOT)),'leader':leader,**v})
record={'status':'verified-before-linking','timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),'packages':PACKAGES,'operation':'Deduplicate only identical verified derived-buffer bytes across these six closed immutable historical export packages. Every existing path and byte is retained; no source asset, unique buffer, render, scene.json or export-report.json removed. No links to canonical assets.','previouslyAbsent':missing,'files':records,'freeBefore':shutil.disk_usage(ROOT).free}
OUT.write_text(json.dumps(record,indent=2)+'\n');count=0
for v in records:
 p=ROOT/v['path'];lead=ROOT/v['leader']
 if p.stat().st_ino==lead.stat().st_ino:continue
 tmp=p.with_name(p.name+'.dedup209');assert not tmp.exists();os.link(lead,tmp);os.replace(tmp,p);count+=1
for name in groups.values():(ROOT/name).chmod(0o444)
for v in records:
 p=ROOT/v['path'];lead=ROOT/v['leader'];assert p.stat().st_size==v['bytes']and p.stat().st_ino==lead.stat().st_ino
record.update(status='complete-every-existing-path-and-byte-preserved',linkedDuplicatePaths=count,freeAfter=shutil.disk_usage(ROOT).free);OUT.write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps({'linkedDuplicatePaths':count,'freeGiB':shutil.disk_usage(ROOT).free/2**30,'receipt':str(OUT)}))
