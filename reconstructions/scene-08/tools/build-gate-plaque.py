"""One hand-drawn closed cast plaque for the existing left inner gate column.

Build only, no render. Run through tools/run-blender-queued.mjs. The supplied
photograph is observed outside Blender; no image, grayscale or depth is read.
Artist axes are X=width, Y=height, Z=front; the root converts to Blender Z-up.
"""
import hashlib
import json
import math
import os
import shutil
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
VERSION = os.environ.get('GATE_PLAQUE_VERSION', 'v01')
OUT = ROOT / 'assets' / ('gate-plaque-' + VERSION)
W, H, BACK, FRONT = .42, .58, -.012, -.004

# Normalized control points authored while viewing the visible silhouette and
# large curls of HD7. The photo does not resolve individual veins or fasteners.
OUTLINE = [
 [[0,.50],[-.065,.486],[-.08,.455],[-.13,.445]],
 [[-.13,.445],[-.22,.479],[-.27,.440],[-.29,.409]],
 [[-.29,.409],[-.39,.442],[-.46,.402],[-.43,.358]],
 [[-.43,.358],[-.52,.376],[-.52,.306],[-.445,.277]],
 [[-.445,.277],[-.453,.150],[-.453,-.133],[-.442,-.273]],
 [[-.442,-.273],[-.51,-.311],[-.50,-.369],[-.416,-.366]],
 [[-.416,-.366],[-.34,-.432],[-.25,-.397],[-.16,-.435]],
 [[-.16,-.435],[-.11,-.465],[-.06,-.487],[0,-.50]],
]
OUTLINE += [[[-p[0],p[1]] for p in reversed(segment)] for segment in reversed(OUTLINE)]

SCROLLS = [
 ('left_rising_fold', [
  [[0,-.20],[-.22,-.20],[-.30,-.03],[-.25,.07]],
  [[-.25,.07],[-.21,.18],[-.07,.14],[-.07,.04]],
  [[-.07,.04],[-.08,-.02],[-.18,-.01],[-.15,.05]]], .014, .006),
 ('right_descending_fold', [
  [[0,.24],[.20,.20],[.29,.07],[.24,-.05]],
  [[.24,-.05],[.20,-.18],[.06,-.14],[.07,-.04]],
  [[.07,-.04],[.08,.02],[.18,0],[.15,-.05]]], .013, .0065),
 ('central_turning_stem', [[[0,-.34],[-.065,-.10],[.075,.13],[0,.35]]], .011, .005),
]
LEAVES = [
 ('upper_left_lobed', [[0,.19],[-.07,.21],[-.22,.27],[-.29,.34]], .046,.0085,3),
 ('upper_right_rolled', [[.01,.17],[.16,.18],[.23,.26],[.29,.33]], .046,.0100,3),
 ('lower_left_rolled', [[-.015,-.17],[-.14,-.21],[-.25,-.26],[-.28,-.34]], .050,.0090,3),
 ('lower_right_lobed', [[0,-.20],[.10,-.20],[.24,-.29],[.29,-.34]], .048,.0080,3),
 ('central_left_broad', [[.025,-.07],[-.12,-.08],[-.25,.02],[-.23,.12]], .079,.0110,3),
 ('central_right_broad', [[-.01,.10],[.14,.10],[.25,.005],[.22,-.12]], .076,.0115,3),
 ('flower_fold_up_left', [[0,-.015],[-.07,.005],[-.10,.085],[-.05,.135]], .034,.0120,1),
 ('flower_fold_up_right', [[0,-.015],[.055,.01],[.09,.08],[.055,.115]], .034,.0125,1),
 ('flower_fold_down', [[0,.025],[.075,-.015],[.07,-.07],[.015,-.105]], .037,.0110,1),
 ('flower_lateral_left', [[-.015,.01],[-.075,.025],[-.13,.07],[-.115,.11]], .030,.0105,1),
 ('flower_lateral_right', [[.015,-.005],[.085,-.025],[.13,-.065],[.095,-.105]], .032,.0110,1),
 ('upper_inner_lancet', [[-.015,.24],[-.08,.30],[-.16,.35],[-.19,.405]], .036,.0080,2),
 ('lower_inner_lancet', [[.015,-.24],[.075,-.30],[.15,-.35],[.18,-.407]], .035,.0080,2),
 ('top_crown', [[0,.365],[-.02,.406],[.005,.452],[0,.477]], .039,.0070,1),
 ('bottom_crown', [[0,-.355],[.02,-.398],[-.005,-.450],[0,-.478]], .040,.0075,1),
 ('top_left_shoulder', [[-.27,.34],[-.31,.365],[-.38,.403],[-.41,.388]], .041,.0060,1),
 ('top_right_shoulder', [[.27,.34],[.33,.367],[.38,.405],[.42,.385]], .040,.0065,1),
 ('bottom_left_shoulder', [[-.27,-.325],[-.31,-.36],[-.37,-.391],[-.41,-.353]], .042,.0060,1),
 ('bottom_right_shoulder', [[.27,-.325],[.32,-.365],[.38,-.389],[.414,-.35]], .043,.0065,1),
]
FASTENERS = [(-.355,.305),(.355,.305),(-.355,-.305),(.355,-.305)]


