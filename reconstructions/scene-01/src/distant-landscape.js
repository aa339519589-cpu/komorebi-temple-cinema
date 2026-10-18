import * as T from 'three';
import {noise,rng} from './kernel.js';

// A volumetric terrain replaces the old three vertical silhouette strips.
// Its foothills, ridge shadows and trees remain present from other cameras.
export function createDistantLandscape(){
 const group=new T.Group();group.name='three-dimensional-forested-distant-hills';
 const nx=240,nz=110,positions=[],colors=[],uv=[],indices=[];
 const height=(x,z)=>{
  const a=18*Math.exp(-(((x+29)/45)**2+((z+78)/24)**2));
  const b=22*Math.exp(-(((x-38)/50)**2+((z+113)/33)**2));
  const ridges=2.7*(noise(x*.045,z*.055,918)-.5)+1.35*(noise(x*.17,z*.14,511)-.5)+.40*(noise(x*.49,z*.45,319)-.5);
  return Math.max(-1,a+b+ridges-1.1);
 };
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=-120+240*i/nx,z=-155+112*j/nz,h=height(x,z),n=noise(x*.18,z*.17,481),c=new T.Color().setRGB(.095+.037*n,.118+.028*n,.055+.028*n);
  positions.push(x,h,z);uv.push(x*.07,z*.07);colors.push(c.r,c.g,c.b);
  if(i<nx&&j<nz){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 }
 const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(positions,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();
 const terrainMaterial=new T.MeshStandardMaterial({name:'distant-forested-earth',vertexColors:true,roughness:1});
 const land=new T.Mesh(terrain,terrainMaterial);land.receiveShadow=true;group.add(land);
 const crown=new T.SphereGeometry(1,7,5),bark=new T.CylinderGeometry(.10,.16,1,5),count=1800;
 const foliage=new T.InstancedMesh(crown,new T.MeshStandardMaterial({name:'distant-evergreen-crowns',color:0x41502b,roughness:1}),count*4);
 const trunks=new T.InstancedMesh(bark,new T.MeshStandardMaterial({name:'distant-evergreen-trunks',color:0x4b4030,roughness:1}),count);
 const rand=rng(730619),dummy=new T.Object3D(),tint=new T.Color();
 for(let k=0;k<count;k++){
  const x=-102+rand()*204,z=-144+rand()*96,base=height(x,z)-.08,h=1.3+rand()*2.3,r=.48+rand()*.49;
  dummy.position.set(x,base+h*.45,z);dummy.scale.set(1,h*.9,1);dummy.rotation.set(0,rand()*Math.PI*2,0);dummy.updateMatrix();trunks.setMatrixAt(k,dummy.matrix);
  for(let j=0;j<4;j++){
   const a=j*2.399963+k*.31;dummy.position.set(x+Math.cos(a)*r*.28,base+h*(.45+j*.15),z+Math.sin(a)*r*.28);
   dummy.scale.set(r*(1.12-j*.15),h*.24,r*(.94-j*.12));dummy.rotation.set(.08*Math.sin(k),a,.09*Math.cos(k));dummy.updateMatrix();foliage.setMatrixAt(k*4+j,dummy.matrix);foliage.setColorAt(k*4+j,tint.setScalar(.72+rand()*.40));
  }
 }
 foliage.instanceMatrix.needsUpdate=true;trunks.instanceMatrix.needsUpdate=true;foliage.receiveShadow=true;trunks.receiveShadow=true;foliage.castShadow=false;trunks.castShadow=false;group.add(foliage,trunks);
 return{group,dispose(){for(const o of[land,foliage,trunks]){o.geometry.dispose();o.material.dispose();}}};
}
