import * as T from 'three';
import {sampleAggregateRelief04} from './granite-aggregate04.js';

// Scene04 approach367. Numeric joints are observed plan boundaries only.
// Hidden thickness, fracture, weathering and moisture are authored inference.
// No reference photograph is loaded, sampled or used as a height field.
const hash=(a,b,s=367)=>{const q=Math.sin(a*127.1+b*311.7+s*17.13)*43758.5453;return q-Math.floor(q);};
const noise=(x,z,s)=>{const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,u=a*a*(3-2*a),v=b*b*(3-2*b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(i,j,s),hash(i+1,j,s),u),T.MathUtils.lerp(hash(i,j+1,s),hash(i+1,j+1,s),u),v);};
const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
const area=points=>points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0)*.5;
const at=(profile,y)=>{let k=0;while(k<profile.length-2&&y>profile[k+1][0])k++;const a=profile[k],b=profile[k+1];return T.MathUtils.lerp(a[1],b[1],(y-a[0])/(b[0]-a[0]));};
const seamProfiles=[
 [[740,586],[800,562],[850,545],[900,529],[950,512],[1000,494],[1050,477],[1100,456],[1150,438],[1200,416],[1254,397],[1370,352]],
 [[740,674],[800,684],[850,692],[900,703],[950,720],[1000,738],[1050,756],[1100,772],[1150,785],[1200,797],[1254,816],[1370,851]]
];
export function createPavingLayout367(traced){
 const ys=[744,756,766,778,788,799,811,824,838,852,867,885,904,925,948,982,1018,1047,1087,1127,1174,1231,1293,1350],W=6,H=ys.length-1,used=Array.from({length:H},()=>Array(W).fill(false)),records=[];
 // Shared paired nodes form a physical paving graph. Rectangular quarry flags
 // span unequal numbers of subcells; buried subdivision lines are omitted.
 // This stops long seams and creates actual staggered T-junctions.
 const nodes=ys.map((y,j)=>{const L=at(traced.edgeProfiles[0],y),A=at(seamProfiles[0],y),B=at(seamProfiles[1],y),R=at(traced.edgeProfiles[3],y),xs=[L,T.MathUtils.lerp(L,A,.51),A,T.MathUtils.lerp(A,B,.48),B,T.MathUtils.lerp(B,R,.52),R];return xs.map((x,i)=>[x+(i===0||i===6?0:(R-L)*.008*(2*hash(i,j,3673)-1)),y+(i===0||i===6?0:(1+3.5*(y-744)/626)*(2*hash(i,j,3677)-1))]);});
 const free=(c,r,w,h)=>c+w<=W&&r+h<=H&&Array.from({length:h},(_,j)=>Array.from({length:w},(_,i)=>!used[r+j][c+i]).every(Boolean)).every(Boolean);
 for(let row=0;row<H;row++)for(let column=0;column<W;column++){
  if(used[row][column])continue;
  const desiredW=[3,2,2,3,1,2][(row+column*3)%6],desiredH=hash(row,column,3683)<.22&&row<13?3:2,choices=[];
  for(const w of[1,2,3,4])for(const h of[1,2,3])if((w>1||h<=2)&&free(column,row,w,h))choices.push({w,h,score:Math.abs(w-desiredW)*1.1+Math.abs(h-desiredH)*1.2+.30*hash(w+row,h+column,3689)+(w===1?.35:0)+(h===1?.45:0)});
  choices.sort((a,b)=>a.score-b.score);const {w,h}=choices[0];for(let j=0;j<h;j++)for(let i=0;i<w;i++)used[row+j][column+i]=true;
  const pixels=[];for(let i=0;i<=w;i++)pixels.push(nodes[row][column+i]);for(let j=1;j<=h;j++)pixels.push(nodes[row+j][column+w]);for(let i=w-1;i>=0;i--)pixels.push(nodes[row+h][column+i]);for(let j=h-1;j>0;j--)pixels.push(nodes[row+j][column]);
  const original=pixels.map(traced.world),outline=[];for(let i=0;i<original.length;i++){const a=original[i],b=original[(i+1)%original.length],ia=a[1]>=8,ib=b[1]>=8;if(ia)outline.push(a);if(ia!==ib){const t=(8-a[1])/(b[1]-a[1]);outline.push([T.MathUtils.lerp(a[0],b[0],t),8]);}}
  if(outline.length<3||Math.abs(area(outline))<.002)continue;
  const seed=3671+column*491+row*79;
  records.push({id:'ground367-r03-'+column+'-'+row,column,row,detailSeed:seed,pixels,outline,top:traced.groundY+.006*(hash(row,column,947)-.5),thickness:.170+.045*hash(row,column,953),jointGap:.007+.005*hash(row,column,959),edgeBevel:.004+.004*hash(row,column,967),edgeBevelDrop:.006+.007*hash(row,column,971),cornerRadius:.018+.024*hash(row,column,977),detailSpacing:row>12?.024:.036,dampPropensity:.17+.60*hash(row,column,983),ground367:true,pavingGraph:{column,row,widthUnits:w,depthUnits:h,sharedPairedBoundary:true,subcellLinesRemoved:true},source:'Shared reference-led paired paving graph; unequal broad cut flags and staggered T-junctions. Hidden thickness, riven relief and dampness are authored.'});
 }
 return records;
}

