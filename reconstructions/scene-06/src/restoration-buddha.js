// Recovered from verified 435ffe plus preserved modeling transcript after the 2026-10-17 environment reset. New source identity, not a claim of byte-exact f9c4 recovery.
import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Independent reference-6 reconstruction, 2026-10-17. NOT a deformation of 687a.
// Three separately built seated figures. +Z is front; Y=0 is the seat.
// Altar owns lotus seats / mandorlas. Keep their placement separate from anatomy.
const TAU=Math.PI*2, clamp=T.MathUtils.clamp, smooth=T.MathUtils.smoothstep;
const gaussian=(x,s)=>Math.exp(-((x/s)**2)), cache=new Map();
function computeAngleWeightedNormals(g) {
  const p=g.attributes.position,ix=g.index,values=new Float64Array(p.count*3),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3(),normal=new T.Vector3();
  for(let i=0;i<ix.count;i+=3){
    const ids=[ix.getX(i),ix.getX(i+1),ix.getX(i+2)],ps=[a.fromBufferAttribute(p,ids[0]),b.fromBufferAttribute(p,ids[1]),c.fromBufferAttribute(p,ids[2])];
    normal.subVectors(b,a).cross(ac.subVectors(c,a));const length=normal.length();if(length<1e-15)continue;normal.divideScalar(length);
    for(let j=0;j<3;j++){
      ab.subVectors(ps[(j+1)%3],ps[j]);ac.subVectors(ps[(j+2)%3],ps[j]);
      const angle=Math.acos(clamp(ab.dot(ac)/(ab.length()*ac.length()),-1,1)),id=ids[j]*3;
      values[id]+=normal.x*angle;values[id+1]+=normal.y*angle;values[id+2]+=normal.z*angle;
    }
  }
  for(let i=0;i<p.count;i++){const k=i*3,l=Math.hypot(values[k],values[k+1],values[k+2]);if(l>0){values[k]/=l;values[k+1]/=l;values[k+2]/=l;}}
  g.setAttribute('normal',new T.Float32BufferAttribute(values,3));
}
function recomputeSculptureNormals(g) {
  if(g.userData.sculptureAngleNormals)computeAngleWeightedNormals(g);else g.computeVertexNormals();
  let grid=g.userData.sculptureGrid;
  if(!grid&&g.type==='SphereGeometry')grid={nu:g.parameters.widthSegments,nv:g.parameters.heightSegments,poles:true};
  if(!grid&&g.type==='TubeGeometry')grid={nu:g.parameters.radialSegments,nv:g.parameters.tubularSegments,poles:false};
  if(!grid)return g;
  const {nu,nv,poles}=grid,n=g.attributes.normal,p=g.attributes.position;
  const aNormal=new T.Vector3(),bNormal=new T.Vector3(),aPoint=new T.Vector3(),bPoint=new T.Vector3();
  for(let j=0;j<=nv;j++){
    const a=j*(nu+1),b=a+nu;
    // A partial sphere is not necessarily closed around U. Only weld an
    // actual duplicate position, never two different profile boundaries.
    aPoint.fromBufferAttribute(p,a);bPoint.fromBufferAttribute(p,b);
    if(aPoint.distanceToSquared(bPoint)>1e-12)continue;
    aNormal.fromBufferAttribute(n,a);bNormal.fromBufferAttribute(n,b);aNormal.add(bNormal).normalize();
    n.setXYZ(a,aNormal.x,aNormal.y,aNormal.z);n.setXYZ(b,aNormal.x,aNormal.y,aNormal.z);
  }
  if(poles)for(const j of[0,nv]){
    const start=j*(nu+1);aPoint.fromBufferAttribute(p,start);let collapsed=true;
    for(let i=1;i<=nu;i++)if(aPoint.distanceToSquared(bPoint.fromBufferAttribute(p,start+i))>1e-12){collapsed=false;break;}
    if(!collapsed)continue;
    aNormal.set(0,0,0);for(let i=0;i<nu;i++)aNormal.add(bNormal.fromBufferAttribute(n,start+i));aNormal.normalize();
    for(let i=0;i<=nu;i++)n.setXYZ(start+i,aNormal.x,aNormal.y,aNormal.z);
  }
  return g;
}

function surface(nu, nv, fn, closedU = false) {
  const positions = [], uv = [], ids = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const p = fn(i / nu, j / nv); positions.push(...p); uv.push(i / nu, j / nv);
  }
  const distinct=(q,r)=>{let d=0;for(let k=0;k<3;k++)d+=(positions[q*3+k]-positions[r*3+k])**2;return d>1e-20;};
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + nu + 1;
    // A true collapsed pole closes rounded fingertips and knee ends. Do not
    // retain its zero-area companion triangle from the rectangular grid.
    if(distinct(a,a+1))ids.push(a,a+1,b);
    if(distinct(b,b+1))ids.push(a+1,b+1,b);
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ids);
  if(closedU)g.userData.sculptureGrid={nu,nv,poles:true};
  recomputeSculptureNormals(g);
  return g;
}
function sampleProfile(rows, y) {
  let k = 0; while (k < rows.length - 2 && y > rows[k + 1][0]) k++;
  const a = rows[k], b = rows[k + 1], p = rows[Math.max(0,k-1)], q = rows[Math.min(rows.length-1,k+2)];
  const t = clamp((y-a[0])/(b[0]-a[0]),0,1), h=b[0]-a[0];
  return a.slice(1).map((v,i)=>{const n=i+1, m0=(b[n]-p[n])/(b[0]-p[0]), m1=(q[n]-a[n])/(q[0]-a[0]);return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[n]+(t*t*t-t*t)*h*m1;});
}

