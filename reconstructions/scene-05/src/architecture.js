import * as T from 'three';
import {timberSweep} from './natural-forms.js';

/*
 * Reconstruction details read from references 4, 5 and 6. All dimensions are
 * LOCAL to world.js's current group. Never bake hallMatrix / towerMatrix here.
 * The geometry is shared between instances, not regenerated for every post.
 */
export const ARCHITECTURE_REVISION = 'reference-joinery-29-reference10-roof-surface-uv-candidate';

/** Optional dedicated architectural surfaces. Existing shared materials are
 * never recolored. Their procedural grain/stone shaders are retained, while
 * visible timber, aged fittings and ceramic ends stop sharing toy-like gloss.
 */
export function createRestorationArchitectureMaterials(materials) {
  if(!materials)return {};
  const palette={
    cedar:[0x70412b,.68,0], red:[0x793b27,.61,0],
    endwood:[0x714b2e,.76,0], darkwood:[0x302319,.72,0],
    gold:[0xbca065,.44,.88], oldgold:[0x92703d,.53,.80],
    black:[0x282622,.60,.10], slate:[0x333b3c,.68,.018],
    tileEdge:[0x6a6b65,.62,.025]
  },keys={};
  for(const [sourceName,[color,roughness,metalness]] of Object.entries(palette)) {
    const source=materials[sourceName];if(!source)continue;
    const key='architecture_'+sourceName;keys[sourceName]=key;
    if(materials[key])continue;
    const material=source.clone();material.name=key;
    material.color.setHex(color);material.roughness=roughness;material.metalness=metalness;
    material.onBeforeCompile=source.onBeforeCompile;
    const sourceKey=source.customProgramCacheKey.bind(source);
    material.customProgramCacheKey=()=>sourceKey()+':reference-architecture-05:'+sourceName;
    materials[key]=material;
  }
  const paints={paintOchre:0x987239,paintSienna:0x815031,
    paintOlive:0x626044,paintIvory:0xc9b389,paintOutline:0x493323};
  for(const [name,color] of Object.entries(paints)) {
    const source=materials.plaster;if(!source)continue;
    const key='architecture_'+name;keys[name]=key;
    if(materials[key])continue;
    const material=source.clone();material.name=key;material.color.setHex(color);
    material.roughness=.94;material.metalness=0;material.bumpMap=null;
    // Paint is on timber inside the hall. Retain its real room-occlusion
    // shader, not plaster's unrestricted outdoor environment response.
    const shaderSource=materials.cedar||source;
    material.onBeforeCompile=shaderSource.onBeforeCompile;
    const sourceKey=shaderSource.customProgramCacheKey.bind(shaderSource);
    material.customProgramCacheKey=()=>sourceKey()+':reference-ceiling-paint-07:'+name;
    materials[key]=material;
  }
  return keys;
}

/** Woven floor surfaces visible ahead of the central kneeling cushion.
 * This is opt-in: no geometry or material is added until the hook is called.
 * Use inside the hall group, before the single portal-material wrapping pass.
 */
function createRestorationMatMaterials(materials) {
  const source=materials?.cedar;if(!source)return {};
  const aliases={};
  for(const [name,color,roughness] of [['strawMat',0xb9aa82,.96],['matBorder',0x34312a,.94]]) {
    const key='architecture_'+name;aliases[name]=key;if(materials[key])continue;
    const material=source.clone();material.name=key;material.color.setHex(color);
    material.map=null;material.bumpMap=null;material.normalMap=null;
    material.roughness=roughness;material.metalness=0;
    material.emissive.setHex(0);material.emissiveIntensity=0;
    const inherit=source.onBeforeCompile,sourceKey=source.customProgramCacheKey.bind(source);
    material.onBeforeCompile=(shader,renderer)=>{
      // Retain real hall occlusion and shadow reception. With the wood map
      // removed, the inherited low-frequency fiber variation is unobtrusive.
      inherit.call(source,shader,renderer);
      if(name==='strawMat')shader.fragmentShader=shader.fragmentShader.replace(
        '#include <color_fragment>',`#include <color_fragment>
float reedPhase=vProc.x*350.0;
float threadPhase=vProc.z*1800.0;
float reedFilter=1.0-smoothstep(.65,2.3,fwidth(reedPhase));
float threadFilter=1.0-smoothstep(.65,2.3,fwidth(threadPhase));
float reedRib=cos(reedPhase)*reedFilter;
float crossThread=cos(threadPhase+sin(reedPhase)*.32)*threadFilter;
diffuseColor.rgb*=1.0+.065*reedRib+.034*crossThread;
`);
    };
    material.customProgramCacheKey=()=>sourceKey()+':reference-floor-weave-01:'+name;
    materials[key]=material;
  }
  return aliases;
}

function extrudedProfile(points, depth = 1, bevel = .015) {
  const shape = new T.Shape();
  points.forEach((p, i) => {
    if (p.length === 6) shape.bezierCurveTo(...p);
    else if (p.length === 4) shape.quadraticCurveTo(...p);
    else if (i) shape.lineTo(...p);
    else shape.moveTo(...p);
  });
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: bevel > 0,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 7
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function turnedProfile(profile, segments = 40) {
  return new T.LatheGeometry(profile.map(p => new T.Vector2(...p)), segments);
}

// Four-way taper and a small clipped corner are required for a timber bearing
// block. A profile extruded at constant depth reads as an ornamental flat slab
// in the actual ref5 corner view, and cannot seat the crossing arms correctly.
function squareTurnedProfile(profile,corner=.065) {
  const rings=profile.map(([radius,y])=>{
    const b=radius*corner;
    return [[-radius+b,y,-radius],[radius-b,y,-radius],[radius,y,-radius+b],
      [radius,y,radius-b],[radius-b,y,radius],[-radius+b,y,radius],
      [-radius,y,radius-b],[-radius,y,-radius+b]];
  });
  const positions=[],uv=[];
  const tri=(a,b,c)=>{for(const p of [a,b,c]){positions.push(...p);uv.push(p[0]*.5+.5,p[1]);}};
  for(let j=0;j<rings.length-1;j++)for(let k=0;k<8;k++) {
    const next=(k+1)%8;
    tri(rings[j][k],rings[j+1][k],rings[j][next]);
    tri(rings[j][next],rings[j+1][k],rings[j+1][next]);
  }
  for(let k=0;k<8;k++) {
    const next=(k+1)%8;
    tri([0,profile[0][1],0],rings[0][k],rings[0][next]);
    tri([0,profile.at(-1)[1],0],rings.at(-1)[next],rings.at(-1)[k]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}

// A beam's lower contour and all saddle contact samples use these same knots.
// Slots are cut into the timber itself; they are not darker overlays.
function joineryLower(x,length) {
  const u=Math.abs(x)/length;
  if(u<=.075)return -.255;
  if(u>=.5)return -.30;
  if(u>=.265&&u<=.34)return -.13;
  const a=u<.265?[.075,-.255,.17,-.245,.205,-.13,.265,-.13]
    :[.34,-.13,.41,-.13,.485,-.30,.5,-.30];
  const bez=(t,j)=>(1-t)**3*a[j]+3*(1-t)**2*t*a[j+2]+3*(1-t)*t*t*a[j+4]+t**3*a[j+6];
  let lo=0,hi=1;for(let i=0;i<28;i++){const t=(lo+hi)/2;if(bez(t,0)<u)lo=t;else hi=t;}
  return bez((lo+hi)/2,1);
}
function joineryArm({length,centre,notches=[],height=.50,width=.21}) {
  const xs=new Set([-.5*length,.5*length]);
  for(const sign of [-1,1])for(const t of [0,.075,.12,.17,.22,.265,.34,.39,.44,.475])xs.add(sign*t*length);
  for(const x of [-.48,-.3286,-.205,-.105,-.093,0,.093,.105,.205,.3286,.48])if(Math.abs(x)<length/2)xs.add(x);
  for(const n of notches){xs.add(n.x-n.width/2);xs.add(n.x+n.width/2);}
  const knots=[...xs].sort((a,b)=>a-b),top=.13*height;
  const contour=[];
  // Each interval has a fixed notch membership. Repeated boundary x values
  // form the true vertical walls of a rectangular lap rather than a ramp.
  for(let i=0;i<knots.length-1;i++){
    const left=knots[i],right=knots[i+1],mid=(left+right)/2;
    const cut=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2);
    const y=cut?Math.min(top,cut.y-centre):top;
    contour.push([left,y],[right,y]);
  }
  for(let i=knots.length-2;i>=0;i--){
    const left=knots[i],right=knots[i+1],mid=(left+right)/2;
    const cut=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2);
    const y=x=>cut?Math.max(joineryLower(x,length)*height,cut.y-centre):joineryLower(x,length)*height;
    contour.push([right,y(right)],[left,y(left)]);
  }
  const clean=contour.filter((p,i)=>!i||Math.hypot(p[0]-contour[i-1][0],p[1]-contour[i-1][1])>1e-9);
  const geo=extrudedProfile(clean,width,0);
  geo.userData.architectureJoint='notched-hijiki';
  geo.userData.joinerySpec={length,centre,height,width,notches};return geo;
}
function joineryBox(length,width,bottom,top,notches=[]) {
  // Rectangular receiving timbers use the same real notch construction.
  const xs=[-length/2,...notches.flatMap(n=>[n.x-n.width/2,n.x+n.width/2]),length/2]
    .sort((a,b)=>a-b).filter((x,i,a)=>!i||x-a[i-1]>1e-10);
  const contour=[];
  for(let i=0;i<xs.length-1;i++){
    const a=xs[i],b=xs[i+1],mid=(a+b)/2;
    const n=notches.find(n=>n.side==='top'&&Math.abs(mid-n.x)<n.width/2);
    const y=n?Math.min(top,n.y):top;contour.push([a,y],[b,y]);
  }
  for(let i=xs.length-2;i>=0;i--){
    const a=xs[i],b=xs[i+1],mid=(a+b)/2;
    const n=notches.find(n=>n.side==='bottom'&&Math.abs(mid-n.x)<n.width/2);
    const y=n?Math.max(bottom,n.y):bottom;contour.push([b,y],[a,y]);
  }
  const clean=contour.filter((p,i)=>!i||Math.hypot(p[0]-contour[i-1][0],p[1]-contour[i-1][1])>1e-9);
  const geo=extrudedProfile(clean,width,0);geo.userData.architectureJoint='notched-receiver';return geo;
}
function joineryDaito() {
  const xs=[...new Set([-.48,-.3286,-.205,-.105,-.093,0,.093,.105,.205,.3286,.48,...[-1,1].flatMap(sign=>[.075,.12,.17,.22,.265,.34].map(t=>sign*t*1.24))])].sort((a,b)=>a-b);
  const positions=[],uv=[];
  const tri=(a,b,c)=>{
    const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ac=new T.Vector3(...c).sub(new T.Vector3(...a));
    if(ab.cross(ac).lengthSq()<1e-20)return;
    for(const p of [a,b,c]){positions.push(...p);uv.push(p[0]+.5,p[2]+.5);}
  };
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  const top=(x,z,i,j)=>{
    let y=.080;
    if(Math.abs((xs[j]+xs[j+1])/2)<.105)y=Math.min(y,.165+joineryLower(x,1.24)*.5);
    if(Math.abs((xs[i]+xs[i+1])/2)<.105&&Math.abs((xs[j]+xs[j+1])/2)>=.105)
      y=Math.min(y,.184+joineryLower(z,1.24)*.5);
    return y;
  };
  // Separate cell levels preserve the upright sides of the crossed seats.
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<xs.length-1;j++){
    const a=[xs[i],top(xs[i],xs[j],i,j),xs[j]],b=[xs[i+1],top(xs[i+1],xs[j],i,j),xs[j]];
    const c=[xs[i+1],top(xs[i+1],xs[j+1],i,j),xs[j+1]],d=[xs[i],top(xs[i],xs[j+1],i,j),xs[j+1]];
    quad(a,d,c,b);
    if(i<xs.length-2){
      const bb=[b[0],top(b[0],b[2],i+1,j),b[2]],cc=[c[0],top(c[0],c[2],i+1,j),c[2]];
      if(Math.abs(b[1]-bb[1])+Math.abs(c[1]-cc[1])>1e-9){
        if(b[1]+c[1]>bb[1]+cc[1])quad(b,c,cc,bb);else quad(c,b,bb,cc);
      }
    }
    if(j<xs.length-2){
      const dd=[d[0],top(d[0],d[2],i,j+1),d[2]],cc=[c[0],top(c[0],c[2],i,j+1),c[2]];
      if(Math.abs(d[1]-dd[1])+Math.abs(c[1]-cc[1])>1e-9){
        if(d[1]+c[1]>dd[1]+cc[1])quad(c,d,dd,cc);else quad(d,c,cc,dd);
      }
    }
  }
  const rings=[[.2592,-.15],[.3072,-.1178],[.4128,-.0051],[.48,.0087],[.48,.08]];
  const ring=([r,y])=>[[-r,y,-r],[r,y,-r],[r,y,r],[-r,y,r]];
  for(let k=0;k<rings.length-1;k++){
    const a=ring(rings[k]),b=ring(rings[k+1]);
    for(let i=0;i<4;i++){const j=(i+1)%4;quad(a[i],b[i],b[j],a[j]);}
  }
  const b=ring(rings[0]);quad(b[0],b[1],b[2],b[3]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
  geo.userData.architectureJoint='cross-saddled-daito';return geo;
}
function buildInterlockedBrackets() {
  const lowerLap=.147;
  const firstX=joineryArm({length:1.24,centre:.165,notches:[{x:0,width:.21,side:'top',y:lowerLap}]});
  const firstZ=joineryArm({length:1.24,centre:.184,notches:[{x:0,width:.21,side:'bottom',y:lowerLap}]});
  const upperLap=.512;
  const secondZ=joineryArm({length:1.36,centre:.4775,notches:[-1,1].map(s=>({x:s*.415,width:.21,side:'top',y:upperLap}))});
  const secondX=joineryArm({length:1.36,centre:.4965,notches:[-1,1].map(s=>({x:s*.415,width:.21,side:'bottom',y:upperLap}))});
  const receiverLap=.74575;
  const receiverX=joineryBox(1.44,.23,.6815,.7815,[{x:0,width:.25,side:'top',y:receiverLap}]);
  const receiverZ=joineryBox(1.43,.25,.71,.82,[-1,1].map(s=>({x:s*.415,width:.23,side:'bottom',y:receiverLap})));
  return {daito:joineryDaito(),firstX,firstZ,secondX,secondZ,receiverX,receiverZ};
}

// Rafters are shallow sweeps, not densely tessellated free-form sculpture.
// Twelve segments retain the eave curl while keeping both rafter tiers at
// approximately the old single tier's triangle cost. Fascia still uses the
// longer timberSweep, where its curved silhouette is visible across the frame.
function closedArchitectureTimberSweep(points,width,height) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const frames=Array.from({length:25},(_,j)=>{
    const centre=curve.getPoint(j/24),tangent=curve.getTangent(j/24).normalize(),side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
    return {centre,tangent,side,up:new T.Vector3().crossVectors(tangent,side).normalize()};
  });
  return rafterSectionSweep(frames,width,height,{capStart:true,capEnd:true,bevel:.0075});
}

function rafterSweep(points,width,height,{capEnd=false,capStart=false}={}) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const segments=12;
  const frames=Array.from({length:segments+1},(_,j)=>{
    const t=j/segments,centre=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
    const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
    return {centre,side,tangent,up:new T.Vector3().crossVectors(tangent,side).normalize()};
  });
  return rafterSectionSweep(frames,width,height,{capEnd,capStart});
}

function rafterSectionSweep(frames,width,height,{capEnd=false,capStart=false,bevel=.006}={}) {
  const hw=width/2,hh=height/2,b=bevel,segments=frames.length-1;
  const rim=[[-hw+b,-hh],[hw-b,-hh],[hw,-hh+b],[hw,hh-b],
    [hw-b,hh],[-hw+b,hh],[-hw,hh-b],[-hw,-hh+b]];
  const p=[],n=[],uv=[];
  const emit=(j,k,nn)=>{
    const f=frames[j],r=rim[k],point=f.centre.clone().addScaledVector(f.side,r[0]).addScaledVector(f.up,r[1]);
    const normal=f.side.clone().multiplyScalar(nn[0]).addScaledVector(f.up,nn[1]).normalize();
    p.push(...point.toArray());n.push(...normal.toArray());uv.push(k/8,j/segments);
  };
  for(let j=0;j<segments;j++)for(let k=0;k<8;k++) {
    const next=(k+1)%8,a=rim[k],b=rim[next],nn=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    for(const [jj,kk] of [[j,k],[j,next],[j+1,next],[j,k],[j+1,next],[j+1,k]])emit(jj,kk,nn);
  }
  // Only the exposed main-rafter outer cut needs a wood cap. Its inner
  // cut is buried in the roof assembly, and flying rafters have metal plates.
  if(capEnd) {
    const f=frames[segments];
    for(let k=1;k<7;k++)for(const corner of [0,k,k+1]) {
      const r=rim[corner];
      const point=f.centre.clone().addScaledVector(f.side,r[0]).addScaledVector(f.up,r[1]);
      p.push(...point.toArray());n.push(...f.tangent.toArray());
      uv.push(r[0]/width+.5,r[1]/height+.5);
    }
  }
  if(capStart) {
    const f=frames[0];
    for(let k=1;k<7;k++)for(const corner of [0,k+1,k]) {
      const r=rim[corner],point=f.centre.clone().addScaledVector(f.side,r[0]).addScaledVector(f.up,r[1]);
      p.push(...point.toArray());n.push(...f.tangent.clone().negate().toArray());uv.push(r[0]/width+.5,r[1]/height+.5);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  return g;
}

// Convex carpenter's cuts preserve the original surface attributes and add a
// real closed cut face. This is CPU geometry construction, not a shader mask.
function clipTimber(geometry,plane,{cap=true}={}) {
  const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');
  let min=Infinity,max=-Infinity;
  for(let i=0;i<p.count;i++){const d=plane.distanceToPoint(new T.Vector3().fromBufferAttribute(p,i));min=Math.min(min,d);max=Math.max(max,d);}
  if(min>=-1e-8)return geometry;
  const positions=[],normals=[],tex=[],cut=[];
  const vertex=i=>({p:new T.Vector3().fromBufferAttribute(p,i),n:new T.Vector3().fromBufferAttribute(n,i),uv:uv?new T.Vector2().fromBufferAttribute(uv,i):new T.Vector2()});
  const emit=(a,b,c)=>{
    if(b.p.clone().sub(a.p).cross(c.p.clone().sub(a.p)).lengthSq()<1e-20)return;
    for(const v of [a,b,c]){positions.push(...v.p.toArray());normals.push(...v.n.toArray());tex.push(...v.uv.toArray());}
  };
  const count=geometry.index?geometry.index.count:p.count;
  for(let i=0;i<count;i+=3){
    let poly=[0,1,2].map(j=>vertex(geometry.index?geometry.index.getX(i+j):i+j)),out=[];
    for(let j=0;j<poly.length;j++){
      const a=poly[j],b=poly[(j+1)%poly.length],da=plane.distanceToPoint(a.p),db=plane.distanceToPoint(b.p);
      const ina=da>=-1e-9,inb=db>=-1e-9;
      if(ina)out.push(a);
      if(ina!==inb){const t=da/(da-db),v={p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)};out.push(v);cut.push(v.p.clone());}
    }
    for(let j=1;j<out.length-1;j++)emit(out[0],out[j],out[j+1]);
  }
  if(cap&&cut.length>=3){
    const unique=[];for(const point of cut)if(!unique.some(q=>q.distanceToSquared(point)<1e-14))unique.push(point);
    const centre=unique.reduce((s,p)=>s.add(p),new T.Vector3()).multiplyScalar(1/unique.length);
    const normal=plane.normal.clone().negate(),axis=Math.abs(normal.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0);
    const u=new T.Vector3().crossVectors(axis,normal).normalize(),v=new T.Vector3().crossVectors(normal,u).normalize();
    unique.sort((a,b)=>{const aa=a.clone().sub(centre),bb=b.clone().sub(centre);return Math.atan2(aa.dot(v),aa.dot(u))-Math.atan2(bb.dot(v),bb.dot(u));});
    const contour=unique.map(p=>new T.Vector2(p.clone().sub(centre).dot(u),p.clone().sub(centre).dot(v)));
    for(const ids of T.ShapeUtils.triangulateShape(contour,[])){
      const vv=ids.map(i=>({p:unique[i],n:normal,uv:contour[i]}));
      if(vv[1].p.clone().sub(vv[0].p).cross(vv[2].p.clone().sub(vv[0].p)).dot(normal)<0)vv.reverse();emit(...vv);
    }
  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));result.setAttribute('uv',new T.Float32BufferAttribute(tex,2));
  result.userData={...geometry.userData};return result;
}
function joinTimberPieces(pieces) {
  const result=new T.BufferGeometry();
  for(const [key,size] of [['position',3],['normal',3],['uv',2]]){
    const arrays=pieces.map(g=>g.getAttribute(key).array),all=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));
    let start=0;for(const a of arrays){all.set(a,start);start+=a.length;}result.setAttribute(key,new T.BufferAttribute(all,size));
  }
  return result;
}
// A closed cut for the opt-in annular tier. Trace each cut-edge loop instead
// of angularly sorting a cloud of points, and retain collinear boundary
// vertices in the cap triangulation. This avoids T-junctions in thin rafters.
function clipTierTimber(geometry,plane,{cap=true}={}) {
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,
    count=geometry.index?.count||p.count,positions=[],normals=[],tex=[],segments=[],onPlane=new Map();let maximumCutAdjustment=geometry.userData.architectureCutMaxAdjustment||0;
  let minimum=Infinity,maximum=-Infinity;
  for(let i=0;i<p.count;i++){const d=plane.distanceToPoint(new T.Vector3().fromBufferAttribute(p,i));minimum=Math.min(minimum,d);maximum=Math.max(maximum,d);}
  if(minimum>=-1e-9)return geometry;
  const empty=()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([],3));g.setAttribute('normal',new T.Float32BufferAttribute([],3));g.setAttribute('uv',new T.Float32BufferAttribute([],2));g.userData={...geometry.userData};return g;};
  if(maximum<-1e-9)return empty();
  const key=q=>q.toArray().map(x=>Math.round(x*1e6)).join(':'),
    canonical=q=>{q.addScaledVector(plane.normal,-plane.distanceToPoint(q));const k=key(q);if(!onPlane.has(k))onPlane.set(k,q.clone());return onPlane.get(k).clone();};
  const vertex=i=>({p:new T.Vector3().fromBufferAttribute(p,i),n:new T.Vector3().fromBufferAttribute(n,i),uv:uv?new T.Vector2().fromBufferAttribute(uv,i):new T.Vector2()});
  const emit=(a,b,c)=>{if(new Set([key(a.p),key(b.p),key(c.p)]).size<3||b.p.clone().sub(a.p).cross(c.p.clone().sub(a.p)).lengthSq()<1e-24)return;for(const q of[a,b,c]){positions.push(...q.p.toArray());normals.push(...q.n.toArray());tex.push(...q.uv.toArray());}};
  for(let i=0;i<count;i+=3){const poly=[0,1,2].map(j=>vertex(geometry.index?geometry.index.getX(i+j):i+j)),out=[],cut=[];
    for(let j=0;j<3;j++){const a=poly[j],b=poly[(j+1)%3],da=plane.distanceToPoint(a.p),db=plane.distanceToPoint(b.p),ina=da>=-1e-9,inb=db>=-1e-9;
      if(Math.abs(da)<1e-9){a.p=canonical(a.p);cut.push(a.p);}
      if(ina)out.push(a);
      if(ina!==inb){const t=da/(da-db),q={p:canonical(a.p.clone().lerp(b.p,t)),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)};out.push(q);cut.push(q.p);}
    }
    for(let j=1;j<out.length-1;j++)emit(out[0],out[j],out[j+1]);
    const unique=[...new Map(cut.map(q=>[key(q),q])).values()];
    if(cap&&unique.length===2&&poly.some(q=>plane.distanceToPoint(q.p)<-1e-9))segments.push(unique.map(key));
  }
  if(cap&&segments.length){
    const adjacency=new Map(),edgeCount=new Map();
    for(const [a,b]of segments){if(a===b)continue;const k=[a,b].sort().join('|');edgeCount.set(k,(edgeCount.get(k)||0)+1);}
    for(const [k,c]of edgeCount)if(c%2){const[a,b]=k.split('|');for(const[u,v]of[[a,b],[b,a]]){if(!adjacency.has(u))adjacency.set(u,[]);adjacency.get(u).push(v);}}
    const unused=new Set([...edgeCount].filter(([k,c])=>c%2).map(([k])=>k)),loops=[];
    while(unused.size){const first=unused.values().next().value,[start,next]=first.split('|'),loop=[start];let current=next;unused.delete(first);
      while(current!==start){loop.push(current);const options=(adjacency.get(current)||[]).filter(k=>unused.has([current,k].sort().join('|')));if(!options.length)throw new Error('Annular timber cut has an open boundary.');
        const following=options[0];unused.delete([current,following].sort().join('|'));current=following;
        if(loop.length>segments.length+1)throw new Error('Annular timber cap loop did not close.');
      }
      if(loop.length>=3)loops.push(loop.map(k=>onPlane.get(k)));
    }
    const normal=plane.normal.clone().negate(),axis=Math.abs(normal.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),
      u=new T.Vector3().crossVectors(axis,normal).normalize(),v=new T.Vector3().crossVectors(normal,u).normalize();
    const projected=new Map();
    for(const loop of loops){
      const retained=loop.map((q,i)=>i);let changed=true;
      while(changed&&retained.length>3){changed=false;for(let j=0;j<retained.length;j++){
        const a=loop[retained[(j+retained.length-1)%retained.length]],b=loop[retained[j]],c=loop[retained[(j+1)%retained.length]],ac=c.clone().sub(a),t=b.clone().sub(a).dot(ac)/ac.lengthSq();
        if(t>0&&t<1&&b.distanceToSquared(a.clone().addScaledVector(ac,t))<1e-12){retained.splice(j,1);changed=true;break;}
      }}
      const chains=new Map();
      for(let j=0;j<retained.length;j++){
        const ia=retained[j],ib=retained[(j+1)%retained.length],a=loop[ia],b=loop[ib],ab=b.clone().sub(a),chain=[];
        for(let k=ia;k!==ib;k=(k+1)%loop.length){let q=loop[k];if(k!==ia){const t=q.clone().sub(a).dot(ab)/ab.lengthSq(),r=a.clone().addScaledVector(ab,t);maximumCutAdjustment=Math.max(maximumCutAdjustment,q.distanceTo(r));projected.set(key(q),r);q=r;}chain.push(q);}
        chain.push(b);chains.set(j+':'+((j+1)%retained.length),chain);chains.set(((j+1)%retained.length)+':'+j,[...chain].reverse());
      }
      const simple=retained.map(i=>loop[i]),contour=simple.map(q=>new T.Vector2(q.dot(u),q.dot(v))),triangles=T.ShapeUtils.triangulateShape(contour,[]);
      for(let ids of triangles){let tri=ids.map(i=>simple[i]);if(tri[1].clone().sub(tri[0]).cross(tri[2].clone().sub(tri[0])).dot(normal)<0){ids=[ids[0],ids[2],ids[1]];tri=ids.map(i=>simple[i]);}
        const border=[];for(let e=0;e<3;e++){const chain=chains.get(ids[e]+':'+ids[(e+1)%3]);border.push(...(chain?chain.slice(0,-1):[tri[e]]));}
        const centre=tri.reduce((sum,q)=>sum.add(q),new T.Vector3()).multiplyScalar(1/3),cv={p:centre,n:normal,uv:new T.Vector2(centre.dot(u),centre.dot(v))};
        for(let j=0;j<border.length;j++){const aa=border[j],bb=border[(j+1)%border.length];emit(cv,{p:aa,n:normal,uv:new T.Vector2(aa.dot(u),aa.dot(v))},{p:bb,n:normal,uv:new T.Vector2(bb.dot(u),bb.dot(v))});}
      }
    }
    // The original clipped side triangles share those same cut vertices.
    for(let i=0;i<positions.length;i+=3){const q=new T.Vector3(...positions.slice(i,i+3)),r=projected.get(key(q));if(r){positions[i]=r.x;positions[i+1]=r.y;positions[i+2]=r.z;}}

  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));result.setAttribute('uv',new T.Float32BufferAttribute(tex,2));result.userData={...geometry.userData,architectureCutMaxAdjustment:maximumCutAdjustment};return result;
}

function tierHipBirdsmouth(geometry,direction,lo,hi,height) {
  const before=new T.Plane(direction.clone().negate(),lo),after=new T.Plane(direction.clone(),-hi),
    above=new T.Plane(new T.Vector3(0,1,0),-height),below=above.clone().negate();
  const front=clipTierTimber(geometry,before,{cap:false}),back=clipTierTimber(geometry,after,{cap:false});
  const middle=clipTierTimber(clipTierTimber(geometry,before.clone().negate()),after.clone().negate());
  const seated=clipTierTimber(middle,above),p=seated.attributes.position,kept=[];
  for(let i=0;i<p.count;i+=3){const q=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,i+j));
    if([before,after].some(plane=>q.every(v=>Math.abs(plane.distanceToPoint(v))<1e-6)))continue;
    kept.push(i,i+1,i+2);
  }
  const top=new T.BufferGeometry();for(const[name,size]of[['position',3],['normal',3],['uv',2]]){
    const src=seated.attributes[name],array=[];for(const i of kept)for(let j=0;j<size;j++)array.push(src.array[i*size+j]);top.setAttribute(name,new T.Float32BufferAttribute(array,size));}
  const capOnly=plane=>{const closed=clipTierTimber(geometry,plane),open=clipTierTimber(geometry,plane,{cap:false}),g=new T.BufferGeometry(),start=open.attributes.position.count;
    for(const[name,size]of[['position',3],['normal',3],['uv',2]])g.setAttribute(name,new T.BufferAttribute(closed.attributes[name].array.slice(start*size),size));
    return clipTierTimber(g,below,{cap:false});};
  return joinTimberPieces([front,top,back,capOnly(before),capOnly(after)]);
}

// Join collinear compound-cut boundaries without changing the silhouette.
// Only unpaired boundary edges are subdivided at already existing vertices;
// valid interior edges are never split by nearly collinear unrelated points.
function conformTierTimber(geometry) {
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,N=geometry.index?.count||p.count,
    key=q=>q.toArray().map(x=>Math.round(x*1e6)).join(':'),vertices=new Map(),canonical=[];let maxWeldDisplacement=0;
  for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i),k=key(q);if(!vertices.has(k))vertices.set(k,q);maxWeldDisplacement=Math.max(maxWeldDisplacement,q.distanceTo(vertices.get(k)));canonical.push(vertices.get(k));}
  const triangles=[],edges=new Map();
  for(let i=0;i<N;i+=3){const ids=[0,1,2].map(j=>geometry.index?geometry.index.getX(i+j):i+j),q=ids.map(i=>canonical[i]);if(new Set(q.map(key)).size<3||q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0])).lengthSq()<1e-24)continue;
    triangles.push(ids);for(let j=0;j<3;j++){const k=[key(q[j]),key(q[(j+1)%3])].sort().join('|');edges.set(k,(edges.get(k)||0)+1);}}
  const boundary=new Set();for(const[k,count]of edges)if(count===1)for(const v of k.split('|'))boundary.add(v);
  const points=[...boundary].map(k=>vertices.get(k)),out=[],normals=[],tex=[];
  const emit=(a,b,c)=>{if(new Set([key(a.p),key(b.p),key(c.p)]).size<3)return;const normal=b.p.clone().sub(a.p).cross(c.p.clone().sub(a.p));if(normal.lengthSq()<1e-24)return;
    const avg=a.n.clone().add(b.n).add(c.n),flat=normal.dot(avg)<-1e-12?normal.normalize():null;
    for(const q of[a,b,c]){out.push(...q.p.toArray());normals.push(...(flat||q.n).toArray());tex.push(...q.uv.toArray());}};
  const get=i=>({p:canonical[i],n:new T.Vector3().fromBufferAttribute(n,i),uv:uv?new T.Vector2().fromBufferAttribute(uv,i):new T.Vector2()});
  for(const ids of triangles){const tri=ids.map(get),border=[];let divided=false;
    for(let j=0;j<3;j++){const a=tri[j],b=tri[(j+1)%3],ab=b.p.clone().sub(a.p),length2=ab.lengthSq(),ka=key(a.p),kb=key(b.p),edge=[{...a,t:0}];
      if(edges.get([ka,kb].sort().join('|'))===1&&length2>1e-12)for(const q of points){const k=key(q);if(k===ka||k===kb)continue;const t=q.clone().sub(a.p).dot(ab)/length2;
        if(t>1e-7&&t<1-1e-7&&q.distanceToSquared(a.p.clone().addScaledVector(ab,t))<1e-12){edge.push({p:q,n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t),t});divided=true;}}
      edge.sort((a,b)=>a.t-b.t);border.push(...edge);}
    if(!divided)emit(...tri);else{const centre={p:tri.reduce((s,q)=>s.add(q.p),new T.Vector3()).multiplyScalar(1/3),n:tri.reduce((s,q)=>s.add(q.n),new T.Vector3()).normalize(),uv:tri.reduce((s,q)=>s.add(q.uv),new T.Vector2()).multiplyScalar(1/3)};
      for(let j=0;j<border.length;j++)emit(centre,border[j],border[(j+1)%border.length]);}
  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(out,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));result.setAttribute('uv',new T.Float32BufferAttribute(tex,2));result.userData={...geometry.userData,architectureWeldMaxDisplacement:maxWeldDisplacement};return result;
}

function hipJackCut(geometry,face,main=true,closedGeometry=null,clip=clipTimber) {
  if(closedGeometry) {
    const p=geometry.getAttribute('position');let cut=false;
    for(let i=0;i<p.count&&!cut;i++) {
      const x=p.getX(i),z=p.getZ(i);
      const distance=face<2?((face===0?z:-z)-Math.abs(x))*Math.SQRT1_2
        :((face===2?x:-x)-Math.abs(z))*Math.SQRT1_2;
      if(distance<.1102-1e-8)cut=true;
    }
    if(cut)geometry=closedGeometry();
  }
  for(const side of [-1,1]){
    const normal=face<2?new T.Vector3(-side,0,face===0?1:-1):new T.Vector3(face===2?1:-1,0,-side);
    geometry=clip(geometry,new T.Plane(normal.normalize(),-.1102));
  }
  geometry.userData.architectureMember=main?'main-rafter':'flying-rafter';return geometry;
}
function hipBirdsmouth(geometry,direction,lo,hi,height,keepAbove=true) {
  // A shallow, bounded birdsmouth sits on the real ring purlin. The exterior
  // tail keeps its full original depth instead of being globally cut flat.
  const before=new T.Plane(direction.clone().negate(),lo),after=new T.Plane(direction.clone(),-hi);
  const above=new T.Plane(new T.Vector3(0,keepAbove?1:-1,0),keepAbove?-height:height),below=above.clone().negate();
  const front=clipTimber(geometry,before,{cap:false}),back=clipTimber(geometry,after,{cap:false});
  const middle=clipTimber(clipTimber(geometry,before.clone().negate(),{cap:false}),after.clone().negate(),{cap:false});
  const seated=clipTimber(middle,above);
  // Keep only the exposed lower portion of either transverse cut face;
  // omitting coincident internal caps avoids hidden duplicate surfaces.
  const capOnly=plane=>{
    const closed=clipTimber(geometry,plane),open=clipTimber(geometry,plane,{cap:false});
    const g=new T.BufferGeometry(),start=open.getAttribute('position').count;
    for(const [name,size] of [['position',3],['normal',3],['uv',2]])g.setAttribute(name,new T.BufferAttribute(closed.getAttribute(name).array.slice(start*size),size));
    return clipTimber(g,below,{cap:false});
  };
  return joinTimberPieces([front,seated,back,capOnly(before),capOnly(after)]);
}

// Shared physical rafter frame. Offsets are perpendicular to the local roof
// tangent, so a pair of timbers cannot merge at the raised corner of a roof.
function rafterUp(evalP,face,t,u) {
  const tangent=evalP(face,t+.0001,u).sub(evalP(face,t-.0001,u)).normalize();
  const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
  return new T.Vector3().crossVectors(tangent,side).normalize();
}
function mainRafterCentre(evalP,face,t,u) {
  const p=evalP(face,t,u);p.y-=.232;
  return p.addScaledVector(rafterUp(evalP,face,t,u),-(.049+.0725+.002));
}
// Share all knots in the two tiers' overlapping interval. Independent
// Catmull-Rom resampling can otherwise penetrate at the strongly curved eave
// despite analytically correct offsets. Twelve main / eight flying segments
// preserve the curl at lower cost than the former two twelve-segment sweeps.
function layeredRafterSweep(evalP,face,u,main,closed=false) {
  const knots=[];
  if(main)for(let j=0;j<6;j++)knots.push(.34+.35*j/6);
  for(let j=0;j<=6;j++)knots.push(.69+.29*j/6);
  if(!main)for(let j=1;j<=2;j++)knots.push(.98+.055*j/2);
  const frames=knots.map(t=>{
    const tangent=evalP(face,t+.0001,u).sub(evalP(face,t-.0001,u)).normalize();
    const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
    const up=new T.Vector3().crossVectors(tangent,side).normalize();
    const centre=evalP(face,t,u);centre.y-=.232;
    if(main)centre.addScaledVector(up,-(.049+.0725+.002));
    return {centre,tangent,side,up};
  });
  return rafterSectionSweep(frames,main?.115:.092,main?.145:.098,{capEnd:main||closed,capStart:closed});
}
function pagodaRoofSampler(w,d,rise) {
  return (face,t,u,extra=0)=>{
    const yy=rise*Math.pow(Math.max(0,1-t),1.43)
      +.48*Math.pow(t,9)*(.25+Math.pow(Math.abs(u),7))+extra;
    if(face<2)return new T.Vector3(u*w*.5*t,yy,(face===0?1:-1)*d*.5*t);
    return new T.Vector3((face===2?1:-1)*w*.5*t,yy,u*d*.5*t);
  };
}
function pagodaRafterBearing(sample,roofWidth,wallDepth,scale) {
  const outerEdge=wallDepth/2+.29*scale/2;
  const count=Math.max(4,Math.round(roofWidth/.29));
  let top=Infinity;
  for(let i=1;i<count;i++) {
    const u=-1+2*i/count;let lo=.34,hi=.98;
    for(let k=0;k<32;k++) {
      const t=(lo+hi)/2;
      const underside=mainRafterCentre(sample,0,t,u).addScaledVector(rafterUp(sample,0,t,u),-.0725);
      if(underside.z<outerEdge)lo=t;else hi=t;
    }
    const t=(lo+hi)/2;
    const underside=mainRafterCentre(sample,0,t,u).addScaledVector(rafterUp(sample,0,t,u),-.0725);
    top=Math.min(top,underside.y);
  }
  return top;
}

