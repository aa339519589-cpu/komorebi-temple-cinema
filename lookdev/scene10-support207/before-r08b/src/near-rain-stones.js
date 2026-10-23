// Twelve individual foreground stones. The photograph informs wear scale only;
// no reference RGB/depth is read. All dimensions below are in world metres.
export const nearRainStoneProfiles=Object.freeze({
 '9:3':{chips:[[.09,.041,.014,.010],[.64,.024,.009,.006]],basin:[-.18,.21,.18,.12,.0048],pits:51},
 '9:4':{chips:[[.31,.032,.018,.011],[.82,.019,.007,.005]],basin:[.11,-.15,.14,.22,.0052],pits:43},
 '9:5':{chips:[[.16,.027,.010,.007],[.53,.043,.022,.013],[.93,.019,.008,.006]],basin:[-.12,-.24,.20,.12,.0036],pits:56},
 '10:3':{chips:[[.24,.021,.009,.005],[.72,.037,.017,.011]],basin:[.22,.04,.17,.15,.0043],pits:47},
 '10:4':{chips:[[.04,.029,.013,.008],[.47,.045,.023,.014]],basin:[-.20,-.12,.21,.18,.0060],pits:61},
 '10:5':{chips:[[.39,.028,.011,.006],[.89,.040,.019,.012]],basin:[.13,.19,.18,.12,.0041],pits:44},
 '11:3':{chips:[[.13,.033,.015,.009],[.57,.020,.008,.006],[.78,.026,.011,.007]],basin:[-.09,.17,.15,.21,.0053],pits:53},
 '11:4':{chips:[[.28,.046,.024,.014],[.68,.022,.010,.007]],basin:[.17,-.09,.22,.16,.0065],pits:57},
 '11:5':{chips:[[.07,.023,.009,.006],[.48,.036,.016,.010]],basin:[-.21,-.08,.16,.20,.0044],pits:48},
 '12:3':{chips:[[.36,.039,.021,.013],[.75,.029,.012,.008]],basin:[.06,.19,.21,.15,.0058],pits:64},
 '12:4':{chips:[[.18,.030,.014,.009],[.62,.047,.025,.015],[.91,.018,.007,.005]],basin:[-.17,-.13,.18,.22,.0062],pits:59},
 '12:5':{chips:[[.43,.025,.011,.008],[.85,.035,.018,.011]],basin:[.18,.11,.17,.14,.0046],pits:46},
 // Closest foreground courses use the same closed metric construction, with
 // independent deterministic wear. These faces were formerly beyond the
 // twelve detailed blocks and still exposed deep, unfilled black seams.
 ...Object.fromEntries(Array.from({length:48},(_,k)=>{
  const row=14+Math.floor(k/4),column=k%4,h=n=>{const q=Math.sin((row*97+column*37+n*23+142)*12.9898)*43758.5453;return q-Math.floor(q);};
  return[row+':'+column,{chips:Array.from({length:6},(_,n)=>[(n+.18+.60*h(n))/6,.024+.040*h(n+7),.009+.019*h(n+13),.005+.011*h(n+19)]),basin:[(h(30)-.5)*.35,(h(31)-.5)*.32,.18+.14*h(32),.13+.13*h(33),.004+.004*h(34)],pits:90+Math.floor(45*h(35))}];
 }))
});
const fract=x=>x-Math.floor(x);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x,z,s)=>fract(Math.sin(x*127.1+z*311.7+s*17.13)*43758.5453);
function noise(x,z,s){
 const i=Math.floor(x),j=Math.floor(z),a=smooth(0,1,x-i),b=smooth(0,1,z-j);
 return(1-b)*((1-a)*hash(i,j,s)+a*hash(i+1,j,s))+b*((1-a)*hash(i,j+1,s)+a*hash(i+1,j+1,s));
}
function inside(x,z,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes;}

