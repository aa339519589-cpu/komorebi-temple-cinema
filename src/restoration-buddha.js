import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reference 6, sculpture only. +Z faces the viewer. Coordinates deliberately
// use a normalized seat-contact origin (Y=0); central crown Y=3.7765.
// Attendants have independently fitted shoulders/head and crown Y=3.9759.
// Lotus/throne geometry is deliberately excluded; the altar module owns it.
// No lighting, halo, podium, scene, or camera is created by this module.
const TAU = Math.PI * 2;
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const gaussian = (x, s) => Math.exp(-((x / s) ** 2));
const cache = new Map();

// Position-preserving normal repair for parametric grid boundaries. Recomputing
// normals after a nonlinear Y remap must not split the duplicated U seam.
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
// Give the exposed central cloth tongue a thin cast edge and back. The front
// samples and normals remain intact; only the short confirmed gold hem descends
// below the structural seat, not the foreground incense/smoke column.
function solidClothPanel(front,nu,nv,thickness=.012) {
  const back=front.clone(),bp=back.attributes.position,bn=back.attributes.normal,bi=back.index;
  for(let i=0;i<bp.count;i++){bp.setZ(i,bp.getZ(i)-thickness);bn.setXYZ(i,-bn.getX(i),-bn.getY(i),-bn.getZ(i));}
  for(let i=0;i<bi.count;i+=3){const x=bi.getX(i+1);bi.setX(i+1,bi.getX(i+2));bi.setX(i+2,x);}
  const perimeter=[];
  for(let i=0;i<=nu;i++)perimeter.push(i);
  for(let j=1;j<=nv;j++)perimeter.push(j*(nu+1)+nu);
  for(let i=nu-1;i>=0;i--)perimeter.push(nv*(nu+1)+i);
  for(let j=nv-1;j>0;j--)perimeter.push(j*(nu+1));
  const pos=[],uv=[],ids=[],p=front.attributes.position;
  for(let k=0;k<perimeter.length;k++){
    const a=perimeter[k],b=perimeter[(k+1)%perimeter.length],q=k*4;
    pos.push(p.getX(a),p.getY(a),p.getZ(a),p.getX(b),p.getY(b),p.getZ(b),p.getX(a),p.getY(a),p.getZ(a)-thickness,p.getX(b),p.getY(b),p.getZ(b)-thickness);
    uv.push(0,0,1,0,0,1,1,1);ids.push(q,q+2,q+1,q+1,q+2,q+3);
  }
  const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(pos,3));edge.setAttribute('uv',new T.Float32BufferAttribute(uv,2));edge.setIndex(ids);edge.computeVertexNormals();
  const out=mergeGeometries([front,back,edge],false);front.dispose();back.dispose();edge.dispose();return out;
}

