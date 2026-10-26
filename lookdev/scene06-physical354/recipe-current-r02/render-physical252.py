"""One actual source-camera1254 Cycles frame. Run ONLY by official GPU FIFO.

Root must first supply and approve the exact merged table/room source/export.
No old default package, selected Blend, substitute geometry or scene image.
"""
import os, sys, json, math, hashlib, time, traceback, tempfile, subprocess, re, resource, gc
from pathlib import Path

HERE = Path(__file__).resolve().parent
owner = json.loads((Path(tempfile.gettempdir())/'komorebi-reconstruction-gpu-slot'/'owner.json').read_text())
if owner.get('pid') != os.getppid() or owner.get('label') != 'blender-'+Path(__file__).name:
    raise RuntimeError('Blender import/render must be the child of tools/run-blender-queued.mjs holding the official GPU slot')
import bpy
import numpy as np
from mathutils import Matrix, Vector
sys.path.insert(0, str(HERE))
from geometry252 import SourceBuffers, full_transforms, triangle_area, closed_geometry, import_geometry
from materials252 import material_library

SETTINGS_PATH = Path(os.environ['PHYSICAL252_SETTINGS']).resolve()
VERIFICATION_PATH = Path(os.environ['PHYSICAL252_VERIFICATION']).resolve()
settings = json.loads(SETTINGS_PATH.read_text()); verification = json.loads(VERIFICATION_PATH.read_text())
root = Path(settings['exportDirectory']).resolve(); out = Path(settings['outputDirectory']).resolve()
if not out.is_relative_to(HERE) or out.exists(): raise RuntimeError('Use a fresh physical252 output directory; preserve all previous evidence')
out.mkdir(parents=True)
digest = lambda b: hashlib.sha256(b).hexdigest()
recipe_files = ['render-physical252.py', 'materials252.py', 'geometry252.py']
recipe_hash = digest(json.dumps([[name, digest((HERE/name).read_bytes())] for name in recipe_files], separators=(',', ':')).encode())
if settings.get('rootReviewedRecipeSha256') != recipe_hash: raise RuntimeError('Exact complete recipe must first be reviewed by Root')
package_bytes = (root/'scene.json').read_bytes(); export_bytes = (root/'export-report.json').read_bytes()
package = json.loads(package_bytes); source_report = json.loads(export_bytes)
if source_report['status'] != 'exported-existing-geometry' or source_report['errors']: raise RuntimeError('Source export is not complete')
if source_report['sourceHash'] != settings['expectedSourceHash'] or verification['sourceHash'] != source_report['sourceHash']: raise RuntimeError('Exact new source pin mismatch')
if digest(package_bytes) != verification['manifestSha256'] or digest(export_bytes) != verification['exportReportSha256']: raise RuntimeError('Verified package metadata changed')
if verification['status'] != 'all-payloads-and-resource-budget-verified' or not verification['allPayloadsVerified']: raise RuntimeError('Complete payload and resource verification required')
if package['view']['reference'] != 6 or package['physical252']['schema'] != 'physical252-native-optics-v1': raise RuntimeError('Exact Scene06 native-optics contract missing')
disk = os.statvfs(HERE); free = disk.f_bavail*disk.f_frsize
if free < settings['storage']['minimumRenderStartFreeBytes']: raise RuntimeError('Insufficient actual free space before importing')
if settings['render']['frames'] != 1 or settings['render']['saveBlend'] or settings['render']['size'] != 1254: raise RuntimeError('One1254 frame, no Blend boundary changed')
report = {'status': 'importing', 'sourceHash': source_report['sourceHash'], 'sourceCommit': source_report['sourceCommit'], 'sourceStatistics': package['statistics'], 'manifestSha256': digest(package_bytes), 'exportReportSha256': digest(export_bytes), 'verificationSha256': digest(VERIFICATION_PATH.read_bytes()), 'settingsSha256': digest(SETTINGS_PATH.read_bytes()), 'recipeSha256': recipe_hash, 'recipeFiles': {name: digest((HERE/name).read_bytes()) for name in recipe_files}, 'startedAt': time.time(), 'blender': bpy.app.version_string, 'actualStartFreeBytes': free, 'nativePixelEquivalence': False, 'photographicAccepted': False, 'geometryRebuilt': False, 'blendSaved': False, 'sourceAttribution': package['physical252'].get('sourceAttribution'), 'license': 'CC-BY-NC-SA-4.0; original component-specific attribution retained', 'personalNoncommercialUseOnly': True, 'warnings': []}
def save_report(): (out/'report.json').write_text(json.dumps(report, indent=2)+'\n')
save_report()
def exception(kind, value, trace):
    report['status'] = 'failed'; report['error'] = ''.join(traceback.format_exception(kind, value, trace)); save_report(); sys.__excepthook__(kind, value, trace)
sys.excepthook = exception
vm_text=subprocess.check_output(['vm_stat'],text=True);page_size=int(re.search(r'page size of (\d+) bytes',vm_text).group(1));available=sum(int(re.search(label+r':\s+(\d+)',vm_text).group(1)) for label in ['Pages free','Pages inactive','Pages speculative'])*page_size
report['actualImportMemoryAvailableBytes']=available
if available<verification['memory']['estimatedResidentBytes']+settings['memory']['minimumOtherAvailableReserveBytes']: raise RuntimeError('Actual available/reclaimable memory changed below full exact import budget')
save_report()
if bpy.app.version<(5,2,0): raise RuntimeError('This full-float point custom_normal representation requires reviewed Blender5.2+ interface')
bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene

