import * as T from 'three';

// Scene 06 / 305 R06. Hand-authored 3D interpretation of the original photograph.
// Connected, fluted openwork in three carving scales. The openings are actual
// space between closed solids, and the palmette apertures have bevelled walls.
// No photo, projected mask, image texture, traced pixel skeleton or billboard.
const TAU = Math.PI * 2;
const clamp = T.MathUtils.clamp;
const path = (ps,closed=false) => new T.CatmullRomCurve3(ps.map(p => p.isVector3 ? p.clone() : new T.Vector3(...p)), closed, 'centripetal');

function finish205(p, uv, ix) {
  const kept=[];
  for(let i=0;i<ix.length;i+=3){
    const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3;
    const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2];
    if(Math.hypot(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx)>1e-14)kept.push(ix[i],ix[i+1],ix[i+2]);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(kept);g.computeVertexNormals();
  const shared=new Map(),n=g.attributes.normal;
  for(let i=0;i<p.length/3;i++){const k=[p[i*3],p[i*3+1],p[i*3+2]].map(v=>Math.round(v*1e7)).join(',');if(!shared.has(k))shared.set(k,[]);shared.get(k).push(i);}
  for(const ids of shared.values())if(ids.length>1){const v=new T.Vector3();for(const i of ids)v.add(new T.Vector3().fromBufferAttribute(n,i));v.normalize();for(const i of ids)n.setXYZ(i,v.x,v.y,v.z);}
  g.userData={mandorla205:true,closedCarvedShell:true,coincidentNormalsSmoothed:true,mergeUniqueCarving:true};return g;
}

// Sampling follows actual spline curvature. The former 7/10-station small
// volutes exposed their polygonal centreline in native subfrustum captures.
// This bounds centreline chord error AND tangent turn, adding real stations.
function carvingStations305(state,width,steps) {
  const ts=[0],minSteps=Math.max(16,steps),tolerance=Math.max(width,.070)*.022,turnLimit=.230;
  const rail=(s,u)=>new T.Vector3(s.q.x+s.v.y/s.l*u*s.w,s.q.y-s.v.x/s.l*u*s.w,s.q.z+(u===0?.72:.20)*s.thick+u*s.w*s.twist);
  const deviation=(A,B,M)=>{const AB=B.clone().sub(A),den=AB.lengthSq();return M.distanceTo(A.clone().addScaledVector(AB,den?clamp(M.clone().sub(A).dot(AB)/den,0,1):0));};
  let maxChordError=0,maxTangentTurn=0,unresolvedSegments=0;
  function split(a,b,level=0){
    const m=(a+b)*.5,A=state(a),B=state(b),M=state(m),error=Math.max(...[-1,0,1].map(u=>deviation(rail(A,u),rail(B,u),rail(M,u))));
    const ta=new T.Vector2(A.v.x,A.v.y).normalize(),tm=new T.Vector2(M.v.x,M.v.y).normalize(),tb=new T.Vector2(B.v.x,B.v.y).normalize(),turn=Math.max(ta.angleTo(tm),tm.angleTo(tb),ta.angleTo(tb));
    if(level<12&&(error>tolerance||turn>turnLimit)){split(a,m,level+1);split(m,b,level+1);}else{ts.push(b);maxChordError=Math.max(maxChordError,error);maxTangentTurn=Math.max(maxTangentTurn,turn);if(error>tolerance||turn>turnLimit)unresolvedSegments++;}
  }
  for(let i=0;i<minSteps;i++)split(i/minSteps,(i+1)/minSteps);
  return {ts,tolerance,maxChordError,maxTangentTurn,unresolvedSegments};
}

