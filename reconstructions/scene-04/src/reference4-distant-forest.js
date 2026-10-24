import {createDistantLeafSpray212} from './scene04-forest-leaves212.js';
// Rebuilt after the actual v3 image: a genuinely distant wooded hillside,
// not oversized crowns beside the temple or a screen-facing landscape image.
export function buildReference4DistantForest(T){
 const group=new T.Group();group.name='scene04-212-volumetric-curved-leaf-forest';
 // A finite 90–290m wooded hill is consistent with the photograph's clear
 // tree separation and warmer green. Its ordinary 3D uniform transform keeps
 // the fitted skyline but removes the old excessive 450m atmospheric wash.
 group.scale.setScalar(.42);group.position.set(0,.783,13.5372);
 let seed=40831;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const height=(x,z)=>1.55*(8+88*Math.exp(-(((x-180)/165)**2+((z+420)/205)**2))+48*Math.exp(-(((x+265)/180)**2+((z+510)/215)**2))+5*Math.sin(x*.025+z*.014));
 const p=[],uv=[],ix=[],nx=90,nz=44;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-480+i/nx*960,z=-690+j/nz*460;p.push(x,height(x,z),z);uv.push(x*.008,z*.008);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const terrainGeometry=new T.BufferGeometry();terrainGeometry.setAttribute('position',new T.Float32BufferAttribute(p,3));terrainGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrainGeometry.setIndex(ix);terrainGeometry.computeVertexNormals();
 const terrain=new T.Mesh(terrainGeometry,new T.MeshStandardMaterial({name:'reference4-distant-hill-earth',color:'#1f3d1f',roughness:1}));terrain.receiveShadow=true;group.add(terrain);
 const crownGeometry=createDistantLeafSpray212(T);
 const crownMaterial=new T.MeshStandardMaterial({name:'reference4-distant-living-crowns',color:'#7b8856',roughness:.96,vertexColors:true,side:T.DoubleSide});
 const trunkGeometry=new T.CylinderGeometry(.65,1,1,6),trunkMaterial=new T.MeshStandardMaterial({name:'reference4-distant-wood',color:'#514735',roughness:1});
 const placements=[],trunks=[];
 for(let k=0;k<6600;k++){
  const x=-455+910*rand(),z=-665+412*rand(),y=height(x,z),h=5.5+rand()*7.5;
  trunks.push({p:[x,y+h*.35,z],s:[.026*h,h*.70,.026*h]});
  for(let j=0;j<9;j++){
   const angle=j*2.399+rand(),r=h*(j===0?0:.17+.06*Math.sin(j*1.7+k*.31));
   placements.push({p:[x+Math.cos(angle)*r,y+h*(.67+rand()*.25),z+Math.sin(angle)*r],s:[h*(.18+rand()*.11),h*(.14+rand()*.11),h*(.17+rand()*.10)],yaw:rand()*Math.PI*2,color:new T.Color().setHSL(.18+rand()*.10,.30+rand()*.24,.20+rand()*.17)});
  }
 }
 const matrix=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),s=new T.Vector3(),axis=new T.Vector3(0,1,0);
 const crowns=new T.InstancedMesh(crownGeometry,crownMaterial,placements.length);crowns.name='reference4-distant-individual-tree-crowns';
 placements.forEach((a,i)=>{matrix.compose(v.fromArray(a.p),q.setFromAxisAngle(axis,a.yaw),s.fromArray(a.s));crowns.setMatrixAt(i,matrix);crowns.setColorAt(i,a.color);});crowns.receiveShadow=true;crowns.instanceMatrix.needsUpdate=true;crowns.instanceColor.needsUpdate=true;group.add(crowns);
 const branches=new T.InstancedMesh(trunkGeometry,trunkMaterial,placements.length),up=new T.Vector3(0,1,0),start=new T.Vector3(),end=new T.Vector3(),direction=new T.Vector3();branches.name='scene04-212-distant-real-crown-connecting-boughs';
 placements.forEach((a,i)=>{const trunk=trunks[Math.floor(i/9)],h=trunk.s[1]/.70;start.set(trunk.p[0],trunk.p[1]+h*.20,trunk.p[2]);end.fromArray(a.p);direction.copy(end).sub(start);matrix.compose(start.clone().add(end).multiplyScalar(.5),q.setFromUnitVectors(up,direction.clone().normalize()),s.set(h*.012,direction.length(),h*.012));branches.setMatrixAt(i,matrix);});branches.receiveShadow=true;branches.instanceMatrix.needsUpdate=true;branches.computeBoundingBox();branches.computeBoundingSphere();group.add(branches);
 const stems=new T.InstancedMesh(trunkGeometry,trunkMaterial,trunks.length);stems.name='reference4-distant-tree-stems';trunks.forEach((a,i)=>{matrix.compose(v.fromArray(a.p),q.identity(),s.fromArray(a.s));stems.setMatrixAt(i,matrix);});stems.receiveShadow=true;stems.instanceMatrix.needsUpdate=true;group.add(stems);
 return{group,treeCount:trunks.length,crownCount:placements.length,limits:'Finite nearer hill forest at approximately 90–290m; camera far plane retains full geometry. Nine volumetric curved-leaf sprays per tree, each with144 actual thin leaves and a real connecting bough, replace enclosing ico-ball crowns. This is an authored distant forest LOD, not foreground species/leaf anatomy or a measured reference forest.'};
}
