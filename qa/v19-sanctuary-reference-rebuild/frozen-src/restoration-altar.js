import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const RESTORATION_ALTAR_LAYOUT = Object.freeze({
  terraceWidths: [6.25,6.47,6.72,6.98,7.25],
  centralCanopy: [0,6.20,2.35,1.22],
  floorLampX: 3.35, floorLampScale: .72,
  mainThroneHeight: .50, sideThroneHeight: .40,
  throneRadii: [1.19,.82], throneCompensation: [1.75/1.35,1.75/1.28],
  throneDepthAspect: .68,
  headHaloCenters: [4.813,4.102],
  sidePendantX: 4.15, sidePendantY: 6.05, sidePendantZ: 2.00,
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
    buildMandorla(b, 0, 1.40, -.79, .75,layout.headHaloCenters[0]);
    for (const side of [-1, 1]) buildMandorla(b, side * 2.78, 1.80, -.87, .52,layout.headHaloCenters[1]);
  }
  if (options.lotusThrones !== false) {
    buildLotusThrone(b,0,3.00,0,layout.throneRadii[0],layout.mainThroneHeight,layout.throneCompensation,layout.throneDepthAspect);
    for(const side of [-1,1])buildLotusThrone(b,side*2.78,2.85,-.08,layout.throneRadii[1],layout.sideThroneHeight,layout.throneCompensation,layout.throneDepthAspect);
  }
  if (options.ritualObjects !== false) buildRitualObjects(b,layout);
  if (options.offeringTable !== false) buildOfferingTable(b);
  if (options.hanging !== false) buildCanopy(b,...layout.centralCanopy);
  b.finish();
  root.userData.reference = 'user reference 6';
  root.userData.coordinateSystem = 'altar-local; hall translation [6,3.48,-14.5], +Z faces worshipper';
  root.userData.figureSeatAnchors = [[0,3.00,0],[-2.78,2.85,-.08],[2.78,2.85,-.08]];
  root.userData.figureTargetHeights = [2.10,1.45,1.45];
  root.userData.materialNames = Object.fromEntries(Object.entries(b.materials).map(([key,m])=>[key,m.name]));
  return root;
}

