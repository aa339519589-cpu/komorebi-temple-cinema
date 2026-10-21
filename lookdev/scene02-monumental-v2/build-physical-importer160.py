from pathlib import Path
src=Path('lookdev/scene06-solmax-cycles-20261021/render-scene06-cycles.py').read_text()
s=src[:src.index('# Physical incident-light boundary:')]
s=s[s.index('import bpy,json'):]
s=s.replace("str(HERE/'iteration-01-source-sun')","str(HERE/'cycles-r01')")
s=s.replace("MODE=os.environ.get('LIGHTING_MODE','source-sun-physical-apertures')","MODE='scene02-source-sun-and-physical-bounce'")
s=s.replace("assert source_export['sourceHash']=='061e581d9b6fdf04e08a8133ad6f45b28bc9c6531c6a41aefd3b142ca2deefe0'", "assert source_export['sourceHash']==os.environ['SCENE_EXPECTED_HASH'], 'Current source export is not the expected frozen candidate'")
s=s.replace("assert scene_data['view']['reference']==6", "assert scene_data['view']['reference']==2")
s=s.replace("'status':'importing','started':time.time()", "'status':'importing','started':time.time()")
s=s.replace("(OUT/'report.json').write_text", "for asset,info in source_export['exportedAssets'].items():\n    assert hashlib.sha256((ROOT/'assets'/asset).read_bytes()).hexdigest()==info['sha256'],asset\n(OUT/'report.json').write_text",1)
s=s.replace("varnish_coat_roughness=float(os.environ.get('CYCLES_VARNISH_COAT_ROUGHNESS','.17'))", "timber_names={'scene02-red','scene02-cedar','scene02-darkwood','scene02-hall-aged-bearing-timber','scene02-hall-recessed-oxide-lacquer','scene02-hall-deep-vermilion-shaft','scene02-veranda-rubbed-lacquer-shaft','scene02-pagoda-deep-wall-and-soffit160','scene02-pagoda-worn-vermilion160'}\ntimber_ids={r['id'] for r in scene_data['materials'] if r['name'] in timber_names}")
s=s.replace("    if rec['name']=='reference6-varnished-red-brown-floor-body':\n        value(bs,['Coat Roughness','Clearcoat Roughness'],varnish_coat_roughness)\n",'')
# Pigment normalization and the native roughness remap must be ported explicitly;
# the stock exported raw albedo multiplication would make all painted wood black.
s=s.replace("        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(tex_nodes['map'].outputs['Color'],mul.inputs[1]);base_socket=mul.outputs[0]", """        map_color=tex_nodes['map'].outputs['Color']
        is_floor=rec['name']=='scene02-darkwood' and float(rec.get('clearcoat') or 0)>.7
        painted=rec['id'] in timber_ids and (rec['name'] not in ['scene02-darkwood','scene02-pagoda-deep-wall-and-soffit160'] or is_floor)
        if painted:
            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(map_color,sep.inputs['Color'])
            weighted=[]
            for component,weight in [('Red',.2126),('Green',.7152),('Blue',.0722)]:
                mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=weight;links.new(sep.outputs[component],mul.inputs[0]);weighted.append(mul.outputs[0])
            add=n.new('ShaderNodeMath');add.operation='ADD';links.new(weighted[0],add.inputs[0]);links.new(weighted[1],add.inputs[1]);add2=n.new('ShaderNodeMath');add2.operation='ADD';links.new(add.outputs[0],add2.inputs[0]);links.new(weighted[2],add2.inputs[1])
            div=n.new('ShaderNodeMath');div.operation='DIVIDE';div.inputs[1].default_value=.01505120736;links.new(add2.outputs[0],div.inputs[0]);power=n.new('ShaderNodeMath');power.operation='POWER';power.inputs[1].default_value=.22 if rec['name']=='scene02-hall-deep-vermilion-shaft' else .55;links.new(div.outputs[0],power.inputs[0])
            low,high=(.86,1.15) if rec['name']=='scene02-hall-deep-vermilion-shaft' else (.52,1.46)
            clamp=n.new('ShaderNodeClamp');clamp.inputs['Min'].default_value=low;clamp.inputs['Max'].default_value=high;links.new(power.outputs[0],clamp.inputs['Value']);map_color=clamp.outputs[0]
        mul=n.new('ShaderNodeMixRGB');mul.blend_type='MULTIPLY';mul.inputs[0].default_value=1;mul.inputs[2].default_value=color;links.new(map_color,mul.inputs[1]);base_socket=mul.outputs[0]""")
