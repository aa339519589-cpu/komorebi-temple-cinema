from pathlib import Path
import bpy,bmesh,json
import numpy as np
from mathutils.bvhtree import BVHTree
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[4]
SRC=ROOT/'reconstructions/scene-06/assets/learned-face-v02'
OUT=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(SRC/'central-face.blend'))
o=bpy.data.objects['scene06-learned-central-face-and-ears']
v=[tuple(x.co) for x in o.data.vertices];f=[tuple(p.vertices) for p in o.data.polygons]
p=np.array(v);mask=(abs(p[:,0])<.155)&(p[:,1]>2.67)&(p[:,1]<2.84)&(p[:,2]>.15)
q=p[mask];bvh=BVHTree.FromPolygons(v,f,all_triangles=False)
rows=[]
for y in np.linspace(2.68,2.82,29):
 row=[]
 for x in np.linspace(-.14,.14,57):
  at=Vector((float(x),float(y),.8));hits=[]
  for j in range(16):
   hit,normal,index,distance=bvh.ray_cast(at,Vector((0,0,-1)),1.6)
   if hit is None:break
   hits.append({'z':float(hit.z),'normalZ':float(normal.z)})
   at=hit+Vector((0,0,-.00001))
  row.append({'x':float(x),'hits':hits})
 rows.append({'y':float(y),'samples':row})
bm=bmesh.new();bm.from_mesh(o.data)
rep={'status':'mesh-only-section-analysis-no-render','asset':'learned-face-v02','localAxis':'Three Y-up artist axes; root rotates only for Blender scene','frontNasalBounds':[q.min(0).tolist(),q.max(0).tolist()],'topology':{'V':len(bm.verts),'E':len(bm.edges),'F':len(bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),'euler':len(bm.verts)-len(bm.edges)+len(bm.faces)},'frontDepthRows':rows}
bm.free();(OUT/'nasal-sections-v02.json').write_text(json.dumps(rep,indent=2)+'\n')
print('NASAL_INSPECT',json.dumps({k:rep[k] for k in ['frontNasalBounds','topology']}),flush=True)
for r in rows[::4]:
 print('ROW',round(r['y'],4),[(round(s['x'],3),[round(h['z'],4) for h in s['hits'][:4]]) for s in r['samples'][::4]],flush=True)
