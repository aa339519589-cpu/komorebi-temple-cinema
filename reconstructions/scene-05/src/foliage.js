import * as T from 'three';

// Rooted branches, paired petioles and closed serrated seven-lobed laminae.
// No canopy cards, alpha sprites or photographic foliage maps are used.
export function buildMapleCanopy(scene){
 let seed=718;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},range=(a,b)=>a+(b-a)*rand();
 const bark=new T.MeshStandardMaterial({name:'scene05-maple-living-bark',color:'#493d29',roughness:.95});
 const leafMats=['#657c26','#84932f','#b1a03b','#55742b','#9aa23e'].map((color,i)=>{const m=new T.MeshStandardMaterial({name:'scene05-maple-lamina-'+i,color,roughness:.69,vertexColors:true});m.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 vec3 leafSun=normalize((viewMatrix*vec4(-18.,11.,30.,0.)).xyz);
 reflectedLight.indirectDiffuse+=diffuseColor.rgb*pow(max(0.,dot(-normal,leafSun)),1.4)*.24;`);};m.customProgramCacheKey=()=> 'scene05-closed-maple-tissue-01';return m;});
 function leafGeometry(variant){
  const N=56,R=2,p=[],uv=[],colors=[],ix=[],stride=1+N*R,lobes=[[-2,.29],[-1.35,.40],[-.65,.49],[0,.56],[.65,.49],[1.35,.40],[2,.29]];
  function radial(a){let r=.165;for(const[axis,length]of lobes){const d=Math.atan2(Math.sin(a-axis),Math.cos(a-axis));if(Math.abs(d)<.34)r+=length*Math.pow(Math.cos(d/.34*Math.PI/2),1.45);}return r*(1+.025*Math.sin(a*25+variant));}
  for(let side=0;side<2;side++){
   p.push(0,0,side?-.0002:.0002);uv.push(.5,.5);colors.push(...(side?[.78,.85,.71]:[.94,1,.86]));
   for(let j=1;j<=R;j++)for(let i=0;i<N;i++){const r=j/R,a=i/N*Math.PI*2,rr=r*radial(a),x=Math.sin(a)*rr,y=Math.cos(a)*rr,z=.018*r*r*Math.sin(a*2+variant*.7)+.018*r*Math.sin(a*3-variant*.2)+.008*Math.pow(Math.max(0,Math.cos(a*7)),10)*Math.sin(r*Math.PI)+(side?-.0002:.0002);p.push(x,y,z);uv.push(.5+x*.7,.5+y*.7);const v=.91+.07*Math.sin(a*3+variant)*r;colors.push(...(side?[v*.78,v*.87,v*.69]:[v*.96,v,v*.83]));}
  }
  const tri=(a,b,c)=>ix.push(a,b,c,c+stride,b+stride,a+stride);
  for(let i=0;i<N;i++)tri(0,1+(i+1)%N,1+i);
  for(let i=0;i<N;i++){const a=1+i,b=1+(i+1)%N,c=a+N,d=b+N;tri(a,b,c);tri(b,d,c);}
  for(let i=0;i<N;i++){const a=1+N+i,b=1+N+(i+1)%N;ix.push(a,a+stride,b,b,a+stride,b+stride);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();g.userData={closedLamina:true,lobes:7,serratedRim:true,photoTexture:false};return g;
 }
 const leaves=[leafGeometry(1),leafGeometry(2),leafGeometry(3)],batches=leafMats.map(()=>leaves.map(()=>[])),twigRecords=[];
 function tube(points,r,endRatio=.35){
  const path=new T.CatmullRomCurve3(points.map(p=>p.isVector3?p:new T.Vector3(...p))),N=16,M=7,g=new T.TubeGeometry(path,N,r,M,false),pos=g.attributes.position;
  for(let j=0;j<=N;j++){const c=path.getPointAt(j/N),f=1-(1-endRatio)*j/N;for(let k=0;k<=M;k++){const i=j*(M+1)+k,q=new T.Vector3().fromBufferAttribute(pos,i).sub(c).multiplyScalar(f).add(c);pos.setXYZ(i,...q.toArray());}}
  const pp=Array.from(pos.array),uv=Array.from(g.attributes.uv.array),ids=Array.from(g.index.array),lo=pp.length/3;pp.push(...path.getPointAt(0).toArray(),...path.getPointAt(1).toArray());uv.push(0,0,0,1);
  for(let k=0;k<M;k++)ids.push(lo,k+1,k,lo+1,N*(M+1)+k,N*(M+1)+k+1);
  g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.deleteAttribute('normal');g.computeVertexNormals();const mesh=new T.Mesh(g,bark);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return path;
 }
 function twig(a,b,r=.003){const v=b.clone().sub(a),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize());twigRecords.push(new T.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),q,new T.Vector3(r,v.length(),r*.7)));}
 function spray(anchor,direction,scale=1){
  for(let spoke=0;spoke<3;spoke++){
   const axis=direction.clone().multiplyScalar(.35).add(new T.Vector3(range(-.7,.7),range(-.1,.4),range(-.55,.55))).normalize(),length=range(.23,.48)*scale,end=anchor.clone().addScaledVector(axis,length);twig(anchor,end,.0032*scale);
   for(let node=1;node<=2;node++)for(const sign of[-1,1]){
    const joint=anchor.clone().lerp(end,node/2),side=new T.Vector3(axis.z,range(-.2,.25),-axis.x).normalize().multiplyScalar(sign),stemEnd=joint.clone().addScaledVector(side,range(.04,.09)*scale).addScaledVector(axis,.035*scale);twig(joint,stemEnd,.0012*scale);
    const s=range(.22,.36)*scale,q=new T.Quaternion().setFromEuler(new T.Euler(range(-1.4,-.25),range(0,Math.PI*2),range(-Math.PI,Math.PI))),base=new T.Vector3(0,-.145*s,0).applyQuaternion(q),centre=stemEnd.clone().sub(base),variant=Math.floor(rand()*3),material=Math.floor(rand()*leafMats.length);batches[material][variant].push(new T.Matrix4().compose(centre,q,new T.Vector3(s,s,s)));
   }
  }
 }
 function limb(a,b,r,depth=0){
  const av=a.isVector3?a:new T.Vector3(...a),bv=b.isVector3?b:new T.Vector3(...b),mid=av.clone().lerp(bv,.5).add(new T.Vector3(range(-.18,.18),.18,range(-.16,.16))),path=tube([av,mid,bv],r,.36),direction=bv.clone().sub(av).normalize();
  if(depth>=3){for(const t of[.40,.70,1])spray(path.getPoint(t),direction,range(.85,1.1));return;}
  const count=depth===0?6:3;
  for(let k=0;k<count;k++){const t=.28+k*.70/Math.max(1,count-1),p=path.getPoint(t),side=k%2?1:-1,len=(depth===0?1.60:1.0)*(1-depth*.16),end=p.clone().add(new T.Vector3(side*range(.55,1.25),range(.16,.55),range(-.7,.7)).multiplyScalar(len)).addScaledVector(direction,.20);limb(p,end,r*.43,depth+1);}
 }
 const trunk=tube([[-13.3,-.18,8.6],[-13,5,9.1],[-11.5,10,9.8],[-9.5,14,10.4],[-7.8,18.5,10]],.29,.19);
 [[.55,[-5.6,13.3,8.7],.075],[.65,[-.6,13.6,8.4],.057],[.80,[3.7,16.1,7.8],.065],[.90,[-4.3,15.8,8],.061],[.70,[2.0,14.6,7.0],.065],[.76,[3.7,14.0,7.4],.061]].forEach(([t,end,r])=>limb(trunk.getPoint(t),end,r));
 for(const[x,z,h]of[[-13,4.5,8.4],[-15,7,9],[-11.7,2.3,7.2]]){const path=tube([[x,-.15,z],[x+.3,h*.4,z+.2],[x+.9,h*.75,z+.4],[x+1.1,h,z+.3]],.14,.27);for(let k=0;k<4;k++){const p=path.getPoint(.40+k*.18),a=k*2.399,end=p.clone().add(new T.Vector3(Math.cos(a)*2.1,.8,Math.sin(a)*1.9));limb(p,end,.042,1);}if(x>-14){limb(path.getPoint(.67),[-3.5,10.4,4.7],.065,1);limb(path.getPoint(.52),[-2.5,8.5,3.8],.060,1);}}
 for(let m=0;m<leafMats.length;m++)for(let v=0;v<leaves.length;v++){const records=batches[m][v],mesh=new T.InstancedMesh(leaves[v],leafMats[m],records.length);records.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);}
 const twigMesh=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,5),bark,twigRecords.length);twigRecords.forEach((m,i)=>twigMesh.setMatrixAt(i,m));twigMesh.castShadow=twigMesh.receiveShadow=true;scene.add(twigMesh);
 return {leaves:batches.flat().reduce((n,a)=>n+a.length,0),leafPrototypes:3,rootedTrees:4,closedLamina:true,pairedPetioles:true,twigSegments:twigRecords.length,photoTextures:false};
}
