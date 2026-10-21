"""Exact POINT material-state transfer from the official all-attribute export.

Source geometry/UV hashes and read-back hashes distinguish actual field transfer
from a replacement mask. instanceColor belongs to the independent instancer
path and is deliberately never assigned by this module.
"""
import hashlib, json
import numpy as np

def sha(values):return hashlib.sha256(np.ascontiguousarray(values)).hexdigest()

class VertexTransfer:
 def __init__(self,root,scene_data,report):
  self.root=root;self.report=report;self.entries=[];self.source_geometry={};self.field_vertices={};self.fallbacks=0;self.uv_checked=0;self.custom_checked=0
  self.source_materials={m['id']:m['name'] for m in scene_data['materials']}
  self.counts={name:sum(name in g['attributes'] for g in scene_data['geometries']) for name in ['r4Wetness','r4Dampness','uv1','color_1']}
  if min(self.counts['r4Wetness'],self.counts['r4Dampness'])<5:raise ValueError('Fresh complete wet-state export required; refuse old export')
 def attach(self,mesh,g,data,material_ids,material_records,tiles=1,expected_loop_uv=None):
  vcount=len(mesh.vertices);source_count=len(data['position']);entry={'sourceGeometry':g['id'],'blenderMesh':mesh.name,'sourcePointCount':source_count,'importedPointCount':vcount,'tiledAffineCopies':tiles,'materials':[material_records[mid]['name'] for mid in material_ids],'fields':{}}
  if vcount!=source_count*tiles:raise ValueError('Source mesh/attribute correspondence failed '+g['id'])
  if g['id'] not in self.source_geometry:
   self.source_geometry[g['id']]={'pointCount':source_count,'attributes':{name:{'sha256':sha(values),'sourceFile':g['attributes'][name]['file'],'sourceType':g['attributes'][name]['type'],'sourceNormalized':g['attributes'][name].get('sourceNormalized',False),'itemSize':g['attributes'][name]['itemSize'],'shape':list(values.shape)} for name,values in data.items() if name!='index'},'indexSemanticInt64Sha256':sha(data['index'])}
  mesh['sourceGeometryId']=g['id'];mesh['sourcePositionSha256']=self.source_geometry[g['id']]['attributes']['position']['sha256'];mesh['sourceUVSha256']=self.source_geometry[g['id']]['attributes'].get('uv',{}).get('sha256','')
  if expected_loop_uv is not None:
   layer=mesh.uv_layers.get('sourceUV');actual=np.empty(expected_loop_uv.size,dtype=np.float32);layer.data.foreach_get('uv',actual);actual=actual.reshape(-1,2);want=np.asarray(expected_loop_uv,dtype=np.float32)
   if sha(actual)!=sha(want):raise ValueError('Exact sourceUV loop mapping failed '+g['id'])
   entry['sourceUV']={'domain':'CORNER','mapping':'Original source POINT UV indexed by the actual imported face corners; no UV refit','expectedLoopSha256':sha(want),'importedLoopSha256':sha(actual),'exactMatch':True};self.uv_checked+=1
  # Preserve scalar wet-state values and all extra source vertex attributes.
  # sourceColor is kept as POINT FloatColor, independently of instanceColor.
  names=[name for name in data if name not in ['index','position','normal','uv']]
  needs_wet=any(material_records[mid]['name'].startswith('metre-scaled-worn-wet-paver-') for mid in material_ids)
  for name in ['r4Wetness','r4Dampness']:
   if name not in names and needs_wet:names.append(name)
  for name in names:
   if name=='instanceColor':raise ValueError('Instance color must stay in the separate INSTANCER transfer')
   original=data.get(name);fallback=original is None;values=np.zeros((source_count,1),dtype=np.float32) if fallback else np.asarray(original,dtype=np.float32)
   if tiles>1:values=np.tile(values,(tiles,1))
   size=values.shape[1];target='sourceColor' if name=='color' else name
   if size==1:
    attr=mesh.attributes.get(target) or mesh.attributes.new(name=target,type='FLOAT',domain='POINT');attr.data.foreach_set('value',values.ravel());actual=np.empty(vcount,dtype=np.float32);attr.data.foreach_get('value',actual);actual=actual.reshape(-1,1)
   elif name.startswith('color') or size==4:
    packed=np.ones((vcount,4),dtype=np.float32);packed[:,:size]=values;attr=mesh.color_attributes.get(target) or mesh.color_attributes.new(name=target,type='FLOAT_COLOR',domain='POINT');attr.data.foreach_set('color',packed.ravel());actual=np.empty((vcount,4),dtype=np.float32);attr.data.foreach_get('color',actual.ravel());actual=actual[:,:size]
   elif size in [2,3]:
    packed=np.zeros((vcount,3),dtype=np.float32);packed[:,:size]=values;attr=mesh.attributes.get(target) or mesh.attributes.new(name=target,type='FLOAT_VECTOR',domain='POINT');attr.data.foreach_set('vector',packed.ravel());actual=np.empty((vcount,3),dtype=np.float32);attr.data.foreach_get('vector',actual.ravel());actual=actual[:,:size]
   else:raise ValueError('Unsupported source POINT field '+name+' itemSize'+str(size))
   expected_hash=sha(values);actual_hash=sha(actual)
   if expected_hash!=actual_hash:raise ValueError('Source POINT field read-back failed '+g['id']+'/'+name)
   record={'blenderName':target,'domain':attr.domain,'dataType':attr.data_type,'itemSize':size,'expectedFloat32Sha256':expected_hash,'importedFloat32Sha256':actual_hash,'exactMatch':True,'dryDefault':fallback}
   if name in ['r4Wetness','r4Dampness']:
    if attr.domain!='POINT' or attr.data_type!='FLOAT':raise ValueError('Wet fields must be POINT FLOAT')
    if not np.all(np.isfinite(values)):raise ValueError('Nonfinite source material state')
    record.update(minimum=float(values.min()),maximum=float(values.max()),mean=float(values.mean(dtype=np.float64)),nonzeroFraction=float(np.count_nonzero(values)/values.size));self.field_vertices[name]=self.field_vertices.get(name,0)+vcount
   entry['fields'][name]=record;self.custom_checked+=1;self.fallbacks+=int(fallback)
  self.entries.append(entry)
 def finish(self,path):
  summary={'sourceGeometryFields':self.counts,'verifiedUVLayers':self.uv_checked,'verifiedCustomAttributes':self.custom_checked,'wetFieldPointCounts':self.field_vertices,'dryDefaultsCreated':self.fallbacks,'allReadBackHashesMatch':True,'instanceColor':'Not touched here; source instancer POINT colors feed INSTANCER shader attribute. Direct/exact-affine copies use the separate GEOMETRY material variant.','missingWetFieldResponse':'Zero. If a wet material is attached to geometry without the fields, explicit POINT FLOAT zero attributes are created. Other materials remain dry/default and do not read wet state.'}
  path.write_text(json.dumps({'sourceHash':self.report['sourceHash'],'summary':summary,'originalGeometryAttributes':self.source_geometry,'importedMeshes':self.entries},indent=2)+'\n')
  self.report['vertexAttributeTransfer']={'manifest':path.name,**summary}
