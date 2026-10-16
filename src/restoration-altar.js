import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Reference 6 sanctuary furnishing. Local origin = hall [6, 3.48, -14.5].
 * Front faces +Z. Does not contain figures, lotus seats, lighting or architecture.
 * Deterministic carved construction, with shared ornament geometry and instances.
 */
export function buildRestorationAltar(options = {}) {
  const b = new FurnishingBuilder(options.materials);
  const root = b.root;
  root.name = 'restoration-reference6-altar';
  if (options.terraces !== false) buildTerraces(b);
  if (options.mandorlas !== false) {
    buildMandorla(b, 0, 1.40, -.79, .75);
    for (const side of [-1, 1]) buildMandorla(b, side * 2.78, 1.80, -.87, .52);
  }
  if (options.lotusThrones !== false) {
    buildLotusThrone(b,0,3.00,0,1.12,.60);
    for(const side of [-1,1])buildLotusThrone(b,side*2.78,2.85,-.08,.79,.46);
  }
  if (options.ritualObjects !== false) buildRitualObjects(b);
  if (options.offeringTable !== false) buildOfferingTable(b);
  if (options.hanging !== false) buildCanopy(b, 0, 5.98, 1.40, 1);
  b.finish();
  root.userData.reference = 'user reference 6';
  root.userData.coordinateSystem = 'altar-local; hall translation [6,3.48,-14.5], +Z faces worshipper';
  root.userData.figureSeatAnchors = [[0,3.00,0],[-2.78,2.85,-.08],[2.78,2.85,-.08]];
  root.userData.figureTargetHeights = [2.10,1.45,1.45];
  return root;
}

/** Optional matching side ornaments; coordinates are altar-local, not hall-local. */
export function buildRestorationHangingOrnaments(options = {}) {
  const b = new FurnishingBuilder(options.materials);
  b.root.name = 'restoration-reference6-side-pendants';
  for (const side of [-1, 1]) {
    buildPendantStandard(b, side * 4.05, 5.90, .46);
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
      lacquer: new T.MeshStandardMaterial({name:'restoration-black-brown-lacquer',color:0x17130e,metalness:.26,roughness:.24}),
      red: new T.MeshStandardMaterial({name:'restoration-vermillion-lacquer',color:0x521c13,metalness:.14,roughness:.30}),
      ivory: new T.MeshStandardMaterial({name:'restoration-candle-wax',color:0xe7d7b0,roughness:.68}),
      paper: new T.MeshStandardMaterial({name:'restoration-lantern-warm-paper',color:0xe1b264,roughness:.62,emissive:0xffb54e,emissiveIntensity:.65,side:T.DoubleSide}),
      flame: supplied.flame || new T.MeshStandardMaterial({name:'restoration-flame',color:0xffd47e,emissive:0xffa831,emissiveIntensity:2}),
      textile: new T.MeshStandardMaterial({name:'restoration-black-brocade',color:0x191818,roughness:.86}),
    };
  }
  geometry(key, fn) { if (!this.cache.has(key)) this.cache.set(key, fn()); return this.cache.get(key); }
  withTransform(x,y,z,s,fn,ry=0) {
    const mat = new T.Matrix4().makeRotationY(ry); mat.setPosition(x,y,z); mat.scale(new T.Vector3(s,s,s));
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

function buildTerraces(b) {
  // Five distinct altar cabinets, not stair treads with repeated dot motifs.
  const tiers=[
    {y:.27,h:.54,w:9.15,d:3.28,n:5},
    {y:.73,h:.38,w:8.80,d:3.00,n:7},
    {y:1.15,h:.46,w:8.42,d:2.70,n:5},
    {y:1.58,h:.39,w:8.02,d:2.40,n:7},
    {y:2.02,h:.49,w:7.57,d:2.13,n:5},
  ];
  tiers.forEach((t,level)=>{
    b.box(0,t.y,0,t.w,t.h,t.d,'lacquer');
    const front=t.d/2+.025;
    for(const dy of [-t.h/2+.017,t.h/2-.017]) {
      b.box(0,t.y+dy,front,t.w+.04,.021,.045,'gold');
      b.box(0,t.y+dy+Math.sign(dy)*.024,front-.016,t.w+.11,.025,.067,'oldgold');
    }
    const gap=.105, pw=(t.w-.22-gap*(t.n-1))/t.n;
    for(let i=0;i<t.n;i++) {
      const x=-t.w/2+.11+pw/2+i*(pw+gap);
      framedScrollPanel(b,x,t.y,front+.018,pw,t.h-.083,level%2);
    }
    // Gilt corner caps visibly wrap the depth of the cabinet.
    for(const s of [-1,1]){
      b.box(s*(t.w/2-.06),t.y,front+.035,.095,t.h-.042,.028,'gold');
      b.box(s*(t.w/2+.006),t.y,front-.10,.025,t.h-.042,.25,'oldgold');
    }
  });
  // Raised plinth beneath central lotus. Attendants have individually stepped bases.
  b.box(0,2.33,-.08,2.52,.13,1.76,'lacquer');
  b.box(0,2.397,-.08,2.59,.025,1.82,'gold');
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
  const parts=[];
  const tube=(ps,r=.018,n=25)=>parts.push(new T.TubeGeometry(new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p))),n,r,5,false));
  for(const side of [-1,1]){
    const ps=[];for(let i=0;i<=32;i++){
      const t=i/32, a=t*Math.PI*2.35, r=.19*(1-t*.79);
      ps.push([side*(.24+Math.cos(a)*r),Math.sin(a)*.35*(1-t*.80),.025*Math.sin(t*Math.PI)]);
    }tube(ps,.016,32);
    tube([[0,-.18,0],[side*.12,.08,.025],[side*.23,-.09,.02],[side*.43,.05,0]],.019,24);
    for(let j=0;j<4;j++){
      const x=side*(.095+j*.087),dy=(j%2?-.15:.18)*(variant?-.8:1);
      tube([[x,0,.015],[x+side*.045,dy*.5,.055],[x+side*.012,dy,.015]],.017,10);
      tube([[x+side*.012,dy,.015],[x-side*.033,dy*.63,.04],[x,0,.015]],.011,10);
    }
  }
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,ca=Math.cos(a),sa=Math.sin(a);
    tube([[0,0,.045],[ca*.055-sa*.03,sa*.13+ca*.025,.08],[ca*.085,sa*.20,.035],[ca*.055+sa*.03,sa*.13-ca*.025,.08],[0,0,.045]],.012,14);
  }
  const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());return merged;
}

