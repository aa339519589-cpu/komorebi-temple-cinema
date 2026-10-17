import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const RESTORATION_ALTAR_LAYOUT = Object.freeze({
  terraceWidths: [5.56,6.47,6.72,6.98,7.25],
  carvedFrontWidths: [5.28,5.58,5.97],
  centralCanopy: [0,6.57,2.35,1.12,.75,.2678571429,true],
  floorLampX: 3.35, floorLampScale: .72,
  floorContactY: -.045, floorUrnX: 4.40, floorVaseX: 5.05,
  upperVaseX: 3.52, upperVaseY: 2.175, upperVaseZ: .815,
  mainThroneHeight: .50, sideThroneHeight: .40,
  throneRadii: [1.19,.82], throneCompensation: [1.75/1.35,1.75/1.28],
  throneDepthAspect: .68,
  sideFigureX: 2.78,
  headHaloCenters: [4.813,4.102],
  mandorlaApexY: [6.65,5.15], mandorlaWidthScales: [1.10,.97],
  sidePendantX: 4.15, sidePendantY: 6.30, sidePendantZ: 2.00, sidePendantLength: 3.20,
  sidePendantWidth: .78, sideHeaderDrop: .23, sideHeaderCeilingContact: [6.815,2.35],
  hangingCeilingContacts: [6.815,6.820,7.010],
  ritualChimneyTopY: 2.060,
});

/** Reference 6 sanctuary furnishing. Local origin = hall [6, 3.48, -14.5].
 * Front faces +Z. Contains lotus seats, but no figure anatomy, lighting or architecture.
 * Deterministic carved construction, with shared ornament geometry and instances.
 */
export function buildRestorationAltar(options = {}) {
  const b = new FurnishingBuilder(options.materials);
  const layout = { ...RESTORATION_ALTAR_LAYOUT, ...options.layout };
  const root = b.root;
  root.name = 'restoration-reference6-altar';
  if (options.terraces !== false) buildTerraces(b,layout);
  if (options.mandorlas !== false) {
    buildMandorla(b, 0, 1.40, -.79, .75,layout.headHaloCenters[0],layout.mandorlaApexY[0],layout.mandorlaWidthScales[0],3-layout.mainThroneHeight,true);
    for (const side of [-1, 1]) buildMandorla(b, side * layout.sideFigureX, 1.80, -.87, .52,layout.headHaloCenters[1],layout.mandorlaApexY[1],layout.mandorlaWidthScales[1],2.175);
  }
  if (options.lotusThrones !== false) {
    buildLotusThrone(b,0,3.00,0,layout.throneRadii[0],layout.mainThroneHeight,layout.throneCompensation,layout.throneDepthAspect);
    for(const side of [-1,1])buildLotusThrone(b,side*layout.sideFigureX,2.85,-.08,layout.throneRadii[1],layout.sideThroneHeight,layout.throneCompensation,layout.throneDepthAspect);
  }
  if (options.ritualObjects !== false) buildRitualObjects(b,layout);
  if (options.offeringTable !== false) buildOfferingTable(b,layout);
  if (options.hanging !== false) {
    buildCanopy(b,...layout.centralCanopy);
    const [x,y,z,scale]=layout.centralCanopy,lower=y+.16*scale,upper=layout.hangingCeilingContacts[0]+.010;
    b.cylinder(x,(lower+upper)/2,z,.014,upper-lower,'gold');
  }
  b.finish();
  root.userData.reference = 'user reference 6';
  root.userData.coordinateSystem = 'altar-local; hall translation [6,3.48,-14.5], +Z faces worshipper';
  root.userData.figureSeatAnchors = [[0,3.00,0],[-layout.sideFigureX,2.85,-.08],[layout.sideFigureX,2.85,-.08]];
  root.userData.figureTargetHeights = [2.10,1.45,1.45];
  // The original central vessel has a clear cylindrical chimney, not three
  // exposed incense sticks. Retain empty legacy keys to prevent false smoke.
  root.userData.incenseTipAnchors = [];
  root.userData.incenseRootAnchors = [];
  root.userData.ritualFlameAnchors = options.offeringTable===false?[]:[{center:[0,1.735,3.15],tip:[0,1.773,3.15],wickTip:[0,1.704,3.15]}];
  root.userData.mandorlaSupportAnchors = options.mandorlas===false?[]:[-1,1].map(side=>[side*layout.sideFigureX,2.175,-.87-.043*.52]);
  root.userData.hangingCeilingContactPoints = options.hanging===false?[]:[[layout.centralCanopy[0],layout.hangingCeilingContacts[0],layout.centralCanopy[2]]];
  root.userData.upperVaseAnchors = options.ritualObjects===false?[]:[-1,1].map(side=>[side*layout.upperVaseX,layout.upperVaseY,layout.upperVaseZ]);
  root.userData.rearRitualStandAnchors = options.ritualObjects===false?[]:[-1,1].flatMap(side=>[[side*1.92,2.4545,.19],[side*3.30,2.4545,.03]]);
  root.userData.floorContactPlaneY = layout.floorContactY;
  root.userData.floorObjectAnchors = options.ritualObjects===false?[]:[-1,1].flatMap(side=>[
    {kind:'floor-lantern',center:[side*layout.floorLampX,layout.floorContactY,2.18]},
    {kind:'floor-censer',center:[side*layout.floorUrnX,layout.floorContactY,1.75]},
    {kind:'floor-flower-vase',center:[side*layout.floorVaseX,layout.floorContactY,1.90]},
  ]);
  root.userData.floorSupportAnchors = [
    ...(options.terraces===false?[]:[{kind:'cabinet-foot',center:[0,layout.floorContactY,0]}]),
    ...(options.offeringTable===false?[]:[...[-1,1].flatMap(side=>[
      ...[-.34,.34].map(dz=>({kind:'table-outer-foot',center:[side*1.73*.84,layout.floorContactY,3.15+dz]})),
      {kind:'table-inner-foot',center:[side*1.075*.84,layout.floorContactY,3.49]},
    ]),{kind:'cushion-wood-base',center:[0,layout.floorContactY,3.90]}]),
  ];
  root.userData.materialNames = Object.fromEntries(Object.entries(b.materials).map(([key,m])=>[key,m.name]));
  return root;
}

/** Optional matching side ornaments; coordinates are altar-local, not hall-local. */
export function buildRestorationHangingOrnaments(options = {}) {
  const b = new FurnishingBuilder(options.materials);
  b.root.name = 'restoration-reference6-side-pendants';
  const layout = { ...RESTORATION_ALTAR_LAYOUT, ...options.layout };
  for (const side of [-1, 1]) {
    buildPendantStandard(b,side*layout.sidePendantX,layout.sidePendantY,layout.sidePendantZ,layout.sidePendantLength,layout.sidePendantWidth,layout.sideHeaderDrop,layout.sideHeaderCeilingContact);
    const lower=layout.sidePendantY+.080,upper=layout.hangingCeilingContacts[1]+.010;
    b.cylinder(side*layout.sidePendantX,(lower+upper)/2,layout.sidePendantZ+.025,.009,upper-lower,'gold');
    buildCanopy(b, side * 5.65, 5.82, 3.0, .38);
    buildVerticalSuspensionChain(b,side*5.65,5.82+.78*.38,3.0,layout.hangingCeilingContacts[2]);
  }
  b.finish();
  b.root.userData.hangingCeilingContactPoints = [-1,1].flatMap(side=>{
    const cx=side*layout.sidePendantX-side*(layout.sidePendantWidth/2+.61);
    return [[side*layout.sidePendantX,layout.hangingCeilingContacts[1],layout.sidePendantZ+.025],[side*5.65,layout.hangingCeilingContacts[2],3.0],
      ...[-.40,.40].map(dx=>[cx+dx,layout.sideHeaderCeilingContact[0],layout.sideHeaderCeilingContact[1]])];
  });
  return b.root;
}

class FurnishingBuilder {
  constructor(supplied = {}) {
    this.root = new T.Group();
    this.buckets = new Map();
    this.cache = new Map();
    this.matrix = new T.Matrix4();
    this.dummy = new T.Object3D();
    this.stack = [new T.Matrix4()];
    this.materials = {
      gold: supplied.gold || new T.MeshStandardMaterial({name:'restoration-polished-gilt',color:0xc59b49,metalness:.86,roughness:.31}),
      oldgold: supplied.oldgold || new T.MeshStandardMaterial({name:'restoration-carved-gilt-shadow',color:0x86602b,metalness:.77,roughness:.43}),
      lacquer: new T.MeshStandardMaterial({name:'restoration-black-brown-lacquer',color:0x17130e,metalness:.14,roughness:.30}),
      red: new T.MeshStandardMaterial({name:'restoration-vermillion-lacquer',color:0x521c13,metalness:.14,roughness:.30}),
      ivory: new T.MeshStandardMaterial({name:'restoration-candle-wax',color:0xe7d7b0,roughness:.68}),
      foliage: new T.MeshStandardMaterial({name:'restoration-offering-foliage',color:0x293524,metalness:0,roughness:.72}),
      flowerStem: new T.MeshStandardMaterial({name:'restoration-offering-flower-stems',color:0x4c5130,metalness:0,roughness:.70}),
      paper: new T.MeshStandardMaterial({name:'restoration-lantern-warm-paper',color:0xe1b264,roughness:.62,emissive:0xffb54e,emissiveIntensity:.65,side:T.DoubleSide}),
      flame: supplied.flame || new T.MeshStandardMaterial({name:'restoration-flame',color:0xffd47e,emissive:0xffa831,emissiveIntensity:2}),
      textile: new T.MeshStandardMaterial({name:'restoration-black-brocade',color:0x191818,roughness:.86}),
      ritualGlass: new T.MeshPhysicalMaterial({name:'restoration-clear-ritual-chimney',color:0xffffff,metalness:0,roughness:.06,transmission:1,ior:1.48,thickness:0,opacity:1,transparent:false,depthWrite:true,depthTest:true,side:T.FrontSide}),
    };
  }
  geometry(key, fn) {
    if(!this.cache.has(key)){
      const g=fn();
      // Only our closed parametric carvings have collapsed smooth tip rows.
      // Do not weld deliberate hard edges on boxes or extruded joinery.
      if(g.userData.closedCarvedShell&&!g.userData.coincidentNormalsSmoothed)smoothCoincidentShellNormals(g);
      this.cache.set(key,g);
    }
    return this.cache.get(key);
  }
  withTransform(x,y,z,s,fn,ry=0) {
    const mat = new T.Matrix4().makeRotationY(ry); mat.setPosition(x,y,z); mat.scale(Array.isArray(s)?new T.Vector3(...s):new T.Vector3(s,s,s));
    this.stack.push(this.stack.at(-1).clone().multiply(mat)); fn(); this.stack.pop();
  }
  add(g, material, x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0) {
    this.dummy.position.set(x,y,z); this.dummy.rotation.set(rx,ry,rz); this.dummy.scale.set(sx,sy,sz); this.dummy.updateMatrix();
    const key = g.uuid + ':' + material;
    if (!this.buckets.has(key)) this.buckets.set(key,{g,material,matrices:[]});
    this.buckets.get(key).matrices.push(this.stack.at(-1).clone().multiply(this.dummy.matrix));
  }
  box(x,y,z,w,h,d,m='lacquer') { this.add(this.geometry('box',()=>new T.BoxGeometry(1,1,1)),m,x,y,z,w,h,d); }
  ball(x,y,z,rx,ry,rz,m='gold') { this.add(this.geometry('ball',()=>new T.SphereGeometry(1,12,8)),m,x,y,z,rx,ry,rz); }
  cylinder(x,y,z,r,h,m='gold') { this.add(this.geometry('cylinder',()=>new T.CylinderGeometry(1,1,1,16)),m,x,y,z,r,h,r); }
  torus(x,y,z,r,tube,m='gold',rx=0,ry=0,rz=0) {
    const ratio=tube/r;
    const geo=this.geometry('torus:'+ratio.toFixed(5),()=>new T.TorusGeometry(1,ratio,5,40));
    this.add(geo,m,x,y,z,r,r,r,rx,ry,rz);
  }
  curve(key, points, radius, material='gold', segments=24) {
    const geo=this.geometry(key,()=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,5,false));
    this.add(geo,material);
  }
  castCurve(key, points, radius, material='gold', segments=24) {
    const geo=this.geometry(key,()=>{
      const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(path,segments,radius,5,false);
      // These existing small ritual ribs/stems are solid cast metal, not
      // open pipes. Close only their original end rings; retain every old
      // side position, normal, UV and index without recomputing them.
      const p=Array.from(g.attributes.position.array),normal=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),idx=Array.from(g.index.array);
      for(const end of[0,1]){
        const axis=path.getTangentAt(end).normalize().multiplyScalar(end?1:-1),center=path.getPointAt(end),rim=(end?segments:0)*6,cap=p.length/3;
        for(let j=0;j<=5;j++){
          const v=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j);
          p.push(v.x,v.y,v.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5+.5*Math.cos(j*Math.PI*2/5),.5+.5*Math.sin(j*Math.PI*2/5));
        }
        const ci=p.length/3;p.push(center.x,center.y,center.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5,.5);
        for(let j=0;j<5;j++){
          const a=new T.Vector3().fromArray(p,(cap+j)*3).sub(center),c=new T.Vector3().fromArray(p,(cap+j+1)*3).sub(center);
          if(a.cross(c).dot(axis)>0)idx.push(ci,cap+j,cap+j+1);else idx.push(ci,cap+j+1,cap+j);
        }
      }
      g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.userData.closedRitualCastTube=true;return g;
    });
    this.add(geo,material);
  }
  naturalCurve(key, points, radius, material='flowerStem', segments=24, rootTarget) {
    const geo=this.geometry(key,()=>{
      const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(path,segments,radius,5,false);
      const originalNormals=g.attributes.normal.array.slice(),offset=rootTarget===undefined?new T.Vector3():Array.isArray(rootTarget)?new T.Vector3(...rootTarget).sub(new T.Vector3(...points[0])):new T.Vector3(0,rootTarget-points[0][1],0);
      // Only the existing root cross-section moves, either down inside its
      // hollow vase or onto its parent branch. The tip and every remaining
      // side vertex are retained; no extra branch or flower is introduced.
      if(offset.lengthSq()){
        for(let i=0;i<6;i++){const q=new T.Vector3().fromBufferAttribute(g.attributes.position,i).add(offset);g.attributes.position.setXYZ(i,q.x,q.y,q.z);}
        g.computeVertexNormals();
        for(let i=12*3;i<originalNormals.length;i++)g.attributes.normal.array[i]=originalNormals[i];
      }
      const p=Array.from(g.attributes.position.array),normal=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),idx=Array.from(g.index.array);
      for(const end of[0,1]){
        const axis=path.getTangentAt(end).normalize().multiplyScalar(end?1:-1),center=path.getPointAt(end),rim=(end?segments:0)*6,cap=p.length/3;
        if(!end)center.add(offset);
        for(let j=0;j<=5;j++){
          const v=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j);
          p.push(v.x,v.y,v.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5+.5*Math.cos(j*Math.PI*2/5),.5+.5*Math.sin(j*Math.PI*2/5));
        }
        const ci=p.length/3;p.push(center.x,center.y,center.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5,.5);
        for(let j=0;j<5;j++){
          const a=new T.Vector3().fromArray(p,(cap+j)*3).sub(center),c=new T.Vector3().fromArray(p,(cap+j+1)*3).sub(center);
          if(a.cross(c).dot(axis)>0)idx.push(ci,cap+j,cap+j+1);else idx.push(ci,cap+j+1,cap+j);
        }
      }
      g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.userData.closedNaturalStem=true;g.userData.naturalRootShift=offset.toArray();return g;
    });
    this.add(geo,material);
  }
  carvedCurve(key,points,width,depth,material='gold',segments=32) {
    // Carved stems have a broad rolled face and a thinner back. A round wire
    // of the same outline cannot reproduce the photograph's gilt openwork.
    const geo=this.geometry(key,()=>{
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      const p=[],uv=[],idx=[],cols=8,stride=(segments+1)*(cols+1);
      for(let surface=0;surface<2;surface++)for(let j=0;j<=segments;j++){
        const t=j/segments,c=curve.getPoint(t),tangent=curve.getTangent(t);
        const length=Math.hypot(tangent.x,tangent.y)||1,nx=tangent.y/length,ny=-tangent.x/length;
        const taper=.48+.52*Math.pow(Math.sin(Math.PI*t),.58);
        for(let i=0;i<=cols;i++){
          const u=i/cols*2-1,offset=u*width*.5*taper;
          const zz=surface===0?depth*(.15+.85*(1-u*u)):-depth*.30;
          p.push(c.x+nx*offset,c.y+ny*offset,c.z+zz);uv.push(i/cols,t);
          if(j<segments&&i<cols){const q=surface*stride+j*(cols+1)+i;
            if(surface===0)idx.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);
            else idx.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);
          }
        }
      }
      closeCarvedShell(idx,segments,cols,stride);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      g.userData.mergeUniqueCarving=true;g.userData.closedCarvedShell=true;return g;
    });
    this.add(geo,material);
  }
  lathe(key,profile,x,y,z,r=1,h=1,m='gold',segments=28) {
    const geo=this.geometry(key,()=>new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments));
    this.add(geo,m,x,y,z,r,h,r);
  }
  leaf(x,y,z,w,h,angle=0,m='gold',depth=1) {
    const geo=this.geometry('sculpted-acanthus-leaf',()=>{
      const s=new T.Shape();s.moveTo(0,0);
      s.bezierCurveTo(-.36,.12,-.17,.25,-.40,.35);s.bezierCurveTo(-.20,.36,-.32,.58,-.23,.66);s.bezierCurveTo(-.16,.65,-.15,.86,0,1);
      s.bezierCurveTo(.15,.86,.16,.65,.23,.66);s.bezierCurveTo(.32,.58,.20,.36,.40,.35);s.bezierCurveTo(.17,.25,.36,.12,0,0);
      const g=new T.ExtrudeGeometry(s,{depth:.055,bevelEnabled:true,bevelSize:.025,bevelThickness:.022,bevelSegments:2,steps:1,curveSegments:5});
      return g;
    });
    this.add(geo,m,x,y,z,w,h,depth,0,0,angle);
  }
  flame(x,y,z,w,h,angle=0,m='gold',depth=1) {
    // A raised, rolled carving rather than a uniformly extruded flat leaf.
    // Its changing transverse curvature supplies real gilt highlight edges.
    const geo=this.geometry('sculpted-mandorla-flame',()=>{
      const p=[],uv=[],idx=[],rows=22,cols=10,stride=(rows+1)*(cols+1);
      for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const t=j/rows,u=i/cols*2-1;
        const halfWidth=.38*Math.pow(Math.sin(Math.PI*t),.72)*(1+.18*Math.sin(t*Math.PI*6));
        const bend=.11*Math.pow(t,3)+.025*Math.sin(Math.PI*t);
        const ridge=.125*Math.sin(Math.PI*t)*(1-u*u);
        p.push(u*halfWidth+.035*Math.sin(Math.PI*t*2),t,bend+(surface===0?ridge:-.034));uv.push(i/cols,t);
        if(j<rows&&i<cols){const q=surface*stride+j*(cols+1)+i;
          if(surface===0)idx.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);
          else idx.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);
        }
      }
      closeCarvedShell(idx,rows,cols,stride);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData.closedCarvedShell=true;return g;
    });
    this.add(geo,m,x,y,z,w,h,depth,0,0,angle);
  }
  closeMetalStrandEnds(g) {
    // TubeGeometry here describes solid rolled/cast metal strands, not a
    // hollow pipe. Finish their existing cross-sections only after local
    // rooting/depth deformation has completed. Never cap closed loops,
    // vessel mouths, glass walls, or previously closed cast/natural stems.
    const {tubularSegments:rows,radialSegments:cols,closed}=g.parameters||{};
    if(g.type!=='TubeGeometry'||closed||g.userData.closedRitualCastTube||g.userData.closedNaturalStem||g.userData.closedMetalStrand)return;
    const p=Array.from(g.attributes.position.array),normal=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),idx=Array.from(g.index.array);
    for(const end of[0,1]){
      const rim=(end?rows:0)*(cols+1),near=(end?rows-1:1)*(cols+1),center=new T.Vector3(),inner=new T.Vector3();
      for(let j=0;j<cols;j++){
        center.add(new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j));
        inner.add(new T.Vector3().fromBufferAttribute(g.attributes.position,near+j));
      }
      center.multiplyScalar(1/cols);inner.multiplyScalar(1/cols);
      const axis=new T.Vector3();
      for(let j=0;j<cols;j++){
        const a=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j).sub(center),c=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+(j+1)%cols).sub(center);
        axis.add(a.cross(c));
      }
      axis.normalize();if(axis.dot(center.clone().sub(inner))<0)axis.negate();
      const cap=p.length/3;
      for(let j=0;j<=cols;j++){
        const v=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j);
        p.push(v.x,v.y,v.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5+.5*Math.cos(j*Math.PI*2/cols),.5+.5*Math.sin(j*Math.PI*2/cols));
      }
      const ci=p.length/3;p.push(center.x,center.y,center.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5,.5);
      for(let j=0;j<cols;j++){
        const a=new T.Vector3().fromArray(p,(cap+j)*3).sub(center),c=new T.Vector3().fromArray(p,(cap+j+1)*3).sub(center);
        if(a.cross(c).dot(axis)>0)idx.push(ci,cap+j,cap+j+1);else idx.push(ci,cap+j+1,cap+j);
      }
    }
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.userData.closedMetalStrand=true;
  }
  finish() {
    let instances=0,triangles=0;
    const curveMerges=new Map();
    for(const {g,material,matrices} of this.buckets.values()){
      if(material==='gold'||material==='oldgold')this.closeMetalStrandEnds(g);
      // Unique carved curves are fused by material. Repeated leaves, pearls and
      // vessels remain instanced, avoiding hundreds of tiny shadow draw calls.
      if((g.type==='TubeGeometry'||g.userData.mergeUniqueCarving) && matrices.length<=12){
        if(!curveMerges.has(material))curveMerges.set(material,[]);
        for(const matrix of matrices)curveMerges.get(material).push(g.clone().applyMatrix4(matrix));
        instances+=matrices.length;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*matrices.length;
        continue;
      }
      const mesh=new T.InstancedMesh(g,this.materials[material],matrices.length);
      mesh.name='restoration-altar:'+material;
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=material!=='flame'&&material!=='ritualGlass';mesh.receiveShadow=true;
      if(material==='ritualGlass')mesh.userData.excludeFromOpaqueDepth=true;
      mesh.computeBoundingBox();mesh.computeBoundingSphere();this.root.add(mesh);
      instances+=matrices.length;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*matrices.length;
    }
    for(const [material,parts] of curveMerges){
      const g=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
      const mesh=new T.Mesh(g,this.materials[material]);mesh.name='restoration-altar:merged-'+material;
      mesh.castShadow=true;mesh.receiveShadow=true;this.root.add(mesh);
    }
    this.root.userData.meshStatistics={batches:this.root.children.length,instances,triangles};
  }
}

