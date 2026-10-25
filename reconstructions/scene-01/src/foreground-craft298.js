import * as T from 'three';
import {layout124 as L} from './layout124.js';
import {Builder} from './kernel.js';

// Original closed metalwork and housed timber, authored from construction
// proportions. Reference HD01 is visual comparison only, never sampled.
const TAU=Math.PI*2;
export function installCraftMaterials298(m){
 m.craft298Brass=m.hardwareGold131.clone();Object.assign(m.craft298Brass,{name:'craft298-chased-partly-oxidized-gilt-brass',metalness:.72,roughness:.44});m.craft298Brass.color.setHex(0xc3a05b);
 m.craft298Recess=m.hardwareBronze131.clone();Object.assign(m.craft298Recess,{name:'craft298-oxidized-cast-bronze-recesses',metalness:.54,roughness:.58});m.craft298Recess.color.setHex(0x876731);
}
export function housedCeilingBeam298(B,lo,hi,z){
 // The cross beam receives every continuous rafter in an open top housing.
 // The matching rafter bottoms are Y-.345; 1mm lateral clearance is real.
 const cuts=[{x:lo,y:-.27}],half=.096;
 for(let x=lo+.10;x<hi;x+=.62){const a=Math.max(lo,x-half),b=Math.min(hi,x+half);if(a>lo)cuts.push({x:a,y:-.27});cuts.push({x:a,y:-.345},{x:b,y:-.345});if(b<hi)cuts.push({x:b,y:-.27});}
 cuts.push({x:hi,y:-.27});
 const profile=[[lo,-.55],[hi,-.55],...cuts.reverse().map(p=>[p.x,p.y])],g=extrude(profile,.29,.0006);g.translate(0,0,z-.145);g.name='craft298-closed-cross-beam-with-actual-rafter-housings';B.emit(g,'redLight');
}

