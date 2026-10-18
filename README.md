# 十张参考图逐景重建（进行中）

最新照片深度重建版：[60／70秒影片及十景3D数据](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/depth-field-film-2026-10-18-v02)。十景分别由Apache2.0许可的Depth Anything V2 Small推断深度，再反投影成真正的三维高斯可见表面，通过Three.js／Spark实际移动相机渲染。光色保留在点辐射中；背面、闭合实体和可重新打光的PBR材质仍未补齐，项目没有宣称99.9%或完整实体建模验收。

下载发行版两个MP4到`output/depth-field-film-v02/`，把三维模型ZIP在仓库根目录解压，再运行`PORT=4318 node tools/server.mjs`，打开[最新影片与左右三维对照](http://127.0.0.1:4318/depth-film.html)。

- 开放重建器：`reconstructions/depth-field/`；相机与尺度假设、原图和权重哈希均有记录。
- 三维查看器：`reconstructions/sharp-study-viewer/`，默认载入开放深度场v02；SHARP仅另存为方法研究比较，未用于这版影片。
- 影片源代码：`tools/render-depth-field-film.mjs`与`tools/render-depth-field-shot.mjs`。实际渲染2100帧，1080×1080／30fps，每镜7秒；60秒版用9次叠化重叠剪辑。
- 新版编号遵循高清照片顺序，05为佛坛、06为塔角。旧拼图实体场景的05／06顺序保留在单独映射中。

当前分支：`work/ten-view-reconstruction-20261018`。全部十个独立场景都可查看。2026-10-18的五路并行修改覆盖了其余八个外景，修正屋面穿插、建筑比例、斗栱、石灯、园林、雨地和材质。

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
