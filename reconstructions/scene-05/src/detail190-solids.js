import * as T from 'three';

export function finishSolid190(p,uv,indices,name){
 const ids=[];let volume=0;
 for(let i=0;i<indices.length;i+=3){const f=indices.slice(i,i+3),[a,b,c]=f.map(k=>new T.Vector3(...p.slice(k*3,k*3+3)));if(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq()<1e-24)continue;volume+=a.dot(b.clone().cross(c))/6;ids.push(...f);}
 if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.name=name;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
export function closedWire190(points,r=.01,segments=32,sides=8){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(curve,segments,r,sides,false),p=Array.from(g.attributes.position.array),uv=Array.from(g.attributes.uv.array),ids=Array.from(g.index.array);
 for(const end of[0,1]){const ci=p.length/3,offset=end?segments*(sides+1):0,c=curve.getPoint(end),normal=curve.getTangent(end).multiplyScalar(end?1:-1);p.push(...c.toArray());uv.push(.5,.5);for(let k=0;k<sides;k++){const a=offset+k,b=a+1,va=new T.Vector3(...p.slice(a*3,a*3+3)).sub(c),vb=new T.Vector3(...p.slice(b*3,b*3+3)).sub(c);va.cross(vb).dot(normal)>0?ids.push(ci,a,b):ids.push(ci,b,a);}}
 g.dispose();return finishSolid190(p,uv,ids,'scene05-closed-cast-ribbon190');
}
export function createHipTimber190(path,scale=1){
 const R=64,N=24,frames=path.computeFrenetFrames(R,false),p=[],uv=[],ids=[];
 const centre=t=>{const c=path.getPointAt(t),u=T.MathUtils.clamp((t-.34)/.66,0,1);c.y-=.040*scale*Math.sin(Math.PI*u)**2;return c;},centres=Array.from({length:R+1},(_,j)=>centre(j/R));
 const section=t=>{const wave=Math.sin(t*Math.PI)**2,waist=1-.10*wave,hw=.125*scale*waist,hh=.17*scale*(1-.065*wave),a=(.006+.008*wave)*scale,c=.010*scale*wave;return[[-hw+a,-hh],[-.52*hw,-hh],[-.30*hw,-hh+c],[.30*hw,-hh+c],[.52*hw,-hh],[hw-a,-hh],[hw,-hh+a],[hw,-.62*hh],[hw-c,-.37*hh],[hw-c,0],[hw,.22*hh],[hw,hh-a],[hw-a,hh],[.52*hw,hh],[.30*hw,hh-c*.5],[-.30*hw,hh-c*.5],[-.52*hw,hh],[-hw+a,hh],[-hw,hh-a],[-hw,.22*hh],[-hw+c,0],[-hw+c,-.37*hh],[-hw,-.62*hh],[-hw,-hh+a]];};
 for(let j=0;j<=R;j++){const t=j/R,c=centres[j];for(const [x,y]of section(t)){const q=c.clone().addScaledVector(frames.normals[j],x).addScaledVector(frames.binormals[j],y);p.push(...q.toArray());uv.push(x,t*path.getLength());}}
 for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
 const ci=p.length/3;p.push(...centres[0].toArray(),...centres[R].toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ids.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);
 const geometry=finishSolid190(p,uv,ids,'scene05-closed-waisted-arrised-raked-hip190');
 geometry.userData.section190={startAndEnd:[.25*scale,.34*scale],midWaist:[.225*scale,.3179*scale],centrelineChanged:'Free length after t=.34 has a4cm smooth downward recurve; original start/end/tangents and lantern brace seats at.20/.28 remain exact',flatCutPlanesRetained:true,carving220:'Double cove/flute cut into the broad faces, not a round bulging rectangular loft'};
 function face(t,outward){const at=Math.round(t*R),c=centre(t),normal=frames.normals[at].clone(),binormal=frames.binormals[at].clone(),options=[normal,normal.clone().negate(),binormal,binormal.clone().negate()].sort((a,b)=>b.dot(outward)-a.dot(outward)),front=options[0],rim=section(t),horizontal=Math.abs(front.dot(normal))>.5,sign=front.dot(horizontal?normal:binormal)>0?1:-1;
  let distance=0;for(let k=0;k<rim.length;k++){const a=rim[k],b=rim[(k+1)%rim.length],cross=horizontal?1:0,along=horizontal?0:1;if(a[cross]*b[cross]>0||Math.abs(a[cross]-b[cross])<1e-8)continue;const u=-a[cross]/(b[cross]-a[cross]),d=(a[along]+u*(b[along]-a[along]))*sign;if(d>distance)distance=d;}
  const up=centre(Math.min(1,t+.0001)).sub(centre(Math.max(0,t-.0001))).normalize().negate(),right=up.clone().cross(front).normalize(),f=right.clone().cross(up).normalize(),matrix=new T.Matrix4().makeBasis(right,up,f);matrix.setPosition(c.addScaledVector(front,distance+.001*scale));return matrix;}
 return{geometry,face};
}
export function shapeSeatedHip190(geometry,path,direction,seatCentre,seatHalf){
 const p=geometry.attributes.position,side=new T.Vector3(direction.z,0,-direction.x).normalize(),start=seatCentre+seatHalf+.12,end=path.getPoint(1).dot(direction)-.10;
 if(end<=start)return geometry;
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),u=v.dot(direction);if(u<=start||u>=end)continue;const t=(u-start)/(end-start),offset=v.dot(side),neck=1-.22*Math.sin(t*Math.PI)**2;v.addScaledVector(side,offset*(neck-1));p.setXYZ(i,v.x,v.y,v.z);}
 geometry.computeVertexNormals();geometry.userData.workedHip190={protectedSeatInterval:[seatCentre-seatHalf,seatCentre+seatHalf],sideNeckOnly:true,allYUnchanged:true,cutEndsUnchanged:true};return geometry;
}