// Closed section with two rolled shoulders, a hollow central flute, convex
// back and FOUR real bevel facets on each rolled edge. Neither the smooth
// centreline nor edge roundover is a normal-only substitution.
function carving205(curve,width,depth,{steps=40,cols=10,tip=.07,root=.65,flute=1,phase=0,closed=false}={}) {
  const p=[],uv=[],ix=[],section=[],stateCache=new Map();
  const state=t=>{
    if(stateCache.has(t))return stateCache.get(t);
    const q=curve.getPoint(t),v=curve.getTangent(t),l=Math.hypot(v.x,v.y)||1;
    const end=1-(1-tip)*Math.pow(t,3.5),waist=root+(1-root)*Math.sin(Math.PI*Math.min(1,t*1.8))**.55;
    const nominal=width*waist*end*(1+.07*Math.sin(t*(closed?TAU*2:10)+phase));
    // A finite arc estimate averages the Catmull knot curvature transition;
    // the .64 radius margin leaves room for the rolled shoulder itself.
    const lo=Math.max(0,t-.004),hi=Math.min(1,t+.004),A=curve.getPoint(lo),B=curve.getPoint(hi),a=curve.getTangent(lo),b=curve.getTangent(hi);
    const turn=Math.abs(Math.atan2(a.x*b.y-a.y*b.x,a.x*b.x+a.y*b.y)),radius=turn>1e-7?Math.hypot(B.x-A.x,B.y-A.y)/turn:1e6;
    const w=nominal/Math.pow(1+Math.pow(nominal/(radius*.64),4),.25);
    const twist=(closed?.08:.17)*Math.sin(t*(closed?TAU:Math.PI*1.5)+phase),thick=depth*(.65+.35*Math.sin(t*Math.PI))*(.18+.82*end);
    const s={q,v,l,nominal,w,twist,thick};stateCache.set(t,s);return s;
  };
  const sampling=carvingStations305(state,width,steps),ts=sampling.ts;
  const front=u=>{const shoulder=Math.exp(-Math.pow((u-.65)/.24,2))+.78*Math.exp(-Math.pow((u+.62)/.28,2));return .20+.47*Math.max(0,1-u*u)**.58+.43*shoulder*flute;};
  const back=u=>-(.20+.30*Math.max(0,1-u*u)**.75);
  for(let k=0;k<=cols;k++){const u=2*k/cols-1;section.push([u*.94,front(u),k/cols]);}
  for(let k=1;k<4;k++){const a=k/4*Math.PI;section.push([.94+.06*Math.sin(a),T.MathUtils.lerp(front(1),back(1),(1-Math.cos(a))*.5),1]);}
  // The plain convex back needs fewer section samples than the two chased
  // front shoulders; spend those vertices along actual curling silhouettes.
  const backCols=Math.max(4,cols-4);
  for(let k=backCols;k>=0;k--){const u=2*k/backCols-1;section.push([u*.94,back(u),k/backCols]);}
  for(let k=1;k<4;k++){const a=k/4*Math.PI;section.push([-.94-.06*Math.sin(a),T.MathUtils.lerp(back(-1),front(-1),(1-Math.cos(a))*.5),0]);}
  const around=section.length,stride=around+1;
  let narrowed=0;
  for(let j=0;j<ts.length;j++){
    const t=ts[j],{q,v,l,nominal,w,twist,thick}=state(t);
    // Smooth curvature-aware width prevents the inner shoulder folding into
    // a broad lollipop. The ribbon remains finite through every curled tip.
    if(w<nominal*.9)narrowed++;
    for(let k=0;k<=around;k++){
      const [u,z,uTex]=section[k%around];p.push(q.x+v.y/l*u*w,q.y-v.x/l*u*w,q.z+z*thick+u*w*twist);uv.push(uTex,t);
      if(j<ts.length-1&&k<around){const a=j*stride+k,b=a+stride;ix.push(a,a+1,b,a+1,b+1,b);}
    }
  }
  if(closed)for(let k=0;k<=around;k++)for(let a=0;a<3;a++)p[((ts.length-1)*stride+k)*3+a]=p[k*3+a];
  if(!closed)for(const j of[0,ts.length-1]){
    const centre=p.length/3,q=curve.getPoint(j?1:0);p.push(q.x,q.y,q.z);uv.push(.5,j?1:0);
    for(let k=0;k<around;k++){const a=j*stride+k;j===0?ix.push(centre,a+1,a):ix.push(centre,a,a+1);}
  }
  const g=finish205(p,uv,ix);g.userData.closedFlutedCarving205=true;g.userData.realCurvatureSampling305={stations:ts.length,sectionVertices:around,curvatureNarrowedStations:narrowed,chordTolerance:sampling.tolerance,actualMaxRailChordError:sampling.maxChordError,actualMaxTangentTurn:sampling.maxTangentTurn,unresolvedSegments:sampling.unresolvedSegments,edgeBevelSegments:4};return g;
}