// Shared-edge subdivision keeps one vertex on both sides of each cap edge.
// Its final boundary also drives every bevel, wall and underside boundary.
function refinedCap(T,outline,spacing=.014){
 const vertices=outline.map(p=>[...p]),key=(a,b)=>a<b?a+':'+b:b+':'+a;
 let faces=T.ShapeUtils.triangulateShape(outline.map(p=>new T.Vector2(...p)),[]);
 for(let iteration=0;iteration<12;iteration++){
  const edges=new Map();
  for(const f of faces)for(let k=0;k<3;k++){
   const a=f[k],b=f[(k+1)%3],p=vertices[a],q=vertices[b],id=key(a,b);
   if((p[0]-q[0])**2+(p[1]-q[1])**2>spacing*spacing&&!edges.has(id)){
    edges.set(id,vertices.length);vertices.push([(p[0]+q[0])*.5,(p[1]+q[1])*.5]);
   }
  }
  if(!edges.size)break;
  const next=[];
  for(const f of faces){
   let[a,b,c]=f,ab=edges.get(key(a,b)),bc=edges.get(key(b,c)),ca=edges.get(key(c,a));
   const count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);
   if(!count){next.push(f);continue;}
   if(count===3){next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);continue;}
   if(count===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}next.push([a,ab,c],[ab,b,c]);}
   else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}next.push([b,bc,ab],[a,ab,c],[ab,bc,c]);}
  }
  faces=next;if(faces.length>220000)throw Error('Near-stone cap exceeds its bounded mesh budget');
 }
 for(const f of faces){const[a,b,c]=f,p=vertices[a],q=vertices[b],r=vertices[c];if((q[1]-p[1])*(r[0]-p[0])-(q[0]-p[0])*(r[1]-p[1])<0)[f[1],f[2]]=[f[2],f[1]];}
 const edgeMap=new Map();for(const f of faces)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],id=key(a,b),record=edgeMap.get(id);if(record)record.count++;else edgeMap.set(id,{a,b,count:1});}
 const next=new Map();for(const e of edgeMap.values())if(e.count===1)next.set(e.a,e.b);
 const boundary=[],first=next.keys().next().value;let cursor=first;do{boundary.push(cursor);cursor=next.get(cursor);if(cursor===undefined||boundary.length>next.size)throw Error('Open near-stone boundary '+JSON.stringify({vertices:vertices.length,faces:faces.length,boundaryEdges:next.size,arrived:cursor,walked:boundary.length,edgeCounts:[...edgeMap.values()].reduce((r,e)=>(r[e.count]=(r[e.count]||0)+1,r),{}),degenerate:faces.filter(f=>{const[a,b,c]=f.map(i=>vertices[i]);return Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-13;}).length}));}while(cursor!==first);
 return{vertices,faces,boundary};
}

function meshWriter(T){
 const positions=[],normals=[];
 const append=(p,n)=>{positions.push(...p);normals.push(...n);};
 const triangle=(a,b,c,toward)=>{
  const normal=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));
  if(toward&&normal.dot(toward)<0){[b,c]=[c,b];normal.negate();}normal.normalize();
  for(const p of[a,b,c])append(p,normal.toArray());
 };
 return{append,triangle,finish(){
  // Adaptive cap edges can create sub-micrometre slivers. Weld positions at
  // 1 micrometre before Float32 conversion, retaining separate hard normals.
  const shared=new Map(),faces=new Map(),cancelled=new Set(),outP=[],outN=[],outUV=[];
  for(let i=0;i<positions.length;i+=9){
   const p=[],keys=[];for(let j=0;j<3;j++){const a=positions.slice(i+j*3,i+j*3+3),grid=a.map(x=>Math.round(x*1e6)),key=grid.join(',');if(!shared.has(key))shared.set(key,grid.map(x=>Math.fround(x*1e-6)));p.push(shared.get(key));keys.push(key);}
   if(new Set(keys).size<3)continue;
   const faceKey=[...keys].sort().join('|'),forward=[keys.join('|'),[keys[1],keys[2],keys[0]].join('|'),[keys[2],keys[0],keys[1]].join('|')].sort()[0],backward=[keys[0],keys[2],keys[1]].join('|'),sign=forward<[backward,[keys[2],keys[1],keys[0]].join('|'),[keys[1],keys[0],keys[2]].join('|')].sort()[0]?1:-1,previous=faces.get(faceKey);
   if(previous){if(previous.sign!==sign){cancelled.add(previous.index);faces.delete(faceKey);}continue;}
   faces.set(faceKey,{index:outP.length/9,sign});
   for(let j=0;j<3;j++){outP.push(...p[j]);outN.push(...normals.slice(i+j*3,i+j*3+3));outUV.push(p[j][0],-p[j][2]);}
  }
  let finalP=outP,finalN=outN,finalUV=outUV;if(cancelled.size){finalP=[];finalN=[];finalUV=[];for(let i=0;i<outP.length/9;i++)if(!cancelled.has(i)){finalP.push(...outP.slice(i*9,i*9+9));finalN.push(...outN.slice(i*9,i*9+9));finalUV.push(...outUV.slice(i*6,i*6+6));}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(finalP,3));g.setAttribute('normal',new T.Float32BufferAttribute(finalN,3));g.setAttribute('uv',new T.Float32BufferAttribute(finalUV,2));return g;
 }};
}

