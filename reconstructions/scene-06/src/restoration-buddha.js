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
function loft(rows,{nu=96,nv=140,relief=null,facePlanes=false}={}){
  const lo=rows[0][0],hi=rows.at(-1)[0];
  return surface(nu,nv,(u,v)=>{
    const y=lo+(hi-lo)*v,a=u*TAU,[rx0,rz0,cz]=sampleProfile(rows,y),rx=Math.max(0,rx0),rz=Math.max(0,rz0);
    // The photographed cast has a broad frontal facial plane turning into
    // separate temples. A round cross-section erased that transition and
    // produced the old egg-shaped head. The power varies only over the head;
    // the throat and the cloth retain their ordinary round cross-section.
    const plane=facePlanes?smooth(y,2.47,2.69)*(1-smooth(y,3.25,3.37)):0;
    const sa=Math.sin(a),ca=Math.cos(a),x=Math.sign(sa)*Math.abs(sa)**(1-.05*plane)*rx,front=Math.max(0,ca);
    if(v===0||v===1)return[0,y,cz];
    return[x,y,cz+Math.sign(ca)*Math.abs(ca)**(1-.20*plane)*rz+(relief?relief(x,y)*front**2:0)];
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
  [[-1.045,.750],[-.925,.850],[-.765,1.040],[-.555,1.320]],
  [[-1.035,.795],[-.920,.910],[-.770,1.100],[-.550,1.340]],
  [[-1.010,.850],[-.900,.960],[-.750,1.140],[-.540,1.350]],
  [[-.970,.890],[-.870,1.000],[-.720,1.180],[-.530,1.360]],
  [[-.920,.930],[-.820,1.050],[-.690,1.220],[-.520,1.370]]
 ];
 const p=g.attributes.position,n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=smooth(n.getZ(i),.15,.85);if(!front)continue;
  let relief=0;
  traces.forEach((tr,j)=>{const lo=tr[0][0],hi=tr.at(-1)[0];if(x<lo||x>hi)return;const at=sampleProfile(tr,x)[0],fade=smooth(x,lo,lo+.05)*(1-smooth(x,hi-.025,hi));const amp=[.024,.031,.025,.027,.019][j],w=[.023,.025,.021,.022,.020][j];relief+=fade*(amp*gaussian(y-at,w)-amp*.48*gaussian(y-at+.031,w*.60));});
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
      g.userData={reconstruction:'reference6-recovered-proportion-anatomy-r6-relaxed-mudra',variant,parts:gs.map(p=>p.name)};out.push({geometry:g,material});gs.forEach(g=>g.dispose());
    }return out;}};
}

