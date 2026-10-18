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
 '12:5':{chips:[[.43,.025,.011,.008],[.85,.035,.018,.011]],basin:[.18,.11,.17,.14,.0046],pits:46}
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

function triangulateBoundary(T,outline){
 const N=outline.length,pending=T.ShapeUtils.triangulateShape(outline.map(p=>new T.Vector2(...p)),[]),faces=[];
 const boundaryChain=(a,b)=>{
  const A=outline[a],B=outline[b],dx=B[0]-A[0],dz=B[1]-A[1],length2=dx*dx+dz*dz;
  for(const sign of[1,-1]){
   const chain=[a];let k=(a+sign+N)%N;
   while(k!==b&&chain.length<N){
    const P=outline[k],cross=(P[0]-A[0])*dz-(P[1]-A[1])*dx,dot=(P[0]-A[0])*dx+(P[1]-A[1])*dz;
    if(Math.abs(cross)>1e-9||dot<0||dot>length2)break;
    chain.push(k);k=(k+sign+N)%N;
   }
   if(k===b&&chain.length>1)return[...chain,b];
  }
  return null;
 };
 while(pending.length){
  const f=pending.pop();let split=false;
  for(let k=0;k<3;k++){
   const a=f[k],b=f[(k+1)%3],c=f[(k+2)%3],chain=boundaryChain(a,b);
   if(chain){for(let j=0;j<chain.length-1;j++)pending.push([chain[j],chain[j+1],c]);split=true;break;}
  }
  if(!split)faces.push(f);
 }
 return faces;
}

// Shared-edge subdivision keeps a single vertex on both sides of every cap
// edge. The initial boundary is retained exactly for the bevel / side rings.
function refinedCap(T,outline,spacing=.010){
 const vertices=outline.map(p=>[...p]),N=vertices.length,boundary=new Set(),key=(a,b)=>a<b?a+':'+b:b+':'+a;
 for(let i=0;i<N;i++)boundary.add(key(i,(i+1)%N));
 let faces=triangulateBoundary(T,outline);
 for(let iteration=0;iteration<12;iteration++){
  const edges=new Map();
  for(const f of faces)for(let k=0;k<3;k++){
   const a=f[k],b=f[(k+1)%3],p=vertices[a],q=vertices[b],id=key(a,b);
   if(!boundary.has(id)&&(p[0]-q[0])**2+(p[1]-q[1])**2>spacing*spacing&&!edges.has(id)){
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
  faces=next;
 }
 for(const f of faces){const[a,b,c]=f,p=vertices[a],q=vertices[b],r=vertices[c];if((q[1]-p[1])*(r[0]-p[0])-(q[0]-p[0])*(r[1]-p[1])<0)[f[1],f[2]]=[f[2],f[1]];}
 return{vertices,faces};
}

function meshWriter(T){
 const positions=[],normals=[],uv=[];
 const append=(p,n)=>{positions.push(...p);normals.push(...n);uv.push(p[0],-p[2]);};
 const triangle=(a,b,c,toward)=>{
  const normal=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));
  if(toward&&normal.dot(toward)<0){[b,c]=[c,b];normal.negate();}normal.normalize();
  for(const p of[a,b,c])append(p,normal.toArray());
 };
 return{append,triangle,finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return g;}};
}