function smoothCoincidentShellNormals(g) {
  const p=g.attributes.position,n=g.attributes.normal,groups=new Map();
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
  }
  for(const ids of groups.values())if(ids.length>1){
    const average=new T.Vector3();for(const i of ids)average.add(new T.Vector3().fromBufferAttribute(n,i));
    if(average.lengthSq()>1e-16){average.normalize();for(const i of ids)n.setXYZ(i,average.x,average.y,average.z);}
  }
  n.needsUpdate=true;g.userData.coincidentNormalsSmoothed=true;return g;
}

function closeCarvedShell(indices,rows,cols,stride) {
  // Opposite side walls and the two end caps require opposite winding.
  // Keeping the same triangle order on both edges leaves one side inside-out.
  for(let j=0;j<rows;j++){
    const left=j*(cols+1),leftNext=left+cols+1;
    indices.push(left,leftNext,left+stride,leftNext,leftNext+stride,left+stride);
    const right=left+cols,rightNext=right+cols+1;
    indices.push(right,right+stride,rightNext,rightNext,right+stride,rightNext+stride);
  }
  for(let i=0;i<cols;i++){
    const bottom=i,top=rows*(cols+1)+i;
    indices.push(bottom,bottom+stride,bottom+1,bottom+1,bottom+stride,bottom+stride+1);
    indices.push(top,top+1,top+stride,top+1,top+stride+1,top+stride);
  }
}

function buildTerraces(b,layout) {
  // Distinct central carved fronts and recessed wing returns: the original
  // does not present three full-width coplanar strips of cupboard doors.
  const tiers=[
    {y:.38,h:.76,w:6.25,d:3.28,n:5},
    {y:.92,h:.28,w:6.47,d:3.00,n:7},
    {y:1.28,h:.25,w:6.72,d:2.70,n:5},
    {y:1.64,h:.24,w:6.98,d:2.40,n:7},
    {y:2.12,h:.11,w:7.25,d:1.88,n:5},
  ];
  tiers.forEach((t,level)=>{
    t.w=layout.terraceWidths[level];
    const stepped=level>0&&level<4,frontWidth=stepped?layout.carvedFrontWidths[level-1]:t.w;
    const wingWidth=(t.w-frontWidth)/2,wingInset=.34;
    const carcassTop=t.y+t.h/2,carcassBottom=level===0?Math.min(t.y-t.h/2,layout.floorContactY):t.y-t.h/2;
    b.box(0,(carcassTop+carcassBottom)/2,0,frontWidth,carcassTop-carcassBottom,t.d,'lacquer');
    if(stepped)for(const side of [-1,1])b.box(side*(frontWidth+wingWidth)/2,t.y,-wingInset/2,wingWidth,t.h,t.d-wingInset,'lacquer');
    const front=t.d/2+.025;
    for(const dy of [-t.h/2+.017,t.h/2-.017]) {
      b.box(0,t.y+dy,front,frontWidth+.04,.021,.045,'gold');
      b.box(0,t.y+dy+Math.sign(dy)*.024,front-.016,frontWidth+.11,.025,.067,'oldgold');
      if(stepped)for(const side of [-1,1]){
        b.box(side*(frontWidth+wingWidth)/2,t.y+dy,front-wingInset,wingWidth+.035,.021,.045,'gold');
        b.box(side*frontWidth/2,t.y+dy,front-wingInset/2,.025,.021,wingInset+.045,'gold');
      }
    }
    if(stepped){
      // The setback ledge is a separate shelf with a deep shadow underneath,
      // not a tall flush cupboard door repeated at every elevation.
      const ledgeDepthExtra=level===3?.16:.08,ledgeFrontExtra=level===3?.075:.035;
      b.box(0,t.y+t.h/2+.042,0,frontWidth+.10,.055,t.d+ledgeDepthExtra,'lacquer');
      b.box(0,t.y+t.h/2+.073,front+ledgeFrontExtra,frontWidth+.12,.018,.052,'gold');
      for(const side of [-1,1]){
        b.box(side*(frontWidth+wingWidth)/2,t.y+t.h/2+.042,-wingInset/2,wingWidth+.10,.055,t.d-wingInset+ledgeDepthExtra,'lacquer');
        b.box(side*(frontWidth+wingWidth)/2,t.y+t.h/2+.073,front-wingInset+ledgeFrontExtra,wingWidth+.10,.018,.052,'gold');
        b.box(side*(frontWidth/2+.04),t.y+t.h/2+.073,front-wingInset/2+ledgeFrontExtra,.025,.018,wingInset+.025,'gold');
      }
    }
    if(level===0){
      // Quiet black-lacquer base cupboards with separate corner medallions,
      // rather than yet another drawer row behind the foreground table.
      for(const side of [-1,1]){
        const x=side*t.w*.416,w=t.w*.145;
        b.box(x,t.y,front+.005,w,t.h-.075,.065,'lacquer');
        for(const xx of [-1,1])b.box(x+xx*w/2,t.y,front+.048,.023,t.h-.055,.026,'oldgold');
        for(let k=0;k<8;k++){const a=k*Math.PI/4;b.leaf(x+Math.sin(a)*.017,t.y+Math.cos(a)*.017,front+.0385,.052,.10,-a,'gold',.4);}
        b.ball(x,t.y,front+.0505,.029,.029,.015,'gold');
      }
      b.box(0,t.y,front+.0075,t.w*.68,t.h-.06,.070,'lacquer');
    }else if(level===4){
      // Extend only the concealed underside to the real lower tread.
      // The old top and all footprint edges stay fixed, with the front setback intact.
      const platformTop=1.98,platformBottom=1.8285;
      for(const side of [-1,1])b.box(side*2.73,(platformTop+platformBottom)/2,-.15,2.23,platformTop-platformBottom,1.92,'lacquer');
      b.box(0,(platformTop+platformBottom)/2,-.15,2.67,platformTop-platformBottom,1.92,'lacquer');
      for(const y of [1.982,2.186])b.box(0,y,.97,7.30,.022,.060,'gold');
      // This narrow return joins the back-platform trim to the black wood.
      // Front ritual feet instead use the existing lower carved-row tread;
      // carrying a full shelf across their height would erase that step.
      b.box(0,1.960,.895,7.30,.040,.25,'lacquer');
      // Small relieved edge fittings, not another full-height drawer row.
      for(let i=-4;i<=4;i++){b.box(i*.78,2.12,.98,.075,.10,.045,'oldgold');b.ball(i*.78,2.12,1.012,.022,.026,.014,'gold');}
    }else{
      const weights=[[1,1,1],[1.0,1.8,.72,1.8,1.0],[2.7,.72,.95,.72,2.7],[1.05,.65,1.2,.85,1.2,.65,1.05],[1.25,1.15,.75,1.15,1.25]][level];
      const gap=.105,total=weights.reduce((a,v)=>a+v,0),available=frontWidth-.22-gap*(weights.length-1);
      let cursor=-frontWidth/2+.11;
      weights.forEach((weight,i)=>{
        const pw=available*weight/total,x=cursor+pw/2;
        framedScrollPanel(b,x,t.y,front+.018,pw,t.h-.083,(level+i)%2,t.d/2);
        cursor+=pw+gap;
        if(i<weights.length-1){
          b.box(cursor-gap/2,t.y,front+.022,.052,t.h-.045,.098,'oldgold');
          for(const yy of [-1,1])b.box(cursor-gap/2,t.y+yy*(t.h*.38),front+.063,.080,.038,.040,'gold');
        }
      });
    }
    // Gilt corner caps visibly wrap the depth of the cabinet.
    for(const s of [-1,1])for(const [width,depthOffset] of stepped?[[frontWidth,0],[t.w,wingInset]]:[[t.w,0]]){
      b.box(s*(width/2-.06),t.y,front+.035-depthOffset,.095,t.h-.042,.028,'gold');
      b.box(s*(width/2+.006),t.y,front-.10-depthOffset,.025,t.h-.042,.25,'oldgold');
    }
  });
  for(const xx of [-2.72,-2.02,2.02,2.72]){
    b.lathe('altar-slender-tier-upright',[[0,0],[.06,.01],[.045,.06],[.028,.11],[.027,1.01],[.050,1.05],[.041,1.11],[0,1.12]],xx,.77,1.56,1,1,'lacquer',16);
    for(const [yy,row,isLedge] of [[.81,1,false],[1.09,1,true],[1.45,2,true],[1.82,3,true]]){
      b.torus(xx,yy,1.56,.045,.009,'gold',Math.PI/2);
      // Capitals return to the actual recessed stair, rather than float in
      // front of it. Outer posts bridge the side-wing setback as required.
      const inset=Math.abs(xx)>layout.carvedFrontWidths[row-1]/2?.34:0;
      const bearingZ=tiers[row].d/2-inset+(isLedge?(row===3?.08:.04):0);
      b.box(xx,yy,(1.56+bearingZ)/2,.12,.035,Math.abs(1.56-bearingZ)+.10,'oldgold');
    }
    b.ball(xx,1.91,1.56,.048,.064,.048,'gold');
  }
  b.box(0,1.01,1.57,.43,.48,.13,'oldgold');
  b.box(0,1.01,1.645,.35,.40,.035,'lacquer');
  for(let k=0;k<10;k++){const a=k*Math.PI/5;b.leaf(Math.sin(a)*.025,1.01+Math.cos(a)*.025,1.6505,.06,.14,-a,'gold',.65);}
  b.ball(0,1.01,1.6805,.040,.040,.02,'gold');
  // Raised plinth beneath central lotus. Attendants have individually stepped bases.
  const seatBottom=3.00-layout.mainThroneHeight;
  // The original central lotus stands on two recessed black-lacquer bands
  // between narrow molding edges, not one unarticulated rectangular block.
  // The existing lower bearing, upper seat and outer cap stay fixed.
  const plinthBottom=2.175,plinthHeight=seatBottom-plinthBottom;
  for(const [lo,hi,w,d] of [[0,.12,2.52,1.76],[.12,.50,2.44,1.68],[.50,.88,2.36,1.60],[.88,1,2.52,1.76]])
    b.box(0,plinthBottom+(lo+hi)*plinthHeight/2,-.08,w,(hi-lo)*plinthHeight,d,'lacquer');
  b.box(0,plinthBottom+.12*plinthHeight,-.08,2.54,.009,1.78,'oldgold');
  b.box(0,plinthBottom+.50*plinthHeight,-.08,2.48,.012,1.72,'oldgold');
  b.box(0,seatBottom-.003,-.08,2.59,.025,1.82,'gold');
  for(const side of [-1,1])for(let i=0;i<3;i++) {
    const w=2.13-i*.13, y=2.05+i*.115,z=-.09,d=1.53-i*.085;
    b.box(side*layout.sideFigureX,y,z,w,.16,d,'lacquer');
    b.box(side*layout.sideFigureX,y+.078,z,w+.065,.023,d+.055,'gold');
    framedScrollPanel(b,side*layout.sideFigureX,y,z+d/2+.025,w-.15,.092,i%2,z+d/2);
    if(i===2){b.box(side*layout.sideFigureX,2.4025,z,1.87,.085,1.35,'lacquer');b.box(side*layout.sideFigureX,2.447,z,1.91,.015,1.39,'gold');}
  }
}

function framedScrollPanel(b,x,y,z,w,h,variant=0,bearingZ) {
  // Keep the photographed front face and relief fixed while the hidden board
  // back enters its real cabinet, rather than hanging off neighboring trim.
  const faceZ=z+.0125,backZ=Number.isFinite(bearingZ)?Math.min(z-.0125,bearingZ-.002):z-.0125;
  b.box(x,y,(faceZ+backZ)/2,w,h,faceZ-backZ,'lacquer');
  for(const side of [-1,1]){
    b.box(x+side*w/2,y,z+.021,.017,h+.013,.021,'gold');
    b.box(x,y+side*h/2,z+.021,w,.013,.021,'gold');
    b.box(x+side*(w/2-.042),y,z+.021,.009,h-.04,.021,'oldgold');
  }
  // One coherent bilateral vine relief per framed field. Geometry is shared.
  const g=b.geometry('scroll-relief:'+variant,()=>scrollReliefGeometry(variant));
  // Sink the cast relief's concealed back into its actual lacquer panel.
  // Previously every part hovered ahead of the board; the central pearl
  // now overlaps it by .00025 while all carved fronts remain raised.
  b.add(g,'gold',x,y,z+.004,w*.91,h*1.12,.55);
  for(const side of [-1,1]) b.ball(x+side*(w/2-.045),y,z+.04,.018,Math.min(.027,h*.16),.012,'oldgold');
}

