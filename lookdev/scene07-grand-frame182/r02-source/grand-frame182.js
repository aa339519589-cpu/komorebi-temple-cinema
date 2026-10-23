import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Authored, inferred timber construction. The receiver is fitted to the same
// roof surface as the ceramic bed. No photographic depth or image projection.
export async function createGrandFrame182({emit,box,group,mats}){
 const arms=new Map(),shafts=new Map(),contacts=[];
 const carving=await new GLTFLoader().loadAsync(new URL('../assets/carved-bearing176/cloud-scroll.glb',import.meta.url).href),carvedParts=[];
 carving.scene.updateMatrixWorld(true);carving.scene.traverse(o=>{if(o.isMesh)carvedParts.push(o.geometry.clone().applyMatrix4(o.matrixWorld));});
 const carvedWood=new T.MeshPhysicalMaterial({name:'scene07-real-176-carved-gilt-corner-cheek',color:0xa48746,metalness:.76,roughness:.49,clearcoat:.035,clearcoatRoughness:.48});
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
 const shoe=new T.CylinderGeometry(.43,.47,.14,40),neck=new T.CylinderGeometry(.34,.31,.10,40),cap=new T.CylinderGeometry(.29,.25,.105,4,1,false,Math.PI/4);
 function frame(x,z,bottom,roofBottom,radius,{front=1,upper=false,roofAt=null}={}){
  const capHeight=upper?.49:.56,head=roofBottom-capHeight,shaftBottom=bottom+.14,shaftTop=head-.075,height=shaftTop-shaftBottom;
  if(height<.25)throw Error('182 frame has no occupied shaft interval');
  emit(shaft(radius,height),mats.red,x,shaftBottom,z);
  emit(shoe,mats.terraceStone,x,bottom+.07,z,radius/.31,1,radius/.31);
  emit(neck,mats.dark,x,shaftBottom+.035,z,radius/.31,.65,radius/.31);
  box(x,head-.025,z,radius*2.35,.15,radius*2.35,'wood');
  const scaleY=capHeight/.56;
  group(x,head,z,front<0?Math.PI:0,1,()=>{
   const beam=(xx,yy,zz,len,depth,angle=0)=>emit(arm(len,depth),mats.red,xx,yy*scaleY,zz,1,scaleY,1,[0,angle,0]);
   const bearing=(xx,yy,zz,r=1)=>emit(cap,mats.wood,xx,yy*scaleY,zz,r,scaleY,r);
   bearing(0,.05,0);beam(0,.145,0,1.18,.29);
   for(const side of[-1,1]){
    bearing(side*.37,.265,0,.70);beam(side*.37,.355,.295,1.18,.245,Math.PI/2);
    for(const zz of[-.19,.78])bearing(side*.37,.45,zz,.65);
   }
   for(const zz of[-.19,.78]){
    beam(0,.50,zz,1.52,.255);
    for(const xx of[-.57,0,.57]){
     const target=roofAt?roofAt(x+xx,z+front*zz):roofBottom,low=head+.56*scaleY,h=target-low;
     box(xx,(.535*scaleY)+Math.max(0,h)/2,zz,.205,.05*scaleY+Math.max(0,h),.29,'wood');
    }
   }
   // Four outer axes receive genuine pierced carved cheeks. The central
   // entrance stays open; these are fitted ornaments over real timber seats.
   if(Math.abs(x)>4.3){const sc=upper?.35:.43;for(const g of carvedParts)emit(g,carvedWood,0,.025,.18,sc,sc/.88,sc);}
  });
  contacts.push({axis:[x,z],floor:bottom,shaftBottom,shaftTop,clearShaftHeight:height,head,roofBottom,capHeight,upper});
 }
 return{frame,info:()=>({revision:'scene07-tall-shafts-compact-roof-seated-bearing182-r02',contacts,construction:'Full entasis shafts on mineral shoes; compact closed curved crossed arms and individual queried roof seats. Selective genuine CC BY pierced carved cheeks; original roof/site/camera anchors retained.',visualAccepted:false})};
}
