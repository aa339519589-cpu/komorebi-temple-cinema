03主殿下缘前沿99候选

原图与leaf97全幅已实际看；冻结37c320b时source f8715f3b…与leaf97实际帧相同。核查发现：原前墙是一整块13.6×4.25m深木实体，已有浅灰片仅.25m高，而且在深木墙前方，并非被整墙埋住。下缘因此留下连续空白壁带。原图可见的是浅灰封闭壁板、木框及前排短栏。

本次只改该下缘：保留原前墙11.23–14.325m上段，替换10.075–11.23m下段；新闭合框墙向下接至9.95m。新增12片.18m厚灰壁、13根同柱网短框柱、带有限厚度边板的前排短栏及32个真实栏间空隙。实际新实体边界x±6.8m、y9.95–11.23m、z−1.10至−.14m；栏后到墙前净深约.51m。几何回执记录全部64件闭合RoundedBox实体、实际边界及原机位投影观察点。

材质全部复用原roofFrieze/cedar/red，没有新贴图、调色或雕刻。塔段源字节完全相同，main、hall-layout、材质文件、叶/花源和seed未动。新的helper由architecture直接加载，源文件差异只有导入和该前墙小段。

实际enclosure99全幅和原生子视锥已看。原空白带现在有可见的分段、后退壁面与栏格空间；上排深墙、大斗栱及整体形体仍是原候选，仍有明显简化，不能据此称为摄影匹配。未做第二轮无依据装饰。

实际证据：../iteration-enclosure99/reference.png、detail-native.png、report.json。子视锥为[650,310,350,1254]，是真实3D原生渲染。对照图左/中/右分别是原图、实际native97、实际enclosure99；upper对照是同一全幅坐标的1:1 CPU裁切。两张早期inspection图为2倍放大原始图像，仅用于辨认构造，未作为原生细节渲染。

新source e89f2b3511acd26ebe609ea37a8fb8d0d22121af9d10cb08b836c4e6c9db47cb。实际命令：

WORKTREE=/Users/mima1234/temple-hall03-enclosure99-20261019 REFERENCE=3 SIZE=1254 ITERATION=enclosure99 DETAIL_CROP=650,310,350,1254 PORT=4531 node /Users/mima1234/temple-cinema-live-sync/tools/render-one-reconstruction.mjs

所有GPU作业走共享锁；1轮全幅+子视锥，无套件、电影或push。隐藏座口和栏后尺度仍是单照构造假设。新几何是本地代码作者建模，依赖既有Three.js RoundedBoxGeometry；没有新增外部资产。
