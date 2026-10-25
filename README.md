# 寺院十景：真实 3D 重建与影片制作（进行中）

目标是按十张参考图分别重建建筑、佛像、园林和地面，再制作十段从近处拉远的电影镜头。**目前仍明显未达到参考照片的细节、布局和光影要求，十景均未验收。**

场景画面来自实际三维网格、独立材质、灯光与相机。参考照片用于并排比较；已被否决的照片深度／高斯影片不作为模型或成品依据。生成的天空与雕刻辅助图有独立来源记录，雕刻辅助值转换为实体浮雕网格，不用作画面替身。

2026-10-25 工作检查点：[十景保留实渲／参考对照](qa/ten-reference/working-model-review-20261025-o/all-ten-reference-left-render-right.jpg)有[各幅独立源码身份](qa/ten-reference/working-model-review-20261025-o/frames.json)。此固定对照包含第一景廊架和石岸、第三景承檐木构、第五景角灯，以及佛堂新柜面、连续背光雕刻和薄草席；新佛像姿态仍未纳入。供桌、跪垫、柜面、柱网和房间纵深正在继续重做；所有场景的摄影匹配仍未通过。

佛堂最新原生工作源 `19c197c5` 已合入实体高窗、滑屏、前左太阳、供桌、织锦跪垫、分层柜面与连续背光雕刻：[7 秒 1080×1080／24fps 实际拉远片段](qa/ten-reference/06/iteration-scene06-integrated309-published/motion-review.mp4)、[全幅](qa/ten-reference/06/iteration-scene06-integrated309-published/full.png)、[供桌局部](qa/ten-reference/06/iteration-scene06-integrated309-published/altar-detail-native.png)与[精确媒体身份](qa/ten-reference/06/iteration-scene06-integrated309-published/media.json)。此片静音，尚未合入下方冻结十景影片；主佛手势和胁侍造型仍在单独重建。画面仍有明显的造型、明暗与材质差距。

[完整几何的 Cycles 采光研究](lookdev/scene06-daylight284/publication/README.md)另保留可再生代码、材质参数和实际物理渲染；它与原生影片是两个明确区分的渲染检查点。

佛堂整屋研究原型 `53b7228f` 已保存为[可复原的精确源码覆盖包](lookdev/scene06-combined256/public-source53/README.md)，基于公开提交 `62ba98d1`，含真实供桌、房间、独立雕刻/藻井材料、实体滑动纸屏和间接可见度着色。[实际全幅](lookdev/scene06-combined256/actual-source53/full.png)、[供桌真局部](lookdev/scene06-combined256/actual-source53/table-detail-native.png)和[低侧角](lookdev/scene06-combined256/actual-source53/low-oblique.png)均由同一源实际渲染。它仍有明显造型和光照差距，此后柱头、织锦、漆座、侧像和实体多次反弹照明继续重建。[莲座258两轮建模与实际检查](lookdev/scene06-lotus258/delivery-r02/handoff-r02.json)独立保留。

新一轮十景工作影片F已完成媒体输出：[60秒／70秒及原生画面对照](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/working-film-2026-10-24-f)。影片固定于完整公开源码 `c355c5d4` 的独立快照，1080×1080、24fps，原生1620×1620采样后缩小。[快照核对](lookdev/film-sol61-232/snapshot-proof.json)、[重启恢复记录](lookdev/film-sol61-232/reboot-interruption242.json)与[实际媒体哈希／时长／帧数](output/sol61-rebuild-20261024-f-resume1/media-receipt.json)保留。两版均完整解码检查；抽样画面不证明逐帧照片精度或完全无闪烁。此片早于上面的供桌和整屋新模型，十景均未验收。

[佛堂228七秒工作运镜](qa/ten-reference/06/iteration-scene06-ceiling228-motion-r01-personal-nc/motion-review.mp4)与[花供233实际三轮记录](lookdev/scene06-living233/review-r03.json)可单独查看；[第一景九个实际编码帧](lookdev/film-sol61-232/scene01-f-nine-actual-frames.jpg)用于观察真实近景拉远过程。抽样画面不证明逐帧照片精度或完全无闪烁。

## 本地查看

从仓库根目录运行：

```sh
PORT=4318 node tools/server.mjs
```

