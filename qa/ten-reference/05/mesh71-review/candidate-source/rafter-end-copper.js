import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Unit end fitting, scaled to the retained exposed timber section. A thin
// copper cup returns over all four edges. Broad cast petals and volutes stand
// above a genuinely lower patinated ground; no image or line texture is used.
export function createRafterEndCopper(){
 const owned=new Set(),bins=new Map(),keep=g=>{owned.add(g);return g;};
 function add(g,material,p=[0,0,0],rz=0){g.rotateZ(rz);g.translate(...p);if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);keep(g);}
 function rect(w,h,r){const s=new T.Shape(),x=w/2,y=h/2;s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;}
 function cast(s,depth=.018,bevel=.004){const g=new T.ExtrudeGeometry(s,{depth,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,-depth/2);return g;}
 function ring(w,h,border,depth,bevel){const s=rect(w,h,.035),inner=rect(w-border*2,h-border*2,.023);s.holes.push(new T.Path(inner.getPoints(12).reverse()));return cast(s,depth,bevel);}
 add(ring(1,1,.030,.10,.004),'fittingCopper',[0,0,-.045]);
 add(cast(rect(1.012,1.012,.040),.022,.005),'fittingCopper',[0,0,.009]);
 add(cast(rect(.864,.864,.035),.008,.002),'fittingPatina',[0,0,.017]);
 add(ring(.985,.985,.066,.014,.004),'fittingEdge',[0,0,.025]);
 // Eight broad, cushion-like flower petals make a legible chrysanthemum at
 // native roof scale; the earlier open four-leaf shape read as a mechanical U.
 function petal(){
  const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-.085,.035,-.100,.205,0,.30);s.bezierCurveTo(.100,.205,.085,.035,0,0);s.closePath();
  const g=cast(s,.014,.005),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),t=T.MathUtils.clamp(p.getY(i)/.30,0,1);p.setZ(i,p.getZ(i)+.012*Math.sin(Math.PI*t)*Math.max(0,1-(x/.10)**2));}g.computeVertexNormals();return g;
 }
 for(let k=0;k<8;k++){const a=k*Math.PI/4;add(petal(),'fittingEdge',[-Math.sin(a)*.045,Math.cos(a)*.045,.026],a);}
 const boss=new T.SphereGeometry(1,20,10);boss.scale(.061,.061,.016);add(boss,'fittingEdge',[0,0,.036]);
 // Four finite-width cast scrolls, with rounded closed tips. The spaces beside
 // them expose the lower dark metal field and form actual shallow grooves.
 function volute(){
  const c=new T.CatmullRomCurve3([[.105,.33,0],[.265,.37,0],[.365,.275,0],[.315,.185,0],[.245,.235,0]].map(p=>new T.Vector3(...p)),false,'centripetal');
  const left=[],right=[],N=22;
  for(let i=0;i<=N;i++){const t=i/N,p=c.getPoint(t),d=c.getTangent(t),w=.020*(.50+.50*Math.sin(Math.PI*t));left.push([p.x-d.y*w,p.y+d.x*w]);right.push([p.x+d.y*w,p.y-d.x*w]);}
  const s=new T.Shape();[...left,...right.reverse()].forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return cast(s,.015,.004);
 }
 for(let k=0;k<4;k++)add(volute(),'fittingCopper',[0,0,.027],k*Math.PI/2);
 // A few rounded corner lobes and real domed fastening heads close the field.
 for(const sx of[-1,1])for(const sy of[-1,1]){
  const s=new T.Shape();s.moveTo(0,0);s.quadraticCurveTo(.075,.012,.080,.105);s.quadraticCurveTo(.012,.095,0,0);s.closePath();
  add(cast(s,.012,.004),'fittingCopper',[sx*.285,sy*.285,.027],Math.atan2(-sx,sy));
  const stud=new T.SphereGeometry(1,12,8);stud.scale(.018,.018,.010);add(stud,'fittingEdge',[sx*.442,sy*.442,.032]);
 }
 const parts=[];
 for(const [material,geometries]of bins){
  const clean=geometries.map(g=>{const q=g.index?g.toNonIndexed():g.clone();for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);if(!q.attributes.uv)q.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return q;});
  const geometry=keep(mergeGeometries(clean,false));clean.forEach(g=>g.dispose());parts.push({geometry,material});
 }
 return {parts,info:{source:'Scene05 closed thin copper end cup with broad cast chrysanthemum, four finite-width volutes and lower patinated groove field',photoTexture:false,normalizedReturnDepth:.10,normalizedFaceThickness:.022},dispose(){for(const g of owned)g.dispose();}};
}
