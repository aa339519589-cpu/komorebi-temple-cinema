import {T,V} from './kernel.js';
import {layout} from './layout117.js';

// Irregular gravity-bearing abutments share the existing bridge's exact seats.
// Their battered core, interlocked face stones and eroded toe mass are solids.
export function buildEmbeddedBridgeBearings146({b,mats,scanned,arch}){
 const stats={seatAnchors:[],interlockedMasonryStones:0,embeddedScannedToeStones:0};
 const rubble=mats.terraceBody.clone();rubble.name='scene02-bridge-dark-rubble-core';rubble.color.multiplyScalar(.53);rubble.roughness=.97;rubble.onBeforeCompile=mats.terraceBody.onBeforeCompile;rubble.customProgramCacheKey=()=>mats.terraceBody.customProgramCacheKey()+':rubble146';mats.bridgeRubble146=rubble;
 function loft(rows,seed,name){
  const N=12,positions=[],uv=[],indices=[];
  for(let j=0;j<rows.length;j++){
   const [rx,y,rz]=rows[j];
   for(let i=0;i<N;i++){
    const a=i*Math.PI*2/N,c=Math.cos(a),s=Math.sin(a),q=1+.045*Math.sin(i*3.1+seed)+.025*Math.sin(i*5.3+j*1.7+seed),norm=(Math.abs(c)**7+Math.abs(s)**7)**(1/7);
    positions.push(c/norm*rx*q,y+(j===0||j===rows.length-1?0:.018*Math.sin(i*2.3+seed)),s/norm*rz*q);uv.push(i/N,j/(rows.length-1));
   }
  }
  for(let j=0;j<rows.length-1;j++)for(let i=0;i<N;i++){const a=j*N+i,c=a+N,d=j*N+(i+1)%N+N,e=j*N+(i+1)%N;indices.push(a,c,e,e,c,d);}
  for(const end of[0,rows.length-1]){const center=positions.length/3;positions.push(0,rows[end][1],0);uv.push(.5,.5);for(let i=0;i<N;i++){const a=end*N+i,c=end*N+(i+1)%N;end?indices.push(center,c,a):indices.push(center,a,c);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.name=name;return g;
 }
 const stones=Array.from({length:11},(_,i)=>loft([[.45,-.5,.45],[.51,-.32,.51],[.50,.34,.50],[.43,.5,.43]],i*1.71,'closed-eroded-interlocking-masonry-stone146'));
 function toeStone(index,p,scale,rotation,material){
  const item=scanned.variants[index%scanned.variants.length],matrix=new T.Matrix4().compose(V([0,0,0]),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),V(scale)),v=new T.Vector3(),positions=item.geometry.attributes.position;let min=Infinity;
  for(let i=0;i<positions.count;i++){v.fromBufferAttribute(positions,i).applyMatrix4(matrix);min=Math.min(min,v.y);}
  b.put(item.geometry,material??item.wet,[p[0],p[1]-min-scale[1]*.28,p[2]],scale,rotation,.84+.12*Math.sin(index*4.7)**2);stats.embeddedScannedToeStones++;
 }
 for(const sign of[-1,1]){
  const x=sign*7.08,seat=arch(x)-.47,base=-layout.bridge.position[1]-.24,height=seat-base,rows=Math.max(3,Math.ceil(height/.31)),course=height/rows;
  b.at([x,0,0],0,()=>{
   b.put(loft([[1.84,base,2.08],[1.50,base+height*.35,1.91],[1.01,base+height*.78,1.77],[.75,seat-.06,1.66]],sign*1.9,'closed-battered-rubble-bridge-core146'),'bridgeRubble146');
   // Weathered clasts have fitted but unequal geological faces. Their original
   // eroded surfaces replace the rejected regular padded masonry courses.
   for(let row=0;row<rows;row++){
    const t=(row+.5)/rows,y0=base+row*course,y1=base+(row+1)*course,rx=1.73-.91*t,rz=2.02-.37*t;
    for(const face of[-1,1])for(let k=0;k<3;k++){
     const item=scanned.variants[(row*3+k+(face<0?2:0)+(sign<0?1:3))%scanned.variants.length],bounds=item.geometry.boundingBox??(item.geometry.computeBoundingBox(),item.geometry.boundingBox),size=bounds.getSize(new T.Vector3()),w=2*rx/3+.18,h=course*(1.10+.10*Math.sin(k*2.3+row)),depth=.72+.16*Math.sin(k+row)**2,scale=[w/size.x,h/size.y,depth/size.z],xCenter=-rx+(k+.5)*2*rx/3+(row%2?.13:-.10);
     b.put(item.geometry,item.dry,[xCenter,y0-bounds.min.y*scale[1]-.05,face*(rz-.18)],scale,[.025*Math.sin(k+row),face*.07*Math.sin(k*2+row),.06*Math.sin(k*3.2+row)],.88+.10*Math.sin(row*4+k)**2);stats.interlockedMasonryStones++;
    }
    for(const face of[-1,1])for(let k=0;k<3;k++){
     const item=scanned.variants[(row+k+2)%scanned.variants.length],bounds=item.geometry.boundingBox??(item.geometry.computeBoundingBox(),item.geometry.boundingBox),size=bounds.getSize(new T.Vector3()),scale=[.79/size.x,course*(1.10+.08*Math.sin(k))/size.y,(2*rz/3+.14)/size.z],zz=-rz+(k+.5)*2*rz/3;
     b.put(item.geometry,item.dry,[face*(rx-.14),y0-bounds.min.y*scale[1]-.045,zz],scale,[.02*Math.sin(k),.08*Math.cos(k+row),face*.035],.86+.12*Math.sin(k*2+row)**2);stats.interlockedMasonryStones++;
    }
   }
   // The only level cap is the actual timber seat. Its worn edges stop at the
   // bearing face rather than making a broad, bright free-standing platform.
   b.put(stones[3],'terraceBody',[0,seat-.025,0],[1.63,.075,3.32],[0,0,0],.88);
   for(let j=0;j<10;j++){
    const a=j*Math.PI*2/10,r=1.30+.24*Math.sin(j*2.6),p=[Math.cos(a)*r,.08-layout.bridge.position[1]+.12*(j%3),Math.sin(a)*1.91];
    toeStone(j+(sign<0?1:3),p,[.58+.14*(j%3),.40+.07*(j%2),.62+.13*((j+1)%3)],[.16*Math.sin(j*2.1),j*1.17,.11*Math.cos(j*2.3)]);
   }
  });
  stats.seatAnchors.push({local:[x,seat,0],coreBottom:base,construction:'Battered closed rubble mass, interlocked worn masonry face, irregular embedded eroded toe stones and exact original level timber seat'});
 }
 return{...stats,bridgeSilhouetteAndSeatsChanged:false,visualAccepted:false};
}
