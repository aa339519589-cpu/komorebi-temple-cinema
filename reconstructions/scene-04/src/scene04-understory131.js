import * as T from 'three';
import {createEvergreenShrubKit212,createFernKit212} from './scene04-evergreen212.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Frozen, declared CC0 botanical meshes. This loader is scene-local and never
// imports another reconstruction's placement or mutable runtime helpers.
let kit=null;
export async function loadScene04Understory131(){
 if(kit)return kit;
 const loader=new GLTFLoader(),definitions=[
  {id:'shrub',asset:'shrub_02',folder:'shrub-02',author:'Rico Cilliers'},
  {id:'periwinkle',asset:'periwinkle_plant',folder:'periwinkle-plant',author:'Amal Kumar'}
 ];
 const entries=await Promise.all(definitions.map(async d=>{
  const gltf=await loader.loadAsync(new URL(`/assets/polyhaven/${d.folder}/${d.asset}_4k.gltf`,location.origin).href),variants=[];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{if(!o.isMesh)return;
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.computeBoundingBox();
   const b=geometry.boundingBox,center=b.getCenter(new T.Vector3()),size=b.getSize(new T.Vector3());
   geometry.translate(-center.x,-b.min.y,-center.z);geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const materials=(Array.isArray(o.material)?o.material:[o.material]).map(source=>{
    const m=source.clone();m.name=`scene04-CC0-${d.asset}-${source.name}`;m.transparent=false;m.depthWrite=true;m.alphaTest=.45;m.side=T.DoubleSide;m.roughness=.92;m.metalness=0;m.normalScale?.setScalar(.70);
    m.userData={provider:'Poly Haven',asset:d.asset,author:d.author,license:'CC0-1.0',referenceRGBUsed:false};return m;
   });
   variants.push({name:o.name,geometry,material:materials.length===1?materials[0]:materials,height:size.y,radius:Math.hypot(size.x,size.z)/2});
  });
  if(!variants.length)throw Error(`No actual ${d.asset} meshes loaded`);
  return[d.id,{...d,variants}];
 }));
 kit=Object.fromEntries(entries);kit.evergreen212=createEvergreenShrubKit212();kit.fern212=createFernKit212();return kit;
}

