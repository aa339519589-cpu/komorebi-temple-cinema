# 寺院十景：真实 3D 重建与影片制作（进行中）

目标是按十张参考图分别重建建筑、佛像、园林和地面，再制作十段从近处拉远的电影镜头。**目前仍明显未达到参考照片的细节、布局和光影要求，十景均未验收。**

场景画面来自实际三维网格、独立材质、灯光与相机。参考照片用于并排比较；已被否决的照片深度／高斯影片不作为模型或成品依据。生成的天空与雕刻辅助图有独立来源记录，雕刻辅助值转换为实体浮雕网格，不用作画面替身。

## 本地查看

从仓库根目录运行：

```sh
PORT=4318 node tools/server.mjs
```

- [十景影片制作预览](http://127.0.0.1:4318/film.html)：60 秒叠化剪辑、70 秒完整源镜头、十景原图与实际渲染对照。
- [左侧参考图／右侧实时 3D](http://127.0.0.1:4318/compare-ten.html)：十个独立场景入口。

播放器当前指向 `native-rebuild-review-20261021-e` 制作检查点，960×960、24 fps。每个源镜头 7 秒、168 帧；九处叠化重叠得到 60 秒、1,440 帧的剪辑。十景均已加入这一轮重建；之后的建筑比例、佛像塑形、园林层次和物理光照仍继续修改。

本片逐镜头核验公开 Git 源码：十景均对应同一个完整源码快照 `69211a6`，包含各景声明的原始素材文件。各镜头完整文件集、源码与视频哈希在 [影片记录](qa/ten-reference/film-review-native-20261021-e/film-build.json)；[起／中／末实际视频帧](qa/ten-reference/film-review-native-20261021-e/all-shots-start-middle-end.jpg) 和 [十景原图／实际渲染](qa/ten-reference/film-review-native-20261021-e/all-ten-reference-left-native-right.jpg) 可直接查看。它是未通过照片匹配的制作版，此后模型继续修改。

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
