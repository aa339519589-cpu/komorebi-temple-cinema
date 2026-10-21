from pathlib import Path
p=Path('lookdev/scene02-monumental-v2/render-physical160.py');s=p.read_text()
where=s.index('instance_colored=')
fn='''def native_floor_transfer(nodes,links,bs,source_rough):
    def op(kind,a,b=None):
        n=nodes.new('ShaderNodeMath');n.operation=kind
        if isinstance(a,(int,float)):n.inputs[0].default_value=a
        else:links.new(a,n.inputs[0])
        if b is not None:
            if isinstance(b,(int,float)):n.inputs[1].default_value=b
            else:links.new(b,n.inputs[1])
        return n.outputs[0]
    def clamp(socket,lo,hi):
        n=nodes.new('ShaderNodeClamp');n.inputs['Min'].default_value=lo;n.inputs['Max'].default_value=hi;links.new(socket,n.inputs['Value']);return n.outputs[0]
    geom=nodes.new('ShaderNodeNewGeometry');sep=nodes.new('ShaderNodeSeparateXYZ');links.new(geom.outputs['Position'],sep.inputs[0]);x=sep.outputs['X'];z=op('MULTIPLY',sep.outputs['Y'],-1)
    wear=op('EXPONENT',op('MULTIPLY',op('POWER',op('DIVIDE',op('SUBTRACT',x,15.55),.58),4),-1))
    wet=clamp(op('ADD',op('ADD',.55,op('MULTIPLY',.20,op('SINE',op('ADD',op('MULTIPLY',x,2.1),op('MULTIPLY',z,.37))))),op('MULTIPLY',.14,op('SINE',op('MULTIPLY',z,.83)))),.18,.89)
    rough=clamp(op('SUBTRACT',op('ADD',op('ADD',.25,op('MULTIPLY',source_rough,.23)),op('MULTIPLY',wear,.14)),op('MULTIPLY',wet,.07)),.24,.58)
    coat=clamp(op('SUBTRACT',op('ADD',.62,op('MULTIPLY',wet,.35)),op('MULTIPLY',wear,.12)),.35,.96)
    coat_rough=op('ADD',op('SUBTRACT',.22,op('MULTIPLY',wet,.145)),op('MULTIPLY',wear,.020))
    for names,socket in [(['Coat Weight','Clearcoat'],coat),(['Coat Roughness','Clearcoat Roughness'],coat_rough)]:
        for name in names:
            if name in bs.inputs:links.new(socket,bs.inputs[name]);break
    return rough

'''
s=s[:where]+fn+s[where:]
s=s.replace("            links.new(factor_socket,bs.inputs[input_name])", "            if rec['name']=='scene02-darkwood' and float(rec.get('clearcoat') or 0)>.7 and ch=='roughnessMap':factor_socket=native_floor_transfer(n,links,bs,mul.outputs[0])\n            links.new(factor_socket,bs.inputs[input_name])")
s=s.replace('Floor spatial clearcoat remains an approximation until explicit port.', 'The original metric-world wear/wetness formula drives physical floor roughness and clearcoat, with sourceX=worldX and sourceZ=-worldY after the shared coordinate conversion.')
p.write_text(s)
