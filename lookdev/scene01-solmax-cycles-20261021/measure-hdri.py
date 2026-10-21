import bpy,json,numpy as np
from pathlib import Path
p=Path('assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr').resolve()
i=bpy.data.images.load(str(p));a=np.asarray(i.pixels[:],dtype=np.float32).reshape(i.size[1],i.size[0],4)
l=a[:,:,:3]@np.array([.2126,.7152,.0722]);visible=l[np.isfinite(l)&(l>0)]
report={'dimensions':list(i.size),'luminancePercentiles':{str(q):float(np.percentile(visible,q)) for q in [25,50,75,90,95,99,99.9,100]},'rgbMedian':np.median(a[:,:,:3],axis=(0,1)).tolist()}
Path('/tmp/temple-hdri-radiance.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
