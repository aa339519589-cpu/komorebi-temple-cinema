"""Pure CPU R06 anatomical attendant + independent thin layered garments."""
import bpy,json,hashlib,os,sys,copy,math,shutil
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from mesh257 import *
LANE=Path(__file__).resolve().parent.parent
CFG=Path(os.environ['ATTENDANTS257_CONFIG']).resolve()
if CFG.parent!=LANE:raise RuntimeError('Config outside owned lane')
cfg=json.loads(CFG.read_text());rev=cfg['revision']
if not rev.startswith('r') or not rev[1:].isalnum():raise RuntimeError('Explicit new round required')
ROOT=(LANE/cfg['candidateRootName']).resolve()
if ROOT.parent!=LANE:raise RuntimeError('Candidate outside owned lane')
BASE=ROOT/'reconstructions/scene-06/assets/attendant-bearing-v4';OUT=LANE/('authored-'+rev);HEADS=LANE/'authored-r05'
if OUT.exists():raise RuntimeError('Preserve prior authored outputs')
source_bytes=(BASE/'manifest.json').read_bytes()
if hashlib.sha256(source_bytes).hexdigest()!=cfg['originalV4ManifestSha256']:raise RuntimeError('Original licensed-source definition changed')
source=json.loads(source_bytes);head_manifest_bytes=(HEADS/'manifest.json').read_bytes()
if hashlib.sha256(head_manifest_bytes).hexdigest()!=cfg['headReuseManifestSha256']:raise RuntimeError('Exact successful scanned-head study changed')
heads=json.loads(head_manifest_bytes)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.context.scene.render.threads_mode='FIXED';bpy.context.scene.render.threads=4;OUT.mkdir()
if cfg.get('actualSourceHands11'):
    build_actual_source_hands11(LANE,ROOT,OUT,cfg)
    sys.exit(0)
