import * as T from 'three';
import {chasedBaseRosette198} from './altar-joinery198.js';

// World/altar-unit construction, inferred from held53/reference front edges.
// Existing224 meshes/scales and all scene/layout object anchors are retained.
export const ALTAR260_PROFILE=Object.freeze({revision:'altar260-r02',tierShiftY:Object.freeze({1:-.16,2:-.10,3:0,4:0}),baseTop:.610,doorBottom:.060,doorTop:.520,baseDoorOuterWidth:.720,baseDoorInnerWidth:.642,thinBeadRadius:.0015});
let tip260=null;
export async function loadAltar260(){
 if(tip260)return;
 const response=await fetch(new URL('../assets/altar260/cloud-tip260-r01.bin',import.meta.url));if(!response.ok)throw Error('Altar260 small legal carving failed');
 const bytes=await response.arrayBuffer(),h=new DataView(bytes),n=h.getUint32(4,true),ni=h.getUint32(8,true);
 if(h.getUint32(0,true)!==0x36325443||bytes.byteLength!==20+n*32+ni*4)throw Error('Altar260 compact carving format invalid');
 const g=new T.BufferGeometry();let offset=20;
 g.setAttribute('position',new T.BufferAttribute(new Float32Array(bytes,offset,n*3),3));offset+=n*12;
 g.setAttribute('normal',new T.BufferAttribute(new Float32Array(bytes,offset,n*3),3));offset+=n*12;
 g.setAttribute('uv',new T.BufferAttribute(new Float32Array(bytes,offset,n*2),2));offset+=n*8;
 g.setIndex(new T.BufferAttribute(new Uint32Array(bytes,offset,ni),1));g.computeBoundingBox();g.computeBoundingSphere();
 g.userData.altar260={actualCCBY4SpatialCarving:true,closedCappedSolid:true,triangles:ni/3,source:'3dscantech cloud/dragon1336fa1889cf4eba829594fa30edd6ff',license:'CC-BY-4.0',notReferenceArtifact:true};tip260=g;
}
function data260(b){
 if(!b.root.userData.altar260)b.root.userData.altar260={revision:ALTAR260_PROFILE.revision,tierPlacements:[],frames:0,dividers:0,scannedCornerInstances:0,sourceTipTriangles:tip260?.index.count/3,referenceConstraint:'Same-pixel front edge comparison under held53 camera; not a survey or camera calibration',inferredDepth:true,visualAccepted:false,photographicAccepted:false};
 return b.root.userData.altar260;
}
function rectShape260(w,h,r){
 const x=-w/2,y=-h/2,s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();return s;
}
function rounded260(b,key,x,y,z,w,h,d,material='lacquer',radius=.0025){
 const r=Math.min(radius,w/6,h/6,d/6),g=b.geometry('260-rounded:'+key+':'+[w,h,d,r].join(':'),()=>{
  const q=new T.ExtrudeGeometry(rectShape260(w-2*r,h-2*r,r),{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:3,curveSegments:5,steps:1});q.translate(0,0,-d/2+r);q.userData.altar260={closedSolid:true,physicalBevelMetres:r,role:key};return q;
 });b.add(g,material,x,y,z);
}
function bead260(b,key,x,y,z,length,vertical=false){
 // A thin closed pressed-binding section, rather than a round wire or a
 // scaled box. Broad cap and two short rolled flanges are real geometry.
 const g=b.geometry('260-pressed-binding:'+length,()=>{
  const points=[[-.0018,-.00045],[.0018,-.00045],[.0018,.00045],[.00115,.00105],[-.00115,.00105],[-.0018,.00045]],shape=new T.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();
  const q=new T.ExtrudeGeometry(shape,{depth:length,bevelEnabled:false,steps:1,curveSegments:1}),p=q.attributes.position;
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i),p.getZ(i)-length/2,p.getY(i));
  if(q.index){for(let i=0;i<q.index.count;i+=3){const a=q.index.getX(i+1);q.index.setX(i+1,q.index.getX(i+2));q.index.setX(i+2,a);}}
  else for(const a of Object.values(q.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const v=a.array[(i+1)*a.itemSize+k];a.array[(i+1)*a.itemSize+k]=a.array[(i+2)*a.itemSize+k];a.array[(i+2)*a.itemSize+k]=v;}
  q.computeVertexNormals();q.userData.altar260={closedSolid:true,pressedBinding:true,physicalWidthMetres:.0036,physicalThicknessMetres:.0015};return q;
 });b.add(g,'oldgold',x,y,z,1,1,1,0,0,vertical?0:Math.PI/2);
}
function mould260(b,key,x,y,z,width){
 const g=b.geometry('260-ogee:'+key+':'+width,()=>{
  const profile=[[-.039,-.018],[-.008,-.018],[.004,-.012],[.012,-.002],[.011,.004],[.003,.012],[-.010,.016],[-.039,.016]],s=new T.Shape();s.moveTo(...profile[0]);for(const p of profile.slice(1))s.lineTo(...p);s.closePath();
  const q=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2,curveSegments:1,steps:1}),p=q.attributes.position;
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getZ(i)-width/2,p.getY(i),p.getX(i));
  for(const a of Object.values(q.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const v=a.array[(i+1)*a.itemSize+k];a.array[(i+1)*a.itemSize+k]=a.array[(i+2)*a.itemSize+k];a.array[(i+2)*a.itemSize+k]=v;}
  q.computeVertexNormals();q.userData.altar260={closedSolid:true,actualOgeeSection:true,role:key};return q;
 });b.add(g,'lacquer',x,y,z);
}
function leaf260(b,x,y,z,w,h,side=1,rotation=Math.PI/2,maxDepth=.008){
 if(!tip260)throw Error('Load altar260 carving before construction');
 const g=b.geometry('260-actual-cloud-tip:'+side,()=>{
  const q=tip260.clone();if(side<0){const p=q.attributes.position,n=q.attributes.normal;for(let i=0;i<p.count;i++){p.setX(i,-p.getX(i));n.setX(i,-n.getX(i));}const ix=q.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,a);}}q.computeBoundingBox();q.computeBoundingSphere();return q;
 });
 const size=g.boundingBox.getSize(new T.Vector3()),c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation)),scale=Math.min(w/(c*size.x+s*size.y),h/(s*size.x+c*size.y),maxDepth/size.z);
 b.add(g,'oldgold',x,y,z,scale,scale,scale,0,0,rotation);data260(b).scannedCornerInstances++;
}
function plaque260(b,x,y,z,w=.042,h=.028,side=1,up=1){
 const g=b.geometry('260-small-lobed-pressure-plate:'+w+':'+h+':'+side+':'+up,()=>{
  const s=new T.Shape();s.moveTo(-w*.47,-h*.45);s.lineTo(w*.15,-h*.45);s.quadraticCurveTo(w*.55,-h*.32,w*.43,0);s.quadraticCurveTo(w*.50,h*.28,w*.19,h*.45);s.quadraticCurveTo(0,h*.20,-w*.16,h*.44);s.quadraticCurveTo(-w*.52,h*.40,-w*.47,-h*.45);s.closePath();
  const q=new T.ExtrudeGeometry(s,{depth:.0024,bevelEnabled:true,bevelSize:.00065,bevelThickness:.00065,bevelSegments:2,curveSegments:5});const p=q.attributes.position,n=q.attributes.normal;for(let i=0;i<p.count;i++){p.setXYZ(i,p.getX(i)*side,p.getY(i)*up,p.getZ(i));n.setXYZ(i,n.getX(i)*side,n.getY(i)*up,n.getZ(i));}
  if(side*up<0){if(q.index){for(let i=0;i<q.index.count;i+=3){const a=q.index.getX(i+1);q.index.setX(i+1,q.index.getX(i+2));q.index.setX(i+2,a);}}else for(const a of Object.values(q.attributes))for(let i=0;i<a.count;i+=3)for(let k=0;k<a.itemSize;k++){const v=a.array[(i+1)*a.itemSize+k];a.array[(i+1)*a.itemSize+k]=a.array[(i+2)*a.itemSize+k];a.array[(i+2)*a.itemSize+k]=v;}}
  q.userData.altar260={closedSolid:true,thinCastPressedPlate:true};return q;
 });b.add(g,'oldgold',x,y,z);leaf260(b,x,y,z+.002,w*.94,h*.90,side,up*Math.PI/2,.0065);
}
function base260(b,layout,t){
 const d=data260(b),front=t.d/2+.025,floor=layout.floorContactY,top=ALTAR260_PROFILE.baseTop,outer=Math.max(t.w,layout.terraceWidths[1]+.02),doorWidth=ALTAR260_PROFILE.baseDoorOuterWidth,caseX=outer/2-doorWidth/2,doorCenter=(ALTAR260_PROFILE.doorBottom+ALTAR260_PROFILE.doorTop)/2,frameCenter=doorCenter-.002;
 d.base={outerWidth:outer,oldWidth:t.w,oldTop:.76,newTop:top,doorField:[ALTAR260_PROFILE.baseDoorInnerWidth,ALTAR260_PROFILE.doorTop-ALTAR260_PROFILE.doorBottom],doorCenterY:(ALTAR260_PROFILE.doorBottom+ALTAR260_PROFILE.doorTop)/2,sideDoorCentersX:[-caseX,caseX],openCentralBayWidth:2*(caseX-doorWidth/2),rearBaySetbackMetres:.82,floorContactY:floor,depth:t.d,depthBasis:'Retained53 footprint depth; rear cabinet detail occluded in the photograph'};
 // Closed side walls/back/sills form two real cupboard cases, not one giant
 // centre slab. The centre remains an actual deep open bay behind the table.
 for(const side of[-1,1]){
  const x=side*caseX,bodyH=top-floor;
  for(const s of[-1,1])b.box(x+s*(doorWidth/2-.022),floor+bodyH/2,0,.044,bodyH,t.d,'lacquer');
  b.box(x,floor+bodyH/2,-t.d/2+.022,doorWidth-.06,bodyH,.044,'lacquer');
  for(const y of[floor+.025,top-.025])b.box(x,y,0,doorWidth,.05,t.d,'lacquer');
  rounded260(b,'door-inset',x,(ALTAR260_PROFILE.doorBottom+ALTAR260_PROFILE.doorTop)/2,front-.024,ALTAR260_PROFILE.baseDoorInnerWidth,ALTAR260_PROFILE.doorTop-ALTAR260_PROFILE.doorBottom,.026,'lacquer',.003);
  for(const s of[-1,1]){
   rounded260(b,'door-rebated-stile',x+s*(doorWidth/2-.020),frameCenter,front+.002,.040,.542,.062,'lacquer',.0025);
   rounded260(b,'door-rebated-rail',x,frameCenter+s*.253,front+.002,doorWidth-.020,.036,.062,'lacquer',.0025);
   bead260(b,'door-inner',x+s*.322,frameCenter,front+.034,.483,true);
   bead260(b,'door-inner',x,frameCenter+s*.238,front+.034,.640,false);
   for(const up of[-1,1])plaque260(b,x+s*.326,frameCenter+up*.239,front+.033,.044,.030,s,up);
  }
  chasedBaseRosette198(b,x,doorCenter,front-.006,.050);
 }
 const clear=2*(caseX-doorWidth/2);
 // A real back and rear posts are visible through the centre opening. Their
 // depth is inferred; nothing moves the foreground table/cushion anchors.
 const backZ=front-.82,backPanelWidth=clear/4;
 b.box(0,(floor+top)/2,backZ-.025,clear,top-floor,.020,'lacquer');
 for(let j=0;j<4;j++)rounded260(b,'inferred-rebated-bay-backboard',(j-1.5)*backPanelWidth,(floor+top)/2,backZ,backPanelWidth-.004,top-floor-.034,.040,'lacquer',.0015);
 d.base.rearBackboardConstruction='Four separately rebated closed planks, backed at the retained inferred depth; hidden by table/cushion in the reference, not directly observed';
 for(const x of[-clear/2,clear/2])b.box(x,(floor+top)/2,front-.42,.055,top-floor,.78,'lacquer');
 b.box(0,top-.026,0,outer,.052,t.d,'lacquer');
 rounded260(b,'ground-plinth',0,floor+.027,0,outer+.075,.054,t.d+.04,'lacquer',.004);
 mould260(b,'ground-rolled-skirting',0,.032,front+.006,outer+.045);
 mould260(b,'base-cap-shadow-return',0,top-.018,front+.018,outer+.05);
 bead260(b,'base-cap-edge',0,top+.0005,front+.030,outer+.018);
 // Closed concealed bearing walls carry the two enlarged vertical setbacks.
 const bridge1=[1.067+ALTAR260_PROFILE.tierShiftY[1],1.109+ALTAR260_PROFILE.tierShiftY[2]],bridge2=[1.452+ALTAR260_PROFILE.tierShiftY[2],1.512];
 b.box(0,(bridge1[0]+bridge1[1])/2,-.10,layout.carvedFrontWidths[0]-.04,bridge1[1]-bridge1[0],2.60,'lacquer');
 b.box(0,(bridge2[0]+bridge2[1])/2,-.10,layout.carvedFrontWidths[1]-.06,bridge2[1]-bridge2[0],2.20,'lacquer');
}

