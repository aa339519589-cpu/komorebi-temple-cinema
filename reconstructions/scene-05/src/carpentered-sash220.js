import * as T from 'three';

// Finite carpentered members, with separate face and eased-edge normals.
// These dimensions are construction hypotheses read against HD05, not an
// extracted image, a normal decal, or a replacement for the retained carving.
function solidRings(rings,axis,label){
 const positions=[],uv=[],tri=(a,b,c,desired)=>{
  const normal=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a));
  if(normal.lengthSq()<1e-20)return;
  if(desired&&normal.dot(desired)<0)[b,c]=[c,b];
  for(const p of[a,b,c]){positions.push(p.x,p.y,p.z);uv.push(p[axis],axis==='y'?p.x:p.y);}
 },N=rings[0].length,centre=ring=>ring.reduce((q,p)=>q.add(p),new T.Vector3()).multiplyScalar(1/N);
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++){
  const a=rings[j][i],b=rings[j][(i+1)%N],c=rings[j+1][(i+1)%N],d=rings[j+1][i],mid=a.clone().add(b).add(c).add(d).multiplyScalar(.25),normal=mid.clone().sub(centre(rings[j]).add(centre(rings[j+1])).multiplyScalar(.5));
  // A repeated longitudinal station is an actual shoulder or mortise wall.
  if(Math.abs(d[axis]-a[axis])<1e-10){
   const area=ring=>Math.abs(ring.reduce((sum,p,k)=>{const q=ring[(k+1)%N];return sum+(axis==='y'?p.x*q.z-q.x*p.z:p.y*q.z-q.y*p.z);},0));
   normal.set(0,0,0);normal[axis]=area(rings[j+1])>area(rings[j])?-1:1;
  }
  tri(a,b,c,normal);tri(a,c,d,normal);
 }
 for(const [j,sign]of[[0,-1],[rings.length-1,1]]){
  const ring=rings[j],normal=new T.Vector3();normal[axis]=sign;
  const shape=ring.map(p=>axis==='y'?new T.Vector2(p.x,p.z):new T.Vector2(p.y,p.z));
  for(const[a,b,c]of T.ShapeUtils.triangulateShape(shape,[]))tri(ring[a],ring[b],ring[c],normal);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.userData.architectureMember=label;
 return geometry;
}

function section(width,back,front,arris,crown=0){
 const h=width/2,c=Math.min(arris,h*.35,(front-back)*.24),points=[[-h+c,back],[h-c,back],[h,back+c],[h,front-c]];
 // Three real bevel bands round toward the broad, slightly crowned face.
 for(let i=1;i<=3;i++){const a=i*Math.PI/6;points.push([h-c+c*Math.cos(a),front-c+c*Math.sin(a)]);}
 points.push([h*.42,front+crown*.84],[0,front+crown],[-h*.42,front+crown*.84],[-h+c,front]);
 for(let i=1;i<=3;i++){const a=i*Math.PI/6;points.push([-h+c-c*Math.sin(a),front-c+c*Math.cos(a)]);}
 points.push([-h,back+c]);return points;
}

