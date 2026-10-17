# KOMOREBI v67

完整可运行寺院场景源码。需要Node.js24.2+：node verify.mjs，再node serve.mjs。参考10条件分支使用/?scene=reference10-porch。需要WebGL2。不会自动上传或派发任务。

## 原照金色材质响应候选
本版仅改变三类金属基色输入和其原全表面暗纹幅度：gold为#ffe09a、oldgold为#e6c57e、buddha为#ffdf98；空间乘值由0.66–1.09收窄为0.96–1.0。目标是恢复原照的亮金与黑漆、红褐柱、白亮窗之间的分离，而不是全局加黄或提高曝光。

这些是明确的待渲染材料候选，不是照片唯一反射率解，也不宣称原图颜色已经匹配。未查看返回图。四处严格逆编辑恢复v66整份world；其余38个JS与全部vendor不变。几何、相机、所有光源/阴影、曝光、全局调色、roughness、bump、纸窗/玻璃及独立黑发均不改。原建筑与供台/佛像使用的这三类材料一起受到变化。

必须使用全新renderer/world实例，不能热改旧program或room capture。有限源码/输入数学检查通过，但没有重新构造CPU世界或执行GPU；最终颜色、亮度和光影仍须实际渲染判断。

## 延续的兼容性与诊断
六个塔窗仍各自产生原阴影并逐层复制到比较深度数组，原12阴影灯与PCF不改。源码预算19→14方案仍待真实GPU编译/帧缓冲/复制验证；不静默关灯、关闭阴影或补偿增益。?window-shadow-array=0仅是新renderer旧路对照，仍可能超设备上限。

window.templeDiagnostics.snapshot()在启动失败时也可读取；运行API为temple.getRenderDiagnostics()。compile/link/context或copy失败必须使任务失败，有PNG不能覆盖异常。原debug报告与异常保持。

v66两松根饰石交叉、开放岛土皮及第三株原殿基穿入约44.4毫米仍未改。公开目录不含原照片、私有测量/执行日志、旧基线、源指纹元数据、渲染桥状态或凭据。
