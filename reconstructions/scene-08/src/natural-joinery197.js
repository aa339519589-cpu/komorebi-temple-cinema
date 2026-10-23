import * as T from 'three';
import{createGalleryCurvedJoinery}from'./gallery-joinery.js';

function pointDistance(p,a,b){const d=b.clone().sub(a),t=T.MathUtils.clamp(p.clone().sub(a).dot(d)/d.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(d,t));}
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function distanceToRing(p,ring){let d=Infinity;for(let i=0;i<ring.length;i++)d=Math.min(d,pointDistance(p,ring[i],ring[(i+1)%ring.length]));return d;}

// Constrained Lawson flips retain the exact outline/Steiner positions while
// removing the long skinny bridges left by polygon-hole triangulation.
// This prevents triangular relief facets from spanning several carved cuts.
function refineFaces197(vertices,input){
 const orient=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),ccw=t=>orient(...t.map(i=>vertices[i]))>0?t:[t[0],t[2],t[1]],faces=input.map(t=>ccw([...t])),edges=new Map(),queue=[],key=(a,b)=>a<b?a+','+b:b+','+a;
 const each=(t,fn)=>{for(let k=0;k<3;k++)fn(key(t[k],t[(k+1)%3]));},add=i=>each(faces[i],k=>{if(!edges.has(k))edges.set(k,new Set());edges.get(k).add(i);queue.push(k);}),remove=i=>each(faces[i],k=>{const e=edges.get(k);e.delete(i);if(!e.size)edges.delete(k);});faces.forEach((_,i)=>add(i));
 let flips=0;for(let at=0;at<queue.length&&at<400000;at++){
  const k=queue[at],members=edges.get(k);if(members?.size!==2)continue;const[a,b]=k.split(',').map(Number),[i,j]=members,c=faces[i].find(v=>v!==a&&v!==b),d=faces[j].find(v=>v!==a&&v!==b),A=vertices[a],B=vertices[b],C=vertices[c],D=vertices[d];if(orient(C,D,A)*orient(C,D,B)>=-1e-15)continue;
  const ax=A.x-D.x,ay=A.y-D.y,bx=B.x-D.x,by=B.y-D.y,cx=C.x-D.x,cy=C.y-D.y,det=(ax*ax+ay*ay)*(bx*cy-by*cx)-(bx*bx+by*by)*(ax*cy-ay*cx)+(cx*cx+cy*cy)*(ax*by-ay*bx);if(det*Math.sign(orient(A,B,C))<1e-12)continue;
  remove(i);remove(j);faces[i]=ccw([c,d,a]);faces[j]=ccw([d,c,b]);add(i);add(j);flips++;
 }
 return{faces,flips};
}

// Closed timber with a real shallow carved cove in each broad face. Interior
// Steiner vertices retain the relief in actual geometry, including shadows.
// The outer bearing outline stays at the authored structural datums.
export function carvedTimber197(shape,depth,paths,label){
 let ring=shape.getPoints(16);if(ring[0].distanceTo(ring.at(-1))<1e-8)ring.pop();
 ring=ring.filter((p,i)=>!i||p.distanceTo(ring[i-1])>1e-7);if(T.ShapeUtils.isClockWise(ring))ring.reverse();
 const centre=ring.reduce((s,p)=>s.add(p),new T.Vector2()).multiplyScalar(1/ring.length),cap=ring.map(p=>p.clone().sub(centre).multiplyScalar(.988).add(centre)),min=new T.Vector2(Infinity,Infinity),max=new T.Vector2(-Infinity,-Infinity);for(const p of cap){min.min(p);max.max(p);}
 const holes=[];for(let y=min.y+.012;y<max.y;y+=.012)for(let x=min.x+.012;x<max.x;x+=.012){const p=new T.Vector2(x+.0007*Math.sin(x*77+y*219),y+.0006*Math.cos(x*119-y*63));if(inside(p,cap)&&distanceToRing(p,cap)>.005)holes.push([p]);}
 const vertices=[...cap,...holes.flat()],refined=refineFaces197(vertices,T.ShapeUtils.triangulateShape(cap,holes)),faces=refined.faces,position=[],index=[],N=ring.length;
 const samples=paths.map(points=>new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p,0))).getPoints(45).map(p=>new T.Vector2(p.x,p.y)));
 for(const sign of[-1,1])for(const p of vertices){let d=Infinity;for(const path of samples)for(let i=0;i+1<path.length;i++)d=Math.min(d,pointDistance(p,path[i],path[i+1]));const fade=T.MathUtils.smoothstep(distanceToRing(p,cap),.004,.024),cut=.014*Math.exp(-Math.pow(d/.014,2))*fade;position.push(p.x,p.y,sign*(depth/2-cut));}
 const count=vertices.length;for(const tri of faces){index.push(tri[0]+count,tri[1]+count,tri[2]+count);index.push(tri[0],tri[2],tri[1]);}
 const outer=position.length/3;for(const sign of[-1,1])for(const p of ring)position.push(p.x,p.y,sign*(depth/2-.004));
 for(let i=0;i<N;i++){const j=(i+1)%N,a=i,b=j,c=outer+i,d=outer+j,e=count+i,f=count+j,g=outer+N+i,h=outer+N+j;index.push(a,b,c,b,d,c,c,d,g,d,h,g,g,h,e,h,f,e);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(position,3));g.setIndex(index);const uv=[];for(let i=0;i<position.length;i+=3)uv.push(position[i],position[i+1]);g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();
 const cutAt=p=>{let d=Infinity;for(const path of samples)for(let i=0;i+1<path.length;i++)d=Math.min(d,pointDistance(p,path[i],path[i+1]));return .014*Math.exp(-Math.pow(d/.014,2))*T.MathUtils.smoothstep(distanceToRing(p,cap),.004,.024);},normal=g.attributes.normal,epsilon=.001;
 for(let i=0;i<count;i++){const p=vertices[i],dx=(cutAt(new T.Vector2(p.x+epsilon,p.y))-cutAt(new T.Vector2(p.x-epsilon,p.y)))/(2*epsilon),dy=(cutAt(new T.Vector2(p.x,p.y+epsilon))-cutAt(new T.Vector2(p.x,p.y-epsilon)))/(2*epsilon);for(const sign of[-1,1]){const n=new T.Vector3(dx,dy,sign).normalize();normal.setXYZ(i+(sign>0?count:0),n.x,n.y,n.z);}}
 g.name=label;g.userData={closedCarvedTimber197:true,carvedDepth:.014,bearingOutlineRetained:true,analyticCarvingNormals:true,constrainedDelaunayFlips:refined.flips,photographSampled:false};return g;
}