/** Optional matching side ornaments; coordinates are altar-local, not hall-local. */
export function buildRestorationHangingOrnaments(options = {}) {
  const b = new FurnishingBuilder(options.materials);
  b.root.name = 'restoration-reference6-side-pendants';
  const layout = { ...RESTORATION_ALTAR_LAYOUT, ...options.layout };
  for (const side of [-1, 1]) {
    buildPendantStandard(b,side*layout.sidePendantX,layout.sidePendantY,layout.sidePendantZ);
    buildCanopy(b, side * 5.65, 5.82, 3.0, .38);
  }
  b.finish();
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
      paper: new T.MeshStandardMaterial({name:'restoration-lantern-warm-paper',color:0xe1b264,roughness:.62,emissive:0xffb54e,emissiveIntensity:.65,side:T.DoubleSide}),
      flame: supplied.flame || new T.MeshStandardMaterial({name:'restoration-flame',color:0xffd47e,emissive:0xffa831,emissiveIntensity:2}),
      textile: new T.MeshStandardMaterial({name:'restoration-black-brocade',color:0x191818,roughness:.86}),
    };
  }
  geometry(key, fn) { if (!this.cache.has(key)) this.cache.set(key, fn()); return this.cache.get(key); }
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
  finish() {
    let instances=0,triangles=0;
    const curveMerges=new Map();
    for(const {g,material,matrices} of this.buckets.values()){
      // Unique carved curves are fused by material. Repeated leaves, pearls and
      // vessels remain instanced, avoiding hundreds of tiny shadow draw calls.
      if(g.type==='TubeGeometry' && matrices.length<=12){
        if(!curveMerges.has(material))curveMerges.set(material,[]);
        for(const matrix of matrices)curveMerges.get(material).push(g.clone().applyMatrix4(matrix));
        instances+=matrices.length;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*matrices.length;
        continue;
      }
      const mesh=new T.InstancedMesh(g,this.materials[material],matrices.length);
      mesh.name='restoration-altar:'+material;
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;
      mesh.castShadow=material!=='flame';mesh.receiveShadow=true;
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

function buildTerraces(b,layout) {
  // Five distinct altar cabinets, not stair treads with repeated dot motifs.
  const tiers=[
    {y:.27,h:.54,w:6.25,d:3.28,n:5},
    {y:.73,h:.38,w:6.47,d:3.00,n:7},
    {y:1.15,h:.46,w:6.72,d:2.70,n:5},
    {y:1.58,h:.39,w:6.98,d:2.40,n:7},
    {y:2.02,h:.49,w:7.25,d:2.13,n:5},
  ];
  tiers.forEach((t,level)=>{
    t.w=layout.terraceWidths[level];
    b.box(0,t.y,0,t.w,t.h,t.d,'lacquer');
    const front=t.d/2+.025;
    for(const dy of [-t.h/2+.017,t.h/2-.017]) {
      b.box(0,t.y+dy,front,t.w+.04,.021,.045,'gold');
      b.box(0,t.y+dy+Math.sign(dy)*.024,front-.016,t.w+.11,.025,.067,'oldgold');
    }
    if(level===0){
      // Quiet black-lacquer base cupboards with separate corner medallions,
      // rather than yet another drawer row behind the foreground table.
      for(const side of [-1,1]){
        const x=side*t.w*.395,w=t.w*.18;
        b.box(x,t.y,front+.020,w,t.h-.075,.035,'lacquer');
        for(const xx of [-1,1])b.box(x+xx*w/2,t.y,front+.048,.023,t.h-.055,.026,'oldgold');
        for(let k=0;k<8;k++){const a=k*Math.PI/4;b.leaf(x+Math.sin(a)*.017,t.y+Math.cos(a)*.017,front+.063,.052,.10,-a,'gold',.4);}
        b.ball(x,t.y,front+.075,.029,.029,.015,'gold');
      }
      b.box(0,t.y,front+.025,t.w*.56,t.h-.06,.035,'lacquer');
    }else{
      const weights=[[1,1,1],[1.0,1.8,.72,1.8,1.0],[1.7,.60,2.35,.60,1.7],[1.05,.65,1.2,.85,1.2,.65,1.05],[1.25,1.15,.75,1.15,1.25]][level];
      const gap=.105,total=weights.reduce((a,v)=>a+v,0),available=t.w-.22-gap*(weights.length-1);
      let cursor=-t.w/2+.11;
      weights.forEach((weight,i)=>{
        const pw=available*weight/total,x=cursor+pw/2;
        framedScrollPanel(b,x,t.y,front+.018,pw,t.h-.083,(level+i)%2);
        cursor+=pw+gap;
        if(i<weights.length-1){
          b.box(cursor-gap/2,t.y,front+.050,.052,t.h-.045,.042,'oldgold');
          for(const yy of [-1,1])b.box(cursor-gap/2,t.y+yy*(t.h*.38),front+.063,.080,.038,.040,'gold');
        }
      });
    }
    // Gilt corner caps visibly wrap the depth of the cabinet.
    for(const s of [-1,1]){
      b.box(s*(t.w/2-.06),t.y,front+.035,.095,t.h-.042,.028,'gold');
      b.box(s*(t.w/2+.006),t.y,front-.10,.025,t.h-.042,.25,'oldgold');
    }
  });
  b.box(0,.83,1.57,.46,.56,.13,'oldgold');
  b.box(0,.83,1.645,.37,.47,.035,'lacquer');
  for(let k=0;k<10;k++){const a=k*Math.PI/5;b.leaf(Math.sin(a)*.025,.83+Math.cos(a)*.025,1.68,.07,.16,-a,'gold',.65);}
  b.ball(0,.83,1.71,.047,.047,.02,'gold');
  // Raised plinth beneath central lotus. Attendants have individually stepped bases.
  const seatBottom=3.00-layout.mainThroneHeight;
  b.box(0,(2.265+seatBottom)/2,-.08,2.52,seatBottom-2.265,1.76,'lacquer');
  b.box(0,seatBottom-.003,-.08,2.59,.025,1.82,'gold');
  for(const side of [-1,1])for(let i=0;i<3;i++) {
    const w=2.13-i*.13, y=2.05+i*.115,z=-.09,d=1.53-i*.085;
    b.box(side*2.78,y,z,w,.16,d,'lacquer');
    b.box(side*2.78,y+.078,z,w+.065,.023,d+.055,'gold');
    framedScrollPanel(b,side*2.78,y,z+d/2+.025,w-.15,.092,i%2);
  }
}

function framedScrollPanel(b,x,y,z,w,h,variant=0) {
  b.box(x,y,z,w,h,.025,'lacquer');
  for(const side of [-1,1]){
    b.box(x+side*w/2,y,z+.021,.017,h+.013,.021,'gold');
    b.box(x,y+side*h/2,z+.021,w,.013,.021,'gold');
    b.box(x+side*(w/2-.042),y,z+.025,.009,h-.04,.013,'oldgold');
  }
  // One coherent bilateral vine relief per framed field. Geometry is shared.
  const g=b.geometry('scroll-relief:'+variant,()=>scrollReliefGeometry(variant));
  b.add(g,'gold',x,y,z+.038,w*.91,h*.76,.55);
  for(const side of [-1,1]) b.ball(x+side*(w/2-.045),y,z+.04,.018,Math.min(.027,h*.16),.012,'oldgold');
}

function scrollReliefGeometry(variant) {
  // Reference cabinet relief: bilateral long-bodied creatures among cloud
  // scrolls, with heads facing a central pearl. Avoid an X-shaped leaf glyph.
  const parts=[];
  const tube=(ps,r=.014,n=22)=>parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p))),n,r,5,false));
  const ellipse=(x,y,z,rx,ry,rz)=>parts.push(new T.SphereGeometry(1,12,8).scale(rx,ry,rz).translate(x,y,z));
  for(const side of [-1,1]){
    const body=[];
    for(let i=0;i<=36;i++){
      const t=i/36;body.push([side*(.13+.30*t),.15*Math.sin(t*Math.PI*2.8+variant*.4),.035+.018*Math.sin(t*Math.PI)]);
    }
    tube(body,.026,36);
    tube(body.map(p=>[p[0],p[1]+.027,p[2]-.012]),.010,36);
    const head=new T.Shape();
    head.moveTo(side*.052,.025);head.lineTo(side*.072,.125);
    head.bezierCurveTo(side*.092,.205,side*.145,.185,side*.173,.085);
    head.lineTo(side*.178,-.04);head.lineTo(side*.133,-.08);head.lineTo(side*.106,-.04);
    head.lineTo(side*.051,-.058);head.closePath();
    parts.push(new T.ExtrudeGeometry(head,{depth:.060,bevelEnabled:true,bevelSize:.008,bevelThickness:.014,bevelSegments:2,curveSegments:5}));
    ellipse(side*.100,.101,.087,.015,.028,.012);
    tube([[side*.129,.14,.07],[side*.155,.29,.06],[side*.198,.31,.02]],.015,11);
    tube([[side*.071,.012,.075],[side*.020,-.10,.07],[side*.063,-.19,.035]],.008,12);
    for(const t of [.28,.65]){
      const xx=side*(.13+.30*t),yy=.15*Math.sin(t*Math.PI*2.8+variant*.4);
      for(const sign of [-1,1]){
        const joint=[xx+side*.036,yy+sign*.12,.046],tip=[xx-side*.018,yy+sign*.24,.022];
        tube([[xx,yy,.04],joint,tip],.015,11);
        for(let digit=-1;digit<=1;digit++)tube([tip,[tip[0]+side*(.026+digit*.018),tip[1]+sign*.060,.018]],.007,5);
      }
    }
    for(let k=0;k<9;k++){
      const t=.12+k*.085,xx=side*(.13+.30*t),yy=.15*Math.sin(t*Math.PI*2.8+variant*.4);
      tube([[xx-side*.016,yy+.016,.054],[xx+side*.010,yy+.070,.064],[xx+side*.020,yy+.010,.052]],.009,8);
    }
    for(const sign of [-1,1]){
      const ps=[];for(let k=0;k<=24;k++){const t=k/24,a=t*Math.PI*2.25,r=.068*(1-t*.72);ps.push([side*(.405+Math.cos(a)*r),sign*(.22+Math.sin(a)*r*1.7),.025]);}tube(ps,.013,24);
    }
  }
  ellipse(0,0,.050,.029,.10,.035);
  const normalized=parts.map(g=>g.index?g.toNonIndexed():g),merged=mergeGeometries(normalized,false);
  normalized.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());return merged;
}

