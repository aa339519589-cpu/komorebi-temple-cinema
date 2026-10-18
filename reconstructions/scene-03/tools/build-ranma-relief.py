"""Build one editable, closed gilt ranma module from an approved height study.

Run with Blender, passing an actual supplied guide after ``--``. This script
does not render. A guide supplies scalar heights and carved outlines only;
the export has independent uniform metal/wood PBR materials and no image.

  Blender --background --python-exit-code 1 --python build-ranma-relief.py -- --guide /real/file.png

The generated study is an artistic height hypothesis, not measured depth or
recovered historic carving. Reference photographs remain comparison inputs.
"""
import argparse
import hashlib
import json
import math
import shutil
import sys
from collections import Counter
from pathlib import Path

import bmesh
import bpy
import numpy as np


def options():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--guide', type=Path, required=True)
    parser.add_argument('--guide-origin', default='root-supplied imagegen height study')
    parser.add_argument('--width', type=float, default=1.30)
    parser.add_argument('--height', type=float, default=.27)
    parser.add_argument('--relief', type=float, default=.026)
    parser.add_argument('--columns', type=int, default=193)
    parser.add_argument('--cutoff', type=float, default=.20)
    parser.add_argument('--out', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/ranma-frieze-v01')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


def linear(hex_color):
    values = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values) + (1,)


