import * as T from 'three';

// Actual occupied entry apron. The outside edge follows the held main rail;
// the left planting recess keeps the reference's close rooted shrub.
// Coordinates are authored metres, not a recovered survey.
export const PORCH352_FOOTPRINT=[[-2.20,5.70],[2.30,8.07],[2.30,14.0],[-.70,14.0],[-.70,8.55],[-2.30,8.30]];
export const porchFloorHeight352=(x,z)=>.54-.27*(x+2.20)/4.50-.060;
const hash=(x,z)=>{const q=Math.sin(x*127.1+z*311.7+352)*43758.5453;return q-Math.floor(q);};
const smooth=(a,b,v)=>T.MathUtils.smoothstep(v,a,b);
function nearest(poly,x,z){
 let best=Infinity,point=null,edge=-1;
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1),p=[a[0]+t*dx,a[1]+t*dz],d=Math.hypot(x-p[0],z-p[1]);if(d<best){best=d;point=p;edge=i;}}
 return{distance:best,point,edge};
}
function inside(poly,x,z){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function clipRect(poly,x0,z0,x1,z1){
 let out=poly.map(p=>p.slice());
 for(const [axis,limit,sign]of[[0,x0,1],[0,x1,-1],[1,z0,1],[1,z1,-1]]){
  const next=[];for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length],da=sign*(a[axis]-limit),db=sign*(b[axis]-limit),ia=da>=0,ib=db>=0;if(ia)next.push(a);if(ia!==ib){const t=da/(da-db);next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}out=next;if(out.length<3)return[];
 }return out;
}
function solid(poly,depth,drop=0){
 const shape=new T.Shape(poly.map(([x,z])=>new T.Vector2(x,-z))),g=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false});g.rotateX(-Math.PI/2);
 const p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i)+porchFloorHeight352(x,z)-depth-drop;p.setY(i,y);if(Math.abs(n.getY(i))>.6)uv.setXY(i,x,z);else if(Math.abs(n.getX(i))>Math.abs(n.getZ(i)))uv.setXY(i,z,y);else uv.setXY(i,x,y);}
 g.computeVertexNormals();g.computeBoundingBox();return g;
}

