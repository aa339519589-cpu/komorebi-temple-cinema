// Scene03 original deep portal return carpentry. All coordinates are the
// retained hall-local metres; the4.20m clear opening stays unchanged.
function profiledMember308(T,section,depth,length,axis){
 const front=depth/2,back=-depth/2,w=section,poly=[[-w/2,back],[w/2,back],[w/2,front-.035],[w*.40,front],[w*.28,front+.018],[w*.18,front+.005],[w*.08,front-.025],[-w*.03,front-.055],[-w*.18,front-.045],[-w*.30,front-.010],[-w*.40,front+.005],[-w/2,front-.020]],p=[],uv=[],ix=[],n=poly.length;
 for(const t of[-length/2,length/2])for(const [a,z]of poly){p.push(...(axis==='y'?[a,t,z]:[t,a,z]));uv.push(t,a);}
 const faces=T.ShapeUtils.triangulateShape(poly.map(q=>new T.Vector2(...q)),[]);for(const face of faces){ix.push(face[0],face[2],face[1],face[0]+n,face[1]+n,face[2]+n);}for(let k=0;k<n;k++){const j=(k+1)%n;ix.push(k,j,k+n,j,j+n,k+n);}
 let vol=0;for(let i=0;i<ix.length;i+=3){const a=new T.Vector3(...p.slice(ix[i]*3,ix[i]*3+3)),b=new T.Vector3(...p.slice(ix[i+1]*3,ix[i+1]*3+3)),c=new T.Vector3(...p.slice(ix[i+2]*3,ix[i+2]*3+3));vol+=a.dot(b.cross(c))/6;}if(vol<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();flat.name='scene03-308-closed-cyma-rebate-and-bead-'+axis;return flat;
}
function mirroredProfile308(g){
 const m=g.clone();m.scale(-1,1,1);
 if(m.index){const ix=Array.from(m.index.array);for(let k=0;k<ix.length;k+=3)[ix[k+1],ix[k+2]]=[ix[k+2],ix[k+1]];m.setIndex(ix);}
 else for(const a of Object.values(m.attributes))for(let k=0;k<a.count;k+=3)for(let c=0;c<a.itemSize;c++){const i=(k+1)*a.itemSize+c,j=(k+2)*a.itemSize+c,t=a.array[i];a.array[i]=a.array[j];a.array[j]=t;}
 m.computeVertexNormals();m.name=g.name+'-explicit-positive-winding-left';return m;
}
export function buildPortalDepth308(T,{C,box,emit,role,keep,carving}){
 const top=C.stairTopY+C.portalHeight,sections=[{x:2.52,width:.37,depth:1.20,z:-.42,headWidth:5.42,headHeight:.35,mat:'cedar'},{x:2.30,width:.15,depth:.65,z:-.15,headWidth:4.75,headHeight:.16,mat:'darkwood'},{x:2.15,width:.09,depth:.30,z:.08,headWidth:4.39,headHeight:.09,mat:'cedar'}];
 role('scene03-308-three-returned-load-bearing-portal-casings',()=>{
  for(const q of sections){
   const jamb=keep(profiledMember308(T,q.width,q.depth,C.portalHeight,'y')),head=keep(profiledMember308(T,q.headHeight,q.depth,q.headWidth,'x'));
   const left=keep(mirroredProfile308(jamb));emit(left,q.mat,-q.x,C.stairTopY+C.portalHeight/2,q.z);emit(jamb,q.mat,q.x,C.stairTopY+C.portalHeight/2,q.z);
   emit(head,q.mat,0,top+q.headHeight/2,q.z);
  }
  // The outer carved cheeks are volumetric timber elements carried by the
  // same deep jambs, while the top frame seats below the retained head beams.
  for(const side of[-1,1]){
   const nose=carving.bearingHead(side<0?3:4);emit(nose,'cedar',side*2.54,top-.13,.18,.34,.40,.34,side<0?-.13:.13);
   box(side*2.54,top-.20,-.10,.35,.46,.58,'darkwood');
  }
 });
 return{revision:308,clearOpening:[4.2,C.portalHeight],returnedCasingDepths:sections.map(q=>q.depth),oldClearBoundsHeld:true,frameFrontPlanes:sections.map(q=>q.z+q.depth/2),actualWoodReturns:true,closedCymaRebateProfile:true,positiveInstanceTransforms:true,structuralCertification:false};
}