def configure_cycles_backend354(target):
    requested = settings['render']['device']
    if requested == 'CPU':
        import _cycles
        if verification['memory'].get('backend') != 'CPU_EMBREE_COMPACT' or not _cycles.with_embree:
            raise RuntimeError('Reviewed CPU compact budget and an actual Embree-enabled build are required')
        target.cycles.device = 'CPU'; target.cycles.debug_bvh_layout = 'EMBREE'; target.cycles.debug_use_compact_bvh = True; target.cycles.debug_use_spatial_splits = False
        _cycles.debug_flags_update(target.as_pointer())
        if target.cycles.device != 'CPU' or target.cycles.debug_bvh_layout != 'EMBREE' or not target.cycles.debug_use_compact_bvh:
            raise RuntimeError('Actual CPU compact backend differs from the verified memory model')
    elif requested == 'METAL':
        if verification['memory'].get('backend', 'METAL') != 'METAL': raise RuntimeError('Metal render cannot use a CPU-only memory budget')
        prefs = bpy.context.preferences.addons['cycles'].preferences; prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for device in prefs.devices: device.use = device.type == 'METAL'
        if not any(d.use for d in prefs.devices): raise RuntimeError('No Metal device; no automatic backend fallback')
        target.cycles.device = 'GPU'
    else: raise RuntimeError('Unreviewed explicit render backend: '+str(requested))
    target.render.use_persistent_data = False

configure_cycles_backend354(scene)
report['backend354'] = {'requested': settings['render']['device'], 'actualDevice': scene.cycles.device, 'bvhLayout': scene.cycles.debug_bvh_layout, 'compactBVH': scene.cycles.debug_use_compact_bvh, 'spatialSplits': scene.cycles.debug_use_spatial_splits, 'persistentData': scene.render.use_persistent_data, 'memoryBackend': verification['memory'].get('backend', 'METAL'), 'automaticFallback': False, 'officialSharedFifoStillHeld': True}
save_report(); print('PHYSICAL354_BACKEND', json.dumps(report['backend354']), flush=True)

# API checks belong to this same official job, before large geometry imports.
test_material = bpy.data.materials.new('252 installed Principled interface guard'); test_material.use_nodes = True
test_bsdf = test_material.node_tree.nodes.get('Principled BSDF')
required = ['Base Color', 'Metallic', 'Roughness', 'IOR', 'Transmission Weight', 'Coat Weight', 'Coat Roughness', 'Coat Normal', 'Emission Color', 'Emission Strength', 'Specular IOR Level']
missing = [key for key in required if key not in test_bsdf.inputs]
if settings['volume']['enabled']:
    if settings.get('roomBoundsYUp') is None or settings.get('roomBoundsSourceEvidence') is None: raise RuntimeError('Bind exact new room bounds/evidence before importing')
    volume_guard=test_material.node_tree.nodes.new('ShaderNodeVolumePrincipled');volume_required=['Density','Color','Absorption Color','Anisotropy','Emission Strength','Blackbody Intensity'];missing += ['Volume:'+key for key in volume_required if key not in volume_guard.inputs]
report['installedInterface'] = {'principledInputs': [s.name for s in test_bsdf.inputs], 'missing': missing}
if missing: raise RuntimeError('Reviewed material interface unavailable: '+','.join(missing))
bpy.data.materials.remove(test_material)
buffers = SourceBuffers(root, source_report, settings['memory']['sourceBufferCacheBytes']); geometries = {g['id']: g for g in package['geometries']}; mat_records = {m['id']: m for m in package['materials']}
proxy_names = set(settings['proxyLightNames']); practical_names = set(settings['floorPracticalNames'])
suns = [l for l in package['lights'] if l['type'] == 'DirectionalLight' and l['intensity'] > 0]
if len(suns) != 1: raise RuntimeError('Exactly one actual native Sun is required; no guessed atmosphere')
exterior_mode = settings['lighting'].get('exteriorMode', 'native-fixed-background')
if exterior_mode not in ('native-fixed-background', 'native-equirectangular-background', 'physical-multiple-scattering'):
    raise RuntimeError('Unreviewed exterior boundary model: '+exterior_mode)
practicals = [l for l in package['lights'] if l['name'] in practical_names and l['type'] == 'PointLight' and l['intensity'] > 0]
if len(practicals) != settings['lighting']['expectedFloorPracticalSources']: raise RuntimeError('Actual floor practical inventory changed')
omitted = []
for light in package['lights']:
    if light in suns or light in practicals: continue
    if light['intensity'] <= 0: omitted.append({'name': light['name'], 'type': light['type'], 'reason': 'native inactive light'}); continue
    if light['name'] not in proxy_names: raise RuntimeError('Unclassified active source light, never silently retain/delete: '+light['name'])
    omitted.append({'name': light['name'], 'type': light['type'], 'sourceIntensity': light['intensity'], 'sourceLinearRGB': light['color'], 'originalSourceRecord': light, 'replacement': ('Exact exterior Background + source Sun' if exterior_mode == 'native-fixed-background' else 'Declared physical atmosphere including one source-aligned solar disc')+' through actual openings/paper, followed by real multi-bounce scene transport. No new area/spot/fill.'})