function buildMandorla(b,x,y,z,s,headCenterY) {
  b.withTransform(x,y,z,s,()=>{
    const bottom=1.40,top=6.12,height=top-bottom;
    const edge=t=>2.09*Math.pow(Math.sin(Math.PI*t),.72)*(1-.20*t);
    // Four nested ogee frames with depth separation, never a solid flat shield.
    for(let layer=0;layer<4;layer++)for(const side of [-1,1]) {
      const ps=[];for(let i=0;i<=56;i++){
        const t=i/56;ps.push([side*(edge(t)-layer*.115*Math.sin(Math.PI*t)),bottom+t*height,-layer*.043]);
      }
      b.curve('mandorla-frame:'+layer+':'+side,ps,layer===0?.024:.014,layer===1?'oldgold':'gold',62);
    }
    // Radial head aureole: visibly separate chased disk, bead rim and rays.
    // Head rings follow the sculpture's measured face center independently
    // from the outer mandorla apex and lower branching structure.
    const cy=(headCenterY-y)/s;
    for(const r of [.62,.67,.73,.80])b.torus(0,cy,.095,r,r===.67?.024:.012,'gold');
    for(let k=0;k<56;k++){
      const a=k/56*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
      b.ball(ca*.765,cy+sa*.765,.115,.019,.019,.016,'gold');
      if(k%2===0){
        const r0=.83,r1=1.03+(sa>.2?.25*sa:0);
        b.curve('halo-ray:'+k,[[ca*r0,cy+sa*r0,.03],[ca*(r0+r1)/2,cy+sa*(r0+r1)/2,.055],[ca*r1,cy+sa*r1,.015]],.012,'gold',7);
        b.leaf(ca*r1,cy+sa*r1,.025,.085,.18,a-Math.PI/2,'gold');
      }
    }
    // Flame tendrils project from a continuous spine, each with two small scrolls.
    for(const side of [-1,1])for(let row=0;row<21;row++){
      const t=.075+row*.0404,yy=bottom+t*height,xx=side*edge(t);
      const slope=(edge(Math.min(.99,t+.005))-edge(Math.max(.01,t-.005)))/(.01*height);
      const lean=Math.atan(-side*slope)*.32-side*.46;
      b.leaf(xx,yy,.025,.18,.37,lean,'gold',.78);
      const ps=[[xx,yy,.01],[xx+side*.14,yy+.075,.045],[xx+side*.23,yy+.22,.03],[xx+side*.12,yy+.36,0],[xx+side*.075,yy+.27,.015]];
      b.curve('mandorla-flame:'+side+':'+row,ps,.013,'gold',19);
      b.curve('mandorla-inscroll:'+side+':'+row,[[xx-side*.09,yy-.025,.04],[xx-side*.29,yy+.04,.055],[xx-side*.26,yy+.20,.03],[xx-side*.15,yy+.18,.03],[xx-side*.18,yy+.115,.05]],.011,'oldgold',16);
      b.ball(xx-side*.08,yy+.016,.072,.026,.033,.019,'gold');
    }
    // Inner branching foliage, concentrated at the flanks, leaving figure unobscured.
    for(const side of [-1,1])for(let row=0;row<8;row++){
      const yy=2.02+row*.36,xx=side*(1.43-.045*row);
      b.curve('mandorla-innerbranch:'+side+':'+row,[[xx+side*.19,yy-.12,-.025],[xx,yy+.05,.005],[xx-side*.22,yy+.17,.005],[xx-side*.18,yy+.31,-.025]],.013,'gold',18);
      b.leaf(xx-side*.04,yy+.04,.018,.17,.28,side*.55,'gold',.8);
    }
    // Tapering crown finial, composed of buds and flames instead of roof bars.
    b.leaf(0,5.82,.02,.20,.50,0,'gold');
    for(const side of [-1,1])b.leaf(side*.07,5.76,.012,.17,.38,-side*.52,'gold');
  });
}

