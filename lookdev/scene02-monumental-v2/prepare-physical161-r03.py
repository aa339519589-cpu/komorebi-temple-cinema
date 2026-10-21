from pathlib import Path
import json
base=Path('lookdev/scene02-monumental-v2');s=(base/'render-physical160.py').read_text();s=s.replace("str(HERE/'export')", "str(HERE/'export-r03')").replace("str(HERE/'cycles-r01')", "str(HERE/'cycles-r03')")
s=s.replace("'scene02-pagoda-worn-vermilion160'}", "'scene02-pagoda-worn-vermilion160','scene02-bridge-weathered-vermilion161','scene02-bridge-worn-tread-timber161'}")
s=s.replace("float(os.environ.get('CYCLES_SUN_ENERGY','8.5'))", "float(os.environ.get('CYCLES_SUN_ENERGY','4.5'))").replace("float(os.environ.get('CYCLES_EXPOSURE','.4'))", "float(os.environ.get('CYCLES_EXPOSURE','.1'))")
s=s.replace('cam_data.clip_end=300','cam_data.clip_end=20000').replace('verts=[];radius=220','verts=[];radius=5000')
needle="sky_image.colorspace_settings.name='Non-Color';sky_image.pixels.foreach_set(pixels.reshape(-1))"
replace=needle+"""
# Generated float pixels are not retained by a .blend save unless packed.
# Store real HDR bytes, verify decoding and pack those bytes for replay.
sky_path=OUT/'authored-source-atmosphere161.exr';sky_image.filepath_raw=str(sky_path);sky_image.file_format='OPEN_EXR';sky_image.save();sky_image.pack();assert sky_image.packed_file and sky_image.packed_file.size>0
verify_image=bpy.data.images.load(str(sky_path),check_existing=False);verify_image.colorspace_settings.name='Non-Color';decoded=np.empty(width*height*4,dtype=np.float32);verify_image.pixels.foreach_get(decoded);decoded=decoded.reshape(height,width,4);assert np.isfinite(decoded).all() and float(decoded[:,:,:3].max())>2 and float(decoded[:,:,:3].mean())>.1
report['portableSkyHDR']={'path':str(sky_path),'sha256':hashlib.sha256(sky_path.read_bytes()).hexdigest(),'packedBytes':sky_image.packed_file.size,'decodedMaxLinearRGB':float(decoded[:,:,:3].max()),'decodedMeanLinearRGB':float(decoded[:,:,:3].mean()),'maximumSourceVsDecodedAbsoluteRGBError':float(np.max(np.abs(decoded[:,:,:3]-pixels[:,:,:3]))),'storageVerifiedBeforeRender':True};bpy.data.images.remove(verify_image)
"""
assert needle in s;s=s.replace(needle,replace)
# Metric physical ripple in place of the native screen-space reflection offset.
s=s.replace("        value(bs,['Metallic'],0);value(bs,['IOR'],1.333);value(bs,['Roughness'],.065);value(bs,['Transmission Weight','Transmission'],.55);value(bs,['Coat Weight','Clearcoat'],.28);value(bs,['Coat Roughness','Clearcoat Roughness'],.045)", """        value(bs,['Metallic'],0);value(bs,['IOR'],1.333);value(bs,['Roughness'],.038);value(bs,['Transmission Weight','Transmission'],.55);value(bs,['Coat Weight','Clearcoat'],.28);value(bs,['Coat Roughness','Clearcoat Roughness'],.045)
        for link in list(bs.inputs['Normal'].links):links.remove(link)
        geo=n.new('ShaderNodeNewGeometry');wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='DIAGONAL';wave.wave_profile='SIN';wave.inputs['Scale'].default_value=6;wave.inputs['Distortion'].default_value=4;wave.inputs['Detail'].default_value=3;wave.inputs['Detail Scale'].default_value=1.7;links.new(geo.outputs['Position'],wave.inputs['Vector']);ripple=n.new('ShaderNodeBump');ripple.inputs['Strength'].default_value=.45;ripple.inputs['Distance'].default_value=.0016;links.new(wave.outputs['Color'],ripple.inputs['Height']);links.new(ripple.outputs['Normal'],bs.inputs['Normal'])""")
s=s.replace("scene02-current-source-physical160", "scene02-current-source-physical161-r03")
s=s.replace("roughness.065", "roughness.038, plus actual world-metric 0.17m ripples with1.6mm normal distance instead of the native screen-space offset")
s=s.replace("scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','32'))", "scene.cycles.samples=int(os.environ.get('CYCLES_SAMPLES','64'))")
# Preserve the main camera in the saved .blend. Detail is only an actual ray
# subfrustum in a second independently rendered image.
needle="report['render']=str(render);report['renderSha256']"
a=s.index(needle)
s=s[:a]+"""report['full']={'path':str(render),'sha256':hashlib.sha256(render.read_bytes()).hexdigest(),'resolution':[scene.render.resolution_x,scene.render.resolution_y],'samples':scene.cycles.samples}
if os.environ.get('CYCLES_TRUE_GABLE','1')=='1':
    original_lens=cam_data.lens;frame=[v.copy() for v in cam_data.view_frame(scene=scene)];slopes=np.asarray([(v.x/-v.z,v.y/-v.z) for v in frame]);l,b=slopes.min(axis=0);r,t=slopes.max(axis=0);x,y,size,full=590,180,340,1254;desired=np.array([l+(r-l)*x/full,r-(r-l)*(full-x-size)/full,b+(t-b)*(full-y-size)/full,t-(t-b)*y/full]);cam_data.lens*=full/size
    def bounds():
        a=np.asarray([(v.x/-v.z,v.y/-v.z) for v in cam_data.view_frame(scene=scene)]);lo=a.min(axis=0);hi=a.max(axis=0);return np.array([lo[0],hi[0],lo[1],hi[1]])
    initial=bounds();cam_data.shift_x=1;dx=(bounds()-initial)[0];cam_data.shift_x=0;cam_data.shift_y=1;dy=(bounds()-initial)[2];cam_data.shift_y=0;cam_data.shift_x=float((desired[0]-initial[0])/dx);cam_data.shift_y=float((desired[2]-initial[2])/dy);error=float(np.max(np.abs(bounds()-desired)));assert error<2e-6
    scene.cycles.samples=48;detail=OUT/'scene02-true-gable-physical161-r03.png';scene.render.filepath=str(detail);bpy.ops.render.render(write_still=True);report['trueGable']={'path':str(detail),'sha256':hashlib.sha256(detail.read_bytes()).hexdigest(),'cropInSourcePixels':[x,y,size,full],'nativeResolution':[1254,1254],'samples':48,'sourceCameraMatrixUnchanged':True,'maximumRaySlopeError':error,'upsampledScreenshot':False};cam_data.lens=original_lens;cam_data.shift_x=cam_data.shift_y=0
"""+s[a:]
(base/'render-physical161-r03.py').write_text(s)
(base/'cycles-r02/rejected-review.json').write_text(json.dumps({'status':'rejected-physical-review','reason':'On reopening the r01 .blend, the generated float atmosphere had not been packed and reloaded as black. Geometry/UV/instanceRGB transfer and evaluated GN matrices remain valid; the r02 image is not a usable lighting/fidelity candidate.','preservedGNMatrixAuditMaxAbsoluteError':9.5367431640625e-7,'repair':'Fresh current-source import in r03 writes HDR OpenEXR bytes, verifies decoded linear range and packs the image before render and save.','visualAccepted':False},indent=2)+'\n')