s=s.replace("            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);links.new(mul.outputs[0],bs.inputs[input_name])", """            sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(tex_nodes[ch].outputs['Color'],sep.inputs['Color']);mul=n.new('ShaderNodeMath');mul.operation='MULTIPLY';mul.inputs[1].default_value=float(factor);links.new(sep.outputs[{'G':'Green','B':'Blue'}[component]],mul.inputs[0]);factor_socket=mul.outputs[0]
            if rec['id'] in timber_ids and ch=='roughnessMap':
                shaft=rec['name']=='scene02-hall-deep-vermilion-shaft';scale=n.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=.45 if shaft else .72;links.new(factor_socket,scale.inputs[0]);add=n.new('ShaderNodeMath');add.operation='ADD';add.inputs[1].default_value=.22 if shaft else .36;links.new(scale.outputs[0],add.inputs[0]);clamp=n.new('ShaderNodeClamp');clamp.inputs['Min'].default_value=.30 if shaft else .42;clamp.inputs['Max'].default_value=.64 if shaft else .94;links.new(add.outputs[0],clamp.inputs['Value']);factor_socket=clamp.outputs[0]
            links.new(factor_socket,bs.inputs[input_name])""")
s=s.replace("    materials[rec['id']]=mat", """    # The exact same physical pond surface now reflects geometry with a true
    # dielectric interface. Its old screen-space Reflector remains excluded.
    if rec['name']=='scene02-water':
        value(bs,['Metallic'],0);value(bs,['IOR'],1.333);value(bs,['Roughness'],.065);value(bs,['Transmission Weight','Transmission'],.55);value(bs,['Coat Weight','Clearcoat'],.28);value(bs,['Coat Roughness','Clearcoat Roughness'],.045)
    materials[rec['id']]=mat""")
s=s.replace("    count=record['instances'];raw=", "    native_timber=any(mid in timber_ids for mid in record['materials']) and 'timberExtent' in data\n    count=record['instances'];raw=")
s=s.replace("        if shear>1e-7:", "        if shear>1e-7 or native_timber:")
s=s.replace("        uv=data['uv'][faces.reshape(-1)%vcount,:2].astype(np.float32,copy=False) if 'uv' in data else None", "        uv=None\n        metric_uv=np.empty((n*vcount,2),dtype=np.float32) if native_timber else None")
s=s.replace("            if np.linalg.det(transform[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]", """            if np.linalg.det(transform[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]
            if native_timber:
                member_scale=np.linalg.norm(transform[:3,:3],axis=0);spans=data['timberExtent'][0]*member_scale;pm=p*member_scale;nn=np.abs(data['normal']);pair=np.empty((vcount,2),dtype=np.float64)
                if spans[1]>=spans[0] and spans[1]>=spans[2]:pair[:,0]=pm[:,1];pair[:,1]=np.where(nn[:,0]>nn[:,2],pm[:,2],pm[:,0])
                elif spans[0]>=spans[2]:pair[:,0]=pm[:,0];pair[:,1]=np.where(nn[:,1]>nn[:,2],pm[:,2],pm[:,1])
                else:pair[:,0]=pm[:,2];pair[:,1]=np.where(nn[:,1]>nn[:,0],pm[:,0],pm[:,1])
                h=math.sin(float(transform[:3,3]@np.array([12.713,4.13,5.71])))*43758.5453;offset=h-math.floor(h);pair+=np.array([offset,offset*.37]);metric_uv[sl]=pair
        if native_timber:uv=metric_uv[faces.reshape(-1)]
        elif 'uv' in data:uv=data['uv'][faces.reshape(-1)%vcount,:2].astype(np.float32,copy=False)""")
s=s.replace("'parentMatrices':'Retained as full source object matrices; all 1933 exported parent matrices are orthogonal/no shear.'", "'parentMatrices':'Retained as full exported source object matrices.'")
s=s.replace("'flattenedOnlyForShearedTransforms':True", "'flattenedForShearedTransformsAndNativeMetricTimberUV':True")
# Reuse the mathematical atmosphere field, without executing any foreign
# reconstruction, material, light or scene logic.
tool=Path('tools/render-reconstructed-cycles.py').read_text();skycode=tool[tool.index('def _fract'):tool.index('def add_scene02_source_sky_dome')]
s+='\n'+skycode+'\n'
Path('lookdev/scene02-monumental-v2/render-physical160.py').write_text('''"""Scene02 exact current-buffer physical-lighting diagnostic.
Preserves original geometry, affine matrices, RGB instance attributes, original
CC0 decoded maps and native metric timber UV formula. No image replacement.
Importer provenance: scene06 exact-affine/instance-attribute importer, copied
locally; scene02 authored atmosphere is ported mathematically to a float world.
"""\n'''+s)