function buildLotusThrone(b,x,seatY,z,radius,height,radialCompensation=[1,1],depthAspect=.68) {
  // Undo the hall's nonuniform X/Z scaling ONLY around the seat center.
  // Translation, contact Y and vertical thickness are deliberately unchanged.
  b.withTransform(x,seatY-height,z,[radialCompensation[0],1,radialCompensation[1]*depthAspect],()=>{
    b.lathe('lotus-seat-core',[[0,0],[.62,.015],[.77,.10],[.91,.25],[1,.55],[.91,.84],[.76,.95],[0,1]],0,0,0,radius*.63,height,'oldgold',48);
    // Thin hidden support reaches under the actual front knee (Z≈.96 for
    // the central figure); the thick belly remains well inside the petals.
    b.lathe('lotus-seat-top',[[0,0],[.79,0],[.85,.035],[.88,.075],[.86,.11],[0,.11]],0,height*.87,0,radius,height,'oldgold',48);
    const petal=b.geometry('thick-lotus-throne-petal',()=>{
      const p=[],uv=[],idx=[],rows=16,cols=10;
      for(let surface=0;surface<2;surface++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
        const t=j/rows,u=i/cols*2-1;
        const width=Math.pow(Math.sin(Math.PI*t),.69)*.46;
        const radial=.06+Math.sin(t*Math.PI*.75)*.33+Math.pow(t,2)*.24;
        const ridge=(1-u*u)*Math.sin(Math.PI*t)*.115;
        p.push(u*width,t,radial+ridge-(surface===1?.055:0));uv.push(i/cols,t);
        if(j<rows&&i<cols){const a=surface*(rows+1)*(cols+1)+j*(cols+1)+i;
          if(surface===0)idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);
          else idx.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
      }
      const off=(rows+1)*(cols+1);
      for(let j=0;j<rows;j++)for(const i of [0,cols]){const a=j*(cols+1)+i,c=a+cols+1;idx.push(a,c,a+off,c,c+off,a+off);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
    });
    for(let layer=0;layer<2;layer++){
      const n=[22,24][layer],rr=radius*[.63,.72][layer];
      for(let k=0;k<n;k++){
        const a=k/n*Math.PI*2+layer*.13;
        // A physically shallower FRONT lip preserves the low camera's view of
        // the crossed feet. Do not raise a full circular crown across the legs.
        const frontal=Math.max(0,Math.cos(a));
        const base=height*[.00,.24][layer],hh=height*[.84,.72][layer]*(1-.25*frontal);
        b.add(petal,'gold',Math.sin(a)*rr,base,Math.cos(a)*rr,radius*[.22,.20][layer],hh,radius*.38,0,a,0);
      }
    }
    b.torus(0,height*.11,0,radius*.67,.022,'gold',Math.PI/2);
  });
}

function buildRitualObjects(b,layout) {
  for(const side of [-1,1]) {
    // The foreground lamps are taller than the rear tabletop lamps.
    buildLantern(b,side*layout.floorLampX,.03,2.18,layout.floorLampScale);
    buildLantern(b,side*2.45,2.31,1.01,.43);
    buildVase(b,side*3.56,2.28,.62,.42,.89,'lacquer');
    buildVase(b,side*4.90,.03,1.90,.59,1.18,'lacquer');
    buildLiddedUrn(b,side*4.60,.03,1.75,.52);
    for(let i=0;i<3;i++)buildCandlestick(b,side*(1.37+i*.60),2.33,1.17-(i%2)*.15,.57+(i===1?.24:0));
    buildLotusOffering(b,side*1.92,2.33,.19,.91);
    buildLotusOffering(b,side*3.30,2.31,.03,.71);
    for(let i=0;i<2;i++){
      const xx=side*(.57+i*.35);
      b.lathe('offering-cup',[[0,0],[.11,.015],[.08,.07],[.12,.09],[.18,.20],[.17,.23],[.01,.20]],xx,2.34,1.16,.65,.65,'gold');
    }
  }
  buildLiddedUrn(b,0,2.36,.72,.38);
}

function buildVase(b,x,y,z,r,h,m) {
  b.lathe('flower-vase-profile',[[0,0],[.36,0],[.42,.06],[.33,.14],[.22,.20],[.25,.33],[.47,.46],[.50,.61],[.43,.72],[.24,.80],[.22,1.03],[.29,1.08],[.30,1.12],[.24,1.14]],x,y,z,r,h,m);
  for(const [yy,rr] of [[.05,.40],[.19,.23],[.77,.27],[1.09,.29]])b.torus(x,y+yy*h,z,rr*r,.013,'gold',Math.PI/2);
  for(let k=0;k<8;k++){
    const a=k*Math.PI/4,rr=.45*r;
    b.withTransform(x,y,z,1,()=>b.withTransform(0,0,0,1,()=>b.leaf(0,.44*h,rr,.18*r,.30*h,0,'oldgold',.6),a));
  }
}
function buildLiddedUrn(b,x,y,z,s) {
  b.withTransform(x,y,z,s,()=>{
    b.lathe('lidded-incense-urn',[[0,0],[.37,.01],[.40,.09],[.26,.14],[.24,.29],[.47,.36],[.59,.57],[.55,.79],[.40,.91],[.43,.97],[.37,1.02],[.08,1.15],[0,1.19]],0,0,0,1,1,'lacquer');
    for(const [yy,r] of [[.08,.39],[.27,.24],[.94,.43],[1.0,.38]])b.torus(0,yy,0,r,.026,'gold',Math.PI/2);
    b.ball(0,1.20,0,.09,.13,.09,'gold');
    for(const side of [-1,1])b.curve('urn-handle:'+side,[[side*.44,.52,0],[side*.72,.61,0],[side*.72,.88,0],[side*.50,.86,0]],.046,'gold',18);
    for(let k=0;k<8;k++){
      const a=k*Math.PI/4;
      b.withTransform(0,0,0,1,()=>b.leaf(0,.49,.55,.20,.31,0,'oldgold'),a);
    }
  });
}
function buildCandlestick(b,x,y,z,h) {
  b.lathe('candlestick-profile',[[0,0],[.16,.01],[.17,.045],[.11,.08],[.07,.17],[.045,.26],[.045,.64],[.085,.69],[.08,.73],[.14,.76],[.13,.79],[0,.79]],x,y,z,h,h,'gold',20);
  b.cylinder(x,y+h*.94,z,.028*h,.32*h,'ivory');
  b.ball(x,y+h*1.125,z,.012*h,.043*h,.012*h,'flame');
}
function buildLotusOffering(b,x,y,z,s) {
  b.withTransform(x,y,z,s,()=>{
    b.lathe('lotus-offering-stand',[[0,0],[.19,.015],[.16,.07],[.065,.17],[.04,.66],[.09,.75],[.14,.78]],0,0,0,1,1,'gold',20);
    for(let j=0;j<2;j++)for(let k=0;k<8;k++){
      const a=k*Math.PI/4+j*.38;
      b.withTransform(Math.sin(a)*(.08+j*.06),.75+j*.035,Math.cos(a)*(.08+j*.06),1,()=>b.leaf(0,0,0,.26,.36,0,'gold'),a);
    }
    b.ball(0,1.01,0,.10,.15,.10,'gold');
  });
}

function buildLantern(b,x,y,z,s) {
  b.withTransform(x,y,z,s,()=>{
    b.lathe('lantern-foot-stem',[[0,0],[.43,.02],[.45,.09],[.39,.17],[.28,.22],[.21,.32],[.16,.55],[.13,.83],[.15,.94],[.29,1.02],[.34,1.07],[.33,1.14],[.25,1.20]],0,0,0,1,1,'lacquer');
    for(const [yy,r] of [[.09,.43],[.23,.27],[.94,.19],[1.09,.33]])b.torus(0,yy,0,r,.022,'gold',Math.PI/2);
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      b.withTransform(0,0,0,1,()=>{
        b.leaf(0,.35,.155,.12,.41,0,'oldgold');
        b.box(0,1.59,.288,.54,.70,.016,'paper');
        for(const xx of [-.285,.285])b.box(xx,1.59,.302,.035,.78,.035,'gold');
        for(const yy of [1.20,1.98])b.box(0,yy,.305,.58,.045,.045,'lacquer');
        // Diamond lattice cut into the six real panels, not vertical prison bars.
        const lattice=b.geometry('lantern-diamond-grid',()=>{
          const parts=[];
          for(let row=0;row<6;row++)for(let col=0;col<4;col++){
            const cx=(col-1.5)*.12,cy=1.28+row*.115;
            const points=[[cx-.057,cy,.311],[cx,cy+.053,.311],[cx+.057,cy,.311],[cx,cy-.053,.311],[cx-.057,cy,.311]];
            parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),8,.006,4,false));
          }
          const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());return g;
        });
        b.add(lattice,'oldgold');
      },a);
    }
    b.lathe('lantern-canopy',[[.16,2.20],[.23,2.14],[.36,2.04],[.50,2.00],[.58,2.04],[.53,1.97],[.36,1.95]],0,0,0,1,1,'lacquer',6);
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      b.curve('lantern-roof-rib:'+k,[[Math.sin(a)*.14,2.20,Math.cos(a)*.14],[Math.sin(a)*.34,2.07,Math.cos(a)*.34],[Math.sin(a)*.58,2.05,Math.cos(a)*.58]],.018,'gold',10);
      b.ball(Math.sin(a)*.55,2.055,Math.cos(a)*.55,.026,.038,.026,'gold');
    }
    b.ball(0,2.27,0,.12,.12,.12,'gold');b.ball(0,2.42,0,.052,.085,.052,'gold');
  });
}

