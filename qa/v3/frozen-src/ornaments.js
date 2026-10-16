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
