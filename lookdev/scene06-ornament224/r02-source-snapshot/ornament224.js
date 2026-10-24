import * as T from 'three';

// Independent inferred carving. Scalar depth authors actual closed geometry;
// neither the imagegen guide nor reference RGB is used by a scene material.
let scalar224=null;
const W=1536,H=256,THRESHOLD=24.5;
export async function loadOrnament224(){
 if(scalar224)return;
 const response=await fetch(new URL('../assets/ornament224-r01/dragon-peony-mass-chisel-r02.gray8.bin',import.meta.url));
 if(!response.ok)throw Error('224 independent dragon/peony sculpt field failed');
 scalar224=new Uint8Array(await response.arrayBuffer());
 if(scalar224.length!==W*H*3)throw Error('224 sculpt field dimensions changed');
}

export function createDragonPeonyGeometry224({width,height,depth=.034,back=.006,mirror=1,scalar=scalar224}={}){
 if(!scalar||scalar.length!==W*H*3)throw Error('224 sculpt field must be loaded before construction');
 if(!(width>0&&height>0&&depth>0&&back>0)||Math.abs(mirror)!==1)throw Error('224 invalid physical carving dimensions');
 const pos=[],uv=[],indices=[],edges=[],gridMap=new Int32Array(W*H).fill(-1),edgeMap=new Map();
 let clippedTriangles=0,fullTriangles=0;
 const point=k=>({k,x:k%W,y:Math.floor(k/W),q:scalar[k],b:scalar[W*H+k]/255,d:scalar[W*H*2+k]/255*20});
 const cross=(a,b)=>{
  const lo=Math.min(a.k,b.k),hi=Math.max(a.k,b.k),key=lo*(W*H)+hi;
  let v=edgeMap.get(key);if(v)return v;
  const t=(THRESHOLD-a.q)/(b.q-a.q);
  v={k:-1,key,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,q:THRESHOLD,b:a.b+(b.b-a.b)*t,d:a.d+(b.d-a.d)*t,id:-1};edgeMap.set(key,v);return v;
 };
 const vertex=v=>{
  if(v.k>=0&&gridMap[v.k]>=0)return gridMap[v.k];
  if(v.k<0&&v.id>=0)return v.id;
  const i=pos.length/3,q=v.q/255;
  // Concave chisel valleys and convex scale/leaf ridges are surface depths.
  // Uniform materials below supply every highlight under actual scene lights.
  pos.push((v.x/(W-1)-.5)*width,(.5-v.y/(H-1))*height,.0025+depth*(.72*(1-Math.exp(-v.d/5.8))+.28*Math.pow(v.b,1.15))+.0010*(q-v.b));
  uv.push(v.x/(W-1),v.y/(H-1));
  if(v.k>=0)gridMap[v.k]=i;else v.id=i;
  return i;
 };
 const triangle=(a,b,c)=>{
  const points=[a,b,c],inside=points.map(v=>v.q>THRESHOLD),count=Number(inside[0])+Number(inside[1])+Number(inside[2]);
  if(!count)return;
  if(count===3){indices.push(vertex(a),vertex(b),vertex(c));fullTriangles++;return;}
  const polygon=[];
  for(let j=0;j<3;j++){
   const v=points[j],w=points[(j+1)%3],iv=inside[j],iw=inside[(j+1)%3];
   if(iv)polygon.push(v);if(iv!==iw)polygon.push(cross(v,w));
  }
  const ids=polygon.map(vertex);
  for(let j=1;j<ids.length-1;j++){indices.push(ids[0],ids[j],ids[j+1]);clippedTriangles++;}
  for(let j=0;j<polygon.length;j++)if(polygon[j].q===THRESHOLD&&polygon[(j+1)%polygon.length].q===THRESHOLD)edges.push([ids[j],ids[(j+1)%ids.length]]);
 };
 for(let j=0;j<H-1;j++)for(let i=0;i<W-1;i++){
  const k=j*W+i,a=point(k),b=point(k+1),c=point(k+W),d=point(k+W+1);
  triangle(a,c,b);triangle(b,c,d);
 }
 const frontVertices=pos.length/3,frontIndexCount=indices.length;
 for(let i=0;i<frontVertices;i++){pos.push(pos[i*3],pos[i*3+1],-back);uv.push(uv[i*2],uv[i*2+1]);}
 for(let i=0;i<frontIndexCount;i+=3)indices.push(indices[i]+frontVertices,indices[i+2]+frontVertices,indices[i+1]+frontVertices);
 // Three intermediate rings make curved rolled walls around every real
 // opening and around the outside silhouette, rather than a cutout plane.
 const normals=new Map(),rings=new Map(),wallSteps=4,bulge=Math.min(.00012,height*.00055);
 for(const[a,b]of edges){
  const dx=pos[b*3]-pos[a*3],dy=pos[b*3+1]-pos[a*3+1],l=Math.hypot(dx,dy);
  for(const v of[a,b]){if(!normals.has(v))normals.set(v,[0,0]);const n=normals.get(v);n[0]+=dy/l;n[1]-=dx/l;}
 }
 for(const[v,n]of normals){
  const l=Math.hypot(...n)||1,ring=[v];
  for(let j=1;j<wallSteps;j++){
   const t=j/wallSteps,at=pos.length/3,roll=bulge*Math.sin(Math.PI*t);
   pos.push(pos[v*3]+n[0]/l*roll,pos[v*3+1]+n[1]/l*roll,T.MathUtils.lerp(pos[v*3+2],-back,t));uv.push(uv[v*2],uv[v*2+1]);ring.push(at);
  }
  ring.push(v+frontVertices);rings.set(v,ring);
 }
 for(const[a,b]of edges){const ra=rings.get(a),rb=rings.get(b);for(let j=0;j<wallSteps;j++)indices.push(ra[j],ra[j+1],rb[j],rb[j],ra[j+1],rb[j+1]);}
 if(mirror<0){for(let i=0;i<pos.length;i+=3)pos[i]*=-1;for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 // The builder's final corner-normal repair remains enabled. It never moves
 // authored positions, UVs, topology, sculpt depth or material appearance.
 g.userData={ornament224:true,inferredAuthoredSculpture:true,artifactScan:false,photographicAcceptance:false,sourceRGBMaterial:false,sculpture:{revision:'ornament224-r02-single-left-mass-chisel',scalarGrid:[W,H],width,height,frontDepth:depth,backThickness:back,frontVertices,frontTriangles:frontIndexCount/3,clippedTriangles,fullTriangles,closedBoundarySegments:edges.length,wallSteps,sideWallTriangles:edges.length*wallSteps*2,triangles:indices.length/3,mirror}};
 return g;
}

export function addDragonPeony224(b,x,y,z,w,h,{mirror=1}={}){
 b.materials.ornament224Gilt??=new T.MeshStandardMaterial({name:'ornament224-uniform-aged-gold-leaf-on-inferred-carving',color:'#bf9349',metalness:.89,roughness:.43,envMapIntensity:.75});
 const width=w*.925,height=h*.89,depth=Math.min(.034,h*.130),key='224r02:'+width+':'+height+':'+mirror;
 const g=b.geometry(key,()=>createDragonPeonyGeometry224({width,height,depth,back:.006,mirror}));
 b.add(g,'ornament224Gilt',x,y,z+.006);
 b.root.userData.ornament224??=[];b.root.userData.ornament224.push({...g.userData.sculpture,center:[x,y,z+.006],mount:'Closed rear surface at nominal field Z, rooted6mm into existing lacquer carrier; actual rounded outside and opening walls.',source:'Independent imagegen-authored nonmetric scalar to real3D mesh; no reference or guide texture in material',visualAccepted:false,photographicAccepted:false});
}
