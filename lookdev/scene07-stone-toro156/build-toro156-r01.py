"""Editable real3D hybrid toro: licensed captured shaft plus authored stonework.
CC BY4.0 original by3dlunatic is preserved byte-for-byte under sources/.
No reference image pixels or generated bitmap geometry are used.
"""
import bpy,bmesh,math,json,hashlib,os,time,random,numpy as np
from pathlib import Path
from mathutils import Matrix,Vector,noise
from mathutils.bvhtree import BVHTree
HERE=Path(__file__).resolve().parent;PROJECT=HERE.parents[1];OUT=HERE/os.environ.get('TORO_REVISION','r01');OUT.mkdir(exist_ok=True)
SOURCE=HERE/'sources/ccby-3dlunatic-toro/source-objaverse.glb';MAPDIR=PROJECT/'reconstructions/scene-07/assets/island-lantern-granite';TAU=2*math.pi
random.seed(15627);started=time.time();bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene
ASSETS=bpy.data.collections.new('EDITABLE Tōrō156 asset');scene.collection.children.link(ASSETS);CUTTERS=bpy.data.collections.new('Editable chisel/niche cutters');scene.collection.children.link(CUTTERS);asset_objects=[]
def register(o,role='stone'):
    for c in list(o.users_collection):c.objects.unlink(o)
    ASSETS.objects.link(o);o['toroRole']=role;asset_objects.append(o);return o
def sculpt_noise(p,seed=0):return noise.noise(Vector(p)*8+Vector((seed,seed*.7,seed*.23)))*.003+noise.noise(Vector(p)*43+Vector((seed*.3,0,seed)))*.0012

def mesh_obj(name,verts,faces,role='stone'):
    m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=bpy.data.objects.new(name,m);scene.collection.objects.link(o);register(o,role)
    for p in m.polygons:p.use_smooth=True
    return o

def plan_radius(a,r,kind):
    if kind=='square':return r/(abs(math.cos(a))**12+abs(math.sin(a))**12)**(1/12)
    if kind=='hex':return r*math.cos(math.pi/6)/math.cos((a+math.pi/6)%(math.pi/3)-math.pi/6)
    return r

def course(name,profile,kind='square',role='stone',lobes=0,seed=0):
    N=120;verts=[];rings=[];faces=[]
    for r,z in profile:
        if r<1e-7:rings.append([len(verts)]);verts.append((0,0,z));continue
        ring=[]
        for i in range(N):
            a=i*TAU/N;rr=plan_radius(a,r,kind);rr+=sculpt_noise((rr*math.cos(a),rr*math.sin(a),z),seed)
            if lobes:rr+=.012*math.cos(lobes*a)*math.sin(math.pi*max(0,min(1,(z-profile[0][1])/(profile[-1][1]-profile[0][1]))))**2
            ring.append(len(verts));verts.append((rr*math.cos(a),rr*math.sin(a),z+.0015*math.sin(a*17+seed)))
        rings.append(ring)
    for j in range(len(rings)-1):
        a,c=rings[j],rings[j+1]
        for i in range(N):
            q=(i+1)%N
            if len(a)==1:faces.append((a[0],c[q],c[i]))
            elif len(c)==1:faces.append((a[i],a[q],c[0]))
            else:faces.append((a[i],a[q],c[q],c[i]))
    return mesh_obj(name,verts,faces,role)

def tube(name,points,r,role='stone',closed=False,sides=8):
    pts=[Vector(p) for p in points];N=len(pts);v=[];f=[]
    for j,p in enumerate(pts):
        tangent=(pts[(j+1)%N]-pts[(j-1)%N]).normalized() if closed else (pts[min(N-1,j+1)]-pts[max(0,j-1)]).normalized();n=tangent.cross(Vector((0,0,1)))
        if n.length<.001:n=tangent.cross(Vector((0,1,0)))
        n.normalize();up=tangent.cross(n).normalized()
        for k in range(sides):a=k*TAU/sides;v.append(tuple(p+n*(r*math.cos(a))+up*(r*math.sin(a))))
    for j in range(N if closed else N-1):
        q=(j+1)%N
        for k in range(sides):l=(k+1)%sides;f.append((j*sides+k,j*sides+l,q*sides+l,q*sides+k))
    if not closed:
        f.append(tuple(reversed(range(sides))));f.append(tuple((N-1)*sides+k for k in range(sides)))
    return mesh_obj(name,v,f,role)

