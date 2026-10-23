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
 const R=64,N=12,centres=path.getSpacedPoints(R),frames=path.computeFrenetFrames(R,false),p=[],uv=[],ids=[];
 const section=t=>{const wave=Math.sin(t*Math.PI)**2,waist=1-.17*wave,hw=.125*scale*waist,hh=.17*scale*(1-.065*wave),a=(.006+.006*wave)*scale,c=.003*scale*wave;return[[-hw+a,-hh],[0,-hh-c],[hw-a,-hh],[hw,-hh+a],[hw+c,0],[hw,hh-a],[hw-a,hh],[0,hh+c],[-hw+a,hh],[-hw,hh-a],[-hw-c,0],[-hw,-hh+a]];};
 for(let j=0;j<=R;j++){const t=j/R,c=centres[j];for(const [x,y]of section(t)){const q=c.clone().addScaledVector(frames.normals[j],x).addScaledVector(frames.binormals[j],y);p.push(...q.toArray());uv.push(x,t*path.getLength());}}
 for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*N+k,b=j*N+(k+1)%N;ids.push(a,b,a+N,b,b+N,a+N);}
 const ci=p.length/3;p.push(...centres[0].toArray(),...centres[R].toArray());uv.push(.5,0,.5,1);for(let k=0;k<N;k++)ids.push(ci,(k+1)%N,k,ci+1,R*N+k,R*N+(k+1)%N);
 const geometry=finishSolid190(p,uv,ids,'scene05-closed-waisted-arrised-raked-hip190');
 geometry.userData.section190={startAndEnd:[.25*scale,.34*scale],midWaist:[.2075*scale,.3179*scale],centrelineChanged:false,flatCutPlanesRetained:true};
 function face(t,outward){const at=Math.round(t*R),c=path.getPointAt(t),normal=frames.normals[at].clone(),binormal=frames.binormals[at].clone(),options=[normal,normal.clone().negate(),binormal,binormal.clone().negate()].sort((a,b)=>b.dot(outward)-a.dot(outward)),front=options[0],hw=.125*scale*(1-.17*Math.sin(t*Math.PI)**2),hh=.17*scale*(1-.065*Math.sin(t*Math.PI)**2),distance=Math.abs(front.dot(normal))>.5?hw:hh,up=path.getTangentAt(t).normalize().negate(),right=up.clone().cross(front).normalize(),matrix=new T.Matrix4().makeBasis(right,up,front);matrix.setPosition(c.addScaledVector(front,distance+.001*scale));return matrix;}
 return{geometry,face};
}
export function shapeSeatedHip190(geometry,path,direction,seatCentre,seatHalf){
 const p=geometry.attributes.position,side=new T.Vector3(direction.z,0,-direction.x).normalize(),start=seatCentre+seatHalf+.12,end=path.getPoint(1).dot(direction)-.10;
 if(end<=start)return geometry;
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i),u=v.dot(direction);if(u<=start||u>=end)continue;const t=(u-start)/(end-start),offset=v.dot(side),neck=1-.22*Math.sin(t*Math.PI)**2;v.addScaledVector(side,offset*(neck-1));p.setXYZ(i,v.x,v.y,v.z);}
 geometry.computeVertexNormals();geometry.userData.workedHip190={protectedSeatInterval:[seatCentre-seatHalf,seatCentre+seatHalf],sideNeckOnly:true,allYUnchanged:true,cutEndsUnchanged:true};return geometry;
}
