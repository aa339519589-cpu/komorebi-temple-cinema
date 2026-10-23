import {T,V} from './kernel.js';
import {layout as L} from './layout117.js';

// Scene02 physical garden recovery210. All positions are real world or
// bridge-local metres. Reference photographs are comparison inputs only.
const G=L.bridge,H=7.5,TAU=Math.PI*2;
export const bridgeMatrix210=new T.Matrix4().compose(V(G.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),G.yaw),V(G.scale));
const inverse=bridgeMatrix210.clone().invert(),world=(u,v)=>V([u,0,v]).applyMatrix4(bridgeMatrix210);
export const deck210=x=>1.31+G.archRise*(1-(x/H)**2)+G.slope*x/H;
export function waterPassage210(x,z,margin=0){const p=V([x,G.position[1],z]).applyMatrix4(inverse);return Math.abs(p.x)<H-.62+margin/G.scale[0]&&Math.abs(p.z)<1.72+margin/G.scale[2];}

function cleanMesh210(g){const p=g.attributes.position,index=g.index?.array??Array.from({length:p.count},(_,i)=>i),kept=[];for(let i=0;i<index.length;i+=3){const [a,b,c]=Array.from(index.slice(i,i+3)).map(j=>new T.Vector3().fromBufferAttribute(p,j));if(b.sub(a).cross(c.sub(a)).lengthSq()>1e-20)kept.push(index[i],index[i+1],index[i+2]);}g.setIndex(kept);g.computeVertexNormals();return g;}
function clean(poly){let p=poly.filter((a,i)=>!i||Math.hypot(a[0]-poly[i-1][0],a[1]-poly[i-1][1])>1e-8);if(p.length>2&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-8)p.pop();const area=p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0);if(p.length<3||Math.abs(area)<1e-9)return[];return area<0?p.reverse():p;}
function clip(poly,a,b,inside=true){const side=p=>(inside?1:-1)*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])),out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],sp=side(p),sq=side(q);if(sp>=-1e-9)out.push(p);if((sp>=-1e-9)!==(sq>=-1e-9)){const t=sp/(sp-sq);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}}return clean(out);}
function subtract(poly,hole){let current=clean(poly),kept=[];hole=clean(hole);for(let i=0;i<hole.length&&current.length;i++){const a=hole[i],b=hole[(i+1)%hole.length],outside=clip(current,a,b,false);if(outside.length)kept.push(outside);current=clip(current,a,b,true);}return kept;}
function hull(points){const p=points.map(q=>q.slice()).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];for(const q of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),q)<=0)lo.pop();lo.push(q);}for(const q of p.slice().reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),q)<=0)hi.pop();hi.push(q);}return clean(lo.slice(0,-1).concat(hi.slice(0,-1)));}
function solid(poly,lo,hi,name){
 poly=clean(poly);if(poly.length<3||hi<=lo)return null;const shape=new T.Shape();shape.moveTo(poly[0][0],-poly[0][1]);for(const q of poly.slice(1))shape.lineTo(q[0],-q[1]);shape.closePath();
 const g=new T.ExtrudeGeometry(shape,{depth:hi-lo,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);g.translate(0,lo,0);g.name=name;return g;
}
function block(b,poly,lo,hi,mat,name){const g=solid(poly,lo,hi,name);if(g)b.put(g,mat);}
function localPoly(a,c,d,e){return[[a,d],[c,d],[c,e],[a,e]].map(([u,v])=>{const p=world(u,v);return[p.x,p.z];});}
function ribbon(top,bottom,z,depth,name,x0=-H,x1=H){const shape=new T.Shape(),N=Math.max(4,Math.ceil((x1-x0)/.125));shape.moveTo(x0,top(x0));for(let i=1;i<=N;i++){const x=x0+(x1-x0)*i/N;shape.lineTo(x,top(x));}for(let i=N;i>=0;i--){const x=x0+(x1-x0)*i/N;shape.lineTo(x,bottom(x));}shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});g.translate(0,0,z-depth/2);g.name=name;return cleanMesh210(g);}
function board(x0,x1,z0,z1,top,bottom,name){return ribbon(top,bottom,(z0+z1)/2,z1-z0,name,x0,x1);}
function closedBox(w,h,d,name){const g=new T.BoxGeometry(w,h,d);g.name=name;return g;}

