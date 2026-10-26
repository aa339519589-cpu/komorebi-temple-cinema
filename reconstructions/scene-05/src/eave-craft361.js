import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {cast275,ring275,ribbon275,leaf275,craftCollector275} from './corner-craft275.js';

// Closed manufactured pieces derived from the visible HD05 construction.
// The photograph is a comparison input only; no pixels/depth enter this mesh.
const rect=(w,h,r=.025)=>{const x=w/2,y=h/2,s=new T.Shape();s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;};
function frame(w,h,border,depth=.014){const s=new T.Shape(rect(w,h,.026).getPoints(5)),inner=rect(w-border*2,h-border*2,.018);s.holes.push(new T.Path(inner.getPoints(5)));return cast275(s,depth,.0014);}
function petal(length=.63,width=.070,baseRadius=.10,depth=.030){
 const P=[0,baseRadius,.048],uv=[.5,0],ix=[],rows=12,cols=10;
 for(let j=1;j<rows;j++)for(let k=0;k<cols;k++){
  const t=j/rows,a=k/cols*Math.PI*2,f=Math.sin(Math.PI*t),x=Math.sin(a)*width*f**.62,
   mid=.048+.008*f,h=depth*f**.66,groove=.008*f*Math.exp(-Math.pow(x/.012,2))*Math.max(0,Math.cos(a));
  P.push(x,baseRadius+length*t,mid+Math.cos(a)*h-groove);uv.push(k/cols,t);
 }
 const end=P.length/3;P.push(0,baseRadius+length,.048);uv.push(.5,1);
 for(let k=0;k<cols;k++)ix.push(0,1+(k+1)%cols,1+k);
 for(let j=0;j<rows-2;j++)for(let k=0;k<cols;k++){const a=1+j*cols+k,b=1+j*cols+(k+1)%cols,c=a+cols,d=b+cols;ix.push(a,b,c,b,d,c);}
 const last=1+(rows-2)*cols;for(let k=0;k<cols;k++)ix.push(end,last+k,last+(k+1)%cols);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function createBearingBoot361({type='primary',variant=0}={}){
 const c=craftCollector275('scene05-folded-chased-bearing-boot361-'+type+'-'+variant),depth=type==='primary'?.235:.185;
 // Four returns are one continuous closed thin-walled sleeve. The front
 // ground, two hems and embossed work all have independent finite depth.
 c.add(frame(1.012,1.012,.018,depth),'bearingCopper361',[0,0,-depth/2+.008]);
 c.add(frame(1.018,1.018,.014,.016),'bearingGold361',[0,0,.018]);
 c.add(frame(1.012,1.012,.012,.012),'bearingCopper361',[0,0,-depth+.018]);
 c.add(cast275(rect(.966,.966,.020),.020,.0013),'bearingGround361',[0,0,.007]);
 c.add(cast275(rect(.883,.883,.018),.009,.0012),'bearingRecess361',[0,0,.024]);
 c.add(frame(.938,.938,.017,.012),'bearingGold361',[0,0,.031]);
 c.add(frame(.866,.866,.009,.009),'bearingCopper361',[0,0,.034]);
 // A continuous four-quadrant karakusa ground has broad folded leaves
 // interrupting narrow curled stems. The depth hierarchy remains legible
 // across the face rather than reducing to a central fleur-shaped badge.
 const scroll=[[.026,.024],[.105,.096],[.279,.100],[.365,.199],[.310,.318],[.204,.299],[.187,.222],[.250,.193],[.281,.238],[.249,.259]];
 for(let k=0;k<4;k++){
  const angle=k*Math.PI/2+(variant%2?.09:0),ca=Math.cos(angle),sa=Math.sin(angle),turn=points=>points.map(([x,y,z=.049])=>[x*ca-y*sa,x*sa+y*ca,z]);
  c.add(ribbon275(turn(scroll),.032,.019,{segments:40,taper:.36,ridge:.84}),'bearingGold361');
  c.add(ribbon275(turn([[.061,.150],[.086,.256],[.046,.336],[-.005,.318],[-.011,.271],[.024,.259]]),.024,.014,{segments:27,taper:.35,ridge:.75}),'bearingCopper361');
  // These shallow pierced leaf shells expose the recessed metal ground
  // through real lenticular slots. Their rolled folds catch grazing light.
  const leaf=leaf275(.177,.092,{hole:true,depth:.013,fold:.018});leaf.rotateZ(-.68);leaf.translate(.104,.101,.040);leaf.rotateZ(angle);c.add(leaf,'bearingGold361');
  const bud=leaf275(.115,.063,{hole:true,depth:.011,fold:.012});bud.rotateZ(.63);bud.translate(.286,.108,.040);bud.rotateZ(angle);c.add(bud,'bearingGold361');
 }
 if(type==='primary'){
  c.add(ring275(.227,.227,0,.043,.010,64),'bearingCopper361');
  for(let k=0;k<12;k++){const g=petal(.155,k%2?.028:.030,.049,.016);g.rotateZ(k*Math.PI/6);c.add(g,'bearingGold361');}
 }else{
  // The smaller stages use a four-way foliate boss; their full gilded floor
  // is visible between lobes, unlike the former floating gold line emblem.
  for(let k=0;k<8;k++){const g=petal(.104,k%2?.025:.033,.027,.017);g.rotateZ(k*Math.PI/4+variant*.09);c.add(g,'bearingGold361');}
 }
 const boss=new T.SphereGeometry(1,18,10);boss.scale(.048,.048,.022);c.add(boss,'bearingGold361',[0,0,.062]);
 for(const x of[-.447,.447])for(const y of[-.447,.447]){
  const stud=new T.SphereGeometry(1,12,8);stud.scale(.014,.014,.008);c.add(stud,'bearingGold361',[x,y,.044]);
 }
 // A folded leaf strip on each real side return gives the fitting a worked
 // edge in an oblique inspection and keeps the unplated timber exposed aft.
 for(let side=0;side<4;side++){
  const strip=frame(.902,depth-.035,.012,.008);strip.rotateX(-Math.PI/2);strip.translate(0,.510,-depth/2+.010);strip.rotateZ(side*Math.PI/2);c.add(strip,'bearingCopper361');
  for(const x of[-.29,-.095,.095,.29]){
   const g=ribbon275([[x-.035,-.025,0],[x-.024,.012,.002],[x+.009,.029,.005],[x+.030,.006,.002],[x+.008,-.006,.001]],.018,.009,{segments:14,taper:.30,ridge:.65});
   g.rotateX(-Math.PI/2);g.translate(0,.515,-depth/2+.010);g.rotateZ(side*Math.PI/2);c.add(g,'bearingGold361');
  }
 }
 const result=c.finish();return{...result,info:{revision:'eave361-r05',type,variant,construction:'Closed returned metal sleeve, finite gilded floor and dark recessed field, two rolled frames, raised chased curled fronds and folded side ornaments; actual cut-plane mount retained',normalizedReturn:depth,source:'HD05 observed fitting hierarchy; authored motif interpretation',photoPixelsUsed:false,solids:result.pieces,triangles:result.parts.reduce((n,p)=>n+(p.geometry.index?.count??p.geometry.attributes.position.count)/3,0),topology:{boundaryEdges:result.audit.reduce((n,a)=>n+a.boundary,0),inconsistentEdges:result.audit.reduce((n,a)=>n+a.inconsistent,0),collapsedTriangles:result.audit.reduce((n,a)=>n+a.collapsedDegenerate,0)},finite:result.audit.every(a=>a.finite),positiveVolume:result.audit.every(a=>a.volume>0)}};
}
function ceramicLathe(profile,name,wear=0,segments=48){
 const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments);g.rotateX(Math.PI/2);const p=g.attributes.position,col=[];
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,y),a=Math.atan2(y,x),w=1+.006*Math.sin(a*7+.4)+.0035*Math.sin(a*13+1.1);
  p.setX(i,x*w);p.setY(i,y*w);p.setZ(i,z+.003*Math.sin(a*11+r*4)*Math.min(1,r));
  const q=.88+.050*Math.sin(a*3+r*6)+.026*Math.sin(a*17-r*31)+wear*Math.max(0,Math.sin(a*5+r*13));col.push(q*.98,q,q*1.015);
 }
 // Weld-aware validation removes only the LatheGeometry pole triangles
 // whose three corners coincide, then sets every shell's outward winding.
 // The returned rim has the opposite profile traversal to the solid drum.
 const clean=[],index=g.index,point=i=>new T.Vector3().fromBufferAttribute(p,i),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(':');let volume=0;
 for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2);if(new Set([key(a),key(b),key(c)]).size<3)continue;clean.push(a,b,c);volume+=point(a).dot(point(b).cross(point(c)))/6;}
 if(volume<0)for(let i=0;i<clean.length;i+=3)[clean[i+1],clean[i+2]]=[clean[i+2],clean[i+1]];
 g.setIndex(clean);g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();g.name=name;g.userData={closedCeramic:true,source:'Hand-authored pressed clay section',referencePhotographRuntimeUse:false};return g;
}
export function createCeramicCap361(){
 const body=ceramicLathe([[0,-.29],[.70,-.29],[.84,-.265],[.93,-.205],[.981,-.13],[1,-.043],[1,.035],[.990,.102],[.967,.149],[.923,.177],[.882,.177],[.845,.153],[.816,.105],[.799,.053],[.775,.028],[0,.028]],'scene05-closed-thick-fired-ceramic-drum361',.025,64);
 const lip=ceramicLathe([[.852,.151],[.876,.174],[.905,.183],[.933,.177],[.948,.161],[.943,.151],[.918,.161],[.892,.164],[.872,.155],[.852,.151]],'scene05-closed-rounded-worn-ceramic-double-rim361',.09,48);
 const inner=ceramicLathe([[.766,.030],[.781,.036],[.791,.049],[.790,.061],[.780,.068],[.768,.061],[.763,.047],[.766,.030]],'scene05-closed-inner-kiln-bead361',.04,48);
 const list=[];
 for(let k=0;k<16;k++){const g=petal(.610,k%2?.061:.068,.095,.027);g.rotateZ(k*Math.PI/8);list.push(g);}
 for(let k=0;k<8;k++){const g=petal(.207,.036,.053,.017);g.rotateZ((k+.5)*Math.PI/4);g.translate(0,0,.021);list.push(g);}
 const boss=new T.SphereGeometry(1,24,12);boss.scale(.070,.070,.022);boss.translate(0,0,.070);list.push(boss);
 const expanded=list.map(g=>g.index?g.toNonIndexed():g),relief=mergeGeometries(expanded,false);list.forEach(g=>g.dispose());expanded.forEach(g=>g.dispose());relief.name='scene05-closed-fluted-pressed-chrysanthemum361';
 return{body,lip,inner,relief,info:{revision:'eave361-r05',clayDepthRadii:.473,construction:'Closed thick domed ceramic end drum, eccentric rounded outer rim, raised inner fired bead and two actual convex fluted chrysanthemum whorls',frontReliefRadii:.10,photoPixelsUsed:false}};
}