function scrollReliefGeometry(variant) {
  // Reference cabinet relief: bilateral long-bodied creatures among cloud
  // scrolls, with heads facing a central pearl. Avoid an X-shaped leaf glyph.
  const parts=[];
  const tube=(ps,r=.014,n=22)=>{
    const path=new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(path,n,r,5,false);
    // These ridges, horns and claw tips are solid casting, not open pipes.
    // Close only the existing end rings; retain every original side vertex,
    // side normal, UV and triangle. Separate rim vertices keep flat cap normals.
    const p=Array.from(g.attributes.position.array),normal=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),idx=Array.from(g.index.array);
    for(const end of [0,1]){
      const axis=path.getTangentAt(end).normalize().multiplyScalar(end?1:-1),center=path.getPointAt(end),rim=(end?n:0)*6,cap=p.length/3;
      for(let j=0;j<=5;j++){
        const v=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+j);
        p.push(v.x,v.y,v.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5+.5*Math.cos(j*Math.PI*2/5),.5+.5*Math.sin(j*Math.PI*2/5));
      }
      const ci=p.length/3;p.push(center.x,center.y,center.z);normal.push(axis.x,axis.y,axis.z);uv.push(.5,.5);
      for(let j=0;j<5;j++){
        const a=new T.Vector3().fromArray(p,(cap+j)*3).sub(center),b=new T.Vector3().fromArray(p,(cap+j+1)*3).sub(center);
        if(a.cross(b).dot(axis)>0)idx.push(ci,cap+j,cap+j+1);else idx.push(ci,cap+j+1,cap+j);
      }
    }
    g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normal,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.userData.closedCastTube=true;parts.push(g);
  };
  const ellipse=(x,y,z,rx,ry,rz)=>parts.push(new T.SphereGeometry(1,12,8).scale(rx,ry,rz).translate(x,y,z));
  for(const side of [-1,1]){
    const body=[];
    for(let i=0;i<=36;i++){
      const t=i/36;body.push([side*(.13+.30*t),.15*Math.sin(t*Math.PI*2.8+variant*.4),.035+.018*Math.sin(t*Math.PI)]);
    }
    tube(body,.055,36);
    tube(body.map(p=>[p[0],p[1]+.059,p[2]+.015]),.012,36);
    const head=new T.Shape();
    head.moveTo(side*.052,.025);head.lineTo(side*.072,.125);
    head.bezierCurveTo(side*.092,.205,side*.145,.185,side*.173,.085);
    head.lineTo(side*.178,-.04);head.lineTo(side*.133,-.08);head.lineTo(side*.106,-.04);
    head.lineTo(side*.051,-.058);head.closePath();
    parts.push(new T.ExtrudeGeometry(head,{depth:.060,bevelEnabled:true,bevelSize:.008,bevelThickness:.014,bevelSegments:2,curveSegments:5}));
    ellipse(side*.100,.101,.0855,.015,.028,.012);
    tube([[side*.129,.14,.07],[side*.155,.29,.06],[side*.198,.31,.02]],.024,11);
    tube([[side*.071,.012,.075],[side*.020,-.10,.07],[side*.063,-.19,.035]],.008,12);
    for(const t of [.28,.65]){
      const xx=side*(.13+.30*t),yy=.15*Math.sin(t*Math.PI*2.8+variant*.4);
      for(const sign of [-1,1]){
        const joint=[xx+side*.036,yy+sign*.12,.046],tip=[xx-side*.018,yy+sign*.24,.022];
        tube([[xx,yy,.04],joint,tip],.029,11);
        for(let digit=-1;digit<=1;digit++)tube([tip,[tip[0]+side*(.026+digit*.018),tip[1]+sign*.060,.018]],.011,5);
      }
    }
    for(let k=0;k<9;k++){
      const t=.12+k*.085,xx=side*(.13+.30*t),yy=.15*Math.sin(t*Math.PI*2.8+variant*.4);
      tube([[xx-side*.016,yy+.016,.054],[xx+side*.010,yy+.070,.064],[xx+side*.020,yy+.010,.052]],.009,8);
    }
    for(const sign of [-1,1]){
      const ps=[];for(let k=0;k<=24;k++){const t=k/24,a=t*Math.PI*2.25,r=.068*(1-t*.72);ps.push([side*(.405+Math.cos(a)*r),sign*(.22+Math.sin(a)*r*1.7),.025]);}tube(ps,.022,24);
    }
  }
  ellipse(0,0,.050,.029,.10,.035);
  const normalized=parts.map(g=>g.index?g.toNonIndexed():g),merged=mergeGeometries(normalized,false);
  normalized.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return merged;
}

function buildMandorla(b,x,y,z,s,headCenterY,apexY,widthScale=1,supportY,chasedHeadWheel=false) {
  const rootY=y+1.40*s;
  if(Number.isFinite(supportY)&&supportY<rootY-.01){
    // Side mandorla roots sit behind, not on, the attendant's higher plinth.
    // A plain hidden stock reaches the real upper ledge at Y2.175; do not
    // lower the carved halo or invent another ornamental pedestal.
    const top=rootY+.012,zz=z-.043*s;
    b.box(x,(supportY+top)/2,zz,.12*s,top-supportY,.086*s+.024,'lacquer');
    b.box(x,supportY+.012,zz,.12*s+.035,.024,.086*s+.035,'oldgold');
  }
  b.withTransform(x,y,z,s,()=>{
    const bottom=1.40,top=(apexY-y)/s,height=top-bottom;
    const cy=(headCenterY-y)/s;
    const shapeKey='mandorla-'+top.toFixed(5)+'-'+widthScale+'-'+cy.toFixed(5)+':';
    const edge=t=>2.09*widthScale*Math.pow(Math.sin(Math.PI*t),.72)*(1-.20*t);
    // Two structural ribs support the carved branching field. Four naked
    // parallel wires read as an empty fence in the actual Mac017 close-up.
    for(const layer of [0,2])for(const side of [-1,1]) {
      const ps=[];for(let i=0;i<=56;i++){
        const t=i/56;ps.push([side*(edge(t)-layer*.115*Math.sin(Math.PI*t)),bottom+t*height,-layer*.043]);
      }
      b.carvedCurve(shapeKey+'mandorla-frame:'+layer+':'+side,ps,layer===0?.070:.052,.032,layer===2?'oldgold':'gold',62);
    }
    // Radial head aureole: visibly separate chased disk, bead rim and rays.
    // Head rings follow the sculpture's measured face center independently
    // from the outer mandorla apex and lower branching structure.
    if(chasedHeadWheel){
    const headBand=b.geometry('chased-head-aureole-band',()=>{
      const outer=new T.Shape();outer.absarc(0,0,.80,0,Math.PI*2,false);
      const hole=new T.Path();hole.absarc(0,0,.62,0,Math.PI*2,true);outer.holes.push(hole);
      return new T.ExtrudeGeometry(outer,{depth:.027,bevelEnabled:true,bevelSize:.006,bevelThickness:.006,bevelSegments:2,steps:1,curveSegments:48});
    });
    b.add(headBand,'oldgold',0,cy,.054);
    for(const r of [.62,.80])b.torus(0,cy,.095,r,.012,'gold');
    // The original head wheel has short radial chasing, not a pearl row.
    // A shared rolled reed sits partly inside the cast annulus; two larger
    // concentric rails hold the open spokes behind it, leaving real gaps.
    const reed=b.geometry('head-band-radial-reed',()=>{
      const sh=new T.Shape();sh.moveTo(.649,-.020);
      sh.bezierCurveTo(.688,-.022,.737,-.006,.774,0);
      sh.lineTo(.774,.024);sh.bezierCurveTo(.737,.018,.688,.002,.649,.004);sh.closePath();
      return new T.ExtrudeGeometry(sh,{depth:.009,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,steps:1,curveSegments:6});
    });
    for(const r of [1.03,1.085])b.torus(0,cy,.025,r,.010,'gold');
    for(let k=0;k<56;k++){
      const a=k/56*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
      b.add(reed,'gold',0,cy,.080,1,1,1,0,0,a);
      if(k%2===0){
        b.curve(shapeKey+'halo-ray:'+k,[[ca*.795,cy+sa*.795,.066],[ca*.94,cy+sa*.94,.045],[ca*1.085,cy+sa*1.085,.025]],.012,'gold',7);
      }
    }
    }
    // Flame tendrils project from a continuous spine, each with two small scrolls.
    const flameRows=Math.round(height/.22);
    for(const side of [-1,1])for(let row=0;row<flameRows;row++){
      const t=.075+row/(flameRows-1)*.81,yy=bottom+t*height,xx=side*edge(t);
      const slope=(edge(Math.min(.99,t+.005))-edge(Math.max(.01,t-.005)))/(.01*height);
      const lean=Math.atan(-side*slope)*.32-side*.46;
      b.flame(xx,yy,.025,.29,.40,lean,'gold',.90);
      const ps=[[xx,yy,.01],[xx+side*.14,yy+.075,.045],[xx+side*.23,yy+.22,.03],[xx+side*.12,yy+.36,0],[xx+side*.075,yy+.27,.015]];
      b.carvedCurve(shapeKey+'mandorla-flame:'+side+':'+row,ps,.064,.026,'gold',24);
      b.carvedCurve(shapeKey+'mandorla-inscroll:'+side+':'+row,[[xx,yy,.028],[xx-side*.29,yy+.04,.055],[xx-side*.26,yy+.20,.03],[xx-side*.15,yy+.18,.03],[xx-side*.18,yy+.115,.05]],.048,.023,'oldgold',22);
      b.ball(xx-side*.08,yy+.016,.072,.026,.033,.019,'gold');
    }
    // Each flank branch is rooted on the actual outer rib. The old constant-X
    // roots floated behind the shoulders and left an empty annular slot.
    for(const side of [-1,1])for(let row=0;row<8;row++){
      const t=.15+row/7*.49,yy=bottom+t*height,xx=side*edge(t);
      const reach=.44+.11*Math.sin(row/7*Math.PI);
      const branch=[[xx,yy,-.025],[xx-side*.17,yy+.04,.015],[xx-side*reach,yy+.22,.045],[xx-side*(reach+.035),yy+.40,.025],[xx-side*(reach-.10),yy+.43,.03],[xx-side*(reach-.06),yy+.32,.035]];
      b.carvedCurve(shapeKey+'mandorla-innerbranch:'+side+':'+row,branch,.088,.038,'gold',32);
      b.flame(xx-side*.22,yy+.075,.035,.27,.34,side*.65,'gold',.85);
      b.flame(xx-side*(reach-.03),yy+.26,.035,.14,.23,-side*.57,'gold',.65);
      b.flame(xx-side*.10,yy-.015,.025,.15,.25,-side*.90,'oldgold',.72);
    }
    // The taller crown is connected to the head wheel by a real fan of
    // slender branches; it is not an empty stretched wire outline.
    for(let k=-5;k<=5;k++){
      const a=k*.13,ex=k*.22,ey=top-.45-Math.abs(k)*.10;
      let sx=Math.sin(a)*.79,sy=cy+Math.cos(a)*.79,sz=.060;
      let mx=(Math.sin(a)*.81+ex)/2,my=(cy+Math.cos(a)*.81+ey)/2;
      if(!chasedHeadWheel){
        // The attendants have a pierced flame screen, not the central
        // circular head wheel. Existing upper branches bear on its inner rib.
        if(k===0){sx=0;sy=top-.004;mx=0;my=(top+ey)/2;}
        else{const t=.69+(5-Math.abs(k))*.02;sx=Math.sign(k)*(edge(t)-.23*Math.sin(Math.PI*t));sy=bottom+t*height;}
        sz=-.075;
      }
      b.carvedCurve(shapeKey+'mandorla-upper-fan:'+k,[[sx,sy,sz],[mx,my,-.035],[ex,ey,-.04]],.057,.026,'gold',24);
      // Opposed scrolling lobes retain the existing pierced leaf openings.
      // The side screen's central stock descends from the actual pointed rib;
      // it does not need a new pair of loops outside that crown.
      if(chasedHeadWheel||k!==0)for(const side of [-1,1])b.carvedCurve(shapeKey+'mandorla-upper-scroll:'+k+':'+side,[[mx,my,-.025],[mx+side*.18,my+.10,.015],[mx+side*.20,my+.31,.025],[mx+side*.08,my+.39,.015],[mx+side*.055,my+.27,.02]],.052,.025,'gold',24);
      b.flame(ex,ey-.13,-.02,.17,.28,-k*.05,'gold',.65);
    }
    // Tapering crown finial, composed of buds and flames instead of roof bars.
    b.flame(0,top-.30,.02,.20,.50,0,'gold');
    for(const side of [-1,1]){
      // Root the existing side buds in the existing center fan leaf. Only
      // their lower quarter bends inward; their tips and outer shoulders stay fixed.
      const rooted=b.geometry('rooted-crown-side-flame:'+side,()=>{
        const g=b.cache.get('sculpted-mandorla-flame').clone(),p=g.attributes.position;
        const rows=22,cols=10,stride=(rows+1)*(cols+1);
        for(let i=0;i<p.count;i++){
          const t=Math.floor((i%stride)/(cols+1))/rows,weight=Math.max(0,1-t/.25);
          p.setX(i,p.getX(i)-side*.04*Math.cos(.52)/.17*weight);
          p.setY(i,p.getY(i)-.04*Math.sin(.52)/.38*weight);
        }
        g.computeVertexNormals();return smoothCoincidentShellNormals(g);
      });
      b.add(rooted,'gold',side*.07,top-.36,.012,.17,.38,1,0,0,-side*.52);
    }
  });
}

function buildLotusThrone(b,x,seatY,z,radius,height,radialCompensation=[1,1],depthAspect=.68) {
  // Undo the hall's nonuniform X/Z scaling ONLY around the seat center.
  // Translation, contact Y and vertical thickness are deliberately unchanged.
  b.withTransform(x,seatY-height,z,[radialCompensation[0],1,radialCompensation[1]*depthAspect],()=>{
    b.lathe('lotus-seat-core',[[0,0],[.62,.015],[.77,.10],[.91,.25],[1,.55],[.91,.84],[.76,.95],[0,1]],0,0,0,radius*.63,height,'oldgold',48);
    // Thin hidden support reaches under the actual front knee (Z≈.96 for
    // the central figure); the thick belly remains well inside the petals.
    // The flat bearing ends at .87 + .13 = 1, exactly at physical seatY.
    // Do not lower the body or enlarge the rim to cover the side toe overhang.
    b.lathe('lotus-seat-top',[[0,0],[.79,0],[.85,.035],[.88,.075],[.86,.13],[0,.13]],0,height*.87,0,radius,height,'oldgold',48);
    const petal=b.geometry('thick-lotus-throne-petal',()=>{
      const p=[],uv=[],idx=[],rows=16,cols=10;
      for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const t=j/rows,u=i/cols*2-1;
        const width=Math.pow(Math.sin(Math.PI*t),.67)*.46*(1-.08*t);
        const radial=.06+Math.sin(t*Math.PI*.75)*.33+Math.pow(t,2)*.24-.18*Math.pow(Math.max(0,(t-.75)/.25),2);
        const ridge=(1-u*u)*Math.sin(Math.PI*t)*.072;
        // Original petals have broad arched shoulders and a narrow rolled
        // border. Recess the shoulders behind the existing center ridge;
        // no vertex advances beyond the old front envelope or moves in X/Y.
        const roll=.040*Math.exp(-Math.pow((Math.abs(u)-.90)/.12,2));
        const shoulder=Math.min(0,-.070*u*u+roll)*Math.sin(Math.PI*t);
        p.push(u*width,t,radial+ridge+shoulder-(surface===1?.055:0));uv.push(i/cols,t);
        if(j<rows&&i<cols){const a=surface*(rows+1)*(cols+1)+j*(cols+1)+i;
          if(surface===0)idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
          else idx.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
      }
      closeCarvedShell(idx,rows,cols,(rows+1)*(cols+1));
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
      // The collapsed pointed ends share positions but used to retain a fan
      // of unrelated normals. Average only coincident seam/tip vertices.
      const positions=g.attributes.position,normals=g.attributes.normal,groups=new Map();
      for(let i=0;i<positions.count;i++){
        const key=[positions.getX(i),positions.getY(i),positions.getZ(i)].map(v=>Math.round(v*1e7)).join(',');
        if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);
      }
      for(const ids of groups.values())if(ids.length>1){
        const n=new T.Vector3();for(const i of ids)n.add(new T.Vector3().fromBufferAttribute(normals,i));n.normalize();
        for(const i of ids)normals.setXYZ(i,n.x,n.y,n.z);
      }
      g.userData.closedCarvedShell=true;g.userData.restorationLotusPetal=true;g.userData.coincidentNormalsSmoothed=true;return g;
    });
    for(let layer=0;layer<2;layer++){
      const n=[16,18][layer],rr=radius*[.63,.72][layer];
      for(let k=0;k<n;k++){
        const a=k/n*Math.PI*2+layer*.13;
        // A physically shallower FRONT lip preserves the low camera's view of
        // the crossed feet. Do not raise a full circular crown across the legs.
        const frontal=Math.max(0,Math.cos(a));
        const base=height*[.00,.18][layer],hh=height*[.79,.80][layer]*(1-(layer===0?.09:.015)*frontal);
        // Keep the upper pointed row just behind the true front knee, so its
        // tips meet the underside without a black void or a face-high bowl.
        const rowDepth=layer===1?.87:1;
        b.withTransform(Math.sin(a)*rr,base,Math.cos(a)*rr*rowDepth,[1,1,rowDepth],()=>b.add(petal,'gold',0,0,0,radius*[.36,.31][layer],hh,radius*.38,0,a,0));
      }
    }
    b.torus(0,height*.11,0,radius*.67,.022,'gold',Math.PI/2);
  });
}

function buildRitualObjects(b,layout) {
  for(const side of [-1,1]) {
    // The foreground lamps are taller than the rear tabletop lamps.
    buildLantern(b,side*layout.floorLampX,layout.floorContactY,2.18,layout.floorLampScale,true);
    buildLantern(b,side*2.45,1.8295,1.01,.35);
    buildUpperOfferingVase(b,side*layout.upperVaseX,layout.upperVaseY,layout.upperVaseZ,side);
    buildFloorOfferingVase(b,side*layout.floorVaseX,layout.floorContactY,1.90);
    buildFloorFloralOffering(b,side*layout.floorVaseX,layout.floorContactY,1.90,side);
    buildLiddedUrn(b,side*layout.floorUrnX,layout.floorContactY,1.75,1);
    for(let i=0;i<3;i++)buildCandlestick(b,side*(i===2?2.50:1.37+i*.60),2.33,1.17-(i%2)*.15,.57+(i===1?.24:0),i===2,1.8295);
    buildLotusOffering(b,side*1.92,2.33,.19,.91,-side,true,2.4545);
    buildLotusOffering(b,side*3.30,2.31,.03,.71,-side,false,2.4545);
    buildFloralOffering(b,side*.77,1.8295,1.168,side);
    // One slender flared vessel between each flower vase and the center,
    // rather than two identical short bowls at each side of the smoke axis.
    const xx=side*.43;
    b.lathe('slender-front-offering-vessel',[[0,0],[.085,0],[.080,.025],[.050,.080],[.065,.13],[.050,.18],[.038,.22],[.026,.28],[.020,.40],[.050,.46],[.045,.47],[.005,.46],[.008,.40],[0,.27]],xx,1.8295,1.16,1,1,'gold',28);
    b.ball(xx,2.0595,1.16,.055,.050,.055,'lacquer');
  }
  // Do not fill the reference's smoke/robe axis with an invented lidded urn.
  // Its old base was embedded in the central throne plinth, not on a shelf.
}

