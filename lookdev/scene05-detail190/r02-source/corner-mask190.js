import * as T from 'three';
import {closedWire190} from './detail190-solids.js';

// Reference-led ceramic corner study. The compact domed face, folded brows
// and short curled cheeks replace the previous broad cartoon horn loops.
export function createCornerMask190(){
 const parts=[],owned=[];const add=(g,material='slate',p=[0,0,0])=>{g.translate(...p);owned.push(g);parts.push({geometry:g,material});};
 const cast=(s,d=.06,b=.004)=>{const contours=s.extractPoints(28),outer=contours.shape;if(!T.ShapeUtils.isClockWise(outer))outer.reverse();const normalized=new T.Shape(outer);for(const loop of contours.holes){if(T.ShapeUtils.isClockWise(loop))loop.reverse();const hole=new T.Path(loop);hole.closePath();normalized.holes.push(hole);}const g=new T.ExtrudeGeometry(normalized,{depth:d,steps:1,curveSegments:20,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3});g.translate(0,0,-d/2);return g;};
 const back=new T.Shape();back.moveTo(-.245,-.115);back.bezierCurveTo(-.33,-.065,-.315,.14,-.26,.29);back.quadraticCurveTo(-.24,.39,-.125,.425);back.quadraticCurveTo(0,.50,.125,.425);back.quadraticCurveTo(.24,.39,.26,.29);back.bezierCurveTo(.315,.14,.33,-.065,.245,-.115);back.quadraticCurveTo(0,-.17,-.245,-.115);back.closePath();add(cast(back,.07,.006),'slate',[0,0,-.05]);
 const face=new T.Shape();face.moveTo(-.19,-.07);face.bezierCurveTo(-.255,.0,-.257,.19,-.202,.30);face.quadraticCurveTo(-.13,.412,0,.415);face.quadraticCurveTo(.13,.412,.202,.30);face.bezierCurveTo(.257,.19,.255,.0,.19,-.07);face.quadraticCurveTo(0,-.125,-.19,-.07);face.closePath();
 for(const sign of[-1,1]){const eye=new T.Path();eye.moveTo(sign*.042,.237);eye.quadraticCurveTo(sign*.087,.280,sign*.155,.244);eye.quadraticCurveTo(sign*.119,.205,sign*.051,.217);eye.closePath();face.holes.push(eye);}
 const mouth=new T.Path();mouth.moveTo(-.102,.066);mouth.quadraticCurveTo(0,.090,.102,.066);mouth.quadraticCurveTo(.085,.028,0,.035);mouth.quadraticCurveTo(-.085,.028,-.102,.066);mouth.closePath();face.holes.push(mouth);
 const g=cast(face,.095,.004),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),dome=.031*Math.max(0,1-(x/.255)**2)*Math.max(0,1-((y-.16)/.28)**2);p.setZ(i,p.getZ(i)+dome);}g.computeVertexNormals();add(g,'slate',[0,0,.01]);
 const rimPts=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;rimPts.push([Math.sin(a)*.255,.155+Math.cos(a)*.270,.010]);}add(new T.TubeGeometry(new T.CatmullRomCurve3(rimPts.slice(0,-1).map(p=>new T.Vector3(...p)),true),80,.010,10,true));
 for(const sign of[-1,1]){
  const brow=new T.Shape();brow.moveTo(sign*.020,.258);brow.quadraticCurveTo(sign*.069,.321,sign*.198,.277);brow.lineTo(sign*.214,.247);brow.quadraticCurveTo(sign*.110,.287,sign*.039,.235);brow.closePath();add(cast(brow,.045,.004),'slate',[0,0,.075]);
  const cheek=new T.Shape();cheek.moveTo(sign*.182,.14);cheek.bezierCurveTo(sign*.267,.18,sign*.302,.095,sign*.271,.028);cheek.bezierCurveTo(sign*.251,-.016,sign*.198,-.010,sign*.198,.031);cheek.bezierCurveTo(sign*.254,.007,sign*.259,.070,sign*.223,.091);cheek.quadraticCurveTo(sign*.194,.101,sign*.182,.14);cheek.closePath();add(cast(cheek,.055,.005),'slate',[0,0,.025]);
  add(closedWire190([[sign*.049,.150,.098],[sign*.111,.130,.105],[sign*.176,.150,.083],[sign*.206,.187,.061]],.0085,28,10));
  add(closedWire190([[sign*.138,-.060,.064],[sign*.216,-.100,.046],[sign*.212,-.141,.039],[sign*.164,-.143,.045]],.008,26,10));
  const eye=new T.SphereGeometry(1,16,10);eye.scale(.008,.008,.004);add(eye,'oldgold',[sign*.095,.237,.060]);
 }
 const nose=new T.Shape();nose.moveTo(-.021,.269);nose.lineTo(.021,.269);nose.quadraticCurveTo(.019,.183,.051,.137);nose.quadraticCurveTo(.039,.102,0,.111);nose.quadraticCurveTo(-.039,.102,-.051,.137);nose.quadraticCurveTo(-.019,.183,-.021,.269);nose.closePath();add(cast(nose,.065,.006),'slate',[0,0,.092]);
 const crest=new T.Shape();crest.moveTo(-.052,.382);crest.bezierCurveTo(-.047,.458,-.012,.487,0,.535);crest.bezierCurveTo(.051,.493,.066,.442,.052,.382);crest.closePath();add(cast(crest,.075,.005),'slate',[0,0,-.015]);
 add(closedWire190([[-.115,.012,.080],[-.071,-.014,.101],[0,-.026,.112],[.071,-.014,.101],[.115,.012,.080]],.009,34,10));
 for(const x of[-.052,-.018,.018,.052]){const tooth=new T.BoxGeometry(.014,.021,.017);add(tooth,'slate',[x,.051,.065]);}
 const support=new T.Shape();support.moveTo(-.17,-.08);support.lineTo(.17,-.08);support.lineTo(.13,.20);support.quadraticCurveTo(0,.25,-.13,.20);support.closePath();const mount=cast(support,.24,.004);mount.translate(0,0,.09);owned.push(mount);
 return{parts,mountParts:[{geometry:mount,material:'slate'}],info:{revision:190,construction:'Compact closed domed ceramic face, recessed almond eyes, short folded cheeks, arrised nose and narrow curled lips; separate real pierced eye/mouth edges over backing',mainHipMountOffset:[0,.145,.23],mountReason:'The actual1.03 extended end-tile row previously covered the face; a closed ceramic seat carries the face ahead/above that measured row',historicalArtifactIdentityClaimed:false,photoTexture:false},dispose(){for(const g of owned)g.dispose();}};
}