function ellipsoid(x,y,z,rx,ry,rz,rzTurn=0,nu=48,nv=40){
  const g=new T.SphereGeometry(1,nu,nv);g.scale(rx,ry,rz);if(rzTurn)g.rotateZ(rzTurn);g.translate(x,y,z);return g;
}
function loft(rows,{nu=96,nv=140,relief=null}={}){
  const lo=rows[0][0],hi=rows.at(-1)[0];
  return surface(nu,nv,(u,v)=>{
    const y=lo+(hi-lo)*v,a=u*TAU,[rx0,rz0,cz]=sampleProfile(rows,y),rx=Math.max(0,rx0),rz=Math.max(0,rz0);
    const x=Math.sin(a)*rx,front=Math.max(0,Math.cos(a));
    if(v===0||v===1)return[0,y,cz];
    return[x,y,cz+Math.cos(a)*rz+(relief?relief(x,y)*front**3:0)];
  },true);
}
function curve(points){return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal',.5);}
// A closed, round-ended cast volume, not an open cloth tube. Interpolated
// parallel transport frames prevent arbitrary radial seams at elbows/digits.
function sweep(points,rx,rz,{segments=72,radial=32,profile=t=>1,relief=null}={}){
  const c=curve(points),frames=c.computeFrenetFrames(segments,false),length=c.getLength();
  const centers=Array.from({length:segments+1},(_,i)=>c.getPointAt(i/segments));
  const g=surface(radial,segments,(u,t)=>{
    const k=Math.min(segments-1,Math.floor(t*segments)),f=t*segments-k,a=u*TAU;
    const tangent=c.getTangentAt(t),n=frames.normals[k].clone().lerp(frames.normals[k+1],f);
    n.addScaledVector(tangent,-n.dot(tangent)).normalize();const b=new T.Vector3().crossVectors(tangent,n).normalize();
    const cap=t===0||t===1?0:Math.sqrt(Math.max(0,1-((t<.065?(.065-t)/.065:t>.935?(t-.935)/.065:0)**2)));
    const s=profile(t)*cap,w=relief?relief(t,a)*cap:0,p=c.getPointAt(t);
    const offset=n.clone().multiplyScalar(Math.cos(a)*(rx*s+w)).addScaledVector(b,Math.sin(a)*(rz*s+w*.7));
    // Keep the entire new closed volume, but compress the inside of a bent
    // cloth/digit section before its radius can invert through the centerline.
    const t0=Math.max(0,t-.002),t1=Math.min(1,t+.002),kv=c.getTangentAt(t1).sub(c.getTangentAt(t0)).divideScalar((t1-t0)*length),curvature=kv.length();
    if(curvature>1e-8){kv.divideScalar(curvature);const inward=offset.dot(kv);if(inward>0){const allowed=inward/Math.pow(1+(inward*curvature/.56)**8,1/8);offset.addScaledVector(kv,allowed-inward);}}
    const radius=offset.length();if(radius>0){const dir=offset.clone().divideScalar(radius);let reach=Infinity;
      for(let j=0;j<=segments;j++)if(Math.abs(j-t*segments)>5){const delta=centers[j].clone().sub(p),toward=delta.dot(dir);if(toward>1e-10)reach=Math.min(reach,delta.lengthSq()/(2*toward));}
      const cap=.80*reach;if(radius>cap*.65){const limited=cap-(cap*.35)*Math.exp(-(radius-cap*.65)/(cap*.35));offset.multiplyScalar(limited/radius);}
    }
    return p.add(offset).toArray();
  },true);g.userData.sculptureAngleNormals=true;recomputeSculptureNormals(g);return g;
}
function forearmDrape(g){
 const traces=[
  [[-.965,.76],[-.855,.83],[-.72,.98],[-.535,1.225]],
  [[-.930,.71],[-.810,.78],[-.675,.96],[-.510,1.240]],
  [[-.880,.69],[-.765,.77],[-.650,.96],[-.490,1.250]],
  [[-.820,.70],[-.720,.80],[-.615,.99],[-.475,1.260]],
  [[-.755,.74],[-.675,.84],[-.580,1.03],[-.460,1.270]]
 ];
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=smooth(n.getZ(i),.15,.85);if(!front)continue;
  let relief=0;
  traces.forEach((tr,j)=>{const lo=tr[0][0],hi=tr.at(-1)[0];if(x<lo||x>hi)return;const at=sampleProfile(tr,x)[0],fade=smooth(x,lo,lo+.05)*(1-smooth(x,hi-.025,hi));relief+=(.020+j*.0010)*gaussian(y-at,.024)*fade;});
  p.setXYZ(i,x+n.getX(i)*relief*front,y+n.getY(i)*relief*front,z+n.getZ(i)*relief*front);
 }
 return recomputeSculptureNormals(g);
}
function closedPanel(nu,nv,fn,thickness=.035){
 const p=[],uv=[],ix=[],stride=(nu+1)*(nv+1);
 for(let side=0;side<2;side++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const q=fn(i/nu,j/nv);p.push(q[0],q[1],q[2]-side*thickness);uv.push(i/nu,j/nv);}
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;ix.push(a,a+1,b,a+1,b+1,b,a+stride,b+stride,a+1+stride,a+1+stride,b+stride,b+1+stride);}
 const loop=[];for(let i=0;i<nu;i++)loop.push(i);for(let j=0;j<nv;j++)loop.push(j*(nu+1)+nu);for(let i=nu;i>0;i--)loop.push(nv*(nu+1)+i);for(let j=nv;j>0;j--)loop.push(j*(nu+1));
 for(let k=0;k<loop.length;k++){const a=loop[k],b=loop[(k+1)%loop.length];ix.push(a,b+stride,b,a,a+stride,b+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);computeAngleWeightedNormals(g);return g;
}

function cord(ps,r=.012){return sweep(ps,r,r,{segments:Math.max(24,ps.length*6),radial:10});}
function finger(ps,r=.026){return sweep(ps,r,r*.88,{segments:42,radial:18,profile:t=>1-.23*t});}
function articulatedHandDigit(ps,r){return sweep(ps,r,r*.88,{segments:54,radial:24,profile:t=>1-.20*t+.085*gaussian(t-.30,.085)-.075*gaussian(t-.43,.075)+.065*gaussian(t-.63,.08)-.060*gaussian(t-.76,.07)});}
function frontOf(rows,x,y){const[rx,rz,cz]=sampleProfile(rows,y);return cz+rz*Math.sqrt(Math.max(.005,1-(x/rx)**2));}
function reliefArcs(x,y,arcs){let f=0;for(const a of arcs){
  const[cx,base,width,lift,amp=.022,thickness=.040]=a,q=(x-cx)/width;
  if(Math.abs(q)>1.15)continue;const gate=1-smooth(Math.abs(q),.88,1.15),level=base+lift*q*q;
  f+=gate*(amp*gaussian(y-level,thickness)-amp*.25*gaussian(y-level+.056,thickness*.70));
}return f;}
function makeBuilder(variant){
  const bins={buddha:[],central:[],oldgold:[],gold:[],crease:[],face:[],hand:[],cloth:[]},names=[];
  return {add(g,tag,material='buddha'){g.name=`reference6-rebuilt-${variant}:${tag}`;g.userData={...g.userData,sculpturePart:tag};bins[material].push(g);names.push({tag,material});return g;},
    finish(){const out=[];for(const[material,gs]of Object.entries(bins)){if(!gs.length)continue;
      const g=mergeGeometries(gs,false);g.name=`reference6-rebuilt-${variant}-${material}`;g.computeBoundingBox();g.computeBoundingSphere();
      g.userData={reconstruction:'reference6-recovered-proportion-anatomy-r3-connected-sculpture',variant,parts:gs.map(p=>p.name)};out.push({geometry:g,material});gs.forEach(g=>g.dispose());
    }return out;}};
}

