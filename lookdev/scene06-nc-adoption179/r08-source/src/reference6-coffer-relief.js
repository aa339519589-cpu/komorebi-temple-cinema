import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Physical shallow painted/gilt floral relief for the photographed coffer field.
// Hand-constructed curves, no photograph texture or raster plane.
export function createReference6CofferRelief(){
 const pools={paint:[],gilt:[]};
 function add(g,key,x=0,y=0,a=0){g.rotateZ(a).translate(x,y,0);pools[key].push(g);}
 function stem(points,key='paint',r=.005){const c=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,0)));add(new T.TubeGeometry(c,18,r,5,false),key);}
 function leaf(x,y,w,h,a,key='paint',bend=.24){
  const sh=new T.Shape();sh.moveTo(0,0);sh.bezierCurveTo(-w*.72,h*.21,-w*.65,h*.60,bend*w,h);sh.bezierCurveTo(w*.64,h*.65,w*.60,h*.28,0,0);
  const g=new T.ExtrudeGeometry(sh,{depth:.0025,bevelEnabled:true,bevelSize:.0012,bevelThickness:.0012,bevelSegments:1,curveSegments:6});add(g,key,x,y,a);
 }
 // Four branching sprays rather than the old twelve-petal mechanical wheel.
 for(let q=0;q<4;q++){
  const a=q*Math.PI/2+.20,co=Math.cos(a),si=Math.sin(a),tf=([x,y])=>[x*co-y*si,x*si+y*co];
  const path=[[.02,.02],[.10,.12],[.15,.24],[.12,.34],[.05,.36],[.015,.31],[.045,.28]];
  stem(path.map(tf),'paint',.007);
  const p2=[[.10,.12],[.21,.17],[.25,.25],[.21,.29],[.17,.26]];stem(p2.map(tf),'gilt',.004);
  for(const [x,y,w,h,ang,key]of[[.04,.06,.055,.13,-.65,'gilt'],[.09,.13,.055,.15,.72,'paint'],[.14,.21,.050,.13,-.8,'gilt'],[.13,.30,.047,.10,.55,'paint'],[.20,.18,.045,.10,-.6,'paint'],[.23,.25,.04,.08,.9,'gilt']]){const [xx,yy]=tf([x,y]);leaf(xx,yy,w,h,a+ang,key,q%2?-.18:.26);}
 }
 // Nested, unequal small central flower and its dark surrounding lobes.
 for(let k=0;k<7;k++){const a=k*Math.PI*2/7;leaf(Math.sin(a)*.022,Math.cos(a)*.022,.040,.095,-a,k%3?'paint':'gilt',.12);}
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5+.24;leaf(Math.sin(a)*.009,Math.cos(a)*.009,.022,.048,-a,'gilt',-.12);}
 add(new T.SphereGeometry(.013,10,6).scale(1,1,.22),'paint');
 // Separate scroll buds at the four corners, linked by fine black/gold stems.
 for(const sx of[-1,1])for(const sy of[-1,1]){
  const cx=sx*.255,cy=sy*.49;
  stem([[cx-sx*.035,cy-sy*.035],[cx-sx*.075,cy+sy*.025],[cx-sx*.020,cy+sy*.070],[cx+sx*.035,cy+sy*.025],[cx,cy-sy*.015]],'paint',.005);
  for(let k=0;k<3;k++)leaf(cx+(k-1)*.026,cy-sy*.015,.026,.065,(sy<0?Math.PI:0)+(k-1)*.58,'gilt',sx*.2);
 }
 const result={};
 for(const [key,parts]of Object.entries(pools)){const n=parts.map(g=>g.index?g.toNonIndexed():g);result[key]=mergeGeometries(n,false);result[key].rotateX(Math.PI/2);for(const g of new Set([...parts,...n]))g.dispose();result[key].userData.reference6CofferRelief='hand-built-branching-floral-painted-relief';}
 return result;
}
