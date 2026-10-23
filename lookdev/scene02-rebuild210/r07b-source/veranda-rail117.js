import {layout} from './layout117.js';
import {createRailFinial210,createRailRelief210} from './veranda-metal210.js';

// HD02's middle post foot is near y1110, while the old 1.12m guard
// projected its foot to y1256 under the held reference camera. Recover a
// shorter .791m guard and a common raised deck, preserving every cap's
// world-space seat and all measured XZ axes. The whole board/joist/bearer
// assembly imports this same edge; this is not a screen-space correction.
export const verandaFrame210={bodyScale:.64,deckLift:.905*(1-.64),capSeat:.905*.64};
// One measured structural path drives the deck bearing plane, post feet,
// continuous beams, intermediate stiles and inset metal panels. The original
// picture does not resolve a perfectly straight plan. Recovering cap and beam
// axes with equal 1.12m posts gives a gentle 69mm deck rise, rather than changing
// the scale of individual posts or putting a drawing in front of the camera.
const controls=[
 [16.20,1.35,8], [15.95,1.35,17],
 ...layout.rail.posts.toSorted((a,b)=>a[2]-b[2]),
 [14.90,1.35,26], [14.40,1.35,40],
].map(([x,y,z])=>[x,y+verandaFrame210.deckLift,z]);
export function verandaEdge(z){
 let i=0;while(i<controls.length-2&&z>controls[i+1][2])i++;
 const a=controls[i],b=controls[i+1],before=controls[Math.max(0,i-1)],after=controls[Math.min(controls.length-1,i+2)];
 const span=b[2]-a[2],t=Math.max(0,Math.min(1,(z-a[2])/span)),h00=2*t*t*t-3*t*t+1,h10=t*t*t-2*t*t+t,h01=-2*t*t*t+3*t*t,h11=t*t*t-t*t;
 const xy=[0,1].map(k=>h00*a[k]+h10*span*(b[k]-before[k])/(b[2]-before[2])+h01*b[k]+h11*span*(after[k]-a[k])/(after[2]-a[2]));
 return[xy[0],xy[1],z];
}
export function verandaTangent(z){const a=verandaEdge(z-.002),b=verandaEdge(z+.002);return[(b[0]-a[0])/.004,(b[1]-a[1])/.004,1];}

