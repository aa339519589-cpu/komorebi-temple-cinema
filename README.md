# 十张参考图逐景重建（进行中）

当前分支：`work/ten-view-reconstruction-20261018`。十个独立场景都在持续按高清参考图修改，**十张均未通过画面验收，电影尚未完成**。

运行 `PORT=4318 node tools/server.mjs`，打开 [十景左右对照](http://127.0.0.1:4318/compare-ten.html)。左侧为完整高清原图，右侧为对应场景的实际 Three.js 渲染；支持同步放大、拖动检查、固定参考机位和近景起点。

- 场景源码：`reconstructions/scene-01/` 至 `scene-10/`。
- 十图编号与入口：`reconstructions/ten-scenes.json`。
- 实际图、左右对照与源指纹：`qa/ten-reference/`。
- 运行检查：`node tools/check-ten-review.mjs`（默认对照页端口4318，可用PORT指定）。
- 单景GPU检查：`REFERENCE=4 WORKTREE=/绝对项目目录 node tools/render-one-reconstruction.mjs`。

用户于2026-10-18放开工具限制后，第五景加入了有源码的 Blender 木构模型、由生图引导制成的真实浮雕网格，以及 CC0 扫描木材表面。原始引导图、精确提示词、建模脚本、可编辑工程、许可证和实际出图均已保存。参考图只显示在对照页左侧；运行检查核对场景没有请求这些参考照片。几何和运行检查通过，不代表形体、细节、材质或摄影效果合格。旧电影和旧场景保留为历史记录。

- 最新建模记录：[Blender辅助建模检查](qa/ten-reference/blender-assist-35/review.md)。
- 第五景原图与当前实际渲染：[左右对照](qa/ten-reference/05/iteration-exterior-satin35/comparison.png)。
- 第六景原图与当前实际渲染：[左右对照](qa/ten-reference/06/iteration-seat-contact32/comparison.png)。
- 木构与浮雕的可编辑工程：[Blender文件](assets/temple-joinery-v01/temple-joinery-v01.blend)，[实际网格检查图](assets/temple-joinery-v01/actual-blender-mesh-review.png)。

音乐署名与参考图权利说明见 [CREDITS.txt](CREDITS.txt) 和 [THIRD_PARTY.md](THIRD_PARTY.md)。

---

## 历史通用场景 v60

完整可运行的寺院场景源码。需要Node.js24.2或更新：执行 `node verify.mjs` 后运行 `node serve.mjs`，按终端地址打开浏览器。参考10条件场景使用 `/?scene=reference10-porch`，其他参考共用默认场景。需要可用WebGL；复杂场景软件渲染可能慢或失败。不会自动上传或回传。

## 本版变化
- 原前景门廊的木底板、垫层和陶瓦补齐纹理坐标，保留原裁切与几何表面。仅该条件屋面开启，不更改其他屋顶。
- 既有石灯帽重新划分顶、底、帽沿纹理图表，修复退化采样方向；纸窗、灯点、材质和物件位置保持。
- 纹理与凹凸采样可能可见变化，不称外观或光照结果相同。纹理方向和尺度属于建模假设，非照片唯一恢复。相机、造像、供台、庭院布局及光源预算不变。

## 范围和限制
本公开目录仅含运行源码、固定依赖与文件/语法/导入核验器。属于盲做表面修复，没有本版新渲染或照片全景验收。原屋面双面色彩材质与普通normal处理的背面覆盖限制仍保留；没有趁本次UV修复改变法线路径。原开放屋面、柱轮廓残差和宏观取景不确定性仍在，不混入失败增厚板或实验塔位。

不含原始照片、衍生像素标注、历史基线、私有执行报告、测量数据、渲染桥状态、凭据或图片。
