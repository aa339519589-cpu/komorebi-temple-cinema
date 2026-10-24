import * as T from 'three';

// Scene10's established complete tower silhouette is held. Real tier openings,
// supported balcony bands and recessed infill replace mutually crossing roofs
// and floor plates. All coordinates here are local architectural metres.
export function buildTowerMass183({emit,box,group,between,tube,arch,scene,stack},L){
 const sources=[],roofs=[],floors=[],frames=[],V=p=>new T.Vector3(...p);
 function balcony({w,s,posts,level}){
  const width=w+.5*s+.46,depth=width,bottom=.02,top=.32,pocketBottom=.20,positions=[],uv=[];
  const tri=(a,b,c,n)=>{if(V(b).sub(V(a)).cross(V(c).sub(V(a))).dot(V(n))<0)[b,c]=[c,b];for(const p of[a,b,c]){positions.push(...p);uv.push(p[0],p[2]);}};
  const quad=(a,b,c,d,n)=>{tri(a,b,c,n);tri(a,c,d,n);};
  const radiusAt=t=>{const profile=[[1.40,0],[1.47,.12],[1.47,.32],[1.26,.52],[1.18,.86],[1.12,1]];let i=1;while(i<profile.length-1&&t>profile[i][1])i++;return T.MathUtils.lerp(profile[i-1][0],profile[i][0],(t-profile[i-1][1])/(profile[i][1]-profile[i-1][1]));};
  const ring=(p,yy)=>{const r=p.radius*radiusAt((yy-pocketBottom)/.30),b=r*.09;return[[-r+b,-r],[r-b,-r],[r,-r+b],[r,r-b],[r-b,r],[-r+b,r],[-r,r-b],[-r,-r+b]].map(([x,z])=>[p.x+x,yy,p.z+z]);};
  const outer=[[-width/2,-depth/2],[width/2,-depth/2],[width/2,depth/2],[-width/2,depth/2]],holes=posts.map(p=>ring(p,top)),flat=[...outer,...holes.flat().map(p=>[p[0],p[2]])];
  for(const ids of T.ShapeUtils.triangulateShape(outer.map(p=>new T.Vector2(...p)),holes.map(r=>r.map(p=>new T.Vector2(p[0],p[2])))))tri(...ids.map(i=>[flat[i][0],top,flat[i][1]]),[0,1,0]);
  quad([outer[0][0],bottom,outer[0][1]],[outer[1][0],bottom,outer[1][1]],[outer[2][0],bottom,outer[2][1]],[outer[3][0],bottom,outer[3][1]],[0,-1,0]);
  for(let i=0;i<4;i++){const a=outer[i],b=outer[(i+1)%4];quad([a[0],bottom,a[1]],[b[0],bottom,b[1]],[b[0],top,b[1]],[a[0],top,a[1]],[b[1]-a[1],0,a[0]-b[0]]);}
  for(const p of posts){const levels=[pocketBottom,pocketBottom+.036,pocketBottom+.096,top],rings=levels.map(y=>ring(p,y));for(let k=0;k<8;k++)tri([p.x,pocketBottom,p.z],rings[0][k],rings[0][(k+1)%8],[0,1,0]);for(let j=0;j<rings.length-1;j++)for(let k=0;k<8;k++){const n=(k+1)%8,a=rings[j][k],b=rings[j][n];quad(a,b,rings[j+1][n],rings[j+1][k],[p.x-(a[0]+b[0])/2,0,p.z-(a[2]+b[2])/2]);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name='mass183-tower-closed-pocketed-balcony-'+level;g.userData.mass183={closedSolid:true,pockets:posts.length,bottom,top,pocketBottom};emit(g,'darkwood');
  // The inner joists sit on the previous roof's continuous bearing collar.
  // At level0 the entire floor is seated on the original masonry plinth.
  for(const x of[-w/2,-w/6,w/6,w/2])box(x,bottom-.065,0,.18*s,.13,w+.5*s,'cedar');
  const railAxis=w/2+.41,railBase=top,railHeight=.65,n=Math.ceil(railAxis*2/1.05),xs=Array.from({length:n+1},(_,i)=>-railAxis+2*railAxis*i/n),postKeys=new Set();
  function post(x,z){const key=x.toFixed(8)+':'+z.toFixed(8);if(postKeys.has(key))return;postKeys.add(key);box(x,railBase+railHeight/2,z,.10,railHeight,.10,'red');box(x,railBase+railHeight+.025,z,.145,.05,.145,'black');box(x,railBase+railHeight+.052,z,.10,.012,.10,'oldgold');}
  for(const sign of[-1,1]){
   for(const x of xs){post(x,sign*railAxis);post(sign*railAxis,x);}
   for(const h of[.17,.44,.62]){box(0,railBase+h,sign*railAxis,railAxis*2,.068,.09,'red');box(sign*railAxis,railBase+h,0,.09,.068,railAxis*2,'red');}
  }
  return{level,width,depth,bottomY:bottom,topY:top,coreWidth:w+.5*s,pockets:posts.length,railPostCount:postKeys.size,railBase,railAxis,closedSolid:true};
 }
 group(...L.pagoda.position,L.pagoda.yaw,()=>{
  box(0,.275,0,8.8,.55,8.8,'stone');
  for(let l=0;l<5;l++){
   const s=1-l*L.pagoda.tierDecrement,y=l*3.45+.55,w=5.2*s;
   group(0,y,0,0,()=>{
    const frame=arch.pagodaStoreyFrame({w,d:w,y:0,level:l,scale:s,roofWidth:w+4*s,roofDepth:w+4*s,roofRise:2.75*s,roofY:2.9,windowMaterial:'pagodaPaper',detail:true,recessDepth:.34*s});
    frames.push({level:l,shaftTop:frame.shaftTop,purlinTop:frame.purlinTop,recessDepth:frame.recessDepth,distinctColumns:frame.distinctColumns});
    for(const face of[0,2]){
     const win=frame.windows.find(a=>a.face===face&&a.bay===1),light=new T.PointLight('#ffad50',4.5,0,2),p=V(win.surfaceWorldCenter).addScaledVector(V(win.worldNormal),.12);
     light.position.copy(p);light.name='pagoda183-recessed-physical-paper-room';scene.add(light);sources.push({level:l,face,position:p.toArray(),intensity:4.5,decay:2,paperSurface:win.surfaceWorldCenter});
    }
    floors.push(balcony({w,s,posts:frame.posts,level:l}));
    // A real dark room lies inside the recessed paper wall. Its ceiling is
    // separate from the roof boarding and every upper floor has closed sides.
    box(0,.40,0,w-.30,.12,w-.30,'darkwood');box(0,2.60,0,w-.30,.12,w-.30,'darkwood');
    const nextS=1-(l+1)*L.pagoda.tierDecrement,nextW=5.2*nextS,core=nextW+.5*nextS,upperFloor=l<4?{width:core,depth:core,bottomY:3.47,topY:3.77}:null,upperBalcony=upperFloor?{...upperFloor,width:core+.46,depth:core+.46}:null;
    const roof=arch.pagodaRoof({y:2.9,w:w+4*s,d:w+4*s,rise:2.75*s,wallWidth:w,wallDepth:w,frameScale:s,detail:true,referenceMode:'reference10',upperFloor,upperBalcony});
    roofs.push({level:l,kind:roof.kind,w:roof.w,rise:roof.rise,centre:roof.centre,tierOpening:roof.tierOpening,upperFloor:roof.upperFloor,upperBalcony:roof.upperBalcony,collar:roof.collar?{thickness:roof.collar.thickness,purlinTop:roof.collar.purlinTop,floorBottomY:roof.collar.floorBottomY}:null});
   });
  }
  const top=.55+4*3.45+2.9+2.75*(1-4*L.pagoda.tierDecrement),discCount=19;
  emit(new T.LatheGeometry([[0,0],[.32,0],[.36,.06],[.30,.14],[.19,.24],[.13,.30],[0,.30]].map(p=>new T.Vector2(...p)),32),'oldgold',0,top,0);
  between([0,top+.22,0],[0,top+L.pagoda.finialHeight,0],.055,'oldgold');
  for(let i=0;i<discCount;i++){const yy=top+.42+i*(L.pagoda.finialHeight-1.15)/(discCount-1),r=.36-i*.0105;emit(new T.CylinderGeometry(r*.82,r,.065,32),'oldgold',0,yy,0);emit(new T.TorusGeometry(r,.023,8,36),'gold',0,yy+.026,0,1,1,1,[Math.PI/2,0,0]);}
  emit(new T.SphereGeometry(1,20,14),'gold',0,top+L.pagoda.finialHeight-.18,0,.13,.24,.13);
  for(const sign of[-1,1])tube([[0,top+L.pagoda.finialHeight-.9,0],[sign*1.18,top+2.8,.15],[sign*2.40,top-1.25,.30]],.006,'black');
 },L.pagoda.scale);
 return{sources,roofs,floors,frames,revision:'mass183-held-silhouette-annular-tower-and-deep-bays',photographSampled:false,visualAccepted:false};
}
