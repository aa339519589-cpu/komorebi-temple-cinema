import {T,V} from './kernel.js';
import {emitRestoredBuddha} from './altar-figure.js';

// Solid frames and occlusion layers, in the unchanged hall's local space.
// The outside column row, inner portico and sanctuary are different depths.
export function buildHallEntry({b,mats,lights,column,bracket,fitting,rosette,scroll}){
 const axes=[-7.8,-5.2,-2.6,0,2.6,5.2,7.8],floor=2.2;
 mats.hallAltarGold=mats.gold.clone();mats.hallAltarGold.name='scene02-altar-gold';mats.hallAltarGold.roughness=.30;
 mats.hallFlame=new T.MeshStandardMaterial({name:'scene02-hall-emitting-flame',color:0xb76c25,emissive:0xffb85a,emissiveIntensity:3.2,roughness:.7});
 function lattice(x,y,z,w,h,ma='cedar',back=false){
  if(back)b.box(x,y,z-.14,w,h,.13,'darkwood');
  for(let sign of[-1,1]){b.box(x+sign*w/2,y,z,.12,h+.14,.17,'red');b.box(x,y+sign*h/2,z,w+.12,.13,.17,'red');}
  const n=Math.ceil(w/.21),rows=Math.ceil(h/.26);
  for(let i=1;i<n;i++)b.box(x-w/2+w*i/n,y,z+.055,.035,h,.055,ma);
  for(let i=1;i<rows;i++)b.box(x,y-h/2+h*i/rows,z+.07,w,.035,.055,ma);
 }
 function doorLeaf(hingeX,z,width,height,yaw,sign){
  b.at([hingeX,floor+.13,z],yaw,()=>{
   const x=sign*width/2;
   for(let edge of[0,sign*width])b.box(edge,height/2,0,.15,height,.22,'red');
   for(let y of[.08,1.30,height-.06])b.box(x,y,0,width,.16,.22,'red');
   b.box(x,.71,0,width-.17,1.05,.13,'darkwood');
   for(let y of[.32,1.08])fitting(x,y,.085,width*.76,.25);
   lattice(x,(1.42+height-.20)/2,.015,width-.22,height-1.62,'cedar');
   for(let y of[.26,.75,1.22,height-.25]){b.box(sign*.03,y,.13,.16,.20,.035,'oldgold');rosette(sign*.03,y,.155,.065);}
   b.put(new T.TorusGeometry(.12,.025,7,24),'gold',[sign*(width-.28),1.45,.16]);
  });
 }
 // The floor and closed side/rear walls stop skylight leaking through a gate.
 b.box(0,2.25,-.8,16.0,.08,11.8,'darkwood');
 b.box(0,4.74,-5.95,15.8,5.1,.30,'darkwood');
 for(let x=-7.6;x<=7.7;x+=.48)b.box(x,4.76,-5.76,.075,5.0,.10,'cedar');
 for(let sign of[-1,1]){
  b.box(sign*7.55,4.67,-1.25,.30,4.82,9.2,'darkwood');
  for(let z of[-4.5,-2.1,.3,2.7]){
   b.at([sign*7.78,0,z],sign*Math.PI/2,()=>{b.box(0,3.05,0,2.15,1.55,.18,'red');lattice(0,5.08,.04,2.05,2.35,'cedar',true);});
  }
 }
 // Shorter shafts carry larger interlocking heads at the same roof level.
 for(let z of[4.7,-6.3])for(let x of axes){
  if(z===4.7&&x===0)continue;
  column(x,z,floor,5.20,z===4.7?.31:.25);bracket(x,7.45,z,z===4.7?1.10:.95);
 }
 for(let x of[-5.2,-2.6,2.6,5.2]){column(x,1.2,floor+.03,4.92,.235);bracket(x,7.18,1.2,.88);}
 for(let x of[-7.8,7.8])for(let z of[-3.2,.8]){column(x,z,floor,5.1,.25);bracket(x,7.35,z,.95);}
 // Deep cross ties, ceiling boards, purlins and the lower carved lintel.
 b.box(0,8.03,-.65,16.7,.20,12.0,'darkwood');
 for(let z=-6.2;z<=5.1;z+=.74)b.box(0,7.87,z,16.5,.19,.19,'cedar');
 for(let x of axes){b.box(x,7.50,-.7,.33,.33,11.6,'red');b.box(x,7.75,4.95,.60,.32,2.55,'cedar');}
 for(let z of[4.7,1.2,-2.6,-6.1]){b.box(0,7.26,z,16.7,.38,.48,'red');b.box(0,7.65,z,17.0,.25,.55,'cedar');}
 b.box(0,6.82,4.68,16.4,.56,.62,'darkwood');
 for(let yy of[6.56,7.10])b.box(0,yy,5.01,16.5,.055,.045,'oldgold');
 for(let i=0;i<axes.length-1;i++){
  const x=(axes[i]+axes[i+1])/2;b.box(x,6.85,5.03,2.32,.40,.08,'red');
  for(let j=-2;j<=2;j++){b.put(scroll,'oldgold',[x+j*.37,6.85,5.10],[.74,.97,.85],[0,0,j%2?Math.PI:0]);}
  fitting(x,6.87,5.12,.42,.30);
 }
 for(let x of axes)if(x!==0){b.box(x,7.36,4.70,1.00,.50,.90,'red');fitting(x,7.35,5.17,.86,.40);}
 // Recessed portal: frame -> folding leaves -> sanctuary screen -> altar.
 for(let x of[-5.2,-2.6,2.6,5.2]){b.box(x,4.50,1.45,.33,4.55,.46,'red');for(let y of[2.55,4.25,6.35])fitting(x,y,1.70,.34,.28);}
 b.box(0,6.64,1.45,10.8,.39,.55,'red');b.box(0,6.91,1.45,11.15,.17,.61,'cedar');
 for(let side of[-1,1]){
  lattice(side*6.55,5.05,3.02,2.0,2.12,'cedar',true);b.box(side*6.55,3.10,3.02,2.14,1.55,.20,'red');
  if(side<0){lattice(side*3.90,4.72,1.44,2.14,3.5,'darkwood',false);b.box(side*3.90,2.79,1.40,2.15,.95,.18,'red');}
 }
 doorLeaf(-2.60,.88,2.38,4.12,1.24,1);doorLeaf(2.60,.88,2.38,4.12,-1.24,-1);
 doorLeaf(5.20,.88,2.20,4.12,-1.26,-1);
 b.box(0,2.32,1.56,5.5,.18,.64,'darkwood');
 for(let x of[-2.8,2.8]){b.box(x,4.30,-1.56,.28,4.06,.35,'red');fitting(x,5.90,-1.35,.30,.32);}
 b.box(0,6.38,-1.56,6.1,.35,.43,'darkwood');
 for(let sign of[-1,1]){
  b.at([sign*4.25,0,-1.65],sign*.36,()=>{b.box(0,3.18,0,2.3,1.7,.22,'darkwood');lattice(0,5.00,.08,2.25,1.75,'cedar',false);});
 }
 // Low tables and screens occlude the deity's lower half, as real furniture.
 b.box(.90,2.78,-3.65,5.05,1.08,2.10,'darkwood');b.box(.90,3.35,-3.65,5.38,.15,2.32,'oldgold');
 for(let x of[-1.45,.9,3.25])fitting(x,2.82,-2.56,.65,.48);
 const altarEmitter=(g,ma,x,y,z,sx,sy,sz)=>b.put(g,ma==='buddha'?'hallAltarGold':ma,[x,y,z],[sx,sy,sz]);
 emitRestoredBuddha(altarEmitter,{x:.9,y:3.46,z:-3.72,scale:.64,widthScale:1.6});
 b.put(new T.TorusGeometry(1,.045,8,64),'oldgold',[.90,5.20,-4.46],[1.22,1.42,.8]);
 for(let a=0;a<24;a++){const angle=a*Math.PI/12;b.ball(.90+Math.cos(angle)*1.26,5.20+Math.sin(angle)*1.45,-4.46,.035,.05,.025,'gold');}
 b.box(1.50,3.35,-.76,3.75,.18,1.24,'darkwood');for(let x of[.03,2.97])for(let z of[-1.12,-.40])b.box(x,2.75,z,.14,1.02,.14,'red');
 const burner=new T.LatheGeometry([[0,0],[.16,0],[.20,.06],[.17,.13],[.22,.19],[.27,.24],[.25,.30],[.14,.34]].map(p=>new T.Vector2(...p)),32);b.put(burner,'oldgold',[1.50,3.44,-.75]);
 for(let x of[.80,1.50,2.20])b.cyl(x,4.03,-.76,.012,.58,'cedar');
 for(let x of[-1.65,3.45]){
  b.cyl(x,3.65,-2.35,.13,.62,'oldgold');b.ball(x,4.03,-2.35,.18,.16,.18,'gold');
  b.put(b.sphere,'hallFlame',[x,4.25,-2.35],[.045,.13,.045]);
 }
 // Source lighting is attached to actual small emitting fixtures, not walls.
 for(let x of[-1.35,3.20]){
  b.cyl(x,5.93,-2.15,.13,.25,'oldgold');b.put(b.sphere,'hallFlame',[x,5.90,-2.15],[.075,.11,.075]);
  b.put(new T.CylinderGeometry(.23,.40,.23,8),'black',[x,6.20,-2.15]);b.cyl(x,6.075,-2.15,.40,.035,'oldgold');b.line([x,6.32,-2.15],[x,7.92,-2.15],.014,'oldgold');
  const light=new T.PointLight(0xffae49,45,12,2);light.position.copy(V([x,5.55,-2.20]).applyMatrix4(b.stack.at(-1)));lights.push(light);
 }
 return {outsideRowZ:4.7,innerRowZ:1.2,portalZ:.88,sanctuaryScreenZ:-1.56,altarZ:-3.72,solidHallWindows:false,rightInnerBayOpen:true};
}
