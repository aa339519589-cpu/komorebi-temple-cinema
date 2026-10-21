from pathlib import Path
s=Path(__file__).with_name('build-toro156.py').read_text();s=s[:s.index('# Individually modelled eroded stone footing courses.')]
s=s.replace("register(shaft);bpy.context", "before_voxel=shaft.data.copy();register(shaft);bpy.context")
exec(compile(s,str(Path(__file__).with_name('build-toro156.py')),'exec'))
mods=[m for m in shaft.modifiers if m.type=='BOOLEAN'];rows=[]
def counts(mesh):
    bm=bmesh.new();bm.from_mesh(mesh);result={'vertices':len(mesh.vertices),'faces':len(mesh.polygons),'volume':bm.calc_volume(signed=True),'boundaryEdges':sum(e.is_boundary for e in bm.edges),'bounds':[[min((v.co[k] for v in mesh.vertices),default=0) for k in range(3)],[max((v.co[k] for v in mesh.vertices),default=0) for k in range(3)]]};bm.free();return result
rows.append({'stage':'cropped scan before voxel','mesh':counts(before_voxel)});rows.append({'stage':'shaft data after voxel','mesh':counts(shaft.data)})
for m in mods:m.show_viewport=False;m.show_render=False
bpy.context.view_layer.update();rows.append({'stage':'all cutters disabled','mesh':counts(shaft.evaluated_get(bpy.context.evaluated_depsgraph_get()).data)})
for i,m in enumerate(mods):
    m.show_viewport=True;m.show_render=True;bpy.context.view_layer.update();rows.append({'stage':'after cutter'+str(i),'operand':counts(m.object.data),'shaft':counts(shaft.evaluated_get(bpy.context.evaluated_depsgraph_get()).data)})
path=Path(__file__).with_name('shaft-diagnostic.json');path.write_text(json.dumps(rows,indent=2));print('SHAFT156_DIAGNOSTIC',json.dumps(rows),flush=True)
