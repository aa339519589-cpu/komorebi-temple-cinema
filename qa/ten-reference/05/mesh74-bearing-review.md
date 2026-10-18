Scene05 单一承托斗形体候选，visualAccepted=false。

基线e6a3f3d，独立分支work/scene05-visible-bearing-20261019。先看最新mesh72真实全幅/近景和HD5照片6，确认大小承托斗的连续外鼓超椭圆loft与顶/侧共享法线令其像圆鼓软垫。参考可见较平直承压面、短斜斗身与清楚收边。

只修改sculpted-joinery.js的cushion()：闭合削角四方斗、短脚带/平斜侧面/上承压带、约2mm实体倒角，并拆开平面法线。原半径/高度/座底/承压顶名义值和所有实例矩阵不变。九个斗原型实际包围盒min/max与旧版最大差0m；每kit斗块三角6336→1152，全部闭合、有限、正体积。其它弧栱/接榫/承梁几何逐字节不变。全部木色/扫描PBR/金属/光/相机与site原文件保持。

仅一个模型版本，两次原生检查。74a已看1254全幅，但子视锥(720,760,380,1254)偏低截到大斗上缘；74b只把detail改回旧72相同区域(745,690,320,1254)，未再改变模型/材质/相机，两轮source hash相同。74b完整1254全幅和原生1254detail均看过：承托斗平斜面/直带与窄小收边清楚，仍保留周围既有曲臂圆角。

这不是逐件扫描或精确历史复刻。块型/毫米磨耗属于结构重建推定，曲臂宽圆角、邻接铜纹/瓦当与参考仍有差距；整景未验收。15受保护源/资产字节相同，scene.js只变revision标识，scene06完全未动。no movie/test suite/push。

最终actual source hash：3dea3c48107954c57a41d404758a24cb1798ad8733b2602ee3645798bc589740。最终图：iteration-mesh74b/reference.png、iteration-mesh74b/detail-native.png。geometry-receipt.json与scope-receipt.json提供实际网格与范围核验。
