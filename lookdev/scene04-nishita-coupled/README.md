独立研究：原生 Nishita 耦合太阳与天空

本研究从 `b93edbf` 开新分支，只增加这个目录。原 `4cb7c2b` 场景源、先前 physical01/02、建筑/地面/植物几何、材质节点、相机及曝光均保留。23,669,477 个三角形和 source hash `d1f02ccbe5cd1489e5211d8a831508aa592908cbe24733f3dee8bc74f37ce2a8` 不变。唯一场景全幅为 `results/scene04-nishita-coupled.png`，1254×1254、Cycles Metal、48 samples、OIDN、seed904101、AgX0EV。

使用 Blender5.2.1 的 `SINGLE_SCATTERING`，即原生 Nishita 单次散射模型。新节点原生默认 air1、ozone1、altitude100m 保留；aerosol/dust1 采用 Nishita 文档中的晴天值，亦为该节点默认。太阳高度32.0026°、角径.0093rad 保留；sun_intensity1 为原生值。原独立 SUN 能量8→0，只由模型自身太阳盘提供太阳光。[Nishita 参数依据](https://docs.blender.org/manual/en/3.2/render/shader_nodes/textures/sky.html)、[现行模型说明](https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/sky.html)。

一次8192×4096、8 sample/pixel、float32 scene-linear空场景全景采样，计算太阳cap并扣除.65–1°邻环天空基线，以源 SUN 水平R=8×.52995777=4.239662作为工作亮度锚。整个模型只乘一个gain `.05599522834`，保留其太阳/天空比例；没有独立天空、相机背景、曝光或调色分支。这个锚不是现场SI照度测量。

| 水平RGB积分 | 未缩放模型 | 统一缩放后 |
| --- | --- | --- |
| 太阳 |75.71470,60.52959,43.79850 |4.23966,3.38937,2.45251 |
| 天空 |6.62718,8.37553,11.81109 |.37109,.46899,.66136 |

直接太阳/天空比为R11.425、G7.227、B3.708。全部积分、cap/邻环范围、浮点EXR路径和SHA、实际World节点值、默认参数、方向及状态指纹见 `recipe.json` 和 `results/report.json`。

全幅前截获并修正了一个API坐标错误：Cycles在 `SkyTextureNode::simplify_settings` 中先把API太阳旋角反向，之后才执行内部sky表达式。因此API关系是 `d=(sin(rotation)cos(elevation), cos(rotation)cos(elevation), sin(elevation))`。[对应源码](https://github.com/blender/blender/blob/main/intern/cycles/scene/shader_nodes.cpp)。第一次代码误用内部角，单次浮点探针实际太阳X符号相反，尚未生成场景全幅。错误源码、日志和读取审计在 `results/coordinate-check01/`。

修正只改变方位。既有EXR绕Z轴解析重标方位，水平积分与太阳/天空比保持不变，未做第二次环境采样。重标后的实际太阳盘质心方向误差.00181°；源SUN矩阵误差3.08e-6°。空场景采样只用于积分；最终场景直接使用Nishita节点，没有把探针图贴进背景。

实际看图结论：耦合能量与方向有据可查，但此候选仍有较暗的蓝天、较黑的檐下和平灰铺地，既有雕刻、园石、植物和建筑形体仍明显CG；未解决原图的明亮层次和真实感。模型没有云层，未替换为照片。该结果不作为整体采用依据，也不追加第二张调参图。

运行命令：`node tools/run-blender-queued.mjs lookdev/scene04-nishita-coupled/render-coupled-nishita.py`。依赖上一研究的已保存 physical01 blend 和冻结源导出；重建方法见 `../scene04-physical/recipe.json`。本地原始EXR保存在 `output/scene04-nishita-coupled/`，packed blend保存在本研究 `results/`，两者因体积不入Git。复现实验应使用独立空输出目录；现有缓存分支专用于保留本次已审计的单次历史探针。所有Blender作业通过共享锁，无测试套件、电影或push。
