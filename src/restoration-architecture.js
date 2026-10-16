import * as T from 'three';
import {timberSweep} from './natural-forms.js';

/*
 * Reconstruction details read from references 4, 5 and 6. All dimensions are
 * LOCAL to world.js's current group. Never bake hallMatrix / towerMatrix here.
 * The geometry is shared between instances, not regenerated for every post.
 */
export const ARCHITECTURE_REVISION = 'reference-joinery-01';

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
  return {hijiki,masu,collar,column,foot,tileSeal,ring,rosette,pin,nail,tenon};
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
        draw(timberSweep(main,.115,.145),'cedar',[0,0,0],[1,1,1]);
        draw(timberSweep(fly,.092,.098),'endwood',[0,0,0],[1,1,1]);
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
  function sanctuaryTransferBeam() {
    box(0,6.48,0,11.0,.34,.34,'red');
    box(0,6.685,0,11.18,.075,.40,'darkwood');
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
  }

  /** Replace the old coffer rosette loop AND its two gold lattice loops.
   * Retain structural depth, open nave and load paths. Only the two narrow
   * painted ceiling strips visible in reference 6 receive floral panels.
   */
  function sanctuaryCeiling({y=7.22,width=17.4,depth=13.8}={}) {
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
    for(const z of [-6.8,0,6.8]) {
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
      if(Math.abs(z)<.18)continue;
      box(0,y+.055,z,width-.10,.16,.082,'endwood');
    }
    // Secondary battens divide each structural bay, visibly narrower and set
    // behind the principal timbers. This supplies the missing scale hierarchy.
    for(let bay=0;bay<xs.length-1;bay++)for(let k=1;k<3;k++) {
      const x=T.MathUtils.lerp(xs[bay],xs[bay+1],k/3);
      box(x,y+.09,0,.060,.11,depth-.12,'endwood');
    }
    for(const side of [-1,1]) {
      const x=side*3.435;
      for(let j=0;j<zCount;j++) {
        const z=-depth/2+(j+.5)*step;
        box(x,y+.115,z,1.01,.046,step-.10,'black');
        box(x,y+.085,z,.90,.018,step-.20,'plaster',0,.94);
        // Flattened/chased painting relief, not a free-standing gold flower.
        draw(g.rosette,'oldgold',[x,y+.071,z],[.24,.24,.022],[PI/2,0,0],.81);
        draw(g.rosette,'darkwood',[x,y+.068,z],[.12,.12,.015],[PI/2,0,.20],.83);
        for(const a of [-1,1])for(const b of [-1,1])
          draw(g.pin,'oldgold',[x+a*.405,y+.068,z+b*(step*.5-.13)],[.023,.023,.020],[PI/2,0,0],.78);
      }
      for(const edge of [-1,1])box(x+edge*.52,y+.045,0,.045,.13,depth,'black');
    }
  }

  return {footColumn,brackets,eaves,tileEnd,squareFitting,sanctuaryTransferBeam,
    sanctuaryCeiling,stats,revision:ARCHITECTURE_REVISION};
}