def leaf(name,origin,tangent,outward,length,width,roll=0,depth=.025,seed=0):
    origin=Vector(origin);X=Vector(tangent);Z=Vector((0,0,1));N=Vector(outward);v=[];rings=[];f=[];R=22;K=12
    for j in range(R+1):
        t=j/R
        if j in [0,R]:rings.append([len(v)]);v.append(tuple(origin+Z*(t*length*math.cos(roll))+X*(-t*length*math.sin(roll))));continue
        ring=[];w=width*.5*math.sin(math.pi*t)**.72*(.86+.14*math.cos(t*math.pi*5));bend=.012*math.sin(t*math.pi)
        for k in range(K):
            a=k*TAU/K;x=w*math.cos(a);y=t*length;d=depth*(.50*math.sin(a)+.50)*math.sin(math.pi*t)**.5-.004*max(0,-math.sin(a));xx=x*math.cos(roll)-y*math.sin(roll);zz=x*math.sin(roll)+y*math.cos(roll);p=origin+X*xx+Z*zz+N*(d+bend);p+=N*sculpt_noise(p,seed)*.25;ring.append(len(v));v.append(tuple(p))
        rings.append(ring)
    for j in range(R):
        a,c=rings[j],rings[j+1]
        for k in range(K):q=(k+1)%K;f.extend([(a[0],c[q],c[k])] if len(a)==1 else [(a[k],a[q],c[0])] if len(c)==1 else [(a[k],a[q],c[q],c[k])])
    return mesh_obj(name,v,f)

# Actual captured surface, cropped in3D, capped and mildly remeshed for a closed
# load-bearing shaft. The unsuitable scanned roof/chamber/ground are excluded.
bpy.ops.import_scene.gltf(filepath=str(SOURCE));scan_objects=[o for o in scene.objects if o.type=='MESH' and o not in asset_objects]
for o in scan_objects:m=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Identity(4);o.data.transform(m)
bpy.ops.object.select_all(action='DESELECT')
for o in scan_objects:o.select_set(True)
bpy.context.view_layer.objects.active=scan_objects[0];bpy.ops.object.join();shaft=bpy.context.object;shaft.name='Captured weathered shaft:3dlunatic CC-BY4';m=shaft.data
for v in m.vertices:v.co=Vector(((v.co.x+3.65)*.74912999,(v.co.y+3.68)*.74912999,(v.co.z-4.63)*.74912999+.37))
bm=bmesh.new();bm.from_mesh(m)
for z,n,inner,outer in [(.42,(0,0,1),True,False),(1.82,(0,0,1),False,True)]:
    bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-6,plane_co=(0,0,z),plane_no=n,clear_inner=inner,clear_outer=outer)
    edges=[e for e in bm.edges if e.is_boundary and all(abs(v.co.z-z)<1e-4 for v in e.verts)]
    if edges:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-5);bm.to_mesh(m);bm.free()