function buildOfferingTable(b) {
  b.withTransform(0,0,.62,[.84,1,1],()=>{
  const z=2.53;
  // Narrow gilded altar table with open negative space under the apron.
  b.box(0,.59,z,4.02,.080,.96,'lacquer');
  b.box(0,.638,z,4.13,.020,1.02,'gold');
  b.box(0,.535,z+.45,3.96,.14,.075,'lacquer');
  framedScrollPanel(b,0,.535,z+.495,3.73,.11,1);
  for(const side of [-1,1])for(const dz of [-.34,.34]) {
    const x=side*1.73;
    b.lathe('offering-table-turned-leg',[[0,0],[.10,.015],[.09,.06],[.06,.11],[.072,.18],[.08,.23],[.063,.31],[.072,.40],[.08,.44],[.09,.49],[0,.51]],x,.09,z+dz,1,1,'red',24);
    b.box(x,.055,z+dz,.25,.09,.25,'gold');
    b.box(x,.11,z+dz,.18,.025,.18,'lacquer');
    for(const [yy,rr] of [[.17,.084],[.32,.098],[.53,.092]])b.torus(x,yy,z+dz,rr,.018,'gold',Math.PI/2);
    for(const yy of [.23,.42])b.ball(x,yy,z+dz,.094,.052,.094,'gold');
  }
  // Small central censer and its narrow pedestal; not an oversized sphere.
  b.lathe('censer-pedestal',[[0,0],[.25,.012],[.28,.06],[.19,.12],[.11,.22],[.15,.27],[.21,.31],[.20,.35]],0,.65,z,1,1.67,'lacquer');
  b.torus(0,1.18,z,.19,.024,'gold',Math.PI/2);
  b.lathe('small-censer-bowl',[[0,0],[.19,.025],[.30,.12],[.32,.24],[.26,.34],[.25,.38],[.28,.40]],0,1.23,z,.95,.95,'gold');
  for(const side of [-1,1])b.curve('censer-small-handle:'+side,[[side*.24,1.44,z],[side*.40,1.51,z],[side*.36,1.65,z],[side*.25,1.56,z]],.025,'oldgold',14);
  for(let i=0;i<3;i++)b.cylinder((i-1)*.042,1.79,z+.015*(i%2),.006,.40,'lacquer');
  // Low brocade kneeling cushion and carved base in front, as in the photograph.
  b.box(0,.045,3.28,2.21,.08,1.06,'lacquer');b.box(0,.088,3.28,2.14,.018,.99,'gold');
  b.ball(0,.235,3.28,1.02,.23,.47,'textile');
  const motif=b.geometry('cushion-brocade',()=>scrollReliefGeometry(1));
  for(let i=-3;i<=3;i++)b.add(motif,'oldgold',i*.257,.226,3.707,.235,.15,.22);
  for(const side of [-1,1])b.ball(side*1.045,.13,3.28,.074,.11,.07,'lacquer');
  });
}

