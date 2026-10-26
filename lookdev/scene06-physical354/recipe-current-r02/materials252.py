"""Reviewed-only Cycles material adapter. Imported only by the official queued job.

No photograph/capture image is a material input. Original image pixels, linear
base/vertex/instance factors, UV matrices and PBR scalars remain inspectable.
Paper, practical emission and varnish are the explicitly declared adapters.
"""
import math
import json
import hashlib
import numpy as np


def scalar(rec, name, default):
    value = rec.get(name)
    return float(default if value is None else value)


def set_value(node, names, value, required=False):
    for name in names:
        if name in node.inputs:
            node.inputs[name].default_value = value
            return node.inputs[name]
    if required:
        raise RuntimeError("Required installed Principled input absent: " + "/".join(names))


def math_socket(nodes, links, operation, a, b=None):
    node = nodes.new('ShaderNodeMath'); node.operation = operation
    for index, value in enumerate((a, b)):
        if value is None: continue
        if isinstance(value, (int, float)): node.inputs[index].default_value = value
        else: links.new(value, node.inputs[index])
    return node.outputs[0]


def multiply_color(nodes, links, a, b):
    node = nodes.new('ShaderNodeMixRGB'); node.blend_type = 'MULTIPLY'; node.inputs[0].default_value = 1
    for index, value in ((1, a), (2, b)):
        if isinstance(value, (tuple, list)): node.inputs[index].default_value = tuple(value)
        else: links.new(value, node.inputs[index])
    return node.outputs[0]


def uv_socket(nodes, links, tex):
    uv = nodes.new('ShaderNodeAttribute'); uv.attribute_type = 'GEOMETRY'; channel = int(tex.get('uvChannel') or 0)
    uv.attribute_name = 'sourceUV' if channel == 0 else 'sourceUV' + str(channel)
    sx, sy = tex.get('repeat', [1, 1]); ox, oy = tex.get('offset', [0, 0]); cx, cy = tex.get('center', [0, 0]); rotation = tex.get('rotation', 0)
    c, s = math.cos(rotation), math.sin(rotation)
    rows = [(sx*c, sx*s, -sx*(c*cx+s*cy)+cx+ox), (-sy*s, sy*c, -sy*(-s*cx+c*cy)+cy+oy)]
    if not tex.get('flipY', True): a, b, d = rows[1]; rows[1] = (-a, -b, 1-d)
    components = []
    for axis, (a, b, d) in enumerate(rows):
        dot = nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = (a, b, 0); links.new(uv.outputs['Vector'], dot.inputs[0])
        value = math_socket(nodes, links, 'ADD', dot.outputs['Value'], d)
        wrapping = int(tex['wrapS' if axis == 0 else 'wrapT'])
        if wrapping == 1002:
            half = math_socket(nodes, links, 'MULTIPLY', value, .5)
            period = math_socket(nodes, links, 'MULTIPLY', math_socket(nodes, links, 'FRACT', half), 2)
            value = math_socket(nodes, links, 'SUBTRACT', 1, math_socket(nodes, links, 'ABSOLUTE', math_socket(nodes, links, 'SUBTRACT', period, 1)))
        if wrapping in (1001, 1002):
            # Keep a REPEAT image's linear filter from wrapping its clamped edge.
            epsilon = .5 / int(tex['width' if axis == 0 else 'height'])
            value = math_socket(nodes, links, 'MINIMUM', math_socket(nodes, links, 'MAXIMUM', value, epsilon), 1-epsilon)
        elif wrapping != 1000: raise RuntimeError('Unsupported actual source wrap constant: ' + str(wrapping))
        components.append(value)
    combine = nodes.new('ShaderNodeCombineXYZ'); links.new(components[0], combine.inputs['X']); links.new(components[1], combine.inputs['Y'])
    return combine.outputs[0]