for v in m.vertices:v.co=Vector((v.co.x*.80,v.co.y*.80,.47+(v.co.z-.42)*1.21/1.40))
register(shaft);bpy.context.view_layer.objects.active=shaft;shaft.select_set(True);rem=shaft.modifiers.new('Watertight captured stone:6mm voxel','REMESH');rem.mode='VOXEL';rem.voxel_size=.006;rem.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=rem.name)
for p in shaft.data.polygons:p.use_smooth=True
bvh=BVHTree.FromObject(shaft,bpy.context.evaluated_depsgraph_get());niche_data=[]
for j in range(4):
    a=j*math.pi/2;N=Vector((math.cos(a),math.sin(a),0));X=Vector((-math.sin(a),math.cos(a),0));hit=bvh.ray_cast(N*2+Vector((0,0,1.11)),-N,3)[0];radius=hit.dot(N) if hit else .25;niche_data.append((a,radius))
    w,h,depth=.35,.67,.15;R=w/2;pts=[(-w/2,-h/2),(w/2,-h/2),(w/2,h/2-R)]+[(math.cos(t*math.pi/24)*R,h/2-R+math.sin(t*math.pi/24)*R) for t in range(1,25)]
    verts=[]
    for d in [-depth/2,depth/2]:
        for x,z in pts:verts.append(tuple(X*x+Vector((0,0,1.11+z))+N*(radius-.014+d)))
    n=len(pts);faces=[tuple(reversed(range(n))),tuple(n+k for k in range(n))]+[(k,(k+1)%n,(k+1)%n+n,k+n) for k in range(n)]
    cut=mesh_obj('Editable arched recess cutter'+str(j),verts,faces,'cutter');asset_objects.remove(cut);ASSETS.objects.unlink(cut);CUTTERS.objects.link(cut);cut.hide_render=True;cut.hide_set(True);mod=shaft.modifiers.new('Actually carved arched recess'+str(j),'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
    front=N*(radius-.066)+Vector((0,0,1.11))
    for k in range(8):roll=k*TAU/8;leaf('Worn carved lotus petal',front+Vector((0,0,.035)),X,N,.16 if k%2 else .18,.13,roll,.021,30+j+k)
    stem=[front+Vector((0,0,-.25)),front+X*.025+Vector((0,0,-.12)),front+Vector((0,0,.04))];tube('Carved lotus stem',stem,.010)
    for s in [-1,1]:leaf('Carved lower lotus leaf',front+Vector((0,0,-.20)),X,N,.14,.085,s*.80,.018,53+j)
# Individually modelled eroded stone footing courses.
course('Broad irregular square foot',[(0,0),(.64,0),(.71,.04),(.70,.14),(.64,.22),(0,.22)],'square',seed=7)
course('Chiselled plinth shoulder',[(0,.19),(.56,.19),(.58,.26),(.55,.36),(.47,.42),(0,.42)],'square',seed=12)
course('Shaft lower seated collar',[(0,.38),(.45,.38),(.47,.43),(.44,.51),(.38,.55),(0,.55)],'square',seed=21)
# Lotus receiver beneath the heavy six-sided platform, with real lobed volume.
course('Lower scalloped lotus receiver',[(0,1.63),(.29,1.63),(.34,1.72),(.45,1.84),(.56,1.98),(.60,2.06),(.57,2.12),(0,2.12)],'round',lobes=12,seed=23)
for j in range(12):
    a=j*TAU/12;N=Vector((math.cos(a),math.sin(a),0));X=Vector((-math.sin(a),math.cos(a),0));leaf('Integral worn receiver lotus petal',N*.34+Vector((0,0,1.74)),X,N,.35,.17,0,.025,j+80)
course('Heavy carved hexagonal platform',[(0,2.06),(.59,2.06),(.69,2.11),(.73,2.18),(.73,2.34),(.68,2.39),(.65,2.41),(0,2.41)],'hex',seed=31)
course('Fire chamber bottom moulding',[(0,2.38),(.61,2.38),(.65,2.43),(.64,2.50),(.59,2.54),(0,2.54)],'hex',seed=36)
# Six real recessed glazed/latticed openings. Stone piers carry the upper ring.
for j in range(6):
    a=j*TAU/6;cx,cy=.605*math.cos(a),.605*math.sin(a)
    o=course('Eroded chamber corner pier'+str(j),[(0,2.49),(.090,2.49),(.083,2.56),(.072,2.84),(.086,3.12),(.097,3.18),(0,3.18)],'hex',seed=41+j);o.location.x=cx;o.location.y=cy
course('Fire chamber lintel ring',[(.44,3.12),(.62,3.12),(.65,3.17),(.62,3.23),(.44,3.23),(.44,3.12)],'hex',seed=49)
for j in range(6):
    a=math.pi/6+j*TAU/6;N=Vector((math.cos(a),math.sin(a),0));X=Vector((-math.sin(a),math.cos(a),0));Z=Vector((0,0,1));centre=N*.528+Z*2.84
    def point(x,z,d=0):return centre+X*x+Z*z+N*d
    # Recessed paper is a genuine thin physical pane behind the cast screen.
    verts=[tuple(point(x,z,-.065)) for x,z in [(-.225,-.265),(.225,-.265),(.225,.265),(-.225,.265)]];pane=mesh_obj('Warm recessed window pane'+str(j),verts,[(0,1,2,3)],'paper');solid=pane.modifiers.new('Actual paper thickness','SOLIDIFY');solid.thickness=.009
    for x in [-.225,.225]:tube('Cast window perimeter', [point(x,-.265,.006),point(x,.265,.006)],.006,'bronze')
    for z in [-.265,.265]:tube('Cast window perimeter', [point(-.225,z,.006),point(.225,z,.006)],.006,'bronze')
    for x in [-.15,0,.15]:tube('Slender vertical cast grille',[point(x,-.26,.010),point(x,.26,.010)],.0045,'bronze')
    for z in [-.17,0,.17]:tube('Slender horizontal cast grille',[point(-.22,z,.012),point(.22,z,.012)],.0045,'bronze')
    for x in [-.075,.075]:
        for z in [-.085,.085]:
            pts=[point(x+.052*math.sin(t*TAU/32),z+.065*math.cos(t*TAU/32),.014) for t in range(32)];tube('Pierced kikko/lotus screen loop',pts,.0035,'bronze',True,6)
    # Small carved lintel bosses belong to the thick stone border, not paper.
    for x in [-.16,0,.16]:leaf('Weathered stone lintel blossom',point(x,.272,.002),X,N,.075,.075,math.pi,.009,66+j)
course('Closed stone roof compression boss',[(0,3.17),(.30,3.17),(.39,3.23),(.36,3.36),(.24,3.48),(0,3.51)],'round',seed=59)
# Closed six-sided curved kasa: substantial underside, sharply dropped fascia,
# shallow weather channels, integrated raised hips and actual chipped lip.
A=240;R=44;v=[];f=[];chips=[(random.random()*TAU,.018+random.random()*.045,.004+random.random()*.013) for k in range(44)]
def roof(a,t,bottom=False):
    boundary=plan_radius(a,1.06,'hex');r=boundary*t;corner=max(0,math.cos(6*a))**8;h=3.19+.40*(1-t)**1.45-.048*math.sin(math.pi*t)**2+.060*t**8*corner
    # Actual shallow radial rain/chisel grooves, six panel fields and fine grain.
    groove=.007*max(0,math.sin(30*a+.7*math.sin(t*9)))**8*math.sin(math.pi*t)**2;h-=groove
    if bottom:h-=.105+.025*t*t
    delta=0
    for ang,w,d in chips:
        q=(a-ang+math.pi)%TAU-math.pi;delta+=d*math.exp(-(q/w)**2)*t**14
    r-=delta;h-=delta*.25
    p=Vector((r*math.cos(a),r*math.sin(a),h));p.z+=sculpt_noise(p,72)*(.35+.65*t);return tuple(p)
for bottom in [False,True]:
    for j in range(R+1):
        t=.002+.998*j/R
        for i in range(A):v.append(roof(i*TAU/A,t,bottom))
N=(R+1)*A
for j in range(R):
    for i in range(A):q=(i+1)%A;a=j*A+i;b=j*A+q;c=a+A;d=b+A;f.append((a,c,d,b));f.append((a+N,b+N,d+N,c+N))
for i in range(A):q=(i+1)%A;a=R*A+i;b=R*A+q;f.append((a,b,b+N,a+N));f.append((i,i+N,q+N,q))
kasa=mesh_obj('Wide curved hexagonal stone kasa: chipped downturned lip',v,f,'cap')
for j in range(6):
    a=j*TAU/6;pts=[]
    for k in range(32):p=Vector(roof(a,.15+.85*k/31));p.z+=.010;pts.append(p)
    tube('Integral worn raised roof hip',pts,.021,'cap',False,8)
# Broad lobed crown seat, proper spherical stone ball and small terminal pin.
course('Lobed lotus crown seat',[(0,3.54),(.24,3.54),(.31,3.58),(.32,3.63),(.26,3.68),(.15,3.70),(0,3.70)],'round','cap',lobes=12,seed=84)
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,radius=.165,location=(0,0,3.835));ball=register(bpy.context.object,'cap');ball.name='True spherical worn stone finial'
for p in ball.data.vertices:p.co*=1+.012*noise.noise(p.co*47)
for p in ball.data.polygons:p.use_smooth=True
course('Small seated finial terminal',[(0,3.98),(.042,3.98),(.048,4.005),(.027,4.035),(0,4.05)],'round','cap',seed=92)
# Rich3D cap weathering and stone albedo are separate from source photographs.
# The original CC0 granular stone maps are sampled at0.3173828125m per tile.
images={}
for channel,suffix in [('map','diff'),('normal','nor_gl'),('rough','rough')]:
    im=bpy.data.images.load(str(MAPDIR/f'granite-face-{suffix}.png'),check_existing=True);im.colorspace_settings.name='sRGB' if channel=='map' else 'Non-Color';im.pack();images[channel]=im
