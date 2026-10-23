from pathlib import Path
import json,hashlib,subprocess,collections
ROOT=Path('/Users/mima1234/temple-cinema-live-sync');OUT=ROOT/'lookdev/export-storage216/historical-input-locations.json'
P=['lookdev/scene02-monumental-v2/export','lookdev/scene02-monumental-v2/export-r04','lookdev/scene03-monumental-garden-v2/export','lookdev/scene03-monumental-garden-v2/export-r05','lookdev/scene08-monumental-court-v2/export-r04','lookdev/scene08-monumental-court-v2/export-r05']
need={};proof={};reports={}
for name in P:
 r=json.loads((ROOT/name/'export-report.json').read_text());reports[name]=r;proof[name]={}
 for n,h in r['source']['files'].items():
  f=ROOT/n
  if f.exists()and hashlib.sha256(f.read_bytes()).hexdigest()==h:proof[name][n]={'sha256':h,'location':n};continue
  q=subprocess.run(['git','show',r['sourceCommit']+':'+n],cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  if q.returncode==0 and hashlib.sha256(q.stdout).hexdigest()==h:proof[name][n]={'sha256':h,'gitCommit':r['sourceCommit'],'gitPath':n};continue
  need.setdefault((n,h),[]).append(name)
args=['rg','--files','lookdev']
for basename in sorted({Path(n).name for n,h in need}):args+=['-g',basename]
files=subprocess.check_output(args,cwd=ROOT,text=True).splitlines();byname=collections.defaultdict(list)
for n,h in need:byname[Path(n).name].append((n,h))
found={};read=0
for s in files:
 f=ROOT/s
 if not f.is_file()or f.stat().st_size>8*2**20:continue
 wanted=[k for k in byname[f.name]if k not in found]
 if not wanted:continue
 data=f.read_bytes();read+=len(data);h=hashlib.sha256(data).hexdigest()
 for k in wanted:
  if k[1]==h:found[k]={'sha256':h,'location':s}
for(n,h),packages in need.items():
 if(n,h)in found:
  for name in packages:proof[name][n]=found[(n,h)]
missing={name:[n for n in r['source']['files']if n not in proof[name]]for name,r in reports.items()}
OUT.write_text(json.dumps({'packages':{name:{'sourceHash':r['sourceHash'],'sourceCommit':r['sourceCommit'],'inputs':proof[name],'missing':missing[name]}for name,r in reports.items()}},indent=2)+'\n')
print(json.dumps({'candidateFiles':len(files),'readMiB':read/2**20,'summary':{n:{'verifiedInputs':len(proof[n]),'missing':missing[n]}for n in P}},ensure_ascii=False))
