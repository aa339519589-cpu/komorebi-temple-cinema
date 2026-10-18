"""Build editable, genuinely solid temple fittings and interlocked brackets.

Run with Blender's real application binary. The generated scalar image is a
non-metric sculptural guide, not a measured scan and never a scene backdrop.
The bearing timbers are separately constructed meshes with real half laps.
"""
import bpy, bmesh, math, os, json, hashlib
import numpy as np
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets/temple-joinery-v01'
OUT.mkdir(parents=True, exist_ok=True)
GUIDE = ROOT / 'lookdev/gilded-kiku-v01/generated-sculptural-guide.png'
SIZE = int(os.environ.get('KIT_REVIEW_SIZE', '1000'))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
kit = bpy.data.collections.new('EDITABLE_JOINERY_KIT')
scene.collection.children.link(kit)
report = {'status': 'building', 'sourceGuide': str(GUIDE.relative_to(ROOT)),
          'sourceGuideSha256': hashlib.sha256(GUIDE.read_bytes()).hexdigest(),
          'blenderVersion': bpy.app.version_string,
          'scope': 'Actual carved relief plus independently modeled solid timber joinery',
          'photographicAcceptance': False,
          'limits': ['Image-generated guide is not calibrated depth or recovered historical geometry.',
                     'This asset review is not acceptance of a complete reference scene.'],
          'objects': []}

