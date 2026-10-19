单照曝光与材质色标拟合：失败候选留存

本研究仅新增这个private目录；原4cb场景几何、相机、Nishita光源/世界和旧研究文件不变。实际完成一次512×512 scene-linear统计渲染和一张1254×1254最终Cycles图，未追加调参图。最终图为 `results/scene04-reference-calibrated.png`，对照顺序为原图／既有Nishita／本次实际图。

选区在 `selections.json`，可看 `results/selections-reference.png` 与 `results/selections-baseline.png`。青色为无云天空，紫色为干铺地，蓝色为主屋瓦面，绿色为朱柱，黄色为金饰。参考金饰另用明确的暖金色比值排除黑洞；源侧使用真正材质Index和既有湿膜coverage筛选。各区域只贡献稳健RGB分位数，没有参考图贴图、空间增益或逐像素颜色转移。

先通过同一Blender OCIO AgX/sRGB变换对清天空中位显示亮度求一个全局曝光，结果为 **+3.227252EV**。基准图的天空RGB约[.247,.341,.439]，原图约[.573,.773,.984]；实际曝光后约[.702,.761,.827]，亮度提高而蓝度仍不符。低图scene-linear经OCIO的基准天空RGB与既有1254 PNG一致到约.002，未发现重复线性转换。

再用一次统计pass求四类baseColor的常数RGB乘数。干石类包含31块铺地及已有作者花岗岩材料，排除真实扫描园石；其余为屋瓦、朱漆材、金饰，完整成员见 `material-classes.json` 与 `results/fit.json`。所有原纹理、法线、粗糙度、金属度、IOR和湿膜输入保留。原铺地干色均值[.14,.131,.117]是作者假设，本次也没有把求解增益当成真实反照率测量。

| 类别 | 常数RGB gain |
| --- | --- |
| 作者干石 |.0001,.0001,.0001 |
| 屋瓦 |.0001,.0001,.0001 |
| 朱漆 |.006533,.000453,.000453 |
| 金饰 |.370190,.305256,.375529 |

这是接近非负反射率边界的诊断解，不能作为真实石材/木漆参数采用。求解将漫反射色分量与固定高光余项分开，用金属度近似金饰色响应，再经OCIO做有界log-gain最小二乘。漫反射重建采用 `(DiffuseDirect+DiffuseIndirect)*DiffuseColor`，[Blender pass说明](https://docs.blender.org/manual/en/latest/render/layers/passes.html)。一次pass的近似不会精确预测重新追踪后的GI、金属Fresnel和物体间反射，因此最终图另做真实路径追踪。

实际前后RGB分位数RMSE（仅所选区域，不是全场景保真评分）：

| 区域 | 拟合前 | 最终实际图 |
| --- | --- | --- |
| 天空 |.4421 |.1177 |
| 干铺地 |.0901 |.1622 |
| 屋瓦 |.1335 |.1054 |
| 朱柱 |.0891 |.2007 |
| 金饰 |.2051 |.0322 |

实际看图：天空与金饰统计改善，但天空偏淡灰蓝；近零底色让朱柱、石板失去本色，固定的白色高光仍亮，铺地更像灰玻璃。整体不宜采用。受限拟合的欠拟合并不证明曝光0或原材质色是真值，也不证明物理模型错误；它暴露了这组固定光传输、显示变换、材料高光和不完全同形选区的限制。没有修改world、粗糙度或再试一张来掩盖失败。

完整方法、数值、约束、迭代记录和实际前后统计分别在 `results/fit.json`、`results/actual-statistics.json`；实际材质更改和受保护状态指纹在 `results/render-report.json`。只有47个既有材质接入四组常数乘数，加一个全局曝光。几何23,669,477三角形、原相机、Nishita节点、灯、粗糙度/法线/IOR等状态核对未变。

全部命令、源码SHA和依赖见 `recipe.json`。Blender作业均走共享queued锁。原始512多层EXR随本目录保存；packed blend仅本地保留。格式API错误在渲染前被截获并保留于 `results/format-check/`，随后设置Blender5.2的 `media_type=MULTI_LAYER_IMAGE`；没有多渲一次统计图。无套件、电影、push或网页采用。
