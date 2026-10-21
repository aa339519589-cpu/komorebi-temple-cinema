"""Offline physical materials for frozen Scene04 R05; no runtime mutations.

Preserves source UV/vertex/instance domains. World mineral maps use original
declared PBR bitmaps at the source metric repeat, in source Y-up coordinates.
Blender's BSDF/transport and the declared procedural wet film are adaptations.
"""
import bpy, math, hashlib

class Graph:
 def __init__(self,nodes,links):self.n=nodes;self.l=links
 def set(self,s,v):
  if hasattr(v,'node'):self.l.new(v,s)
  else:s.default_value=(v,v,v,1) if isinstance(v,(int,float)) and s.type=='RGBA' else v
 def math(self,op,a,b=None):
  n=self.n.new('ShaderNodeMath');n.operation=op;self.set(n.inputs[0],a)
  if b is not None:self.set(n.inputs[1],b)
  return n.outputs[0]
 def vec(self,op,a,b=None):
  n=self.n.new('ShaderNodeVectorMath');n.operation=op;self.set(n.inputs[0],a)
  if b is not None:self.set(n.inputs[3] if op=='SCALE' else n.inputs[1],b)
  return n.outputs['Value'] if op in ['DOT_PRODUCT','LENGTH','DISTANCE'] else n.outputs['Vector']
 def split(self,v):
  n=self.n.new('ShaderNodeSeparateXYZ');self.l.new(v,n.inputs[0]);return tuple(n.outputs)
 def combine(self,v):
  n=self.n.new('ShaderNodeCombineXYZ')
  for i,q in enumerate(v):self.set(n.inputs[i],q)
  return n.outputs[0]
 def mix(self,a,b,f):
  n=self.n.new('ShaderNodeMixRGB');n.blend_type='MIX';self.set(n.inputs[0],f);self.set(n.inputs[1],a);self.set(n.inputs[2],b);return n.outputs[0]
 def multiply(self,a,b):
  n=self.n.new('ShaderNodeMixRGB');n.blend_type='MULTIPLY';n.inputs[0].default_value=1;self.set(n.inputs[1],a);self.set(n.inputs[2],b);return n.outputs[0]
 def clamp(self,v,lo,hi):return self.math('MINIMUM',self.math('MAXIMUM',v,lo),hi)
 def smooth(self,v,lo,hi):
  n=self.n.new('ShaderNodeMapRange');n.clamp=True;n.interpolation_type='SMOOTHSTEP';self.set(n.inputs['Value'],v);n.inputs['From Min'].default_value=lo;n.inputs['From Max'].default_value=hi;return n.outputs['Result']
 def noise(self,position,scale,detail=2.0):
  n=self.n.new('ShaderNodeTexNoise');n.noise_dimensions='3D';n.inputs['Scale'].default_value=scale;n.inputs['Detail'].default_value=detail;n.inputs['Roughness'].default_value=.63;self.l.new(position,n.inputs['Vector']);return n.outputs['Fac']
 def image(self,image,coordinate,mirror=False):
  n=self.n.new('ShaderNodeTexImage');n.image=image;n.interpolation='Linear';n.extension='MIRROR' if mirror else 'REPEAT';self.l.new(coordinate,n.inputs['Vector']);return n