export function createNearRainFlagstone(T,{points,topOffset=0,seed,id}){
 const profile=nearRainStoneProfiles[id];if(!profile)throw Error('Unknown near rain stone '+id);
 const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
 const widths=[Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]))];
 const lengths=points.map((p,k)=>Math.hypot(points[(k+1)%points.length][0]-p[0],points[(k+1)%points.length][1]-p[1])),perimeter=lengths.reduce((a,b)=>a+b,0);
 const outer=[],rimDrop=[],lip=[],inward=[];let travelled=0;
 for(let k=0;k<points.length;k++){
  const a=points[k],b=points[(k+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=lengths[k],nx=-dz/length,nz=dx/length;
  const steps=Math.max(2,Math.ceil(length/.006));
  for(let j=0;j<steps;j++){
   const t=j/steps,s=travelled+t*length;let inset=0,drop=0;
   for(const [fraction,halfWidth,setback,loss] of profile.chips){
    const d=Math.min(Math.abs(s-fraction*perimeter),perimeter-Math.abs(s-fraction*perimeter));
    // Angular, compact spalls. Their shoulders and remaining edge segments are
    // solid facets, rather than a repeated round-over around the whole stone.
    const w=Math.max(0,1-d/halfWidth),cut=Math.min(1,w*1.35);
    inset+=setback*cut;drop+=loss*cut;
   }
   outer.push([a[0]+dx*t+nx*inset,a[1]+dz*t+nz*inset]);inward.push([nx,nz]);
   rimDrop.push(.0015+.0025*noise(s*41,seed*.07,seed)+drop);
   lip.push((.0035+.0045*noise(s*13,seed*.13,seed+3))*(1-.37*Math.min(1,inset/.016)));
  }
  travelled+=length;
 }
 const inner=outer.map(([x,z],k)=>[x+inward[k][0]*lip[k],z+inward[k][1]*lip[k]]);
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
 for(let k=0;k<outer.length;k++){
  const j=(k+1)%outer.length,O=n=>[outer[n][0],surface(...outer[n])-rimDrop[n],outer[n][1]],I=n=>[inner[n][0],surface(...inner[n]),inner[n][1]];
  const S=n=>[outer[n][0]+inward[n][0]*lip[n]*.38,surface(...outer[n])-rimDrop[n]*.48,outer[n][1]+inward[n][1]*lip[n]*.38];
  writer.triangle(O(k),S(k),O(j),up);writer.triangle(O(j),S(k),S(j),up);
  writer.triangle(S(k),I(k),S(j),up);writer.triangle(S(j),I(k),I(j),up);
  const a=O(k),b=O(j),A=[a[0],-.09+topOffset,a[2]],B=[b[0],-.09+topOffset,b[2]],out=new T.Vector3(-inward[k][0],0,-inward[k][1]);
  writer.triangle(A,a,B,out);writer.triangle(B,a,b,out);
 }
 const bottom=triangulateBoundary(T,outer);
 for(const f of bottom)writer.triangle(...f.map(i=>[outer[i][0],-.09+topOffset,outer[i][1]]),new T.Vector3(0,-1,0));
 capGeometry.dispose();const g=writer.finish();g.computeBoundingBox();
 g.userData.rainStoneFootprint=outer;
 g.userData.nearRainStone={id,seed,profile,triangles:g.attributes.position.count/3,pitCount:pits.length,footprintXZ:[g.boundingBox.min.x,g.boundingBox.min.z,g.boundingBox.max.x,g.boundingBox.max.z],topYRange:[Math.min(...position.filter((_,i)=>i%3===1)),Math.max(...position.filter((_,i)=>i%3===1))],capMaxInteriorEdgeMetres:.010,remainingLipMetres:[.0022,.0080],chipSetbackMetres:profile.chips.map(c=>c[2]),source:'Authored closed mesh; no reference image sampling'};
 return g;
}

// A solid, shallow soil/granite-grit bed contacts the existing substrate and
// occupies the gaps between these blocks. It stops the joint reading as an
// empty black water channel while keeping the tops below the original water.
export function createNearJointBed(T,{points,seed}){
 const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cz=points.reduce((a,p)=>a+p[1],0)/points.length;
 const outline=points.map(([x,z])=>{const length=Math.hypot(x-cx,z-cz);return[x+(x-cx)/length*.012,z+(z-cz)/length*.012];});
 const cap=refinedCap(T,outline,.035),height=(x,z)=>.025+.0022*(noise(x*29,z*29,seed)-.5)+.0012*(noise(x*71,z*71,seed+1)-.5),writer=meshWriter(T);
 for(const f of cap.faces)writer.triangle(...f.map(i=>[cap.vertices[i][0],height(...cap.vertices[i]),cap.vertices[i][1]]),new T.Vector3(0,1,0));
 for(let k=0;k<outline.length;k++){
  const a=outline[k],b=outline[(k+1)%outline.length],A=[a[0],height(...a),a[1]],B=[b[0],height(...b),b[1]],bottomA=[a[0],-.20,a[1]],bottomB=[b[0],-.20,b[1]],out=new T.Vector3((a[0]+b[0])*.5-cx,0,(a[1]+b[1])*.5-cz);
  writer.triangle(bottomA,A,bottomB,out);writer.triangle(bottomB,A,B,out);
 }
 const bottom=triangulateBoundary(T,outline);
 for(const f of bottom)writer.triangle(...f.map(i=>[outline[i][0],-.20,outline[i][1]]),new T.Vector3(0,-1,0));
 const g=writer.finish();g.userData.nearJointBed={topMetres:[.0233,.0267],bottomMetres:-.20,contact:'Overlaps original substrate top -.19 m; lies 10–25 mm below stone arrises',footprintExpansionMetres:.012};return g;
}