materials={}
def stone_material(name,pigment):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear();l=m.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');l.new(bs.outputs[0],out.inputs['Surface']);coord=n.new('ShaderNodeTexCoord');scale=n.new('ShaderNodeVectorMath');scale.operation='SCALE';scale.inputs['Scale'].default_value=1/.3173828125;l.new(coord.outputs['Object'],scale.inputs[0]);tn={}
    for k,im in images.items():t=n.new('ShaderNodeTexImage');t.image=im;t.projection='BOX';t.projection_blend=.15;t.extension='REPEAT';l.new(scale.outputs[0],t.inputs['Vector']);tn[k]=t
    bw=n.new('ShaderNodeRGBToBW');l.new(tn['map'].outputs['Color'],bw.inputs[0]);d=n.new('ShaderNodeMath');d.operation='DIVIDE';d.inputs[1].default_value=.153180782734;l.new(bw.outputs[0],d.inputs[0]);p=n.new('ShaderNodeMath');p.operation='POWER';p.inputs[1].default_value=.55;l.new(d.outputs[0],p.inputs[0]);cl=n.new('ShaderNodeClamp');cl.inputs['Min'].default_value=.68;cl.inputs['Max'].default_value=1.36;l.new(p.outputs[0],cl.inputs['Value']);mix=n.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=tuple(pigment)+(1,);l.new(cl.outputs[0],mix.inputs[1]);l.new(mix.outputs[0],bs.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.35;bump.inputs['Distance'].default_value=.003;l.new(tn['rough'].outputs['Color'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal']);bs.inputs['Roughness'].default_value=.9;m['toroRole']='cap' if name.startswith('Cap') else 'stone';return m
materials['stone']=stone_material('Stone: physical weathered mineral',(.26,.28,.25));materials['cap']=stone_material('Cap: aged damp granite',(.16,.19,.17));bronze=bpy.data.materials.new('Bronze: fine dark window casting');bronze.use_nodes=True;bs=bronze.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.032,.025,.016,1);bs.inputs['Metallic'].default_value=.50;bs.inputs['Roughness'].default_value=.55;bronze['toroRole']='bronze';materials['bronze']=bronze
paper=bpy.data.materials.new('Paper: actual recessed warm emission');paper.use_nodes=True;bs=paper.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.48,.31,.12,1);bs.inputs['Emission Color'].default_value=(1,.46,.13,1);bs.inputs['Emission Strength'].default_value=2.5;bs.inputs['Roughness'].default_value=.85;paper['toroRole']='paper';materials['paper']=paper
for o in asset_objects:o.data.materials.clear();o.data.materials.append(materials[o['toroRole']])
# Real studio illumination, plus a small physical practical behind the panes.
world=bpy.data.worlds.new('Outdoor studio sky');world.use_nodes=True;world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.65,.75,.90,1);world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.40;scene.world=world
for name,loc,energy,size,col in [('Broad warm key',(-4,-5,7),950,4,(1,.83,.62)),('Sky fill',(4,3,5),550,5,(.66,.79,1))]:
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size;d.color=col;o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.lights.new('Physical lamp inside actual chamber','POINT');d.energy=10;d.color=(1,.49,.15);d.shadow_soft_size=.045;o=bpy.data.objects.new(d.name,d);scene.collection.objects.link(o);o.location=(0,0,2.84)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.014));floor=bpy.context.object;floor.name='Studio ground, outside exported asset';m=bpy.data.materials.new('Ground');m.diffuse_color=(.17,.19,.17,1);floor.data.materials.append(m)
cam_data=bpy.data.cameras.new('Perspective asset camera');camera=bpy.data.objects.new(cam_data.name,cam_data);scene.collection.objects.link(camera);scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.max_bounces=8;scene.cycles.transparent_max_bounces=8;prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(dev.use for dev in prefs.devices);scene.cycles.device='GPU';scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=0
report={'status':'rendering-authored-hybrid-toro','sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceLicense':'CC-BY-4.0','scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'retainedCapturedGeometry':'Only the actual weathered shaft, cropped/capped, horizontally scaled0.8, vertically remapped and6mm voxel-closed, then carved with four actual arched boolean niches. Unsuitable original scanned pyramidal roof, closed chamber and incidental ground are excluded.','authoredGeometry':'Broad chipped six-sided curved cap with real thick underside/downturned fascia/raised hips; spherical finial; hollow six-window stone chamber; actual cast lattice, recessed emitting paper, closed heavy platform, lobed lotus receiver, carved petals, irregular plinth.','referencePhotoPixelsUsed':False,'nominalTargetBoundsYUp':[[-1.06,0,-1.06],[1.06,4.05,1.06]],'fireBagCentreY':2.84,'fireBagClearHeight':.53,'assetObjects':len(asset_objects),'renders':[],'visualAccepted':False}
(OUT/'report.json').write_text(json.dumps(report,indent=2))
for name,pos,target,lens in [('front',(0,-8.5,3.15),(0,0,2.02),67),('three-quarter',(5,-7,4.1),(0,0,2.02),65),('head-close',(3.2,-4.4,3.65),(0,0,2.99),92)]:
    camera.location=pos;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();cam_data.lens=lens;scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True);report['renders'].append({'name':name,'path':str(OUT/(name+'.png')),'sha256':hashlib.sha256((OUT/(name+'.png')).read_bytes()).hexdigest(),'resolution':[1254,1254],'samples':64,'positionBlenderZUp':pos,'targetBlenderZUp':target,'lensMm':lens})