export function createNearRainFlagstone(T,{points,topOffset=0,seed,id}){
 const profile=nearRainStoneProfiles[id];if(!profile)throw Error('Unknown near rain stone '+id);
 const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
 const widths=[Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))];
 const lengths=points.map((p,k)=>Math.hypot(points[(k+1)%points.length][0]-p[0],points[(k+1)%points.length][1]-p[1])),perimeter=lengths.reduce((a,b)=>a+b,0);
 const starts=[];lengths.reduce((sum,length)=>(starts.push(sum),sum+length),0);
 const chips=profile.chips.map(([fraction,width,setback,loss])=>{const wanted=fraction*perimeter;let k=lengths.findIndex((length,i)=>wanted<starts[i]+length);if(k<0)k=lengths.length-1;width=Math.min(width,lengths[k]*.30);return[starts[k]+clamp(wanted-starts[k],width+.015,lengths[k]-width-.015),width,setback,loss];});
 const outer=[],rimDrop=[],lip=[];let travelled=0;
 for(let k=0;k<points.length;k++){
  const a=points[k],b=points[(k+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=lengths[k],nx=-dz/length,nz=dx/length;
  const steps=Math.max(2,Math.ceil(length/.009));
  for(let j=0;j<steps;j++){
   const t=j/steps,s=travelled+t*length;if(j>0&&Math.min(t*length,(1-t)*length)<.014)continue;let inset=0,drop=0;
   for(const [centre,halfWidth,setback,loss] of chips){
    const d=Math.min(Math.abs(s-centre),perimeter-Math.abs(s-centre));
    // Angular, compact spalls. Their shoulders and remaining edge segments are
    // solid facets, rather than a repeated round-over around the whole stone.
    const w=Math.max(0,1-d/halfWidth),cut=Math.min(1,w*1.35);
    inset+=setback*cut;drop+=loss*cut;
   }
   outer.push([a[0]+dx*t+nx*inset,a[1]+dz*t+nz*inset]);
   rimDrop.push(.0015+.0025*noise(s*41,seed*.07,seed)+drop);
   lip.push((.0035+.0045*noise(s*13,seed*.13,seed+3))*(1-.37*Math.min(1,inset/.016)));
  }
  travelled+=length;
 }
 const inner=outer.map(([x,z],k)=>{
  const a=outer[(k+outer.length-1)%outer.length],b=outer[(k+1)%outer.length],d0=Math.hypot(x-a[0],z-a[1]),d1=Math.hypot(b[0]-x,b[1]-z);
  const n0=[-(z-a[1])/d0,(x-a[0])/d0],n1=[-(b[1]-z)/d1,(b[0]-x)/d1],m=[n0[0]+n1[0],n0[1]+n1[1]],length=Math.hypot(...m);m[0]/=length;m[1]/=length;
  const inset=lip[k]/Math.max(.45,m[0]*n1[0]+m[1]*n1[1]);return[x+m[0]*inset,z+m[1]*inset];
 });
 const pits=[];
 for(let n=0;n<profile.pits*4&&pits.length<profile.pits;n++){
  const x=cx+(hash(n,17,seed)-.5)*widths[0]*.94,z=cz+(hash(n,29,seed)-.5)*widths[1]*.94;
  if(!inside(x,z,inner))continue;
  pits.push({x,z,rx:.009+.014*hash(n,31,seed),rz:.008+.013*hash(n,37,seed),depth:.0015+.0035*hash(n,43,seed),angle:hash(n,47,seed)*6.283});
 }
 // A few larger shallow flakes are different on each block. Their angular
 // depression is part of the same continuous cap, never an added dark decal.
 for(let n=0;n<3;n++){
  const x=cx+(hash(n,61,seed)-.5)*widths[0]*.68,z=cz+(hash(n,67,seed)-.5)*widths[1]*.68;
  if(inside(x,z,inner))pits.push({x,z,rx:.024+.016*hash(n,71,seed),rz:.018+.016*hash(n,73,seed),depth:.004+.004*hash(n,79,seed),angle:hash(n,83,seed)*6.283});
 }
 const basin=profile.basin,bx=cx+basin[0]*widths[0],bz=cz+basin[1]*widths[1],tiltX=(hash(7,5,seed)-.5)*.006,tiltZ=(hash(13,11,seed)-.5)*.007;
 const surface=(x,z)=>{
  const r=Math.hypot((x-bx)/basin[2],(z-bz)/basin[3]);
  let y=.046+topOffset+tiltX*(x-cx)+tiltZ*(z-cz)+.0028*(noise(x*6.7,z*6.7,seed)-.5)+.0012*(noise(x*31,z*31,seed+5)-.5)-basin[4]*(1-smooth(.18,1,r));
  for(const pit of pits){const dx=x-pit.x,dz=z-pit.z,c=Math.cos(pit.angle),s=Math.sin(pit.angle),u=(dx*c+dz*s)/pit.rx,v=(-dx*s+dz*c)/pit.rz,q=Math.max(Math.abs(u),Math.abs(v),Math.abs((u+v)*.68));if(q<1)y-=pit.depth*(1-smooth(.20,1,q));}
  return y;
 };
 const cap=refinedCap(T,inner),capGeometry=new T.BufferGeometry(),position=cap.vertices.flatMap(([x,z])=>[x,surface(x,z),z]),indices=cap.faces.flat();
 capGeometry.setAttribute('position',new T.Float32BufferAttribute(position,3));capGeometry.setIndex(indices);capGeometry.computeVertexNormals();
 const writer=meshWriter(T),up=new T.Vector3(0,1,0);
 for(const i of indices)writer.append(position.slice(i*3,i*3+3),[capGeometry.attributes.normal.getX(i),capGeometry.attributes.normal.getY(i),capGeometry.attributes.normal.getZ(i)]);
 const outerAt=new Map();
 for(const id of cap.boundary){
  const point=cap.vertices[id];let best=Infinity,edge=0,t=0;
  for(let k=0;k<inner.length;k++){
   const a=inner[k],b=inner[(k+1)%inner.length],dx=b[0]-a[0],dz=b[1]-a[1],q=clamp(((point[0]-a[0])*dx+(point[1]-a[1])*dz)/(dx*dx+dz*dz),0,1),distance=(point[0]-a[0]-q*dx)**2+(point[1]-a[1]-q*dz)**2;
   if(distance<best){best=distance;edge=k;t=q;}
  }
  const j=(edge+1)%outer.length;
  outerAt.set(id,{x:outer[edge][0]*(1-t)+outer[j][0]*t,z:outer[edge][1]*(1-t)+outer[j][1]*t,drop:rimDrop[edge]*(1-t)+rimDrop[j]*t});
 }
 const O=id=>{const p=outerAt.get(id);return[p.x,surface(p.x,p.z)-p.drop,p.z];},I=id=>[cap.vertices[id][0],surface(...cap.vertices[id]),cap.vertices[id][1]],S=id=>{const a=O(id),b=I(id),p=outerAt.get(id);return[a[0]+(b[0]-a[0])*.38,surface(p.x,p.z)-p.drop*.48,a[2]+(b[2]-a[2])*.38];};
 for(let k=0;k<cap.boundary.length;k++){
  const i=cap.boundary[k],j=cap.boundary[(k+1)%cap.boundary.length];
  writer.triangle(O(i),S(i),O(j),up);writer.triangle(O(j),S(i),S(j),up);
  writer.triangle(S(i),I(i),S(j),up);writer.triangle(S(j),I(i),I(j),up);
  const a=O(i),b=O(j),A=[a[0],-.09+topOffset,a[2]],B=[b[0],-.09+topOffset,b[2]],out=new T.Vector3(-(b[2]-a[2]),0,b[0]-a[0]);
  writer.triangle(A,a,B,out);writer.triangle(B,a,b,out);
 }
 // Reuse the cap without warping its skinny interior triangles. A flat lower
 // annulus joins that cap to the outer wall, sharing every boundary point.
 const down=new T.Vector3(0,-1,0),bottomI=id=>[cap.vertices[id][0],-.09+topOffset,cap.vertices[id][1]],bottomO=id=>{const p=outerAt.get(id);return[p.x,-.09+topOffset,p.z];};
 for(const f of cap.faces)writer.triangle(...f.map(bottomI),down);
 for(let k=0;k<cap.boundary.length;k++){const i=cap.boundary[k],j=cap.boundary[(k+1)%cap.boundary.length];writer.triangle(bottomO(i),bottomI(i),bottomO(j),down);writer.triangle(bottomO(j),bottomI(i),bottomI(j),down);}
 capGeometry.dispose();const g=writer.finish();g.computeBoundingBox();
 g.userData.rainStoneFootprint=cap.boundary.map(id=>{const p=outerAt.get(id);return[p.x,p.z];});
 g.userData.nearRainStone={id,seed,profile,triangles:g.attributes.position.count/3,pitCount:pits.length,footprintXZ:[g.boundingBox.min.x,g.boundingBox.min.z,g.boundingBox.max.x,g.boundingBox.max.z],topYRange:[Math.min(...position.filter((_,i)=>i%3===1)),Math.max(...position.filter((_,i)=>i%3===1))],capMaxInteriorEdgeMetres:.014,remainingLipMetres:[.0022,.0080],chipSetbackMetres:profile.chips.map(c=>c[2]),source:'Authored closed mesh; no reference image sampling'};
 g.userData.heightAt=surface;g.userData.topYMax=g.userData.nearRainStone.topYRange[1];
 return g;
}

// A solid, shallow soil/granite-grit bed contacts the existing substrate and
// occupies the gaps between these blocks. It stops the joint reading as an
// empty black water channel while keeping the tops below the original water.
export function createNearJointBed(T,{points,seed}){
 const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cz=points.reduce((a,p)=>a+p[1],0)/points.length;
 const outline=points.map(([x,z])=>{const length=Math.hypot(x-cx,z-cz);return[x+(x-cx)/length*.012,z+(z-cz)/length*.012];});
 const cap=refinedCap(T,outline,.035),height=(x,z)=>{
  let edge=Infinity;for(let k=0;k<points.length;k++){const a=points[k],b=points[(k+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);edge=Math.min(edge,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}
  return .025+.009*(1-smooth(.010,.045,edge))+.0022*(noise(x*29,z*29,seed)-.5)+.0012*(noise(x*71,z*71,seed+1)-.5);
 },writer=meshWriter(T);
 for(const f of cap.faces)writer.triangle(...f.map(i=>[cap.vertices[i][0],height(...cap.vertices[i]),cap.vertices[i][1]]),new T.Vector3(0,1,0));
 for(let k=0;k<cap.boundary.length;k++){
  const a=cap.vertices[cap.boundary[k]],b=cap.vertices[cap.boundary[(k+1)%cap.boundary.length]],A=[a[0],height(...a),a[1]],B=[b[0],height(...b),b[1]],bottomA=[a[0],-.20,a[1]],bottomB=[b[0],-.20,b[1]],out=new T.Vector3(-(b[1]-a[1]),0,b[0]-a[0]);
  writer.triangle(bottomA,A,bottomB,out);writer.triangle(bottomB,A,B,out);
 }
 for(const f of cap.faces)writer.triangle(...f.map(i=>[cap.vertices[i][0],-.20,cap.vertices[i][1]]),new T.Vector3(0,-1,0));
 const g=writer.finish();g.userData.nearJointBed={topMetres:[.0233,.0357],bedInteriorMetres:[.0233,.0267],jointBermMetres:[.0323,.0357],bottomMetres:-.20,contact:'Overlaps original substrate top -.19 m; only the real joint edges rise, preserving lower bed under face basins',footprintExpansionMetres:.012};return g;
}
