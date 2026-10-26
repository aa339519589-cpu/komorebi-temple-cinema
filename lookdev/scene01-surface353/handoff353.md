# Scene01 / 353 R10 工作交接点

这版是实际 3D 工作快照，**未通过摄影匹配**。Root 已否决 R07 整体照明；R08–R10 保留独立源及实图，没有覆盖旧结果。R10 不再继续微调云色掩盖主要布局与光影差距。

- 基底：`b755a7cdb7c73fa696e9a0ee8d6b1dc04804b573281584e1e5ce7815c8b30f1d`。
- 冻结 R10：`4382386993b49abaa0cd2dfe3a23b3265817c1264b43286d78a6672e134359c5`。
- 候选：`/Users/mima1234/temple-cinema-live-sync/lookdev/scene01-surface353/candidate-r10`。
- canonical01 仍为基底；没有 push。所有自有 GPU 作业均 terminal，无作业需要恢复或重排。

## 已亲看的同源证据

四项都走官方 FIFO，1254 原生，report source 均为上述 R10；errors 为空、程序链接、GL 检查通过。有效加载不代表摄影通过。

| 视图 | 原生结果 |
| --- | --- |
| 原参考机位 full | [reference.png](candidate-r10/qa/ten-reference/01/iteration-scene01-surface353-r10-full/reference.png) |
| 左下木构 true subfrustum，`0,594,660,1254` | [detail-native.png](candidate-r10/qa/ten-reference/01/iteration-scene01-surface353-r10-wood-detail/detail-native.png) |
| 殿前 true subfrustum，`620,240,630,1254` | [detail-native.png](candidate-r10/qa/ten-reference/01/iteration-scene01-surface353-r10-main-detail/detail-native.png) |
| 全模型 1m 低角，`[-2.5,1,6.2]→[2,3.4,-6]`，F60 | [inspection-view.png](candidate-r10/qa/ten-reference/01/iteration-scene01-surface353-r10-low/inspection-view.png) |

[全幅未调色并排](comparison-r10-full353.png)及[扶手未调色并排](comparison-r10-wood353.png)仅作诊断；左 HD，右真实 3D。仅裁切/缩放参考以便对照，右侧保留 native 像素。比较图不被场景加载。

## 实际变化与限制

木/石接缝采用毫米级实体倒棱，结构柱圆周加密；四根现有前景横栏采用 12–31.2mm 冠顶，实图中的原宽白亮带已收窄。实例矩阵、整体布局和相机不变。

木材仍使用原 CC0 木纹/法线/粗糙度像素，改用明确记录的线性色素及建筑旧漆响应。历史 RGB 增益与新色素都是手定推断，不是寺院反射率测量。旧 hall 烘焙显示 RGB 漆贴图移除，材质角色色板传播到重命名 clone；因此不能笼统称原渲染实例颜色完全不变。完整原值/新值在 JSON。

真实湿岩保留扫描图，湿润清漆/底色与干岩区分。青瓦保留原几何与纹理，使用非金属釉层。台阶和大石灯仍沿用程序材质，尚未替换为实测矿物图。

R10 共用一个原创 sky-only 球面场：可见天空、世界 IBL、水面、两处完整场景捕获都读取它。原资产不是参考照片，sRGB 只解码一次；共享球面重采样把上层蓝灰云隙及低空暖金分开，不做背景单独染色。EV 始终 1.03。该场是 LDR 推断辐亮度，不能称实测 HDR 或绝对计量。

四个新增远处 court 采样有真实全场阴影，旧平行 fill 已关闭。两处 128px HalfFloat 场景捕获同步读取旧环境，镜像水面保留 cube face/mip、viewport/scissor/depth；间接 AO 只作用间接分量。**不是完整 GI**。原 `.08` hemisphere、`1.4` court185 RectArea 和灯具 PointLight 仍保留；旧 area/fixture 近似没有完整遮挡求解，不能声称每条光路都经阴影追踪。

并排仍清楚显示主殿/塔偏暗棕、桥投影偏大且直硬、庭园逆光与水面反射不足、灰阶及石灯细节偏程序化。下一步应回到主要入射能量/受光分布、桥/庭园空间及真实石材细节。没有 R10 电影，后续动态阴影/高光/DOF 必须以采用后的实际同源视频验证。

## 交付源

- [13 文件工作源补丁](source-r10-353.patch)，71,611 bytes，SHA256 `a632f3aa8e0c1f99f85ee78da8f06e0d4d8fa427118a98aa69924bf742461b76`。
- [逐文件原/新 SHA 与依赖清单](source-r10-manifest353.json)。新声明的 vendor RoundedBoxGeometry 已存在且未改，不在补丁中复制。
- [3 文件 geometry-only 替代补丁](geometry-only353.patch)，SHA256 `dd14a7aa524e9b9232464b7135787ea9a6c91aeebdbecb6660fcba35ccae8a12`。它保持基底材质/照明，但该独立组合尚未另渲染；真实几何 factory 已在 R08–R10 使用并通过 CPU 闭合/正体积核查。两个补丁不能不经 rebase 直接叠加。
- 两个补丁对原基底 `git apply --check` 均通过；工作源全部变更 JS 语法通过。
- [完整交接数据](handoff353.json)、[接续状态](checkpoint353.json)、[实际冠顶/倒棱拓扑证据](geometry-r08-353.json)。

无新全场 export、Blend 或大资产副本。失败 R02 源与 shader receipt、所有 R01–R10 源/PNG 保留。
