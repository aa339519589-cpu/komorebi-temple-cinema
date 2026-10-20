# Scene05 — seated corner-fan and golden-side-key review candidate (2026-10-20)

本轮以既有五层塔为基底，重新检查上仰转角构图并重建檐下层次。参考机位仍保持约 0.8m 高、33.5° 视角，瞄准点从 `[-3.5, 16, 0]` 调整到 `[-1.5, 16, 0]`，使主转角更接近参考图位置并缩小左侧空天空。相机机位为 `[12.5, 0.8, 13.7]`。

`src/sculpted-joinery.js` 为四个转角柱头重建了三层闭合半搭接梁组：每层交替使用上、下凹口，两侧由八个弧形承托和四个锥面顶托座接续到屋面枋。`src/architecture.js` 让这些组合替代转角柱原来的常规托拱，同时把主椽间距收紧到 0.125m；`src/scene.js` 移除重复的檐边托拱行，并用深色连续底板衬出真实椽条。机位和左侧枫树保持不变。本轮把太阳光源调到 `[ -18, 20, 30 ]`、色值 `#ffdfaa`、强度 `5.3`，降低半球补光到 `.50`，保留带阴影的 `.60` 庭院反射近似。

`src/scanned-timber.js` 以 Poly Haven CC0 木材扫描的受限亮度调制朱红和暖木颜料，颜料为 `#b35f37` 与 `#aa744d`；降低粗糙度并增加适度清漆反射。枫叶使用浅绿黄的物理材质和低比例透射。扫描源文件未改动，没有将参考照片用作纹理、投影或背景。灯光包含实际太阳阴影及明确标记的解析天空和庭院一次反射近似，并非测量的全局照明。

当前全帧与同机位角部原生子视锥、源身份回执和对照图在 `qa/ten-reference/05/iteration-scene05-golden-key-repair-pass02-20261020/`；前一候选在 `iteration-scene05-golden-key-pass01-20261020/`。角部构造和椽条修订见 `iteration-scene05-carved-corner-fan-pass03-20261020/`，更早的完整比较见 `iteration-scene05-baseline-cycle-20261020/`、`iteration-scene05-joinery-canopy-pass01-20261020/`、`iteration-scene05-corner-depth-repair-pass02-20261020/` 与 `iteration-scene05-eaves-maple-final-pass04-20261020/`。仍是 review 候选，不声称已通过视觉验收。

本轮的黄金侧光恢复了立面上的清晰受光区、金属小件的反光和树叶的亮绿边缘；也有少数直射面偏亮，檐底大面仍比参考更暗。角部梁组仍更对称、更厚重，灯笼、陶瓷角兽和树叶细节仍是概括。原生渲染成功只确认场景能绘制，不代表照片级匹配。没有运行通用测试套件或影片渲染。

较早的上层檐口构图、铜端套与受光候选仍可见 `qa/ten-reference/05/iteration-upward-eaves-05/`、`iteration-mesh71/`、`iteration-mesh72/` 及其 review 文件夹。