export function createFlagstoneGeometry367(record){
 const isCurb=record.id.includes('curb'),outline=record.outline.map(p=>p.slice());if(area(outline)<0)outline.reverse();
 const cx=outline.reduce((n,p)=>n+p[0],0)/outline.length,cz=outline.reduce((n,p)=>n+p[1],0)/outline.length,seed=record.detailSeed??(3677+(record.column??0)*197+(record.row??0)*61),top=record.top??.048,thickness=record.thickness??.185,gap=record.jointGap??.007,bevel=record.edgeBevel??(isCurb?.008:.006),drop=record.edgeBevelDrop??.009;
 const points=outline.map(([x,z])=>{const d=Math.hypot(cx-x,cz-z);return[x+(cx-x)/d*gap,z+(cz-z)/d*gap];}),boundary=[];
 for(let j=0;j<points.length;j++){
  const prev=points[(j+points.length-1)%points.length],a=points[j],b=points[(j+1)%points.length],pl=Math.hypot(prev[0]-a[0],prev[1]-a[1]),len=Math.hypot(b[0]-a[0],b[1]-a[1]),corner=Math.min(record.cornerRadius??.045,pl*.19,len*.19)*(.75+.30*hash(j,13,seed)),enter=[a[0]+(prev[0]-a[0])*corner/pl,a[1]+(prev[1]-a[1])*corner/pl],leave=[a[0]+(b[0]-a[0])*corner/len,a[1]+(b[1]-a[1])*corner/len];
  for(let k=0;k<4;k++){const t=k/4,q=1-t;boundary.push([q*q*enter[0]+2*q*t*a[0]+t*t*leave[0],q*q*enter[1]+2*q*t*a[1]+t*t*leave[1]]);}
  const nr=Math.min(record.cornerRadius??.045,len*.19)*( .75+.30*hash((j+1)%points.length,13,seed)),end=[b[0]+(a[0]-b[0])*nr/len,b[1]+(a[1]-b[1])*nr/len],N=Math.max(2,Math.ceil(Math.hypot(end[0]-leave[0],end[1]-leave[1])/.030)),nx=-(b[1]-a[1])/len,nz=(b[0]-a[0])/len;
  const chips=Array.from({length:Math.max(1,Math.floor(len/.18))},(_,k)=>({t:.06+.88*hash(k,j,seed+23),w:Math.min(.14,(.035+.045*hash(k,j,seed+31))/len),d:.005+.028*Math.pow(hash(k,j,seed+41),2)}));
  for(let k=0;k<N;k++){const t=k/N;let chip=.0022*noise(t*19,j*3.7,seed+47);for(const c of chips)chip+=c.d*Math.max(0,1-Math.abs(t-c.t)/c.w)**1.3;chip*=Math.sin(Math.PI*t);boundary.push([T.MathUtils.lerp(leave[0],end[0],t)+nx*chip,T.MathUtils.lerp(leave[1],end[1],t)+nz*chip]);}
 }
 const clean=[];for(const p of boundary)if(!clean.length||Math.hypot(p[0]-clean.at(-1)[0],p[1]-clean.at(-1)[1])>1e-5)clean.push(p);if(Math.hypot(clean[0][0]-clean.at(-1)[0],clean[0][1]-clean.at(-1)[1])<1e-5)clean.pop();
 let faces=[];const N=clean.length,vertices=[],rings=[],extX=Math.max(...outline.map(p=>Math.abs(p[0]-cx))),extZ=Math.max(...outline.map(p=>Math.abs(p[1]-cz)));
 const ring=(inset,y)=>{const ids=[];for(let i=0;i<N;i++){const [x,z]=clean[i],d=Math.hypot(cx-x,cz-z),widthFactor=.65+.60*noise(x*19,z*17,seed+127),dropFactor=.65+.60*noise(x*23,z*21,seed+129),upper=y>=top-drop-.001,yy=upper?top-(top-y)*dropFactor:y,ripple=.0012*(noise(x*31,z*29,seed+53)-.5),id=vertices.length;vertices.push(new T.Vector3(x+(cx-x)/d*inset*widthFactor,yy+ripple,z+(cz-z)/d*inset*widthFactor));ids.push(id);}rings.push(ids);return ids;};
 ring(.002,top-thickness);ring(.001,top-thickness*.52);ring(0,top-drop);
 // Narrow broken chamfer planes replace the broad rounded reflective rim.
 for(const t of[.25,.75,1])ring(bevel*t,top-drop*(1-t));
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++){const k=(i+1)%N,a=rings[j],b=rings[j+1];faces.push({v:[a[i],b[i],a[k]],top:false},{v:[a[k],b[i],b[k]],top:false});}
 const topRing=rings.at(-1),tri=T.ShapeUtils.triangulateShape(topRing.map(i=>new T.Vector2(vertices[i].x,vertices[i].z)),[]),bottomTri=T.ShapeUtils.triangulateShape(rings[0].map(i=>new T.Vector2(vertices[i].x,vertices[i].z)),[]);
 for(const [a,b,c]of tri)faces.push({v:[topRing[a],topRing[c],topRing[b]],top:true});for(const[a,b,c]of bottomTri)faces.push({v:[rings[0][a],rings[0][b],rings[0][c]],top:false});
 const spacing=record.detailSpacing??(isCurb?.043:.037),key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(let level=0;level<14;level++){
  const split=new Map();for(const f of faces)if(f.top)for(let j=0;j<3;j++){const a=f.v[j],b=f.v[(j+1)%3];if(vertices[a].distanceToSquared(vertices[b])>spacing*spacing&&!split.has(key(a,b))){split.set(key(a,b),vertices.length);vertices.push(vertices[a].clone().add(vertices[b]).multiplyScalar(.5));}}
  if(!split.size)break;const next=[];for(const f of faces){let[a,b,c]=f.v,ab=split.get(key(a,b)),bc=split.get(key(b,c)),ca=split.get(key(c,a)),count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);const add=(...v)=>next.push({v,top:f.top});if(!count){next.push(f);continue;}if(count===3){add(a,ab,ca);add(ab,b,bc);add(ca,bc,c);add(ab,bc,ca);}else if(count===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}add(a,ab,c);add(ab,b,c);}else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}add(b,bc,ab);add(a,ab,c);add(ab,bc,c);}}faces=next;
 }
 const edge=(x,z)=>{let d=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return d;};
 const hollows=Array.from({length:isCurb?0:1+Math.floor(hash(3,7,seed+59)*2)},(_,k)=>({x:cx+(hash(k,7,seed+61)-.5)*extX*.9,z:cz+(hash(k,9,seed+67)-.5)*extZ*.9,rx:Math.max(.06,extX*(.25+.23*hash(k,11,seed+71))),rz:Math.max(.06,extZ*(.25+.23*hash(k,13,seed+73))),depth:.003+.005*hash(k,17,seed+79)}));
 const wetAt=(x,z)=>{let mask=0,depth=0;for(const h of hollows){const u=(x-h.x)/h.rx,v=(z-h.z)/h.rz,q=Math.sqrt(u*u+v*v),m=smooth(-.1,.35,1-q+.14*(noise(x*12,z*12,seed+83)-.5))*smooth(.02,.10,edge(x,z));mask=Math.max(mask,m*.72);depth=Math.max(depth,m*h.depth);}return{mask,depth};};
 const tiltX=.004*(hash(2,3,seed+89)-.5),tiltZ=.004*(hash(5,7,seed+97)-.5),angle=hash(11,17,seed+101)*Math.PI*2,cc=Math.cos(angle),ss=Math.sin(angle);
 const field=(x,z)=>{const e=edge(x,z),u=(x-cx)*cc+(z-cz)*ss,v=-(x-cx)*ss+(z-cz)*cc,w=wetAt(x,z),broad=.006*(noise(x*2.4,z*2.7,seed+103)-.5),riven=.0035*(noise(u*4.5,v*6.5,seed+107)-.5)+.0020*(noise(u*18,v*17,seed+109)-.5),crease=-.0025*Math.exp(-Math.pow((v+.055*Math.sin(u*9+seed)-.10)/.023,2))*smooth(.02,.10,e),edgeWear=-.0045*(1-smooth(.010,.048,e))*noise(x*29,z*27,seed+113),aggregate=(isCurb?.45:.80)*sampleAggregateRelief04(x,z,seed);return broad+riven+crease+edgeWear+aggregate-w.depth+tiltX*(x-cx)/Math.max(.1,extX)+tiltZ*(z-cz)/Math.max(.1,extZ);};
 const p=[],uv=[],colors=[],wetness=[],dampness=[];for(const q of vertices){const blend=Math.pow(T.MathUtils.clamp((q.y-(top-thickness))/thickness,0,1),4),wet=wetAt(q.x,q.z);q.y+=field(q.x,q.z)*blend;const arris=1-smooth(top-.009,top-.002,q.y),edgeDamp=1-.25*arris*(.65+.35*noise(q.x*31,q.z*29,seed+149));const tone=edgeDamp*(.82+.28*hash(3,7,seed+131))*(.88+.18*noise(q.x*3.7,q.z*3.7,seed+137))*(1-.12*smooth(.55,.75,noise(q.x*12,q.z*12,seed+139)));colors.push(tone*.99,tone,tone*.975);p.push(q.x,q.y,q.z);uv.push(q.x,q.z);wetness.push(wet.mask*blend);dampness.push(isCurb?0:(record.dampPropensity??.25)*blend);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('r4Wetness',new T.Float32BufferAttribute(wetness,1));g.setAttribute('r4Dampness',new T.Float32BufferAttribute(dampness,1));g.setIndex(faces.flatMap(f=>f.v));g.computeVertexNormals();
 g.userData.ground367={record:record.id,closedSolid:true,thicknessMetres:thickness,bevelWidthMetres:bevel,bevelDropMetres:drop,nominalJointHalfGapMetres:gap,topSpacingMetres:spacing,narrowBrokenChamfer:true,rivenReliefMetres:[-.016,.009],metricAggregate:'Existing authored granite-aggregate04, no photograph-derived height',beddingTopY:.028,referenceRGBUsed:false};return g;
}

