"""One exact-source Scene07 physical full/detail review, no canonical edits.
Indexed buffers, all UV/color attributes and affine matrices remain source data.
Metric timber, neutral mineral and foreground glaze shader equations are ported.
"""
import bpy,json,math,os,time,hashlib
from pathlib import Path
import numpy as np
from mathutils import Matrix,Vector
HERE=Path(__file__).resolve().parent
WORK=Path(os.environ.get('SCENE_WORKTREE',str(HERE.parent.parent))).resolve()
ROOT=HERE/'export';OUT=WORK/'qa/ten-reference/07/iteration-scene07-physical155-20261022';OUT.mkdir(parents=True,exist_ok=True)
EXPECTED='f3638c92c8f80d8cee8e40f346d179b4ce24e0211a44b1619ec8c2076ac03281'
D=json.loads((ROOT/'scene.json').read_text());E=json.loads((ROOT/'export-report.json').read_text());SUP=json.loads((HERE/'source-supplement.json').read_text());NATIVE=WORK/'qa/ten-reference/07/iteration-scene07-pierced-gilt154-smooth-forest155-r02-20261021/report.json';NR=json.loads(NATIVE.read_text())
assert E['status']=='exported-existing-geometry' and E['sourceHash']==EXPECTED==SUP['sourceHash']==NR['source']['hash']
assert D['view']['reference']==7 and D['view']['position']==[10.7,12.8,36] and D['view']['fov']==47
H=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
for f,r in E['exportedAssets'].items():assert H(ROOT/'assets'/f)==r['sha256'],f
for f,r in SUP['extraAssets'].items():assert H(WORK/f)==r['sha256']==E['source']['files'][f],f
report={'status':'importing','sourceHash':EXPECTED,'sourceCommit':E['sourceCommit'],'exportSceneSha256':H(ROOT/'scene.json'),'renderScriptSha256':H(__file__),'nativeReport':str(NATIVE),'sourceStatistics':D['statistics'],'excludedNativeShaders':D['excluded'],'blender':bpy.app.version_string,'started':time.time(),'warnings':[],'visualAccepted':False,'nativePixelEquivalence':False,'canonicalEdits':False}
def save_report(): (OUT/'report.json').write_text(json.dumps(report,indent=2))
save_report();bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;bpy.context.preferences.filepaths.save_version=0
DT={'Float32Array':'<f4','Uint32Array':'<u4','Uint16Array':'<u2','Uint8Array':'u1'}
def binary(r,folder=ROOT/'assets'):
 a=np.fromfile(folder/r['file'],dtype=DT[r['type']]);assert len(a)==r['count'],r['file'];return a
TEX={t['id']:dict(t) for t in D['textures']};MR={m['id']:dict(m) for m in D['materials']};MC={};GM={};images={};normal_charts={};imported=0
instanced_ids={mid for m in D['meshes'] if 'instanceColors'in m for mid in m['materials']}
timber_ids={m['id'] for m in D['materials'] if abs(float(m.get('roughness',0))-.9)<1e-6 and all(k in m['textures'] for k in ['map','normalMap','roughnessMap']) and m.get('normalScale')==[.24,.24]}
assert len(timber_ids)==5
for key in ['ceramic-glaze-weight.png','ceramic-glaze-rough.png','ceramic-micro-normal-gl.png']:
 f='reconstructions/scene-07/assets/near-gallery149/'+key;TEX['source:'+key]={'id':'source:'+key,'sourcePath':f,'repeat':[1,1],'offset':[0,0],'center':[0,0],'rotation':0,'flipY':True,'colorSpace':'','sha256':SUP['extraAssets'][f]['sha256']}
for m in MR.values():
 if m['name'] in ['foreground-neutral-charcoal-partly-glazed-ceramic149','foreground-rounded-charcoal-ceramic-end149']:
  m['textures']=dict(m['textures']);m['textures']['clearcoatMap']='source:ceramic-glaze-weight.png';m['textures']['clearcoatRoughnessMap']='source:ceramic-glaze-rough.png';m['textures']['clearcoatNormalMap']='source:ceramic-micro-normal-gl.png';m['clearcoatNormalScale']=[.08,.08]
# The original650px granite maps explicitly use MirroredRepeatWrapping.
for t in TEX.values():t['mirrored']=t.get('width')==650 and t.get('height')==650

def val(node,names,x):
 for k in names:
  if k in node.inputs:node.inputs[k].default_value=x;return node.inputs[k]
 return None

def op(n,l,kind,a,b=None):
 p=n.new('ShaderNodeMath');p.operation=kind
 for i,x in enumerate([a,b]):
  if x is None:continue
  if isinstance(x,(int,float,np.floating)):p.inputs[i].default_value=float(x)
  else:l.new(x,p.inputs[i])
 return p.outputs[0]
def clamp(n,l,x,lo,hi):
 c=n.new('ShaderNodeClamp');c.inputs['Min'].default_value=lo;c.inputs['Max'].default_value=hi;l.new(x,c.inputs['Value']);return c.outputs[0]
def channel(n,l,c,key):
 s=n.new('ShaderNodeSeparateColor');s.mode='RGB';l.new(c,s.inputs['Color']);return s.outputs[key]
def multiply_color(n,l,a,b):
 p=n.new('ShaderNodeMixRGB');p.blend_type='MULTIPLY';p.inputs[0].default_value=1
 for i,x in [(1,a),(2,b)]:
  if isinstance(x,(tuple,list,np.ndarray)):p.inputs[i].default_value=tuple(x[:3])+(1,)
  else:l.new(x,p.inputs[i])
 return p.outputs[0]
def uv_affine(t):
 sx,sy=t.get('repeat',[1,1]);ox,oy=t.get('offset',[0,0]);cx,cy=t.get('center',[0,0]);r=t.get('rotation',0);c,s=math.cos(r),math.sin(r)
 return np.array([[sx*c,sx*s],[-sy*s,sy*c]],dtype=np.float64),np.array([-sx*(c*cx+s*cy)+cx+ox,-sy*(-s*cx+c*cy)+cy+oy])
def transformed_uv(data,t):
 A,b=uv_affine(t);return (data@A.T+b).astype(np.float32)
