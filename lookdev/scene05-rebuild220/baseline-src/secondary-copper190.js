import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// A forged open end sleeve leaves the actual cut timber visible. Its small
// chased lozenge and rivets are subordinate to the primary repousse flowers.
export function createSecondaryCopper190(){
 const parts=[],owned=[];const add=(g,material)=>{owned.push(g);parts.push({geometry:g,material});};
 const s=new T.Shape();s.moveTo(-.5,-.5);s.lineTo(.5,-.5);s.lineTo(.5,.5);s.lineTo(-.5,.5);s.closePath();
 const hole=new T.Path();hole.moveTo(-.482,-.482);hole.lineTo(-.482,.482);hole.lineTo(.482,.482);hole.lineTo(.482,-.482);hole.closePath();s.holes.push(hole);
 const sleeve=new T.ExtrudeGeometry(s,{depth:.15,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2});sleeve.translate(0,0,-.145);add(sleeve,'fittingCopper');
 const diamond=new T.Shape();diamond.moveTo(0,.25);diamond.quadraticCurveTo(.05,.07,.25,0);diamond.quadraticCurveTo(.05,-.07,0,-.25);diamond.quadraticCurveTo(-.05,-.07,-.25,0);diamond.quadraticCurveTo(-.05,.07,0,.25);diamond.closePath();const inner=new T.Path();inner.moveTo(0,.18);inner.lineTo(-.14,0);inner.lineTo(0,-.18);inner.lineTo(.14,0);inner.closePath();diamond.holes.push(inner);
 // The lower two photographed ranks carry small chased cloud curls. The
 // former entirely blank cut faces omitted this visible applied metalwork.
 // Each curl is a finite ribbon with an open centre and a shallow return.
 for(const sign of[-1,1]){
  const curve=new T.CatmullRomCurve3([
   [-.275,-.105,0],[-.185,-.155,0],[-.075,-.105,0],[.005,.030,0],
   [-.035,.160,0],[-.150,.190,0],[-.205,.100,0],[-.140,.025,0],[-.080,.065,0]
  ].map(([x,y,z])=>new T.Vector3(sign*x,sign*y,z))),left=[],right=[],N=44;
  for(let i=0;i<=N;i++){
   const t=i/N,p=curve.getPoint(t),d=curve.getTangent(t).normalize(),w=.015+.010*Math.sin(Math.PI*t);
   left.push([p.x-d.y*w,p.y+d.x*w]);right.push([p.x+d.y*w,p.y-d.x*w]);
  }
  const shape=new T.Shape();[...left,...right.reverse()].forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();
  const relief=new T.ExtrudeGeometry(shape,{depth:.012,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2});relief.translate(0,0,.008);add(relief,'fittingEdge');
 }
 const studs=[];for(const x of[-.445,.445])for(const y of[-.445,.445]){const g=new T.SphereGeometry(1,10,6);g.scale(.018,.018,.007);g.translate(x,y,.009);studs.push(g);}
 const merged=mergeGeometries(studs.map(g=>g.toNonIndexed()),false);studs.forEach(g=>g.dispose());add(merged,'fittingEdge');
 return{parts,info:{revision:204,construction:'Narrow open forged sleeve, paired shallow chased cloud-scroll ribbons and four rivets on the true timber cut; wood remains visible through and around the open metalwork',photoTexture:false},dispose(){for(const g of owned)g.dispose();}};
}