function seed205(text){let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return h>>>0;}
function branchingRelief205(seed,mirror,fine,family,longEdge=false) {
  // Four authored carving families have distinct silhouette and void rhythm.
  // Their lobes vary per actual position; there is no repeated flame stamp.
  let state=seed;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const bend=rand()*.20-.10,stretch=.92+rand()*.22;
  const designs=[
    [[0,0],[.18,.18],[.34,.41],[.25,.68],[.01,.79],[-.18,.62],[-.09,.46],[.09,.51],[.06,.65]],
    [[0,0],[-.18,.17],[-.25,.42],[-.11,.66],[.15,.83],[.22,1.03],[.08,1.16]],
    [[0,0],[.13,.17],[.09,.40],[-.05,.65],[.08,.89],[.26,1.13]],
    [[0,0],[.24,.13],[.37,.34],[.21,.56],[-.04,.53],[-.17,.34],[.01,.24],[.14,.33],[.10,.44]],
  ];
  if(longEdge)designs[2]=[[0,0],[.07,.19],[-.02,.43],[-.10,.68],[-.03,.92],[.13,1.12],[.08,1.23]];
  const ps=designs[family].map(([x,y],i)=>[x+bend*y+.035*Math.sin(i*1.73+seed%19)*Math.sin(Math.PI*i/(designs[family].length-1)),y*stretch,.09*y*y]);
  const spine=path(ps),parts=[carving205(spine,(family===0?.125:.105)*( .91+rand()*.16),.044,{steps:fine?16:22,cols:fine?8:10,root:.74,tip:.018,phase:rand()*TAU})];
  const lobes=fine?2:3,hand=rand()>.5?1:-1;
  for(let i=0;i<lobes;i++){
    const t=.19+i*(fine?.25:.18),q=spine.getPoint(t),sg=hand*(i%2?-1:1),width=(.22+rand()*.13)*(i===2?.80:1)*(longEdge?.80:1),rise=(.25+rand()*.18)*(i===2?.78:1)*(longEdge?1.20:1);
    const pp=[q,q.clone().add(new T.Vector3(sg*width*.56,rise*.18,.018)),q.clone().add(new T.Vector3(sg*width,rise*.66,.045)),q.clone().add(new T.Vector3(sg*width*.72,rise,.080)),q.clone().add(new T.Vector3(sg*width*.20,rise*.94,.105)),q.clone().add(new T.Vector3(sg*width*.10,rise*.58,.115)),q.clone().add(new T.Vector3(sg*width*.44,rise*.43,.13))];
    if(i===0){
      // The old descending hook then jumped to an ascending stem point,
      // producing near-cusps in XY and abrupt carved-section reversals.
      // Route the whole return continuously back into its physical root.
      const root=spine.getPoint(Math.min(.90,t+.31)),returnShoulder=pp[3].clone().lerp(root,.5).add(new T.Vector3(sg*width*.10,rise*.10,.025));
      pp[4]=returnShoulder;pp[5]=returnShoulder.clone().lerp(root,.65);pp[6]=root;
    }
    parts.push(carving205(path(pp),(.052+.014*rand())*(i===2?.85:1),fine?.030:.034,{steps:fine?16:20,cols:fine?8:10,root:.73,tip:i===0?.18:.015,phase:rand()*TAU}));
  }
  const p=[],uv=[],ix=[];for(const g of parts){const offset=p.length/3,pp=g.attributes.position.array,ii=g.index.array;for(let j=0;j<pp.length;j+=3)p.push(pp[j]*mirror,pp[j+1],pp[j+2]);uv.push(...g.attributes.uv.array);for(let j=0;j<ii.length;j+=3)mirror>0?ix.push(offset+ii[j],offset+ii[j+1],offset+ii[j+2]):ix.push(offset+ii[j],offset+ii[j+2],offset+ii[j+1]);g.dispose();}
  const g=finish205(p,uv,ix);g.userData.branchingRolledRelief205=true;g.userData.carvedFamily=family;g.userData.curvatureSampling305=parts.map(p=>p.userData.realCurvatureSampling305);g.userData.voids='between physically overlapping rooted closed ribbon lobes';return g;
}

