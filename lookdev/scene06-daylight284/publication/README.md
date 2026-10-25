# 佛堂实体采光与物理材质工作记录

四个原生源码文件在 native-source9fe/files，覆盖到公开提交4d0cf409的独立检出目录后，Scene06身份应为9fe4d1ec02b2f010c265df0acc5dc25b5ebd08644a4b9bfd81e3e84b623a3682。高窗、真实滑屏、低踢脚和前左低角度太阳均为三维对象/光源；隐藏区域的结构与光学数值是明确标记的推断。

同目录上一层保留完整export-source252.mjs、pipeline252.mjs、geometry252.py、materials252.py、render-physical252.py及settings-r06-pbr.json。它们经共享GPU队列导出完整几何并使用Blender5.2.1/Metal实际渲染1254平方、512采样；无场景照片贴面、分层替代或模型简化。导出与验证生成的完整缓冲包可从公开原生源重新生成，作为可再生缓存未放入Git对象库。

重新导出时运行时UUID可能变化。publication/rebind-pbr-settings.mjs只在同源包和唯一材料名称/消费者祖先核对后，重新绑定主佛材料ID及本机路径，材质候选数值保持。该助手不跳过全包verify、图形队列或资源检查。原始报告、各轮settings和图片均保留。

R06只改了已匹配的243个木地板材料的清漆参数，以及唯一主佛材料的金属度/粗糙度。原有颜色、顶点颜色、底纹、雕塑几何和全部灯光保持该轮控制值；这些参数是参考图驱动的候选，未声称测得材质常数。图像仍未通过摄影还原，主佛局部高光、光束及倒影仍需修进。

许可：原始模型和素材各自的许可/署名保留在原生项目与导出scene.json的sourceAttribution中。含Scan-the-World/Sainsbury Centre雕像的场景与衍生图像为CC BY-NC-SA4，按用户授权用于个人非商用欣赏。项目代码许可不重新许可第三方素材。