# Geometry-only portable GLB: original maps remain external, bound by the native
# API adapter. This avoids silently baking a studio illumination into textures.
bpy.ops.object.select_all(action='DESELECT');deps=bpy.context.evaluated_depsgraph_get();export_objs=[];bounds=[];triangles=0
for o in asset_objects:
    mesh=bpy.data.meshes.new_from_object(o.evaluated_get(deps));clone=bpy.data.objects.new(o.name,mesh);scene.collection.objects.link(clone);clone.matrix_world=o.matrix_world.copy();clone['toroRole']=o['toroRole'];clone['sourceDerivative']='Japanese Toro by3dlunatic / CC BY4.0; hybrid changes in report.json'
    # Exact metric planar UVs; native adapter recomputes metric scale for each
    # parent transform. Values are geometry coordinates, not projected photos.
    uv=mesh.uv_layers.new(name='MetricStoneUV')
    for poly in mesh.polygons:
        n=poly.normal;axis=max(range(3),key=lambda k:abs(n[k]));
        for li in poly.loop_indices:
            p=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=((p.y if axis==0 else p.x)/.3173828125,(p.y if axis==2 else p.z)/.3173828125)
    mesh.materials.clear();role=o['toroRole'];placeholder=bpy.data.materials.get('GLB '+role)
    if not placeholder:
        placeholder=bpy.data.materials.new('GLB '+role);placeholder.use_nodes=True;bs=placeholder.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value={'stone':(.26,.28,.25,1),'cap':(.16,.19,.17,1),'bronze':(.032,.025,.016,1),'paper':(.48,.31,.12,1)}[role];bs.inputs['Roughness'].default_value=.9 if role in ['stone','cap'] else .55
        if role=='paper':bs.inputs['Emission Color'].default_value=(1,.46,.13,1);bs.inputs['Emission Strength'].default_value=2.5
        if role=='bronze':bs.inputs['Metallic'].default_value=.5
        placeholder['toroRole']=role
    mesh.materials.append(placeholder);clone.select_set(True);export_objs.append(clone);triangles+=sum(len(p.vertices)-2 for p in mesh.polygons);bounds.extend([list(clone.matrix_world@Vector(c)) for c in clone.bound_box])
