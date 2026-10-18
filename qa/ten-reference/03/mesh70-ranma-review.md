Scene03 入口闭合浮雕候选，未验收。

本轮仅替换中央入口两道原梁的细金线装饰。hall-local 梁中心 y=8.70、9.30m，梁体保持6.15×0.36×0.52m。共享模块雕刻面1.30×0.27m，每道4次实例；含真实开口、封闭侧壁/背面、0.8mm倒角和独立27mm深木背板。每模块32,108三角，八次共256,864三角。柱、site、屋顶、相机和camera-dolly与ba9ada9相同，详见scope-receipt.json。

v02仅提供解释性非metric高度/开口引导；guide的黑色留白被裁到active bbox [7,127,2155,472]（底左坐标）。其文件、SHA、两轮完整prompt、未选v01原因和原照片版权均保留。原图不作为任何可见材质、背景或投影；运行GLB不含image/texture。深木使用独立色素及既有CC0 normal/roughness；金属为统一PBR。

实际看过两轮native1254全幅与入口原生子视锥。首轮mesh70a有明显尖碎金色微峰，源码与GLB/Blend已完整留在iteration-mesh70a/retained-source。本轮mesh70b对实体顶点高度做三次网格尺度平滑，独立保留开口mask，最高浮雕34mm降到26mm，使用更粗糙的旧金色。第二轮叶体更圆顺、负形仍可见，但仍偏重复，不能称为参考雕刻复刻。

最大未解决差距是纹样语汇、交叠层次和节奏：四重复模块仍均匀；原图的莲菊/圆叶每件具有更不规则、更深的交叠雕法。上道浮雕受原有椽/梁遮挡，只能部分看见。周边原有花纽、柱金属件与布幕仍明显简化；本轮未扩大修改范围。

最终实际source hash：ad29cfd978ff06a12b24ef40667867c12e4ff6303d4baf6b1b26b067cb78a572。GLB SHA256：e1f3d9ad9e819111def15b7501ff6630c4d83de552398dbaa4eb4e8fa618b1a4。两轮均由共享mutex工具render-one完成；no tests/movie。visualAccepted=false。

重建模块（在本工作树根运行，不启动渲染）：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python reconstructions/scene-03/tools/build-ranma-relief.py -- --guide reconstructions/scene-03/assets/ranma-frieze-v01/source-height-guide.png --guide-origin lookdev/ranma-frieze-study/generated-height-guide-v02.png
```

最终actual图：iteration-mesh70b/reference.png 与iteration-mesh70b/detail-native.png。detail参数580,390,390,1254，为固定物理相机的真实子视锥，非截图放大。