def varnish_normal(nodes, links, phase, base_normal):
    """Exact time-independent source sine slopes; source fwidth AA is not a BSDF."""
    geo = nodes.new('ShaderNodeNewGeometry'); position = nodes.new('ShaderNodeSeparateXYZ'); links.new(geo.outputs['Position'], position.inputs[0])
    x, z = position.outputs['X'], math_socket(nodes, links, 'MULTIPLY', position.outputs['Y'], -1)
    add = lambda a, b: math_socket(nodes, links, 'ADD', a, b)
    mul = lambda a, b: math_socket(nodes, links, 'MULTIPLY', a, b)
    sine = lambda a: math_socket(nodes, links, 'SINE', a)
    cosine = lambda a: math_socket(nodes, links, 'COSINE', a)
    a = add(add(mul(x, 184), mul(sine(mul(z, 3.1)), .55)), phase*1.73)
    b = add(add(mul(x, 437), mul(sine(mul(z, 8)), .32)), phase*.91)
    c = add(mul(z, 73), add(mul(sine(mul(x, 16)), 1.1), phase*2.2))
    sx = mul(add(add(mul(cosine(a), .0075), mul(cosine(b), .0030)), mul(sine(add(mul(z, 6.2), phase)), .0016)), .18)
    sz = mul(add(mul(cosine(c), .0040), mul(sine(add(mul(z, 18), phase*.7)), .0018)), .18)
    combine = nodes.new('ShaderNodeCombineXYZ'); links.new(mul(sx, -1), combine.inputs['X']); links.new(sz, combine.inputs['Y']); combine.inputs['Z'].default_value = 1
    normalize = nodes.new('ShaderNodeVectorMath'); normalize.operation = 'NORMALIZE'; links.new(combine.outputs[0], normalize.inputs[0])
    dot = nodes.new('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = (0, 0, 1); links.new(geo.outputs['Normal'], dot.inputs[0])
    top = math_socket(nodes, links, 'GREATER_THAN', dot.outputs['Value'], .94)
    mix = nodes.new('ShaderNodeMixRGB'); links.new(top, mix.inputs[0]); links.new(base_normal or geo.outputs['Normal'], mix.inputs[1]); links.new(normalize.outputs[0], mix.inputs[2])
    final = nodes.new('ShaderNodeVectorMath'); final.operation = 'NORMALIZE'; links.new(mix.outputs[0], final.inputs[0]); return final.outputs[0]


def material_library(bpy, package, root, source_report, report, settings):
    textures = {t['id']: t for t in package['textures']}; records = {m['id']: m for m in package['materials']}
    instance_colored = {mid for obj in package['meshes'] if 'instanceColors' in obj for mid in obj['materials']}
    materials, geometry_materials, images, adaptations = {}, {}, {}, []
    appearances, aliases = {}, {}
    # Optional exact-role PBR experiment. Immutable package records/images stay
    # unchanged; candidate scalars enter the existing full material path.
    study = settings.get('pbrStudy284'); candidates = {}
    if study:
        if source_report['sourceHash'] != study['expectedSourceHash']: raise RuntimeError('PBR study source pin differs')
        floor = [r for r in package['materials'] if r.get('nativeFloorVarnish') and r['name'] == study['floor']['exactName']]
        central = [r for r in package['materials'] if r['id'] == study['central']['exactId'] and r['name'] == study['central']['exactName']]
        if len(floor) != study['floor']['expectedRecords'] or len(central) != 1: raise RuntimeError('PBR study exact role count differs')
        central_meshes = [m for m in package['meshes'] if central[0]['id'] in m['materials']]
        if len(central_meshes) != 1 or central_meshes[0]['instances'] != 1 or central_meshes[0]['ancestry'] != study['central']['exactAncestry']: raise RuntimeError('PBR study central consumer differs')
        floor_ids = {r['id'] for r in floor}; floor_meshes = [m for m in package['meshes'] if floor_ids.intersection(m['materials'])]
        if len(floor_meshes) != study['floor']['expectedMeshes'] or any(m['name'] not in study['floor']['exactConsumerNames'] for m in floor_meshes): raise RuntimeError('PBR study floor consumer differs')
        for role, entries, allowed in [('floor', floor, {'clearcoat','clearcoatRoughness'}), ('central', central, {'metalness','roughness'})]:
            values = study[role]['candidate']
            if set(values) != allowed or any(not isinstance(v,(int,float)) or not math.isfinite(v) or not 0 <= v <= 1 for v in values.values()): raise RuntimeError('PBR study scalar whitelist/range differs')
            for source in entries: candidates[source['id']] = (role, values)
        report['pbrStudy284'] = {'inferredNotMeasured': True, 'sourceHash': source_report['sourceHash'], 'sourcePackageUnchanged': True, 'sourceColorsVertexColorsImagesAndAllGeometryHeld': True, 'floorRecords': len(floor), 'floorMeshes': len(floor_meshes), 'centralRecords': 1, 'centralMeshes': 1, 'centralDarkFootprintNote': 'One continuous central material includes original vertex-color dark footprints; no color/vertex-color/geometry edit or extra color-based mask. Other dark-eye/hair, flower, glass and gold material records are not selected.', 'inference': study['inference'], 'records': []}
    def exact_imported_appearance(rec):
        # Only IDs/asset filenames/URIs are excluded. All source names,
        # parameters, color flags, floor phase, hook identity and every actual
        # sampler/image property remain part of this exact equality key.
        value = {k: v for k, v in rec.items() if k not in ('id', 'textures')}
        value['instanceColorShader'] = rec['id'] in instance_colored
        value['textures'] = {}
        for channel, tid in rec['textures'].items():
            tex = textures[tid]; item = {k: v for k, v in tex.items() if k not in ('id', 'file', 'data', 'sourceImageURI')}
            payload = tex.get('file') or tex['data']['file']; item['exactPayloadSha256'] = source_report['exportedAssets'][payload]['sha256']
            if tex.get('data'): item['typedLayout'] = {k: v for k, v in tex['data'].items() if k != 'file'}
            value['textures'][channel] = item
        return json.dumps(value, sort_keys=True, separators=(',', ':'))
    paper_prefix = settings['paper']['materialPrefix']
    for rec in package['materials']:
        if rec.get('type') == 'ShaderMaterial': raise RuntimeError('No silent shader substitution: ' + rec['name'])
        if rec['id'] in candidates:
            role, values = candidates[rec['id']]
            report['pbrStudy284']['records'].append({'id': rec['id'], 'name': rec['name'], 'role': role, 'sourceValues': {k: rec.get(k) for k in values}, 'candidateValues': values, 'originalBaseRoughness': rec.get('roughness'), 'originalLinearColorHeld': rec.get('color'), 'originalVertexColorsHeld': rec.get('vertexColors'), 'originalTextureIdsHeld': rec['textures']})
            rec = {**rec, **values}
        appearance = exact_imported_appearance(rec)
        if appearance in appearances:
            canonical = appearances[appearance]; materials[rec['id']] = materials[canonical]; geometry_materials[rec['id']] = geometry_materials[canonical]; aliases[rec['id']] = canonical
            continue
        mat = bpy.data.materials.new(rec['name'] or rec['id']); mat.use_nodes = True
        nodes = mat.node_tree.nodes; nodes.clear(); links = mat.node_tree.links
        bs = nodes.new('ShaderNodeBsdfPrincipled'); out = nodes.new('ShaderNodeOutputMaterial')
        color = tuple(rec.get('color') or [.5, .5, .5]) + (1,)
        for names, value in [(['Base Color'], color), (['Metallic'], scalar(rec, 'metalness', 0)), (['Roughness'], scalar(rec, 'roughness', .5)), (['IOR'], scalar(rec, 'ior', 1.5)), (['Transmission Weight', 'Transmission'], scalar(rec, 'transmission', 0)), (['Coat Weight', 'Clearcoat'], scalar(rec, 'clearcoat', 0)), (['Coat Roughness', 'Clearcoat Roughness'], scalar(rec, 'clearcoatRoughness', .15)), (['Specular IOR Level'], .5*scalar(rec, 'specularIntensity', 1))]: set_value(bs, names, value, True)
        if rec.get('specularColor') is not None: set_value(bs, ['Specular Tint'], (*rec['specularColor'], 1), True)
        if scalar(rec, 'sheen', 0) > 0:
            set_value(bs, ['Sheen Weight', 'Sheen'], rec['sheen'], True); set_value(bs, ['Sheen Roughness'], scalar(rec, 'sheenRoughness', 1), True)
            set_value(bs, ['Sheen Tint'], (*(rec.get('sheenColor') or [1, 1, 1]), 1), True)
        if scalar(rec, 'anisotropy', 0) != 0:
            set_value(bs, ['Anisotropic IOR Level', 'Anisotropic'], rec['anisotropy'], True); set_value(bs, ['Anisotropic Rotation'], scalar(rec, 'anisotropyRotation', 0)/(2*math.pi), True)
        tex_nodes = {}
        for channel, tid in rec['textures'].items():
            # The actual texture flag is authoritative even when one image
            # is shared by map and bumpMap (timber228 does exactly that).
            tex = textures[tid]; space = 'sRGB' if tex.get('colorSpace') == 'srgb' else 'Non-Color'
            asset = tex.get('file') or tex['data']['file']; digest = source_report['exportedAssets'][asset]['sha256']; key = (digest, space, tex['width'], tex['height'], tex.get('storage','png'))
            if key not in images:
                if hashlib.sha256((root/'assets'/asset).read_bytes()).hexdigest()!=digest: raise RuntimeError('Original PBR image changed before import: '+asset)
                if tex.get('storage') == 'typed-data':
                    data = tex['data']; dtype = '<f4' if data['type']=='Float32Array' else '<f2' if data['type']=='Uint16Array' and tex.get('type')==1016 else None
                    if dtype is None: raise RuntimeError('Unreviewed exact source texture storage type')
                    pixels = np.fromfile(root/'assets'/data['file'], dtype=dtype)
                    if len(pixels) != data['count']: raise RuntimeError('Typed source texture truncated')
                    if int(tex['channels']) not in (3,4): raise RuntimeError('A non-RGB typed texture needs a reviewed exact format swizzle')
                    pixels = pixels.reshape(-1, int(tex['channels'])); rgba = np.ones((len(pixels), 4), np.float32); rgba[:, :pixels.shape[1]] = pixels
                    # Blender image pixel row zero is the opposite bitmap convention.
                    rgba = rgba.reshape(tex['height'], tex['width'], 4)[::-1].copy()
                    image = bpy.data.images.new(asset, width=tex['width'], height=tex['height'], alpha=True, float_buffer=True); image.colorspace_settings.name = space; image.pixels.foreach_set(rgba.ravel())
                else:
                    image = bpy.data.images.load(str(root/'assets'/asset), check_existing=False); image.colorspace_settings.name = space
                images[key] = image
            tn = nodes.new('ShaderNodeTexImage'); tn.image = images[key]; tn.extension = 'REPEAT'; tn.interpolation = 'Closest' if tex.get('magFilter') == 1003 else 'Linear'
            links.new(uv_socket(nodes, links, tex), tn.inputs['Vector']); tex_nodes[channel] = tn
        base = multiply_color(nodes, links, tex_nodes['map'].outputs['Color'], color) if 'map' in tex_nodes else None
        vertex_alpha = None
        if rec.get('vertexColors'):
            attr = nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'sourceColor'; vertex_alpha = attr.outputs['Alpha']; base = multiply_color(nodes, links, attr.outputs['Color'], base or color)
        if rec['id'] in instance_colored:
            attr = nodes.new('ShaderNodeAttribute'); attr.attribute_name = 'instanceColor'; attr.attribute_type = 'INSTANCER'; base = multiply_color(nodes, links, attr.outputs['Color'], base or color)
        if base: links.new(base, bs.inputs['Base Color'])
        normal_socket = None
        if 'normalMap' in tex_nodes:
            subtract = nodes.new('ShaderNodeVectorMath'); subtract.operation = 'SUBTRACT'; subtract.inputs[1].default_value = (.5, .5, .5); links.new(tex_nodes['normalMap'].outputs['Color'], subtract.inputs[0])
            scale = nodes.new('ShaderNodeVectorMath'); scale.operation = 'MULTIPLY'; ns = rec.get('normalScale') or [1, 1]; scale.inputs[1].default_value = (ns[0], ns[1], 1); links.new(subtract.outputs[0], scale.inputs[0])
            add = nodes.new('ShaderNodeVectorMath'); add.operation = 'ADD'; add.inputs[1].default_value = (.5, .5, .5); links.new(scale.outputs[0], add.inputs[0]); nm = nodes.new('ShaderNodeNormalMap'); nm.space = 'OBJECT' if rec.get('normalMapType') == 1 else 'TANGENT'; nm.uv_map = 'sourceUV' if not textures[rec['textures']['normalMap']].get('uvChannel') else 'sourceUV'+str(textures[rec['textures']['normalMap']]['uvChannel']); links.new(add.outputs[0], nm.inputs['Color']); normal_socket = nm.outputs['Normal']
        elif 'bumpMap' in tex_nodes:
            bump = nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 1; bump.inputs['Distance'].default_value = abs(scalar(rec, 'bumpScale', .003)); bump.invert = scalar(rec, 'bumpScale', .003) < 0; links.new(tex_nodes['bumpMap'].outputs['Color'], bump.inputs['Height']); normal_socket = bump.outputs['Normal']
        if rec.get('nativeFloorVarnish'):
            phase = rec.get('nativeFloorPanelPhase')
            if phase is None or not math.isfinite(phase): raise RuntimeError('Actual floor varnish phase was not captured: '+rec['name'])
            normal_socket = varnish_normal(nodes, links, phase, normal_socket); set_value(bs, ['Coat Weight', 'Clearcoat'], scalar(rec, 'clearcoat', 0), True)
            if 'Coat Normal' not in bs.inputs: raise RuntimeError('Installed coat normal input absent')
            links.new(normal_socket, bs.inputs['Coat Normal']); adaptations.append({'material': rec['name'], 'kind': 'floor-physical-varnish', 'phase': phase, 'originalCoat': records[rec['id']].get('clearcoat'), 'originalCoatRoughness': records[rec['id']].get('clearcoatRoughness'), 'captureImageUsed': False, 'derivativeAAIsNotPixelEquivalent': True})
        if normal_socket: links.new(normal_socket, bs.inputs['Normal'])
        for channel, target, component, factor in [('roughnessMap', 'Roughness', 'Green', scalar(rec, 'roughness', .5)), ('metalnessMap', 'Metallic', 'Blue', scalar(rec, 'metalness', 0)), ('clearcoatMap', 'Coat Weight', 'Red', scalar(rec, 'clearcoat', 0)), ('clearcoatRoughnessMap', 'Coat Roughness', 'Green', scalar(rec, 'clearcoatRoughness', .15)), ('transmissionMap', 'Transmission Weight', 'Red', scalar(rec, 'transmission', 0))]:
            if channel in tex_nodes:
                sep = nodes.new('ShaderNodeSeparateColor'); sep.mode = 'RGB'; links.new(tex_nodes[channel].outputs['Color'], sep.inputs[0]); links.new(math_socket(nodes, links, 'MULTIPLY', sep.outputs[component], factor), bs.inputs[target])
        supported = {'map', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap', 'clearcoatMap', 'clearcoatRoughnessMap', 'transmissionMap', 'alphaMap', 'emissiveMap', 'aoMap', 'lightMap'}
        unexpected = set(tex_nodes)-supported
        if unexpected: raise RuntimeError('A used physical map needs explicit reviewed port: '+rec['name']+'/'+','.join(unexpected))
        if 'aoMap' in tex_nodes or 'lightMap' in tex_nodes: adaptations.append({'material': rec['name'], 'kind': 'baked-light-proxy-not-multiplied-into-GI', 'channels': sorted(set(tex_nodes)&{'aoMap', 'lightMap'})})
        surface = bs.outputs[0]
        paper = rec['name'].startswith(paper_prefix)
        practical = rec['name'] in {'restoration-lantern-warm-paper', 'restoration-hanging-lantern-paper', 'restoration-stone-lantern-paper'}
        if paper:
            set_value(bs, ['Emission Strength'], 0, True)
            diffuse = nodes.new('ShaderNodeBsdfDiffuse'); translucent = nodes.new('ShaderNodeBsdfTranslucent')
            for node in (diffuse, translucent):
                if base: links.new(base, node.inputs['Color'])
                else: node.inputs['Color'].default_value = color
            mix = nodes.new('ShaderNodeMixShader'); mix.inputs[0].default_value = settings['paper']['translucentMix']; links.new(diffuse.outputs[0], mix.inputs[1]); links.new(translucent.outputs[0], mix.inputs[2])
            geo = nodes.new('ShaderNodeNewGeometry'); transparent = nodes.new('ShaderNodeBsdfTransparent'); thin = nodes.new('ShaderNodeMixShader'); links.new(geo.outputs['Backfacing'], thin.inputs[0]); links.new(mix.outputs[0], thin.inputs[1]); links.new(transparent.outputs[0], thin.inputs[2]); surface = thin.outputs[0]
            adaptations.append({'material': rec['name'], 'kind': 'paper234-energy-conserving-single-thin-sheet', 'translucentMix': settings['paper']['translucentMix'], 'originalEmissionReplaced': True, 'geometryAndClearSlotsHeld': True, 'mixNotMeasured': True})
        else:
            emission = tuple(rec.get('emissive') or [0, 0, 0])+(1,); source_strength = scalar(rec, 'emissiveIntensity', 1)*settings['lighting']['relativeSceneUnitScale']
            if practical:
                if 'emissiveMap' in tex_nodes: raise RuntimeError('Practical flux/area normalization needs an area-weighted textured-emission adapter')
                attr = nodes.new('ShaderNodeAttribute'); attr.attribute_name = 'physical252_emissionRGB'; attr.attribute_type = 'INSTANCER'
                geo = nodes.new('ShaderNodeNewGeometry'); back = nodes.new('ShaderNodeAttribute'); back.attribute_name = 'physical252_emitBack'; back.attribute_type = 'INSTANCER'
                allowed = math_socket(nodes, links, 'SUBTRACT', 1, math_socket(nodes, links, 'MULTIPLY', geo.outputs['Backfacing'], math_socket(nodes, links, 'SUBTRACT', 1, back.outputs['Fac'])))
                em = nodes.new('ShaderNodeEmission'); links.new(attr.outputs['Color'], em.inputs['Color']); links.new(allowed, em.inputs['Strength']); add = nodes.new('ShaderNodeAddShader'); links.new(surface, add.inputs[0]); links.new(em.outputs[0], add.inputs[1]); surface = add.outputs[0]
                set_value(bs, ['Emission Strength'], 0, True)
            else:
                set_value(bs, ['Emission Strength'], source_strength, True)
                if 'emissiveMap' in tex_nodes: emission = multiply_color(nodes, links, tex_nodes['emissiveMap'].outputs['Color'], emission)
                if isinstance(emission, tuple): set_value(bs, ['Emission Color', 'Emission'], emission, True)
                else:
                    for name in ('Emission Color', 'Emission'):
                        if name in bs.inputs: links.new(emission, bs.inputs[name]); break
        if not paper:
            alpha = scalar(rec, 'opacity', 1) if rec.get('transparent') else 1
            if vertex_alpha is not None and (rec.get('transparent') or scalar(rec,'alphaTest',0)>0): alpha=math_socket(nodes,links,'MULTIPLY',alpha,vertex_alpha)
            if 'map' in tex_nodes and (rec.get('transparent') or scalar(rec, 'alphaTest', 0) > 0): alpha = math_socket(nodes, links, 'MULTIPLY', alpha, tex_nodes['map'].outputs['Alpha'])
            if 'alphaMap' in tex_nodes:
                sep = nodes.new('ShaderNodeSeparateColor'); links.new(tex_nodes['alphaMap'].outputs['Color'], sep.inputs[0]); alpha = math_socket(nodes, links, 'MULTIPLY', alpha, sep.outputs['Green'])
            if scalar(rec, 'alphaTest', 0) > 0: alpha = math_socket(nodes, links, 'GREATER_THAN', alpha, rec['alphaTest'])
            if not isinstance(alpha, (int, float)) or alpha < 1:
                trans = nodes.new('ShaderNodeBsdfTransparent'); mix = nodes.new('ShaderNodeMixShader')
                if isinstance(alpha, (int, float)): mix.inputs[0].default_value = alpha
                else: links.new(alpha, mix.inputs[0])
                links.new(trans.outputs[0], mix.inputs[1]); links.new(surface, mix.inputs[2]); surface = mix.outputs[0]
            side = rec.get('side', 0)
            if side in (0, 1):
                geo = nodes.new('ShaderNodeNewGeometry'); trans = nodes.new('ShaderNodeBsdfTransparent'); mix = nodes.new('ShaderNodeMixShader'); links.new(geo.outputs['Backfacing'], mix.inputs[0]); links.new(surface if side == 0 else trans.outputs[0], mix.inputs[1]); links.new(trans.outputs[0] if side == 0 else surface, mix.inputs[2]); surface = mix.outputs[0]
        links.new(surface, out.inputs['Surface']); materials[rec['id']] = mat
        copy = mat.copy(); copy.name = mat.name+' [direct/affine attribute domain]'
        for node in copy.node_tree.nodes:
            if node.type == 'ATTRIBUTE' and node.attribute_name in {'instanceColor', 'physical252_emissionRGB', 'physical252_emitBack'}: node.attribute_type = 'GEOMETRY'
        geometry_materials[rec['id']] = copy
        appearances[appearance] = rec['id']; aliases[rec['id']] = rec['id']
    for row in report.get('pbrStudy284', {}).get('records', []):
        node = next(n for n in materials[row['id']].node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        sockets = {'metalness': 'Metallic', 'roughness': 'Roughness', 'clearcoat': 'Coat Weight', 'clearcoatRoughness': 'Coat Roughness'}
        row['actualRNADefaults'] = {k: float(node.inputs[sockets[k]].default_value) for k in row['candidateValues']}
        row['actualMapInputLinked'] = {k: bool(node.inputs[sockets[k]].is_linked) for k in row['candidateValues']}
        if any(abs(row['actualRNADefaults'][k]-v) > 1e-6 for k, v in row['candidateValues'].items()): raise RuntimeError('Actual installed PBR study scalar differs')
    report['materialAdapter252'] = {'materials': len(materials), 'uniqueExactImportedAppearances': len(appearances), 'sourceMaterialAliases': [{'sourceId': rec['id'], 'sourceName': rec['name'], 'canonicalId': aliases[rec['id']]} for rec in package['materials']], 'uniqueDecodedImagesByHashAndColorSpace': len(images), 'adaptations': adaptations, 'normalMapHasNativePriorityOverBumpMap': True, 'sourceFactorsNotNormalizedOrDoubleTinted': True, 'originalImagesNotResized': True, 'sameUVTransformAndWrappingMetadata': True, 'nativePixelEquivalence': False, 'remainingNativeHookInventory':[{'material':r['name'],'hookId':r.get('nativeShaderHookId'),'floorPorted':bool(r.get('nativeFloorVarnish'))} for r in package['materials']], 'remainingHooksNotAutomaticallyClaimedPortable':True}
    return materials, geometry_materials