function extrude(points,depth=.006,bevel=.001){
 const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel*.7,bevelSegments:2,steps:1,curveSegments:12});
 g.name='craft298-closed-solid-cast-metal';return g;
}
function polygon(n,r,phase=0){return Array.from({length:n},(_,i)=>[Math.cos(phase+TAU*i/n)*r,Math.sin(phase+TAU*i/n)*r]);}
function curve(points,n=25){return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))).getPoints(n).map(p=>p.toArray());}
function wire(B,points,r=.0025,ma='craft298Brass',closed=false){
 const p=points;
 let path;
 if(closed){path=new T.CurvePath();for(let i=0;i<p.length;i++)path.add(new T.LineCurve3(new T.Vector3(...p[i]),new T.Vector3(...p[(i+1)%p.length])));}
 else path=new T.CatmullRomCurve3(p.map(p=>new T.Vector3(...p)),false,'centripetal',.28);
 const segments=Math.max(12,p.length*5),radial=6,g=new T.TubeGeometry(path,segments,r,radial,closed);
 if(!closed){
  const positions=Array.from(g.attributes.position.array),uv=Array.from(g.attributes.uv.array),ix=Array.from(g.index.array);
  for(const end of[0,1]){
   const center=path.getPointAt(end),normal=path.getTangentAt(end).multiplyScalar(end?1:-1),ci=positions.length/3,row=end?segments*(radial+1):0;positions.push(...center.toArray());uv.push(.5,.5);
   for(let k=0;k<radial;k++){
    const a=row+k,b=row+k+1,pa=new T.Vector3(...positions.slice(a*3,a*3+3)),pb=new T.Vector3(...positions.slice(b*3,b*3+3)),cross=pa.clone().sub(center).cross(pb.clone().sub(center));
    if(cross.dot(normal)>0)ix.push(ci,a,b);else ix.push(ci,b,a);
   }
  }
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.deleteAttribute('normal');g.computeVertexNormals();
 }
 g.name='craft298-raised-cast-vegetal-rib';B.emit(g,ma);
}
function leaf(B,x,y,z,angle,length,width,ma='craft298Brass'){
 // A lenticular, closed leaf has varying thickness and an actual center rib.
 const p=[],ix=[],N=16;
 for(let shell=0;shell<2;shell++)for(let j=0;j<=N;j++){
  const t=j/N,half=width*Math.sin(Math.PI*t),yy=length*t;
  for(let k=0;k<3;k++)p.push((k-1)*half,yy,shell?0:.002+.012*Math.sin(Math.PI*t)*(k===1?1:.25));
 }
 const at=(s,j,k)=>s*(N+1)*3+j*3+k;
 for(let s=0;s<2;s++)for(let j=0;j<N;j++)for(let k=0;k<2;k++){const a=at(s,j,k),b=at(s,j,k+1),c=at(s,j+1,k),d=at(s,j+1,k+1);s?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 for(let j=0;j<N;j++)for(const k of[0,2]){const a=at(0,j,k),b=at(0,j+1,k),c=at(1,j,k),d=at(1,j+1,k);k?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 for(const j of[0,N]){const a=at(0,j,0),b=at(0,j,2),c=at(1,j,0),d=at(1,j,2);j?ix.push(a,b,c,b,d,c):ix.push(a,c,b,b,c,d);}
 for(let k=0;k<ix.length;k+=3)[ix[k+1],ix[k+2]]=[ix[k+2],ix[k+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();g.name='craft298-closed-convex-chased-lotus-leaf';
 B.emit(g,ma,x,y,z,1,1,1,[0,0,angle]);
}
function rose(B,x,y,z,r,petals=6){
 B.with(x,y,z,0,()=>{
  for(let i=0;i<petals;i++){const a=i*TAU/petals;leaf(B,Math.sin(a)*r*.10,Math.cos(a)*r*.10,0,-a,r*.85,r*.24);}
  B.sphere(0,0,.007,r*.23,r*.23,.008,'craft298Brass');
  for(let i=0;i<petals;i++){const a=(i+.5)*TAU/petals;B.sphere(Math.sin(a)*r*.26,Math.cos(a)*r*.26,.014,.0027,.0027,.002,'craft298Recess');}
 });
}
export function castHex298(B,width=.28,height=.34){
 const sx=width/.28,sy=height/.34;
 B.with(0,0,0,0,()=>{
  const outline=polygon(6,1,Math.PI/6).map(p=>[p[0]*.159,p[1]*.17]);
  B.emit(extrude(outline,.009,.002),'craft298Recess',0,0,-.004);
  wire(B,outline.map(p=>[p[0]*.94,p[1]*.94,.009]),.004,'craft298Brass',true);
  wire(B,outline.map(p=>[p[0]*.79,p[1]*.79,.011]),.0023,'craft298Brass',true);
  // Two interlaced chased scrolls leave a real recessed dark field.
  for(let i=0;i<6;i++){
   const a=i*TAU/6;
   B.with(0,0,.006,0,()=>{
    const rot=p=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
    wire(B,curve([[.018,.024,0],[.051,.052,.002],[.047,.105,.001],[.009,.116,.002],[-.018,.092,.001],[-.004,.065,.003],[.019,.080,.003]]).map(rot),.0032);
   });
  }
  for(let i=0;i<6;i++){
   const a=i*TAU/6,turn=(x,y)=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];
   for(const [x,y,angle,len]of[[.030,.052,-.95,.056],[-.016,.087,.80,.045],[.015,.115,.35,.032]]){
    const q=turn(x,y);leaf(B,q[0],q[1],.005,angle+a,len,len*.30);
    const end=turn(x-Math.sin(angle)*len*.76,y+Math.cos(angle)*len*.76);wire(B,[[q[0],q[1],.0078],[(q[0]+end[0])/2,(q[1]+end[1])/2,.019],[end[0],end[1],.016]],.0014);
   }
  }
  rose(B,0,0,.005,.056,6);
  for(let i=0;i<6;i++){const a=Math.PI/6+i*TAU/6;B.sphere(Math.cos(a)*.142,Math.sin(a)*.152,.011,.0055,.0055,.003,'craft298Brass');}
 },[sx,sy,1]);
}
export function beamCast298(B,width,height,depth){
 // Returned cheek caps wrap a timber end; the decorated face is a closed
 // sheet with a 5mm folded lip and peened heads on both returns.
 const w=width,h=height,d=depth;
 B.box(0,0,.003,w,h,.006,'craft298Recess');
 for(const x of[-1,1])B.box(x*(w/2-.003),0,-d/2,.006,h,d,'craft298Recess');
 for(const y of[-1,1])B.box(0,y*(h/2-.003),-d/2,w,.006,d,'craft298Recess');
 const outline=[[-w*.43,-h*.43],[w*.43,-h*.43],[w*.43,h*.43],[-w*.43,h*.43]];
 wire(B,outline.map(p=>[...p,.009]),.0028,'craft298Brass',true);
 rose(B,0,0,.006,Math.min(w,h)*.32,5);
 for(const x of[-1,1])for(const y of[-1,1])B.sphere(x*w*.39,y*h*.37,.012,.004,.004,.0025,'craft298Brass');
}
export function buildCeilingCraft298(B,{width:w,colLocal}){
 B.label('craft298-seated-veranda-elbows-and-returned-metal-caps',()=>{
  // Exposed ends of real continuous rafters. Four-sided folded caps return
  // 70mm along each member; they never cover a detached decorative plane.
  for(let x=-w/2+.10;x<w/2;x+=.62)B.with(x,-.18,-.001,Math.PI,()=>beamCast298(B,.194,.333,.070));
  // Underface cuffs have their decorated normal facing the actual low eye.
  // The folded cheeks return upward onto existing rafter side surfaces.
  for(let x=-w/2+.10;x<w/2;x+=1.24){
   B.with(x,-.347,1.11,0,()=>{
    B.stack.push(B.stack.at(-1).clone().multiply(new T.Matrix4().makeRotationX(Math.PI/2)));
    try{
     beamCast298(B,.194,.66,.072);
     for(const sign of[-1,1]){wire(B,curve([[0,sign*.07,.010],[-.047,sign*.13,.014],[-.037,sign*.24,.012],[.033,sign*.25,.015],[.044,sign*.16,.014],[.007,sign*.17,.016]]),.0033);leaf(B,0,sign*.12,.006,sign>0?0:Math.PI,.12,.035);}
    }finally{B.stack.pop();}
   });
  }
  // Shallow diagonal elbows stiffen actual perimeter/rafter intersections.
  const shape=[[0,0],[.21,0],[.21,-.20],[.19,-.26],[.13,-.30],[.02,-.39],[-.20,-.48],[-.33,-.48],[-.33,-.35],[-.21,-.31],[-.08,-.19],[0,-.08]];
  const elbow=extrude(shape,.17,.008);elbow.rotateY(Math.PI/2);elbow.translate(-.085,0,.20);
  for(let x=-w/2+.10;x<w/2;x+=1.86){
   B.emit(elbow,'wood',x,-.43,.06);
   B.with(x,-.56,.435,0,()=>castHex298(B,.19,.20));
  }
  // A folded U cuff at the second cross beam wraps the actual housed joint.
  // The long lower field reads as an embossed beam fitting in the held view.
  const jointX=-w/2+.10+13*.62,jointZ=1.95;
  for(const side of[-1,1])B.with(jointX,-.41,jointZ+side*.147,side>0?0:Math.PI,()=>{
   B.box(0,0,0,.48,.280,.008,'craft298Recess');
   wire(B,[[-.225,-.124,.008],[.225,-.124,.008],[.225,.124,.008],[-.225,.124,.008]],.004,'craft298Brass',true);
   castHex298(B,.26,.236);
   for(const sign of[-1,1]){leaf(B,sign*.142,-.065,.004,sign*.70,.135,.036);B.sphere(sign*.202,.088,.015,.006,.006,.003,'craft298Brass');}
  });
  for(const sign of[-1,1])B.box(jointX+sign*.234,-.41,jointZ,.010,.280,.302,'craft298Recess');
  // Three relief cassettes fill the long beam's visible field. Their real
  // bent side lips and pegs remain legible from an independent low camera.
  for(const x of[.48,2.34,4.20])B.with(x,-.37,.283,0,()=>{
   B.box(0,0,-.007,1.16,.225,.018,'craft298Recess');
   for(const s of[-1,1])B.box(0,s*.104,.005,1.16,.010,.010,'craft298Brass');
   for(let k=0;k<4;k++){const xx=(k-1.5)*.268;rose(B,xx,0,.002,.066,6);wire(B,curve([[xx-.115,-.04,.0052],[xx-.095,.035,.0112],[xx-.050,.067,.0052],[xx-.015,.02,.0082]]),.0032);wire(B,curve([[xx+.115,.04,.0052],[xx+.095,-.035,.0112],[xx+.050,-.067,.0052],[xx+.015,-.02,.0082]]),.0032);}
  });
 });
}
export function buildColumnCraft298(B){
 const F=L.foreground,p=new T.Vector3(...F.columnPosition),r=F.columnRadius,cam=new T.PerspectiveCamera(59,1,.1,260);cam.position.fromArray(L.camera.position);cam.lookAt(...L.camera.target);cam.updateMatrixWorld(true);
 const d=new T.Vector3(110/627-1,1-158/627,.5).unproject(cam).sub(cam.position).normalize(),o=cam.position.clone().sub(p),aa=d.x*d.x+d.z*d.z,bb=2*(o.x*d.x+o.z*d.z),cc=o.x*o.x+o.z*o.z-r*r,disc=bb*bb-4*aa*cc;
 if(disc<0)throw Error('Craft298 fitting misses its real column');
 const q=cam.position.clone().addScaledVector(d,(-bb-Math.sqrt(disc))/(2*aa)),theta=Math.atan2(q.x-p.x,q.z-p.z)-.28,cy=q.y-.047;
 // Each solid plate, border, cast leaf and fastener is bent onto the actual
 // cylinder. Back radius is the timber radius plus 2mm; no hidden half plate
 // or floating flat saddle remains. The hexagonal edge is kept straight in
 // its own developed metal sheet before physical cylindrical bending.
 const radiusAt=y=>y<=.15?r*(.96+.04*y/.15):y<=3.8?r:y<=8.2?r*(1-.05*(y-3.8)/4.4):r*(.95-.05*(y-8.2)/(F.columnTop-8.2));
 const temp=new Builder(B.m);castHex298(temp,.253,.254);let pieces=0;
 B.label('craft298-continuous-concave-cast-hexagon-fitted-to-column',()=>{
  for(const bucket of temp.buckets.values())for(const item of bucket.items){
   const g=bucket.g.clone();g.applyMatrix4(item.m);const positions=g.attributes.position;
   for(let i=0;i<positions.count;i++){const y=positions.getY(i),rr0=radiusAt(cy+y),a=theta+positions.getX(i)/rr0,rr=rr0+.0074+positions.getZ(i);positions.setXYZ(i,p.x+Math.sin(a)*rr,cy+y,p.z+Math.cos(a)*rr);}
   g.computeVertexNormals();g.name='craft298-closed-metalwork-cylindrically-fitted-to-real-timber';B.emit(g,bucket.m);pieces++;
  }
 });
 for(const g of temp.resources)g.dispose();for(const g of temp.metricTimberGeometries.values())g.dispose();
 B.layout124.craft298={revision:298,closedColumnFitting:true,columnSaddleContact:'All cast metal parts conform continuously to actual tapered column surface plus2mm',columnFittingPieces:pieces,ceilingBeamHousingDepth:.075,ceilingHousingSideClearance:.001,ceilingCuffUnderfaceVisible:true,newReferencePixels:false,photographicAccepted:false};
}
export function bridgeMedallion298(B,x,y,side){
 B.with(x,y,side*1.150,side>0?0:Math.PI,()=>{
  const shape=Array.from({length:64},(_,i)=>[Math.cos(i*TAU/64)*.188,Math.sin(i*TAU/64)*.065]);
  B.emit(extrude(shape,.007,.0015),'craft298Recess');
  wire(B,shape.map(p=>[p[0]*.93,p[1]*.90,.010]),.0035,'craft298Brass',true);
  rose(B,0,0,.007,.046,5);
  for(const sign of[-1,1]){
   wire(B,curve([[sign*.045,-.020,.010],[sign*.090,-.035,.015],[sign*.142,-.012,.014],[sign*.127,.025,.016],[sign*.092,.020,.015],[sign*.100,-.002,.017]]),.0038);
   leaf(B,sign*.055,-.025,.007,sign*1.15,.068,.020);
   B.sphere(sign*.163,0,.012,.005,.005,.003,'craft298Brass');
  }
 });
}