function buildCanopy(b,x,y,z,s) {
  b.withTransform(x,y,z,s,()=>{
    // Shallow six-tier lotus canopy above dense, individually articulated chains.
    for(let ring=0;ring<3;ring++){
      const r=1.15-ring*.31,yy=ring*.12;
      b.torus(0,yy,0,r,.032,'gold',Math.PI/2);
      const n=24-ring*4;
      for(let k=0;k<n;k++){
        const a=k/n*Math.PI*2;
        b.withTransform(Math.sin(a)*r,yy,Math.cos(a)*r,1,()=>b.leaf(0,-.02,0,.18,.23,0,'gold'),a);
      }
    }
    for(let ring=0;ring<3;ring++){
      const count=[22,16,10][ring],radius=[1.28,.88,.46][ring];
      for(let k=0;k<count;k++){
        const a=k/count*Math.PI*2+ring*.19,xx=Math.sin(a)*radius,zz=Math.cos(a)*radius;
        // Different chain lengths form the layered scalloped edge seen in ref6.
        const faceClearance=Math.abs(xx)<.69;
        const length=(faceClearance?.58:[1.43,1.15,.68][ring])+.07*Math.cos(a*3);
        const n=Math.floor(length/.195);
        b.cylinder(xx,-length/2,zz,.006,length,'oldgold');
        for(let i=0;i<n;i++){
          const yy=-.12-i*.195;
          if(i%3===0) {
            b.lathe('pendant-bell',[[.025,0],[.034,-.04],[.065,-.084],[.082,-.10],[.062,-.113]],xx,yy,zz,1,1,'gold',10);
            b.ball(xx,yy-.133,zz,.021,.029,.021,'gold');
          } else {
            b.torus(xx,yy,zz,.033,.007,'gold',0,i%2*Math.PI/2);
            b.ball(xx,yy-.052,zz,.017,.025,.017,'gold');
          }
        }
        b.leaf(xx,-length-.10,zz,.080,.18,Math.PI,'gold',.5);
      }
    }
  });
}

