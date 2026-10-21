from pathlib import Path
import json
p=Path('lookdev/scene07-stone-toro156/build-toro156.py');s=p.read_text().replace("os.environ.get('TORO_REVISION','r03')","os.environ.get('TORO_REVISION','r04')")
s=s.replace("def sculpt_noise(p,seed=0):return noise.noise(Vector(p)*8+Vector((seed,seed*.7,seed*.23)))*.003+noise.noise(Vector(p)*43+Vector((seed*.3,0,seed)))*.0012", "def sculpt_noise(p,seed=0):\n    p=Vector(p);pit=max(0,noise.noise(p*27+Vector((seed*.2,seed,4.7)))-.28);return noise.noise(p*8+Vector((seed,seed*.7,seed*.23)))*.003+noise.noise(p*43+Vector((seed*.3,0,seed)))*.0012-.015*pit*pit")
s=s.replace("    N=120;verts=[];rings=[];faces=[]\n    for r,z in profile:", "    dense=[profile[0]]\n    for (r0,z0),(r1,z1) in zip(profile,profile[1:]):\n        steps=max(1,math.ceil(abs(z1-z0)/.012))\n        for step in range(1,steps+1):t=step/steps;dense.append((r0+(r1-r0)*t,z0+(z1-z0)*t))\n    profile=dense;N=160;verts=[];rings=[];faces=[]\n    for r,z in profile:")
needle='for j in range(LEVELS):\n    for i in range(ANG):'
replace="""# Retain only captured local3D weathering. The macro cross-section is a
# new reference-controlled square pedestal, rather than the donor's concave
# hourglass form. This is not a photograph-derived displacement or2D warp.
raw=np.asarray(verts,dtype=float).reshape(LEVELS+1,ANG,3);radii=np.linalg.norm(raw[:,:,:2],axis=2);smooth=sum(np.roll(radii,k,axis=1) for k in range(-5,6))/11;pad=np.pad(smooth,((4,4),(0,0)),mode='edge');smooth=sum(pad[k:k+LEVELS+1] for k in range(9))/9;residual=np.clip((radii-smooth)*1.1,-.012,.012)
reference_z=[.47,.57,.70,.78,1.34,1.49,1.60,1.68];reference_halfwidth=[.44,.44,.345,.325,.325,.365,.38,.38]
for j in range(LEVELS+1):
    z=raw[j,0,2];half=float(np.interp(z,reference_z,reference_halfwidth))
    for i in range(ANG):
        a=i*TAU/ANG;r=half/(abs(math.cos(a))**24+abs(math.sin(a))**24)**(1/24)+residual[j,i];verts[j*ANG+i]=(r*math.cos(a),r*math.sin(a),z)
for j in range(LEVELS):
    for i in range(ANG):"""
assert needle in s;s=s.replace(needle,replace)
s=s.replace('w,h,depth=.35,.67,.15','w,h,depth=.35,.67,.08').replace('radius-.014+d','radius+.005+d').replace('front=N*(radius-.092)','front=N*(radius-.038)')
s=s.replace("leaf('Integral worn receiver lotus petal',N*.34+Vector((0,0,1.74)),X,N,.35,.17,0,.025,j+80)", "petal=leaf('Integral worn receiver lotus petal',N*.34+Vector((0,0,1.74)),X,N,.35,.17,0,.025,j+80)\n    for v in petal.data.vertices:\n        z=v.co.z;r=float(np.interp(z,[1.63,1.72,1.84,1.98,2.06,2.12],[.29,.34,.45,.56,.60,.57]));v.co+=N*(r-.34-.003)")
s=s.replace('A=240;R=44','A=360;R=64')
needle="bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=.165"
insert="""for j in range(12):
    a=j*TAU/12;N=Vector((math.cos(a),math.sin(a),0));X=Vector((-math.sin(a),math.cos(a),0));petal=leaf('Carved crown lotus segment',N*.24+Vector((0,0,3.46)),X,N,.205,.13,0,.019,101+j);petal['toroRole']='cap'
    for v in petal.data.vertices:
        z=v.co.z;r=float(np.interp(z,[3.43,3.44,3.52,3.60,3.67,3.70],[.20,.26,.32,.33,.29,.15]));v.co+=N*(r-.24-.003)
"""+needle
assert needle in s;s=s.replace(needle,insert)
s=s.replace("evaluated_shaft=shaft.evaluated_get(dg);assert len(evaluated_shaft.data.polygons)>1000, 'Carved shaft disappeared after boolean evaluation'", "evaluated_shaft=shaft.evaluated_get(dg);assert len(evaluated_shaft.data.polygons)>1000, 'Carved shaft disappeared after boolean evaluation'\nshaft_bvh=BVHTree.FromObject(shaft,dg);core_clearances=[]\nfor j in range(4):\n    a=j*math.pi/2;hit=shaft_bvh.ray_cast(Vector((0,0,1.11)),Vector((math.cos(a),math.sin(a),0)),2)[0];assert hit is not None;core_clearances.append(math.hypot(hit.x,hit.y))\nassert min(core_clearances)>.20,'Insufficient real stone behind shallow carving niches'")
s=s.replace("'retainedCapturedGeometry':'Only the actual weathered shaft, cropped/capped, horizontally scaled0.8 and vertically remapped. Closed radial retopology samples the actual source triangle surface at256angles/161levels; missing-scan holes alone are interpolated from nearby captured radial samples. Four actual arched Boolean niches are then cut into the closed stone. Unsuitable source roof/chamber/ground are excluded.'", "'retainedCapturedGeometry':'Only local3D surface-weathering residuals from the captured shaft are retained. Actual source triangles are ray-sampled at256angles/161levels; missing scan regions interpolate nearby captured radial values. Subtracting an angular/vertical local mean isolates surface residuals, clamped to±12mm, then applied to a NEW reference-controlled square pedestal profile. Four shallow actual35mm Boolean niches are carved into closed stone. The donor macro shape, roof, chamber and captured ground are excluded.'")
s=s.replace("'evaluatedCarvedShaftFaces':len(evaluated_shaft.data.polygons)", "'evaluatedCarvedShaftFaces':len(evaluated_shaft.data.polygons),'actualMidShaftCoreClearancesMetres':core_clearances,'referenceShaftProfile':list(zip(reference_z,reference_halfwidth)),'capturedResidualRangeMetres':[float(residual.min()),float(residual.max())]")
p.write_text(s)
r=Path('lookdev/scene07-stone-toro156/r03/rejected-review.json');r.write_text(json.dumps({'status':'rejected-form-review','reason':'The shaft survived, but donor hourglass macro shape plus overly deep niches made the pedestal look like an open cage. R03 is not a target match.','repair':'R04 uses a new reference-controlled square shaft profile, retaining only local captured3D weathering residuals; niches are shallow35mm cuts with actual minimum central-core ray clearances checked. Lotus receiver/crown relief is now fitted onto its actual support surface.','visualAccepted':False},indent=2)+'\n')
