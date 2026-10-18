# Scene 06 — 佛堂

独立的参考 06 程序三维重建候选。入口 `index.html?render&defer&w=768&h=768`，仅引用共享 Three.js vendor，不读取模型、照片纹理、HDR 或网络素材。

## Runtime

`window.temple.ready` 为真后可调用：

- `renderReference(6)`：重置至参考机位并同步绘制到默认 framebuffer。
- `renderView(position, target, time=0, fov=62)`：指定三维机位同步绘制。
- `renderShot(localTime)`：0–7 秒，近供器/莲座的低跪姿平稳后拉到参考机位。
- `info()`：几何、光影与诊断信息。
- `dispose()`：释放运行资源。

`renderer`、`scene` 和 `camera` 也公开。Renderer 使用 `preserveDrawingBuffer:true`；defer 下不自动绘制，没有 RAF 循环。

## Scope

室内基础复制自 `reference6-v13`，所有新改动留在本目录。继承真实几何的三尊造像、尖叶镂空背光、莲座、黑漆描金供台、供器、灯笼和垂饰；重调低跪机位、雕塑体块细节、袈裟起伏、金材质与地板错缝。渲染采用固定阴影、房间立方体环境采样、接触 AO 与粗糙地面平面反射。

此文件不构成视觉验收结论，视觉检查记录见 `qa/ten-reference/06/`。
