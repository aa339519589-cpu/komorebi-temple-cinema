"""Render actual CC0 source-derived components via the official Blender FIFO.

No source photograph, image plane, source texture, AI frame, bump map or
displacement is used. The only added geometry is a neutral mounting platform.
"""
import bpy, math, json, hashlib, os
from pathlib import Path
from mathutils import Vector

HERE=Path(__file__).resolve().parent
REVISION=os.environ.get('DRAPERY_REV','r01')
DEST=HERE/REVISION
VIEWS=DEST/'clay-views';VIEWS.mkdir(exist_ok=True)
manifest=json.loads((DEST/'manifest.json').read_text())
anchor=manifest['components'][0]['sourceNormalizedAnchor']
# All inspection cameras retain the same source-world framing after adopting
# the measured actual rear-seat surface anchor in the clean donor revisions.
frame_shift=Vector((.02-anchor[0], -(-.1-anchor[2]), .555-anchor[1]))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
model=[]
for c in manifest['components']:
    before=set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(DEST/c['glb']))
    new=[o for o in scene.objects if o not in before]
    for ob in new:
        if ob.type=='MESH':
            model.append(ob)
            ob['component_identity']=c['name']
            ob['glb_sha256']=c['glbSha256']

def material(name,color,roughness=.7,metallic=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metallic
    return m
clay=material('Physical neutral clay actual scan surface',(.28,.255,.22))
cap_mat=material('Declared hidden planar mounting closures',(.12,.095,.07),.8)
for ob in model:
    ob.data.materials.clear()
    ob.data.materials.append(cap_mat if ob.name.startswith('hidden_mount_cap') else clay)
    # Custom source normals imported from the GLB are preserved.
platform_mat=material('Neutral dark mount support',(.035,.04,.045),.82)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1,depth=.055,location=(0,0,-.034))
platform=bpy.context.object;platform.name='Neutral support under declared seat cut'
platform.location+=frame_shift
platform.scale=(.71,.61,1);platform.data.materials.append(platform_mat)
bevel=platform.modifiers.new('Mount edge','BEVEL');bevel.width=.008;bevel.segments=3
for f in platform.data.polygons:f.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.064))
ground=bpy.context.object;ground.name='Neutral studio ground';ground.data.materials.append(platform_mat)
def look(ob,at):ob.rotation_euler=(Vector(at)-ob.location).to_track_quat('-Z','Y').to_euler()
world=bpy.data.worlds.new('Neutral inspection studio');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.055,.06,.065,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.32
for name,pos,energy,size in [('Broad key',(-2.8,-3.5,3.0),330,2.8),('Soft fill',(2.5,-2,1.8),90,2.5),('Back contour',(1.3,2.5,2.2),190,2.1)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size
    ob=bpy.data.objects.new(name,d);scene.collection.objects.link(ob);ob.location=Vector(pos)+frame_shift;look(ob,Vector((0,0,.45))+frame_shift)
d=bpy.data.cameras.new('Actual component inspection camera');camera=bpy.data.objects.new(d.name,d)
scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO'
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1120;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
views=[]
setups=[
    ('assembly-front-clay',(0,-4.0,.66),(0,0,.46),1.63,None),
    ('assembly-three-quarter-clay',(2.5,-3.5,1.1),(0,0,.44),1.63,None),
    ('knees-front-close-clay',(0,-4,.37),(0,-.24,.12),1.48,'crossed-knees-hips'),
    ('knees-three-quarter-close-clay',(-2.6,-3.5,1.1),(-.04,-.25,.12),1.48,'crossed-knees-hips'),
    ('torso-front-close-clay',(0,-4,.69),(.025,.25,.57),1.05,'torso-cloak-core'),
    ('torso-three-quarter-close-clay',(2.7,-3.5,1.15),(.025,.25,.57),1.05,'torso-cloak-core'),
    ('assembly-side-mount-check',(3.6,-1.6,1.0),(0,0,.44),1.63,None),
]
for name,pos,at,scale,only in setups:
    for ob in model:ob.hide_render=bool(only and ob['component_identity']!=only)
    platform.hide_render=only=='torso-cloak-core'
    actual_position=Vector(pos)+frame_shift;actual_target=Vector(at)+frame_shift
    camera.location=actual_position;look(camera,actual_target);d.ortho_scale=scale
    scene.render.filepath=str(VIEWS/(name+'.png'));bpy.ops.render.render(write_still=True)
    views.append(dict(file=name+'.png',cameraBlender=list(actual_position),targetBlender=list(actual_target),orthographicScale=scale,component=only or 'both retained components'))
receipt=dict(revision=REVISION,renderer='Blender Cycles Metal via tools/run-blender-queued.mjs',samples=48,
    builderSha256=manifest['builderSha256'],renderScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    componentIdentities=[dict(file=c['glb'],sha256=c['glbSha256'])for c in manifest['components']],
    sourceSha256=manifest['sourceSha256'],sourceLicense=manifest['sourceLicense'],
    sourceCulture=manifest['sourceCulture'],sourceTextureUsed=False,sourcePhotoUsed=False,
    geometricDisplacementUsed=False,normalMapUsed=False,views=views,visualAccepted=False,
    limit='This demonstrates actual retained source geometry and declared mount cuts. Chinese Tang source is a different artifact, with stone damage and different pose, from Japanese reference06.')
(VIEWS/'render-receipt.json').write_text(json.dumps(receipt,indent=2))
print('CC0_TANG_DRAPERY_COMPONENT_CLAY_READY',REVISION,flush=True)