function splitShoulderEdges(geometry){
 // A stepped rear half-lap leaves collinear shoulder vertices on the broad
 // side triangles. Split those actual edges so the authored solid is
 // watertight topologically as well as visually; no overlapping cut boxes.
 const p=geometry.attributes.position,vertices=new Map();for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i);vertices.set(q.toArray().map(v=>Math.round(v*1e7)).join(':'),q);}
 const candidates=[...vertices.values()],out=[],uv=[];let splits=0;
 const emit=(a,b,c)=>{for(const q of[a,b,c]){out.push(q.x,q.y,q.z);uv.push(q.y,q.x);}};
 for(let i=0;i<p.count;i+=3){
  const triangle=Array.from({length:3},(_,j)=>new T.Vector3().fromBufferAttribute(p,i+j)),boundary=[];let changed=false;
  for(let j=0;j<3;j++){
   const a=triangle[j],b=triangle[(j+1)%3],edge=b.clone().sub(a),lengthSq=edge.lengthSq(),points=[];
   for(const q of candidates){const t=q.clone().sub(a).dot(edge)/lengthSq;if(t<=1e-6||t>=1-1e-6)continue;if(a.clone().addScaledVector(edge,t).distanceToSquared(q)<1e-15)points.push({t,q});}
   boundary.push(a);if(points.length){points.sort((a,b)=>a.t-b.t);boundary.push(...points.map(q=>q.q));changed=true;}
  }
  if(!changed)emit(...triangle);else{const centre=triangle.reduce((v,q)=>v.add(q),new T.Vector3()).multiplyScalar(1/3);for(let j=0;j<boundary.length;j++)emit(centre,boundary[j],boundary[(j+1)%boundary.length]);splits++;}
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(out,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();geometry.userData.shoulderTrianglesSplit=splits;return geometry;
}

export function createSashBone220({length,width=.062,depth=.152,front=.062,notchAt=null,notchHeight=.042,tenon=.026}={}){
 const half=length/2,back=front-depth,stations=[[-half-tenon,.030,back+.022],[-half,.030,back+.022],[-half,width,back]];
 if(notchAt!==null)stations.push([notchAt-notchHeight/2,width,back],[notchAt-notchHeight/2,width,back+.053],[notchAt+notchHeight/2,width,back+.053],[notchAt+notchHeight/2,width,back]);
 stations.push([half,width,back],[half,.030,back+.022],[half+tenon,.030,back+.022]);
 const rings=stations.map(([y,w,z])=>section(w,z,front,.0055,.0028).map(([x,d])=>new T.Vector3(x,y,d))),g=solidRings(rings,'y','scene05-deep-shouldered-sash-bone220');
 if(notchAt!==null)splitShoulderEdges(g);
 g.userData.sashBone220={bodyLength:length,width,depth,front,back,tenonLength:tenon,rearHalfLap:notchAt===null?null:{at:notchAt,height:notchHeight,depth:.053},frontEasing:.0055};return g;
}

export function createCrownedGirt220({length,height,depth,arris=.010,frontCrown=.004,headLift=.016,freeHead=.12}={}){
 const half=length/2,c=Math.min(arris,height*.13,depth*.14),stations=[-half,-half+c,-half+freeHead,0,half-freeHead,half-c,half],rings=stations.map((x,i)=>{
  const end=i===0||i===6,near=i===1||i===5,lift=end?headLift:near?headLift*.70:0,w=height-(end?headLift+c:near?headLift*.70:0),back=-depth/2+(end?c:0),front=depth/2-(end?c:0);
  return section(w,back,front,c,frontCrown).map(([y,z])=>new T.Vector3(x,y+lift/2,z));
 }),g=solidRings(rings,'x','scene05-crowned-eased-girt-with-cut-head220');
 g.userData.girt220={length,height,depth,arris:c,frontCrown,headLift,freeHead,topDatumRetained:true};return g;
}

export function createRebatedSashFrame220({width,height,jamb=.073,rail=.084,back=-.182,front=.082}={}){
 // One closed annular jamb/rail solid. The narrower rear opening creates
 // an actual inner rebate; unlike four intersecting boxes it has no seam
 // at the corners and no hidden internal end caps.
 const outer=[[-width/2-jamb/2,-height/2-rail/2],[width/2+jamb/2,-height/2-rail/2],[width/2+jamb/2,height/2+rail/2],[-width/2-jamb/2,height/2+rail/2]],
  opening=[[-width/2+jamb/2,-height/2+rail/2],[width/2-jamb/2,-height/2+rail/2],[width/2-jamb/2,height/2-rail/2],[-width/2+jamb/2,height/2-rail/2]],p=[],uv=[];
 const triangle=(a,b,c,normal)=>{const n=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));if(n.dot(new T.Vector3(...normal))<0)[b,c]=[c,b];for(const q of[a,b,c]){p.push(...q);uv.push(q[0],q[1]);}},quad=(a,b,c,d,n)=>{triangle(a,b,c,n);triangle(a,c,d,n);};
 const inset=(q,amount)=>[q[0]-Math.sign(q[0])*amount,q[1]-Math.sign(q[1])*amount],expanded=(q,amount)=>[q[0]+Math.sign(q[0])*amount,q[1]+Math.sign(q[1])*amount],levels=[back,back+.038,front-.010,front],outerRings=levels.map((z,j)=>outer.map(q=>[...(j===3?inset(q,.008):q),z])),innerRings=levels.map((z,j)=>opening.map(q=>[...(j===0?inset(q,.016):j===3?expanded(q,.007):q),z]));
 for(let i=0;i<4;i++){const k=(i+1)%4,a=outer[i],b=outer[k],out=[(a[0]+b[0])/2,(a[1]+b[1])/2,0],inside=[-out[0],-out[1],0];
  for(let j=0;j<levels.length-1;j++){quad(outerRings[j][i],outerRings[j][k],outerRings[j+1][k],outerRings[j+1][i],out);quad(innerRings[j][i],innerRings[j+1][i],innerRings[j+1][k],innerRings[j][k],inside);}
  for(const[j,normal]of[[0,[0,0,-1]],[3,[0,0,1]]])quad(outerRings[j][i],innerRings[j][i],innerRings[j][k],outerRings[j][k],normal);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.userData.architectureMember='scene05-closed-rebated-window-surround220';g.userData.sashFrame220={width,height,jamb,rail,back,front,rearRebate:.016,edgeEase:.008};return g;
}