report['nativeProxyLightAdaptations'] = omitted
for excluded in package['excluded']:
    if excluded.get('name') not in settings['captureUtilityNames']: raise RuntimeError('Unreviewed excluded native physical surface: '+str(excluded))
    if excluded.get('colorWrite') is not False: raise RuntimeError('Capture-only utility must actually have colorWrite=false')
report['captureOnlyUtilitiesNotOccluders'] = [{'source': row, 'physicalReplacement': 'Actual exported floorboard/panel geometry with retained PBR coat and real ray-traced reflection'} for row in package['excluded']]
if not any(m.get('nativeFloorVarnish') for m in package['materials']): raise RuntimeError('Actual complete wood-floor surface material is missing')


def configure_metered_atmosphere252():
    """Same official FIFO job: meter the sky before loading any source geometry.

    Three tiny32-bit EXRs are radiometer evidence, not substitute scene frames
    or textures. The full final scene still contains every source triangle.
    The atmosphere supplies both the sky and the sole solar disc, so there is
    no second SUN object and no independently invented warm directional tint.
    """
    params = settings['lighting']['physicalAtmosphere']
    source_sun = suns[0]; matrix = np.asarray(source_sun['matrix'], np.float64).reshape(4, 4).T
    direction_y = matrix[:3, 3]-np.asarray(source_sun['target']); direction_y /= np.linalg.norm(direction_y)
    convert = Matrix.Rotation(math.pi/2, 4, 'X').to_3x3(); direction_z = convert @ Vector(direction_y)
    world = bpy.data.worlds.new('252 R02 metered multiple-scattering daylight and sole Sun'); world.use_nodes = True; scene.world = world
    nodes = world.node_tree.nodes; nodes.clear(); links = world.node_tree.links
    sky = nodes.new('ShaderNodeTexSky'); bg = nodes.new('ShaderNodeBackground'); wo = nodes.new('ShaderNodeOutputWorld')
    supported = [e.identifier for e in sky.bl_rna.properties['sky_type'].enum_items]
    if params['skyType'] != 'MULTIPLE_SCATTERING' or params['skyType'] not in supported:
        raise RuntimeError('Reviewed installed MULTIPLE_SCATTERING atmosphere is unavailable')
    sky.sky_type = params['skyType']
    requested = {'sun_disc': False, 'sun_size': math.radians(settings['lighting']['sunAngularDiameterDegrees']), 'sun_intensity': 1.0, 'sun_elevation': math.asin(direction_z.z), 'sun_rotation': math.atan2(direction_z.x, direction_z.y), 'air_density': params['airDensity'], 'aerosol_density': params['aerosolDensity'], 'ozone_density': params['ozoneDensity'], 'altitude': params['altitudeMetres']}
    actual = {}
    for name, value in requested.items():
        if sky.bl_rna.properties.get(name) is None: raise RuntimeError('Actual Sky RNA property is absent: '+name)
        setattr(sky, name, value); actual[name] = getattr(sky, name)
        residual = abs(math.atan2(math.sin(actual[name]-value), math.cos(actual[name]-value))) if name == 'sun_rotation' else abs(float(actual[name])-float(value))
        if residual > 1e-6: raise RuntimeError('Actual atmosphere RNA assignment differs: '+name)
    e, rot = sky.sun_elevation, sky.sun_rotation
    forward = Vector((math.cos(e)*math.sin(rot), math.cos(e)*math.cos(rot), math.sin(e)))
    direction_residual = (forward-direction_z).length
    if direction_residual > 2e-6: raise RuntimeError('Sky forward-mapped actual Sun direction differs from source')
    links.new(sky.outputs['Color'], bg.inputs['Color']); links.new(bg.outputs[0], wo.inputs['Surface']); bg.inputs['Strength'].default_value = 1
    meter = bpy.data.scenes.new('252 bounded daylight radiometer only, no source geometry'); meter.world = world
    meter.render.engine = 'CYCLES'; configure_cycles_backend354(meter); meter.cycles.samples = params['meterSamples']; meter.cycles.seed = 252; meter.cycles.use_adaptive_sampling = False; meter.cycles.use_denoising = False; meter.cycles.sample_clamp_direct = meter.cycles.sample_clamp_indirect = 0
    meter.render.threads_mode = 'FIXED'; meter.render.threads = settings['render']['threads']; meter.render.film_transparent = False
    meter.render.image_settings.file_format = 'OPEN_EXR'; meter.render.image_settings.color_mode = 'RGB'; meter.render.image_settings.color_depth = '32'; meter.render.image_settings.exr_codec = 'ZIP'
    meter.view_settings.view_transform = 'Raw'; meter.view_settings.look = 'None'; meter.view_settings.exposure = 0; meter.view_settings.gamma = 1
    data = bpy.data.cameras.new('252 temporary radiometer camera'); camera = bpy.data.objects.new(data.name, data); meter.collection.objects.link(camera); meter.camera = camera
    if data.bl_rna.properties.get('panorama_type') is None: raise RuntimeError('Reviewed actual Camera.panorama_type interface absent')
    data.type = 'PANO'; data.panorama_type = 'EQUIRECTANGULAR'; data.latitude_min = 0; data.latitude_max = math.pi/2; data.longitude_min = -math.pi; data.longitude_max = math.pi
    camera.rotation_euler = (math.pi/2, 0, -math.pi/2)
    def measure(label, width, height):
        if width*height > 32768: raise RuntimeError('Radiometer size exceeds reviewed small calibration boundary')
        meter.render.resolution_x = width; meter.render.resolution_y = height; meter.render.resolution_percentage = 100
        file = out/(label+'.exr'); meter.render.filepath = str(file)
        bpy.ops.render.render(scene=meter.name, write_still=True)
        image = bpy.data.images.load(str(file), check_existing=False); image.colorspace_settings.name = 'Non-Color'
        channels = len(image.pixels)//(width*height)
        if tuple(image.size) != (width, height) or channels not in (3, 4): raise RuntimeError('Radiometer EXR layout differs')
        values = np.empty(len(image.pixels), np.float32); image.pixels.foreach_get(values); bpy.data.images.remove(image)
        values = values.reshape(height, width, channels)[:, :, :3].astype(np.float64)
        if not np.isfinite(values).all() or values.max(initial=0) <= 0: raise RuntimeError('Radiometer did not produce finite unclipped scene-linear radiance')
        return values, {'path': str(file), 'sha256': digest(file.read_bytes()), 'dimensions': [width, height], 'samples': meter.cycles.samples, 'sceneLinear': True, 'colorManagement': 'Raw, EV0, 32-bit float EXR; never applied as a scene texture'}
    width, height = params['diffuseMeterSize']
    values, diffuse_file = measure('radiometer252-sky-without-disc', width, height)
    # Official v5.2.1 camera.cpp range gives latitude=v*pi/2 for the
    # documented panorama rotation. Integrate exact projected row solid angle.
    lat_edges = np.linspace(0, math.pi/2, height+1)
    row_weights = .5*np.diff(np.sin(lat_edges)**2)*(2*math.pi/width)
    diffuse_rgb = (values*row_weights[:, None, None]).sum(axis=(0, 1)); luma = np.asarray([.2126, .7152, .0722])
    diffuse_y = float(diffuse_rgb @ luma)
    if not (0.01 < diffuse_y < 1e5): raise RuntimeError('Actual unclipped sky diffuse irradiance outside bounded calibration range')
    target = float(params['targetDiffuseHorizontalRelativeIrradiance'])
    if not (1 <= target <= 100): raise RuntimeError('Unreviewed inferred daylight irradiance target')
    world_scale = target/diffuse_y*settings['lighting']['relativeSceneUnitScale']
    data.type = 'PERSP'; data.sensor_fit = 'VERTICAL'; data.sensor_height = 36
    half_tan = math.tan(math.radians(settings['lighting']['sunAngularDiameterDegrees']*2)*.5); data.lens = 18/half_tan
    camera.rotation_euler = direction_z.to_track_quat('-Z', 'Y').to_euler()
    meter.view_layers[0].update()
    meter_forward = (camera.matrix_world.to_3x3() @ Vector((0, 0, -1))).normalized()
    meter_direction_residual = (meter_forward-direction_z.normalized()).length
    report['solarMeterCamera252'] = {'actualMatrixWorldZUp': [v for row in camera.matrix_world for v in row], 'actualLocalMinusZForwardWorldZUp': list(meter_forward), 'sourceDirectionZUp': list(direction_z), 'forwardDotSource': meter_forward.dot(direction_z.normalized()), 'forwardVectorResidual': meter_direction_residual, 'cameraPointsTowardSun': meter_direction_residual <= 2e-6}
    save_report()
    if meter_direction_residual > 2e-6: raise RuntimeError('Actual radiometer camera local -Z does not point toward the source Sun')
    size = params['solarMeterSize']; off, off_file = measure('radiometer252-solar-field-disc-off', size, size)
    sky.sun_disc = True; on, on_file = measure('radiometer252-solar-field-disc-on', size, size)
    delta = np.maximum(on-off, 0); xs = ((np.arange(size)+.5)/size*2-1)*half_tan; xx, yy = np.meshgrid(xs, xs)
    weights = (2*half_tan/size)**2/(1+xx*xx+yy*yy)**2
    direct_rgb = (delta*weights[:, :, None]).sum(axis=(0, 1)); direct_y = float(direct_rgb @ luma); ratio = direct_y/diffuse_y
    signal = delta @ luma; signal_sum = float(signal.sum())
    if signal_sum <= 0: raise RuntimeError('Actual source-directed meter did not see the solar disc')
    centroid = [float((signal*axis).sum()/signal_sum) for axis in np.meshgrid(np.arange(size)+.5, np.arange(size)+.5)]
    if max(abs(v-size*.5) for v in centroid) > 1: raise RuntimeError('Actual solar disc image is not centered on source direction')
    if not (params['minimumDirectNormalToDiffuseRatio'] <= ratio <= params['maximumDirectNormalToDiffuseRatio']): raise RuntimeError('Actual physical atmosphere Sun-sky ratio outside reviewed bounds: '+str(ratio))
    bg.inputs['Strength'].default_value = world_scale
    report['physicalExteriorBoundary252'] = {'mode': exterior_mode, 'sourceNativeBackgroundLinearRGBRecordedNotUsed': package['physical252']['nativeBackgroundLinearRGB'], 'sourceSun': source_sun, 'sourceDirectionYUp': direction_y.tolist(), 'actualDirectionZUp': list(direction_z), 'actualRNAForwardDirectionZUp': list(forward), 'directionVectorResidual': direction_residual, 'actualAtmosphereRNA': {**actual, 'sun_disc': sky.sun_disc}, 'solarAngularDiameterDegrees': math.degrees(sky.sun_size), 'radiometricMeter': {'rawDiffuseHorizontalRGB': diffuse_rgb.tolist(), 'rawDiffuseHorizontalLuminance': diffuse_y, 'rawDirectNormalRGB': direct_rgb.tolist(), 'rawDirectNormalLuminance': direct_y, 'directNormalToDiffuseHorizontalLuminanceRatio': ratio, 'actualSolarDiscCentroidPixels': centroid, 'solarMeterPixelCenter': size*.5, 'files': [diffuse_file, off_file, on_file], 'projectedSolidAngleIntegration': 'DHI integral L*cos(thetaZ)*dOmega; DNI disc-on minus disc-off times source-normal projected pixel solid angle', 'calibrationGeometryCount': 0}, 'worldStrength': bg.inputs['Strength'].default_value, 'targetDiffuseHorizontalRelativeIrradiance': target, 'actualDiffuseHorizontalRGBRelative': (diffuse_rgb*world_scale).tolist(), 'actualDirectNormalRGBRelative': (direct_rgb*world_scale).tolist(), 'actualDirectHorizontalRGBRelative': (direct_rgb*world_scale*direction_z.z).tolist(), 'solarDiscCount': 1, 'separateSunObject': False, 'sameForCameraDiffuseGlossy': True, 'sourceRoomEnvMapsImported': False, 'absoluteSIPhotometryClaimed': False, 'inference': params['inference'], 'radiometerCalibrationFrames': 3, 'nativePixelEquivalent': False, 'officialSources': ['https://raw.githubusercontent.com/blender/blender/v5.2.1/intern/cycles/kernel/svm/sky.h', 'https://raw.githubusercontent.com/blender/blender/v5.2.1/intern/cycles/scene/camera.cpp', 'https://docs.staging.blender.org/manual/en/latest/render/cycles/object_settings/cameras.html']}
    bpy.data.objects.remove(camera, do_unlink=True); bpy.data.cameras.remove(data); bpy.data.scenes.remove(meter)
    save_report()


