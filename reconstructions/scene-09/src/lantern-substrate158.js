import * as T from 'three';
import {createGardenFern} from './garden-ferns.js';

const hash=(a,b)=>{const q=Math.sin(a*127.1+b*311.7+1589)*43758.5453;return q-Math.floor(q);};
// Closed irregular mineral bed, seated scan boulders, actual grains and rooted
// fern fronds. Existing bank/stair/perimeter surface functions are read only.
export function buildLanternSubstrate158({emit,materials:M,scans,ownedMaterials}){
 const cx=-6.8,cz=8,rx=1.64,rz=1.24,N=80,R=16,bedY=(x,z)=>{const dx=(x-cx)/rx,dz=(z-cz)/rz,t=Math.hypot(dx,dz),base=Math.max(-.07,M.bankHeight139?.(x,z)??-.07),lift=.16*Math.max(0,1-t*t)+.045*Math.sin(x*6.2+z*4.3)*Math.max(0,1-t);return Math.max(base,lift-.035);},p=[],uv=[],ix=[];
 for(let j=0;j<=R;j++)for(let i=0;i<N;i++){const a=i*Math.PI*2/N,boundary=1+.12*Math.sin(a*3+1.7)+.07*Math.cos(a*7-.4),t=(.001+.999*j/R)*boundary,x=cx+Math.cos(a)*rx*t,z=cz+Math.sin(a)*rz*t,y=bedY(x,z);p.push(x,y,z);uv.push(x*3.151,z*3.151);if(j<R){const q=j*N+i,b=j*N+(i+1)%N;ix.push(q,b+N,q+N,q,b,b+N);}}
 const rim=R*N,foot=p.length/3;for(let i=0;i<N;i++){p.push(p[(rim+i)*3],-.16,p[(rim+i)*3+2]);uv.push(p[(rim+i)*3]*3.151,p[(rim+i)*3+2]*3.151);const q=(i+1)%N;ix.push(rim+i,foot+i,rim+q,rim+q,foot+i,foot+q);}const bottom=p.length/3;p.push(cx,-.16,cz);uv.push(cx*3.151,cz*3.151);for(let i=0;i<N;i++)ix.push(bottom,foot+(i+1)%N,foot+i);
 const bed=new T.BufferGeometry();bed.setAttribute('position',new T.Float32BufferAttribute(p,3));bed.setAttribute('uv',new T.Float32BufferAttribute(uv,2));bed.setIndex(ix);bed.computeVertexNormals();bed.name='scene09-closed-irregular-toro158-mineral-bed';
 const soil=new T.MeshStandardMaterial({name:'scene09-toro158-damp-mineral-soil',color:0x3e4235,map:M.routeGranite139.map,normalMap:M.routeGranite139.normalMap,normalScale:new T.Vector2(.42,.42),roughnessMap:M.routeGranite139.roughnessMap,roughness:.97,metalness:0}),grit=new T.MeshStandardMaterial({name:'scene09-toro158-real-angular-stone-grains',color:0x737b72,roughness:.92}),fernMat=new T.MeshStandardMaterial({name:'scene09-toro158-rooted-frond-foliage',color:0x52663e,roughness:.87,side:T.DoubleSide,vertexColors:true});ownedMaterials.push(soil,grit,fernMat);emit(bed,soil);
 // Unequal seated stones follow a stratified, partly submerged shoreline.
 const stones=[];for(let j=0;j<25;j++){const a=hash(j,1)*Math.PI*2,t=Math.sqrt(hash(j,2))*.96,x=cx+Math.cos(a)*rx*t,z=cz+Math.sin(a)*rz*t;if(Math.abs(x-cx)<.54&&Math.abs(z-cz)<.54)continue;const v=scans.variants[j%scans.variants.length],sx=.15+.25*hash(j,3),sy=.10+.19*hash(j,4),sz=.14+.24*hash(j,5);v.geometry.computeBoundingBox();const root=bedY(x,z),y=root-v.geometry.boundingBox.min.y*sy-.075;emit(v.geometry,v.material,x,y,z,sx,sy,sz,[.06*(hash(j,6)-.5),hash(j,7)*6.28,.09*(hash(j,8)-.5)],.86+.14*hash(j,9));stones.push({x,z,root});}
 const grain=new T.IcosahedronGeometry(1,0),gpos=grain.attributes.position;for(let i=0;i<gpos.count;i++){const q=.80+.28*hash(i,21);gpos.setXYZ(i,gpos.getX(i)*q,gpos.getY(i)*q,gpos.getZ(i)*q);}grain.computeVertexNormals();let grains=0;
 for(let j=0;j<1500;j++){const x=cx+(hash(j,22)*2-1)*rx*1.15,z=cz+(hash(j,23)*2-1)*rz*1.15,dx=(x-cx)/rx,dz=(z-cz)/rz;if(dx*dx+dz*dz>.97||Math.abs(x-cx)<.48&&Math.abs(z-cz)<.48||hash(j,24)>.72)continue;const size=.008+.030*hash(j,25)**2;emit(grain,grit,x,bedY(x,z)+size*.25,z,size*(.9+hash(j,26)),size*.42,size,[hash(j,27),hash(j,28)*6.28,hash(j,29)],.58+.54*hash(j,30));grains++;}
 const ferns=[createGardenFern(1581),createGardenFern(1587),createGardenFern(1593)],roots=[];
 for(let j=0;j<16;j++){const a=hash(j,40)*Math.PI*2,t=.64+.46*hash(j,41),x=cx+Math.cos(a)*rx*t,z=cz+Math.sin(a)*rz*t;if(x>cx+.8&&z>cz+.25)continue;const y=bedY(x,z),scale=.24+.28*hash(j,42);emit(ferns[j%3],fernMat,x,y-.018,z,scale,scale,scale,hash(j,43)*6.28,.73+.25*hash(j,44));roots.push([x,y,z]);}
 return{revision:'scene09-mineral-toro-root-bed158-r01',heroRoot:[cx,Math.max(0,M.bankHeight139?.(cx,cz)??0),cz],closedBed:true,scannedStoneRoots:stones,physicalGrains:grains,fernRoots:roots,bankFunctionChanged:false,lightsAdded:0,photoSampled:false};
}