def material(name, color, roughness, metallic=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Base Color'].default_value = linear(color)
    principled.inputs['Roughness'].default_value = roughness
    principled.inputs['Metallic'].default_value = metallic
    return mat


def mesh_object(collection, name, verts, faces, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    mesh.materials.append(mat)
    return obj


def apply_bevel(obj, width, weights=None):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bevel = obj.modifiers.new('Editable carved edge easing', 'BEVEL')
    bevel.width = width
    bevel.segments = 2
    bevel.affect = 'EDGES'
    if weights is not None:
        attribute = obj.data.attributes.new('bevel_weight_edge', 'FLOAT', 'EDGE')
        for edge in obj.data.edges:
            attribute.data[edge.index].value = 1 if tuple(sorted(edge.vertices)) in weights else 0
        bevel.limit_method = 'WEIGHT'
    else:
        bevel.limit_method = 'ANGLE'
        bevel.angle_limit = .50
    # Keep the modifier editable in the .blend; the GLB exporter evaluates it.
    obj.select_set(False)


def box(collection, name, width, height, front, back, mat, bevel):
    verts = [(sx * width / 2, y, sz * height / 2)
             for y in (front, back) for sz in (-1, 1) for sx in (-1, 1)]
    faces = [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4),
             (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)]
    obj = mesh_object(collection, name, verts, faces, mat)
    apply_bevel(obj, bevel)
    normals = obj.modifiers.new('Broad field weighted normals', 'WEIGHTED_NORMAL')
    normals.keep_sharp = True
    return obj


def guide_heights(path, columns, rows, cutoff):
    guide = bpy.data.images.load(str(path), check_existing=False)
    guide.colorspace_settings.name = 'Non-Color'
    width, height = guide.size[:]
    rgba = np.asarray(guide.pixels[:], dtype=np.float32).reshape(height, width, 4)
    # Luminance is read as numeric sculpture data. Never link this image to a
    # shader, create a plane from its RGB, or export a guide texture.
    gray = rgba[:, :, :3].mean(axis=2)
    hits = gray > max(cutoff + .08, .20)
    occupied_rows = np.flatnonzero(hits.sum(axis=1) > width * .015)
    occupied_cols = np.flatnonzero(hits.sum(axis=0) > height * .015)
    if not len(occupied_rows) or not len(occupied_cols):
        raise RuntimeError('The actual guide has no usable positive relief field')
    x0, x1 = max(0, occupied_cols[0] - 5), min(width, occupied_cols[-1] + 6)
    y0, y1 = max(0, occupied_rows[0] - 5), min(height, occupied_rows[-1] + 6)
    cropped = gray[y0:y1, x0:x1].copy()
    # Light filtering removes isolated raster specks without flattening leaf
    # lobes. Edge padding is constant, so no wrap-around seam is introduced.
    for _ in range(2):
        q = np.pad(cropped, 1, mode='edge')
        cropped = (4 * q[1:-1, 1:-1] + q[:-2, 1:-1] + q[2:, 1:-1]
                   + q[1:-1, :-2] + q[1:-1, 2:]) / 8
    yy, xx = np.meshgrid(np.linspace(0, cropped.shape[0] - 1, rows),
                         np.linspace(0, cropped.shape[1] - 1, columns), indexing='ij')
    iy, ix = np.floor(yy).astype(int), np.floor(xx).astype(int)
    jy, jx = np.minimum(iy + 1, cropped.shape[0] - 1), np.minimum(ix + 1, cropped.shape[1] - 1)
    fy, fx = yy - iy, xx - ix
    sampled = ((1 - fy) * ((1 - fx) * cropped[iy, ix] + fx * cropped[iy, jx])
               + fy * ((1 - fx) * cropped[jy, ix] + fx * cropped[jy, jx]))
    bpy.data.images.remove(guide)
    return sampled, {'size': [width, height], 'cropBottomLeftXYWH': [int(x0), int(y0), int(x1 - x0), int(y1 - y0)],
                     'sampleGrid': [columns, rows], 'cutoff': cutoff, 'heightOnly': True}


def carved_solid(collection, sampled, width, height, depth, cutoff, mat):
    """Clip a shared triangular height grid, then close every aperture wall.

    Each threshold intersection is shared by its adjacent triangles. This
    produces physical cutouts around leaves and stems instead of a rectangle
    carrying a gold bitmap. Both front and back are real manifold surfaces.
    """
    rows, columns = sampled.shape
    heights = sampled.copy()
    # Smooth only the scalar sculpted volume at the actual sampling pitch.
    # Preserve the separate original cutout contour, so this removes pinched
    # image-scale ridges without filling the physical negative spaces.
    for _ in range(3):
        q = np.pad(heights, 1, mode='edge')
        heights = (4 * q[1:-1, 1:-1] + q[:-2, 1:-1] + q[2:, 1:-1]
                   + q[1:-1, :-2] + q[1:-1, 2:]) / 8
    points = [(i * width / (columns - 1) - width / 2,
               j * height / (rows - 1) - height / 2, float(sampled[j, i]), float(heights[j, i]))
              for j in range(rows) for i in range(columns)]
    verts, front, lookup = [], [], {}

    def index(key, p):
        if key not in lookup:
            level = max(0, min(1, (p[3] - cutoff) / (.92 - cutoff))) ** .85
            rim = max(0, min(1, (p[2] - cutoff) / .12))
            level *= rim * rim * (3 - 2 * rim)
            lookup[key] = len(verts)
            verts.append((p[0], -(.006 + depth * level), p[1]))
        return lookup[key]

    def intersection(a, b):
        # a and b are original grid corners, so the undirected edge key is
        # identical on both sides of a cell diagonal or cell boundary.
        ka, pa = a
        kb, pb = b
        t = (cutoff - pa[2]) / (pb[2] - pa[2])
        p = tuple(pa[k] + t * (pb[k] - pa[k]) for k in range(4))
        return ('edge', min(ka, kb), max(ka, kb)), p

    for j in range(rows - 1):
        for i in range(columns - 1):
            a = j * columns + i
            b, c, d = a + 1, a + columns, a + columns + 1
            for tri in ((a, b, d), (a, d, c)):
                corners = [(k, points[k]) for k in tri]
                clipped = []
                previous = corners[-1]
                for current in corners:
                    was_in, now_in = previous[1][2] >= cutoff, current[1][2] >= cutoff
                    if was_in != now_in:
                        clipped.append(intersection(previous, current))
                    if now_in:
                        clipped.append(current)
                    previous = current
                ids = [index(key, p) for key, p in clipped]
                front.extend((ids[0], ids[k], ids[k + 1]) for k in range(1, len(ids) - 1))

    edge_counts = Counter(tuple(sorted((face[k], face[(k + 1) % 3]))) for face in front for k in range(3))
    boundary = [(face[k], face[(k + 1) % 3]) for face in front for k in range(3)
                if edge_counts[tuple(sorted((face[k], face[(k + 1) % 3])))] == 1]
    count = len(verts)
    verts += [(x, .008, z) for x, y, z in verts]
    faces = front + [tuple(k + count for k in reversed(face)) for face in front]
    faces += [(a, a + count, b + count, b) for a, b in boundary]
    obj = mesh_object(collection, 'ranma_gilt_carved_leaves', verts, faces, mat)
    for poly in obj.data.polygons:
        poly.use_smooth = poly.index < len(front)
    easing = set()
    for a, b in boundary:
        easing.update((tuple(sorted((a, b))), tuple(sorted((a + count, b + count))),
                       tuple(sorted((a, a + count))), tuple(sorted((b, b + count)))))
    apply_bevel(obj, .0008, easing)
    return obj


def audit(obj):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bad_edges = sum(not edge.is_manifold for edge in bm.edges)
    bad_vertices = sum(not vertex.is_manifold for vertex in bm.verts)
    finite = all(math.isfinite(value) for vertex in bm.verts for value in vertex.co)
    triangles = sum(len(face.verts) - 2 for face in bm.faces)
    record = {'name': obj.name, 'vertices': len(bm.verts), 'triangles': triangles,
              'baseTriangles': sum(len(face.vertices) - 2 for face in obj.data.polygons),
              'boundaryOrNonmanifoldEdges': bad_edges, 'nonmanifoldVertices': bad_vertices,
              'closedManifold': not bad_edges and not bad_vertices, 'finite': finite,
              'signedVolumeM3': bm.calc_volume(signed=True)}
    bm.free()
    evaluated.to_mesh_clear()
    if bad_edges or bad_vertices or not finite or record['signedVolumeM3'] <= 0:
        raise RuntimeError('Invalid closed relief: ' + json.dumps(record))
    return record


def main():
    args = options()
    guide_path = args.guide.expanduser().resolve(strict=True)
    if not 0 < args.cutoff < .6 or not 8 <= args.columns <= 385:
        raise ValueError('Invalid scalar sculpture settings')
    if not 0 < args.relief < args.height / 3:
        raise ValueError('Relief depth must stay within the physical beam field')
    rows = max(17, round((args.columns - 1) * args.height / args.width) + 1)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    collection = bpy.data.collections.new('EDITABLE_RANMA_SOLIDS')
    scene.collection.children.link(collection)
    gold = material('ranma_aged_gilt_bronze_uniform_PBR', 'c3a45f', .43, .86)
    wood = material('ranma_separate_deep_wood_field', '29170f', .76)
    sampled, guide_info = guide_heights(guide_path, args.columns, rows, args.cutoff)
    leaf = carved_solid(collection, sampled, args.width, args.height, args.relief, args.cutoff, gold)
    field = box(collection, 'ranma_deep_wood_backplate', args.width + .016, args.height + .016, .006, .033, wood, .002)
    objects = [leaf, field]
    # Keep all sampled heights and editable bevels in Blender. Curvature-aware
    # collapse removes redundant raster tessellation from the evaluated GLB,
    # while retaining the closed back, actual leaf edges and eased apertures.
    dense_record = audit(leaf)
    if dense_record['triangles'] > 32000:
        simplify = leaf.modifiers.new('Curvature-aware portable triangle budget', 'DECIMATE')
        simplify.decimate_type = 'COLLAPSE'
        simplify.ratio = 32000 / dense_record['triangles']
        simplify.use_collapse_triangulate = True
    records = [audit(obj) for obj in objects]
    total = sum(record['triangles'] for record in records)
    if not 8000 <= total <= 40000:
        raise RuntimeError('Module outside 8k–40k triangle budget: ' + json.dumps(records))
    if any(node.type == 'TEX_IMAGE' for mat in bpy.data.materials if mat.use_nodes for node in mat.node_tree.nodes):
        raise RuntimeError('Guide must never enter a visible material graph')
    # Copy only the approved supplied guide. The archive is provenance; glTF
    # has no image URI, image node, sampler, base-color map or displacement map.
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    if guide_path != out / 'source-height-guide.png':
        shutil.copyfile(guide_path, out / 'source-height-guide.png')
    report = {'status': 'actual-closed-mesh-built', 'visualAccepted': False,
              'builder': 'reconstructions/scene-03/tools/build-ranma-relief.py',
              'builderSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'blenderVersion': bpy.app.version_string,
              'guide': {**guide_info, 'origin': args.guide_origin,
                        'sha256': hashlib.sha256(guide_path.read_bytes()).hexdigest(),
                        'role': 'AI-authored non-metric height and aperture guide only; never albedo or scene imagery'},
              'physicalSizeM': [args.width + .016, args.height + .016, args.relief + .039],
              'carvingFaceSizeM': [args.width, args.height],
              'geometricHeightFilter': 'Three grid-pitch diffusion steps, retaining the original aperture mask and rounded cut-edge height falloff',
              'materialPolicy': 'Separate uniform PBR gold and deep wood; no visible image texture',
              'objects': records, 'prototypeTriangles': total,
              'editableDenseCarvingTriangles': dense_record['triangles'],
              'limits': ['Artistic sculptural reconstruction, not measured historic relief.',
                         'Reference photograph copyright retained by its owner.',
                         'This build does not establish visual acceptance of scene03.']}
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / 'ranma-relief.blend'), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(out / 'ranma-relief.glb'), export_format='GLB',
                             use_selection=True, export_yup=True, export_apply=True,
                             export_materials='EXPORT', export_texcoords=False, export_normals=True)
    report['glbSha256'] = hashlib.sha256((out / 'ranma-relief.glb').read_bytes()).hexdigest()
    report['blendSha256'] = hashlib.sha256((out / 'ranma-relief.blend').read_bytes()).hexdigest()
    (out / 'build-report.json').write_text(json.dumps(report, indent=2) + '\n')
    print('RANMA_SOLIDS_BUILT', json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
