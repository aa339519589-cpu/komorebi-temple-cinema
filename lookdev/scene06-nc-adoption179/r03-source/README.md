# Scene 06 — 佛堂

## Current personal noncommercial candidate — adoption179 R03 (2026-10-23)

The live central sculpture now uses the actual **Scan-the-World Japanese Sainsbury Amida** geometry under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), following the user authorization “仅个人欣赏，允许使用非商用雕像素材”. Source: [Zenodo 21353739](https://zenodo.org/records/21353739), DOI 10.5281/zenodo.21353739. The original source, primary metadata, curated paired-hand R09 GLB, runtime SC07 buffer, source hashes and modification history are in `assets/nc-sainsbury-amida179-CC-BY-NC-SA-4.0/`. The repository permissive license does not replace this asset-specific license. Scene06 imagery/video containing this sculpture is marked CC BY-NC-SA 4.0 for personal noncommercial use; no commercial use is authorized.

The prepared source positions, normals and triangle indices remain byte-identical. The source face/anatomy is unchanged from the previously curated paired-hand R09 asset; the only runtime fit is a positive uniform scale to 2.50 m seated height and a translation to the existing seat. Independently authored three-row solid lotus petals have returned margins and modeled chasing. A thin solid bearing follows the actual source hem contact envelope, rather than exposing a broad circular disk. Dedicated satin gold on the halo and lotus, lower highlight scatter, and darker structural beams strengthen the face/room hierarchy. The canonical room, altar, low reference camera, full camera-shot path and separately licensed V4 attendant heads remain.

The prior entire canonical165 R07 source/runtime is preserved with all 189 files verified in `lookdev/scene06-nc-adoption179/preservation-proof.json`; R01 and R02 iterations and actual official FIFO1254 native images are retained. Source fire damage/smooth scalp, source drapery/face proportions, bilateral curated pose, attendant anatomy and broader room ornament still differ from the reference. **Visual acceptance remains false.** No complete film or Blender export was produced in this adoption pass.

The sections below are the historical modeling record. They do not identify the current central runtime asset.

独立的参考 06 程序三维重建候选。入口 `index.html?render&defer&w=768&h=768`，读取共享 Three.js vendor、本场景声明的真实三维造像网格和地板/木纹素材；参考照片不参与渲染，不读取外部网络素材。

## Runtime

`window.temple.ready` 为真后可调用：

- `renderReference(6)`：重置至参考机位并同步绘制到默认 framebuffer。
- `renderView(position, target, time=0, fov=62)`：指定三维机位同步绘制。
- `renderShot(localTime, options={})`：0–7 秒，从中央六瓣金色供器的前饰与卷耳近景，低跪姿拉远到参考机位。`options.focusDistance`（米）与 `options.fNumber` 可覆盖运动段焦点。
- `info()`：几何、光影与诊断信息。
- `dispose()`：释放运行资源。

`renderer`、`scene` 和 `camera` 也公开。Renderer 使用 `preserveDrawingBuffer:true`；defer 下不自动绘制，没有 RAF 循环。

## Scope

室内基础复制自 `reference6-v13`，所有新改动留在本目录。继承真实几何的三尊造像、尖叶镂空背光、莲座、黑漆描金供台、供器、灯笼和垂饰；重调低跪机位、雕塑体块细节、袈裟起伏、金材质与地板错缝。渲染采用固定阴影、房间立方体环境采样、接触 AO 与粗糙地面平面反射。

此文件不构成视觉验收结论，视觉检查记录见 `qa/ten-reference/06/`。

## 镜头候选 camera74

此分支从 `1f88db0` 建立，保留该基底的 32 头、几何、材质和灯光。运动源为 `src/reference6-camera-shot.js`：三次 Bézier 轨道配五次 minimum-jerk 时间曲线，姿态使用独立的 quaternion slerp。设置姿态直接拷贝四元数，诊断用 `targetWitness` 是光轴上的焦平面点。全程 FOV 固定 62°，没有光学变焦。

近景主体通过对现有供器总成做只读射线求交定位：中央六瓣金属供器前部浮雕、黑色卷边与两侧卷耳，世界焦点约 `[0,1.471,1.19224]`。起镜位置 `[.18,.82,2.14224]`，中段位置约 `[.08625,.70,5.36499]`；镜头始终低于 .82m。7 秒明确调用原参考姿态：位置 `[0,.58,8.4]`、目标 `[0,2.4,-2.3]`、FOV 62°。

原场景没有景深通道。`src/shot-focus.js` 仅为运动镜头加入基于实际不透明深度的轻微光学散焦：沿用原相机 filmGauge35mm，固定约 29.12mm 焦长、f/2.8，弥散半径上限 6px。焦平面约从 1.166m 平滑转到中段 5.083m；最后1.1秒平滑减去散焦，7秒完全旁路此通道。`renderReference` 和 `renderView` 也旁路，因此原参考焦点/光学模式保留。透明玻璃和被遮挡背景的散焦仍是屏幕深度近似。

实际 0、3.5、7 秒的1254px三帧见 `qa/ten-reference/06/iteration-camera74/`。camera73 在出帧前被错误的供台 Z 范围护栏拦截，已保留失败报告与源快照；camera74 改为读取模型已有供器轴心后成功出三帧。没有运行完整电影或测试套件。`qa/ten-reference/06/camera74-review/` 记录纯数学路径检查、几何/材质源文件不变证明和实际分镜。

此处只检查了三张实际画面及路径连续性；连续播放的节奏感仍需复核。现有供器、佛像和佛堂的造型与照片差距没有在本轮修改。

## Sculptural cast r7 — editable mesh workflow

The current triad is generated from `src/restoration-buddha.js`, with facial profile planes, continuous throat sections, nonuniform cloth load paths, shaped crossed legs and feet, and signed-distance palms/digits. The central raised hand uses the reference's three upright fingers and curved index/thumb loop. The resting palm, its fingers, and the wrist form one source surface. Source proportions restore the original `2.10/3.26` central figure conversion; the later `2.60/3.26` conversion made the head visibly too high.

`modeling/build-sculptural-cast.mjs` exports the editable procedural volumes to `qa/ten-reference/06/sculptural-cast-r7-build/raw`. `modeling/fuse-sculptural-cast.py`, run through `tools/run-blender-queued.mjs`, physically unions the body, face, robe, sleeves, knees, feet, and hands with a 4.5mm model-unit voxel remesh, then gently relaxes and reduces redundant triangles. The browser loads these actual indexed surfaces from `assets/sculptural-cast-r7/` using `src/sculptural-cast-assets.js`. The meshes receive the scene's real lights and shadows and are used by the existing camera and film renderer. These assets contain positions, normals, neutral object UVs, and triangle indices. They contain no projected/reference RGB, depth photograph, image plane, generated replacement frame, or view-dependent appearance.

Regenerate from repository root:

```sh
node reconstructions/scene-06/modeling/build-sculptural-cast.mjs
node tools/run-blender-queued.mjs reconstructions/scene-06/modeling/fuse-sculptural-cast.py
```

Each generated manifest records component topology and bounds; provenance records the editable source hash and Blender operation. Topology validity does not establish photographic fidelity. `visualAccepted` remains `false`; reference, true subfrustum, and rejected iteration evidence are preserved under `qa/ten-reference/06/`.

## Sculptural cast r8 — genuine anatomical mesh

The central procedural head is now removed above its closed neckline and replaced by actual structured-light head geometry from the CC0 Fralin Museum / University of Virginia dataset [doi:10.18130/V3/NCPOAE](https://dataverse.lib.virginia.edu/dataset.xhtml?persistentId=doi:10.18130/V3/NCPOAE), by Matthew Schneider and Will Rourk. Credit: The Fralin Museum of Art and the University of Virginia Library. Original primary metadata, license, original mesh, checked file hash, and all affine/nonlinear transforms are declared in `assets/cc0-fralin-buddha-head/`. Source vertex RGB and textures are unused.

The fuser trims the original hair and neck, fits forehead/chin/eye-line extents, extends only rear auricles, and physically unions this independently lit anatomy with the existing body/robe/hands. The browser's actual triangle meshes are under `assets/sculptural-cast-r8/`. The r7 generator command above remains the editable body/hand source; the current fuser produces r8. The source head is a different historic artifact used as an anatomical base, not a scan of the photographed statue. Its source anatomy and the resulting native hall render must still be compared with the photograph. `visualAccepted:false` remains in force.

The prior r7-04 mesh assets are preserved alongside their native review images in `qa/ten-reference/06/iteration-scene06-sculptural-cast-r7-04/preserved-cast-assets/`.

The corrected r8 cast is now the regular live/reference/free-camera/film asset; the temporary render/defer candidate switch has been removed after upright native inspection. All three cores pass an independent closed/oriented mesh audit in `qa/ten-reference/06/physical-cast-r8-audit.json`. The central width and lotus radii receive a final reference-led fit while keeping seat heights, crown height, camera, altar, and light positions. This is an anatomy/form improvement checkpoint, with `visualAccepted:false`; the historical base's facial identity and the full room remain visually unaccepted.

## Sculptural cast r9 — source-led anatomy and botanical carving

R9 preserves the committed r8 snapshot and its input scan. `modeling/build-sculptural-cast-r9.mjs` and `modeling/fuse-sculptural-cast-r9.py` produce a new asset pack in `assets/sculptural-cast-r9/`. Actual mesh-coordinate sculptures fill and round cheek/jaw/forehead planes, tilt the real closed lids down, soften nose projection and mouth corners, and retain the true ear helix/concha without the prior stretched rods/added pendant lobes. Each attendant receives proportion-fitted head anatomy and a source-led softly open mouth. The complete seated poses, crowns, furniture grounding, low camera, and lights stay in place; a different historical full figure is not substituted.

Attendant palms/digits are signed-distance cup volumes with a curved physical wrist bearing, and chest/knee cloth folds are integrated surface masses. The lotus has a continuous convex/domed bearing supporting real closed petal roots rather than floating petal shells. `src/mandorla-botanical-cast-r9.js` replaces the old traced bright-pixel branch skeleton in all three mandorlas with a real bearing trunk, broad scrolls, peripheral carved volutes, subordinate shoots, and closed lobed leaves. The original photo is the visual master; all interpretations remain editable three-dimensional geometry with real backs and source-independent lighting.

The r9 asset manifest and build provenance remain under the new pack, with the same primary CC0 source/author proof under `assets/cc0-fralin-buddha-head/`. Geometry integrity and rendered output are separate from likeness. `visualAccepted:false` remains in force.


## R10 sculptural candidate (unaccepted)

R10 keeps the R9 seated gesture, +Y-up/+Z-front axes, original low camera and all altar/seat contacts. It sculpts the actual CC0 anatomical mesh toward a quieter eye/lip/jaw and a real submental return behind the chin, blending into a raised flared clavicular bearing. The body source now has six primary hanging folds with shorter tributaries, a hierarchy of gathered sleeve/stole folds, curved distal fingers and less repetitive attendant cloth. Source-photo landmark guides are manual approximate proportions, recorded in `modeling/scene06-r10-sculpture-landmarks.json`; photographic RGB/depth is never applied to the sculpture.

The lotus uses three closed petal families with broad bellies, rolled margins and more returning tips, rooted in the original continuous bearing. The original mandorla envelope/scaffold now carries deeper scalloped acanthus sections, vein valleys and rolled tips. R9 cast assets and its complete physical study are preserved.

Build the real editable sculpture source with `node reconstructions/scene-06/modeling/build-sculptural-cast-r10.mjs`, then `node tools/run-blender-queued.mjs reconstructions/scene-06/modeling/fuse-sculptural-cast-r10.py`. Content-addressed mesh publication is atomic and live/reference/free-view/movie use the same R10 pack. All three generated cores are connected physical surfaces; this establishes no anatomy, likeness or photo acceptance. Native full/detail inspection is required. `visualAccepted: false`.

The first R10 native comparison exposed a head/crown height error and doubled lip ridge. Its exact model source and entire cast pack are preserved in `qa/ten-reference/06/iteration-scene06-r10-anatomy-drapery-native-01/`. The follow-up applies a real head/crown translation of -.180 central model units (attendants -.1404 after anatomical retarget), compacts the complete measured lip/corner region, and keeps the scan's actual closed-lip surface. It removes the extra lip ridge and retains the original camera/body/seat/furniture anchors. This is a narrow source-photo proportion fit with actual 3D geometry, pending native inspection.

R10-04 replaces the hard lower-face patch with a broad volumetric head reconstruction: separate C1 skull/malar/buccal/jaw/chin/throat profiles and normal-directed clay pads reshape actual 3D tissue volumes. Measured fine anatomical relief from the genuine CC0 mesh is separated from a temporary smooth base, then restored along the new surface normals, including real orbital/nasal/labial/concha form. The temporary base is not the final head; no photograph, RGB, projected plate or face normal-map is used. The measured 3D lip relief is retargeted over the curved mouth volume rather than adding an analytic double ridge. The source records profile rows and the transfer in the cast provenance. Camera and materials remain fixed.

The backlight carving now has closed keeled flame/palmette tongues with returning curled tips, subordinate tongues and real voids on the original mandorla scaffold, replacing R10-03's maple-like silhouettes. The exact R10-03 state remains in `qa/ten-reference/06/r10-03-checkpoint.json` with complete source/cast snapshots. Photographic acceptance remains false pending actual native review.


## R11 soft-tissue and tension-drapery candidate (unaccepted)

R11 continues the committed R10-04 source (4b504cf, native identity 23f22b8e…) with the same low camera, lights, crowns, seat conversion and furniture bearings. C2 cubic sections reshape the real cheek, jaw, chin, submental return and throat around the whole head circumference. Genuine CC0 nasal/orbital anatomy remains part of the actual mesh. The different artifact’s puckered labial relief is removed; two newly authored closed shallow labial solids follow the curved skin, share a recessed cleft and fuse into the cast. A gentle orbital patch warp lowers outer corners while preserving fuller measured orbital planes.

New closed cartilage ears supply rounded lobules, conchae, helix and branching antihelix on one continuous skin, joined into the head. They replace the broken partial scan-ear protection transition from rejected R11-02; the visible pinnae are newly authored geometry, not claimed to be scanned conchae. Rejected R11-03 QA preserves the executed fuser and a descriptive-string-only attribution correction. The following fresh bake records its exact current fuser hash. Native -03 also exposed that the new conchae were buried behind the head; -04 moves and turns the complete pinnae forward and shortens their rounded lobes, exposing the real cartilage surfaces.

The torso now has four unequal broad hanging folds with shorter tributaries, differing sleeve/stole tension, unequal wrapped crossed knees, a two-dominant-fold apron and new attendant sash gathering. Three actual cupped lotus sheet archetypes have rolled margins and different belly/tip sections on the original bearing. The R10 flame/palmette mandorla scaffold stays in place.

Build with `node reconstructions/scene-06/modeling/build-sculptural-cast-r11.mjs`, followed by `node tools/run-blender-queued.mjs reconstructions/scene-06/modeling/fuse-sculptural-cast-r11.py`. Actual SC07 meshes contain positions, normals, neutral UVs and triangle indices; no source RGB, photograph plate, depth-photo surface or AI replacement frame is used. The same R11 pack serves live/reference/free-view/movie. Unchanged oldgold detail surfaces reference the R10 content-addressed files, avoiding duplicate copies.

Rejected R11-01/02 preserve exact editable sources, manifests/hashes and native full/true-close evidence under `qa/ten-reference/06/`; their regenerable unselected core binaries were pruned to avoid duplicate 75–76 MB archives. R10-04 remains in Git. R11 is a working sculptural candidate; simplified anatomy, cloth and carving remain subject to native visual review. Connected geometry and error-free rendering do not establish likeness. `visualAccepted:false`.

## 2026-10-22 monumental altar V3 candidate

This is an **unaccepted reconstruction candidate**, not a finished photographic match. The new work replaces the shallow branch halo with three spatial bearing bands, carved palmette/flame solids, small connected cloud scrolls and solid chased head wheels. Cabinet fronts combine projecting modeled creature anatomy with closed variable-section cloud carving. The near-ceiling chains now occupy annular depth bands; the side banners and column framing are repositioned as actual objects. Asymmetric leaves and white cupped flower petals grow from their modeled vessels.

A major ground-layout error was corrected in geometry: the transverse mat is at world Z5.20, rather than Z2.82; side mats are at Z5.60. The low prayer table and cushion advance1.85m from their prior positions and scale about their floor contacts. The central ritual vessel stays behind on its own floor-bearing stand. The camera remains at Y0.58m, looking upward from a kneeling eye height.

The central provisional R11 statue uses an actual licensed face/ear mesh and two raised inward thumb–index loops. Its head/neck/body bridge is modeled geometry, and the source scan face is not non-rigidly warped. Side figures retain independent prior bodies, poses, dark caps and crowns, but their prior faces are clipped away and replaced with rigid actual scan cores. Both cut bodies and fitted heads are capped closed. The V3 initial neck overlap is0.02 modelunits; V4 raises the authored shoulder/collar bearing0.18 beneath the unchanged actual head, shortening exposed throat. Reproducers are `modeling/build-attendant-faces-v3.py` and `modeling/build-attendant-bearing-v4.py`, both using the official Blender FIFO wrapper. Ordinary PBR materials are used for the sculptural surfaces.

Attribution: **Buddha Head by beachmouse, CC BY4.0**, via [Sketchfab](https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab) and the public Objaverse mirror. Original bytes and creator metadata are preserved under `assets/ccby-beachmouse-japanese-head`; `LICENSE.md` states the transformations. The creator records a Japanese tea garden location in California. Maker, manufacturing origin, period and date are undocumented. This is a different sculpture from the reference. Runtime SC07 files contain positions, normals, neutral UVs and indices, with no source scan image maps or reference photograph RGB.

Actual1254px full and genuine camera-subfrustum altar reviews are retained under `qa/ten-reference/06/iteration-scene06-monumental-altar-v3-*`. R01 failed an indexed/nonindexed merge and produced no valid frame; the failure receipt remains. The current R11 native includes connected lower/outward chest-level arms, a raised compact collar and knee folds carved directly into the closed leg/core volume. R08 high hands/long neck, R09 jagged knee seam and R10 detached rear sheath are retained as failed predecessors. Full, true altar-subfrustum and low three-quarter native views confirm the detached card and cracked patch are gone. Fidelity remains unaccepted: legs still read as long polished bars, cloth folds are too rippled/repetitive, the face type differs, and attendant bodies/crowns are stylized. Parent is evaluating an actual complete Japanese CC BY measured-surface donor as the next substantive body route; no NC source is automatically integrated. `lookdev/scene06-monumental-altar-v3/review-progress.json` records the actual evidence and limitations.

Failed outputs and the incoming dirty R11 source are preserved. Exact code/manifests checkpoints were saved for R05, R08 and current R11; some earlier intermediate output receipts retain hashes without complete separate source trees. No acceptance is claimed from closed topology, zero GL errors or triangle counts. No new film was generated in this V3 reconstruction lane.

The held R11 candidate and exact source hash are recorded in `lookdev/scene06-monumental-altar-v3/handoff-r11-provisional.json`. Current body source is `assets/foundation-r11`; sides use `assets/attendant-bearing-v4` with unchanged actual V3 head bytes. The source/mesh audit confirms identity and binary integrity only. Foundation material notes distinguish burnished jewelry from generic gilt; the frozen native mapping difference is recorded in the handoff instead of silently changing its evidence.

## Sculpture165 R01 — actual weighted-mass candidate, unaccepted

The main figure now uses the actual `assets/sculpture165-r01/` indexed meshes, generated by `modeling/sculpture165/build.py` and `geometry.py`. Closed broad variable-section thigh/knee masses replace the returning inflated leg tubes. Unequal cloth planes turn across the front and upper three-quarter thickness of those masses, with a forward inner-lap support physically joining crossed insteps and the hanging apron. Broader, unequal torso turns and short tributary creases replace repeated narrow chest ribs; sleeve folds follow the covered arm. The raised paired loop gesture, true neck attachment, original low camera and altar bearings remain.

The head remains **Buddha Head by beachmouse, CC BY4.0**, from the previously recorded [Sketchfab source](https://sketchfab.com/3d-models/buddha-head-5feec372c644454fb9514db5b1834eab). R01 openly proportionally sculpts its actual three-dimensional cage: height-dependent narrowing, mild depth compaction, broad lip-projection reduction and outer orbital settling. It no longer claims that the original scan cage is rigid or unchanged. This different donor is from a Japanese tea garden in California according to its creator; maker, manufacturing origin, period and date remain undocumented. Original source bytes/license/metadata remain under `assets/ccby-beachmouse-japanese-head/`. No NC geometry, scan RGB, source photo texture, reference-facing surface or generated replacement frame is used.

The primary agent reviewed and hash-pinned this pure CPU mesh-only recipe in `tools/run-reviewed-cpu-authoring.mjs scene06-sculpture165-r01`; actual image/video rendering still uses the official GPU FIFO. The successful mesh build and its source hashes are recorded in `lookdev/scene06-sculpture165/r01-cpu-authoring-receipt.json`. Native full1254, true hero-subfrustum and low3/4 inspection completed in `qa/ten-reference/06/iteration-scene06-sculpture165-r01-*` and were **rejected for fidelity**: actual knee masses still read as smooth long pillows, chest turns as parallel ribs, insteps as stacked bars, and the donor orbits/lips as unsuitable for the calm reference expression. `lookdev/scene06-sculpture165/r01-native-review.json` records these findings; `r01-native-source/` preserves the actual runtime source and receipt identity. The exact incoming R11 source `a13508d8…` and binaries remain preserved. The current scene native identity is `86fd4d25e3f24ae8644365e7aeb5adeee045a4acb06f77f273fbc372c55ffece`. `visualAccepted:false`; valid connected geometry does not establish likeness or completion. The separate unbuilt R02 face/cloak/instep source awaits fresh CPU review, while the primary agent's independent CC0 Tang cloth donor lane prepares genuine weighted leg/torso surfaces before the next knee replacement.

## Sculpture165 R06 — current real-head/CC0-cloth candidate, unaccepted

The current working source uses `assets/sculpture165-r06/`. The main face/ears/jaw/neck are the actual **Buddha head by peel-3d.com, CC BY4.0**, [creator page](https://sketchfab.com/3d-models/buddha-head-fb17c123ad9c4c0fb6baf723b3fffd79). Culture and era are undocumented; this is not a verified Japanese/Amida artifact. Lane173's exact original source, clips, normals, trace sidecars and primary attribution remain retained. R06 applies uniform.650 scale and measured neck translation only; all166523 source head vertices/330147 triangles and original normal vectors remain in the output. Measured crown/neck cuts connect authored scalp/neck surfaces. No formula facial tissue or local scan-face smoothing/remesh/projection remains.

Actual Daniel Pett CC0 Tang knee/torso cloth replaces the prior analytic knees/ribbing, with an explicit body affine fit and separately verified bounded erosion-restoration alternate. Original inputs and all deltas remain retained. Local waist/shoulder/neck/under-leg closures are actual3D; the mounted shell is closed with original-source direction anchors. Authored arms/hands receive their own local CPU union; the measured face/cloth do not. All source licensing and changes are declared in the runtime manifest/provenance and `lookdev/scene06-sculpture165/README.md`.

The primary reviewed/pinned the22-file `scene06-sculpture165-r06` CPU recipe. Native full1254, true hero/face subfrusta, actual low3q, eye-level face3q and true profile were rendered and inspected at source `a16424df1fbf4cadbf9381a66b3ca8c7191d487df12e8eb21620526b0ecfc112`. These views are retained under `qa/ten-reference/06/iteration-scene06-sculpture165-r06-*-native/`. Real facial anatomy is stronger, but the flared neck bridge, broad exposed under-leg return, eroded stone cloth, side wave hair, source-face style and room/camera fit remain visibly unsuitable. `r06-native-review.json` records the rejection and `r06-native-source/` preserves the exact runtime. Earlier R01/R02b/R03b/R04 failures remain independently preserved. No source/geometric validity fact establishes photographic acceptance, and no new film has been generated.
