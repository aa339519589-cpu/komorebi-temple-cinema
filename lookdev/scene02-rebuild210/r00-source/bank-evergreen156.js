import {T,V} from './kernel.js';

// Authored evergreen bank shrubs. A woody multi-stem scaffold carries paired
// curved leaf blades on fine attached shoots; optional small five-petal flowers
// live at real terminal buds. No opaque crown sphere or photograph is involved.
export function createBankEvergreen156(b,mats){
 let seed=0x156beca;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const stats={rootedShrubs:0,floweringShrubs:0,rootContacts:[],construction:'Multi-stem woody crowns, attached fine shoots and closed curved evergreen blades; optional terminal five-petal flowers'};
 for(let i=0;i<3;i++){const m=new T.MeshStandardMaterial({name:`scene02-bank-evergreen-blade156-${i}`,color:[0x1f3519,0x2b4320,0x43592b][i],roughness:.69,metalness:0});m.userData.thinLeaf=true;m.userData.thinLeafTransmission=.20+i*.05;mats[`bankEvergreen156${i}`]=m;}
 const wood=mats.trunk.clone();wood.name='scene02-bank-evergreen-connected-twigs156';wood.color.setHex(0x403627);mats.bankEvergreenWood156=wood;
 const blade=(()=>{const p=[],ids=[],R=5,C=3;for(let j=0;j<R;j++)for(let k=0;k<C;k++){const t=j/(R-1),q=-1+2*k/(C-1),width=.42*Math.sin(Math.PI*t)**.78+.005;p.push(q*width,.07*Math.sin(Math.PI*t)*(1-q*q)+.025*t*t,t);}const N=p.length/3;for(let i=0;i<N;i++)p.push(p[i*3],p[i*3+1]-.012,p[i*3+2]);for(let j=0;j<R-1;j++)for(let k=0;k<C-1;k++){const a=j*C+k,c=a+C;ids.push(a,c,a+1,a+1,c,c+1,a+N,a+1+N,c+N,a+1+N,c+1+N,c+N);}const ring=[];for(let i=0;i<C;i++)ring.push(i);for(let j=1;j<R;j++)ring.push(j*C+C-1);for(let i=C-2;i>=0;i--)ring.push((R-1)*C+i);for(let j=R-2;j>0;j--)ring.push(j*C);for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];ids.push(a,c,a+N,c,c+N,a+N);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();g.name='scene02-closed-curved-evergreen-leaf156';return g;})();
 function append(dst,g,matrix){const p=g.attributes.position,off=dst.p.length/3,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(matrix);dst.p.push(...v.toArray());}for(const n of g.index.array)dst.i.push(off+n);}
 const library=[];
 for(let variant=0;variant<8;variant++){
  const merged=Array.from({length:5},()=>({p:[],i:[]})),flowering=variant%3===1;
  function leaf(p,direction,length,width,roll=0,material=0){const q=new T.Quaternion().setFromUnitVectors(V([0,0,1]),direction.clone().normalize());q.multiply(new T.Quaternion().setFromAxisAngle(V([0,0,1]),roll));append(merged[material],blade,new T.Matrix4().compose(V(p),q,V([width,length,length])));}
  function twig(a,c,r0,r1){const av=V(a),cv=V(c),d=cv.clone().sub(av),g=new T.CylinderGeometry(r1,r0,d.length(),6,1);append(merged[3],g,new T.Matrix4().compose(av.add(cv).multiplyScalar(.5),new T.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()),V([1,1,1])));g.dispose();}
  function flower(at,normal,index){const n=V(normal).normalize(),side=V([0,1,0]).cross(n).normalize();if(side.lengthSq()<.01)side.set(1,0,0);const up=n.clone().cross(side);for(let k=0;k<5;k++){const a=k*Math.PI*2/5+variant*.2,d=side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up,Math.sin(a)).multiplyScalar(.78).addScaledVector(n,.24);leaf(at,d,.067,.053,.2*Math.sin(k+index),4);}}
  const stems=7;
  for(let stem=0;stem<stems;stem++){
   const a=stem*2.399+variant*.51,reach=.29+random()*.23,base=[Math.cos(a)*.045,-.025,Math.sin(a)*.045],elbow=[Math.cos(a)*reach*.5,.24+random()*.12,Math.sin(a)*reach*.5],end=[Math.cos(a)*reach,.52+random()*.22,Math.sin(a)*reach];twig(base,elbow,.018,.010);twig(elbow,end,.010,.0055);
   for(let fan=0;fan<4;fan++){
    const aa=a+(fan-1.5)*.78,rr=.17+random()*.15,top=[end[0]+Math.cos(aa)*rr,end[1]+.12+random()*.11,end[2]+Math.sin(aa)*rr];twig(end,top,.0055,.0026);
    for(let shoot=0;shoot<5;shoot++){
     const angle=aa+(shoot-2)*.47,len=.16+random()*.16,start=V(end).lerp(V(top),.42+shoot*.10).toArray(),tip=[start[0]+Math.cos(angle)*len,start[1]+.11+random()*.10,start[2]+Math.sin(angle)*len];twig(start,tip,.0026,.0011);
     const axis=V(tip).sub(V(start)).normalize(),side=V([-Math.sin(angle),.28,Math.cos(angle)]).normalize();
     for(let pair=0;pair<5;pair++){
      const t=.12+pair*.18,p=V(start).lerp(V(tip),t);
      for(const sign of[-1,1]){const d=axis.clone().multiplyScalar(.55).addScaledVector(side,sign*(.68+random()*.18)).add(V([0,.25+(random()-.5)*.3,0])),length=.085+random()*.055;leaf(p.toArray(),d,length,length*(.76+random()*.24),(random()-.5)*1.15,(stem+pair+shoot)%5===0?2:(stem+fan)%2);}
     }
     if(flowering&&(stem+fan+shoot)%4===1)flower(tip,[.12,1,.15],shoot+fan);
    }
   }
  }
  library.push(merged.map((d,i)=>{if(!d.p.length)return null;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.p,3));g.setIndex(d.i);g.computeVertexNormals();g.name=`scene02-rooted-evergreen156-variant${variant}-part${i}`;return{geometry:g,material:i<3?`bankEvergreen156${i}`:i===3?'bankEvergreenWood156':'pink'};}));
 }
 blade.dispose();
 function add(p,height=.92,radius=.70,index=0,flower=false){let v=Math.abs(index)%8;if(flower&&v%3!==1)v=4;if(!flower&&v%3===1)v=(v+1)%8;const rotation=[0,(index*2.399+random()*.6),0],scale=[radius/.70,height,radius/.70];for(const part of library[v])if(part)b.put(part.geometry,part.material,[p[0],p[1]-.055,p[2]],scale,rotation,.80+random()*.20);stats.rootedShrubs++;if(flower)stats.floweringShrubs++;stats.rootContacts.push(V(p).applyMatrix4(b.stack.at(-1)).toArray());}
 return{add,stats};
}