export function buildScene04Understory131(garden,stairPlan){
 if(!kit)throw Error('Scene04 botanical geometry must load before construction');
 const group=new T.Group();group.name='scene04-licensed-grounded-understory131';
 const roots=[],rejected={},batches=new Map(),ray=new T.Raycaster(),down=new T.Vector3(0,-1,0),object=new T.Object3D(),color=new T.Color();
 let sequence=0;
 const h=(a,b=0)=>{const x=Math.sin(a*127.1+b*311.7+131.04)*43758.5453;return x-Math.floor(x);},pathHalf=z=>Math.max(1.1,garden.plan.pathWidth/2-.133*Math.max(0,z-garden.plan.stairBottomZ));
 garden.group.updateMatrixWorld(true);
 const reject=why=>(rejected[why]=(rejected[why]??0)+1,false);
 function plant(kind,x,z,height,phase){
  const variants=kit[kind].variants,variant=variants[Math.floor(h(phase,23)*variants.length)],scale=height/variant.height,radius=variant.radius*scale;
  const clearPath=z>=8?pathHalf(z)+.31:stairPlan.halfWidth(z)+.42;
  const foliageRadius=kind==='fern212'?Math.max(.04,radius-.18):radius;
  if(Math.abs(x)-foliageRadius<clearPath)return reject('stair-or-curb-envelope');
  const footRadius=.80*garden.plan.lanternHeight/4.4*(garden.plan.lanternWidthFactor??1);
  if([-1,1].some(side=>Math.hypot(x-side*garden.plan.lanternX,z-garden.plan.lanternZ)<footRadius+radius*.55))return reject('toro-foot-envelope');
  ray.set(new T.Vector3(x,12,z),down);const ground=ray.intersectObject(garden.subgroups.ground,true).find(hit=>hit.face?.normal.y>.2);
  if(!ground||ground.point.y<garden.plan.waterY+.025)return reject('water-or-no-dry-support');
  const rocks=ray.intersectObject(garden.subgroups.shore,true);if(rocks.some(hit=>hit.point.y>ground.point.y+.025))return reject('root-on-stone');
  object.position.set(x,ground.point.y-.012,z);object.rotation.set(0,h(phase,31)*Math.PI*2,0);object.scale.setScalar(scale);object.updateMatrix();
  const key=kind+':'+variant.name,batch=batches.get(key)??{variant,matrices:[],colors:[]};batch.matrices.push(object.matrix.clone());
  const tint=.82+.17*h(phase,41);batch.colors.push(color.setRGB(tint*.94,tint,tint*.90).clone());batches.set(key,batch);
  roots.push({kind,variant:variant.name,position:object.position.toArray(),height,uniformScale:scale,supportObject:ground.object.name,supportY:ground.point.y,rootBuriedMetres:.012});sequence++;return true;
 }
 function plantNear(kind,x,z,height,phase){
  if(plant(kind,x,z,height,phase))return true;
  for(let k=0;k<7;k++){const a=k*2.399+h(phase,113)*Math.PI*2,r=.20+.095*k;if(plant(kind,x+Math.cos(a)*r,z+Math.sin(a)*r,height,phase+k*.17))return true;}return false;
 }
 // Discrete, differently sized real shrub mounds cover the planted banks;
 // root retries find actual soil around rocks instead of deleting whole clumps.
 for(const side of[-1,1])for(let row=0;row<3;row++)for(let j=0;j<14;j++){
  const phase=side*173+row*37+j,z=.30+j*.53+.30*(h(phase,1)-.5),x=side*(stairPlan.halfWidth(z)+1.03+row*.93+.40*(h(phase,3)-.5));
  plantNear(h(phase,119)>.20?'evergreen212':'shrub',x,z,.50+.70*h(phase,7),phase);
 }
 // Discontinuous low plants accompany the causeway; gaps expose soil and rock.
 for(const side of[-1,1])for(let row=0;row<2;row++)for(let j=0;j<32;j++){
  const phase=side*293+row*107+j,z=8.3+j*.49+.23*(h(phase,11)-.5),x=side*(pathHalf(z)+.47+row*.24+.09*(h(phase,13)-.5));
  if(h(phase,17)>.17)plantNear('periwinkle',x,z,.17+.17*h(phase,19),phase);
 }
 for(const side of[-1,1])for(let j=0;j<22;j++){const phase=side*619+j,z=9.1+j*.65,x=side*(pathHalf(z)+1.03+.12*(h(phase,71)-.5));plantNear('shrub',x,z,.26+.21*h(phase,73),phase);}
 // Irregular frond colonies occupy the actual dry knolls beside the observed
 // curbs. Leaflets belong to real arching stems, rather than a scattered carpet.
 for(const side of[-1,1])for(let j=0;j<26;j++){
  const phase=side*811+j,z=13.4+j*.43+.14*(h(phase,7)-.5),x=side*(pathHalf(z)+.71+.42*h(phase,31));plantNear('fern212',x,z,.28+.32*h(phase,43),phase);
 }
 for(const side of[-1,1])for(let j=0;j<18;j++){
  const phase=side*919+j,z=.6+j*.38,x=side*(stairPlan.halfWidth(z)+.77+.65*h(phase,17));plantNear('fern212',x,z,.30+.36*h(phase,37),phase);
 }
 for(const side of[-1,1])for(let j=0;j<14;j++){
  const phase=side*1021+j,z=17.8+j*.27+.10*(h(phase,13)-.5),x=side*(pathHalf(z)+.63+.10*h(phase,29));plantNear('fern212',x,z,.28+.17*h(phase,47),phase);
 }
 // Low irregular shrubs on the dry toro islands; the carved bases stay exposed.
 for(const side of[-1,1])for(let j=0;j<19;j++){
  const phase=side*431+j,a=j*2.399,rad=.76+.55*h(phase,53),x=side*garden.plan.lanternX+Math.cos(a)*rad,z=garden.plan.lanternZ+Math.sin(a)*rad*1.25;
  if(j%3===0)plant('shrub',x,z,.28+.31*h(phase,59),phase);else plant('periwinkle',x,z,.16+.13*h(phase,61),phase);
 }
 let triangles=0;for(const [key,b]of batches){
  const mesh=new T.InstancedMesh(b.variant.geometry,b.variant.material,b.matrices.length);mesh.name='scene04-grounded-'+key;
  b.matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,b.colors[i]);});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();group.add(mesh);
  triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3*mesh.count;
 }
 group.userData.provenance=['assets/understory131-provenance.json','src/scene04-evergreen212.js:independent authored evergreen'];
 return{group,info:{revision:'scene04-212-curb-fern-frond-overhang-r14',instances:sequence,triangles,roots,rejected,uniformScaleOnly:true,fernTipOverhangAllowanceMetres:.18,referenceRGBUsed:false,wholePlantBillboards:false},dispose(){group.removeFromParent();}};
}
