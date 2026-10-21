import * as T from 'three';

// Inferred outer garden beyond the retained photographed court. This is a
// closed ground volume with rooted rocks, shrubs and trees, not a backdrop.
const hash=(a,b,c=0)=>{const q=Math.sin(a*127.1+b*311.7+c*74.7+144)*43758.5453;return q-Math.floor(q);};
const smooth=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
export function buildSitePerimeter144({emit,materials:M,ownedMaterials,scans,shrub,treeAt,side=1,existingHeight=null,treeCount=16}){
 const x0=17.5,x1=56,z0=-40,z1=48,nx=78,nz=128,phase=side<0?.77:0,H=(a,b,c=0)=>hash(a+(side<0?431:0),b,c),shore=z=>20.7+1.25*Math.sin(z*.115+phase)+.48*Math.sin(z*.37+.4+phase);
 const height=(worldX,z)=>{const x=side*worldX,bank=smooth((x-shore(z)+.8)/4.3),roll=.24*Math.sin(x*.27+z*.11)+.17*Math.cos(z*.24-x*.13)+.08*Math.sin(x*.81+z*.71),base=-.12+bank*(1.42+roll)+.15*bank*smooth((x-35)/15);return existingHeight?Math.max(base,existingHeight(worldX,z)-.03):base;};
 const soil=M.cutStoneDark.clone();soil.name='scene09-inferred-'+(side<0?'west':'east')+'-outer-garden-soil144';soil.color.setRGB(.055,.073,.041);soil.roughness=.97;soil.normalScale.set(.42,.42);ownedMaterials.push(soil);
 const p=[],uv=[],ix=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=side*(x0+(x1-x0)*i/nx),z=z0+(z1-z0)*j/nz;p.push(x,height(x,z),z);uv.push(x*.58,z*.58);if(i<nx&&j<nz){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ix.push(a,c,b,b,c,d);}}
 const rim=[];for(let i=0;i<=nx;i++)rim.push(i);for(let j=1;j<=nz;j++)rim.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)rim.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)rim.push(j*(nx+1));
 const bottom=rim.map(i=>{const n=p.length/3;p.push(p[i*3],-.9,p[i*3+2]);uv.push(p[i*3]*.58,p[i*3+2]*.58);return n;});
 for(let i=0;i<rim.length;i++){const j=(i+1)%rim.length;ix.push(rim[i],rim[j],bottom[i],rim[j],bottom[j],bottom[i]);}
 const centre=p.length/3;p.push(side*(x0+x1)/2,-.9,(z0+z1)/2);uv.push(0,0);for(let i=0;i<bottom.length;i++)ix.push(centre,bottom[i],bottom[(i+1)%bottom.length]);
 if(side<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(p,3));ground.setAttribute('uv',new T.Float32BufferAttribute(uv,2));ground.setIndex(ix);ground.computeVertexNormals();ground.name='scene09-closed-inferred-'+(side<0?'west':'east')+'-garden-bank144';emit(ground,soil);
 let rocks=0,shrubs=0;
 for(let j=0;j<78;j++){
  const z=-35+j*1.02+.34*Math.sin(j*2.3),x=side*(shore(z)+.30+1.60*H(j,1)),scan=scans.variants[j%scans.variants.length],sx=.46+.66*H(j,2),sy=.38+.51*H(j,3),sz=.50+.66*H(j,4);scan.geometry.computeBoundingBox();
  const y=height(x,z)-scan.geometry.boundingBox.min.y*sy-.11;emit(scan.geometry,scan.material,x,y,z,sx,sy,sz,j*2.399,.80+.18*H(j,5));rocks++;
  if(j%2===0){const xx=x+side*1.15;shrub(xx,height(xx,z)+.04,z,.72+.48*H(j,6),1.25);shrubs++;}
 }
 const trees=[];
 for(let j=0;j<treeCount;j++){
  const z=-29+j*(treeCount===16?4.72:70/(treeCount-1))+1.12*Math.sin(j*2.3+phase),x=side*(25.2+(j%3)*4.3+1.4*H(j,7)),h=9.2+5.2*H(j,8),r=1.8+.9*H(j,9),groundY=height(x,z);treeAt(x,z,h,r,groundY-.04);trees.push({position:[x,groundY-.04,z],height:h,crownRadius:r});
 }
 return{height,info:{revision:'scene09-closed-outer-site144-r17',side:side<0?'west':'east',bounds:{x:side<0?[-x1,-x0]:[x0,x1],z:[z0,z1],bottom:-.9},outerShore:'Curved actual soil/rock bank beyond the existing inner garden; terrain below overlapping existing hill surfaces',groundClosed:true,rootedRockCount:rocks,rootedShrubCount:shrubs,trees,referencePhotoSampled:false,scope:'Inferred site continuation where the camera formerly exposed finite rectangular water/empty site'}};
}
