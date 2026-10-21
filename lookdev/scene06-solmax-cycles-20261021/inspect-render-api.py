import bpy,json
from pathlib import Path
bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.render.engine='CYCLES';s.view_layers[0].cycles.denoising_store_passes=True
tr=bpy.data.node_groups.new('Scene06 controlled same-sample comparison','CompositorNodeTree');s.compositing_node_group=tr
out=tr.nodes.new('CompositorNodeOutputFile');den=tr.nodes.new('CompositorNodeDenoise');rl=tr.nodes.new('CompositorNodeRLayers')
def info(obj):
 result={}
 for p in obj.bl_rna.properties:
  if p.identifier in ['rna_type','bl_rna']:continue
  if any(w in p.identifier for w in ['file','base','path','directory','format','slot','item','prefilter','quality','media','mode']):
   try:v=getattr(obj,p.identifier);v=list(v) if hasattr(v,'__iter__') and not isinstance(v,(str,bytes)) else str(v)
   except Exception as e:v=str(e)
   result[p.identifier]={'type':p.type,'description':p.description,'value':v}
 return result
r={'blender':bpy.app.version_string,'outputNode':info(out),'outputInputs':list(out.inputs.keys()),'outputFunctions':[f.identifier for f in out.bl_rna.functions],'denoiseNode':info(den),'denoiseInputs':list(den.inputs.keys()),'renderOutputs':list(rl.outputs.keys())}
for name in ['file_slots','layer_slots','file_output_items']:
 if hasattr(out,name):
  c=getattr(out,name);r[name]={'type':str(type(c)),'functions':[f.identifier+': '+f.description for f in c.bl_rna.functions] if hasattr(c,'bl_rna') else dir(c)}
r['newParameters']=[{'name':v.identifier,'type':v.type,'is_output':v.is_output,'enum':[e.identifier for e in v.enum_items] if v.type=='ENUM' else []} for v in out.file_output_items.bl_rna.functions['new'].parameters]
try:
 item=out.file_output_items.new('RGBA','raw');r['newItem']=info(item);r['newInputs']=list(out.inputs.keys())
except Exception as e:r['newItemError']=str(e)
r['formatFields']=[{'name':v.identifier,'type':v.type,'enum':[e.identifier for e in v.enum_items] if v.type=='ENUM' else []} for v in out.format.bl_rna.properties]
try:
 item.override_node_format=True;item.format.file_format='PNG';r['itemPngOverride']='accepted'
except Exception as e:r['itemPngOverride']=str(e)
try:
 out.format.file_format='PNG';r['nodePngAfterItem']='accepted'
except Exception as e:r['nodePngAfterItem']=str(e)
p=Path(__file__).resolve().parent/'render-api-inspection.json';p.write_text(json.dumps(r,indent=2,default=str));print(json.dumps(r,indent=2,default=str))