function offeringNaturalLeaf(b) {
  return b.geometry('offering-folded-natural-leaf',()=>{
    const p=[],uv=[],idx=[],rows=16,cols=8,stride=(rows+1)*(cols+1);
    for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const t=j/rows,u=i/cols*2-1,w=.44*Math.pow(Math.sin(Math.PI*t),.72);
      const center=.12*Math.sin(Math.PI*t)+.18*t*t;
      p.push(u*w,t,center+(surface===0?.065*(1-u*u)*Math.sin(Math.PI*t):-.007));uv.push(i/cols,t);
      if(j<rows&&i<cols){const q=surface*stride+j*(cols+1)+i;if(surface===0)idx.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);else idx.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);}
    }
    closeCarvedShell(idx,rows,cols,stride);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData.closedCarvedShell=true;g.userData.offeringNaturalPart='leaf';return g;
  });
}

function offeringNaturalPetal(b) {
  return b.geometry('offering-ivory-cupped-flower-petal',()=>{
    const p=[],uv=[],idx=[],rows=14,cols=8,stride=(rows+1)*(cols+1);
    for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const t=j/rows,u=i/cols*2-1,w=.036*Math.pow(Math.sin(Math.PI*t),.68);
      const r=.012+.045*Math.sin(Math.PI*t*.5)+.012*t*t;
      // The narrow lower root enters the existing cut stalk, rather than
      // leaving a flower cup suspended around an empty center.
      const root=1-T.MathUtils.smoothstep(t,0,.25);
      p.push(u*w,.13*t-.055*t*t*t-.006*root,r-.018*(1-u*u)*Math.sin(Math.PI*t)+(surface===0?.0015:-.0015)-.009*root);uv.push(i/cols,t);
      if(j<rows&&i<cols){const q=surface*stride+j*(cols+1)+i;if(surface===0)idx.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);else idx.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);}
    }
    closeCarvedShell(idx,rows,cols,stride);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData.closedCarvedShell=true;g.userData.offeringNaturalPart='petal';return g;
  });
}

function addRootedNaturalLeaf(b,leaf,key,pose,target) {
  const [x,y,z,sx,sy,sz,rx,ry,rz]=pose;
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));
  const delta=new T.Vector3(...target).applyMatrix4(matrix.clone().invert()).sub(new T.Vector3(0,0,-.0035));
  const g=b.geometry(key,()=>{
    const g=leaf.clone(),p=g.attributes.position;
    // Retain the entire upper three quarters of the original leaf. The
    // existing folded lower root alone meets its own stalk or vase bouquet.
    for(let surface=0;surface<2;surface++)for(let row=0;row<=16;row++){
      const weight=1-T.MathUtils.smoothstep(row/16,0,.25);
      if(!weight)continue;
      for(let col=0;col<=8;col++){
        const i=surface*17*9+row*9+col,q=new T.Vector3().fromBufferAttribute(p,i).addScaledVector(delta,weight);p.setXYZ(i,q.x,q.y,q.z);
      }
    }
    g.computeVertexNormals();g.userData.coincidentNormalsSmoothed=false;g.userData.mergeUniqueCarving=true;g.userData.naturalLeafRootShift=delta.toArray();return g;
  });
  b.add(g,'foliage',...pose);
}

function pointOnNaturalStemAtY(points,y) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));let lo=0,hi=1;
  for(let i=0;i<36;i++){const t=(lo+hi)/2;if(curve.getPoint(t).y<y)lo=t;else hi=t;}
  return curve.getPoint((lo+hi)/2);
}

function buildFloralOffering(b,x,y,z,side) {
  // Two compact cut-flower offerings are visible in the original, in black
  // gilt vases before the upper stair. No extra bouquets fill other gaps.
  buildVase(b,x,y,z,.28,.25,'lacquer');
  const leaf=offeringNaturalLeaf(b),petal=offeringNaturalPetal(b);
  b.withTransform(x,y,z,1,()=>{
    for(let row=0;row<2;row++)for(let k=0;k<9;k++){
      const a=k/9*Math.PI*2+row*.35;
      const lean=1.02-row*.38-.34*Math.max(0,-Math.cos(a));
      b.withTransform(0,.277+row*.015,0,1,()=>addRootedNaturalLeaf(b,leaf,'front-natural-rooted-leaf:'+row+':'+k,[0,0,.020,.12-row*.016,.23-row*.035,.23-row*.035,lean,0,0],[0,.255-(.277+row*.015),0]),a);
    }
    const branches=[[-.13,.58,.02,1.05],[-.02,.69,-.03,.96],[.12,.54,.00,.94],[.22,.64,-.04,.82],[-.23,.49,.05,.80],[.04,.52,.10,.86],[-.09,.79,.00,0],[.17,.75,-.02,0]];
    branches.forEach(([dx,dy,dz,size],i)=>{
      const xx=dx*(side<0?1:-1),yy=dy*(side<0?1:.93);
      b.naturalCurve('offering-natural-stem:'+side+':'+i,[[0,.255,0],[xx*.30,.35,dz*.35],[xx*.80,yy-.075,dz*.80],[xx,yy,dz]],.0055,'flowerStem',20,.0465);
      if(size===0){b.ball(xx,yy+.025,dz,.018,.048,.018,'ivory');return;}
      for(let k=0;k<5;k++)b.add(petal,'ivory',xx,yy,dz,size,size*1.38,size,0,k*Math.PI*2/5+i*.37,0);
      for(let k=0;k<3;k++){
        const a=k*Math.PI*2/3+i*.6,tx=xx+Math.sin(a)*.012,tz=dz+Math.cos(a)*.012;
        b.cylinder(tx,yy+.039,tz,.0027,.066,'flowerStem');b.ball(tx,yy+.073,tz,.006,.011,.006,'oldgold');
      }
    });
  });
}

function buildVase(b,x,y,z,r,h,m) {
  // Retain every original exterior point, but give the visible open mouth
  // an actual rim and inner wall instead of a one-sided light-leaking sheet.
  const profile=[[0,0],[.36,0],[.42,.06],[.33,.14],[.22,.20],[.25,.33],[.47,.46],[.50,.61],[.43,.72],[.24,.80],[.22,1.03],[.29,1.08],[.30,1.12],[.24,1.14],
    [.226,1.14],[.286,1.12],[.276,1.08],[.206,1.03],[.226,.80],[.416,.72],[.486,.61],[.456,.46],[.236,.33],[.206,.20],[.19,.19],[0,.19]];
  b.lathe('flower-vase-closed-wall-profile',profile,x,y,z,r,h,m);
  for(const [yy,rr] of [[.05,.40],[.19,.23],[.77,.27],[1.09,.29]])b.torus(x,y+yy*h,z,rr*r,.013,'gold',Math.PI/2);
  for(let k=0;k<8;k++){
    const a=k*Math.PI/4,rr=.45*r;
    b.withTransform(x,y,z,1,()=>b.withTransform(0,0,0,1,()=>b.leaf(0,.44*h,rr,.18*r,.30*h,0,'oldgold',.6),a));
  }
}
function buildLiddedUrn(b,x,y,z,s) {
  b.withTransform(x,y,z,s,()=>{
    // Reference6's outer censer has a high carved foot, broad spherical bowl
    // and shallow winged lid. It is not a tiny round tabletop urn enlarged.
    const bodyProfile=[[0,0],[.255,0],[.270,.045],[.245,.095],[.205,.13],[.225,.20],[.215,.27],[.175,.37],[.180,.45],[.245,.52],[.295,.57],[.340,.62],[.390,.71],[.405,.80],[.390,.88],[.340,.94],[.285,.965],[.265,.980],[0,.980]];
    b.lathe('floor-urn-carved-high-foot-body',bodyProfile,0,0,0,1,1,'lacquer',64);
    const lidProfile=[[0,.972],[.280,.972],[.305,.992],[.400,1.015],[.445,1.035],[.440,1.055],[.385,1.040],[.315,1.045],[.215,1.085],[.095,1.100],[0,1.100]];
    b.lathe('floor-urn-shallow-lid',lidProfile,0,0,0,1,1,'lacquer',64);
    for(const [yy,r,thick] of [[.041,.265,.011],[.105,.228,.009],[.143,.208,.010],[.498,.221,.011],[.567,.293,.010],[.963,.286,.010],[.994,.307,.010]])b.torus(0,yy,0,r,thick,'gold',Math.PI/2);
    b.lathe('floor-urn-finial',[[0,0],[.052,.008],[.058,.032],[.047,.065],[.021,.085],[.026,.102],[0,.142]],0,1.095,0,1,1,'gold',32);
    const radiusAt=(yy)=>{
      for(let i=1;i<bodyProfile.length;i++)if(yy<=bodyProfile[i][1]&&bodyProfile[i][1]>bodyProfile[i-1][1]){
        const a=bodyProfile[i-1],c=bodyProfile[i];return T.MathUtils.lerp(a[0],c[0],(yy-a[1])/(c[1]-a[1]));
      }return .265;
    };
    const relief=(key,xy,w=.019)=>{
      b.carvedCurve(key,xy.map(([xx,yy])=>[xx,yy,Math.sqrt(Math.max(.0001,radiusAt(yy)**2-xx*xx))+.005]),w,.009,'gold',28);
      const g=b.cache.get(key);
      if(!g.userData.castOnUrnBody){
        // Conform each cross section to the existing turned body. Interpolated
        // control-point heights left most of these cast scrolls in empty air.
        const p=g.attributes.position,stride=29*9;
        for(let row=0;row<29;row++){
          const mid=row*9+4,xx=p.getX(mid),yy=p.getY(mid);
          const z=Math.sqrt(Math.max(.0001,radiusAt(yy)**2-xx*xx))-.001;
          const delta=z-(p.getZ(mid+stride)+.009*.30);
          for(let side=0;side<2;side++)for(let col=0;col<9;col++){
            const i=side*stride+row*9+col;p.setZ(i,p.getZ(i)+delta);
          }
        }
        g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.castOnUrnBody=true;
      }
    };
    for(let k=0;k<8;k++)b.withTransform(0,0,0,1,()=>{
      for(const side of [-1,1]){
        relief('floor-urn-bowl-cartouche:'+side,[[0,.615],[side*.075,.653],[side*.116,.735],[side*.109,.817],[side*.061,.865],[0,.885]],.023);
        relief('floor-urn-bowl-inner-curl:'+side,[[side*.090,.695],[side*.045,.724],[side*.036,.775],[side*.070,.793],[side*.086,.766]],.015);
        relief('floor-urn-foot-scroll:'+side,[[side*.035,.145],[side*.084,.205],[side*.073,.284],[side*.034,.327],[side*.039,.396],[side*.069,.438],[side*.035,.468]],.023);
      }
      for(const yy of [.735,.79]){
        const rr=radiusAt(yy);b.ball(0,yy,rr+.008,.025,.034,.010,'gold');
      }
      b.ball(0,.240,radiusAt(.240)+.009,.027,.038,.011,'gold');
      b.castCurve('floor-urn-lid-rib',[[0,1.050,.437],[0,1.048,.365],[0,1.073,.265],[0,1.101,.105]],.009,'gold',18);
    },k*Math.PI/4);
  });
}

function turnedProfileRadiusAt(profile,y,radialScale=1,heightScale=1) {
  const yy=y/heightScale;
  for(let i=1;i<profile.length;i++)if(yy<=profile[i][1]&&profile[i][1]>profile[i-1][1]){
    const a=profile[i-1],c=profile[i];return radialScale*T.MathUtils.lerp(a[0],c[0],(yy-a[1])/(c[1]-a[1]));
  }
  throw new RangeError('Cast relief lies outside its vessel profile.');
}

function conformCastScrollToVase(g,profile,depth,radialScale=1,heightScale=1) {
  if(g.userData.castOnVaseBody)return;
  const p=g.attributes.position,rows=p.count/18,stride=rows*9;
  for(let row=0;row<rows;row++){
    const mid=row*9+4,x=p.getX(mid),y=p.getY(mid),r=turnedProfileRadiusAt(profile,y,radialScale,heightScale);
    // Move complete sections only in depth: retain the photographed scroll's
    // plan silhouette while casting its back into the actual turned shell.
    const z=Math.sqrt(Math.max(.0001,r*r-x*x))-.001;
    const delta=z-(p.getZ(mid+stride)+depth*.30);
    for(let side=0;side<2;side++)for(let col=0;col<9;col++){
      const i=side*stride+row*9+col;p.setZ(i,p.getZ(i)+delta);
    }
  }
  g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.castOnVaseBody=true;
}

function buildUpperOfferingVase(b,x,y,z,side) {
  b.withTransform(x,y,z,1,()=>{
    // Original upper vases are small bulb-footed, long-necked vessels below
    // the attendant knees, not tall empty versions of the floor vessels.
    b.withTransform(0,0,0,[.98,1,.98],()=>{
    const profile=[[0,0],[.11,0],[.125,.023],[.115,.045],[.105,.065],[.10,.090],[.185,.125],[.225,.19],[.212,.24],[.155,.28],[.080,.31],[.066,.35],[.065,.47],[.088,.50],[.10,.52],[.089,.532],[.072,.52],[.055,.48],[.050,.35],[.070,.315],[.12,.28],[.16,.22],[.15,.16],[0,.12]];
    const r=.755,h=.79;
    b.lathe('upper-offering-vase-bulb-and-neck',profile,0,0,0,r,h,'lacquer',40);
    for(const [yy,rr]of [[.026,.123],[.067,.104],[.307,.084],[.355,.066],[.503,.091]])b.torus(0,yy*h,0,rr*r,.007,'gold',Math.PI/2);
    for(let k=0;k<6;k++)b.withTransform(0,0,0,1,()=>{
      for(const sign of [-1,1]){
        const key='upper-vase-bulb-cartouche:'+sign;
        b.carvedCurve(key,[[0,.105,.136],[sign*.042,.128,.160],[sign*.049,.171,.165],[sign*.032,.199,.154],[0,.213,.128]],.014,.006,'gold',20);
        conformCastScrollToVase(b.cache.get(key),profile,.006,r,h);
      }
      b.ball(0,.155,turnedProfileRadiusAt(profile,.155,r,h)+.005,.016,.023,.007,'gold');
      b.box(0,.320,.052,.010,.112,.007,'oldgold');
    },k*Math.PI/3);
    });
    const leaf=offeringNaturalLeaf(b);
    const firstStem=new T.CatmullRomCurve3([[0,.394,0],[-.11*side*.32,.49,-.015*.35],[-.11*side*.79,.60,-.015*.8],[-.11*side,.68,-.015]].map(p=>new T.Vector3(...p)));
    const neck=firstStem.getPointAt(1/20),bouquetRoot=new T.Vector3(0,.0938,0).lerp(neck,(.394-.0938)/(neck.y-.0938));
    for(let k=0;k<13;k++){
      const a=k/13*Math.PI*2+.21,lean=.9-.65*Math.max(0,-Math.cos(a));
      const width=Math.sin(a)*side<0?.040:.055,length=.285+(k%4)*.025;
      const root=bouquetRoot.clone().sub(new T.Vector3(0,.417+(k%3)*.009,0)).applyAxisAngle(new T.Vector3(0,1,0),-a);
      b.withTransform(0,.417+(k%3)*.009,0,1,()=>addRootedNaturalLeaf(b,leaf,'upper-natural-rooted-leaf:'+side+':'+k,[0,0,.010,width,length,.21,lean,0,0],root.toArray()),a);
    }
    // Only a few high fine stems are visible above the dark leaf spray.
    const twigs=[[-.11,.68,-.015],[.12,.75,-.025],[.20,.64,.035],[-.07,.83,-.035]];
    twigs.forEach(([dx,yy,dz],i)=>{
      const xx=dx*side,stemPoints=[[0,.394,0],[xx*.32,.49,dz*.35],[xx*.79,yy-.08,dz*.8],[xx,yy,dz]];
      b.naturalCurve('upper-vase-fine-stem:'+side+':'+i,[[0,.394,0],[xx*.32,.49,dz*.35],[xx*.79,yy-.08,dz*.8],[xx,yy,dz]],.0038,'flowerStem',20,.0938);
      for(let k=0;k<3;k++){
        const jx=xx-side*.035+k*.021,jy=yy-.065+k*.026;
        b.naturalCurve('upper-vase-bud-stem:'+side+':'+i+':'+k,[[xx*.87,jy-.03,dz],[jx,jy,dz+.012]],.0025,'flowerStem',8,pointOnNaturalStemAtY(stemPoints,jy-.06).toArray());
        b.ball(jx,jy+.008,dz+.012,.007,.014,.007,'ivory');
      }
    });
  });
}