export function buildVerandaBeam170(T,a,d,height,width,depth){
 // Closed rounded rectangular timber, swept along the actual spatial edge.
 // Width is across the veranda edge; depth is vertical.
 const rings=Math.max(4,Math.ceil((d-a)/.12)),radius=.007,section=[];
 if(Math.abs(height-.880*verandaFrame210.bodyScale)<1e-7){
  // Hold the recovered external section and path. An arched rubbed crown
  // removes the old57mm-wide flat mirror-like top; the bearing bed stays flat.
  for(let k=0;k<=32;k++){const angle=Math.PI*(1-k/32);section.push([Math.cos(angle)*width/2,Math.sin(angle)*depth/2]);}
  section.push([width/2,-depth/2+.008],[width/2-.008,-depth/2],[-width/2+.008,-depth/2],[-width/2,-depth/2+.008]);section.reverse();
 }else for(let corner=0;corner<4;corner++)for(let k=0;k<=3;k++){
  const angle=corner*Math.PI/2+k*Math.PI/6;
  section.push([(corner===0||corner===3?1:-1)*(width/2-radius)+Math.cos(angle)*radius,(corner<2?1:-1)*(depth/2-radius)+Math.sin(angle)*radius]);
 }
 const positions=[],uv=[],indices=[],N=section.length;
 for(let j=0;j<=rings;j++){
  const z=a+(d-a)*j/rings,p=verandaEdge(z),t=verandaTangent(z),normal=new T.Vector3(1,0,-t[0]).normalize();
  for(const [u,v] of section){positions.push(p[0]+normal.x*u,p[1]+height+v,z+normal.z*u);uv.push(j/rings,u/width+.5);}
 }
 for(let j=0;j<rings;j++)for(let k=0;k<N;k++){const q=j*N+k,n=j*N+(k+1)%N;indices.push(q,n,q+N,n,n+N,q+N);}
 for(let end of[0,rings]){const p=verandaEdge(end?d:a),centre=positions.length/3;positions.push(p[0],p[1]+height,p[2]);uv.push(.5,.5);const ring=end*N;for(let k=0;k<N;k++)end?indices.push(centre,ring+k,ring+(k+1)%N):indices.push(centre,ring+(k+1)%N,ring+k);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.name='closed-curved-veranda-timber';return g;
}

export function buildVerandaRail(T,b){
 const ys=verandaFrame210.bodyScale,posts=layout.rail.posts.map(([x,y,z])=>[x,y+verandaFrame210.deckLift,z]).toSorted((a,c)=>a[2]-c[2]),structural=[verandaEdge(8),verandaEdge(17),...posts,verandaEdge(26),verandaEdge(40)].toSorted((a,c)=>a[2]-c[2]);
 const finial210=createRailFinial210(b,verandaFrame210.capSeat);
 const relief210=createRailRelief210(b);

 let timberBeams=0,insetPanels=0,intermediateStiles=0,postCount=0;
 // Broad red top, middle and bottom beams share the same edge and shoulders.
 for(const [h,w,d] of[[.880,.120,.075],[.480,.100,.105],[.105,.120,.105],[.025,.170,.050]]){b.put(buildVerandaBeam170(T,8,40,h*ys,w,d*ys),h===.025?'cedar':'railRed170');timberBeams++;}
 function post(p){
  const t=verandaTangent(p[2]),yaw=Math.atan(t[0]);
  b.at(p,yaw,()=>{
   b.box(0,.4525*ys-.001,0,.120,.905*ys+.002,.120,'railRed170');
   b.box(0,.039*ys,0,.129,.050*ys,.129,'oldgold');b.box(0,.069*ys,0,.133,.014*ys,.133,'gold');
   b.box(0,.867*ys,0,.137,.070*ys,.137,'railRed170');b.box(0,.897*ys,0,.145,.017*ys,.145,'oldgold');
   finial210.place();
  });postCount++;
 }
 for(const p of structural)post(p);
 function insetPanel(z,panelWidth){
  const p=verandaEdge(z),t=verandaTangent(z),yaw=Math.atan(t[0]),height=.270*ys;
  b.at([p[0],p[1]+.2925*ys,z],yaw,()=>{
   b.box(.018,0,0,.028,height,panelWidth,'darkwood');
   for(let sign of[-1,1]){b.box(.040,sign*height/2,0,.018,.017,panelWidth+.02,'oldgold');b.box(.040,0,sign*panelWidth/2,.018,height,.017,'oldgold');}
   relief210.panel(panelWidth,height);
  });insetPanels++;
 }
 for(let i=0;i<structural.length-1;i++){
  const a=structural[i][2],d=structural[i+1][2],span=d-a,bays=Math.max(2,Math.round(span/.80)),pitch=span/bays;
  for(let j=1;j<bays;j++){
   const z=a+j*pitch,p=verandaEdge(z),t=verandaTangent(z);
   b.at(p,Math.atan(t[0]),()=>b.box(0,.440*ys,0,.086,.790*ys,.086,'railRed170'));intermediateStiles++;
  }
  for(let j=0;j<bays;j++)insetPanel(a+(j+.5)*pitch,Math.max(.20,pitch-.16));
 }
 return{kind:'one spatial balustrade with closed continuous broad beams and joined inset-panel bays',measuredPosts:posts,structuralPostCount:postCount,postSectionMetres:.120,postHeightMetres:verandaFrame210.capSeat+.212,frame210:verandaFrame210,finial210:finial210.stats,relief210:relief210.stats,topRailSectionMetres:[.120,.075*ys],topRailCrown170:"Arched crown and flat bearing bed; common recovered guard/deck rise210",middleRailSectionMetres:[.100,.105*ys],bottomRailSectionMetres:[.120,.105*ys],timberBeams,insetPanels,intermediateStiles,deckControlPoints:controls,photographicPixelsUsed:false,limits:'Curved plan, 69mm local deck rise, .3258m platform recovery and unequal bay lengths are inferred from visible cap/beam/foot axes; the source photograph does not admit perfectly regular perspective.'};
}