// A tiny chased floral boss is ONE shared mesh, rather than a cluster of balls.
function chasedFlower(petals = 12) {
  const p = [], uv = [], id = [];
  for (let petal = 0; petal < petals; petal++) {
    const angle = petal * Math.PI * 2 / petals;
    const ca = Math.cos(angle), sa = Math.sin(angle), first = p.length / 3;
    for (let j = 0; j <= 5; j++) {
      const t = j / 5, radius = .17 + .73 * t;
      const half = Math.sin(Math.PI * t) * .145;
      for (let k = 0; k <= 4; k++) {
        const u = k / 2 - 1;
        const z = .055 + Math.sin(Math.PI * t) * (1 - u * u) * .13;
        const x = ca * radius - sa * half * u, y = sa * radius + ca * half * u;
        p.push(x, y, z); uv.push(x * .5 + .5, y * .5 + .5);
        if (j < 5 && k < 4) {
          const a = first + j * 5 + k;
          id.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
        }
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(id); g.computeVertexNormals();
  // Pointed petal tips have coincident limiting vertices. Their zero-area
  // triangles do not rasterize, but zero normals must not enter the shader.
  const normals=g.getAttribute('normal');
  for(let i=0;i<normals.count;i++)
    if(Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i))<1e-6)
      normals.setXYZ(i,0,0,1);
  return g;
}

function architectureGeometry() {
  // Hijiki has a flat load-bearing top and deeply relieved lower shoulders.
  // This is not a drooping carved applique attached to an ordinary box.
  const hijiki = extrudedProfile([
    [-.5, .13], [.5, .13], [.5, -.035],
    [.485, -.10, .41, -.13, .34, -.13], [.265, -.13],
    [.205, -.13, .17, -.245, .075, -.255], [-.075, -.255],
    [-.17, -.245, -.205, -.13, -.265, -.13], [-.34, -.13],
    [-.41, -.13, -.485, -.10, -.5, -.035]
  ], 1, .009);
  // Splayed bearing block: narrow seated foot, heavy square shoulder, saddle.
  const masu = squareTurnedProfile([[.27,-.5],[.32,-.36],[.43,.13],
    [.50,.19],[.50,.44],[.47,.5]],.09);
  const collar = turnedProfile([[0,0],[1,0],[1,.10],[1.055,.14],[1.055,.22],
    [1.015,.27],[1.015,.88],[1.055,.93],[1.055,1],[0,1]], 48);
  const column = turnedProfile([[0,0],[.985,0],[.996,.06],[1.012,.23],
    [1.008,.48],[.994,.69],[.972,.88],[.95,1],[0,1]], 48);
  const squareColumn=squareTurnedProfile([[.985,0],[1.0,.07],[1.0,.82],[.96,1]],.085);
  const squareShoe=squareTurnedProfile([[1.035,0],[1.065,.10],[1.025,.20],
    [1.025,.86],[1.065,.93],[1.065,1]],.055);
  const squareFoot=squareTurnedProfile([[1.40,0],[1.47,.12],[1.47,.32],
    [1.26,.52],[1.18,.86],[1.12,1]],.09);
  const foot = turnedProfile([[0,0],[1.17,0],[1.24,.10],[1.24,.25],
    [1.16,.40],[1.06,.44],[1.02,.64],[.92,.82],[.88,1],[0,1]], 32);
  const tileSeal = turnedProfile([[0,-.16],[.78,-.16],[.94,-.12],
    [1,-.04],[1,.07],[.94,.16],[.83,.17],[.78,.10],
    [.76,.035],[0,.035]],32).rotateX(Math.PI / 2);
  const ring = new T.TorusGeometry(1, .075, 5, 32);
  const rosette = chasedFlower();
  const pin = new T.CylinderGeometry(1,1,.30,10).rotateX(Math.PI/2);
  const nail = new T.SphereGeometry(1,8,5);
  // The bracket saddle grain continues through a real tenon cheek.
  const tenon = extrudedProfile([[-.5,-.5],[.30,-.5],[.50,-.28],
    [.50,.28],[.30,.5],[-.5,.5]],1,.025);
  const friezeLeaf=extrudedProfile([[0,0],[-.24,.12,-.10,.24,-.31,.34],
    [-.13,.35,-.24,.58,-.12,.69],[-.10,.80,0,1],
    [.14,.74,.21,.62,.12,.54],[.30,.44,.19,.22,.13,.20],[.06,.08,0,0]],.07,.012);
  const friezeStem=new T.TubeGeometry(new T.CatmullRomCurve3([
    [-.50,-.045,0],[-.33,.045,0],[-.05,.038,0],[.18,-.048,0],
    [.38,-.028,0],[.43,.06,0],[.35,.105,0],[.29,.054,0]
  ].map(p=>new T.Vector3(...p))),28,.009,5,false);
  const paintPetalShape=new T.Shape();
  paintPetalShape.moveTo(0,0);paintPetalShape.bezierCurveTo(-.24,.18,-.52,.45,-.43,.70);
  paintPetalShape.bezierCurveTo(-.39,.96,-.12,1.09,0,1.0);
  paintPetalShape.bezierCurveTo(.17,1.08,.42,.94,.44,.70);
  paintPetalShape.bezierCurveTo(.53,.44,.23,.15,0,0);
  const paintLeafShape=new T.Shape();
  paintLeafShape.moveTo(0,0);paintLeafShape.bezierCurveTo(-.40,.28,-.36,.74,.12,1.0);
  paintLeafShape.bezierCurveTo(.02,.73,.48,.35,0,0);
  const paintPetal=new T.ShapeGeometry(paintPetalShape,8);
  const paintLeaf=new T.ShapeGeometry(paintLeafShape,8);
  const paintDisc=new T.CircleGeometry(1,24);
  return {paintPetal,paintLeaf,paintDisc,hijiki,masu,collar,column,squareColumn,squareShoe,squareFoot,
    foot,tileSeal,ring,rosette,pin,nail,tenon,
    friezeLeaf,friezeStem};
}

/**
 * Required ctx: instance, group, box. Optional: stack + columns preserve the
 * existing collision/column audit; roofAudit preserves the soffit audit.
 * All material names already exist in world.js. No lights, texture downloads,
 * scene insertion, shared-state mutation or additional transform are needed.
 */
/** Remove a rectangular front-slope opening without dropping crossing tiles.
 * All vertex attributes (including the original tile colors/UVs/normals) are
 * interpolated at exact cut edges. Coordinates are host-roof local. This is
 * for open roof skins; solid timber is clipped and capped separately below.
 */
export function clipRestorationRoofOpening(geometry,opening) {
  if(!opening)return geometry;
  if(Array.isArray(opening))return opening.reduce((g,o)=>clipRestorationRoofOpening(g,o),geometry);
  const {minX,maxX,minZ,maxZ=Infinity}=opening;
  if(![minX,maxX,minZ].every(Number.isFinite)||!(minX<maxX)||!(minZ<maxZ))
    throw new RangeError('Invalid entrance opening footprint.');
  const attrs=Object.entries(geometry.attributes),out=Object.fromEntries(attrs.map(([key])=>[key,[]]));
  const planes=[[0,1,-minX],[0,-1,maxX],[2,1,-minZ],...(Number.isFinite(maxZ)?[[2,-1,maxZ]]:[])];
  const read=i=>Object.fromEntries(attrs.map(([key,a])=>[key,Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k])]));
  const lerp=(a,b,t)=>Object.fromEntries(attrs.map(([key])=>[key,a[key].map((n,i)=>n+(b[key][i]-n)*t)]));
  const clip=(polygon,plane,sign)=>{
    const result=[];if(!polygon.length)return result;
    for(let i=0;i<polygon.length;i++) {
      const a=polygon[i],b=polygon[(i+1)%polygon.length];
      const da=sign*(a.position[plane[0]]*plane[1]+plane[2]);
      const db=sign*(b.position[plane[0]]*plane[1]+plane[2]);
      const ia=da>=-1e-10,ib=db>=-1e-10;
      if(ia)result.push(a);if(ia!==ib)result.push(lerp(a,b,da/(da-db)));
    }
    return result;
  };
  const emit=polygon=>{
    for(let k=1;k<polygon.length-1;k++) {
      const triangle=[polygon[0],polygon[k],polygon[k+1]],a=new T.Vector3(...triangle[0].position);
      if(new T.Vector3(...triangle[1].position).sub(a).cross(new T.Vector3(...triangle[2].position).sub(a)).lengthSq()<1e-18)continue;
      for(const vertex of triangle)for(const [key,attr] of attrs) {
        const value=vertex[key];
        if(key==='normal'){
          const l=Math.hypot(...value)||1;out[key].push(...value.map(n=>n/l));
        }else out[key].push(...value);
      }
    }
  };
  const count=geometry.index?geometry.index.count:geometry.getAttribute('position').count;
  for(let i=0;i<count;i+=3) {
    let inside=[0,1,2].map(k=>read(geometry.index?geometry.index.getX(i+k):i+k));
    for(const plane of planes){emit(clip(inside,plane,-1));inside=clip(inside,plane,1);if(!inside.length)break;}
  }
  const result=new T.BufferGeometry();for(const [key,attr] of attrs)
    result.setAttribute(key,new T.Float32BufferAttribute(out[key],attr.itemSize));
  result.userData={...geometry.userData,entranceOpening:{minX,maxX,minZ,maxZ}};return result;
}

// Solid pieces are cut with a real end grain cap. The disjoint output pieces
// share boundaries, never volumes; no invisible dark overlay masks the void.
// Localized real bearing pockets, used only by the conditional gallery roof.
// Disjoint capped pieces retain the outside shape and do not remove a whole
// rafter merely because one cheek crosses an existing capital receiver.
function architectureTimberOutsideSeat(geometry,seat) {
  const solid=g=>{if(!g.attributes.position.count)return false;g.computeBoundingBox();const s=g.boundingBox.getSize(new T.Vector3());
    // Repeated Float32 cuts may emit the same cut plane twice, with EXACTLY
    // zero width in one axis. It is a duplicate surface, not retained timber.
    if(s.x===0||s.y===0||s.z===0){if(seat.cleanup)seat.cleanup.exactZeroWidthParts++;return false;}return true;};
  if(!solid(geometry))return [];
  const b=geometry.boundingBox;
  if(b.max.x<=seat.minX||b.min.x>=seat.maxX||b.max.z<=seat.minZ||b.min.z>=seat.maxZ||b.min.y>=seat.topY||b.max.y<=seat.bottomY)return [geometry];
  const planes=[new T.Plane(new T.Vector3(1,0,0),-seat.minX),new T.Plane(new T.Vector3(-1,0,0),seat.maxX),
    new T.Plane(new T.Vector3(0,0,1),-seat.minZ),new T.Plane(new T.Vector3(0,0,-1),seat.maxZ),
    new T.Plane(new T.Vector3(0,-1,0),seat.topY),new T.Plane(new T.Vector3(0,1,0),-seat.bottomY)];
  const pieces=[];let rest=conformTierTimber(geometry);
  for(const plane of planes){const outside=clipTierTimber(rest,plane.clone().negate());if(solid(outside))pieces.push(conformTierTimber(outside));
    rest=clipTierTimber(rest,plane);if(!solid(rest))break;rest=conformTierTimber(rest);}
  return pieces;
}

function roofTimberOutsideOpening(geometry,opening) {
  if(!opening)return [geometry];
  if(Array.isArray(opening))return opening.reduce((pieces,o)=>pieces.flatMap(g=>roofTimberOutsideOpening(g,o)),[geometry]);
  const {minX,maxX,minZ,maxZ=Infinity}=opening,clip=opening.tierCollar?clipTierTimber:clipTimber;
  geometry.computeBoundingBox();const bounds=geometry.boundingBox;
  if(bounds.max.x<minX||bounds.min.x>maxX||bounds.max.z<minZ||bounds.min.z>maxZ)return [geometry];
  if(bounds.min.x>=minX&&bounds.max.x<=maxX&&bounds.min.z>=minZ&&bounds.max.z<=maxZ)return [];
  const planes=[new T.Plane(new T.Vector3(1,0,0),-minX),new T.Plane(new T.Vector3(-1,0,0),maxX),
    new T.Plane(new T.Vector3(0,0,1),-minZ),...(Number.isFinite(maxZ)?[new T.Plane(new T.Vector3(0,0,-1),maxZ)]:[])];
  const pieces=[];let rest=geometry;
  for(const plane of planes) {
    const outside=clip(rest,plane.clone().negate());
    if(outside.getAttribute('position').count)pieces.push(outside);
    rest=clip(rest,plane);
    if(!rest.getAttribute('position').count)break;
  }
  return pieces;
}


// A continuous tapered shaft with true through mortises. Each horizontal
// ring has matching z-plane intersections, so a mortise has real cheeks and
// end grain, without stacked cylinder fragments or hidden internal caps.
function mortisedHallShaft(radius,height,slots,blindSlots=[]) {
  const profile=[[.985,0],[.996,.06],[1.012,.23],[1.008,.48],[.994,.69],[.972,.88],[.95,1]];
  const radiusAt=y=>{let i=1;while(i<profile.length-1&&y>profile[i][1]*height)i++;
    return radius*T.MathUtils.lerp(profile[i-1][0],profile[i][0],
      (y/height-profile[i-1][1])/(profile[i][1]-profile[i-1][1]));};
  const levels=[...new Set([0,height,...profile.map(p=>p[1]*height),...slots.flatMap(s=>[s.bottom,s.top]),...blindSlots.flatMap(s=>[s.bottom,s.top])])].sort((a,b)=>a-b);
  const zCuts=[...new Set(slots.flatMap(s=>[-s.depth/2,s.depth/2]).concat(blindSlots.map(s=>s.endZ)))].sort((a,b)=>a-b);
  const xCuts=[...new Set(blindSlots.flatMap(s=>[-s.width/2,s.width/2]))].sort((a,b)=>a-b);
  const ring=y=>{
    const r=radiusAt(y),points=[];
    for(let k=0;k<48;k++) {
      const a=[r*Math.sin(k*Math.PI/24),y,r*Math.cos(k*Math.PI/24)],
        b=[r*Math.sin((k+1)*Math.PI/24),y,r*Math.cos((k+1)*Math.PI/24)];
      points.push(a);
      const cuts=[...zCuts.map(z=>({t:(z-a[2])/(b[2]-a[2]),z})),...xCuts.map(x=>({t:(x-a[0])/(b[0]-a[0]),x}))].filter(c=>c.t>1e-10&&c.t<1-1e-10).sort((a,b)=>a.t-b.t);
      for(const c of cuts)points.push([c.x??T.MathUtils.lerp(a[0],b[0],c.t),y,c.z??T.MathUtils.lerp(a[2],b[2],c.t)]);
    }
    return points;
  };
  const rings=levels.map(ring),p=[],n=[],uv=[];
  const profileNormals=profile.map((point,i)=>{
    const neighbors=[];
    for(const j of [i-1,i])if(j>=0&&j<profile.length-1) {
      const slope=radius*(profile[j+1][0]-profile[j][0])/(height*(profile[j+1][1]-profile[j][1]));
      neighbors.push(new T.Vector2(1,-slope).normalize());
    }
    return neighbors.reduce((s,n)=>s.add(n),new T.Vector2()).normalize();
  });
  const outerNormal=q=>{
    const t=q[1]/height;let i=1;while(i<profile.length-1&&t>profile[i][1])i++;
    const u=(t-profile[i-1][1])/(profile[i][1]-profile[i-1][1]),
      section=profileNormals[i-1].clone().lerp(profileNormals[i],u).normalize(),r=Math.hypot(q[0],q[2]);
    return new T.Vector3(section.x*q[0]/r,section.y,section.x*q[2]/r).normalize();
  };
  const tri=(a,b,c,normal,smooth=false)=>{
    const ab=new T.Vector3(...b).sub(new T.Vector3(...a)),ac=new T.Vector3(...c).sub(new T.Vector3(...a));
    const cross=ab.cross(ac);if(cross.lengthSq()<1e-20)return;
    if(cross.dot(normal)<0)[b,c]=[c,b];
    for(const q of [a,b,c]){p.push(...q);n.push(...(smooth?outerNormal(q):normal).toArray());uv.push(Math.atan2(q[0],q[2])/(Math.PI*2)+.5,q[1]/height);}
  };
  const cap=(points,normal)=>{
    const centre=points.reduce((s,q)=>s.add(new T.Vector3(...q)),new T.Vector3()).multiplyScalar(1/points.length).toArray();
    for(let k=0;k<points.length;k++)tri(centre,points[k],points[(k+1)%points.length],normal);
  };
  cap(rings[0],new T.Vector3(0,-1,0));cap(rings.at(-1),new T.Vector3(0,1,0));
  for(let j=0;j<rings.length-1;j++) {
    const lower=rings[j],upper=rings[j+1],mid=(levels[j]+levels[j+1])/2,
      slot=slots.find(s=>mid>s.bottom&&mid<s.top),blind=blindSlots.find(s=>mid>s.bottom&&mid<s.top);
    if(lower.length!==upper.length)throw new Error('Mortised shaft profile changed its cut-edge ordering.');
    for(let k=0;k<lower.length;k++) {
      const next=(k+1)%lower.length;
      const mx=(lower[k][0]+lower[next][0]+upper[k][0]+upper[next][0])/4,
        mz=(lower[k][2]+lower[next][2]+upper[k][2]+upper[next][2])/4;
      if(blind&&Math.abs(mx)<blind.width/2-1e-8&&mz<blind.endZ-1e-8)continue;
      if(slot&&Math.abs((lower[k][2]+lower[next][2]+upper[k][2]+upper[next][2])/4)<slot.depth/2-1e-8)continue;
      const normal=new T.Vector3(...upper[k]).sub(new T.Vector3(...lower[k])).cross(new T.Vector3(...lower[next]).sub(new T.Vector3(...lower[k]))).normalize();
      if(normal.x*(lower[k][0]+lower[next][0])+normal.z*(lower[k][2]+lower[next][2])<0)normal.negate();
      tri(lower[k],upper[k],lower[next],normal,true);tri(lower[next],upper[k],upper[next],normal,true);
    }
    if(slot)for(const side of [-1,1]) {
      const z=side*slot.depth/2,ends=q=>q.filter(v=>Math.abs(v[2]-z)<1e-8).sort((a,b)=>a[0]-b[0]);
      const lo=ends(lower),hi=ends(upper),normal=new T.Vector3(0,0,-side);
      if(lo.length!==2||hi.length!==2)throw new Error('Mortise wall requires two actual outer-profile intersections.');
      tri(lo[0],lo[1],hi[0],normal);tri(lo[1],hi[1],hi[0],normal);
    }
    if(blind) {
      const loY=levels[j],hiY=levels[j+1],half=blind.width/2,z=blind.endZ;
      for(const side of [-1,1]) {
        const x=side*half,edge=q=>q.find(p=>Math.abs(p[0]-x)<1e-8&&p[2]<z);
        const lo=edge(lower),hi=edge(upper),normal=new T.Vector3(-side,0,0);
        if(!lo||!hi)throw new Error('Blind housing must end within the actual round-column contour.');
        tri(lo,[x,loY,z],hi,normal);tri([x,loY,z],[x,hiY,z],hi,normal);
      }
      const normal=new T.Vector3(0,0,-1);
      tri([-half,loY,z],[half,loY,z],[-half,hiY,z],normal);
      tri([half,loY,z],[half,hiY,z],[-half,hiY,z],normal);
    }
  }
  for(const slot of slots)for(const [y,sign] of [[slot.bottom,1],[slot.top,-1]]) {
    const points=ring(y).filter(p=>Math.abs(p[2])<=slot.depth/2+1e-8);
    cap(points,new T.Vector3(0,sign,0));
  }
  const clip2D=(points,axis,value,sign)=>{
    const out=[];for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],da=sign*(a[axis]-value),db=sign*(b[axis]-value);
      if(da>=-1e-9)out.push(a);
      if((da>=-1e-9)!==(db>=-1e-9)){const t=da/(da-db);out.push(a.map((v,k)=>T.MathUtils.lerp(v,b[k],t)));}
    }return out;
  };
  for(const slot of blindSlots)for(const [y,sign] of [[slot.bottom,1],[slot.top,-1]]) {
    let points=ring(y);points=clip2D(points,0,-slot.width/2,1);points=clip2D(points,0,slot.width/2,-1);
    points=clip2D(points,2,slot.endZ,-1);cap(points,new T.Vector3(0,sign,0));
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.userData.architectureJoint='through-mortised-hall-shaft';
  geometry.userData.mortises=slots.map(s=>({...s}));geometry.userData.blindMortises=blindSlots.map(s=>({...s}));return geometry;
}

