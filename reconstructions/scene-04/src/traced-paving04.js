import {sampleAggregateRelief04} from './granite-aggregate04.js';
import * as T from 'three';
import {reference4Config as C} from './reference4-config.js';

// Joint centres manually observed in the supplied 1254px comparison photograph.
// They define independent solids, never UVs or a photograph-coloured surface.
const edgeProfiles=[
 [[740,432],[800,388],[850,337],[900,291],[950,247],[1000,201],[1050,155],[1100,108],[1150,58],[1200,14],[1254,-35],[1350,-132]],
 [[740,553],[800,532],[850,510],[900,488],[950,466],[1000,447],[1050,427],[1100,408],[1150,385],[1200,362],[1254,343],[1350,300]],
 [[740,637],[800,645],[850,652],[900,659],[950,678],[1000,697],[1050,725],[1100,742],[1150,764],[1200,783],[1254,809],[1350,854]],
 [[740,789],[800,827],[850,868],[900,907],[950,945],[1000,986],[1050,1028],[1100,1070],[1150,1118],[1200,1161],[1254,1204],[1350,1280]]
];
const joints=[
 [[740,744],[760,764],[779,783],[800,800],[828,832],[859,865],[895,900],[935,945],[1009,1023],[1115,1137],[1235,1220],[1350,1350]],
 [[742,744],[765,766],[794,796],[823,826],[855,857],[875,879],[952,953],[1046,1038],[1218,1210],[1350,1350]],
 [[744,741],[767,766],[794,790],[824,819],[855,852],[886,888],[929,933],[975,981],[1018,1016],[1122,1115],[1237,1245],[1350,1350]]
];
export const observedCurbCuts04={west:[740,756,774,795,820,848,879,914,950,997,1040,1090,1150,1210,1280,1350],east:[740,758,778,800,828,859,898,945,987,1040,1093,1165,1250,1350]};
const interpolate=(a,y)=>{let k=0;while(k<a.length-2&&y>a[k+1][0])k++;const p=a[k],q=a[k+1];return T.MathUtils.lerp(p[1],q[1],(y-p[0])/(q[0]-p[0]));};
const hash=(x,z,s)=>{const q=Math.sin(x*127.1+z*311.7+s*17.13)*43758.5453;return q-Math.floor(q);};
const noise=(x,z,s)=>{const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,u=a*a*(3-2*a),v=b*b*(3-2*b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(i,j,s),hash(i+1,j,s),u),T.MathUtils.lerp(hash(i,j+1,s),hash(i+1,j+1,s),u),v);};
const foregroundApronWidthScale=1.0;
export function createTracedPaving04(){
 const camera=new T.PerspectiveCamera(C.camera.fov,1,C.camera.near,C.camera.far);camera.position.fromArray(C.camera.position);camera.lookAt(...C.camera.target);camera.updateMatrixWorld(true);
 const groundY=.048,plane=new T.Plane(new T.Vector3(0,1,0),-groundY);
 const world=p=>{const centreX=(interpolate(edgeProfiles[0],p[1])+interpolate(edgeProfiles[3],p[1]))*.5,screenX=centreX+(p[0]-centreX)*foregroundApronWidthScale,d=new T.Vector3(screenX/627-1,1-p[1]/627,.5).unproject(camera).sub(camera.position).normalize();const hit=new T.Ray(camera.position,d).intersectPlane(plane,new T.Vector3());if(!hit)throw Error('Paving observation misses ground');return[hit.x,hit.z];};
 const records=[];
 for(let column=0;column<3;column++)for(let row=0;row<joints[column].length-1;row++){
  const a=joints[column][row],b=joints[column][row+1],l=edgeProfiles[column],r=edgeProfiles[column+1];
  const pixels=[[interpolate(l,a[0]),a[0]],[interpolate(r,a[1]),a[1]],[interpolate(r,b[1]),b[1]],[interpolate(l,b[0]),b[0]]];
  const originalOutline=pixels.map(world),outline=[],minimumZ=C.architecture.stairBottomZ;
  for(let j=0;j<originalOutline.length;j++){
   const a=originalOutline[j],b=originalOutline[(j+1)%originalOutline.length],insideA=a[1]>=minimumZ,insideB=b[1]>=minimumZ;
   if(insideA)outline.push(a);
   if(insideA!==insideB){const t=(minimumZ-a[1])/(b[1]-a[1]);outline.push([a[0]+(b[0]-a[0])*t,minimumZ]);}
  }
  if(outline.length>=3)records.push({id:'observed-'+['west','centre','east'][column]+'-'+String(row+1).padStart(2,'0'),column,row,pixels,outline,top:groundY,thickness:.14,physicalClipAtStairFootZ:minimumZ});
 }
 return{records,edgeProfiles,world,groundY,apronWidthScale:foregroundApronWidthScale,edgePoint:(side,y)=>world([interpolate(edgeProfiles[side<0?0:3],y),y]),scope:'Observed visible joints; symmetric apron width scaled about each cross-section centreline; hidden shape, metric scale and surface relief remain inferred.'};
}

