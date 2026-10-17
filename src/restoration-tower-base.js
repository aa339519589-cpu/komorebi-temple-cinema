import * as T from 'three';

// Conditional reference10 candidate. Repairs the existing tower's soil bearing,
// buried approach treads and floor support. No tower-axis/height/yaw decision is
// made here. The dimensions are a source-consistent reconstruction, not a survey.
export function buildRestorationTowerBase({materials,towerMatrix,options={}}={}){
  if(!towerMatrix?.isMatrix4||!towerMatrix.elements.every(Number.isFinite))throw new TypeError('Finite actual tower matrix required.');
  if(!materials||['stone','paving','red','oldgold','black'].some(k=>!materials[k]?.isMaterial))throw new TypeError('Borrowed tower materials required.');
  const axes=[0,1,2].map(i=>new T.Vector3().setFromMatrixColumn(towerMatrix,i)),scale=axes[0].length();
  if(scale<=0||towerMatrix.determinant()<=0||axes.some(a=>Math.abs(a.length()-scale)>1e-9)||Math.abs(axes[1].x)+Math.abs(axes[1].z)+Math.abs(axes[0].y)+Math.abs(axes[2].y)>1e-9||axes[1].y<=0||Math.abs(axes[0].dot(axes[2]))>1e-9)throw new RangeError('Tower base requires a uniform upright rigid transform.');
  const centerX=-12.8,centerZ=-14.5,bottom=options.foundationBottom??-.18,approach=options.approachY??-.12,top=1.485,count=6,tread=.5,walkWidth=3.7,outerHalf=2.07,rear=5.35,front=rear+count*tread,rise=(top-approach)/count,cap=.055;
  if(!(bottom<approach&&approach<0&&bottom>=-.5))throw new RangeError('Foundation/approach outside checked source envelope.');
  const notch={minX:-outerHalf,maxX:outerHalf,minZ:rear,maxZ:9};
  const group=new T.Group();group.name='reference10-supported-tower-base';group.matrixAutoUpdate=false;group.matrix.copy(towerMatrix);
  const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,16,10),buckets=new Map(),dummy=new T.Object3D(),parts=[],walkSurfaces=[];
  const tintAt=(x,y,z)=>.94+.045*Math.sin(x*5.1+z*3.7+y*1.4);
  function emit(geometry,material,position,size,rotation=null,kind='support',tint=1){
    if(size.some(n=>!Number.isFinite(n)||n<=0)||position.some(n=>!Number.isFinite(n)))throw new RangeError('Nonpositive/nonfinite tower component.');
    dummy.position.set(position[0]+centerX,position[1],position[2]+centerZ);dummy.scale.set(...size);dummy.quaternion.copy(rotation??new T.Quaternion());dummy.updateMatrix();
    const key=geometry.uuid+'|'+material;let b=buckets.get(key);if(!b)buckets.set(key,b={geometry,material,matrices:[],colors:[]});b.matrices.push(dummy.matrix.clone());b.colors.push(new T.Color(tint,tint,tint));
    parts.push({kind,material,geometry,matrix:dummy.matrix.clone()});
  }
  function solid(material,x0,x1,y0,y1,z0,z1,kind,tint=1){if(x1-x0<1e-8||z1-z0<1e-8||y1-y0<1e-8)return;emit(cube,material,[(x0+x1)/2,(y0+y1)/2,(z0+z1)/2],[x1-x0,y1-y0,z1-z0],null,kind,tint);}
  function subtract(r,o){const [x0,x1,z0,z1]=r;if(x1<=o.minX||x0>=o.maxX||z1<=o.minZ||z0>=o.maxZ)return[r];const a=Math.max(x0,o.minX),b=Math.min(x1,o.maxX),c=Math.max(z0,o.minZ),d=Math.min(z1,o.maxZ),out=[];if(x0<a)out.push([x0,a,z0,z1]);if(b<x1)out.push([b,x1,z0,z1]);if(z0<c)out.push([a,b,z0,c]);if(d<z1)out.push([a,b,d,z1]);return out;}
  function platformSolid(material,x0,x1,y0,y1,z0,z1,kind,tint=1){for(const r of subtract([x0,x1,z0,z1],notch))solid(material,r[0],r[1],y0,y1,r[2],r[3],kind,tint);}
  // The three retained outer cap profiles remain at their original top levels.
  // Internal 30mm slab overlap is replaced by shared bearing faces.
  platformSolid('stone',-5.5,5.5,bottom,1.045,-5.5,5.5,'platform-core');
  for(const [half,lo,hi]of[[5.75,1.045,1.175],[5.67,1.175,1.275],[5.59,1.275,1.375]])platformSolid('stone',-half,half,lo,hi,-half,half,'platform-cap',tintAt(half,lo,0));
  // Preserve the original nominal paving grid. Beneath the actual 8.3m local
  // timber floor, stop at its real underside1.45 instead of penetrating it.
  const floor={minX:-4.15,maxX:4.15,minZ:-4.15,maxZ:4.15};
  for(let x=-5;x<5.5;x+=.98)for(let z=-5;z<5.5;z+=.92){const rect=[x-.47,x+.47,z-.44,z+.44],tint=tintAt(x,1.41,z);for(const r of subtract(rect,floor))platformSolid('paving',r[0],r[1],1.375,top,r[2],r[3],'exterior-paver',tint);const a=Math.max(rect[0],floor.minX),b=Math.min(rect[1],floor.maxX),c=Math.max(rect[2],floor.minZ),d=Math.min(rect[3],floor.maxZ);if(a<b&&c<d)platformSolid('paving',a,b,1.375,1.45,c,d,'floor-bearing-paver',tint);}
  // Retain modest masonry courses, with a real mortar recess rather than a
  // random extra rock apron. Their backs are deliberately keyed into the core.
  for(let row=0;row<3;row++){const lo=.03+row*.33,hi=lo+.30;for(const sign of[-1,1]){for(let x=-5.05;x<5.38;x+=.95){const shift=x+(row%2)*.24;if(shift>=5.38)continue;platformSolid('stone',shift-.455,shift+.455,lo,hi,sign*5.528-.0425,sign*5.528+.0425,'keyed-masonry',tintAt(x,lo,sign));}for(let z=-5.05;z<5.38;z+=.95){const shift=z+(row%2)*.25;if(shift>=5.38)continue;platformSolid('stone',sign*5.528-.0425,sign*5.528+.0425,lo,hi,shift-.455,shift+.455,'keyed-masonry',tintAt(sign,lo,z));}}}
  for(let i=0;i<count;i++){const z0=front-(i+1)*tread,z1=front-i*tread,y=approach+(i+1)*rise;
    solid('stone',-outerHalf,outerHalf,bottom,y-cap,z0,z1,'stair-bearing');
    for(let p=0;p<4;p++){const a=-walkWidth/2+p*walkWidth/4,b=a+walkWidth/4;solid('paving',a+.003,b-.003,y-cap,y,z0+.003,z1-.003,'stair-cap',tintAt(p,y,z0));}
    // Narrow side bearing ledges carry the original red railing hierarchy.
    for(const sign of[-1,1])solid('stone',sign<0?-outerHalf:walkWidth/2,sign<0?-walkWidth/2:outerHalf,y-cap,y,z0,z1,'rail-bearing');
    walkSurfaces.push({step:i+1,localY:y,localRect:[-walkWidth/2,walkWidth/2,z0,z1],worldCorners:[[-walkWidth/2,y,z0],[walkWidth/2,y,z0],[walkWidth/2,y,z1],[-walkWidth/2,y,z1]].map(p=>new T.Vector3(p[0]+centerX,p[1],p[2]+centerZ).applyMatrix4(towerMatrix).toArray())});
  }
  // Four unchanged-hierarchy supports per side; all feet now land on the
  // actual corresponding stair ledge. This is not a photographically counted rail.
  const railHeight=1.05/scale,postWidth=.105/scale;
  function beam(a,b,w,h){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),length=d.length(),rotation=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());emit(cube,'red',av.add(bv).multiplyScalar(.5).toArray(),[w,h,length],rotation,'rail');}
  for(const sign of[-1,1]){const anchors=[];for(const i of[0,2,4,5]){const x=sign*1.96,z=front-(i+.5)*tread,y=approach+(i+1)*rise;solid('red',x-postWidth/2,x+postWidth/2,y,y+railHeight,z-postWidth/2,z+postWidth/2,'rail-post');solid('black',x-.10,x+.10,y+railHeight,y+railHeight+.04,z-.10,z+.10,'rail-cap');emit(sphere,'oldgold',[x,y+railHeight+.13,z],[.105,.105,.105],null,'rail-finial');anchors.push([x,y,z]);}for(let i=1;i<anchors.length;i++)for(const h of[.35/scale,.86/scale]){const a=anchors[i-1],b=anchors[i];beam([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],.07/scale,.075/scale);}}
  let triangles=0,instances=0;for(const b of buckets.values()){const mesh=new T.InstancedMesh(b.geometry,materials[b.material],b.matrices.length);mesh.name='tower-base-'+b.material;b.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,b.colors[i]);});mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);instances+=b.matrices.length;triangles+=(b.geometry.index?.count??b.geometry.attributes.position.count)/3*b.matrices.length;}
  group.updateMatrixWorld(true);const plan={localCenter:[centerX,0,centerZ],localFoundationBottom:bottom,localApproachY:approach,localWalkTop:top,localTimberBearingY:1.45,localNotch:notch,localFrontZ:front+centerZ,localRearZ:rear+centerZ,count,localRise:rise,localTread:tread,worldRise:rise*scale,worldTread:tread*scale,worldWidth:walkWidth*scale,worldFoundationBottom:new T.Vector3(0,bottom,0).applyMatrix4(towerMatrix).y,scope:'Actual bearing/source repair. Six steps and railing hierarchy retained as source assumptions, not measured photo counts. No tower yaw is chosen. Keyed masonry deliberately enters its support core; no blanket zero-intersection claim.'};
  group.userData.towerBasePlan=plan;let disposed=false;return{group,plan,parts,walkSurfaces,stats:{meshes:buckets.size,instances,triangles},dispose(){if(disposed)return;disposed=true;cube.dispose();sphere.dispose();group.removeFromParent();}};
}
