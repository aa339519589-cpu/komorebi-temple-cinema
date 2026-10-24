import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createGiltJoinery238} from './gilt-joinery238.js';

// Authored, inferred timber construction. The receiver is fitted to the same
// roof surface as the ceramic bed. No photographic depth or image projection.
export async function createGrandFrame182({emit,box,group,mats}){
 const arms=new Map(),shafts=new Map(),contacts=[];
 const fittedGilt238=createGiltJoinery238({emit,box,group,mats});
 const carving=await new GLTFLoader().loadAsync(new URL('../assets/carved-bearing176/cloud-scroll.glb',import.meta.url).href),carvedParts=[];
 carving.scene.updateMatrixWorld(true);carving.scene.traverse(o=>{if(o.isMesh)carvedParts.push(o.geometry.clone().applyMatrix4(o.matrixWorld));});
 const carvedWood=new T.MeshPhysicalMaterial({name:'scene07-real-176-carved-gilt-corner-cheek',color:0xa48746,metalness:.76,roughness:.49,clearcoat:.035,clearcoatRoughness:.48});carvedWood.userData.hallFinish214=true;
 function arm(length,depth){
  const key=`${length}:${depth}`;if(arms.has(key))return arms.get(key);
  const s=new T.Shape(),h=length/2;
  s.moveTo(-h,.08);s.lineTo(h,.08);s.quadraticCurveTo(h+.015,-.025,h-.075,-.050);
  s.bezierCurveTo(h-.19,-.038,h-.20,-.105,h-.32,-.120);
  s.bezierCurveTo(.22,-.15,-.22,-.15,-h+.32,-.120);
  s.bezierCurveTo(-h+.20,-.105,-h+.19,-.038,-h+.075,-.050);
  s.quadraticCurveTo(-h-.015,-.025,-h,.08);s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:3,curveSegments:18});g.translate(0,0,-depth/2);arms.set(key,g);return g;
 }
 function shaft(radius,height){
  const key=`${radius}:${height.toFixed(5)}`;if(shafts.has(key))return shafts.get(key);
  const rr=radius,points=[[0,0],[rr*.98,0],[rr,.08*height],[rr*1.025,.36*height],[rr*1.015,.64*height],[rr*.97,.92*height],[rr*.955,height],[0,height]];
  const g=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),48),p=g.attributes.position,uv=g.attributes.uv;
  // Longitudinal wood coordinates, not one stretched square texture per post.
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i)/1.6,Math.atan2(p.getZ(i),p.getX(i))*rr/.55);
  shafts.set(key,g);return g;
 }
 const shoe=new T.CylinderGeometry(.43,.47,.14,40),neck=new T.CylinderGeometry(.34,.31,.10,40),cap=new T.CylinderGeometry(.25,.18,.13,4,1,false,Math.PI/4),boss=new T.CylinderGeometry(.047,.047,.013,12).rotateX(Math.PI/2);
 const leafShape=new T.Shape();leafShape.moveTo(0,0);leafShape.bezierCurveTo(.12,-.018,.29,.01,.34,.11);leafShape.bezierCurveTo(.21,.065,.17,.15,.11,.12);leafShape.bezierCurveTo(.03,.09,.035,.015,0,0);leafShape.closePath();
 const giltLeaf=new T.ExtrudeGeometry(leafShape,{depth:.014,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:10});
 const rb=.18/Math.sqrt(2),rt=.25/Math.sqrt(2),capFaceShape=new T.Shape([new T.Vector2(-rb,-.065),new T.Vector2(rb,-.065),new T.Vector2(rt,.065),new T.Vector2(-rt,.065)]),giltCapFace=new T.ExtrudeGeometry(capFaceShape,{depth:.009,bevelEnabled:false});
 for(let i=0,p=giltCapFace.attributes.position;i<p.count;i++)p.setZ(i,p.getZ(i)+rb+.003+(p.getY(i)+.065)/.13*(rt-rb));giltCapFace.computeVertexNormals();
 function frame(x,z,bottom,roofBottom,radius,{front=1,upper=false,roofAt=null,roofContains=null,metricX=1,metricZ=1,carved=true}={}){
  const capHeight=upper?.62:.84,head=roofBottom-capHeight,shaftBottom=bottom+.14,shaftTop=head-.075,height=shaftTop-shaftBottom;
  if(height<.25)throw Error('182 frame has no occupied shaft interval');
  emit(shaft(radius,height),mats.red,x,shaftBottom,z,metricX,1,metricZ);
  emit(shoe,mats.terraceStone,x,bottom+.07,z,radius/.31*metricX,1,radius/.31*metricZ);
  emit(neck,mats.dark,x,shaftBottom+.035,z,radius/.31*metricX,.65,radius/.31*metricZ);
  fittedGilt238.neckCollar(x,shaftTop-.10,z,radius,metricX,metricZ);
  box(x,head-.025,z,radius*2.35,.15,radius*2.35,'wood');
  const scaleY=capHeight/.92;
  group(x,head,z,front<0?Math.PI:0,1,()=>{
   const inside=(xx,zz)=>!roofContains||roofContains(x+front*xx,z+front*zz);
   const beam=(xx,yy,zz,len,depth,angle=0)=>{
    if(roofContains){const dx=Math.cos(angle),dz=-Math.sin(angle),sample=Array.from({length:49},(_,i)=>-len/2+i*len/48).filter(t=>inside(xx+dx*t,zz+dz*t));if(sample.length<2)return;const a=sample[0],b=sample.at(-1),mid=(a+b)/2;xx+=dx*mid;zz+=dz*mid;len=b-a;}
    emit(arm(len,depth),mats.red,xx,yy*scaleY,zz,1,scaleY,1,[0,angle,0]);
    fittedGilt238.armFace(xx,yy*scaleY,zz,len,depth,scaleY,angle);
   };
   const bearing=(xx,yy,zz,r=1)=>{if(inside(xx,zz)){emit(cap,mats.wood,xx,yy*scaleY,zz,r,scaleY,r);emit(giltCapFace,mats.gold,xx,yy*scaleY,zz,r,scaleY,r);}};
   // Interleaved crossed arms and splayed blocks occupy the actual cap
   // interval. Separate tiers leave visible air and reveal real beam ends.
   bearing(0,.075,0,1.10);beam(0,.225,0,1.12,.225);
   for(const side of[-1,1]){
    bearing(side*.33,.355,0,.80);beam(side*.33,.465,.285,1.10,.195,Math.PI/2);
    for(const zz of[-.20,.78])bearing(side*.33,.595,zz,.68);
    emit(boss,mats.gold,side*.33,.465*scaleY,.847);
    for(const zz of[-.20,.78])box(side*.33,.615*scaleY,zz+.10,.105,.075*scaleY,.016,'gold');
   }
   for(const zz of[-.20,.78]){
    beam(0,.725,zz,1.48,.205);
    for(const xx of[-.57,0,.57]){
     if(!inside(xx,zz))continue;
     bearing(xx,.845,zz,.58);
     const target=roofAt?Math.min(...[-.104,0,.104].flatMap(dx=>[-.147,0,.147].map(dz=>roofAt(x+front*(xx+dx),z+front*(zz+dz))))):roofBottom,low=head+.92*scaleY,h=target-low;
     box(xx,(.895*scaleY)+Math.max(0,h)/2,zz,.205,.05*scaleY+Math.max(0,h),.29,'wood');
    }
    // Small cast-leaf domains occupy the curved arm ends, not an even
    // gold stripe over the complete bearing. The wood remains exposed.
    for(const side of[-1,1])emit(giltLeaf,mats.gold,side*.30,.665*scaleY,zz+.111,.72,.72*scaleY,1,[0,side<0?Math.PI:0,0]);
   }
   // Four outer axes receive genuine pierced carved cheeks. The central
   // entrance stays open; these are fitted ornaments over real timber seats.
   if(carved&&(front>0||Math.abs(x)>4.3)){const sc=upper?.28:.36;for(const g of carvedParts)emit(g,carvedWood,0,.055,.13,sc,sc/.88,sc);}
  });
  contacts.push({axis:[x,z],floor:bottom,shaftBottom,shaftTop,clearShaftHeight:height,head,roofBottom,capHeight,upper});
 }
 return{frame,info:()=>({revision:'scene07-fitted-neck-collars-and-pierced-curve-arm-inserts238-r26',contacts,fittedGilt238:fittedGilt238.info(),construction:'Entasis shafts on mineral shoes; three crossed closed curved arm tiers, interleaved splayed blocks, actual fitted neck collars, pierced cast arm inserts and queried roof seats. Existing CC BY carved cheeks retained on front and outer axes. Inferred construction, not measured historical joinery.',visualAccepted:false})};
}
