# 当前佛堂完整模型的物理采光工作图

R04 使用 Scene06 源 `10ebb530524902559749a1c9055a4712337b9c5bc095b1708eda7308b21a2efa`，可从公开提交 `8c788417de163e63942c903be772dd75eb13c82a` 重建。完整原模型、实例、法线、UV、顶点颜色和贴图均导入，没有用照片或低模替代。当前源中的主佛腕袖局部自接触等问题也仍保留，未声称模型精度通过。

[R04 实际物理渲染](r04-full.png)为 Blender 5.2.1 / Cycles CPU、1254×1254、128 samples、OIDN、AgX、EV+1.2 的完整单帧。CPU/Embree compact 减少了数据副本，原资源限制保持；实际渲染约803秒，峰值进程驻留约13.36GiB。完整原包可按上一层的导出脚本从源重新生成，未把约1GB可再生网格缓存放入Git对象库。

四轮原图和报告保留。R01 的原天空边界使房间过暗；R02 调低太阳角度形成了过强的胸前直射；R03 将既有六个窗外近场照明代理的贡献解释为两个有限面积物理光源；R04 恢复原太阳方向并重新校准物理相机曝光。窗外照明和曝光是明确的参考图驱动推断，不是现场测光或“纯太阳照明”证明。所有原物体参与真实遮挡、反射和多次反弹。

上一级保存 `export-source252.mjs`、`pipeline252.mjs`、`cpu-memory354.mjs`、`geometry252.py`、`materials252.py`、`render-physical252.py`、各轮settings和Root审查记录。`recipe-current-r01` 至 `recipe-current-r04` 保存各实际执行版本。新导出必须保持指定源身份，按 `pipeline252.mjs verify --backend CPU_EMBREE_COMPACT` 验证完整包后重新绑定本机路径；不能直接套旧导出UUID或跳过资源检查。所有实际图形工作继续使用官方共享队列。

这是独立物理采光研究，**不是 Three.js 像素等价，也未进入工作影片 G**。构图、雕塑、织物、雕刻和光影仍有明显参考差距。完整解码、哈希或成功渲染不代表逐帧摄影验收。

雕像原始来源为 Scan-the-World / Sainsbury Centre Seated Amida：[原始模型](https://doi.org/10.5281/zenodo.21353739)，CC BY-NC-SA 4.0。相应衍生画面供个人非商用欣赏；其它源素材保留各自许可。完整署名和修改信息随原模型及各报告保留。
