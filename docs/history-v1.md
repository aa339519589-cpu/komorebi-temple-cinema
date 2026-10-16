# 木漏れ日 · KOMOREBI

**状态：第一版已被用户否决，正在重制，不是成品。**

当前方向是高大、威严的殿宇与塔体，以及人眼以下和跪坐高度的敬畏视角。新构图与运镜测试在 `review.html`；进度与仍待完成的要求在 `qa/v2/progress.json`。旧的 `output/komorebi-*.mp4` 与历史检查仅对应已否决的 V1，不能证明重制版完成。

下列原版交付记录仅供追溯：

以用户提供的十幅寺院参考为构图依据，用 Three.js 纯代码生成的电影场景。

成片：`output/komorebi-60s.mp4` 和 `output/komorebi-70s.mp4`。两版均为 1920×1080、30 fps、H.264 + AAC；画面在 3840×2160 下逐帧计算，再以 Lanczos 缩至 1080p。60 秒版的十个镜头各 6 秒，70 秒版各 7 秒。两版分别按 30 fps 采样渲染，没有用变速丢帧来生成短版。

源码包保留代码、离线程序库、配乐与检查报告；MP4 单独提供。若解压源码包后使用影片播放页，请把下载的两支 MP4 放入 `output/`。实时三维场景可独立运行。播放页会为不含 H.264/AAC 解码器的浏览器选择另行编码的 1080p VP9/Opus 预览；下载按钮始终提供已验证的 MP4 母版。

## 本地观看与实时 3D

```sh
npm start
```

打开 http://127.0.0.1:4317/film.html 观看成片，或 http://127.0.0.1:4317/ 查看实时 Three.js 场景。启动服务器仅需 Node.js，Three.js 源码已经随项目保存在 `vendor/`，不依赖 CDN。实时模式可暂停、拖动时间轴和播放音乐。

## 重新渲染

需要 Node.js、FFmpeg、Playwright 和 Chromium。第一次准备：

```sh
npm install
npx playwright install chromium
npm run preview
npm run render
DURATION=60 DEST=output/komorebi-picture-60s.mp4 npm run render
node tools/master.mjs
node tools/create-previews.mjs
npm run verify
```

默认使用 3840×2160 计算画面，并输出 1080p。可用 `WIDTH=1920` 降低计算负担；可用 `CHROME_PATH=/path/to/chrome` 指定浏览器。`SHOTS=0,3,5 npm run preview` 可只渲染选定镜头的起、中、终帧。

## 场景内容

五重塔、正殿与前殿山花、逐片弯曲陶瓦、屋底板、层叠斗拱、木格门、金属饰件、廊道、朱红拱桥、石灯笼、金色佛像与莲座、佛堂藻井与垂饰、莲池、苔藓岛、蕨类、枫树与松树、散落树叶、铺地石与雨后浅水反光，全部由 JavaScript 构造。

木纹、石面噪声、旧金属纹理、匾额文字和天空也由代码生成。没有加载照片、贴图文件、HDRI、模型、AI 图片或现成视频。唯一下载的媒体是背景音乐。

渲染使用固定的 8192×8192 太阳阴影、PBR 材质、程序化天空环境光、GTAO 接触阴影、两个平面反射、4× MSAA、俯瞰远景雾化、景深和 ACES 色调映射。镜头采用五次最小冲击插值，使拉远的启停平顺。所有镜头使用同一套黄金时段照明；第 9、10 张参考中的夜景、阴雨天按用户要求改为日落及雨后夕照。

## 检查与局限

已拆出十张参考，对照多轮起、中、终帧，修正屋顶孔隙、前景遮挡、山体边缘、反射方向、阴影投影、景深纹理、佛像面部和手臂衔接。检查报告在 `qa/browser-audit.json`、`qa/video-verification.json`、`qa/player-audit.json`。

这是程序化三维重建，仍与参考中的复杂雕刻、植物和材质有明显差别。参考中单张仅约 265×197 像素，且多张的空间关系与光线并不完全一致；没有可靠方法证明“99.9% 相似”，本项目不作此声明。重复帧一致性和固定阴影检查用于减少随机闪烁，不能替代对每一处细节的绝对保证。

## 历史音乐署名（V1 已否决，不再采用）

'Hiraeth' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au

[作品及授权](https://www.scottbuckley.com.au/library/hiraeth/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

音乐截取自原曲 01:10 起，调整响度并淡入淡出。上传到 YouTube 时，必须将上述音乐署名放入视频说明。完整署名与修改说明见 `CREDITS.txt`。


## 重制版新配乐方向

PeriTune / Sei Mutsuki《Oboro》，尺八与筝为主要音色。2019 年作品，CC BY 4.0；艺术家 2026 年的许可更新明确保留旧曲的 CC 授权。作品与许可：https://peritune.com/blog/2019/04/08/oboro/ 。配乐仍在与新运镜测试校对。
