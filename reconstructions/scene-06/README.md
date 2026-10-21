# Scene 06 — 佛堂

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
