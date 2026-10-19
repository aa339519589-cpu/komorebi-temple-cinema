"""Read the one existing float probe; no render and no resampling."""
import bpy,math,json
import numpy as np
from pathlib import Path
p=Path('output/scene04-nishita-coupled/native-nishita-world-unit-gain.exr').resolve()
image=bpy.data.images.load(str(p));image.colorspace_settings.name='Linear Rec.709'
w,h=image.size;a=np.empty(w*h*4,dtype=np.float32);image.pixels.foreach_get(a);rgb=a.reshape(h,w,4)[:,:,:3];luma=rgb@np.asarray([.2126,.7152,.0722],dtype=np.float32)
y,x=np.unravel_index(np.argmax(luma),luma.shape);phi=math.pi-2*math.pi*(x+.5)/w;altitude=math.pi*((y+.5)/h-.5)
world=bpy.data.worlds.new('metadata-only');world.use_nodes=True;sky=world.node_tree.nodes.new('ShaderNodeTexSky');enums=[i.identifier for i in sky.bl_rna.properties['sky_type'].enum_items]
sky.sky_type=next(i for i in ['NISHITA','SINGLE_SCATTERING'] if i in enums);initial=sky.sun_rotation;sky.sun_rotation=-2.512
record={'probeFile':str(p),'size':[w,h],'peakPixel':[int(x),int(y)],'peakRGB':rgb[y,x].tolist(),'peakLuminance':float(luma[y,x]),'directionAssumingIdentityCyclesPanorama':[math.cos(altitude)*math.cos(phi),math.cos(altitude)*math.sin(phi),math.sin(altitude)],'peakAzimuthDegrees':math.degrees(phi),'peakElevationDegrees':math.degrees(altitude),'skyEnum':sky.sky_type,'rotationDefault':initial,'negativeRotationAttempt':-2.512,'negativeRotationActual':sky.sun_rotation,'rotationHardRange':[sky.bl_rna.properties['sun_rotation'].hard_min,sky.bl_rna.properties['sun_rotation'].hard_max],'newEnvironmentSamples':0,'newFullFrames':0}
Path('lookdev/scene04-nishita-coupled/results/coordinate-check01/audit.json').write_text(json.dumps(record,indent=2)+'\n');print('EXISTING_PROBE_AUDIT',json.dumps(record),flush=True)
