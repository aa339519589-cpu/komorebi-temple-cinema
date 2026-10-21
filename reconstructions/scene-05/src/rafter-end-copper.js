import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Unit end fitting, scaled to the retained exposed timber section. A thin
// copper cup returns over all four edges. Broad cast petals and volutes stand
// above a genuinely lower patinated ground; no image or line texture is used.
export function createRafterEndCopper({detail='full'}={}){
 const fine=detail!=='small';
 const owned=new Set(),bins=new Map(),keep=g=>{owned.add(g);return g;};
 function add(g,material,p=[0,0,0],rz=0){g.rotateZ(rz);g.translate(...p);if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);keep(g);}
 function rect(w,h,r){const s=new T.Shape(),x=w/2,y=h/2;s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;}
 function cast(s,depth=.018,bevel=.004){const g=new T.ExtrudeGeometry(s,{depth,steps:1,curveSegments:fine?6:3,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:fine?2:1});g.translate(0,0,-depth/2);return g;}
 function ring(w,h,border,depth,bevel){const s=rect(w,h,.035),inner=rect(w-border*2,h-border*2,.023);s.holes.push(new T.Path(inner.getPoints(fine?12:6).reverse()));return cast(s,depth,bevel);}
 add(ring(1,1,.030,.10,.004),'fittingCopper',[0,0,-.045]);
 add(cast(rect(1.012,1.012,.040),.022,.005),'fittingCopper',[0,0,.009]);
 add(cast(rect(.864,.864,.035),.008,.002),'fittingPatina',[0,0,.017]);
 add(ring(.985,.985,.066,.014,.004),'fittingEdge',[0,0,.025]);
 // A long twelve-petal whorl and a small interleaved inner whorl form the
 // fine cast chrysanthemum. They remain actual closed convex petal solids.
 function petal(length=.30,width=.049,thickness=.018){
  // A closed elliptical loft provides interior vertices and an actual curved
  // petal cushion. An extruded outline alone left a flat triangulated cap.
  const p=[0,0,0],uv=[.5,0],ix=[],N=fine?14:8,M=fine?12:8;
  for(let j=1;j<N;j++)for(let i=0;i<M;i++){
   const t=j/N,a=i/M*Math.PI*2,f=Math.sin(Math.PI*t),w=width*f**.76,d=thickness*f**.70;
   p.push(Math.sin(a)*w,length*t,.012*f+Math.cos(a)*d);uv.push(i/M,t);
  }
  const tip=p.length/3;p.push(0,length,0);uv.push(.5,1);
  for(let i=0;i<M;i++)ix.push(0,1+(i+1)%M,1+i);
  for(let j=0;j<N-2;j++)for(let i=0;i<M;i++){const a=1+j*M+i,b=1+j*M+(i+1)%M,c=a+M,d=b+M;ix.push(a,b,c,b,d,c);}
  const end=1+(N-2)*M;for(let i=0;i<M;i++)ix.push(tip,end+i,end+(i+1)%M);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 for(let k=0;k<12;k++){const a=k*Math.PI/6;add(petal(),'fittingEdge',[-Math.sin(a)*.045,Math.cos(a)*.045,.026],a);}
 if(fine)for(let k=0;k<12;k++){const a=(k+.5)*Math.PI/6;add(petal(.155,.029,.012),'fittingCopper',[-Math.sin(a)*.025,Math.cos(a)*.025,.046],a);}
 const boss=new T.SphereGeometry(1,fine?20:12,fine?10:6);boss.scale(.061,.061,.016);add(boss,'fittingEdge',[0,0,.036]);
 // Four finite-width cast scrolls, with rounded closed tips. The spaces beside
 // them expose the lower dark metal field and form actual shallow grooves.
 function volute(){
  const c=new T.CatmullRomCurve3([[.105,.33,0],[.265,.37,0],[.365,.275,0],[.315,.185,0],[.245,.235,0]].map(p=>new T.Vector3(...p)),false,'centripetal');
  const left=[],right=[],N=fine?16:8;
  for(let i=0;i<=N;i++){const t=i/N,p=c.getPoint(t),d=c.getTangent(t),w=.020*(.50+.50*Math.sin(Math.PI*t));left.push([p.x-d.y*w,p.y+d.x*w]);right.push([p.x+d.y*w,p.y-d.x*w]);}
  const s=new T.Shape();[...left,...right.reverse()].forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return cast(s,.015,.004);
 }
 for(let k=0;k<4;k++)add(volute(),'fittingCopper',[0,0,.027],k*Math.PI/2);
 // A few rounded corner lobes and real domed fastening heads close the field.
 for(const sx of[-1,1])for(const sy of[-1,1]){
  const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.075,.012,.080,.105);s.quadraticCurveTo(.012,.095,0,0);s.closePath();
  add(cast(s,.012,.004),'fittingCopper',[sx*.285,sy*.285,.027],Math.atan2(-sx,sy));
  const stud=new T.SphereGeometry(1,fine?12:8,fine?8:6);stud.scale(.018,.018,.010);add(stud,'fittingEdge',[sx*.442,sy*.442,.032]);
 }
 const parts=[];
 for(const [material,geometries]of bins){
  const clean=geometries.map(g=>{const q=g.index?g.toNonIndexed():g.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);if(!q.attributes.uv)q.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return q;});
  const geometry=keep(mergeGeometries(clean,false));clean.forEach(g=>g.dispose());parts.push({geometry,material});
 }
 return {parts,info:{source:'Scene05 closed thin copper end cup with twelve sculpted outer chrysanthemum petals, interleaved inner whorl, four finite-width volutes and lower patinated groove field',detail,photoTexture:false,normalizedReturnDepth:.10,normalizedFaceThickness:.022},dispose(){for(const g of owned)g.dispose();}};
}
