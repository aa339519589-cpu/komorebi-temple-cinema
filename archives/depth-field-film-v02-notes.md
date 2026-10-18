十张高清参考图对应十个独立三维可见表面；每个镜头从近景平滑拉回参考机位。Three.js／Spark实际渲染2100帧，非视频生成模型输出。

- `temple-ten-scenes-60s.mp4`：1080×1080、30fps、1800帧；九次叠化组成一分钟。
- `temple-ten-scenes-70s.mp4`：十个完整7秒镜头、2100帧。
- `ten-depth-field-models-v02.zip`：十景真实3D Gaussian PLY、推断深度、相机假设、来源／哈希与Apache许可证。在仓库根目录解压即可供查看器读取。
- `source-shots-and-receipts.zip`：十段实际源镜头、逐帧渲染记录与每景首／中／尾截图。
- `ten-shots-actual-frames.jpg`：三十帧实际出图总览。校验信息见`assets.json`。

这版使用Apache2.0许可的Depth Anything V2 Small推断相对深度，再将原图颜色反投影为各向异性的三维高斯点场。未使用SHARP预测、相机或PLY。源程序、模型和相机哈希随工程保留。

当前是可见表面重建，深度／尺度未经实测；光照与反射烘焙于颜色，背面、闭合实体及可重打光材质尚未补齐。不宣称99.9%或完整实体建模验收。原有十景实体代码和Blender建模过程另行保留，项目仍在继续。

配乐：《Oboro》，PeriTune／Sei Mutsuki，CC BY4.0。出处：https://peritune.com/blog/2019/04/08/oboro/ 。本片使用剪辑、响度归一化和淡入淡出。

下载MP4到`output/depth-field-film-v02/`，解压模型ZIP到仓库根目录，运行`PORT=4318 node tools/server.mjs`后打开`http://127.0.0.1:4318/depth-film.html`，即可播放影片并逐景左原图／右三维对照。