export function buildBridge210({b,mats,fitting}){
 const stats={revision:210,piers:[],bents:[],closedDeckPlanks:64,archGirders:3,referenceCameraChanged:false,visualAccepted:false};
 b.at(G.position,G.yaw,()=>{
  // Three paired timbers carry real cross-joists; small exposed ends replace
  // the old oversized diagonal dark strips applied to the fascia.
  for(const z of[-1.18,0,1.18]){
   b.put(ribbon(x=>deck210(x)-.20,x=>deck210(x)-.38,z,.29,'structure210-upper-arched-girder'),'bridgeRed161');
   b.put(ribbon(x=>deck210(x)-.38,x=>deck210(x)-.58,z,.29,'structure210-lower-arched-girder'),'bridgeCedar161');
  }
  for(let j=0;j<17;j++){const x=-H+.16+(2*H-.32)*j/16;b.put(board(x-.068,x+.068,-1.39,1.39,t=>deck210(t)-.12,t=>deck210(t)-.20,'structure210-cross-joist-bearing-on-girders'),'bridgeCedar161');}
  for(let i=0;i<64;i++){const a=-H+2*H*i/64+.003,c=-H+2*H*(i+1)/64-.003;b.put(board(a,c,-1.44,1.44,deck210,x=>deck210(x)-.12,'structure210-closed-transverse-deck-plank'),'bridgeCedar161',[0,0,0],[1,1,1],[0,0,0],.94+.05*Math.sin(i*.91));}
  for(const side of[-1,1]){
   for(const [height,thick,wide]of[[.70,.115,.125],[.36,.10,.11],[.095,.11,.11]])b.put(ribbon(x=>deck210(x)+height+thick/2,x=>deck210(x)+height-thick/2,side*1.50,wide,'structure210-continuous-curved-guard-rail'),'bridgeRed161');
   b.put(ribbon(x=>deck210(x)-.06,x=>deck210(x)-.18,side*1.47,.055,'structure210-deck-edge-fascia'),'bridgeRed161');
   for(let i=0;i<=8;i++){
    const x=-H+2*H*i/8,y=deck210(x),z=side*1.50,major=i%2===0,w=major?.23:.16;
    b.put(closedBox(w,.83,w,'structure210-guard-post'),'bridgeRed161',[x,y+.315,z]);
    if(major){const cap=new T.LatheGeometry([[0,0],[.135,0],[.137,.025],[.104,.05],[.10,.09],[.145,.14],[.128,.19],[.067,.24],[.024,.29],[0,.31]].map(q=>new T.Vector2(...q)),32);cap.name='structure210-small-bronze-giboshi';b.put(cleanMesh210(cap),'oldgold',[x,y+.745,z]);b.at([x,y-.27,side*1.354],side>0?0:Math.PI,()=>fitting(0,0,0,.30,.26));}
    if(i<8)for(const t of[.33,.67]){const xx=x+2*H/8*t;b.put(closedBox(.07,.24,.075,'structure210-short-guard-infill'),'bridgeRed161',[xx,deck210(xx)+.225,z]);}
   }
  }
  // Slender, jointed stone bents leave water visible through the span. Each
  // timber cap follows the actual curved girder underside, not a flat gap.
  for(const x of[-7.12,-3.60,0,3.60,7.12]){
   const lo=Math.min(deck210(x-.22),deck210(x+.22))-.80,top=deck210(x)-.58;
   b.put(board(x-.22,x+.22,-1.38,1.38,a=>deck210(a)-.58,()=>lo,'structure210-fitted-transverse-pier-cap'),'bridgeCedar161');
   for(const z of[-1.0,1.0]){
    const base=.08-G.position[1],rows=Math.max(2,Math.ceil((lo-base)/.40)),height=(lo-.055-base)/rows;
    b.put(closedBox(.91,.22,.78,'structure210-submerged-stone-pier-foot'),'terraceBody',[x,-.03-G.position[1],z]);
    for(let row=0;row<rows;row++){
     const w=.59-.055*row/rows,depth=.54-.035*row/rows,y=base+(row+.5)*height;
     b.put(closedBox(w,height-.009,depth,'structure210-closed-granite-pier-course'),'terraceBody',[x,y,z],[1,1,1],[0,0,0],.84+.09*Math.sin(row*1.91+x));
     if(row<rows-1)b.put(closedBox(w-.014,.009,depth-.014,'structure210-pier-mortar-bed'),'stone',[x,base+(row+1)*height,z]);
    }
    b.put(closedBox(.57,.0045,.52,'structure210-pier-foot-bedding'),'stone',[x,base+.00225,z]);
    b.put(closedBox(.52,.0045,.50,'structure210-pier-cap-bedding'),'stone',[x,lo-.05725,z]);
    b.put(closedBox(.69,.055,.65,'structure210-stone-pier-bearing-pad'),'terraceCheek',[x,lo-.0275,z]);
    stats.piers.push({localCenter:[x,z],worldBaseY:.08,worldTopY:G.position[1]+lo,rows});
   }
   stats.bents.push({localX:x,girderSoffitLocalY:top,capBottomLocalY:lo,curvedBearing:true});
  }
 },G.scale);
 return stats;
}