function nimbus205() {
  const p=[],uv=[],ix=[],rings=16,around=120,stride=(rings+1)*(around+1);
  for(let skin=0;skin<2;skin++)for(let j=0;j<=rings;j++)for(let i=0;i<=around;i++){
    const r=j/rings,a=TAU*i/around,tip=.08*Math.max(0,Math.cos(a))**8;
    p.push(Math.sin(a)*r,(Math.cos(a)+tip)*r,skin===0?.015+.04*r*r:-.055);uv.push((Math.sin(a)*r+1)/2,(Math.cos(a)*r+1)/2);
    if(j<rings&&i<around){const a=skin*stride+j*(around+1)+i,b=a+around+1;skin===0?ix.push(a,a+1,b,a+1,b+1,b):ix.push(a,b,a+1,a+1,b,b+1);}
  }
  for(let i=0;i<around;i++){const a=rings*(around+1)+i,b=a+stride;ix.push(a,a+1,b,a+1,b+1,b);}
  const g=finish205(p,uv,ix);g.userData.closedLacquerCup205=true;return g;
}


function chasedAnnularScale205(R,angle,s) {
  const p=[],uv=[],ix=[],rows=8,cols=6,stride=(rows+1)*(cols+1);
  for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
    const v=j/rows,u=k/cols,a=(u-.5)*angle,r=R*(.785+.148*v+.006*Math.sin(Math.PI*u)*Math.sin(Math.PI*v));
    const crest=Math.sin(Math.PI*u)**.5*Math.sin(Math.PI*v)**.45;
    const chisel=.56+.44*Math.exp(-Math.pow((v-.48-.24*Math.sin(u*TAU))/.15,2));
    p.push(Math.sin(a)*r,Math.cos(a)*r,skin===0?(.004+.012*crest*chisel)*s:-.004*s);uv.push(u,v);
    if(j<rows&&k<cols){const n=skin*stride+j*(cols+1)+k,m=n+cols+1;skin===0?ix.push(n,n+1,m,n+1,m+1,m):ix.push(n,m,n+1,n+1,m,m+1);}
  }
  for(let j=0;j<rows;j++)for(const e of[0,cols]){const a=j*(cols+1)+e,b=a+cols+1,c=a+stride,d=b+stride;e===0?ix.push(a,b,c,c,b,d):ix.push(a,c,b,c,d,b);}
  for(const j of[0,rows])for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+stride,d=b+stride;j===0?ix.push(a,c,b,b,c,d):ix.push(a,b,c,b,d,c);}
  const g=finish205(p,uv,ix);g.userData.chasedSolidAnnularScale205=true;return g;
}

