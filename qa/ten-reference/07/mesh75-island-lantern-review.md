Scene07 最近岛灯候选，visualAccepted=false。

独立新worktree /Users/mima1234/temple-lantern-07-20261019，基线cedb249，原worktree保留。已看HD6照片7与68b实际图。只替换最近岛灯lantern(4.8,14.2,5.8,.2)：原0.88m高火袋、近外框大亮窗、3条竖栅和无厚度帽片，造成明亮方灯箱感。

新灯保留原local锚点(4.8,.2,14.2)、scale5.8/3.7及garden矩阵T(0,0,-3)*S(1,1,.6)，world锚点(4.8,.2,5.52)。直接执行旧lantern几何生成代码量得新旧world AABB最大差2.89646354901e-07m；完整原外包络保持。实际338个闭合部件合6网格/42,624三角，厚曲面曲边石盖、小凹火袋7×5窗栅、圆颈顶珠、雕刻承托、11闭合苔垫+132微绒实体。所有部件闭合/有限/正体积，原mats.glow及中心localY2.84保持，新增灯光0。

只借鉴04石灯的闭合屋盖/凹火袋/浮雕/附面苔做法，未套用比例。花岗岩三张CC0单石面PBR从本repo04只读复制到07私有目录，原作者/许可/SHA保留；扫描矿粒按实际非均匀世界尺度做metricUV。07/04root树及06未改，没有参考RGB/投影进入场景。

75a已实际看全幅/子视锥，但石材偏深褐、苔像平叶、沿用旧锥帽。75b只在本灯内用中性灰色素×规范化矿粒亮度(mean0.153180782734)、小回翘/圆颈珠、少量不规则苔垫与微绒纠正；原光/位置/外包络保留。75a全部源由report逐文件hash验证保留。两轮均1254full+原生detail(650,680,320,1254)，没有第三轮。

最终实际图已看，方灯箱感减轻；仍差在帽沿分瓣/雕刻语汇和矿粒/苔的逐面分布，整体仍规则，不能称已复原原图。原整体灯尺度受外包络约束，仍较摄影场景显高。保留未验收。

最终source hash：8d291b06919a0e1f8ff5b120c61e2a094c0f1d770fefc4ed0d2205304c967537。main.js移除唯一新灯hook/metadata即可逐字回到cedb249，其余28个旧07源/资产依赖字节不变，原其他4灯和园林随机序列保留。no tests/movie/push。

最终图：iteration-mesh75b/reference.png、iteration-mesh75b/detail-native.png。具体geometry/scope/review receipts位于同目录；源75a保存在其retained-source目录。
