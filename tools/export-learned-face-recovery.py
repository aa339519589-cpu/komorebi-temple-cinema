"""Export the already completed face sculpt after a Blender5.2 flag rename.
No geometry is rebuilt or altered in this recovery.
"""
from pathlib import Path
import bpy,bmesh,json,hashlib
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'reconstructions/scene-06/assets/learned-face-v01';SRC=ROOT/'lookdev/local-triposg-head/full-precision/head-fp32-untextured.glb'
bpy.ops.wm.open_mainfile(filepath=str(OUT/'central-face.blend'))
o=bpy.data.objects['scene06-learned-central-face-and-ears'];bm=bmesh.new();bm.from_mesh(o.data)
topology={'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),'signedVolumeUnits3':bm.calc_volume(signed=True)};bm.free()
if topology['boundaryEdges'] or topology['nonmanifoldEdges'] or topology['signedVolumeUnits3']<=0:raise ValueError('Prepared final sculpt needs topology review')
bpy.ops.export_scene.gltf(filepath=str(OUT/'central-face.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='NONE',export_vertex_color='NONE',export_texcoords=True,export_normals=True)
report={'status':'prepared-unaccepted-face-candidate','photographicAcceptance':False,'inputSha256':hashlib.sha256(SRC.read_bytes()).hexdigest(),'placement':{'scale':.68,'translation':[0,2.917,-.16]},'jointCutsY':[2.36,3.205],'smallBoundaryPatchLimitUnits':.10,'topology':topology,'texturesUsed':False,'vertexColorsUsed':False,'requiresOriginalGoldMaterial':True,'originalPartsRetained':'Native neck, curl cap, diadem, body, attendants, camera and lighting','blender':bpy.app.version_string,'buildScript':'tools/build-scene06-learned-face.py','recovery':'Only obsolete export_colors keyword replaced by current export_vertex_color=NONE; existing editable sculpt reused without rebuilding geometry.'}
for f in ['central-face.glb','central-face.blend']:report[f+'Sha256']=hashlib.sha256((OUT/f).read_bytes()).hexdigest()
(OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n');print('PREPARED_FACE_EXPORTED',json.dumps(topology),flush=True)