export function tracedSlabGeometry(record){
 const {outline,top,thickness}=record,cx=outline.reduce((a,p)=>a+p[0],0)/outline.length,cz=outline.reduce((a,p)=>a+p[1],0)/outline.length,seed=739+record.column*139+record.row*31+(record.detailSeed??0)*.73,isCurb=record.id.includes('curb'),gap=record.jointGap??(isCurb?.019:.015),bevel=record.edgeBevel??(isCurb?.007:.006);
 const points=outline.map(([x,z])=>{const d=Math.hypot(x-cx,z-cz);return[x+(cx-x)*gap/d,z+(cz-z)*gap/d];});
 // Each arris has different sparse chips and a round, eroded corner. The
 // resulting perimeter is extruded through the whole stone, not a decal.
 const boundary=[];
 for(let j=0;j<points.length;j++){
  const prev=points[(j+points.length-1)%points.length],a=points[j],b=points[(j+1)%points.length],pl=Math.hypot(prev[0]-a[0],prev[1]-a[1]),len=Math.hypot(b[0]-a[0],b[1]-a[1]),r=Math.min(record.cornerRadius??(isCurb?.032:.046),pl*.22,len*.22)*( .70+.42*hash(j,3,seed)),enter=[a[0]+(prev[0]-a[0])*r/pl,a[1]+(prev[1]-a[1])*r/pl],leave=[a[0]+(b[0]-a[0])*r/len,a[1]+(b[1]-a[1])*r/len];
  for(let k=0;k<5;k++){const t=k/4;boundary.push([(1-t)**2*enter[0]+2*(1-t)*t*a[0]+t*t*leave[0],(1-t)**2*enter[1]+2*(1-t)*t*a[1]+t*t*leave[1]]);}
  const nextR=Math.min(record.cornerRadius??(isCurb?.032:.046),len*.22)*( .70+.42*hash((j+1)%points.length,3,seed)),end=[b[0]+(a[0]-b[0])*nextR/len,b[1]+(a[1]-b[1])*nextR/len],boundarySpacing=record.boundarySpacing??.020,n=Math.max(2,Math.ceil(len/boundarySpacing));
  for(let k=1;k<n;k++){const t=k/n,x=T.MathUtils.lerp(leave[0],end[0],t),z=T.MathUtils.lerp(leave[1],end[1],t),rr=Math.hypot(cx-x,cz-z),coarse=noise(t*5.5,j*1.7,seed+43),chip=(record.chipStrength??1)*(.004+.012*noise(t*10.0,j*3.1,seed+47)+.060*Math.pow(coarse,6))*Math.sin(Math.PI*t);boundary.push([x+(cx-x)/rr*chip,z+(cz-z)/rr*chip]);}
 }
 const shape=new T.Shape();boundary.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const raw=new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,bevelEnabled:true,bevelSize:bevel,bevelThickness:record.edgeBevelDrop??.004,bevelSegments:4,curveSegments:1});raw.rotateX(-Math.PI/2);raw.translate(0,top-thickness,0);
 const p=raw.attributes.position,n=raw.attributes.normal,vertices=[],cache=new Map(),vertex=q=>{const key=q.x.toFixed(6)+':'+q.y.toFixed(6)+':'+q.z.toFixed(6);if(cache.has(key))return cache.get(key);const i=vertices.length;vertices.push(q);cache.set(key,i);return i;};
 let faces=[];
 for(let i=0;i<p.count;i+=3)faces.push({v:[0,1,2].map(k=>vertex(new T.Vector3().fromBufferAttribute(p,i+k))),top:[0,1,2].every(k=>n.getY(i+k)>.99)});
 // Split a shared edge in every adjacent triangle, including the bevel. This
 // keeps the top and side connected while adding actual shallow depressions.
 const spacing=record.detailSpacing??(isCurb?.035:record.row>=6?.006:.014),key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(let level=0;level<12;level++){
  const split=new Map();for(const f of faces)if(f.top)for(let k=0;k<3;k++){const a=f.v[k],b=f.v[(k+1)%3];if(vertices[a].distanceToSquared(vertices[b])>spacing*spacing&&!split.has(key(a,b))){split.set(key(a,b),vertices.length);vertices.push(vertices[a].clone().add(vertices[b]).multiplyScalar(.5));}}
  if(!split.size)break;const next=[];
  for(const f of faces){let[a,b,c]=f.v,ab=split.get(key(a,b)),bc=split.get(key(b,c)),ca=split.get(key(c,a)),count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);const add=(...v)=>next.push({v,top:f.top});if(!count){next.push(f);continue;}if(count===3){add(a,ab,ca);add(ab,b,bc);add(ca,bc,c);add(ab,bc,ca);continue;}if(count===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}add(a,ab,c);add(ab,b,c);}else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}add(b,bc,ab);add(a,ab,c);add(ab,bc,c);}}
  faces=next;
 }
 const edgeDistance=(x,z)=>{let d=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return d;};
 const extentX=Math.max(...points.map(p=>Math.abs(p[0]-cx))),extentZ=Math.max(...points.map(p=>Math.abs(p[1]-cz))),tiltX=.009*(hash(2,3,seed)-.5),tiltZ=.011*(hash(4,7,seed)-.5),crownAmount=.014+.014*hash(5,11,seed+73);
 // Each fitted block gets a few shallow depressions; the same soft mask drives
 // both the physical surface relief and the later wet/dry material response.
 const filmSeed=hash(record.column,record.row,seed+227),dampPropensity=isCurb?0:(record.dampPropensity??(filmSeed > .42 ? .58 + .42*hash(record.column,record.row,seed+229) : .04 + .18*filmSeed)),hollows=[];for(let k=0;k<(isCurb?0:(record.hollowCount??(hash(7,13,seed+89)<.26?0:1)));k++){
  const px=cx+(hash(k,113,seed+101)-.5)*extentX*.52,pz=cz+(hash(k,127,seed+107)-.5)*extentZ*.52,angle=hash(k,131,seed+127)*Math.PI*2;
  hollows.push({x:px,z:pz,rx:extentX*(.22+.18*hash(k,137,seed+139)),rz:extentZ*(.20+.22*hash(k,149,seed+151)),c:Math.cos(angle),s:Math.sin(angle),depth:.006+.009*hash(k,157,seed+163)});
 }
 const hollowAt=(x,z)=>{let mask=0,depth=0;if(!hollows.length)return{mask,depth};const e=edgeDistance(x,z);if(e<.035)return{mask,depth};for(const h of hollows){const dx=x-h.x,dz=z-h.z,u=(h.c*dx+h.s*dz)/h.rx,v=(-h.s*dx+h.c*dz)/h.rz,radial=Math.sqrt(u*u+v*v),edgeNoise=.42*(noise(x*9.0,z*9.0,seed+181)-.5)+.20*(noise(x*23.0,z*23.0,seed+193)-.5),signedEdge=1-radial+edgeNoise,patch=T.MathUtils.smoothstep(signedEdge,-.16,.38)*T.MathUtils.smoothstep(e,.035,.15);mask=Math.max(mask,patch);depth=Math.max(depth,h.depth*patch);}return{mask,depth};};
 // Sparse independent eroded pores replace the square-lattice threshold
 // which formed glyph-like connected relief in the actual overhead view.
 const pores=[],poreGrid=new Map(),cell=.08,loX=cx-extentX,loZ=cz-extentZ,poreCount=isCurb?0:Math.min(130,Math.round(4*extentX*extentZ*32));
 for(let k=0;k<poreCount*10&&pores.length<poreCount;k++){
  const x=loX+2*extentX*hash(k,141,seed+301),z=loZ+2*extentZ*hash(k,149,seed+313),r=.0075+.0105*hash(k,157,seed+331);
  if(pores.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+r+.008))continue;
  const angle=hash(k,163,seed+347)*Math.PI*2,p={x,z,r,rx:r,rz:r*(.72+.50*hash(k,169,seed+353)),cc:Math.cos(angle),ss:Math.sin(angle),depth:.001+.0025*hash(k,173,seed+359)};
  pores.push(p);const ix=Math.floor((x-loX)/cell),iz=Math.floor((z-loZ)/cell),key=ix*131071+iz,bucket=poreGrid.get(key)??[];bucket.push(p);poreGrid.set(key,bucket);
 }
 const poreField=(x,z)=>{let h=0;const ix=Math.floor((x-loX)/cell),iz=Math.floor((z-loZ)/cell);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)for(const p of poreGrid.get((ix+i)*131071+iz+j)??[]){const dx=x-p.x,dz=z-p.z,u=(p.cc*dx+p.ss*dz)/p.rx,v=(-p.ss*dx+p.cc*dz)/p.rz,q=u*u+v*v;if(q<1)h-=p.depth*(1-q)**2;}return h;};
 const field=(x,z)=>{const e=edgeDistance(x,z),nx=(x-cx)/extentX,nz=(z-cz)/extentZ,radial=Math.sqrt(nx*nx+nz*nz),edgeSettle=-.012*(1-T.MathUtils.smoothstep(e,.010,.18)),crown=crownAmount*(1-T.MathUtils.smoothstep(radial,.08,1.08)),broad=.022*(noise(x*1.45+seed*.071,z*1.35-seed*.053,seed+191)-.5)+.010*(noise(x*4.2-seed*.043,z*4.0+seed*.037,seed+197)-.5),micro=.0022*(noise(x*19.0,z*19.0,seed+211)-.5),round=-.010*(1-T.MathUtils.smoothstep(e,.003,.050))*(.28+.72*noise(x*5.7,z*5.1,seed+79)),wear=.010*(noise((x*.829+z*.559)*8.3,(z*.829-x*.559)*8.3,seed)-.5)+.0035*(noise((x*.829+z*.559)*33.1,(z*.829-x*.559)*33.1,seed+17)-.5)+poreField(x,z),hollow=hollowAt(x,z),mineral=isCurb?0:sampleAggregateRelief04(x,z,seed)*T.MathUtils.smoothstep(e,.002,.012);return mineral*(record.microReliefScale??1)+round+wear*T.MathUtils.smoothstep(e,.005,.028)+edgeSettle+crown+broad+micro-hollow.depth+tiltX*nx+tiltZ*nz;};
 for(const q of vertices)q.y+=field(q.x,q.z)*T.MathUtils.smoothstep(q.y,top-thickness+.01,top-.02);
 const smooth=new T.BufferGeometry();smooth.setAttribute('position',new T.Float32BufferAttribute(vertices.flatMap(q=>[q.x,q.y,q.z]),3));smooth.setIndex(faces.flatMap(f=>f.v));smooth.computeVertexNormals();
 const positions=[],uv=[],flags=[],bevelNormals=[],wetness=[],dampness=[];for(const f of faces)for(const i of f.v){const q=vertices[i];positions.push(q.x,q.y,q.z);const nx=smooth.attributes.normal.getX(i),ny=smooth.attributes.normal.getY(i),nz=smooth.attributes.normal.getZ(i),bend=f.top?0:1-Math.abs(ny);uv.push(q.x+(q.y-top)*nx*bend,q.z+(q.y-top)*nz*bend);flags.push(f.top);bevelNormals.push(smooth.attributes.normal.getX(i),smooth.attributes.normal.getY(i),smooth.attributes.normal.getZ(i));wetness.push(f.top?hollowAt(q.x,q.z).mask:0);dampness.push(f.top?dampPropensity:0);}smooth.dispose();
 raw.dispose();const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('r4Wetness',new T.Float32BufferAttribute(wetness,1));g.setAttribute('r4Dampness',new T.Float32BufferAttribute(dampness,1));g.computeVertexNormals();
 const nn=g.attributes.normal;for(let i=0;i<flags.length;i++)if(positions[i*3+1]>top-.014)nn.setXYZ(i,bevelNormals[i*3],bevelNormals[i*3+1],bevelNormals[i*3+2]);for(let i=0;i<flags.length;i++)if(flags[i]){const x=positions[i*3],z=positions[i*3+2],e=.0005,dx=(field(x+e,z)-field(x-e,z))/(2*e),dz=(field(x,z+e)-field(x,z-e))/(2*e),q=new T.Vector3(-dx,1,-dz).normalize();nn.setXYZ(i,q.x,q.y,q.z);}
 g.userData.observedSlab=record.id;g.userData.referenceBitmapUsed=false;g.userData.surface={thickness,nominalSeam:.028,topSpacing:spacing,individualRoundCorners:true,actualClosedBevel:true,generatedPoreCount:pores.length,shallowCrownAmplitudeMetres:crownAmount,hollowCount:hollows.length,hollowDepthRangeMetres:hollows.length?[Math.min(...hollows.map(h=>h.depth)),Math.max(...hollows.map(h=>h.depth))]:[0,0],tileDampPropensity:dampPropensity,wetnessAttribute:'Hollow mask plus tile-specific propensity for world-coherent water film; no layout or texture-image projection'};return g;
}
