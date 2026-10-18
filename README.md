# 十张参考图逐景重建（进行中）

照片深度／高斯影片方案已被用户明确否决，已从默认展示撤下，相关数据仅保留为失败过程档案，不能作为本项目成品或完成依据。

当前继续的是建筑、佛像和园林的真实实体网格、独立材质、灯光与相机渲染。参考原图仅用于比较，不投影到场景或以点场替代建模。

运行`PORT=4318 node tools/server.mjs`后打开[十景实体建模对照](http://127.0.0.1:4318/compare-ten.html)。真正的模型代码在`reconstructions/scene-01/`至`scene-10/`，当前仍未验收。

当前分支：`work/ten-view-reconstruction-20261018`。全部十个独立场景都可查看。2026-10-19继续整合正殿与石道、庭院屋面、低莲池承托、深庭门廊和夜寺灯具的实体修改；原生渲染与未解决差距保留在对应QA目录。十景的摄影匹配均未验收。

当前代码新增了廊下独立实木板与托木、入口实体佛龛和花岗岩石阶、十二块近景雨石及随石面起伏的局部湿反射，以及手工曲线制作的闭合铸花门饰。实际近景与起／中／末机位保存在相应QA目录；这些修改仍未达到参考精度。

2026-10-19的[1440方形十景制作存档](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/mesh-rendering-2026-10-19-r01)提供60秒、70秒及十条原始镜头，来源固定为`ba9ada9`。它早于上述最新修改，属于未验收制作存档。

**18:32实体网格制作版为历史检查点，十景均未达到参考图的摄影质量，实体模型仍未完成验收。**

运行 `PORT=4318 node tools/server.mjs`：

- [十景影片与全部原图／实渲对照](http://127.0.0.1:4318/film-review-1832.html)。
- [左原图／右实时Three.js场景](http://127.0.0.1:4318/compare-ten.html)。
- [全部十景总览](qa/ten-reference/hour-1832/all-ten-original-and-current.jpg)。
- [电影与源版本记录](qa/ten-reference/hour-1832/media.json)。

十个镜头分别实际渲染210帧、7秒，1080×1080／30fps。70秒版本保留全部镜头；60秒版本通过叠化重叠剪辑，不改变源镜头运动速度。视频发布在[GitHub预发布检查点](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/parallel-modeling-2026-10-18-1832)，用户可下载到本地`output/hour-1832-film/`供上述页面播放。

- 场景源码：`reconstructions/scene-01/`至`scene-10/`。
- 十景编号、参考与入口：`reconstructions/ten-scenes.json`。
- 实际图、对照与逐镜头源版本记录：`qa/ten-reference/`。
- 影片生成源码：`tools/render-ten-scene-film.mjs`；在配置好的渲染环境中执行，十个镜头通过同一个GPU队列依次输出。
- 单景出图：`REFERENCE=4 WORKTREE=/绝对项目目录 SIZE=1254 ITERATION=新名称 node tools/render-one-reconstruction.mjs`。
- Blender木构与浮雕：[可编辑工程](assets/temple-joinery-v01/temple-joinery-v01.blend)，源脚本`tools/build-temple-joinery-kit.py`。

用户于2026-10-18允许使用Blender、图像生成及其他工具后，项目加入了实际木构／浮雕网格和有来源的CC0扫描木材、石材。图像引导、提示词、建模脚本、可编辑工程和许可证保留在项目中。原图显示在对照页面，实际场景的画面由三维几何渲染。`lookdev/buddha-face-study/`是另行保存的未采用试模。

配乐为PeriTune／Sei Mutsuki的《Oboro》。音乐、扫描资产与参考图片的分别署名和权利说明见[CREDITS.txt](CREDITS.txt)及[THIRD_PARTY.md](THIRD_PARTY.md)。

旧的`film.html`和通用场景v60保留为历史版本；当前十景制作版使用上述独立入口。
