# Scene 01 — coupled architecture phase 148

This held draft keeps the existing low reference camera, pagoda pose, bridge bearings, planted banks, stream, timber/stone assets, lighting and dolly. The main hall's occupied left facade and stone platform now retract coherently behind the existing broad eaves, opening its relationship to the pagoda. The physical upper post grid includes a wider central bay for the plaque. Approximate common-camera observations and current pagoda contours are recorded in qa/ten-reference/01/contour148/.

The main roof has an actual irimoya half hip and closed upper gables, projecting trusses, infill and bargeboards. The upper storey now has a closed floor and both end frames. The lower roof collar is cut at analytic intersections with those wall planes. Receivers, seats and standing bearing posts follow the new roof underside; paired cantilevers connect the inset end frame to the held outer eaves. These are actual 3D dimensions and connected parts, with inferred hidden depths.

The 148 phase adds no media assets and samples no reference-scene pixels. Existing source asset provenance remains authoritative. Exact source, geometry scope and limitations are in layout148-provenance.json. Native 1254 full/roof detail, courtyard detail, oblique and three unchanged-path poses are under qa/ten-reference/01/iteration-scene01-solmax-*-148-* and the similarly named148 directories. All are produced through tools/render-one-reconstruction.mjs and its shared GPU mutex. A genuine detail keeps the main subfrustum while the independent planar reflection captures a complete physical projection.

visualAccepted remains **false**. Carving, roof profiles, facade depth, some hall/pagoda relationships and photographic light/material response remain approximate. Existing vegetation, bank and stream gaps are preserved in this architecture scope. The baseline 5d8fc84e source and prior physical render stay retained; R01–R03 native candidates and source archives are also retained. This is a reconstruction checkpoint, not a completed photographic match or film.

# 参考 01：夕照寺院池庭

独立 Three.js 三维场景；参考图为 `references/hd/0-照片-1.jpg`。入口为 `/reconstructions/scene-01/index.html?render&defer&w=1254&h=1254`，由仓库静态 HTTP 服务和本地 `vendor` 提供。

**仍为重建草稿，visualAccepted: false。** 原图与当前三维画面在木构比例、细节密度、材质受光和植物自然程度上仍有明显差距。成功加载、着色器通过和帧非空均不代表摄影一致性。

2026-10-21 的 132 重建更换了主殿原先大片亮漆上层墙面和独立块状斗栱，加入闭合曲线实木斗栱、连续承重枋、实际圆柱、退后的灰泥填充、下檐内暗藏承重槛、雕刻金箔端板和分段花草浮雕。主入口立框和额枋按照片中的较高门额重新连接。檐瓦保留实物卷瓦几何。前景廊台、支撑和已修复的左廊后拉路径保留。

池庭修改包括更宽的桥身、偏左的中央木石支架、实际砌筑桥台和通向主殿的连续台阶小径、连续土岸、按岸面落地的扫描石块、贴合扫描面的闭合苔藓薄实体、灌木和圆冠中景树。石灯位置按原图调整，灯体有石材颗粒贴图、封闭的石屋盖、莲苞、立柱和实木窗棂。瀑布的台阶、水路切槽和承托石床共同移动，水流条带有不同相位；莲叶是有折皱的实际曲面。水面反射来自本场景，带缓慢波纹、菲涅耳和粗糙反射。

场景使用下列声明资产；照片只用于量测和对照，没有作为建筑、植物、地面或整幅场景贴图：

- Poly Haven 的 `lacquered_cherry_wood` 扫描木材及 `rock_moss_set_01` 六块扫描岩石，CC0；来源和许可证见根 `assets/polyhaven/` 对应目录的 `provenance.json`。
- 原有 Blender 斗栱/花草浮雕套件 `assets/temple-joinery-v01/`。
- `assets/generated-golden-sky-v01/` 的独立生成纯天空全景，其 provenance 记录生成方式。它不含参考图建筑、庭院或景物，天空与实际太阳方向耦合。
- `src/garden-surface132.js` 的花岗石颜色/凹凸/粗糙度纹理由固定种子 132219 在运行时生成；苔藓实体取自扫描石材原有表面位置/法线。没有新增下载纹理或照片投影。

原有源码和资产声明优先于早期“完全无外部资产”的旧说明；该旧说明已失效。

公共 API：`window.temple` 提供 `ready`、`renderer`、`scene`、`camera`、`renderReference(1)`、`renderView(position,target,time=0,fov=59)`、`renderShot(localTime)`、`info()`、`dispose()`。固定照片机位每次绘制都恢复；七秒镜头从前景栏杆顶饰退出至左廊构图。眼高为廊台以上 1.40 m。无无限 RAF，`defer` 不自动绘制。

原生检查必须通过 `tools/render-one-reconstruction.mjs` 的共享 GPU 队列。132 轮次图片、真实子视锥细节、源码哈希、保留源码和报告在 `qa/ten-reference/01/iteration-scene01-solmax-*`。第一轮裸露圆锥土丘是被拒绝候选，已保留，后续恢复实际砌筑桥台。任何 Cycles 旧研究都不是本轮源码的等价帧。
