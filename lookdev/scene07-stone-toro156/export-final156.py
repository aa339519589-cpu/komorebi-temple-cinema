"""Export the actual evaluated R02 asset with real RGB age attributes active.
No geometry or render-light changes. Original source and existing maps untouched.
"""
import bpy,json,hashlib,math,numpy as np,time
from pathlib import Path
HERE=Path(__file__).resolve().parent;OUT=HERE/'r02';r=json.loads((OUT/'report.json').read_text());assert r['status']=='rendered-hybrid-toro-review' and r['evaluatedCarvedShaftFaces']>1000
bpy.ops.wm.open_mainfile(filepath=str(OUT/'toro156-editable.blend'));scene=bpy.context.scene;deps=bpy.context.evaluated_depsgraph_get();assets=list(bpy.data.collections['EDITABLE Tōrō156 asset'].objects);bpy.ops.object.select_all(action='DESELECT');clones=[];roles={};bounds=[];triangles=0;colors=0
for o in assets:
    if o.type!='MESH':continue
    mesh=bpy.data.meshes.new_from_object(o.evaluated_get(deps));role=o['toroRole'];clone=bpy.data.objects.new(o.name,mesh);scene.collection.objects.link(clone);clone.matrix_world=o.matrix_world.copy();clone['toroRole']=role;clone['sourceDerivative']='Japanese Toro by 3dlunatic, CC BY 4.0; authored hybrid changes documented in report.json'
    uv=mesh.uv_layers.new(name='MetricStoneUV')
    for poly in mesh.polygons:
        n=poly.normal;axis=max(range(3),key=lambda k:abs(n[k]))
        for li in poly.loop_indices:
            p=mesh.vertices[mesh.loops[li].vertex_index].co;uv.data[li].uv=((p.y if axis==0 else p.x)/.3173828125,(p.y if axis==2 else p.z)/.3173828125)
    if role in ['stone','cap']:
        attr=mesh.color_attributes.get('StoneAge');assert attr is not None, o.name;mesh.color_attributes.active_color=attr;colors+=len(attr.data)
    mesh.materials.clear();mesh.materials.append(bpy.data.materials['GLB '+role]);clone.select_set(True);clones.append(clone);roles[role]=roles.get(role,0)+1;triangles+=sum(len(p.vertices)-2 for p in mesh.polygons);bounds.extend([list(clone.matrix_world@v.co) for v in mesh.vertices])
actual=[np.min(np.asarray(bounds),axis=0).tolist(),np.max(np.asarray(bounds),axis=0).tolist()];assert np.isfinite(np.asarray(bounds)).all();assert triangles==r['triangles']
path=OUT/'toro156-final.glb';bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_extras=True,export_yup=True,export_materials='EXPORT',export_vertex_color='ACTIVE',export_all_vertex_colors=False,export_animations=False)
report={'status':'evaluated-final-glb-exported','builderRenderReport':'r02/report.json','builderScriptSha256':r['scriptSha256'],'exporterSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'geometryChangedAfterR02Render':False,'triangles':triangles,'stoneAgeVertices':colors,'roles':roles,'boundsBlenderZUp':actual,'file':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'originalSourceSha256':r['sourceSha256'],'originalSourceBytesChanged':False,'originalGraniteMapBytesChanged':False,'imagesEmbedded':False,'visualAccepted':False};(OUT/'export-final.json').write_text(json.dumps(report,indent=2));print('TORO156_FINAL_EXPORT',json.dumps(report),flush=True)