export function createJointMoss367(){
 const N=22,R=5,p=[0,1,0],uv=[.5,.5],ix=[];
 for(let j=1;j<=R;j++)for(let k=0;k<N;k++){const t=j/R,a=k*Math.PI*2/N,r=t*(.94+.06*Math.sin(k*2.1)),y=Math.pow(Math.max(0,1-t*t),.65)*(.82+.18*Math.sin(k*2.7+j));p.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(.5+.5*Math.cos(a)*t,.5+.5*Math.sin(a)*t);}
 for(let k=0;k<N;k++)ix.push(0,1+(k+1)%N,1+k);for(let j=0;j<R-1;j++)for(let k=0;k<N;k++){const a=1+j*N+k,b=1+j*N+(k+1)%N,c=a+N,d=b+N;ix.push(a,b,c,b,d,c);}const base=p.length/3;p.push(0,-.08,0);uv.push(.5,.5);for(let k=0;k<N;k++)ix.push(base,1+(R-1)*N+k,1+(R-1)*N+(k+1)%N);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.ground367={closedRootedCushion:true,rootY:0,peakY:1};return g;
}

let coarseNormal367=null;
export async function loadGround367Maps(){
 coarseNormal367=await new T.TextureLoader().loadAsync(new URL('../assets/monastery-stone-floor/individual-stone-nor_gl.png',import.meta.url).href);coarseNormal367.name='CC0-MonasteryStoneFloor-single-face-normal-ground367';coarseNormal367.wrapS=coarseNormal367.wrapT=T.MirroredRepeatWrapping;coarseNormal367.anisotropy=8;return coarseNormal367;
}
export function installFlagstoneFinish367(material){
 if(!coarseNormal367)throw Error('Ground367 CC0 coarse normal must load before paving');
 const oldNormal=material.normalMap,normal=coarseNormal367.clone();normal.needsUpdate=true;material.normalMap=normal;material.normalScale.set(.26,.26);material.userData.maps.normalMap=normal;oldNormal.dispose();material.vertexColors=true;material.needsUpdate=true;
 const inherited=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=shader=>{inherited(shader);const rules=[['roughnessFactor=clamp(mix(roughnessFactor,.145,r4WetMask*.96),.14,1.0);','roughnessFactor=clamp(mix(roughnessFactor,.36,r4WetMask*.80),.34,1.0);'],['material.clearcoat=mix(material.clearcoat,.96,r4WetMask*.92);','material.clearcoat=mix(material.clearcoat,.50,r4WetMask*.78);'],['material.clearcoatRoughness=mix(material.clearcoatRoughness,.12,r4WetMask*.94);','material.clearcoatRoughness=mix(material.clearcoatRoughness,.32,r4WetMask*.82);'],['diffuseColor.rgb*=1.0-.38*r4WetMask;','diffuseColor.rgb*=1.0-.30*r4WetMask;']];for(const[a,b]of rules){if(!shader.fragmentShader.includes(a))throw Error('367 wet granite boundary changed: '+a);shader.fragmentShader=shader.fragmentShader.replace(a,b);}for(const pair of['zy','xz','xy'])shader.fragmentShader=shader.fragmentShader.replace('texture2D(normalMap,ssP.'+pair+')','texture2D(normalMap,ssP.'+pair+'*1.4105902778)');};
 material.customProgramCacheKey=()=>key()+'-ground367-r03-narrow-chamfer-restrained-riven';material.userData.ground367={surface:'Existing CC0 granite albedo/roughness and MonasteryStoneFloor single-face normal, real riven geometry, discontinuous water film and mineral-patina vertex reflectance',normalRepeatMetres:.225,waterIOR:1.333,minimumWetRoughness:.34,referencePixelsUsed:false};return material;
}