if exterior_mode == 'physical-multiple-scattering': configure_metered_atmosphere252()

# Bind each point proxy's one flux to actual existing paper area, not both.
paper_names = {'restoration-lantern-warm-paper', 'restoration-hanging-lantern-paper', 'restoration-stone-lantern-paper'}
optics = {}; source_emitter_rows = []; associations = [[] for _ in practicals]
practical_positions = [np.asarray(l['matrix'], np.float64).reshape(4, 4).T[:3, 3] for l in practicals]
for at, record in enumerate(package['meshes']):
    transforms = full_transforms(record, buffers); n = len(transforms); emission = np.zeros((n, 3), np.float32); emit_back = np.zeros(n, np.float32)
    candidates = [mat_records[mid] for mid in record['materials'] if mat_records[mid]['name'] in paper_names]
    optics[at] = {'emissionRGB': emission, 'emitBack': emit_back}
    if not candidates: continue
    if len(candidates) != 1 or len(record['materials']) != 1: raise RuntimeError('Practical paper needs an unambiguous actual material bucket')
    material = candidates[0]
    if material['textures'].get('emissiveMap'): raise RuntimeError('Textured practical emission requires reviewed area integration, not a guessed mean')
    data = buffers.geometry(geometries[record['geometry']]); closed = closed_geometry(data)
    for i, transform in enumerate(transforms):
        centroid = data['position'].mean(axis=0) @ transform[:3, :3].T + transform[:3, 3]
        area = triangle_area(data, transform); sides = 1 if closed or material.get('side') != 2 else 2
        source_emission = np.asarray(material.get('emissive') or [0,0,0])*float(material.get('emissiveIntensity') if material.get('emissiveIntensity') is not None else 1)
        emission[i] = source_emission*settings['lighting']['relativeSceneUnitScale']
        emit_back[i] = 1 if sides == 2 else 0
        row = {'meshRecord': at, 'sourceObject': record['name'], 'sourceObjectUUID': record.get('sourceObjectUUID'), 'instance': i, 'material': material['name'], 'centroidYUp': centroid.tolist(), 'actualTriangleAreaSquareMetres': area, 'emissionSides': sides, 'closedSourceGeometry': closed, 'originalEmissionLinearRGB': source_emission.tolist(), 'opticalEffectiveArea': area*sides}
        distances = [float(np.linalg.norm(centroid-position)) for position in practical_positions]
        nearest = int(np.argmin(distances)) if distances else None
        if nearest is not None and distances[nearest] <= settings['lighting']['practicalAssociationMaximumDistanceMetres']:
            row['pointProxy'] = nearest; row['distanceToProxy'] = distances[nearest]; associations[nearest].append(row)
        else: row['pointProxy'] = None
        source_emitter_rows.append(row)
