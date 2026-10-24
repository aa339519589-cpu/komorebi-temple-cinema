"""CPU-prepared node-authoring plan, not imported/executed by R10.

Future use is only inside an authorized official physical job, after portable
materials are created. Source equations are from frozen d258 stone-lantern219.js
11-22. No photograph, new image, geometry, UV or original material scalar change.

The value-noise hash, eight-corner interpolation, mineral color and metric
height formulas retain their original equations and frequencies. Cycles float
rounding/compilation is not asserted bit-equivalent to WebGL. Its Bump node is a
physical normal adapter for the same height field: this replaces the original
screen-derivative normal expression, so normal pixel equivalence is not claimed.
"""

EXPECTED_SOURCE='d2587c2f5426ba656dc4c0d385b6499a452fbf26ff7352b9e712adb82e449dbd'
STONE_NAMES=('lantern219-fine-weathered-granite',
             'lantern219-worn-granite-arrises',
             'lantern219-damp-ancient-roof')


def port_original_granite219(bpy, source_hash):
    if source_hash != EXPECTED_SOURCE:
        raise RuntimeError('Original granite formula plan requires frozen d258')

    def bind(links, target, value):
        if isinstance(value,(int,float,tuple,list)):
            target.default_value=value
        else:
            links.new(value,target)

    def scalar(nodes, links, op, a, b=None):
        node=nodes.new('ShaderNodeMath');node.operation=op
        bind(links,node.inputs[0],a)
        if b is not None:bind(links,node.inputs[1],b)
        return node.outputs[0]

    def vector(nodes, links, op, a, b=None):
        node=nodes.new('ShaderNodeVectorMath');node.operation=op
        bind(links,node.inputs[0],a)
        if b is not None:bind(links,node.inputs[1],b)
        return node.outputs[0]

    def combine(nodes,links,parts):
        node=nodes.new('ShaderNodeCombineXYZ')
        for i,value in enumerate(parts):bind(links,node.inputs[i],value)
        return node.outputs[0]

    def axes(nodes,links,position):
        node=nodes.new('ShaderNodeSeparateXYZ');links.new(position,node.inputs[0])
        return tuple(node.outputs[i] for i in range(3))

    def group(name, input_name, output_name):
        tree=bpy.data.node_groups.new(name,'ShaderNodeTree')
        tree.interface.new_socket(name=input_name,in_out='INPUT',socket_type='NodeSocketVector')
        tree.interface.new_socket(name=output_name,in_out='OUTPUT',socket_type='NodeSocketFloat')
        nodes=tree.nodes;links=tree.links
        return tree,nodes,links,nodes.new('NodeGroupInput'),nodes.new('NodeGroupOutput')

    # Original gh: p=fract(p*.1031); p+=dot(p,p.yzx+33.33);
    #              return fract((p.x+p.y)*p.z).
    gh,hn,hl,hi,ho=group('219 original granite gh formula','P','Hash')
    multiplied=vector(hn,hl,'MULTIPLY',hi.outputs['P'],(.1031,.1031,.1031))
    raw_axes=axes(hn,hl,multiplied)
    p=tuple(scalar(hn,hl,'SUBTRACT',a,scalar(hn,hl,'FLOOR',a)) for a in raw_axes)
    q=combine(hn,hl,p)
    permuted=combine(hn,hl,(p[1],p[2],p[0]))
    offset=vector(hn,hl,'ADD',permuted,(33.33,33.33,33.33))
    dot_node=hn.new('ShaderNodeVectorMath');dot_node.operation='DOT_PRODUCT'
    hl.new(q,dot_node.inputs[0]);hl.new(offset,dot_node.inputs[1]);dot=dot_node.outputs['Value']
    accumulated=tuple(scalar(hn,hl,'ADD',a,dot) for a in p)
    product=scalar(hn,hl,'MULTIPLY',scalar(hn,hl,'ADD',accumulated[0],accumulated[1]),accumulated[2])
    result=scalar(hn,hl,'SUBTRACT',product,scalar(hn,hl,'FLOOR',product))
    hl.new(result,ho.inputs['Hash'])

    # Original gn: floor/fract P, cubic interpolation f*f*(3-2*f),
    # eight gh corners, then mix along x, y and z in source order.
    gn,nn,nl,ni,no=group('219 original granite gn trilinear value noise','P','Noise')
    p_axes=axes(nn,nl,ni.outputs['P'])
    floors=tuple(scalar(nn,nl,'FLOOR',a) for a in p_axes)
    fractions=tuple(scalar(nn,nl,'SUBTRACT',a,i) for a,i in zip(p_axes,floors))
    weights=tuple(scalar(nn,nl,'MULTIPLY',scalar(nn,nl,'MULTIPLY',f,f),scalar(nn,nl,'SUBTRACT',3,scalar(nn,nl,'MULTIPLY',2,f))) for f in fractions)
    origin=combine(nn,nl,floors)
    corners={}
    for z in (0,1):
        for y in (0,1):
            for x in (0,1):
                position=vector(nn,nl,'ADD',origin,(x,y,z))
                node=nn.new('ShaderNodeGroup');node.node_tree=gh
                nl.new(position,node.inputs['P']);corners[(x,y,z)]=node.outputs['Hash']

    def mix(a,b,t):
        return scalar(nn,nl,'ADD',scalar(nn,nl,'MULTIPLY',a,scalar(nn,nl,'SUBTRACT',1,t)),scalar(nn,nl,'MULTIPLY',b,t))

    along_x={(y,z):mix(corners[(0,y,z)],corners[(1,y,z)],weights[0]) for z in (0,1) for y in (0,1)}
    along_y={z:mix(along_x[(0,z)],along_x[(1,z)],weights[1]) for z in (0,1)}
    nl.new(mix(along_y[0],along_y[1],weights[2]),no.inputs['Noise'])

    installed=[]
    for material in list(bpy.data.materials):
        # Include both linked INSTANCER and baked GEOMETRY variants.
        if not any(material.name.startswith(name) for name in STONE_NAMES):continue
        nodes=material.node_tree.nodes;links=material.node_tree.links
        bs=next((n for n in nodes if n.bl_idname=='ShaderNodeBsdfPrincipled'),None)
        if bs is None:raise RuntimeError('Original granite material lost Principled BSDF')
        pos=nodes.new('ShaderNodeNewGeometry')
        bx,by,bz=axes(nodes,links,pos.outputs['Position'])
        # Imported world has the rigid +pi/2 X conversion. Restore source
        # Y-up world P=(Bx,Bz,-By), including the actual instance transforms.
        source_position=combine(nodes,links,(bx,bz,scalar(nodes,links,'MULTIPLY',by,-1)))

        def noise(scale):
            location=vector(nodes,links,'MULTIPLY',source_position,scale)
            node=nodes.new('ShaderNodeGroup');node.node_tree=gn
            links.new(location,node.inputs['P']);return node.outputs['Noise']

        def smoothstep(low,high,x):
            t=scalar(nodes,links,'DIVIDE',scalar(nodes,links,'SUBTRACT',x,low),high-low)
            t=scalar(nodes,links,'MINIMUM',1,scalar(nodes,links,'MAXIMUM',0,t))
            return scalar(nodes,links,'MULTIPLY',scalar(nodes,links,'MULTIPLY',t,t),scalar(nodes,links,'SUBTRACT',3,scalar(nodes,links,'MULTIPLY',2,t)))

        broad=noise((8,5,8));mineral=noise((148,148,148));quartz=noise((317,317,317))
        dark=smoothstep(.64,.79,mineral)
        factor=scalar(nodes,links,'ADD',scalar(nodes,links,'ADD',.72,scalar(nodes,links,'MULTIPLY',.32,broad)),scalar(nodes,links,'MULTIPLY',.18,quartz))
        base_link=next(iter(bs.inputs['Base Color'].links),None)
        base=base_link.from_socket if base_link else tuple(bs.inputs['Base Color'].default_value)
        color_mult=nodes.new('ShaderNodeMixRGB');color_mult.blend_type='MULTIPLY';color_mult.inputs[0].default_value=1
        bind(links,color_mult.inputs[1],base);links.new(combine(nodes,links,(factor,factor,factor)),color_mult.inputs[2])
        dark_mix=nodes.new('ShaderNodeMixRGB');dark_mix.blend_type='MIX'
        links.new(scalar(nodes,links,'MULTIPLY',dark,.28),dark_mix.inputs[0]);links.new(color_mult.outputs[0],dark_mix.inputs[1]);dark_mix.inputs[2].default_value=(.065,.062,.052,1)
        quartz_weight=smoothstep(.76,.88,quartz)
        quartz_color=combine(nodes,links,tuple(scalar(nodes,links,'MULTIPLY',quartz_weight,v) for v in (.016,.014,.010)))
        colored=vector(nodes,links,'ADD',dark_mix.outputs[0],quartz_color)
        links.new(colored,bs.inputs['Base Color'])

        height=scalar(nodes,links,'ADD',scalar(nodes,links,'MULTIPLY',.0015,noise((87,87,87))),scalar(nodes,links,'MULTIPLY',.0005,noise((219,219,219))))
        bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=1;bump.inputs['Distance'].default_value=1
        existing=next(iter(bs.inputs['Normal'].links),None)
        if existing:links.new(existing.from_socket,bump.inputs['Normal'])
        links.new(height,bump.inputs['Height']);links.new(bump.outputs['Normal'],bs.inputs['Normal'])
        installed.append({'material':material.name,'originalBaseInputRetained':True,'worldCoordinates':'actual imported world restored to sourceYUp','heightMetres':[.0015,.0005],'heightFrequenciesPerMetre':[87,219],'noiseEquations':'Original gh/gn; no substitute Blender NoiseTexture','normalAdapter':'Cycles Bump on same original metric height; derivative/pixel equivalence not claimed'})

    if not installed:raise RuntimeError('No original granite materials matched; do not silently port a substitute')
    return {'status':'original-granite-formula-node-adapter-installed','materials':installed,'newImages':False,'newGeometry':False,'sourceHash':source_hash,'hashGroupNodes':len(gh.nodes),'noiseGroupNodes':len(gn.nodes),'GLSLBitOrPixelEquivalenceClaimed':False}
