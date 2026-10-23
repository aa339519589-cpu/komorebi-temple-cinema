import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Real Thunk3D wood-carving scan by Diana Liu, CC BY4.0. The supplied glTF
// retains the selected original triangles/normals and a reversible rigid PCA
// plus uniform unit wrapper. No UVs, original albedo or normal map existed.
// This scene proposes a separate aged-gilt PBR finish, never photo projection.
export async function installFloralScan109(T,architecture){
 const asset=await new GLTFLoader().loadAsync(new URL('../assets/floral-scan109/component.gltf',import.meta.url).href);
 asset.scene.updateMatrixWorld(true);
 // Precise world vertices are necessary here: transforming scanner-axis
 // primitive AABBs through the PCA wrapper substantially inflates a normal
 // Box3 result and shifts the inferred mounting centre.
 const bounds=new T.Box3().setFromObject(asset.scene,true),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 if(!size.toArray().every(Number.isFinite)||size.x<.5||size.x>.62||size.y<.18||size.y>.23)throw Error('Floral scan wrapper dimensions changed: '+JSON.stringify(size.toArray()));
 const originalMaterials=new Set(),geometries=new Set();let prototypeTriangles=0;
 const finish=new T.MeshStandardMaterial({name:'scene03-declared-raised-gilt-and-oiled-wood-on-real-peony-scan109',color:'#ffffff',roughness:.70,metalness:.3,vertexColors:true});
 finish.onBeforeCompile=shader=>{
  shader.vertexShader='attribute float scanRaisedGilt;varying float vScanRaisedGilt;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vScanRaisedGilt=scanRaisedGilt;');
  shader.fragmentShader='varying float vScanRaisedGilt;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\n roughnessFactor=mix(.80,.47,vScanRaisedGilt);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n metalnessFactor=mix(.015,.76,vScanRaisedGilt);');
 };
 finish.customProgramCacheKey=()=> 'scene03-real-peony-declared-depth-gilt109-r05';
 const woodColour=new T.Color('#623a23'),goldColour=new T.Color('#b7964a'),worldVertex=new T.Vector3(),pigment=new T.Color();let paintedVertices=0;
 asset.scene.traverse(o=>{if(!o.isMesh)return;
  if(Array.isArray(o.material))o.material.forEach(m=>originalMaterials.add(m));else originalMaterials.add(o.material);
  // Only new finish attributes are added. Original POSITION, NORMAL and
  // index buffers remain unchanged. Raised parts receive gold while the
  // scanned background stays dark oiled timber; this is a declared finish
  // hypothesis derived from actual relief depth, never source-photo colour.
  const position=o.geometry.attributes.position,colours=new Float32Array(position.count*3),raised=new Float32Array(position.count);
  for(let i=0;i<position.count;i++){
   worldVertex.fromBufferAttribute(position,i).applyMatrix4(o.matrixWorld);
   const g=T.MathUtils.smoothstep(-worldVertex.z,-.0005,.0035);raised[i]=g;pigment.lerpColors(woodColour,goldColour,g);pigment.toArray(colours,i*3);
  }
  o.geometry.setAttribute('color',new T.Float32BufferAttribute(colours,3));o.geometry.setAttribute('scanRaisedGilt',new T.Float32BufferAttribute(raised,1));paintedVertices+=position.count;
  o.material=finish;o.castShadow=o.receiveShadow=true;
  o.name='scene03-actual-scanned-peony-and-leaf-'+o.name;
  o.userData.source='Diana Liu / Thunk3D, wood carving, CC BY4.0';o.userData.declaredMaterialOverride=true;
  geometries.add(o.geometry);prototypeTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
 });
 const C=architecture.config,group=new T.Group();group.name='scene03-two-selective-real-scan-ranma-cassettes109';
 group.matrixAutoUpdate=false;group.matrix.makeTranslation(0,0,-4).multiply(new T.Matrix4().makeRotationY(C.hallYaw??.12)).multiply(new T.Matrix4().makeTranslation(0,0,4));
 const section=new RoundedBoxGeometry(1,1,1,3,.018),carrier=architecture.materials.darkwood.clone();
 carrier.name='scene03-solid-lacquered-floral-cassette-carrier109';carrier.map=null;carrier.normalMap=null;carrier.roughnessMap=null;carrier.onBeforeCompile=()=>{};carrier.customProgramCacheKey=()=> 'scene03-floral-carrier109';carrier.color.set('#2d1b12');carrier.roughness=.70;
 const uniformScale=1.90,positions=[[-.555,C.capitalTop-.40,.447],[.555,C.capitalTop-.40,.447]];
 for(const position of positions){
  const mount=new T.Group();mount.name='scene03-real-peony-carving-on-deep-header';mount.position.fromArray(position);mount.rotation.y=Math.PI;mount.scale.setScalar(uniformScale);
  const model=asset.scene.clone(true);model.position.sub(center);mount.add(model);group.add(mount);
  const base=new T.Mesh(section,carrier);base.name='scene03-closed-timber-floral-scan-carrier';base.position.set(position[0],position[1],.342);base.scale.set(size.x*uniformScale+.045,size.y*uniformScale+.035,.20);base.castShadow=base.receiveShadow=true;group.add(base);
 }
 architecture.group.add(group);group.updateMatrixWorld(true);
 const info={revision:'109R05',instances:2,prototypeTriangles,totalTriangles:prototypeTriangles*positions.length,source:'Diana Liu / Thunk3D wood carving',license:'CC BY4.0',attribution:'assets/floral-scan109/ATTRIBUTION.md',asset:'assets/floral-scan109/component.gltf',localPositions:positions,uniformSceneScale:uniformScale,sourceNaturalAspect:size.x/size.y,noAnisotropicRescaling:true,noGeometryRemeshing:true,originalHasUV:false,originalHasAlbedo:false,originalHasNormalMap:false,finishVertices:paintedVertices,sourcePositionNormalIndexUnchanged:true,material:'Declared relief-depth raised-gilt and oiled-wood PBR hypothesis; original source materials preserved in distributed glTF',metricScale:'Uniform0.001 wrapper is an unverified native-unit interpretation; scene scale is an artistic installation choice',croppedEdges:'Original selected scan boundaries embedded in separate solid wood carriers; not claimed closed scan or surveyed temple ornament',visualAccepted:false};
 return{info,dispose(){architecture.group.remove(group);for(const g of geometries)g.dispose();section.dispose();finish.dispose();carrier.dispose();for(const m of originalMaterials)m.dispose();}};
}