for index, (light, rows) in enumerate(zip(practicals, associations)):
    area = sum(row['opticalEffectiveArea'] for row in rows)
    if not rows or area <= 0: raise RuntimeError('No actual paper area for native practical; do not invent emitter '+light['name'])
    native_power = float(light.get('power') if light.get('power') is not None else light['intensity']*4*math.pi)
    flux_rgb = np.asarray(light['color'], np.float64)*native_power*settings['lighting']['relativeSceneUnitScale']
    radiance = flux_rgb/(math.pi*area)
    for row in rows:
        optics[row['meshRecord']]['emissionRGB'][row['instance']] = radiance
        row['physicalEmissionLinearRGB'] = radiance.tolist()
    omitted.append({'name': light['name'], 'type': light['type'], 'sourceIntensity': light['intensity'], 'sourcePower': light.get('power'), 'sourceFluxRGBRelative': flux_rgb.tolist(), 'actualEffectivePaperArea': area, 'paperInstances': len(rows), 'physicalEmissionRGB': radiance.tolist(), 'pointLightImported': False, 'originalSourceRecord': light, 'replacement': 'One Lambertian actual-surface emitter: L=4*pi*I*RGB/(pi*effectiveArea); original paper emission not added again. Authoritative proxy flux preserves relative source balance, not measured SI photometry.'})