// Both faces are newly modeled closed lofts. These are anatomical planes, not
// the old flat-front sphere deformation. Brows, nose wings and lips are part
// of the same continuous skin, not colored wires in front of it.
function face(center,attendant=false,variant='central'){
  const sy=attendant?.91:1.02,wx=attendant?.79:.96,cy=center;
  const rows=[[-.415,0,0,-.020],[-.397,.112,.140,-.005],[-.365,.157,.191,.002],[-.290,.246,.238,.003],[-.170,.310,.245,.002],[-.045,.337,.247,-.004],[.095,.344,.244,-.012],[.225,.333,.235,-.020],[.340,.285,.201,-.026],[.425,.185,.142,-.028],[.455,0,0,-.025]].map(p=>[cy+p[0]*sy,p[1]*wx,p[2],p[3]]);
  const relief=(x,y)=>{
    const xx=x/wx,yy=(y-cy)/sy,G=(cx,cy,sx,sy)=>gaussian(xx-cx,sx)*gaussian(yy-cy,sy);
    let f=.031*G(-.205,-.16,.135,.14)+.031*G(.205,-.16,.135,.14);
    const noseWidth=.072+.030*smooth(-yy,-.02,.13);
    f+=.050*gaussian(xx,noseWidth)*gaussian(yy-.015,.148)+.034*G(0,-.105,.070,.045);
    f+=.013*G(-.063,-.121,.031,.025)+.013*G(.063,-.121,.031,.025);
    f-=.008*G(-.055,-.146,.018,.012)+.008*G(.055,-.146,.018,.012);
    f+=.013*G(0,-.148,.020,.021)-.011*G(0,-.184,.024,.028);
    for(const side of[-1,1]){
      const ex=xx*side,q=(ex-.164)/.116,inside=Math.max(0,1-q*q),mask=inside**1.2;
      const base=attendant?.077:.117,eye=base-.014*inside,brow=base+.028+.079*Math.sqrt(inside);
      f-=.024*G(side*.164,base+.031,.113,.069);
      f+=mask*(.014*gaussian(yy-brow,.025)+.019*gaussian(yy-eye-.028,.023)-.017*gaussian(yy-eye,.012)+.004*gaussian(yy-eye+.018,.021));
    }
    const mouth=-.237+.016*(xx/.12)**2,ml=gaussian(xx,.115);
    if(attendant){
      f-=.040*gaussian(xx,.061)*gaussian(yy-mouth,.029);
      f+=.018*ml*gaussian(yy-mouth-.032,.015)+.021*gaussian(xx,.093)*gaussian(yy-mouth+.034,.018);
    }else{
      f+=.010*(gaussian(xx-.032,.036)+gaussian(xx+.032,.036))*gaussian(yy-mouth-.019,.021);
      f+=.014*gaussian(xx,.095)*gaussian(yy-mouth+.020,.025)-.014*ml*gaussian(yy-mouth,.010);
      f+=.004*ml*gaussian(yy-mouth+.032,.014)-.005*gaussian(xx,.107)*gaussian(yy-mouth+.061,.021);
    }
    f+=.007*G(0,-.332,.17,.083);return f;
  };
  const g=loft(rows,{nu:192,nv:240,relief});
  if(variant==='left')g.translate(0,-cy,0).rotateZ(.018).rotateY(.035).translate(0,cy,0);
  if(variant==='right')g.translate(0,-cy,0).rotateZ(-.012).rotateY(-.025).translate(0,cy,0);
  g.userData.frontAt=(x,y)=>frontOf(rows,x,y)+relief(x,y);return g;
}
function faceAnatomy(b,g,cy,small=false){
 const sy=small?.91:1.02,wx=small?.79:.96,at=g.userData.frontAt;
 for(const side of[-1,1]){
  const lid=[],lowerLid=[],slit=[],brow=[],upperFold=[];
  for(let k=0;k<=32;k++){
   const t=k/32,q=t*2-1,x=side*(.164+q*.112)*wx,inside=Math.max(0,1-q*q),base=small?.077:.117;
   const y=cy+(base-.014*inside)*sy;
   const ly=y+.010*inside,low=y-.012*inside,ey=y-.004*inside;
   lid.push([x,ly,at(x,ly)+.006]);lowerLid.push([x,low,at(x,low)+.004]);slit.push([x,ey,at(x,ey)+.006]);
   const fy=cy+(base+.052+.045*Math.sqrt(inside))*sy;upperFold.push([x,fy,at(x,fy)+.003]);
   const by=cy+(base+.030+.072*Math.sqrt(inside))*sy;brow.push([x,by,at(x,by)+.004]);
  }
  b.add(sweep(lid,.010,.0065,{segments:48,radial:12}),'sculpted-upper-eyelid-'+side);
  b.add(cord(lowerLid,.0052),'sculpted-lower-eyelid-'+side);
  b.add(cord(slit,.0055),'recessed-eye-aperture-'+side,'crease');
  b.add(cord(upperFold,.0038),'quiet-upper-lid-fold-'+side,'crease');
  b.add(sweep(brow,.008,.0055,{segments:44,radial:10}),'soft-arched-brow-ridge-'+side);
  const nx=side*.055*wx,ny=cy-.146*sy;b.add(ellipsoid(nx,ny,at(nx,ny)+.001,.009,.0045,.003),'nostril-recess-'+side,'crease');
  // Helix and open concha are distinct volumes inside each long auricle.
  const ear=[];for(let k=0;k<=28;k++){const t=k/28,a=-.65+t*4.35;ear.push([side*(.381+.021*Math.cos(a))*(small?.85:1),cy+(.04+.175*Math.sin(a))*(small?.85:1),.059+.006*Math.cos(a)]);}
  b.add(cord(ear,.0065),'auricle-inner-helix-'+side);
 }
 const mouth=[];for(let k=0;k<=32;k++){const x=(-.105+k/32*.210)*wx,y=cy+(-.237+.014*(x/(.12*wx))**2)*sy;mouth.push([x,y,at(x,y)+.003]);}
 b.add(cord(mouth,.0048),'quiet-closed-lip-line','crease');
 const uy=cy+.255*sy;b.add(ellipsoid(0,uy,at(0,uy)+.007,.014,.016,.008),'forehead-urna');
}
function ears(b,cy,small=false,material='buddha'){
 const scale=small?.85:1,rows=[
  [-.44,0,0,.357,.047],[-.415,.045,.050,.375,.056],[-.35,.070,.077,.389,.050],
  [-.24,.060,.071,.400,.028],[-.10,.050,.059,.400,.012],[.05,.065,.065,.385,.005],[.18,.062,.057,.366,-.007],[.27,0,0,.337,-.016]
 ];
 for(const side of[-1,1]){
  const g=surface(64,104,(u,v)=>{
   const dy=-.44+.71*v,[rx,rz,cx,cz]=sampleProfile(rows,dy),a=u*TAU;
   if(v===0||v===1)return[side*cx*scale,cy+dy*scale,cz*scale];
   const local=Math.sin(a)*rx,front=Math.max(0,Math.cos(a));
   const concha=-.038*gaussian(local+.010,.024)*gaussian(dy-.035,.145);
   const helix=.010*gaussian(local/rx-.60,.17)*gaussian(dy-.045,.20);
   return[side*(cx+local)*scale,cy+dy*scale,(cz+Math.cos(a)*rz+(concha+helix)*front**3)*scale];
  },true);
  if(side<0){for(let i=0;i<g.index.count;i+=3){const q=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,q);}recomputeSculptureNormals(g);}
  b.add(g,`ear-${side}`,material);
 }
}
function neck(b,cy,small=false){
 const w=small?.171:.232,depth=small?.167:.197;
 const rows=[[cy-.185,0,0,0],[cy-.155,w*.79,depth*.83,0],[cy-.105,w,depth,0],[cy+.035,w*.97,depth*.96,0],[cy+.115,w*.88,depth*.83,-.006],[cy+.185,0,0,-.010]];
 const relief=(x,y)=>{
  let f=0;for(const offset of[-.095,-.040,.018])f-=.0060*gaussian(y-cy-offset,.014);
  return f*(1-smooth(Math.abs(x)/w,.72,.96));
 };
 b.add(loft(rows,{nu:88,nv:90,relief}),'neck');
}

