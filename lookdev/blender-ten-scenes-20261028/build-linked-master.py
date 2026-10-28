import bpy,resource,json,os
from pathlib import Path
base=Path('/Users/mima1234/Desktop/寺院十景 Blender 工程')
files=['06-寺院场景.blend','05-寺院场景.blend','07-寺院场景.blend','04-寺院场景.blend','10-寺院场景.blend','03-寺院场景.blend','02-寺院场景.blend','09-寺院场景.blend','01-廊下夕照.blend','08-寺院场景.blend']
bpy.ops.wm.read_factory_settings(use_empty=False)
for obj in list(bpy.data.objects):bpy.data.objects.remove(obj,do_unlink=True)
scene=bpy.context.scene;scene.name='00 · 十景总入口'
nt=bpy.data.node_groups.new('十景场景索引','CompositorNodeTree');scene.compositing_node_group=nt
# Save location first so external links can be relative to the project folder.
out=base/'00-寺院十景总工程.blend';bpy.ops.wm.save_as_mainfile(filepath=str(out),compress=True)
for file in files:
 before=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
 if before>18*1024**3:raise RuntimeError('Memory reserve: use independent scene files; no further linking.')
 with bpy.data.libraries.load(str(base/file),link=True,relative=True) as (src,dst):
  if len(src.scenes)!=1: raise RuntimeError('Unexpected scene inventory '+file)
  dst.scenes=list(src.scenes)
 linked=dst.scenes[0]
 node=nt.nodes.new('CompositorNodeRLayers');node.scene=linked;node.label=linked.name;node.name=linked.name
 print('LINKED',file,'scene',linked.name,'peakRSS',resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,flush=True)
scene['说明']='十景作为链接场景保存在同一文件夹。右上角场景下拉菜单可切换查看；要编辑模型请打开对应编号的独立 .blend。'
bpy.ops.wm.save_as_mainfile(filepath=str(out),compress=True)
print('MASTER_SAVED',str(out),'scenes',len(bpy.data.scenes),flush=True)