export function buildBridgeApproaches210({b,stairTop,stairBottom,stairWidth}){
 const E=H+2.10,outer=E+1.12,v0=-1.45,v1=1.45,footY=stairBottom.y,forward=stairBottom.clone().sub(stairTop).setY(0).normalize(),across=V([-forward.z,0,forward.x]),front=stairBottom.clone().addScaledVector(forward,.71),a=front.clone().addScaledVector(across,stairWidth/2),c=front.clone().addScaledVector(across,-stairWidth/2),approach=localPoly(H,E,v0,v1),edge=localPoly(E,outer,v0,v1),court=hull([[a.x,a.z],[c.x,c.z],...edge]),cells=subtract(court,approach);
 for(const sign of[-1,1]){
  const endY=G.position[1]+deck210(sign*H),target=sign>0?footY:.90;
  for(let i=0;i<3;i++){
   const a=sign*(H+2.10*i/3),c=sign*(H+2.10*(i+1)/3),y=endY+(target-endY)*(i+1)/3,poly=localPoly(Math.min(a,c),Math.max(a,c),v0,v1);
   block(b,poly,-.16,y-.10,'terraceBody','structure210-continuous-approach-stair-bearing');block(b,poly,y-.10,y,'terraceTread','structure210-closed-bridge-approach-tread');
  }
  if(sign<0){const poly=localPoly(-outer,-E,v0,v1);block(b,poly,-.18,.80,'terraceBody','structure210-west-shore-landing-footing');block(b,poly,.80,.90,'terraceTread','structure210-west-shore-level-landing');}
 }
 for(const cell of cells)block(b,cell,-.18,footY-.10,'terraceBody','structure210-forecourt-foundation-cut-around-bridge-flight');
 const minX=Math.min(...court.map(p=>p[0])),maxX=Math.max(...court.map(p=>p[0])),minZ=Math.min(...court.map(p=>p[1])),maxZ=Math.max(...court.map(p=>p[1]));
 for(let z=minZ;z<maxZ;z+=.55)for(let x=minX;x<maxX;x+=.75){let p=[[x+.005,z+.005],[x+.745,z+.005],[x+.745,z+.545],[x+.005,z+.545]];for(let i=0;i<court.length&&p.length;i++)p=clip(p,court[i],court[(i+1)%court.length]);if(p.length)for(const piece of subtract(p,approach))block(b,piece,footY-.10,footY,'terraceTread','structure210-jointed-forecourt-flag-sharing-stair-foot');}
 return{revision:210,bridgeEndY:[G.position[1]+deck210(-H),G.position[1]+deck210(H)],eastRisers:3,westRisers:3,forecourtY:footY,courtPolygon:court,subtractedBridgeFlight:approach,stairLowerLandingFront:[a.toArray(),c.toArray()],connectedPhysicalPlans:true,visualAccepted:false};
}