export function createNaturalBanks158({emit,materials:M,scans,ownedMaterials}){
 const forms=[createGardenFern(15833),createGardenFern(15879),createGardenFern(15917)],fern=new T.MeshStandardMaterial({name:'scene09-toro158-surface-seated-bank-ferns',color:0x60754b,roughness:.88,side:T.DoubleSide,vertexColors:true}),grain=new T.IcosahedronGeometry(1,0),grit=new T.MeshStandardMaterial({name:'scene09-toro158-real-mound-detritus',color:0x78827a,roughness:.94});ownedMaterials.push(fern,grit);const records=[];
 function build(x,z,r,index,yaw){
  const v=scans.variants[index%scans.variants.length],sx=r*.90,sy=.49+r*.13,sz=r*.77;v.geometry.computeBoundingBox();const root=-.15-v.geometry.boundingBox.min.y*sy,position=new T.Vector3(x,root,z),rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),matrix=new T.Matrix4().compose(position,rotation,new T.Vector3(sx,sy,sz));emit(v.geometry,v.material,x,root,z,sx,sy,sz,yaw,.96);
  const mesh=new T.Mesh(v.geometry,v.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(matrix);mesh.updateMatrixWorld(true);const ray=new T.Raycaster(),surface=(px,pz)=>{ray.set(new T.Vector3(px,12,pz),new T.Vector3(0,-1,0));const hit=ray.intersectObject(mesh,false)[0];return hit?.point.y??Math.max(-.08,M.bankHeight139?.(px,pz)??-.08);};
  const roots=[];for(let j=0;j<28;j++){const a=hash(j,index+71)*6.28,t=Math.sqrt(hash(j,index+73))*.83,px=x+Math.cos(a)*r*t,pz=z+Math.sin(a)*r*.80*t,y=surface(px,pz),sc=.25+.24*hash(j,index+77);emit(forms[j%3],fern,px,y-.014,pz,sc,sc,sc,hash(j,index+79)*6.28,.76+.20*hash(j,index+81));roots.push([px,y,pz]);}
  for(let j=0;j<700;j++){const px=x+(hash(j,index+83)*2-1)*r*.90,pz=z+(hash(j,index+89)*2-1)*r*.77,dy=surface(px,pz),q=.009+.035*hash(j,index+91)**2;if(dy<-.025)continue;emit(grain,grit,px,dy+q*.18,pz,q,q*.37,q*.82,[hash(j,93),hash(j,95)*6.28,hash(j,97)],.61+.36*hash(j,99));}
  records.push({anchor:[x,z],sourceVariant:index,source:'Existing declared CC0 rock_moss_set_01 actual textured rock geometry, replacing flat green procedural mound',rootHeight:root,undersideY:-.15,fernRoots:roots});return{surface};
 }
 return{build,records};
}
