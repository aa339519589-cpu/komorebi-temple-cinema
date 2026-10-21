import * as T from 'three';

// Inferred outer garden beyond the retained photographed court. This is a
// closed ground volume with rooted rocks, shrubs and trees, not a backdrop.
const hash=(a,b,c=0)=>{const q=Math.sin(a*127.1+b*311.7+c*74.7+144)*43758.5453;return q-Math.floor(q);};
const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function buildSitePerimeter144({emit,materials:M,ownedMaterials,scans,shrub,treeAt}){
 const x0=17.5,x1=56,z0=-40,z1=48,nx=78,nz=128,shore=z=>20.7+1.25*Math.sin(z*.115)+.48*Math.sin(z*.37+.4);
 const height=(x,z)=>{const bank=smooth((x-shore(z)+.8)/4.3),roll=.24*Math.sin(x*.27+z*.11)+.17*Math.cos(z*.24-x*.13)+.08*Math.sin(x*.81+z*.71);return-.12+bank*(1.42+roll)+.15*bank*smooth((x-35)/15);};
 const soil=M.cutStoneDark.clone();soil.name='scene09-inferred-outer-garden-soil144';soil.color.setRGB(.055,.073,.041);soil.roughness=.97;soil.normalScale.set(.42,.42);ownedMaterials.push(soil);
 const p=[],uv=[],ix=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+(x1-x0)*i/nx,z=z0+(z1-z0)*j/nz;p.push(x,height(x,z),z);uv.push(x*.58,z*.58);if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}}
 const rim=[];for(let i=0;i<=nx;i++)rim.push(i);for(let j=1;j<=nz;j++)rim.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)rim.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)rim.push(j*(nx+1));
 const bottom=rim.map(i=>{const n=p.length/3;p.push(p[i*3],-.9,p[i*3+2]);uv.push(p[i*3]*.58,p[i*3+2]*.58);return n;});
 for(let i=0;i<rim.length;i++){const j=(i+1)%rim.length;ix.push(rim[i],rim[j],bottom[i],rim[j],bottom[j],bottom[i]);}
 const centre=p.length/3;p.push((x0+x1)/2,-.9,(z0+z1)/2);uv.push(0,0);for(let i=0;i<bottom.length;i++)ix.push(centre,bottom[i],bottom[(i+1)%bottom.length]);
 const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(p,3));ground.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ground.setIndex(ix);ground.computeVertexNormals();ground.name='scene09-closed-inferred-outer-garden-bank144';emit(ground,soil);
 let rocks=0,shrubs=0;
 for(let j=0;j<78;j++){
  const z=-35+j*1.02+.34*Math.sin(j*2.3),x=shore(z)+.30+1.60*hash(j,1),scan=scans.variants[j%scans.variants.length],sx=.46+.66*hash(j,2),sy=.38+.51*hash(j,3),sz=.50+.66*hash(j,4);scan.geometry.computeBoundingBox();
  const y=height(x,z)-scan.geometry.boundingBox.min.y*sy-.11;emit(scan.geometry,scan.material,x,y,z,sx,sy,sz,j*2.399,.80+.18*hash(j,5));rocks++;
  if(j%2===0){shrub(x+1.15,height(x+1.15,z)+.04,z,.72+.48*hash(j,6),1.25);shrubs++;}
 }
 const trees=[];
 for(let j=0;j<16;j++){
  const z=-29+j*4.72+1.12*Math.sin(j*2.3),x=25.2+(j%3)*4.3+1.4*hash(j,7),h=9.2+5.2*hash(j,8),r=1.8+.9*hash(j,9),groundY=height(x,z);treeAt(x,z,h,r,groundY-.04);trees.push({position:[x,groundY-.04,z],height:h,crownRadius:r});
 }
 return{height,info:{revision:'scene09-closed-outer-site144',bounds:{x:[x0,x1],z:[z0,z1],bottom:-.9},outerShore:'World-space curved soil/rock bank; no raised geometry enters the retained inner pond',groundClosed:true,rootedRockCount:rocks,rootedShrubCount:shrubs,trees,referencePhotoSampled:false,scope:'Inferred site continuation where the camera formerly exposed the finite rectangular water/empty site'}};
}
