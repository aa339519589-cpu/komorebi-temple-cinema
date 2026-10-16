import * as T from 'three';
import {timberSweep} from './natural-forms.js';

/*
 * Reconstruction details read from references 4, 5 and 6. All dimensions are
 * LOCAL to world.js's current group. Never bake hallMatrix / towerMatrix here.
 * The geometry is shared between instances, not regenerated for every post.
 */
export const ARCHITECTURE_REVISION = 'reference-joinery-04';

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

// Rafters are shallow sweeps, not densely tessellated free-form sculpture.
// Twelve segments retain the eave curl while keeping both rafter tiers at
// approximately the old single tier's triangle cost. Fascia still uses the
// longer timberSweep, where its curved silhouette is visible across the frame.
function rafterSweep(points,width,height) {
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  const hw=width/2,hh=height/2,b=.006,segments=12;
  const rim=[[-hw+b,-hh],[hw-b,-hh],[hw,-hh+b],[hw,hh-b],
    [hw-b,hh],[-hw+b,hh],[-hw,hh-b],[-hw,-hh+b]];
  const frames=Array.from({length:segments+1},(_,j)=>{
    const t=j/segments,centre=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
    const side=new T.Vector3(tangent.z,0,-tangent.x).normalize();
    return {centre,side,up:new T.Vector3().crossVectors(tangent,side).normalize()};
  });
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
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  return g;
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
  const masu = extrudedProfile([
    [-.50, .50], [.50, .50], [.50, .19], [.43, .13],
    [.32, -.36], [.27, -.50], [-.27, -.50], [-.32, -.36],
    [-.43, .13], [-.50, .19]
  ], 1, .025);
  const collar = turnedProfile([[0,0],[1,0],[1,.10],[1.055,.14],[1.055,.22],
    [1.015,.27],[1.015,.88],[1.055,.93],[1.055,1],[0,1]], 48);
  const column = turnedProfile([[0,0],[.985,0],[.996,.06],[1.012,.23],
    [1.008,.48],[.994,.69],[.972,.88],[.95,1],[0,1]], 48);
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
  return {hijiki,masu,collar,column,foot,tileSeal,ring,rosette,pin,nail,tenon,
    friezeLeaf,friezeStem};
}

/**
 * Required ctx: instance, group, box. Optional: stack + columns preserve the
 * existing collision/column audit; roofAudit preserves the soffit audit.
 * All material names already exist in world.js. No lights, texture downloads,
 * scene insertion, shared-state mutation or additional transform are needed.
 */