function ellipse(x, y, z, rx, ry, rz, segments = 32, rings = 24) {
  return new T.SphereGeometry(1, segments, rings).scale(rx, ry, rz).translate(x, y, z);
}
// Close the actual neck boundary with exactly the same ring samples. The
// former generic 48-sided discs did not share edges with the 160/128-sided
// torso mouths. This changes only the existing planar cap triangulation;
// no head, neck profile, torso surface or silhouette sample is moved.
function torsoRingCap(host,nu,nv,upward=true) {
  const p=host.attributes.position,first=nv*(nu+1),center=new T.Vector3(),positions=[],uv=[],ids=[];
  for(let i=0;i<nu;i++)center.add(new T.Vector3().fromBufferAttribute(p,first+i));center.divideScalar(nu);
  positions.push(...center.toArray());uv.push(.5,.5);
  for(let i=0;i<=nu;i++){
    positions.push(p.getX(first+i),p.getY(first+i),p.getZ(first+i));
    uv.push(.5+.5*Math.sin(i/nu*TAU),.5+.5*Math.cos(i/nu*TAU));
  }
  for(let i=0;i<nu;i++)ids.push(...(upward?[0,i+1,i+2]:[0,i+2,i+1]));
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();
  if(upward)g.userData.sculptureNeckCap={nu,nv,hostFirstVertex:first};return g;
}
// Close only the existing planar lower attendant torso ring. The old body
// surfaces stay exact prefixes; this is an underside of the same cast form,
// not a longer robe, larger seat or new garment detail.
function closeAttendantTorsoBase(host) {
  const nu=128,firstVertex=host.attributes.position.count,firstIndex=host.index.count,cap=torsoRingCap(host,nu,0,false);
  const out=mergeGeometries([host,cap],false);
  out.userData={...host.userData,sculptureTorsoBase:{nu,hostFirstVertex:0,firstVertex,firstIndex}};
  host.dispose();cap.dispose();return out;
}
function curve(points) { return new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)), false, 'centripetal'); }
function tube(points, radius, segments = 36, radial = 8) {
  return new T.TubeGeometry(curve(points), segments, radius, radial, false);
}
// Seal the exposed cut ends of existing thin cast rims/cloth cords. Append
// exact endpoint fans without moving any old sample or smoothing its normals.
// This is a topology repair, not a longer rim, extra bead or new decoration.
function closeExposedTubeEnds(g) {
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,ix=g.index;
  const nu=g.parameters.radialSegments,nv=g.parameters.tubularSegments,positions=[],uvs=[],ids=[];
  for(const row of [0,nv]){
    const offset=positions.length/3,center=new T.Vector3(),neighbor=new T.Vector3(),near=row===0?1:nv-1;
    for(let i=0;i<nu;i++){
      center.add(new T.Vector3().fromBufferAttribute(p,row*(nu+1)+i));
      neighbor.add(new T.Vector3().fromBufferAttribute(p,near*(nu+1)+i));
    }
    center.divideScalar(nu);neighbor.divideScalar(nu);
    const outward=center.clone().sub(neighbor).normalize();
    for(let i=0;i<=nu;i++){
      const q=new T.Vector3().fromBufferAttribute(p,row*(nu+1)+i);
      positions.push(...q.toArray());uvs.push(.5+.5*Math.cos(i/nu*TAU),.5+.5*Math.sin(i/nu*TAU));
    }
    positions.push(...center.toArray());uvs.push(.5,.5);const pole=offset+nu+1;
    for(let i=0;i<nu;i++){
      const a=new T.Vector3().fromArray(positions,(offset+i)*3).sub(center),b=new T.Vector3().fromArray(positions,(offset+i+1)*3).sub(center);
      if(a.cross(b).dot(outward)>0)ids.push(pole,offset+i,offset+i+1);else ids.push(pole,offset+i+1,offset+i);
    }
  }
  const ends=new T.BufferGeometry();ends.setAttribute('position',new T.Float32BufferAttribute(positions,3));ends.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));ends.setIndex(ids);ends.computeVertexNormals();
  const en=ends.attributes.normal;
  for(const offset of [0,nu+2]){
    const average=new T.Vector3().fromBufferAttribute(en,offset).add(new T.Vector3().fromBufferAttribute(en,offset+nu)).normalize();
    en.setXYZ(offset,...average.toArray());en.setXYZ(offset+nu,...average.toArray());
  }
  const append=(a,b)=>{const out=new Float32Array(a.length+b.length);out.set(a);out.set(b,a.length);return out;};
  g.setAttribute('position',new T.BufferAttribute(append(p.array,ends.attributes.position.array),3));
  g.setAttribute('normal',new T.BufferAttribute(append(n.array,en.array),3));
  g.setAttribute('uv',new T.BufferAttribute(append(uv.array,ends.attributes.uv.array),2));
  g.setIndex([...ix.array,...ids.map(i=>i+p.count)]);
  g.userData.sculptureTubeEndCaps={firstVertex:p.count,firstIndex:ix.count,nu,nv};
  ends.dispose();return g;
}
// Anatomical/sleeve sweep with elliptical sections, a taper and non-periodic
// compression wrinkles. Unlike the old blobs it follows the actual arm axis.
function swept(points, width, depth, {segments = 70, radial = 32, taper = null, wrinkle = null, vertical = false, sampleT = null, protectInnerBend = false} = {}) {
  const c = curve(points), frames = c.computeFrenetFrames(segments, false),length=c.getLength();
  const centers=protectInnerBend?Array.from({length:segments+1},(_,i)=>c.getPointAt(i/segments)):null;
  const g=surface(radial, segments, (u, sample) => {
    const v=sampleT?sampleT(sample):sample;
    const a = u * TAU, k = Math.min(segments, Math.round(v * segments));
    const p = c.getPointAt(v); let n = frames.normals[k], b = frames.binormals[k];
    // Finger cap samples are nonuniform. A nearest-frame lookup gives abrupt
    // cross-section twists and folded triangles at tight bends. Interpolate
    // the transported frame and re-orthogonalize it to the actual tangent.
    if(sampleT&&!vertical){
      const q=Math.min(segments-1,Math.floor(v*segments)),f=v*segments-q,t=c.getTangentAt(v);
      n=frames.normals[q].clone().lerp(frames.normals[q+1],f);
      n.addScaledVector(t,-n.dot(t)).normalize();b=new T.Vector3().crossVectors(t,n).normalize();
    }
    if(vertical){const t=c.getTangentAt(v);n=new T.Vector3().crossVectors(new T.Vector3(0,1,0),t).normalize();b=new T.Vector3().crossVectors(t,n).normalize();}
    let s = taper ? taper(v) : Math.pow(Math.sin(Math.PI * v), .32);
    const relief = wrinkle ? wrinkle(v, a) : 0;
    if(protectInnerBend){
      const offset=n.clone().multiplyScalar(Math.cos(a)*(width*s+relief)).addScaledVector(b,Math.sin(a)*(depth*s+relief*.65));
      // An ellipse swept around a tight elbow/knee can exceed the osculating
      // radius and literally fold through itself. Limit only its inward
      // component; preserve the outer bend, centerline and attachment ends.
      const t0=Math.max(0,v-.0015),t1=Math.min(1,v+.0015),kv=c.getTangentAt(t1).sub(c.getTangentAt(t0)).divideScalar((t1-t0)*length),curvature=kv.length();
      if(curvature>1e-8){
        kv.divideScalar(curvature);const inward=offset.dot(kv);
        if(inward>0){
          const limited=inward/Math.pow(1+(inward*curvature/.70)**8,1/8),blend=smooth(v,.12,.30)*(1-smooth(v,.85,.97));
          offset.addScaledVector(kv,-(inward-limited)*blend);
        }
      }
      // Local curvature alone does not prevent the returning forearm/shin
      // from overlapping an earlier section. Respect the nonlocal medial
      // bisectors as well, without reducing the outside half of the bend.
      const radius=offset.length(),dir=offset.clone().divideScalar(radius||1);let reach=Infinity;
      for(let j=0;j<=segments;j++)if(Math.abs(j-k)>4){
        const delta=centers[j].clone().sub(p),toward=dir.dot(delta);
        if(toward>1e-10)reach=Math.min(reach,delta.lengthSq()/(2*toward));
      }
      const cap=.82*reach,start=.65*cap;
      if(radius>start){
        const limited=cap-(cap-start)*Math.exp(-(radius-start)/(cap-start)),blend=smooth(v,.12,.30)*(1-smooth(v,.85,.97));
        offset.multiplyScalar(1-(1-limited/radius)*blend);
      }
      p.add(offset);
    }else{
      p.addScaledVector(n,Math.cos(a)*(width*s+relief));
      p.addScaledVector(b,Math.sin(a)*(depth*s+relief*.65));
    }
    return p.toArray();
  }, true);
  if(protectInnerBend){g.userData.sculptureAngleNormals=true;recomputeSculptureNormals(g);}
  return g;
}
// A visible garment opening needs a thin fabric return, not an unbounded
// one-sided tube. Keep its original outer lip and the bare limb unchanged;
// recess the return inside the cuff and anchor its center in the actual limb.
function closeSleeveCuff(g, attachmentCenter=null) {
  const {nu,nv}=g.userData.sculptureGrid,p=g.attributes.position,center=new T.Vector3(),previous=new T.Vector3();
  for(let i=0;i<nu;i++){
    center.add(new T.Vector3().fromBufferAttribute(p,nv*(nu+1)+i));
    previous.add(new T.Vector3().fromBufferAttribute(p,(nv-1)*(nu+1)+i));
  }
  center.divideScalar(nu);previous.divideScalar(nu);
  const tangent=center.clone().sub(previous).normalize(),positions=[],uv=[],ids=[];
  for(let row=0;row<2;row++)for(let i=0;i<=nu;i++){
    const q=new T.Vector3().fromBufferAttribute(p,nv*(nu+1)+i);
    if(row)q.sub(center).multiplyScalar(.86).add(center).addScaledVector(tangent,-.009);
    positions.push(...q.toArray());uv.push(i/nu,row);
  }
  positions.push(...(attachmentCenter||center.clone().addScaledVector(tangent,-.005)).toArray());uv.push(.5,1);
  const pole=2*(nu+1);
  for(let i=0;i<nu;i++){
    const a=i,b=i+1,c=nu+1+i,d=c+1;
    ids.push(a,b,c,b,d,c,c,d,pole);
  }
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(positions,3));cap.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cap.setIndex(ids);cap.computeVertexNormals();
  for(let row=0;row<2;row++){
    const a=row*(nu+1),b=a+nu,n=cap.attributes.normal,v=new T.Vector3().fromBufferAttribute(n,a).add(new T.Vector3().fromBufferAttribute(n,b)).normalize();n.setXYZ(a,v.x,v.y,v.z);n.setXYZ(b,v.x,v.y,v.z);
  }
  const out=mergeGeometries([g,cap],false);out.userData={...g.userData,sculptureCuff:{firstVertex:p.count,nu,nv}};g.dispose();cap.dispose();return out;
}
function sampleProfile(rows, y) {
  let k = 0; while (k < rows.length - 2 && y > rows[k + 1][0]) k++;
  const a = rows[k], b = rows[k + 1], p = rows[Math.max(0,k-1)], q = rows[Math.min(rows.length-1,k+2)];
  const t = clamp((y-a[0])/(b[0]-a[0]),0,1), h=b[0]-a[0];
  return a.slice(1).map((v,i)=>{const n=i+1, m0=(b[n]-p[n])/(b[0]-p[0]), m1=(q[n]-a[n])/(q[0]-a[0]);return (2*t*t*t-3*t*t+1)*v+(t*t*t-2*t*t+t)*h*m0+(-2*t*t*t+3*t*t)*b[n]+(t*t*t-t*t)*h*m1;});
}
const TORSO_PROFILE=[[2.00,.42,.23,.06],[2.17,.67,.39,.04],[2.42,.59,.41,.015],[2.78,.56,.39,-.005],[3.12,.62,.37,-.02],[3.38,.68,.325,-.035],[3.52,.52,.27,-.035],[3.66,.225,.205,-.035],[3.84,.208,.160,-.035]];
function clothFrontZ(x,y){const [rx,rz,cz]=sampleProfile(TORSO_PROFILE,y);return cz+rz*Math.sqrt(Math.max(.01,1-(x/rx)**2))+.014;}
// Original reference6 has independent left/right drape basins separated by
// the narrow central garment spine. These source-coordinate traces come from
// approximate crease centers in the original photo, not a rendered frame.
const CENTRAL_CLOTH_CREASES=[
  [[-0.345768,3.092863],[-0.254847,3.102805],[-0.165027,3.145467],[-0.075073,3.175518]],
  [[-0.360103,3.020831],[-0.254107,3.016668],[-0.164447,3.049893],[-0.074714,3.090447]],
  [[-0.359439,2.945879],[-0.253796,2.944349],[-0.163879,2.969914],[-0.074463,3.001906]],
  [[-0.404529,2.87784],[-0.297989,2.831488],[-0.178223,2.865229],[-0.074391,2.930348]],
  [[-0.481815,2.827223],[-0.372261,2.723013],[-0.266497,2.688149],[-0.162652,2.730233],[-0.07412,2.822457]],
  [[-0.496548,2.741307],[-0.385907,2.61461],[-0.280332,2.578791],[-0.176934,2.624093],[-0.073861,2.714543]],
  [[-0.478828,2.634913],[-0.369488,2.512731],[-0.264838,2.49487],[-0.161349,2.519218],[-0.073537,2.590137]],
  [[0.044894,3.106383],[0.11952,3.068677],[0.194767,3.090125],[0.255803,3.173899]],
  [[0.044716,3.016413],[0.119204,2.98179],[0.209103,3.024561],[0.270272,3.119199]],
  [[0.059432,2.924798],[0.133774,2.891769],[0.208548,2.935328],[0.269458,3.022652]],
  [[0.059196,2.815554],[0.133416,2.79903],[0.208208,2.859109],[0.268668,2.954893]],
  [[0.059053,2.723919],[0.132936,2.69056],[0.222375,2.752448],[0.298284,2.870753]],
  [[0.073529,2.613622],[0.161975,2.594901],[0.251573,2.6744],[0.327571,2.781745]],
  [[0.073393,2.534159],[0.176239,2.524235],[0.280565,2.594147],[0.341642,2.68943]]
];
function torsoFoldRelief(x,y) {
  let folds = 0;
  // Each short nested fold belongs to its own hanging cloth panel. A single
  // family of full-width U arcs incorrectly joined both sides into ribs.
  for(let j=0;j<CENTRAL_CLOTH_CREASES.length;j++){
    const rows=CENTRAL_CLOTH_CREASES[j],lo=rows[0][0],hi=rows[rows.length-1][0];
    const mask=smooth(x,lo-.055,lo+.012)*(1-smooth(x,hi-.005,hi+.075));
    if(mask===0)continue;
    const first=rows[0],second=rows[1],last=rows[rows.length-1],penultimate=rows[rows.length-2];
    const h=x<lo?first[1]+(x-lo)*(second[1]-first[1])/(second[0]-lo):x>hi?last[1]+(x-hi)*(last[1]-penultimate[1])/(hi-penultimate[0]):sampleProfile(rows,x)[0];
    const amplitude=.015+.003*Math.sin((j%7)*1.37+.4),width=.030+.004*Math.sin((j%7)*.92+.2);
    folds+=mask*(amplitude*gaussian(y-h,width)-.004*gaussian(y-h+.043,.023));
  }
  const spine=.025+.108*(y-3.07),spineMask=smooth(y,2.30,2.48)*(1-smooth(y,3.19,3.30));
  folds+=spineMask*(.012*gaussian(x-spine,.035)-.003*gaussian(x-spine-.048,.019));
  // Narrow vertical border falls from the figure's covered left shoulder.
  const edge = .41 - .045 * (3.5 - y) + .025 * Math.sin(y * 3);
  folds += .018 * gaussian(x - edge, .032) * smooth(y, 2.15, 2.5) * (1 - smooth(y, 3.45, 3.57));
  folds -= .010 * gaussian(x - edge - .047, .018) * (1 - smooth(y, 3.40, 3.6));
  const leftBorder=-.29-.16*Math.sin(clamp((3.6-y)/1.4,0,1)*Math.PI/2);
  const borderMask=smooth(y,2.12,2.38)*(1-smooth(y,3.55,3.64));
  folds+=borderMask*(.018*gaussian(x-leftBorder,.030)+.009*gaussian(x-leftBorder+.052,.020)-.006*gaussian(x-leftBorder+.028,.011));
  if (y > 3.61) folds += .004 * Math.cos((y - 3.62) * 110) * (1 - smooth(y, 3.76, 3.82));
  return folds;
}
function torsoFrontSurfaceZ(x,y) {
  const [rx,rz,cz]=sampleProfile(TORSO_PROFILE,y),front=Math.sqrt(Math.max(0,1-(x/rx)**2));
  return cz+rz*front+torsoFoldRelief(x,y)*front**3;
}
function torso() {
  const rows = TORSO_PROFILE;
  return surface(160, 180, (u, v) => {
    const y = 2 + 1.84 * v, a = u * TAU, [rx, rz, cz] = sampleProfile(rows, y);
    const x = Math.sin(a) * rx, front = Math.max(0, Math.cos(a));
    let z = cz + Math.cos(a) * rz;
    const folds = torsoFoldRelief(x,y);
    z += folds * front ** 3;
    return [x, y, z];
  }, true);
}
const HEAD_PROFILE=[
      [3.775,0,0,-.040],[3.830,.145,.125,-.035],
      [3.900,.240,.205,-.026],[4.020,.310,.267,-.018],
      [4.120,.350,.286,-.018],[4.260,.390,.298,-.018],
      [4.390,.369,.279,-.022],[4.500,.325,.252,-.026],
      [4.600,.180,.170,-.030],[4.655,0,0,-.030]
    ];