function raisedHand(b,cx,cy,cz,{size=1,mirror=1}={}){
 const point=p=>{const x=mirror*p[0]*size,z=p[2]*size,a=mirror*.25;return[cx+x*Math.cos(a)+z*Math.sin(a),cy+p[1]*size,cz-x*Math.sin(a)+z*Math.cos(a)];};
 const palmRows=[[-.18,0,0,0],[-.145,.058,.025,0],[-.060,.101,.032,0],[.055,.113,.029,0],[.125,.100,.026,0],[.153,.053,.018,0],[.165,0,0,0]];
 const palm=loft(palmRows,{nu:96,nv:112,relief:(x,y)=>{
  let f=-.013*gaussian(x,.060)*gaussian(y,.075)+.020*gaussian(x-.058,.035)*gaussian(y+.066,.055)+.011*gaussian(x+.045,.030)*gaussian(y-.018,.043);
  for(const knuckle of[-.075,-.027,.028,.076])f+=.011*gaussian(x-knuckle,.020)*gaussian(y-.113,.028)-.0045*gaussian(x-knuckle,.019)*gaussian(y-.075,.012);
  return f-.006*gaussian(y+.020+.14*x,.006);
 }});
 palm.scale(size*mirror,size,size);palm.rotateY(mirror*.25);palm.translate(cx,cy,cz);if(mirror<0){const ix=palm.index;for(let i=0;i<ix.count;i+=3){const t=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,t);}}recomputeSculptureNormals(palm);b.add(palm,'anatomical-raised-palm','hand');
 const fingers=[
  [[-.096,.080,.002],[-.139,.205,.012],[-.158,.286,.018],[-.151,.318,.012]],
  [[-.031,.136,.000],[-.058,.265,.009],[-.063,.349,.009],[-.057,.376,.000]],
  [[.032,.139,.000],[.067,.270,.007],[.081,.354,.006],[.087,.379,-.003]],
  [[.094,.109,.001],[.131,.216,.012],[.151,.287,.017],[.145,.310,.008]],
  [[.071,-.090,.006],[.145,-.025,.034],[.157,.045,.062],[.134,.078,.068]]
 ];
 fingers.forEach((p,i)=>{
  p=p.map(q=>[q[0]*1.05,q[1]*.88,q[2]+Math.max(0,q[1]-.20)*.22]);
  const baseRadius=i===4?.023:.0185,fingerPath=p.map(point);
  b.add(articulatedHandDigit(fingerPath,baseRadius*size),'anatomical-raised-finger-'+i,'hand');
  for(const joint of[1,2]){
    const center=p[joint],crease=[];
    for(let k=0;k<=8;k++){
      const u=k/8*2-1;
      crease.push(point([center[0]+u*baseRadius*.78,center[1]+.002*Math.cos(u*Math.PI/2),center[2]+baseRadius*.78]));
    }
    b.add(cord(crease,.0019*size),`finger-flexion-crease-${i}-${joint}`,'crease');
  }
 });
 return point;
}
function cupHand(b,cx,cy,cz,{mirror=1,size=1}={}){
  b.add(ellipsoid(cx,cy,cz,.132*size,.072*size,.105*size),'cup-palm');
  for(let i=0;i<4;i++){const x=(i-1.5)*.048;const ps=[[x,-.012,.024],[x+.010,.062,.080],[x+.006,.105,.071]].map(p=>[cx+mirror*p[0]*size,cy+p[1]*size,cz+p[2]*size]);b.add(finger(ps,.021*size),`cup-digit-${i}`);}
  b.add(finger([[cx-mirror*.105*size,cy-.035*size,cz],[cx-mirror*.163*size,cy+.014*size,cz+.045*size],[cx-mirror*.120*size,cy+.075*size,cz+.084*size]],.025*size),'cup-thumb');
}
function leaf(x,y,z,w,h,depth,tilt=0){
  const g=new T.SphereGeometry(1,28,30),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const t=(p.getY(i)+1)/2;
    p.setXYZ(i,p.getX(i)*w*(.72+.28*Math.sin(Math.PI*t)),h*t,p.getZ(i)*depth);}
  recomputeSculptureNormals(g);g.rotateZ(tilt).translate(x,y,z);return g;
}
function sculptedHairCurl(x,y,z,rx,ry,rz,phase=0){
 const g=new T.SphereGeometry(1,18,14),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),a=Math.atan2(pz,px),ridge=1+.090*Math.cos(6*a+py*2.2+phase)+.035*Math.cos(12*a-py*3.1+phase*.7);
  p.setXYZ(i,px*ridge,py,pz*ridge);
 }
 recomputeSculptureNormals(g);g.scale(rx,ry,rz).translate(x,y,z);return g;
}
function crown(b,cy,{central=false,variant='central'}={}){
  if(central){
    const rows=[[3.17,0,0,-.028],[3.20,.29,.223,-.028],[3.31,.385,.286,-.03],[3.40,.353,.268,-.03],[3.49,.267,.213,-.03],[3.55,.145,.132,-.03],[3.59,0,0,-.03]].map(p=>[p[0],p[1]*1.08,p[2],p[3]]);
    b.add(loft(rows,{nu:80,nv:72}),'rounded-curl-cap','oldgold');
    for(let row=0;row<7;row++){
      const y=3.25+row*.043,[rx,rz,cz]=sampleProfile(rows,y),n=Math.max(10,Math.round(TAU*rx/.068));
      for(let k=0;k<n;k++){const a=k/n*TAU+(row%2)*Math.PI/n;b.add(sculptedHairCurl(Math.sin(a)*rx,y,cz+Math.cos(a)*rz,.026,.031,.024,(row*17+k)*.31),`hair-curl-${row}-${k}`,'oldgold');}
    }
    const ps=[];for(let k=0;k<=60;k++){const a=-1.55+k/60*3.10;ps.push([Math.sin(a)*.347,3.176,-.025+Math.cos(a)*.247]);}b.add(cord(ps,.013),'low-diadem-band','gold');
    for(let i=0;i<15;i++){const a=(i-7)*.196,h=.075+.082*gaussian(i-7,1.7),x=Math.sin(a)*.345,z=-.025+Math.cos(a)*.250;b.add(leaf(x,3.176,z,.018,h,.012,-a*.15),`diadem-leaf-${i}`,'gold');}
    b.add(leaf(0,3.48,.185,.021,.065,.014),'cap-front-tip','gold');
  }else{
    const rows=[[3.30,0,0,-.025],[3.34,.255,.214,-.025],[3.43,.249,.208,-.025],[3.53,.179,.151,-.030],[3.61,0,0,-.03]];
    b.add(loft(rows,{nu:64,nv:56}),'recessed-crown-cap','oldgold');
    const band=surface(112,32,(u,v)=>{
      const a=u*TAU,front=Math.max(0,Math.cos(a)),top=3.425+.065*(.5+.5*Math.cos(5*a))**2*front;
      let rx,rz,y;
      if(v<=.25){const t=v*4;rx=.286;rz=.235;y=T.MathUtils.lerp(3.32,top,t);}
      else if(v<=.5){const t=(v-.25)*4;rx=T.MathUtils.lerp(.286,.255,t);rz=T.MathUtils.lerp(.235,.208,t);y=top;}
      else if(v<=.75){const t=(v-.5)*4;rx=.255;rz=.208;y=T.MathUtils.lerp(top,3.32,t);}
      else{const t=(v-.75)*4;rx=T.MathUtils.lerp(.255,.286,t);rz=T.MathUtils.lerp(.208,.235,t);y=3.32;}
      return[Math.sin(a)*rx,y,-.020+Math.cos(a)*rz];
    },true);b.add(band,'low-continuous-coronet','gold');
    const ps=[];for(let k=0;k<=60;k++){const a=-1.5+k/60*3;ps.push([Math.sin(a)*.285,3.344,-.02+Math.cos(a)*.237]);}b.add(cord(ps,.011),'crown-low-rim','gold');
    for(const [i,x,h,w,tilt,z] of [[0,-.135,.235,.065,.30,.198],[1,0,.345,.095,0,.225],[2,.135,.235,.065,-.30,.198]]){
      b.add(leaf(x,3.405,z,w,h,.032,tilt),`compact-crown-crest-${i}`,'gold');
      const vein=[];for(let k=0;k<=20;k++){const t=k/20,dy=h*(.08+.76*t);vein.push([x-Math.sin(tilt)*dy,3.405+Math.cos(tilt)*dy,z+.030*Math.sin(Math.PI*(.08+.76*t))]);}
      b.add(cord(vein,.006),`compact-crown-crease-${i}`,'gold');
    }
    for(let i=0;i<7;i++){const a=(i-3)*.38,x=Math.sin(a)*.286,z=-.018+Math.cos(a)*.238;b.add(ellipsoid(x,3.377,z,.012,.018,.007),`crown-brow-relief-${i}`,'gold');}
  }
}