export function withAltarTier260(b,layout,t,level,emitOriginalTier){
 const data=data260(b);if(!data.protectedLayoutAnchors){const keys=['mainSeatY','sideSeatY','sideFigureX','mainThroneHeight','sideThroneHeight','mainMandorlaZ','foregroundTableAdvance','foregroundTableScale','foregroundCushionScale','floorContactY','floorLampX','floorVaseX','floorUrnX','upperVaseX','upperVaseY','upperVaseZ','innerRitualLotusX','innerRitualLotusZ','outerRitualLotusX','outerRitualLotusZ','sidePendantX','sidePendantY','sidePendantZ','ritualChimneyTopY'];data.protectedLayoutAnchors=Object.fromEntries(keys.filter(k=>layout[k]!==undefined).map(k=>[k,Array.isArray(layout[k])?[...layout[k]]:layout[k]]));}if(level===0){base260(b,layout,t);return;}
 const shift=ALTAR260_PROFILE.tierShiftY[level]??0,before=b.root.userData.carvingMounts198?.length??0,beforeLong=b.root.userData.ornament224?.length??0;
 b.withTransform(0,shift,0,1,emitOriginalTier);
 const after=b.root.userData.carvingMounts198??[];
 for(const item of after.slice(before)){
  if(!shift)continue;item.sourcePlacementBefore260={center:item.center?[...item.center]:null,position:item.position?[...item.position]:null};
  for(const key of['center','position','parentFieldCenter'])if(Array.isArray(item[key]))item[key]=item[key].map((v,k)=>k===1?v+shift:v);
  if(item.contactWorldXY)item.contactWorldXY=[item.contactWorldXY[0],item.contactWorldXY[1]+shift];item.tierTranslation260=[0,shift,0];
 }
 if(shift)for(const item of(b.root.userData.ornament224??[]).slice(beforeLong)){item.sourceCenterBefore260=[...item.center];item.center=[item.center[0],item.center[1]+shift,item.center[2]];item.tierTranslation260=[0,shift,0];}
 data.tierPlacements.push({level,originalY:t.y,actualY:t.y+shift,translationY:shift,carvingSourcesAndUniformScalesUnchanged:true});
}