def rgb(hexcode):
    v=[int(hexcode[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)

def material(name, color, roughness, metallic=0, coat=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=rgb(color)
    p.inputs['Metallic'].default_value=metallic
    p.inputs['Roughness'].default_value=roughness
    p.inputs['Coat Weight'].default_value=coat
    p.inputs['Coat Roughness'].default_value=.25
    return m

red=material('kit-russet-lacquered-cedar','965130',.39,coat=.19)
endwood=material('kit-exposed-end-grain','9f6b44',.61)
gold=material('kit-aged-gilt-bronze','e4bb68',.29,.98)
dark=material('kit-recess-patinated-bronze','493a21',.52,.87)

# Low-contrast long fibers, with a separate microscopic roughness channel.
# All maps are generated here and packed into the portable exported GLB.
W,H=1024,256
xx,yy=np.meshgrid(np.arange(W)/W,np.arange(H)/H)
warp=yy+.003*np.sin(xx*12)+.0015*np.sin(xx*31+yy*12)
grain=(np.sin(warp*410)+.4*np.sin(warp*1051+np.sin(xx*11)))*.018
slow=.027*np.sin(yy*23+np.sin(xx*4)*.22)+.014*np.sin(yy*66+xx*.4)
tone=np.clip(.94+grain+slow,0,1)
def scalar_image(name, array):
    img=bpy.data.images.new(name,width=W,height=H,alpha=False)
    img.colorspace_settings.name='Non-Color'
    vals=np.ones((H,W,4),dtype=np.float32);vals[:,:,:3]=array[:,:,None]
    img.pixels.foreach_set(vals.ravel());img.update();img.pack()
    if abs(img.pixels[0]-float(array[0,0]))>.003:raise RuntimeError('Generated image pixels were not retained: '+name)
    return img
woodimage=scalar_image('code-generated-subtle-cedar-fibers',tone)
roughimage=scalar_image('code-generated-cedar-roughness',np.clip(.40+grain*.7+slow*.4,.3,.6))
for mat in [red,endwood]:
    nodes=mat.node_tree.nodes;links=mat.node_tree.links;p=nodes.get('Principled BSDF')
    # glTF cannot port an arbitrary legacy MixRGB graph. Retain the explicit
    # measured-color input, and carry the fine grain in portable roughness.
    rough=nodes.new('ShaderNodeTexImage');rough.image=roughimage
    links.new(rough.outputs['Color'],p.inputs['Roughness'])

def mesh_object(name, verts, faces, mat, smooth=False, bevel=0):
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update()
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(mesh);bm.free()
    obj=bpy.data.objects.new(name,mesh);kit.objects.link(obj);mesh.materials.append(mat)
    for poly in mesh.polygons:poly.use_smooth=smooth
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    if bevel:
        mod=obj.modifiers.new('Carpenter edge easing 3 mm','BEVEL');mod.width=bevel;mod.segments=3;mod.affect='EDGES'
        bpy.ops.object.modifier_apply(modifier=mod.name)
        normal=obj.modifiers.new('Weighted broad timber face normals','WEIGHTED_NORMAL');normal.keep_sharp=True;normal.weight=40
        bpy.ops.object.modifier_apply(modifier=normal.name)
    # Per-face physical projection. Fiber direction follows the main beam axis.
    layer=obj.data.uv_layers.new(name='grain-space')
    for poly in obj.data.polygons:
        a=np.abs(poly.normal[:]);drop=int(np.argmax(a))
        axes=([0,2] if drop==1 else [0,1] if drop==2 else [1,2])
        for loop in poly.loop_indices:
            co=obj.data.vertices[obj.data.loops[loop].vertex_index].co
            layer.data[loop].uv=(co[axes[0]]*.70,co[axes[1]]*1.7)
    obj.select_set(False)
    report['objects'].append({'name':name,'vertices':len(obj.data.vertices),
                              'triangles':sum(len(p.vertices)-2 for p in obj.data.polygons),
                              'closedManifold':None})
    return obj

def profile_solid(name, profile, depth, mat=red, bevel=.003):
    n=len(profile)
    verts=[(x,-depth/2,z) for x,z in profile]+[(x,depth/2,z) for x,z in profile]
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh_object(name,verts,faces,mat,False,bevel)

def block(name, w,d,bottom,top, mat=red):
    return profile_solid(name,[(-w/2,bottom),(w/2,bottom),(w/2,top),(-w/2,top)],d,mat)

def receiver(name,length,width,bottom,top,notches,mat=red):
    xs=sorted(set([-length/2,length/2]+[q for n in notches for q in [n['x']-n['w']/2,n['x']+n['w']/2]]))
    profile=[]
    for side,intervals in [('top',list(zip(xs,xs[1:]))),('bottom',list(reversed(list(zip(xs,xs[1:])))))]:
        for a,b in intervals:
            n=next((n for n in notches if n['side']==side and abs((a+b)/2-n['x'])<n['w']/2),None)
            z=(min(top,n['z']) if n else top) if side=='top' else (max(bottom,n['z']) if n else bottom)
            profile += [(a,z),(b,z)] if side=='top' else [(b,z),(a,z)]
    clean=[]
    for p in profile:
        if not clean or math.dist(p,clean[-1])>1e-8:clean.append(p)
    return profile_solid(name,clean,width,mat,.0015)

def tapered_block(name, rings):
    verts=[]
    for radius,z in rings:
        c=.035*radius
        verts += [(x,y,z) for x,y in [(-radius+c,-radius),(radius-c,-radius),
                 (radius,-radius+c),(radius,radius-c),(radius-c,radius),
                 (-radius+c,radius),(-radius,radius-c),(-radius,-radius+c)]]
    faces=[tuple(range(7,-1,-1))]
    for j in range(len(rings)-1):
        for k in range(8):faces.append((j*8+k,j*8+(k+1)%8,(j+1)*8+(k+1)%8,(j+1)*8+k))
    faces.append(tuple((len(rings)-1)*8+k for k in range(8)))
    return mesh_object(name,verts,faces,red,False,.002)

def lower(x,length):
    u=abs(x)/length
    if u<=.075:return -.255
    if u>=.5:return -.30
    if .265<=u<=.34:return -.13
    a=[.075,-.255,.17,-.245,.205,-.13,.265,-.13] if u<.265 else [.34,-.13,.41,-.13,.485,-.30,.5,-.30]
    def bez(t,j):return (1-t)**3*a[j]+3*(1-t)**2*t*a[j+2]+3*(1-t)*t*t*a[j+4]+t**3*a[j+6]
    lo,hi=0,1
    for _ in range(32):
        mid=(lo+hi)/2
        if bez(mid,0)<u:lo=mid
        else:hi=mid
    return bez((lo+hi)/2,1)

def arm(name,length,centre,notches, x=0,y=0,angle=0):
    xs=set(np.linspace(-length/2,length/2,65).tolist()+[-.075*length,.075*length,-.265*length,.265*length,-.34*length,.34*length])
    for n in notches:xs.update([n['x']-n['w']/2,n['x']+n['w']/2])
    xs=sorted(xs);profile=[]
    for a,b in zip(xs,xs[1:]):
        notch=next((n for n in notches if n['side']=='top' and abs((a+b)/2-n['x'])<n['w']/2),None)
        z=min(.065,notch['z']-centre) if notch else .065
        profile.extend([(a,z),(b,z)])
    for a,b in reversed(list(zip(xs,xs[1:]))):
        notch=next((n for n in notches if n['side']=='bottom' and abs((a+b)/2-n['x'])<n['w']/2),None)
        for q in [b,a]:profile.append((q,max(lower(q,length)*.5,notch['z']-centre) if notch else lower(q,length)*.5))
    clean=[]
    for p in profile:
        if not clean or math.dist(p,clean[-1])>1e-8:clean.append(p)
    obj=profile_solid(name,clean,.21)
    obj.location=(x,y,centre);obj.rotation_euler.z=angle
    return obj

# A single editable bracket, dimensions match the receiving frame's sockets.
members=[]
daito=tapered_block('bracket_daito',[(.2592,-.15),(.3072,-.1178),(.4128,-.0051),(.48,.0087),(.48,.08)])
members.append(daito)
# Cut the actual curved crossed bearings into the Daito with closed cutters.
for axis in range(2):
    profile=[(-.7,.5),(.7,.5)]+[(q,(.165 if axis==0 else .184)+lower(q,1.24)*.5) for q in np.linspace(.7,-.7,101)]
    cutter=profile_solid('temporary-seating-cutter',profile,.2104,red,0)
    cutter.rotation_euler.z=axis*math.pi/2
    bpy.context.view_layer.objects.active=daito
    mod=daito.modifiers.new('Actual crossed bearing cut','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
members.append(arm('bracket_first_x',1.24,.165,[{'x':0,'w':.21,'side':'top','z':.147}]))
members.append(arm('bracket_first_z',1.24,.184,[{'x':0,'w':.21,'side':'bottom','z':.147}],angle=math.pi/2))
for sign in [-1,1]:
    for axis in range(2):
        obj=tapered_block('bracket_san_to_%s_%s'%(sign,axis),[(.088,.2300),(.116,.270),(.135,.2825),(.135,.3500)])
        obj.location=(sign*.415 if axis==0 else 0,sign*.415 if axis else 0,0 if axis==0 else .019)
        members.append(obj)
for sign in [-1,1]:
    members.append(arm('bracket_upper_x_'+str(sign),1.36,.4965,[{'x':s*.415,'w':.21,'side':'bottom','z':.512} for s in [-1,1]],y=sign*.415))
    members.append(arm('bracket_upper_z_'+str(sign),1.36,.4775,[{'x':s*.415,'w':.21,'side':'top','z':.512} for s in [-1,1]],x=sign*.415,angle=math.pi/2))
for sx in [-1,1]:
    for sy in [-1,1]:
        obj=tapered_block('bracket_top_bearing_%s_%s'%(sx,sy),[(.086,.5615),(.108,.599),(.125,.61),(.125,.6815)])
        obj.location=(sx*.415,sy*.415,0);members.append(obj)
for sign in [-1,1]:
    obj=receiver('bracket_receiver_x_'+str(sign),1.44,.23,.6815,.7815,[{'x':0,'w':.25,'side':'top','z':.74575}],endwood)
    obj.location.y=sign*.415;members.append(obj)
obj=receiver('bracket_receiver_z',1.43,.25,.71,.82,[{'x':s*.415,'w':.23,'side':'bottom','z':.74575} for s in [-1,1]],endwood)
obj.rotation_euler.z=math.pi/2;members.append(obj)

guide=bpy.data.images.load(str(GUIDE),check_existing=False)
guide.colorspace_settings.name='Non-Color'
pixels=np.asarray(guide.pixels[:],dtype=np.float32).reshape(guide.size[1],guide.size[0],4)[:,:,:3].mean(axis=2)
# Read the output as a guide only. A gentle spatial filter removes sub-pixel
# texture that would otherwise become noisy displaced gold at moving distance.
for _ in range(3):pixels=(pixels*4+np.roll(pixels,1,0)+np.roll(pixels,-1,0)+np.roll(pixels,1,1)+np.roll(pixels,-1,1))/8
reliefs=[]
for lod,n in enumerate([257,97,41]):
    yy,xx=np.meshgrid(np.linspace(0,guide.size[1]-1,n),np.linspace(0,guide.size[0]-1,n),indexing='ij')
    iy=np.floor(yy).astype(int);ix=np.floor(xx).astype(int)
    jy=np.minimum(iy+1,guide.size[1]-1);jx=np.minimum(ix+1,guide.size[0]-1)
    fy=yy-iy;fx=xx-ix
    h=(1-fy)*((1-fx)*pixels[iy,ix]+fx*pixels[iy,jx])+fy*((1-fx)*pixels[jy,ix]+fx*pixels[jy,jx])
    h=np.clip((h-.035)/.93,0,1)
    verts=[(i/(n-1)-.5,-(.006+.050*float(h[j,i])),j/(n-1)-.5) for j in range(n) for i in range(n)]
    faces=[(j*n+i,j*n+i+1,(j+1)*n+i+1,(j+1)*n+i) for j in range(n-1) for i in range(n-1)]
    perimeter=list(range(n))+[j*n+n-1 for j in range(1,n)]+[(n-1)*n+i for i in range(n-2,-1,-1)]+[j*n for j in range(n-2,0,-1)]
    back=[]
    for index in perimeter:
        p=verts[index];back.append(len(verts));verts.append((p[0],.010,p[2]))
    centre=len(verts);verts.append((0,.010,0))
    for k,index in enumerate(perimeter):
        nxt=(k+1)%len(perimeter)
        faces.append((index,back[k],back[nxt],perimeter[nxt]))
        faces.append((centre,back[nxt],back[k]))
    obj=mesh_object('kiku_relief_lod'+str(lod),verts,faces,gold,True)
    for layer in list(obj.data.uv_layers):obj.data.uv_layers.remove(layer)
    uv=obj.data.uv_layers.new(name='sculpt-guide-uv')
    for poly in obj.data.polygons:
        poly.use_smooth=poly.index<(n-1)**2
        for loop in poly.loop_indices:
            p=obj.data.vertices[obj.data.loops[loop].vertex_index].co
            uv.data[loop].uv=(p.x+.5,p.z+.5)
    obj.location=(2.5+lod*1.5,0,0);reliefs.append(obj)

# Validate the actual editable solids, not just the Python source.
for obj in members+reliefs:
    bm=bmesh.new();bm.from_mesh(obj.data)
    bad=sum(1 for e in bm.edges if not e.is_manifold)
    if bad:raise RuntimeError(obj.name+' has '+str(bad)+' non-manifold edges')
    if not all(math.isfinite(v) for p in bm.verts for v in p.co):raise RuntimeError('Nonfinite model')
    rec=next(r for r in report['objects'] if r['name']==obj.name)
    rec['closedManifold']=True;rec['boundaryOrNonmanifoldEdges']=bad
    bm.free()
report['objects']=[r for r in report['objects'] if r['name'] in {o.name for o in members+reliefs}]

# Export prototypes at their genuine origins. Node names distinguish LODs;
# only the chosen LOD is attached to a real scene by the Three.js loader.
for o in reliefs:o.location=(0,0,0)
bpy.ops.object.select_all(action='DESELECT')
for o in members+reliefs:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'temple-joinery-v01.glb'),export_format='GLB',
    use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT',
    export_texcoords=True,export_normals=True,export_image_format='AUTO')

# Create an honest physical-lighting inspection. The large panel at right is
# rendered from the displaced mesh with one uniform gilt material, never the
# gray input image as its visible base color.
for o in members:o.location.x-=.85
for lod,o in enumerate(reliefs):
    o.location=(.90,0,.42);o.scale=(.85,.85,.85);o.hide_render=lod!=0
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.16))
plane=bpy.context.object;plane.name='review-floor';plane.data.materials.append(material('matte-studio-floor','322e28',.8))
world=bpy.data.worlds.new('studio-fill');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.55,.63,.78,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
def area(name,loc,power,size,color,target=(0,0,.35)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    ob=bpy.data.objects.new(name,data);scene.collection.objects.link(ob);ob.location=loc
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
area('large soft side key',(-1.5,-3,4),500,3.0,(1,.82,.59))
area('cool edge reflection',(3,1,2.5),600,2.4,(.65,.8,1))
area('narrow gold highlight',(-3,1.4,1.7),300,1.4,(1,.68,.34))
data=bpy.data.cameras.new('actual-mesh-inspection');cam=bpy.data.objects.new('actual-mesh-inspection',data)
scene.collection.objects.link(cam);cam.location=(2.2,-4.5,2.35);cam.rotation_euler=(Vector((0,0,.34))-cam.location).to_track_quat('-Z','Y').to_euler();data.lens=58;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('KIT_SAMPLES','64'))
scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE'
scene.cycles.device='CPU';scene.render.threads_mode='FIXED';scene.render.threads=4
if os.environ.get('KIT_DEVICE')=='METAL':
    prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
    if not any(d.use for d in prefs.devices):raise RuntimeError('No actual Metal Cycles device')
    scene.cycles.device='GPU'
scene.cycles.max_bounces=8;scene.cycles.sample_clamp_indirect=10
scene.render.resolution_x=SIZE;scene.render.resolution_y=round(SIZE*.70);scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.4
scene.render.filepath=str(OUT/'actual-blender-mesh-review.png')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'temple-joinery-v01.blend'),compress=True)
bpy.ops.render.render(write_still=True)
report['status']='actual-solid-kit-rendered';report['cyclesDevice']=scene.cycles.device
report['actualReviewSize']=[scene.render.resolution_x,scene.render.resolution_y]
report['glbSha256']=hashlib.sha256((OUT/'temple-joinery-v01.glb').read_bytes()).hexdigest()
(OUT/'build-report.json').write_text(json.dumps(report,indent=2))
print('JOINERY_KIT_COMPLETE',json.dumps({'status':report['status'],'objects':len(members)+len(reliefs),'output':str(OUT)}),flush=True)
