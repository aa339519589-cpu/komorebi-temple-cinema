import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Two bounded motif variants interpret the worked metal in HD05. Neither
// is a recovered historical pattern, a photo texture, or a scan attribution.
export function createSecondaryCopper220({variant=0}={}){
 const owned=new Set(),bins=new Map();
 function add(g,material='fittingEdge',position=[0,0,0],angle=0){g.rotateZ(angle);g.translate(...position);owned.add(g);if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);}
 function cast(shape,depth,bevel=.003){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:7,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return g;}
 const s=new T.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.lineTo(-.5,.5);s.closePath();
 const hole=new T.Path();hole.moveTo(-.482,-.482);hole.lineTo(-.482,.482);hole.lineTo(.482,.482);hole.lineTo(.482,-.482);hole.closePath();s.holes.push(hole);
 const sleeve=cast(s,.15,.003);sleeve.translate(0,0,-.070);add(sleeve,'fittingCopper');
 // Oval sections give the scroll a convex crown and a finite rear. The
 // prior flat paired S ribbons read as a printed infinity sign.
 function ribbon(points,width=.023,thickness=.010){
  const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),p=[],uv=[],ix=[],N=32,M=10;
  for(let j=0;j<=N;j++){
   const t=j/N,c=curve.getPoint(t),d=curve.getTangent(t).normalize(),n=new T.Vector3(-d.y,d.x,0).normalize(),w=width*(.42+.58*Math.sin(Math.PI*t)**.65);
   for(let k=0;k<M;k++){const a=k/M*Math.PI*2,v=c.clone().addScaledVector(n,Math.cos(a)*w);v.z+=Math.sin(a)*thickness;p.push(...v.toArray());uv.push(t,k/M);}
  }
  for(let j=0;j<N;j++)for(let k=0;k<M;k++){const a=j*M+k,b=j*M+(k+1)%M,c=a+M,d=b+M;ix.push(a,b,c,b,d,c);}
  for(const [j,flip]of[[0,true],[N,false]]){const c=curve.getPoint(j/N),center=p.length/3;p.push(...c.toArray());uv.push(.5,j/N);for(let k=0;k<M;k++){const a=j*M+k,b=j*M+(k+1)%M;ix.push(...(flip?[center,b,a]:[center,a,b]));}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 function leaf(length=.19,width=.046){
  const p=[0,0,0],uv=[.5,0],ix=[],N=12,M=10;
  for(let j=1;j<N;j++)for(let k=0;k<M;k++){
   const t=j/N,a=k/M*Math.PI*2,f=Math.sin(Math.PI*t),x=Math.sin(a)*width*f**.65,
     groove=.003*Math.exp(-Math.pow(x/.006,2))*Math.max(0,Math.cos(a))*f;
   p.push(x,length*t,.013*f+.007*t**4+Math.cos(a)*.011*f-groove);uv.push(k/M,t);
  }
  const tip=p.length/3;p.push(0,length,.007);uv.push(.5,1);
  for(let k=0;k<M;k++)ix.push(0,1+(k+1)%M,1+k);
  for(let j=0;j<N-2;j++)for(let k=0;k<M;k++){const a=1+j*M+k,b=1+j*M+(k+1)%M,c=a+M,d=b+M;ix.push(a,b,c,b,d,c);}
  const last=1+(N-2)*M;for(let k=0;k<M;k++)ix.push(tip,last+k,last+(k+1)%M);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 if(variant===0){
  const scroll=[[-.25,-.17,.014],[-.13,-.10,.018],[.00,.035,.018],[.17,.13,.018],[.20,.23,.018],[.10,.28,.018],[.015,.20,.018],[.06,.15,.018],[.10,.18,.018]];
  add(ribbon(scroll,.025,.010),'fittingCopper');
  add(leaf(.19,.049),'fittingEdge',[-.11,-.09,.012],.64);
  add(leaf(.15,.041),'fittingEdge',[.015,.020,.013],-1.00);
  add(leaf(.13,.036),'fittingEdge',[-.03,-.015,.010],-2.53);
  const lower=scroll.map(([x,y,z])=>[-x*.64,-y*.64,z-.003]);add(ribbon(lower,.018,.008));
 }else{
  for(let k=0;k<8;k++){const a=k*Math.PI/4;add(leaf(k%2?.16:.19,k%2?.033:.041),'fittingEdge',[-Math.sin(a)*.020,Math.cos(a)*.020,.012],a);}
  const curl=[[.16,.20,.015],[.27,.25,.015],[.29,.15,.015],[.23,.12,.015],[.21,.16,.015]];
  for(let k=0;k<4;k++)add(ribbon(curl,.017,.007),'fittingCopper',[0,0,0],k*Math.PI/2);
  const boss=new T.SphereGeometry(1,14,8);boss.scale(.038,.038,.012);add(boss,'fittingCopper',[0,0,.029]);
 }
 // Folded leaves are physical volumes on the visible sleeve returns.
 for(let side=0;side<4;side++)for(const xx of[-.26,.26]){
  const g=leaf(.10,.033);g.rotateZ(xx<0?-.50:.50);g.translate(xx,0,0);g.rotateX(-Math.PI/2);g.translate(0,.500,-.045);g.rotateZ(side*Math.PI/2);add(g,'fittingCopper');
 }
 for(const x of[-.445,.445])for(const y of[-.445,.445]){const stud=new T.SphereGeometry(1,10,6);stud.scale(.014,.014,.007);add(stud,'fittingEdge',[x,y,.008]);}
 const parts=[];
 for(const [material,input]of bins){
  const copies=input.map(g=>g.index?g.toNonIndexed():g.clone()),geometry=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());owned.add(geometry);geometry.userData.secondaryCopper220={variant,closedCastVolumes:true};parts.push({geometry,material});
 }
 return{parts,info:{revision:220,variant,construction:'Finite folded sleeve, convex oval scrolls, domed leaves with a sculpted shallow center chase, return leaves and four small rivets. Course-specific variants replace the repeated flat paired-S motif; timber remains visible around the metalwork.',photoTexture:false,historicalPatternRecovered:false},dispose(){for(const g of owned)g.dispose();}};
}