report['actualPracticalSurfaceAreas'] = source_emitter_rows
report['emissionConvention'] = {'source': 'Checked Blender v5.2.1 SVM Emission Weight passes Color*Strength unchanged to emission closure, same numeric radiance-weight convention as Background. Lambertian integration gives pi*L*A per emitted side.', 'absoluteSIClaimed': False, 'nativePointPhotometricUnitsNotSilentlyCalledWatts': True, 'oneCommonRelativeScale': settings['lighting']['relativeSceneUnitScale'], 'unproxiedActualFixtureSurfacesRetained': True, 'pointAndMeshDoubleCounting': False}

materials, direct_materials = material_library(bpy, package, root, source_report, report, settings)
conversion = import_geometry(bpy, package, buffers, materials, direct_materials, optics, report)

# Preserve the original R01 control; R02's actual atmosphere was metered above.
if exterior_mode in ('native-fixed-background', 'native-equirectangular-background'):
    world = bpy.data.worlds.new('252 exact native exterior RGB boundary'); world.use_nodes = True; scene.world = world
    wn = world.node_tree.nodes; wn.clear(); wl = world.node_tree.links; bg = wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = settings['lighting']['relativeSceneUnitScale']; wo = wn.new('ShaderNodeOutputWorld'); wl.new(bg.outputs[0], wo.inputs['Surface'])
    if exterior_mode == 'native-equirectangular-background':
        record = package['physical252'].get('nativeBackgroundTexture354')
        if not record or record['kind'] != 'exact-source-linear-equirectangular' or record['channels'] != 4 or record['flipY'] or any(abs(v)>1e-12 for v in record['rotation'][:3]): raise RuntimeError('Unreviewed actual angular background')
        values = np.fromfile(root/'assets'/record['data']['file'], dtype='<f4')
        if len(values) != record['width']*record['height']*4 or not np.isfinite(values).all() or values.min()<0: raise RuntimeError('Incomplete exact linear sky payload')
        image = bpy.data.images.new('354 exact source directional exterior radiance', width=record['width'], height=record['height'], alpha=True, float_buffer=True)
        image.colorspace_settings.name = 'Non-Color'; image.pixels.foreach_set(values); image.update()
        readback = np.empty(len(values),np.float32); image.pixels.foreach_get(readback)
        if not np.array_equal(values,readback): raise RuntimeError('Actual HDR boundary image values changed')
        texture = wn.new('ShaderNodeTexEnvironment'); texture.image=image; texture.projection='EQUIRECTANGULAR'; texture.interpolation='Linear'; wl.new(texture.outputs['Color'],bg.inputs['Color'])
        bg.inputs['Strength'].default_value *= record['intensity']
        # Three u=atan2(z,x)/(2pi)+.5,v=asin(y)/pi+.5. Existing geometry
        # conversion gives Blender(x,-z,y); Cycles u=.5-atan2(y,x)/(2pi),
        # v=1-acos(z)/pi therefore retains the same world angular directions.
        report['angularBackground354']={'source':record,'rawPayloadSha256':source_report['exportedAssets'][record['data']['file']]['sha256'],'actualBlenderFloatPixelsExact':True,'sourceYUpToBlenderZUp':["x","-z","y"],'orientationEvidence':'https://github.com/blender/blender/blob/main/intern/cycles/kernel/camera/projection.h','worldDirectionMapping':'Identical analytic equirectangular u/v after existing +90degree X world conversion; source rotation0 and flipYfalse required','sameAllRayTypes':True,'nativeCapturedRoomProbesImported':False,'referencePhotographUsed':False}
    else: bg.inputs['Color'].default_value = (*package['physical252']['nativeBackgroundLinearRGB'],1)
    sun_rec = suns[0]; source_matrix = np.asarray(sun_rec['matrix'], np.float64).reshape(4, 4).T; source_direction = source_matrix[:3, 3]-np.asarray(sun_rec['target']); source_direction /= np.linalg.norm(source_direction)
    sun = bpy.data.lights.new(sun_rec['name'], 'SUN'); sun.color = sun_rec['color']
    if hasattr(sun, 'normalize'): sun.normalize = True
    sun.energy = sun_rec['intensity']*settings['lighting']['relativeSceneUnitScale']; sun.angle = math.radians(settings['lighting']['sunAngularDiameterDegrees'])
    study354 = settings['lighting'].get('solarDirectionStudy354')
    if study354:
        old_direction=source_direction.copy(); old_energy=float(sun.energy); elevation=math.radians(float(study354['elevationDegrees']))
        if not 0<elevation<math.pi/3 or old_direction[1]<=0: raise RuntimeError('Unbounded inferred solar direction study')
        horizontal=old_direction[[0,2]]; horizontal/=np.linalg.norm(horizontal)
        source_direction=np.asarray([horizontal[0]*math.cos(elevation),math.sin(elevation),horizontal[1]*math.cos(elevation)])
        if study354['preserveDirectHorizontalIrradiance']: sun.energy=old_energy*old_direction[1]/source_direction[1]
        report['solarDirectionStudy354']={'inferredNotMeasured':True,'sourceDirectionYUp':old_direction.tolist(),'candidateDirectionYUp':source_direction.tolist(),'sourceEnergy':old_energy,'candidateEnergy':float(sun.energy),'sourceHorizontalDirect':old_energy*float(old_direction[1]),'candidateHorizontalDirect':float(sun.energy)*float(source_direction[1]),'actualSunObjects':1,'originalAmbientHDRHeld':True,'allSourceGeometryAndMaterialsHeld':True,'reason':study354['reason']}

    sun_obj = bpy.data.objects.new(sun_rec['name'], sun); scene.collection.objects.link(sun_obj); sun_obj.location = conversion[:3, :3] @ source_matrix[:3, 3]; direction_z = conversion[:3, :3] @ source_direction; sun_obj.rotation_euler = (-Vector(direction_z)).to_track_quat('-Z', 'Y').to_euler()
    report['physicalExteriorBoundary252'] = {'nativeBackgroundLinearRGB': package['physical252']['nativeBackgroundLinearRGB'], 'worldStrength': bg.inputs['Strength'].default_value, 'sameForCameraDiffuseGlossy': True, 'sourceSun': sun_rec, 'actualSunEnergyRelative': sun.energy, 'sourceDirectionYUp': source_direction.tolist(), 'actualDirectionZUp': direction_z.tolist(), 'solarAngularDiameterDegrees': math.degrees(sun.angle), 'alternativeSkyInserted': False, 'actualSourcePanoramaRetained': exterior_mode=='native-equirectangular-background', 'sourceRoomEnvMapsImported': False, 'nativePixelEquivalent': False}

