import {T,V} from './kernel.js';
import {emitRestoredBuddha} from './altar-figure.js';

// Solid frames and occlusion layers, in the unchanged hall's local space.
// The outside column row, inner portico and sanctuary are different depths.
export function buildHallEntry({b,mats,lights,column,carpentry,fitting,rosette,scroll,frame}){
 const axes=frame.axes,floor=2.2,cx=frame.centre,span=frame.span,pitch=span/frame.bayCount,left=axes[0],right=axes.at(-1),inner=axes.slice(1,-1);
 mats.hallAltarGold=mats.gold.clone();mats.hallAltarGold.name='scene02-altar-gold';mats.hallAltarGold.roughness=.30;
 mats.hallFlame=new T.MeshStandardMaterial({name:'scene02-hall-emitting-flame',color:0xb76c25,emissive:0xffb85a,emissiveIntensity:3.2,roughness:.7});
 function lattice(x,y,z,w,h,ma='cedar',back=false){
  if(back)b.box(x,y,z-.14,w,h,.13,'darkwood');
  for(let sign of[-1,1]){b.box(x+sign*w/2,y,z,.12,h+.14,.17,'red');b.box(x,y+sign*h/2,z,w+.12,.13,.17,'red');}
  const n=Math.ceil(w/.21),rows=Math.ceil(h/.26);
  for(let i=1;i<n;i++)b.box(x-w/2+w*i/n,y,z+.055,.035,h,.055,ma);
  for(let i=1;i<rows;i++)b.box(x,y-h/2+h*i/rows,z+.07,w,.035,.055,ma);
 }
 // Dedicated housed timber heads replace repeated generic box stacks.
 const seatedBracket=(x,y,z,s=1)=>carpentry.head(x,y,z,s,z===1.2?'inner':z<0?'rear':'primary',z<0?Math.PI:0);
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
 // The occupied hall uses five equal porch bays and six continuous columns.
 // Inner rows, portal jambs, transoms and ceiling ties use that same grid.
 b.box(cx,2.25,-.8,span+1.1,.08,11.8,'darkwood');
 b.box(cx,5.40,-5.95,span+.2,6.42,.30,'darkwood');
 for(let x=left-.2;x<=right+.21;x+=.46)b.box(x,5.42,-5.76,.075,6.32,.10,'cedar');
 for(const [x,sign]of[[left+.26,-1],[right-.26,1]]){
  b.box(x,5.405,-1.25,.26,6.29,9.2,'darkwood');
  for(const z of[-4.5,-2.1,.3,2.7])b.at([x+sign*.14,0,z],sign*Math.PI/2,()=>{b.box(0,3.05,0,2.15,1.55,.18,'hallOxide');lattice(0,5.255,.04,2.05,2.79,'cedar',true);b.box(0,6.99,.015,2.10,.43,.12,'hallPlaster');for(const q of[-1,1])b.box(0,6.99+q*.25,.12,2.22,.095,.21,'hallBearing');carpentry.transomBay(0,6.99,.15,2.05);});
 }
 for(const z of[4.7,-6.3])for(const x of axes){column(x,z,floor,5.80,z===4.7?.255:.225,'hallColumnRed');seatedBracket(x,8.05,z,z===4.7?1.04:.88);}
 for(const x of inner){column(x,1.2,floor+.03,5.43,.215,'hallColumnRed');seatedBracket(x,7.69,1.2,.82);}
 for(const x of[left,right])for(const z of[-3.2,.8]){column(x,z,floor,5.65,.225,'hallColumnRed');carpentry.head(x,7.90,z,.88,'side',x===left?-Math.PI/2:Math.PI/2);}
 b.box(cx,8.54,-.65,span+1.1,.20,12.0,'darkwood');
 for(let z=-6.2;z<=5.1;z+=.74)b.box(cx,8.38,z,span+.9,.19,.19,'cedar');
 for(const x of axes){b.box(x,8.01,-.7,.33,.33,11.6,'hallOxide');carpentry.tail(x,8.26,4.95,2.55,.60);}
 for(const z of[4.7,1.2,-2.6,-6.1]){b.box(cx,7.77,z,span+1.1,.38,.48,'hallOxide');b.box(cx,8.16,z,span+1.4,.25,.55,'hallBearing');}
 b.box(cx,7.01,4.68,span+.8,.29,.50,'hallBearing');
 for(const yy of[7.00,7.65])b.box(cx,yy,4.99,span+1.05,.055,.045,'oldgold');
 for(let i=0;i<axes.length-1;i++)carpentry.transomBay((axes[i]+axes[i+1])/2,7.35,5.00,pitch-.36);
 // The sculpted head factory now supplies the complete column receiver and
 // chased sleeve; the former flat square caps and rectangular sleeves are removed.
 // The far outside bay encloses storage; the near outside bay remains open.
 // Three deeper portals frame the
 // sanctuary. Folding leaves sit on their actual jambs and clear the openings.
 for(const x of inner){b.box(x,4.755,1.45,.33,5.06,.46,'hallOxide');for(const y of[2.55,4.25,6.35])fitting(x,y,1.70,.34,.28);}
 const portalLeft=inner[0],portalRight=inner.at(-1),portalCentre=(portalLeft+portalRight)/2;
 b.box(portalCentre,7.15,1.45,portalRight-portalLeft+.6,.39,.55,'hallOxide');b.box(portalCentre,7.42,1.45,portalRight-portalLeft+.95,.17,.61,'hallBearing');
 for(const i of[0]){const x=(axes[i]+axes[i+1])/2;lattice(x,5.305,3.02,pitch-.40,2.63,'cedar',true);b.box(x,3.10,3.02,pitch-.25,1.55,.20,'hallOxide');}
 for(let i=0;i<inner.length-1;i++){
  const a=inner[i],c=inner[i+1],x=(a+c)/2;
  carpentry.transomBay(x,6.61,1.57,pitch-.38);
  doorLeaf(a,.88,(pitch-.22)/2,4.63,1.47,1);doorLeaf(c,.88,(pitch-.22)/2,4.63,-1.47,-1);
  b.box(x,2.29,1.16,pitch-.1,.06,1.0,'darkwood');
 }
 for(const x of inner){b.box(x,4.665,.88,.22,4.83,.26,'hallOxide');b.box(x,7.08,1.15,.25,.24,.70,'hallBearing');}
 for(const x of[cx-2.8,cx+2.8]){b.box(x,4.30,-1.56,.28,4.06,.35,'hallOxide');fitting(x,5.90,-1.35,.30,.32);}
 b.box(cx,6.38,-1.56,6.1,.35,.43,'darkwood');
 for(const sign of[-1,1])b.at([cx+sign*4.25,0,-1.65],sign*.36,()=>{b.box(0,3.18,0,2.3,1.7,.22,'darkwood');lattice(0,5.00,.08,2.25,1.75,'cedar',false);});
 // Low tables and screens occlude the deity's lower half, as real furniture.
 carpentry.sanctuaryBackdrop(cx);
 b.box(cx,2.78,-3.65,5.05,1.08,2.10,'darkwood');b.box(cx,3.35,-3.65,5.38,.15,2.32,'oldgold');
 for(let x of[cx-2.35,cx,cx+2.35])fitting(x,2.82,-2.56,.65,.48);
 const altarEmitter=(g,ma,x,y,z,sx,sy,sz)=>b.put(g,ma==='buddha'?'hallAltarGold':ma,[x,y,z],[sx,sy,sz]);
 emitRestoredBuddha(altarEmitter,{x:cx,y:3.46,z:-3.72,scale:.64,widthScale:1.6});
 b.put(new T.TorusGeometry(1,.045,8,64),'oldgold',[cx,5.20,-4.46],[1.22,1.42,.8]);
 for(let a=0;a<24;a++){const angle=a*Math.PI/12;b.ball(cx+Math.cos(angle)*1.26,5.20+Math.sin(angle)*1.45,-4.46,.035,.05,.025,'gold');}
 b.box(cx+.60,3.35,-.76,3.75,.18,1.24,'darkwood');for(let x of[cx-.87,cx+2.07])for(let z of[-1.12,-.40])b.box(x,2.75,z,.14,1.02,.14,'red');
 const burner=new T.LatheGeometry([[0,0],[.16,0],[.20,.06],[.17,.13],[.22,.19],[.27,.24],[.25,.30],[.14,.34]].map(p=>new T.Vector2(...p)),32);b.put(burner,'oldgold',[cx+.60,3.44,-.75]);
 for(let x of[cx-.10,cx+.60,cx+1.30])b.cyl(x,4.03,-.76,.012,.58,'cedar');
 for(let x of[cx-2.55,cx+2.55]){
  b.cyl(x,3.65,-2.35,.13,.62,'oldgold');b.ball(x,4.03,-2.35,.18,.16,.18,'gold');
  b.put(b.sphere,'hallFlame',[x,4.25,-2.35],[.045,.13,.045]);
 }
 // Source lighting is attached to actual small emitting fixtures, not walls.
 for(let x of[cx-2.25,cx+2.30]){
  b.cyl(x,5.93,-2.15,.13,.25,'oldgold');b.put(b.sphere,'hallFlame',[x,5.90,-2.15],[.075,.11,.075]);
  b.put(new T.CylinderGeometry(.23,.40,.23,8),'black',[x,6.20,-2.15]);b.cyl(x,6.075,-2.15,.40,.035,'oldgold');b.line([x,6.32,-2.15],[x,7.92,-2.15],.014,'oldgold');
  const light=new T.PointLight(0xffae49,45,12,2);light.position.copy(V([x,5.55,-2.20]).applyMatrix4(b.stack.at(-1)));lights.push(light);
 }
 return {outsideRowZ:4.7,innerRowZ:1.2,portalZ:.88,sanctuaryScreenZ:-1.56,altarZ:-3.72,solidHallWindows:false,rightInnerBayOpen:true,bearingGrid:frame,portalBays:3,outerPorchColumns:6};
}