export function createSteppedArm197(length=1.30,notch='none'){
 const h=length/2,s=new T.Shape();s.moveTo(-h,.10);if(notch==='top'){s.lineTo(-.12,.10);s.lineTo(-.12,0);s.lineTo(.12,0);s.lineTo(.12,.10);}s.lineTo(h,.10);
 s.lineTo(h,-.015);s.lineTo(h-.055,-.015);s.lineTo(h-.055,-.058);s.bezierCurveTo(h-.13,-.060,h-.15,-.105,h-.23,-.112);s.bezierCurveTo(h-.34,-.119,.23,-.225,.12,-.225);
 if(notch==='bottom'){s.lineTo(.12,0);s.lineTo(-.12,0);s.lineTo(-.12,-.225);}else s.lineTo(-.12,-.225);
 s.bezierCurveTo(-.23,-.225,-h+.34,-.119,-h+.23,-.112);s.bezierCurveTo(-h+.15,-.105,-h+.13,-.060,-h+.055,-.058);s.lineTo(-h+.055,-.015);s.lineTo(-h,-.015);s.closePath();
 const paths=[-1,1].map(sign=>[[h-.09,.02],[h-.16,-.035],[h-.25,-.065],[h-.36,-.11],[.19,-.16]].map(([x,y])=>[sign*x,y]));return carvedTimber197(s,.22,paths,'scene08-197-stepped-waisted-carved-cross-arm');
}

export function createNaturalJoinery197(){
 const kit=createGalleryCurvedJoinery(),spec={1:[1.30,'top',[0,.225,0],0],2:[1.30,'bottom',[0,.225,0],Math.PI/2],7:[1.50,'none',[-.40,.60,0],Math.PI/2],8:[1.50,'none',[0,.60,-.40],0],9:[1.50,'none',[.40,.60,0],Math.PI/2],10:[1.50,'none',[0,.60,.40],0]},[xz,sy]=kit.scale;
 // Recover the unchanged kit's fixed fit from its original base cushion.
 const baseY=-.15,sourceBase=baseY; // original closed cushion starts at -.15
 for(const [key,[length,notch,p,yaw]]of Object.entries(spec)){const g=createSteppedArm197(length,notch);g.rotateY(yaw);g.translate(...p);g.translate(0,-sourceBase,0);g.scale(xz,sy,xz);g.translate(0,-.16,0);kit.resources.add(g);kit.parts[+key]={...kit.parts[+key],geometry:g,material:'red'};}
 // The remaining real cushions/receivers retain their geometry but share
 // the painted structural wood, avoiding alternating orange light bands.
 for(const p of kit.parts)if(p.material==='redlight')p.material='red';
 kit.info197={revision:'scene08-natural-carved-bearing197-r01',profile:'Stepped squared noses, waisted bearing arms and real14mm broad-face carved coves',originalSourceFrameAndFitRetained:true,replacedArmIndices:Object.keys(spec).map(Number),scannedAssetsAdded:0,visualAccepted:false};return kit;
}

export function createCantilever197(length,rise,depth=.34){
 const s=new T.Shape(),L=length,R=rise;s.moveTo(-.22,.13);s.lineTo(.08,.13);s.lineTo(L*.35,R*.35+.13);s.lineTo(L*.73,R*.73+.13);s.lineTo(L,R+.13);s.lineTo(L,R-.015);s.lineTo(L-.055,R-.015);s.lineTo(L-.055,R-.075);s.bezierCurveTo(L-.13,R-.08,L-.18,R-.15,L-.25,R-.145);s.bezierCurveTo(L*.62,R*.62-.17,L*.38,R*.38-.245,.055,-.205);s.lineTo(-.22,-.13);s.closePath();
 return carvedTimber197(s,depth,[[[L-.07,R+.025],[L*.70,R*.70-.06],[L*.40,R*.40-.12],[.08,-.13]]],'scene08-197-stepped-carved-roof-cantilever');
}