body_finish=cfg['giltMaterial'];materials=dict(face=body_finish,buddha=body_finish,cloth={**body_finish,'roughness':.43},hand={**body_finish,'roughness':.37},gold={**body_finish,'roughness':.31})
manifest=dict(revision='scene06-attendants257-'+rev,format='SC07 actual closed3D positions/normals/neutralUV/index; no image pixels',variants={},materials=materials,sourceAttribution=source['sourceAttribution'],license='CC-BY-4.0 original scan prefix and retained R05 authored-neck derivative; new authored anatomical body/thin robes/hands/crown',sourceLicenses=[dict(creator='beachmouse',title='Buddha Head',license='CC-BY-4.0',url='https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab',licenseFile='../ccby-beachmouse-japanese-head/LICENSE.md')],sourceContactProfiles={},scanFaceNonRigidWarp=False,visualAccepted=False,photographicFidelityAccepted=False)
method='R06 replaces the rejected T-shirt/cut sleeves and filled skirt with a new closed anatomical torso/shoulders/exposed upper and forearms. Separate actual thin closed U-neck folds, overlapping waist bands, pointed lap sash, individual hollow knee drapes and curved side/back shoulder drapes. No circumferential short sleeve/horizontal cuff. Shorter thicker jointed phalanges/pads; larger pierced solid flame crown. Exact immutable R05 head/NP25 buffers reused, entire original92164scanprefix XYZ/normal held. No image/depth carrier, scene export, viewport, bake, GPU or Blend.'
if cfg.get('refitHeadBridge'):method='R07 responds to official R06 mesh ray picks: anatomical body neck uses shape-preserving C1 radii without zero-slope ring terraces; separate spherical deltoids removed, arm roots buried in torso. Only the verified old-authored head bridge profile is refitted with near-linear easing; entire actual92164scanprefix XYZ/normal and all sourceY/UV/index/header remain exact, with NP25 replay. Bodice and narrow curved S-lap cloth tuck into waist/body; knee cloth mouths terminate inside actual pelvis rather than open in air. Real bare-arm direction retained. No image/depth carrier, viewport/render/export/bake/GPU/Blend.'
if cfg.get('weldActualScan'):method='R08 creates one genuine closed scan/body skin across the true source724vertex neck cut. Every original92164scan vertex position is retained under the same known rigid placement and every183602actual scan triangle is copied; only the topology-defined724neck-cut normals recompute, every other91440scan normal stays original. The obsolete authored neck/cap suffix and new body neck cap are replaced by an actual Hermite/zipper surface, not overlapping collars. All original full assets retained. Center robe follows the actual raw-body/calf carrier. No face/ear stretching, photograph/depth plate, scene export/viewport/render/bake/GPU/Blend.'
if cfg.get('weldActualScan'):manifest['license']='CC-BY-4.0 original actual scan prefix retained in a documented neck/body derivative; original source asset preserved. New authored anatomical body/thin robes/hands/crown.'
if cfg.get('fairNewBridge'):method+=' New bridge fairing and the actual supported V pelvic drape respond to prior native review. Body/scan positions outside the new bridge remain controlled against the R08a serialized parent; bare arms, wide-V limb pose, hands and crown stay controlled.'
if cfg.get('monotoneNeckBridge'):method='R10 joins the actual source724vertex neck cut to the authored body with one closed, monotonically contracting new skin bridge. All92164scan positions are rigid only, all183602scan triangles/UV retained; only724neck-cut normals recompute and everyother91440scan normal remains original. Actual R09a triangle hits located the outward lip on its newbridge, so cut-normal extrapolation is removed. Linear angular-faired controls use a monotone radial constraint and independent serialized endpoint/envelope audit. Every body/scan position outside6144newbridge vertices and all UV/index bytes remain exact to the immutable R08a parent. Thin supported V pelvic cloth has three broad low rounded catenary folds and one shallow local gathering ridge. Bare arms/wide-V limbs, other clothes, hands/crown stay controlled; actual bearing is measured. Original raw/failedsource inputs retained. Pure4thread CPU mesh/JSON authoring, no render/viewport/export/bake/GPU/Blend.'
report=dict(revision=rev,method=method,config=cfg,parentCanonicalSourceHash=cfg['parentCanonicalSourceHash'],sourceInputHashes={str(BASE/'manifest.json'):hashlib.sha256(source_bytes).hexdigest(),str(HEADS/'manifest.json'):hashlib.sha256(head_manifest_bytes).hexdigest()},variants={},noRenderViewportSceneExportOrGpu=True,photographicFidelityAccepted=False)
for variant in ['left','right']:
    sign=1 if variant=='left' else -1
    scan_original=None
    if cfg.get('weldActualScan'):
        head=None;scan_original=copy.deepcopy(next(p for p in source['variants'][variant] if p['material']=='face'));scan_path=(BASE/scan_original['file']).resolve()
        if hashlib.sha256(scan_path.read_bytes()).hexdigest()!=scan_original['sha256']:raise RuntimeError('Original actual scan source changed')
        report['sourceInputHashes'][str(scan_path)]=scan_original['sha256']
    elif cfg.get('refitHeadBridge'):
        original=copy.deepcopy(next(p for p in source['variants'][variant] if p['material']=='face'));path=(BASE/original['file']).resolve()
        head=derive_local_neck(path,variant+'-face-local-neck-derivative',original,cfg['neckDerivative'],OUT);report['sourceInputHashes'][str(path)]=original['sha256']
    else:
        head=copy.deepcopy(next(p for p in heads['variants'][variant] if p['material']=='face'))
        if head['neckDerivative']['protectedVertices']!=92164 or not head['neckDerivative']['exactAttributeReplay']:raise RuntimeError('Protected scan prefix/ancestry not valid')
        for p in [head,head['neckDerivative']['trace']]:
            src=(HEADS/p['file']).resolve();data=src.read_bytes()
            if hashlib.sha256(data).hexdigest()!=p['sha256'] or src.stat().st_mode&0o222:raise RuntimeError('Reuse only exact immutable head/trace bytes')
            os.link(src,OUT/p['file']);report['sourceInputHashes'][str(src)]=p['sha256']
        derivation_file=HEADS/(variant+'-face-local-neck-derivative-derivation.json')
        if derivation_file.exists():shutil.copyfile(derivation_file,OUT/derivation_file.name)
    torso=anatomical_loft7(variant+'-C1-anatomical-chest-neck-no-ring-terraces',cfg['torsoRows'],112,144)
    hip=closed_loft(variant+'-new-anatomical-seated-pelvis',cfg['hipRows'],96,96,False)
    carrier=front_sampler6([torso,hip]);pieces=[torso,hip]
    for side in [-1,1]:
        path=[[side*x,y,z] for x,y,z in cfg['foldedLegPositivePath']]
        if side<0:
            for p in path:p[1]+=.022;p[2]-=.025
        pieces.append(sweep(variant+'-actual-bent-thigh-calf-'+str(side),path,.195,.23,128,48,False,.16))
        pieces.append(ellipsoid(variant+'-actual-folded-foot-'+str(side),(side*.20,.255,.27),(.20,.070,.12),56,28))
    arms=[]
    for kind,path in [('near',cfg['nearBareArm']),('outer',cfg['outerBareArm'])]:
        path=copy.deepcopy(path)
        if variant=='right' and kind=='outer':
            for j,p in enumerate(path):p[0]+=cfg['rightOuterHandXDelta']*(j/(len(path)-1))**2
        arms.append(sweep(variant+'-exposed-anatomical-'+kind+'-arm',path,.145,.126,144,48,False,.48))
    mirror_objects(arms,sign);pieces+=arms
    body,body_audit=union_cpu(pieces,variant+'-true-seated-body',cfg['bodyVoxelSize'],.16,2,OUT,None)
    raw_lap_carrier=front_sampler6([body]);lap_carrier=lambda x,y:raw_lap_carrier(sign*x,y);scan_context=None
    preweld_input=None
    if cfg.get('weldActualScan'):
        diagnostics=OUT/'preweld-inputs';diagnostics.mkdir(exist_ok=True);preweld_input=write_sc07(body,diagnostics,variant+'-original-anatomy-before-neck-cut','buddha')
        body,scan_context=weld_actual_scan_neck8(body,scan_path,scan_original,cfg['headRawTranslationY'],cfg['scanNeckWeld']['bodyNeckCutRawY'],cfg['scanNeckWeld'])
        scan_context['preweldInput']=preweld_input;scan_context['preweldInputArchiveRelativeToRepository']='lookdev/scene06-attendants257/authored-'+rev+'/preweld-inputs/'+preweld_input['file']
    ground_shift=-min(v.co.y for v in body.data.vertices)
    for v in body.data.vertices:v.co.y+=ground_shift
    body.data.update();body_part=write_welded_scan8(body,OUT,variant+'-closed-seated-body',scan_context,ground_shift) if scan_context is not None else write_sc07(body,OUT,variant+'-closed-seated-body','buddha')
    garments=layered_robes6(variant,carrier,cfg['kneeDrapeRows'],cfg['hipRows'],lap_carrier,cfg.get('wideVSupportedPelvicDrape',False));mirror_objects(garments,sign)
    for ob in garments:
        for v in ob.data.vertices:v.co.y+=ground_shift
    garment_ob,garment_audit=merge_closed(garments,variant+'-closed-thin-layered-garments');garment_part=write_sc07(garment_ob,OUT,variant+'-closed-thin-layered-garments','cloth')
    head_shift=cfg['headRawTranslationY']+ground_shift
    if head is not None:head['rigidPlacement']=dict(translation=[0,head_shift,0],nonRigidWarp=False,sourceBytesUnchanged=False,derivedMeshBytesUnchangedByPlacement=True,placedBounds=[[p[0],p[1]+head_shift,p[2]] for p in head['bounds']])
    hands=[];hand_reports=[]
    for kind,key,tx,tz in [('raised','nearHandCenter',.08,-.10),('cup','outerHandCenter',-.65,.12)]:
        ob,a=anatomical_hand6(variant+'-'+kind+'-jointed-hand',kind,cfg['handVoxelSize'],OUT);pos=list(cfg[key]);pos[1]+=ground_shift
        if variant=='right' and kind=='raised':pos[1]+=cfg['rightNearHandYDelta']
        if variant=='right' and kind=='cup':pos[0]+=cfg['rightOuterHandXDelta']
        placed=transform_hand(ob,pos,tx,tz,sign);hands.append(ob);hand_reports.append(dict(kind=kind,closedLocal=a,closedPlaced=placed,center=pos))
    hand_ob,hand_audit=merge_closed(hands,variant+'-closed-anatomical-hands');hand_part=write_sc07(hand_ob,OUT,variant+'-closed-anatomical-hands','hand')
    cap=closed_loft(variant+'-fitted-crown-cap',cfg['capRows'],96,56,False)
    for v in cap.data.vertices:v.co.y+=ground_shift
    cap_part=write_sc07(cap,OUT,variant+'-closed-crown-cap','oldgold')
    gold=[band(variant+'-crown-structural-band',.30,cfg['crownBandY'],.082,.014),band(variant+'-crown-upper-rim',.306,cfg['crownBandY']+.041,.018,.011)]
    for k,(a,h,w) in enumerate([(-1.10,.24,.073),(-.56,.31,.085),(0,.385,.092),(.56,.31,.085),(1.10,.24,.073)]):
        gold.append(open_crown_flame6(variant+'-pierced-crown-flame-'+str(k),a,h,w,cfg['crownLeafBaseY']))
        r=.323;gold.append(ellipsoid(variant+'-crown-jewel-'+str(k),(math.sin(a)*r,cfg['crownLeafBaseY']+.51*h,-.025+math.cos(a)*r),(.027,.041,.018),32,20))
    cord=[]
    for i in range(33):
        t=-1+2*i/32;x=.33*t;y=2.035-.16*(1-abs(t))**.8;z=carrier(x,y)+.047;cord.append((x,y,z))
    gold.append(sweep(variant+'-physical-necklace',cord,.009,.009,112,16));gold.append(ellipsoid(variant+'-small-chest-pendant',(0,1.825,carrier(0,1.825)+.058),(.038,.050,.016),32,20))
    for ob in gold:
        for v in ob.data.vertices:v.co.y+=ground_shift
    gold_ob,gold_audit=merge_closed(gold,variant+'-closed-crown-jewelry');gold_part=write_sc07(gold_ob,OUT,variant+'-closed-crown-jewelry','gold')
    profile=bearing_many6([body,garment_ob],[body_part['uncompressedSha256'],garment_part['uncompressedSha256']],cfg['worldScale'],cfg['bearingBandHeight']);profile['revision']=rev
    manifest['variants'][variant]=[body_part]+([head] if head is not None else [])+[garment_part,hand_part,cap_part,gold_part];manifest['sourceContactProfiles'][variant]=profile
    report['variants'][variant]=dict(body=body_part,bodyUnionAudit=body_audit,preweldInput=preweld_input,bodyGroundTranslation=ground_shift,head=head,unifiedScanPrefix=body_part.get('sourceScanPrefix257'),headBytesSameAsR05=not (cfg.get('refitHeadBridge',False) or cfg.get('weldActualScan',False)),garments=garment_part,garmentAudit=garment_audit,hands=hand_reports,handCombined=hand_audit,crown=gold_audit,actualBearing=profile)
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
manifest['provenanceLimit']='Original beachmouse head: Japanese tea garden in California; maker/date/manufacturing origin undocumented, different statue from reference. Original source and entire92164scanprefix XYZ/normal retained. R05 authored-neck derivative and NP25 trace reused unchanged. New anatomical body, bare arms, thin layered robes, hands/crown are authored/inferred actual3D. Hidden calf/foot order inferred; no photographic match accepted.'
if cfg.get('refitHeadBridge'):manifest['provenanceLimit']='Original beachmouse head/asset and entire92164actual scan-prefix XYZ/normal preserved. R07 regenerates only the source-verified old authored neck suffix with recorded easing and NP25 ancestry; it does not claim the whole head buffer is unchanged. New C1 anatomical skin and attached thin robes are inferred3D, different statue from supplied photograph, no photographic match accepted.'
if cfg.get('weldActualScan'):manifest['provenanceLimit']='Original complete licensed head retained unchanged. Actual scan face/ear positions and source triangles retained in one continuous scan/body skin under known rigid placement. Only724true neck-cut normal attributes may recompute; all other91440source scan normals remain exact. Original authored9368neck/cap vertices are replaced, never facial shape. Source neck loop, actual affected indices and coordinate hashes recorded. Different statue from reference, no photographic match accepted.'
manifest['pose257']=dict(referenceLandmarks='reference-landmarks257-r01.json',oldUpperSleevedBodyDiscarded=True,newAnatomicalBodyAndBareArms=True,standingBodyScaledToSit=False,thinClosedLayeredGarments=True,headGeometryBytesUnchanged=False,originalLegalHeadAssetPreserved=True,headNeckDerivative=True,headFaceEarProtectedAttributesUnchanged=True,entireR05HeadBytesReused=not cfg.get('refitHeadBridge',False),headPlacementRigidOnly=True,newSourceBearingMeasured=True)
if cfg.get('weldActualScan'):manifest['pose257'].update(unifiedScanBodySkin=True,headFaceEarProtectedAttributesUnchanged=False,allActualScanPositionsRigidOnly=True,allScanNormalsOutsideActualNeckCutOriginal=True,actualNeckCutNormalEditableVertices=724,entireR05HeadBytesReused=False)
for name,value in [('manifest.json',manifest),('geometry-report.json',report),('provenance.json',dict(revision=manifest['revision'],sourceAttribution=manifest['sourceAttribution'],sourceLicenses=manifest['sourceLicenses'],changes=method,provenanceLimit=manifest['provenanceLimit'],scanFaceNonRigidWarp=False,noImageOrDepthInput=True,visualAccepted=False,photographicFidelityAccepted=False))]:(OUT/name).write_text(json.dumps(value,indent=2)+'\n')
print(json.dumps(dict(status='new-anatomical-bare-arm-layered-robe-components-written',revision=rev,variants={k:dict(bodyVertices=v['body']['vertices'],clothVertices=v['garments']['vertices'],bodyClosedComponents=v['body']['topology']['components'],clothClosedComponents=v['garmentAudit']['components']) for k,v in report['variants'].items()},photographicFidelityAccepted=False)))
