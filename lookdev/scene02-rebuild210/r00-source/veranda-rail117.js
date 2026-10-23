import {layout} from './layout117.js';
import {revolveProfile} from './sorin-solids.js';

// One measured structural path drives the deck bearing plane, post feet,
// continuous beams, intermediate stiles and inset metal panels. The original
// picture does not resolve a perfectly straight plan. Recovering cap and beam
// axes with equal 1.12m posts gives a gentle 69mm deck rise, rather than changing
// the scale of individual posts or putting a drawing in front of the camera.
const controls=[
 [16.20,1.35,8], [15.95,1.35,17],
 ...layout.rail.posts.toSorted((a,b)=>a[2]-b[2]),
 [14.90,1.35,26], [14.40,1.35,40],
];
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
 if(height===.880){
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
 const posts=layout.rail.posts.toSorted((a,c)=>a[2]-c[2]),structural=[verandaEdge(8),verandaEdge(17),...posts,verandaEdge(26),verandaEdge(40)].toSorted((a,c)=>a[2]-c[2]);
 // A single swelling giboshi sits on a short chased drum. The old profile
 // alternated three cone-like flares, reading as a miniature pagoda finial.
 const capProfile=[[0,0],[.068,0],[.075,.006],[.075,.014],[.067,.020],[.064,.027],[.064,.047],[.070,.053],[.069,.059],[.039,.066],[.029,.075]];
 for(let k=1;k<=36;k++){
  const t=k/36,y=.075+.134*t,r=.026+.056*Math.pow(Math.sin(Math.PI*t),.82);
  capProfile.push([r,y]);
 }
 capProfile.push([.021,.215],[.012,.222],[.005,.229],[0,.234]);
 const cap=revolveProfile(capProfile,96,'scene02-closed-fluted-onion-giboshi');
 const cp=cap.attributes.position;
 for(let k=0;k<cp.count;k++){
  const y=cp.getY(k),a=Math.atan2(cp.getZ(k),cp.getX(k));
  if(y>.075&&y<.209){const q=1+.021*Math.cos(a*12)*Math.sin(Math.PI*(y-.075)/.134);cp.setXYZ(k,cp.getX(k)*q,y,cp.getZ(k)*q);}
 }
 cap.computeVertexNormals();
 const bandScroll=[];
 for(let k=0;k<=36;k++){
  const t=k/36,a=-.21+.42*t,r=.0658+.0018*Math.sin(Math.PI*t),y=.036+.008*Math.sin(t*Math.PI*3);
  bandScroll.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));
 }
 const chasedBand=new T.TubeGeometry(new T.CatmullRomCurve3(bandScroll),40,.0015,5,false);

 let timberBeams=0,insetPanels=0,intermediateStiles=0,postCount=0;
 // Broad red top, middle and bottom beams share the same edge and shoulders.
 for(const [h,w,d] of[[.880,.120,.075],[.480,.100,.105],[.105,.120,.105],[.025,.170,.050]]){b.put(buildVerandaBeam170(T,8,40,h,w,d),h===.025?'cedar':'railRed170');timberBeams++;}
 function post(p){
  const t=verandaTangent(p[2]),yaw=Math.atan(t[0]);
  b.at(p,yaw,()=>{
   b.box(0,.4525,0,.120,.905,.120,'railRed170');
   b.box(0,.039,0,.129,.050,.129,'oldgold');b.box(0,.069,0,.133,.014,.133,'gold');
   b.box(0,.867,0,.137,.070,.137,'railRed170');b.box(0,.897,0,.145,.017,.145,'oldgold');
   b.put(cap,'gold',[0,.905,0]);
   for(let k=0;k<12;k++){
    b.put(chasedBand,k%3?'gold':'oldgold',[0,.905,0],[1,1,1],[0,k*Math.PI/6,0]);
    const a=k*Math.PI/6;
    b.ball(Math.cos(a)*.0658,.941,Math.sin(a)*.0658,.0028,.0042,.0028,'oldgold');
   }
  });postCount++;
 }
 for(const p of structural)post(p);
 function insetPanel(z,panelWidth){
  const p=verandaEdge(z),t=verandaTangent(z),yaw=Math.atan(t[0]),height=.270;
  b.at([p[0],p[1]+.2925,z],yaw,()=>{
   b.box(.018,0,0,.028,height,panelWidth,'darkwood');
   for(let sign of[-1,1]){b.box(.040,sign*height/2,0,.018,.017,panelWidth+.02,'oldgold');b.box(.040,0,sign*panelWidth/2,.018,height,.017,'oldgold');}
   // A cast central rosette and paired continuous volutes fill each inset.
   for(let j=0;j<8;j++){const a=j*Math.PI/4;b.put(b.sphere,'oldgold',[.056,Math.sin(a)*.052,Math.cos(a)*.052],[.011,.031,.014],[a,0,0]);}
   b.ball(.067,0,0,.014,.026,.026,'gold');
   for(let sign of[-1,1])for(let side of[-1,1]){
    const reach=Math.max(.075,panelWidth*.37),points=[];
    for(let k=0;k<24;k++){const t=k/23,a=t*Math.PI*2.5,r=.070*(1-.72*t);points.push([.055+Math.sin(t*Math.PI)*.007,side*(.038+Math.sin(a)*r),sign*(reach*(1-t*.56)+Math.cos(a)*r*.63)]);}
    b.tube(points,.009,'oldgold',32);
   }
   for(let sign of[-1,1]){b.ball(.060,0,sign*(panelWidth/2-.035),.010,.025,.018,'gold');b.box(.044,0,sign*panelWidth/2,.020,.070,.033,'gold');}
  });insetPanels++;
 }
 for(let i=0;i<structural.length-1;i++){
  const a=structural[i][2],d=structural[i+1][2],span=d-a,bays=Math.max(2,Math.round(span/.80)),pitch=span/bays;
  for(let j=1;j<bays;j++){
   const z=a+j*pitch,p=verandaEdge(z),t=verandaTangent(z);
   b.at(p,Math.atan(t[0]),()=>b.box(0,.440,0,.086,.790,.086,'railRed170'));intermediateStiles++;
  }
  for(let j=0;j<bays;j++)insetPanel(a+(j+.5)*pitch,Math.max(.20,pitch-.16));
 }
 return{kind:'one spatial balustrade with closed continuous broad beams and joined inset-panel bays',measuredPosts:posts,structuralPostCount:postCount,postSectionMetres:.120,postHeightMetres:1.12,topRailSectionMetres:[.120,.075],topRailCrown170:"Arched crown and flat bearing bed; original .120x.075 external section and path held",middleRailSectionMetres:[.100,.105],bottomRailSectionMetres:[.120,.105],timberBeams,insetPanels,intermediateStiles,deckControlPoints:controls,photographicPixelsUsed:false,limits:'Curved plan, 69mm local deck rise and unequal bay lengths are inferred from visible cap/beam axes; the source photograph does not admit perfectly regular perspective.'};
}