function buildMandorla(b,x,y,z,s) {
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
    const cy=4.19;
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

function buildLotusThrone(b,x,seatY,z,radius,height) {
  b.withTransform(x,seatY-height,z,1,()=>{
    b.lathe('lotus-seat-core',[[0,0],[.62,.015],[.77,.10],[.91,.25],[1,.55],[.91,.84],[.76,.95],[0,1]],0,0,0,radius,height,'oldgold',48);
    b.lathe('lotus-seat-top',[[0,0],[.80,0],[.89,.035],[.90,.075],[.84,.11],[0,.11]],0,height*.82,0,radius,height,'gold',48);
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
    for(let layer=0;layer<3;layer++){
      const n=[20,22,24][layer],rr=radius*[.56,.69,.77][layer];
      for(let k=0;k<n;k++){
        const a=k/n*Math.PI*2+layer*.13, hh=height*[.74,.71,.55][layer];
        b.add(petal,layer===0?'oldgold':'gold',Math.sin(a)*rr,height*[.02,.19,.43][layer],Math.cos(a)*rr,radius*.48,hh,radius*.40,0,a,0);
      }
    }
    b.torus(0,height*.11,0,radius*.67,.022,'gold',Math.PI/2);
  });
}

function buildRitualObjects(b) {
  for(const side of [-1,1]) {
    // The foreground lamps are taller than the rear tabletop lamps.
    buildLantern(b,side*4.52,.03,2.18,.89);
    buildLantern(b,side*2.45,2.31,1.01,.43);
    buildVase(b,side*3.56,2.28,.62,.42,.89,'lacquer');
    buildVase(b,side*5.31,.03,1.43,.59,1.18,'lacquer');
    buildLiddedUrn(b,side*5.00,.03,.65,.52);
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
    b.leaf(x+Math.sin(a)*rr,y+.44*h,z+Math.cos(a)*rr,.18*r,.30*h,0,'oldgold',.6);
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
      b.leaf(Math.sin(a)*.55,.49,Math.cos(a)*.55,.20,.31,0,'oldgold');
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
  const z=2.53;
  // Narrow gilded altar table with open negative space under the apron.
  b.box(0,.81,z,4.72,.115,.96,'lacquer');
  b.box(0,.876,z,4.85,.025,1.02,'gold');
  b.box(0,.75,z+.45,4.65,.18,.075,'lacquer');
  framedScrollPanel(b,0,.75,z+.495,4.38,.14,1);
  for(const side of [-1,1])for(const dz of [-.34,.34]) {
    const x=side*2.05;
    b.box(x,.40,z+dz,.16,.73,.17,'red');
    b.box(x,.075,z+dz,.32,.10,.31,'gold');
    b.box(x,.13,z+dz,.23,.035,.23,'lacquer');
    for(const yy of [.26,.64,.76])b.box(x,yy,z+dz,.24,.055,.24,'gold');
    b.leaf(x,.30,z+dz+.10,.17,.28,0,'gold');
  }
  // Small central censer and its narrow pedestal; not an oversized sphere.
  b.lathe('censer-pedestal',[[0,0],[.25,.012],[.28,.06],[.19,.12],[.11,.22],[.15,.27],[.21,.31],[.20,.35]],0,.89,z,1,1,'lacquer');
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
    b.box(0,-1.15,0,.58,2.30,.065,'lacquer');
    for(const side of [-1,1])b.box(side*.30,-1.15,.045,.025,2.35,.025,'gold');
    for(let row=0;row<9;row++)framedScrollPanel(b,0,-.15-row*.245,.047,.52,.205,row%2);
    b.box(0,.03,0,.76,.16,.13,'gold');
    for(let k=0;k<5;k++){
      const xx=(k-2)*.126, len=.65+(k%2)*.17;
      b.cylinder(xx,-2.31-len/2,0,.009,len,'gold');
      b.ball(xx,-2.34-len,0,.022,.039,.022,'gold');
      b.leaf(xx,-2.40-len,0,.055,.20,Math.PI,'gold');
    }
  });
}