def image_for(t,ch):
 path=WORK/t['sourcePath'] if 'sourcePath'in t else ROOT/'assets'/t['file'];digest=t.get('sha256') or E['exportedAssets'][t['file']]['sha256'];space='sRGB' if ch in ['map','emissiveMap'] and t.get('colorSpace')=='srgb' else 'Non-Color';key=(digest,space)
 if key not in images:
  image=bpy.data.images.load(str(path),check_existing=False);image.colorspace_settings.name=space;images[key]=image
 return images[key]
def texture_node(n,l,uv,t,ch):
 tex=n.new('ShaderNodeTexImage');tex.image=image_for(t,ch);tex.extension='REPEAT';tex.interpolation='Linear';A,b=uv_affine(t)
 if not t.get('flipY',True):A[1]*=-1;b[1]=1-b[1]
 comps=[]
 for row,off in zip(A,b):
  dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=(float(row[0]),float(row[1]),0);l.new(uv,dot.inputs[0]);q=op(n,l,'ADD',dot.outputs['Value'],float(off));
  if t.get('mirrored'):q=op(n,l,'PINGPONG',q,1)
  comps.append(q)
 combine=n.new('ShaderNodeCombineXYZ');l.new(comps[0],combine.inputs['X']);l.new(comps[1],combine.inputs['Y']);l.new(combine.outputs[0],tex.inputs['Vector']);return tex