def linear(hex_color):
    v=[int(hex_color[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)


def material(name,color,roughness,metalness):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=linear(color)
    p.inputs['Metallic'].default_value=metalness;p.inputs['Roughness'].default_value=roughness
    return m


def mesh(name,vertices,faces,collection,mat):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces);bm.to_mesh(data);bm.free()
    o=bpy.data.objects.new(name,data);collection.objects.link(o);data.materials.append(mat)
    return o


def cubic(segment,t):
    a,b,c,d=[Vector((p[0]*W,p[1]*H)) for p in segment]
    return a*(1-t)**3+3*b*(1-t)**2*t+3*c*(1-t)*t*t+d*t**3


def sample(segments,n=24,closed=False):
    result=[]
    for segment in segments:
        for j in range(n):result.append(cubic(segment,j/n))
    if not closed:result.append(cubic(segments[-1],1))
    return result


def source_curve(name,segments,collection,root):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D'
    spline=c.splines.new('BEZIER');spline.bezier_points.add(len(segments))
    for i,segment in enumerate(segments):
        p=spline.bezier_points[i];p.co=(segment[0][0]*W,segment[0][1]*H,FRONT)
        p.handle_right_type=p.handle_left_type='FREE';p.handle_right=(segment[1][0]*W,segment[1][1]*H,FRONT)
        if i:p.handle_left=(segments[i-1][2][0]*W,segments[i-1][2][1]*H,FRONT)
    p=spline.bezier_points[-1];p.co=(segments[-1][-1][0]*W,segments[-1][-1][1]*H,FRONT)
    p.handle_left_type='FREE';p.handle_left=(segments[-1][2][0]*W,segments[-1][2][1]*H,FRONT)
    o=bpy.data.objects.new(name,c);collection.objects.link(o);o.parent=root
    return o


def extrude(name,outline,front,back,collection,mat):
    n=len(outline);vertices=[(p.x,p.y,z) for z in (back,front) for p in outline]
    faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    return mesh(name,vertices,faces,collection,mat)


def raised_band(name,outline,collection,mat):
    n=len(outline);vertices=[]
    for z in (FRONT-.0008,FRONT+.0026):
        for f in (.966,.928):vertices += [(p.x*f,p.y*f,z) for p in outline]
    faces=[]
    for i in range(n):
        j=(i+1)%n
        faces += [(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),
                  (i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)]
    return mesh(name,vertices,faces,collection,mat)


def relief(name,segments,width,height,lobes,collection,mat,leaf=True):
    points=sample(segments,30 if leaf else 28);N=len(points);M=25 if leaf else 9;vertices=[]
    for lower in (False,True):
        for i,p in enumerate(points):
            t=i/(N-1);tangent=(points[min(N-1,i+1)]-points[max(0,i-1)]).normalized();normal=Vector((-tangent.y,tangent.x))
            w=width*.5*(max(.018,math.sin(math.pi*t))**.73 if leaf else .48+.52*math.sin(math.pi*t))
            if leaf:w*=1+.19*math.sin(lobes*math.pi*t)**2
            for j in range(M):
                u=-1+2*j/(M-1);q=p+normal*w*u
                dome=height*max(0,math.sin(math.pi*t))**.55*max(0,1-u*u)**.68
                if leaf and any(word in name for word in ['broad','lobed','rolled']):
                    centre=.12*math.sin(2*math.pi*t);fold=max(0.,1-abs(u-centre)/.15)**2
                    dome-=min(.0025,height*.23)*math.sin(math.pi*t)**.7*fold
                z=FRONT-.0008 if lower else FRONT+.00045+dome
                vertices.append((q.x,q.y,z))
    faces=[];offset=N*M
    for i in range(N-1):
        for j in range(M-1):
            a=i*M+j;b=a+1;c=a+M;d=c+1
            faces += [(a,b,d,c),(offset+a,offset+c,offset+d,offset+b)]
        a=i*M;b=(i+1)*M;faces.append((a,b,offset+b,offset+a))
        a=i*M+M-1;b=(i+1)*M+M-1;faces.append((a,offset+a,offset+b,b))
    for j in range(M-1):
        a=j;b=j+1;faces.append((a,offset+a,offset+b,b))
        a=(N-1)*M+j;b=a+1;faces.append((a,b,offset+b,offset+a))
    return mesh(name,vertices,faces,collection,mat)


def bevel(obj,width,segments=3,apply=True):
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    m=obj.modifiers.new('Small physical cast edge easing','BEVEL');m.width=width;m.segments=segments;m.limit_method='ANGLE';m.angle_limit=.5
    if apply:bpy.ops.object.modifier_apply(modifier=m.name)
    obj.select_set(False)


def boolean(obj,operand,operation):
    bpy.context.view_layer.update()
    bpy.context.view_layer.objects.active=obj;obj.select_set(True)
    m=obj.modifiers.new(operation+' actual metal solids','BOOLEAN');m.operation=operation;m.solver='EXACT';m.object=operand
    bpy.ops.object.modifier_apply(modifier=m.name);obj.select_set(False)


def audit(obj):
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
    result={'name':obj.name,'vertices':len(bm.verts),'triangles':sum(len(f.verts)-2 for f in bm.faces),
            'boundaryEdges':sum(e.is_boundary for e in bm.edges),'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges),
            'signedVolumeM3':bm.calc_volume(signed=True)}
    bm.to_mesh(obj.data);bm.free()
    if result['nonmanifoldEdges'] or result['signedVolumeM3']<=0:raise RuntimeError(json.dumps(result))
    return result


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.context.scene.unit_settings.system='METRIC'
    root=bpy.data.objects.new('Artist_Xwidth_Yheight_Zfront_to_Blender_Zup',None);bpy.context.scene.collection.objects.link(root);root.rotation_euler.x=math.pi/2
    source=bpy.data.collections.new('EDITABLE_SOURCE_SOLIDS');curves=bpy.data.collections.new('EDITABLE_HAND_DRAWN_CURVES');final=bpy.data.collections.new('FINAL_CLOSED_CAST_AND_FASTENERS')
    for c in (source,curves,final):bpy.context.scene.collection.children.link(c)
    bronze=material('gate08_cast_gilded_bronze','c29b4b',.35,.90);rivet_mat=material('gate08_worn_brass_fasteners','b48a42',.39,.88)
    outline=sample(OUTLINE,10,True)
    base=extrude('SOURCE_eight_mm_floral_escutcheon',outline,FRONT,BACK,source,bronze);bevel(base,.00085)
    parts=[raised_band('SOURCE_narrow_contour_fillet',outline,source,bronze)]
    for name,segments,width,height in SCROLLS:
        parts.append(relief('SOURCE_'+name,segments,width,height,1,source,bronze,False));source_curve('CURVE_'+name,segments,curves,root)
    for name,segment,width,height,lobes in LEAVES:
        parts.append(relief('SOURCE_'+name,[segment],width,height,lobes,source,bronze));source_curve('CURVE_'+name,[segment],curves,root)
    source_curve('CURVE_visible_photo_led_outer_silhouette',OUTLINE,curves,root)
    cast=base.copy();cast.data=base.data.copy();cast.name='gate08_single_cast_floral_plaque';final.objects.link(cast)
    # Union the already closed, hand-authored source solids in volume space.
    # This resolves sub-millimetre overlaps without a photograph height field.
    bpy.ops.object.select_all(action='DESELECT');cast.select_set(True)
    for obj in parts:
        duplicate=obj.copy();duplicate.data=obj.data.copy();final.objects.link(duplicate);duplicate.select_set(True)
    bpy.context.view_layer.objects.active=cast;bpy.ops.object.join()
    cast.data.remesh_voxel_size=.0007
    if hasattr(cast.data,'use_remesh_preserve_volume'):cast.data.use_remesh_preserve_volume=True
    bpy.ops.object.voxel_remesh()
    dense_union=audit(cast)
    fasteners=[];cutters=[]
    for i,(x,y) in enumerate(FASTENERS):
        # Inferred small fixing bores, with a shallow countersink. They have
        # real inner walls; separate domed heads are closed solids.
        bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.0042,depth=.06,location=(x*W,y*H,-.004));c=bpy.context.object;c.name='SOURCE_fixing_bore_'+str(i)
        for col in list(c.users_collection):col.objects.unlink(c)
        source.objects.link(c);boolean(cast,c,'DIFFERENCE');cutters.append(c)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=(x*W,y*H,FRONT+.0018));head=bpy.context.object;head.name='gate08_small_domed_fixing_'+str(i);head.scale=(.0075,.0075,.0036)
        bpy.context.view_layer.objects.active=head;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        for col in list(head.users_collection):col.objects.unlink(head)
        final.objects.link(head);head.data.materials.append(rivet_mat);fasteners.append(head)
    dense_after_holes=audit(cast)
    if dense_after_holes['triangles']>90000:
        bpy.context.view_layer.objects.active=cast;cast.select_set(True)
        reduce=cast.modifiers.new('Curvature-preserving portable cast','DECIMATE');reduce.ratio=90000/dense_after_holes['triangles'];reduce.use_collapse_triangulate=True
        bpy.ops.object.modifier_apply(modifier=reduce.name);cast.select_set(False)
    for p in cast.data.polygons:p.use_smooth=True
    normal=cast.modifiers.new('Preserve broad cast planes','WEIGHTED_NORMAL');normal.keep_sharp=True
    bpy.context.view_layer.objects.active=cast;bpy.ops.object.modifier_apply(modifier=normal.name)
    records=[audit(o) for o in [cast]+fasteners]
    if min(v.co.z for v in cast.data.vertices)>BACK+.00001:raise RuntimeError('Cast backplate missing')
    for obj in list(source.objects)+[cast]+fasteners:obj.parent=root
    bpy.context.view_layer.update()
    source.hide_render=True;source.hide_viewport=True;curves.hide_render=True;curves.hide_viewport=True
    OUT.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(Path(__file__),OUT/'build-source.py')
    vectors={'outlineNormalizedBezier':OUTLINE,'scrolls':SCROLLS,'leaves':LEAVES,'fastenersNormalizedInferred':FASTENERS}
    (OUT/'hand-drawn-vectors.json').write_text(json.dumps(vectors,indent=2)+'\n')
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for obj in [cast]+fasteners:obj.select_set(True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'gate-plaque.blend'),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/'gate-plaque.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_materials='EXPORT',export_texcoords=False,export_normals=True)
    report={'status':'actual-closed-hand-authored-metal-plate','visualAccepted':False,'blender':bpy.app.version_string,'version':VERSION,
            'physicalWidthHeightM':[W,H],'baseBackFrontM':[BACK,FRONT],'baseThicknessM':FRONT-BACK,
            'reliefHeightM':[.003,.0125],'closedUnionPitchM':.0007,'leafFoldCutsM':{'widthApprox':.006,'depthUpTo':.0025,'actualTopVertices':True},'denseUnionAudit':dense_union,'denseAfterBoresAudit':dense_after_holes,'prototypeParts':records,'triangles':sum(x['triangles'] for x in records),
            'onlySceneInstance':{'position':[-1.983,3.30,7.9],'rotationYRadians':math.pi/2},
            'reference':{'file':'references/hd/7-照片-8.jpg','comparisonCropXYWH':[120,594,57,194],
                         'observed':'Pointed top/bottom floral escutcheon; rolled shoulders; broad connected leaf-scroll/flower masses, rather than a radial wheel.',
                         'inferred':'Hidden depth, precise folds/veins and small fixing positions are artistic hypotheses at the supplied photo resolution.'},
            'policy':{'photoPixelsInGeometry':False,'photoRGBInMaterial':False,'heightImageRead':False,'externalPatternImported':False,
                      'methodReference':'scene03 closed-solid authoring/audit practice only; no scene03 pattern, guide or geometry imported'},
            'limits':['Hand-drawn interpretation of visible large shapes, not a measured historic ornament.','Reference photograph copyright remains with its owner.','Closed volume and correct loading do not establish photographic fidelity.']}
    for filename in ['gate-plaque.blend','gate-plaque.glb','hand-drawn-vectors.json','build-source.py']:report[filename+'Sha256']=hashlib.sha256((OUT/filename).read_bytes()).hexdigest()
    (OUT/'build-report.json').write_text(json.dumps(report,indent=2)+'\n')
    print('ONE_GATE_PLAQUE_BUILT',json.dumps(report),flush=True)


if __name__=='__main__':main()