function buildFloorOfferingVase(b,x,y,z) {
  b.withTransform(x,y,z,1,()=>{
    // The adjacent flower vase has an upper bulb and long tapering lower
    // stem, with three scrolled feet. Keep its silhouette unlike the censer.
    const profile=[[0,.074],[.120,.074],[.147,.110],[.154,.155],[.120,.205],[.083,.258],[.070,.345],[.064,.445],[.066,.555],[.091,.610],[.151,.650],[.184,.708],[.188,.758],[.165,.811],[.112,.849],[.079,.884],[.073,.958],[.095,.985],[.099,1.005],[.083,1.014],[.069,1.003],[.061,.958],[.064,.904],[.060,.877],[0,.865]];
    b.lathe('floor-flower-vase-long-stem',profile,0,0,0,1,1,'lacquer',48);
    for(const [yy,r] of [[.113,.150],[.200,.124],[.610,.093],[.849,.113],[.983,.095]])b.torus(0,yy,0,r,.009,'gold',Math.PI/2);
    for(let k=0;k<3;k++)b.withTransform(0,0,0,1,()=>{
      b.carvedCurve('floor-vase-scrolled-foot',[[0,.151,.107],[0,.139,.175],[0,.099,.209],[0,.048,.194],[0,.015,.211]],.066,.025,'lacquer',24);
      b.castCurve('floor-vase-foot-inlay',[[0,.147,.133],[0,.130,.188],[0,.091,.219],[0,.046,.207],[0,.016,.222]],.008,'gold',22);
      b.lathe('floor-vase-flat-foot',[[0,0],[.046,0],[.049,.015],[.033,.033],[0,.033]],0,0,.210,1,1,'lacquer',20);
    },k*Math.PI*2/3);
    for(let k=0;k<6;k++)b.withTransform(0,0,0,1,()=>{
      for(const side of [-1,1]){
        b.carvedCurve('floor-vase-long-gilt-stem:'+side,[[side*.025,.218,.111],[side*.025,.286,.080],[side*.020,.403,.066],[side*.017,.522,.067],[side*.030,.589,.086]],.014,.008,'gold',24);
        b.carvedCurve('floor-vase-bulb-medallion:'+side,[[0,.654,.157],[side*.052,.679,.168],[side*.060,.727,.184],[side*.042,.778,.182],[0,.809,.167]],.017,.008,'gold',24);
        for(const key of ['floor-vase-long-gilt-stem:'+side,'floor-vase-bulb-medallion:'+side])conformCastScrollToVase(b.cache.get(key),profile,.008);
      }
      b.ball(0,.735,turnedProfileRadiusAt(profile,.735)+.007,.021,.029,.009,'gold');
      b.leaf(0,.126,.150,.070,.068,0,'gold',.20);
    },k*Math.PI/3);
  });
}
function buildFloorFloralOffering(b,x,y,z,side) {
  // Trace only the two visible floor offerings: a compact low leafy bouquet
  // and an airy, inward-leaning bare branch with pale buds above it.
  // Their high negative spaces are deliberate; no random foliage fills them.
  const leaf=offeringNaturalLeaf(b),petal=offeringNaturalPetal(b);
  const mirror=side<0?-1:1;
  b.withTransform(x,y,z,1,()=>{
    for(let k=0;k<11;k++){
      const a=k/11*Math.PI*2+.23,yy=1.042+(k%3)*.018;
      const petiole=[[0,.982,0],[Math.sin(a)*.005,1.018,.015],[Math.sin(a)*.012,yy,.035+Math.cos(a)*.012]];
      b.naturalCurve('floor-natural-leaf-petiole:'+k,petiole,.004,'flowerStem',12,.864);
      const root=new T.CatmullRomCurve3(petiole.map(p=>new T.Vector3(...p))).getPointAt(.94).sub(new T.Vector3(0,yy,.035)).applyAxisAngle(new T.Vector3(0,1,0),-a);
      b.withTransform(0,yy,.035,1,()=>addRootedNaturalLeaf(b,leaf,'floor-natural-rooted-leaf:'+k,[0,0,.012,.085,.33+(k%3)*.035,.38,1.00,0,0],root.toArray()),a);
    }
    const stems=[[-.25,1.35,.13,.88],[-.10,1.49,.04,.95],[.08,1.37,.14,1.04],[.21,1.46,.04,.82],[.33,1.30,.12,.91],[-.34,1.26,.13,.82],[.02,1.61,.02,.75],[-.22,1.55,.02,.68],[.22,1.64,-.01,.68]];
    stems.forEach(([dx,dy,dz,size],i)=>{
      const xx=dx*mirror,yy=dy*(side<0?1.025:1);
      b.naturalCurve('floor-natural-flower-stem:'+side+':'+i,[[0,.982,0],[xx*.30,1.09,dz*.25],[xx*.76,yy-.09,dz*.78],[xx,yy,dz]],.006,'flowerStem',20,.864);
      for(let k=0;k<5;k++)b.add(petal,'ivory',xx,yy,dz,size,size*1.15,size,.30,k*Math.PI*2/5+i*.47,0);
      b.ball(xx,yy+.025,dz,.017,.018,.017,'oldgold');
      if(i<6){
        const base=new T.Vector3(xx*.52,1.12+(yy-1.25)*.40,dz*.45),angle=Math.atan2(xx,dz);
        const root=pointOnNaturalStemAtY([[0,.982,0],[xx*.30,1.09,dz*.25],[xx*.76,yy-.09,dz*.78],[xx,yy,dz]],base.y-.015).sub(base).applyAxisAngle(new T.Vector3(0,1,0),-angle);
        b.withTransform(base.x,base.y,base.z,1,()=>addRootedNaturalLeaf(b,leaf,'floor-natural-stalk-leaf:'+side+':'+i,[0,0,0,.060,.20,.20,.64,0,.65*mirror],root.toArray()),angle);
      }
    });
    const trunk=[[0,.982,-.025],[-.035,1.22,-.04],[-.16,1.49,-.035],[-.32,1.75,-.03],[-.30,2.03,-.01],[-.37,2.22,.01]];
    const q=points=>points.map(([xx,yy,zz])=>[xx*mirror,yy*(side<0?1.025:1),zz]);
    b.naturalCurve('floor-natural-bare-trunk:'+side,q(trunk),.010,'flowerStem',40,.864);
    const branches=[
      [trunk[1],[-.19,1.38,.02],[-.40,1.48,.03]],
      [trunk[2],[-.43,1.60,-.01],[-.66,1.70,.01]],
      [trunk[2],[.02,1.66,-.01],[.19,1.80,.015]],
      [trunk[3],[-.55,1.87,.02],[-.70,2.04,.025]],
      [trunk[3],[-.12,1.91,.02],[.02,2.04,.035]],
      [trunk[4],[-.47,2.14,.01],[-.58,2.23,.02]],
      [trunk[4],[-.12,2.13,.02],[-.035,2.22,.015]],
      [trunk[5],[-.32,2.29,.02],[-.27,2.34,.025]],
    ];
    branches.forEach((points,i)=>{
      const curve=new T.CatmullRomCurve3(q(points).map(p=>new T.Vector3(...p)));
      b.naturalCurve('floor-natural-bare-branch:'+side+':'+i,q(points),.0048,'flowerStem',22);
      for(let k=0;k<4;k++){
        const t=.35+k*.20,p=curve.getPoint(t),sign=k%2?1:-1;
        const tip=[p.x+sign*.046*mirror,p.y+.063-(i%2)*.016,p.z+.018];
        b.naturalCurve('floor-natural-short-twig:'+side+':'+i+':'+k,[[p.x,p.y,p.z],[(p.x+tip[0])*.5,p.y+.025,p.z+.012],tip],.0028,'flowerStem',10);
        b.ball(tip[0],tip[1]+.007,tip[2],.009,.019,.009,'ivory');
        b.ball(tip[0]-sign*.010*mirror,tip[1]-.016,tip[2],.007,.013,.007,'ivory');
      }
    });
  });
}

function buildCandlestick(b,x,y,z,h,frontAttendant=false,supportY=y) {
  // Keep the already reference-aligned white wax and flame unchanged. Only
  // lengthen the metal shaft down to the physically supporting front tread.
  const extra=y-supportY;
  const profile=[[0,0],[.16,0],[.17,.045],[.11,.08],[.07,.17],[.045,.26],[.045,.64],[.085,.69],[.08,.73],[.14,.76],[.13,.79],[0,.79]]
    .map(([r,yy])=>[r,yy*h+extra*T.MathUtils.clamp((yy-.26)/.38,0,1)]);
  b.lathe('candlestick-profile:'+h+':'+extra,profile,x,supportY,z,h,1,'gold',20);
  b.cylinder(x,y+h*(frontAttendant?1.00:.94),z,frontAttendant?.032:.028*h,(frontAttendant?.47:.32)*h,'ivory');
  b.ball(x,y+h*(frontAttendant?1.26:1.125),z,.012*h,.043*h,.012*h,'flame');
}
function buildLotusOffering(b,x,y,z,s,inward=1,branched=false,supportY=y) {
  const supportOffset=(supportY-y)/s;
  b.withTransform(x,y,z,s,()=>{
    const petal=b.geometry('ritual-lotus-cupped-petal',()=>{
      const p=[],uv=[],idx=[],rows=16,cols=8,stride=(rows+1)*(cols+1);
      for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const t=j/rows,u=i/cols*2-1;
        const width=.42*Math.pow(Math.sin(Math.PI*t),.65)*(.68+.32*t);
        const curl=.06+.30*Math.sin(Math.PI*.67*t)-.095*Math.pow(t,4);
        p.push(u*width,t,curl+(surface===0?.045*(1-u*u)*Math.sin(Math.PI*t):-.032));uv.push(i/cols,t);
        if(j<rows&&i<cols){const q=surface*stride+j*(cols+1)+i;
          if(surface===0)idx.push(q,q+1,q+cols+1,q+1,q+cols+2,q+cols+1);
          else idx.push(q,q+cols+1,q+1,q+1,q+cols+1,q+cols+2);
        }
      }
      closeCarvedShell(idx,rows,cols,stride);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.userData.closedCarvedShell=true;return g;
    });
    const rootedOuterPetal=b.geometry('ritual-lotus-rooted-outer-petal',()=>{
      const g=petal.clone(),p=g.attributes.position;
      // Only the lower quarter turns into the real receptacle.
      // The old outer row hung entirely outside it and was held by no root.
      // Inner open-flower petals retain their original surface. The almond
      // sepals share this rooted base, with their upper three quarters fixed.
      for(let surface=0;surface<2;surface++)for(let row=0;row<=16;row++){
        const t=row/16,root=1-T.MathUtils.smoothstep(t,0,.25);
        if(root===0)continue;
        for(let col=0;col<=8;col++){
          const i=surface*17*9+row*9+col;
          p.setY(i,p.getY(i)+.05*root);p.setZ(i,p.getZ(i)-.10*root);
        }
      }
      g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.rootedOfferingPetal=true;return g;
    });
    // These are solid cast stalks/receptacles, not hollow vessel mouths.
    // Axis caps close only their existing top rings; all profiles stay fixed.
    const blossom=(xx,yy,zz,scale)=>b.withTransform(xx,yy,zz,scale,()=>{
      b.lathe('lotus-offering-receptacle',[[0,0],[.10,.015],[.15,.08],[.13,.15],[.055,.19],[0,.19]],0,0,0,1,1,'oldgold',24);
      for(let row=0;row<2;row++){
        const n=row===0?8:7,rr=row===0?.10:.065;
        for(let k=0;k<n;k++){
          const a=k/n*Math.PI*2+row*.32;
          b.withTransform(Math.sin(a)*rr,row*.045,Math.cos(a)*rr,1,()=>b.add(row===0?rootedOuterPetal:petal,'gold',0,0,0,.40,row===0?.32:.315,.60,0,a,0));
        }
      }
      b.ball(0,.20,0,.065,.10,.065,'gold');
    });
    if(branched){
      // In the supplied photograph this existing offering is a three-part
      // stem: low open bloom, higher almond bud, and an inward-leaning crown.
      // Its foot stays fixed; do not scatter extra flowers around the altar.
      const footProfile=[[0,0],[.18,0],[.19,.015],[.16,.07],[.08,.15],[.065,.24],[0,.24]]
        .map(([r,yy])=>[r,supportOffset+yy*(.24-supportOffset)/.24]);
      b.lathe('branched-lotus-offering-foot:'+supportOffset,footProfile,0,0,0,1,1,'gold',28);
      b.castCurve('gilt-lotus-main-stem:'+inward,[[0,.16,-.035],[inward*.06,.40,-.055],[inward*.29,.73,-.035],[inward*.38,1.08,0]],.027,'gold',32);
      b.castCurve('gilt-lotus-lower-stem:'+inward,[[inward*.05,.24,-.035],[-inward*.035,.31,.025],[0,.35,.08]],.026,'gold',16);
      b.castCurve('gilt-lotus-bud-stem:'+inward,[[inward*.17,.50,-.035],[inward*.31,.54,.015],[inward*.38,.58,.035]],.022,'gold',18);
      blossom(0,.35,.08,1.08);
      blossom(inward*.38,1.08,0,1.10);
      b.lathe('gilt-lotus-almond-bud',[[0,0],[.075,.045],[.15,.17],[.17,.30],[.13,.43],[.055,.54],[0,.59]],inward*.38,.58,.035,.87,1,'gold',32);
      for(let k=0;k<6;k++){
        const a=k*Math.PI/3;
        b.withTransform(inward*.38,.61,.035,1,()=>b.withTransform(Math.sin(a)*.055,0,Math.cos(a)*.055,1,()=>b.add(rootedOuterPetal,'gold',0,0,0,.25,.38,.33,0,a,0)));
      }
      for(const [xx,yy,angle] of [[inward*.13,.39,-inward*.82],[inward*.25,.72,inward*.61]])b.flame(xx,yy,.02,.17,.33,angle,'gold',.65);
    } else {
      const footProfile=[[0,0],[.18,0],[.19,.015],[.16,.07],[.065,.17],[.04,.66],[.09,.75],[.14,.78],[0,.78]]
        .map(([r,yy])=>[r,yy+supportOffset*T.MathUtils.clamp((.66-yy)/(.66-.17),0,1)]);
      b.lathe('lotus-offering-stand:'+supportOffset,footProfile,0,0,0,1,1,'gold',20);
      blossom(0,.75,0,1);
    }
  });
}

function buildLantern(b,x,y,z,s,openFloorStand=false) {
  b.withTransform(x,y,z,s,()=>{
    // The photograph shows two rounded lacquer-and-gilt urn bodies joined by
    // a slender column, not a cone pedestal topped by a second funnel.
    if(openFloorStand){
      // The supplied floor-lamp crop has light-visible slots between bowed
      // supports, two fluted bulbs, and short separated feet. Preserve the
      // existing bulb/roof heights rather than replacing it with a solid cone.
      const lower=[[0,.085],[.30,.085],[.43,.11],[.34,.14],[.30,.17],[.40,.21],[.46,.30],[.45,.38],[.38,.44],[.26,.47],[.25,.52],[0,.52]];
      const upper=[[0,1.020],[.235,1.020],[.28,1.04],[.38,1.08],[.41,1.17],[.36,1.25],[.25,1.29],[.27,1.32],[.32,1.35],[.31,1.38],[0,1.38]];
      const bulb=(key,profile)=>b.geometry(key,()=>lobedVesselGeometry(profile.map(([r,y])=>[r/1.065,y]),6,.065,72));
      b.add(bulb('floor-lantern-lower-fluted-bulb',lower),'lacquer');
      b.add(bulb('floor-lantern-upper-fluted-bulb',upper),'lacquer');
      // The visible near feet are low rectangular blocks, not a floating
      // cone point. Four feet give a real separated bearing under the bulb.
      for(let k=0;k<4;k++)b.withTransform(0,0,0,1,()=>{
        b.box(0,.045,.352,.165,.090,.150,'lacquer');
        b.box(0,.080,.352,.173,.012,.158,'oldgold');
      },Math.PI/4+k*Math.PI/2);
      b.torus(0,.101,0,.366,.014,'gold',Math.PI/2);
    }else{
      // The small rear lamp uses a flat hidden bearing, not a conical point.
      // Keep every upper profile point and the open floor lamp's feet unchanged.
      b.lathe('lantern-foot-stem',[[0,0],[.38,0],[.40,.01],[.44,.055],[.43,.11],[.34,.14],[.30,.17],[.40,.21],[.46,.30],[.45,.38],[.38,.44],[.26,.47],[.25,.52],[.22,.57],[.20,.69],[.16,.87],[.21,1.01],[.28,1.04],[.38,1.08],[.41,1.17],[.36,1.25],[.25,1.29],[.27,1.32],[.32,1.35],[.31,1.38]],0,0,0,1,1,'lacquer',48);
    }
    for(const [yy,r] of [[.055,.44],[.145,.335],[.475,.26],[.525,.25],[1.025,.24],[1.295,.255],[1.355,.32]]){
      if(openFloorStand&&yy===.055)continue;
      b.torus(0,yy,0,r,.017,'gold',Math.PI/2);
    }
    // The six frame feet bear on a shallow closed tray above the turned
    // bulb. Without it only a decorative torus bridged the open corner gaps.
    const lowerTray=b.geometry('lantern-closed-lower-tray',()=>new T.LatheGeometry([[0,1.335],[.31,1.335],[.34,1.345],[.425,1.365],[.430,1.385],[.425,1.398],[0,1.398]].map(p=>new T.Vector2(...p)),6).rotateY(Math.PI/6));
    b.add(lowerTray,'lacquer');
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      b.withTransform(0,0,0,1,()=>{
        if(openFloorStand){
          const column=[[0,.495,.218],[0,.62,.184],[0,.81,.147],[0,.94,.156],[0,1.052,.246]];
          b.carvedCurve('floor-lantern-bowed-open-column',column,.082,.036,'lacquer',32);
          b.carvedCurve('floor-lantern-column-fine-inlay',column.map(([xx,yy,zz])=>[xx,yy,zz+.037]),.012,.004,'gold',32);
        }else b.carvedCurve('lantern-column-rib',[[0,.515,.258],[0,.62,.218],[0,.81,.181],[0,.94,.190],[0,1.03,.242]],.025,.014,'gold',20);
        // Small raised floral medallions follow the two actual bulb surfaces.
        for(const [yy,zz,scale] of [[.29,.454,1],[1.15,.405,.84]]){
          b.withTransform(0,yy,zz,scale,()=>{
            for(let petal=0;petal<4;petal++){
              const angle=petal*Math.PI/2;
              b.leaf(Math.sin(angle)*.012,Math.cos(angle)*.012,.005,.076,.105,-angle,'gold',.30);
            }
            b.ball(0,0,.019,.024,.025,.012,'gold');
            // The fluted floor bulbs recede behind their applied cartouches.
            // Recess those existing castings into the real lobe, not a round proxy.
            b.withTransform(0,0,openFloorStand?-.022:0,1,()=>{
              for(const side of [-1,1])b.curve('lantern-bulb-cartouche:'+side,[[side*.04,-.045,-.004],[side*.10,-.025,-.006],[side*.12,.025,-.012],[side*.085,.055,-.005]],.008,'gold',12);
            });
          });
        }
        // Paper enters the frame rebates at both ends; the old height left
        // two thin open gaps between its edges and the horizontal rails.
        b.box(0,1.680,.340,.370,.570,.016,'paper');
        // Regular hexagon: half panel width = apothem*tan(pi/6),
        // avoiding the old mutually intersecting over-wide paper panels.
        for(const xx of [-.1963,.1963])b.box(xx,1.680,.351,.028,.601,.028,'gold');
        for(const yy of [1.3794,1.98])b.box(0,yy,.351,.425,.045,.045,'lacquer');
        // Diamond lattice cut into the six real panels, not vertical prison bars.
        const lattice=b.geometry('lantern-diamond-grid',()=>{
          // Two continuous diagonal batten families cross the real frame.
          // Separate rounded diamond loops left their upper tips floating.
          const parts=[],slope=.8162,spacing=.08855,c0=1.441;
          const xmin=-.1853,xmax=.1853,ymin=1.3989,ymax=1.9605;
          for(const sign of [-1,1]){
            const m=sign*slope,lo=ymin-Math.abs(m)*xmax,hi=ymax+Math.abs(m)*xmax;
            for(let row=Math.ceil((lo-c0)/spacing);row<=Math.floor((hi-c0)/spacing);row++){
              const c=c0+row*spacing,points=[];
              for(const xx of [xmin,xmax]){const yy=m*xx+c;if(yy>=ymin-1e-8&&yy<=ymax+1e-8)points.push([xx,yy]);}
              for(const yy of [ymin,ymax]){const xx=(yy-c)/m;if(xx>=xmin-1e-8&&xx<=xmax+1e-8)points.push([xx,yy]);}
              if(points.length<2)continue;
              const [a,z]=points,dx=z[0]-a[0],dy=z[1]-a[1],length=Math.hypot(dx,dy);
              if(length<1e-7)continue;
              parts.push(new T.BoxGeometry(.012,length,.012).rotateZ(Math.atan2(-dx,dy)).translate((a[0]+z[0])/2,(a[1]+z[1])/2,.365));
            }
          }
          const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
        });
        b.add(lattice,'oldgold');
      },a);
    }
    // Closed hexagonal double-shell roof. The former center-to-eave-only
    // profile gave downward-facing upper slopes and almost vanished in017.
    const roof=b.geometry('lantern-canopy',()=>new T.LatheGeometry([[.13,2.17],[.35,2.015],[.50,1.97],[.60,2.04],[.60,2.075],[.49,2.015],[.35,2.07],[.22,2.185],[.14,2.24],[.13,2.17]].map(p=>new T.Vector2(...p)),6).rotateY(Math.PI/6));
    b.add(roof,'lacquer');
    for(let k=0;k<6;k++){
      const a=(k+.5)*Math.PI/3;
      b.curve('lantern-roof-rib:'+k,[[Math.sin(a)*.14,2.245,Math.cos(a)*.14],[Math.sin(a)*.35,2.075,Math.cos(a)*.35],[Math.sin(a)*.49,2.023,Math.cos(a)*.49],[Math.sin(a)*.60,2.08,Math.cos(a)*.60],[Math.sin(a)*.66,2.13,Math.cos(a)*.66]],.017,'gold',20);
      const a2=a+Math.PI/3;
      b.curve('lantern-eave-trim:'+k,[[Math.sin(a)*.60,2.075,Math.cos(a)*.60],[(Math.sin(a)+Math.sin(a2))*.30,2.063,(Math.cos(a)+Math.cos(a2))*.30],[Math.sin(a2)*.60,2.075,Math.cos(a2)*.60]],.012,'gold',9);
      b.ball(Math.sin(a)*.66,2.13,Math.cos(a)*.66,.021,.028,.021,'gold');
    }
    // A short turned black neck actually seats the finial in the roof opening.
    // The former gold ball hovered above the hexagonal inner lip; the neck
    // stays within the existing roof/finial silhouette and enters both pieces.
    if(openFloorStand){
      // The floor lamps in the original have a second small swept cap below
      // a narrow pear-shaped jewel. Two stacked balls omitted that profile.
      b.lathe('floor-lantern-two-tier-bearing-neck',[[0,2.156],[.118,2.156],[.132,2.169],[.142,2.229],[.122,2.245],[.075,2.276],[.065,2.301],[0,2.301]],0,0,0,1,1,'lacquer',32);
      const smallCap=b.geometry('floor-lantern-small-upper-cap',()=>new T.LatheGeometry([[.05,2.290],[.17,2.240],[.27,2.250],[.29,2.275],[.29,2.290],[.265,2.271],[.17,2.263],[.065,2.318],[.05,2.290]].map(p=>new T.Vector2(...p)),6).rotateY(Math.PI/6));
      b.add(smallCap,'lacquer');
      for(let k=0;k<6;k++){
        const a=(k+.5)*Math.PI/3,a2=a+Math.PI/3;
        b.curve('floor-lantern-upper-cap-rib:'+k,[[Math.sin(a)*.065,2.320,Math.cos(a)*.065],[Math.sin(a)*.17,2.266,Math.cos(a)*.17],[Math.sin(a)*.265,2.274,Math.cos(a)*.265],[Math.sin(a)*.29,2.292,Math.cos(a)*.29]],.008,'gold',16);
        b.curve('floor-lantern-upper-cap-edge:'+k,[[Math.sin(a)*.29,2.288,Math.cos(a)*.29],[(Math.sin(a)+Math.sin(a2))*.145,2.281,(Math.cos(a)+Math.cos(a2))*.145],[Math.sin(a2)*.29,2.288,Math.cos(a2)*.29]],.006,'gold',10);
      }
      const jewel=b.geometry('floor-lantern-pear-jewel',()=>lobedVesselGeometry([[0,2.300],[.034,2.300],[.040,2.330],[.062,2.350],[.086,2.380],[.080,2.415],[.060,2.440],[.035,2.463],[.018,2.490],[0,2.505]],6,.04,48));
      b.add(jewel,'gold');
    }else{
      b.lathe('lantern-finial-bearing-neck',[[0,2.156],[.118,2.156],[.132,2.169],[.142,2.229],[.122,2.245],[.101,2.253],[0,2.253]],0,0,0,1,1,'lacquer',32);
      b.ball(0,2.27,0,.12,.12,.12,'gold');b.ball(0,2.42,0,.052,.085,.052,'gold');
    }
  });
}

