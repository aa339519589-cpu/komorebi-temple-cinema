import * as T from 'three';

// Carved structural profiles, generated from curves rather than assembled from square blocks.
export function carvedBracket(){
 const sh=new T.Shape();sh.moveTo(-.5,.42);sh.lineTo(.5,.42);sh.lineTo(.5,.02);sh.bezierCurveTo(.45,-.25,.35,-.10,.29,-.29);sh.bezierCurveTo(.17,-.54,-.17,-.54,-.29,-.29);sh.bezierCurveTo(-.35,-.10,-.45,-.25,-.5,.02);sh.closePath();
 const g=new T.ExtrudeGeometry(sh,{depth:1,steps:1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:10});g.translate(0,0,-.5);return g;
}
export function carvedLeaf(){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-.27,.15,-.28,.68,0,1);s.bezierCurveTo(.28,.68,.27,.15,0,0);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:10});g.translate(0,-.5,0);return g;
}
export function archHeight(u,rise){const t=Math.abs(u);return rise*(1-3*t*t+2*t*t*t)+.42*Math.pow(t,7);}

export function flowerCrest(){
 const p=[],id=[];const petals=16,rings=8;
 for(let k=0;k<petals;k++){
   const a=k/petals*Math.PI*2,c=Math.cos(a),s=Math.sin(a),start=p.length/3;
   p.push(c*.56,s*.56,.16);
   for(let j=0;j<rings;j++){
     const b=j/rings*Math.PI*2,radial=.56+Math.cos(b)*.43,tangent=Math.sin(b)*.105;
     p.push(c*radial-s*tangent,s*radial+c*tangent,0);
   }
   for(let j=0;j<rings;j++)id.push(start,start+1+j,start+1+(j+1)%rings);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(id);g.computeVertexNormals();return g;
}