function buildPendantStandard(b,x,y,z) {
  b.withTransform(x,y,z,1,()=>{
    // The reference has a continuous narrow embroidered openwork field, not
    // a ladder of nine individually boxed miniature cabinet fronts.
    b.box(0,-1.15,0,.48,2.30,.052,'lacquer');
    for(const side of [-1,1]){
      b.box(side*.255,-1.15,.045,.022,2.35,.025,'gold');
      b.box(side*.227,-1.15,.060,.009,2.30,.015,'oldgold');
    }
    for(const yy of [-.01,-2.30])b.box(0,yy,.046,.53,.023,.025,'gold');
    for(const side of [-1,1]){
      const points=[];for(let k=0;k<=48;k++){const t=k/48;points.push([side*(.095+.05*Math.sin(t*Math.PI*8)),-.07-t*2.18,.070]);}
      b.curve('banner-continuous-stem:'+side,points,.009,'gold',70);
      for(let row=0;row<10;row++){
        const yy=-.11-row*.215, xx=side*.10;
        b.curve('banner-tendril:'+side+':'+row,[[xx,yy,.075],[side*.185,yy-.05,.10],[side*.17,yy-.15,.075],[side*.10,yy-.15,.083],[side*.12,yy-.11,.10]],.009,'gold',16);
        b.leaf(side*.065,yy-.16,.078,.105,.17,-side*.45,'gold',.65);
      }
    }
    for(let row=0;row<8;row++){
      const yy=-.20-row*.265;
      for(let k=0;k<5;k++){const a=k*Math.PI*.4;b.leaf(Math.sin(a)*.017,yy+Math.cos(a)*.017,.082,.050,.073,-a,'gold',.45);}
      b.ball(0,yy,.095,.023,.023,.018,'gold');
    }
    b.box(0,.03,0,.66,.13,.13,'gold');
    for(let k=0;k<5;k++){
      const xx=(k-2)*.105, len=.65+(k%2)*.17;
      b.cylinder(xx,-2.31-len/2,0,.009,len,'gold');
      b.ball(xx,-2.34-len,0,.022,.039,.022,'gold');
      b.leaf(xx,-2.40-len,0,.055,.20,Math.PI,'gold');
    }
  });
}