export function createPorchGround352({baseHeight,waterSection}){
 const polygon=PORCH352_FOOTPRINT,transplants=[],obstacles=[],placements=[],runnerRoots={checked:0,redirectedToActualSoil:0,insideWalkAfter:0,minSoilClearance:Infinity},plantingBand=[];
 const a=polygon[0],b=polygon[1],dx=b[0]-a[0],dz=b[1]-a[1],run=Math.hypot(dx,dz),out=[dz/run,-dx/run];
 const retainingStones=[[.26,1.10,1.15,.55,1,1.47],[.58,1.18,.94,.45,4,.51],[.85,1.05,1.20,.58,0,2.12]].map(([t,offset,width,limit,index,yaw])=>({x:a[0]+dx*t+out[0]*offset,z:a[1]+dz*t+out[1]*offset,width,limit,index,yaw,sourceHeightToWidthBelow:.45}));
 function signedDistance(x,z){const q=nearest(polygon,x,z);return inside(polygon,x,z)?-q.distance:q.distance;}
 function rawHeight(x,z){
  const q=nearest(polygon,x,z),occupied=inside(polygon,x,z),base=baseHeight(x,z),cut=porchFloorHeight352(x,z)-.17;
  if(occupied)return Math.min(base,cut);
  // A real excavated soil shoulder grades down below the rail sill. The
  // left raised planting recess stays untouched behind a retaining cheek.
  const isFront=q.edge===0,isRight=q.edge===1;
  if(isFront||isRight){
   const t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(run*run),0,1),width=isFront?3.10+.18*Math.sin(t*8.1)+.12*Math.sin(t*17.3):.36;
   if(q.distance<width){const f=smooth(.08,width,q.distance),shoulder=.022*Math.sin(t*11.7+q.distance*3.3)*Math.sin(Math.PI*f);return T.MathUtils.lerp(Math.min(base,cut),base,f)+shoulder;}
  }
  return base;
 }
 // Cache exactly the ground mesh's two triangles per cell. Botanical roots
 // and runner nodes sample those triangles, including the newly cut bank.
 const nx=384,nz=384,x0=-28,z0=-42,sx=56/nx,sz=60/nz,heights=new Float64Array((nx+1)*(nz+1));
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)heights[j*(nx+1)+i]=rawHeight(x0+i*sx,z0+j*sz);
 function height(x,z){const gx=T.MathUtils.clamp((x-x0)/sx,0,nx-1e-8),gz=T.MathUtils.clamp((z-z0)/sz,0,nz-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j,k=j*(nx+1)+i,a=heights[k],b=heights[k+1],c=heights[k+nx+1],d=heights[k+nx+2];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
 function safe(x,z,radius){
  if(signedDistance(x,z)<radius+.08)return false;
  if([...obstacles,...retainingStones].some(q=>Math.hypot(x-q.x,z-q.z)<q.width*.43+radius))return false;
  if(waterSection){const q=waterSection.closest(x,z);if(q.distance<waterSection.halfWidth(q.t)+radius+.10)return false;}
  return true;
 }
 function relocateRoot352(x,z,radius=.18,label='root'){
  if(x< -4||x>4||z<4.5||z>14.5)return[x,z];
  const previous=[x,z],d=signedDistance(x,z),newStoneConflict=retainingStones.some(q=>Math.hypot(x-q.x,z-q.z)<q.width*.43+radius);if(d>=radius+.08&&!newStoneConflict)return[x,z];
  // All moved plants remain present as complete rooted assemblies outside
  // the balustrade. A private coordinate hash staggers shore depth without
  // consuming the scene or botanical RNG or packing everything on one line.
  const t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(run*run),.08,.90),along=[a[0]+t*dx,a[1]+t*dz],seed=hash(x,z);
  let dest=null;
  for(let k=0;k<48;k++){
   const offset=radius+.10+.24*((seed+k*.381966)%1)+Math.floor(k/16)*.12,slide=(hash(x+k*.3,z-k*.17)-.5)*Math.min(1.45,.22+k*.07),u=T.MathUtils.clamp(t+slide/run,.04,.94),xx=a[0]+u*dx+out[0]*offset,zz=a[1]+u*dz+out[1]*offset;
   if(safe(xx,zz,radius)){dest=[xx,zz];break;}
  }
  if(!dest)throw Error('352 could not find actual soil for '+label);
  transplants.push({label,from:{x:previous[0],y:baseHeight(...previous),z:previous[1]},to:{x:dest[0],y:height(...dest),z:dest[1]},reason:newStoneConflict?'Physical embedded stone clearance':'Actual root-neck clearance; crown may overhang',physicalRootRadius:radius,walkClearance:signedDistance(...dest),rootedOnActualTerrain:true,completePlantRebuiltAtNewRoot:true});return dest;
 }
 function rootNode352(x,z){
  if(x< -4||x>4||z<4.5||z>14.5)return[x,z];
  runnerRoots.checked++;let result=[x,z];
  if(signedDistance(x,z)<.035){const q=nearest(polygon,x,z),a=polygon[q.edge],b=polygon[(q.edge+1)%polygon.length],dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz);result=[q.point[0]+dz/n*.045,q.point[1]-dx/n*.045];runnerRoots.redirectedToActualSoil++;}
  for(const stone of retainingStones){const dx=result[0]-stone.x,dz=result[1]-stone.z,d=Math.hypot(dx,dz),r=stone.width*.43+.035;if(d<r){result=[stone.x+dx/Math.max(d,.001)*r,stone.z+dz/Math.max(d,.001)*r];runnerRoots.redirectedToActualSoil++;}}
  const d=signedDistance(...result);if(d<.034)throw Error('352 runner anchor lies on porch');runnerRoots.minSoilClearance=Math.min(runnerRoots.minSoilClearance,d);return result;
 }
 function rootedBotany(source){
  const wrapped={...source,relocateRoot352,setRootObstacles352(list){obstacles.splice(0,obstacles.length,...list);}};
  for(const name of['groundMat','place','shrub'])wrapped[name]=function(options){
   const radius=options.rootRadius352??(name==='shrub'?.08:name==='groundMat'?.06:.045),[x,z]=relocateRoot352(options.x,options.z,radius,name),root=height(x,z);
   const moved=x!==options.x||z!==options.z,rawResult=source[name]({...options,x,z,height:moved?height:(options.height??height),...(name==='groundMat'?{rootNode352}:{})}),result=rawResult??{x,y:root,z,width:options.r*2,height:options.h,rootedBranchHierarchy:true,sourceScanBlades:true};if(z>4.5&&x>-4&&x<4)placements.push({type:name,x,y:root,z,radius,crownExcludedFromWalk:false,walkDistance:signedDistance(x,z),rootInsideWalk:inside(polygon,x,z)});return result;
  };
  return wrapped;
 }
 function build({emit,between,materials,mats,scannedStones,botany}){
  emit(solid(polygon,.16,.035),mats.hallFoundation);
  let tiles=0;for(let z=5.60;z<14;z+=.70)for(let x=-2.40;x<2.30;x+=.70){const p=clipRect(polygon,x+.003,z+.003,x+.697,z+.697);if(p.length<3)continue;let area=0;for(let i=0;i<p.length;i++)area+=p[i][0]*p[(i+1)%p.length][1]-p[(i+1)%p.length][0]*p[i][1];if(Math.abs(area)<.001)continue;emit(solid(p,.035),mats.stone);tiles++;}
  // A real closed retaining cheek separates the higher left planting bed
  // from the lower walk. It supports the old rooted framing shrub in soil.
  const cheek=[[-.82,8.56],[-.69,8.56],[-.69,14],[-.82,14]],g=solid(cheek,.45),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+.44);g.computeVertexNormals();emit(g,mats.stone);
  if(scannedStones)for(const stone of retainingStones){const v=scannedStones.info.variants[stone.index%scannedStones.info.variants.length],h=Math.min(stone.width*v.height/v.width,stone.limit),soil=height(stone.x,stone.z),base=soil-h*.52+.07;scannedStones.place({emit,x:stone.x,z:stone.z,height:base,width:stone.width,heightLimit:stone.limit,index:stone.index,allowTall:true,yaw:stone.yaw});Object.assign(stone,{soil,base,estimatedHeight:h,embeddedFraction:.52});}
  // Actual continuously rooted/forked green shrubs form a staggered middle
  // layer above the retained creepers. R09's sparse whole-shrub scan failed
  // to establish this green layer. These use the existing original scan
  // blades on complete authored limbs, after all held original botany.
  if(botany)for(const [k,t,width,h,offset]of[[0,.055,.80,.48,.22],[1,.165,.95,.85,.31],[2,.275,.80,.66,.17],[3,.385,1.0,1.00,.32],[4,.495,.75,.58,.19],[5,.605,.90,.87,.26],[6,.715,.85,.72,.18],[7,.825,1.05,1.04,.34],[8,.93,.80,.56,.21]]){
   const x=a[0]+dx*t+out[0]*offset,z=a[1]+dz*t+out[1]*offset,actual=botany.shrub({emit,between,height,x,z,r:width*.48,h,kind:k%3===0?'leaflight':'leaf',rootRadius352:.06,growthYaw352:Math.atan2(out[1],out[0]),leafLength352:.060+.004*(k%3)});plantingBand.push({layer:'rooted-forked-green-middle-layer-with-original-scan-blades',heightLimit:h,requestedWidth:width,actual,growthBias:'Real branches fan outward into garden',rootWalkDistance:signedDistance(actual.x,actual.z)});
  }
  info.floorTiles=tiles;info.closedFoundation=true;info.stoneJoints=.006;info.leftSoilRetainingCheek=true;
 }
 function isSoilShoulder(x,z){const q=nearest(polygon,x,z);return!inside(polygon,x,z)&&((q.edge===0&&q.distance<3.4)||(q.edge===1&&q.distance<.45));}
 function soilMaterial(){
  const m=new T.MeshStandardMaterial({name:'scene08-352-real-cut-soil-shoulder',color:'#5a4327',roughness:.97,metalness:0});
  m.onBeforeCompile=s=>{
   s.vertexShader='varying vec3 vSoil352;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSoil352=position;');s.fragmentShader=`varying vec3 vSoil352;
float soilHash352(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float grain352(vec3 p){vec2 q=p.xz+vec2(p.y*.27,p.y*.31),i=floor(q),f=fract(q);f=f*f*(3.-2.*f);float n=mix(mix(soilHash352(i),soilHash352(i+vec2(1.,0.)),f.x),mix(soilHash352(i+vec2(0.,1.)),soilHash352(i+vec2(1.,1.)),f.x),f.y);return(n*2.-1.)/(1.+dot(fwidth(q),vec2(1.)));}
`+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat clod352=grain352(vSoil352*28.);float fine352=grain352(vSoil352*330.);diffuseColor.rgb*=.91+.10*clod352+.04*fine352;');
   s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nfloat soilBump352=.00045*grain352(vSoil352*260.)+.00015*grain352(vSoil352*710.);vec3 dp352x=dFdx(-vViewPosition),dp352y=dFdy(-vViewPosition),r352x=cross(dp352y,normal),r352y=cross(normal,dp352x);float det352=dot(dp352x,r352x);normal=normalize(abs(det352)*normal-sign(det352)*(dFdx(soilBump352)*r352x+dFdy(soilBump352)*r352y));');
  };m.customProgramCacheKey=()=> 'scene08-352-physical-loam-shoulder-r08';return m;
 }
 const info={revision:'scene08-real-porch-planting352-r11',photographicMatch:false,walkPolygon:polygon,plane:'y=.54-.27*(x+2.20)/4.50-.060',topHeightAtCentre:porchFloorHeight352(0,9),floorThickness:.195,terrainCutBelowFloor:.17,actualTerrainSamplerSharedByRootsAndSoil:true,groundMeshDivisions:[nx,nz],rootSamplerUsesActualTriangleInterpolation:true,referenceImageRuntime:false,plantsHidden:false,wholePlantRelocation:true,rootNecksAndRunnerAnchorsConstrainedInsteadOfFullCrowns:true,canopyOverhangAllowed:true,runnerRoots,transplants,nearRootPlacements:placements,plantingBand,leftFramingShrubRetained:true,soilShoulder:{actualUnevenHeight:true,widthRangeMetres:[2.80,3.40],rightEdgeWidthMetres:.36,metricGrainAmplitude:[.00045,.00015],nonperiodicValueNoise:true,subpixelGrainAttenuatedBySurfaceDerivatives:true,referenceImageSampled:false,extraR06UprightStonesRemovedAfterActualReview:true,wholePlantsReplantedCloserOnOutsideSoil:true,metricVerticalStoneUV:true},retainingStones};
 return{height,relocateRoot352,rootedBotany,build,info,isSoilShoulder,soilMaterial};
}
