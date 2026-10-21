"""Read-only statistics for the source grayscale roughness surface map."""
import json,struct,zlib,hashlib
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE/'export'
s=json.loads((ROOT/'scene.json').read_text());m=next(r for r in s['materials'] if r['name']=='scene06-r9-connected-cast-gilt');t=next(r for r in s['textures'] if r['id']==m['textures']['roughnessMap']);raw=(ROOT/'assets'/t['file']).read_bytes()
assert raw[:8]==b'\x89PNG\r\n\x1a\n';at=8;idat=[];width=height=depth=ctype=0
while at<len(raw):
 count=struct.unpack('>I',raw[at:at+4])[0];typ=raw[at+4:at+8];data=raw[at+8:at+8+count]
 if typ==b'IHDR':width,height,depth,ctype,compression,filt,interlace=struct.unpack('>IIBBBBB',data);assert depth==8 and interlace==0
 if typ==b'IDAT':idat.append(data)
 at+=12+count
channels={0:1,2:3,4:2,6:4}[ctype];rowbytes=width*channels;stream=zlib.decompress(b''.join(idat));last=bytearray(rowbytes);greens=[];offset=0
for y in range(height):
 filt=stream[offset];offset+=1;row=bytearray(stream[offset:offset+rowbytes]);offset+=rowbytes
 for x in range(rowbytes):
  a=row[x-channels] if x>=channels else 0;b=last[x];c=last[x-channels] if x>=channels else 0
  if filt==1:p=a
  elif filt==2:p=b
  elif filt==3:p=(a+b)//2
  elif filt==4:
   v=a+b-c;pa,pb,pc=abs(v-a),abs(v-b),abs(v-c);p=a if pa<=pb and pa<=pc else b if pb<=pc else c
  elif filt==0:p=0
  else:raise ValueError(filt)
  row[x]=(row[x]+p)&255
 greens.extend(row[(1 if ctype in [2,6] else 0)::channels]);last=row
assert len(greens)==width*height;ordered=sorted(greens);factor=m['roughness'];mean=sum(greens)/len(greens)
r={'status':'read-only-surface-map-statistics','sourceMaterial':m['name'],'file':t['file'],'sha256':hashlib.sha256(raw).hexdigest(),'size':[width,height],'sourceColorSpace':t['colorSpace'],'shaderChannel':'linear green, multiplied by source roughness factor','sourceRoughnessFactor':factor,'greenRange8bit':[min(greens),max(greens)],'greenMean8bit':mean,'effectiveRoughnessRange':[min(greens)/255*factor,max(greens)/255*factor],'effectiveRoughnessMean':mean/255*factor,'effectiveRoughnessQuantiles':{str(q):ordered[int((len(ordered)-1)*q)]/255*factor for q in [.05,.25,.5,.75,.95]},'imageAltered':False,'visualAccepted':False}
(HERE/'gilt-roughness-analysis.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