function smoothRevolvedSeamNormals(g) {
  const {rows,segments}=g.userData.revolvedProfile,p=g.attributes.position,n=g.attributes.normal;
  for(let j=0;j<rows;j++){
    const first=j*(segments+1),last=first+segments,axis=Math.hypot(p.getX(first),p.getZ(first))<1e-7;
    const ids=axis?Array.from({length:segments+1},(_,k)=>first+k):[first,last];
    const average=new T.Vector3();for(const i of ids)average.add(new T.Vector3().fromBufferAttribute(n,i));
    if(average.lengthSq()>1e-16){average.normalize();for(const i of ids)n.setXYZ(i,average.x,average.y,average.z);}
  }
  n.needsUpdate=true;return g;
}

function lobedVesselGeometry(profile,lobes=6,fluting=.075,segments=72) {
  const p=[],uv=[],indices=[];
  for(let j=0;j<profile.length;j++)for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2;
    const r=profile[j][0]*(1+fluting*Math.cos(a*lobes));
    p.push(Math.sin(a)*r,profile[j][1],Math.cos(a)*r);uv.push(i/segments,j/(profile.length-1));
    if(j<profile.length-1&&i<segments){const q=j*(segments+1)+i;indices.push(q,q+1,q+segments+1,q+1,q+segments+2,q+segments+1);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.revolvedProfile={rows:profile.length,segments};return smoothRevolvedSeamNormals(g);
}

function buildOfferingTable(b,layout) {
  const floorY=layout.floorContactY;
  b.withTransform(0,0,.62,[.84,1,1],()=>{
  const z=2.53;
  // Narrow gilded altar table with open negative space under the apron.
  b.box(0,.65,z,4.02,.080,.96,'lacquer');
  b.box(0,.698,z,4.13,.020,1.02,'gold');
  b.box(0,.595,z+.45,3.96,.14,.075,'lacquer');
  // The foreground rail is largely black between separate chased metal
  // fittings. It is not another full-length, compressed dragon cabinet panel.
  b.box(0,.531,z+.4945,3.91,.010,.016,'oldgold');
  // Applied gilt fittings must enter their real lacquer rail or scalloped
  // plate; retain every X/Y outline and recess only the detached depth.
  const apronPlate=b.geometry('table-scalloped-apron-plate',()=>{
    const s=new T.Shape();s.moveTo(-.5,.5);s.lineTo(.5,.5);s.lineTo(.5,-.12);
    s.bezierCurveTo(.50,-.40,.32,-.43,.24,-.36);
    s.bezierCurveTo(.10,-.58,-.10,-.58,-.24,-.36);
    s.bezierCurveTo(-.32,-.43,-.50,-.40,-.50,-.12);s.closePath();
    return new T.ExtrudeGeometry(s,{depth:.035,bevelEnabled:true,bevelThickness:.008,bevelSize:.014,bevelSegments:2,curveSegments:8});
  });
  for(const side of [-1,1]){
    for(const [xx,width,height] of [[1.88,.27,.14],[1.075,.45,.19]]){
      const x=side*xx;
      b.add(apronPlate,'gold',x,.596,z+.491,width,height,.65);
      b.box(x,.615,z+.522,width*.77,.055,.010,'oldgold');
      for(const sign of [-1,1])b.carvedCurve('table-cap-curl:'+xx+':'+side+':'+sign,
        [[x+sign*width*.04,.555,z+.508],[x+sign*width*.27,.563,z+.512],[x+sign*width*.31,.596,z+.512],[x+sign*width*.20,.611,z+.512],[x+sign*width*.13,.592,z+.516]],.019,.010,'gold',16);
      b.ball(x,.562,z+.525,.018,.021,.009,'gold');
    }
    for(const center of [.65,1.47]){
      const points=[[side*(center-.19),.588,z+.483],[side*(center-.06),.605,z+.485],[side*(center+.08),.585,z+.487],[side*(center+.19),.613,z+.484]];
      b.carvedCurve('table-rail-frond:'+side+':'+center,points,.024,.012,'gold',20);
      for(let k=0;k<3;k++)for(const sign of [-1,1])b.flame(side*(center-.10+k*.09),.594,z+.481,.10,.075,sign*(.72+k*.15),'gold',.15);
    }
  }
  for(const side of [-1,1])b.carvedCurve('table-rail-center-scroll:'+side,
    [[0,.591,z+.485],[side*.075,.573,z+.485],[side*.16,.594,z+.488],[side*.13,.622,z+.487],[side*.084,.615,z+.491]],.025,.012,'gold',20);
  for(const side of [-1,1])for(const dz of [-.34,.34]) {
    const x=side*1.73;
    b.lathe('offering-table-turned-leg',[[0,0],[.10,.015],[.09,.06],[.06,.11],[.072,.18],[.08,.23],[.063,.31],[.072,.40],[.08,.44],[.09,.49],[0,.51]],x,.09,z+dz,1,1.12,'red',24);
    b.box(x,(floorY+.10)/2,z+dz,.25,.10-floorY,.25,'gold');
    b.box(x,.11,z+dz,.18,.025,.18,'lacquer');
    for(const [yy,rr] of [[.17,.084],[.32,.098],[.53,.092]])b.torus(x,.09+(yy-.09)*1.12,z+dz,rr,.018,'gold',Math.PI/2);
    // Open gilt ferrules reveal the red shaft between their bowed ribs;
    // solid spherical gold beads erase the reference's slender post.
    for(const yy of [.405,.514])b.torus(x,yy,z+dz,.086,.012,'gold',Math.PI/2);
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3,ps=[[.086,.405],[.118,.435],[.121,.470],[.086,.514]].map(([r,y])=>[x+Math.sin(a)*r,y,z+dz+Math.cos(a)*r]);
      const key='table-leg-ferrule:'+side+':'+dz+':'+k;
      b.curve(key,ps,.013,'gold',16);
      // The bowed cage must bear on the red shaft, not float around it.
      // Recess only its two end quarters; retain the exact broad middle
      // silhouette, all Y coordinates, rings and original instance matrices.
      const ferrule=b.cache.get(key),position=ferrule.attributes.position;
      for(let row=0;row<=16;row++){
        const inset=.022*Math.max(0,1-Math.min(row,16-row)/4);
        if(!inset)continue;
        for(let col=0;col<=5;col++){
          const i=row*6+col;
          position.setXYZ(i,position.getX(i)-Math.sin(a)*inset,position.getY(i),position.getZ(i)-Math.cos(a)*inset);
        }
      }
      position.needsUpdate=true;ferrule.computeVertexNormals();
      ferrule.userData.tableFerruleRooted=true;
    }
  }
  // Two separately carved inner supports are plainly visible beside the
  // cushion in the original. They are not identical outer/back table legs.
  for(const side of [-1,1]){
    const x=side*1.075,zz=z+.34;
    b.lathe('table-inner-carved-support',[[0,0],[.13,.008],[.135,.042],[.10,.070],[.078,.115],[.10,.205],[.077,.295],[.070,.375],[.110,.432],[.095,.480],[0,.490]],x,.085,zz,1,1,'lacquer',28);
    b.lathe('table-inner-red-core',[[0,0],[.061,.012],[.070,.045],[.073,.160],[.057,.290],[.065,.325],[0,.337]],x,.18,zz+.035,1,1,'red',24);
    b.box(x,(floorY+.1195)/2,zz,.25,.1195-floorY,.25,'gold');
    b.box(x,.072,zz+.133,.18,.062,.018,'oldgold');
    for(const yy of [.15,.30,.52])b.torus(x,yy,zz,yy===.30?.102:.091,.012,'gold',Math.PI/2);
    for(const sign of [-1,1]){
      b.carvedCurve('table-inner-carved-scroll:'+side+':'+sign,
        [[x+sign*.040,.155,zz+.072],[x+sign*.101,.205,zz+.083],[x+sign*.097,.280,zz+.079],[x+sign*.050,.319,zz+.092],[x+sign*.060,.390,zz+.071],[x+sign*.094,.453,zz+.064],[x+sign*.047,.482,zz+.071]],.030,.015,'gold',32);
      b.carvedCurve('table-inner-counter-scroll:'+side+':'+sign,
        [[x+sign*.093,.280,zz+.077],[x+sign*.153,.314,zz+.064],[x+sign*.147,.367,zz+.058],[x+sign*.100,.379,zz+.069],[x+sign*.089,.352,zz+.077]],.023,.012,'oldgold',22);
    }
    b.ball(x,.231,zz+.104,.032,.048,.015,'gold');
    b.ball(x,.443,zz+.086,.025,.031,.013,'gold');
  }
  // Small central censer and its narrow pedestal; not an oversized sphere.
  // The solid stem must end in a bearing cap, not an open hollow ring below
  // the bowl. Keep every existing exterior profile point and bowl position.
  b.lathe('censer-pedestal',[[0,-.002/1.495],[.23,-.002/1.495],[.25,.012],[.26,.045],[.18,.080],[.16,.12],[.28,.17],[.30,.23],[.25,.28],[.13,.31],[.18,.345],[.20,.35],[0,.35]],0,.71,z,1,1.495,'lacquer');
  for(const [yy,rr] of [[.78,.24],[1.12,.22],[1.18,.19]])b.torus(0,yy,z,rr,.013,'gold',Math.PI/2);
  // The reference censer is a low six-lobed metal body with a dark chased
  // frontal cartouche, not an open flowerpot on a conical stand.
  const bowl=b.geometry('six-lobed-censer',()=>lobedVesselGeometry([[0,0],[.13,.015],[.25,.06],[.32,.15],[.33,.23],[.29,.31],[.23,.35],[.24,.38],[.20,.38],[.20,.35],[.24,.30],[.27,.22],[.25,.14],[.17,.09],[0,.09]],6,.075));
  b.add(bowl,'gold',0,1.23,z,.95,.95,.95);
  b.torus(0,1.591,z,.228,.014,'oldgold',Math.PI/2);
  {
    // The original front ornament is a pointed, spreading gilt silhouette
    // within two dark curled borders, not an equal eight-petal flower and
    // circular badge. Do not invent a figure, lettering or symbolic identity.
    const probeMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),probe=new T.Mesh(bowl,probeMaterial),ray=new T.Raycaster(),frontCache=new Map();
    probe.updateMatrixWorld(true);
    const frontAt=(x,y)=>{
      const key=x.toFixed(8)+':'+y.toFixed(8);
      if(!frontCache.has(key)){
        ray.set(new T.Vector3(x/.95,(y-1.23)/.95,2),new T.Vector3(0,0,-1));
        const hit=ray.intersectObject(probe,false)[0];
        if(!hit)throw new RangeError('Central cartouche extends beyond its real bowl.');
        frontCache.set(key,hit.point.z*.95);
      }
      return frontCache.get(key);
    };
    const castShape=(key,shape,material,depth)=>{
      const g=b.geometry(key,()=>{
        const flat=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.0015,bevelThickness:.001,bevelSegments:2,curveSegments:9});
        // Earcut's wide cap triangles must be refined before bending onto a
        // faceted bowl, otherwise their interiors cut through the metal even
        // when all original outline vertices have the right depth.
        const positions=[],uvs=[],fp=flat.attributes.position,fu=flat.attributes.uv;
        const bends=[.015,.06,.15,.23,.31,.35,.38].map(y=>1.23+.95*y-1.426);
        const emit=(a,c,d)=>{
          const vs=[a,c,d],low=Math.min(...vs.map(v=>v[1])),high=Math.max(...vs.map(v=>v[1]));
          const bend=bends.find(y=>low<y-1e-9&&high>y+1e-9);
          if(bend!==undefined){
            // Align the relief triangulation with the bowl's real turned
            // profile bends rather than bridge over its narrow rim groove.
            for(const sign of [-1,1]){
              const clipped=[];
              for(let i=0;i<3;i++){
                const v=vs[i],w=vs[(i+1)%3],iv=sign*(v[1]-bend)>=0,iw=sign*(w[1]-bend)>=0;
                if(iv)clipped.push(v);
                if(iv!==iw){const t=(bend-v[1])/(w[1]-v[1]),p=v.map((q,j)=>q+(w[j]-q)*t);p[1]=bend;clipped.push(p);}
              }
              for(let i=1;i<clipped.length-1;i++)emit(clipped[0],clipped[i],clipped[i+1]);
            }
            return;
          }
          const lengths=vs.map((v,i)=>(v[0]-vs[(i+1)%3][0])**2+(v[1]-vs[(i+1)%3][1])**2),edge=lengths.indexOf(Math.max(...lengths));
          if(lengths[edge]>.010**2){
            const v=vs[edge],w=vs[(edge+1)%3],other=vs[(edge+2)%3],mid=v.map((q,i)=>(q+w[i])*.5);
            emit(v,mid,other);emit(mid,w,other);return;
          }
          for(const v of vs){positions.push(v[0],v[1],v[2]);uvs.push(v[3],v[4]);}
        };
        for(let i=0;i<fp.count;i+=3)emit(...[0,1,2].map(k=>[fp.getX(i+k),fp.getY(i+k),fp.getZ(i+k),fu.getX(i+k),fu.getY(i+k)]));
        flat.dispose();
        const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
        const p=g.attributes.position;
        for(let i=0;i<p.count;i++){
          const x=p.getX(i),y=1.426+p.getY(i);
          p.setXYZ(i,x,y,frontAt(x,y)+p.getZ(i)-.0015);
        }
        g.setIndex(Array.from({length:p.count},(_,i)=>i));g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.ritualBowlCastRelief=true;g.userData.mergeUniqueCarving=true;return g;
      });
      b.add(g,material,0,0,z);return g;
    };
    for(const side of [-1,1]){
      const shape=new T.Shape();shape.moveTo(side*.090,.112);
      shape.bezierCurveTo(side*.129,.105,side*.153,.066,side*.151,.016);
      shape.bezierCurveTo(side*.147,-.048,side*.119,-.101,side*.073,-.123);
      shape.bezierCurveTo(side*.052,-.135,side*.031,-.137,side*.025,-.121);
      shape.bezierCurveTo(side*.037,-.106,side*.066,-.104,side*.084,-.082);
      shape.bezierCurveTo(side*.111,-.051,side*.121,-.007,side*.116,.033);
      shape.bezierCurveTo(side*.113,.068,side*.101,.083,side*.084,.092);shape.closePath();
      castShape('central-ritual-dark-scroll-frame:'+side,shape,'lacquer',.007);
      const xy=[[side*.092,.104],[side*.133,.067],[side*.137,.009],[side*.114,-.067],[side*.075,-.108],[side*.037,-.122]];
      const points=xy.map(([x,y])=>[x,1.426+y,z+frontAt(x,1.426+y)+.005]);
      const key='central-ritual-frame-gilt-ridge:'+side;
      b.curve(key,points,.0035,'gold',36);
      const ridge=b.cache.get(key),rp=ridge.attributes.position,curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
      for(let row=0;row<=36;row++){
        const c=curve.getPointAt(row/36),delta=z+frontAt(c.x,c.y)+.005-c.z;
        for(let col=0;col<6;col++){const i=row*6+col;rp.setZ(i,rp.getZ(i)+delta);}
      }
      ridge.computeVertexNormals();smoothCoincidentShellNormals(ridge);
    }
    const crest=new T.Shape();crest.moveTo(0,-.070);
    crest.bezierCurveTo(-.041,-.087,-.098,-.056,-.102,-.018);
    crest.bezierCurveTo(-.110,.020,-.084,.042,-.055,.018);
    crest.bezierCurveTo(-.052,.052,-.028,.060,-.020,.040);
    crest.lineTo(-.015,.112);crest.lineTo(0,.147);crest.lineTo(.014,.112);crest.lineTo(.020,.043);
    crest.bezierCurveTo(.032,.060,.052,.052,.055,.022);
    crest.bezierCurveTo(.083,.041,.105,.019,.099,-.017);
    crest.bezierCurveTo(.098,-.056,.040,-.082,0,-.070);crest.closePath();
    castShape('central-ritual-raised-crest',crest,'gold',.009);
    probeMaterial.dispose();
  }
  for(const side of [-1,1]){
    b.curve('censer-small-handle:'+side,[[side*.25,1.38,z],[side*.39,1.43,z],[side*.42,1.55,z],[side*.36,1.63,z],[side*.28,1.61,z],[side*.28,1.54,z]],.022,'gold',24);
    b.ball(side*.28,1.54,z,.034,.026,.030,'oldgold');
  }
  // The supplied photograph resolves a straight transparent cylindrical
  // chimney with a visible oval mouth and metal burner neck. The former
  // three long incense sticks and ash bed were a mistaken interpretation.
  // Keep glass, the opaque neck and the single visible wick separate.
  const glassR=.125,glassBottom=1.575,glassTop=layout.ritualChimneyTopY;
  if(!(Number.isFinite(glassTop)&&glassTop>1.605))throw new RangeError('Invalid ritual chimney wall.');
  const radialZ=.84*1.35/1.28;
  const collar=b.geometry('central-ritual-burner-collar',()=>{
    const profile=[[0,1.548],[.213,1.548],[.225,1.564],[.191,1.587],[.145,1.603],[.126,1.604],[.118,1.583],[.115,1.571],[.048,1.571],[.045,1.636],[.032,1.652],[0,1.652]];
    const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),48),p=g.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)*T.MathUtils.lerp(1,radialZ,T.MathUtils.smoothstep(p.getY(i),1.564,1.571)));
    g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.ritualBurnerCollar=true;return g;
  });
  b.add(collar,'gold',0,0,z);
  const glass=b.geometry('central-clear-chimney:'+glassR+':'+glassBottom+':'+glassTop,()=>{
    const wall=.0025,bevel=.0005;
    const profile=[[glassR,glassBottom],[glassR,glassTop-bevel],[glassR-bevel,glassTop],[glassR-wall+bevel,glassTop],[glassR-wall,glassTop-bevel],[glassR-wall,glassBottom],[glassR,glassBottom]];
    const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64);
    g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.ritualGlassWall=true;return g;
  });
  b.add(glass,'ritualGlass',0,0,z,1,1,radialZ);
  b.cylinder(0,(1.647+1.704)/2,z,.006,1.704-1.647,'lacquer');
  b.ball(0,1.735,z,.010,.038,.010,'flame');
  // Low brocade kneeling cushion and carved base in front, as in the photograph.
  // The original cushion sits inside a visibly wider black timber frame.
  // Keep its cloth/contact plane fixed; only the surrounding base changes.
  // Two hidden rear-edge rebates clear the existing inner table feet rather
  // than moving either the table or the cushion to conceal an intersection.
  const base=b.geometry('kneeling-base-rebated-timber:'+floorY,()=>{
    const sh=new T.Shape();sh.moveTo(-1.35,3.81);sh.lineTo(1.35,3.81);sh.lineTo(1.35,2.75);
    sh.lineTo(1.24,2.75);sh.lineTo(1.24,3.015);sh.lineTo(.91,3.015);sh.lineTo(.91,2.75);
    sh.lineTo(-.91,2.75);sh.lineTo(-.91,3.015);sh.lineTo(-1.24,3.015);sh.lineTo(-1.24,2.75);sh.lineTo(-1.35,2.75);sh.closePath();
    const g=new T.ExtrudeGeometry(sh,{depth:.097-floorY,bevelEnabled:false,steps:1,curveSegments:1});
    g.rotateX(Math.PI/2);g.translate(0,.097,0);g.userData.kneelingTimberBase=true;return g;
  });
  b.add(base,'lacquer');
  // A fine front molding, not a full gold plate beneath the textile.
  b.box(0,.088,3.811,2.70,.012,.012,'oldgold');
  // The original kneeling cushion bears broadly on its timber base. Keep
  // the top and sides fixed, flattening only the hidden lower soft filling.
  const contactY=(.097-.27)/.18;
  const flattenY=v=>v<-.4?T.MathUtils.lerp(v,contactY,T.MathUtils.smoothstep(-v,.40,.75)):v;
  const unflattenY=v=>{
    if(v>=-.4)return v;if(v<=contactY)return -.75;
    let lo=-.75,hi=-.4;for(let k=0;k<26;k++){const mid=(lo+hi)/2;if(flattenY(mid)<v)lo=mid;else hi=mid;}return(lo+hi)/2;
  };
  const cushion=b.geometry('rounded-brocade-bolster',()=>{
    const g=new T.SphereGeometry(1,48,24),p=g.attributes.position;
    const power=(v,n)=>Math.sign(v)*Math.pow(Math.abs(v),n);
    for(let i=0;i<p.count;i++)p.setXYZ(i,power(p.getX(i),.60),flattenY(power(p.getY(i),.80)),power(p.getZ(i),.60));
    g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.cushionContactY=.097;return g;
  });
  b.add(cushion,'textile',0,.27,3.28,1.02,.18,.47);
  // Small floral brocade lies on the cloth surface, not floating dragon
  // reliefs repeated from the wooden altar panels.
  const brocade=b.geometry('cushion-floral-brocade',()=>{
    const parts=[];
    // Woven marks follow the existing faceted cloth, not an ideal smooth
    // surface bridged by large flat flower triangles. Partition only the
    // existing pattern at the cushion's real triangle edges; retain its
    // planar outlines and UVs and the existing .003 thread relief.
    const clothSheets={};
    for(const plane of ['front','top']){
      const axes=plane==='front'?[0,1,2]:[0,2,1],p=cushion.attributes.position,n=cushion.attributes.normal,ix=cushion.index;
      const faces=[];
      for(let k=0;k<ix.count;k+=3){
        const ids=[ix.getX(k),ix.getX(k+1),ix.getX(k+2)];
        const v=ids.map(i=>[p.getX(i)*1.02,.27+p.getY(i)*.18,3.28+p.getZ(i)*.47]);
        const [a,c,d]=v,det=(c[axes[0]]-a[axes[0]])*(d[axes[1]]-a[axes[1]])-(c[axes[1]]-a[axes[1]])*(d[axes[0]]-a[axes[0]]);
        if((plane==='front'?det:-det)<=1e-14)continue;
        const normal=ids.map(i=>new T.Vector3(n.getX(i)/1.02,n.getY(i)/.18,n.getZ(i)/.47).normalize());
        faces.push({v,normal,det,min:axes.slice(0,2).map(q=>Math.min(...v.map(p=>p[q]))),max:axes.slice(0,2).map(q=>Math.max(...v.map(p=>p[q])))});
      }
      clothSheets[plane]={axes,faces};
    }
    const conformToCloth=(g,plane)=>{
      const {axes,faces}=clothSheets[plane],p=g.attributes.position,uv=g.attributes.uv,ix=g.index,positions=[],normals=[],uvs=[],indices=[];
      for(let k=0;k<ix.count;k+=3){
        const input=[0,1,2].map(j=>{const i=ix.getX(k+j);return[p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i)];});
        const low=axes.slice(0,2).map(q=>Math.min(...input.map(p=>p[q]))),high=axes.slice(0,2).map(q=>Math.max(...input.map(p=>p[q])));
        for(const f of faces){
          if(low.some((v,i)=>v>f.max[i])||high.some((v,i)=>v<f.min[i]))continue;
          let polygon=input;
          for(let edge=0;edge<3&&polygon.length;edge++){
            const a=f.v[edge],c=f.v[(edge+1)%3],side=q=>Math.sign(f.det)*((c[axes[0]]-a[axes[0]])*(q[axes[1]]-a[axes[1]])-(c[axes[1]]-a[axes[1]])*(q[axes[0]]-a[axes[0]])),clipped=[];
            for(let i=0;i<polygon.length;i++){
              const v=polygon[i],w=polygon[(i+1)%polygon.length],dv=side(v),dw=side(w),inside=dv>=0,next=dw>=0;
              if(inside)clipped.push(v);
              if(inside!==next){const t=dv/(dv-dw);clipped.push(v.map((q,j)=>q+(w[j]-q)*t));}
            }
            polygon=clipped;
          }
          if(polygon.length<3)continue;
          const mapped=polygon.map(q=>{
            const [a,c,d]=f.v,u=((q[axes[0]]-a[axes[0]])*(d[axes[1]]-a[axes[1]])-(q[axes[1]]-a[axes[1]])*(d[axes[0]]-a[axes[0]]))/f.det;
            const v=((c[axes[0]]-a[axes[0]])*(q[axes[1]]-a[axes[1]])-(c[axes[1]]-a[axes[1]])*(q[axes[0]]-a[axes[0]]))/f.det,w=1-u-v;
            const point=q.slice(0,3);point[axes[2]]=a[axes[2]]*w+c[axes[2]]*u+d[axes[2]]*v+.003;
            const normal=f.normal[0].clone().multiplyScalar(w).addScaledVector(f.normal[1],u).addScaledVector(f.normal[2],v).normalize();
            return{point:point.map(Math.fround),normal,uv:q.slice(3)};
          });
          for(let i=1;i<mapped.length-1;i++){
            const triangle=[mapped[0],mapped[i],mapped[i+1]],a=triangle[0].point,c=triangle[1].point,d=triangle[2].point;
            const area=(c[axes[0]]-a[axes[0]])*(d[axes[1]]-a[axes[1]])-(c[axes[1]]-a[axes[1]])*(d[axes[0]]-a[axes[0]]);
            if(Math.abs(area)<=1e-14)continue;
            for(const q of triangle){indices.push(positions.length/3);positions.push(...q.point);normals.push(...q.normal.toArray());uvs.push(...q.uv);}
          }
        }
      }
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));g.setIndex(indices);
    };
    const place=(shape,cx,cy,angle=0,plane='front')=>{
      const g=new T.ShapeGeometry(shape,8),p=g.attributes.position,ca=Math.cos(angle),sa=Math.sin(angle);
      for(let i=0;i<p.count;i++){
        const px=p.getX(i),py=p.getY(i),xx=cx+px*ca-py*sa,yy=cy+px*sa+py*ca;
        if(plane==='top'){
          const shell=Math.max(.003,1-Math.pow(Math.abs(xx/1.02),2/.60)-Math.pow(Math.abs(yy/.47),2/.60));
          p.setXYZ(i,xx,.27+.18*Math.pow(shell,.40)+.003,3.28+yy);
        }else{
          const shell=Math.max(.003,1-Math.pow(Math.abs(xx/1.02),2/.60)-Math.pow(Math.abs(unflattenY((yy-.27)/.18)),2/.80));
          p.setXYZ(i,xx,yy,3.28+.47*Math.pow(shell,.30)+.003);
        }
      }
      if(plane==='top'&&g.index)for(let i=0;i<g.index.count;i+=3){const a=g.index.getX(i+1);g.index.setX(i+1,g.index.getX(i+2));g.index.setX(i+2,a);}
      conformToCloth(g,plane);parts.push(g);
    };
    const ribbon=(points,width,plane='front')=>{
      const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],0))),left=[],right=[];
      for(let k=0;k<=40;k++){
        const t=k/40,v=curve.getPoint(t),d=curve.getTangent(t),w=width*(.62+.38*Math.sin(Math.PI*t));
        left.push([v.x+d.y*w/2,v.y-d.x*w/2]);right.push([v.x-d.y*w/2,v.y+d.x*w/2]);
      }
      const shape=new T.Shape();shape.moveTo(...left[0]);for(const p of left.slice(1))shape.lineTo(...p);for(const p of right.reverse())shape.lineTo(...p);shape.closePath();place(shape,0,0,0,plane);
    };
    const rosette=(cx,cy,r,plane='front')=>{
      for(let row=0;row<2;row++)for(let k=0;k<8;k++){
        const length=r*(row===0?1:.52),w=length*.26;
        const petal=new T.Shape();petal.moveTo(-w*.22,length*.20);
        petal.bezierCurveTo(-w,length*.45,-w*.92,length*.72,-w*.34,length*.73);
        petal.bezierCurveTo(-w*.48,length*.87,-w*.14,length*.93,0,length);
        petal.bezierCurveTo(w*.14,length*.93,w*.48,length*.87,w*.34,length*.73);
        petal.bezierCurveTo(w*.92,length*.72,w,length*.45,w*.22,length*.20);petal.closePath();
        place(petal,cx,cy,k*Math.PI/4+row*Math.PI/8,plane);
      }
      const center=new T.Shape();center.absellipse(0,0,.014,.014,0,Math.PI*2,false,0);place(center,cx,cy,0,plane);
    };
    // Three larger woven medallions and connected fine vines, as visible on
    // the original cushion. They are not five isolated metal flower badges.
    for(const cx of [-.67,0,.67])rosette(cx,.271,cx===0?.126:.113);
    for(const cx of [-.335,.335]){
      ribbon([[cx-.12,.181],[cx-.07,.236],[cx+.055,.288],[cx+.10,.349],[cx+.055,.374],[cx-.015,.347],[cx+.003,.305]],.0065);
      ribbon([[cx+.12,.184],[cx+.055,.230],[cx-.055,.291],[cx-.092,.341],[cx-.055,.369],[cx+.007,.346]],.005);
      for(let k=0;k<4;k++)for(const side of [-1,1]){
        const yy=.210+k*.040,xx=cx+side*(k%2===0?.045:.020);
        const leaf=new T.Shape();leaf.moveTo(0,0);leaf.bezierCurveTo(-.014,.018,-.023,.036,0,.052);leaf.bezierCurveTo(.017,.034,.013,.014,0,0);
        place(leaf,xx,yy,-side*(.52+k*.18));
      }
    }
    for(const upper of [false,true]){
      const points=[];for(let k=0;k<=56;k++){const x=-.91+k/56*1.82;points.push([x,(upper?.380:.165)+(upper?-.040:.016)*Math.pow(Math.abs(x)/.91,1.4)+.007*Math.sin(k/56*Math.PI*14)]);}
      ribbon(points,.0055);
    }
    // Continue the textile motif across the rounded upper surface rather
    // than leaving a bare black lid above the embroidered front face.
    for(const cx of [-.64,0,.64])rosette(cx,0,cx===0?.145:.116,'top');
    for(const cx of [-.32,.32]){
      ribbon([[cx-.13,-.20],[cx-.08,-.10],[cx+.07,0],[cx+.11,.11],[cx+.03,.20],[cx-.05,.16],[cx-.02,.09]],.006,'top');
      ribbon([[cx+.13,-.18],[cx+.07,-.08],[cx-.06,.03],[cx-.10,.15],[cx-.03,.21]],.005,'top');
    }
    const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.userData.cushionEmbroidery=true;return g;
  });
  b.add(brocade,'oldgold');
  const cornerPost=b.geometry('kneeling-base-turned-corner-post',()=>{
    const profile=[[0,.091],[.073,.091],[.075,.110],[.061,.125],[.057,.153],[.077,.168],[.077,.190],[.057,.202],[.062,.221],[.051,.243],[.031,.258],[0,.269]];
    const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),32);
    g.computeVertexNormals();smoothCoincidentShellNormals(g);g.userData.kneelingCornerPost=true;return g;
  });
  const cornerInlay=b.geometry('kneeling-base-three-lobed-corner-inlay',()=>{
    const q=new T.Shape();q.moveTo(0,-.022);q.bezierCurveTo(-.010,-.014,-.012,-.006,-.015,.002);
    q.bezierCurveTo(-.033,-.007,-.038,.008,-.027,.018);q.bezierCurveTo(-.019,.026,-.013,.018,-.009,.008);
    q.bezierCurveTo(-.014,.027,-.004,.038,0,.041);q.bezierCurveTo(.004,.038,.014,.027,.009,.008);
    q.bezierCurveTo(.013,.018,.019,.026,.027,.018);q.bezierCurveTo(.038,.008,.033,-.007,.015,.002);
    q.bezierCurveTo(.012,-.006,.010,-.014,0,-.022);q.closePath();
    const g=new T.ExtrudeGeometry(q,{depth:.0035,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1,curveSegments:7});
    g.userData.kneelingCornerInlay=true;return g;
  });
  const cornerBorder=b.geometry('kneeling-base-oval-corner-border',()=>{
    const points=[];for(let k=0;k<64;k++){const a=k/64*Math.PI*2;points.push(new T.Vector3(.103*Math.cos(a),.040*Math.sin(a),0));}
    const g=new T.TubeGeometry(new T.CatmullRomCurve3(points,true),64,.0032,6,true);g.userData.kneelingCornerBorder=true;return g;
  });
  for(const side of [-1,1]){
    b.add(cornerPost,'lacquer',side*1.16,0,3.60);
    b.add(cornerBorder,'oldgold',side*1.16,.018,3.8105);
    b.add(cornerInlay,'gold',side*1.16,.012,3.8085);
  }
  });
}

