# 参考 01：夕照寺院池庭

第二轮独立 Three.js 场景，参照 `references/hd/0-照片-1.jpg` 实看重建。

入口：`/reconstructions/scene-01/index.html?render&defer&w=768&h=768`。由仓库静态 HTTP 服务提供；importmap 指向仓库根 `../../vendor/`。

全部建筑、屋瓦、斗栱、栏杆、桥、石灯、树枝、叶、莲花、岩石、石材、木纹、天空和水面均由程序几何、DataTexture、着色器生成，无照片平面、外部纹理、HDR 或下载模型。池面使用真实平面反射；照明和阴影稳定确定性。

公共 API：`window.temple` 的 `ready`、`renderer`、`scene`、`camera`、`renderReference(1)`、`renderView(position,target,time=0,fov=59)`、`renderShot(localTime)`、`info()`、`dispose()`。固定照片机位每次 `renderReference(1)` 均恢复；7 秒后拉镜头到照片机位；无无限 RAF；`defer` 不自动绘制主画面。相机眼高为建模廊台地板以上 1.40 m。

CPU 检查：`node --experimental-loader ./qa/ten-reference/01/cpu-loader.mjs qa/ten-reference/01/cpu-check.mjs`。

尚需逐轮 GPU 对照图检查，CPU 检查不代表视觉验收。
