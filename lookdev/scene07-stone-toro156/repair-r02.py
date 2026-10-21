from pathlib import Path
import json
p=Path('lookdev/scene07-stone-toro156/build-toro156.py');s=p.read_text().replace("os.environ.get('TORO_REVISION','r01')","os.environ.get('TORO_REVISION','r02')")
s=s.replace("m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();o=", "m=bpy.data.meshes.new(name);m.from_pydata(verts,[],faces);m.update();bm=bmesh.new();bm.from_mesh(m);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));\n    if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))\n    bm.to_mesh(m);bm.free();o=")
s=s.replace("abs(math.cos(a))**12+abs(math.sin(a))**12)**(1/12)","abs(math.cos(a))**32+abs(math.sin(a))**32)**(1/32)")
s=s.replace("(a+math.pi/6)%(math.pi/3)-math.pi/6", "a%(math.pi/3)-math.pi/6")
s=s.replace("for p in shaft.data.polygons:p.use_smooth=True\nbvh=", "bm=bmesh.new();bm.from_mesh(shaft.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));\nif bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))\nbm.to_mesh(shaft.data);bm.free()\nfor p in shaft.data.polygons:p.use_smooth=True\nbvh=")
s=s.replace("[(0,3.54),(.24,3.54),(.31,3.58),(.32,3.63),(.26,3.68),(.15,3.70),(0,3.70)]", "[(0,3.43),(.20,3.43),(.26,3.44),(.32,3.52),(.33,3.60),(.29,3.67),(.15,3.70),(0,3.70)]")
s=s.replace("pts=[point(x+.052*math.sin(t*TAU/32),z+.065*math.cos(t*TAU/32),.014) for t in range(32)];tube('Pierced kikko/lotus screen loop',pts,.0035,'bronze',True,6)", "pts=[point(x+.052*math.sin(t*TAU/32)*(1+.26*math.cos(t*TAU/8)),z+.058*math.cos(t*TAU/32)*(1+.26*math.cos(t*TAU/8)),.014) for t in range(32)];tube('Pierced kikko/lotus screen loop',pts,.0035,'bronze',True,6)\n            for side in [-1,1]:\n                tube('Actual cast loop-to-grid tie',[point(x+side*.0655,z,.014),point(x+side*.075,z,.014)],.003,'bronze');tube('Actual cast loop-to-grid tie',[point(x,z+side*.073,.014),point(x,z+side*.085,.014)],.003,'bronze')")
s=s.replace("materials['stone']=stone_material('Stone: physical weathered mineral',(.26,.28,.25));materials['cap']=stone_material('Cap: aged damp granite',(.16,.19,.17));", "materials['stone']=stone_material('Stone: physical weathered mineral',(.22,.24,.21));materials['cap']=stone_material('Cap: aged damp granite',(.11,.135,.12));")
s=s.replace("m['toroRole']='cap' if name.startswith('Cap') else 'stone';return m", "attr=n.new('ShaderNodeVertexColor');attr.layer_name='StoneAge';age=n.new('ShaderNodeMixRGB');age.blend_type='MULTIPLY';age.inputs[0].default_value=1;l.new(mix.outputs[0],age.inputs[1]);l.new(attr.outputs['Color'],age.inputs[2]);l.new(age.outputs[0],bs.inputs['Base Color']);m['toroRole']='cap' if name.startswith('Cap') else 'stone';return m")
needle="for o in asset_objects:o.data.materials.clear();o.data.materials.append(materials[o['toroRole']])"
replace=needle+"""
# Substantive geometry guard: a reversed cutter must never silently remove the
# supporting captured shaft. Actual evaluated faces and load-bearing span.
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();evaluated_shaft=shaft.evaluated_get(dg);assert len(evaluated_shaft.data.polygons)>1000, 'Carved shaft disappeared after boolean evaluation'
for o in asset_objects:
    if o['toroRole'] not in ['stone','cap']:continue
    attr=o.data.color_attributes.new(name='StoneAge',type='FLOAT_COLOR',domain='POINT');o.data.color_attributes.active_color=attr
    for i,v in enumerate(o.data.vertices):
        p=o.matrix_world@v.co;coarse=noise.noise(p*3.7+Vector((17.2,3.7,8.9)));fine=noise.noise(p*31+Vector((4,8,2)));damp=max(0,min(.32,(coarse+.14)*.55));tone=.82+.16*coarse+.045*fine
        if o['toroRole']=='cap':tone*=.84
        attr.data[i].color=(tone*(1-damp*.52),tone*(1-damp*.18),tone*(1-damp*.57),1)
"""
assert needle in s;s=s.replace(needle,replace)
s=s.replace("inputs['Strength'].default_value=.40", "inputs['Strength'].default_value=.22").replace("(-4,-5,7),950,4", "(-4,-5,7),600,3")
s=s.replace("d=bpy.data.lights.new('Physical lamp", "sun_data=bpy.data.lights.new('Grazing warm sunlight','SUN');sun_data.energy=1.6;sun_data.color=(1,.79,.57);sun_data.angle=math.radians(.53);sun_obj=bpy.data.objects.new(sun_data.name,sun_data);scene.collection.objects.link(sun_obj);sun_obj.location=(-6,-8,5);sun_obj.rotation_euler=(Vector((0,0,2))-sun_obj.location).to_track_quat('-Z','Y').to_euler()\nd=bpy.data.lights.new('Physical lamp")
s=s.replace("'assetObjects':len(asset_objects)", "'evaluatedCarvedShaftFaces':len(evaluated_shaft.data.polygons),'assetObjects':len(asset_objects)")
p.write_text(s)
r=Path('lookdev/scene07-stone-toro156/r01/rejected-review.json');r.write_text(json.dumps({'status':'rejected-geometry-review','reason':'Actual rendered full views exposed that inverted cutter normals made Exact Difference remove the entire supporting shaft. This left carving relief and upper chamber visibly floating. Also revealed an unsupported crown-seat edge and roof hips misaligned30degrees with the hexagonal plan.','repair':'R02 explicitly recalculates outward winding/positive signed cutter volume, guards actual evaluated shaft face count, nests the crown seat into the real roof, aligns the hex corners/hips, and adds connected cast grille ties and3D mineral-age vertex variation.','visualAccepted':False},indent=2)+'\n')