# Source rigid camera and vertical angular projection, no invented DOF.
camera_data = bpy.data.cameras.new('252 exact native reference camera'); camera = bpy.data.objects.new(camera_data.name, camera_data); scene.collection.objects.link(camera)
camera_source = np.asarray(package['cameraMatrix'], np.float64).reshape(4, 4).T; camera.matrix_world = Matrix((conversion @ camera_source).tolist()); camera_data.sensor_fit = 'VERTICAL'; camera_data.sensor_height = 36
projection = np.asarray(package['cameraProjectionMatrix'], np.float64).reshape(4, 4).T
if abs(projection[0, 2]) > 1e-9 or abs(projection[1, 2]) > 1e-9 or abs(package['view']['aspect']-1) > 1e-9: raise RuntimeError('Native off-axis/aspect camera requires exact reviewed subfrustum port')
camera_data.lens = 18*projection[1, 1]; camera_data.clip_start = package['view']['near']; camera_data.clip_end = package['view']['far']; camera_data.dof.use_dof = False; scene.camera = camera
scene.render.resolution_x = scene.render.resolution_y = 1254; scene.render.resolution_percentage = 100
bpy.context.view_layer.update()
slopes = np.asarray([(v.x/-v.z, v.y/-v.z) for v in camera_data.view_frame(scene=scene)]); intended = np.asarray([1/projection[0, 0], 1/projection[1, 1]])
projection_residual = float(np.max(np.abs(np.max(np.abs(slopes), axis=0)-intended)))
if projection_residual > 2e-6: raise RuntimeError('Exact source angular camera projection was lost')
report['camera252'] = {'sourceMatrixYUp': package['cameraMatrix'], 'actualMatrixZUp': [v for row in camera.matrix_world for v in row], 'sourceFov': package['view']['fov'], 'sourceZoom': package['view']['zoom'], 'actualLensMM': camera_data.lens, 'verticalGateMM': 36, 'maximumCameraRaySlopeResidual': projection_residual, 'DOF': False, 'frame': [1254, 1254]}

volume = settings['volume']; bounds = settings.get('roomBoundsYUp')
if volume['enabled']:
    if bounds is None or settings.get('roomBoundsSourceEvidence') is None: raise RuntimeError('Actual new source room bounds/evidence must be bound before using a volume')
    low = np.asarray(bounds[0], float); high = np.asarray(bounds[1], float)
    if low.shape != (3,) or high.shape != (3,) or np.any(high <= low): raise RuntimeError('Invalid actual room bounds')
    native_scattering = package['physical252']['nativeInfo']['solarScattering']; density = float(volume.get('densityPerMetre', native_scattering['density'])); albedo = volume['singleScatterAlbedo']
    if not (0 <= density < .05 and 0 <= albedo <= 1 and -1 < volume['anisotropy'] < 1): raise RuntimeError('Unbounded/nonphysical volume settings')
    bpy.ops.mesh.primitive_cube_add(size=1); air = bpy.context.object; air.name = '252 actual bounded room participating air'; matrix = np.eye(4); matrix[:3, :3] = np.diag(high-low); matrix[:3, 3] = (high+low)*.5; air.matrix_world = Matrix((conversion @ matrix).tolist())
    material = bpy.data.materials.new('252 physical room air, no beam card/emission'); material.use_nodes = True; nodes = material.node_tree.nodes; nodes.clear(); links = material.node_tree.links
    pv = nodes.new('ShaderNodeVolumePrincipled'); pv.inputs['Density'].default_value = density; pv.inputs['Color'].default_value = (albedo, albedo, albedo, 1); pv.inputs['Absorption Color'].default_value = (0, 0, 0, 1); pv.inputs['Anisotropy'].default_value = volume['anisotropy']; pv.inputs['Emission Strength'].default_value = 0; pv.inputs['Blackbody Intensity'].default_value = 0
    output = nodes.new('ShaderNodeOutputMaterial'); links.new(pv.outputs['Volume'], output.inputs['Volume']); air.data.materials.append(material)
    report['physicalVolume252'] = {'actualSourceBoundsYUp': bounds, 'boundsEvidence': settings['roomBoundsSourceEvidence'], 'extinctionPerMetre': density, 'originalNativeDensityPerMetre': float(native_scattering['density']), 'densityOverrideIsInferred': 'densityPerMetre' in volume, 'scatteringPerMetre': density*albedo, 'absorptionPerMetre': density*(1-albedo), 'anisotropy': volume['anisotropy'], 'nativeScatteringGainNotRepeated': native_scattering.get('gain'), 'singleScatterAlbedoIsInferred': albedo, 'emission': 0, 'nativeScreenSpaceBeamShaderOrCardsImported': False}

