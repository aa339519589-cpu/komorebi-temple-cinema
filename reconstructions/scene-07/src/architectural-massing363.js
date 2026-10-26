import * as T from 'three';
import {createBearing174} from './deep-bearing319.js';

// Inferred architecture in building metres. The existing world/site/camera
// transforms are applied by the caller. The photograph supplies comparison
// landmarks only; every chamber, gallery, column and bearing is a solid.
export function createArchitecturalMassing363({emit,box,group,mats,column,lattice,rail,roofHeight,physicalRoof,masonryForms,scannedStones,groundModel}){
 const towerTiers=[],terraceSegments=[],shafts=new Map();let galleryConnection=null,galleryFoundationStones=0;
 const kit=createBearing174(T,{
  emit(g,material,x=0,y=0,z=0,sx=1,sy=1,sz=1,yaw=0){
   const key=material==='bearingGilt'?'gold':/flared-bearing-cup|roof-receiver/.test(g.name)?'wood':'red';
   emit(g,mats[key],x,y,z,sx,sy,sz,Array.isArray(yaw)?yaw:[0,yaw,0]);
  },
  grouped(x,y,z,yaw,fn){group(x,y,z,yaw,1,fn);},keep:g=>g
 });
 function shaft(radius,height){
  const key=radius+':'+height.toFixed(5);if(shafts.has(key))return shafts.get(key);
  const profile=[[0,0],[radius*.99,0],[radius,.08*height],[radius*1.025,.36*height],[radius*1.015,.64*height],[radius*.97,.92*height],[radius*.95,height],[0,height]];
  const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),24),p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getY(i)/1.6,Math.atan2(p.getZ(i),p.getX(i))*radius/.55);
  g.userData.architectureMember='scene07-tower363-continuous-entasis-post';shafts.set(key,g);return g;
 }
 function hallTerrace(){
  const floor=2.85,front=5.07,outer=8.02,gap=2.55,height=.66;
  const panel=(a,b)=>{
   const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx),cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;
   group(cx,floor,cz,yaw,1,()=>{
    // The three-step projecting stone section belongs to the capped hall
    // plinth. Jointed top slabs carry an actual open timber balustrade.
    box(0,-.135,0,length+.06,.17,.40,'terraceStone');
    box(0,-.235,-.035,length+.10,.065,.34,'plinthMortar');
    const slabCount=Math.ceil(length/.69);
    for(let i=0;i<slabCount;i++)box(-length/2+(i+.5)*length/slabCount,-.035,.005,length/slabCount-.012,.07,.45,'terraceStone');
    for(const y of[.19,.43,height])box(0,y,.015,length+.07,y===height?.105:.075,y===height?.15:.10,'red');
    const count=Math.ceil(length/1.14);
    for(let i=0;i<=count;i++){
     const x=-length/2+i*length/count;
     box(x,height*.51,.015,.115,height+.04,.13,'red');
     box(x,height+.035,.015,.17,.055,.18,'wood');
     box(x,.045,.015,.21,.09,.23,'terraceStone');
    }
    for(let i=0;i<count;i++)for(const t of[1/3,2/3])box(-length/2+(i+t)*length/count,.31,.015,.045,.42,.055,'red');
   });
   terraceSegments.push({a,b,floor,height,length});
  };
  panel([-outer,front],[-gap,front]);panel([gap,front],[outer,front]);
  panel([outer,-5.42],[outer,front]);
  // Leave the actual western gallery doorway open in the return.
  panel([-outer,2.85],[-outer,front]);
 }
 function towerTier({level,y,w,floor}){
  const b=w*.64,core=b*.74,capitalBase=y-.82,roomTop=y-.74,roomFloor=floor+.14;
  const chamberHeight=roomTop-roomFloor;
  box(0,(roomFloor+roomTop)/2,0,core,chamberHeight,core,'dark');
  box(0,floor-.035,0,b+.46,.18,b+.46,'wood');
  box(0,floor+.075,0,b+.34,.065,b+.34,'red');
  const axes=[-b/2,-b/6,b/6,b/2];
  for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,1,()=>{
   for(let bay=-1;bay<=1;bay++){
    const x=bay*core*.31,pw=core*.245,ph=Math.max(.46,chamberHeight-.40),cy=(roomFloor+roomTop)/2,z=core/2+.025;
    if(level===0)lattice(x,cy,z,pw,ph);
    else{
     box(x,cy,z,pw,ph,.13,'plaster');
     for(const xx of[-pw/2,0,pw/2])box(x+xx,cy,z+.09,.055,ph+.10,.075,'red');
     for(const yy of[-ph/2,0,ph/2])box(x,cy+yy,z+.09,pw+.08,.055,.075,'red');
    }
    box(x,roomFloor+.075,z,core*.28,.15,.10,'red');
    box(x,roomTop-.06,z,core*.28,.12,.10,'red');
   }
   for(const x of[-core/2,-core/6,core/6,core/2])box(x,(roomFloor+roomTop)/2,core/2+.085,.095,chamberHeight+.08,.13,'red');
   // The open ambulatory and the bearing band are separate real spaces.
   rail(Array.from({length:9},(_,i)=>[-b*.54+i*b*1.08/8,floor+.04,b/2+.20]),.55);
   for(const yy of[capitalBase-.06,capitalBase+.15])box(0,yy,b/2,b+.25,.13,.22,'red');
  });
  const positions=new Map();
  for(let face=0;face<4;face++)for(const x of axes){const q=new T.Vector3(x,0,b/2).applyAxisAngle(new T.Vector3(0,1,0),face*Math.PI/2);positions.set(q.x.toFixed(6)+','+q.z.toFixed(6),[q.x,q.z]);}
  for(const [x,z]of positions.values()){
   const bottom=floor+.12,h=capitalBase-bottom;
   box(x,floor+.065,z,.33,.13,.33,'dark');emit(shaft(.145,h),mats.red,x,bottom,z);
  }
  const spec={w,d:w,e:y,rise:1.12,curl:.48,pagoda:true};
  const stations=[];
  for(let face=0;face<4;face++)for(const x of[-b/6,b/6]){const q=new T.Vector3(x,0,b/2).applyAxisAngle(new T.Vector3(0,1,0),face*Math.PI/2);stations.push({x:q.x,z:q.z,yaw:face*Math.PI/2,corner:false});}
  for(const sx of[-1,1])for(const sz of[-1,1])stations.push({x:sx*b/2,z:sz*b/2,yaw:Math.atan2(sx,sz),corner:true});
  const contacts=[];
  for(const station of stations){
   const {x,z,yaw,corner}=station,scale=.50,depthScale=corner?.59:.64,c=Math.cos(yaw),s=Math.sin(yaw),at=(xx,zz)=>roofHeight(spec,x+c*xx+s*zz,z-s*xx+c*zz)-.40;
   // Fit the COMPLETE projecting assembly below both sides of each hip.
   // One diagonal corner assembly replaces two intersecting face clusters.
   const top=Math.min(...[-.56,0,.56].flatMap(xx=>[-.18,.48,.98].map(zz=>at(xx,zz)))),gap=top-capitalBase;
   if(gap<.30)throw Error('Scene07 tower363 has no occupied bearing gap');
   group(x,capitalBase,z,yaw,1,()=>{
    kit.cluster(0,0,0,gap,scale,true,depthScale);
    for(const xx of[-.46,0,.46]){
     const zz=1.43*depthScale,bodyTop=gap-(.020*(1-(xx/.56)**2))*(gap/2.08),target=Math.min(...[-.07,.07].flatMap(dx=>[-.09,.09].map(dz=>at(xx+dx,zz+dz)))),h=target-capitalBase-bodyTop;
     if(h>.004)box(xx,bodyTop+h/2,zz,.15,h+.003,.18,'wood');
    }
   });
   contacts.push({...station,capitalBase,roofReceiverY:top,occupiedHeight:gap});
  }
  towerTiers.push({level,w,floor,chamberTop:roomTop,capitalBase,primaryPosts:positions.size,bearingAssemblies:stations.length,contacts});
 }
 function westGallery(){
  const x=-7.7,z=-9,width=7.7,datum=5.70,floor=6.70,axes=Array.from({length:6},(_,i)=>-width/2+i*width/5),roofOffsetX=-.10,spec={w:width+1.05,d:4.3,e:3.20,rise:.85,curl:.25};
  group(x,datum,z,0,1,()=>{
   // A raised, occupied gallery meets a four-riser side doorway. The old
   // wing floor was 2.3m below that doorway and had no traversable connection.
   const ground=Math.min(...[-width/2,0,width/2].flatMap(xx=>[-1.60,1.60].map(zz=>groundModel(x+xx,z+zz)))),bottom=Math.max(1.5,ground-.25)-datum,h=1-bottom;
   box(0,(bottom+1)/2,0,width,h,3.2,'plinthMortar');
   const rows=Math.ceil(h/.245),columns=Math.ceil(width/.65);
   for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const xx=-width/2+(col+.5+(row%2)*.32)*width/columns;if(xx>width/2-.12)continue;
    emit(masonryForms[(row+col*3)%masonryForms.length],mats.terraceStone,xx,bottom+(row+.5)*h/rows,1.65,.64,h/rows*.98,.30,[0,0,0],.88+.09*Math.sin(row*1.7+col*2.3));
   }
   // The raised solid core has battered geological faces, rather than a
   // newly exposed smooth cliff. Original CC0 stones retain uniform scale,
   // UVs and PBR channels. Their complete bounds stay below the walking cap.
   const wallFaces=[{x:0,z:1.60,yaw:0,length:width},{x:-width/2,z:0,yaw:-Math.PI/2,length:3.2},{x:width/2,z:0,yaw:Math.PI/2,length:3.2}];
   for(let face=0;face<wallFaces.length;face++){
    const wall=wallFaces[face],columns=Math.ceil(wall.length/.76),courses=Math.ceil(h/.34);
    group(wall.x,0,wall.z,wall.yaw,1,()=>{
     for(let row=0;row<courses;row++)for(let col=0;col<columns;col++){
      const phase=row*17+col*7+face*31,variant=scannedStones.variants[(row*3+col*5+face)%scannedStones.variants.length],scale=.49+.065*(.5+.5*Math.sin(phase*1.73)),rot=[.025*Math.sin(phase),.19*Math.sin(phase*2.1),.035*Math.cos(phase)],turn=new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)).scale(new T.Vector3(scale,scale,scale));
      if(!variant.geometry.boundingBox)variant.geometry.computeBoundingBox();const bounds=variant.geometry.boundingBox.clone().applyMatrix4(turn),xx=-wall.length/2+(col+.5+(row%2)*.18)*wall.length/columns,yy=Math.min(bottom+(row+.5)*h/courses,.79-bounds.max.y),toe=.11+.18*(1-row/courses);
      emit(variant.geometry,variant.dry,xx,yy,toe,scale,scale,scale,rot,.88+.10*Math.sin(phase*.71));galleryFoundationStones++;
     }
    });
   }
   box(0,.935,0,width+.16,.13,3.42,'terraceStone');
   for(const zz of[-1.1,1.1])for(const xx of axes){
    const top=Math.min(...[-.35,0,.35].flatMap(dx=>[-.10,.62].map(dz=>roofHeight(spec,xx+dx-roofOffsetX,zz+(zz>0?dz:-dz))-.40))),head=top-.56,bottom=1.12;
    box(xx,1.065,zz,.30,.13,.30,'dark');emit(shaft(.115,head-bottom),mats.red,xx,bottom,zz);
    group(xx,head,zz,zz>0?0:Math.PI,1,()=>kit.cluster(0,0,0,.56,.32,true,.34));
   }
   for(const xx of axes){lattice(xx,1.83,-.98,1.10,1.18);}
   for(const yy of[1.12,2.51,2.70])box(0,yy,-1.04,width+.12,.12,.20,'red');
   rail(Array.from({length:9},(_,i)=>[-width/2+i*width/8,1,1.35]),.58);
   group(roofOffsetX,0,0,0,1,()=>physicalRoof({...spec,label:'west-connector-solid-gallery363',supports:[{xs:axes.map(q=>q-roofOffsetX),z:1.1,head:2.68},{xs:axes.map(q=>q-roofOffsetX),z:-1.1,head:2.68}]},[width+1.2,4.3]));
  });
  const door=new T.Vector3(-7,0,1.57).applyAxisAngle(new T.Vector3(0,1,0),-.25).add(new T.Vector3(4.6,0,-9)),a=new T.Vector3(x+width/2,floor,z),b=new T.Vector3(door.x,7.30,door.z),delta=b.clone().sub(a),n=new T.Vector3(-delta.z,0,delta.x).normalize(),yaw=-Math.atan2(delta.z,delta.x),count=4,run=Math.hypot(delta.x,delta.z),stairWidth=2.30;
  for(let i=0;i<count;i++){
   const p=a.clone().lerp(b,(i+.5)/count),top=floor+(7.30-floor)*(i+1)/count;
   box(p.x,top-.31,p.z,run/count+.025,.62,stairWidth,'terraceStone',[0,yaw,0]);
   box(p.x,top-.035,p.z,run/count+.035,.07,stairWidth+.04,'terraceStone',[0,yaw,0]);
  }
  for(const side of[-1,1]){
   const p=a.clone().addScaledVector(n,side*(stairWidth/2+.05)),q=b.clone().addScaledVector(n,side*(stairWidth/2+.05)),length=p.distanceTo(q),angle=Math.atan2(q.y-p.y,Math.hypot(q.x-p.x,q.z-p.z));
   for(const t of[0,.5,1]){const c=p.clone().lerp(q,t);box(c.x,c.y+.34,c.z,.12,.68,.12,'red');}
   group((p.x+q.x)/2,(p.y+q.y)/2,(p.z+q.z)/2,yaw,1,()=>{for(const yy of[.20,.61])box(0,yy,0,length+.04,.085,.11,'red',[0,0,angle]);});
  }
  galleryConnection={galleryFloor:floor,hallFloor:7.30,oldGalleryFloor:5,risers:count,rise:(7.30-floor)/count,run,tread:run/count,start:a.toArray(),door:b.toArray(),solidClosedRoof:true,hallEndRoofOverhang:.425,westTerraceRailOpening:[.42,2.85],foundation:'Closed capped stone platform seated below sampled garden soil; jointed backing and three battered uniformly scaled CC0 scan faces',galleryFoundationStones,unchangedDownstreamRandomReplay:true};
 }
 return{hallTerrace,towerTier,westGallery,info:()=>({revision:'scene07-cleared-gallery-door-and-bearing-contacts363-r04',terraceSegments,towerTiers,galleryConnection,deepBearings:kit.instances,construction:'Closed recessed tower chambers, open surrounding galleries, twelve continuous posts per tier, eight front-facing and four diagonal corner bearing assemblies, capped open main-hall terrace, and a raised roofed west gallery with four solid side-door treads.',cameraChanged:false,routeDatumsChanged:false,externalAssetsAdded:0,photoSurfaces:false,visualAccepted:false})};
}