// Spend the head's samples on the narrow closed eyelids, nostril recesses
// and lips, rather than undersampling them and compensating with deeper cuts.
// The analytical face deformation below is unchanged.
const headSampleCache=new Map();
function weightedSamples(count,limit,weight) {
  const bins=4096,cdf=new Float64Array(bins+1),step=limit/bins;let previous=weight(0);
  for(let i=1;i<=bins;i++){const w=weight(i*step);cdf[i]=cdf[i-1]+(previous+w)*step*.5;previous=w;}
  const out=[];
  for(let i=0;i<=count;i++){
    if(i===0){out.push(0);continue;}if(i===count){out.push(limit);continue;}
    const target=cdf[bins]*i/count;let lo=0,hi=bins;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(cdf[mid]<target)lo=mid;else hi=mid;}
    out.push((lo+(target-cdf[lo])/(cdf[hi]-cdf[lo]))*step);
  }
  return out;
}
function sampledHeadSphere(attendant) {
  let samples=headSampleCache.get(attendant);
  if(!samples){
    const basePhi=weightedSamples(144,TAU,a=>.40+1.60*Math.max(0,Math.sin(a))**2),phi=[];
    // The flattened facial profile changes depth rapidly beside the two
    // lateral seams. Retain every original angular sample and refine only
    // the four front intervals next to each side; do not alter the face's
    // analytical shape, core feature samples or any back-head sample.
    for(let i=0;i<144;i++){
      const edge=i<4?i:i>=104&&i<108?107-i:-1,steps=edge>=0?[8,4,3,2][edge]:1;
      for(let j=0;j<steps;j++)phi.push(basePhi[i]+(basePhi[i+1]-basePhi[i])*j/steps);
    }
    phi.push(basePhi[144]);
    const levels=attendant?[[4.318,.030,6],[4.034,.022,5],[4.120,.035,3],[4.415,.030,2]]:[[4.245,.030,6],[3.984,.022,5],[4.060,.035,3],[4.350,.030,2]];
    const baseTheta=weightedSamples(144,Math.PI,a=>{const y=4.215+.440*Math.cos(a);let w=1;for(const[c,width,gain]of levels)w+=gain*gaussian(y-c,width);return w;}),theta=[];
    // Resolve existing narrow facial relief without deepening it. Every old
    // latitude remains; only feature-adjacent intervals gain a midpoint.
    const bands=attendant?[[3.985,4.085],[4.100,4.137],[4.303,4.330],[4.390,4.435]]:[[3.965,4.007],[4.020,4.055],[4.232,4.258],[4.317,4.374]];
    for(let i=0;i<144;i++){
      theta.push(baseTheta[i]);const high=4.215+.440*Math.cos(baseTheta[i]),low=4.215+.440*Math.cos(baseTheta[i+1]);
      if(bands.some(([a,b])=>high>=a&&low<=b))theta.push((baseTheta[i]+baseTheta[i+1])*.5);
    }
    theta.push(baseTheta[144]);
    samples={phi,theta};headSampleCache.set(attendant,samples);
  }
  const nu=samples.phi.length-1,nv=samples.theta.length-1,g=new T.SphereGeometry(1,nu,nv),p=g.attributes.position,uv=g.attributes.uv;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const phi=samples.phi[i],theta=samples.theta[j],sn=Math.sin(theta),k=j*(nu+1)+i;
    const cp=Math.cos(phi),sp=Math.sin(phi);
    p.setXYZ(k,-(Math.abs(cp)<1e-10?0:cp)*sn,Math.cos(theta),(Math.abs(sp)<1e-10?0:sp)*sn);
    const poleOffset=j===0?.5/nu:j===nv?-.5/nu:0;
    uv.setXY(k,phi/TAU+poleOffset,1-theta/Math.PI);
  }
  return g;
}
function head(attendant=false) {
  const g = sampledHeadSphere(attendant), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const nx = p.getX(i), ny = p.getY(i), nz = p.getZ(i);
    const y = 4.215 + ny * .440;
    // Temple, cheek, jaw and chin are separate anatomical levels. A spherical
    // base made the lower cheeks balloon even when their local relief shrank.
    const [rx,rz,cz]=sampleProfile(HEAD_PROFILE,y);
    const h=Math.sqrt(Math.max(0,1-ny*ny)),qx=h>1e-6?nx/h:0,qz=h>1e-6?nz/h:0;
    const x=qx*Math.max(0,rx);
    let z=cz+Math.max(0,rz)*qz;
    if(nz>0){const flat=Math.pow(Math.max(0,1-Math.abs(qx)**4),.25);z=cz+Math.max(0,rz)*T.MathUtils.lerp(qz,flat,.78);}
    const fy=y-(attendant?.05:0);
    const G = (cx, cy, sx, sy) => gaussian(x - cx, sx) * gaussian(fy - cy, sy);
    if (nz > 0) {
      let r = -.012 * G(-.205,4.12,.14,.16) - .012 * G(.205,4.12,.14,.16);
      // Locate central features on the real projected surface, not at an
      // assumed front Z: the original closed-eye line is Y370, nose apex Y377.
      // Attendant facial landmarks already fit their independent reference.
      const noseDrop=attendant?0:.030;
      r += .045 * G(0,4.24-noseDrop*.35,.043,.16) + .065 * G(0,4.105-noseDrop,.052,.049);
      r += .018 * G(-.058,4.079-noseDrop,.030,.027) + .018 * G(.058,4.079-noseDrop,.030,.027);
      r -= .012 * G(-.044,4.068-noseDrop,.014,.010) + .012 * G(.044,4.068-noseDrop,.014,.010);
      // The columella separates two small nostril recesses; the old smooth
      // bulb underside reflected as one large dark triangle.
      r += .018 * G(0,4.063-noseDrop,.018,.025);
      r -= .012 * G(0,4.031-noseDrop*.35,.020,.027);
      for (const side of [-1, 1]) {
        const ex = side * x, arch = Math.max(0,1-((ex-.187)/.112)**2);
        const eyeDrop=attendant?0:.022;
        const eyelid = 4.256-eyeDrop + .016 * arch + .016 * (ex-.15);
        const brow = 4.335-(attendant?0:.011) + .036 * arch;
        const mask = smooth(ex,.075,.105)*(1-smooth(ex,.285,.315));
        r -= .023 * G(side*.187,4.284-eyeDrop,.108,.055);
        r += mask * (.021*gaussian(fy-brow,.020)+.014*gaussian(fy-eyelid-.010,.013));
        r -= mask * .013*gaussian(fy-eyelid,.006);
        r += mask * .009*gaussian(fy-eyelid+.019,.014);
      }
      if(attendant){
        // The reference attendants have a small oval oral recess framed by
        // distinct upper/lower lips, unlike the central figure's closed line.
        const mouth=3.984-.006*(x/.095)**2;
        r-=.032*gaussian(x,.068)*gaussian(fy-mouth,.026);
        r+=.014*(gaussian(x-.025,.035)+gaussian(x+.025,.035))*gaussian(fy-mouth-.032,.011);
        r+=.017*gaussian(x,.074)*gaussian(fy-mouth+.035,.014);
        r-=.004*(gaussian(x-.084,.015)+gaussian(x+.084,.015))*gaussian(fy-mouth,.024);
      }else{
        const mouth = 3.984 - .002*(x/.105)**2;
        const ml = gaussian(x,.092);
        r += .009*(gaussian(x-.031,.035)+gaussian(x+.031,.035))*gaussian(fy-mouth-.012,.010);
        r += .013*gaussian(x,.074)*gaussian(fy-mouth+.013,.013);
        r -= ml*.008*gaussian(fy-mouth,.0045);
      }
      r += .018 * G(0,3.889,.146,.065);
      z += r * nz ** .45;
    }
    p.setXYZ(i,x,y,z);
  }
  recomputeSculptureNormals(g); return g;
}
function ear(side,central=false) {
  // Central lower lobes turn outward and finish at the chin level in the
  // reference. The upper attachment and attendant ear shapes remain fixed.
  // A lobed outline, open concha and elongated lower lobe, not a detached ball.
  return surface(48,70,(u,v)=>{
    const lobe=central?1-smooth(v,0,.40):0;
    const a=u*TAU,y=3.80+v*.65+.075*lobe, taper=(v===0||v===1)?0:Math.pow(Math.sin(Math.PI*v),.38);
    const width=(.028+.026*Math.sin(Math.PI*v)+.017*gaussian(v-.15,.17))*taper;
    const cx=side*(.375+.050*Math.sin(v*Math.PI)+.080*lobe);
    const x=cx+Math.sin(a)*width;
    let z=-.004+Math.cos(a)*(.050+.020*Math.sin(Math.PI*v))*taper;
    if(Math.cos(a)>0) z-=.043*gaussian(v-.56,.27)*Math.cos(a)**4*taper;
    return [x,y,z];
  },true);
}
function finger(points,r=.024) {
  // The old .09-radius end stayed open and tapered almost to a needle.
  // A short elliptical cap now closes at the actual anatomical fingertip;
  // its axial extent follows finger length rather than one shared percentage.
  const centerline=curve(points),length=centerline.getLength(),capStart=clamp(1-r*.85/length,.55,.94);
  return swept(points,r,r*.90,{segments:36,radial:16,protectInnerBend:points.length>3,sampleT:v=>v<.74?v/.74*capStart:capStart+(v-.74)/.26*(1-capStart),taper:t=>{
    const shaft=.84+.10*Math.sin(Math.PI*t)-.08*t,q=clamp((t-capStart)/(1-capStart),0,1);
    const radius=shaft*Math.sqrt(Math.max(0,1-q*q));
    const t0=Math.max(0,t-.002),t1=Math.min(1,t+.002);
    const curvature=centerline.getTangentAt(t0).distanceTo(centerline.getTangentAt(t1))/((t1-t0)*length);
    // Keep a soft, positive inner bend rather than folding a tube through
    // itself at the curled index and cupped distal phalanges.
    const bend=radius*r*curvature/.64;
    return radius/Math.pow(1+bend**8,1/8);
  }});
}
function palm(raised=true) {
  const g = new T.SphereGeometry(1,40,30),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i);
    if(raised){
      const y=3.105+ny*.162,x=-.595+nx*.105*(.88+.12*ny),z=.555+nz*.050;
      p.setXYZ(i,x,y,z+.007*Math.sin(ny*6)*Math.max(0,nz));
    }else p.setXYZ(i,.095+nx*.205,2.297+ny*.046,.645+nz*.111);
  }
  recomputeSculptureNormals(g);return g;
}
function remapSculptureY(g, mapY) {
  const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,mapY(p.getY(i)));recomputeSculptureNormals(g);return g;
}
const TORSO_LIFT_PROFILE=[[2,0],[2.35,.02],[2.78,.10],[3.12,.20],[3.38,.36],[3.52,.32],[3.66,.28],[3.84,.25]];
function liftedTorsoY(y){return y+sampleProfile(TORSO_LIFT_PROFILE,y)[0];}
// Close the omitted seated pelvis between the open lower torso and the
// crossing thigh roots. It stays behind the existing lap/short cloth and
// reaches the unchanged physical seat, rather than enlarging either knee.
// Close the crossed-thigh inner section before joining it to the seated
// pelvis. The old open ring is only partly inside the waist; keeping it open
// would leave a slit under the overlapping feet/cloth. Existing samples stay.
function closeCrossedThighRoot(g) {
  const {nu}=g.userData.sculptureGrid,p=g.attributes.position,positions=[],uv=[],ids=[],center=new T.Vector3();
  for(let i=0;i<nu;i++)center.add(new T.Vector3().fromBufferAttribute(p,i));center.divideScalar(nu);
  for(let i=0;i<=nu;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));uv.push(i/nu,0);}
  positions.push(...center.toArray());uv.push(.5,1);const pole=nu+1;
  for(let i=0;i<nu;i++)ids.push(i+1,i,pole);
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(positions,3));cap.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cap.setIndex(ids);cap.computeVertexNormals();
  const out=mergeGeometries([g,cap],false);out.userData={...g.userData,sculptureRootCap:{firstVertex:p.count,nu}};g.dispose();cap.dispose();return out;
}
function seatedTorso() {
  const upper=remapSculptureY(torso(),liftedTorsoY),nu=160,nv=40;
  const rows=[[1.65,.30,.20,.12],[1.72,.43,.29,.14],[1.84,.50,.36,.15],[1.92,.44,.33,.11],[1.96,.38,.25,.08],[2,.42,.23,.06]];
  const topDerivative=TORSO_PROFILE[0].slice(1).map((value,k)=>(TORSO_PROFILE[1][k+1]-value)/(TORSO_PROFILE[1][0]-2)/((liftedTorsoY(2.00001)-liftedTorsoY(2))/.00001));
  function profile(y){
    if(y<1.96)return sampleProfile(rows,y);
    const a=rows[4],b=rows[5],p=rows[3],t=(y-1.96)/.04;
    return a.slice(1).map((value,k)=>{const m0=(b[k+1]-p[k+1])/(b[0]-p[0]),m1=topDerivative[k];return(2*t*t*t-3*t*t+1)*value+(t*t*t-2*t*t+t)*.04*m0+(-2*t*t*t+3*t*t)*b[k+1]+(t*t*t-t*t)*.04*m1;});
  }
  const lower=surface(nu,nv,(u,v)=>{
    const a=u*TAU;
    if(v<=.10){const r=Math.sin(v/.10*Math.PI/2);return[Math.sin(a)*.30*r,1.65,.12+Math.cos(a)*.20*r];}
    const y=1.65+(v-.10)/.90*.35,[rx,rz,cz]=profile(y);
    return[Math.sin(a)*rx,y,cz+Math.cos(a)*rz];
  },true);
  // Same physical top ring as the original torso. Average normals only on
  // this joined ring; all pre-existing torso points stay exactly in place.
  const up=upper.attributes.position,lp=lower.attributes.position,un=upper.attributes.normal,ln=lower.attributes.normal;
  for(let i=0;i<=nu;i++){
    const j=nv*(nu+1)+i;lp.setXYZ(j,up.getX(i),up.getY(i),up.getZ(i));
    const n=new T.Vector3().fromBufferAttribute(un,i).add(new T.Vector3().fromBufferAttribute(ln,j)).normalize();un.setXYZ(i,n.x,n.y,n.z);ln.setXYZ(j,n.x,n.y,n.z);
  }
  const out=mergeGeometries([upper,lower],false);out.userData.sculpturePelvis={firstVertex:up.count,nu,nv,seatY:1.65};upper.dispose();lower.dispose();return out;
}
// The two visible knee cloth panels have independent shallow fold arcs.
// Their reference readings exclude foot bars, the obscured central lap and
// the lowest lotus edge. They are not three mirrored rings around each knee.
const CENTRAL_KNEE_CREASES=[[[[-1.053067,2.063563],[-0.8357,1.96318],[-0.643776,1.935733]],[[-1.003414,1.923164],[-0.834153,1.862469],[-0.628229,1.844094],[-0.453521,1.895724]],[[-0.948085,1.841445],[-0.766999,1.788808],[-0.561876,1.777717],[-0.385772,1.838744]]],[[[0.496481,1.963441],[0.711758,1.919538],[0.877606,1.980273]],[[0.520023,1.852106],[0.738272,1.835003],[0.917775,1.895963]],[[0.399103,1.84772],[0.588971,1.775647],[0.781317,1.778575],[0.962281,1.843317]]]];
function fitKneeClothCreases(g,side) {
  const {nu,nv}=g.userData.sculptureGrid,p=g.attributes.position,creases=CENTRAL_KNEE_CREASES[side<0?0:1];
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const v=j/nv,a=i/nu*TAU,sn=Math.sin(a),cs=Math.cos(a),k=j*(nu+1)+i;
    if(sn<=0)continue;
    const x=p.getX(k),y=p.getY(k),z=p.getZ(k);
    // Protect the actual foot-bearing back, lowest seat contacts, knee tips
    // and closed inner root. This changes only confirmed front cloth relief.
    const front=smooth(z,.80,.90)*smooth(y,1.69,1.75)*(1-smooth(Math.abs(x),1.10,1.18));
    if(front===0)continue;
    const section=(.60+.40*smooth(v,0,.50))*Math.sqrt(Math.max(0,1-v**8));
    const rawY=1.88+.095*smooth(v,.35,.90)+cs*(.170+.090*smooth(v,.15,.70))*section;
    let old=0;for(let q=0;q<3;q++){
      const fold=2.040-q*.085+.32*(v-.50)**2+.030*v+.010*Math.sin(q*1.8);
      old+=(.015+.004*Math.sin(q+1))*gaussian(rawY-fold,.027)-.005*gaussian(rawY-fold+.041,.021);
    }
    old*=sn**2*smooth(v,.05,.18)*(1-smooth(v,.87,1));
    let next=0;
    for(let q=0;q<creases.length;q++){
      const rows=creases[q],lo=rows[0][0],hi=rows[rows.length-1][0];
      if(x<=lo||x>=hi)continue;
      const center=sampleProfile(rows,x)[0],edge=smooth(x,lo,lo+.075)*(1-smooth(x,hi-.075,hi));
      const width=q===0?.030:.027,amplitude=q===0?.013:q===1?.017:.014;
      next+=edge*(amplitude*gaussian(y-center,width)-amplitude*.24*gaussian(y-center+.042,width*.75));
    }
    next*=sn**2;
    p.setZ(k,z+front*(next-old));
  }
  recomputeSculptureNormals(g);return g;
}
// The visible short cloth is retained, including its existing thin upper
// fold. A small closed return under that edge joins its actual back to the
// actual waist, descending beneath the crossed feet. Both ends overlap their hosts; no whole-cloth shift, long
// invented banner, or new visible ornament is introduced.
function attachShortClothReturn(g,host) {
  const nu=64,nv=16,mat=new T.MeshBasicMaterial({side:T.DoubleSide}),cloth=new T.Mesh(g,mat),waist=new T.Mesh(host,mat),ray=new T.Raycaster(),ends=[];
  cloth.updateMatrixWorld();waist.updateMatrixWorld();
  for(let i=0;i<=nu;i++){
    const x=(i/nu*2-1)*.198,y=2.275;
    ray.set(new T.Vector3(x,y,2),new T.Vector3(0,0,-1));const a=ray.intersectObject(cloth)[0];
    ray.set(new T.Vector3(x,y-.008,2),new T.Vector3(0,0,-1));const under=ray.intersectObject(cloth)[0];
    ray.set(new T.Vector3(x,y-.175,2),new T.Vector3(0,0,-1));const b=ray.intersectObject(waist)[0];
    if(!a||!under||!b)throw new Error('Missing short cloth return attachment');
    ends.push({x,y,front:a.point.z-.006,under:under.point.z-.006,back:b.point.z-.010});
  }
  mat.dispose();
  const outer=surface(nu,nv,(u,v)=>{
    const p=ends[Math.round(u*nu)],t=smooth(v,0,.55);
    return[p.x,p.y-.175*t-.012*Math.sin(Math.PI*v),T.MathUtils.lerp(p.front,p.back,v)];
  }),inner=outer.clone(),bp=inner.attributes.position,bi=inner.index;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const k=j*(nu+1)+i,delta=(ends[i].under-ends[i].front)*(1-smooth(j/nv,0,.22));
    bp.setXYZ(k,bp.getX(k),bp.getY(k)-.008,bp.getZ(k)+delta);
  }
  for(let i=0;i<bi.count;i+=3){const b=bi.getX(i+1);bi.setX(i+1,bi.getX(i+2));bi.setX(i+2,b);}inner.computeVertexNormals();
  const perimeter=[];for(let i=0;i<=nu;i++)perimeter.push(i);for(let j=1;j<=nv;j++)perimeter.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)perimeter.push(nv*(nu+1)+i);for(let j=nv-1;j>=1;j--)perimeter.push(j*(nu+1));
  const ep=[],eu=[],ei=[],op=outer.attributes.position;
  for(let k=0;k<perimeter.length;k++){
    const a=perimeter[k],b=perimeter[(k+1)%perimeter.length],q=ep.length/3;
    for(const[attr,id]of[[op,a],[op,b],[bp,a],[bp,b]])ep.push(attr.getX(id),attr.getY(id),attr.getZ(id));
    eu.push(0,0,1,0,0,1,1,1);ei.push(q,q+2,q+1,q+1,q+2,q+3);
  }
  const edge=new T.BufferGeometry();edge.setAttribute('position',new T.Float32BufferAttribute(ep,3));edge.setAttribute('uv',new T.Float32BufferAttribute(eu,2));edge.setIndex(ei);edge.computeVertexNormals();
  const out=mergeGeometries([g,outer,inner,edge],false);out.userData.sculptureShortClothReturn={firstVertex:g.attributes.position.count,nu,nv,outerFirst:g.attributes.position.count,innerFirst:g.attributes.position.count+op.count};
  for(const geo of[g,outer,inner,edge])geo.dispose();return out;
}
// Reference 6 shows one broad, curled dark cap above the fine forehead
// crown, not a narrow spherical bun stacked on a shallow hair hemisphere.
// These source rows preserve the forehead seat and remain independent of
// the unchanged head, gold finial and unit conversion.
const CENTRAL_HAIR_Y_SCALE=.6765/.7643; // Keep physical crownTop, not the old narrow bun.
const CENTRAL_HAIR_PROFILE=[
  [4.65,0,0],[4.70,.24,.19],[4.75,.34,.29],
  [4.95,.43,.32],[5.14,.43,.31],[5.28,.36,.265],
  [5.40,.25,.19],[5.48,.12,.10],[5.50,0,0]
];
function centralHairCap(){
  return surface(96,80,(u,v)=>{
    const y=4.65+.85*v,[rx,rz]=sampleProfile(CENTRAL_HAIR_PROFILE,y),a=u*TAU;
    return[Math.sin(a)*Math.max(0,rx)*.95,4.75+(y-4.75)*CENTRAL_HAIR_Y_SCALE,-.025+Math.cos(a)*Math.max(0,rz)];
  },true);
}
// Independent lower-sleeve fans read from the original photograph. The
// smooth external rolled edge and hand/wrist attachment are separate shapes.
const CENTRAL_SLEEVE_FANS=[[[[2.554109,-1.05683],[2.655953,-0.969135],[2.766197,-0.909636],[2.878058,-0.867691]],[[2.512327,-0.983668],[2.613578,-0.89581],[2.733135,-0.820844],[2.841924,-0.790675]],[[2.522435,-0.900319],[2.587939,-0.822899],[2.694473,-0.762869],[2.788775,-0.715945]]],[[[2.505975,0.96171],[2.57704,0.871674],[2.727398,0.805231],[2.900976,0.772691]],[[2.534227,1.044105],[2.55291,0.959695],[2.674396,0.873959],[2.829753,0.837369]],[[2.491523,1.078218],[2.562806,1.03459],[2.667657,0.962854],[2.774337,0.92046]]]];
function sleeveFanRelief(x,y,side){
  let r=0;
  for(let j=0;j<3;j++){
    const rows=CENTRAL_SLEEVE_FANS[side][j],low=rows[0][0],high=rows.at(-1)[0];
    if(y<=low||y>=high)continue;
    const center=sampleProfile(rows,y)[0],fade=smooth(y,low,low+.055)*(1-smooth(y,high-.055,high)),d=x-center;
    r+=fade*([.013,.016,.012][j]*gaussian(d,[.025,.023,.024][j])-.0035*gaussian(d+(side===0?.032:-.032),.020));
  }
  return r;
}
function fitSleeveFan(g,side){
  const p=g.attributes.position;
  for(let k=0;k<p.count;k++){
    const x=p.getX(k),y=p.getY(k),mask=smooth(Math.abs(x),.67,.72)*(1-smooth(Math.abs(x),1.07,1.13));
    // Preserve the thin returning elbow behind Z.20. A broad monotone Z
    // transition carries the reference fans on the front cloth without
    // moving the close hidden return or a normal-gated inner fold.
    p.setZ(k,p.getZ(k)+mask*sleeveFanRelief(x,y,side)*smooth(p.getZ(k),.20,.32));
  }
  recomputeSculptureNormals(g);return g;
}
// The original's readable lower palm edge and cuff lie right/below the
// former hand. Preserve its internal mudra and reconnect only the returning
// forearm; do not turn the ambiguous upper shoulder highlight into a finger.
const CENTRAL_RAISED_HAND_OFFSET=[.11,-.030,0];
function fitRaisedHandSleeve(g){
  const p=g.attributes.position,{nu,nv}=g.userData.sculptureGrid;
  for(let j=0;j<=nv;j++){
    const f=smooth(j/nv,.80,.96);
    for(let i=0;i<=nu;i++){const k=j*(nu+1)+i;p.setX(k,p.getX(k)+CENTRAL_RAISED_HAND_OFFSET[0]*f);p.setY(k,p.getY(k)+CENTRAL_RAISED_HAND_OFFSET[1]*f);}
  }
  recomputeSculptureNormals(g);return g;
}
function buildAsset() {
  const parts={buddha:[],oldgold:[],gold:[]};
  const add=(g,material='buddha')=>parts[material].push(g);
  const addCloth=(g,material='buddha')=>add(remapSculptureY(g,liftedTorsoY),material);
  add(seatedTorso());add(head().translate(0,.25,0));
  add(torsoRingCap(parts.buddha[0],160,180));
  for(const s of [-1,1])add(ear(s,true).translate(0,.25,0));
  // Shoulder/sleeve lines follow the image's low elbows and inward wrists.
  const sleeves=[
    [[-.40,3.74,-.025],[-.70,3.60,.025],[-.93,3.15,.105],[-.94,2.73,.20],[-.76,2.82,.36],[-.60,2.900,.54]],
    [[.40,3.74,-.025],[.70,3.59,.015],[.93,3.15,.10],[.94,2.77,.25],[.86,2.53,.38],[.72,2.37,.53]]
  ];
  for(const [side,ps] of sleeves.entries()){
    const makeSleeve=wrinkle=>swept(ps,.206,.171,{segments:110,radial:48,protectInnerBend:side===0,taper:t=>(.75+.25*Math.sin(Math.PI*t)-.30*smooth(t,.76,1))*(.35+.65*smooth(t,0,.09))*(1+(side===0?.32:.25)*gaussian(t-.72,.17)),wrinkle});
    const wrinkle=(t,a)=>{
    let w=.009*Math.cos(5*a+4*t)*Math.sin(Math.PI*t);for(let j=0;j<3;j++){const at=.47+j*.095+.10*Math.cos(a);w+=(.009*gaussian(t-at,.024)-.003*gaussian(t-at-.032,.018))*Math.max(0,Math.cos(a+.5))**4;}w+=.008*gaussian(t-.73,.19)*Math.cos(7*a+6*t);return w*Math.sin(Math.PI*t);
    };
    const sleeve=makeSleeve(wrinkle);add(closeSleeveCuff(fitSleeveFan(side===0?fitRaisedHandSleeve(sleeve):sleeve,side)));
  }
  // The reference lap is two low, cloth-covered knees, not a swept torus.
  // Each cloth loft has a broad upper thigh and a tapering outer knee. The
  // sagging diagonal folds are part of the continuous front cloth surface.
  for(const side of [-1,1]){
    let g=surface(112,128,(u,v)=>{
      const a=u*TAU,sn=Math.sin(a),cs=Math.cos(a),section=(.60+.40*smooth(v,0,.50))*Math.sqrt(Math.max(0,1-v**8));
      const x=side*(.055+1.235*v),cy=1.88+.095*smooth(v,.35,.90),cz=.605+.075*Math.sin(Math.PI*v);
      const ry=(.170+.090*smooth(v,.15,.70))*section,rz=(.345+.026*Math.sin(Math.PI*v))*section;
      let y=cy+cs*ry,z=cz+sn*rz;
      if(sn>0){
        let f=0;for(let j=0;j<3;j++){
          const fold=2.040-j*.085+.32*(v-.50)**2+.030*v+.010*Math.sin(j*1.8);
          f+=(.015+.004*Math.sin(j+1))*gaussian(y-fold,.027)-.005*gaussian(y-fold+.041,.021);
        }
        z+=f*sn**2*smooth(v,.05,.18)*(1-smooth(v,.87,1));
      }
      // The upper rear thigh carries the crossed foot. It previously sat
      // .08–.21 units below it, leaving a literal air gap under the "foot bar".
      // Lift only the upper/back cloth; the front knee, width and seat stay put.
      const footZ=.53-.08*smooth(v,.25,.75);
      y+=.28*(1-v)*smooth(cs,.20,.65)*gaussian(z-footZ,.17);
      return[x,y,z];
    },true);
    g=closeCrossedThighRoot(g);
    // Match the established physical seat, independently of decorative fabric.
    if(side<0){const index=g.index;for(let i=0;i<index.count;i+=3){const b=index.getX(i+1);index.setX(i+1,index.getX(i+2));index.setX(i+2,b);}recomputeSculptureNormals(g);}
    g.computeBoundingBox();g.translate(0,1.65-g.boundingBox.min.y,0);add(fitKneeClothCreases(g,side));
  }
  // Both upturned feet are visible lying across the opposite upper thigh in
  // reference 6; the former knee-only silhouette omitted this defining pose.
  for(const side of [-1,1]){
    const points=[[.07,2.20,.52],[.12,2.22,.52],[.35,2.25,.53],[.72,2.285,.49],[.98,2.27,.455],[1.03,2.27,.455]].map(p=>[p[0]*side,p[1],p[2]]);
    add(swept(points,.128,.078,{segments:88,radial:32,vertical:true,taper:t=>{
      if(t===0||t===1)return 0;
      const start=t<.075?Math.sqrt(Math.max(0,1-((.075-t)/.075)**2)):1;
      const end=t>.90?Math.sqrt(Math.max(0,1-((t-.90)/.10)**2)):1;
      return(.58+.37*Math.sin(Math.PI*t)+.10*t)*start*end;
    }}));
    for(let i=0;i<5;i++){
      const z=.387+i*.037,len=.145-.012*i,r=.024-.0018*i;
      add(finger([[side*.91,2.275,z],[side*(.99+len*.32),2.285,z+.006],[side*(1.00+len*.60),2.275,z+.009]],r));
    }
  }
  // A continuous cloth tongue overlaps the center seam and lays over the knees.
  add(attachShortClothReturn(solidClothPanel(surface(64,88,(u,v)=>{const q=u*2-1,hem=(1-v)**3*(1-q*q),x=q*(.20+.08*(1-v)+.015*Math.sin(Math.PI*v))+.018*Math.sin(v*Math.PI),y=1.65+v*.65+.15*q*q*(1-v)**2-.20*hem;let z=.76+.36*(1-v)**.70+.017*Math.cos(x*34+v*3.5)*Math.sin(Math.PI*(.18+.82*v))-.025*q*q+.030*hem;z+=.012*gaussian(x+.08-.04*v,.030)-.009*gaussian(x-.07+.02*v,.025);const seatWrap=1-smooth(y,1.70,1.82);z+=seatWrap*.006*Math.log1p(Math.exp((1.134-z)/.006));return[x,y,z];}),64,88),parts.buddha[0]));
  add(palm(true).translate(CENTRAL_RAISED_HAND_OFFSET[0],-.065+CENTRAL_RAISED_HAND_OFFSET[1],0));
  // The low hand lies obliquely in FRONT of the lap cloth. Previously its
  // fingers were behind that cloth and the palm projected ten pixels too high.
  const placeLapHand=g=>g.translate(-.095,-2.297,-.645).rotateZ(.34).translate(.10,2.03,.98);
  add(placeLapHand(palm(false)));
  // Bare wrist/forearm connects the robe cuff to the palm, rather than a second
  // horizontal robe bar crossing behind the front cloth. Both closed ends
  // are seated inside sleeve/palm; the old exposed distal ring barely met it.
  add(swept([[.76,2.42,.47],[.72,2.37,.53],[.58,2.29,.71],[.40,2.16,.87],[.21,2.065,.98]],.075,.068,{segments:80,radial:28,taper:t=>{
    if(t===0||t===1)return 0;
    const root=t<.070?Math.sqrt(Math.max(0,1-((.070-t)/.070)**2)):1;
    const end=t>.88?Math.sqrt(Math.max(0,1-((t-.88)/.12)**2)):1;
    return(.92-.13*t-.39*smooth(t,.62,1))*root*end;
  }}));
  // Proximal finger rings lie within palm flesh; tips/mudra anchors stay fixed.
  // Raised anatomical right hand: slender individually tapering fingers,
  // gently separated, with index and thumb curling into the reference mudra.
  const fingers=[
    [[-.660,3.19,.558],[-.685,3.30,.563],[-.691,3.382,.550]],
    [[-.611,3.215,.565],[-.620,3.354,.570],[-.616,3.445,.552]],
    [[-.566,3.216,.559],[-.566,3.361,.562],[-.555,3.431,.540]],
    [[-.539,3.193,.555],[-.493,3.292,.574],[-.463,3.256,.599],[-.475,3.223,.591]],
    [[-.535,3.065,.558],[-.452,3.139,.602],[-.475,3.223,.591]]
  ];
  fingers.forEach((p,i)=>add(finger(p,i===4?.027:.022).translate(CENTRAL_RAISED_HAND_OFFSET[0],-.065+CENTRAL_RAISED_HAND_OFFSET[1],0)));
  // Palm-up hand lies across the lap, with four individually defined digits.
  for(let i=0;i<4;i++)add(placeLapHand(finger([[.06-i*.024,2.315-(i===3?.010:0),.586+i*.047-(i===3?.018:0)],[-.11,2.325,.59+i*.047],[-.25+.016*i,2.306,.60+i*.043]],.019)));
  add(placeLapHand(finger([[.184,2.307,.578],[.12,2.357,.563],[.03,2.356,.595]],.024)));
  // Do not paint or float presumed palm creases on the hand. The original
  // does not resolve the two former fixed-Z oldgold wires, and most of those
  // tube vertices were outside the palm. Keep the actual palm/fingers intact.
  // The reference's visible lotus chest relief fills the neckline: its petals
  // are carved against the robe, rather than a tiny floating V-shaped jewel.
  // Retain the original petals, center and four small garment rosettes, but
  // seat their shallow backs in the real folded cloth. A fixed smooth-body
  // Z left two complete lotus petals and most necklace sections floating.
  // Only Z changes; original X/Y, sizes, counts and garment motifs stay fixed.
  const seatChestRelief=(g,oldSurfaceZ,offset=.002)=>{
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),relief=p.getZ(i)-oldSurfaceZ(x,y);
      p.setZ(i,torsoFrontSurfaceZ(x,y)+offset+relief);
    }
    recomputeSculptureNormals(g);return g;
  };
  const pendantY=3.030, pendantZ=clothFrontZ(.020,3.100);
  for(let k=0;k<5;k++){
    const a=(k-2)*.46,g=new T.SphereGeometry(1,14,10);
    const px=.020+Math.sin(a)*.120,py=pendantY+Math.cos(a)*.070,cz=clothFrontZ(px,py)+.012;
    g.scale(.022,.090,.010).rotateZ(-a).translate(px,py,cz);
    addCloth(seatChestRelief(g,()=>cz));
  }
  addCloth(seatChestRelief(ellipse(.020,pendantY+.014,pendantZ+.014,.031,.038,.013,24,18),()=>pendantZ+.014));
  for(const side of [-1,1]){
    const points=[];for(let k=0;k<=20;k++){const t=k/20,x=side*(.19*(1-t))+.020*t,y=3.55-.38*Math.sin(t*Math.PI/2);
      const [rx,rz,cz]=sampleProfile(TORSO_PROFILE,y);
      const z=cz+rz*Math.sqrt(Math.max(.01,1-(x/rx)**2))+.008;points.push([x,y,z]);}
    const g=tube(points,.004,40,6),p=g.attributes.position;
    for(let j=0;j<=40;j++){
      // Keep the round cross-section. Both open terminal rings tuck into the
      // supporting cloth instead of becoming tiny detached metal tube holes.
      const center=curve(points).getPointAt(j/40),end=.006*(1-smooth(j,0,3)+smooth(j,37,40));
      for(let i=0;i<=6;i++){
        const k=j*7+i,x=p.getX(k),y=p.getY(k);
        p.setZ(k,torsoFrontSurfaceZ(x,y)+.0008-end+p.getZ(k)-center.z);
      }
    }
    recomputeSculptureNormals(g);addCloth(g);
  }
  for(let row=0;row<4;row++){
    const cy=3.07-row*.148,cx=.025-.016*row,cz=clothFrontZ(cx,cy);
    for(let k=0;k<5;k++){const a=k*TAU/5;addCloth(seatChestRelief(new T.SphereGeometry(1,12,8).scale(.010,.026,.006).rotateZ(-a).translate(cx+Math.sin(a)*.027,cy+Math.cos(a)*.027,cz),()=>cz,.0015));}
    addCloth(seatChestRelief(ellipse(cx,cy,cz,.013,.015,.007,12,8),()=>cz,.0015));
  }
  // The two existing garment strips lie on the actual folded torso, not on
  // an offset smooth ellipsoid. Their .020-thick backs enter the body while
  // the shallow front remains exposed; no detached paper-strip silhouette.
  for(const side of [-1,1]){
    const borderPoint=(t,w=0)=>{
      const y=2.11+1.51*t,cx=side<0?-.46+.24*t**1.8:.46-.20*t*t;
      const rx=sampleProfile(TORSO_PROFILE,y)[0],rawX=cx+w,limit=rx*.990;
      // Smoothly tuck only the extreme neckline corner; a hard clamp would
      // collapse neighboring vertices into zero-area front/edge triangles.
      const x=Math.sign(rawX)*(Math.abs(rawX)-.004*Math.log1p(Math.exp((Math.abs(rawX)-limit)/.004)));
      return[x,y,torsoFrontSurfaceZ(x,y)];
    };
    const borderHeight=u=>.005+.007*Math.cos((u-.5)*Math.PI);
    addCloth(solidClothPanel(surface(14,112,(u,v)=>{
      const width=.065+.030*Math.sin(Math.PI*v),p=borderPoint(v,(u-.5)*width);
      p[2]+=borderHeight(u);return p;
    }),14,112,.020));
    for(const edge of [-1,1]){
      const ps=[];for(let k=0;k<=50;k++){
        const t=k/50,width=.065+.030*Math.sin(Math.PI*t),p=borderPoint(t,edge*width*.48);
        p[2]+=borderHeight(.5+edge*.48)+.001;ps.push(p);
      }add(closeExposedTubeEnds(remapSculptureY(tube(ps,.004,80,6),liftedTorsoY)));
    }
    // Preserve the existing embroidery locations, but seat each petal into
    // the local strip surface rather than leaving its old floating Z plane.
    const placeBorderRelief=g=>{
      const p=g.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),t=clamp((y-2.11)/1.51,0,1),cx=.46-.20*t*t;
        const width=.065+.030*Math.sin(Math.PI*t),u=.5+(x-cx)/width;
        p.setZ(i,p.getZ(i)+torsoFrontSurfaceZ(x,y)+borderHeight(u)+.002);
      }
      recomputeSculptureNormals(g);return g;
    };
    if(side>0)for(let row=0;row<9;row++){
      const t=.13+row*.092,[cx,cy]=borderPoint(t);
      for(let leaf=0;leaf<4;leaf++){
        const a=leaf*Math.PI/2+.30;
        addCloth(placeBorderRelief(new T.SphereGeometry(1,10,8).scale(.007,.016,.004).rotateZ(-a).translate(cx+Math.sin(a)*.016,cy+Math.cos(a)*.018,0)));
      }
      addCloth(placeBorderRelief(ellipse(cx,cy,0,.007,.009,.004,10,8)));
    }
  }
  // Keep the existing curl scale, but distribute the curls over the real
  // broad cap. Its lower rows remain behind the forehead crown; no new
  // crown motif or halo backing is introduced.
  add(centralHairCap(),'oldgold');
  for(let row=0;row<14;row++){
    const y=4.75+row*.056,[rx,rz]=sampleProfile(CENTRAL_HAIR_PROFILE,y),count=Math.max(10,Math.round(TAU*rx/.045));
    for(let i=0;i<count;i++){
      const a=i/count*TAU+(row%2)*Math.PI/count;
      add(ellipse(Math.sin(a)*(rx+.009)*.95,4.75+(y-4.75)*CENTRAL_HAIR_Y_SCALE,-.025+Math.cos(a)*(rz+.0075),.023*.95,.0363*CENTRAL_HAIR_Y_SCALE,.021,12,10),'oldgold');
    }
  }
  const hairSurfaceZ=(x,y)=>{
    const py=4.75+(y-4.75)/CENTRAL_HAIR_Y_SCALE,[rx,rz]=sampleProfile(CENTRAL_HAIR_PROFILE,py),width=rx*.95;
    if(width<=0||Math.abs(x)>width)return undefined;
    return -.025+rz*Math.sqrt(Math.max(0,1-(x/width)**2));
  };
  // The reference's tiny upper gold point is in front of the broad dark cap,
  // not a taller naked stalk above a narrow bun. Keep its separate small
  // silhouette around the original Y327–332 interval, supported by the cap.
  const upperPoint=ellipse(0,5.210,0,.025,.060,.020,24,18),up=upperPoint.attributes.position;
  for(let i=0;i<up.count;i++){
    const z=hairSurfaceZ(up.getX(i),up.getY(i));if(z===undefined)throw new Error('Missing cap behind upper gold point');
    up.setZ(i,z+.014+up.getZ(i));
  }
  recomputeSculptureNormals(upperPoint);add(upperPoint);
  // Anchor the existing small forehead relief in the actual head, not a
  // fixed Z plane that left the whole piece suspended ahead of the skin.
  const foreheadMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),foreheadHost=new T.Mesh(parts.buddha[1],foreheadMaterial);
  foreheadHost.updateMatrixWorld();
  const foreheadHit=new T.Raycaster(new T.Vector3(0,4.655,1),new T.Vector3(0,0,-1)).intersectObject(foreheadHost)[0];
  if(!foreheadHit)throw new Error('Missing forehead support for existing relief');
  add(ellipse(0,4.655,foreheadHit.point.z+.001,.017,.017,.010,20,14),'gold');foreheadMaterial.dispose();
  // Fine gold diadem stands in front of the dark curl cap in reference 6.
  const addDiadem=(g,material='gold',leafAngle=null)=>{
    remapSculptureY(g,y=>4.755+(y-4.505)*1.20);
    if(leafAngle!==null){
      const p=g.attributes.position,cx=Math.sin(leafAngle)*.351,cz=-.025+Math.cos(leafAngle)*.300;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i),y=p.getY(i),z=hairSurfaceZ(x,y);if(z===undefined)continue;
        const relief=p.getZ(i)-(cz-Math.tan(leafAngle)*(x-cx));
        // Leave the root on its existing rim; curve only the higher metal
        // leaf forward of the cap/curls instead of burying it in new hair.
        const shift=.002*Math.log1p(Math.exp((z+.023+relief-p.getZ(i))/.002));
        p.setZ(i,p.getZ(i)+shift*smooth(y,4.755,4.795));
      }
      recomputeSculptureNormals(g);
    }
    if(g.type==='TubeGeometry')closeExposedTubeEnds(g);
    add(g,material);
  };
  const diadem=[];
  for(let i=0;i<=48;i++){const a=-Math.PI*.49+i/48*Math.PI*.98;diadem.push([Math.sin(a)*.353,4.505,-.025+Math.cos(a)*.301]);}
  addDiadem(tube(diadem,.008,72,8),'gold');
  for(let i=0;i<13;i++){
    const a=(i-6)*.225,height=.105+.145*Math.exp(-(((i-6)/1.15)**2)),g=new T.SphereGeometry(1,20,16),p=g.attributes.position;
    for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k),t=(y+1)/2;p.setXYZ(k,x*.024*(.70+.30*Math.sin(t*Math.PI)),height*t,z*.011*(.60+.40*Math.sin(t*Math.PI)));}
    recomputeSculptureNormals(g);g.rotateY(a).translate(Math.sin(a)*.351,4.505,-.025+Math.cos(a)*.300);addDiadem(g,'gold',a);
  }
  for(let i=0;i<29;i++){const a=(i-14)*.105;addDiadem(ellipse(Math.sin(a)*.356,4.507,-.025+Math.cos(a)*.305,.008,.008,.008,10,8),'gold');}
  // The smooth outer garment rolls in reference 6 are part of the robe,
  // not the pierced mandorla. A thin closed fabric band connects them back to
  // the sleeve/shoulder instead of drawing a floating round wire beside it.
  const attachMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),attachRay=new T.Raycaster();
  const attachMeshes=[0,5,6].map(i=>{const m=new T.Mesh(parts.buddha[i],attachMaterial);m.updateMatrixWorld(true);return m;});
  for(const side of[-1,1]){
    const edgePoints=side<0?
      [[-.60853,3.95683,0],[-.88408,3.76962,.03],[-1.08988,3.48492,.09],[-1.21649,3.21033,.14],[-1.27920,2.93574,.20],[-1.24760,2.65284,.29],[-1.17039,2.45330,.42]]:
      [[.62414,3.95683,0],[.86857,3.76962,.03],[1.04383,3.48492,.09],[1.18608,3.21033,.14],[1.24910,2.93574,.20],[1.23275,2.65284,.29],[1.14113,2.45330,.42]];
    const innerZ=side<0?[.170,.110,.211,.255,.322,.370,.410]:[.170,.100,.211,.270,.382,.460,.505];
    const widths=[.490,.300,.200,.200,.200,.240,.300],rows=widths.map((w,i)=>[i/6,w,innerZ[i]]),edgeCurve=curve(edgePoints),samples=[];
    // Let the inner shoulder edge fall below the visible neck rings; the
    // outside roll retains its measured original-reference outline.
    for(let j=0;j<=128;j++){
      const v=j/128,p=edgeCurve.getPoint(v),[w,fallback]=sampleProfile(rows,v),innerY=p.y-.100*(1-smooth(v,0,.25))+.045*smooth(v,.88,1);
      attachRay.set(new T.Vector3(p.x-side*w,innerY,2),new T.Vector3(0,0,-1));
      const hits=attachRay.intersectObjects(attachMeshes,false),zi=hits.length?hits[0].point.z-.012:fallback;
      samples.push({p,w,zi,innerY});
    }
    add(solidClothPanel(surface(24,128,(u,v)=>{
      const q=side<0?u:1-u,{p,w,zi,innerY}=samples[Math.round(v*128)];
      const x=p.x-side*w*(1-q),y=T.MathUtils.lerp(innerY,p.y,q)+.025*Math.sin(Math.PI*q);
      const roll=.050*Math.sin(Math.PI*q)+.027*gaussian(q-.88,.11)*Math.sin(Math.PI*v)**.30;
      const fan=sleeveFanRelief(x,y,side<0?0:1)*smooth(q,.12,.25)*(1-smooth(q,.66,.85))*smooth(v,.72,.80)*(1-smooth(v,.96,1));
      return[x,y,T.MathUtils.lerp(zi,p.z,q)+roll+fan];
    }),24,128,.012));
  }
  attachMaterial.dispose();
  // Merged by finish: three draw calls for the entire sculpture, shared by triad.
  const result=[];
  for(const [material,geos] of Object.entries(parts)){
    if(!geos.length)continue;
    const g=mergeGeometries(geos,false);g.translate(0,-1.65,0);g.computeBoundingBox();g.computeBoundingSphere();g.name=`reference6-buddha-${material}`;
    result.push({geometry:g,material});geos.forEach(x=>x.dispose());
  }
  return result;
}


