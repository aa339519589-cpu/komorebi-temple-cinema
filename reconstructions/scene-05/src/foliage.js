import * as T from 'three';
export function buildMapleCanopy(scene){
 let seed=718;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const bark=new T.MeshStandardMaterial({color:'#433722',roughness:.98}),leafMats=['#66751c','#8b8d22','#aa9b22','#455b20','#8c972c'].map(color=>new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.91}));
 const leafShape=new T.Shape(),rim=[[0,.53],[.07,.24],[.21,.34],[.19,.11],[.44,.15],[.29,-.03],[.46,-.10],[.22,-.15],[.19,-.31],[.07,-.19],[0,-.44],[-.07,-.19],[-.19,-.31],[-.22,-.15],[-.46,-.10],[-.29,-.03],[-.44,.15],[-.19,.11],[-.21,.34],[-.07,.24]];
 rim.forEach(([x,y],i)=>i?leafShape.lineTo(x,y):leafShape.moveTo(x,y));leafShape.closePath();const leafGeo=new T.ShapeGeometry(leafShape);const pp=leafGeo.attributes.position;for(let i=0;i<pp.count;i++)pp.setZ(i,.10*Math.abs(pp.getX(i))+.025*Math.sin(pp.getY(i)*11));leafGeo.computeVertexNormals();
 const batches=leafMats.map(()=>[]);
 function leaves(anchor,spread,count){for(let i=0;i<count;i++){const r=Math.sqrt(rand())*spread,a=rand()*Math.PI*2;const p=anchor.clone().add(new T.Vector3(Math.cos(a)*r,(rand()-.5)*spread*.6,Math.sin(a)*r*.72));const s=.085+rand()*.120,q=new T.Quaternion().setFromEuler(new T.Euler(-.35+rand()*1.7,rand()*6.28,rand()*6.28));batches[Math.floor(rand()*batches.length)].push(new T.Matrix4().compose(p,q,new T.Vector3(s,s,s)));}}
 function limb(a,b,r,depth=0){
   const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().lerp(bv,.52).add(new T.Vector3((rand()-.5)*.48,.16,(rand()-.5)*.35));
   const path=new T.CatmullRomCurve3([av,mid,bv]),g=new T.TubeGeometry(path,12,r,7,false),pos=g.attributes.position;
   for(let j=0;j<=12;j++){const c=path.getPointAt(j/12),factor=1-.62*j/12;for(let k=0;k<8;k++){const i=j*8+k,v=new T.Vector3().fromBufferAttribute(pos,i).sub(c).multiplyScalar(factor).add(c);pos.setXYZ(i,...v.toArray());}}g.computeVertexNormals();const mesh=new T.Mesh(g,bark);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
   if(depth>=3){leaves(bv,.79,31);return;}
   const count=depth===0?6:3;
   for(let k=0;k<count;k++){
     const t=.31+k*.65/Math.max(1,count-1),p=path.getPoint(t),dir=bv.clone().sub(av).normalize();const side=(k%2?1:-1),length=(depth===0?1.7:1.05)*(1-depth*.18);
     const end=p.clone().add(new T.Vector3(side*(.65+rand()*.75),.24+rand()*.55,(rand()-.5)*1.3).multiplyScalar(length)).addScaledVector(dir,.25);
     limb(p.toArray(),end.toArray(),r*.43,depth+1);
   }
   leaves(bv,.95,38);
 }
 // Curving limbs enter from beyond the left/top crop; every twig starts on its parent.
 limb([-12,12.2,11.8],[-5.6,13.3,8.7],.075);
 limb([-8.2,14.1,11],[-.6,13.6,8.4],.055);
 limb([-13,4.6,5.5],[-8.8,8.4,5.5],.085);
 for(let j=0;j<30;j++)leaves(new T.Vector3(-11+rand()*7,.7+rand()*7,1+rand()*5),1.05,45);
 batches.forEach((arr,j)=>{const mesh=new T.InstancedMesh(leafGeo,leafMats[j],arr.length);arr.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);});
 return {leaves:batches.reduce((n,a)=>n+a.length,0)};
}