export function createRestorationArchitecture(ctx) {
  const {instance, group, box:worldBox, columns, stack, roofAudit} = ctx;
  if (!instance || !group || !worldBox) throw new Error('Architecture requires instance, group and box helpers.');
  const materialAliases=createRestorationArchitectureMaterials(ctx.materials);
  const paintFallback={paintOchre:'endwood',paintSienna:'red',paintOlive:'cedar',paintIvory:'plaster',paintOutline:'darkwood',strawMat:'plaster',matBorder:'darkwood'};
  const materialKey=name=>materialAliases[name]||paintFallback[name]||name;
  const box=(x,y,z,w,h,d,ma='cedar',rot=0,tint=1)=>
    worldBox(x,y,z,w,h,d,materialKey(ma),rot,tint);
  const g = architectureGeometry();
  let interlocked,hallFoot;
  const hallShaftSlots=new Map(),hallDaitoSlots=new Map(),plainShoes=new Map(),throughShafts=new Map();
  const PI = Math.PI;
  const draw = (geometry, material, p, scale, rot = null, tint = 1) =>
    instance(geometry, materialKey(material), ...p, ...scale, rot, tint);
  const v = p => new T.Vector3(...p);
  const stats = {columns:0,bracketSets:0,roofFaces:0,rafters:0,tileEnds:0};

  /** Only the one original reference10 threshold hipRoof. Input is its actual
   * once-generated indexed geometry BEFORE the existing opening clip, still
   * in roof-parent coordinates. Backing charts share all four hip phases;
   * separate ceramic tiles use their actual grid lengths with shared nominal
   * centre-phase anchors. This never adds roof construction. One world metre
   * is the nominal effective texture period, not an isometry. Wood's existing
   * repeat(4,1) is compensated, not mutated. Grain follows the continuous V
   * field; that hidden board direction is an assumption, not a photo finding.
   */
  function reference10RoofSurfaceUV({geometry,referenceMode,layer}={}) {
    if(referenceMode!=='reference10'||!['darkwood','slate','ceramics'].includes(layer))
      throw new RangeError('Roof UV is limited to the reference10 threshold surface layers.');
    const expected=[.6,0,0,0,0,.6,0,0,0,0,.6,0,-13.840726762,4.26,22.584909603999996,1];
    const parent=stack?.at(-1)?.elements;
    if(!parent||parent.some((x,i)=>!Number.isFinite(x)||Math.abs(x-expected[i])>1e-10))
      throw new RangeError('Roof UV requires the actual unchanged threshold hipRoof parent.');
    const wood=layer==='darkwood',material=ctx.materials?.[wood?'darkwood':'slate'],texture=material?.bumpMap;
    if(!texture||texture.channel!==0||!texture.matrixAutoUpdate||texture.wrapS!==T.RepeatWrapping||texture.wrapT!==T.RepeatWrapping
      ||texture.repeat.x!==(wood?4:1)||texture.repeat.y!==1||texture.offset.x!==0||texture.offset.y!==0
      ||texture.rotation!==0||texture.center.x!==0||texture.center.y!==0
      ||(wood?material.map!==texture:!!material.map))
      throw new RangeError('Roof UV requires the unchanged actual wood/stone channel0 repeat transform.');
    const p=geometry?.attributes?.position;
    if(!geometry?.isBufferGeometry||!p||p.itemSize!==3||p.isInterleavedBufferAttribute||!(p.array instanceof Float32Array)
      ||geometry.getAttribute('uv')||geometry.morphAttributes.position?.length)
      throw new TypeError('Roof UV expects an original Float32 roof surface without a UV attribute.');
    if(!geometry.index||geometry.index.itemSize!==1||(layer==='ceramics'?(p.count%15!==0||geometry.index.count!==p.count/15*48):(p.count!==861||geometry.index.count!==4800)))
      throw new TypeError('Roof UV must run on the original indexed surface before the existing opening clip.');
    const uv=new Float32Array(p.count*2),nominal=new Float64Array(p.count*2),ridge=27*.245,run=27/2-ridge,halfDepth=6.2/2;
    // Integrate metric length down the current analytic roof generator, not
    // its XZ projection. A split at t=1 handles the derivative's endpoint.
    // At every hip, |u|=1 gives the SAME run and integral from either face.
    const arc=(t,u,horizontal)=>{
      const f=q=>Math.hypot(horizontal,-3.1*1.43*Math.pow(Math.max(0,1-q),.43)
        +.48*9*Math.pow(q,8)*(.25+Math.pow(Math.abs(u),7)));
      const integrate=(a,b)=>{if(b<=a)return 0;const n=64,h=(b-a)/n;let total=f(a)+f(b);
        for(let j=1;j<n;j++)total+=(j%2?4:2)*f(a+j*h);return total*h/3;};
      return integrate(0,Math.min(1,t))+integrate(1,t);
    };
    const cache=new Map();
    for(let i=0;i<p.count;i++) {
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ax=Math.abs(x),az=Math.abs(z);
      if(![x,y,z].every(Number.isFinite)||ax>13.53||az>3.12||y<-.25||y>3.75)
        throw new RangeError('Roof UV input exceeds the unchanged threshold roof domain.');
      const key=x+':'+z;let mapped=cache.get(key);
      if(!mapped){
        const front=ax<=ridge+run*az/halfDepth;
        const t=front?az/halfDepth:(ax-ridge)/run,u=front?x/(ridge+run*t):z/(halfDepth*t);
        if(!(t>=0&&t<=1.006&&Math.abs(u)<=1.000001))throw new RangeError('Roof UV input is not on the original four-face domain.');
        const horizontal=front?Math.hypot(run*u,halfDepth):Math.hypot(run,halfDepth*u),q=arc(t,u,horizontal)/horizontal;
        const xx=front?u*(ridge+run*q):Math.sign(x)*(ridge+run*q);
        const zz=front?Math.sign(z)*halfDepth*q:halfDepth*u*q;
        mapped=[xx*.6/(wood?4:1),zz*.6];cache.set(key,mapped);
      }
      uv[i*2]=nominal[i*2]=mapped[0];uv[i*2+1]=nominal[i*2+1]=mapped[1];
    }
    if(layer==='ceramics') {
      // Each real tile is a separate 3x5 curved grid. Its corrugated narrow
      // crown can be nearly vertical even when the nominal roof is not.
      // Measure both directions ON that actual grid, then let the unchanged
      // opening clip interpolate these coordinates with every other attribute.
      const point=i=>new T.Vector3(p.getX(i),p.getY(i),p.getZ(i));
      for(let start=0;start<p.count;start+=15) {
        const tile=start/15;
        for(let j=0;j<2;j++)for(let k=0;k<4;k++) {
          const a=start+j*5+k,expectedIndices=[a,a+5,a+1,a+1,a+5,a+6];
          for(let q=0;q<6;q++)if(geometry.index.getX(tile*48+(j*4+k)*6+q)!==expectedIndices[q])
            throw new TypeError('Ceramic UV requires the exact original per-tile index order.');
        }
        const cross=new T.Vector2(nominal[(start+8)*2]-nominal[(start+6)*2],nominal[(start+8)*2+1]-nominal[(start+6)*2+1]);
        if(!(cross.lengthSq()>0))throw new RangeError('Ceramic cross-section has no finite chart direction.');
        cross.normalize();const down=new T.Vector2(-cross.y,cross.x),delta=new T.Vector2(nominal[(start+12)*2]-nominal[(start+2)*2],nominal[(start+12)*2+1]-nominal[(start+2)*2+1]);
        if(down.dot(delta)<0)down.negate();
        const anchor=new T.Vector2(nominal[(start+7)*2],nominal[(start+7)*2+1]);
        const physicalCross=point(start+8).sub(point(start+6)).normalize(),centre=point(start+7);
        for(let j=0;j<3;j++) {
          const centreDelta=point(start+j*5+2).sub(centre),shear=centreDelta.dot(physicalCross);
          const longitudinal=(j===0?-1:j===2?1:0)*Math.sqrt(Math.max(0,centreDelta.lengthSq()-shear*shear))*.6;
          const distance=[0];for(let k=1;k<5;k++)distance.push(distance[k-1]+point(start+j*5+k).distanceTo(point(start+j*5+k-1)));
          for(let k=0;k<5;k++) {
            const transverse=(distance[k]-distance[2]+shear)*.6;
            const value=anchor.clone().addScaledVector(cross,transverse).addScaledVector(down,longitudinal),i=start+j*5+k;
            uv[i*2]=value.x;uv[i*2+1]=value.y;
          }
        }
      }
    }
    const result=geometry.clone();result.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    result.userData.reference10RoofUV={kind:layer==='ceramics'?'actual-tile-grid-arclength-chart':'continuous-radial-arclength-chart',layer,effectiveTexturePeriodWorld:1,
      originalGeometryUnchanged:true,nominalRoof:[27,6.2,3.1],integrationIntervals:64};
    return result;
  }

  function flower(x,y,z,r,ma='oldgold',rot=null,tint=1) {
    draw(g.rosette,ma,[x,y,z],[r,r,r],rot,tint);
  }

  function squareFitting(x,y,z,w,h,rot=0,detail=true) {
    // Forged framing strips surround exposed end grain; no solid gold cube.
    group(x,y,z,rot,()=>{
      const border = Math.min(w,h)*.075;
      if(detail&&w>=.14&&h>=.12){
        box(0,0,-.002,w*.90,h*.90,.008,'oldgold');
        box(0,0,.003,w*.72,h*.72,.004,'darkwood');
      }
      // Actual applied straps leave the timber visible between them, rather
      // than replacing every exposed end with a uniform thick gilt square.
      for(const side of [-1,1]) {
        box(side*(w-border)*.5,0,0,border,h,.012,'oldgold');
        box(0,side*(h-border)*.5,0,w-border*2,border,.012,'oldgold');
      }
      if(detail) {
        flower(0,0,.020,Math.min(w,h)*.36,'gold');
        g.chasedPetal ||= new T.SphereGeometry(1,6,3);
        for(let j=0;j<8;j++){
          const a=j*PI/4,r=Math.min(w,h)*.32;
          draw(g.chasedPetal,'gold',[Math.cos(a)*r,Math.sin(a)*r,.025],[w*.14,h*.075,.003],[0,0,a]);
        }
        for(const sx of [-1,1])for(const sy of [-1,1])
          draw(g.nail,'oldgold',[sx*(w*.5-border),sy*(h*.5-border),.021],[border*.42,border*.42,.006]);
      }
    });
  }

  // Explicit reference10 near-column prototype. This is not a general hall
  // radius change: the source shoe, foot and upper low-roof bearing datum stay.
  function assertReference10NearParent(referenceMode) {
    const expected=new T.Matrix4().makeScale(.6,.6,.6).setPosition(-13.840726762,0,22.584909603999996);
    if(referenceMode!=='reference10'||!stack?.length||stack.at(-1).elements.some((x,i)=>Math.abs(x-expected.elements[i])>1e-10))
      throw new RangeError('The near column requires the unchanged reference10 threshold parent.');
  }
  let nearColumnShaft;
  const nearColumnRecords=new WeakSet();
  function assertReference10NearSeats(seats) {
    // Frozen26 actual seat metadata, not a second generator or a free fit.
    const plans=[[-4.551264774551861,-.8285046000970127,-8.210607724861397,-6.401085116919031,-8.461373848118388,-6.236414684155104,-4.8020308978088515,-.6638341673330856],
      [-8.932122063333328,-1.8500000000000014,-3.7654553966666704,-1.8500000000000014,-3.7654553966666704,-2.1499999999999986,-8.932122063333328,-2.1499999999999986]];
    if(!Array.isArray(seats)||seats.length!==2||seats.some((s,i)=>!Array.isArray(s?.plan)||s.plan.length!==4||s.plan.some(p=>!Array.isArray(p)||p.length!==2)||s.plan.flat().some((v,j)=>!Number.isFinite(v)||Math.abs(v-plans[i][j])>1e-10)||!Number.isFinite(s.bottomY)||!Number.isFinite(s.topY)||Math.abs(s.bottomY-4.904133656269012)>1e-10||Math.abs(s.topY-5.237466989602345)>1e-10))
      throw new RangeError('The near column requires the exact unchanged26 paired low-frame seats before emitting.');
  }
  function freezeNearRecord(value){if(value&&typeof value==='object'){for(const child of Object.values(value))freezeNearRecord(child);Object.freeze(value);}return value;}

  function buildReference10NearShaft() {
    if(nearColumnShaft)return nearColumnShaft;
    const base=g.column,pp=base.attributes.position,nn=base.attributes.normal,tt=base.attributes.uv;
    const ys=[0,.06,.23,.48,.69],guard=pp.getY(5),shoe=.4401600022315979;
    const controls=[shoe,.75,1.5,2.3,2.8188],offsets=[0,.017150398395269908,.02473386817136323,.032622433959095594,0],
      derivatives=[0,.018908034800151883,.009985775307976799,0,0];
    const addAt=worldY=>{
      if(worldY<=shoe||worldY>=controls.at(-1))return[0,0];
      let i=0;while(worldY>controls[i+1])i++;
      const h=controls[i+1]-controls[i],t=(worldY-controls[i])/h,a=offsets[i],b=offsets[i+1],m=derivatives[i],n=derivatives[i+1];
      return[(2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*h*m+(-2*t**3+3*t*t)*b+(t**3-t*t)*h*n,
        ((6*t*t-6*t)*a+(-6*t*t+6*t)*b)/h+(3*t*t-4*t+1)*m+(3*t*t-2*t)*n];
    };
    const rings=[...new Set([0,...ys.slice(1).map(y=>Math.fround(y)),...controls.slice(0,-1).map(y=>(y-.252)/3.72),
      ...Array.from({length:65},(_,i)=>(shoe+(2.8188-shoe)*i/64-.252)/3.72)].filter(y=>y<guard).map(y=>+y.toFixed(12))),guard].sort((a,b)=>a-b);
    const positions=[],normals=[],uv=[],ring=[],axis=new T.Vector3(-5.5,0,-2).applyMatrix4(stack.at(-1));let maximumRadius=0;
    for(const y of rings){let j=1;while(j<ys.length-1&&y>pp.getY(j+1))j++;
      const y0=pp.getY(j),y1=pp.getY(j+1),t=(y-y0)/(y1-y0),worldY=.252+3.72*y,
        [offset,derivative]=y===guard?[0,0]:addAt(worldY),delta=offset/.192,dSlope=derivative*3.72/.192;
      ring.push(Array.from({length:49},(_,k)=>{const a=k*9+j,b=a+1,p=new T.Vector3().fromBufferAttribute(pp,a).lerp(new T.Vector3().fromBufferAttribute(pp,b),t),
        n=new T.Vector3().fromBufferAttribute(nn,a).lerp(new T.Vector3().fromBufferAttribute(nn,b),t),u=new T.Vector2().fromBufferAttribute(tt,a).lerp(new T.Vector2().fromBufferAttribute(tt,b),t),r=Math.hypot(p.x,p.z);
        if(offset!==0||derivative!==0){p.x*=1+delta/r;p.z*=1+delta/r;n.y-=dSlope*Math.hypot(n.x,n.z);n.normalize();}
        p.y=y;maximumRadius=Math.max(maximumRadius,Math.hypot(Math.fround(Math.fround(p.x)*.192+axis.x)-axis.x,Math.fround(Math.fround(p.z)*.192+axis.z)-axis.z));return{p,n,u};}));
    }
    const tri=(a,b,c)=>{for(const q of[a,b,c]){positions.push(...q.p.toArray());normals.push(...q.n.toArray());uv.push(...q.u.toArray());}};
    for(let i=0;i+1<rings.length;i++)for(let k=0;k<48;k++){tri(ring[i][k],ring[i][k+1],ring[i+1][k]);tri(ring[i+1][k+1],ring[i+1][k],ring[i][k+1]);}
    for(const [row,sign]of[[0,-1],[rings.length-1,1]])for(let k=0;k<48;k++){
      const cap=q=>({p:q.p,n:new T.Vector3(0,sign,0),u:new T.Vector2(q.p.x,q.p.z)}),a=cap(ring[row][k]),b=cap(ring[row][k+1]),c={p:new T.Vector3(0,rings[row],0),n:new T.Vector3(0,sign,0),u:new T.Vector2(0,0)};
      if(sign<0)tri(c,b,a);else tri(c,a,b);
    }
    const lower=new T.BufferGeometry();lower.setAttribute('position',new T.Float32BufferAttribute(positions,3));lower.setAttribute('normal',new T.Float32BufferAttribute(normals,3));lower.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    lower.userData.architectureJoint='reference10-near-column27-bounded-shaft';
    nearColumnShaft={lower,maximumRadius:maximumRadius*(1+Number.EPSILON),guardY:guard*3.72+.252,controls,offsets,derivatives};return nearColumnShaft;
  }
  function reference10NearColumn({referenceMode,porchColumnSeats}={}) {
    assertReference10NearParent(referenceMode);
    assertReference10NearSeats(porchColumnSeats);
    footColumn(-5.5,-2,.12,6.2,.32,{referenceMode,plainShoe:true,porchColumnSeats,reference10NearHead:true});
    const x=-5.5,z=-2,s=1.05,rootBottom=6.71,rootTop=6.91,rootLap=6.81;stats.bracketSets++;
    const member=(geometry,role,rotation=0)=>{geometry.userData.architectureJoint='reference10-near-column27-'+role;draw(geometry,'red',[x,0,z],[1,1,1],[0,rotation,0]);};
    member(joineryBox(1.4,.22,rootBottom,rootTop,[{x:0,width:.22,side:'top',y:rootLap}]),'root-x-girder');
    member(joineryBox(1.3,.22,rootBottom,rootTop,[{x:0,width:.22,side:'bottom',y:rootLap}]),'root-z-girder',PI/2);
    // The old high beam remains an unchanged solid and still supports every
    // original suspension. Small actual timber pads bear the cut trim ends.
    for(const offset of[-.82,1.07]){const geo=new T.BoxGeometry(.14,.04,.48);geo.userData.architectureJoint='reference10-near-column27-rail-end-bearer';draw(geo,'darkwood',[x+offset,6.73,z],[1,1,1]);}
    const profile=buildReference10NearShaft();
    const record={kind:'reference10-near-column27',referenceMode,nearColumn:[x,z],shaftMaximumWorldRadius:profile.maximumRadius,
      fixedShoeTopWorldY:.4401600022315979,protectedProfileRingWorldY:profile.guardY,
      retainedSupportBeam:{centerX:0,centerZ:-2,bottomY:6.39,topY:6.71,width:24,depth:.4},
      frontRailCut:{minX:x-.75,maxX:x+1,y:6.78,z:-2,w:24,h:.06,d:.48},
      roofReceivers:[['front',z-.415*s],['rear',z+.415*s]].map(([name,cz])=>({name,minX:x-.7,maxX:x+.7,minZ:cz-.05/.6,maxZ:cz+.05/.6,rootTop})),
      originalSideIntervalsAreManual:true,lowerSideResidualRetained:true};
    nearColumnRecords.add(record);return freezeNearRecord(record);
  }
  function reference10NearColumnRoofReceivers({nearColumn,roofSurfaces}={}) {
    assertReference10NearParent(nearColumn?.referenceMode);
    if(!nearColumnRecords.has(nearColumn)||nearColumn?.kind!=='reference10-near-column27'||!Array.isArray(roofSurfaces)||!roofSurfaces.length)
      throw new RangeError('Near roof receivers need the actual retained roof backing and timber emissions.');
    const parent=stack.at(-1),inverse=parent.clone().invert(),faces=[];
    if(!roofSurfaces.some(s=>s.kind==='backing')||!roofSurfaces.some(s=>s.kind==='timber'))throw new RangeError('Both actual old backing and real timber are required.');
    const area=poly=>poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
    const clip=(poly,evalLine)=>{const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=evalLine(a),db=evalLine(b);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}return out.filter((p,i)=>!i||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>1e-12);};
    const insideLines=poly=>poly.map((a,i)=>{const b=poly[(i+1)%poly.length];return p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);});
    for(const [sourceId,source]of roofSurfaces.entries()){
      if(!source.geometry?.attributes?.position||source.geometry.attributes.position.itemSize!==3||!source.matrixWorld?.isMatrix4||source.matrixWorld.elements.some(v=>!Number.isFinite(v))||!['backing','timber'].includes(source.kind))throw new RangeError('Roof receiver input is not an actual positioned roof emission.');
      if(Array.from(source.geometry.attributes.position.array).some(v=>!Number.isFinite(v))||(source.geometry.index?.count??source.geometry.attributes.position.count)%3!==0)throw new RangeError('Roof surfaces need finite complete real triangles.');
      const p=source.geometry.attributes.position,ix=source.geometry.index,matrix=inverse.clone().multiply(source.matrixWorld);
      for(let i=0,N=ix?.count??p.count;i<N;i+=3){const q=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+k):i+k).applyMatrix4(matrix)),n=q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0]));if(Math.abs(n.y)<1e-12)continue;
        let poly=q.map(v=>[v.x,v.z]);if(area(poly)<0)poly.reverse();const plane=[-n.x/n.y,-n.z/n.y,n.dot(q[0])/n.y];faces.push({poly,plane,sourceId,triangle:i/3,kind:source.kind,minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),minZ:Math.min(...poly.map(p=>p[1])),maxZ:Math.max(...poly.map(p=>p[1]))});}
    }
    const height=(f,p)=>f[0]*p[0]+f[1]*p[1]+f[2],records=[],pending=[];
    for(const spec of nearColumn.roofReceivers){const {name,minX,maxX,minZ,maxZ,rootTop}=spec,R=[[minX,minZ],[maxX,minZ],[maxX,maxZ],[minX,maxZ]],lines=insideLines(R),near=faces.filter(f=>f.maxX>minX&&f.minX<maxX&&f.maxZ>minZ&&f.minZ<maxZ);let cells=[];
      for(const face of near.filter(f=>f.kind==='backing')){let poly=face.poly;for(const line of lines)poly=clip(poly,line);if(poly.length>=3&&area(poly)>1e-14)cells.push({poly,plane:face.plane,sourceId:face.sourceId,triangle:face.triangle,kind:face.kind});}
      const fullArea=(maxX-minX)*(maxZ-minZ),initialArea=cells.reduce((s,c)=>s+area(c.poly),0);
      if(Math.abs(initialArea-fullArea)>1e-8)throw new Error('The real darkwood roof does not cover this finite receiver footprint exactly.');
      for(const face of near.filter(f=>f.kind==='timber')){const next=[],cutLines=insideLines(face.poly);for(const cell of cells){
        if(cell.poly.every(p=>p[0]<=face.minX)||cell.poly.every(p=>p[0]>=face.maxX)||cell.poly.every(p=>p[1]<=face.minZ)||cell.poly.every(p=>p[1]>=face.maxZ)){next.push(cell);continue;}
        let overlap=cell.poly;for(const line of cutLines){overlap=clip(overlap,line);if(overlap.length<3)break;}
        if(overlap.length<3||area(overlap)<1e-14||overlap.every(p=>height(cell.plane,p)<=height(face.plane,p)+1e-10)){next.push(cell);continue;}
        let rest=cell.poly;for(const line of insideLines(face.poly)){const outside=clip(rest,p=>-line(p));if(outside.length>=3&&area(outside)>1e-14)next.push({...cell,poly:outside});rest=clip(rest,line);if(rest.length<3||area(rest)<1e-14){rest=[];break;}}
        if(rest.length){const difference=p=>height(cell.plane,p)-height(face.plane,p),low=clip(rest,difference),high=clip(rest,p=>-difference(p));
          if(low.length>=3&&area(low)>1e-14)next.push({poly:low,plane:face.plane,sourceId:face.sourceId,triangle:face.triangle,kind:face.kind});
          if(high.length>=3&&area(high)>1e-14)next.push({...cell,poly:high});}
      }cells=next;}
      const finalArea=cells.reduce((s,c)=>s+area(c.poly),0);if(Math.abs(finalArea-fullArea)>1e-8)throw new Error('Actual lower-envelope partition lost or duplicated positive footprint area.');
      const minimumHeight=Math.min(...cells.flatMap(c=>c.poly.map(p=>height(c.plane,p)))),beamTop=minimumHeight-.004/.6,
        beamBottom=name==='front'?rootTop:beamTop-.065/.6;
      if(beamTop-beamBottom<.035/.6||beamBottom<rootTop-1e-8)throw new Error('The untouched actual roof leaves no finite supported receiver section.');
      const centreX=(minX+maxX)/2,centreZ=(minZ+maxZ)/2;
      const emitBox=(w,h,d,x,y,z,role)=>{const geometry=new T.BoxGeometry(w,h,d);geometry.userData.architectureJoint='reference10-near-column27-'+name+'-'+role;pending.push(()=>draw(geometry,'red',[x,y,z],[1,1,1]));};
      emitBox(maxX-minX,beamTop-beamBottom,maxZ-minZ,centreX,(beamTop+beamBottom)/2,centreZ,'receiver-body');
      if(name==='rear')emitBox(.22,beamBottom-rootTop,maxZ-minZ,centreX,(beamBottom+rootTop)/2,centreZ,'support-post');
      // Select broad interior real source patches. The receiver body remains
      // below EVERY old roof face in its footprint; these few closed pads
      // supply positive bearing without filling the complete rafter voids.
      const candidates=cells.map((c,cellId)=>{let poly=c.poly;
        for(let i=0;i<c.poly.length;i++){const a=c.poly[i],b=c.poly[(i+1)%c.poly.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<1e-10)continue;poly=clip(poly,p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])-.002/.6*len);if(poly.length<3)break;}
        const planArea=poly.length>=3?area(poly):0,centre=poly.length?poly.reduce((a,p)=>[a[0]+p[0]/poly.length,a[1]+p[1]/poly.length],[0,0]):[0,0];return{...c,cellId,poly,planArea,centre};}).filter(c=>c.planArea>1e-4).sort((a,b)=>b.planArea-a.planArea);
      const chosen=[];for(const kind of['backing','timber','timber']){const candidate=candidates.find(c=>c.kind===kind&&!chosen.includes(c)&&(kind==='backing'||chosen.filter(x=>x.kind==='timber').every(x=>Math.abs(x.centre[0]-c.centre[0])>.15/.6)));if(!candidate)throw new Error('The actual roof lacks three broad separated bearing patches.');chosen.push(candidate);}
      const interfaces=[];
      for(const [padId,cell]of chosen.entries()){
        const poly=cell.poly,top=poly.map(p=>[p[0],height(cell.plane,p),p[1]]),bottom=poly.map(p=>[p[0],beamTop,p[1]]),positions=[],uv=[];
        const tri=(a,b,c,normal)=>{const cross=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));if(cross.dot(normal)<0)[b,c]=[c,b];const axes=Math.abs(normal.y)>.5?[0,2]:Math.abs(normal.x)>.5?[2,1]:[0,1];for(const p of[a,b,c]){positions.push(...p);uv.push(p[axes[0]],p[axes[1]]);}};
        const ids=T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(...p)),[]),normal=new T.Vector3(-cell.plane[0],1,-cell.plane[1]).normalize();
        for(const q of ids){tri(...q.map(i=>top[i]),normal);tri(...q.map(i=>bottom[i]),new T.Vector3(0,-1,0));}
        for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length,n=new T.Vector3(poly[j][1]-poly[i][1],0,poly[i][0]-poly[j][0]);tri(bottom[i],bottom[j],top[i],n);tri(bottom[j],top[j],top[i],n);}
        const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.userData.architectureJoint='reference10-near-column27-'+name+'-actual-roof-bearing-pad';pending.push(()=>draw(geometry,'red',[0,0,0],[1,1,1]));
        interfaces.push({padId,sourceId:cell.sourceId,triangle:cell.triangle,kind:cell.kind,planArea:cell.planArea,topPlane:cell.plane,plan:poly});
      }
      records.push({name,fullArea,initialArea,finalArea,envelopeCells:cells.length,minimumHeight,bodyBottom:beamBottom,bodyTop:beamTop,minimumRoofGap:minimumHeight-beamTop,parts:name==='rear'?5:4,interfaces});
    }
    for(const emit of pending)emit();
    return{kind:'reference10-near-column27-actual-roof-receivers',records,retainedRoofChanged:false,limits:['Finite hidden-construction hypothesis under the actual source roof, not historical or rendered acceptance.','Darkwood is an existing two-sided surface, not a newly certified thick closed roof deck.','Every receiver has positive volume and its own bottom support; actual roof inputs must be the once-generated production objects.']};
  }

  function reference10NearColumnFrontRail({nearColumn}={}) {
    assertReference10NearParent(nearColumn?.referenceMode);
    if(!nearColumnRecords.has(nearColumn)||nearColumn?.kind!=='reference10-near-column27'||nearColumn.frontRailCut?.minX!==-6.25||nearColumn.frontRailCut?.maxX!==-4.5)throw new RangeError('The front trim must pair with the actual near-column successor.');
    const {minX,maxX,y,z,w,h,d}=nearColumn.frontRailCut,base=new T.BoxGeometry(1,1,1),pieces=[
      clipTierTimber(base,new T.Plane(new T.Vector3(-1,0,0),minX/w)),
      clipTierTimber(base,new T.Plane(new T.Vector3(1,0,0),-maxX/w))];
    for(const [i,geometry]of pieces.entries()){geometry.userData.architectureJoint='reference10-near-column27-retained-front-rail-'+i;
      // Raw original key, tint and normalized box transform, not the optional
      // architectural oldgold clone. Existing exterior surface UVs survive.
      instance(geometry,'oldgold',0,y,z,w,h,d,null,1);}
    return{kind:'reference10-near-column27-front-rail',parts:2,replacesOriginalFrontRail:true};
  }

  function footColumn(x,z,bottom,h,r=.28,options={}) {
    const square=h<=3.0 && r<=.24;
    const plainShoe=options.plainShoe===true;
    if(plainShoe&&(options.referenceMode!=='reference10'||square||!(h>0&&r>0)))
      throw new RangeError('The plain shoe is an explicit reference10 round-column detail only.');
    const throughSlots=options.throughSlots;
    if(throughSlots) {
      if(square||options.topSlot||!Array.isArray(throughSlots)||throughSlots.length!==4||Math.abs(r-.43)>1e-8||Math.abs(h-5.9)>1e-8||Math.abs(bottom-.3)>1e-8)
        throw new RangeError('Through mortises require a round shaft without a conflicting head slot.');
      let top=bottom+.3,index=0;
      for(const slot of throughSlots) {
        if(Math.abs(slot.bottom-(5.2+index*.4-.085))>1e-8||Math.abs(slot.top-(5.2+index*.4+.085))>1e-8||Math.abs(slot.depth-.38)>1e-8)
          throw new RangeError('Front mortises use the four unchanged paired .38-deep transoms.');
        index++;
        if(![slot.bottom,slot.top,slot.depth].every(Number.isFinite)||!(slot.bottom>top&&slot.top>slot.bottom&&slot.top<bottom+.3+h&&slot.depth>0&&slot.depth<r))
          throw new RangeError('Hall mortises must be sorted, separated and strictly inside the real shaft.');
        top=slot.top;
      }
    }
    if(options.blindSlots) {
      if(!throughSlots||!Array.isArray(options.blindSlots))throw new RangeError('A blind housing requires the paired front through-frame.');
      let top=bottom+.3;
      for(const slot of options.blindSlots) {
        if(![slot.bottom,slot.top,slot.width,slot.endZ].every(Number.isFinite)||!(slot.bottom>top&&slot.top>slot.bottom&&slot.top<bottom+.3+h&&slot.width>0&&slot.width<r*1.1&&slot.endZ<-.2&&slot.endZ>-r*.85&&Math.hypot(slot.width/2,slot.endZ)<r*.95-1e-4&&-slot.endZ>Math.max(...throughSlots.map(s=>s.depth))/2+.005))
          throw new RangeError('Blind side-header housings must remain separated from front through mortises.');
        top=slot.top;
      }
    }
    const nearHead=options.reference10NearHead===true;
    if(nearHead){assertReference10NearParent(options.referenceMode);assertReference10NearSeats(options.porchColumnSeats);if(x!==-5.5||z!==-2||bottom!==.12||h!==6.2||r!==.32||!plainShoe||!options.porchColumnSeats)throw new RangeError('The near-head option is restricted to its paired physical assembly.');}
    stats.columns++;
    if (columns && stack) {
      const matrix=stack[stack.length-1];
      const a=new T.Vector3(x,bottom+.3,z).applyMatrix4(matrix);
      const b=new T.Vector3(x,nearHead?6.39:bottom+h+.3,z).applyMatrix4(matrix);
      const sx=new T.Vector3().setFromMatrixColumn(matrix,0).length();
      const sz=new T.Vector3().setFromMatrixColumn(matrix,2).length();
      columns.push({x:a.x,z:a.z,bottom:a.y,top:b.y,
        radius:nearHead?buildReference10NearShaft().maximumRadius:r*(square?Math.SQRT2:1.012)*Math.max(sx,sz)});
    }
    // Same foundation and shaft datum as the old footColumn, so existing
    // rails, floor height, transoms and capital centres remain registered.
    let footGeometry=square?g.squareFoot:g.foot;
    const footRadial=options.footRadial??r*1.38;
    if(!square&&options.containedFoot) {
      // A broader column seats on a real full-width neck without inflating the
      // whole base into adjacent furniture. The footprint is explicitly sized.
      hallFoot ||= turnedProfile([[0,0],[1.17,0],[1.24,.10],[1.24,.25],
        [1.16,.40],[1.06,.44],[1.02,.64],[1,.82],[1,1],[0,1]],32);
      footGeometry=hallFoot;
    }
    draw(footGeometry,'stone',[x,bottom,z],
      square?[r,.30,r]:[footRadial,.30,footRadial],null,.91);
    let shaft=square?g.squareColumn:g.column;
    if(options.topSlot&&!square) {
      const key=[r,h,options.topSlot.bottom,options.topSlot.width].join(':');
      if(!hallShaftSlots.has(key))hallShaftSlots.set(key,hipBirdsmouth(g.column,
        v([0,0,1]),-options.topSlot.width/(2*r),options.topSlot.width/(2*r),
        (options.topSlot.bottom-bottom-.3)/h,false));
      shaft=hallShaftSlots.get(key);shaft.userData.architectureJoint='slotted-hall-column';
    }

    if(nearHead){const near=buildReference10NearShaft();draw(near.lower,'red',[x,bottom+.3,z],[r,h,r]);}
    if(options.porchColumnSeats) {
      if(options.referenceMode!=='reference10'||!plainShoe||Math.abs(x+5.5)>1e-10||Math.abs(z+2)>1e-10||Math.abs(bottom-.12)>1e-10||Math.abs(h-6.2)>1e-10||Math.abs(r-.32)>1e-10)
        throw new RangeError('Porch seats belong only to the unchanged source near-column.');
      let pieces=[shaft];
      for(const seat of options.porchColumnSeats) {
        if(!(seat.bottomY*.6>2.8188+.01&&seat.topY>seat.bottomY&&seat.topY<bottom+.3+h))throw new RangeError('New seats must remain wholly above the exact preserved source-profile ring.');
        let poly=seat.plan.slice(),area=poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[1]-a[1]*b[0];},0);if(area<0)poly.reverse();
        const physical=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],n=new T.Vector3(-(b[1]-a[1]),0,b[0]-a[0]).normalize();return new T.Plane(n,-n.x*a[0]-n.z*a[1]);});
        physical.unshift(new T.Plane(new T.Vector3(0,1,0),-seat.bottomY),new T.Plane(new T.Vector3(0,-1,0),seat.topY));
        const planes=physical.map(p=>new T.Plane(new T.Vector3(p.normal.x*r,p.normal.y*h,p.normal.z*r),p.constant+p.normal.x*x+p.normal.y*(bottom+.3)+p.normal.z*z).normalize());
        pieces=pieces.flatMap(original=>{const out=[];let rest=original;for(const plane of planes){const outside=clipTierTimber(rest,plane.clone().negate());if(outside.attributes.position.count)out.push(outside);rest=clipTierTimber(rest,plane);if(!rest.attributes.position.count)break;}return out;});
      }
      for(let part of pieces){
        if(nearHead){part.computeBoundingBox();const size=part.boundingBox.getSize(new T.Vector3());if(size.x===0||size.y===0||size.z===0)continue;
          part=clipTierTimber(part,new T.Plane(new T.Vector3(0,1,0),Math.fround(-.69)));
          part=clipTierTimber(part,new T.Plane(new T.Vector3(0,-1,0),(6.39-.42)/6.2));
          if(!part.attributes.position.count)continue;
        }
        part.userData.architectureJoint='reference10-preserved-profile-upper-seated-shaft';draw(part,'red',[x,bottom+.3,z],[r,h,r]);}
    } else if(throughSlots) {
      const slots=throughSlots.map(s=>({bottom:s.bottom-bottom-.3,top:s.top-bottom-.3,depth:s.depth}));
      const blindSlots=(options.blindSlots||[]).map(s=>({...s,bottom:s.bottom-bottom-.3,top:s.top-bottom-.3}));
      const key=JSON.stringify([r,h,slots,blindSlots]);
      if(!throughShafts.has(key))throughShafts.set(key,mortisedHallShaft(r,h,slots,blindSlots));
      draw(throughShafts.get(key),'red',[x,bottom+.3,z],[1,1,1]);
    } else draw(shaft,'red',[x,bottom+.3,z],[r,h,r]);
    const footHeight=Math.min(.48,r*.98);
    if(plainShoe) {
      // The original reference10 foreground foot is a plain dark shoe, not
      // four repeated gold badges. This is a thin real sleeve, not a solid
      // black plug coincident with the column. Keep the old shaft and height.
      const gauge=.006,key=[r,h,footHeight,gauge].join(':');
      if(!plainShoes.has(key)) {
        const shaft=[[.985,0],[.996,.06],[1.012,.23],[1.008,.48],[.994,.69],[.972,.88],[.95,1]];
        const radiusAt=y=>{const t=y/h;let i=1;while(i<shaft.length-1&&t>shaft[i][1])i++;
          return r*T.MathUtils.lerp(shaft[i-1][0],shaft[i][0],(t-shaft[i-1][1])/(shaft[i][1]-shaft[i-1][1]));};
        const levels=[0,...shaft.map(p=>p[1]*h).filter(y=>y>0&&y<footHeight),footHeight];
        const profile=levels.map(y=>[radiusAt(y)+gauge,y]);
        profile.push(...levels.slice().reverse().map(y=>[radiusAt(y),y]),profile[0]);
        const geometry=turnedProfile(profile,48);geometry.computeVertexNormals();geometry.userData.architectureJoint='reference10-hollow-plain-shoe';
        geometry.userData.shoeGauge=gauge;geometry.userData.shoeHeight=footHeight;
        plainShoes.set(key,geometry);
      }
      // Lower annulus bears on the original foot's actual Y=bottom+.30 top.
      draw(plainShoes.get(key),'black',[x,bottom+.30,z],[1,1,1]);
    } else {
      draw(square?g.squareShoe:g.collar,'black',[x,bottom+.295,z],
        square?[r,footHeight,r]:[r*1.035,footHeight,r*1.035]);
      if(square)for(const yy of [.315,.295+footHeight-.02])for(const side of [-1,1]) {
        box(x,bottom+yy,z+side*r*1.075,r*2.16,.018,.012,'oldgold');
        box(x+side*r*1.075,bottom+yy,z,.012,.018,r*2.16,'oldgold');
      }
      else for(const yy of [.318,.295+footHeight-.028])
          draw(g.ring,'oldgold',[x,bottom+yy,z],[r*1.09,r*1.09,r*.24],[PI/2,0,0],.88);
      const fine=r>=.3;
      for(let side=0;side<4;side++) {
        const a=side*PI/2;
        group(x,bottom+.3+footHeight*.51,z,a,()=>{
          if(fine) {
            box(0,0,r*1.046,r*.53,footHeight*.68,.015,'oldgold');
            box(0,0,r*1.066,r*.43,footHeight*.57,.012,'black');
            flower(0,0,r*1.08,r*.20,'gold');
          }
        });
      }
    }
    // A through-beam at the neck replaces the old filled decorative collar
    // and four fake tenon stubs; they must not seal or overlap the real joint.
    if(throughSlots||nearHead)return;
    const neck=bottom+h+.20;
    draw(square?g.squareShoe:g.collar,'darkwood',[x,neck-.065,z],
      square?[r*.94,.14,r*.94]:[r*.99,.14,r*.99]);
    if(!square)draw(g.ring,'oldgold',[x,neck+.075,z],[r*1.025,r*1.025,r*.14],[PI/2,0,0],.80);
    // Short tie-beam tenons are visible below the bracket seat, with wooden
    // drawbore pegs. They are not decorative leaves glued to the shaft.
    for(let side=0;side<4;side++) {
      group(x,neck-.10,z,side*PI/2,()=>{
        box(0,0,r*.97,r*.41,.16,r*.18,'endwood');
        draw(g.pin,'darkwood',[0,0,r*1.075],[.020,.020,.040]);
      });
    }
  }

  // Pagoda uses interlocked:true: mortised Daito, real half laps and seated
  // receivers. Default remains the established hall geometry until its own
  // original-photo section dimensions are measured.
  function brackets(x,y,z,s=1,options={}) {
    if(options.interlocked)return interlockedBrackets(x,y,z,s,options);
    stats.bracketSets++;
    const fine=options.detail ?? s>=1;
    const ma=options.material || 'red';
    group(x,y,z,0,()=>{
      const B=(xx,yy,zz,w,h,d,mat=ma)=>box(xx*s,yy*s,zz*s,w*s,h*s,d*s,mat);
      const seat=(xx,yy,zz,w=.27,d=.27)=>
        draw(g.masu,ma,[xx*s,yy*s,zz*s],[w*s,.15*s,d*s]);
      const arm=(xx,yy,zz,length,axis=0)=>
        draw(g.hijiki,ma,[xx*s,yy*s,zz*s],[length*s,.56*s,.21*s],[0,axis,0]);
      // Daito directly seats on the head of the pillar.
      draw(g.masu,ma,[0,-.035*s,0],[.57*s,.23*s,.57*s]);
      B(0,.093,0,.48,.045,.48,'endwood');
      // First pair is half-lapped at the centre. A tiny height stagger makes
      // the two crossing pieces readable without physically separating them.
      arm(0,.165,0,1.04,0); arm(0,.184,0,1.04,PI/2);
      for(const side of [-1,1]) {
        seat(side*.415,.32,0); seat(0,.32,side*.415);
      }
      // Outboard arms now sit ON those four bearing blocks. Each projects
      // out to the next bearing instead of forming a stack of loose ornaments.
      for(const side of [-1,1]) {
        arm(0,.452,side*.415,1.36,0);
        arm(side*.415,.452,0,1.36,PI/2);
      }
      for(const sx of [-1,1])for(const sz of [-1,1]) {
        seat(sx*.415,.60,sz*.415,.25,.25);
      }
      // Twin receiving timbers carry purlin / fascia loads over the capitals.
      for(const side of [-1,1])B(0,.717,side*.415,1.44,.13,.23);
      B(0,.765,0,.25,.11,1.43,'endwood');
      // Mortise cheeks and end-grain cap plates occur at actual beam ends.
      for(let axis=0;axis<2;axis++)group(0,0,0,axis*PI/2,()=>{
        for(const side of [-1,1]) {
          draw(g.tenon,'endwood',[side*.54*s,.165*s,0],[.075*s,.10*s,.17*s],[0,side<0?PI:0,0]);
          squareFitting(side*.586*s,.174*s,0,.17*s,.15*s,side*PI/2,fine);
          for(const branch of [-1,1])
            squareFitting(side*.691*s,.46*s,branch*.415*s,.19*s,.15*s,side*PI/2,fine);
        }
      });
      if(fine) {
        // Discreet bronze nails mark the lap joint in the large bearing faces.
        for(let side=0;side<4;side++)group(0,-.03*s,0,side*PI/2,()=>{
          draw(g.pin,'oldgold',[0,0,.299*s],[.029*s,.029*s,.024*s]);
        });
      }
    });
  }

  function interlockedBrackets(x,y,z,s=1,options={}) {
    stats.bracketSets++;interlocked ||= buildInterlockedBrackets();
    const j=interlocked,ma=options.material||'red',fine=options.detail??s>=1;
    const hs=s*(options.horizontalScale??1);
    group(x,y,z,0,()=>{
      const member=(geometry,xx=0,yy=0,zz=0,axis=0,material=ma)=>
        draw(geometry,material,[xx*hs,yy*s,zz*hs],[hs,s,hs],[0,axis,0]);
      const seat=(xx,yy,zz,w=.27)=>draw(g.masu,ma,[xx*hs,yy*s,zz*hs],[w*hs,.12*s,w*hs]);
      let daito=j.daito;
      if(options.throughBeam) {
        const half=options.throughBeam.depth/(2*hs),seat=(options.throughBeam.top-y)/s;
        const key=[half,seat].join(':');
        if(!hallDaitoSlots.has(key))hallDaitoSlots.set(key,hipBirdsmouth(j.daito,v([0,0,1]),-half,half,seat));
        daito=hallDaitoSlots.get(key);daito.userData.architectureJoint='transfer-saddled-daito';
      }
      member(daito);member(j.firstX,0,.165);member(j.firstZ,0,.184,0,PI/2);
      for(const side of [-1,1]) {
        seat(side*.415,.290,0);seat(0,.309,side*.415);
        member(j.secondZ,side*.415,.4775,0,PI/2);
        member(j.secondX,0,.4965,side*.415);
      }
      for(const sx of [-1,1])for(const sz of [-1,1])seat(sx*.415,.6215,sz*.415,.25);
      for(const side of [-1,1])member(j.receiverX,0,0,side*.415);
      member(j.receiverZ,0,0,0,PI/2,'endwood');
      // Small applied straps fit the true exposed end section, never a gilt
      // square taller than the cut timber. Distant bays omit chased bosses.
      for(let axis=0;axis<2;axis++)group(0,0,0,axis*PI/2,()=>{
        const firstY=axis===0?.165:.184;
        const secondY=axis===0?.4965:.4775;
        for(const side of [-1,1]) {
          squareFitting(side*.6208*hs,(firstY+.02375)*s,0,.21*hs,.15*s,side*PI/2,fine);
          for(const branch of [-1,1])squareFitting(side*.6808*hs,(secondY+.02375)*s,
            branch*.415*hs,.21*hs,.15*s,side*PI/2,fine);
        }
      });
    });
  }

  /** Optional main-hall column and capital replacement. Call this INSTEAD
   * of its old footColumn + brackets pair, never on top. Radius is explicit:
   * reference 4's entrance proportion does not authorize widening the interior
   * reference 6 nave. Height, axes and the existing roof datum remain fixed.
   */
  function hallColumnAssembly({x,z,bottom=.3,height=5.9,radius=.43,
    capitalTop=7.557,shoulderRatio=1.30,baseRadius=.735816,detail=true,transferBeam=false,throughSlots=null,blindSlots=null}={}) {
    const shaftBottom=bottom+.3,shaftTop=shaftBottom+height;
    const verticalScale=(capitalTop-shaftTop)/.97;
    if(!Number.isFinite(x)||!Number.isFinite(z))throw new RangeError('Hall column axes must be finite.');
    if(transferBeam&&Math.abs(shaftTop-6.5)>1e-7)throw new RangeError('Transfer slot requires the unchanged 6.5 column head.');
    if(!(verticalScale>0&&radius>0))throw new RangeError('Hall capital must remain above its column.');
    const columnHeadDiameter=radius*1.9;
    const horizontalScale=columnHeadDiameter*shoulderRatio/.96;
    const capitalY=shaftTop+.15*verticalScale;
    const footRadial=radius>.50?Math.max(baseRadius/1.24,radius*.995):radius*1.38;
    const footOptions=radius>.50?{containedFoot:true,footRadial}:{};
    if(throughSlots){footOptions.throughSlots=throughSlots;footOptions.blindSlots=blindSlots;}
    if(transferBeam)footOptions.topSlot={bottom:6.31,width:.34};
    footColumn(x,z,bottom,height,radius,footOptions);
    interlockedBrackets(x,capitalY,z,verticalScale,
      {horizontalScale:horizontalScale/verticalScale,detail,throughBeam:transferBeam?{depth:.34,top:6.65}:null});
    const matrix=stack?.[stack.length-1],centre=v([x,bottom,z]);
    const worldBase=matrix?centre.applyMatrix4(matrix):centre;
    const scaleX=matrix?new T.Vector3().setFromMatrixColumn(matrix,0).length():1;
    const scaleZ=matrix?new T.Vector3().setFromMatrixColumn(matrix,2).length():1;
    return {kind:'hall-column-assembly',x,z,radius,transferBeam,throughSlots,blindSlots,shaftBottom,shaftTop,capitalY,capitalTop,
      verticalScale,horizontalScale,columnHeadDiameter,shoulderWidth:.96*horizontalScale,
      footRadius:footRadial*1.24,worldBaseCenter:worldBase.toArray(),
      worldFootRadiusX:footRadial*1.24*scaleX,worldFootRadiusZ:footRadial*1.24*scaleZ};
  }


  /** Replace the COMPLETE old front row and its four horizontal bands plus
   * repeated studs. It does not add a second header through the real ceiling.
   * Keep the rear legacy row and the four existing middle assemblies unchanged.
   * Pass all returned columns into sanctuaryCeiling, and its four inner columns
   * into karahafuEntrance, so all receivers share the same measured sections.
   */
  function hallFrontFrame({z=6.8,radius=.43,bottom=.3,height=5.9,capitalTop=7.557,detail=true}={}) {
    if(Math.abs(z-6.8)>1e-8||Math.abs(radius-.43)>1e-8||Math.abs(bottom-.3)>1e-8||Math.abs(height-5.9)>1e-8||Math.abs(capitalTop-7.557)>1e-8)
      throw new RangeError('The front-frame repair preserves the existing hall axes, radius and roof datum.');
    const xs=[-8.6,-5.15,-1.72,1.72,5.15,8.6],columns=[],bands=[];
    const slots=Array.from({length:4},(_,j)=>({bottom:5.2+j*.4-.085,top:5.2+j*.4+.085,depth:.38}));
    const blindSlots=[{bottom:5.17,top:5.39,width:.38,endZ:-.30},{bottom:6.20,top:6.48,width:.44,endZ:-.30}];
    for(const x of xs)columns.push(hallColumnAssembly({x,z,bottom,height,radius,capitalTop,detail,throughSlots:slots,
      blindSlots:Math.abs(x)>8?blindSlots:null}));
    for(let j=0;j<4;j++) {
      const y=5.2+j*.4,geometry=new T.BoxGeometry(18.5,.17,.38);
      geometry.userData.architectureJoint='front-through-transom';
      draw(geometry,j%2?'red':'darkwood',[0,y,z],[1,1,1]);
      bands.push({centerY:y,bottom:y-.085,top:y+.085,depth:.38,width:18.5});
    }
    // Short openwork members are fitted between adjacent real beams, never
    // driven through their middle and never across a round column silhouette.
    const studWidth=.10,studDepth=.10,studZ=z+.14;
    for(let i=-30;i<=30;i++) {
      const x=i*.3;
      if(xs.some(cx=>Math.abs(x-cx)<radius*1.012+studWidth/2+.006))continue;
      for(const [lo,hi] of [[5.685,5.915]]) {
        const geometry=new T.BoxGeometry(studWidth,hi-lo,studDepth);geometry.userData.architectureJoint='front-seated-openwork';
        draw(geometry,'endwood',[x,(lo+hi)/2,studZ],[1,1,1]);
      }
    }
    return {kind:'hall-front-frame',z,columns,entranceSupports:columns.filter(c=>Math.abs(c.x)<6),bands,
      replacesLegacyUpperHeader:true,upperHeader:'sanctuaryCeiling hall-cross-lap',
      requiresCeilingColumnAssemblies:true,sideWallHeaderEndZ:6.5,sideWallClearEndZ:6.28,changesColumnAxes:false,changesHallScale:false};
  }


  /** Four infill doors attach to the real front band and continuous low
   * sill, centred inside the unchanged pillar bays rather than through posts.
   * Replace the old complete four-door loop. The central nave stays open.
   */
  function hallFrontDoors({frontFrame}={}) {
    if(frontFrame?.kind!=='hall-front-frame'||frontFrame.columns?.length!==6||frontFrame.z!==6.8)
      throw new RangeError('Front doors require the paired unchanged front-column frame.');
    const doors=[],z=frontFrame.z,doorBoxes=new Map(),lowerRing=g.ring.clone();lowerRing.computeBoundingBox();
    lowerRing.userData.architectureJoint='front-door-lower-fitting';
    const emitBox=(label,x,y,zz,w,h,d,ma)=>{
      const key=[label,w,h,d].map(v=>typeof v==='number'?v.toFixed(9):v).join(':');
      if(!doorBoxes.has(key)){const geometry=new T.BoxGeometry(w,h,d);geometry.userData.architectureJoint=label;doorBoxes.set(key,geometry);}
      const geometry=doorBoxes.get(key);
      draw(geometry,ma,[x,y,zz],[1,1,1]);
    };
    for(const [left,right] of [[-8.6,-5.15],[-5.15,-1.72],[1.72,5.15],[5.15,8.6]]) {
      const x=(left+right)/2,width=right-left-.96,half=width/2,edge=.08;
      // Raised sill narrows at the floor around the retained circular bases.
      // Its continuous central bearing rests on the actual .335 floor surface.
      const levels=[[.335,.745],[.375,.745],[.42,.69],[.5,.61],[.60,.54],[.605,.48]];
      const outline=levels.map(([y,r])=>[-(right-left)/2+r,y]);
      outline.push(...levels.slice().reverse().map(([y,r])=>[(right-left)/2-r,y]));
      const sill=extrudedProfile(outline,.15,0);sill.userData.architectureJoint='front-door-supported-sill';
      draw(sill,'darkwood',[x,0,z],[1,1,1]);
      for(const side of [-1,1])emitBox('front-door-jamb',x+side*(half-edge/2),(.605+5.115)/2,z,edge,5.115-.605,.15,'darkwood');
      for(const [lo,hi] of [[.605,.765],[4.955,5.115]])emitBox('front-door-rail',x,(lo+hi)/2,z,width-edge*2,hi-lo,.15,'darkwood');
      const insideWidth=width-edge*2;
      emitBox('front-door-panel',x,(.765+4.955)/2,z+.0475,insideWidth,4.955-.765,.055,'black');
      emitBox('front-door-kick-panel',x,(.765+1.465)/2,z+.0875,insideWidth,1.465-.765,.025,'red');
      const gridBottom=1.465,gridTop=4.955,gridWidth=.035,count=10,
        gridXs=Array.from({length:count},(_,i)=>x-insideWidth/2+gridWidth/2+i*(insideWidth-gridWidth)/(count-1));
      for(const xx of gridXs)emitBox('front-door-lattice-upright',xx,(gridBottom+gridTop)/2,z+.081,gridWidth,gridTop-gridBottom,.012,'oldgold');
      for(let j=1;j<19;j++)for(let i=0;i<count-1;i++) {
        const lo=gridXs[i]+gridWidth/2,hi=gridXs[i+1]-gridWidth/2;
        emitBox('front-door-lattice-transverse',(lo+hi)/2,gridBottom+j*(gridTop-gridBottom)/19,z+.081,hi-lo,.028,.012,'oldgold');
      }
      // Retain one small round lower fitting, now tangent to the kick panel.
      draw(lowerRing,'oldgold',[x,1.115,z+.10-lowerRing.boundingBox.min.z*.24],[.24,.24,.24]);
      doors.push({kind:'hall-front-door',bay:[left,right],centerX:x,width,localBounds:[x-half,x+half,.335,5.115,z-.075,z+.1+(lowerRing.boundingBox.max.z-lowerRing.boundingBox.min.z)*.24],
        latticeBounds:[x-insideWidth/2,x+insideWidth/2,gridBottom,gridTop],floorContactY:.335,headerContactY:5.115});
    }
    return doors;
  }


  /** A shallow trace of the visible central gold mass in original reference4.
   * It deliberately contains NO guessed characters, font, OCR, inscription or
   * invented chrysanthemum. Only the coarse outline and one resolved dark hole
   * survive the source's tiny pixel footprint; fine engraving is unresolved.
   * The trace is metal geometry applied directly to a real transverse timber.
   */
  function hallFrontFrieze({frontFrame,centerY=5.6,width=1.45,depth=.009}={}) {
    if(frontFrame?.kind!=='hall-front-frame'||!frontFrame.bands.some(b=>Math.abs(b.centerY-centerY)<1e-8)||
      !(width>0&&width<=2.6&&depth>0&&depth<=.015))throw new RangeError('Front frieze requires a real paired band and bounded shallow relief.');
    const contours=[{"outer":[[-0.0648148,0.5080328],[-0.0714912,0.5],[-0.0574786,0.3666667],[-0.0648148,0.3488774],[-0.0740741,0.351694],[-0.0833333,0.3364],[-0.0925926,0.3756098],[-0.1018519,0.369888],[-0.1111111,0.3821429],[-0.1203704,0.3620513],[-0.1296296,0.3850905],[-0.1388889,0.3850543],[-0.1481481,0.3610606],[-0.1666667,0.3988221],[-0.1759259,0.362619],[-0.1851852,0.3858871],[-0.2037037,0.3740896],[-0.2222222,0.3879455],[-0.2314815,0.3801829],[-0.2407407,0.3592157],[-0.25,0.3603419],[-0.2592593,0.3745671],[-0.2685185,0.3588304],[-0.3055556,0.347275],[-0.3240741,0.3738365],[-0.3333333,0.3353968],[-0.3425926,0.3248136],[-0.3518519,0.3449508],[-0.3611111,0.3272283],[-0.3703704,0.3465534],[-0.3796296,0.342354],[-0.3888889,0.3628472],[-0.4074074,0.3440437],[-0.4166667,0.343876],[-0.4259259,0.3294545],[-0.4351852,0.3271812],[-0.4444444,0.3628889],[-0.4537037,0.3457005],[-0.462963,0.3485833],[-0.4722222,0.3356962],[-0.4907407,0.2875641],[-0.4996423,0.2333333],[-0.4986842,0.1666667],[-0.4907407,0.1094737],[-0.4814815,0.1881481],[-0.4805864,0.1666667],[-0.4904074,0.1],[-0.4879809,0.0333333],[-0.4814815,-0.0318018],[-0.4722222,-0.0724378],[-0.462963,-0.0857971],[-0.4537037,-0.0772789],[-0.4444444,-0.0911494],[-0.4351852,-0.1221795],[-0.4259259,-0.1102439],[-0.4166667,-0.1132051],[-0.4074074,-0.0870303],[-0.3981481,-0.1185455],[-0.3888889,-0.1344444],[-0.3703704,-0.1444156],[-0.3518519,-0.1411111],[-0.3333333,-0.1203604],[-0.3240741,-0.0898925],[-0.3148148,-0.1296],[-0.3055556,-0.1422222],[-0.2962963,-0.1203364],[-0.287037,-0.1537449],[-0.2777778,-0.133037],[-0.2685185,-0.1483041],[-0.2592593,-0.0777236],[-0.25,-0.1272043],[-0.2314815,-0.13],[-0.2222222,-0.1648677],[-0.212963,-0.1581111],[-0.2037037,-0.1673563],[-0.1944444,-0.1330233],[-0.1759259,-0.1604065],[-0.1481481,-0.1825641],[-0.1203704,-0.157551],[-0.0740741,-0.176],[-0.0462963,-0.1518182],[-0.037037,-0.1685106],[-0.0277778,-0.1542857],[-0.0185185,-0.1798582],[0.0092593,-0.1629932],[0.0277778,-0.1770213],[0.037037,-0.192963],[0.0462963,-0.1825],[0.0648148,-0.1844809],[0.0740741,-0.1972727],[0.0833333,-0.1764],[0.0925926,-0.2021818],[0.1018519,-0.1944048],[0.1111111,-0.2017333],[0.1388889,-0.1755],[0.1481481,-0.1959091],[0.1574074,-0.1812766],[0.1666667,-0.1898485],[0.1759259,-0.1657516],[0.1944444,-0.1383333],[0.2037037,-0.1558333],[0.2222222,-0.1617391],[0.25,-0.1408333],[0.2685185,-0.1392821],[0.2777778,-0.1495385],[0.2962963,-0.1530983],[0.3148148,-0.1485128],[0.3240741,-0.1371144],[0.3333333,-0.1451042],[0.3425926,-0.1378125],[0.3518519,-0.1427879],[0.3611111,-0.1238333],[0.3703704,-0.1221705],[0.3796296,-0.1413992],[0.3888889,-0.1493137],[0.3981481,-0.1341026],[0.4021207,-0.1],[0.3981481,-0.02625],[0.4074074,-0.0017333],[0.4166667,-0.0846875],[0.4259259,-0.0920408],[0.4351852,-0.0769591],[0.4417016,-0.0333333],[0.4537037,0.0170175],[0.463378,0.1],[0.4659357,0.1666667],[0.447739,0.3],[0.4351852,0.3433846],[0.4259259,0.3888485],[0.4166667,0.3801307],[0.4074074,0.3426316],[0.3981481,0.338125],[0.3888889,0.3639801],[0.3796296,0.3654054],[0.3703704,0.3882854],[0.3611111,0.3838129],[0.3518519,0.3951299],[0.3240741,0.3822154],[0.3148148,0.392],[0.3014275,0.3666667],[0.3148148,0.3233333],[0.3175154,0.3],[0.3215753,0.2333333],[0.3309407,0.1666667],[0.3240741,0.0901852],[0.3167854,0.0333333],[0.3055556,0.0017255],[0.287037,0.0224837],[0.2855591,0.0333333],[0.2848075,0.1],[0.2808239,0.1666667],[0.2777778,0.1903125],[0.2685185,0.2065278],[0.2640058,0.2333333],[0.2706569,0.3],[0.2777778,0.3387571],[0.2869259,0.3666667],[0.2777778,0.3989542],[0.25,0.3936343],[0.2407407,0.3828326],[0.2222222,0.3994292],[0.1944444,0.3831989],[0.1759259,0.3871875],[0.1574074,0.3627536],[0.1481481,0.377978],[0.1203704,0.3801149],[0.1111111,0.3921384],[0.0925926,0.3651355],[0.0833333,0.3676389],[0.0740741,0.3921088],[0.0648148,0.3832836],[0.0555556,0.3986458],[0.037037,0.3605674],[0.0185185,0.4043532],[0.0092593,0.4026205],[0.0,0.4197842],[-0.0092593,0.3958034],[-0.0185185,0.4105042],[-0.0462963,0.3503922],[-0.0532828,0.3666667],[-0.0520172,0.4333333],[-0.048287,0.5],[-0.0555556,0.5090464]],"holes":[[[-0.0092593,0.1772222],[-0.0185185,0.12875],[-0.0208848,0.1],[-0.0207216,0.0333333],[-0.0185185,-0.0366061],[-0.0149471,-0.0333333],[-0.0092593,-0.0094444],[-0.0074393,0.1666667]]]}];
    const points=contours.flatMap(c=>c.outer),minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),
      minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    const scale=width/(maxX-minX),height=(maxY-minY)*scale*15/108,parts=[];
    if(height>.16)throw new RangeError('Photo-traced gold must remain on the actual .17-high beam face.');
    for(const contour of contours) {
      const map=p=>new T.Vector2((p[0]-(minX+maxX)/2)*scale,(p[1]-(minY+maxY)/2)*scale*15/108);
      const shape=new T.Shape(contour.outer.map(map));
      for(const hole of contour.holes)shape.holes.push(new T.Path(hole.map(map)));
      const geometry=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:1});
      geometry.userData.architectureJoint='front-original-traced-gold';
      geometry.userData.source='original reference4 central gold contour, no transcription';
      draw(geometry,'oldgold',[0,centerY,frontFrame.z+.19],[1,1,1]);parts.push(geometry);
    }
    return {kind:'hall-front-frieze',width,height,depth,centerY,supportFaceZ:frontFrame.z+.19,
      sourceCrop:[581,390,689,405],resolvedDetail:'coarse gold silhouette and one dark hole only',transcribedText:null,usesFont:false,parts};
  }

  function tileEnd(p,angle,r=.078,detail=true) {
    const rot=[0,angle,0],n=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
    draw(g.tileSeal,'slate',p.toArray(),[r,r,r],rot,.88);
    const face=p.clone().addScaledVector(n,r*.19);
    draw(g.ring,'tileEdge',face.toArray(),[r*.82,r*.82,r*.42],rot,.82);
    if(detail) {
      const mark=face.clone().addScaledVector(n,.0015);
      flower(mark.x,mark.y,mark.z,r*.56,'oldgold',rot,.87);
    }
  }

  /** Replace only the old hipRoof soffit/rafter/eave loop, after roof backing.
   * Keep existing surface tile mesh, hip ridge and central ridge in world.js.
   * evalP is the existing roof-local sampler and must return a Vector3.
   */
  function eaves({w,d,evalP,roofOrigin=[0,0,0],detail=true,separateTiers=false,hipSeat=null,opening=null,timberSeats=[]}) {
    const openings=Array.isArray(opening)?opening:opening?[opening]:[],tierClip=openings.some(o=>o.tierCollar);
    const inOpening=(p,margin=0)=>openings.some(o=>p.x>=o.minX-margin&&p.x<=o.maxX+margin
      &&p.z>=o.minZ-margin&&p.z<=(o.maxZ??Infinity)+margin);
    const clip=tierClip?clipTierTimber:clipTimber;
    const eaveSweep=Array.isArray(opening)?closedArchitectureTimberSweep:timberSweep;
    const wood=(geometry,material,shade)=>{
      if(Array.isArray(opening))geometry.userData.architectureMember='gallery-eave-timber';
      let pieces=roofTimberOutsideOpening(geometry,opening);
      for(const seat of timberSeats)pieces=pieces.flatMap(piece=>architectureTimberOutsideSeat(piece,seat));
      for(const piece of pieces)draw(tierClip?conformTierTimber(piece):piece,material,[0,0,0],[1,1,1],null,shade);
    };
    for(let face=0;face<4;face++) {
      stats.roofFaces++;
      const angle=face===0?0:face===1?PI:face===2?PI/2:-PI/2;
      const count=Math.max(4,Math.round((face<2?w:d)/.29));
      const denseCount=Math.max(8,Math.round((face<2?w:d)/.17));
      for(let i=1;i<denseCount;i++) {
        const u=-1+2*i/denseCount;
        // Rafters retain their transverse coordinate. The hip cuts their inner ends;
        // they do not point radially at the roof apex.
        const sample=(t,extra=0)=>evalP(face,t,Math.max(-1,Math.min(1,u/t)),extra);
        const makeRafter=(main)=>{
          const lo=Math.max(main?.705:.875,Math.abs(u)+.022),hi=main?.993:1.024;
          if(lo>=hi)return null;
          const frames=[];
          for(let j=0;j<=12;j++){
            const t=lo+(hi-lo)*j/12;
            const tangent=sample(t+.0001).sub(sample(t-.0001)).normalize();
            const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
            const up=new T.Vector3().crossVectors(tangent,side).normalize();
            const centre=sample(t);centre.y-=main?.36:.205;
            frames.push({centre,tangent,side,up});
          }
          return rafterSectionSweep(frames,main?.110:.080,main?.14:.085,{capStart:true,capEnd:true,bevel:.004});
        };
        for(const main of [true,false]){const geo=makeRafter(main);if(geo){wood(geo,main?'cedar':'endwood');stats.rafters++;}}
        const tip=sample(1.024);tip.y-=.205;
        const tangent=sample(1.0241).sub(sample(1.0239)).normalize();
        const side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize();
        const q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(side,up,tangent));
        draw('box','oldgold',tip.toArray(),[.078,.080,.007],q,.84);
        const mainEnd=sample(.993);mainEnd.y-=.36;
        draw('box','oldgold',mainEnd.toArray(),[.108,.138,.008],q,.82);
        if(i%2===0){const mark=mainEnd.clone().addScaledVector(tangent,.005);flower(mark.x,mark.y,mark.z,.035,'gold',q,.88);} 
      }
      // Continuous thick ring purlins take the short rafters, leaving small real
      // rectangular voids between wood members rather than a broad fan cavity.
      for(const t of [.755,.895]){
        const points=[];
        for(let j=0;j<=24;j++){const p=evalP(face,t,-1+2*j/24);p.y-=.49;points.push(p.toArray());}
        wood(eaveSweep(points,.21,.25),'red');
      }
      // Broad, square-section fascia follows the reference's sweep. Thin gold
      // framing is restricted to the lower molding and exposed primary ends.
      const lower=[],upper=[],molding=[];
      for(let j=0;j<=36;j++) {
        const p=evalP(face,1.004,-1+2*j/36);p.y-=.145;
        lower.push(p.toArray()); upper.push([p.x,p.y+.10,p.z]);
        molding.push([p.x,p.y-.098,p.z]);
      }
      wood(eaveSweep(lower,.115,.18),'red');
      wood(eaveSweep(upper,.105,.075),'darkwood');
      wood(eaveSweep(molding,.122,.018),'oldgold',.80);
      // The round terminal row belongs to the ceramic tile spacing, not the
      // rafter spacing. Alternate flat rain channels remain visible between it.
      const tiles=Math.max(5,Math.round((face<2?w:d)/.255));
      for(let i=0;i<=tiles;i++) {
        const p=evalP(face,1.014,-1+2*i/tiles);p.y-=.006;
        if(opening?.woodOnly||!inOpening(p,.08)){tileEnd(p,angle,.077,detail); stats.tileEnds++;}
      }
    }
    // Four uninterrupted diagonal hip-support timbers meet the fascia corners.
    for(const face of [0,1])for(const side of [-1,1]) {
      const pts=[];
      for(let j=0;j<=22;j++) {
        const p=evalP(face,.28+.75*j/22,side);p.y-=.365;pts.push(p.toArray());
      }
      let hip=eaveSweep(pts,.30,.34);
      if(hipSeat) {
        const curve=new T.CatmullRomCurve3(pts.map(p=>v(p)));
        const frames=Array.from({length:25},(_,j)=>{
          const centre=curve.getPoint(j/24),tangent=curve.getTangent(j/24).normalize();
          const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
          return {centre,tangent,side,up:new T.Vector3().crossVectors(tangent,side).normalize()};
        });
        hip=rafterSectionSweep(frames,.30,.34,{capStart:true,capEnd:true,bevel:.0075});
        const direction=v([pts.at(-1)[0],0,pts.at(-1)[2]]).normalize();
        const centre=v([Math.sign(direction.x)*hipSeat.width/2,0,Math.sign(direction.z)*hipSeat.depth/2]).dot(direction);
        const half=hipSeat.purlinWidth/Math.SQRT2+.11;
        hip=opening?.tierCollar?tierHipBirdsmouth(hip,direction,centre-half,centre+half,hipSeat.top):hipBirdsmouth(hip,direction,centre-half,centre+half,hipSeat.top);
        hip.userData.architectureMember='seated-hip';
      }
      wood(hip,'red');
      const end=v(pts[pts.length-1]),tangent=end.clone().sub(v(pts[pts.length-2])).normalize();
      const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),tangent);
      if(hipSeat) {
        const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
        const up=new T.Vector3().crossVectors(tangent,side).normalize();
        q.setFromRotationMatrix(new T.Matrix4().makeBasis(side,up,tangent));
      }
      const tip=end.clone().addScaledVector(tangent,.014);
      draw('box','oldgold',tip.toArray(),[.292,.332,.012],q);
      const flowerPoint=tip.clone().addScaledVector(tangent,.012);
      flower(flowerPoint.x,flowerPoint.y,flowerPoint.z,.116,'gold',q);
    }
  }

  /** In the main hall group at (6,3.1,-11), replace the three old transfer
   * beam/bracket statements. Posts and the high capitals already carry load.
   */
  function legacySanctuaryTransferBeam({frameZ=-2.8}={}) {
    group(0,0,frameZ,0,()=>{
    box(0,6.48,0,11.0,.34,.34,'red');
    box(0,6.685,0,11.18,.075,.40,'darkwood');
    // The reference's crossbeam has a continuous shallow gilt foliate frieze,
    // not a bare red plank and not a row of projecting flower medallions.
    for(const front of [-1,1])group(0,6.48,front*.179,front<0?PI:0,()=>{
      box(0,0,0,9.65,.205,.014,'darkwood');
      for(const edge of [-1,1])box(0,edge*.105,.012,9.71,.012,.015,'oldgold');
      for(let bay=-4;bay<=4;bay++) {
        const x=bay*1.055,mirror=bay%2?-1:1;
        draw(g.friezeStem,'oldgold',[x,0,.024],[.97,.81,.45],[0,0,mirror<0?PI:0]);
        for(let k=0;k<5;k++) {
          const xx=-.36+k*.155,yy=Math.sin((xx+.1)*5)*.030;
          const dir=(k%2?1:-1)*mirror;
          draw(g.friezeLeaf,k%2?'gold':'oldgold',[x+xx,yy,.025],
            [.13,.105,.18],[0,0,dir<0?PI+.35:-.35],.92);
        }
      }
    });
    // A lower tie, with projecting wedged tenons, rather than a single deep
    // black slab that hides the principal ceiling in the reference view.
    for(const side of [-1,1]) {
      box(side*5.15,6.48,0,.66,.37,.39,'red');
      draw(g.tenon,'endwood',[side*5.59,6.48,0],[.20,.24,.26],[0,side<0?PI:0,0]);
      squareFitting(side*5.70,6.48,0,.25,.23,side*PI/2,true);
      for(const front of [-1,1]) {
        draw(g.pin,'darkwood',[side*5.10,6.48,front*.207],[.032,.032,.045],[0,front<0?PI:0,0]);
      }
    }
    });
  }

  function sanctuaryTransferBeam({frameZ=-2.8,columnAssemblies=[]}={}) {
    const paired=columnAssemblies.filter(c=>c.transferBeam&&Math.abs(c.z-frameZ)<1e-7&&Math.abs(Math.abs(c.x)-5.15)<1e-7);
    if(!paired.length)return legacySanctuaryTransferBeam({frameZ});
    if(paired.length!==2)throw new Error('The transfer requires both matching slotted columns.');
    group(0,0,frameZ,0,()=>{
      box(0,6.48,0,11.0,.34,.34,'red');
      // Applied top molding stops at the true upper arms. It does not pass
      // through the capital like the old full-width black box.
      const inner=Math.min(...paired.map(c=>Math.abs(c.x)-.62*c.horizontalScale));
      box(0,6.685,0,inner*2,.075,.40,'darkwood');
      const faceWidth=2*Math.min(...paired.map(c=>Math.abs(c.x)-c.radius-.012));
      for(const front of [-1,1])group(0,6.48,front*.179,front<0?PI:0,()=>{
        box(0,0,0,faceWidth,.205,.014,'darkwood');
        for(const edge of [-1,1])box(0,edge*.105,.012,faceWidth,.012,.015,'oldgold');
        for(let bay=-4;bay<=4;bay++) {
          const x=bay*1.055,mirror=bay%2?-1:1;
          draw(g.friezeStem,'oldgold',[x,0,.024],[.97,.81,.45],[0,0,mirror<0?PI:0]);
          for(let k=0;k<5;k++) {
            const xx=-.36+k*.155,yy=Math.sin((xx+.1)*5)*.030,dir=(k%2?1:-1)*mirror;
            draw(g.friezeLeaf,k%2?'gold':'oldgold',[x+xx,yy,.025],[.13,.105,.18],[0,0,dir<0?PI+.35:-.35],.92);
          }
        }
      });
      for(const side of [-1,1]) {
        // A real narrow tenon emerges from the column's transverse slot.
        // The former red collar box intersecting the solid post is omitted.
        draw(g.tenon,'endwood',[side*5.59,6.48,0],[.20,.24,.26],[0,side<0?PI:0,0]);
        squareFitting(side*5.70,6.48,0,.25,.23,side*PI/2,true);
      }
    });
    return {kind:'sanctuary-transfer',joinedColumns:2,beamY:6.48,beamDepth:.34,beamHeight:.34};
  }

  /** Replace the old coffer rosette loop AND its two gold lattice loops.
   * Retain structural depth, open nave and load paths. Only the two narrow
   * painted ceiling strips visible in reference 6 receive floral panels.
   */
  function paintedCeilingPanel(x,y,z,r=.30,variant=0,clearances=[]) {
    const part=(geo,ma,xx,zz,sx,sy,angle=0,layer=0)=>{
      const yy=y-layer*.0007;
      if(!clearances.length)return draw(geo,ma,[xx,yy,zz],[sx,sy,1],[PI/2,0,angle]);
      const matrix=new T.Matrix4().compose(new T.Vector3(xx,yy,zz),
        new T.Quaternion().setFromEuler(new T.Euler(PI/2,0,angle)),new T.Vector3(sx,sy,1));
      geo.computeBoundingBox();const bounds=geo.boundingBox.clone().applyMatrix4(matrix);
      const cuts=clearances.filter(([x0,x1,z0,z1])=>bounds.min.x<x1&&bounds.max.x>x0&&bounds.min.z<z1&&bounds.max.z>z0);
      if(!cuts.length)return draw(geo,ma,[xx,yy,zz],[sx,sy,1],[PI/2,0,angle]);
      let pieces=[geo.clone().applyMatrix4(matrix)];
      for(const [x0,x1,z0,z1] of cuts) {
        const next=[];
        for(const p of pieces) {
          const left=new T.Plane(new T.Vector3(-1,0,0),x0),right=new T.Plane(new T.Vector3(1,0,0),-x1);
          const middle=clipTimber(clipTimber(p,left.clone().negate(),{cap:false}),right.clone().negate(),{cap:false});
          next.push(clipTimber(p,left,{cap:false}),clipTimber(p,right,{cap:false}),
            clipTimber(middle,new T.Plane(new T.Vector3(0,0,-1),z0),{cap:false}),
            clipTimber(middle,new T.Plane(new T.Vector3(0,0,1),-z1),{cap:false}));
        }
        pieces=next.filter(p=>p.getAttribute('position').count>0);
      }
      if(pieces.length)draw(joinTimberPieces(pieces.map(p=>p.index?p.toNonIndexed():p)),ma,[0,0,0],[1,1,1]);
    };
    // Reference6 has round painted floral medallions, not a metallic gear-star.
    // Flat pigments have no relief height or specular metal response.
    for(let k=0;k<8;k++) {
      const a=k*PI/4+.12,c=Math.cos(a),s=Math.sin(a),xx=x+s*r*.12,zz=z+c*r*.12;
      part(g.paintPetal,'paintOutline',xx,zz,r*.40,r*.83,a,0);
      part(g.paintPetal,k%2===variant?'paintOchre':'paintSienna',xx,zz,r*.33,r*.76,a,1);
      const b=a+PI/8;
      part(g.paintLeaf,'paintOlive',x+Math.sin(b)*r*.34,z+Math.cos(b)*r*.34,r*.30,r*.57,b,2);
      part(g.paintPetal,'paintIvory',x+s*r*.16,z+c*r*.16,r*.14,r*.40,a,3);
    }
    part(g.paintDisc,'paintOutline',x,z,r*.235,r*.235,0,4);
    part(g.paintDisc,'paintOchre',x,z,r*.205,r*.205,0,5);
    part(g.paintDisc,'paintIvory',x,z,r*.072,r*.072,0,6);
    for(let k=0;k<8;k++) {
      const a=k*PI/4;
      part(g.paintDisc,'paintOutline',x+Math.sin(a)*r*.13,z+Math.cos(a)*r*.13,r*.025,r*.025,0,6);
    }
    for(const a of [-1,1])for(const b of [-1,1]) {
      const xx=x+a*.245,zz=z+b*.34,angle=Math.atan2(a,b);
      for(const off of [-.48,0,.48]) {
        part(g.paintLeaf,off===0?'paintOchre':'paintOlive',xx,zz,.032,.085,angle+off,1);
      }
      part(g.paintDisc,'paintSienna',xx,zz,.024,.024,0,3);
    }
  }

  function legacySanctuaryCeiling({y=7.22,width=17.4,depth=13.8,frameZ=-2.8,paintedPanels=false}={}) {
    const xs=[-8.6,-5.15,-1.72,1.72,5.15,8.6];
    // The actual backing is recessed above beams, not stuck flush beneath them.
    box(0,y+.24,0,width,.085,depth,'darkwood');
    const zCount=12, step=depth/zCount;
    for(let j=0;j<zCount;j++) {
      const z=-depth/2+(j+.5)*step;
      // Quiet long-grain cedar boards in the dark, undecorated ceiling bays.
      box(0,y+.185,z,width-.10,.045,step-.025,'cedar',0,.82+.045*Math.sin(j*2.19));
    }
    // Primary longitudinal beams align with existing column lines. Their
    // exposed undersides carry narrow black moldings, not broad gold strips.
    for(const x of xs) {
      box(x,y-.015,0,.30,.37,depth+.06,'red');
      box(x,y-.208,0,.33,.032,depth+.08,'darkwood');
    }
    for(const z of [-6.8,frameZ,6.8]) {
      box(0,y-.035,z,width+.10,.35,.31,'red');
      box(0,y-.225,z,width+.15,.035,.35,'darkwood');
      for(const x of xs) {
        // Small square lap-joint cover is on the joint, not every grid cell.
        for(const front of [-1,1])
          squareFitting(x,y-.01,z+front*.165,.22,.24,front<0?PI:0,false);
      }
    }
    for(let j=1;j<zCount;j++) {
      const z=-depth/2+j*step;
      if(Math.abs(z-frameZ)<.18)continue;
      box(0,y+.055,z,width-.10,.16,.082,'endwood');
    }
    // Secondary battens divide each structural bay, visibly narrower and set
    // behind the principal timbers. This supplies the missing scale hierarchy.
    for(let bay=0;bay<xs.length-1;bay++)for(let k=1;k<3;k++) {
      const x=T.MathUtils.lerp(xs[bay],xs[bay+1],k/3);
      box(x,y+.09,0,.060,.11,depth-.12,'endwood');
    }
    for(const side of [-1,1]) {
      // The actual reference has TWO painted square panels across each band.
      // The first reconstruction's single-tile strip was half the required
      // width and too near the central chandelier. These sit inside the same
      // structural bay, displaced toward the aisle rather than moving beams.
      const x=side*4.15;
      for(let j=0;j<zCount;j++)for(const half of [-1,1]) {
        const z=-depth/2+(j+.5)*step;
        const xx=x+half*.445;
        box(xx,y+.115,z,.86,.046,step-.10,'black');
        box(xx,y+.085,z,.78,.018,step-.20,'plaster',0,1.06);
        if(paintedPanels)paintedCeilingPanel(xx,y+.070,z,.30,(j+(half>0?1:0))%2);
        else {
        // Legacy form retained for isolated A/B, not claimed as painted detail.
        draw(g.rosette,'endwood',[xx,y+.070,z],[.30,.30,.016],[PI/2,0,.12],1.08);
        draw(g.rosette,'oldgold',[xx,y+.067,z],[.245,.245,.015],[PI/2,0,0],.94);
        for(const a of [-1,1])for(const b of [-1,1])
          draw(g.rosette,'endwood',[xx+a*.245,y+.071,z+b*.34],[.075,.075,.008],[PI/2,0,a*b*.3],1.0);
        }
        for(const a of [-1,1])for(const b of [-1,1])
          draw(g.pin,'oldgold',[xx+a*.36,y+.068,z+b*(step*.5-.13)],[.023,.023,.020],[PI/2,0,0],.78);
      }
      for(const edge of [-1,1])box(x+edge*.905,y+.045,0,.045,.13,depth,'black');
      box(x,y+.045,0,.045,.13,depth,'black');
    }
  }

  function sanctuaryCeiling({y=7.22,width=17.4,depth=13.8,frameZ=-2.8,
    paintedPanels=false,columnAssemblies=[]}={}) {
    const xs=[-8.6,-5.15,-1.72,1.72,5.15,8.6],zs=[-6.8,frameZ,6.8];
    const joined=columnAssemblies.length>0,clearance=.0002;
    if(!joined)return legacySanctuaryCeiling({y,width,depth,frameZ,paintedPanels});
    // Only an explicitly supplied replacement assembly changes its ceiling
    // joint. A caller cannot accidentally leave new capitals under old slabs.
    for(const c of columnAssemblies)if(c.kind!=='hall-column-assembly'||
      !xs.some(x=>Math.abs(x-c.x)<1e-7)||!zs.some(z=>Math.abs(z-c.z)<1e-7))
      throw new Error('Ceiling capital must lie on a real hall framing axis.');
    const receivers=[];
    for(const c of columnAssemblies) {
      const h=c.horizontalScale;
      for(const side of [-1,1])receivers.push([c.x-.72*h-clearance,c.x+.72*h+clearance,
        c.z+(side*.415-.115)*h-clearance,c.z+(side*.415+.115)*h+clearance]);
      receivers.push([c.x-.125*h-clearance,c.x+.125*h+clearance,
        c.z-.715*h-clearance,c.z+.715*h+clearance]);
    }
    const seatCutsAt=(bottom,top)=>{
      const profile=[[.27,-.5],[.32,-.36],[.43,.13],[.50,.19],[.50,.44],[.47,.5]],cuts=[];
      const radiusAt=t=>{
        for(let i=1;i<profile.length;i++)if(t<=profile[i][1]) {
          const [a,ya]=profile[i-1],[b,yb]=profile[i];return T.MathUtils.lerp(a,b,(t-ya)/(yb-ya));
        }
        return profile.at(-1)[0];
      };
      for(const c of columnAssemblies) {
        const cy=c.capitalY+.6215*c.verticalScale,sy=.12*c.verticalScale;
        const lo=Math.max(-.5,(bottom-cy)/sy),hi=Math.min(.5,(top-cy)/sy);
        if(hi<lo)continue;
        const radius=Math.max(radiusAt(lo),radiusAt(hi),...profile.filter(p=>p[1]>lo&&p[1]<hi).map(p=>p[0]));
        const half=radius*.25*c.horizontalScale+clearance;
        for(const a of [-1,1])for(const b of [-1,1]) {
          const xx=c.x+a*.415*c.horizontalScale,zz=c.z+b*.415*c.horizontalScale;
          cuts.push([xx-half,xx+half,zz-half,zz+half]);
        }
      }
      return cuts;
    };
    const paintSeats=seatCutsAt(y+.0658,y+.070);
    const subtract=(rect,cuts)=>{
      let pieces=[rect];
      for(const [cx0,cx1,cz0,cz1] of cuts) {
        const next=[];
        for(const [x0,x1,z0,z1] of pieces) {
          const a=Math.max(x0,cx0),b=Math.min(x1,cx1),c=Math.max(z0,cz0),d=Math.min(z1,cz1);
          if(!(a<b&&c<d)){next.push([x0,x1,z0,z1]);continue;}
          if(x0<a)next.push([x0,a,z0,z1]);if(b<x1)next.push([b,x1,z0,z1]);
          if(z0<c)next.push([a,b,z0,c]);if(d<z1)next.push([a,b,d,z1]);
        }
        pieces=next;
      }
      return pieces;
    };
    const panel=(x,yy,z,w,h,d,material,cuts=[],tint=1)=>{
      for(const [x0,x1,z0,z1] of subtract([x-w/2,x+w/2,z-d/2,z+d/2],cuts))
        if(x1-x0>1e-6&&z1-z0>1e-6)box((x0+x1)/2,yy,(z0+z1)/2,x1-x0,h,z1-z0,material,0,tint);
    };
    const timber=(length,breadth,bottom,top,notches,position,rotation,label)=>{
      const valid=notches.map(n=>{
        const a=Math.max(-length/2,n.x-n.width/2),b=Math.min(length/2,n.x+n.width/2);
        return {...n,x:(a+b)/2,width:b-a};
      }).filter(n=>n.width>1e-7);
      const geo=joineryBox(length,breadth,bottom,top,valid);
      geo.userData.architectureJoint=label;
      draw(geo,'red',position,[1,1,1],rotation);
    };
    // The backing and cedar skin are physically separate layers. Old boxes
    // overlapped by 10 mm and the skin penetrated the main beams by 7.5 mm.
    panel(0,y+.24,0,width,.085,depth,'darkwood',receivers);
    const zCount=12,step=depth/zCount;
    for(let j=0;j<zCount;j++) {
      const z=-depth/2+(j+.5)*step;
      panel(0,joined?y+.18375:y+.185,z,width-.10,joined?.0275:.045,step-.025,
        'cedar',[...receivers,...seatCutsAt(y+.170,y+.1975)],.82+.045*Math.sin(j*2.19));
    }
    for(const x of xs) {
      if(joined) {
        const slots=zs.map(z=>({x:-z,width:.31,side:'top',y:y-.02}));
        for(const c of columnAssemblies)if(Math.abs(c.x-x)<1e-7)
          for(const side of [-1,1])slots.push({x:-c.z-side*.415*c.horizontalScale,
            width:.27*c.horizontalScale,side:'bottom',y:c.capitalY+.5615*c.verticalScale});
        timber(depth+.06,.30,y-.200,y+.170,slots,[x,0,0],[0,PI/2,0],'hall-longitudinal-lap');
      } else box(x,y-.015,0,.30,.37,depth+.06,'red');
      const moldingCuts=columnAssemblies.filter(c=>Math.abs(c.x-x)<1e-7).flatMap(c=>[-1,1].map(side=>[
        c.x-.17,c.x+.17,c.z+(side*.415-.135)*c.horizontalScale,c.z+(side*.415+.135)*c.horizontalScale]));
      panel(x,y-.208,0,.33,.032,depth+.08,'darkwood',moldingCuts);
    }
    for(const z of zs) {
      if(joined) {
        const slots=xs.map(x=>({x,width:.30,side:'bottom',y:y-.02}));
        for(const c of columnAssemblies)if(Math.abs(c.z-z)<1e-7)
          for(const side of [-1,1])slots.push({x:c.x+side*.415*c.horizontalScale,
            width:.27*c.horizontalScale,side:'bottom',y:c.capitalY+.5425*c.verticalScale});
        timber(width+.10,.31,y-.210,y+.140,slots,[0,0,z],null,'hall-cross-lap');
      } else box(0,y-.035,z,width+.10,.35,.31,'red');
      const moldingCuts=columnAssemblies.filter(c=>Math.abs(c.z-z)<1e-7).flatMap(c=>[-1,1].map(side=>[
        c.x+(side*.415-.135)*c.horizontalScale,c.x+(side*.415+.135)*c.horizontalScale,c.z-.18,c.z+.18]));
      panel(0,y-.225,z,width+.15,.035,.35,'darkwood',moldingCuts);
      for(const x of xs)for(const front of [-1,1])
        squareFitting(x,y-.01,z+front*.165,.22,.24,front<0?PI:0,false);
    }
    for(let j=1;j<zCount;j++) {
      const z=-depth/2+j*step;
      if(Math.abs(z-frameZ)<.18)continue;
      // Where an upper arm takes over this transverse run, the batten ends
      // against the arm's real cut face, not in empty space around a big hole.
      const cuts=[];
      for(const c of columnAssemblies)for(const side of [-1,1]) {
        const h=c.horizontalScale,cz=c.z+side*.415*h;
        if(Math.abs(z-cz)<.105*h+.041)cuts.push([
          c.x-.68*h,c.x+.68*h,cz-.105*h,cz+.105*h]);
        cuts.push([c.x+(side*.415-.105)*h,c.x+(side*.415+.105)*h,c.z-.68*h,c.z+.68*h]);
      }
      panel(0,y+.055,z,width-.10,.16,.082,'endwood',cuts);
    }
    for(let bay=0;bay<xs.length-1;bay++)for(let k=1;k<3;k++) {
      const x=T.MathUtils.lerp(xs[bay],xs[bay+1],k/3);
      box(x,y+.09,0,.060,.11,depth-.12,'endwood');
    }
    for(const side of [-1,1]) {
      const x=side*4.15;
      for(let j=0;j<zCount;j++)for(const half of [-1,1]) {
        const z=-depth/2+(j+.5)*step,xx=x+half*.445;
        panel(xx,y+.115,z,.86,.046,step-.10,'black',seatCutsAt(y+.092,y+.138));
        panel(xx,y+.085,z,.78,.018,step-.20,'plaster',seatCutsAt(y+.076,y+.094),1.06);
        if(paintedPanels)paintedCeilingPanel(xx,y+.070,z,.30,(j+(half>0?1:0))%2,paintSeats);
        else {
          draw(g.rosette,'endwood',[xx,y+.070,z],[.30,.30,.016],[PI/2,0,.12],1.08);
          draw(g.rosette,'oldgold',[xx,y+.067,z],[.245,.245,.015],[PI/2,0,0],.94);
          for(const a of [-1,1])for(const b of [-1,1])
            draw(g.rosette,'endwood',[xx+a*.245,y+.071,z+b*.34],[.075,.075,.008],[PI/2,0,a*b*.3],1.0);
        }
        for(const a of [-1,1])for(const b of [-1,1]) {
          const px=xx+a*.36,pz=z+b*(step*.5-.13);
          if(seatCutsAt(y+.065,y+.071).some(([x0,x1,z0,z1])=>px>x0-.024&&px<x1+.024&&pz>z0-.024&&pz<z1+.024))continue;
          draw(g.pin,'oldgold',[px,y+.068,pz],[.023,.023,.020],[PI/2,0,0],.78);
        }
      }
      for(const xx of [x-.905,x,x+.905]) {
        const cuts=[];
        for(const c of columnAssemblies)for(const side of [-1,1]) {
          const h=c.horizontalScale;
          if(Math.abs(xx-c.x)<.68*h+.0225)cuts.push([c.x-.68*h,c.x+.68*h,
            c.z+(side*.415-.105)*h,c.z+(side*.415+.105)*h]);
        }
        panel(xx,y+.045,0,.045,.13,depth,'black',cuts);
      }
    }
    return {kind:'sanctuary-ceiling',joinedColumns:columnAssemblies.length,
      receiverClearances:receivers,paintedPanelClearances:paintSeats};
  }

  /** Reference6 wall reconstruction: broad true lattice openings instead of
   * opaque sheets hidden behind 10 of 13 window bays. Replace the old complete
   * side-wall loop, do not overlay it. Returns actual aperture data for light.
   */
  function sanctuarySideWalls({openFromBay=0,windowBottom=1.08,windowTop=5.14,
    clerestoryBottom=5.43,clerestoryTop=6.18,frontFrame=null}={}) {
    const apertures=[],windowHeight=windowTop-windowBottom;
    if(frontFrame&&(frontFrame.kind!=='hall-front-frame'||frontFrame.sideWallHeaderEndZ!==6.5||frontFrame.columns?.length!==6))
      throw new RangeError('Side-wall termination requires the paired front frame and blind housings.');
    const clearEnd=frontFrame?6.28:Infinity;
    const wallBox=(x,y,z,w,h,d,ma,rot=0,tint=1)=>{
      if(!frontFrame)return box(x,y,z,w,h,d,ma,rot,tint);
      // Split at the retained stone-foot top: low panels cannot pass through
      // its wider base merely because the shaft is narrower above it.
      const bottom=y-h/2,top=y+h/2;
      for(const [lo,hi,end] of [[bottom,Math.min(top,.60),6.00],[Math.max(bottom,.60),top,clearEnd]]) {
        const minZ=z-d/2,maxZ=Math.min(z+d/2,end);
        if(hi>lo+1e-8&&maxZ>minZ+1e-8)box(x,(lo+hi)/2,(minZ+maxZ)/2,w,hi-lo,maxZ-minZ,ma,rot,tint);
      }
    };
    for(const side of [-1,1]) {
      const x=side*8.6;
      // The v14 image revealed the old plaster header as a large gray-white
      // slab absent from reference6. Real timber lintels and an upper lattice
      // replace that slab; they remain connected to the side column capitals.
      const headerEnd=frontFrame?frontFrame.sideWallHeaderEndZ:6.9,headerStart=-6.9;
      box(x,6.34,(headerStart+headerEnd)/2,.44,.28,headerEnd-headerStart,'red');
      box(x,5.28,(headerStart+headerEnd)/2,.38,.22,headerEnd-headerStart,'red');
      wallBox(x-side*.205,5.16,0,.028,.032,13.78,'darkwood');
      wallBox(x,.53,0,.3,.50,13.5,'darkwood');
      for(let bay=0;bay<=12;bay++) {
        const z=-6.6+bay*1.1,open=bay>=openFromBay;
        const clerestoryY=(clerestoryBottom+clerestoryTop)/2;
        const clerestoryHeight=clerestoryTop-clerestoryBottom;
        for(const zz of [-.53,.53])
          wallBox(x,clerestoryY,z+zz,.30,clerestoryHeight+.08,.085,'red');
        for(let k=0;k<6;k++)
          wallBox(x,clerestoryY,z-.44+k*.176,.075,clerestoryHeight,.035,'endwood');
        wallBox(x,clerestoryY,z,.08,.034,1.04,'endwood');
        // Low waist panel leaves a window extending close to the floor as
        // the reference's side light requires; old solid waist was 1.8 high.
        wallBox(x,.73,z,.34,.66,1.04,'red');
        wallBox(x+side*.19,.74,z,.025,.46,.89,'darkwood');
        if(!open)wallBox(x,(windowBottom+windowTop)/2,z,.28,windowHeight,1.00,'darkwood');
        for(const yy of [windowBottom-.06,windowTop])wallBox(x,yy,z,.36,.12,1.10,'darkwood');
        for(const zz of [-.53,.53])wallBox(x,(windowBottom+windowTop)/2,z+zz,.36,windowHeight+.12,.10,'darkwood');
        for(let a=0;a<7;a++)wallBox(x+side*.2,(windowBottom+windowTop)/2,z-.48+a*.16,.075,windowHeight,.035,'endwood');
        const rows=Math.ceil(windowHeight/.31);
        for(let a=1;a<rows;a++)wallBox(x+side*.21,windowBottom+a*windowHeight/rows,z,.07,.031,1.04,'endwood');
        if(open&&frontFrame) {
          // Metadata describes the actual inner jamb / sill edges, not the
          // uncut bay box. The partial last bay ends at its real closing jamb.
          for(const [kind,bottom,top,half] of [
            ['sanctuary-side-window',windowBottom,windowTop-.06,.48],
            ['sanctuary-clerestory',clerestoryBottom,clerestoryTop,.4875]]) {
            const lo=z-half,hi=Math.min(z+half,clearEnd-.05);if(hi<=lo)continue;
            const localZ=(lo+hi)/2,localWidth=hi-lo,matrix=stack?.[stack.length-1],
              lower=v([x,bottom,localZ]),upper=v([x,top,localZ]),normal=v([side,0,0]);
            let worldWidth=localWidth;
            if(matrix){lower.applyMatrix4(matrix);upper.applyMatrix4(matrix);normal.transformDirection(matrix);
              worldWidth*=new T.Vector3().setFromMatrixColumn(matrix,2).length();}
            apertures.push({kind,side,bay,localZ,localWidth,worldWidth,
              worldCenter:lower.clone().add(upper).multiplyScalar(.5).toArray(),worldNormal:normal.toArray(),
              worldBottom:lower.y,worldTop:upper.y,worldHeight:upper.distanceTo(lower),
              actualJambBounds:[lo,hi],frontFrameTerminated:bay===12});
          }
          continue;
        }
        if(open) {
          const apertureLo=z-.5,apertureHi=Math.min(z+.5,frontFrame?clearEnd-.05:Infinity),apertureWidth=apertureHi-apertureLo,
            apertureZ=(apertureLo+apertureHi)/2;
          if(apertureWidth<=0)continue;
          const center=new T.Vector3(x,(windowBottom+windowTop)/2,apertureZ),normal=new T.Vector3(side,0,0);
          const bottomPoint=new T.Vector3(x,windowBottom,apertureZ),topPoint=new T.Vector3(x,windowTop,apertureZ);
          let worldWidth=apertureWidth;
          const upperBottom=new T.Vector3(x,clerestoryBottom,apertureZ);
          const upperTop=new T.Vector3(x,clerestoryTop,apertureZ);
          if(stack) {
            const matrix=stack[stack.length-1];center.applyMatrix4(matrix);normal.transformDirection(matrix);
            bottomPoint.applyMatrix4(matrix);topPoint.applyMatrix4(matrix);
            worldWidth=apertureWidth*new T.Vector3().setFromMatrixColumn(matrix,2).length();
            upperBottom.applyMatrix4(matrix);upperTop.applyMatrix4(matrix);
          }
          apertures.push({kind:'sanctuary-side-window',side,bay,localZ:apertureZ,
            worldCenter:center.toArray(),worldNormal:normal.toArray(),
            worldBottom:bottomPoint.y,worldTop:topPoint.y,localWidth:apertureWidth,
            worldWidth,worldHeight:topPoint.distanceTo(bottomPoint)});
          apertures.push({kind:'sanctuary-clerestory',side,bay,localZ:apertureZ,
            worldCenter:upperBottom.clone().add(upperTop).multiplyScalar(.5).toArray(),
            worldNormal:normal.toArray(),worldBottom:upperBottom.y,
            worldTop:upperTop.y,localWidth:apertureWidth,worldWidth,
            worldHeight:upperTop.distanceTo(upperBottom)});
        }
      }
    }
    if(frontFrame)for(const side of [-1,1])for(const [lo,hi] of [[1.08,5.17],[5.39,6.20]])
      box(side*8.6,(lo+hi)/2,6.255,.36,hi-lo,.05,'darkwood');
    return apertures;
  }

  /** Three real woven rectangles, separated by dark bindings and narrow
   * timber strips, reproduce the visible reference 6 foreground band. The
   * central flat floor mat is distinct from the altar's thick brocade cushion.
   * Only the inner/longitudinal boundaries are resolved in this photograph;
   * sideOuter stays configurable because its far lateral edge is off-frame.
   */
  function sanctuaryFloorMats({centreBounds=[-1.665,1.635,1.608,2.599],
    sideOuter=7.65,sideGap=.035,sideFront=3.235,floorY=.335,border=.020}={}) {
    const [cx0,cx1,rear,centreFront]=centreBounds;
    if(!(cx1>cx0&&centreFront>rear&&sideOuter>Math.max(-cx0,cx1)
      &&sideFront>=centreFront&&sideGap>=0&&border>0))throw new Error('Invalid floor mat bounds');
    Object.assign(materialAliases,createRestorationMatMaterials(ctx.materials));
    const panels=[[-1,-sideOuter,cx0-sideGap,rear,sideFront],
      [0,cx0,cx1,rear,centreFront],[1,cx1+sideGap,sideOuter,rear,sideFront]],mats=[];
    for(const [side,minX,maxX,minZ,maxZ] of panels) {
      const width=maxX-minX,depth=maxZ-minZ,x=(minX+maxX)/2,z=(minZ+maxZ)/2;
      if(width<=border*2||depth<=border*2)throw new Error('Floor mat binding exceeds panel');
      box(x,floorY+.010,z,width,.018,depth,'matBorder');
      box(x,floorY+.016,z,width-border*2,.012,depth-border*2,'strawMat');
      const top=floorY+.022,matrix=stack?.[stack.length-1];
      const corners=[[minX,top,minZ],[maxX,top,minZ],[maxX,top,maxZ],[minX,top,maxZ]]
        .map(p=>matrix?v(p).applyMatrix4(matrix):v(p));
      const centre=matrix?v([x,top,z]).applyMatrix4(matrix):v([x,top,z]);
      const normal=matrix?v([0,1,0]).transformDirection(matrix):v([0,1,0]);
      mats.push({kind:'sanctuary-floor-mat',side,localBounds:[minX,maxX,minZ,maxZ],
        localTop:top,worldCenter:centre.toArray(),worldNormal:normal.toArray(),
        worldCorners:corners.map(p=>p.toArray()),worldTop:centre.y,
        worldWidth:corners[0].distanceTo(corners[1]),worldDepth:corners[1].distanceTo(corners[2]),
        worldRect:[Math.min(...corners.map(p=>p.x)),Math.max(...corners.map(p=>p.x)),
          Math.min(...corners.map(p=>p.z)),Math.max(...corners.map(p=>p.z))],
        materialKey:materialKey('strawMat'),borderMaterialKey:materialKey('matBorder')});
    }
    return mats;
  }

  /** Optional reference9 follow-up, called INSIDE one existing pagoda level.
   * This adds physical window paper behind the lattice, never a glowing core.
   * Use a dedicated material key if lighting needs to vary window emission
   * independently of lantern paper. No lights are created by this module.
   */
  /** Reference8/10 upper-gallery floor framing. All coordinates are local to
   * the EXISTING hall group, never the outer site/hall matrix. This is paired
   * with the lower annular roof replacement, not an overlay on the full roof.
   */
  function hallGallerySubstructure({referenceMode,frontFrame,
    floor={width:18.3,depth:13,bottomY:7.98,topY:8.14}}={}) {
    if(!['reference8','reference10'].includes(referenceMode)||frontFrame?.kind!=='hall-front-frame'
      ||frontFrame.columns?.length!==6||!floor||
      [['width',18.3],['depth',13],['bottomY',7.98],['topY',8.14]].some(([k,n])=>!Number.isFinite(floor[k])||Math.abs(floor[k]-n)>1e-8))
      throw new RangeError('Gallery framing needs an explicit reference8/10 condition, the actual front frame and the retained floor bounds.');
    const xs=[-8.6,-5.15,-1.72,1.72,5.15,8.6],zs=[-6.39,-2.8,2.8,6.39],
      bottom=7.557,top=floor.bottomY,lap=(bottom+top)/2,longWidth=.24,crossWidth=.22,
      longs=[{x:-9.04,width:.22},...xs.map(x=>({x,width:longWidth})),{x:9.04,width:.22}],parts=[],bearings=[];
    for(let i=0;i<xs.length;i++) {
      const c=frontFrame.columns.find(c=>Math.abs(c.x-xs[i])<1e-8);
      if(!c||!['x','z','capitalTop','horizontalScale'].every(k=>Number.isFinite(c[k]))||Math.abs(c.z-6.8)>1e-8||Math.abs(c.capitalTop-bottom)>1e-8||
        c.horizontalScale*.25<longWidth||6.8-.715*c.horizontalScale>=floor.depth/2)
        throw new RangeError('Gallery load beams must bear on the real retained front receiving timbers.');
      bearings.push({columnX:c.x,receiverTop:bottom,
        localRect:[c.x-longWidth/2,c.x+longWidth/2,6.8-.715*c.horizontalScale,floor.depth/2]});
    }
    const emit=(geometry,label,position,rotation,bounds)=>{
      geometry.userData.architectureJoint=label;
      draw(geometry,'darkwood',position,[1,1,1],rotation);
      parts.push({label,geometry,position,rotation,bounds});
    };
    for(const {x,width} of longs) {
      const geometry=joineryBox(floor.depth,width,bottom,top,
        zs.map(z=>({x:-z,width:crossWidth,side:'top',y:lap})));
      emit(geometry,'gallery-longitudinal-half-lap',[x,0,0],[0,PI/2,0],
        {minX:x-width/2,maxX:x+width/2,minZ:-floor.depth/2,maxZ:floor.depth/2,bottomY:bottom,topY:top});
    }
    for(const z of zs) {
      const geometry=joineryBox(floor.width,crossWidth,bottom,top,
        longs.map(({x,width})=>({x,width,side:'bottom',y:lap})));
      emit(geometry,'gallery-transverse-half-lap',[0,0,z],null,
        {minX:-floor.width/2,maxX:floor.width/2,minZ:z-crossWidth/2,maxZ:z+crossWidth/2,bottomY:bottom,topY:top});
    }
    const roofSeats=[];
    for(const c of frontFrame.columns){
      const h=c.horizontalScale,v=c.verticalScale,cy=c.capitalY;
      // These three AABBs are the exact UNION of the complementary half-
      // lapped receivers. Each member's removed notch is filled by the other;
      // this does not fill an actual void or replace the interlocked members.
      roofSeats.push({minX:c.x-.125*h,maxX:c.x+.125*h,minZ:c.z-.715*h,maxZ:c.z+.715*h,
        bottomY:cy+.71*v,topY:cy+.82*v,source:'front-receiver-union-central'});
      for(const sign of [-1,1])roofSeats.push({minX:c.x-.72*h,maxX:c.x+.72*h,
        minZ:c.z+(sign*.415-.115)*h,maxZ:c.z+(sign*.415+.115)*h,
        bottomY:cy+.6815*v,topY:cy+.7815*v,source:'front-receiver-union-cross'});
    }
    for(const x of xs){
      roofSeats.push({minX:x-.125*1.35,maxX:x+.125*1.35,minZ:-6.8-.715*1.35,maxZ:-6.8+.715*1.35,
        bottomY:6.45+.71*1.35,topY:7.557,source:'retained-rear-central-receiver'});
      for(const sign of [-1,1])roofSeats.push({minX:x-.72*1.35,maxX:x+.72*1.35,
        minZ:-6.8+(sign*.415-.115)*1.35,maxZ:-6.8+(sign*.415+.115)*1.35,
        bottomY:6.45+(.717-.065)*1.35,topY:6.45+(.717+.065)*1.35,source:'retained-rear-cross-receiver'});
    }
    return {kind:'reference-gallery-substructure',referenceMode,floor:{...floor},bottomY:bottom,topY:top,lapY:lap,
      longitudinalCount:longs.length,primaryLongitudinalCount:xs.length,transverseCount:zs.length,parts,frontBearings:bearings,roofSeats,
      requiresAnnularRoof:true,photographicStatus:'Structural reconstruction within retained gallery bounds; not measured photographic framing.'};
  }

  /** Preserve the established lower hip-roof slope and outer silhouette while
   * making a real open centre for the already retained upper gallery. The old
   * summit/ridge is removed, not hidden through the floor. Reference4/default
   * calls are deliberately not supported by this conditional reconstruction.
   */
  function hallGalleryRoof({referenceMode,substructure,entrance=null,
    tileShade=()=>1,x=0,y=7.55,z=0,w=24.8,d=19.9,rise=1.8}={}) {
    if(!['reference8','reference10'].includes(referenceMode)||substructure?.kind!=='reference-gallery-substructure'
      ||substructure.referenceMode!==referenceMode||typeof tileShade!=='function'
      ||[x,z].some(n=>n!==0)||[[y,7.55],[w,24.8],[d,19.9],[rise,1.8]].some(([a,b])=>!Number.isFinite(a)||Math.abs(a-b)>1e-8)
      ||entrance!==null
      ||[['width',18.3],['depth',13],['bottomY',7.98],['topY',8.14]].some(([k,n])=>!Number.isFinite(substructure.floor?.[k])||Math.abs(substructure.floor[k]-n)>1e-8))
      throw new RangeError('The annular gallery roof requires its paired retained reference8/10 framing and straight eave, without a reference4 karahafu.');
    const floor=substructure.floor,opening={minX:-floor.width/2,maxX:floor.width/2,minZ:-floor.depth/2,maxZ:floor.depth/2,tierCollar:true},
      woodOpenings=[opening,...(entrance?[{...entrance.hostOpening,tierCollar:true}]:[])],
      tileOpenings=[opening,...(entrance?[entrance.hostTileOpening]:[])],ridge=w*.245;
    const evalP=(face,t,u,extra=0)=>{
      let px,pz;if(face<2){px=u*(ridge+(w/2-ridge)*t);pz=(face===0?1:-1)*d/2*t;}
      else{px=(face===2?1:-1)*(ridge+(w/2-ridge)*t);pz=u*d/2*t;}
      return v([px,rise*Math.max(0,1-t)**1.43+.48*t**9*(.25+Math.abs(u)**7)+extra,pz]);
    };
    let tileCalls=0;const surfaces=[],curbs=[],shades=[],seatCleanup={exactZeroWidthParts:0};
    // Obtain and validate the same tint sequence before geometry emission.
    for(let face=0;face<4;face++){
      const rows=Math.max(10,Math.round((face<2?d/2:w/2-ridge)/.28));
      for(let row=0;row<rows;row++){
        const t0=Math.max(.001,(row+.006)/rows),t1=Math.min(1.001,(row+.994)/rows),tm=(t0+t1)/2,
          span=face<2?2*(ridge+(w/2-ridge)*tm):d*tm,cols=Math.max(2,Math.round(span/.255));
        for(let col=0;col<cols;col++){const shade=tileShade();if(!Number.isFinite(shade))throw new RangeError('Gallery tile tint must be finite.');shades.push(shade);}
      }
    }
    const skin=(geometry,material,label,openings)=>{
      geometry.userData.architectureSurface=label;
      const cut=clipRestorationRoofOpening(geometry,openings);instance(cut,material,0,0,0,1,1,1);
      surfaces.push({label,geometry:cut});
    };
    const strip=(points,r,material,segments=36)=>{
      const curve=new T.CatmullRomCurve3(points.map(p=>v(p))),tube=new T.TubeGeometry(curve,segments,r,8,false),
        body=tube.toNonIndexed(),p=tube.attributes.position,positions=[],normals=[],uv=[];
      for(const end of [0,1]){
        const centre=curve.getPointAt(end),normal=curve.getTangentAt(end).multiplyScalar(end?1:-1);
        for(let j=0;j<8;j++){
          const a=new T.Vector3().fromBufferAttribute(p,(end?segments:0)*9+j),b=new T.Vector3().fromBufferAttribute(p,(end?segments:0)*9+j+1),tri=[centre,a,b];
          if(a.clone().sub(centre).cross(b.clone().sub(centre)).dot(normal)<0)tri.reverse();
          for(const q of tri){positions.push(...q.toArray());normals.push(...normal.toArray());uv.push(0,0);}
        }
      }
      const caps=new T.BufferGeometry();caps.setAttribute('position',new T.Float32BufferAttribute(positions,3));caps.setAttribute('normal',new T.Float32BufferAttribute(normals,3));caps.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      const closed=joinTimberPieces([body,caps]);closed.userData.architectureJoint='gallery-cut-ceramic';
      for(const piece of roofTimberOutsideOpening(closed,woodOpenings))instance(conformTierTimber(piece),material,0,0,0,1,1,1);
    };
    // This is a dedicated vertex-colour tile material, not a recolour of the
    // shared slate. Its normal/occlusion shader is inherited before wrapping.
    const tileMaterial='architecture_galleryTiles';
    if(ctx.materials&&!ctx.materials[tileMaterial]) {
      const source=ctx.materials.slate;
      if(!source?.isMaterial)throw new RangeError('Gallery tiles require the existing architectural slate material.');
      const material=source.clone();material.name=tileMaterial;material.vertexColors=true;material.side=T.DoubleSide;
      material.onBeforeCompile=source.onBeforeCompile;const key=source.customProgramCacheKey.bind(source);
      material.customProgramCacheKey=()=>key()+':gallery-annular-18';ctx.materials[tileMaterial]=material;
    }
    group(x,y,z,0,()=>{
      const positions=[],colors=[],indices=[];let index=0;
      for(let face=0;face<4;face++) {
        const rows=Math.max(10,Math.round((face<2?d/2:w/2-ridge)/.28));
        for(let row=0;row<rows;row++) {
          const t0=Math.max(.001,(row+.006)/rows),t1=Math.min(1.001,(row+.994)/rows),tm=(t0+t1)/2,
            span=face<2?2*(ridge+(w/2-ridge)*tm):d*tm,cols=Math.max(2,Math.round(span/.255));
          for(let col=0;col<cols;col++) {
            const u0=-1+(col+.006)*2/cols,u1=-1+(col+.994)*2/cols,shade=shades[tileCalls++];
            for(let tv=0;tv<3;tv++)for(let uv=0;uv<5;uv++) {
              const p=evalP(face,t0+(t1-t0)*tv/2,u0+(u1-u0)*uv/4,.012+Math.sin(uv/4*PI)*.045+(tv===2?.025:0));
              positions.push(...p.toArray());colors.push(shade,shade*1.015,shade*1.045);
            }
            for(let j=0;j<2;j++)for(let k=0;k<4;k++){const a=index+j*5+k;
              if(face===0||face===3)indices.push(a,a+5,a+1,a+1,a+5,a+6);else indices.push(a,a+1,a+5,a+1,a+6,a+5);}
            index+=15;
          }
        }
        for(const [offset,material] of [[-.035,'slate'],[-.18,'darkwood']]) {
          const pos=[],ids=[];
          for(let j=0;j<=20;j++)for(let i=0;i<=40;i++) {
            pos.push(...evalP(face,Math.max(.001,j/20),-1+i/20,offset).toArray());
            if(j<20&&i<40){const a=j*41+i;if(face===0||face===3)ids.push(a,a+41,a+1,a+1,a+41,a+42);else ids.push(a,a+1,a+41,a+1,a+42,a+41);}
          }
          const count=pos.length/3,original=[...ids];pos.push(...pos);
          for(let i=0;i<original.length;i+=3)ids.push(original[i]+count,original[i+2]+count,original[i+1]+count);
          const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));geometry.setIndex(ids);geometry.computeVertexNormals();
          skin(geometry,material,'gallery-'+material+'-backing',woodOpenings);
        }
      }
      const tiles=new T.BufferGeometry();tiles.setAttribute('position',new T.Float32BufferAttribute(positions,3));tiles.setAttribute('color',new T.Float32BufferAttribute(colors,3));tiles.setIndex(indices);tiles.computeVertexNormals();
      skin(tiles,tileMaterial,'gallery-tiles',tileOpenings);
      eaves({w,d,evalP,roofOrigin:[x,y,z],detail:true,opening:woodOpenings,timberSeats:substructure.roofSeats.map(s=>({...s,cleanup:seatCleanup,bottomY:s.bottomY-y,topY:s.topY-y}))});
      // The hidden central ridge and finials lie inside the true opening and
      // are intentionally absent. Only the four surviving hip runs remain.
      for(const sx of [-1,1])for(const sz of [-1,1]) {
        const pts=[];for(let j=0;j<=20;j++)pts.push(evalP(sz>0?0:1,j/20,sx,.07).toArray());
        strip(pts,.11,'tileEdge',30);strip(pts.map(p=>[p[0],p[1]+.11,p[2]]),.024,'gold',30);
        const p=evalP(sz>0?0:1,1,sx);instance('sphere','gold',p.x,p.y+.18,p.z,.12,.2,.12);
      }
    });
    // The original side apron stands higher than the indoor floor. A shallow
    // solid curb, standing ON that floor and ending at its real outer edge,
    // closes the cut; it is not a floating opaque patch inside the gallery.
    // Six primary girders and the lower perimeter framing seal the lower part.
    const hxi=floor.width/2,hzi=floor.depth/2,gauge=.055,topAt=(xx,zz)=>{
      const t=Math.max(Math.abs(zz)/(d/2),(Math.abs(xx)-ridge)/(w/2-ridge));
      const u=Math.abs(zz)/(d/2)>= (Math.abs(xx)-ridge)/(w/2-ridge)?xx/(ridge+(w/2-ridge)*t):zz/(d/2*t);
      return y+rise*Math.max(0,1-t)**1.43+.48*t**9*(.25+Math.abs(u)**7)+.105;
    };
    for(const side of [-1,1]) {
      const knots=Array.from({length:161},(_,i)=>-hzi+2*hzi*i/160),bottom=floor.topY,contour=[];
      // The .105 overflashing envelope exceeds all retained tile corrugations.
      for(const zz of knots)contour.push([zz,Math.max(bottom+.008,topAt(side*hxi,zz))]);
      contour.push([hzi,bottom],[-hzi,bottom]);
      const geometry=extrudedProfile(contour,gauge,0);geometry.userData.architectureJoint='gallery-side-weather-curb';
      draw(geometry,'darkwood',[side*(hxi-gauge/2),0,0],[1,1,1],[0,PI/2,0]);
      curbs.push({side,geometry,bottomY:bottom,outerX:side*hxi,gauge});
    }
    return {kind:'reference-gallery-annular-roof',referenceMode,floor:{...floor},opening,woodOpenings,tileOpenings,
      surfaces,curbs,seatCleanup,tileTintCalls:tileCalls,roofOrigin:[x,y,z],w,d,rise,
      centreRidgeRemoved:true,requiresSubstructure:true,
      photographicStatus:'Reference-conditioned physical junction; unchanged outer eaves, not photographic acceptance.'};
  }

  function pagodaWindowBackings({w,d=w,y=0,level=0,material='paper',sideWindows=true}) {
    const fixtures=[];
    const record=(position,normal,width,height)=>{
      const world=v(position),worldNormal=v(normal);
      if(stack) {
        world.applyMatrix4(stack[stack.length-1]);
        worldNormal.transformDirection(stack[stack.length-1]);
      }
      fixtures.push({kind:'pagoda-window',level,localCenter:position,
        worldCenter:world.toArray(),worldNormal:worldNormal.toArray(),
        width,height,materialKey:material});
    };
    for(const side of [-1,1])for(let bay=-2;bay<=2;bay++) {
      const x=bay*w*.16,z=side*(d/2-.082);
      // Existing darkwood back = d/2-.095; lattice front = d/2-.065.
      // This .006 sheet lies strictly between, without a coplanar overlay.
      box(x,y+1.5,z,w*.112,1.68,.006,material);
      record([x,y+1.5,z],[0,0,side],w*.112,1.68);
      if(sideWindows) {
        const zz=bay*d*.16,xx=side*(w/2-.15);
        // The previous tower only modeled front/back lattice. The reference
        // shows the same measured bays continuing around the adjoining side.
        box(xx,y+1.5,zz,.11,1.85,d*.12,'darkwood');
        box(side*(w/2-.082),y+1.5,zz,.006,1.68,d*.112,material);
        for(let k=0;k<5;k++)
          box(side*(w/2-.08),y+1.5,zz-d*.05+k*d*.025,.03,1.70,.035,'endwood');
        for(let k=0;k<4;k++)
          box(side*(w/2-.06),y+.85+k*.4,zz,.035,.03,d*.115,'oldgold');
        record([side*(w/2-.082),y+1.5,zz],[side,0,0],d*.112,1.68);
      }
    }
    return fixtures;
  }

  /** Optional complete pagoda storey. Replace the old staggered post loops,
   * solid plaster core, and five-window facade loop together, never overlay.
   * Floor, balconies, roof and existing corner lanterns stay in world.js.
   */
  /** Explicit reference10 balcony replacement for upper tower levels. The
   * existing wall axes, floor elevations, annular bearing collar, rail outside
   * line and tower transform stay fixed. A small real cantilever carries the
   * formerly outboard rail feet; blind floor pockets receive the actual stone
   * column feet rather than burying them in an uncut slab.
   */
  function pagodaBalcony({referenceMode,w,d=w,y,level,scale,storeyFrame}={}) {
    const expectedScale=1-level*.065;
    if(referenceMode!=='reference10'||!Number.isInteger(level)||level<1||level>4
      ||![w,d,y,scale].every(Number.isFinite)||Math.abs(scale-expectedScale)>1e-8
      ||Math.abs(w-7.8*scale)>1e-8||Math.abs(d-w)>1e-8||Math.abs(y-level*4.12)>1e-8
      ||!storeyFrame||storeyFrame.posts?.length!==12||!(storeyFrame.shaftHeight>0&&storeyFrame.shaftHeight<=3))
      throw new RangeError('Tower balconies require the unchanged explicit reference10 upper storey and its actual twelve posts.');
    const expectedAxes=[[-w/2,-d/2],[-w/6,-d/2],[w/6,-d/2],[w/2,-d/2],
      [-w/2,d/2],[-w/6,d/2],[w/6,d/2],[w/2,d/2],[-w/2,-d/6],[-w/2,d/6],[w/2,-d/6],[w/2,d/6]];
    for(const [x,z]of expectedAxes){const p=storeyFrame.posts.find(p=>Math.abs(p.x-x)<1e-8&&Math.abs(p.z-z)<1e-8),corner=Math.abs(x)===w/2&&Math.abs(z)===d/2;
      if(!p||![p.x,p.z,p.radius,p.shaftBottom].every(Number.isFinite)||Math.abs(p.radius-.235*scale*(corner?1:.96))>1e-8||Math.abs(p.shaftBottom-(y+.5))>1e-8)
        throw new RangeError('Balcony pockets must follow the retained square column feet, not a guessed support grid.');}
    const parts=[],postCentres=[],railJoints=[],floorBottom=y+.02,floorTop=y+.32,pocketBottom=y+.20,
      floorWidth=w+.96,floorDepth=d+.96,railX=w/2+.4,railZ=d/2+.4,
      postHalf=.07,postTop=y+1.0446,railYs=[y+.5044,y+.9132],tenonDepth=.035,tenonHalf=.03;
    const make=(triangles,label)=>{
      const positions=[];for(const tri of triangles){if(v(tri[1]).sub(v(tri[0])).cross(v(tri[2]).sub(v(tri[0]))).lengthSq()<1e-22)continue;for(const p of tri)positions.push(...p);}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.userData.architectureJoint=label;return geometry;
    };
    const tri=(out,a,b,c,normal)=>{if(v(b).sub(v(a)).cross(v(c).sub(v(a))).dot(v(normal))<0)[b,c]=[c,b];out.push([a,b,c]);};
    const quad=(out,a,b,c,d,normal)=>{tri(out,a,b,c,normal);tri(out,a,c,d,normal);};
    const emit=(geometry,material,position=[0,0,0],rotation=null,label=geometry.userData.architectureJoint)=>{
      draw(geometry,material,position,[1,1,1],rotation);parts.push({label,geometry,material,position,rotation});
    };
    const footProfile=[[1.40,0],[1.47,.12],[1.47,.32],[1.26,.52],[1.18,.86],[1.12,1]],
      radiusAt=t=>{let i=1;while(i<footProfile.length-1&&t>footProfile[i][1])i++;return T.MathUtils.lerp(footProfile[i-1][0],footProfile[i][0],(t-footProfile[i-1][1])/(footProfile[i][1]-footProfile[i-1][1]));},
      pocketLevels=[pocketBottom,pocketBottom+.12*.3,pocketBottom+.32*.3,floorTop],
      ring=(p,yy)=>{const r=p.radius*radiusAt((yy-pocketBottom)/.3),b=r*.09;return[[-r+b,-r],[r-b,-r],[r,-r+b],[r,r-b],[r-b,r],[-r+b,r],[-r,r-b],[-r,-r+b]].map(([x,z])=>[p.x+x,yy,p.z+z]);};
    const triangles=[],outer=[[-floorWidth/2,-floorDepth/2],[floorWidth/2,-floorDepth/2],[floorWidth/2,floorDepth/2],[-floorWidth/2,floorDepth/2]],
      topHoles=storeyFrame.posts.map(p=>ring(p,floorTop)),flat=[...outer,...topHoles.flat().map(p=>[p[0],p[2]])];
    for(const ids of T.ShapeUtils.triangulateShape(outer.map(p=>new T.Vector2(...p)),topHoles.map(r=>r.map(p=>new T.Vector2(p[0],p[2])))))
      tri(triangles,...ids.map(i=>[flat[i][0],floorTop,flat[i][1]]),[0,1,0]);
    tri(triangles,[outer[0][0],floorBottom,outer[0][1]],[outer[1][0],floorBottom,outer[1][1]],[outer[2][0],floorBottom,outer[2][1]],[0,-1,0]);
    tri(triangles,[outer[0][0],floorBottom,outer[0][1]],[outer[2][0],floorBottom,outer[2][1]],[outer[3][0],floorBottom,outer[3][1]],[0,-1,0]);
    for(let i=0;i<4;i++){const a=outer[i],b=outer[(i+1)%4];quad(triangles,[a[0],floorBottom,a[1]],[b[0],floorBottom,b[1]],[b[0],floorTop,b[1]],[a[0],floorTop,a[1]],[b[1]-a[1],0,a[0]-b[0]]);}
    for(const p of storeyFrame.posts){const rings=pocketLevels.map(yy=>ring(p,yy)),lo=rings[0];
      for(let i=0;i<8;i++)tri(triangles,[p.x,pocketBottom,p.z],lo[i],lo[(i+1)%8],[0,1,0]);
      for(let j=0;j<rings.length-1;j++)for(let i=0;i<8;i++){const k=(i+1)%8,a=rings[j][i],b=rings[j][k];quad(triangles,a,b,rings[j+1][k],rings[j+1][i],[p.x-(a[0]+b[0])/2,0,p.z-(a[2]+b[2])/2]);}}
    const floor=make(triangles,'pagoda-balcony-pocketed-floor');emit(floor,'darkwood');
    // Rectilinear surface extraction keeps blind mortises one closed post,
    // rather than stacking disconnected cut boxes with hidden internal caps.
    const postCache=new Map();
    const postGeometry=sides=>{
      const key=sides.slice().sort().join(',');if(postCache.has(key))return postCache.get(key);
      const xx=[-.07,-.035,-.03,.03,.035,.07],zz=xx,yy=[floorTop,...railYs.flatMap(h=>[h-.03,h+.03]),postTop],out=[];
      const solid=(i,j,k)=>{if(i<0||j<0||k<0||i>=xx.length-1||j>=yy.length-1||k>=zz.length-1)return false;
        const x=(xx[i]+xx[i+1])/2,z=(zz[k]+zz[k+1])/2,notch=j===1||j===3;
        return !(notch&&sides.some(side=>side==='x-'?x<-.035&&Math.abs(z)<.03:side==='x+'?x>.035&&Math.abs(z)<.03:side==='z-'?z<-.035&&Math.abs(x)<.03:z>.035&&Math.abs(x)<.03));};
      for(let i=0;i<xx.length-1;i++)for(let j=0;j<yy.length-1;j++)for(let k=0;k<zz.length-1;k++)if(solid(i,j,k)){
        const x0=xx[i],x1=xx[i+1],y0=yy[j],y1=yy[j+1],z0=zz[k],z1=zz[k+1];
        if(!solid(i-1,j,k))quad(out,[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0]);
        if(!solid(i+1,j,k))quad(out,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0]);
        if(!solid(i,j-1,k))quad(out,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]);
        if(!solid(i,j+1,k))quad(out,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);
        if(!solid(i,j,k-1))quad(out,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);
        if(!solid(i,j,k+1))quad(out,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]);
      }
      const g=make(out,'pagoda-balcony-mortised-post');postCache.set(key,g);return g;
    };
    const railGeometry=length=>{
      const out=[],stations=[[-length/2-tenonDepth,.03,.03],[-length/2,.03,.03],[-length/2,.065,.07],[length/2,.065,.07],[length/2,.03,.03],[length/2+tenonDepth,.03,.03]],
        rings=stations.map(([x,h,d])=>[[x,-h,-d],[x,h,-d],[x,h,d],[x,-h,d]]);
      for(let j=0;j<rings.length-1;j++)for(let i=0;i<4;i++){const k=(i+1)%4,a=rings[j][i],b=rings[j][k],c=rings[j+1][k],d=rings[j+1][i];
        const normal=Math.abs(stations[j+1][0]-stations[j][0])<1e-10?[j<2?-1:1,0,0]:[0,(a[1]+b[1])/2,(a[2]+b[2])/2];quad(out,a,b,c,d,normal);}
      quad(out,...rings[0],[-1,0,0]);quad(out,...rings.at(-1),[1,0,0]);return make(out,'pagoda-balcony-shouldered-rail');
    };
    const cap=squareTurnedProfile([[.10,0],[.10,.035],[.085,.045],[.065,.0754]],.13);cap.translate(0,postTop,0);cap.userData.architectureJoint='pagoda-balcony-post-cap';
    const bulbTriangles=[],bulbProfile=[[.06,0],[.08,.018],[.112,.055],[.12,.083],[.11,.13],[.075,.17],[.03,.193]],N=24;
    const circle=(r,h)=>Array.from({length:N},(_,i)=>[r*Math.sin(i*2*PI/N),h,r*Math.cos(i*2*PI/N)]),bulbRings=bulbProfile.map(([r,h])=>circle(r,y+1.12+h));
    for(let j=0;j<bulbRings.length-1;j++)for(let i=0;i<N;i++){const k=(i+1)%N,a=bulbRings[j][i],b=bulbRings[j][k];quad(bulbTriangles,a,b,bulbRings[j+1][k],bulbRings[j+1][i],[(a[0]+b[0])/2,0,(a[2]+b[2])/2]);}
    for(let i=0;i<N;i++){tri(bulbTriangles,[0,y+1.12,0],bulbRings[0][i],bulbRings[0][(i+1)%N],[0,-1,0]);tri(bulbTriangles,[0,y+1.32,0],bulbRings.at(-1)[i],bulbRings.at(-1)[(i+1)%N],[0,1,0]);}
    const bulb=make(bulbTriangles,'pagoda-balcony-seated-finial');
    const nx=Math.ceil(2*railX/.88),nz=Math.ceil(2*railZ/.88),xs=Array.from({length:nx+1},(_,i)=>-railX+2*railX*i/nx),zs=Array.from({length:nz+1},(_,i)=>-railZ+2*railZ*i/nz),postMap=new Map();
    const addPost=(x,z,sides)=>{const key=x.toFixed(9)+':'+z.toFixed(9);if(postMap.has(key)){postMap.get(key).sides.push(...sides);return;}postMap.set(key,{x,z,sides:[...sides]});};
    for(const side of [-1,1]){for(let i=0;i<xs.length;i++)addPost(xs[i],side*railZ,[...(i>0?['x-']:[]),...(i<nx?['x+']:[])]);for(let i=0;i<zs.length;i++)addPost(side*railX,zs[i],[...(i>0?['z-']:[]),...(i<nz?['z+']:[])]);}
    for(const p of postMap.values()){emit(postGeometry(p.sides),'red',[p.x,0,p.z]);emit(cap,'black',[p.x,0,p.z]);emit(bulb,'oldgold',[p.x,0,p.z]);postCentres.push({x:p.x,z:p.z,bottomY:floorTop,topY:postTop,width:.14,mortiseSides:p.sides});}
    const railCache=new Map();
    for(const side of [-1,1])for(const [axis,values,constant]of [['x',xs,side*railZ],['z',zs,side*railX]])for(let i=0;i<values.length-1;i++)for(const h of railYs){
      const length=values[i+1]-values[i]-.14,key=length.toFixed(10);if(!railCache.has(key))railCache.set(key,railGeometry(length));
      const midpoint=(values[i]+values[i+1])/2;emit(railCache.get(key),'red',axis==='x'?[midpoint,h,constant]:[constant,h,midpoint],axis==='x'?null:[0,-PI/2,0]);
      railJoints.push({axis,from:values[i]+postHalf,to:values[i+1]-postHalf,constant,centerY:h,tenonDepth,tenonHalf});
    }
    return {kind:'reference10-supported-pagoda-balcony',referenceMode,level,scale,parts,postCentres,railJoints,
      floor:{geometry:floor,width:floorWidth,depth:floorDepth,bottomY:floorBottom,topY:floorTop,pocketBottomY:pocketBottom,pocketCount:12},
      bearingCore:{width:w+.5,depth:d+.5,bottomY:floorBottom,topY:floorTop},cantileverBeyondCore:.23,
      keepsAnnularCollar:true,requiresLegacyFloorAndRailsReplacement:true,changesRNG:false,
      photographicStatus:'Balcony band and existing rail lines retained; concealed joinery reconstructed, not engineering or photographic certification.'};
  }

  function pagodaStoreyFrame({w,d=w,y=0,level=0,scale=1-level*.115,
    roofWidth=w+3.3*scale,roofDepth=d+3.3*scale,roofRise=2.18*scale,
    roofY=y+3.55,windowMaterial='darkwood',detail=level<2}={}) {
    const shaftRadius=.235*scale,bracketScale=.72*scale;
    // The purlin bears against the underside of the main rafters, not through
    // the ceramic shell. Respect the existing hipRoof equation and soffit.
    // This frame is coupled only to the square pyramid pagodaRoof hook,
    // not the old long-ridge hipRoof used for the main hall.
    const sample=pagodaRoofSampler(roofWidth,roofDepth,roofRise);
    const purlinTop=roofY+pagodaRafterBearing(sample,roofWidth,d,scale);
    const purlinHeight=.13*scale;
    const shaftTop=purlinTop-purlinHeight-.970*bracketScale;
    const shaftBottom=y+.5,shaftHeight=shaftTop-shaftBottom;
    const bracketY=shaftTop+.150*bracketScale;
    const axesX=[-w/2,-w/6,w/6,w/2],axesZ=[-d/2,-d/6,d/6,d/2];
    const posts=[],windows=[];
    const post=(x,z,corner)=>{
      footColumn(x,z,y+.2,shaftHeight,shaftRadius*(corner?1:.96));
      brackets(x,bracketY,z,bracketScale,{detail:detail&&corner,interlocked:true});
      posts.push({x,z,corner,shaftBottom,shaftTop,radius:shaftRadius*(corner?1:.96)});
    };
    // Twelve distinct posts: four true corner pillars and two between each
    // corner pair. No offset double pillars and no arbitrary step truncation.
    for(const x of axesX)for(const z of [-d/2,d/2])post(x,z,Math.abs(x)===w/2);
    for(const x of [-w/2,w/2])for(const z of [-d/6,d/6])post(x,z,false);
    const purlinGeometries=new Map();
    for(let face=0;face<4;face++) {
      const angle=face===0?0:face===1?PI:face===2?PI/2:-PI/2;
      const span=face<2?w:d,normal=v([Math.sin(angle),0,Math.cos(angle)]);
      const wallCenter=normal.clone().multiplyScalar((face<2?d:w)/2);
      group(wallCenter.x,0,wallCenter.z,angle,()=>{
        // Continuous timbers actually pass through every column line. The
        // upper receiving purlin carries the roof; smaller ties frame windows.
        // Corner purlins have complementary half laps. Keeping four full
        // boxes at the same height would hide a solid-on-solid intersection.
        const purlinKey=span+':'+(face<2?'top':'bottom');
        if(!purlinGeometries.has(purlinKey)) {
          const geometry=joineryBox(span+.33*scale,.29*scale,-purlinHeight/2,purlinHeight/2,
            [-1,1].map(sign=>({x:sign*span/2,width:.29*scale,side:face<2?'top':'bottom',y:0})));
          geometry.userData.architectureJoint='pagoda-wall-purlin';purlinGeometries.set(purlinKey,geometry);
        }
        const purlin=purlinGeometries.get(purlinKey);
        draw(purlin,'red',[0,purlinTop-purlinHeight/2,0],[1,1,1]);
        box(0,y+2.57,0,span+.18*scale,.21*scale,.25*scale,'red');
        box(0,y+.49,0,span+.12*scale,.14*scale,.24*scale,'darkwood');
        const bay=span/3,clear=bay-shaftRadius*2-.10*scale;
        const windowBottom=y+.71,windowTop=Math.min(y+2.41,shaftTop-.14*scale);
        const windowHeight=windowTop-windowBottom,windowY=(windowTop+windowBottom)/2;
        for(let k=0;k<3;k++) {
          const xx=(k-1)*bay;
          // A closed lower spandrel and shallow recessed window, not a whole
          // plaster cube shining through between unrelated skinny posts.
          box(xx,y+.59,-.032,clear,.24,.11,'red');
          box(xx,y+.59,.030,Math.max(.08,clear-.10*scale),.15,.018,'darkwood');
          box(xx,windowY,-.125,clear,windowHeight,.05,windowMaterial);
          for(const yy of [windowBottom,windowTop])box(xx,yy,.022,clear+.06*scale,.075*scale,.095*scale,'red');
          for(const side of [-1,1])box(xx+side*clear/2,windowY,.022,.065*scale,windowHeight,.095*scale,'red');
          const bars=Math.max(6,Math.round(clear/(.18*scale)));
          for(let j=1;j<bars;j++){
            const barX=xx-clear/2+j*clear/bars;
            if(level===0&&k===1&&Math.abs(barX)<.45*scale)continue;
            box(barX,windowY,.020,.040*scale,windowHeight-.055*scale,.055*scale,'darkwood');
          }
          for(const f of [.32,.69])box(xx,windowBottom+windowHeight*f,.057,
            clear,.028*scale,.035*scale,'endwood');
          // Only a small nailed joint strap occurs at each actual window end.
          if(detail)for(const side of [-1,1])squareFitting(xx+side*(clear*.5-.045*scale),
            y+2.57,.131*scale,.07*scale,.12*scale,0,false);
          const local=v([xx,windowY,-.092]);
          const matrix=stack?.[stack.length-1];
          const worldCenter=matrix?local.clone().applyMatrix4(matrix):local.clone();
          const worldNormal=matrix?v([0,0,1]).transformDirection(matrix):v([0,0,1]);
          const worldWidth=clear*(matrix?v([1,0,0]).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix)).length():1);
          const worldHeight=windowHeight*(matrix?v([0,1,0]).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix)).length():1);
          const faceLocal=new T.Matrix4().makeRotationY(angle).setPosition(wallCenter.x,0,wallCenter.z);
          const storeyLocal=local.clone().applyMatrix4(faceLocal);
          // The legacy centre is the outward-biased sampling point. Expose
          // the actual paper front separately so light emitters are measured
          // on the real surface, not on an arbitrary volume inside the tower.
          const surfaceLocal=v([xx,windowY,-.100]);
          const surfaceWorld=matrix?surfaceLocal.clone().applyMatrix4(matrix):surfaceLocal.clone();
          const surfaceStorey=surfaceLocal.clone().applyMatrix4(faceLocal);
          const emitterWorldOffset=worldCenter.clone().sub(surfaceWorld).dot(worldNormal);
          windows.push({kind:'pagoda-window',level,face,bay:k,localCenter:storeyLocal.toArray(),
            worldCenter:worldCenter.toArray(),worldNormal:worldNormal.toArray(),
            width:clear,height:windowHeight,worldWidth,worldHeight,
            surfaceLocalCenter:surfaceStorey.toArray(),surfaceWorldCenter:surfaceWorld.toArray(),
            emitterWorldOffset,material:ctx.materials?.[materialKey(windowMaterial)]||null,
            worldBottom:worldCenter.y-worldHeight/2,worldTop:worldCenter.y+worldHeight/2,
            materialKey:materialKey(windowMaterial)});
        }
      });
    }
    return {posts,windows,purlinTop,shaftTop,shaftHeight,bracketY,
      columnsPerFace:4,distinctColumns:posts.length,roofWidth,roofDepth,requiresPyramidRoof:true};
  }

  /** Four equal roof faces converge at the pagoda centre. The old hall hipRoof
   * has a 49%-width long ridge and cannot share the pagoda's corner pillar plan.
   * Invoke only instead of the existing pagoda hipRoof call, never over it.
   */
  function pagodaRoof({x=0,y=0,z=0,w,d=w,rise,detail=true,soffitMaterial='darkwood',
    wallWidth=w*7.8/11.1,wallDepth=d*7.8/11.1,frameScale=w/11.1,referenceMode=null,apexOpeningHalf=0,upperFloor=null,upperBalcony=null}={}) {
    if(apexOpeningHalf&& (referenceMode!=='reference10'||apexOpeningHalf<.13||apexOpeningHalf>.18))
      throw new RangeError('The roof apex opening needs its explicit reference10 finial.');
    const apexOpening=apexOpeningHalf?{minX:-apexOpeningHalf,maxX:apexOpeningHalf,minZ:-apexOpeningHalf,maxZ:apexOpeningHalf}:null;
    const evalP=pagodaRoofSampler(w,d,rise);
    // Only the photographed slow-taper variant has an upper deck edge over
    // the actual lower ring purlin. A broad rectangular cut is not safe for
    // the steeper legacy taper; reject an unsupported collar before emission.
    const collarThickness=.10*frameScale,
      purlinTop=y+pagodaRafterBearing(evalP,w,wallDepth,frameScale);
    if(upperFloor) {
      const good=referenceMode==='reference10'&&!apexOpening
        &&['width','depth','bottomY','topY'].every(k=>Number.isFinite(upperFloor[k]))
        &&upperFloor.width>0&&upperFloor.depth>0&&frameScale>0
        &&upperFloor.bottomY>purlinTop+.15*frameScale
        &&upperFloor.bottomY<y+rise&&upperFloor.topY>upperFloor.bottomY;
      if(!good)throw new RangeError('A tier roof opening needs its real reference10 upper-floor bounds.');
      for(const [floorSpan,wallSpan]of [[upperFloor.width,wallWidth],[upperFloor.depth,wallDepth]])
        if(floorSpan/2-collarThickness<wallSpan/2-.145*frameScale-1e-8
          ||floorSpan/2>wallSpan/2+.145*frameScale+1e-8)
          throw new RangeError('The upper-floor collar must stand on the retained lower wall purlin.');
    }
    if(upperBalcony&&(!upperFloor||referenceMode!=='reference10'||apexOpening
      ||['width','depth','bottomY','topY'].some(k=>!Number.isFinite(upperBalcony[k]))
      ||Math.abs(upperBalcony.width-upperFloor.width-.46)>1e-8
      ||Math.abs(upperBalcony.depth-upperFloor.depth-.46)>1e-8
      ||Math.abs(upperBalcony.bottomY-upperFloor.bottomY)>1e-8
      ||Math.abs(upperBalcony.topY-upperFloor.topY)>1e-8))
      throw new RangeError('A balcony ceramic seat must match the paired .23 cantilever and the unchanged annular bearing core.');
    const balconySeat=upperBalcony?{minX:-upperBalcony.width/2,maxX:upperBalcony.width/2,
      minZ:-upperBalcony.depth/2,maxZ:upperBalcony.depth/2,bottomY:upperBalcony.bottomY-y,topY:upperBalcony.topY-y}:null;
    const tierOpening=upperFloor?{minX:-upperFloor.width/2,maxX:upperFloor.width/2,
      minZ:-upperFloor.depth/2,maxZ:upperFloor.depth/2,tierCollar:true}:null,
      roofOpening=tierOpening||apexOpening;
    const collarParts=[];
    const strip=(points,r,material,segments=36)=>{
      const curve=new T.CatmullRomCurve3(points.map(p=>v(p)));
      let tube=new T.TubeGeometry(curve,segments,r,8,false);
      if(roofOpening) {
        // Closed ceramic tube ends and exact cut caps, not a black hole at
        // the new metal roof boot. Preserve the old path outside the hole.
        const body=tube.toNonIndexed(),p=tube.attributes.position,positions=[],normals=[],uv=[];
        for(const end of [0,1]){
          const centre=curve.getPointAt(end),normal=curve.getTangentAt(end).multiplyScalar(end?1:-1);
          for(let j=0;j<8;j++){
            const a=new T.Vector3().fromBufferAttribute(p,(end?segments:0)*9+j),b=new T.Vector3().fromBufferAttribute(p,(end?segments:0)*9+j+1);
            const tri=[centre,a,b];if(a.clone().sub(centre).cross(b.clone().sub(centre)).dot(normal)<0)tri.reverse();
            for(const q of tri){positions.push(...q.toArray());normals.push(...normal.toArray());uv.push(0,0);}
          }
        }
        const caps=new T.BufferGeometry();caps.setAttribute('position',new T.Float32BufferAttribute(positions,3));caps.setAttribute('normal',new T.Float32BufferAttribute(normals,3));caps.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
        tube=joinTimberPieces([body,caps]);tube.userData.architectureJoint=upperFloor?'tier-collar-cut-ceramic':'finial-apex-cut-ceramic';
        for(const piece of roofTimberOutsideOpening(tube,roofOpening)) {
          const pieces=balconySeat?architectureTimberOutsideSeat(piece,balconySeat):[piece];
          for(const part of pieces){if(balconySeat)part.userData.architectureJoint='pagoda-balcony-seated-ceramic';
            draw(upperFloor?conformTierTimber(part):part,material,[0,0,0],[1,1,1]);}
        }
      }else draw(tube,material,[0,0,0],[1,1,1]);
    };
    group(x,y,z,0,()=>{
      const positions=[],indices=[];
      let index=0;
      for(let face=0;face<4;face++) {
        const rows=Math.max(10,Math.round((face<2?d:w)*.5/.28));
        for(let row=0;row<rows;row++) {
          const t0=Math.max(.001,(row+.006)/rows),t1=(row+.994)/rows;
          const span=(face<2?w:d)*(t0+t1)*.5;
          const tiles=Math.max(2,Math.round(span/.255));
          for(let tile=0;tile<tiles;tile++) {
            const u0=-1+(tile+.006)*2/tiles,u1=-1+(tile+.994)*2/tiles;
            for(let j=0;j<3;j++)for(let k=0;k<5;k++) {
              const t=t0+(t1-t0)*j/2,u=u0+(u1-u0)*k/4;
              const p=evalP(face,t,u,.012+Math.sin(k/4*PI)*.045+(j===2?.025:0));
              positions.push(...p.toArray());
            }
            for(let j=0;j<2;j++)for(let k=0;k<4;k++) {
              const a=index+j*5+k;
              // The opposite face requires reverse winding: do not rely on
              // DoubleSide to conceal inward geometry or inverted shading.
              if(face===0||face===3)indices.push(a,a+5,a+1,a+1,a+5,a+6);
              else indices.push(a,a+1,a+5,a+1,a+6,a+5);
            }
            index+=15;
          }
        }
        // Real continuous tile underlay and timber boarding seal the roof.
        for(const [offset,material] of [[-.035,'slate'],[-.18,soffitMaterial]]) {
          const pos=[],ids=[];
          for(let j=0;j<=20;j++)for(let k=0;k<=40;k++) {
            pos.push(...evalP(face,Math.max(.001,j/20),-1+k/20,offset).toArray());
            if(j<20&&k<40) {
              const a=j*41+k;
              if(face===0||face===3)ids.push(a,a+41,a+1,a+1,a+41,a+42);
              else ids.push(a,a+1,a+41,a+1,a+42,a+41);
            }
          }
          // Backing needs independently normalled lower vertices, not just
          // reversed indices that retain upward normals on the underside.
          const vertexCount=pos.length/3,original=[...ids];pos.push(...pos);
          for(let i=0;i<original.length;i+=3)ids.push(original[i]+vertexCount,
            original[i+2]+vertexCount,original[i+1]+vertexCount);
          const geometry=new T.BufferGeometry();
          geometry.setAttribute('position',new T.Float32BufferAttribute(pos,3));
          geometry.setIndex(ids);geometry.computeVertexNormals();
          geometry.userData.architectureSurface='pagoda-'+material+'-backing';
          draw(roofOpening?clipRestorationRoofOpening(geometry,roofOpening):geometry,material,[0,0,0],[1,1,1]);
        }
      }
      const tiles=new T.BufferGeometry();
      tiles.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      tiles.setIndex(indices);tiles.computeVertexNormals();
      tiles.userData.architectureSurface='pagoda-tiles';
      draw(roofOpening?clipRestorationRoofOpening(tiles,roofOpening):tiles,'slate',[0,0,0],[1,1,1]);
      eaves({w,d,evalP,roofOrigin:[x,y,z],detail,separateTiers:true,hipSeat:{width:wallWidth,depth:wallDepth,
        purlinWidth:.29*frameScale,top:pagodaRafterBearing(evalP,w,wallDepth,frameScale)},opening:tierOpening});
      for(const face of [0,1])for(const side of [-1,1]) {
        const ridge=[];
        for(let j=0;j<=28;j++)ridge.push(evalP(face,.025+.975*j/28,side,.075).toArray());
        strip(ridge,.105,'slate',42);
        // The ceramic ridge has a narrow raised lip, not a bright gold wire.
        strip(ridge.map(p=>[p[0],p[1]+.092,p[2]]),.022,'tileEdge',42);
        const corner=evalP(face,1,side,.075);
        const outward=v([corner.x,0,corner.z]).normalize();
        const curlPoints=[corner.clone().addScaledVector(outward,-.20),corner.clone(),
          corner.clone().addScaledVector(outward,.14).add(v([0,.13,0])),
          corner.clone().addScaledVector(outward,.19).add(v([0,.30,0]))];
        group(corner.x,corner.y,corner.z,Math.atan2(outward.x,outward.z),()=>{
          const crest=extrudedProfile([[-.22,-.10],[-.24,.11],[-.18,.29],[-.05,.39],[.12,.36],[.23,.20],[.17,.06],[.08,-.10]],.15,.012);
          draw(crest,'slate',[0,.005,0],[1,1,1]);
          draw(g.tileSeal,'slate',[0,.20,.089],[.16,.16,.12]);
          draw(g.ring,'tileEdge',[0,.20,.117],[.146,.146,.055]);
          flower(0,.20,.127,.108,'oldgold');
          for(const side of [-1,1])draw(g.nail,'oldgold',[side*.19,.005,.083],[.022,.022,.014]);
        });
      }
      // Compact summit tile hides the seam; no two spurious hall ridge ends.
      if(!roofOpening)draw(g.tileSeal,'slate',[0,rise+.052,0],[.15,.15,.15],[PI/2,0,0]);
      if(upperFloor) {
        const hx=upperFloor.width/2,hz=upperFloor.depth/2,t=collarThickness,
          bottom=purlinTop-y,top=upperFloor.bottomY-y;
        // Four thin vertical timbers make the actual closed deck edge. The
        // two side pieces stop at the inner faces of the front/back pieces,
        // so corners touch rather than hiding solid overlapping boxes.
        const member=(width,depth,xx,zz,label)=>{
          const geometry=joineryBox(width,depth,bottom,top);
          geometry.userData.architectureJoint='pagoda-tier-collar-'+label;
          draw(geometry,soffitMaterial,[xx,0,zz],[1,1,1]);
          collarParts.push({geometry,label,center:[x+xx,y,z+zz],
            bounds:{minX:x+xx-width/2,maxX:x+xx+width/2,
              minZ:z+zz-depth/2,maxZ:z+zz+depth/2,bottomY:purlinTop,topY:upperFloor.bottomY}});
        };
        for(const side of [-1,1])member(2*hx,t,0,side*(hz-t/2),'front-back');
        for(const side of [-1,1])member(t,2*(hz-t),side*(hx-t/2),0,'side');
      }
    });
    return {kind:upperFloor?'pagoda-annular-tier-roof':'pagoda-pyramid-roof',w,d,rise,
      centre:[x,y,z],ridgeLength:0,apexOpening,tierOpening,
      upperFloor:upperFloor?{...upperFloor}:null,upperBalcony:upperBalcony?{...upperBalcony}:null,
      collar:upperFloor?{thickness:collarThickness,purlinTop,floorBottomY:upperFloor.bottomY,parts:collarParts}:null};
  }

  /** Six-sided reference10 porch lantern, independent of the legacy shared
   * paper boxes. Dimensions are local to the caller's existing porch matrix.
   * No lights are created here; metadata identifies the real paper surfaces.
   */
  function hangingPorchLantern({referenceMode,x=0,z=0,bodyCenterY,anchorY,
    scale=1,supportBeam,paperMaterial='architecture_hangingLanternPaper',bodyProfile='retained-wide'}={}) {
    const faceted=bodyProfile==='reference10-three-facet';
    if(!['retained-wide','reference10-three-facet'].includes(bodyProfile)||referenceMode!=='reference10'||![x,z,bodyCenterY,anchorY,scale].every(Number.isFinite)
      ||!(scale>0&&scale<=2&&anchorY>bodyCenterY+(faceted?1.12:.65)*scale)
      ||typeof paperMaterial!=='string'||!ctx.materials?.[materialKey(paperMaterial)]?.isMaterial
      ||materialKey(paperMaterial)==='paper'||ctx.materials[materialKey(paperMaterial)]===ctx.materials.paper)
      throw new RangeError('Porch lantern needs a real beam anchor and an explicit private paper material.');
    const clampGauge=.006,clampWidth=.055;
    if(!supportBeam||!['centerX','centerZ','bottomY','topY','width','depth'].every(k=>Number.isFinite(supportBeam[k]))
      ||Math.abs(supportBeam.bottomY-anchorY)>1e-8||supportBeam.topY<=anchorY
      ||supportBeam.depth<=0||Math.abs(x-supportBeam.centerX)+clampWidth/2>supportBeam.width/2
      ||Math.abs(z-supportBeam.centerZ)>supportBeam.depth/2+clampGauge*.5
      ||anchorY-clampGauge<=bodyCenterY+(faceted?1.12:.65)*scale)
      throw new RangeError('Lantern clamp must wrap an explicitly measured retained beam.');
    // Explicit original10 three-facet hypothesis. It does not inherit the
    // rejected single-paper-height target or nonuniformly stretch a body.
    const bodyRadius=faceted?.4522002097181874:.42,bodyYaw=faceted?.13315224285031282:0,
      panes=[],parts=[],radiusAt=y=>bodyRadius+y*(.04/.7),wall=.028,
      arm=faceted?.05266037378314801:.025,paperFront=.022,paperBack=.028;
    const rotateBody=p=>bodyYaw?p.applyAxisAngle(new T.Vector3(0,1,0),bodyYaw):p;
    const makeMesh=(triangles,label,material='black')=>{
      const pp=[];for(const tri of triangles){const [a,b,c]=tri;
        if(v(b).sub(v(a)).cross(v(c).sub(v(a))).lengthSq()<1e-20)continue;
        pp.push(...a,...b,...c);
      }
      // The body hangs at a rigid yaw. The measured beam clamp remains in
      // the original beam axes, not rotated into or away from its support.
      if(bodyYaw&&!label.startsWith('beam-clamp-'))for(let i=0;i<pp.length;i+=3){
        const q=rotateBody(v(pp.slice(i,i+3)));pp[i]=q.x;pp[i+1]=q.y;pp[i+2]=q.z;
      }
      let volume=0;for(let i=0;i<pp.length;i+=9)volume+=v(pp.slice(i,i+3)).dot(v(pp.slice(i+3,i+6)).cross(v(pp.slice(i+6,i+9))))/6;
      if(volume<0)for(let i=0;i<pp.length;i+=9)for(let k=0;k<3;k++){const a=pp[i+3+k];pp[i+3+k]=pp[i+6+k];pp[i+6+k]=a;}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(pp,3));
      geometry.computeVertexNormals();geometry.userData.architectureJoint='porch-lantern-'+label;
      draw(geometry,material,[0,0,0],[scale,scale,scale]);parts.push({label,geometry});return geometry;
    };
    const quad=(out,a,b,c,d)=>out.push([a,b,c],[a,c,d]);
    const hexProfile=(profile,label,material='black',offset=null)=>{
      const triangles=[];
      for(let j=0;j<profile.length-1;j++)for(let k=0;k<6;k++){
        const point=(p,i)=>{const angle=(i-.5)*PI/3;return offset?[p[0]*Math.sin(angle)+offset[0],p[1]+offset[1],p[0]*Math.cos(angle)+offset[2]]:[p[0]*Math.sin(angle),p[1],p[0]*Math.cos(angle)];};
        quad(triangles,point(profile[j],k),point(profile[j],k+1),point(profile[j+1],k+1),point(profile[j+1],k));
      }
      return makeMesh(triangles,label,material);
    };
    const loft=(lo,hi,label,material='black')=>{
      let aa=lo.slice(),bb=hi.slice();const area=aa.reduce((s,p,k)=>s+p[0]*aa[(k+1)%aa.length][2]-aa[(k+1)%aa.length][0]*p[2],0);
      if(area>0){aa.reverse();bb.reverse();}
      const triangles=[];for(let k=0;k<aa.length;k++){const j=(k+1)%aa.length;quad(triangles,aa[k],aa[j],bb[j],bb[k]);}
      for(const ids of T.ShapeUtils.triangulateShape(aa.map(p=>new T.Vector2(p[0],p[2])),[])){
        let top=ids.map(i=>bb[i]),bottom=ids.map(i=>aa[i]);
        if(v(top[1]).sub(v(top[0])).cross(v(top[2]).sub(v(top[0]))).y<0)top.reverse();
        if(v(bottom[1]).sub(v(bottom[0])).cross(v(bottom[2]).sub(v(bottom[0]))).y>0)bottom.reverse();
        triangles.push(top,bottom);
      }
      return makeMesh(triangles,label,material);
    };
    const cylinder=(r,y0,y1,label,material='oldgold')=>{
      const geometry=new T.CylinderGeometry(r,r,y1-y0,16,1,false);geometry.translate(0,(y0+y1)/2,0);
      const p=geometry.attributes.position,triangles=[];for(let i=0;i<geometry.index.count;i+=3)
        triangles.push([0,1,2].map(k=>{const j=geometry.index.getX(i+k);return[p.getX(j),p.getY(j),p.getZ(j)];}));
      return makeMesh(triangles,label,material);
    };
    group(x,bodyCenterY,z,0,()=>{
      // Top/bottom hollow hexagonal rails and six real corner jambs. All
      // rebates share the same analytic inner/outer hexagonal sections.
      for(const [a,b,label] of (faceted?[[-.43,-.31,'bottom-rail'],[.31,.40,'top-rail']]:[[-.35,-.31,'bottom-rail'],[.31,.35,'top-rail']]))
        hexProfile([[radiusAt(a)-wall/Math.cos(PI/6),a],[radiusAt(a),a],
          [radiusAt(b),b],[radiusAt(b)-wall/Math.cos(PI/6),b],
          [radiusAt(a)-wall/Math.cos(PI/6),a]],label);
      for(let k=0;k<6;k++){
        const theta=(k-.5)*PI/3;
        const section=y=>{
          const R=radiusAt(y),ri=R-wall/Math.cos(PI/6),corner=r=>[r*Math.sin(theta),y,r*Math.cos(theta)];
          const along=(r,dir)=>{const a=corner(r),b=[r*Math.sin(theta+dir*PI/3),y,r*Math.cos(theta+dir*PI/3)];return a.map((p,i)=>p+(b[i]-p)*arm/r);};
          return[along(R,-1),corner(R),along(R,1),along(ri,1),corner(ri),along(ri,-1)];
        };
        loft(section(-.31),section(.31),'corner-jamb-'+k);
      }
      const facePoint=(face,t,y,depth)=>{
        const angle=face*PI/3,n=v([Math.sin(angle),0,Math.cos(angle)]),side=v([Math.cos(angle),0,-Math.sin(angle)]);
        return n.multiplyScalar(radiusAt(y)*Math.cos(PI/6)-depth).addScaledVector(side,t).setY(y).toArray();
      };
      const half=(y,depth)=>radiusAt(y)/2-arm-depth/Math.sqrt(3);
      const paneSolid=(face,y0,y1,d0,d1,halfAt,label,material,centreAt=()=>0)=>{
        const ring=(y,d)=>[-1,1].map(sign=>facePoint(face,centreAt(y,d)+sign*halfAt(y,d),y,d));
        const [a,b]=ring(y0,d0),[c,d]=ring(y1,d0),[e,f]=ring(y0,d1),[g,h]=ring(y1,d1),triangles=[];
        quad(triangles,a,b,d,c);quad(triangles,f,e,g,h);quad(triangles,e,a,c,g);
        quad(triangles,b,f,h,d);quad(triangles,e,f,b,a);quad(triangles,c,d,h,g);
        return makeMesh(triangles,label,material);
      };
      for(let face=0;face<6;face++){
        const geometry=paneSolid(face,-.31,.31,paperFront,paperBack,half,'paper-'+face,paperMaterial);
        // Visible grille is structural and remains separate from the emitting
        // paper: one narrow vertical and two crossing horizontal metal bars.
        paneSolid(face,-.31,.31,.010,paperFront,()=>.007,'vertical-grille-'+face,'oldgold');
        for(const yy of [-.105,.105])for(const side of [-1,1])
          paneSolid(face,yy-.006,yy+.006,.010,.019,(y,d)=>(half(y,d)-.007)/2,
            'horizontal-grille-'+face,'oldgold',(y,d)=>side*(half(y,d)+.007)/2);
        const angle=face*PI/3,slope=(.04/.7)*Math.cos(PI/6),normal=v([Math.sin(angle),-slope,Math.cos(angle)]).normalize();
        const surface=v(facePoint(face,0,0,paperFront)),width0=half(-.31,paperFront)*2,width1=half(.31,paperFront)*2;
        const slantHeight=.62*Math.sqrt(1+slope*slope);
        const matrix=stack?.[stack.length-1]||new T.Matrix4();
        const toWorld=p=>rotateBody(p.clone()).multiplyScalar(scale).applyMatrix4(matrix).toArray();
        const tangent=v([Math.cos(angle),0,-Math.sin(angle)]),vertical=v([Math.sin(angle)*slope,1,Math.cos(angle)*slope]).normalize();
        const transformDirection=d=>rotateBody(d.clone()).transformDirection(matrix).toArray();
        const length=d=>rotateBody(d.clone()).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix)).length()*scale;
        const bodyMatrix=bodyYaw?matrix.clone().multiply(new T.Matrix4().makeRotationY(bodyYaw)):matrix,normalMatrix=new T.Matrix3().getNormalMatrix(bodyMatrix),worldNormal=normal.clone().applyMatrix3(normalMatrix).normalize();
        const width=(width0+width1)/2,worldWidth=width*length(tangent),worldHeight=slantHeight*length(vertical);
        const cross=rotateBody(tangent.clone()).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix))
          .cross(rotateBody(vertical.clone()).applyMatrix3(new T.Matrix3().setFromMatrix4(matrix))).length()*scale*scale;
        const emitterSamples=[-1,1].map(side=>toWorld(surface.clone().addScaledVector(tangent,side*width*.25).addScaledVector(normal,.006)));
        const worldMatrix=matrix.clone().multiply(new T.Matrix4().makeScale(scale,scale,scale));
        const worldCorners=[[-1,-.31],[1,-.31],[1,.31],[-1,.31]].map(([sign,y])=>toWorld(v(facePoint(face,sign*half(y,paperFront),y,paperFront))));
        panes.push({kind:'porch-lantern-window',face,surfaceWorldCenter:toWorld(surface),
          worldCenter:toWorld(surface.clone().addScaledVector(normal,.006)),worldNormal:worldNormal.toArray(),
          worldWidth,worldHeight,worldArea:width*slantHeight*cross,
          worldTangent:transformDirection(tangent),worldVertical:transformDirection(vertical),
          emitterSamples,widthBottom:width0,widthTop:width1,localHeight:slantHeight,
          material:ctx.materials[materialKey(paperMaterial)],materialKey:materialKey(paperMaterial),
          geometry,worldMatrix:worldMatrix.toArray(),worldCorners,
          inwardWorldNormal:worldNormal.clone().negate().toArray(),paperCastsShadow:false,
          localSurfaceCenter:rotateBody(surface.clone()).toArray(),localNormal:rotateBody(normal.clone()).toArray()});
      }
      // Hexagonal roof seat is flush with the upper rail. Its .012 central
      // bore fits the true suspension shank, with a bearing head underneath.
      if(faceted){
        hexProfile([[.012,.82],[.045,.82],[.11,.74],[.22,.62],[.60,.45],[.67,.49],
          [.67,.46],[.60,.42],[radiusAt(.40),.40],[radiusAt(.40)-.04,.40],
          [radiusAt(.40)-.04,.425],[.025,.80],[.012,.80],[.012,.82]],'roof-shade');
        hexProfile([[.014,.82],[.08,.82],[.10,.86],[.06,.90],[.065,.95],
          [.09,.98],[.06,1.02],[.04,1.07],[.014,1.07],[.014,.82]],'upper-crown','oldgold');
        hexProfile([[0,.78],[.025,.78],[.025,.80],[0,.80]],'suspension-head','oldgold');
      }else{
        hexProfile([[.012,.60],[.04,.60],[.12,.565],[.49,.39],[.56,.415],
          [.56,.39],[.49,.365],[.44,.35],[.40,.35],[.40,.375],[.025,.58],
          [.012,.58],[.012,.60]],'roof-shade');
        hexProfile([[0,.56],[.025,.56],[.025,.58],[0,.58]],'suspension-head','oldgold');
      }
      const anchor=(anchorY-clampGauge-bodyCenterY)/scale,shankBase=faceted?.80:.58;
      hexProfile([[0,shankBase],[.012,shankBase],[.012,anchor],[0,anchor]],'suspension-shank','oldgold');
      // A closed U strap with a top closing plate takes the hanging load on
      // the actual beam's upper surface. It is not a rod merely touching the
      // underside. Four butt-jointed plates wrap the retained beam without
      // requiring a hidden shader hole, buried block or extra support post.
      const plate=(xx,yy,zz,w,h,d,label)=>{
        const g=new T.BoxGeometry(w/scale,h/scale,d/scale);g.translate((xx-x)/scale,(yy-bodyCenterY)/scale,(zz-z)/scale);
        const p=g.attributes.position,triangles=[];for(let i=0;i<g.index.count;i+=3)triangles.push([0,1,2].map(k=>{const j=g.index.getX(i+k);return[p.getX(j),p.getY(j),p.getZ(j)];}));
        makeMesh(triangles,label);
      };
      const B=supportBeam;
      for(const yy of [B.bottomY-clampGauge/2,B.topY+clampGauge/2])
        plate(x,yy,B.centerZ,clampWidth,clampGauge,B.depth+2*clampGauge,'beam-clamp-horizontal');
      for(const side of [-1,1])plate(x,(B.bottomY+B.topY)/2,B.centerZ+side*(B.depth/2+clampGauge/2),
        clampWidth,B.topY-B.bottomY,clampGauge,'beam-clamp-side');
      if(faceted){
        hexProfile([[0,-.47],[.50,-.47],[.50,-.43],[0,-.43]],'bottom-plate');
        hexProfile([[0,-.63],[.065,-.63],[.15,-.59],[.35,-.52],[.50,-.47],[0,-.47]],'bottom-bowl');
        // A visibly left-displaced lower suspension is a separate rigid
        // pendant hypothesis, not a deformation of the six paper faces.
        const shift=-.13,path=new T.CatmullRomCurve3([v([0,-.63,0]),v([0,-.66,0]),
          v([shift,-.80,0]),v([shift,-.86,0])]),tube=new T.TubeGeometry(path,32,.008,12,false),triangles=[],pos=tube.attributes.position;
        for(let i=0;i<tube.index.count;i+=3)triangles.push([0,1,2].map(k=>{const j=tube.index.getX(i+k);return[pos.getX(j),pos.getY(j),pos.getZ(j)];}));
        for(const [row,centre,flip]of [[0,[0,-.63,0],true],[32,[shift,-.86,0],false]])for(let i=0;i<12;i++){
          const a=row*13+i,b=a+1,tri=[centre,[pos.getX(a),pos.getY(a),pos.getZ(a)],[pos.getX(b),pos.getY(b),pos.getZ(b)]];if(flip)tri.reverse();triangles.push(tri);
        }
        makeMesh(triangles,'pendant-chain','oldgold');
        hexProfile([[0,-.98],[.025,-.98],[.06,-.95],[.075,-.91],[.035,-.88],[.012,-.86],[0,-.86]],'pendant-cap','oldgold',[shift,0,0]);
        hexProfile([[0,-1.035],[.012,-1.035],[.012,-.98],[0,-.98]],'pendant-thread','paintOchre',[shift,0,0]);
        // Closed fluted cloth bundle with real volume and a seated top.
        // The photographic fringe is not represented as five floating rods.
        const levels=[[0,-1.035],[.019,-1.035],[.05,-1.08],[.074,-1.16],[.104,-1.39],[.098,-1.42],[0,-1.42]],cloth=[];
        for(let j=0;j<levels.length-1;j++)for(let i=0;i<96;i++){
          const point=(p,k)=>{const a=k*2*PI/96,r=p[0]*(1+.045*Math.cos(k*2*PI/4));return[shift+r*Math.sin(a),p[1],r*Math.cos(a)];};
          quad(cloth,point(levels[j],i),point(levels[j],i+1),point(levels[j+1],i+1),point(levels[j+1],i));
        }
        makeMesh(cloth,'pendant-cloth','paintOchre');
      }else{
      hexProfile([[0,-.39],[.45,-.39],[.45,-.35],[0,-.35]],'bottom-plate');
      hexProfile([[0,-.50],[.06,-.50],[.18,-.48],[.34,-.43],[.45,-.39],[0,-.39]],'bottom-bowl');
      cylinder(.012,-.55,-.50,'pendant-neck');
      hexProfile([[0,-.60],[.045,-.60],[.045,-.58],[.025,-.55],[0,-.55]],'pendant-cap','oldgold');
      for(const [dx,dz,tail]of [[0,0,-.78],[.014,0,-.765],[-.014,0,-.775],[0,.014,-.77],[0,-.014,-.76]]){
        const g=new T.CylinderGeometry(.0035,.0025,-.60-tail,8,1,false);g.translate(dx,(tail-.60)/2,dz);
        const p=g.attributes.position,triangles=[];for(let i=0;i<g.index.count;i+=3)triangles.push([0,1,2].map(k=>{const j=g.index.getX(i+k);return[p.getX(j),p.getY(j),p.getZ(j)];}));
        makeMesh(triangles,'pendant-fringe','darkwood');
      }
      }
    });
    const matrix=stack?.[stack.length-1]||new T.Matrix4(),world=p=>v(p).applyMatrix4(matrix).toArray();
    return{kind:'reference10-hex-porch-lantern',referenceMode,bodyCenter:world([x,bodyCenterY,z]),
      anchorWorld:world([x,anchorY-clampGauge,z]),beamContactWorld:world([x,supportBeam.topY,supportBeam.centerZ]),supportBeam:{...supportBeam},clampGauge,
      chamberWorldCenter:world([x,bodyCenterY,z]),
      sourceCount:1,scale,bodyProfile,bodyRadius,bodyYaw,bodyHeight:faceted?.83:.70,windows:panes,parts,
      shadowPolicy:'Only the dedicated paper material transmits; all metal framing, roof and base retain castShadow.', 
      material:ctx.materials[materialKey(paperMaterial)],createsLights:false};
  }

  /** Reference10-only central finial, seated on a real mast through the
   * paired pagodaRoof apex opening. baseY is the ACTUAL roof-axis peak,
   * not the near upturned corner or a hard-coded previous taper's peak.
   */
  function pagodaFinial({referenceMode,x=0,z=0,baseY,height=7.2,
    floorTopY,roofWidth,roofDepth=roofWidth,roofRise,ringCount=7,
    baseWidth=1.35,openingHalf=.14}={}) {
    if(referenceMode!=='reference10'||![x,z,baseY,height,floorTopY,roofWidth,roofDepth,roofRise,baseWidth,openingHalf].every(Number.isFinite)
      ||!(height>=6&&height<=9&&baseY>floorTopY+.6&&roofWidth>baseWidth&&roofDepth>baseWidth&&roofRise>0&&baseWidth>=2*openingHalf+.10)
      ||!Number.isInteger(ringCount)||ringCount<5||ringCount>9||openingHalf<.13||openingHalf>.18)
      throw new RangeError('Finial needs an explicit reference10 mode and actual floor/roof datums.');
    const roofDatum=baseY-roofRise,shaftRadius=.065,mastRadius=.10;
    const sample=pagodaRoofSampler(roofWidth,roofDepth,roofRise);
    const bootLow=-.30,bootHigh=.12;
    const edgeBottom=Math.min(...[0,1,2,3].map(face=>
      sample(face,2*openingHalf/(face<2?roofDepth:roofWidth),0,-.18).y-roofRise));
    if(!(floorTopY<roofDatum&&edgeBottom>=bootLow+.006))
      throw new RangeError('Finial mast or flashing would miss the actual retained floor/roof.');
    const profileGeometry=profile=>{
      const positions=[],normals=[],uv=[];
      const emit=(a,b,c,na,nb,nc)=>{if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-20)return;
        for(const [p,n]of [[a,na],[b,nb],[c,nc]]){positions.push(...p.toArray());normals.push(...n.toArray());uv.push(0,0);}};
      for(let j=0;j<profile.length-1;j++){
        const [r0,y0]=profile[j],[r1,y1]=profile[j+1],dr=r1-r0,dy=y1-y0;
        for(let k=0;k<48;k++){
          const t0=k*2*PI/48,t1=(k+1)*2*PI/48;
          const point=(r,y,t)=>v([r*Math.sin(t),y,r*Math.cos(t)]);
          const normal=t=>v([dy*Math.sin(t),-dr,dy*Math.cos(t)]).normalize();
          const a=point(r0,y0,t0),b=point(r0,y0,t1),c=point(r1,y1,t0),d=point(r1,y1,t1),n0=normal(t0),n1=normal(t1);
          emit(a,b,c,n0,n1,n0);emit(b,d,c,n1,n1,n0);
        }
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;
    };
    const metal=(geometry,label,position=[0,0,0],material='oldgold')=>{
      // Remove only degenerate pole triangles. Keep analytic radial normals
      // smooth around the circumference and sharp across real profile creases.
      const p=geometry.attributes.position,n=geometry.attributes.normal,tx=geometry.attributes.uv,
        positions=[],normals=[],uv=[],count=geometry.index?.count||p.count;
      for(let i=0;i<count;i+=3){const ids=[0,1,2].map(k=>geometry.index?geometry.index.getX(i+k):i+k),q=ids.map(k=>v([p.getX(k),p.getY(k),p.getZ(k)])),face=q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0]));if(face.lengthSq()<1e-20)continue;face.normalize();
        for(let j=0;j<3;j++){const k=ids[j],nn=v([n.getX(k),n.getY(k),n.getZ(k)]);if(nn.lengthSq()<.1)nn.copy(face);positions.push(...q[j].toArray());normals.push(...nn.toArray());uv.push(tx?.getX(k)||0,tx?.getY(k)||0);}}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
      g.userData.architectureJoint='finial-'+label;draw(g,material,position,[1,1,1]);
    };
    const cylinder=(radius,y0,y1,label,material='oldgold')=>
      metal(new T.CylinderGeometry(radius,radius,y1-y0,48,1,false),label,[0,(y0+y1)/2,0],material);
    const annulus=(outer,y0,y1,label)=>metal(profileGeometry([
      [shaftRadius,y0],[outer,y0],[outer,y1],[shaftRadius,y1],[shaftRadius,y0]]),label);
    const solidBox=(xx,yy,zz,w,h,d,label,material='oldgold')=>{
      const geometry=new T.BoxGeometry(w,h,d);metal(geometry,label,[xx,yy,zz],material);
    };
    group(x,baseY,z,0,()=>{
      // The hidden support is seated on the retained top storey's actual
      // floor box, not on roof tiles. It reaches the cap plate with no gap.
      cylinder(.18,floorTopY-baseY,floorTopY-baseY+.07,'mast-foot-seat');
      cylinder(mastRadius,floorTopY-baseY+.07,.12,'central-mast','darkwood');
      // Four butt-jointed metal flashing walls fill the same square opening
      // cut through roof skins/ridges; the cap seals the throat from rain.
      const wall=.006,h=.42,y=-.09,half=openingHalf;
      for(const side of [-1,1]){
        solidBox(0,y,side*(half-wall/2),half*2,h,wall,'boot-front-back');
        solidBox(side*(half-wall/2),y,0,wall,h,half*2-wall*2,'boot-left-right');
      }
      solidBox(0,.20,0,baseWidth,.16,baseWidth,'square-cap-seat');
      const first=height*.275,last=height*.630,cageBottom=last+.135,cageTop=height*.805;
      const supports=Array.from({length:ringCount},(_,i)=>({y:T.MathUtils.lerp(first,last,i/(ringCount-1))-.030,r:.12}));
      supports.push({y:cageBottom,r:.13},{y:cageTop-.04,r:.13},
        {y:height*.845-.16,r:.11},{y:height*.918-.17,r:.11});
      supports.sort((a,b)=>a.y-b.y);
      const spindle=[[0,.28],[shaftRadius,.28]];
      for(const support of supports)spindle.push([shaftRadius,support.y-.025],
        [support.r,support.y-.025],[support.r,support.y],[shaftRadius,support.y]);
      spindle.push([shaftRadius,height-.30],[0,height-.30]);
      metal(profileGeometry(spindle),'bronze-spindle-with-bearing-ledges');
      // Broad lower bowl and neck are bored through for the real spindle.
      metal(profileGeometry([[shaftRadius,.28],[.31,.28],[.31,.36],[.22,.51],
        [.16,.68],[.24,.78],[.39,.92],[.48,1.10],[.46,1.23],[.27,1.38],
        [shaftRadius,1.38],[shaftRadius,.28]]),'lower-lotus-bowl',[0,0,0],'gold');
      for(let i=0;i<ringCount;i++){
        const t=i/(ringCount-1),yy=T.MathUtils.lerp(first,last,t),radius=.46-.06*t;
        // Continuous shallow annular trays reach the spindle; no floating
        // torus, no hidden solid disk intersecting the same centre pole.
        metal(profileGeometry([[shaftRadius,yy-.030],[.12,yy-.030],[radius*.85,yy+.015],
          [radius,yy+.100],[radius,yy+.135],[radius*.85,yy+.050],
          [shaftRadius,yy+.005],[shaftRadius,yy-.030]]),'connected-ring-'+i);
      }
      const plate=.04,a=.255,rib=.026;
      annulus(.39,cageBottom,cageBottom+plate,'cage-lower-hub');
      annulus(.39,cageTop-plate,cageTop,'cage-upper-hub');
      for(const sx of [-1,1])for(const sz of [-1,1])
        solidBox(sx*a,(cageBottom+cageTop)/2,sz*a,rib,cageTop-cageBottom-2*plate,rib,'cage-upright');
      for(let j=1;j<=5;j++){
        const yy=T.MathUtils.lerp(cageBottom+plate,cageTop-plate,j/6);
        for(const side of [-1,1]){
          solidBox(0,yy,side*a,2*a-rib,rib,rib,'cage-rung-x');
          solidBox(side*a,yy,0,rib,rib,2*a-rib,'cage-rung-z');
        }
      }
      for(const [fraction,rr,hh] of [[.845,.18,.32],[.918,.19,.34]]){
        const yy=height*fraction;
        metal(profileGeometry([[shaftRadius,yy-hh/2],[.11,yy-hh/2],[rr*.55,yy-hh*.43],
          [rr,yy-hh*.10],[rr,yy+hh*.10],[rr*.55,yy+hh*.43],
          [shaftRadius,yy+hh/2],[shaftRadius,yy-hh/2]]),'upper-globe',[0,0,0],'gold');
      }
      const tip=new T.ConeGeometry(shaftRadius,.30,48,1,false);
      metal(tip,'conservative-tip',[0,height-.15,0],'gold');
    });
    const matrix=stack?.[stack.length-1]||new T.Matrix4();
    const world=p=>v(p).applyMatrix4(matrix).toArray();
    return {kind:'reference10-pagoda-finial',referenceMode,baseY,height,ringCount,
      floorTopY,roofDatum,roofWidth,roofDepth,roofRise,openingHalf,
      capBottomY:baseY+bootHigh,bootBottomY:baseY+bootLow,
      minimumRoofEdgeBottomY:baseY+edgeBottom,
      support:{mastRadius,seatRadius:.18,mastBottomY:floorTopY+.07,mastTopY:baseY+.12},
      worldBase:world([x,baseY,z]),worldTop:world([x,baseY+height,z]),
      topPointStatus:'Conservative continuation; original photo hides the uppermost narrow stem behind the foreground eave.',
      pairedRoofOptions:{referenceMode:'reference10',apexOpeningHalf:openingHalf}};
  }

  /** Optional reference10 porch substructure. Call only in the retained
   * threshold's existing local stack, after clipping its actual terrain mesh.
   * It supplies no paving finish and never changes a pillar or walking datum.
   */
  function thresholdPorchSupport({referenceMode,bounds,foundationTop,finishTop,terrainEnvelope,
    supportColumns,embed=.04,holeClearance=.005}={}) {
    if(referenceMode!=='reference10')throw new RangeError('Threshold reconstruction must be explicitly enabled only for reference10.');
    const validBounds=bounds&&['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(bounds[k]))
      &&bounds.minX<bounds.maxX&&bounds.minZ<bounds.maxZ;
    if(!validBounds||![foundationTop,finishTop,embed,holeClearance].every(Number.isFinite)
      ||!(finishTop>foundationTop&&embed>0&&holeClearance>=.002)
      ||!terrainEnvelope||!Array.isArray(supportColumns)||!supportColumns.length)
      throw new RangeError('Porch support needs explicit finish bounds, terrain and existing column datums.');
    let groundMin=Infinity,groundMax=-Infinity;
    if(terrainEnvelope) {
      if(![terrainEnvelope.min,terrainEnvelope.max].every(Number.isFinite)||terrainEnvelope.min>terrainEnvelope.max
        ||typeof terrainEnvelope.source!=='string'||!terrainEnvelope.source.length
        ||!Number.isInteger(terrainEnvelope.primitiveCount)||terrainEnvelope.primitiveCount<1
        ||!terrainEnvelope.worldBounds||!Array.isArray(terrainEnvelope.worldHeightRange)
        ||terrainEnvelope.worldHeightRange.length!==2||!terrainEnvelope.worldHeightRange.every(Number.isFinite))
        throw new RangeError('Exact terrain envelope needs bounds and source provenance.');
      const matrix=stack?.[stack.length-1]||new T.Matrix4();
      if(Math.abs(matrix.elements[1])+Math.abs(matrix.elements[9])>1e-8)
        throw new RangeError('Terrain envelope cannot be reused in a tilted porch frame.');
      const worldHeights=[terrainEnvelope.min,terrainEnvelope.max].map(y=>v([0,y,0]).applyMatrix4(matrix).y).sort((a,b)=>a-b);
      if(worldHeights.some((y,i)=>Math.abs(y-terrainEnvelope.worldHeightRange[i])>1e-6))
        throw new RangeError('Terrain evidence and porch vertical transform disagree.');
      const footprint=new T.Box3();
      for(const x of [bounds.minX,bounds.maxX])for(const z of [bounds.minZ,bounds.maxZ])
        footprint.expandByPoint(v([x,0,z]).applyMatrix4(matrix));
      for(const [field,value] of [['minX',footprint.min.x],['maxX',footprint.max.x],['minZ',footprint.min.z],['maxZ',footprint.max.z]])
        if(!Number.isFinite(terrainEnvelope.worldBounds[field])||Math.abs(terrainEnvelope.worldBounds[field]-value)>1e-6)
          throw new RangeError('Terrain evidence does not cover this transformed porch footprint.');
      groundMin=terrainEnvelope.min;groundMax=terrainEnvelope.max;
    }
    // A single shallow masonry bed has a real excavated underside. This is
    // not eight invented equal-length piers floating over unequal soil.
    const foundationBottom=groundMin-embed;
    if(!(foundationTop>groundMax+.005))throw new RangeError('Ground rises through the proposed porch substructure.');
    const profile=[[1.17,0],[1.24,.10],[1.24,.25],[1.16,.40],[1.06,.44],[1.02,.64],[.92,.82],[.88,1]];
    const seats=supportColumns.map(c=>{
      if(![c.x,c.z,c.bottom,c.radius].every(Number.isFinite)||!(c.radius>0&&c.bottom>foundationTop&&finishTop<c.bottom+.30))
        throw new RangeError('Existing stone-foot datum does not meet the supplied porch layers.');
      const radial=c.radius*1.38,baseRadius=1.17*radial,t=(finishTop-c.bottom)/.30;
      if(t<=0)throw new RangeError('The requested finish does not surround the retained stone foot.');
      const radiusAt=yy=>{
        if(yy<=c.bottom)return baseRadius;
        const tt=(yy-c.bottom)/.30;let k=1;while(k<profile.length-1&&tt>profile[k][1])k++;
        return radial*T.MathUtils.lerp(profile[k-1][0],profile[k][0],(tt-profile[k-1][1])/(profile[k][1]-profile[k-1][1]));
      };
      const levels=[foundationTop,c.bottom,...profile.map(p=>c.bottom+p[1]*.30).filter(y=>y>c.bottom&&y<finishTop),finishTop]
        .filter((y,i,a)=>!i||y-a[i-1]>1e-10);
      const maxRadius=Math.max(...levels.map(radiusAt)),holeRadius=maxRadius+holeClearance;
      if(c.x-holeRadius<bounds.minX||c.x+holeRadius>bounds.maxX||c.z-holeRadius<bounds.minZ||c.z+holeRadius>bounds.maxZ)
        throw new RangeError('The retained stone foot extends beyond the supplied supported paving bounds.');
      const polygon=Array.from({length:32},(_,k)=>{const a=k*PI/16;return[c.x+Math.sin(a)*holeRadius,c.z+Math.cos(a)*holeRadius];});
      return {...c,baseRadius,holeRadius,radiusAt,levels,polygon};
    });
    // Everything above is checked before any geometry/material is emitted.
    const mortarKey='architecture_thresholdMortar';
    if(ctx.materials?.stone&&!ctx.materials[mortarKey]) {
      const source=ctx.materials.stone,m=source.clone();m.name=mortarKey;
      m.color.setHex(0x565047);m.roughness=.97;m.metalness=0;
      m.onBeforeCompile=source.onBeforeCompile;const key=source.customProgramCacheKey.bind(source);
      m.customProgramCacheKey=()=>key()+':reference-threshold-mortar-13';ctx.materials[mortarKey]=m;
    }
    const mortarMaterial=ctx.materials?.[mortarKey]?mortarKey:'stone';
    box((bounds.minX+bounds.maxX)/2,(foundationTop+foundationBottom)/2,(bounds.minZ+bounds.maxZ)/2,
      bounds.maxX-bounds.minX,foundationTop-foundationBottom,bounds.maxZ-bounds.minZ,'stone',0,.76);
    for(const c of seats) {
      const seat=new T.CylinderGeometry(c.baseRadius,c.baseRadius,c.bottom-foundationTop,32,1,false);
      seat.userData.architectureJoint='threshold-stone-foot-seat';
      draw(seat,'stone',[c.x,(foundationTop+c.bottom)/2,c.z],[1,1,1],null,.78);
      // Mortar follows the exact retained 32-sided foot profile instead of
      // overlapping a stone cylinder. Its outer polygon is the paving hole.
      const path=[[c.baseRadius,foundationTop],[c.holeRadius,foundationTop],[c.holeRadius,finishTop],
        ...c.levels.slice().reverse().map(y=>[c.radiusAt(y),y])];
      const ring=new T.LatheGeometry(path.map(p=>new T.Vector2(...p)),32);ring.computeVertexNormals();
      ring.userData.architectureJoint='threshold-foot-mortar-collar';
      draw(ring,mortarMaterial,[c.x,0,c.z],[1,1,1]);
    }
    const matrix=stack?.[stack.length-1]||new T.Matrix4();
    const holes=seats.map(c=>({localCenter:[c.x,finishTop,c.z],localRadius:c.holeRadius,
      localPolygon:c.polygon,worldPolygon:c.polygon.map(([x,z])=>v([x,finishTop,z]).applyMatrix4(matrix).toArray()),
      stoneFootBottom:c.bottom,seatRadius:c.baseRadius,
      worldContact:v([c.x,c.bottom,c.z]).applyMatrix4(matrix).toArray()}));
    return {kind:'reference10-threshold-substructure',optIn:true,bounds:{...bounds},foundationTop,foundationBottom,
      finishTop,groundMin,groundMax,minimumEmbed:embed,holes,
      materialKey:mortarMaterial,terrainScope:'Exact clipped terrain envelope; horizontal/vertical transform bounds checked.',
      terrainSource:terrainEnvelope?.source||null,terrainPrimitiveCount:terrainEnvelope?.primitiveCount||null};
  }

  /** Reference4 front canopy. This optional hook is not the main hall's hip
   * roof and is never enabled by merely upgrading the module. Its front
   * silhouette is measured from the original image; no returned image is used.
   * The old closed ornamental pediment is replaced by visible curved ribs,
   * six properly notched projecting timbers and an open central frame.
   */
  function karahafuEntrance({x=0,y=0,z=0,w=8.2,d=5.8,rise=1.63,endRise=.42,
    backRise=0,detail=true,supportColumns=[],beamWidth=.16,tileCount=46,tileRadius=.070,hostRoof=null,alignHostEave=true,upperWoodOpening=null,ceilingClearanceY=null,retainedGallery=null}={}) {
    if(!(w>2&&d>1&&rise>endRise&&endRise>=0&&backRise>=0))throw new RangeError('Invalid entrance canopy dimensions.');
    const front=d/2,beamAxes=[-.35,-.22,-.12,.12,.22,.35].map(a=>a*w);
    const knots=[0,.125,.25,.375,.5,.625,.75,.875,1];
    const ordinates=[1,.96,.82,.62,.45,.30,.18,.085,0];
    const slopes=ordinates.map((v,i)=>i===0?0:i===knots.length-1?
      (v-ordinates[i-1])/(knots[i]-knots[i-1]):
      2/((knots[i]-knots[i-1])/(v-ordinates[i-1])+(knots[i+1]-knots[i])/(ordinates[i+1]-v)));
    const measured=u=>{
      u=Math.min(1,Math.abs(u));let i=0;while(i<knots.length-2&&u>knots[i+1])i++;
      const h=knots[i+1]-knots[i],t=(u-knots[i])/h;
      return (2*t*t*t-3*t*t+1)*ordinates[i]+(t*t*t-2*t*t+t)*h*slopes[i]
        +(-2*t*t*t+3*t*t)*ordinates[i+1]+(t*t*t-t*t)*h*slopes[i+1];
    };
    // All timber faces share one piecewise profile. Remove generic knots
    // inside a purlin width so the roof skin and its raked top are coincident,
    // instead of interpenetrating two independently sampled curved surfaces.
    const xs=[-w/2,w/2,...Array.from({length:95},(_,i)=>-w/2+w*(i+1)/96)
      .filter(xx=>!beamAxes.some(b=>Math.abs(xx-b)<beamWidth/2)),
      ...beamAxes.flatMap(b=>[b-beamWidth/2,b+beamWidth/2])].sort((a,b)=>a-b)
      .filter((v,i,a)=>!i||v-a[i-1]>1e-9);
    const heights=xs.map(xx=>endRise+(rise-endRise)*measured(xx/(w/2)));
    const frontHeight=xx=>{
      let i=0;while(i<xs.length-2&&xx>xs[i+1])i++;
      return T.MathUtils.lerp(heights[i],heights[i+1],(xx-xs[i])/(xs[i+1]-xs[i]));
    };
    const roofY=(xx,zz)=>frontHeight(xx)+backRise*(front-zz)/d;
    // Use the host's actual 20x40 triangulated backing, not a second smooth
    // approximation which would penetrate/float along the glazing contact.
    const hostSurface=(xx,zz)=>{
      const t=(z+zz)/(hostRoof.d/2),ridge=hostRoof.w*.245,span=t=>ridge+(hostRoof.w/2-ridge)*t;
      const u=(x+xx)/span(t),j=Math.min(19,Math.max(0,Math.floor(t*20)));
      const i=Math.min(39,Math.max(0,Math.floor((u+1)*20))),t0=Math.max(.001,j/20),t1=(j+1)/20;
      const u0=-1+i/20,u1=u0+.05;
      const point=(tt,uu)=>[uu*span(tt),hostRoof.datum+hostRoof.rise*Math.pow(Math.max(0,1-tt),1.43)
        +.48*Math.pow(tt,9)*(.25+Math.pow(Math.abs(uu),7)),tt*hostRoof.d/2];
      const aa=point(t0,u0),bb=point(t0,u1),cc=point(t1,u0),dd=point(t1,u1);
      const qx=x+xx,qz=z+zz,f=(qz-aa[2])/(cc[2]-aa[2]);
      const triangle=qx<=(1-f)*bb[0]+f*cc[0]?[aa,cc,bb]:[bb,cc,dd];
      const [a,b,c]=triangle,det=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
      const wa=((b[2]-c[2])*(qx-c[0])+(c[0]-b[0])*(qz-c[2]))/det;
      const wb=((c[2]-a[2])*(qx-c[0])+(a[0]-c[0])*(qz-c[2]))/det;
      return wa*a[1]+wb*b[1]+(1-wa-wb)*c[1];
    };
    const hostY=(xx,zz)=>hostSurface(xx,zz)-y;
    if(hostRoof) {
      if(alignHostEave)y=(hostSurface(-w/2,front)+hostSurface(w/2,front))/2-endRise;
      if(Math.abs(z+front-hostRoof.d/2)>1e-7)throw new RangeError('Entrance front must meet the existing main eave.');
      for(const sign of [-1,1])if(Math.abs(roofY(sign*w/2,front)-hostY(sign*w/2,front))>1e-6)
        throw new RangeError('Entrance eave corner must share the exact host surface height.');
    }
    let galleryClearance=null;
    if(retainedGallery) {
      if(!hostRoof||![retainedGallery.frontZ,retainedGallery.floorBottomY].every(Number.isFinite))
        throw new RangeError('Retained gallery requires its real front edge and floor underside.');
      const upstandRear=z-d/2-.067;
      const sheetTop=Math.max(...[-1,1].map(sign=>hostSurface(sign*(w/2+.18),-d/2-.16)))-.018;
      galleryClearance={vertical:retainedGallery.floorBottomY-sheetTop,
        longitudinal:upstandRear-retainedGallery.frontZ};
      if(galleryClearance.longitudinal<.005||galleryClearance.vertical<.005)
        throw new RangeError('Entrance weather junction intersects the retained upper-gallery floor.');
    }
    const loft=(xxs,zzs,upper,lower,label)=>{
      const pp=[],uv=[];
      const quad=(aa,bb,cc,dd,direction)=>{
        const a=v(aa),b=v(bb),c=v(cc),d=v(dd);let cross=b.clone().sub(a).cross(c.clone().sub(a));
        if(cross.lengthSq()<1e-20)cross=c.clone().sub(a).cross(d.clone().sub(a));
        const list=cross.dot(v(direction))<0?[aa,dd,cc,aa,cc,bb]:[aa,bb,cc,aa,cc,dd];
        for(let i=0;i<6;i+=3) {
          const p0=v(list[i]),p1=v(list[i+1]),p2=v(list[i+2]);
          if(p1.sub(p0).cross(p2.sub(p0)).lengthSq()<1e-20)continue;
          for(const p of list.slice(i,i+3)){pp.push(...p);uv.push(p[0],p[2]);}
        }
      };
      const p=(xx,zz,top,mid=xx)=>[xx,(top?upper:lower)(xx,zz,mid),zz];
      for(let i=0;i<xxs.length-1;i++)for(let j=0;j<zzs.length-1;j++) {
        const a=xxs[i],b=xxs[i+1],c=zzs[j],dd=zzs[j+1];
        quad(p(a,c,true,(a+b)/2),p(b,c,true,(a+b)/2),p(b,dd,true,(a+b)/2),p(a,dd,true,(a+b)/2),[0,1,0]);
        quad(p(a,c,false,(a+b)/2),p(b,c,false,(a+b)/2),p(b,dd,false,(a+b)/2),p(a,dd,false,(a+b)/2),[0,-1,0]);
      }
      for(let j=0;j<zzs.length-1;j++)for(const side of [-1,1]) {
        const xx=side<0?xxs[0]:xxs.at(-1),a=zzs[j],b=zzs[j+1];
        const mid=side<0?(xxs[0]+xxs[1])/2:(xxs.at(-2)+xxs.at(-1))/2;
        quad(p(xx,a,true,mid),p(xx,b,true,mid),p(xx,b,false,mid),p(xx,a,false,mid),[side,0,0]);
      }
      for(let i=0;i<xxs.length-1;i++)for(const side of [-1,1]) {
        const zz=side<0?zzs[0]:zzs.at(-1),a=xxs[i],b=xxs[i+1];
        quad(p(a,zz,true,(a+b)/2),p(b,zz,true,(a+b)/2),p(b,zz,false,(a+b)/2),p(a,zz,false,(a+b)/2),[0,0,side]);
      }
      for(let i=1;i<xxs.length-1;i++)for(let j=0;j<zzs.length-1;j++) {
        const xx=xxs[i],left=(xxs[i-1]+xx)/2,right=(xx+xxs[i+1])/2,a=zzs[j],b=zzs[j+1];
        const la=p(xx,a,false,left),lb=p(xx,b,false,left),ra=p(xx,a,false,right),rb=p(xx,b,false,right);
        if(Math.abs(la[1]-ra[1])+Math.abs(lb[1]-rb[1])>1e-9)
          quad(la,lb,rb,ra,[la[1]<ra[1]?1:-1,0,0]);
        const lt=p(xx,a,true,left),lu=p(xx,b,true,left),rt=p(xx,a,true,right),ru=p(xx,b,true,right);
        if(Math.abs(lt[1]-rt[1])+Math.abs(lu[1]-ru[1])>1e-9)
          quad(lt,lu,ru,rt,[lt[1]>rt[1]?1:-1,0,0]);
      }
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pp,3));
      geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();
      geo.userData.architectureMember=label;return geo;
    };
    const deform=(geo,label)=>{
      const p=geo.getAttribute('position');for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+roofY(p.getX(i),p.getZ(i)));
      geo.computeVertexNormals();geo.userData.architectureMember=label;return geo;
    };
    const ribZ=[.35,.65,.95,1.25].map(a=>front-a),ribDepth=.080;
    const bearing=[],frontTieEnds=[],parts={};
    // Columns are metadata from the unchanged hall-local frame. Their upper
    // receiver is the actual seat, not an invented point below the roof.
    const supports=supportColumns.map(c=>({x:c.x-x,z:c.z-z,top:c.capitalTop-y,
      width:.22*c.horizontalScale,depth:.34,source:c}));
    const supportRows=[...new Set(supports.map(c=>c.z))];
    const carrierBottom=(xx,zz)=>Math.max(roofY(xx,zz)-.76,ceilingClearanceY===null?-Infinity:ceilingClearanceY-y);
    const carrierDepth=.28,carrierHalf=Math.max(...beamAxes.map(Math.abs))+beamWidth/2+.12;
    if(ceilingClearanceY!==null&&!Number.isFinite(ceilingClearanceY))
      throw new RangeError('Ceiling clearance must be a finite hall-local height.');
    for(const zz of supportRows)for(const xx of [-carrierHalf,...xs.filter(xx=>Math.abs(xx)<carrierHalf),carrierHalf])
      if(carrierBottom(xx,zz)>=roofY(xx,zz)-.56-.025)
        throw new RangeError('Retained ceiling leaves insufficient curved-carrier depth.');
    for(const c of supports) {
      if(![c.x,c.z,c.top,c.width].every(Number.isFinite)||Math.abs(c.x)+c.width/2>carrierHalf||
        c.z-carrierDepth/2<-d/2||c.z+carrierDepth/2>front-1.35)
        throw new RangeError('Entrance column receiver lies outside the actual curved carrier.');
      if(Math.min(roofY(c.x-c.width/2,c.z+c.depth/2),roofY(c.x+c.width/2,c.z+c.depth/2))-.76<c.top+.025)
        throw new RangeError('Entrance carrier does not clear the real capital top.');
    }
    const emit=(geo,material,label)=>{draw(geo,material,[0,0,0],[1,1,1]);parts[label]=(parts[label]||0)+1;};
    group(x,y,z,0,()=>{
      emit(loft(xs,[-d/2,front-.155],(xx,zz)=>roofY(xx,zz)-.13,(xx,zz)=>roofY(xx,zz)-.18,'entrance-boarding'),'cedar','boarding');
      for(let k=0;k<=Math.ceil(d/.38);k++) {
        const zz=-d/2+.06+(d-.24)*k/Math.ceil(d/.38);
        emit(loft(xs,[zz-.025,zz+.025],(xx,z)=>roofY(xx,z)-.045,(xx,z)=>roofY(xx,z)-.13,'entrance-tile-batten'),'endwood','tile-batten');
      }
      emit(loft(xs,[-d/2,front],(xx,zz)=>roofY(xx,zz)-.005,(xx,zz)=>roofY(xx,zz)-.045,'entrance-tile-underlay'),'slate','tile-underlay');
      const ribHalf=w/2,ribXs=[-ribHalf,...xs.filter(xx=>Math.abs(xx)<ribHalf),ribHalf];
      for(const zz of ribZ)
        emit(loft(ribXs,[zz-ribDepth/2,zz+ribDepth/2],(xx,z)=>roofY(xx,z)-.42,(xx,z)=>roofY(xx,z)-.54,'entrance-curved-rib'),'red','curved-rib');
      for(const xx of beamAxes) {
        const length=d+.04,centreZ=.02;
        const timber=joineryBox(length,beamWidth,-.56,-.18,[...ribZ.map(zz=>({x:-(zz-centreZ),width:ribDepth,side:'bottom',y:-.42})),...supportRows.map(zz=>({x:-(zz-centreZ),width:carrierDepth,side:'bottom',y:-.48}))]);
        timber.rotateY(PI/2);timber.translate(xx,0,centreZ);
        emit(deform(timber,'entrance-notched-purlin'),'cedar','notched-purlin');
        // The actual raked timber end has a forged border, not a floating
        // spherical tip or a solid gold replacement for its entire face.
        const z0=front+.0405,z1=front+.051,b=.014;
        for(const side of [-1,1]) {
          const a=xx+side*(beamWidth/2-b/2);
          emit(loft([a-b/2,a+b/2],[z0,z1],(x,z)=>roofY(x,z)-.183,(x,z)=>roofY(x,z)-.557,'entrance-end-strap'),'oldgold','end-strap');
        }
        for(const off of [-.19,-.55])emit(loft([xx-beamWidth/2+b,xx+beamWidth/2-b],[z0,z1],
          (x,z)=>roofY(x,z)+off+b/2,(x,z)=>roofY(x,z)+off-b/2,'entrance-end-strap'),'oldgold','end-strap');
      }
      const barge=loft(xs,[front-.155,front+.035],(xx,zz)=>roofY(xx,zz)-.08,
        (xx,zz,mid)=>roofY(xx,zz)-(beamAxes.some(b=>Math.abs(mid-b)<beamWidth/2-1e-8)?.18:.42),
        'entrance-saddled-bargeboard');
      emit(barge,'red','bargeboard');
      for(const [off,h,depth,material] of [[-.042,.048,.045,'darkwood'],[-.073,.014,.044,'oldgold']])
        emit(loft(xs,[front,front+depth],(x,z)=>roofY(x,z)+off+h/2,(x,z)=>roofY(x,z)+off-h/2,'entrance-barge-molding'),material,'barge-molding');
      const tieZ=front-.19,tieDepth=.28,footX=.22*w,tieHalf=footX+beamWidth/2;
      const tieTop=zz=>roofY(footX,zz)-.56;
      const seatInner=footX-beamWidth/2,transitionInner=seatInner-.04;
      const tieXs=[-tieHalf,-seatInner,-transitionInner,0,transitionInner,seatInner,tieHalf];
      const tieUpper=(xx,zz)=>{
        const u=Math.abs(xx);
        if(u<=transitionInner)return tieTop(zz);
        if(u>=seatInner)return roofY(xx,zz)-.56;
        return T.MathUtils.lerp(tieTop(zz),roofY(Math.sign(xx)*seatInner,zz)-.56,(u-transitionInner)/.04);
      };
      emit(loft(tieXs,[tieZ-tieDepth/2,tieZ+tieDepth/2],tieUpper,(xx,zz)=>tieTop(zz)-.27,'entrance-front-tie'),'red','front-tie');
      for(const side of [-1,1])frontTieEnds.push({localCenter:[x+side*footX,y+tieTop(tieZ)-.27,z+tieZ],
        localWidth:beamWidth,localDepth:tieDepth,kind:'projecting-front-tie-underside'});
      if(detail) {
        // The small reference4 pendant is a black vertical recess with several
        // gilt relief masses. Its source pixels do not justify invented text,
        // a named icon or a generic chrysanthemum medallion.
        const oz=front-.12,base=zz=>tieTop(zz)+.04;
        emit(loft([-.35,.35],[oz-.075,oz+.075],(xx,zz)=>base(zz),
          (xx,zz)=>tieTop(zz),'entrance-shrine-plinth'),'oldgold','shrine-plinth');
        const shrineContour=[[-.15,0],[-.15,.55],[-.11,.62],[0,.66],[.11,.62],[.15,.55],[.15,0]];
        const placeRelief=(geometry,label)=>{
          const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal');
          for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+base(p.getZ(i)));
          // This placement is an affine shear. Transform the existing normals
          // exactly, retaining sphere pole/seam normals rather than zeroing
          // unused indexed pole vertices with computeVertexNormals().
          for(let i=0;i<n.count;i++) {
            const q=v([n.getX(i),n.getY(i),n.getZ(i)+backRise/d*n.getY(i)]).normalize();n.setXYZ(i,q.x,q.y,q.z);
          }
          geometry.userData.architectureMember=label;return geometry;
        };
        const recess=extrudedProfile(shrineContour,.045,.004);recess.translate(0,0,oz);
        emit(placeRelief(recess,'entrance-shrine-recess'),'black','shrine-recess');
        const curve=(points,r,material,label,closed=false)=>{
          const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>v(p)),closed),40,r,5,closed);
          emit(placeRelief(geo,label),material,label);
        };
        curve(shrineContour.map(([xx,yy])=>[xx,yy,oz+.029]),.010,'oldgold','shrine-frame',true);
        const relief=new T.SphereGeometry(1,16,10);
        for(const [yy,rx,ry] of [[.14,.055,.065],[.29,.066,.072],[.45,.047,.063],[.535,.032,.026]]) {
          const form=relief.clone();form.scale(rx,ry,.025);form.translate(0,yy,oz+.038);
          emit(placeRelief(form,'entrance-visible-gilt-relief'),'gold','visible-gilt-relief');
        }
        for(const sign of [-1,1])curve([[sign*.12,.03,oz+.035],[sign*.32,.04,oz+.035],
          [sign*.39,.12,oz+.031],[sign*.30,.19,oz+.032],[sign*.22,.17,oz+.032],
          [sign*.21,.25,oz+.031],[sign*.31,.34,oz+.030],[sign*.28,.43,oz+.030],
          [sign*.22,.42,oz+.030]],.010,'oldgold','shrine-side-scroll');
        emit(loft([-.018,.018],[oz-.018,oz+.018],(xx,zz)=>roofY(xx,zz)-.42,
          (xx,zz)=>base(zz)+.66,'entrance-pendant-neck'),'oldgold','pendant-neck');
        // Open chased loops on the actual barge face. The dark arch remains
        // visible through them; there is no opaque decorative pediment slab.
        const crestZ=front+.047;
        for(const sign of [-1,1]) {
          const pp=[[sign*.68,-.14],[sign*.47,-.18],[sign*.31,-.30],[sign*.42,-.37],
            [sign*.54,-.32],[sign*.48,-.26],[sign*.34,-.28],[sign*.20,-.43],
            [sign*.05,-.50],[0,-.44]];
          const path=pp.map(([xx,off])=>v([xx,roofY(xx,crestZ)+off,crestZ]));
          const geo=new T.TubeGeometry(new T.CatmullRomCurve3(path),44,.012,5,false);
          geo.userData.architectureMember='entrance-open-barge-relief';emit(geo,'oldgold','open-barge-relief');
        }
      }
      for(const supportZ of supportRows) {
        const carrierXs=[-carrierHalf,...xs.filter(xx=>Math.abs(xx)<carrierHalf),carrierHalf];
        emit(loft(carrierXs,[supportZ-carrierDepth/2,supportZ+carrierDepth/2],
          (xx,zz,mid)=>roofY(xx,zz)-(beamAxes.some(b=>Math.abs(mid-b)<beamWidth/2-1e-8)?.48:.56),
          carrierBottom,'entrance-curved-carrier'),'red','curved-carrier');
      }
      for(const c of supports) {
        const propXs=[c.x-c.width/2,...xs.filter(xx=>xx>c.x-c.width/2&&xx<c.x+c.width/2),c.x+c.width/2];
        emit(loft(propXs,[c.z-c.depth/2,c.z+c.depth/2],
          carrierBottom,()=>c.top,'entrance-capital-prop'),'cedar','capital-prop');
        bearing.push({localCenter:[x+c.x,y+c.top,z+c.z],localWidth:c.width,localDepth:c.depth,
          kind:'entrance-capital-contact',columnAxis:[c.source.x,c.source.z]});
      }
      if(hostRoof) {
        // Lightweight weather boarding closes the raised roof cavity; these
        // panels do not replace the four real capital/carrier load paths.
        const back=-d/2,wall=.055;
        const rearXs=[-w/2-wall,...xs,w/2+wall];
        const closureTop=(xx,zz)=>Math.max(roofY(xx,zz),hostY(xx,zz))-.18;
        const closureBottom=(xx,zz)=>Math.min(roofY(xx,zz),hostY(xx,zz))-.18;
        // Put the closures outside the new roof footprint. Near the outer
        // eave the retained main roof is higher, so a signed-height panel
        // inside the canopy would invert and cut through its own timbers.
        emit(loft(rearXs,[back-wall,back],closureTop,closureBottom,
          'entrance-rear-weather-board'),'cedar','rear-weather-board');
        for(const sign of [-1,1]) {
          const sideXs=sign<0?[-w/2-wall,-w/2]:[w/2,w/2+wall];
          emit(loft(sideXs,[back,...Array.from({length:17},(_,i)=>back+(front-.155-back)*(i+1)/17)],
            closureTop,closureBottom,'entrance-side-weather-board'),'cedar','side-weather-board');
          const inner=sign*(w/2-.020),edge=sign*w/2,cut=sign*(w/2+.055),outer=sign*(w/2+.18);
          const flashXs=[inner,edge,cut,outer].sort((a,b)=>a-b);
          const sideLower=(xx,zz)=>{
            if(zz<back)return hostY(xx,zz)-.030;
            const aa=Math.abs(xx),edgeY=Math.max(roofY(edge,zz)-.005,hostY(cut,zz)-.030);
            if(aa<=w/2)return T.MathUtils.lerp(roofY(inner,zz)-.005,edgeY,(aa-(w/2-.020))/.020);
            if(aa<=w/2+.055)return T.MathUtils.lerp(edgeY,hostY(xx,zz)-.030,(aa-w/2)/.055);
            return hostY(xx,zz)-.030;
          };
          // Flashing stays above the actual backing and under the retained
          // tiles. Its short front end stops before the old fascia volume.
          emit(loft(flashXs,[back-.16,back,...Array.from({length:25},(_,i)=>back+(front-.075-back)*(i+1)/25)],
            (xx,zz)=>sideLower(xx,zz)+.012,sideLower,'entrance-side-flashing'),'black','side-flashing');
        }
        const backXs=xs.filter(xx=>Math.abs(xx)<w/2-.02);backXs.unshift(-w/2+.02);backXs.push(w/2-.02);
        emit(loft(backXs,[back-.16,back-wall-.012],(xx,zz)=>hostY(xx,zz)-.018,
          (xx,zz)=>hostY(xx,zz)-.030,'entrance-back-apron'),'black','back-apron');
        emit(loft(backXs,[back-wall-.012,back-wall],(xx,zz)=>hostY(xx,zz)+.12,
          (xx,zz)=>hostY(xx,zz)-.030,'entrance-back-upstand'),'black','back-upstand');
      }
      const count=Math.max(12,Math.round(tileCount)),pitch=w/count,r=tileRadius;
      if(!(r>0&&2*r<pitch))throw new RangeError('Entrance ceramic covers must leave an actual pan interval.');
      const semi=[];for(let j=0;j<=12;j++){const a=PI-j*PI/12;semi.push([Math.cos(a)*r,.01+Math.sin(a)*r]);}
      for(let j=0;j<=12;j++){const a=j*PI/12;semi.push([Math.cos(a)*(r-.012),.01+Math.sin(a)*(r-.012)]);}
      const tileGeo=extrudedProfile(semi,d+.048,0);tileGeo.translate(0,0,.024);
      for(let k=0;k<count;k++) {
        const xx=-w/2+(k+.5)*pitch,cover=tileGeo.clone();cover.translate(xx,0,0);
        emit(deform(cover,'entrance-cover-tile'),'slate','cover-tile');
        tileEnd(v([xx,roofY(xx,front+.059)+.01,front+.059]),0,r,detail);
        if(k<count-1) {
          const minX=xx+r*.60,maxX=xx+pitch-r*.60,mid=(minX+maxX)/2;
          const panTop=(x,z)=>roofY(x,z)+.006+.020*((x-mid)/((maxX-minX)/2))**2;
          emit(loft([minX,mid,maxX],[-d/2,front+.015],panTop,(x,z)=>panTop(x,z)-.011,'entrance-pan-tile'),'slate','pan-tile');
        }
      }
    });
    const matrix=stack?.[stack.length-1];
    for(const b of bearing) {
      b.worldCenter=(matrix?v(b.localCenter).applyMatrix4(matrix):v(b.localCenter)).toArray();
      b.worldNormal=(matrix?v([0,-1,0]).transformDirection(matrix):v([0,-1,0])).toArray();
    }
    return {kind:'karahafu-entrance',profile:'reference4-original',ceilingClearanceY,galleryClearance,localOrigin:[x,y,z],w,d,rise,endRise,backRise,
      sourceProfile:[...knots].map((u,i)=>[u,ordinates[i]]),parts,bearings:bearing,frontTieEnds,
      ornamentAnchor:{localBottom:[x,y+roofY(.22*w,front-.25)-.56,z+front-.25],
        localTop:[x,y+roofY(0,front-.25)-.60,z+front-.25],localWidth:.30},
      supportedColumns:supports.length,requiresBearingIntegration:supports.length<2,requiresMainRoofOpening:true,
      hostOpening:hostRoof?{minX:x-w/2-.055,maxX:x+w/2+.055,minZ:z-d/2-.055,maxZ:Infinity}:null,
      upperWoodOpening:upperWoodOpening?{...upperWoodOpening,woodOnly:true}:null,
      hostTileOpening:hostRoof?{minX:x-w/2-.14,maxX:x+w/2+.14,minZ:z-d/2-.16,maxZ:Infinity}:null,
      hostRoof:hostRoof?{...hostRoof}:null};
  }


  // Isolated construction hypothesis: a framed, drained side-porch addition.
  // Original21 optics/body and default geometry are not changed by this hook.
  // Integration must apply the returned old-roof openings and column seats.
  function reference10SidePorch(options={}) {
    if(options.referenceMode!=='reference10')throw new RangeError('The side porch is a reference10-only construction hypothesis.');
    const expectedParent=new T.Matrix4().makeScale(.6,.6,.6).setPosition(-13.840726762,0,22.584909604),actualParent=stack?.at(-1);if(!actualParent||actualParent.elements.some((v,i)=>Math.abs(v-expectedParent.elements[i])>2e-8))throw new RangeError('The source-defined side porch requires the exact retained reference10 threshold parent.');
    const C={"height":3.3,"edgeOrigin":[-16.32986409411027,3.3,19.990778610577216],"u":[-0.5489014425464311,0.0,-0.8358870775233023],"v":[-0.8358870775233023,0.0,0.5489014425464311],"pitch":0.24582918688591068,"phase":0.8671545613117181,"width":0.0749898660578238,"tipHeight":0.12496038752281552,"inset":0.07021713876489027,"sOrigin":-0.22040393838846692,"nearColumn":[-17.140726762,0,21.384909604],"newPost":[-18.567870512620722,0.0,19.211603202439413],"clipX":[-19.2,-16.1],"cutZ":20.92,"ceilingBackZ":22.1,"endS":3.4,"existingBeamBottom":3.834,"existingBeamTop":4.026,"originalSourceIntervalsSHA256":"f6c977b138d7d92c51997da4b2aac88147825bea7a9db82c1111ede12bf5e2c8"},origin=new T.Vector3(-13.840726762,0,22.584909604),unit=.6;
    const inverse=new T.Matrix4().makeScale(1/unit,1/unit,1/unit).setPosition(-origin.x/unit,0,-origin.z/unit);
    const P=new T.Vector3(...C.edgeOrigin),U=new T.Vector3(...C.u),V=new T.Vector3(...C.v),A=new T.Vector3(...C.nearColumn),B=new T.Vector3(...C.newPost);
    const H=C.height,tip=C.tipHeight,rafterTop=H+tip/2,mainDepth=.22,beamTop=rafterTop-mainDepth,beamBottom=beamTop-.20;
    const parts=[],contacts=[],toWorld=p=>new T.Vector3(...p),local=p=>toWorld(p).applyMatrix4(inverse).toArray();
    // Only the new side-porch prisms need this chart repair. Their original
    // world-XZ chart collapses on vertical sides. Preserve every well-conditioned
    // chart, all position/normal data and every inherited optical value.
    function repairPrismUV(geometry, role) {
      const p = geometry.attributes.position, uv = geometry.attributes.uv;
      const triangles = [];
      for (let i = 0; i < p.count; i += 3) {
        const q = [0, 1, 2].map(k => new T.Vector3().fromBufferAttribute(p, i + k));
        const ab = q[1].clone().sub(q[0]), ac = q[2].clone().sub(q[0]);
        const cross = ab.clone().cross(ac), area2 = cross.length();
        const du1 = uv.getX(i + 1) - uv.getX(i), dv1 = uv.getY(i + 1) - uv.getY(i);
        const du2 = uv.getX(i + 2) - uv.getX(i), dv2 = uv.getY(i + 2) - uv.getY(i);
        if (area2 > 0 && Math.abs(du1 * dv2 - du2 * dv1) < area2 * 1e-4) {
          triangles.push({i, q, area2, n: cross.divideScalar(area2)});
        }
      }
      if (!triangles.length) return;
      const charts = [], axes = [new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), U, V];
      const grain = role === 'front-header-half-lap' ? U
        : ['rear-header-half-lap', 'rear-perimeter-header-half-lap'].includes(role) ? new T.Vector3(1, 0, 0)
        : ['west-perimeter-header-half-lap', 'east-return-header-half-lap'].includes(role) ? new T.Vector3(0, 0, 1)
        : ['tapered-rafter', 'soffit-plank', 'continuous-weather-deck', 'weather-ceramic'].includes(role) ? V
        : new T.Vector3(0, 1, 0);
      // A common porch origin prevents phase resets between fragments of a
      // member. Largest faces supply charts for their small clipped triangles.
      // Only the chart basis is aligned to a nearby modeled member axis;
      // stored geometry normals are never replaced or smoothed.
      triangles.sort((a, b) => b.area2 - a.area2);
      for (const t of triangles) {
        const constant = -t.n.dot(t.q[0]);
        let chart = charts.find(c => c.n.dot(t.n) > 1 - 1e-8 && Math.abs(c.constant - constant) < 1e-5);
        if (!chart) {
          const aligned = axes.find(axis => Math.abs(axis.dot(t.n)) > 1 - 1e-6);
          const n = aligned ? aligned.clone().multiplyScalar(Math.sign(aligned.dot(t.n))) : t.n;
          let longitudinal = grain.clone().addScaledVector(n, -grain.dot(n));
          if (longitudinal.lengthSq() < 1e-12) {
            // An end face has no projected longitudinal grain. Use a finite
            // least-aligned axis rather than inventing a historical end-grain map.
            const fallback = [new T.Vector3(1, 0, 0), new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1)];
            fallback.sort((a, b) => Math.abs(a.dot(n)) - Math.abs(b.dot(n)));
            longitudinal = fallback[0].addScaledVector(n, -fallback[0].dot(n));
          }
          longitudinal.normalize();
          chart = {n: t.n, constant, longitudinal, across: longitudinal.clone().cross(n).normalize()};
          charts.push(chart);
        }
        for (let k = 0; k < 3; k++) {
          const relative = t.q[k].clone().sub(P);
          uv.setXY(t.i + k, relative.dot(chart.across), relative.dot(chart.longitudinal));
        }
      }
    }
    const emit=(geometry,material,role)=>{geometry=conformTierTimber(geometry);const source=geometry.index?geometry.toNonIndexed():geometry,attrs=Object.entries(source.attributes),kept=[];for(let i=0;i<source.attributes.position.count;i+=3){const q=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(source.attributes.position,i+k).applyMatrix4(inverse)).map(p=>new T.Vector3(Math.fround(p.x),Math.fround(p.y),Math.fround(p.z)));if(q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0])).lengthSq()>1e-20)kept.push(i,i+1,i+2);}if(kept.length!==source.attributes.position.count){geometry=new T.BufferGeometry();for(const[key,a]of attrs)geometry.setAttribute(key,new T.Float32BufferAttribute(kept.flatMap(i=>Array.from({length:a.itemSize},(_,k)=>a.array[i*a.itemSize+k])),a.itemSize));}if(!geometry.attributes.position.count)return;repairPrismUV(geometry,role);geometry.userData.architectureJoint='reference10-side-porch22-'+role;
      geometry.computeBoundingBox();parts.push({role,material,worldBounds:[geometry.boundingBox.min.toArray(),geometry.boundingBox.max.toArray()]});
      geometry.applyMatrix4(inverse);draw(geometry,material,[0,0,0],[1,1,1]);};
    const polygonArea=poly=>poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
    const prism=(poly,lower,upper)=>{if(polygonArea(poly)<0)poly=poly.slice().reverse();const pos=[],uv=[];
      const tri=(a,b,c,normal)=>{const n=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));if(n.lengthSq()<1e-20)return;if(n.dot(normal)<0)[b,c]=[c,b];for(const p of[a,b,c]){pos.push(...p);uv.push(p[0],p[2]);}};
      const lo=poly.map(([x,z])=>[x,typeof lower==='function'?lower(x,z):lower,z]),hi=poly.map(([x,z])=>[x,typeof upper==='function'?upper(x,z):upper,z]);
      const triangles=T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(...p)),[]);
      for(const ids of triangles){tri(...ids.map(i=>lo[i]),new T.Vector3(0,-1,0));tri(...ids.map(i=>hi[i]),new T.Vector3(0,1,0));}
      for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length,n=new T.Vector3(poly[j][1]-poly[i][1],0,poly[i][0]-poly[j][0]);tri(lo[i],lo[j],hi[i],n);tri(lo[j],hi[j],hi[i],n);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;};
    const rect=(cx,cz,w,d,axis=U)=>{const side=new T.Vector3(axis.z,0,-axis.x);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[cx+axis.x*a*w/2+side.x*b*d/2,cz+axis.z*a*w/2+side.z*b*d/2]);};
    const remove=(geometry,poly,low,high)=>{geometry.computeBoundingBox();const bb=geometry.boundingBox,mnx=Math.min(...poly.map(p=>p[0])),mxx=Math.max(...poly.map(p=>p[0])),mnz=Math.min(...poly.map(p=>p[1])),mxz=Math.max(...poly.map(p=>p[1]));if(bb.max.x<=mnx+1e-7||bb.min.x>=mxx-1e-7||bb.max.z<=mnz+1e-7||bb.min.z>=mxz-1e-7||bb.max.y<=low+1e-7||bb.min.y>=high-1e-7)return[geometry];const solid=g=>{if(!g.attributes.position.count)return false;g.computeBoundingBox();const d=g.boundingBox.getSize(new T.Vector3());return Math.min(d.x,d.y,d.z)>2e-6;};if(polygonArea(poly)<0)poly=poly.slice().reverse();const planes=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],n=new T.Vector3(-(b[1]-a[1]),0,b[0]-a[0]).normalize();return new T.Plane(n,-n.x*a[0]-n.z*a[1]);});planes.push(new T.Plane(new T.Vector3(0,1,0),-low),new T.Plane(new T.Vector3(0,-1,0),high));
      const pieces=[];let rest=geometry;for(const plane of planes){const outside=clipTierTimber(rest,plane.clone().negate());if(solid(outside))pieces.push(conformTierTimber(outside));rest=clipTierTimber(rest,plane);if(!solid(rest))break;}return pieces;};
    const sx=C.clipX[1],ex=C.clipX[0],startS=(sx-P.x)/U.x,frontEnd=P.clone().addScaledVector(U,C.endS),sideT=(ex-frontEnd.x)/V.x;
    const edgeStart=P.clone().addScaledVector(U,startS),sideEnd=frontEnd.clone().addScaledVector(V,sideT);
    const plan=back=>[[edgeStart.x,edgeStart.z],[frontEnd.x,frontEnd.z],[sideEnd.x,sideEnd.z],[ex,back],[sx,back]];
    const ceilingPlan=plan(C.ceilingBackZ),roofPlan=plan(C.cutZ);
    const lineSpan=(s,polygon)=>{const a=P.clone().addScaledVector(U,s);let low=-Infinity,high=Infinity;const poly=polygonArea(polygon)<0?polygon.slice().reverse():polygon;
      for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],nx=-(q[1]-p[1]),nz=q[0]-p[0],d=nx*(a.x-p[0])+nz*(a.z-p[1]),slope=nx*V.x+nz*V.z;
        if(Math.abs(slope)<1e-10){if(d<0)return null;continue;}if(slope>0)low=Math.max(low,-d/slope);else high=Math.min(high,-d/slope);}
      return high>low?[low,high]:null;};
    const clipPlan=(subject,clip)=>{const poly=polygonArea(clip)<0?clip.slice().reverse():clip;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dist=q=>(b[0]-a[0])*(q[1]-a[1])-(b[1]-a[1])*(q[0]-a[0]),out=[];for(let j=0;j<subject.length;j++){const p=subject[j],q=subject[(j+1)%subject.length],dp=dist(p),dq=dist(q);if(dp>=-1e-9)out.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}subject=out;if(!subject.length)break;}return subject;};
    const strip=(s,w,t0,t1)=>[[-1,t0],[1,t0],[1,t1],[-1,t1]].map(([side,t])=>{const p=P.clone().addScaledVector(U,s+side*w/2).addScaledVector(V,t);return[p.x,p.z];});
    const footprintAt=p=>p.clone().sub(P).dot(V);
    const columnHole=rect(A.x,A.z,.43,.43,new T.Vector3(1,0,0));
    const lamp=[-16.632099863045823,1.9975866633215855,21.504909604],rodHole=rect(lamp[0],lamp[2],.035,.035,new T.Vector3(1,0,0));
    const hangerHoles=[];for(const x of[ex+.35,sx-.30])for(const side of[-1,1])hangerHoles.push(rect(x,A.z+side*.126,.074,.016,new T.Vector3(1,0,0)));
    function emitPierced(geometry,material,role){let pieces=[geometry];for(const hole of[columnHole,rodHole,...hangerHoles])pieces=pieces.flatMap(g=>remove(g,hole,0,5));for(const g of pieces)emit(g,material,role);}
    // Tapered real rafters have narrow source-observed tips and a deeper backspan.
    // No extra sky-blocking plane is placed below them.
    let rafterCount=0;
    for(let k=-40;k<=40;k++){const s=C.sOrigin+(k+C.phase)*C.pitch,span=lineSpan(s,ceilingPlan);if(!span)continue;const[t0,t1]=span;if(t1-t0<.1)continue;
      const knots=[t0,...[.68,.98].filter(t=>t>t0&&t<t1),t1];for(let j=0;j<knots.length-1;j++){const lo=knots[j],hi=knots[j+1],bottom=(x,z)=>rafterTop-(tip+(mainDepth-tip)*Math.max(0,Math.min(1,(footprintAt(new T.Vector3(x,0,z))-.68)/.30)));
        emitPierced(prism(clipPlan(strip(s,C.width,lo,hi),ceilingPlan),bottom,rafterTop),'cedar','tapered-rafter');}rafterCount++;
    }
    // Real, abutting, finite thickness ceiling planks on the actual rafter tops.
    const boardPitch=.185;
    for(let i=-40;i<=40;i++){const s=i*boardPitch,span=lineSpan(s,ceilingPlan);if(!span)continue;const t0=Math.max(C.inset,span[0]),t1=span[1];if(t1<=t0)continue;
      emitPierced(prism(clipPlan(strip(s,boardPitch,t0,t1),ceilingPlan),rafterTop,rafterTop+.028),'endwood','soffit-plank');}
    // Two real crossing headers use complementary half-lap housings.
    // A real three-sided perimeter closes the lower bearing frame. The west
    // carrier receives the four short forward rafters; the rear carrier and
    // east return receive the clipped rear rafters. These are finite beams,
    // not a top-board contact mislabeled as downward rafter bearing.
    // The existing column uses the unchanged local housing mask. The new
    // front carrier extension is outside that column, independently paired
    // against its actual retained seated shaft, not a new column cut.
    const columnFrontMid=A.clone().addScaledVector(U,1.1),frontPlan=rect(columnFrontMid.x,columnFrontMid.z,4.0,.18,U);
    const frontMid=A.clone().addScaledVector(U,1.55),extendedFrontPlan=clipPlan(rect(frontMid.x,frontMid.z,4.9,.18,U),ceilingPlan),rearPlan=rect((ex+sx)/2,A.z,sx-ex,.18,new T.Vector3(1,0,0)),lap=(beamTop+beamBottom)/2;
    const perimeterFrontZ=Math.min(...ceilingPlan.map(p=>p[1]));
    const westPlan=clipPlan(rect(ex+.09,(C.ceilingBackZ+perimeterFrontZ)/2,C.ceilingBackZ-perimeterFrontZ,.18,new T.Vector3(0,0,1)),ceilingPlan);
    const eastPlan=rect(sx-.09,(C.ceilingBackZ+A.z-.09)/2,C.ceilingBackZ-A.z+.09,.18,new T.Vector3(0,0,1));
    const backPlan=rect((ex+sx)/2,C.ceilingBackZ-.09,sx-ex,.18,new T.Vector3(1,0,0));
    function frameMember(poly,role,cuts){let pieces=[prism(poly,beamBottom,beamTop)];for(const cut of cuts)pieces=pieces.flatMap(g=>remove(g,cut.poly,cut.low,cut.high));for(const g of pieces)emit(g,'darkwood',role);}
    frameMember(extendedFrontPlan,'front-header-half-lap',[{poly:rearPlan,low:lap,high:beamTop+.01},{poly:westPlan,low:lap,high:beamTop+.01},{poly:backPlan,low:lap,high:beamTop+.01}]);
    frameMember(rearPlan,'rear-header-half-lap',[{poly:extendedFrontPlan,low:beamBottom-.01,high:lap},{poly:westPlan,low:lap,high:beamTop+.01},{poly:eastPlan,low:lap,high:beamTop+.01}]);
    frameMember(westPlan,'west-perimeter-header-half-lap',[{poly:extendedFrontPlan,low:beamBottom-.01,high:lap},{poly:rearPlan,low:beamBottom-.01,high:lap},{poly:backPlan,low:lap,high:beamTop+.01}]);
    frameMember(eastPlan,'east-return-header-half-lap',[{poly:rearPlan,low:beamBottom-.01,high:lap},{poly:backPlan,low:lap,high:beamTop+.01}]);
    frameMember(backPlan,'rear-perimeter-header-half-lap',[{poly:westPlan,low:beamBottom-.01,high:lap},{poly:eastPlan,low:beamBottom-.01,high:lap},{poly:extendedFrontPlan,low:beamBottom-.01,high:lap}]);
    contacts.push({kind:'header-half-lap',worldY:lap,lower:'front-header',upper:'rear-header'});
    contacts.push({kind:'perimeter-frame-half-laps',worldY:lap,pairs:[['front-header','west-perimeter-header'],['rear-header','west-perimeter-header'],['rear-header','east-return-header'],['west-perimeter-header','rear-perimeter-header'],['east-return-header','rear-perimeter-header'],['front-header','rear-perimeter-header']],limit:'Finite opposing timber bearing surfaces, not a structural engineering certification.'});
    // The only new ground support stays inside the previously checked .35m disk.
    const originalDisk=[-18.57560996318,19.2167052319],footRadius=.28;
    if(Math.hypot(B.x-originalDisk[0],B.z-originalDisk[1])+footRadius>.35)throw new Error('New post exceeds the checked soil disk.');
    const footPoly=Array.from({length:32},(_,i)=>[B.x+footRadius*Math.cos(i*Math.PI/16),B.z+footRadius*Math.sin(i*Math.PI/16)]);
    emit(prism(footPoly,-.12,.12),'stone','bank-foundation');
    const shaftPoly=Array.from({length:32},(_,i)=>[B.x+.16*Math.cos(i*Math.PI/16),B.z+.16*Math.sin(i*Math.PI/16)]);
    emit(prism(shaftPoly,.12,beamBottom),'red','bank-post');contacts.push({kind:'bank-post-header-bearing',world:[B.x,beamBottom,B.z]});
    // Two iron stirrups bear ON the retained high front beam and UNDER the new
    // rear header. Their side plates are outside both actual timber volumes.
    for(const x of[ex+.35,sx-.30]){const zb=A.z,half=.12,gauge=.012,w=.07;
      emit(prism(rect(x,zb,w,.288,new T.Vector3(1,0,0)),C.existingBeamTop,C.existingBeamTop+gauge),'black','hanger-upper-bearing');
      emit(prism(rect(x,zb,w,.288,new T.Vector3(1,0,0)),beamBottom-gauge,beamBottom),'black','hanger-lower-bearing');
      for(const side of[-1,1])emit(prism(rect(x,zb+side*(half+gauge/2),w,gauge,new T.Vector3(1,0,0)),beamBottom,C.existingBeamTop),'black','hanger-side-strap');
      contacts.push({kind:'retained-beam-stirrup',world:[x,C.existingBeamTop,zb],lowerY:beamBottom});
    }
    // Actual source-grid interpolation at the retained front backing, rather
    // than assuming its analytic height survives Float32 tessellation exactly.
    const sourcePoint=(j,i,offset)=>{const t=Math.max(.001,j/20),u=-1+i/20,px=u*(6.615+6.885*t),pz=-3.1*t,yy=3.1*Math.pow(Math.max(0,1-t),1.43)+.48*Math.pow(t,9)*(.25+Math.pow(Math.abs(u),7))+offset;
      return new T.Vector3(origin.x+.6*Math.fround(px),4.26+.6*Math.fround(yy),origin.z+.6*Math.fround(pz));};
    const hostY=(x,z,offset=-.035)=>{for(let j=16;j<20;j++)for(let i=0;i<40;i++){const a=sourcePoint(j,i,offset),b=sourcePoint(j+1,i,offset),c=sourcePoint(j,i+1,offset),d=sourcePoint(j+1,i+1,offset);
      for(const q of[[a,b,c],[c,b,d]]){const[a,b,c]=q,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z),u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
        if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)return u*a.y+v*b.y+(1-u-v)*c.y;}}
      throw new Error('Roof joint does not intersect the actual retained front backing grid.');};
    const edgeZ=x=>P.z+(x-P.x)*U.z/U.x,insetZ=(C.inset+.06)/V.z;
    const roofY=(x,z)=>{const front=edgeZ(x)+insetZ,t=Math.max(0,Math.min(1,(z-front)/(C.cutZ-front)));return T.MathUtils.lerp(rafterTop+.056,hostY(x,C.cutZ),t);};
    // Finite closed underlay panels, with true vertical closure boards. The
    // existing hip roof must be cut using the returned paired openings first.
    // Use the actual host mesh's cut-edge breakpoints. A new back seam must
    // not replace the source's piecewise-linear contour by an analytic chord.
    const joinXs=[ex,sx,...Array.from({length:35},(_,i)=>ex+(sx-ex)*(i+1)/36)];
    for(let j=16;j<20;j++)for(let i=0;i<40;i++){
      const a=sourcePoint(j,i,-.035),b=sourcePoint(j+1,i,-.035),c=sourcePoint(j,i+1,-.035);
      for(const[p,q]of[[a,b],[c,b]])if((p.z-C.cutZ)*(q.z-C.cutZ)<=0&&Math.abs(p.z-q.z)>1e-10){const t=(C.cutZ-p.z)/(q.z-p.z),x=p.x+t*(q.x-p.x);if(x>ex+1e-7&&x<sx-1e-7)joinXs.push(x);}}
    joinXs.sort((a,b)=>a-b);const xs=joinXs.filter((x,i)=>!i||x-joinXs[i-1]>1e-7),weatherTriangles=[];
    const sideZ=x=>frontEnd.z+(x-frontEnd.x)*V.z/V.x;
    for(let i=0;i<xs.length-1;i++){const x0=xs[i],x1=xs[i+1],poly=[[x0,Math.max(edgeZ(x0)+insetZ,sideZ(x0))],[x1,Math.max(edgeZ(x1)+insetZ,sideZ(x1))],[x1,C.cutZ],[x0,C.cutZ]];
      if(poly[0][1]>=C.cutZ||poly[1][1]>=C.cutZ)continue;
      for(const ids of[[0,1,2],[0,2,3]]){const p=ids.map(k=>poly[k]),q=p.map(([x,z])=>[x,roofY(x,z),z]),normal=new T.Vector3(...q[1]).sub(new T.Vector3(...q[0])).cross(new T.Vector3(...q[2]).sub(new T.Vector3(...q[0]))),plane=-normal.dot(new T.Vector3(...q[0])),top=(x,z)=>-(normal.x*x+normal.z*z+plane)/normal.y;
        emit(prism(p,(x,z)=>top(x,z)-.028,top),'darkwood','continuous-weather-deck');
        emit(prism(p,top,(x,z)=>top(x,z)+.020),'slate','weather-ceramic');weatherTriangles.push({p,top});}}
    // Cheeks and the rear closure are clipped to those exact roof triangles.
    // Their top faces meet the deck underside without crossing a differently
    // triangulated bilinear approximation.
    const closureRegions=[{role:'high-low-joint-board',poly:[[ex,C.cutZ-.035],[sx,C.cutZ-.035],[sx,C.cutZ],[ex,C.cutZ]]},
      {role:'weather-side-cheek',poly:[[ex,-100],[ex+.025,-100],[ex+.025,C.cutZ-.035],[ex,C.cutZ-.035]]},
      {role:'weather-side-cheek',poly:[[sx-.025,-100],[sx,-100],[sx,C.cutZ-.035],[sx-.025,C.cutZ-.035]]}];
    for(const {p,top}of weatherTriangles)for(const region of closureRegions){const poly=clipPlan(p,region.poly);if(poly.length<3||Math.abs(polygonArea(poly))<1e-10)continue;
      emit(prism(poly,rafterTop+.028,(x,z)=>Math.max(rafterTop+.028,top(x,z)-.028)),'cedar',region.role);}
    // A real side apron connects the lower extension to the retained roof,
    // instead of leaving an open vertical step beside the rectangular cut.
    const weatherAt=(x,z)=>{for(const {p,top}of weatherTriangles){const[a,b,c]=p,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]),u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(z-c[1]))/den,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(z-c[1]))/den;if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)return top(x,z);}throw new Error('Side flashing has no actual new roof receiver.');};
    const apronWidth=.035,oldFront=sourcePoint(20,0,-.035).z;
    for(const[inner,outer]of[[ex,ex-apronWidth],[sx,sx+apronWidth]]){
      const zs=[oldFront,C.cutZ];
      for(let j=16;j<20;j++)for(let i=0;i<40;i++){const a=sourcePoint(j,i,-.035),b=sourcePoint(j+1,i,-.035),c=sourcePoint(j,i+1,-.035),d=sourcePoint(j+1,i+1,-.035);
        for(const[p,q]of[[a,b],[b,c],[c,a],[c,d],[d,b]])if((p.x-outer)*(q.x-outer)<=0&&Math.abs(p.x-q.x)>1e-10){const t=(outer-p.x)/(q.x-p.x),z=p.z+t*(q.z-p.z);if(z>oldFront+1e-8&&z<C.cutZ-1e-8)zs.push(z);}}
      for(const {p}of weatherTriangles)for(let i=0;i<3;i++){const a=p[i],b=p[(i+1)%3];if((a[0]-inner)*(b[0]-inner)<=0&&Math.abs(a[0]-b[0])>1e-10){const t=(inner-a[0])/(b[0]-a[0]),z=a[1]+t*(b[1]-a[1]);if(z>oldFront+1e-8&&z<C.cutZ-1e-8)zs.push(z);}}
      zs.sort((a,b)=>a-b);const knots=zs.filter((z,i)=>!i||z-zs[i-1]>1e-7);
      for(let j=0;j<knots.length-1;j++){const z0=knots[j],z1=knots[j+1],plan=[[inner,z0],[outer,z0],[outer,z1],[inner,z1]],ys=[weatherAt(inner,z0),hostY(outer,z0),hostY(outer,z1),weatherAt(inner,z1)];
        for(const ids of[[0,1,2],[0,2,3]]){const poly=ids.map(i=>plan[i]),q=ids.map(i=>new T.Vector3(plan[i][0],ys[i],plan[i][1])),n=q[1].clone().sub(q[0]).cross(q[2].clone().sub(q[0])),d=-n.dot(q[0]),top=(x,z)=>-(n.x*x+n.z*z+d)/n.y;
          emit(prism(poly,(x,z)=>top(x,z)-.008,top),'black','continuous-side-apron');
          emit(prism(poly,rafterTop+.028,(x,z)=>top(x,z)-.008),'cedar','side-apron-bearing-board');}}
    }
    const opening={minX:(ex-apronWidth-origin.x)/unit,maxX:(sx+apronWidth-origin.x)/unit,minZ:-100,maxZ:(C.cutZ-origin.z)/unit};
    const columnSeats=[frontPlan,rearPlan].map(poly=>({plan:poly.map(([x,z])=>local([x,0,z]).filter((_,i)=>i!==1)),bottomY:beamBottom/unit,topY:beamTop/unit}));
    return{kind:'reference10-side-porch22-physical-candidate',completeConstructionAcceptance:false,referenceMode:'reference10',parts,contacts,rafterCount,newPost:{world:B.toArray(),checkedDisk:originalDisk,footRadius},oldRoofOpenings:{wood:opening,tile:opening,backing:opening},columnSeats,ceilingPiercings:{column:columnHole,unchangedLampRod:rodHole},roofInterface:{cutWorldZ:C.cutZ,xInterval:C.clipX,oldFrontBackingSourceGrid:'actual Float32 front face,20x40',sideApronWidth:apronWidth,requiresPairedOldRoofCut:true},limits:['Isolated geometry candidate, not accepted installation or photo correspondence.','Closed underlay and support solids are emitted; paired old roof/shaft cuts and complete contact/overlap checks are mandatory before integration.','Old21 lamp body, six apertures, full suspension and all three legacy lamps remain untouched.','No camera, other layout, original observations, source gain or global RNG changes.']};
  }

  return {reference10RoofSurfaceUV,reference10NearColumnRoofReceivers,reference10NearColumn,reference10NearColumnFrontRail,reference10SidePorch,pagodaBalcony,hallGallerySubstructure,hallGalleryRoof,hallFrontFrame,hallFrontDoors,hallFrontFrieze,hangingPorchLantern,pagodaFinial,thresholdPorchSupport,clipRoofOpening:clipRestorationRoofOpening,karahafuEntrance,hallColumnAssembly,pagodaStoreyFrame,pagodaRoof,footColumn,brackets,eaves,tileEnd,squareFitting,sanctuaryTransferBeam,
    sanctuaryCeiling,sanctuarySideWalls,sanctuaryFloorMats,pagodaWindowBackings,materialKey,
    materialAliases,stats,revision:ARCHITECTURE_REVISION};
}