// Reference 6 attendants have tall crowns, narrow faces, raised bent knees,
// and asymmetric hands. They are not scaled copies of the central Buddha.
const ATTENDANT_CROWN_LIFT=.1994;
const ATTENDANT_LIFT_PROFILE=[[2.03,0],[2.28,.20],[2.65,.40],[3.00,.39],[3.40,.35],[3.70,.32],[3.87,.28],[3.97,.25],[4.12,.22]];
function liftAttendantBodyY(y){return y+sampleProfile(ATTENDANT_LIFT_PROFILE,y)[0];}
const ATTENDANT_TORSO_PROFILE=[[2.03,.32,.23,.10],[2.28,.47,.32,.05],[2.65,.43,.31,.02],[3.00,.48,.30,0],[3.40,.58,.27,0],[3.70,.62,.25,0],[3.87,.40,.22,0],[3.97,.18,.17,0],[4.12,.18,.15,0]];
// The original attendant cloth falls in two separate oblique panels. The
// old five lower and three upper full-width U arcs crossed the center and
// invented detail behind the hands/offerings. Keep only readable short
// returns; the existing neckline relief remains separate and attached.
const ATTENDANT_CLOTH_RETURNS=[[[-0.223631,3.306103],[-0.095816,3.155751],[0.04218,3.050352]],[[0.12508,3.081158],[0.222772,3.220497],[0.293693,3.419438]]];
const ATTENDANT_LOWER_CREASES=[[[0.186502,3.023252],[0.257109,3.068638]],[[0.2213,2.867123],[0.278436,2.952074]]];
function attendantClothCrease(x,y,rows,amplitude,width) {
  const first=rows[0],last=rows[rows.length-1],lo=first[0],hi=last[0];
  const mask=smooth(x,lo-.030,lo+.012)*(1-smooth(x,hi-.006,hi+.032));
  if(mask===0)return 0;
  const second=rows[1],penultimate=rows[rows.length-2];
  const h=x<lo?first[1]+(x-lo)*(second[1]-first[1])/(second[0]-lo):x>hi?last[1]+(x-hi)*(last[1]-penultimate[1])/(hi-penultimate[0]):sampleProfile(rows,x)[0];
  return mask*(amplitude*gaussian(y-h,width)-amplitude*.22*gaussian(y-h+width*1.35,width*.72));
}
function attendantFoldRelief(x,y) {
  let folds=0;
  for(const rows of ATTENDANT_CLOTH_RETURNS)folds+=attendantClothCrease(x,y,rows,.014,.060);
  return folds;
}
function attendantFrontSurfaceZ(x,liftedY) {
  let lo=2.03,hi=4.12;
  for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(liftAttendantBodyY(mid)<liftedY)lo=mid;else hi=mid;}
  const y=(lo+hi)/2,[rx,rz,cz]=sampleProfile(ATTENDANT_TORSO_PROFILE,y),f=Math.sqrt(Math.max(0,1-(x/rx)**2));
  return cz+rz*f+attendantFoldRelief(x,y)*f*f*smooth(y,2.10,2.30)*(1-smooth(y,3.75,3.91));
}
function attendantTorso(){
  return surface(128,156,(u,v)=>{
    const a=u*TAU,y=2.03+v*2.09,[rx,rz,cz]=sampleProfile(ATTENDANT_TORSO_PROFILE,y),x=Math.sin(a)*rx,f=Math.max(0,Math.cos(a));
    let z=cz+Math.cos(a)*rz;z+=attendantFoldRelief(x,y)*f*f*smooth(y,2.10,2.30)*(1-smooth(y,3.75,3.91));return[x,y,z];
  },true);
}
// Keep the existing crown ribs, but tuck their detached end sections back
// into the actual leaf. Already embedded sections remain essentially fixed;
// no crown outline, height or new rib geometry is added.
function seatCrownRib(rib,leaf) {
  const mat=new T.MeshBasicMaterial({side:T.DoubleSide}),host=new T.Mesh(leaf,mat),ray=new T.Raycaster(),p=rib.attributes.position,nu=rib.parameters.radialSegments,nv=rib.parameters.tubularSegments;
  host.updateMatrixWorld();
  for(let j=0;j<=nv;j++){
    let gap=Infinity;
    for(let i=0;i<=nu;i++){
      const k=j*(nu+1)+i;ray.set(new T.Vector3(p.getX(k),p.getY(k)+ATTENDANT_CROWN_LIFT,2),new T.Vector3(0,0,-1));
      const hit=ray.intersectObject(host)[0];if(!hit)throw new Error('Missing crown leaf under existing rib');
      gap=Math.min(gap,p.getZ(k)-hit.point.z);
    }
    // Smooth positive-part avoids an artificial kink at the transition from
    // embedded rib to detached end. The contact target is only .002 deep.
    // Bury both terminal rings in the leaf rather than expose tube holes.
    const endFade=.007*(1-smooth(j,0,2)+smooth(j,nv-2,nv));
    const tuck=.001*Math.log1p(Math.exp((gap+.002)/.001))+endFade;
    for(let i=0;i<=nu;i++){const k=j*(nu+1)+i;p.setZ(k,p.getZ(k)-tuck);}
  }
  mat.dispose();recomputeSculptureNormals(rib);return rib;
}
function buildAttendantAsset(which){
  const bins={buddha:[],oldgold:[],gold:[]},add=(g,m='buddha')=>bins[m].push(g);
  add(closeAttendantTorsoBase(remapSculptureY(attendantTorso(),liftAttendantBodyY)));add(head(true).scale(.87,.86,1).translate(0,4.705-4.215*.86,0));
  for(const s of [-1,1])add(ear(s).scale(.87,.86,1).translate(0,4.705-4.215*.86,0));
  add(torsoRingCap(bins.buddha[0],128,156));
  const arms=[
    [[-.38,3.71,0],[-.65,3.48,.015],[-.78,3.04,.14],[-.74,2.79,.28],[-.55,2.96,.48],[-.50,3.065,.56]],
    [[.38,3.71,0],[.66,3.47,.02],[.79,3.06,.12],[.83,2.76,.27],[.84,2.88,.49],[.84,2.96,.57]]
  ];
  for(const path of arms){const offsets=[.32,.32,.23,.17,.10,.08];const ps=path.map((p,i)=>[p[0]+.23*smooth(i,3,5),p[1]+offsets[i],p[2]]);add(closeSleeveCuff(swept(ps,.165,.145,{segments:100,radial:42,protectInnerBend:true,taper:t=>(.65+.28*Math.sin(Math.PI*t))*(.30+.70*smooth(t,0,.10)),wrinkle:(t,a)=>.009*Math.cos(6*a+4*t)*Math.sin(Math.PI*t)**2})));}
  // Narrow raised palm and three extended fingers; opposite palm is cupped.
  add(palm(true).translate(.325,.12,.02));
  const raised=[
    [[-.565,3.212,.575],[-.590,3.34,.583],[-.596,3.422,.570]],
    [[-.516,3.247,.578],[-.525,3.394,.590],[-.521,3.485,.572]],
    [[-.471,3.252,.578],[-.471,3.401,.582],[-.460,3.471,.560]],
    [[-.445,3.222,.575],[-.398,3.332,.594],[-.368,3.296,.619],[-.380,3.263,.611]],
    [[-.440,3.105,.578],[-.357,3.179,.622],[-.380,3.263,.611]]
  ];
  raised.forEach((p,i)=>add(finger(p.map(a=>[a[0]+.23,3.145+(a[1]-3.145)*1.20+.08,a[2]]),i===4?.025:.020)));
  add(ellipse(1.07,3.10,.59,.110,.118,.058,40,28));
  for(let i=0;i<4;i++){
    const x=.765+i*.049;
    add(finger([[x+(i===0?.012:0),3.075,.606],[x+.010,3.166+.014*Math.sin(i),.626],[x+.025,3.163,.669]],.020-i*.001).translate(.23,.08,0));
  }
  add(finger([[.771,2.995,.607],[.711,3.043,.638],[.746,3.094,.663]],.024).translate(.23,.08,0));
  // The reference legs are compact raised thighs with downward shins, not
  // continuous U-shaped loops. Different near/far shin slopes keep the pose
  // asymmetric; the right attendant mirrors this complete anatomy afterward.
  const legGeos=[],addLeg=g=>legGeos.push(g);
  const legPaths=[
    [[-.16,2.58,.16],[-.47,2.76,.34],[-.73,2.80,.51],[-.78,2.51,.64],[-.70,2.16,.74],[-.64,1.85,.80]],
    [[.17,2.57,.15],[.48,2.71,.34],[.75,2.73,.50],[.80,2.46,.63],[.79,2.13,.73],[.80,1.84,.79]]
  ];
  for(let leg=0;leg<2;leg++){
    const shift=leg===0?.28:0,path=legPaths[leg].map(p=>[p[0]+shift,p[1],p[2]]);
    const g=swept(path,.255,.225,{segments:128,radial:48,protectInnerBend:true,
      taper:t=>.59+.41*Math.sin(Math.PI*t)-.11*smooth(t,.67,1),
      wrinkle:(t,a)=>{
        let w=.011*Math.cos(6*a+3.2*t)*Math.sin(Math.PI*t);
        for(let j=0;j<3;j++)w+=.014*gaussian(t-(.23+j*.12+.09*Math.cos(a)),.031)*Math.max(0,Math.sin(a+.35))**2;
        return w;
      }});
    // The exposed outer shin descends below its own knee. In the reference
    // its foot points outward, not back into the foreground offering vessel.
    // Both feet point +X here; the complete right attendant is mirrored below.
    const ex=leg===0?-.36:.80;
    const foot=swept([[ex,1.85,.80],[ex+.09,1.75,.88],[ex+.22,1.73,.90],[ex+.26,1.73,.90]],.125,.075,{segments:64,radial:30,vertical:true,protectInnerBend:true,taper:t=>{
      if(t===0||t===1)return 0;
      const heel=t<.075?Math.sqrt(Math.max(0,1-((.075-t)/.075)**2)):1;
      const toe=t>.88?Math.sqrt(Math.max(0,1-((t-.88)/.12)**2)):1;
      return(.55+.40*Math.sin(Math.PI*t))*heel*toe;
    }});
    // Preserve the existing cloth edge and exposed foot. A thin recessed
    // return closes the open shin around the foot's actual first section,
    // rather than leaving an unbounded hole around a zero-radius root.
    const fp=foot.attributes.position,fn=foot.userData.sculptureGrid.nu,ankle=new T.Vector3();
    for(let k=0;k<fn;k++)ankle.add(new T.Vector3().fromBufferAttribute(fp,4*(fn+1)+k));ankle.divideScalar(fn);
    addLeg(closeSleeveCuff(g,ankle));addLeg(foot);
    for(let i=0;i<5;i++)addLeg(finger([[ex+.18,1.74,.84+i*.031],[ex+.24-i*.006,1.735,.85+i*.029],[ex+.29-i*.012,1.72,.86+i*.027]],.019-i*.0014));
  }
  let legMin=Infinity;for(const g of legGeos){g.computeBoundingBox();legMin=Math.min(legMin,g.boundingBox.min.y);}for(const g of legGeos)add(g.translate(0,1.65-legMin,0));
  // The lower robe passes behind the raised thighs. Its former upper edge
  // stood .10-.19 units in front of the torso. Seat that edge in the actual
  // waist cloth, blend out toward the unchanged lower hem, and close the back.
  const robeMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),robeTorso=new T.Mesh(bins.buddha[0],robeMaterial),robeRay=new T.Raycaster(),robeOffsets=[];
  robeTorso.updateMatrixWorld(true);
  for(let i=0;i<=54;i++){
    const q=i/27-1,x=q*.365,oldZ=.43-.055*q*q+.010*gaussian(x-.04,.036);
    robeRay.set(new T.Vector3(x,3.14,2),new T.Vector3(0,0,-1));const hits=robeRay.intersectObject(robeTorso);
    robeOffsets.push(hits.length?hits[0].point.z-.012-oldZ:0);
  }
  add(solidClothPanel(surface(54,96,(u,v)=>{
    const q=u*2-1,x=q*(.075+.29*v)+.035*Math.sin(Math.PI*v),y=1.79+v*1.35+.12*q*q*(1-v);
    let z=.43+.13*(1-v)+.06*Math.sin(Math.PI*v)-.055*q*q;
    z+=.015*Math.sin(24*x+4.6*v)*Math.sin(Math.PI*v)+.010*gaussian(x+.08-.12*v,.036);
    // Two short readable folds on the right hanging panel do not continue
    // through the obscured center or become fabricated left-side bands.
    let localCrease=0;for(const rows of ATTENDANT_LOWER_CREASES)localCrease+=attendantClothCrease(x,y,rows,.008,.025);
    z+=localCrease*smooth(v,.10,.25)*(1-smooth(v,.96,1));
    z+=smooth(v,.68,1)*robeOffsets[Math.round(u*54)];
    return[x,y,z];
  }),54,96,.010));
  robeMaterial.dispose();
  // Keep the existing neckline arcs and small pendant, but seat their backs
  // in the actual lifted chest surface. The old fixed Z plane left both entire
  // arcs and the pendant disconnected, especially near the shoulder ends.
  const seatNeckline=(g,oldCenterZ)=>{
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),relief=p.getZ(i)-oldCenterZ(x);
      p.setZ(i,attendantFrontSurfaceZ(x,y)+.003+relief);
    }
    recomputeSculptureNormals(g);return g;
  };
  for(let j=0;j<2;j++){
    const path=[];for(let k=0;k<=48;k++){const t=k/48,x=(t*2-1)*.42,y=3.56+j*.16+.42*(x/.42)**2;path.push([x,y,.285+.025*Math.sin(Math.PI*t)]);}
    add(closeExposedTubeEnds(seatNeckline(tube(path,.010,70,8),x=>.285+.025*Math.cos(Math.PI*x/.84))));
  }
  add(seatNeckline(ellipse(0,3.53,.327,.045,.065,.012,24,20),()=>.327));
  const addCrown=(g,m)=>add(g.translate(0,ATTENDANT_CROWN_LIFT,0),m);
  // Crown replaces the central figure's broad dark curl dome. A small cap is
  // recessed behind seven tapered front leaves and the central pointed crest.
  addCrown(new T.SphereGeometry(1,52,32,0,TAU,0,Math.PI/2).scale(.255,.245,.225).translate(0,4.74,-.030),'oldgold');
  const rim=[];for(let k=0;k<=56;k++){const a=-Math.PI*.52+k/56*Math.PI*1.04;rim.push([Math.sin(a)*.307,4.755,-.020+Math.cos(a)*.274]);}addCrown(closeExposedTubeEnds(tube(rim,.018,80,10)),'gold');
  for(let i=0;i<7;i++){
    const a=(i-3)*.38,h=.32+.3515*Math.exp(-(((i-3)/1.05)**2)),g=new T.SphereGeometry(1,26,24),p=g.attributes.position;
    for(let k=0;k<p.count;k++){const t=(p.getY(k)+1)/2;p.setXYZ(k,p.getX(k)*.047*(.45+.55*Math.sin(Math.PI*t)),h*t,p.getZ(k)*.019);}
    recomputeSculptureNormals(g);g.rotateY(a).translate(Math.sin(a)*.29,4.755,-.020+Math.cos(a)*.255);addCrown(g,'gold');
    const stem=[];for(let k=0;k<=15;k++){const t=k/15;stem.push([Math.sin(a)*.29,4.775+h*t*.88,-.020+Math.cos(a)*.255+.020]);}addCrown(seatCrownRib(tube(stem,.004,24,6),g),'gold');
  }
  const out=[];
  for(const [material,geos] of Object.entries(bins)){
    const g=mergeGeometries(geos,false);g.translate(0,-1.65,0);
    // scale() already transforms the averaged normals. Reversing indices
    // restores winding; recomputing normals here would split every U seam.
    if(which==='right'){g.scale(-1,1,1);const ix=g.index;for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}}
    g.computeBoundingBox();g.computeBoundingSphere();g.name=`reference6-${which}-attendant-${material}`;out.push({geometry:g,material});geos.forEach(g=>g.dispose());
  }
  return out;
}