function buildVerticalSuspensionChain(b,x,lower,z,ceilingY) {
  // Fine interlinked rings, at a contact pitch rather than freely floating
  // equally spaced loops. The first is perpendicular to the canopy's eye.
  const radius=.021,tube=.0035,top=ceilingY+.005,first=lower+radius,pitch=2*(radius-tube);
  const count=Math.max(2,Math.floor((top-radius-first)/pitch)+1),last=first+(count-1)*pitch;
  const link=b.geometry('fine-support-chain-link',()=>new T.TorusGeometry(1,tube/radius,8,32));
  for(let i=0;i<count;i++)b.add(link,'oldgold',x,first+i*pitch,z,radius,radius,radius,0,(i+1)%2*Math.PI/2,0);
  const lowerPin=last+radius-tube*1.15;
  b.cylinder(x,(lowerPin+top)/2,z,.0045,top-lowerPin,'oldgold');
  b.cylinder(x,ceilingY+.003,z,.034,.010,'oldgold');
}

function buildCanopy(b,x,y,z,s,chainDrop=1,chainExtra=0,shallowTray=false) {
  b.withTransform(x,y,z,s,()=>{
    // The central canopy is a shallow chased tray close to the ceiling,
    // not three large empty hoop silhouettes. Smaller side canopies retain
    // their distinct open construction. Chain endpoints are held separately.
    if(shallowTray)b.lathe('central-shallow-gilt-canopy',[[0,.17],[.35,.17],[.64,.13],[.91,.06],[1.13,.015],[1.16,-.005],[1.14,-.035],[.91,.025],[.64,.095],[.35,.135],[0,.135]].reverse(),0,0,0,1,1,'gold',64);
    if(!shallowTray){
      // The three existing concentric open rings need actual common ribs.
      // Their radii/heights and every lower pendant stay unchanged.
      for(let k=0;k<6;k++)b.withTransform(0,0,0,1,()=>b.curve('small-canopy-radial-support',[[0,.64,0],[0,.43,.23],[0,.24,.53],[0,.12,.84],[0,0,1.15]],.018,'gold',28),k*Math.PI/3);
      b.cylinder(0,.66,0,.040,.12,'gold');
      b.torus(0,.76,0,.040,.010,'gold');
    }
    for(let ring=0;ring<3;ring++){
      const r=1.15-ring*.31,yy=ring*(shallowTray?.035:.12);
      b.torus(0,yy,0,r,shallowTray?.015:.032,'gold',Math.PI/2);
      const n=24-ring*4;
      for(let k=0;k<n;k++){
        const a=k/n*Math.PI*2;
        b.withTransform(Math.sin(a)*r,yy,Math.cos(a)*r,1,()=>b.leaf(0,-.02,0,shallowTray?.13:.18,shallowTray?.12:.23,0,'gold'),a);
      }
    }
    for(let ring=0;ring<3;ring++){
      const count=[22,16,10][ring],radius=[1.28,.88,.46][ring];
      for(let k=0;k<count;k++){
        const a=k/count*Math.PI*2+ring*.19,xx=Math.sin(a)*radius,zz=Math.cos(a)*radius;
        // The chains must attach to the tray/ribs, not begin in empty air at
        // a different radius. These short rolled hooks bridge that offset.
        const anchorR=shallowTray?Math.min(radius,1.135):1.15-ring*.31;
        const anchorY=shallowTray?(ring===0?-.015:ring===1?.033:.12):ring*.12;
        b.curve('canopy-chain-hook:'+Number(shallowTray)+':'+ring+':'+k,[[Math.sin(a)*anchorR,anchorY,Math.cos(a)*anchorR],[xx,anchorY-.018,zz],[xx,-.055,zz]],.009,'gold',9);
        // Different chain lengths form the layered scalloped edge seen in ref6.
        const faceClearance=Math.abs(xx)<.69;
        const length=((faceClearance?.58:[1.43,1.15,.68][ring])+.07*Math.cos(a*3))*chainDrop+chainExtra;
        const n=Math.floor(length/.195);
        // The open leaf itself carries the next ornament. A solid rod through
        // its aperture erased the negative space visible in the original.
        // Keep the carrier everywhere else, including inside the little bells,
        // and terminate each short segment in the leaf's actual top/bottom knot.
        let carrierTop=0;
        for(let i=0;i<n;i++)if((i+k+ring)%3===1){
          const yy=-.12-i*.195,upper=yy+.002,lower=yy-.088;
          b.cylinder(xx,(carrierTop+upper)/2,zz,.006,carrierTop-upper,'oldgold');
          carrierTop=lower;
        }
        // A final leaf can extend a few millimetres below the nominal chain
        // length. Do not create a negative-height remainder in that case.
        if(carrierTop+length>1e-7)b.cylinder(xx,(carrierTop-length)/2,zz,.006,carrierTop+length,'oldgold');
        for(let i=0;i<n;i++){
          const yy=-.12-i*.195;
          const form=(i+k+ring)%3;
          if(form!==1){
            const scale=form===0?[.84,.88,.84]:[.76,.47,.76];
            b.withTransform(xx,yy,zz,scale,()=>{
              const bell=b.geometry('five-lobed-pendant-bell',()=>{
                // A closed neck grips the real carrier; only the flared mouth
                // below remains hollow. The former open neck floated around it.
                const g=lobedVesselGeometry([[.025,-.080],[.055,-.10],[.078,-.108],[.085,-.10],[.067,-.083],[.039,-.038],[.029,0],[.018,.012],[0,.012],[0,.002],[.015,-.025],[.025,-.080]],5,.11,40);
                const p=g.attributes.position;
                for(let v=0;v<p.count;v++){
                  const aa=Math.atan2(p.getX(v),p.getZ(v)),fade=T.MathUtils.clamp((-p.getY(v)-.055)/.045,0,1);
                  p.setY(v,p.getY(v)+.012*Math.cos(aa*5)*fade);
                }
                // Collapsed axial cap rows need no zero-area triangles.
                const sourceIndex=g.index,indices=[],va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3();
                for(let i=0;i<sourceIndex.count;i+=3){
                  const a=sourceIndex.getX(i),bb=sourceIndex.getX(i+1),c=sourceIndex.getX(i+2);
                  va.fromBufferAttribute(p,a);vb.fromBufferAttribute(p,bb).sub(va);vc.fromBufferAttribute(p,c).sub(va);
                  if(vb.cross(vc).lengthSq()>1e-22)indices.push(a,bb,c);
                }
                g.setIndex(indices);g.computeVertexNormals();smoothRevolvedSeamNormals(g);g.userData.pendantLobedBell=true;return g;
              });
              b.add(bell,'gold');
              for(let q=0;q<5;q++){
                const aa=q*Math.PI*2/5,ps=[[.0205,.012],[.0327,0],[.0438,-.038],[.0749,-.075533],[.0949,-.088]].map(([r,y])=>[Math.sin(aa)*r,y,Math.cos(aa)*r]);
                b.curve('pendant-bell-raised-rib:'+q,ps,.0038,'gold',10);
              }
              // Fine little drops hang from the actual scalloped mouth;
              // they are not a large solid ball filling the bell opening.
              for(let q=0;q<3;q++){
                const aa=q*Math.PI*2/3,r=.085*(1+.11*Math.cos(aa*5)),lipY=-.10+.012*Math.cos(aa*5);
                const dx=Math.sin(aa)*r,dz=Math.cos(aa)*r;
                b.cylinder(dx,lipY-.019,dz,.0035,.038,'oldgold');
                b.ball(dx,lipY-.051,dz,.008,.014,.007,'gold');
              }
              b.ball(0,-.128,0,.008,.013,.008,'oldgold');
            });
          }else{
            const loop=b.geometry('pendant-open-leaf-link',()=>new T.TubeGeometry(new T.CatmullRomCurve3([[0,.02,0],[-.042,-.018,0],[-.052,-.061,0],[-.033,-.087,0],[0,-.070,0],[.033,-.087,0],[.052,-.061,0],[.042,-.018,0]].map(p=>new T.Vector3(...p)),true,'catmullrom',.4),32,.0065,5,true));
            b.add(loop,'gold',xx,yy-.018,zz,1,1,1,0,a*.4+(i%2)*Math.PI/2,0);
            b.ball(xx,yy-.129,zz,.011,.019,.010,'gold');
          }
        }
        // Preserve the former leaf's endpoint exactly while supplying the
        // missing physical link from the chain to a compact pear-shaped drop.
        const terminalTop=Math.min(-length,carrierTop),terminalBottom=-length-.168363636;
        // The existing stem enters the pear casting; stopping at its axial
        // tip left only a point joint. The pear and upper connection stay fixed.
        const terminalBearing=terminalBottom-.004;
        b.cylinder(xx,(terminalTop+terminalBearing)/2,zz,.0045,terminalTop-terminalBearing,'oldgold');
        b.lathe('pendant-terminal-pear',[[0,-.118],[.010,-.10],[.023,-.075],[.026,-.040],[.012,-.005],[0,0]],xx,-length-.168363636,zz,1,1,'gold',20);
      }
    }
  });
}

