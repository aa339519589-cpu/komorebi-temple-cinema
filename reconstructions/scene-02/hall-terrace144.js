import {T,V} from './kernel.js';
import {placeStoneSlab342,buildStairGuardPiers342,craftStats342} from './craft-interfaces342.js';

// The already declared scene02 granite scan supplies mineral structure, not a
// painted staircase. Real metric UVs follow each individual closed stone slab.
export function installHallTerraceMaterials144(mats){
 const source=mats.foregroundGranite120;if(!source)throw Error('Scene02 local granite source is unavailable.');
 const textureMetres=.3173828125;
 function mineral(name,color,normalScale){
  const m=source.clone();m.name=name;m.color.setRGB(...color);m.normalScale.set(normalScale,normalScale);m.roughness=.90;
  m.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
    vec3 terraceScale=vec3(1.);float terraceOffset=0.;
    #ifdef USE_INSTANCING
     terraceScale=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
     terraceOffset=fract(sin(dot(instanceMatrix[3].xyz,vec3(9.23,3.17,4.71)))*12517.43);
    #endif
    vec3 tp=position*terraceScale,tn=abs(normal);
    vec2 tuv=tn.y>=max(tn.x,tn.z)?tp.xz:(tn.x>tn.z?tp.zy:tp.xy);
    tuv=tuv/${textureMetres.toFixed(10)}+vec2(terraceOffset,terraceOffset*.39);
    #ifdef USE_MAP
     vMapUv=tuv;
    #endif
    #ifdef USE_NORMALMAP
     vNormalMapUv=tuv;
    #endif
    #ifdef USE_ROUGHNESSMAP
     vRoughnessMapUv=tuv;
    #endif`);
  };
  m.customProgramCacheKey=()=>name+'-local-metric-granite144';m.userData.provenance='Scene02 own foreground-lantern120/granite-face maps and original CC0 provenance; metric materials on authored closed masonry';return m;
 }
 mats.terraceBody=mineral('scene02-granite-terrace-bearing-courses',[1.18,1.15,1.05],.23);
 mats.terraceTread=mineral('scene02-granite-individual-stair-treads',[1.90,1.84,1.68],.18);
 mats.terraceCheek=mineral('scene02-granite-stepped-stair-cheek',[1.48,1.43,1.29],.24);
}

export function buildHallStair144({b,top,bottom,width=2.85}){
 const direction=top.clone().sub(bottom),run=Math.hypot(direction.x,direction.z),yaw=Math.atan2(direction.x,direction.z),count=20,depth=run/count,stats={risers:count,treadSlabs:0,cheekBlocks:0};
 for(let i=0;i<count;i++){
  const t=(i+.5)/count,p=bottom.clone().lerp(top,t),level=T.MathUtils.lerp(bottom.y,top.y,(i+1)/count),rise=(top.y-bottom.y)/count;
  b.at([p.x,0,p.z],yaw,()=>{
   // The bearing core closes the whole flight onto the bank and foundation.
   b.box(0,(level+1.35)/2-.035,0,width-.04,level-1.35-.07,depth+.012,'terraceBody');
   const slabs=i%3===1?4:3,phase=i%2?.07:-.035;
   for(let j=0;j<slabs;j++){
    const span=width/slabs,x=-width/2+span*(j+.5),tint=.91+.14*(.5+.5*Math.sin(i*9.1+j*4.7));
    placeStoneSlab342({b,center:[x,level-.046,0],size:[span-.012,.094,depth+.040],seed:i*5+j,tint});stats.treadSlabs++;
    // Each small nosing has the same bearing and carries a shallow weathered lip.
    // The rounded stone body is the real continuous worn nosing; no separate perfectly straight lip.
   }
   for(const sign of[-1,1]){
    const cheekX=sign*(width/2+.15),cheekTop=level+.29;
    b.box(cheekX,(cheekTop+1.40)/2,0,.255,cheekTop-1.4,depth-.012,'terraceCheek',0,.92+.08*Math.sin(i*3.7)**2);
    placeStoneSlab342({b,center:[cheekX,cheekTop+.051,0],size:[.315,.102,depth+.028],seed:i*7+sign,material:'terraceTread',tint:.94+.05*Math.sin(i*1.91)**2});stats.cheekBlocks++;
    // A narrow rust-dark reveal separates consecutive blocks, never a floating cap.
    if(i%4===0)b.box(cheekX,level+.15,-depth/2+.016,.258,.20,.020,'terraceBody');
   }
  });
 }
 // A paved landing joins the flight to the lower approach at its actual base.
 b.at([bottom.x,bottom.y-.055,bottom.z],yaw,()=>{
  for(let j=0;j<4;j++)b.box(-width/2+(j+.5)*width/4,0,-.35,width/4-.012,.11,.72,'terraceTread',0,.91+j*.035);
 });
 buildStairGuardPiers342({b,top,bottom,width,yaw});
 return{...stats,craft342:craftStats342(),runMetres:run,riseMetres:top.y-bottom.y,widthMetres:width,construction:'Twenty closed bearing risers, individually jointed granite tread slabs, continuous millimetre-worn rounded nosings, fitted cheek caps, two seated stone guard piers and connected lower landing',sourcePixelsUsed:false};
}