// Both faces are newly modeled closed lofts. These are anatomical planes, not
// the old flat-front sphere deformation. Brows, nose wings and lips are part
// of the same continuous skin, not colored wires in front of it.
function face(center,attendant=false,variant='central'){
 const sx=attendant?.79:1,sy=attendant?.94:1,sz=attendant?.88:1;
 const fromY=y=>2.505+(2.86+(y-center)/sy-2.505)*1.17;
 const rows=CENTRAL_SKIN_ROWS.filter(r=>r[0]>=2.505).map(r=>[center+(2.505+(r[0]-2.505)/1.17-2.86)*sy,r[1]*sx,r[2]*sz,r[3]*sz]);
 const relief=(x,y)=>{
  const yy=fromY(y),xx=x/sx;
  let f=centralFaceRelief(xx,yy);
  if(attendant)f-=.024*gaussian(xx,.044)*gaussian(2.505+(yy-2.505)/1.17-2.705,.019);
  return f*sz;
 };
 const g=loft(rows,{nu:176,nv:200,relief});
 if(variant==='left')g.translate(0,-center,0).rotateZ(.018).rotateY(.035).translate(0,center,0);
 if(variant==='right')g.translate(0,-center,0).rotateZ(-.012).rotateY(-.025).translate(0,center,0);
 g.userData.frontAt=(x,y)=>{const[rx,rz,cz]=sampleProfile(rows,y),c=Math.sqrt(Math.max(.001,1-(x/rx)**2));return cz+rz*c+relief(x,y)*c*c;};return g;
}
function faceAnatomy(b,g,cy,small=false,integratedSurface=false){
 const sy=small?.91:1.02,wx=small?.79:.96,at=g.userData.frontAt;
 if(!integratedSurface)for(const side of[-1,1]){
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
 if(!integratedSurface){const mouth=[];for(let k=0;k<=32;k++){const x=(-.105+k/32*.210)*wx,y=cy+(-.237+.014*(x/(.12*wx))**2)*sy;mouth.push([x,y,at(x,y)+.003]);}b.add(cord(mouth,.0048),'quiet-closed-lip-line','crease');}
 if(integratedSurface){
  // The photographed cast has dark closed eye apertures and a short dark lip
  // aperture. These are small, physically modeled inset metal faces following
  // the actual recessed anatomy, not a view-facing decal or shading mask.
  const yy=y=>small?cy+(y-2.86)*.94:2.505+(y-2.505)*1.17,xs=small?.79:1;
  for(const side of[-1,1]){
   const aperture=closedPanel(40,8,(u,v)=>{
    const q=u*2-1,inside=Math.max(0,1-q*q),x=(side*.145+q*.094)*xs;
    const y=yy(2.938+.007*q*side+.005*inside+(v-.5)*.014*inside**.65);
    return[x,y,at(x,y)+.0020];
   },.0035);b.add(aperture,'inset-downcast-eye-aperture-'+side,'crease');
  }
  const aperture=closedPanel(36,6,(u,v)=>{
   const q=u*2-1,x=q*.077*xs,y=yy(2.705+.005*(q*.077/.088)**2+(v-.5)*.007*Math.max(0,1-q*q));
   return[x,y,at(x,y)+.0016];
  },.003);b.add(aperture,'inset-closed-lip-aperture','crease');
 }
 const uy=small?cy+.255*sy:3.145;b.add(ellipsoid(0,uy,at(0,uy)+.007,.014,.016,.008),'forehead-urna');
}
function ears(b,cy,small=false,material='buddha'){
 if(!small)cy+=.12;
 const scale=small?.85:1,rows=[
  [-.40,0,0,.351,.047],[-.370,.032,.038,.363,.050],[-.29,.047,.055,.374,.043],
  [-.15,.040,.051,.379,.022],[.02,.045,.050,.365,.004],[.18,.043,.046,.347,-.008],[.28,0,0,.320,-.016]
 ];
 for(const side of[-1,1]){
  const g=surface(64,104,(u,v)=>{
   const dy=-.40+.68*v,[rx,rz,cx,cz]=sampleProfile(rows,dy),a=u*TAU;
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

function ellipsoidDistance(x,y,z,rx,ry,rz){
 const q=Math.sqrt((x/rx)**2+(y/ry)**2+(z/rz)**2);
 return(q-1)*Math.min(rx,ry,rz);
}
function smoothUnion(a,b,k){const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;}
function lineDistance2D(x,y,a,b){
 const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy,t=clamp(((x-a[0])*dx+(y-a[1])*dy)/den,0,1);
 return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}
// The central hand is sampled as one smooth-union field. Fine 3.5mm cells
// resolve the rounded digits; coarse spatial bins avoid testing every capsule
// at every voxel while keeping this generated, editable scene-native mesh.
function sculptedMudraSurface(paths,radii){
 const boxMin=[-.24,-.23,-.12],step=.0035,n=[137,186,77],dims=n.map(v=>v+1),total=dims[0]*dims[1]*dims[2],cell=.04;
 const lattice=new Float32Array(total*3),field=new Float32Array(total),segments=[],bins=new Map();
 const index=(i,j,k)=>(k*dims[1]+j)*dims[0]+i;
 for(let k=0;k<dims[2];k++)for(let j=0;j<dims[1];j++)for(let i=0;i<dims[0];i++){
  const id=index(i,j,k),q=id*3;lattice[q]=boxMin[0]+i*step;lattice[q+1]=boxMin[1]+j*step;lattice[q+2]=boxMin[2]+k*step;
 }
 const minCell=boxMin.map(v=>Math.floor(v/cell)),maxCell=boxMin.map((v,d)=>Math.floor((v+n[d]*step)/cell)),binDims=maxCell.map((v,d)=>v-minCell[d]+1),binArrays=[0,1,2].map(d=>Int16Array.from({length:dims[d]},(_,i)=>Math.floor((boxMin[d]+i*step)/cell)-minCell[d]));
 const binIndex=(x,y,z)=>(z*binDims[1]+y)*binDims[0]+x;
 for(let d=0;d<paths.length;d++){
  const c=curve(paths[d].map(p=>[...p])),samples=32,base=radii[d];
  const radiusAt=t=>base*(1-.17*t+.095*gaussian(t-.31,.080)-.090*gaussian(t-.445,.053)+.067*gaussian(t-.665,.076)-.064*gaussian(t-.795,.050));
  let prior=c.getPoint(0),priorRadius=radiusAt(0);
  for(let q=1;q<=samples;q++){
   const t=q/samples,next=c.getPoint(t),nextRadius=radiusAt(t);
   const segment=[prior.x,prior.y,prior.z,next.x-prior.x,next.y-prior.y,next.z-prior.z,priorRadius,nextRadius-priorRadius,d],segmentId=segments.length;segments.push(segment);
   const pad=Math.max(priorRadius,nextRadius)+.020,lo=[0,1,2].map(a=>Math.floor((Math.min(prior.getComponent(a),next.getComponent(a))-pad)/cell)),hi=[0,1,2].map(a=>Math.floor((Math.max(prior.getComponent(a),next.getComponent(a))+pad)/cell));
   for(let bz=Math.max(lo[2],minCell[2]);bz<=Math.min(hi[2],maxCell[2]);bz++)for(let by=Math.max(lo[1],minCell[1]);by<=Math.min(hi[1],maxCell[1]);by++)for(let bx=Math.max(lo[0],minCell[0]);bx<=Math.min(hi[0],maxCell[0]);bx++){
    const key=binIndex(bx-minCell[0],by-minCell[1],bz-minCell[2]);let bucket=bins.get(key);if(!bucket){bucket=[];bins.set(key,bucket);}bucket.push(segmentId);
   }
   prior=next;priorRadius=nextRadius;
  }
 }
 for(let id=0;id<total;id++){
  const q=id*3,x=lattice[q],y=lattice[q+1],z=lattice[q+2];
  // A short metacarpal block with a hollow palm, a distinct thenar eminence,
  // and four knuckles. Its heel narrows into the wrist; it is no longer a
  // tall oval with five rods attached to its perimeter.
  let d=ellipsoidDistance(x,y+.017,z,.096,.132,.037);
  d=smoothUnion(d,ellipsoidDistance(x-.060,y+.044,z-.009,.049,.077,.040),.014);
  d=smoothUnion(d,ellipsoidDistance(x+.052,y+.049,z+.002,.041,.078,.031),.012);
  d=smoothUnion(d,ellipsoidDistance(x,y+.135,z+.007,.057,.074,.033),.014);
  for(const [kx,ky]of[[-.071,.066],[-.026,.092],[.022,.098],[.068,.078]])d=smoothUnion(d,ellipsoidDistance(x-kx,y-ky,z,.026,.038,.032),.012);
  if(z>0)d+=.009*gaussian(x+.008,.047)*gaussian(y+.003,.066)*smooth(z,.014,.030);
  if(z>0&&Math.abs(x)<.14&&y>-.13&&y<.07){const palmFront=smooth(z,.006,.026),crease1=lineDistance2D(x,y,[-.078,.015],[.062,-.038]),crease2=lineDistance2D(x,y,[-.047,-.079],[.064,-.106]);d+=palmFront*(.0038*gaussian(crease1,.0055)+.0027*gaussian(crease2,.0048));}
  const cx=binArrays[0][id%dims[0]],cy=binArrays[1][Math.floor(id/dims[0])%dims[1]],cz=binArrays[2][Math.floor(id/(dims[0]*dims[1]))],candidates=bins.get(binIndex(cx,cy,cz));
  if(candidates){const digits=[Infinity,Infinity,Infinity,Infinity,Infinity];
   for(const si of candidates){const s=segments[si],den=s[3]*s[3]+s[4]*s[4]+s[5]*s[5],t=clamp(((x-s[0])*s[3]+(y-s[1])*s[4]+(z-s[2])*s[5])/den,0,1),px=s[0]+s[3]*t,py=s[1]+s[4]*t,pz=s[2]+s[5]*t,r=s[6]+s[7]*t,path=s[8];
    digits[path]=Math.min(digits[path],Math.hypot(x-px,y-py,z-pz)-r);
   }
   for(const digit of digits)if(Number.isFinite(digit))d=smoothUnion(d,digit,.011);
  }
  field[id]=d;
 }
 const positions=[],uvs=[],indices=[],edgeVertices=new Map();
 const cornerOffsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tetrahedra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 const pointOf=id=>[lattice[id*3],lattice[id*3+1],lattice[id*3+2]];
 function edgeVertex(a,b){
  const key=a<b?a*total+b:b*total+a;if(edgeVertices.has(key))return edgeVertices.get(key);
  const va=field[a],vb=field[b],t=clamp(va/(va-vb),0,1),pa=pointOf(a),pb=pointOf(b),p=[pa[0]+(pb[0]-pa[0])*t,pa[1]+(pb[1]-pa[1])*t,pa[2]+(pb[2]-pa[2])*t],id=positions.length/3;
  positions.push(...p);uvs.push(p[0],p[1]);edgeVertices.set(key,id);return id;
 }
 function triangle(a,b,c,inside,outside){
  const p=[0,0,0],q=[0,0,0];for(const id of inside){const v=pointOf(id);for(let axis=0;axis<3;axis++)p[axis]+=v[axis]/inside.length;}for(const id of outside){const v=pointOf(id);for(let axis=0;axis<3;axis++)q[axis]+=v[axis]/outside.length;}const dir=[q[0]-p[0],q[1]-p[1],q[2]-p[2]],ia=a*3,ib=b*3,ic=c*3;
  const ab=[positions[ib]-positions[ia],positions[ib+1]-positions[ia+1],positions[ib+2]-positions[ia+2]],ac=[positions[ic]-positions[ia],positions[ic+1]-positions[ia+1],positions[ic+2]-positions[ia+2]],normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  if(normal[0]*dir[0]+normal[1]*dir[1]+normal[2]*dir[2]<0)[b,c]=[c,b];indices.push(a,b,c);
 }
 for(let k=0;k<n[2];k++)for(let j=0;j<n[1];j++)for(let i=0;i<n[0];i++){
  const cube=cornerOffsets.map(o=>index(i+o[0],j+o[1],k+o[2]));
  let hasInside=false,hasOutside=false;for(const id of cube){if(field[id]<0)hasInside=true;else hasOutside=true;}if(!hasInside||!hasOutside)continue;
  for(const tet of tetrahedra){
   const ids=tet.map(c=>cube[c]),inside=ids.filter(id=>field[id]<0),outside=ids.filter(id=>field[id]>=0);if(!inside.length||!outside.length)continue;
   if(inside.length===1){const a=edgeVertex(inside[0],outside[0]),b=edgeVertex(inside[0],outside[1]),c=edgeVertex(inside[0],outside[2]);triangle(a,b,c,inside,outside);}
   else if(outside.length===1){const a=edgeVertex(outside[0],inside[0]),b=edgeVertex(outside[0],inside[1]),c=edgeVertex(outside[0],inside[2]);triangle(a,b,c,inside,outside);}
   else{
    const q0=edgeVertex(inside[0],outside[0]),q1=edgeVertex(inside[0],outside[1]),q2=edgeVertex(inside[1],outside[1]),q3=edgeVertex(inside[1],outside[0]);
    triangle(q0,q1,q2,inside,outside);triangle(q0,q2,q3,inside,outside);
   }
  }
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function raisedHand(b,cx,cy,cz,{size=1,mirror=1,fused=false}={}){
 const point=p=>{const x=mirror*p[0]*size,z=p[2]*size,a=mirror*.25;return[cx+x*Math.cos(a)+z*Math.sin(a),cy+p[1]*size,cz-x*Math.sin(a)+z*Math.cos(a)];};
 const fingers=fused?[
  [[-.071,.057,.000],[-.089,.148,.004],[-.101,.230,.016],[-.095,.278,.036]],
  [[-.026,.088,.000],[-.035,.192,.003],[-.039,.292,.012],[-.032,.342,.035]],
  [[.022,.093,.000],[.025,.205,.002],[.025,.314,.010],[.030,.368,.035]],
  [[.068,.071,.000],[.084,.157,.012],[.087,.225,.043],[.062,.257,.069],[.035,.219,.076]],
  [[.066,-.067,.005],[.112,.002,.034],[.121,.092,.057],[.074,.187,.073],[.035,.219,.076]]
 ]:[
  [[-.096,.080,.002],[-.139,.205,.012],[-.158,.286,.018],[-.151,.318,.012]],
  [[-.031,.136,.000],[-.058,.265,.009],[-.063,.349,.009],[-.057,.376,.000]],
  [[.032,.139,.000],[.067,.270,.007],[.081,.354,.006],[.087,.379,-.003]],
  [[.094,.109,.001],[.131,.216,.012],[.151,.287,.017],[.145,.310,.008]],
  [[.071,-.090,.006],[.145,-.025,.034],[.157,.045,.062],[.134,.078,.068]]
 ];
 if(fused){
  const paths=fingers,radii=[.0205,.021,.022,.0215,.024],hand=sculptedMudraSurface(paths,radii);
  hand.scale(size*mirror,size,size);hand.rotateY(mirror*.25);hand.translate(cx,cy,cz);
  if(mirror<0){const ix=hand.index;for(let i=0;i<ix.count;i+=3){const t=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,t);}}
  recomputeSculptureNormals(hand);b.add(hand,'fused-palm-thenar-and-curved-digits','hand');return point;
 }
 const palmRows=[[-.18,0,0,0],[-.145,.058,.025,0],[-.060,.101,.032,0],[.055,.113,.029,0],[.125,.100,.026,0],[.153,.053,.018,0],[.165,0,0,0]];
 const palm=loft(palmRows,{nu:96,nv:112,relief:(x,y)=>{
  let f=-.013*gaussian(x,.060)*gaussian(y,.075)+.020*gaussian(x-.058,.035)*gaussian(y+.066,.055)+.011*gaussian(x+.045,.030)*gaussian(y-.018,.043);
  for(const knuckle of[-.075,-.027,.028,.076])f+=.011*gaussian(x-knuckle,.020)*gaussian(y-.113,.028)-.0045*gaussian(x-knuckle,.019)*gaussian(y-.075,.012);
  return f-.006*gaussian(y+.020+.14*x,.006);
 }});
 palm.scale(size*mirror,size,size);palm.rotateY(mirror*.25);palm.translate(cx,cy,cz);if(mirror<0){const ix=palm.index;for(let i=0;i<ix.count;i+=3){const t=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,t);}}recomputeSculptureNormals(palm);b.add(palm,'anatomical-raised-palm','hand');
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
 const paths=[
  [[-.071,.057,.000],[-.083,.138,.014],[-.079,.202,.058],[-.064,.213,.100]],
  [[-.026,.088,.000],[-.032,.184,.012],[-.026,.248,.061],[-.010,.250,.109]],
  [[.022,.093,.000],[.025,.195,.012],[.032,.262,.061],[.044,.260,.108]],
  [[.068,.071,.000],[.084,.160,.021],[.082,.223,.068],[.067,.230,.106]],
  [[.066,-.067,.005],[.127,.006,.045],[.123,.095,.089],[.060,.155,.112]]
 ];
 const g=sculptedMudraSurface(paths,[.019,.0205,.0215,.021,.025]),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,cx+mirror*x*.95*size,cy+(.58*y+.81*z)*size,cz+(-.81*y+.58*z)*size);}
 if(mirror<0){const ix=g.index;for(let i=0;i<ix.count;i+=3){const q=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,q);}}
 recomputeSculptureNormals(g);b.add(g,'continuous-cupped-palm-metacarpals-curled-digits','hand');
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
    const rows=[[3.295,0,0,-.028],[3.318,.29,.223,-.028],[3.405,.385,.286,-.03],[3.470,.353,.268,-.03],[3.530,.267,.213,-.03],[3.572,.145,.132,-.03],[3.59,0,0,-.03]].map(p=>[p[0],p[1]*1.08,p[2],p[3]]);
    b.add(loft(rows,{nu:80,nv:72}),'rounded-curl-cap','oldgold');
    for(let row=0;row<6;row++){
      const y=3.36+row*.035,[rx,rz,cz]=sampleProfile(rows,y),n=Math.max(10,Math.round(TAU*rx/.068));
      for(let k=0;k<n;k++){const a=k/n*TAU+(row%2)*Math.PI/n;b.add(sculptedHairCurl(Math.sin(a)*rx,y,cz+Math.cos(a)*rz,.026,.031,.024,(row*17+k)*.31),`hair-curl-${row}-${k}`,'oldgold');}
    }
    const ps=[];for(let k=0;k<=60;k++){const a=-1.55+k/60*3.10;ps.push([Math.sin(a)*.347,3.298,-.025+Math.cos(a)*.247]);}b.add(cord(ps,.013),'low-diadem-band','gold');
    for(let i=0;i<15;i++){const a=(i-7)*.196,h=.075+.082*gaussian(i-7,1.7),x=Math.sin(a)*.345,z=-.025+Math.cos(a)*.250;b.add(leaf(x,3.298,z,.018,h,.012,-a*.15),`diadem-leaf-${i}`,'gold');}
    b.add(leaf(0,3.54,.185,.021,.065,.014),'cap-front-tip','gold');
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

// Photo-led seated cast, revision r7. The shoulder is a structural section,
// the neck is a narrow vertical bearing, and the chin has its own flat plane.
// These measured profile rows replace the old continuous ovoid silhouette.
const MAIN_BODY=[
 [0,0,0,.10],[.035,.38,.29,.10],[.22,.51,.36,.08],[.48,.55,.39,.025],[.76,.56,.39,.005],
 [1.02,.58,.390,-.005],[1.30,.61,.380,-.025],[1.59,.65,.365,-.040],[1.88,.70,.335,-.055],
 [2.08,.71,.300,-.060],[2.20,.55,.255,-.055],[2.30,.238,.176,-.020],
 [2.38,.208,.160,-.005],[2.45,.214,.169,.002],[2.48,.215,.172,.005],[2.54,0,0,.005]
];
const CENTRAL_SKIN_ROWS=[
 ...MAIN_BODY.slice(0,-1),
 [2.505,.181,.183,.006],[2.540,.225,.209,.002],[2.605,.274,.228,-.003],
 [2.687,.315,.237,-.012],[2.815,.333,.245,-.018],[2.955,.334,.247,-.025],
 [3.084,.328,.241,-.031],[3.201,.309,.219,-.034],[3.289,.259,.181,-.034],
 [3.347,.140,.108,-.034],[3.365,0,0,-.034]
].sort((a,b)=>a[0]-b[0]);
const MAIN_BAND=[
 [.63,.12,.14],[.91,.29,.17],[1.18,.41,.19],[1.48,.55,.20],[1.80,.64,.20],[2.07,.59,.17],[2.25,.43,.105]
].map(p=>[p[0]<.9?p[0]+.18*(1-smooth(p[0],.63,.9)):p[0],p[1]*1.10,p[2]*1.10]);
// A fold consists of a broad load-bearing roll, its compressed valley, and
// finer subsidiary wrinkles. Each trace starts/ends on a real seam or lap.
// The varied amplitudes/widths are intentional: equal semicircles looked like
// cast tubing laid over a smooth breast rather than folded bronze drapery.
const MAIN_DRAPE_TRACES=[
 [[-.41,2.13],[-.31,1.93],[-.12,1.82],[.12,1.84],[.53,2.06]],
 [[-.43,1.99],[-.30,1.78],[-.10,1.67],[.10,1.70],[.52,1.99]],
 [[-.47,1.85],[-.33,1.61],[-.13,1.50],[.10,1.56],[.51,1.91]],
 [[-.50,1.68],[-.36,1.43],[-.16,1.33],[.07,1.41],[.50,1.81]],
 [[-.53,1.48],[-.40,1.25],[-.19,1.17],[.04,1.25],[.48,1.69]],
 [[-.55,1.28],[-.40,1.07],[-.20,1.00],[.02,1.10],[.45,1.55]],
 [[-.54,1.10],[-.40,.91],[-.20,.84],[.03,.95],[.42,1.39]],
 [[-.50,.92],[-.35,.75],[-.16,.70],[.04,.80],[.37,1.22]],
 [[-.45,.76],[-.29,.61],[-.09,.58],[.08,.69],[.31,1.03]],
 [[-.38,.62],[-.22,.49],[-.02,.50],[.13,.62],[.27,.87]]
];
function mainRelief(x,y){
 let f=.030*gaussian(x+.08,.42)*gaussian(y-1.31,.62);
 const widths=[.070,.057,.065,.048,.063,.051,.056,.045,.049,.046];
 const amplitudes=[.038,.030,.045,.034,.044,.032,.039,.028,.034,.022];
 for(let i=0;i<MAIN_DRAPE_TRACES.length;i++){
  const tr=MAIN_DRAPE_TRACES[i],lo=tr[0][0],hi=tr.at(-1)[0];if(x<lo||x>hi)continue;
  const fade=smooth(x,lo,lo+.06)*(1-smooth(x,hi-.04,hi)),raw=sampleProfile(tr,x)[0];
  const at=raw+.012*Math.sin(x*7.4+i*1.73),amp=amplitudes[i]*(.76+.24*Math.cos(x*4.8-i*.61));
  f+=fade*(amp*gaussian(y-at,widths[i])-amp*.62*gaussian(y-at+.061,widths[i]*.45));
  if(i%3!==1)f+=fade*.008*gaussian(y-at-.078,widths[i]*.36)*gaussian(x+.12,.29);
 }
 // The cloth is pulled down from a shoulder rather than cut off at a round
 // neck hole. These two broad transition planes meet the shoulder sleeves.
 f+=.036*gaussian(x+.48,.10)*gaussian(y-1.83,.42);
 f-=.019*gaussian(x-.47,.052)*gaussian(y-1.61,.55);
 if(y>2.25){for(const ring of[2.337,2.395,2.452])f-=.0034*gaussian(y-ring,.016)*(1-smooth(Math.abs(x),.15,.22));}
 return f;
}
function centralFaceRelief(x,y){
 const xx=x,yy=2.505+(y-2.505)/1.17,G=(cx,cy,sx,sy)=>gaussian(xx-cx,sx)*gaussian(yy-cy,sy);
 // Zygomatic, lower cheek, and chin planes are deliberately different masses.
 let f=.035*G(-.205,2.77,.109,.133)+.035*G(.205,2.77,.109,.133);
 f+=.006*G(-.205,2.64,.128,.077)+.006*G(.205,2.64,.128,.077);
 f+=.013*G(0,2.590,.165,.058)-.013*G(0,2.641,.109,.022);
 // Closed almond lids sit in deeply modeled sockets beneath arched brows.
 for(const side of[-1,1]){
  const q=(xx*side-.145)/.105,inside=Math.max(0,1-q*q),mask=inside**.70;
  const lid=2.938+.007*q+.005*inside,upper=lid+.041*Math.sqrt(inside),brow=2.984+.056*Math.sqrt(inside);
  f-=.027*G(side*.145,2.970,.111,.069);
  f+=mask*(.020*gaussian(yy-brow,.025)+.024*gaussian(yy-upper,.021)-.012*gaussian(yy-lid,.0075)+.009*gaussian(yy-lid+.017,.015));
  f-=.010*G(side*.278,2.937,.028,.046);
 }
 // A bridge, alae, septum, and a short philtrum give the nose real side planes.
 f+=.052*G(0,2.884,.047,.143)+.019*G(0,2.991,.073,.052);
 f+=.046*G(0,2.799,.063,.041);
 f+=.024*G(-.058,2.784,.030,.029)+.024*G(.058,2.784,.030,.029);
 f-=.011*G(-.047,2.773,.015,.009)+.011*G(.047,2.773,.015,.009);
 f+=.021*G(0,2.767,.021,.019)-.014*G(0,2.738,.018,.021);
 for(const side of[-1,1])f-=.010*G(side*.093,2.752,.018,.053);
 // Bowed upper lip and fuller lower lip share the face mesh; the aperture is
 // an actual recessed cleft with rounded ends, not a painted black smile.
 const mouth=2.705+.005*(xx/.088)**2,gate=gaussian(xx,.083);
 f+=.012*(gaussian(xx-.024,.027)+gaussian(xx+.024,.027))*gaussian(yy-mouth-.015,.015);
 f+=.015*gaussian(xx,.072)*gaussian(yy-mouth+.022,.018)-.013*gate*gaussian(yy-mouth,.0075);
 f-=.009*G(-.104,2.721,.014,.014)+.009*G(.104,2.721,.014,.014);
 f+=.012*G(0,3.10,.185,.071);
 return f;
}
function centralSkinRelief(x,y){
 const blend=smooth(y,2.48,2.55);
 return mainRelief(x,y)*(1-blend)+centralFaceRelief(x,y)*blend;
}
function centralSkin(){
 const g=loft(CENTRAL_SKIN_ROWS,{nu:256,nv:440,relief:centralSkinRelief,facePlanes:true}),uv=g.attributes.uv;
 const lo=CENTRAL_SKIN_ROWS[0][0],hi=CENTRAL_SKIN_ROWS.at(-1)[0];
 for(let i=0;i<uv.count;i++){
  const u=uv.getX(i),v=uv.getY(i),y=lo+(hi-lo)*v,[rx]=sampleProfile(CENTRAL_SKIN_ROWS,y);
  uv.setXY(i,u*TAU*Math.max(.045,rx),y);
 }
 g.userData.frontAt=(x,y)=>{
  const[rx,rz,cz]=sampleProfile(CENTRAL_SKIN_ROWS,y),plane=smooth(y,2.47,2.69)*(1-smooth(y,3.25,3.37));
  const s=Math.min(.9999,Math.abs(x/rx))**(1/(1-.05*plane)),c=Math.sqrt(1-s*s);
  return cz+rz*c**(1-.20*plane)+centralSkinRelief(x,y)*c*c;
 };
 return g;
}
function shoulderRobePanel(side){
 const outline=[[.60,1.02,.27],[.91,1.085,.17],[1.30,1.07,.095],[1.67,.96,.035],[2.02,.77,-.025],[2.255,.49,-.050]];
 return closedPanel(32,112,(u,v)=>{
  const y=.60+1.655*v,[outer,oz]=sampleProfile(outline,y),rx=sampleProfile(MAIN_BODY,y)[0],inner=rx*.91,q=side<0?1-u:u;
  const x=side*(inner+(outer-inner)*q),iz=frontOf(MAIN_BODY,side*inner,y)+.006;
  const z=T.MathUtils.lerp(iz,oz,q)+.036*Math.sin(Math.PI*q)+sideRobeFold(q,v,side);
  return[x,y,z];
 },.038);
}
function sideRobeFold(q,v,side){
 const gate=Math.sin(Math.PI*q)*Math.sin(Math.PI*v),phase=q*(4.4+2.9*(1-v))+.22*Math.sin(v*2.7)+(side<0?.17:0);
 return gate*(.034*Math.cos(TAU*phase)+.011*Math.cos(TAU*phase*2.03+.7))*((side<0?.86:1.0)+.16*Math.sin(v*7.1));
}
function mainGarmentFront(x,y){
 const rx=sampleProfile(MAIN_BODY,y)[0],inner=rx*.91;
 if(Math.abs(x)<=inner)return frontOf(MAIN_BODY,x,y)+mainRelief(x,y);
 const outline=[[.60,1.02,.27],[.91,1.085,.17],[1.30,1.07,.095],[1.67,.96,.035],[2.02,.77,-.025],[2.255,.49,-.050]];
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

function chasedLotusMedallion(b,x,y,z,scale=1,tag='pectoral'){
 // Convex, overlapping chased metal leaves form a small relief casting. The
 // reference's large chest ornament is actual sculptural mass, not a texture.
 for(let row=0;row<2;row++)for(let k=0;k<(row?8:6);k++){
  const n=row?8:6,a=k/n*TAU+(row?.22:0),r=(row?.045:.019)*scale;
  const g=leaf(0,0,0,(row?.020:.017)*scale,(row?.090:.068)*scale,.015*scale);
  g.rotateZ(-a);g.translate(x+Math.sin(a)*r,y+Math.cos(a)*r,z+(row?0:.018)*scale);
  b.add(g,`${tag}-overlapping-cast-leaf-${row}-${k}`,'gold');
 }
 b.add(ellipsoid(x,y,z+.031*scale,.032*scale,.041*scale,.024*scale),tag+'-raised-center','gold');
 for(let k=0;k<7;k++){
  const a=k/7*TAU;b.add(ellipsoid(x+Math.sin(a)*.043*scale,y+Math.cos(a)*.049*scale,z+.025*scale,.010*scale,.011*scale,.009*scale),`${tag}-chased-bead-${k}`,'gold');
 }
}

function centralCastJewellery(b){
 const at=(x,y)=>mainGarmentFront(x,y);
 const centerY=1.835;chasedLotusMedallion(b,-.012,centerY,at(-.012,centerY)+.022,1.18,'central-lotus-pectoral');
 // A softly hung chain follows the breast, with distinct suspended bosses.
 for(const side of[-1,1]){
  const path=[];for(let k=0;k<=32;k++){const t=k/32,x=side*(.08+.29*t),y=1.86+.35*t+.032*Math.sin(Math.PI*t);path.push([x,y,at(x,y)+.019]);}
  b.add(sweep(path,.011,.008,{segments:64,radial:12}),'pectoral-bearing-chain-'+side,'gold');
 }
 for(let row=0;row<5;row++){
  const y=1.62-row*.16,x=.002+.012*Math.sin(row*.8),z=at(x,y)+.024;
  chasedLotusMedallion(b,x,y,z,.37+row*.012,'central-hanging-rosette-'+row);
  if(row<4){const ny=y-.16;b.add(sweep([[x,y-.035,z],[x+.010,y-.080,at(x,y-.08)+.030],[.002+.012*Math.sin((row+1)*.8),ny+.035,at(x,ny)+.027]],.008,.006,{segments:20,radial:10}),'small-pectoral-link-'+row,'gold');}
 }
 // Embossed brocade belongs to the broad right stole and follows its actual
 // changing surface, rather than floating over an idealized body envelope.
 for(let k=0;k<8;k++){
  const y=.99+k*.145,[x]=sampleProfile(MAIN_BAND,y),z=mainGarmentFront(x,y)+.042;
  chasedLotusMedallion(b,x,y,z,.27,'stole-cast-brocade-'+k);
 }
}

function centralFigure(){
 const b=makeBuilder('central');
 const skin=centralSkin(),faceSurface={userData:{frontAt:skin.userData.frontAt}};
 b.add(skin,'continuous-seated-torso-throat-and-face','central');faceAnatomy(b,faceSurface,2.78,false,true);ears(b,2.78,false,'central');crown(b,2.78,{central:true});
 const arms=[
  [[-.40,2.20,-.025],[-.64,2.02,-.005],[-.82,1.65,.055],[-.92,1.09,.13],[-.92,.82,.19],[-.84,.67,.25]],
  [[.40,2.20,-.025],[.65,2.01,-.005],[.84,1.65,.045],[.94,1.10,.14],[.89,.74,.25],[.66,.67,.45],[.43,.64,.66]]
 ];
 arms.forEach((original,i)=>{const ps=original.map(p=>[p[0]*1.08,p[1]+.10*(1-smooth(p[1],.65,1.10)),p[2]]);b.add(sweep(ps,.207,.133,{segments:128,radial:56,profile:t=>.82+.22*Math.sin(Math.PI*t)-.20*smooth(t,.82,1),relief:(t,a)=>{
   const fan=smooth(t,.49,.61)*(1-smooth(t,.96,1)),phase=7*a+1.8*Math.sin(t*Math.PI);
   return (.013*Math.cos(phase)*fan+.004*Math.cos(4*a+3*t))*Math.sin(Math.PI*t);
 }}),`broad-sleeve-${i}`);});
 b.add(sweep([[-1.03,.80,.20],[-.98,.84,.25],[-.81,1.02,.36],[-.63,1.24,.49],[-.54,1.35,.62]],.149,.107,{segments:128,radial:72,profile:t=>.82+.18*Math.sin(Math.PI*t)-.16*smooth(t,.85,1),relief:(t,a)=>(.028*Math.cos(8*a+.75*Math.sin(Math.PI*t))+.010*Math.cos(15*a+1.7*t))*Math.sin(Math.PI*t)**.65}),'sculpted-longitudinal-raised-sleeve-folds');
 for(const side of[-1,1])b.add(sweep([[side*.52,2.25,-.075],[side*.84,2.03,-.030],[side*1.04,1.64,.020],[side*1.135,1.10,.10],[side*1.083,.72,.26]],.034,.025,{segments:96,radial:28,profile:t=>.8+.2*Math.sin(Math.PI*t)}),`outer-robe-roll-${side}`);
 for(const side of[-1,1])b.add(shoulderRobePanel(side),`continuous-side-robe-${side}`);
 // Each knee is a curved axial cloth volume with a small medial attachment,
 // a broad lap, and a compressed lateral turn. They are intentionally not
 // two identical capsules. The folds turn around the knee and die into seams.
 const thighRows=[[-.18,0,0,.36,.34],[0,.156,.25,.35,.39],[.30,.237,.36,.325,.43],[.68,.235,.385,.31,.435],[1.04,.225,.345,.285,.41],[1.29,.174,.225,.286,.37],[1.43,0,0,.30,.33]];
 for(const side of[-1,1]){
  const leg=surface(112,200,(u,v)=>{
   const xx=-.18+1.61*v,[ry,rz,cy,cz]=sampleProfile(thighRows,xx),a=u*TAU;
   if(v===0||v===1)return[side*xx,cy,cz];
   const yy=cy+Math.sin(a)*ry+(side<0?.012:-.008)*Math.sin(Math.PI*v),front=Math.max(0,Math.cos(a));
   let pleats=0;
   for(const [i,base]of[.37,.265,.165,.085].entries()){
    const at=base+.18*((xx-.78)/.78)**2+.012*Math.sin(xx*5.4+i*1.1)+(side>0?.014:0);
    const gate=Math.sin(Math.PI*v)**.68*(1-smooth(xx,1.12,1.36)),width=[.047,.036,.030,.026][i],amp=[.044,.037,.028,.018][i];
    pleats+=gate*(amp*gaussian(yy-at,width)-amp*.66*gaussian(yy-at+.044,width*.46));
   }
   pleats+=.013*gaussian(yy-(.23+.13*(xx-.5)**2),.018)*gaussian(xx-.57,.40);
   return[side*xx,yy,cz+Math.cos(a)*rz+pleats*front**2];
  },true);
  if(side>0){for(let i=0;i<leg.index.count;i+=3){const q=leg.index.getX(i+1);leg.index.setX(i+1,leg.index.getX(i+2));leg.index.setX(i+2,q);}recomputeSculptureNormals(leg);}
  b.add(leg,'sculpted-crossed-thigh-drapery-'+side);
 }
 // Two shin/foot volumes cross at different depths. The toe fan continues
 // from the distal foot rather than sitting as five detached golden beads.
 const feet=[[[1.02,.54,.48],[.67,.57,.64],[.26,.59,.76],[-.13,.60,.83],[-.38,.57,.83]],[[-.99,.51,.47],[-.65,.54,.60],[-.27,.565,.68],[.08,.57,.72],[.30,.54,.72]]];
 feet.forEach((ps,j)=>{
  const c=curve(ps),g=surface(56,120,(u,t)=>{
   const a=u*TAU,q=c.getPointAt(t),cap=t===0||t===1?0:Math.sin(Math.PI*t)**.36;
   const arch=.015*gaussian(t-.72,.20),sole=.021*gaussian(t-.86,.17)*Math.max(0,-Math.cos(a));
   return[q.x,q.y+Math.cos(a)*(.068+arch)*cap,q.z+Math.sin(a)*(.105-.027*t)*cap+sole];
  },true);if(j===0){for(let i=0;i<g.index.count;i+=3){const q=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,q);}recomputeSculptureNormals(g);}b.add(g,`anatomical-crossed-shin-foot-${j}`);
  const side=j===0?-1:1,tip=ps.at(-1);
  for(let i=0;i<5;i++)b.add(sweep([[tip[0]-side*.080,tip[1]+.006,tip[2]-.069+i*.030],[tip[0]+side*(.038-i*.009),tip[1]-.005-i*.002,tip[2]-.068+i*.029]],.022-i*.0014,.018-i*.001,{segments:36,radial:18,profile:t=>1-.24*t+.08*gaussian(t-.47,.12)}),`continuous-foot-toe-${j}-${i}`);
 });
 // The apron spreads over the crossed ankles and returns under the seat. Its
 // rolled, irregular hem and converging fold tree replace the rectangular slab.
 const cloth=closedPanel(112,200,(u,v)=>{
   const width=.70-.43*v**.68,cx=-.025+.095*v;
   const y=-.095+.87*v+.024*(1-v)**4*Math.sin(Math.PI*u)-.017*(1-v)**3*Math.sin(3*Math.PI*u);
   const x=cx+(u-.5)*width,z0=.930-.335*smooth(v,.48,1)+.026*Math.sin(Math.PI*u);
   let fold=0;const ends=[-.32,-.20,-.045,.13,.29],amps=[.025,.030,.045,.028,.022];
   for(let k=0;k<ends.length;k++){
     const center=.07+(ends[k]-.07)*(1-v)**.69+.018*Math.sin(6.3*v+k*1.43)*(1-v);
     const amp=amps[k]*(.48+.52*(1-v));
     fold+=amp*gaussian(x-center,.028+.020*(1-v))-amp*.61*gaussian(x-center+.041,.017+.006*(1-v));
   }
   fold+=.013*gaussian(v-.05,.035)*Math.sin(Math.PI*u);
   return[x,y,z0+fold*Math.sin(Math.PI*u)];
 },.018);b.add(cloth,'fan-folded-lap-apron','cloth');
 raisedHand(b,-.50,1.475,.825,{size:1.18,fused:true});
 b.add(sweep([[-.60,1.235,.47],[-.54,1.34,.68],[-.50,1.40,.81]],.069,.057,{segments:54,radial:28,profile:t=>1-.13*t}),'tapered-raised-bare-wrist','hand');
 // One unified, upward-facing resting hand. Its wrist, thenar mass, all five
 // digits, and palm are a single signed-distance mesh, with no legacy palm.
 const lapPaths=[
  [[-.071,.057,0],[-.079,.137,.004],[-.076,.204,.018],[-.064,.232,.036]],
  [[-.026,.088,0],[-.029,.187,.004],[-.025,.255,.018],[-.017,.280,.035]],
  [[.022,.093,0],[.026,.198,.004],[.030,.270,.018],[.037,.296,.035]],
  [[.068,.071,0],[.083,.159,.010],[.083,.219,.031],[.077,.242,.048]],
  [[.066,-.067,.005],[.132,-.008,.035],[.146,.077,.056],[.111,.139,.072]]
 ];
 const lap=sculptedMudraSurface(lapPaths,[.019,.0205,.0215,.021,.025]),lp=lap.attributes.position;
 for(let i=0;i<lp.count;i++){const x=lp.getX(i),y=lp.getY(i),z=lp.getZ(i);lp.setXYZ(i,-.035-y*1.10,.727+z*1.10,.897-x*1.10);}
 recomputeSculptureNormals(lap);b.add(lap,'unified-upturned-resting-hand','hand');
 b.add(sweep([[.91,.77,.31],[.68,.75,.57],[.43,.745,.76],[.16,.727,.897]],.077,.064,{segments:76,radial:32,profile:t=>1-.18*t}),'resting-forearm-through-wrist','hand');
 const front=(x,y)=>frontOf(MAIN_BODY,x,y)+mainRelief(x,y);
 const leftBorder=[];for(let k=0;k<=54;k++){const t=k/54,y=.64+1.60*t,x=-(.42-.17*t*t);leftBorder.push([x,y,front(x,y)+.006]);}b.add(cord(leftBorder,.012),'left-cloth-edge');
 b.add(broadShoulderBand(),'covered-shoulder-cloth-band');
 centralCastJewellery(b);
 return b.finish();
}

const SIDE_BODY=[
 [0,0,0,.10],[.03,.24,.22,.10],[.31,.35,.29,.08],[.65,.42,.32,.045],[.97,.45,.34,.015],
 [1.28,.44,.33,0],[1.60,.465,.325,-.015],[1.92,.515,.315,-.025],[2.19,.555,.29,-.035],
 [2.39,.46,.25,-.040],[2.52,.245,.19,-.030],[2.71,.177,.15,-.025],[2.78,0,0,-.020]
];
function sideRelief(x,y){
 let f=.022*gaussian(x+.04,.31)*gaussian(y-1.76,.46);
 const rows=[[2.16,.019,.043],[2.02,.027,.040],[1.88,.022,.034],[1.73,.031,.038],[1.57,.026,.033],[1.42,.020,.030]];
 for(let i=0;i<rows.length;i++){
  const [base,amp,w]=rows[i],q=(x-.025)/(.45-i*.014),at=base+(.30+i*.025)*Math.abs(q)**1.72+.012*Math.sin(x*6+i*.8),gate=1-smooth(Math.abs(q),.84,1.12);
  f+=gate*(amp*gaussian(y-at,w)-amp*.55*gaussian(y-at+.045,w*.55));
 }
 f+=.029*gaussian(x+.22-.09*(y-1),.043)*smooth(y,.4,.8)*(1-smooth(y,2.15,2.4));
 return f;
}
function attendantFigure(variant){
 const b=makeBuilder(variant),side=variant==='left'?1:-1;
 const add=(g,tag,m='buddha')=>{if(side<0){g.scale(-1,1,1);const ix=g.index;for(let i=0;i<ix.count;i+=3){const q=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,q);}}return b.add(g,tag,m);};
 b.add(loft(SIDE_BODY,{nu:112,nv:160,relief:sideRelief}),'continuous-attendant-torso');
 neck(b,2.66,true);const fg=face(3.055,true,variant);b.add(fg,'attendant-oval-face','face');faceAnatomy(b,fg,3.055,true,true);ears(b,3.055,true);crown(b,3.055,{variant});
 const ps0=[[-.35,2.40,-.02],[-.58,2.22,.00],[-.67,1.91,.055],[-.68,1.55,.16],[-.56,1.36,.30],[-.36,1.53,.47],[-.29,1.67,.53]];
 const ps1=[[.35,2.40,-.02],[.59,2.21,.00],[.69,1.88,.05],[.75,1.51,.17],[.75,1.32,.33],[.77,1.45,.48]];
 for(const[which,ps]of[ps0,ps1].entries())add(sweep(ps,.193,.172,{segments:96,radial:40,profile:t=>.78+.32*Math.sin(Math.PI*t),relief:(t,a)=>.013*Math.cos(a*5+t*5)*Math.sin(Math.PI*t)**2}),`thick-sleeve-${which}`);
 // Hand geometry remains independent on each attendant, with a slight
 // difference of wrist height and head attitude, rather than duplicating main.
 raisedHand({add:(g,t,m)=>add(g,t,m)},-.285,1.74+(variant==='right'?.025:0),.55,{size:.86,fused:true});
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
   let fold=.036*gaussian(y-.98,.29)*gaussian(Math.sin(a)-.10,.62);for(let j=0;j<4;j++){const at=-.62+j*.39+.29*(y-.72),w=.105+.025*(1-v),amp=[.025,.034,.027,.019][j],gate=smooth(y,.10,.26)*(1-smooth(y,1.28,1.51));fold+=gate*(amp*gaussian(Math.sin(a)-at,w)-amp*.52*gaussian(Math.sin(a)-at-.14,w*.55));}fold+=.017*gaussian(y-(.54+.39*(Math.sin(a)+.10)**2),.048);
   return[x,y,cz+Math.cos(a)*rz+fold*front**3];
  },true);if(legSide<0){for(let i=0;i<g.index.count;i+=3){const q=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,q);}recomputeSculptureNormals(g);}add(g,`angled-bent-leg-${legSide}`);
  const footx=legSide*.30;add(ellipsoid(footx,.077,.49,.155,.073,.150,legSide*.14),`resting-foot-${legSide}`);
  for(let i=0;i<5;i++)add(finger([[footx+legSide*.055,.075,.425+i*.027],[footx+legSide*(.158-i*.008),.069,.43+i*.026]],.016-i*.001),`attendant-toe-${legSide}-${i}`);
 }
 add(closedPanel(48,100,(u,v)=>{
  const y=.32+1.24*v,cx=-.12+.26*v,width=.28+.30*Math.sin(Math.PI*v*.82),x=cx+(u-.5)*width;
  let z=.63-.35*v+.055*Math.sin(Math.PI*v);for(let k=0;k<4;k++){const crease=.12+k*.25+.047*Math.sin(v*4.3+k*1.31),w=.048+.016*(1-v);z+=(.022+k*.002)*gaussian(u-crease,w)-.012*gaussian(u-crease-.071,w*.56);}z+=.012*Math.sin(u*3*Math.PI+v*2)*Math.sin(Math.PI*u);
  return[x,y,z];
 },.037),'diagonal-lap-sash');
 const front=(x,y)=>frontOf(SIDE_BODY,x,y)+sideRelief(x,y);
 for(let layer=0;layer<1;layer++){
   const width=.438,base=2.075,rise=.275,depth=.080;
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
 reference:6,reconstruction:'scene06-r7-physical-cast-facial-planes-cloth-and-connected-hands',frontAxis:'+Z',seatContact:0,
 decorativeMinY:-.157,headCenter:2.78,crownTop:3.59,raisedHandTop:1.85313,kneeWidth:2.90,bodyDepth:1.50,
 variants:{central:{seatContact:0,decorativeMinY:-.157,crownTop:3.59,headCenter:2.78,kneeWidth:2.90},left:{seatContact:0,crownTop:3.75,headCenter:3.055},right:{seatContact:0,crownTop:3.75,headCenter:3.055}},
 referenceFit:{central:{x:0,y:3,z:0,scale:2.1/3.26},attendantScale:1.45/3.26,scaleConvention:'retain external unit conversion; do not normalize by crownTop'},
 materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
// The browser consumes the generated, physically fused sculpture assets. The
// functions above remain the editable source for the offline generator.
export function installRestoredBuddhaAssets(variants){
 for(const variant of['central','left','right']){
  const parts=variants[variant];if(!Array.isArray(parts)||!parts.length||parts.some(p=>!p.geometry?.isBufferGeometry))throw Error('Incomplete physical cast asset: '+variant);
 }
 cache.clear();for(const variant of['central','left','right'])cache.set(variant,variants[variant]);
}
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