const MAIN_BODY=[
 [0,0,0,.10],[.035,.39,.29,.10],[.27,.50,.34,.08],[.53,.51,.36,.025],[.83,.49,.37,.005],
 [1.15,.515,.375,-.01],[1.49,.56,.373,-.025],[1.82,.60,.355,-.040],[2.08,.62,.325,-.050],
 [2.23,.49,.275,-.050],[2.34,.191,.180,-.040],[2.43,.155,.141,-.030],[2.49,0,0,-.025]
].map(p=>[p[0],p[1]*(1+.10*smooth(p[0],.70,1.50)),p[2],p[3]]);
// One closed skin surface carries the seat-contacting body through the throat
// and into the face. The old coincident torso/neck/oval-head shells gave the
// statue three visible hard transitions under raking highlights.
const CENTRAL_SKIN_ROWS=[
 ...MAIN_BODY.slice(0,-2),
 [2.40,.176,.168,-.034],[2.47,.173,.157,-.027],[2.53,.192,.171,-.025],
 [2.60,.241,.201,-.027],[2.68,.294,.230,-.030],[2.76,.332,.246,-.031],
 [2.86,.344,.249,-.031],[2.97,.340,.244,-.031],[3.07,.313,.221,-.031],
 [3.15,.250,.179,-.029],[3.225,.108,.096,-.027],[3.235,0,0,-.026]
];
const MAIN_BAND=[
 [.63,.12,.14],[.91,.29,.17],[1.18,.41,.19],[1.48,.55,.20],[1.80,.64,.20],[2.07,.59,.17],[2.25,.43,.105]
].map(p=>[p[0]<.9?p[0]+.18*(1-smooth(p[0],.63,.9)):p[0],p[1]*1.10,p[2]*1.10]);
const MAIN_DRAPE_TRACES=[
 [[-.36,1.92],[-.23,1.79],[.02,1.80],[.54,2.10]],
 [[-.35,1.79],[-.21,1.63],[-.04,1.60],[.12,1.69],[.53,2.05]],
 [[-.42,1.65],[-.26,1.46],[-.10,1.43],[.11,1.56],[.53,1.99]],
 [[-.47,1.49],[-.32,1.29],[-.13,1.27],[.09,1.40],[.52,1.90]],
 [[-.49,1.32],[-.37,1.13],[-.17,1.11],[.07,1.27],[.50,1.78]],
 [[-.48,1.15],[-.36,.98],[-.16,.96],[.07,1.13],[.46,1.64]],
 [[-.46,.99],[-.30,.83],[-.10,.85],[.09,.99],[.42,1.49]],
 [[-.43,.84],[-.25,.71],[-.02,.76],[.15,.95],[.36,1.32]],
 [[-.39,.68],[-.22,.61],[.02,.67],[.19,.91],[.31,1.15]]
];
function mainRelief(x,y){
 let f=.024*gaussian(x+.08,.38)*gaussian(y-1.30,.60)+.018*smooth(x,-.38,.30)*smooth(y,.62,1.10)*(1-smooth(y,1.95,2.25));
 for(let i=0;i<MAIN_DRAPE_TRACES.length;i++){const tr=MAIN_DRAPE_TRACES[i],lo=tr[0][0],hi=tr.at(-1)[0],fade=smooth(x,lo-.015,lo+.035)*(1-smooth(x,hi-.025,hi+.015));if(!fade)continue;
  const raw=sampleProfile(tr,clamp(x,lo,hi))[0],at=raw+.020*Math.sin(x*4.4+i*1.7)+.009*Math.sin(x*8.1-i*.63),amp=[.020,.026,.023,.031,.025,.029,.021,.023,.018][i];
  f+=fade*(amp*gaussian(y-at,.052)-amp*.42*gaussian(y-at+.058,.030));
 }
 return f;
}
function centralFaceRelief(x,y){
 const xx=x/.96,yy=(y-2.78)/1.02,G=(cx,cy,sx,sy)=>gaussian(xx-cx,sx)*gaussian(yy-cy,sy);
 let f=.031*G(-.205,-.16,.135,.14)+.031*G(.205,-.16,.135,.14);
 const noseWidth=.072+.030*smooth(-yy,-.02,.13);
 f+=.050*gaussian(xx,noseWidth)*gaussian(yy-.015,.148)+.034*G(0,-.105,.070,.045);
 f+=.013*G(-.063,-.121,.031,.025)+.013*G(.063,-.121,.031,.025);
 f-=.008*G(-.055,-.146,.018,.012)+.008*G(.055,-.146,.018,.012);
 f+=.013*G(0,-.148,.020,.021)-.011*G(0,-.184,.024,.028);
 for(const side of[-1,1]){
  const ex=xx*side,q=(ex-.164)/.116,inside=Math.max(0,1-q*q),mask=inside**1.2;
  const base=.117,eye=base-.014*inside,brow=base+.028+.079*Math.sqrt(inside);
  f-=.024*G(side*.164,base+.031,.113,.069);
  f+=mask*(.014*gaussian(yy-brow,.025)+.019*gaussian(yy-eye-.028,.023)-.017*gaussian(yy-eye,.012)+.004*gaussian(yy-eye+.018,.021));
 }
 const mouth=-.237+.016*(xx/.12)**2,ml=gaussian(xx,.115);
 f+=.010*(gaussian(xx-.032,.036)+gaussian(xx+.032,.036))*gaussian(yy-mouth-.019,.021);
 f+=.014*gaussian(xx,.095)*gaussian(yy-mouth+.020,.025)-.014*ml*gaussian(yy-mouth,.010);
 f+=.004*ml*gaussian(yy-mouth+.032,.014)-.005*gaussian(xx,.107)*gaussian(yy-mouth+.061,.021);
 return f+.007*G(0,-.332,.17,.083);
}
function centralSkinRelief(x,y){
 const blend=smooth(y,2.29,2.54);
 return mainRelief(x,y)*(1-blend)+centralFaceRelief(x,y)*blend;
}
function centralSkin(){
 const g=loft(CENTRAL_SKIN_ROWS,{nu:240,nv:360,relief:centralSkinRelief}),uv=g.attributes.uv;
 const lo=CENTRAL_SKIN_ROWS[0][0],hi=CENTRAL_SKIN_ROWS.at(-1)[0];
 for(let i=0;i<uv.count;i++){
  const u=uv.getX(i),v=uv.getY(i),y=lo+(hi-lo)*v,[rx]=sampleProfile(CENTRAL_SKIN_ROWS,y);
  uv.setXY(i,u*TAU*Math.max(.045,rx),y);
 }
 g.userData.frontAt=(x,y)=>frontOf(CENTRAL_SKIN_ROWS,x,y)+centralSkinRelief(x,y);
 return g;
}
function shoulderRobePanel(side){
 const outline=[[.60,1.04,.28],[.91,1.11,.16],[1.30,1.13,.075],[1.67,1.015,.012],[2.02,.79,-.055],[2.255,.47,-.080]].map(p=>[p[0],p[1]*1.16,p[2]]);
 return closedPanel(32,112,(u,v)=>{
  const y=.60+1.655*v,[outer,oz]=sampleProfile(outline,y),rx=sampleProfile(MAIN_BODY,y)[0],inner=rx*.91,q=side<0?1-u:u;
  const x=side*(inner+(outer-inner)*q),iz=frontOf(MAIN_BODY,side*inner,y)+.006;
  const z=T.MathUtils.lerp(iz,oz,q)+.036*Math.sin(Math.PI*q)+sideRobeFold(q,v,side);
  return[x,y,z];
 },.038);
}
function sideRobeFold(q,v,side){
 const gate=Math.sin(Math.PI*q)*Math.sin(Math.PI*v),phase=q*(5.2+2.8*(1-v))+.13*v+(side<0?.12:0);
 return gate*(.024*Math.cos(TAU*phase)+.006*Math.cos(TAU*phase*2+.4));
}
function mainGarmentFront(x,y){
 const rx=sampleProfile(MAIN_BODY,y)[0],inner=rx*.91;
 if(Math.abs(x)<=inner)return frontOf(MAIN_BODY,x,y)+mainRelief(x,y);
 const outline=[[.60,1.04,.28],[.91,1.11,.16],[1.30,1.13,.075],[1.67,1.015,.012],[2.02,.79,-.055],[2.255,.47,-.080]].map(p=>[p[0],p[1]*1.16,p[2]]);
 const [outer,oz]=sampleProfile(outline,y),q=clamp((Math.abs(x)-inner)/(outer-inner),0,1),v=(y-.60)/1.655,iz=frontOf(MAIN_BODY,inner,y)+.006;
 return T.MathUtils.lerp(iz,oz,q)+.036*Math.sin(Math.PI*q)+sideRobeFold(q,v,Math.sign(x));
}
function broadShoulderBand(){
 return closedPanel(64,200,(u,v)=>{
  const y=.81+1.44*v,[cx,width]=sampleProfile(MAIN_BAND,y),x=cx+(u-.5)*width;
  let folds=0;
  for(let k=0;k<4;k++){
   const center=[.13,.39,.62,.88][k]+.053*Math.sin(TAU*v*.69+k*1.21)+.018*Math.sin(TAU*v*1.47-k*.73),width0=.040+.013*Math.sin(Math.PI*v+k*.4);
   const fade=.52+.48*Math.sin(Math.PI*v)**.55,amp=[.014,.021,.012,.018][k];
   folds+=fade*(amp*gaussian(u-center,width0)-amp*.40*gaussian(u-center-.066,width0*.74));
  }
  const edge=.010*(gaussian(u-.035,.030)+gaussian(u-.965,.030));
  return[x,y,mainGarmentFront(x,y)+.009+edge+folds];
 },.030);
}

