// Rebuilt after the actual v3 image: a genuinely distant wooded hillside,
// not oversized crowns beside the temple or a screen-facing landscape image.
export function buildReference4DistantForest(T){
 const group=new T.Group();group.name='reference4-mass164-raised-distant-wooded-hills';
 let seed=40831;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const height=(x,z)=>1.55*(8+88*Math.exp(-(((x-180)/165)**2+((z+420)/205)**2))+48*Math.exp(-(((x+265)/180)**2+((z+510)/215)**2))+5*Math.sin(x*.025+z*.014));
 const p=[],uv=[],ix=[],nx=90,nz=44;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=-480+i/nx*960,z=-690+j/nz*460;p.push(x,height(x,z),z);uv.push(x*.008,z*.008);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const terrainGeometry=new T.BufferGeometry();terrainGeometry.setAttribute('position',new T.Float32BufferAttribute(p,3));terrainGeometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrainGeometry.setIndex(ix);terrainGeometry.computeVertexNormals();
 const terrain=new T.Mesh(terrainGeometry,new T.MeshStandardMaterial({name:'reference4-distant-hill-earth',color:'#2f4327',roughness:1}));terrain.receiveShadow=true;group.add(terrain);
 const crownGeometry=new T.IcosahedronGeometry(1,1),a=crownGeometry.attributes.position;
 for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),r=1+.28*Math.sin(x*13+y*9)*Math.sin(z*11-x*7)+.13*Math.sin(z*23+y*13);a.setXYZ(i,x*r,y*r,z*r);}a.needsUpdate=true;
 // The rounded-crown base normals are retained: recomputing a nonindexed
 // icosphere here would create the flat white/green polygon artifact of v3.
 const crownMaterial=new T.MeshStandardMaterial({name:'reference4-distant-living-crowns',color:'#7a8052',roughness:.97});
 const trunkGeometry=new T.CylinderGeometry(.65,1,1,6),trunkMaterial=new T.MeshStandardMaterial({name:'reference4-distant-wood',color:'#514735',roughness:1});
 const placements=[],trunks=[];
 for(let k=0;k<6600;k++){
  const x=-455+910*rand(),z=-665+412*rand(),y=height(x,z),h=5.5+rand()*7.5;
  trunks.push({p:[x,y+h*.35,z],s:[.026*h,h*.70,.026*h]});
  for(let j=0;j<3;j++){
   const angle=j*2.399+rand(),r=.16*h;
   placements.push({p:[x+Math.cos(angle)*r,y+h*(.61+rand()*.20),z+Math.sin(angle)*r],s:[h*(.25+rand()*.19),h*(.23+rand()*.20),h*(.23+rand()*.17)],yaw:rand()*Math.PI*2,color:new T.Color().setHSL(.16+rand()*.13,.26+rand()*.27,.20+rand()*.20)});
  }
 }
 const matrix=new T.Matrix4(),q=new T.Quaternion(),v=new T.Vector3(),s=new T.Vector3(),axis=new T.Vector3(0,1,0);
 const crowns=new T.InstancedMesh(crownGeometry,crownMaterial,placements.length);crowns.name='reference4-distant-individual-tree-crowns';
 placements.forEach((a,i)=>{matrix.compose(v.fromArray(a.p),q.setFromAxisAngle(axis,a.yaw),s.fromArray(a.s));crowns.setMatrixAt(i,matrix);crowns.setColorAt(i,a.color);});crowns.receiveShadow=true;crowns.instanceMatrix.needsUpdate=true;crowns.instanceColor.needsUpdate=true;group.add(crowns);
 const stems=new T.InstancedMesh(trunkGeometry,trunkMaterial,trunks.length);stems.name='reference4-distant-tree-stems';trunks.forEach((a,i)=>{matrix.compose(v.fromArray(a.p),q.identity(),s.fromArray(a.s));stems.setMatrixAt(i,matrix);});stems.receiveShadow=true;stems.instanceMatrix.needsUpdate=true;group.add(stems);
 return{group,treeCount:trunks.length,crownCount:placements.length,limits:'Far forest at 250–690m; camera far plane must reach 1200m. Individual crown geometry is a distant LOD, not foreground botanically detailed foliage.'};
}