export function buildPanelFrame260(b,x,y,z,w,h,back){
 b.box(x,y,(z+.006+back)/2,w+.018,h+.035,z+.006-back,'lacquer');
 for(const side of[-1,1]){
  rounded260(b,'panel-rebated-stile',x+side*w/2,y,z+.008,.045,h+.056,.060,'lacquer',.0022);
  rounded260(b,'panel-rebated-rail',x,y+side*h/2,z+.008,w+.050,.037,.060,'lacquer',.0022);
  bead260(b,'panel-pressed-edge',x+side*(w/2-.013),y,z+.041,h+.016,true);
  bead260(b,'panel-pressed-edge',x,y+side*(h/2-.010),z+.041,w+.008);
  for(const up of[-1,1])plaque260(b,x+side*(w/2+.006),y+up*(h/2+.006),z+.036,.042,.028,side,up);
 }data260(b).frames++;
}
export function buildPanelDivider260(b,x,y,z,h){
 rounded260(b,'dark-joinery-divider',x,y,z,.052,h,.085,'lacquer',.0025);
 for(const side of[-1,1]){bead260(b,'divider-edge',x+side*.020,y,z+.045,h-.020,true);plaque260(b,x,y+side*(h*.38),z+.046,.060,.034,1,side);}data260(b).dividers++;
}
export function buildTierEdge260(b,t,level,front,frontWidth,wingInset,stepped){
 for(const side of[-1,1])for(const[width,inset]of stepped?[[frontWidth,0],[t.w,wingInset]]:[[t.w,0]]){
  bead260(b,'thin-outer-return',side*(width/2-.058),t.y,front+.047-inset,t.h-.050,true);
  for(const up of[-1,1])plaque260(b,side*(width/2-.045),t.y+up*(t.h/2-.029),front+.036-inset,.041,.027,side,up);
 }
}
export function buildAltarUpright260(b,x){
 const bottom=ALTAR260_PROFILE.baseTop,top=1.890,height=top-bottom,profile=[[0,0],[.058,.008],[.044,.050],[.028,.100],[.027,height-.110],[.050,height-.070],[.041,height-.010],[0,height]];
 const g=b.geometry('260-supported-tier-upright',()=>{const q=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),24);q.userData.altar260={closedSolid:true,actualRevolvedJoinery:true,baseBearingY:bottom,upperAnchorY:top};return q;});b.add(g,'lacquer',x,bottom,1.56);
}
export function buildUprightCapital260(b,x,y,z,bearingZ,row){
 const shift=ALTAR260_PROFILE.tierShiftY[row]??0,yy=y+shift;
 b.torus(x,yy,z,.043,.006,'oldgold',Math.PI/2);
 rounded260(b,'upright-depth-bearing',x,yy,(z+bearingZ)/2,.113,.031,Math.abs(z-bearingZ)+.10,'lacquer',.0022);
 plaque260(b,x,yy,z+.055,.080,.038,1,1);
}
export function withAltarAccents260(b,layout,emitOriginalAccents){
 const geometry=b.geometry,add=b.add,keys=new Map();
 b.geometry=function(key,make){const g=geometry.call(b,key,make);keys.set(g,key);return g;};
 b.add=function(g,material,x=0,y=0,...rest){const key=keys.get(g)||'';if(key.includes('cabinet-knee-')||key.includes('cabinet-lobe-')||(key.startsWith('altar-v3-palmette')&&y<1.95))return;return add.call(b,g,material,x,y,...rest);};
 try{emitOriginalAccents();}finally{b.geometry=geometry;b.add=add;}
 for(const[index,row]of[{y:.93,z:1.55,w:layout.carvedFrontWidths[0]},{y:1.29,z:1.40,w:layout.carvedFrontWidths[1]},{y:1.65,z:1.25,w:layout.carvedFrontWidths[2]}].entries())for(const side of[-1,1]){
  const y=row.y+(ALTAR260_PROFILE.tierShiftY[index+1]??0),x=side*(row.w/2+.02);
  rounded260(b,'real-recessed-corner-bearing',x,y-.045,row.z-.032,.100,.145,.145,'lacquer',.004);
  leaf260(b,x,y-.045,row.z+.039,.110,.075,side,side*Math.PI/2,.020);
 }
}