function centralFigure(){
 const b=makeBuilder('central');
 const skin=centralSkin(),faceSurface={userData:{frontAt:skin.userData.frontAt}};
 b.add(skin,'continuous-seated-torso-throat-and-face','central');faceAnatomy(b,faceSurface,2.78);ears(b,2.78,false,'central');crown(b,2.78,{central:true});
 const arms=[
  [[-.40,2.20,-.025],[-.64,2.02,-.005],[-.82,1.65,.055],[-.92,1.09,.13],[-.92,.82,.19],[-.84,.67,.25]],
  [[.40,2.20,-.025],[.65,2.01,-.005],[.84,1.65,.045],[.94,1.10,.14],[.89,.74,.25],[.66,.67,.45],[.43,.64,.66]]
 ];
 arms.forEach((original,i)=>{const ps=original.map(p=>[p[0]*1.16,p[1]+.10*(1-smooth(p[1],.65,1.10)),p[2]]);b.add(sweep(ps,.207,.133,{segments:128,radial:56,profile:t=>.82+.22*Math.sin(Math.PI*t)-.20*smooth(t,.82,1),relief:(t,a)=>{
   const fan=smooth(t,.49,.61)*(1-smooth(t,.96,1)),phase=7*a+1.8*Math.sin(t*Math.PI);
   return (.013*Math.cos(phase)*fan+.004*Math.cos(4*a+3*t))*Math.sin(Math.PI*t);
 }}),`broad-sleeve-${i}`);});
 b.add(forearmDrape(sweep([[-1.13,.82,.20],[-1.01,.83,.23],[-.79,.96,.35],[-.57,1.17,.46],[-.46,1.27,.55]],.162,.108,{segments:96,radial:56,profile:t=>.82+.18*Math.sin(Math.PI*t)-.16*smooth(t,.85,1),relief:null})),'raised-forearm-cloth');
 for(const side of[-1,1])b.add(sweep([[side*.52,2.25,-.10],[side*.88,2.03,-.070],[side*1.148,1.64,-.010],[side*1.247,1.10,.09],[side*1.183,.72,.26]],.041,.030,{segments:96,radial:28,profile:t=>.8+.2*Math.sin(Math.PI*t)}),`outer-robe-roll-${side}`);
 for(const side of[-1,1])b.add(shoulderRobePanel(side),`continuous-side-robe-${side}`);
 const thighRows=[[-.18,0,0,.50,.35],[0,.225,.32,.46,.40],[.35,.29,.41,.375,.44],[.75,.32,.43,.35,.46],[1.08,.305,.38,.345,.43],[1.32,.205,.25,.35,.36],[1.43,0,0,.37,.30]];
 for(const side of[-1,1]){
  const leg=surface(100,180,(u,v)=>{
   const xx=-.18+1.61*v,[ry,rz,cy,cz]=sampleProfile(thighRows,xx),a=u*TAU;
   if(v===0||v===1)return[side*xx,cy,cz];
   const yy=cy+Math.sin(a)*ry+(side<0?.018:-.012)*Math.sin(Math.PI*v),front=Math.max(0,Math.cos(a));
   let pleats=0;
   for(const [base,amp,spread]of[[.45,.034,.030],[.33,.030,.027],[.22,.025,.025],[.13,.017,.023]]){
    const fold=base-.17*(xx-.5)+.43*(xx-.72)**2+(side>0?.018*Math.sin(xx*3):0);pleats+=(amp*gaussian(yy-fold,spread)-amp*.32*gaussian(yy-fold+.04,.019))*Math.sin(Math.PI*v);
   }
   return[side*xx,yy,cz+Math.cos(a)*rz+pleats*front**3];
  },true);
  if(side>0){for(let i=0;i<leg.index.count;i+=3){const q=leg.index.getX(i+1);leg.index.setX(i+1,leg.index.getX(i+2));leg.index.setX(i+2,q);}recomputeSculptureNormals(leg);}
  b.add(leg,'continuous-seated-knee-cloth-'+side);
 }
 const feet=[[[.58,.58,.47],[.30,.65,.62],[.03,.68,.73],[-.23,.66,.78],[-.40,.61,.76]],[[-.57,.55,.45],[-.29,.61,.58],[.04,.64,.67],[.32,.61,.72],[.50,.57,.68]]];
 feet.forEach((ps,j)=>{
  const depth=j===1?-.105:0,c=curve(ps.map(p=>[p[0],p[1],p[2]+depth])),g=surface(48,88,(u,t)=>{const a=u*TAU,q=c.getPointAt(t),cap=t===0||t===1?0:Math.sin(Math.PI*t)**.45;return[q.x,q.y+Math.cos(a)*.058*cap,q.z+Math.sin(a)*.084*cap];},true);if(j===0){for(let i=0;i<g.index.count;i+=3){const q=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,q);}recomputeSculptureNormals(g);}b.add(g,`crossed-foot-${j}`);
  const side=j===0?-1:1,last=ps.at(-1),tip=[last[0],last[1],last[2]+depth];for(let i=0;i<5;i++)b.add(finger([[tip[0]-side*.075,tip[1],tip[2]-.064+i*.032],[tip[0]+side*(.035-i*.008),tip[1]-.010,tip[2]-.061+i*.031]],.016-i*.0008),`crossed-toe-${j}-${i}`);
 });
 const cloth=closedPanel(128,260,(u,v)=>{
   const width=.62-.32*smooth(v,.04,1),cx=-.025+.185*v;
   const y=-.150+1.080*v+.035*(1-v)**4*Math.sin(Math.PI*u)-.020*(1-v)**3*Math.sin(3*Math.PI*u);
   const x=cx+(u-.5)*width,z0=.940-.565*smooth(v,.43,1)+.020*Math.sin(Math.PI*u);
   let fold=0;const ends=[-.36,-.20,-.045,.13,.34],amps=[.012,.018,.025,.017,.013];
   for(let k=0;k<ends.length;k++){
     const drift=.031*Math.sin(5.3*v+k*1.43)+.018*Math.sin(8.7*v-k*.81);
     const center=.16+(ends[k]-.16)*(1-v)**.67+drift*(.28+.72*(1-v));
     const amp=amps[k]*(.56+.44*(1-v));
     fold+=amp*gaussian(x-center,.043+.018*(1-v))-amp*.44*gaussian(x-center+.062,.031);
   }
   const transverse=-.25+.55*v+.032*Math.sin(v*5.6);
   fold+=.010*gaussian(x-transverse,.050)-.006*gaussian(x-transverse-.067,.033);
   return[x,y,z0+fold*Math.sin(Math.PI*u)];
 },.012);b.add(cloth,'folded-lap-cloth','cloth');
 raisedHand(b,-.49,1.30,.91,{size:1.25});
 b.add(sweep([[-.57,1.10,.46],[-.50,1.17,.76],[-.49,1.24,.90]],.078,.063,{segments:44,radial:24}),'raised-wrist');
 b.add(sweep([[.67,.81,.61],[.43,.83,.78],[.20,.80,.89],[.06,.79,.93]],.075,.067,{segments:62,radial:28}),'lap-forearm');
 b.add(ellipsoid(-.055,.785,.946,.217,.055,.105,-.065),'open-lap-palm');
 for(let i=0;i<4;i++)b.add(finger([[-.10,.79,.877+i*.043],[-.26,.795,.888+i*.043],[-.33+.013*i,.781,.896+i*.040]],.020),`lap-digit-${i}`);
 b.add(finger([[.105,.795,.889],[.033,.845,.871],[-.060,.843,.903]],.025),'lap-thumb');
 const front=(x,y)=>frontOf(MAIN_BODY,x,y)+mainRelief(x,y);
 const leftBorder=[];for(let k=0;k<=54;k++){const t=k/54,y=.64+1.60*t,x=-(.42-.17*t*t);leftBorder.push([x,y,front(x,y)+.006]);}b.add(cord(leftBorder,.012),'left-cloth-edge');
 b.add(broadShoulderBand(),'covered-shoulder-cloth-band');
 return b.finish();
}

