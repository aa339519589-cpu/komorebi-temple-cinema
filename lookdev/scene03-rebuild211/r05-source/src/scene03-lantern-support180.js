import {createCurvedEaveRafter} from './scene03-curved-rafter.js';

// Coordinates use the retained hallFixtureMatrix. In the architecture's
// pre-turn frame, fixture z+3 and x-5 are the actual hall coordinates.
// The back0.45m of each outrigger passes through the existing lower girt
// (center z=.12 / depth.37 / center y=9.96 / height.28).
export function buildLanternSupports180(T,{emit,box,between,gold,bronze,wood}){
 const supports=[];
 for(const x of[-.8,2.0,8.0,10.8]){
  const points=[[x,10.00,-3.16],[x,10.02,-2.77],[x,9.96,-2.05],[x,9.74,-1.38],[x,9.58,-.90]];
  const beam=createCurvedEaveRafter(points,.19,.25),curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),p=beam.attributes.position;
  // Continuous taper keeps the outer hooked nose lighter than its housed
  // root. Both source caps remain closed and the end stays under the fascia.
  for(let row=0;row<=32;row++){
   const t=row/32,c=curve.getPoint(t),taper=1-.35*T.MathUtils.smoothstep(t,.45,1);
   for(let k=0;k<32;k++){const i=row*32+k,v=new T.Vector3().fromBufferAttribute(p,i).sub(c).multiplyScalar(taper).add(c);p.setXYZ(i,v.x,v.y,v.z);}
  }
  beam.computeVertexNormals();beam.name='scene03-closed-seated-tapered-lantern-outrigger180';emit(beam,wood);
  // A folded bronze saddle wraps the actual wood, rather than ending as a
  // detached plate. Upper/lower straps and two cheeks share real contacts.
  const clampZ=-2.84,clampY=10.016;
  for(const side of[-1,1]){
   box([x,clampY+side*.135,clampZ],[.25,.018,.30],bronze);
   box([x+side*.116,clampY,clampZ],[.018,.286,.30],bronze);
  }
  const hookY=9.445;
  emit(new T.TorusGeometry(.045,.012,8,24),gold,[x,hookY,-.90]);
  between([x,hookY,-.90],[x,8.191,-.90],.014,gold);
  supports.push({fixtureX:x,hallLocalX:x-5,bodyCenter:[x,7.38,-.90],outriggerRootSection:[.19,.25],outriggerTipSection:[.1235,.1625],outriggerCenterline:points,retainedGirtCenter:[x-5,9.96,.12],retainedGirtSection:[.28,.37],clampCenter:[x,clampY,clampZ],hookCenter:[x,hookY,-.90],rodEndpoints:[[x,hookY,-.90],[x,8.191,-.90]],bodyMoved:false,changedUpperAttachment211:true,bodyTopY:8.191});
 }
 return{revision:180,coordinateSystem:'Retained hallFixtureMatrix; x-5/z+3 converts to the pre-turn architecture frame',supports,source:'Actual closed authored timber outriggers, folded bronze clamps, torus hooks and continuous rods',scope:'Visible support/contact repair; inferred carpentry, not engineering certification',visualAccepted:false};
}
