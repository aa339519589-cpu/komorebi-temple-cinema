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
 // The secondary cut has no repeated central logo: the narrow wrap and
 // fasteners leave the worked wood itself as the dominant visible surface.
 const studs=[];for(const x of[-.445,.445])for(const y of[-.445,.445]){const g=new T.SphereGeometry(1,10,6);g.scale(.018,.018,.007);g.translate(x,y,.009);studs.push(g);}
 const merged=mergeGeometries(studs.map(g=>g.toNonIndexed()),false);studs.forEach(g=>g.dispose());add(merged,'fittingEdge');
 return{parts,info:{revision:190,construction:'Very narrow open forged end sleeve and four rivets, without a central badge; actual timber end grain stays visible',photoTexture:false},dispose(){for(const g of owned)g.dispose();}};
}
