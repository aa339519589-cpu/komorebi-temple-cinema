# 木漏れ日 · KOMOREBI

使用 Three.js 以代码构造寺院、佛像、园林与电影镜头的开源项目。

**当前状态：重制中，尚未达到参考。第一版已被用户否决，仓库中的历史视频与测试帧均不能当作最终成品。**

## 源码与完整档案

**源码已公开；六个大文件分包正在上传。远端核验完成后会提交核验记录并更新此状态。**

- 项目原创代码采用 [MIT](LICENSE) 许可；第三方音乐和用户参考图分别保留其自身许可，见 [THIRD_PARTY.md](THIRD_PARTY.md)。
- 本仓库保留当前源码、历史源码快照、参考图、测试截图、脚本与检查记录。
- 所有既有大视频、无损渲染中间文件和完整项目档案放在同仓库的 [公开 checkpoint Release](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/checkpoint-2026-10-16)。[文件清单](archives/checkpoint-manifest.json) 记录原始路径、大小、SHA-256 和所属压缩包。将所有 ZIP 分包解压到同一目录即可恢复档案。
- 这是过程档案，不是完成声明。V3 渲染已按用户要求停止；部分镜头中间文件尚未完成。

## 本地打开

仅运行页面需要 Node.js；Three.js 已保存在 `vendor/`，不需要 CDN：

```sh
npm start
```

打开 <http://127.0.0.1:4317/compare.html>，左侧参考、右侧测试渲染；<http://127.0.0.1:4317/review.html> 为运动测试入口；<http://127.0.0.1:4317/> 为实时 3D 场景。

页面中的参考照片只供对照。建筑、雕像、植物、瓦片、地面、材质纹理、天空、反射与相机轨迹均由 JavaScript 生成。画面没有使用现成模型、照片贴面、下载的 HDR 环境或生成图片。

## 当前代码

| 路径 | 内容 |
| --- | --- |
| `src/world.js` | 寺院建筑、园林、地形、灯光、水面和反射 |
| `src/sculpture.js` | 连续曲面的坐佛与浮雕几何 |
| `src/cinematography.js` | 十个低机位镜头、运动轨迹与转场延伸段 |
| `src/botany.js` | 运行时生成的叶片、松针、树皮与植被材质 |
| `src/natural-forms.js` | 花岗岩、草丛、石板几何 |
| `src/atmosphere.js` | 使用场景深度和太阳阴影的单次散射测试 |
| `src/main.js` | 渲染、接触阴影、景深、曝光时间采样和交互 |
| `tools/` | 渲染、打包、对照、验证与发布脚本 |
| `qa/v1-baseline/` | 已否决第一版的源码与检查记录 |
| `qa/v2/`、`qa/v3/`、`qa/v4/` | 后续重制记录；V3 冻结快照与 V4 试验分开保存 |
| `references/hd/` | 最新上传的高清参考，后续重建以这批图为主 |

原始目标保留：十个镜头由近景拉远，低机位、敬畏的仰视关系、黄金时段、真实光影、清晰且连续的运动。十镜头各七秒的版本为 70 秒；另需单独采样生成 60 秒版本。画面仅使用代码，音乐为唯一外部媒体例外。

## 渲染与验证

现有离线工具使用 FFmpeg、Playwright 和 Chromium。当前冻结镜头渲染入口为 `tools/render-film.mjs`，转场和配乐由 `tools/assemble-film.mjs` 处理，文件检查由 `tools/verify-review.mjs` 执行。部分工具仍保留本机运行时路径，需要按环境安装相应依赖或调整路径。

V3 技术检查见 [qa/v3/scene-audit.json](qa/v3/scene-audit.json)：它仅验证重复曝光、指定建筑区域的静态一致性、着色器状态和柱体避让。它不证明完整视频已经完成，也不证明与参考相似度达标。完整运动、剩余几何遮挡、材质和参考细节仍需继续核对。

冻结快照不可原地覆盖。后续修改在工作源码中进行，完成一个可核对的改动后提交 Git，并记录验证结果与未完成事项。

## 音乐

当前采用 PeriTune / Sei Mutsuki 的 [Oboro](https://peritune.com/blog/2019/04/08/oboro/)，尺八、筝和钢琴，CC BY 4.0。视频使用截取、响度调整及淡入淡出；完整署名在 [CREDITS.txt](CREDITS.txt)。历史 V1 的 Scott Buckley《Hiraeth》已被用户否决，仅保留于档案。

此前的交付说明保存在 [docs/history-v1.md](docs/history-v1.md)，仅用于追溯。