# Source contract is a Y-up asset whose foot is origin and axes are centred.
report['actualBoundsBlenderZUp']=[np.min(np.asarray(bounds),axis=0).tolist(),np.max(np.asarray(bounds),axis=0).tolist()];report['triangles']=triangles
bpy.ops.export_scene.gltf(filepath=str(OUT/'toro156.glb'),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True,export_materials='EXPORT',export_animations=False)
for o in export_objs:bpy.data.objects.remove(o,do_unlink=True)
# Save a compact editable scene with live niche boolean cutters and packed
# original stone maps. Original downloaded GLB is never duplicated into it.
camera.location=(5,-7,4.1);camera.rotation_euler=(Vector((0,0,2.02))-camera.location).to_track_quat('-Z','Y').to_euler();cam_data.lens=65;bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'toro156-editable.blend'),compress=True)
report['status']='rendered-hybrid-toro-review';report['glb']={'path':str(OUT/'toro156.glb'),'bytes':(OUT/'toro156.glb').stat().st_size,'sha256':hashlib.sha256((OUT/'toro156.glb').read_bytes()).hexdigest()};report['blend']={'path':str(OUT/'toro156-editable.blend'),'bytes':(OUT/'toro156-editable.blend').stat().st_size,'sha256':hashlib.sha256((OUT/'toro156-editable.blend').read_bytes()).hexdigest()};report['elapsedSeconds']=time.time()-started;(OUT/'report.json').write_text(json.dumps(report,indent=2));print('TORO156_REVIEW',json.dumps({k:report[k] for k in ['status','triangles','actualBoundsBlenderZUp','glb','elapsedSeconds','visualAccepted']}),flush=True)