const SIDE_BODY=[
 [0,0,0,.10],[.03,.24,.22,.10],[.31,.35,.29,.08],[.65,.42,.32,.045],[.97,.45,.34,.015],
 [1.28,.44,.33,0],[1.60,.465,.325,-.015],[1.92,.515,.315,-.025],[2.19,.555,.29,-.035],
 [2.39,.46,.25,-.040],[2.52,.245,.19,-.030],[2.71,.177,.15,-.025],[2.78,0,0,-.020]
];
function sideRelief(x,y){return reliefArcs(x,y,[[0,1.12,.43,.28,.018,.050],[.02,1.30,.40,.30,.017,.045],[.03,1.48,.38,.30,.015,.040]])+.018*gaussian(x+.19-.08*(y-1),.045)*smooth(y,.4,.8)*(1-smooth(y,2.2,2.4));}
function attendantFigure(variant){
 const b=makeBuilder(variant),side=variant==='left'?1:-1;
 const add=(g,tag,m='buddha')=>{if(side<0){g.scale(-1,1,1);const ix=g.index;for(let i=0;i<ix.count;i+=3){const q=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,q);}}return b.add(g,tag,m);};
 b.add(loft(SIDE_BODY,{nu:112,nv:160,relief:sideRelief}),'continuous-attendant-torso');
 neck(b,2.66,true);const fg=face(3.055,true,variant);b.add(fg,'attendant-oval-face','face');faceAnatomy(b,fg,3.055,true);ears(b,3.055,true);crown(b,3.055,{variant});
 const ps0=[[-.35,2.40,-.02],[-.58,2.22,.00],[-.67,1.91,.055],[-.68,1.55,.16],[-.56,1.36,.30],[-.36,1.53,.47],[-.29,1.67,.53]];
 const ps1=[[.35,2.40,-.02],[.59,2.21,.00],[.69,1.88,.05],[.75,1.51,.17],[.75,1.32,.33],[.77,1.45,.48]];
 for(const[which,ps]of[ps0,ps1].entries())add(sweep(ps,.193,.172,{segments:96,radial:40,profile:t=>.78+.32*Math.sin(Math.PI*t),relief:(t,a)=>.013*Math.cos(a*5+t*5)*Math.sin(Math.PI*t)**2}),`thick-sleeve-${which}`);
 // Hand geometry remains independent on each attendant, with a slight
 // difference of wrist height and head attitude, rather than duplicating main.
 raisedHand({add:(g,t,m)=>add(g,t,m)},-.285,1.74+(variant==='right'?.025:0),.55,{size:.86});
 cupHand({add:(g,t,m)=>add(g,t,m)},.77,1.49,.53,{size:.90});
 add(sweep([[-.33,1.56,.46],[-.29,1.67,.53]],.067,.060,{segments:28,radial:20}),'raised-bare-wrist');
 add(sweep([[.74,1.34,.37],[.77,1.45,.50]],.065,.061,{segments:28,radial:20}),'cup-bare-wrist');
 const kneeRows=[
   [0,0,0,.43,.29],[.06,.155,.15,.47,.31],[.23,.205,.21,.49,.39],
   [.48,.242,.25,.46,.51],[.77,.282,.29,.40,.57],[1.02,.299,.29,.31,.54],
   [1.23,.263,.25,.20,.40],[1.42,.180,.17,.10,.22],[1.54,0,0,.05,.14]
 ];
 for(const legSide of[-1,1]){
  const g=surface(80,144,(u,v)=>{
   const y=1.54*v,[rx,rz,cz,cx]=sampleProfile(kneeRows,y),a=u*TAU;
   if(v===0||v===1)return[legSide*cx,y,cz];
   const x=legSide*(cx+Math.sin(a)*rx),front=Math.max(0,Math.cos(a));
   const fold=.016*gaussian(Math.sin(a)-.12-.48*(y-.65),.18)*smooth(y,.10,.25)*(1-smooth(y,1.25,1.5))+.010*gaussian(y-(.66+.45*(Math.sin(a)+.1)**2),.055);
   return[x,y,cz+Math.cos(a)*rz+fold*front**3];
  },true);if(legSide<0){for(let i=0;i<g.index.count;i+=3){const q=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,q);}recomputeSculptureNormals(g);}add(g,`angled-bent-leg-${legSide}`);
  const footx=legSide*.30;add(ellipsoid(footx,.077,.49,.155,.073,.150,legSide*.14),`resting-foot-${legSide}`);
  for(let i=0;i<5;i++)add(finger([[footx+legSide*.055,.075,.425+i*.027],[footx+legSide*(.158-i*.008),.069,.43+i*.026]],.016-i*.001),`attendant-toe-${legSide}-${i}`);
 }
 add(closedPanel(48,100,(u,v)=>{
  const y=.32+1.24*v,cx=-.12+.26*v,width=.28+.30*Math.sin(Math.PI*v*.82),x=cx+(u-.5)*width;
  const z=.63-.35*v+.055*Math.sin(Math.PI*v)+.013*Math.sin(u*4*Math.PI+v*3)*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
  return[x,y,z];
 },.037),'diagonal-lap-sash');
 const front=(x,y)=>frontOf(SIDE_BODY,x,y)+sideRelief(x,y);
 for(let layer=0;layer<2;layer++){
   const width=layer===0?.438:.414,base=layer===0?1.80:2.035,rise=layer===0?.53:.30,depth=layer===0?.145:.105;
   const g=closedPanel(112,32,(u,v)=>{
     const x=(u*2-1)*width,q=x/width,curve=base+rise*Math.abs(q)**1.75;
     const y=curve+(v-.5)*depth,edge=.014*Math.sin(Math.PI*v),sag=.012*Math.sin(Math.PI*u)**2;
     return[x,y,front(x,y)+.012+edge+sag];
   },.030);b.add(g,`layered-chest-cloth-${layer}`);
 }
 const waist=closedPanel(96,36,(u,v)=>{
   const x=-.415+.83*u,y=1.37+.26*u+.17*Math.sin(Math.PI*u)+(v-.5)*.19;
   return[x,y,front(x,y)+.016+.022*Math.sin(Math.PI*v)*Math.sin(Math.PI*u)];
 },.032);b.add(waist,'overlapping-waist-cloth');
 const pendantY=2.005;
 b.add(ellipsoid(0,pendantY,front(0,pendantY)+.042,.044,.060,.015),'necklace-pendant','gold');
 return b.finish();
}