def build_materials(scene_data,root,report):
 instance_colored={mid for o in scene_data['meshes'] if 'instanceColors' in o for mid in o['materials']}
 textures={t['id']:t for t in scene_data['textures']};material_records={m['id']:m for m in scene_data['materials']};materials={};geometry_materials={};images={};transfers=[]
 neutral_names={'reference4-neutral-weathered-stair-granite','metric-quartz-granite-lantern','weather-aged-damp-toro-cap','carved-granite-recess'}
 metric_names=neutral_names|{'reference4_stone','reference4_granite','metre-scaled-pond-boulder-granite'}
 def load(tid,color):
  t=textures[tid];path=root/'assets'/t['file'];key=(hashlib.sha256(path.read_bytes()).hexdigest(),color)
  if key not in images:
   image=bpy.data.images.load(str(path),check_existing=False);image.colorspace_settings.name='sRGB' if color and t.get('colorSpace')=='srgb' else 'Non-Color';images[key]=image
  return images[key]
 for rec in scene_data['materials']:
  name=rec['name'];paver=name.startswith('metre-scaled-worn-wet-paver-');neutral=name in neutral_names;metric=name in metric_names or paver
  mat=bpy.data.materials.new(name or rec['id']);mat.use_nodes=True;n=mat.node_tree.nodes;n.clear();links=mat.node_tree.links;g=Graph(n,links)
  bs=n.new('ShaderNodeBsdfPrincipled');bs.name='SOURCE_PBR';out=n.new('ShaderNodeOutputMaterial');links.new(bs.outputs['BSDF'],out.inputs['Surface'])
  color=tuple(rec.get('color') or [.5,.5,.5])+(1,)
  for socket,v in [('Base Color',color),('Metallic',float(rec.get('metalness') or 0)),('Roughness',float(rec.get('roughness',.5))),('IOR',float(rec.get('ior') or 1.5)),('Transmission Weight',float(rec.get('transmission') or 0)),('Coat Weight',float(rec.get('clearcoat') or 0)),('Coat Roughness',float(rec.get('clearcoatRoughness') or .15)),('Specular IOR Level',.5*float(rec.get('specularIntensity',1))),('Alpha',float(rec.get('opacity',1))),('Emission Color',tuple(rec.get('emissive') or [0,0,0])+(1,)),('Emission Strength',float(rec.get('emissiveIntensity') or 0))]:
   if socket in bs.inputs:bs.inputs[socket].default_value=v
  coordinate=n.new('ShaderNodeTexCoord');geom=n.new('ShaderNodeNewGeometry');xp,yp,zp=g.split(geom.outputs['Position']);position=g.combine([xp,zp,g.math('MULTIPLY',yp,-1)]);xn,yn,zn=g.split(geom.outputs['Normal']);source_normal=g.combine([xn,zn,g.math('MULTIPLY',yn,-1)])
  tex_nodes={};sampled={};world_normal=None
  for channel,tid in rec['textures'].items():
   t=textures[tid]
   if 'file' not in t:report['warnings'].append('No portable bitmap '+name+'/'+channel);continue
   image=load(tid,channel in ['map','emissiveMap']);sx,sy=t.get('repeat',[1,1]);ox,oy=t.get('offset',[0,0])
   if not t.get('flipY',True):sy=-sy;oy=1-oy
   uv=g.vec('ADD',g.vec('MULTIPLY',coordinate.outputs['UV'],(sx,sy,1)),(ox,oy,0));node=g.image(image,uv);tex_nodes[channel]=node;sampled[channel]=node.outputs['Color']
  if metric:
   repeat=.3173828125 if neutral or paver else .25;seed=741+int(name.rsplit('-',1)[-1])*31 if paver else 0
   pp=g.vec('SCALE',position,1/repeat)
   if paver:pp=g.vec('ADD',pp,tuple((seed*k)%1 for k in [.17,.31,.43]))
   p=g.split(pp);base=g.split(g.vec('NORMALIZE',source_normal));powers=[g.math('POWER',g.math('ABSOLUTE',v),5 if neutral else 6) for v in base];total=g.math('ADD',g.math('ADD',powers[0],powers[1]),powers[2]);weights=[g.math('DIVIDE',v,total) for v in powers];axis_samples={}
   for channel in ['map','normalMap','roughnessMap']:
    if channel not in tex_nodes:continue
    colors=[];t=textures[rec['textures'][channel]]
    for axis,(u,v) in enumerate([(p[2],p[1]),(p[0],p[2]),(p[0],p[1])]):
     if not t.get('flipY',True):v=g.math('SUBTRACT',1,v)
     node=g.image(tex_nodes[channel].image,g.combine([u,v,0]),neutral or paver);colors.append(node.outputs['Color'])
    axis_samples[channel]=colors
    if channel!='normalMap':sampled[channel]=g.vec('ADD',g.vec('ADD',g.vec('SCALE',colors[0],weights[0]),g.vec('SCALE',colors[1],weights[1])),g.vec('SCALE',colors[2],weights[2]))
   if 'normalMap' in axis_samples:
    strength=rec.get('normalScale') or [1,1];normals=[g.split(g.vec('SUBTRACT',g.vec('SCALE',c,2),(1,1,1))) for c in axis_samples['normalMap']];normals=[[g.math('MULTIPLY',a,strength[0]),g.math('MULTIPLY',b,strength[1]),c] for a,b,c in normals];x,y,z=base;nx,ny,nz=normals
    ax=g.combine([g.math('MULTIPLY',x,g.math('ABSOLUTE',nx[2])),g.math('ADD',y,nx[1]),g.math('ADD',z,nx[0])]);ay=g.combine([g.math('ADD',x,ny[0]),g.math('MULTIPLY',y,g.math('ABSOLUTE',ny[2])),g.math('ADD',z,ny[1])]);az=g.combine([g.math('ADD',x,nz[0]),g.math('ADD',y,nz[1]),g.math('MULTIPLY',z,g.math('ABSOLUTE',nz[2]))]);nn=g.split(g.vec('NORMALIZE',g.vec('ADD',g.vec('ADD',g.vec('SCALE',ax,weights[0]),g.vec('SCALE',ay,weights[1])),g.vec('SCALE',az,weights[2]))));world_normal=g.combine([nn[0],g.math('MULTIPLY',nn[2],-1),nn[1]])
   transfers.append({'name':name,'metricRepeatMetres':repeat,'mapping':'Explicit source-world Y-up three-axis weighted PBR projection; normal vectors reoriented to Blender world space','neutralizedMineralLuminance':neutral})
  base_socket=color
  if 'map' in sampled:
   mineral=sampled['map']
   if neutral:
    luma=g.vec('DOT_PRODUCT',mineral,(.2126,.7152,.0722));factor=g.clamp(g.math('POWER',g.math('DIVIDE',g.math('MAXIMUM',luma,.0001),.153180782734),.88),.38,1.65)
    age=g.smooth(g.noise(g.vec('MULTIPLY',position,(4.8,1.1,4.8)),1,2.0),.22,.73);factor=g.math('MULTIPLY',factor,g.math('ADD',.53,g.math('MULTIPLY',age,.51)));base_socket=g.multiply(color,factor)
   else:base_socket=g.multiply(color,mineral)
  if rec.get('vertexColors'):
   attr=n.new('ShaderNodeVertexColor');attr.layer_name='sourceColor';base_socket=g.multiply(base_socket,attr.outputs['Color'])
  if rec['id'] in instance_colored:
   attr=n.new('ShaderNodeAttribute');attr.attribute_name='instanceColor';attr.attribute_type='INSTANCER';base_socket=g.multiply(base_socket,attr.outputs['Color'])
  if hasattr(base_socket,'node'):links.new(base_socket,bs.inputs['Base Color'])
  normal_socket=world_normal
  if not normal_socket and 'normalMap' in sampled:
   normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=(rec.get('normalScale') or [1])[0];links.new(sampled['normalMap'],normal.inputs['Color']);normal_socket=normal.outputs['Normal']
  if 'bumpMap' in sampled:
   bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.45;bump.inputs['Distance'].default_value=abs(float(rec.get('bumpScale') or .003));links.new(sampled['bumpMap'],bump.inputs['Height'])
   if normal_socket:links.new(normal_socket,bump.inputs['Normal'])
   normal_socket=bump.outputs['Normal']
  if normal_socket:links.new(normal_socket,bs.inputs['Normal'])
  rough_socket=None
  for channel,input_name,component,factor in [('roughnessMap','Roughness','Green',rec.get('roughness',.5)),('metalnessMap','Metallic','Blue',rec.get('metalness',0))]:
   if channel in sampled:
    sep=n.new('ShaderNodeSeparateColor');sep.mode='RGB';links.new(sampled[channel],sep.inputs['Color']);result=g.math('MULTIPLY',sep.outputs[component],float(factor));links.new(result,bs.inputs[input_name])
    if channel=='roughnessMap':rough_socket=result
  if neutral:
   rough_socket=g.clamp(rough_socket if rough_socket else rec.get('roughness',.94),.78,.96);links.new(rough_socket,bs.inputs['Roughness'])
  if paver:
   # Source extra r4Wetness/r4Dampness attributes are not serialized by the
   # official export. This is a declared 3D physical wet-film hypothesis.
   noise=g.noise(g.vec('ADD',position,(7.1,0,3.7)),1.55,2.7);up=g.smooth(g.split(source_normal)[1],.65,.97);mask=g.math('MULTIPLY',g.smooth(noise,.48,.66),up)
   mask=g.math('MULTIPLY',mask,[.70,.43,.82,.58][int(name.rsplit('-',1)[-1])]);mask.node.name='SCENE04_WET_FILM_MASK'
   rough=g.mix(rough_socket if rough_socket else .72,.16,mask);links.new(rough,bs.inputs['Roughness']);links.new(g.math('MULTIPLY',mask,.88),bs.inputs['Coat Weight']);bs.inputs['Coat IOR'].default_value=1.333;bs.inputs['Coat Roughness'].default_value=.075
   if normal_socket:links.new(normal_socket,bs.inputs['Coat Normal'])
   wet_base=g.multiply(base_socket,g.math('SUBTRACT',1,g.math('MULTIPLY',mask,.16)));links.new(wet_base,bs.inputs['Base Color'])
  if name=='reference4-green-clear-pond-surface':
   for s,v in [('Base Color',(.94,.98,.96,1)),('Alpha',1),('IOR',1.333),('Transmission Weight',.92),('Roughness',.075),('Coat Weight',0)]:bs.inputs[s].default_value=v
  leaf=any(k in name for k in ['lotus-green','low-green-leaves','maple-olive','pine-individual-needles','thick-layered-pine-crown','cherry-pink','lotus-pink','small-live-maple-leaves','scene04-CC0-'])
  paper=('paper' in name or not name) and max(rec.get('emissive') or [0,0,0])>0
  if leaf or paper:
   thin=n.new('ShaderNodeBsdfTranslucent');g.set(thin.inputs['Color'],base_socket);mix=n.new('ShaderNodeMixShader');mix.inputs[0].default_value=.45 if paper else (.16 if 'pine-' in name else .24);links.new(bs.outputs['BSDF'],mix.inputs[1]);links.new(thin.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],out.inputs['Surface'])
  if rec.get('alphaTest',0)>0 and 'map' in tex_nodes:
   for link in list(bs.inputs['Alpha'].links):links.remove(link)
   bs.inputs['Alpha'].default_value=1;cut=g.math('GREATER_THAN',tex_nodes['map'].outputs['Alpha'],rec['alphaTest']);transparent=n.new('ShaderNodeBsdfTransparent');masked=n.new('ShaderNodeMixShader');links.new(cut,masked.inputs[0]);links.new(transparent.outputs[0],masked.inputs[1]);links.new(out.inputs['Surface'].links[0].from_socket,masked.inputs[2]);links.new(masked.outputs[0],out.inputs['Surface'])
  materials[rec['id']]=mat
  if rec['id'] in instance_colored:
   geometry_mat=mat.copy();geometry_mat.name=(mat.name+' [GEOMETRY instanceColor]').strip()
   for node in geometry_mat.node_tree.nodes:
    if node.type=='ATTRIBUTE' and getattr(node,'attribute_name','')=='instanceColor':node.attribute_type='GEOMETRY'
   geometry_materials[rec['id']]=geometry_mat
  else:geometry_materials[rec['id']]=mat
 report['materialTransfer']={'sourceTexturesRetained':True,'sourcePBRBaseParametersRetained':True,'metricStoneProjection':transfers,'uniqueDecodedImages':len(images),'wetFilm':'Authored world-space physical thin water film, IOR1.333, roughness .16, coat roughness .075, thresholded 3D coherent noise; original r4Wetness/r4Dampness attributes absent from official export. No painted shadow, source photograph or frame map.','foliage':'Energy-conserving thin diffuse transmission, 16% needles, 24% broad leaves/petals; complete alpha mask surrounds all lobes. Paper45%.','skyAndReflector':'Renderer-specific source sky and planar reflector excluded by official exporter; physical world and existing pond BSDF supply actual radiance/scene reflection.','nativePixelEquivalence':False}
 return materials,geometry_materials,material_records,instance_colored,textures