export function buildMandorla205(b,{height:H,halfWidth:W,headCenter:cy,isMain}) {
  const s=H/4.52,R=(isMain?.665:.37)*s,fan=R*(isMain?1.52:1.43);
  const stats={revision:'mandorla305-r06-folded-front-and-rooted-back-head-foliation',height:H,halfWidth:W,headCenter:cy,isMain,triangles:0,primaryRibbons:0,secondaryRibbons:0,carvedGroups:0,connectedRootCount:0,layeredHeadCarvings:0,visualAccepted:false};
  if(!b.materials.mandorla205Nimbus){const m=b.materials.haloLacquer.clone();m.name='scene06-mandorla205-carbon-indigo-lacquer';m.color.set('#02050a');m.metalness=0;m.roughness=.86;m.ior=1.22;m.specularIntensity=.03;m.clearcoat=0;m.envMapIntensity=.08;b.materials.mandorla205Nimbus=m;}
  const add=(g,mat,...args)=>{stats.triangles+=g.index?g.index.count/3:g.attributes.position.count/3;b.add(g,mat,...args);};
  const ribbon=(tag,points,w,d,mat='gold',options={})=>{const c=points instanceof T.Curve?points:path(options.closed?points.slice(0,-1):points,!!options.closed),g=b.geometry(`305r03:${isMain}:${tag}`,()=>carving205(c,w,d,options));add(g,mat);stats.secondaryRibbons++;stats.connectedRootCount++;return c;};
  const carvedGroup=(tag,p,a,L,width,mirror=1,variant=0,mat='gold')=>{
    const edge=tag.startsWith('edge-flame'),family=edge||tag.startsWith('ray')||tag.startsWith('crown')?2:p.y/H<.34?0:p.y/H<.70?1:3;
    const fine=L<.205*s,seed=seed205(`${isMain}:${tag}`),g=b.geometry(`305r03-branching:${isMain}:${tag}:${fine}:${family}`,()=>branchingRelief205(seed,mirror,fine,family,edge));
    if(edge){L*=1.10;width*=.80;}
    if(tag.startsWith('scroll-split')||tag.startsWith('interlaced-return')){L*=1.20;width*=1.25;}
    if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox,dy=Math.max(-Math.sin(a)*width*bb.min.x,-Math.sin(a)*width*bb.max.x)+Math.max(Math.cos(a)*L*bb.min.y,Math.cos(a)*L*bb.max.y);
    if(dy>0&&p.y+dy>H-.002*s){const f=clamp((H-.002*s-p.y)/dy,.08,1);L*=f;width*=f;}
    const low=Math.min(-Math.sin(a)*width*bb.min.x,-Math.sin(a)*width*bb.max.x)+Math.min(Math.cos(a)*L*bb.min.y,Math.cos(a)*L*bb.max.y);
    if(low<0&&p.y+low<-.0004*s){const f=clamp((p.y+.0004*s)/(-low),.05,1);L*=f;width*=f;}
    // Mirrored vertices and reversed indices retain front relief and winding.
    add(g,mat,p.x,p.y,p.z,width,L,L*.58,0,0,-a);stats.carvedGroups++;stats.connectedRootCount++;
  };
  const outline=t=>{t=clamp(t,0,1);return W*(isMain?1.045:1.077)*Math.pow(t/.40,.60)*Math.pow((1-t)/.60,.90);};
  const at=(side,t,f=1,z=0)=>new T.Vector3(side*outline(t)*f,H*t,z);
  const outsideHead=(x,y)=>{const dy=y-cy;return y<cy-R*.40||x*x+dy*dy>(fan+.035*s)**2;};
  const rims={};
  for(const side of[-1,1]){
    const ps=[];for(let i=0;i<=64;i++)ps.push(at(side,(.018*s+(H-.0183*s)*i/64)/H,.992,-.040));
    rims[side]=ribbon(`continuous-carved-border-${side}`,ps,.015*s,.010*s,'oldgold',{steps:100,cols:10,root:.55,tip:.05,phase:side});
    ribbon(`hidden-basal-carved-root-${side}`,[[0,.10*s,-.04],[side*.075*s,.055*s,-.04],ps[0]],.014*s,.009*s,'oldgold',{steps:12,cols:6,root:1,tip:.85});
    // The outer edge is a sequence of long returned flames. Each root enters
    // the carved moulding; no parallel wire rails or horizontal scaffold.
    const levels=[.070,.124,.181,.236,.291,.348,.408,.463,.522,.579,.635,.686,.737,.783,.828,.869,.905,.937];
    levels.forEach((t,k)=>{
      const p=at(side,t,.99,-.010),d=rims[side].getTangent(t),a=Math.atan2(d.x,d.y)-side*(.32+.08*Math.sin(k*1.4));
      const L=(.28-.065*t+.035*Math.sin(k*1.61))*s;
      carvedGroup(`edge-flame-${side}-${k}`,p,a,L,.15*s,side,k%12,k%4===2?'oldgold':'gold');
    });
    // A small family of continuously rising, curved cast branches carries
    // dense local upright returns. Each break seats into the aureole rim.
    // There is no horizontal row lattice and no large empty oval carrier.
    const columns=isMain?[.15,.35,.55,.74,.90]:[.24,.53,.83];
    columns.forEach((fraction,col)=>{
      const segments=[];let points=[];
      for(let n=0;n<=84;n++){
        const t=.014+.954*n/84,x=outline(t)*(fraction+.060*Math.sin(t*11+col*1.51)*Math.sin(Math.PI*t))+.015*s*Math.sin(t*23+col);
        const q=new T.Vector3(side*x,H*t,-.030-.009*Math.cos(t*15+col));
        if(outsideHead(x,q.y)){points.push(q);}else if(points.length){segments.push(points);points=[];}
      }
      if(points.length)segments.push(points);
      segments.forEach((ps,seg)=>{
        if(ps.length<3)return;
        for(const end of[0,ps.length-1]){
          const q=ps[end],r=Math.hypot(q.x,q.y-cy);
          if(Math.abs(r-fan)<.15*s&&q.y>cy-R*.6){q.x*=fan/r;q.y=cy+(q.y-cy)*fan/r;q.z=-.018;}
        }
        const c=ribbon(`ascending-cast-branch-${side}-${col}-${seg}`,ps,(col%2?.012:.019)*s,.0075*s,col%2?'oldgold':'gold',{steps:Math.max(24,ps.length),cols:8,root:.70,tip:.45,phase:col});stats.primaryRibbons++;
        const count=Math.max(2,Math.floor(c.getLength()/((isMain?.206:.195)*s)));
        for(let k=0;k<count;k++){
          const u=(k+.35)/count,q=c.getPointAt(u),d=c.getTangentAt(u),turn=(k+col)%2?1:-1;
          const a=Math.atan2(d.x,d.y)+side*(.28*Math.sin(k*1.93+col)+turn*.16),L=(.20+.035*Math.sin(k*1.43+col*.71))*s;
          const local=([x,y,z=0])=>new T.Vector3(q.x+(x*Math.cos(a)+y*Math.sin(a))*L,q.y+(-x*Math.sin(a)+y*Math.cos(a))*L,q.z+z*s);
          const scrollPoints=[[0,0,0],[.24*turn,.20,.010],[.38*turn,.54,.021],[.12*turn,.90,.035],[-.24*turn,.83,.045],[-.30*turn,.55,.054],[-.12*turn,.41,.059],[.08*turn,.51,.061],[.02*turn,.67,.064]].map(local);
          if(!scrollPoints.every(p=>p.y>.006*s&&outsideHead(Math.abs(p.x),p.y)))continue;
          const curl=ribbon(`upright-carved-volute-${side}-${col}-${seg}-${k}`,scrollPoints,(.010+.0015*Math.sin(k+col))*s,.0058*s,k%4===0?'oldgold':'gold',{steps:20,cols:6,tip:.09,root:.83,phase:k*.87});
          for(let j=0;j<3;j++){
            const t=[.16,.43,.70][j],p=curl.getPoint(t),v=curl.getTangent(t),theta=a+side*(j===1?-.36:j===0?.36:.58)+.13*Math.sin(k+col*1.7);
            const length=(j===1?.152:j===0?.178:.115)*s*(.93+.10*Math.sin(k*1.9+col+j));
            if(outsideHead(Math.abs(p.x),p.y+length*.50))carvedGroup(`scroll-split-flame-${side}-${col}-${seg}-${k}-${j}`,p,theta,length,(j===1?.112:j===0?.149:.080)*s,side*(j%2?turn:-turn),(k*3+col*5+j)%12,j===2?'oldgold':'gold');
          }

        }
      });
    });
  }
  for(const side of[-1,1]){
    const columns=isMain?[.15,.35,.55,.74,.90]:[.24,.53,.83];
    const branchPoint=(fraction,col,t)=>new T.Vector3(side*(outline(t)*(fraction+.060*Math.sin(t*11+col*1.51)*Math.sin(Math.PI*t))+.015*s*Math.sin(t*23+col)),H*t,-.030-.009*Math.cos(t*15+col));
    for(let col=0;col<columns.length-1;col++)for(let k=0;k<(isMain?12:10);k++){
      const t=.085+k*(isMain?.066:.078)+.012*Math.sin(k*1.79+col),sg=(k+col)%2?1:-1,A=branchPoint(columns[col],col,t),B=branchPoint(columns[col+1],col+1,t+sg*.027);
      const mid=A.clone().lerp(B,.5).add(new T.Vector3(side*.020*s,sg*.065*s,.024*s));
      if(![A,B,mid].every(q=>outsideHead(Math.abs(q.x),q.y)))continue;
      const c=ribbon(`short-interwoven-cast-${side}-${col}-${k}`,[A,A.clone().lerp(mid,.6).add(new T.Vector3(0,-sg*.025*s,.014*s)),mid,B.clone().lerp(mid,.35).add(new T.Vector3(0,sg*.022*s,.012*s)),B],.012*s,.0055*s,k%3?'oldgold':'gold',{steps:20,cols:8,root:.85,tip:.85,phase:col+k});
      if(k%2===0){const q=c.getPoint(.5);carvedGroup(`interlaced-return-${side}-${col}-${k}`,q,side*.23,.15*s,.105*s,side*(k%4?1:-1),(k+col)%12,'gold');}
    }
  }
  // Crown: nested upright ogival ribs, high relief split palmettes and
  // terminal curl. Each root meets the upper border or its companion.
  for(const side of[-1,1]){
    for(let k=0;k<3;k++){
      const t=.79+k*.035,q=at(side,t,.98,-.02),end=new T.Vector3(side*(.035+.055*k)*s,H-(.13+.14*k)*s,.025);
      const c=ribbon(`crown-ogive-${side}-${k}`,[q,new T.Vector3(side*outline(t)*(.73-.10*k),H*(.875+.012*k),.025),end,new T.Vector3(side*(.025+.048*k)*s,H-(.22+.15*k)*s,.075)],(.022-.004*k)*s,.009*s,'gold',{steps:46,cols:10,root:.85,tip:.04,phase:k});stats.primaryRibbons++;
      for(let j=0;j<2;j++){const p=c.getPoint(.24+j*.36),d=c.getTangent(.24+j*.36);carvedGroup(`crown-flame-${side}-${k}-${j}`,p,Math.atan2(d.x,d.y)-side*.28,(.25-.025*k)*s,.14*s,side,(k*3+j+4)%12,'gold');}
    }
  }
  const apex=path([[0,H-.36*s,-.03],[.035*s,H-.20*s,.018],[0,H-.075*s,.035],[0,H,.018]]);
  ribbon('axial-crown-tip',apex,.026*s,.009*s,'gold',{steps:36,cols:10,tip:.01,root:.72});

  // The photograph has an almost black head field, including the recesses
  // between its few broad rays. A closed lacquered head cup carries those
  // rays; it has real thickness and is limited to the head aureole.
  const cup=b.geometry('205r15-closed-head-aureole',nimbus205);add(cup,'mandorla205Nimbus',0,cy,-.086,fan*.965,fan*.965,fan*.965);
  for(const [radius,width,z,mat]of[[R*.78,.009,.019,'gold'],[R*.94,.012,.014,'oldgold'],[R,.010,.025,'gold'],[fan,.011,-.018,'oldgold']]){
    const points=[];for(let k=0;k<=128;k++){const a=k/128*TAU;points.push([Math.sin(a)*radius,cy+Math.cos(a)*radius,z]);}
    ribbon(`head-ring-${radius}`,points,width*s,.012*s,mat,{steps:128,cols:8,root:1,tip:1,phase:0,flute:.4,closed:true});
  }
  // A narrow embossed gold band is divided by hairline chased slots.
  // Its raised scales are real closed relief, not a wire clock face.
  const chased=isMain?76:60,scale=b.geometry(`205r15-chased-band-${isMain}`,()=>chasedAnnularScale205(R,TAU/chased*.94,s));
  for(let k=0;k<chased;k++)add(scale,k%7===0?'oldgold':'gold',0,cy,.025,1,1,1,0,0,k/chased*TAU);
  const rays=isMain?21:17,headRays=[];
  for(let k=0;k<rays;k++){
    const a=-Math.PI*.59+k/(rays-1)*Math.PI*1.18,pol=(r,d=0,z=0)=>new T.Vector3(Math.sin(a+d)*r,cy+Math.cos(a+d)*r,z);
    const c=ribbon(`head-ogival-ray-${k}`,[pol(R*.99,0,.015),pol(R*1.13,.026*Math.sin(k*1.57),.020),pol(fan*.88,.042*Math.sin(k*1.41),.007),pol(fan,0,-.014)],.006*s,.007*s,'gold',{steps:24,cols:8,root:.90,tip:.78,flute:.5});
    headRays.push(c);
    if(k>0&&k<rays-1){
      const p=c.getPoint(.35),L=(isMain?.31:.225)*s*(.88+.14*Math.sin(k*1.13));
      carvedGroup(`ray-flame-return-${k}`,p,a,L,(isMain?.17:.128)*s,k%2?1:-1,(k+2)%12,'gold');
      if(k%2===0){const p2=c.getPoint(.13);carvedGroup(`ray-inner-carved-return-${k}`,p2,a+(k%4?.17:-.17),L*.53,(isMain?.12:.09)*s,k%2?-1:1,(k+7)%12,'oldgold');}
    }
  }

  // The HD head field carries a second scale of foliate carving between the
  // main rays. Each new carrier enters TWO existing cast rays; its leaves
  // grow out of that carrier and rise into two physical relief levels.
  // Nonuniform rooted forks replace the former single-plane radial voids.
  // These are closed fluted solids, not instanced leaf cards or texture fill.
  const rayStep=Math.PI*1.18/(rays-1),radial=(r,a,z)=>new T.Vector3(Math.sin(a)*r,cy+Math.cos(a)*r,z);
  for(let k=0;k<rays-1;k++){
    const a0=-Math.PI*.59+k*rayStep,midA=a0+rayStep*.5,hand=Math.sin(k*2.399+.41)>0?1:-1;
    const first=hand>0?k:k+1,last=hand>0?k+1:k;
    const root=headRays[first].getPoint(.17+.055*Math.sin(k*1.41+.27));
    const seat=headRays[last].getPoint(.65+.105*Math.sin(k*1.73+.67));
    const mid=root.clone().lerp(seat,.52).add(new T.Vector3(Math.sin(midA)*.016*s,Math.cos(midA)*.016*s,-.026*s));
    const carrier=ribbon(`head-secondary-rooted-carrier-${k}`,[root,root.clone().lerp(mid,.52),mid,seat.clone().lerp(mid,.38),seat],.0050*s,.0055*s,'oldgold',{steps:24,cols:6,root:.84,tip:.82,flute:.55,phase:k*.79});
    stats.layeredHeadCarvings++;
    const count=k%5===2?2:3;
    for(let j=0;j<count;j++){
      const u=count===2?[.25,.55][j]:[.16,.35,.62][j],q=carrier.getPoint(u),r=Math.hypot(q.x,q.y-cy);
      const length=(isMain?(j===1?.187:.135):(j===1?.104:.080))*s*(.90+.16*Math.sin(k*1.37+j*1.93));
      const maxR=R+(fan-R)*(.86+.12*(.5+.5*Math.sin(k*1.61+j*2.07)));
      const tipR=Math.min(maxR,r+length),tipA=a0+rayStep*(.51+.27*Math.sin(k*1.47+j*2.2));
      const frontZ=(j===1?.082:.038)*s+.009*s*Math.sin(k*1.83+j);
      const tip=radial(tipR,tipA,frontZ-(j===1?.014:.006)*s),direction=tip.clone().sub(q),l=Math.hypot(direction.x,direction.y)||1;
      const bow=new T.Vector3(direction.y/l,-direction.x/l,.12).multiplyScalar(hand*((j===1?.026:.014)+.004*Math.sin(k+j))*s);
      // A short lifted sheath opens into a curved leaf belly, then folds
      // back at the tip. The former constant Z ramp made a flat dark wedge
      // over most of each blade. This is an actual3D change in surface form.
      const sheath=q.clone().lerp(tip,.27).addScaledVector(bow,.70),belly=q.clone().lerp(tip,.68).add(bow);
      sheath.z=frontZ-.004*s;belly.z=frontZ+(j===1?.010:.006)*s;
      const leaf=ribbon(`head-secondary-fluted-blade-${k}-${j}`,[q,sheath,belly,tip],(j===1?.024:.015)*s*(.90+.18*Math.sin(k*.79+j*1.6)),(j===1?.014:.009)*s,j!==1&&(k+j)%5===1?'oldgold':'gold',{steps:20,cols:8,root:.40,tip:.020,flute:1.10,phase:k*.53+j});
      stats.layeredHeadCarvings++;
      // Selected side buds split from an actual blade shoulder. Their short
      // swept tips occupy a different depth and never form an annular row.
      if(Math.sin(k*2.17+j*1.33)>.45){
        const budRoot=leaf.getPoint(.48),budR=Math.hypot(budRoot.x,budRoot.y-cy),budA=Math.atan2(budRoot.x,budRoot.y-cy);
        const budTip=radial(Math.min(fan*.98,budR+.056*s),budA-hand*rayStep*.31,budRoot.z+.016*s);
        ribbon(`head-secondary-rooted-split-${k}-${j}`,[budRoot,budRoot.clone().lerp(budTip,.30).add(new T.Vector3(hand*.009*s,.007*s,.008*s)),budRoot.clone().lerp(budTip,.73),budTip],.0080*s,.0065*s,'gold',{steps:16,cols:6,root:.45,tip:.022,flute:.85,phase:k+j*.71});
        stats.layeredHeadCarvings++;
      }
    }
  }
  b.root.userData.mandorla205??=[];b.root.userData.mandorla205.push(stats);
  // Local, declared replacement budget only. Adaptive high-curvature solids
  // replace the nearly saturated historical 1,987,536-triangle R15 geometry.
  // Scene captures still run under the unchanged official shared GPU FIFO.
  if(b.root.userData.mandorla205.reduce((n,r)=>n+r.triangles,0)>10_000_000)throw Error('Mandorla305 exceeded ten-million adaptive replacement triangle budget');
}