function buildPendantStandard(b,x,y,z,length=3.20,width=.78,headerDrop=.23,headerCeiling=[6.815,2.35]) {
  b.withTransform(x,y,z,1,()=>{
    // Reference6 has four larger flower/scroll units in its narrow pierced
    // field, not a string of twelve isolated equal flower badges. Preserve
    // the hanging axis and length; only the board's true rectangular aspect
    // and attached relief are reconstructed here, not camera convergence.
    const fieldScale=width/.53;
    b.withTransform(0,0,0,[fieldScale,1,1],()=>{
      for(const side of [-1,1]){
        b.box(side*.255,-length/2,.045,.022,length+.05,.025,'gold');
        b.box(side*.227,-length/2,.060,.009,length,.015,'oldgold');
      }
      for(const yy of [-.01,-length])b.box(0,yy,.046,.53,.023,.025,'gold');
      const vineX=(yy,side)=>side*(.156+.035*Math.sin(-yy/length*Math.PI*8));
      for(const side of [-1,1]){
        const points=[];for(let k=0;k<=96;k++){const t=k/96,yy=-.005-t*(length-.010),zz=.070-.018*Math.pow(Math.abs(2*t-1),12);points.push([vineX(yy,side),yy,zz]);}
        // Broad rolled faces carry the highlights of a cast carving. Both
        // ends enter the real horizontal frame, rather than float nearby.
        b.carvedCurve('banner-bearing-vine:'+length+':'+side,points,.028,.014,'gold',112);
      }
      for(let row=0;row<4;row++){
        const yy=-length*(.125+row*.25),r=[.135,.130,.145,.132][row];
        for(const side of [-1,1]){
          const sy=yy+.27;
          b.carvedCurve('banner-major-scroll:'+length+':'+row+':'+side,[[vineX(sy,side),sy,.074],[side*.201,yy+.18,.082],[side*.205,yy+.015,.086],[side*.125,yy-.18,.092],[side*.025,yy-.25,.092],[side*.008,yy-.16,.096],[side*.059,yy-.125,.099],[side*.075,yy-.19,.096]],.028,.013,'gold',42);
          b.carvedCurve('banner-flower-branch:'+length+':'+row+':'+side,[[vineX(yy,side),yy,.074],[side*.112,yy+.040,.086],[side*.048,yy+.018,.092],[0,yy,.096]],.022,.012,'oldgold',20);
          for(const dy of [.13,-.27]){const ly=yy+dy;b.leaf(vineX(ly,side),ly,.076,.075,.180,side*.90,'gold',.36);}
        }
        const petals=row%2===0?8:6;
        for(let k=0;k<petals;k++){const a=k*Math.PI*2/petals+(row%2)*.14;b.leaf(Math.sin(a)*.018,yy+Math.cos(a)*.018,.095,.078,r,-a,'gold',.38);}
        for(let k=0;k<4;k++){const a=k*Math.PI/2+.39;b.leaf(Math.sin(a)*.010,yy+Math.cos(a)*.010,.110,.046,r*.53,-a,'oldgold',.32);}
        b.ball(0,yy,.125,.025,.031,.015,'gold');
      }
      // Five long open metal frames, visible against the red columns in the
      // original, are not solid sticks with copied acanthus leaves. Preserve
      // the five axes; expose the paired fine rails and their open centers.
      for(let k=0;k<5;k++){
        const xx=(k-2)*.105,outer=x<0?k===0:k===4,inner=x<0?k===4:k===0;
        b.withTransform(xx,-length,.046,1,()=>{
          b.torus(0,-.024,0,.018,.0035,'gold');
          b.ball(0,-.055,0,.010,.014,.009,'gold');
          b.cylinder(0,-.087,0,.0045,.046,'gold');
          const rail=b.geometry('banner-long-open-pendant-frame',()=>{
            const path=new T.CurvePath(),v=(x,y)=>new T.Vector3(x,y,0);
            path.add(new T.LineCurve3(v(-.014,-.128),v(-.014,-.792)));
            path.add(new T.CubicBezierCurve3(v(-.014,-.792),v(-.014,-.818),v(.014,-.818),v(.014,-.792)));
            path.add(new T.LineCurve3(v(.014,-.792),v(.014,-.128)));
            path.add(new T.CubicBezierCurve3(v(.014,-.128),v(.014,-.102),v(-.014,-.102),v(-.014,-.128)));
            const g=new T.TubeGeometry(path,128,.0035,8,true);g.userData.bannerOpenTerminal=true;return g;
          });
          b.add(rail,'gold');
          b.cylinder(0,-.820,0,.0036,.024,'oldgold');
          b.torus(0,-.844,0,.012,.0035,'gold');
          if(outer){
            // The outermost visible terminal is a fine flared open drop.
            // Its two sides, lower spread and neck remain separate from the
            // long frame. Do not fill the original's dark opening with gold.
            b.cylinder(0,-.884,0,.0033,.064,'oldgold');
            b.ball(0,-.915,0,.007,.009,.006,'gold');
            const drop=b.geometry('banner-flared-open-terminal',()=>{
              const points=[[0,-.923,0],[-.008,-.940,0],[-.009,-1.015,0],[-.021,-1.095,0],[-.012,-1.100,0],[0,-1.091,0],[.012,-1.100,0],[.021,-1.095,0],[.009,-1.015,0],[.008,-.940,0]];
              const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),true,'catmullrom',.25),80,.0033,8,true);g.userData.bannerOpenTerminal=true;return g;
            });
            b.add(drop,'gold');
          }else if(inner){
            // Only this small inner pear is clear; lower middle forms are
            // partly obscured, so no invented large leaf/tassel is added.
            b.cylinder(0,-.891,0,.0033,.078,'oldgold');
            const pear=b.geometry('banner-small-inner-pear',()=>{
              const profile=[[0,-.072],[.010,-.052],[.016,-.036],[.010,-.020],[.004,-.007],[0,0]];
              const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),20);
              g.computeVertexNormals();smoothCoincidentShellNormals(g);return g;
            });
            b.add(pear,'gold',0,-.927,0);
          }
        });
      }
    });
    b.box(0,.03,0,width+.08,.13,.13,'gold');
    // The short, wide scalloped plaque on the inner side of each long banner
    // is visible in the supplied photograph beside the supporting beam.
    const inward=-Math.sign(x),cx=inward*(width/2+.61);
    const plaque=b.geometry('banner-scalloped-header',()=>{
      const q=new T.Shape();q.moveTo(-.55,.32);q.lineTo(.55,.32);q.lineTo(.55,.02);
      q.bezierCurveTo(.55,-.13,.39,-.18,.34,-.08);q.bezierCurveTo(.22,-.29,.10,-.29,0,-.16);
      q.bezierCurveTo(-.10,-.29,-.22,-.29,-.34,-.08);q.bezierCurveTo(-.39,-.18,-.55,-.13,-.55,.02);q.closePath();
      return new T.ExtrudeGeometry(q,{depth:.026,bevelEnabled:true,bevelSize:.010,bevelThickness:.009,bevelSegments:2,curveSegments:9});
    });
    b.withTransform(0,-headerDrop,0,1,()=>{
    b.add(plaque,'oldgold',cx,.02,.01);
    b.box(cx,.343,.055,1.13,.022,.030,'gold');
    // Existing raised flowers bear on the plaque face, not an empty gap.
    // Retain all original outlines and move only their casting depth.
    for(const xx of [-.34,0,.34]){
      for(let k=0;k<8;k++){const a=k*Math.PI/4;b.flame(cx+xx+Math.sin(a)*.022,.10+Math.cos(a)*.022,.044,.075,.145,-a,'gold',.35);}
      b.ball(cx+xx,.10,.049,.025,.025,.014,'gold');
      for(const side of [-1,1])b.flame(cx+xx+side*.095,.17,.039,.07,.13,-side*.70,'gold',.3);
    }
    });
    const lowerY=.343-headerDrop,bearingY=headerCeiling[0]-y;
    if(!(bearingY>lowerY))throw new RangeError('Short plaque must hang below its actual ceiling bearing.');
    // Extend along the same line beyond the declared bearing, so metadata
    // reports the true first timber contact rather than an embedded tip.
    const upperZ=.055+(headerCeiling[1]-z-.055)*(1+.010/(bearingY-lowerY));
    for(const dx of [-.40,.40])b.curve('banner-plaque-bearing-rod:'+x+':'+dx,[[cx+dx,lowerY,.055],[cx+dx,bearingY+.010,upperZ]],.006,'oldgold',8);
  });
}