export function createRestorationArchitecture(ctx) {
  const {instance, group, box, columns, stack, roofAudit} = ctx;
  if (!instance || !group || !box) throw new Error('Architecture requires instance, group and box helpers.');
  const g = architectureGeometry();
  const PI = Math.PI;
  const draw = (geometry, material, p, scale, rot = null, tint = 1) =>
    instance(geometry, material, ...p, ...scale, rot, tint);
  const v = p => new T.Vector3(...p);
  const stats = {columns:0,bracketSets:0,roofFaces:0,rafters:0,tileEnds:0};

  function flower(x,y,z,r,ma='oldgold',rot=null,tint=1) {
    draw(g.rosette,ma,[x,y,z],[r,r,r],rot,tint);
  }

  function squareFitting(x,y,z,w,h,rot=0,detail=true) {
    // Forged framing strips surround exposed end grain; no solid gold cube.
    group(x,y,z,rot,()=>{
      const border = Math.min(w,h)*.075;
      box(0,0,0,w,h,.016,'oldgold');
      box(0,0,.010,w-border*2,h-border*2,.012,'endwood');
      if(detail) {
        flower(0,0,.020,Math.min(w,h)*.36,'gold');
        for(const sx of [-1,1])for(const sy of [-1,1])
          draw(g.nail,'oldgold',[sx*(w*.5-border),sy*(h*.5-border),.021],[border*.42,border*.42,.006]);
      }
    });
  }

  function footColumn(x,z,bottom,h,r=.28) {
    stats.columns++;
    if (columns && stack) {
      const matrix=stack[stack.length-1];
      const a=new T.Vector3(x,bottom+.3,z).applyMatrix4(matrix);
      const b=new T.Vector3(x,bottom+h+.3,z).applyMatrix4(matrix);
      const sx=new T.Vector3().setFromMatrixColumn(matrix,0).length();
      const sz=new T.Vector3().setFromMatrixColumn(matrix,2).length();
      columns.push({x:a.x,z:a.z,bottom:a.y,top:b.y,radius:r*1.012*Math.max(sx,sz)});
    }
    // Same foundation and shaft datum as the old footColumn, so existing
    // rails, floor height, transoms and capital centres remain registered.
    draw(g.foot,'stone',[x,bottom,z],[r*1.38,.30,r*1.38],null,.91);
    draw(g.column,'red',[x,bottom+.3,z],[r,h,r]);
    const footHeight=Math.min(.48,r*.98);
    draw(g.collar,'black',[x,bottom+.295,z],[r*1.035,footHeight,r*1.035]);
    for(const yy of [.318,.295+footHeight-.028])
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
    const neck=bottom+h+.20;
    draw(g.collar,'darkwood',[x,neck-.065,z],[r*.99,.14,r*.99]);
    draw(g.ring,'oldgold',[x,neck+.075,z],[r*1.025,r*1.025,r*.14],[PI/2,0,0],.80);
    // Short tie-beam tenons are visible below the bracket seat, with wooden
    // drawbore pegs. They are not decorative leaves glued to the shaft.
    for(let side=0;side<4;side++) {
      group(x,neck-.10,z,side*PI/2,()=>{
        box(0,0,r*.97,r*.41,.16,r*.18,'endwood');
        draw(g.pin,'darkwood',[0,0,r*1.075],[.020,.020,.040]);
      });
    }
  }

  function brackets(x,y,z,s=1,options={}) {
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

  function tileEnd(p,angle,r=.078,detail=true) {
    const rot=[0,angle,0],n=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
    draw(g.tileSeal,'slate',p.toArray(),[r,r,r],rot,.88);
    const face=p.clone().addScaledVector(n,r*.19);
    draw(g.ring,'tileEdge',face.toArray(),[r*.82,r*.82,r*.42],rot,.82);
    if(detail) {
      const mark=face.clone().addScaledVector(n,.0015);
      flower(mark.x,mark.y,mark.z,r*.68,'tileEdge',rot,.87);
    }
  }

  /** Replace only the old hipRoof soffit/rafter/eave loop, after roof backing.
   * Keep existing surface tile mesh, hip ridge and central ridge in world.js.
   * evalP is the existing roof-local sampler and must return a Vector3.
   */
  function eaves({w,d,evalP,roofOrigin=[0,0,0],detail=true}) {
    for(let face=0;face<4;face++) {
      stats.roofFaces++;
      const angle=face===0?0:face===1?PI:face===2?PI/2:-PI/2;
      const count=Math.max(4,Math.round((face<2?w:d)/.29));
      for(let i=0;i<=count;i++) {
        // Avoid double rafters on the shared hip seam; diagonal hip timber
        // below carries that load as one heavy member, not four superpositions.
        if(i===0||i===count)continue;
        const u=-1+2*i/count;
        const main=[],fly=[];
        for(let j=0;j<=12;j++) {
          const p=evalP(face,.34+.64*j/12,u);p.y-=.305;main.push(p.toArray());
          const f=evalP(face,.69+.345*j/12,u);f.y-=.232;fly.push(f.toArray());
        }
        draw(rafterSweep(main,.115,.145),'cedar',[0,0,0],[1,1,1]);
        draw(rafterSweep(fly,.092,.098),'endwood',[0,0,0],[1,1,1]);
        stats.rafters+=2;
        const end=v(fly[fly.length-1]);
        const tangent=end.clone().sub(v(fly[fly.length-2])).normalize();
        const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),tangent);
        const tip=end.clone().addScaledVector(tangent,.007);
        // Fine gold rectangular end plates, not spherical golden rafter tips.
        draw('box','oldgold',tip.toArray(),[.090,.094,.013],q,.88);
        if(detail && i%3===0) {
          const crest=tip.clone().addScaledVector(tangent,.009);
          flower(crest.x,crest.y,crest.z,.033,'gold',q,.91);
        }
        if(roofAudit) {
          const oldA=evalP(face,.35,u),oldB=evalP(face,1.02,u);
          let oldPenetration=-Infinity;
          for(let j=0;j<=16;j++) {
            const t=j/16,surface=evalP(face,.35+.67*t,u);
            oldPenetration=Math.max(oldPenetration,
              T.MathUtils.lerp(oldA.y,oldB.y,t)-.21+.055-surface.y);
          }
          roofAudit.push({roof:roofOrigin,face,u,oldPenetration,
            newMaximumTopOffset:-.183,architecture:ARCHITECTURE_REVISION});
        }
      }
      // Broad, square-section fascia follows the reference's sweep. Thin gold
      // framing is restricted to the lower molding and exposed primary ends.
      const lower=[],upper=[],molding=[];
      for(let j=0;j<=36;j++) {
        const p=evalP(face,1.004,-1+2*j/36);p.y-=.145;
        lower.push(p.toArray()); upper.push([p.x,p.y+.10,p.z]);
        molding.push([p.x,p.y-.098,p.z]);
      }
      draw(timberSweep(lower,.115,.18),'red',[0,0,0],[1,1,1]);
      draw(timberSweep(upper,.105,.075),'darkwood',[0,0,0],[1,1,1]);
      draw(timberSweep(molding,.122,.018),'oldgold',[0,0,0],[1,1,1],null,.80);
      // The round terminal row belongs to the ceramic tile spacing, not the
      // rafter spacing. Alternate flat rain channels remain visible between it.
      const tiles=Math.max(5,Math.round((face<2?w:d)/.255));
      for(let i=0;i<=tiles;i++) {
        const p=evalP(face,1.014,-1+2*i/tiles);p.y-=.006;
        tileEnd(p,angle,.077,detail); stats.tileEnds++;
      }
    }
    // Four uninterrupted diagonal hip-support timbers meet the fascia corners.
    for(const face of [0,1])for(const side of [-1,1]) {
      const pts=[];
      for(let j=0;j<=22;j++) {
        const p=evalP(face,.28+.75*j/22,side);p.y-=.365;pts.push(p.toArray());
      }
      draw(timberSweep(pts,.22,.23),'red',[0,0,0],[1,1,1]);
      const end=v(pts[pts.length-1]),tangent=end.clone().sub(v(pts[pts.length-2])).normalize();
      const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),tangent);
      const tip=end.clone().addScaledVector(tangent,.014);
      draw('box','oldgold',tip.toArray(),[.215,.225,.019],q);
      const flowerPoint=tip.clone().addScaledVector(tangent,.012);
      flower(flowerPoint.x,flowerPoint.y,flowerPoint.z,.081,'gold',q);
    }
  }

  /** In the main hall group at (6,3.1,-11), replace the three old transfer
   * beam/bracket statements. Posts and the high capitals already carry load.
   */
  function sanctuaryTransferBeam({frameZ=-2.8}={}) {
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

  /** Replace the old coffer rosette loop AND its two gold lattice loops.
   * Retain structural depth, open nave and load paths. Only the two narrow
   * painted ceiling strips visible in reference 6 receive floral panels.
   */
  function sanctuaryCeiling({y=7.22,width=17.4,depth=13.8,frameZ=-2.8}={}) {
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
        // Flattened/chased painting relief, not a free-standing gold flower.
        draw(g.rosette,'endwood',[xx,y+.070,z],[.30,.30,.016],[PI/2,0,.12],1.08);
        draw(g.rosette,'oldgold',[xx,y+.067,z],[.245,.245,.015],[PI/2,0,0],.94);
        for(const a of [-1,1])for(const b of [-1,1])
          draw(g.rosette,'endwood',[xx+a*.245,y+.071,z+b*.34],[.075,.075,.008],[PI/2,0,a*b*.3],1.0);
        for(const a of [-1,1])for(const b of [-1,1])
          draw(g.pin,'oldgold',[xx+a*.36,y+.068,z+b*(step*.5-.13)],[.023,.023,.020],[PI/2,0,0],.78);
      }
      for(const edge of [-1,1])box(x+edge*.905,y+.045,0,.045,.13,depth,'black');
      box(x,y+.045,0,.045,.13,depth,'black');
    }
  }

  /** Reference6 wall reconstruction: broad true lattice openings instead of
   * opaque sheets hidden behind 10 of 13 window bays. Replace the old complete
   * side-wall loop, do not overlay it. Returns actual aperture data for light.
   */
  function sanctuarySideWalls({openFromBay=0,windowBottom=1.08,windowTop=5.14,
    clerestoryBottom=5.43,clerestoryTop=6.18}={}) {
    const apertures=[],windowHeight=windowTop-windowBottom;
    for(const side of [-1,1]) {
      const x=side*8.6;
      // The v14 image revealed the old plaster header as a large gray-white
      // slab absent from reference6. Real timber lintels and an upper lattice
      // replace that slab; they remain connected to the side column capitals.
      box(x,6.34,0,.44,.28,13.8,'red');
      box(x,5.28,0,.38,.22,13.8,'red');
      box(x-side*.205,5.16,0,.028,.032,13.78,'darkwood');
      box(x,.53,0,.3,.50,13.5,'darkwood');
      for(let bay=0;bay<=12;bay++) {
        const z=-6.6+bay*1.1,open=bay>=openFromBay;
        const clerestoryY=(clerestoryBottom+clerestoryTop)/2;
        const clerestoryHeight=clerestoryTop-clerestoryBottom;
        for(const zz of [-.53,.53])
          box(x,clerestoryY,z+zz,.30,clerestoryHeight+.08,.085,'red');
        for(let k=0;k<6;k++)
          box(x,clerestoryY,z-.44+k*.176,.075,clerestoryHeight,.035,'endwood');
        box(x,clerestoryY,z,.08,.034,1.04,'endwood');
        // Low waist panel leaves a window extending close to the floor as
        // the reference's side light requires; old solid waist was 1.8 high.
        box(x,.73,z,.34,.66,1.04,'red');
        box(x+side*.19,.74,z,.025,.46,.89,'darkwood');
        if(!open)box(x,(windowBottom+windowTop)/2,z,.28,windowHeight,1.00,'darkwood');
        for(const yy of [windowBottom-.06,windowTop])box(x,yy,z,.36,.12,1.10,'darkwood');
        for(const zz of [-.53,.53])box(x,(windowBottom+windowTop)/2,z+zz,.36,windowHeight+.12,.10,'darkwood');
        for(let a=0;a<7;a++)box(x+side*.2,(windowBottom+windowTop)/2,z-.48+a*.16,.075,windowHeight,.035,'endwood');
        const rows=Math.ceil(windowHeight/.31);
        for(let a=1;a<rows;a++)box(x+side*.21,windowBottom+a*windowHeight/rows,z,.07,.031,1.04,'endwood');
        if(open) {
          const center=new T.Vector3(x,(windowBottom+windowTop)/2,z),normal=new T.Vector3(side,0,0);
          const bottomPoint=new T.Vector3(x,windowBottom,z),topPoint=new T.Vector3(x,windowTop,z);
          let worldWidth=1.0;
          const upperBottom=new T.Vector3(x,clerestoryBottom,z);
          const upperTop=new T.Vector3(x,clerestoryTop,z);
          if(stack) {
            const matrix=stack[stack.length-1];center.applyMatrix4(matrix);normal.transformDirection(matrix);
            bottomPoint.applyMatrix4(matrix);topPoint.applyMatrix4(matrix);
            worldWidth=new T.Vector3().setFromMatrixColumn(matrix,2).length();
            upperBottom.applyMatrix4(matrix);upperTop.applyMatrix4(matrix);
          }
          apertures.push({kind:'sanctuary-side-window',side,bay,localZ:z,
            worldCenter:center.toArray(),worldNormal:normal.toArray(),
            worldBottom:bottomPoint.y,worldTop:topPoint.y,localWidth:1.0,
            worldWidth,worldHeight:topPoint.distanceTo(bottomPoint)});
          apertures.push({kind:'sanctuary-clerestory',side,bay,localZ:z,
            worldCenter:upperBottom.clone().add(upperTop).multiplyScalar(.5).toArray(),
            worldNormal:normal.toArray(),worldBottom:upperBottom.y,
            worldTop:upperTop.y,localWidth:1.0,worldWidth,
            worldHeight:upperTop.distanceTo(upperBottom)});
        }
      }
    }
    return apertures;
  }

  /** Optional reference9 follow-up, called INSIDE one existing pagoda level.
   * This adds physical window paper behind the lattice, never a glowing core.
   * Use a dedicated material key if lighting needs to vary window emission
   * independently of lantern paper. No lights are created by this module.
   */
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

  return {footColumn,brackets,eaves,tileEnd,squareFitting,sanctuaryTransferBeam,
    sanctuaryCeiling,sanctuarySideWalls,pagodaWindowBackings,stats,revision:ARCHITECTURE_REVISION};
}