leaf_ids=set();paper_ids=set();material_reports=[]
for mid,rec in MR.items():
 mat=bpy.data.materials.new(rec['name'] or 'source-material-'+mid[:8]);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();l=mat.node_tree.links;bs=n.new('ShaderNodeBsdfPrincipled');out=n.new('ShaderNodeOutputMaterial');l.new(bs.outputs['BSDF'],out.inputs['Surface'])
 color=tuple(rec.get('color') or [.5,.5,.5]);val(bs,['Base Color'],color+(1,));val(bs,['Roughness'],float(rec.get('roughness',.4)));val(bs,['Metallic'],float(rec.get('metalness',0)));val(bs,['IOR'],float(rec.get('ior') or 1.5));val(bs,['Transmission Weight','Transmission'],float(rec.get('transmission') or 0));val(bs,['Specular IOR Level'],.5*float(rec.get('specularIntensity') if rec.get('specularIntensity') is not None else 1));val(bs,['Specular Tint'],tuple(rec.get('specularColor') or [1,1,1])+(1,));val(bs,['Coat Weight','Clearcoat'],float(rec.get('clearcoat') or 0));val(bs,['Coat Roughness','Clearcoat Roughness'],float(rec.get('clearcoatRoughness') or .1));val(bs,['Alpha'],float(rec.get('opacity',1)))
 emission=tuple(rec.get('emissive') or [0,0,0]);val(bs,['Emission Color','Emission'],emission+(1,));val(bs,['Emission Strength'],float(rec.get('emissiveIntensity') or 0));uv=n.new('ShaderNodeUVMap');uv.uv_map='sourceMetricUV' if mid in timber_ids else 'sourceUV';tn={k:texture_node(n,l,uv.outputs['UV'],TEX[tid],k) for k,tid in rec['textures'].items() if 'file'in TEX[tid] or 'sourcePath'in TEX[tid]}
 base=tn['map'].outputs['Color'] if 'map'in tn else None
 neutral_stone=rec['name'] in ['scene07-jointed-weathered-path-granite','island-lantern-independent-mineral-granite','island-lantern-weathered-kasa-stone','island-lantern-carved-stone-ground']
 if neutral_stone and base:
  sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';l.new(base,sep.inputs['Color']);terms=[op(n,l,'MULTIPLY',sep.outputs[c],v) for c,v in [('Red',.2126),('Green',.7152),('Blue',.0722)]];lum=op(n,l,'ADD',op(n,l,'ADD',terms[0],terms[1]),terms[2]);q=op(n,l,'DIVIDE',op(n,l,'MAXIMUM',lum,.0001),.153180782734);p=op(n,l,'POWER',q,.65 if rec['name'].startswith('scene07-jointed') else .55);base=clamp(n,l,p,.66 if rec['name'].startswith('scene07-jointed') else .68,1.42 if rec['name'].startswith('scene07-jointed') else 1.36)
 base=multiply_color(n,l,base,color) if base else None
 source_alpha=None
 if rec.get('vertexColors'):
  attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';base=multiply_color(n,l,attr.outputs['Color'],base or color);source_alpha=attr.outputs['Alpha']
 if mid in instanced_ids:
  attr=n.new('ShaderNodeAttribute');attr.attribute_name='instanceColor';attr.attribute_type='INSTANCER';base=multiply_color(n,l,attr.outputs['Color'],base or color)
 if base:
  if mid in timber_ids:
   sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';l.new(base,sep.inputs['Color']);bounded=n.new('ShaderNodeCombineColor');bounded.mode='RGB'
   for k in ['Red','Green','Blue']:l.new(clamp(n,l,sep.outputs[k],0,.98),bounded.inputs[k])
   base=bounded.outputs['Color']
  l.new(base,bs.inputs['Base Color'])
 alpha=float(rec.get('opacity',1))
 if 'map'in tn and float(rec.get('alphaTest') or 0)>0:alpha=op(n,l,'MULTIPLY',op(n,l,'GREATER_THAN',tn['map'].outputs['Alpha'],float(rec['alphaTest'])),alpha)
 if 'alphaMap'in tn:alpha=op(n,l,'MULTIPLY',alpha,channel(n,l,tn['alphaMap'].outputs['Color'],'Green'))
 if source_alpha:alpha=op(n,l,'MULTIPLY',alpha,source_alpha)
 if not isinstance(alpha,(float,int)):l.new(alpha,bs.inputs['Alpha'])
 if 'emissiveMap'in tn:l.new(multiply_color(n,l,tn['emissiveMap'].outputs['Color'],emission),bs.inputs['Emission Color'])
 if 'bumpMap'in tn:
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=1.;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));l.new(tn['bumpMap'].outputs['Color'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
 for ch,socket,scale_key in [('normalMap','Normal','normalScale'),('clearcoatNormalMap','Coat Normal','clearcoatNormalScale')]:
  if ch in tn and socket in bs.inputs:
   normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=float((rec.get(scale_key) or [1])[0]);normal.uv_map='normalUV-'+rec['textures'][ch][:16];normal_charts[normal.uv_map]=TEX[rec['textures'][ch]];l.new(tn[ch].outputs['Color'],normal.inputs['Color']);l.new(normal.outputs['Normal'],bs.inputs[socket])
 rough=float(rec.get('roughness',.4));metal=float(rec.get('metalness',0));coat=float(rec.get('clearcoat') or 0);coat_rough=float(rec.get('clearcoatRoughness') or .1)
 if 'roughnessMap'in tn:rough=op(n,l,'MULTIPLY',rough,channel(n,l,tn['roughnessMap'].outputs['Color'],'Green'))
 if mid in timber_ids:rough=clamp(n,l,op(n,l,'ADD',.36,op(n,l,'MULTIPLY',rough,.72)),.42,.94)
 if neutral_stone and rec['name'].startswith('island-'):rough=clamp(n,l,op(n,l,'ADD',.76,op(n,l,'MULTIPLY',rough,.20)),.78,.95)
 if 'metalnessMap'in tn:metal=op(n,l,'MULTIPLY',metal,channel(n,l,tn['metalnessMap'].outputs['Color'],'Blue'))
 if 'clearcoatMap'in tn:coat=op(n,l,'MULTIPLY',coat,channel(n,l,tn['clearcoatMap'].outputs['Color'],'Red'))
 if 'clearcoatRoughnessMap'in tn:coat_rough=op(n,l,'MULTIPLY',coat_rough,channel(n,l,tn['clearcoatRoughnessMap'].outputs['Color'],'Green'))
 if rec['name']=='foreground-neutral-charcoal-partly-glazed-ceramic149':
  a=n.new('ShaderNodeAttribute');a.attribute_name='clayState';s=n.new('ShaderNodeSeparateXYZ');l.new(a.outputs['Vector'],s.inputs[0]);x,y,z=[s.outputs[k] for k in ['X','Y','Z']];minimum=op(n,l,'MINIMUM',y,op(n,l,'SUBTRACT',1,y));t=clamp(n,l,op(n,l,'DIVIDE',op(n,l,'SUBTRACT',minimum,.025),.135),0,1);sm=op(n,l,'MULTIPLY',op(n,l,'MULTIPLY',t,t),op(n,l,'SUBTRACT',3,op(n,l,'MULTIPLY',2,t)));lap=op(n,l,'SUBTRACT',1,sm);crown=op(n,l,'POWER',op(n,l,'ABSOLUTE',op(n,l,'SUBTRACT',op(n,l,'MULTIPLY',x,2),1)),8)
  rough=clamp(n,l,op(n,l,'ADD',op(n,l,'ADD',rough,op(n,l,'MULTIPLY',lap,.075)),op(n,l,'ADD',op(n,l,'MULTIPLY',crown,.035),op(n,l,'MULTIPLY',op(n,l,'SUBTRACT',z,.5),.025))),.23,.67);coat=op(n,l,'MULTIPLY',coat,op(n,l,'SUBTRACT',op(n,l,'SUBTRACT',1,op(n,l,'MULTIPLY',lap,.38)),op(n,l,'MULTIPLY',crown,.18)))
 for name,x in [('Roughness',rough),('Metallic',metal),('Coat Weight',coat),('Coat Roughness',coat_rough)]:
  if name in bs.inputs:
   if isinstance(x,(float,int)):bs.inputs[name].default_value=float(x)
   else:l.new(x,bs.inputs[name])
 # Physical thin transmission uses the source pigment/alpha; no view-facing emission.
 name=rec['name'];leaf=('needle'in name or 'lamina'in name or 'bank-leaves'in name or 'sedge'in name or 'periwinkle-plant'in name or ('forest150-'in name and float(rec.get('alphaTest') or 0)>0) or 'cc0-shrub'in name)
 if not name and float(rec.get('metalness',0))==0 and not rec['textures'] and color[1]>color[0]*1.18 and color[1]>color[2]*1.20:leaf=True
 paper=any(v>0 for v in emission) and 0<float(rec.get('emissiveIntensity') or 0)<=.4 and float(rec.get('metalness',0))==0
 if leaf or paper:
  thin=n.new('ShaderNodeBsdfTranslucent');
  if base:l.new(base,thin.inputs['Color'])
  else:thin.inputs['Color'].default_value=color+(1,)
  mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.38 if paper else .28 if 'lamina'in name else .18 if 'needle'in name else .25;l.new(bs.outputs[0],mix.inputs[1]);l.new(thin.outputs[0],mix.inputs[2]);surface=mix.outputs[0]
  if not isinstance(alpha,(float,int)) or alpha<1:
   for link in list(bs.inputs['Alpha'].links):l.remove(link)
   bs.inputs['Alpha'].default_value=1;transparent=n.new('ShaderNodeBsdfTransparent');cutout=n.new('ShaderNodeMixShader')
   if isinstance(alpha,(float,int)):cutout.inputs[0].default_value=float(alpha)
   else:l.new(alpha,cutout.inputs[0])
   l.new(transparent.outputs[0],cutout.inputs[1]);l.new(surface,cutout.inputs[2]);surface=cutout.outputs[0]
  l.new(surface,out.inputs['Surface']);(paper_ids if paper else leaf_ids).add(mid)
 MC[mid]=mat
 if mid in instanced_ids:
  copied=mat.copy();copied.name=mat.name+' [geometry RGB]'
  for node in copied.node_tree.nodes:
   if node.type=='ATTRIBUTE' and node.attribute_name=='instanceColor':node.attribute_type='GEOMETRY'
  GM[mid]=copied
 else:GM[mid]=mat
 material_reports.append({'id':mid,'sourceName':name,'vertexColors':bool(rec.get('vertexColors')),'sourceColor':list(color),'timberMetricShader':mid in timber_ids,'neutralMineralShader':neutral_stone,'alphaTest':rec.get('alphaTest'),'opacity':rec.get('opacity'),'thinPhysicalTransport':'paper' if paper else 'foliage' if leaf else None})
report['materialTransfer']={'originalFlags':material_reports,'timberIds':list(timber_ids),'timberUV':'Source longest-axis member metres, absolute source normal axis and per-instance length/translation phase. All original UV sets retained separately; derived metric UVs are the shader sampling chart.','timberPhasePrecision':'CPU NumPy Float32 dot/sin/fract follows the original GLSL equation; GPU transcendental/FMA rounding is not asserted pixel-identical.','timberReflectanceBound':'Original scan times original source RGB gains, vertex RGB if enabled and exact instance RGB. Effective timber RGB only clipped to[0,.98] for physical reflectance. Original gains retained in receipt.','roughness':'Exact native source clamp(.36+.72*mapG*.9,.42,.94) for all five scanned-timber materials. Source neutral stone and foreground clayState/glaze equations ported.','missingGenericExporterFields':'Original foreground clearcoat weight/roughness/normal maps are read from verified original source paths; no duplicate PNG files. Original UV1/color_1/clayState attributes retained.','thinTransport':'Energy-conserving source-pigment Principled/Translucent mix with actual occlusion; no native view-facing additive leaf term. Rice paper38%, momiji28%, needles18%, other leaves25%.','limits':['Source custom GLSL fog, AO and planar capture do not equal physical transport.','glTF AO map modulation is replaced by physical GI; original UV1 is preserved.','ACESFilmic native and physical AgX are different camera curves.']}

G={g['id']:g for g in D['geometries']};loaded={};mesh_cache={};templates={};C=Matrix.Rotation(math.pi/2,4,'X');template_collection=bpy.data.collections.new('Hidden linked original source prototypes');scene.collection.children.link(template_collection)
counts={'linkedInstances':0,'affineBakedInstances':0,'rank2TransformsRetained':0,'rank2GeometryRetained':0,'rankBelow2TransformsRetained':0,'triangles':0,'vertices':0};audit={};max_shear=0.;max_trs=0.;attrs_seen={};original_uvs=set();normal_basis_count=0

def load_geo(g):
 if g['id']not in loaded:
  loaded[g['id']]={k:binary(v).reshape(-1,v['itemSize']) for k,v in g['attributes'].items()};loaded[g['id']]['index']=binary(g['index']).reshape(-1,3).astype(np.int64)
 return loaded[g['id']]
def as_colors(a):
 out=np.ones((len(a),4),dtype=np.float32);out[:,:min(a.shape[1],4)]=a[:,:4];return out

def build_mesh(rec,g,data,coords=None,normals=None,faces=None,metric=None,tints=None,repeats=1,label='source'):
 global normal_basis_count
 p=data['position'] if coords is None else coords;n0=data['normal'] if normals is None else normals;ix=data['index'] if faces is None else faces;vcount=len(data['position']);idx=ix.reshape(-1).astype(np.int32);mesh=bpy.data.meshes.new((rec['name'] or g['id'][:8])+' '+label);mesh.vertices.add(len(p));mesh.vertices.foreach_set('co',p.astype(np.float32,copy=False).ravel());mesh.loops.add(len(idx));mesh.loops.foreach_set('vertex_index',idx);mesh.polygons.add(len(ix));mesh.polygons.foreach_set('loop_start',np.arange(len(ix),dtype=np.int32)*3);mesh.polygons.foreach_set('loop_total',np.full(len(ix),3,dtype=np.int32));mesh.polygons.foreach_set('use_smooth',np.ones(len(ix),dtype=np.bool_));mesh.update(calc_edges=True)
 if n0 is not None:
  try:mesh.normals_split_custom_set_from_vertices(n0.astype(np.float32,copy=False).tolist())
  except Exception as e:raise RuntimeError('Source normals failed '+str(e))
 def uvlayer(name,uv):
  layer=mesh.uv_layers.new(name=name);layer.data.foreach_set('uv',uv[idx,:2].astype(np.float32,copy=False).ravel());return layer
 uvdata={}
 for k,a in data.items():
  if k=='uv' or k.startswith('uv') and k[2:].isdigit():
   name='sourceUV'+('' if k=='uv' else k[2:]);q=np.tile(a,(repeats,1)) if repeats>1 else a;uvdata[name]=q;uvlayer(name,q);original_uvs.add(k)
 if metric is not None:uvdata['sourceMetricUV']=metric;uvlayer('sourceMetricUV',metric)
 needed_charts=set()
 for mid in rec['materials']:
  for ch in ['normalMap','clearcoatNormalMap']:
   if ch in MR[mid]['textures']:needed_charts.add('normalUV-'+MR[mid]['textures'][ch][:16])
 base_uv=metric if metric is not None else uvdata.get('sourceUV')
 if base_uv is not None:
  for name in needed_charts:
   if name in normal_charts:uvlayer(name,transformed_uv(base_uv,normal_charts[name]));normal_basis_count+=1
 if mesh.uv_layers:
  active='sourceMetricUV' if metric is not None else 'sourceUV'
  if active in mesh.uv_layers:mesh.uv_layers.active=mesh.uv_layers[active];mesh.uv_layers[active].active_render=True
 for k,a in data.items():
  if k in ['position','normal','index'] or k.startswith('uv'):continue
  q=np.tile(a,(repeats,1)) if repeats>1 else a;attrs_seen[k]=attrs_seen.get(k,0)+1
  if k.startswith('color') and a.shape[1]in[3,4]:
   name='sourceColor' if k=='color' else 'sourceColor_'+k[6:];layer=mesh.color_attributes.new(name=name,type='FLOAT_COLOR',domain='POINT');layer.data.foreach_set('color',as_colors(q).ravel())
  elif a.shape[1]==3:
   attr=mesh.attributes.new(name=k,type='FLOAT_VECTOR',domain='POINT');attr.data.foreach_set('vector',q.astype(np.float32,copy=False).ravel())
  elif a.shape[1]==1:
   attr=mesh.attributes.new(name=k,type='FLOAT',domain='POINT');attr.data.foreach_set('value',q.astype(np.float32,copy=False).ravel())
  else:raise RuntimeError('Unhandled source attribute '+k+' '+str(a.shape))
 if 'color'not in data and any(MR[mid].get('vertexColors') for mid in rec['materials']):
  layer=mesh.color_attributes.new(name='sourceColor',type='FLOAT_COLOR',domain='POINT');layer.data.foreach_set('color',np.ones((len(p),4),dtype=np.float32).ravel())
 if any(mid in instanced_ids for mid in rec['materials']):
  layer=mesh.color_attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');rgb=np.ones((len(p),4),dtype=np.float32)
  if tints is not None:rgb[:,:3]=np.repeat(tints,vcount,axis=0)
  layer.data.foreach_set('color',rgb.ravel())
 for mid in rec['materials']:mesh.materials.append(MC[mid] if coords is None else GM[mid])
 if len(rec['materials'])>1 and g['groups']:
  owners=np.zeros(len(data['index']),dtype=np.int32)
  for group in g['groups']:owners[group['start']//3:(group['start']+group['count'])//3]=group.get('materialIndex',0)
  mesh.polygons.foreach_set('material_index',np.tile(owners,repeats))
 counts['vertices']+=len(p);return mesh

def metric_uv(data,A):
 scale=np.linalg.norm(A[:3,:3],axis=0).astype(np.float32);p=data['position']*scale;spans=data['timberExtent']*scale;nn=np.abs(data['normal']);q=np.empty((len(p),2),dtype=np.float32);Y=(spans[:,1]>=spans[:,0])&(spans[:,1]>=spans[:,2]);X=(~Y)&(spans[:,0]>=spans[:,2]);Z=~(Y|X);q[Y,0]=p[Y,1];q[Y,1]=np.where(nn[Y,0]>nn[Y,2],p[Y,2],p[Y,0]);q[X,0]=p[X,0];q[X,1]=np.where(nn[X,1]>nn[X,2],p[X,2],p[X,1]);q[Z,0]=p[Z,2];q[Z,1]=np.where(nn[Z,1]>nn[Z,0],p[Z,0],p[Z,1]);phase=np.float32(np.sin(np.float32(np.dot(A[:3,3].astype(np.float32),np.array([12.713,4.13,5.71],dtype=np.float32))))*np.float32(43758.5453));phase=np.float32(phase-np.floor(phase));q+=np.array([phase,phase*np.float32(.37)],dtype=np.float32);return q

def normal_transform(normals,A,coords,faces):
 L=A[:3,:3];sv=np.linalg.svd(L,compute_uv=False);rank=int(np.count_nonzero(sv>max(float(sv[0]),1e-30)*1e-12));
 if rank==3:q=normals@np.linalg.inv(L)
 else:
  cof=np.column_stack([np.cross(L[:,1],L[:,2]),np.cross(L[:,2],L[:,0]),np.cross(L[:,0],L[:,1])]);q=normals@cof.T
 length=np.linalg.norm(q,axis=1);bad=length<1e-20
 if np.any(bad):
  weighted=np.zeros_like(q);tri=coords[faces];fn=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);
  for k in range(3):np.add.at(weighted,faces[:,k],fn)
  q[bad]=weighted[bad];length=np.linalg.norm(q,axis=1);invalid=length<1e-20;q[invalid]=[0,1,0];length[invalid]=1
 return (q/length[:,None]).astype(np.float32),rank

def gn(template):
 tree=bpy.data.node_groups.new('Exact original source TRS instances','GeometryNodeTree');geo_in=tree.interface.new_socket(name='Points',in_out='INPUT',socket_type='NodeSocketGeometry');geo_out=tree.interface.new_socket(name='Instances',in_out='OUTPUT',socket_type='NodeSocketGeometry');n=tree.nodes;l=tree.links;gin=n.new('NodeGroupInput');gout=n.new('NodeGroupOutput');obj=n.new('GeometryNodeObjectInfo');obj.transform_space='ORIGINAL';obj.inputs['Object'].default_value=template;obj.inputs['As Instance'].default_value=True;rot=n.new('GeometryNodeInputNamedAttribute');rot.data_type='FLOAT_VECTOR';rot.inputs['Name'].default_value='sourceRotationEuler';scale=n.new('GeometryNodeInputNamedAttribute');scale.data_type='FLOAT_VECTOR';scale.inputs['Name'].default_value='sourceScale';e=n.new('FunctionNodeEulerToRotation');l.new(rot.outputs['Attribute'],e.inputs['Euler']);col=n.new('GeometryNodeInputNamedAttribute');col.data_type='FLOAT_COLOR';col.inputs['Name'].default_value='instanceColor';store=n.new('GeometryNodeStoreNamedAttribute');store.data_type='FLOAT_COLOR';store.domain='POINT';store.inputs['Name'].default_value='instanceColor';l.new(col.outputs['Attribute'],store.inputs['Value']);l.new(gin.outputs[geo_in.name],store.inputs['Geometry']);inst=n.new('GeometryNodeInstanceOnPoints');l.new(store.outputs['Geometry'],inst.inputs['Points']);l.new(obj.outputs['Geometry'],inst.inputs['Instance']);l.new(e.outputs['Rotation'],inst.inputs['Rotation']);l.new(scale.outputs['Attribute'],inst.inputs['Scale']);l.new(inst.outputs['Instances'],gout.inputs[geo_out.name]);return tree

for at,rec in enumerate(D['meshes']):
 g=G[rec['geometry']];data=load_geo(g);p=data['position'];ix=data['index'];vcount=len(p);fcount=len(ix);world=np.asarray(rec['matrix'],dtype=np.float64).reshape(4,4).T;world_rank=np.linalg.matrix_rank(world[:3,:3],tol=1e-12);native_timber=any(mid in timber_ids for mid in rec['materials']) and 'timberExtent'in data;name=(rec['name'] or 'source-object-'+str(at))[:52]
 if 'instanceMatrices'in rec:raw=binary(rec['instanceMatrices']).reshape(-1,4,4).transpose(0,2,1).astype(np.float64);tints=binary(rec['instanceColors']).reshape(-1,3) if 'instanceColors'in rec else np.ones((len(raw),3),dtype=np.float32)
 else:raw=np.eye(4)[None];tints=np.ones((1,3),dtype=np.float32)
 if np.linalg.matrix_rank(p.astype(np.float64)-p.mean(axis=0),tol=1e-8)==2:counts['rank2GeometryRetained']+=len(raw)
 good=[];bad=[];pos=[];rot=[];scale=[]
 for i,A in enumerate(raw):
  sv=np.linalg.svd(A[:3,:3],compute_uv=False);rank=int(np.count_nonzero(sv>max(float(sv[0]),1e-30)*1e-12));L=A[:3,:3];lens=np.linalg.norm(L,axis=0);gram=L.T@L;shear=max([abs(gram[a,b]/max(lens[a]*lens[b],1e-30)) for a in range(3) for b in range(a+1,3)],default=0);max_shear=max(max_shear,float(shear))
  if native_timber or rank<3 or world_rank<3 or shear>1e-7:bad.append(i)
  else:
   M=Matrix(A.tolist());loc,q,s=M.decompose();rr=Matrix.LocRotScale(loc,q,s);res=float(np.max(np.abs(np.asarray(rr)-A)));max_trs=max(max_trs,res);good.append(i);pos.append(tuple(loc));rot.append(tuple(q.to_euler('XYZ')));scale.append(tuple(s))
 if good:
  key=(g['id'],tuple(rec['materials']));base=mesh_cache.get(key)
  if base is None:base=build_mesh(rec,g,data);mesh_cache[key]=base
  template=templates.get(key)
  if template is None:template=bpy.data.objects.new(name+' original mesh',base);template_collection.objects.link(template);template.hide_render=True;template.hide_set(True);templates[key]=template
  points=bpy.data.meshes.new(name+' source points');points.vertices.add(len(good));points.vertices.foreach_set('co',np.asarray(pos,dtype=np.float32).ravel())
  for key,values in [('sourceRotationEuler',rot),('sourceScale',scale)]:a=points.attributes.new(name=key,type='FLOAT_VECTOR',domain='POINT');a.data.foreach_set('vector',np.asarray(values,dtype=np.float32).ravel())
  a=points.attributes.new(name='instanceColor',type='FLOAT_COLOR',domain='POINT');colors=np.ones((len(good),4),dtype=np.float32);colors[:,:3]=tints[good];a.data.foreach_set('color',colors.ravel());obj=bpy.data.objects.new(name+' linked instances',points);scene.collection.objects.link(obj);obj.matrix_world=Matrix(world.tolist());mod=obj.modifiers.new('Exact source matrices; linked originals','NODES');mod.node_group=gn(template);counts['linkedInstances']+=len(good);counts['triangles']+=len(good)*fcount
  if len(audit)<40:audit[obj.name]=[{'matrix':world@raw[i],'bestResidual':1e30} for i in good[:4]]
 if bad:
  k=len(bad);coords=np.empty((k*vcount,3),dtype=np.float32);normals=np.empty_like(coords);faces=np.tile(ix[None],(k,1,1))+(np.arange(k,dtype=np.int64)*vcount)[:,None,None];metric=np.empty((k*vcount,2),dtype=np.float32) if native_timber else None
  for j,i in enumerate(bad):
   A=world@raw[i] if world_rank<3 else raw[i];sl=slice(j*vcount,(j+1)*vcount);coords[sl]=p@A[:3,:3].T+A[:3,3];normals[sl],rank=normal_transform(data['normal'],A,coords[sl],ix)
   if rank==2:counts['rank2TransformsRetained']+=1
   elif rank<2:counts['rankBelow2TransformsRetained']+=1
   if np.linalg.det(A[:3,:3])<0:faces[j]=faces[j][:,[0,2,1]]
   if metric is not None:metric[sl]=metric_uv(data,raw[i])
  flat=faces.reshape(-1,3);mesh=build_mesh(rec,g,data,coords,normals,flat,metric,tints[bad],k,'exact affine/metric subset');obj=bpy.data.objects.new(name+' preserved affine subset',mesh);scene.collection.objects.link(obj);obj.matrix_world=Matrix.Identity(4) if world_rank<3 else Matrix(world.tolist());counts['affineBakedInstances']+=k;counts['triangles']+=k*fcount
 if at%100==0:print('SOURCE07',at,'/',len(D['meshes']),'linked',counts['linkedInstances'],'baked',counts['affineBakedInstances'],flush=True)
assert counts['triangles']==D['statistics']['triangles']
report['sourceGeometryTransfer']={**counts,'maxTRSDecompositionResidual':max_trs,'maxSourceShear':max_shear,'decimated':False,'rank2Policy':'Never excluded for determinant zero. All indexed faces retained, including legitimate rank2 planes; cofactor/geometric normals for singular affine transforms. Degenerate source faces remain indices and have no ray area.','allOriginalUVSetsRetained':sorted(original_uvs),'sourceExtraAttributesRetained':attrs_seen,'normalSamplingCharts':normal_basis_count,'UVBasisConvention':'Native texture transform retained for tangent basis; file bitmap flip convention applied to image sampling only.'}
save_report()

# Exact original source water geometry, reproduced with the same Three.js
# ShapeGeometry constructor because the official exporter excludes Reflector.
pond=SUP['pond'];pdata={k:binary(v,HERE).reshape(-1,v['itemSize']) for k,v in pond['attributes'].items()};pdata['index']=binary(pond['index'],HERE).reshape(-1,3).astype(np.int64)
for r in [*pond['attributes'].values(),pond['index']]:assert H(HERE/r['file'])==r['sha256']
pm=bpy.data.materials.new('Original pond bounds, physical dielectric water');pm.use_nodes=True;n=pm.node_tree.nodes;l=pm.node_tree.links;bs=n.get('Principled BSDF');val(bs,['Base Color'],(.035,.072,.065,1));val(bs,['Metallic'],0);val(bs,['Roughness'],.047);val(bs,['IOR'],1.333);val(bs,['Transmission Weight','Transmission'],.22);val(bs,['Coat Weight','Clearcoat'],.25);val(bs,['Coat Roughness','Clearcoat Roughness'],.06);tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=5.;tex.inputs['Detail'].default_value=3.;tex.inputs['Roughness'].default_value=.65;geo=n.new('ShaderNodeNewGeometry');l.new(geo.outputs['Position'],tex.inputs['Vector']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.24;bump.inputs['Distance'].default_value=.0015;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal']);mesh=bpy.data.meshes.new('Exact original22-triangle pond boundary');mesh.from_pydata(pdata['position'].tolist(),[],pdata['index'].tolist());mesh.update();layer=mesh.uv_layers.new(name='sourceUV');layer.data.foreach_set('uv',pdata['uv'][pdata['index'].reshape(-1)].ravel());mesh.materials.append(pm);obj=bpy.data.objects.new('Source07 Reflector geometry with physical surface',mesh);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(pond['matrix']).reshape(4,4).T.tolist())
report['waterReplacement']={'source':'Exact canonical pondOutline/ShapeGeometry60 positions, indices, UV and world matrix reproduced from verified sourcemain.js. No replacement pond/architecture geometry.','triangles':len(pdata['index']),'IOR':1.333,'roughness':.047,'transmission':.22,'sourceScreenReflectionPortedExactly':False,'microNormalMetres':.0015}

# Physical key retains the actual source07 low solar direction. Native
# unshadowed fill/hemi proxies are replaced by measured sky visibility/GI.
SUN=max((r for r in D['lights'] if r['type']=='DirectionalLight'),key=lambda r:r['intensity']);physical_lights=[]
for r in D['lights']:
 if r is not SUN and r['type']!='PointLight':continue
 typ='SUN' if r is SUN else 'POINT';ld=bpy.data.lights.new(r['name'] or ('Actual low source07 sun' if typ=='SUN' else 'Source07 practical'),typ);ld.color=r['color'];obj=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(obj);obj.matrix_world=Matrix(np.asarray(r['matrix']).reshape(4,4).T.tolist())
 if typ=='SUN':ld.energy=4.1;ld.angle=math.radians(.53);obj.rotation_euler=(Vector(r['target'])-obj.location).to_track_quat('-Z','Y').to_euler()
 else:ld.energy=r['intensity']*4*math.pi;ld.shadow_soft_size=.045
 physical_lights.append({'name':obj.name,'type':typ,'energy':ld.energy,'sourceIntensity':r['intensity'],'sourceLinearRGB':list(ld.color)})
cam=bpy.data.cameras.new('Exact canonical07 physical reference camera');camera=bpy.data.objects.new(cam.name,cam);scene.collection.objects.link(camera);camera.matrix_world=Matrix(np.asarray(D['cameraMatrix']).reshape(4,4).T.tolist());cam.sensor_fit='VERTICAL';cam.sensor_height=36;cam.lens=18/math.tan(math.radians(47)/2);cam.clip_start=.1;cam.clip_end=2500;cam.dof.use_dof=True;cam.dof.focus_distance=math.sqrt(10.7**2+5.8**2+38**2);cam.dof.aperture_fstop=2.8;cam.dof.aperture_blades=9;scene.camera=camera
for obj in list(scene.objects):obj.matrix_world=C@obj.matrix_world
bpy.context.view_layer.update()
for group in audit.values():
 for s in group:s['matrix']=np.asarray(C)@s['matrix']
for inst in bpy.context.evaluated_depsgraph_get().object_instances:
 if not inst.is_instance or not inst.parent:continue
 group=audit.get(inst.parent.original.name)
 if not group:continue
 actual=np.asarray(inst.matrix_world)
 for s in group:
  if np.max(np.abs(actual[:3,3]-s['matrix'][:3,3]))<.0001:s['bestResidual']=min(s['bestResidual'],float(np.max(np.abs(actual-s['matrix']))))
rows=[{'parent':k,'samples':len(v),'maxAbsoluteResidual':max(s['bestResidual'] for s in v)}for k,v in audit.items()];report['evaluatedGNMatrixAudit']={'groups':rows,'maxAbsoluteResidual':max(r['maxAbsoluteResidual'] for r in rows),'tolerance':.0001};assert report['evaluatedGNMatrixAudit']['maxAbsoluteResidual']<.0001

# Original measured CC0 Qwantani EXR supplies actual world radiance. World
# texture coordinates Normal are -rayD in Cycles background (Blender source:
# kernel/geom/shader_data.h); the rows below include that minus sign and the
# common Z-up conversion, so native spherical sampling is exactly oriented.
sky=NR['frames'][0]['info']['garden']['skyRadiance'];exr=WORK/'assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr';assert H(exr)==E['source']['files']['assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr'];a,b,c=sky['environment']['rotation'][:3];ca,sa=math.cos(a),math.sin(a);cb,sb=math.cos(b),math.sin(b);cc,sc=math.cos(c),math.sin(c);R=np.array([[1,0,0],[0,ca,-sa],[0,sa,ca]])@np.array([[cb,0,sb],[0,1,0],[-sb,0,cb]])@np.array([[cc,-sc,0],[sc,cc,0],[0,0,1]]);Cinv=np.array([[1,0,0],[0,0,1],[0,-1,0]],dtype=np.float64);M=-R.T@Cinv
world=bpy.data.worlds.new('Original Qwantani source radiance, physically sampled');world.use_nodes=True;scene.world=world;n=world.node_tree.nodes;n.clear();l=world.node_tree.links;coord=n.new('ShaderNodeTexCoord');components=[]
for row in M:
 dot=n.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=tuple(row);l.new(coord.outputs['Normal'],dot.inputs[0]);components.append(dot.outputs['Value'])
x,y,z=components;u=op(n,l,'ADD',op(n,l,'DIVIDE',op(n,l,'ARCTAN2',z,x),2*math.pi),.5);v=op(n,l,'ADD',op(n,l,'DIVIDE',op(n,l,'ARCSINE',clamp(n,l,y,-1,1)),math.pi),.5);uv=n.new('ShaderNodeCombineXYZ');l.new(u,uv.inputs['X']);l.new(v,uv.inputs['Y']);tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(exr),check_existing=False);tex.image.colorspace_settings.name='Non-Color';tex.extension='REPEAT';l.new(uv.outputs[0],tex.inputs['Vector']);bg=n.new('ShaderNodeBackground');l.new(tex.outputs['Color'],bg.inputs['Color']);path=n.new('ShaderNodeLightPath');gain=n.new('ShaderNodeMix');gain.data_type='FLOAT';gain.inputs[2].default_value=.80;gain.inputs[3].default_value=.65;l.new(path.outputs['Is Camera Ray'],gain.inputs[0]);l.new(gain.outputs[0],bg.inputs['Strength']);out=n.new('ShaderNodeOutputWorld');l.new(bg.outputs[0],out.inputs['Surface'])
if hasattr(world.cycles,'sample_map_resolution'):world.cycles.sample_map_resolution=2048
report['physicalLighting']={'worldSource':'assets/polyhaven/qwantani-sunset-puresky/sky-2k.exr','worldSha256':H(exr),'sourceEnvironmentRotationXYZ':sky['environment']['rotation'],'sourceSunDirection':sky['targetSunDirection'],'cameraRadianceGain':.65,'otherRayRadianceGain':.80,'directSunEnergy':4.1,'sourceSunIntensity':SUN['intensity'],'sourceSunColorLinear':SUN['color'],'solarDiskDegrees':.53,'cameraGeneratedCloudCapUsed':False,'scope':'Same original independently licensed source HDRI; explicit world-direction port. Original source generated camera-only cloud cap omitted for this independent physical review. No architecture or garden plate.','sourceProxyLightsOmitted':[{'type':r['type'],'intensity':r['intensity']}for r in D['lights']if r is not SUN and r['type']!='PointLight'],'practicals':physical_lights}
# Bounded physical participating air: true volume, no composited haze image.
air=bpy.data.materials.new('Sparse golden-hour air155');air.use_nodes=True;n=air.node_tree.nodes;n.clear();l=air.node_tree.links;scatter=n.new('ShaderNodeVolumeScatter');scatter.inputs['Color'].default_value=(.97,.98,1.,1);scatter.inputs['Density'].default_value=.00065;scatter.inputs['Anisotropy'].default_value=.45;out=n.new('ShaderNodeOutputMaterial');l.new(scatter.outputs[0],out.inputs['Volume']);bpy.ops.mesh.primitive_cube_add(size=1,location=(0,55,29));obj=bpy.context.object;obj.name='Bounded real golden-hour atmosphere';obj.scale=(280,330,74);obj.data.materials.append(air);report['physicalAtmosphere']={'type':'Bounded VolumeScatter','densityPerM':.00065,'anisotropy':.45,'boundsZUp':[[-140,-110,-8],[140,220,66]],'geometryContainsNoArchitecture':True}
scene.render.engine='CYCLES';scene.cycles.samples=96;scene.cycles.use_denoising=True;scene.cycles.denoiser='OPENIMAGEDENOISE';scene.cycles.seed=7155;scene.cycles.use_animated_seed=False;scene.cycles.max_bounces=12;scene.cycles.diffuse_bounces=6;scene.cycles.glossy_bounces=6;scene.cycles.transmission_bounces=8;scene.cycles.volume_bounces=2;scene.cycles.transparent_max_bounces=16;scene.cycles.use_adaptive_sampling=True;scene.cycles.adaptive_threshold=.025;scene.cycles.sample_clamp_indirect=12
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for dev in prefs.devices:dev.use=dev.type=='METAL'
assert any(dev.use for dev in prefs.devices),'No Metal GPU';scene.cycles.device='GPU';scene.render.resolution_x=scene.render.resolution_y=1254;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.threads_mode='FIXED';scene.render.threads=4;scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=.45
report['camera']={'sourcePositionYUp':D['view']['position'],'sourceFov':47,'sourceMatrix':D['cameraMatrix'],'sourcePoseUnchanged':True,'sensorHeightMM':36,'focalLengthMM':cam.lens,'focusDistanceM':cam.dof.focus_distance,'fStop':2.8,'exposureEV':.45};report['renderSettings']={'nativeResolution':[1254,1254],'samplesFull':96,'samplesDetail':96,'device':'METAL','denoising':'OpenImageDenoise','physicalSourceCamera':'Original unchanged source pose/FOV; finite lens foreground DOF is an explicit renderer adaptation.'};report['status']='rendering';save_report()
blend=OUT/'scene07-exact-source-physical155.blend';bpy.ops.wm.save_as_mainfile(filepath=str(blend),compress=True);report['blend']={'path':str(blend),'assetsPacked':False,'reason':'No duplicate source PNG/EXR bytes; original verified asset and one export tree remain linked.'}
full=OUT/'scene07-physical155-full.png';scene.render.filepath=str(full);bpy.ops.render.render(write_still=True);report['full']={'path':str(full),'sha256':H(full),'nativeResolution':[1254,1254],'samples':96};save_report()
# Real shifted subfrustum through the same physical source camera pose.
x,y,size,total=540,430,240,1254;original_lens=cam.lens;original_fstop=cam.dof.aperture_fstop;frame=[v.copy() for v in cam.view_frame(scene=scene)];slopes=np.array([(v.x/-v.z,v.y/-v.z)for v in frame]);lo=slopes.min(axis=0);hi=slopes.max(axis=0);left,right=lo[0],hi[0];bottom,top=lo[1],hi[1];desired=np.array([left+(right-left)*x/total,left+(right-left)*(x+size)/total,bottom+(top-bottom)*(total-y-size)/total,top-(top-bottom)*y/total]);cam.lens*=total/size;focus=cam.dof.focus_distance*1000;cam.dof.aperture_fstop=original_fstop*(total/size)*(focus-original_lens)/(focus-cam.lens)
def bounds():
 f=np.array([(v.x/-v.z,v.y/-v.z)for v in cam.view_frame(scene=scene)]);lo=f.min(axis=0);hi=f.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
initial=bounds();cam.shift_x=1;dx=(bounds()-initial)[0];cam.shift_x=0;cam.shift_y=1;dy=(bounds()-initial)[2];cam.shift_y=0;cam.shift_x=float((desired[0]-initial[0])/dx);cam.shift_y=float((desired[2]-initial[2])/dy);err=float(np.max(np.abs(bounds()-desired)));assert err<2e-6
detail=OUT/'scene07-physical155-true-hall-detail.png';scene.render.filepath=str(detail);bpy.ops.render.render(write_still=True);report['trueHallDetail']={'path':str(detail),'sha256':H(detail),'sourceCropPixels':[x,y,size,total],'nativeResolution':[1254,1254],'samples':96,'sourceCameraMatrixUnchanged':True,'maximumRaySlopeError':err,'originalApertureAndCoCPreserved':True,'upscaledScreenshot':False};cam.lens=original_lens;cam.dof.aperture_fstop=original_fstop;cam.shift_x=cam.shift_y=0
# Restore full camera in saved scene without a backup blend or image repacking.
report['status']='physical-source-exact-review';report['elapsedSeconds']=time.time()-report['started'];report['blend']['sha256']=H(blend);save_report();print('SCENE07_PHYSICAL155',json.dumps({'status':report['status'],'sourceHash':EXPECTED,'full':report['full'],'trueHallDetail':report['trueHallDetail'],'elapsedSeconds':report['elapsedSeconds'],'visualAccepted':False}),flush=True)