function stoneRoof210(){const N=64,R=14,p=[],uv=[],ix=[];for(const dy of[0,-.15])for(let j=0;j<=R;j++){const t=j/R,r=.86*(1-t)+.17*t;for(let i=0;i<=N;i++){const a=i*TAU/N,k=1/(Math.abs(Math.cos(a))**6+Math.abs(Math.sin(a))**6)**(1/6),x=Math.cos(a)*r*k,z=Math.sin(a)*r*k,y=.51*t**1.5+.13*(1-t)**7*Math.abs(Math.sin(2*a))**4+dy;p.push(x,y,z);uv.push(x,z);}}const count=(N+1)*(R+1);for(let j=0;j<R;j++)for(let i=0;i<N;i++){const q=j*(N+1)+i,a=[q,q+N+1,q+1,q+1,q+N+1,q+N+2];ix.push(...a,...[a[0]+count,a[2]+count,a[1]+count,a[3]+count,a[5]+count,a[4]+count]);}for(const ring of[0,R])for(let i=0;i<N;i++){const a=ring*(N+1)+i,c=a+1;ring===0?ix.push(a,c,a+count,c,c+count,a+count):ix.push(a,a+count,c,c,a+count,c+count);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name='structure210-closed-curved-square-stone-lantern-roof';return g;}
export function buildGardenLantern210({b,mats,lights}){
 const pos=[11.55,.14,5.90];mats.lanternStone210=mats.terraceBody.clone();mats.lanternStone210.name='scene02-weathered-gray-granite-garden-lantern210';mats.lanternStone210.color.multiplyScalar(.83);mats.lanternLight210=mats.paper.clone();mats.lanternLight210.name='scene02-recessed-warm-lantern-pane210';mats.lanternLight210.emissiveIntensity=.38;mats.lanternLight210.color.setHex(0xe6bb74);
 b.at(pos,.16,()=>{
  for(const [y,w,h]of[[.10,1.02,.20],[.27,.82,.14]])b.put(closedBox(w,h,w,'structure210-lantern-founded-base'),'lanternStone210',[0,y,0]);
  const profile=[[0,.34],[.34,.34],[.30,.43],[.23,.53],[.21,1.40],[.24,1.53],[.35,1.63],[.48,1.72],[.55,1.81],[.51,1.90],[0,1.90]],shaft=new T.LatheGeometry(profile.map(q=>new T.Vector2(...q)),8);shaft.name='structure210-lantern-octagonal-stone-shaft';b.put(cleanMesh210(shaft),'lanternStone210');
  for(const y of[1.96,2.76])b.put(closedBox(1.10,.14,1.10,'structure210-lantern-stone-window-sill'),'lanternStone210',[0,y,0]);
  for(const x of[-.44,.44])for(const z of[-.44,.44])b.put(closedBox(.18,.67,.18,'structure210-lantern-solid-corner-pier'),'lanternStone210',[x,2.36,z]);
  for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{
   b.put(closedBox(.66,.64,.025,'structure210-lantern-recessed-luminous-window'),'lanternLight210',[0,2.36,.425]);
   for(const x of[-.30,0,.30])b.put(closedBox(.040,.64,.055,'structure210-lantern-stone-window-bar'),'lanternStone210',[x,2.36,.475]);
   for(const y of[2.14,2.36,2.58])b.put(closedBox(.66,.035,.055,'structure210-lantern-stone-window-bar'),'lanternStone210',[0,y,.475]);
  });
  b.put(stoneRoof210(),'lanternStone210',[0,2.88,0]);
  const bud=new T.LatheGeometry([[0,0],[.16,0],[.20,.07],[.17,.13],[.22,.21],[.20,.29],[.12,.38],[.025,.46],[0,.49]].map(q=>new T.Vector2(...q)),32);bud.name='structure210-lantern-stone-lotus-finial';b.put(cleanMesh210(bud),'lanternStone210',[0,3.35,0]);
 });
 const light=new T.PointLight(0xffb65e,4.6,6,2);light.position.set(pos[0],pos[1]+2.36,pos[2]);lights.push(light);return{revision:210,position:pos,closedStoneRoof:true,solidWindowPiers:true,overallHeight:3.84,visualAccepted:false};
}