- [十景影片制作预览](http://127.0.0.1:4318/film.html)：60 秒叠化剪辑、70 秒完整源镜头、十景原图与实际渲染对照。
- [左侧参考图／右侧实时 3D](http://127.0.0.1:4318/compare-ten.html)：十个独立场景入口。

播放器当前指向 `sol61-rebuild-20261024-f-resume1` 冻结工作检查点，1080×1080、24fps。每个源镜头7秒、168帧，九处叠化得到60秒、1440帧剪辑。十景源文件逐镜头身份见 [影片记录](output/sol61-rebuild-20261024-f-resume1/film-build.json)；[原生源帧清单](qa/ten-reference/film-review-sol61-rebuild-20261024-f-resume1/frames.json)和[原图／实际影片源帧](output/sol61-rebuild-20261024-f-resume1/references-left-renders-right.jpg)保留。

MP4超过Git单文件大小，存放在上述预发行资产。新检出仓库时，把两份 `temple-ten-scenes-60s.mp4`、`temple-ten-scenes-70s.mp4` 下载到 `output/sol61-rebuild-20261024-f-resume1/` 后即可本地播放；[下载地址与SHA-256](output/sol61-rebuild-20261024-f-resume1/public-media.json)明确保留。源代码许可不覆盖素材的独立非商用／署名条款。

本轮夜景另有 [1080×1080、24 fps 的真实 7 秒运镜草稿](qa/ten-reference/09/iteration-scene09-carried-hall-motion187-r02/motion-review.mp4)：从低机位殿前木构拉远到塔、桥和池塘。它没有配乐，只用于检查这一景的模型与镜头，不是十景成片。此前前景柱帽占据开场的版本已按实际画面退回，原帧与片段保留。

佛堂本轮另有 [206 真实 7 秒建模样片（1080×1080／24 fps，静音）](qa/ten-reference/06/iteration-scene06-combined206-motion-r01-personal-nc/motion-review.mp4)：195 窗外实体遮光与较柔散射、200 地面反射投影修正、198 供桌／坛体／织锦、199 连续三维衣褶和面部塑形已合并。原始雕像与所有失败候选保留；面相、发髻、背光雕花、家具和整体光感仍未达到参考。织锦是贴在真实靠垫上的生成材质，[原图与完整提示词](reconstructions/scene-06/assets/brocade201/provenance.json) 已公开；不用于替换场景画面。

## 源码与当前工作

- 十景模型：[reconstructions](reconstructions/)，各景为独立目录；[参考编号与入口](reconstructions/ten-scenes.json)。
- 原生全图、真实局部视锥与迭代差距：[qa/ten-reference](qa/ten-reference/)。有效渲染、着色器通过不代表照片匹配。
- 夜景新增了现有灯具的反平方照明、固定阴影、实际庭院反射探针，以及磨损花岗岩实体与水膜反射。[实际夜景](qa/ten-reference/09/iteration-scene09-physical-wet-courtyard-root-05-20261021/reference.png)。
- 雨景压低了过大的上层屋顶坡面，梁枋用闭合莲花唐草浮雕替换简单符号，并收敛水膜涟漪。[实际雨景](qa/ten-reference/10/iteration-scene10-subtle-ripples-solid-relief-root-11-20261021/reference.png)、[真实局部](qa/ten-reference/10/iteration-scene10-subtle-ripples-solid-relief-root-11-20261021/detail-native.png)。[雕刻来源与完整提示词](assets/ranma-relief-v01/provenance.json)。
- 第六景已在用户明确允许个人非商用使用后，接入 Scan-the-World／Sainsbury Centre 的真实日本阿弥陀佛模型，并重建连续承托的莲座与殿内梁架。[当前合并后的实际全幅](qa/ten-reference/06/iteration-scene06-combined206-r01-personal-nc/reference.png)、[供桌真实局部](qa/ten-reference/06/iteration-scene06-combined206-r01-personal-nc/detail-native.png)；[179 原始采用版](qa/ten-reference/06/iteration-scene06-nc-adoption179-r08-full/reference.png) 继续保留。这件模型及其衍生画面使用 **CC BY-NC-SA 4.0**；[作者、修改与独立许可](reconstructions/scene-06/ATTRIBUTION-AND-ASSET-LICENSES.md) 完整保留，项目源码许可不覆盖第三方素材。雕像仍是不同文物，发髻、衣褶、莲台和整个佛堂均未达到参考。原先的 CC0／CC BY 塑形研究继续保留。
- 第一景重建了承托木构、桥脚、岸坡和溪流；第三景重做了屋檐木构与拱桥；第七景重建连通地形、桥梯与有承托的廊顶；第八景重建了多层院落与闭合屋面。仍有明显的体量、植物、材质和光影差距。
- 第一景另有保持原始几何和相机的 Blender/Cycles 制作研究，修复了实例颜色传递；它不是原生 WebGL 像素等价图，也未通过照片匹配。[当前物理渲染与可编辑模型](lookdev/scene01-solmax-cycles-20261021/README.md)。
- 第九景也保留了完整相机、实例几何、薄纸透光和真实水面／湿石材的 Cycles 研究，含可编辑模型及所有再生脚本。[物理夜景](lookdev/scene09-solmax-cycles-20261021/README.md)。

## 再生渲染

以下命令在配置好的 Chromium／GPU 与 FFmpeg 环境中使用同一个渲染队列：

```sh
REFERENCE=4 SIZE=1254 ITERATION=new-still-review-04 node tools/render-one-reconstruction.mjs

REFERENCE=9 SIZE=960 MOTION_FPS=24 ITERATION=new-motion-review-09   node tools/render-one-reconstruction.mjs

FILM_ITERATION=new-ten-scene-review FILM_SIZE=960 FILM_FPS=24   node tools/render-ten-scene-film.mjs
```

渲染时应固定所录场景的源文件；工具会拒绝源码在录制期间变化的结果。Blender 导出与物理渲染也通过共享队列，详细命令见上面的 Cycles 研究记录。大型导出缓冲和 `.blend` 中间文件可由公开脚本再生。

## 授权与历史

用户于 2026-10-18 允许使用 Blender、图像生成和其他工具后，项目加入了有来源的 CC0 扫描材质及有建模来源的辅助资源。项目代码授权见 [LICENSE](LICENSE)，扫描资产、音乐与参考图说明见 [THIRD_PARTY.md](THIRD_PARTY.md) 和 [CREDITS.txt](CREDITS.txt)。配乐为 PeriTune／Sei Mutsuki 的 [Oboro](https://peritune.com/blog/2019/04/08/oboro/)，CC BY 4.0；影片选段并做音量处理、淡入淡出。

旧的制作版、被拒绝的方案和试模作为历史过程保留，不能代表已完成。此前的详细日志见 [制作历史](docs/production-history-through-20261020.md)。
