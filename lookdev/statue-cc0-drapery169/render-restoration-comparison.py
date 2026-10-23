"""FIFO-only matching-camera clay and aged-gold geometry comparisons.

Both the immutable R03 and R04 local-restoration candidate are rendered here;
all images go in the R04 folder. Neither source textures nor photographs are
used. Cap materials remain distinct so mounting surfaces stay explicit.
"""
import bpy,json,hashlib,os
from pathlib import Path
from mathutils import Vector

HERE=Path(__file__).resolve().parent
DEST=HERE/'r04-local-restoration'
variant=os.environ.get('RESTORATION_VARIANT','')
if variant:
    if variant!='iteration-02':raise RuntimeError('Unknown local restoration variant')
    DEST=DEST/variant
OUT=DEST/'comparison-views';OUT.mkdir(exist_ok=True)
before=json.loads((HERE/'r03/manifest.json').read_text())
after=json.loads((DEST/'manifest.json').read_text())
original_cameras=json.loads((HERE/'r03/clay-views/render-receipt.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
models={}
identities=[]
for revision,folder,manifest in [('before-r03',HERE/'r03',before),('after-r04',DEST,after)]:
    models[revision]=[]
    for component in manifest['components']:
        path=folder/component['glb'];sha=hashlib.sha256(path.read_bytes()).hexdigest()
        assert sha==component['glbSha256']
        identities.append(dict(revision=revision,component=component['name'],file=str(path.relative_to(HERE)),sha256=sha))
        objects_before=set(scene.objects)
        bpy.ops.import_scene.gltf(filepath=str(path))
        for ob in scene.objects:
            if ob not in objects_before and ob.type=='MESH':
                ob['component_identity']=component['name'];ob['cap']=ob.name.startswith('hidden_mount_cap')
                models[revision].append(ob)

def material(name,color,roughness,metallic):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metallic
    return m
clay=material('Uniform neutral clay geometry inspection',(.28,.255,.22),.70,0)
gold=material('Uniform aged gold physical comparison',(.58,.325,.075),.34,.92)
cap_mat=material('Explicit planar mount cap remains distinct',(.12,.095,.07),.8,0)
support_mat=material('Neutral dark support',(.035,.04,.045),.82,0)
anchor=before['components'][0]['sourceNormalizedAnchor']
shift=Vector((.02-anchor[0],-(-.1-anchor[2]),.555-anchor[1]))
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1,depth=.055,location=Vector((0,0,-.034))+shift)
platform=bpy.context.object;platform.name='Neutral mount under unchanged seat cut';platform.scale=(.71,.61,1);platform.data.materials.append(support_mat)
bevel=platform.modifiers.new('Mount edge','BEVEL');bevel.width=.008;bevel.segments=3
for f in platform.data.polygons:f.use_smooth=True
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.064))
ground=bpy.context.object;ground.name='Neutral ground';ground.data.materials.append(support_mat)
def look(ob,at):ob.rotation_euler=(Vector(at)-ob.location).to_track_quat('-Z','Y').to_euler()
world=bpy.data.worlds.new('Neutral comparison environment');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs['Color'].default_value=(.08,.085,.09,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
for name,pos,energy,size in [('Broad key',(-2.8,-3.5,3.0),330,2.8),('Soft fill',(2.5,-2,1.8),90,2.5),('Back contour',(1.3,2.5,2.2),190,2.1)]:
    d=bpy.data.lights.new(name,'AREA');d.energy=energy;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=Vector(pos)+shift;look(o,Vector((0,0,.45))+shift)
# A physical elongated reflection makes the gold response legible. It is the
# same actual light for both meshes and both materials, with no texture/bump.
d=bpy.data.lights.new('Soft reflection strip','AREA');d.energy=100;d.shape='RECTANGLE';d.size=.45;d.size_y=1.8
o=bpy.data.objects.new(d.name,d);scene.collection.objects.link(o);o.location=Vector((-1.7,-2.4,1.5))+shift;look(o,Vector((0,0,.45))+shift)
d=bpy.data.cameras.new('Matched comparison camera');camera=bpy.data.objects.new(d.name,d);scene.collection.objects.link(camera);scene.camera=camera;d.type='ORTHO'
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True;scene.cycles.device='GPU'
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for device in prefs.devices:device.use=device.type=='METAL'
scene.render.threads_mode='FIXED';scene.render.threads=4
scene.render.resolution_x=1200;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
setups=[('knees-front','knees-front-close-clay','crossed-knees-hips'),
        ('knees-three-quarter','knees-three-quarter-close-clay','crossed-knees-hips'),
        ('torso-front','torso-front-close-clay','torso-cloak-core'),
        ('torso-three-quarter','torso-three-quarter-close-clay','torso-cloak-core')]
views=[]
for title,camera_name,component in setups:
    source_camera=next(v for v in original_cameras['views']if v['file']==camera_name+'.png')
    camera.location=source_camera['cameraBlender'];look(camera,source_camera['targetBlender']);d.ortho_scale=source_camera['orthographicScale']
    platform.hide_render=component=='torso-cloak-core'
    for material_name,physical in [('clay',clay),('aged-gold',gold)]:
        for revision in ['before-r03','after-r04']:
            for rev,objects in models.items():
                for ob in objects:
                    ob.hide_render=rev!=revision or ob['component_identity']!=component
                    ob.data.materials.clear();ob.data.materials.append(cap_mat if ob['cap']else physical)
            name=f'{title}-{material_name}-{revision}.png';scene.render.filepath=str(OUT/name)
            reused=False
            if variant and revision=='before-r03':
                # The geometry, camera, lighting and material of this already
                # rendered baseline have not changed. Keep the actual frame
                # by reference instead of spending another FIFO render slot.
                baseline=HERE/'r04-local-restoration/comparison-views'/name
                if not baseline.exists():raise RuntimeError('Missing actual FIFO baseline frame')
                target=OUT/name
                if target.is_symlink():target.unlink()
                target.symlink_to(Path(os.path.relpath(baseline,OUT)))
                reused=True
            else:bpy.ops.render.render(write_still=True)
            views.append(dict(file=name,sha256=hashlib.sha256((OUT/name).read_bytes()).hexdigest(),revision=revision,component=component,
                material=material_name,cameraBlender=list(camera.location),targetBlender=source_camera['targetBlender'],orthographicScale=d.ortho_scale,
                matchingR03Camera=camera_name+'.png',reusedActualFIFOFrame=reused))
receipt=dict(renderer='Blender Cycles Metal via official FIFO',samples=64,resolution=[1200,1050],
    inputComponents=identities,renderScriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    restorationBuilderSha256=after['builderSha256'],views=views,
    sameCameraForBeforeAfter=True,sameMaterialsForBeforeAfter=True,samePhysicalLightsForBeforeAfter=True,
    noPhotographs=True,noSourceTextures=True,noNormalMaps=True,noDisplacementShader=True,
    goldMaterial=dict(baseColor=[.58,.325,.075],metallic=.92,roughness=.34,texture='None'),
    visualAccepted=False,limit='A derived/restored Chinese Tang surface donor, different artifact from Japanese reference06. Macro-fold preservation and finish require actual visual evaluation.')
(OUT/'render-receipt.json').write_text(json.dumps(receipt,indent=2))
print('MATCHED_LOCAL_RESTORATION_CLAY_AND_GOLD_READY',flush=True)