export const RESTORED_BUDDHA_METRICS = Object.freeze({
  reference:6,frontAxis:'+Z',seatContact:0,decorativeMinY:-.20,headCenter:2.815,crownTop:3.7765,
  raisedHandTop:1.700,kneeWidth:2.580,bodyDepth:1.559,
  variants:{central:{seatContact:0,decorativeMinY:-.20,crownTop:3.7765,headCenter:2.815,kneeWidth:2.580},left:{seatContact:0,crownTop:3.9759,headCenter:3.055,kneeWidth:1.787,bodyWidth:2.104,faceWidth:.679},right:{seatContact:0,crownTop:3.9759,headCenter:3.055,kneeWidth:1.787,bodyWidth:2.104,faceWidth:.679}},
  referenceFit:{central:{x:0,y:3,z:0,scale:2.1/3.26},attendantScale:1.45/3.26,scaleConvention:'retain original unit conversion, do not normalize by crownTop'},
  materials:{buddha:{color:'#cfaa5d',metalness:.94,roughness:.29},oldgold:{color:'#927036',metalness:.91,roughness:.37},gold:{color:'#d1ab58',metalness:.95,roughness:.27}}
});
export function restoredBuddhaParts(variant='central') {
  if(!['central','left','right'].includes(variant))throw new RangeError('Unknown reference6 figure variant');
  if(!cache.has(variant))cache.set(variant,variant==='central'?buildAsset():buildAttendantAsset(variant));
  return cache.get(variant);
}
/** Integrates directly into world's instance(geometry, material, x,y,z,sx,sy,sz). */
export function emitRestoredBuddha(instance,{x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}) {
  for(const p of restoredBuddhaParts(variant))instance(p.geometry,p.material,x,y,z,scale*widthScale,scale,scale*depthScale);
}
/** Standalone scene API: coordinates above remain local to the returned group. */
export function createRestoredBuddha({materials={},x=0,y=0,z=0,scale=1,widthScale=1,depthScale=1,variant='central'}={}) {
  const defaults={
    buddha:new T.MeshStandardMaterial({name:'buddha',color:'#cfaa5d',metalness:.94,roughness:.29}),
    oldgold:new T.MeshStandardMaterial({name:'oldgold',color:'#927036',metalness:.91,roughness:.37}),
    gold:new T.MeshStandardMaterial({name:'gold',color:'#d1ab58',metalness:.95,roughness:.27})
  };
  const group=new T.Group();group.name='reference6-restored-buddha';group.position.set(x,y,z);group.scale.set(scale*widthScale,scale,scale*depthScale);
  for(const p of restoredBuddhaParts(variant)){const mesh=new T.Mesh(p.geometry,materials[p.material]||defaults[p.material]);mesh.castShadow=mesh.receiveShadow=true;mesh.name=p.geometry.name;group.add(mesh);}
  return group;
}
