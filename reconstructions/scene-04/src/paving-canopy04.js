import * as T from 'three';
import {createTracedPaving04} from './traced-paving04.js';
// Coarse observed leafy-shadow regions, not a photographic shadow texture.
// Hidden bough positions are an inferred illumination boundary: every mark is
// cast by real stable leaf/twig geometry between the sun and the stone.
const regions=[[410,785,8],[550,820,11],[710,850,12],[550,915,16],[360,945,15],[430,990,15],[220,1050,20],[620,1060,13],[850,1100,12],[530,1165,18],[230,1230,16],[740,1225,16]];
export function createPavingCanopy04(sunDirection){
 const group=new T.Group();group.name='scene04-supported-west-maple-canopy';
 const layout=createTracedPaving04(),direction=sunDirection.clone().normalize(),height=7.1;
 const material=new T.MeshStandardMaterial({name:'scene04-small-live-maple-leaves',color:'#46552a',roughness:.83,side:T.DoubleSide,shadowSide:T.DoubleSide});
 const outline=[[0,.12],[-.026,.055],[-.070,.075],[-.055,.025],[-.102,.016],[-.055,-.014],[-.066,-.051],[-.026,-.038],[0,-.087],[.026,-.038],[.066,-.051],[.055,-.014],[.102,.016],[.055,.025],[.070,.075],[.026,.055]],shape=new T.Shape();
 outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 const leaf=new T.ExtrudeGeometry(shape,{depth:.00035,steps:1,bevelEnabled:false});leaf.rotateX(-Math.PI/2);
 const count=regions.reduce((n,r)=>n+r[2]*3,0),leaves=new T.InstancedMesh(leaf,material,count);leaves.name='scene04-real-maple-shadow-leaves';leaves.castShadow=leaves.receiveShadow=true;
 // The canopy sits wholly outside the beauty camera and several instances are
 // near the directional shadow-frustum edge. Keep it eligible in both passes.
 leaves.frustumCulled=false;
 const wood=new T.MeshStandardMaterial({name:'scene04-inferred-canopy-twigs',color:'#55432b',roughness:.94});let seed=890418,at=0;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),targets=[];
 const lift=(x,z,y)=>new T.Vector3(x,layout.groundY,z).addScaledVector(direction,(y-layout.groundY)/direction.y);
 function twig(a,b,r){const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r*.35,r,d.length(),7),wood);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());o.castShadow=o.receiveShadow=true;group.add(o);}
 for(const [px,py,n]of regions){
  const [x,z]=layout.world([px,py]),centre=lift(x,z,height);targets.push(centre);
  for(let k=0;k<n*3;k++){
   const angle=rnd()*Math.PI*2,radius=Math.sqrt(rnd())*(.26+.18*rnd()),y=height+(rnd()-.5)*.30;
   const shadowX=x+Math.cos(angle)*radius,shadowZ=z+Math.sin(angle)*radius,position=lift(shadowX,shadowZ,y),o=new T.Object3D();
   o.position.copy(position);o.rotation.set((rnd()-.5)*.8,rnd()*Math.PI*2,(rnd()-.5)*.8);const size=.55+rnd()*.55;o.scale.set(size,1,size);o.updateMatrix();leaves.setMatrixAt(at++,o.matrix);twig(centre,position,.0025);
  }
 }
 // The inferred canopy is a supported tree, also inspectable from above.
 // Its trunk stands in the existing rear earth, outside the reference camera.
 const trunk=[new T.Vector3(-11.4,-.08,27.4),new T.Vector3(-11.25,2.0,27.1),new T.Vector3(-10.8,4.1,26.6),new T.Vector3(-10.3,5.6,26.0),new T.Vector3(-9.8,6.8,25.5)];
 for(let k=1;k<trunk.length;k++){
  const a=trunk[k-1],b=trunk[k],d=b.clone().sub(a),r0=.42-.070*(k-1),r1=.42-.070*k;
  const o=new T.Mesh(new T.CylinderGeometry(r1,r0,d.length(),14),wood);o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());o.castShadow=o.receiveShadow=true;group.add(o);
 }
 for(let k=0;k<7;k++){const angle=k*Math.PI*2/7;twig(trunk[0].clone().add(new T.Vector3(0,.20,0)),trunk[0].clone().add(new T.Vector3(Math.cos(angle)*1.15,.015,Math.sin(angle)*1.15)),.12);}
 const boughEnds=[];
 for(const index of[0,4,8,11]){
  const a=trunk[3],b=targets[index],mid=a.clone().lerp(b,.48);mid.y-=.35;
  const curve=new T.CatmullRomCurve3([a,mid,b]);
  for(let j=0;j<7;j++)twig(curve.getPoint(j/7),curve.getPoint((j+1)/7),.16*(1-j/8));
  boughEnds.push(b);
 }
 for(const center of targets){let nearest=boughEnds[0];for(const p of boughEnds)if(p.distanceToSquared(center)<nearest.distanceToSquared(center))nearest=p;if(nearest.distanceToSquared(center)>.001)twig(nearest,center,.045);}
 leaves.instanceMatrix.needsUpdate=true;leaves.computeBoundingBox();leaves.computeBoundingSphere();group.add(leaves);
 group.userData.reconstruction={source:'Coarse manually observed shadow-region centres; authored supported tree and hidden bough geometry',regions,physicalSunDirection:direction.toArray(),leafCount:count,heightMetres:height,trunkRoot:trunk[0].toArray(),shadowBitmap:false,referenceRGBLoaded:false,hiddenTreeMeasured:false,shadowEligibleInBeautyAndDirectionalDepthPass:true,photographicAcceptance:false};
 return group;
}
