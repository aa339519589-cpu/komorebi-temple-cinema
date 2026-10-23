import {T} from './kernel.js';
import {layout} from './layout117.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// One exact verified176 sculpture mounted on the new closed carrying body.
// Matrix compensation cancels the old nonuniform hall transform, preserving
// the actual donor's world-space aspect, relief depth and source normals.
export async function loadCarvedGable186(mats){
 const loaded=await new GLTFLoader().loadAsync(new URL('./assets/carved-gable186/cloud-scroll.glb',import.meta.url).href);let geometry;loaded.scene.traverse(o=>{if(o.isMesh){if(geometry)throw Error('Expected one source176 primitive');geometry=o.geometry;}});if(!geometry)throw Error('Source176 primitive absent');
 mats.actualCloudGilt186=new T.MeshStandardMaterial({name:'scene02-186-actual-cloud-gable-gilt',color:0xb99a5c,roughness:.50,metalness:.82,envMapIntensity:.82});
 return{mount(b,base,plane){
  const [sx,sy,sz]=layout.hall.scale,uniform=.92,p=[0,base+.045,plane+.48],fit=[uniform/sx,uniform/sy,uniform/sz];
  b.put(geometry,'actualCloudGilt186',p,fit);
  // All five actual cut loops are on the left plane. Four small recessed
  // closed mounting pads cover their measured Y/Z ranges; the tiny fifth
  // loop lies inside the first pad. The right end stays a free carved curl.
  const pads=[[.02752720333819248,.3368815258413823,.009503188166071501,.1787318091009471],[.3439429311076764,.4626954942536028,.017167782624501998,.16493674515028953],[.5536456846744002,.7179537674254655,.02761519597165311,.13310448221941365],[.8059846741052666,.867324441336419,.03627371986909399,.14586082952366736]];
  for(const [lo,hi,back,front]of pads)b.box(-(uniform*.5+.012)/sx,p[1]+uniform*(lo+hi)*.5/sy,p[2]+uniform*(back+front)*.5/sz,.085/sx,(uniform*(hi-lo)+.025)/sy,(uniform*(front-back)+.020)/sz,'hallBearing');
  return{source:'Wood Carving of Dragon by SCANOLOGY_3D / 3dscantech, CC BY4.0',url:'https://sketchfab.com/3d-models/wood-carving-of-dragon-1336fa1889cf4eba829594fa30edd6ff',sha256:'0c693ba1108d00c08a8b76113998cfd498fef6cdd09ff4767d92b3a42825feee',actualSourceInstances:1,triangles:geometry.index.count/3,sourceBuffersUnchanged:true,worldUniformWidthFitMetres:uniform,localMatrixCompensation:fit,worldLinearFit:'Held hall rotation times uniform.92; nonuniform hall scale is exactly canceled for donor geometry',positionInGableCoordinates:p,mount:'Closed pierced timber carrier and four measured left-cut mounting pads covering all five source loops; no unnecessary right frame',mountRangesSource:pads,culture:'Unspecified by creator, not identified as a Japanese reference artifact',visualAccepted:false};
 }};
}