export const RESTORED_BUDDHA_METRICS=Object.freeze({
 reference:6,reconstruction:'independent-reference6-recovered-proportion-anatomy-r3-connected-sculpture',frontAxis:'+Z',seatContact:0,
 decorativeMinY:-.157,headCenter:2.78,crownTop:3.59,raisedHandTop:1.85313,kneeWidth:2.90,bodyDepth:1.50,
 variants:{central:{seatContact:0,decorativeMinY:-.157,crownTop:3.59,headCenter:2.78,kneeWidth:2.90},left:{seatContact:0,crownTop:3.75,headCenter:3.055},right:{seatContact:0,crownTop:3.75,headCenter:3.055}},
 referenceFit:{central:{x:0,y:3,z:0,scale:2.1/3.26},attendantScale:1.45/3.26,scaleConvention:'retain external unit conversion; do not normalize by crownTop'},
 materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
export function restoredBuddhaParts(variant='central'){
 if(!['central','left','right'].includes(variant))throw new RangeError('Unknown reference6 figure variant');
 if(!cache.has(variant))cache.set(variant,variant==='central'?centralFigure():attendantFigure(variant));return cache.get(variant);
}
export function emitRestoredBuddha(instance,{x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}){
 for(const p of restoredBuddhaParts(variant))instance(p.geometry,p.material,x,y,z,scale*widthScale,scale,scale*depthScale);
}
export function createRestoredBuddha({materials={},x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}){
 const defaults={buddha:new T.MeshStandardMaterial({name:'buddha',color:'#cfaa5d',metalness:.94,roughness:.29}),central:new T.MeshStandardMaterial({name:'central',color:'#c69f53',metalness:.78,roughness:.42}),oldgold:new T.MeshStandardMaterial({name:'oldgold',color:'#927036',metalness:.91,roughness:.37}),gold:new T.MeshStandardMaterial({name:'gold',color:'#d1ab58',metalness:.95,roughness:.27})};
 defaults.crease=new T.MeshStandardMaterial({name:'crease',color:'#604018',metalness:.78,roughness:.43});defaults.face=defaults.buddha.clone();defaults.face.roughness=.25;
 const group=new T.Group();group.name='reference6-rebuilt-buddha';group.position.set(x,y,z);group.scale.set(scale*widthScale,scale,scale*depthScale);
 for(const p of restoredBuddhaParts(variant)){const mesh=new T.Mesh(p.geometry,materials[p.material]||defaults[p.material]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=p.geometry.name;group.add(mesh);}return group;
}