# Source geometry dicts have been released by import_geometry. Release the
# bounded source payload cache before the full Cycles/Embree tables coexist.
# Original immutable buffers remain on disk and retain their verified hashes.
report['sourceBufferRelease354'] = {'cachedBytesBeforeRelease': buffers.cache_bytes, 'observedImportCachePeakBytes': buffers.cache_high_water, 'payloadCacheClearedBeforeCyclesSync': True}
buffers.cache.clear(); buffers.cache_bytes = 0; gc.collect()
report['importFinished354'] = {'peakProcessResidentBytes': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*(1 if sys.platform=='darwin' else 1024), 'allSourceTrianglesRetained': report['geometry252']['allSourceTrianglesRetained']}
r = settings['render']; scene.render.engine = 'CYCLES'; configure_cycles_backend354(scene)
scene.cycles.samples = r['samples']; scene.cycles.use_adaptive_sampling = r['adaptiveSampling']; scene.cycles.time_limit = 0
scene.cycles.max_bounces = r['maxBounces']; scene.cycles.diffuse_bounces = r['diffuseBounces']; scene.cycles.glossy_bounces = r['glossyBounces']; scene.cycles.transmission_bounces = r['transmissionBounces']; scene.cycles.transparent_max_bounces = r['transparentBounces']; scene.cycles.volume_bounces = r['volumeBounces']; scene.cycles.sample_clamp_direct = r['directClamp']; scene.cycles.sample_clamp_indirect = r['indirectClamp']; scene.cycles.use_light_tree = True; scene.cycles.use_denoising = r['denoise']; scene.cycles.denoiser = 'OPENIMAGEDENOISE'
scene.render.threads_mode = 'FIXED'; scene.render.threads = r['threads']; scene.render.film_transparent = False
scene.view_settings.view_transform = r['viewTransform']; scene.view_settings.look = r['look']; scene.view_settings.exposure = float(r.get('exposureEV', math.log2(package['physical252']['nativeExposure']))); scene.view_settings.gamma = r['gamma']
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGB'; scene.render.image_settings.color_depth = '16'
name = 'scene06-'+source_report['sourceHash'][:12]+'-physical252-'+out.name+'-CC-BY-NC-SA-4.0.png'; scene.render.filepath = str(out/name)
report['renderSettings252'] = {'resolution': [1254, 1254], 'samples': scene.cycles.samples, 'adaptive': scene.cycles.use_adaptive_sampling, 'OIDN': scene.cycles.use_denoising, 'bounceLimits': [scene.cycles.max_bounces, scene.cycles.diffuse_bounces, scene.cycles.glossy_bounces, scene.cycles.transmission_bounces, scene.cycles.volume_bounces], 'viewTransform': scene.view_settings.view_transform, 'look': scene.view_settings.look, 'exposureEV': scene.view_settings.exposure, 'nativeExposureMultiplier': package['physical252']['nativeExposure'], 'exposureOverrideIsInferred': 'exposureEV' in r, 'toneMapDifference': 'AgX is not Three ACESFilmic; declared scene-linear exposure, no post grade/bloom/AO', 'clampDirect': 0, 'clampIndirect': 0, 'savedBlend': False, 'actualFrames': 1, 'device': scene.cycles.device}
report['status'] = 'ready-for-one-actual-frame'; save_report(); print('PHYSICAL252_READY', json.dumps({'source': report['sourceHash'], 'triangles': report['geometry252']['importedTriangles'], 'output': scene.render.filepath}), flush=True)
started = time.time(); bpy.ops.render.render(write_still=True)
report['peakProcessResidentBytes']=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*(1 if sys.platform=='darwin' else 1024);report['MetalUnifiedAllocationMayNotBeFullyRepresentedByProcessRSS']=scene.cycles.device=='GPU';report['CPUDeviceSharesHostPointers354']=scene.cycles.device=='CPU'
report['status'] = 'path-traced-review-not-photographically-accepted'; report['output'] = scene.render.filepath; report['pngSha256'] = digest(Path(scene.render.filepath).read_bytes()); report['renderSeconds'] = time.time()-started; report['completedAt'] = time.time(); save_report(); print('PHYSICAL252_COMPLETE', json.dumps({'source': report['sourceHash'], 'output': report['output'], 'sha256': report['pngSha256'], 'photographicAccepted': False}), flush=True)
