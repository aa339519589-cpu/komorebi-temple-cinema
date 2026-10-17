import * as T from 'three';

// Main entrance only. Approx.20 readable treads in original reference4 motivate
// this candidate; count is not a survey. The old32-step call must still run with
// emission disabled to preserve its64 world-random draws. Tower stairs are not
// replaced. World coordinates are obtained from the caller's actual hall matrix.
export function buildRestorationEntranceStair({materials,hallMatrix,options={}}={}){
  if(!hallMatrix?.isMatrix4||!hallMatrix.elements.every(Number.isFinite))throw new TypeError('A finite actual hallMatrix is required.');
  const e=hallMatrix.elements;
  if([1,2,3,4,6,7,8,9,11].some(i=>Math.abs(e[i])>1e-12)||e[0]<=0||e[5]<=0||e[10]<=0||Math.abs(e[15]-1)>1e-12)throw new RangeError('This entrance plan requires the current axis-aligned hall transform.');
  if(!materials||['stone','paving','red','oldgold','black'].some(k=>!materials[k]?.isMaterial))throw new TypeError('Borrowed entrance materials are required.');
  const count=options.count??20;
  if(!Number.isInteger(count)||count<16||count>24)throw new RangeError('Entrance tread count must be an integer from16 to24.');
  const point=(x,y,z)=>new T.Vector3(x,y,z).applyMatrix4(hallMatrix);
  const centre=point(6,0,0),front=point(6,0,5.375).z,rear=point(6,0,-3.9).z;
  const halfWidth=point(6+2.3,0,0).x-centre.x,top=point(6,3.435,0).y;
  const bottom=options.foundationBottom??-.90,approach=options.approachY??.024;
  if(!(front>rear&&halfWidth>0&&top>approach&&bottom<approach))throw new RangeError('Entrance support dimensions are invalid.');
  const rise=(top-approach)/count,depth=(front-rear)/count,cap=.03675;
  // The two existing entrance column bases occupy the top landing sides. Their
  // true source11 bounds were checked in the complete scene; the bearing stone
  // remains below them, while the walking cap stops short of those bases.
  const axisScaleX=new T.Vector3().setFromMatrixColumn(hallMatrix,0).length();
  const columnBaseRadius=options.frontColumnBaseRadius??.7358161;
  const landingHalfWidth=(1.72-columnBaseRadius)*axisScaleX-.016;
  const baseOuter=(1.72+columnBaseRadius)*axisScaleX;
  if(!(landingHalfWidth>0&&landingHalfWidth<halfWidth))throw new RangeError('Entrance base clearance is invalid.');
  const group=new T.Group();group.name='reference4-supported-twenty-tread-entrance';
  const buckets=new Map(),geometries=[],dummy=new T.Object3D(),walkSurfaces=[],supportPoints=[];
  const box=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,16,10),cylinder=new T.CylinderGeometry(1,1,1,16);
  geometries.push(box,sphere,cylinder);
  function emit(geometry,material,position,scale,quaternion=null){
    dummy.position.copy(position);dummy.scale.set(...scale);dummy.quaternion.copy(quaternion??new T.Quaternion());dummy.updateMatrix();
    const key=geometry.uuid+'/'+material;if(!buckets.has(key))buckets.set(key,{geometry,material,matrices:[]});buckets.get(key).matrices.push(dummy.matrix.clone());
  }
  function cuboid(material,x,y,z,w,h,d){if(w<=0||h<=0||d<=0)throw new RangeError('Nonpositive stair solid.');emit(box,material,new T.Vector3(x,y,z),[w,h,d]);}
  function beam(material,a,b,w,h){const p=new T.Vector3(...a),q=new T.Vector3(...b),delta=q.clone().sub(p),length=delta.length();const rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());emit(box,material,p.add(q).multiplyScalar(.5),[w,h,length],rotation);}
  const rowJoints=.006;
  for(let i=0;i<count;i++){
    const z0=front-(i+1)*depth,z1=front-i*depth,y=approach+(i+1)*rise;
    // Stone load-bearing body is continuous to the existing foundation depth.
    // Adjacent bodies meet at a shared vertical face, not overlapping fake steps.
    cuboid('stone',centre.x,(bottom+y-cap)/2,(z0+z1)/2,2*halfWidth,y-cap-bottom,depth);
    const capHalf=i===count-1?landingHalfWidth:halfWidth;
    const span=2*capHalf,pieces=i===count-1?2:4,unit=span/pieces,shift=(i%2)*unit/2;
    for(let k=-1;k<pieces;k++){
      const a=Math.max(-capHalf,-capHalf+k*unit+shift),b=Math.min(capHalf,-capHalf+(k+1)*unit+shift);
      if(b-a<.02)continue;
      cuboid('paving',centre.x+(a+b)/2,y-cap/2,(z0+z1)/2,b-a-rowJoints,cap,depth-rowJoints);
    }
    walkSurfaces.push({step:i+1,y,polygon:[[centre.x-capHalf,z0],[centre.x+capHalf,z0],[centre.x+capHalf,z1],[centre.x-capHalf,z1]],rise,depth});
    supportPoints.push([centre.x,y-cap,z0+depth/2]);
  }
  // A short top connection closes the old gap to the actual cedar-board edge.
  // No new broad forecourt or island is introduced.
  const posts=[0,4,8,12,16,count-1].filter((n,i,a)=>n<count&&a.indexOf(n)===i),railX=Math.max(halfWidth+.1782,baseOuter+.15),railHeight=1.05;
  for(const side of[-1,1]){
    const x=centre.x+side*railX,anchors=[];
    for(const i of posts){
      const z=front-(i+.5)*depth,y=approach+(i+1)*rise;
      // Each main post is carried by a real side stone block, continuous to bed.
      cuboid('stone',x,(bottom+y)/2,z,.27,y-bottom,.30);
      cuboid('red',x,y+railHeight/2,z,.105,railHeight,.105);
      cuboid('black',x,y+railHeight+.015,z,.172,.03,.172);
      emit(cylinder,'oldgold',new T.Vector3(x,y+railHeight+.050,z),[.080,.055,.080]);
      emit(sphere,'oldgold',new T.Vector3(x,y+railHeight+.120,z),[.095,.095,.095]);
      anchors.push({step:i+1,base:[x,y,z],top:[x,y+railHeight,z]});
    }
    for(let j=0;j<anchors.length-1;j++){
      const a=anchors[j].base,b=anchors[j+1].base;
      beam('red',[a[0],a[1]+.88,a[2]],[b[0],b[1]+.88,b[2]],.105,.105);
      beam('red',[a[0],a[1]+.38,a[2]],[b[0],b[1]+.38,b[2]],.075,.075);
      // Two subordinate uncapped members per bay, not equal gold-cap repetition.
      for(const t of[1/3,2/3]){
        const y=T.MathUtils.lerp(a[1],b[1],t),z=T.MathUtils.lerp(a[2],b[2],t);
        cuboid('red',x,y+.63,z,.052,.52,.052);
      }
    }
  }
  let triangles=0,instances=0;
  for(const b of buckets.values()){
    const mesh=new T.InstancedMesh(b.geometry,materials[b.material],b.matrices.length);mesh.name='entrance-stair-'+b.material;
    b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    triangles+=(b.geometry.index?.count??b.geometry.attributes.position.count)/3*b.matrices.length;instances+=b.matrices.length;
  }
  group.updateMatrixWorld(true);
  const plan={count,worldSpace:true,frontZ:front,rearZ:rear,width:halfWidth*2,approachY:approach,topY:top,foundationBottom:bottom,rise,depth,mainPostsPerSide:posts.length,railCentreOffset:railX,topLandingWidth:landingHalfWidth*2,columnBaseRadiusSource:columnBaseRadius,oldWorldRandomDraws:64,source:'Original reference4 tread/rail hierarchy plus actual hall floor and fixed approach; not a uniquely recovered stair survey.'};
  group.userData.entranceStairPlan=plan;
  let disposed=false;
  return{group,plan,walkSurfaces,supportPoints,stats:{meshes:buckets.size,instances,triangles},dispose(){if(disposed)return;disposed=true;for(const g of geometries)g.dispose();group.removeFromParent();}};
}
