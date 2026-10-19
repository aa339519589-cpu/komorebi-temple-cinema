import * as T from 'three';
import {CORRIDOR_LAYOUT as L} from './corridor-layout.js';
import {CORRIDOR_SITE130,pointInPlan} from './corridor-architecture130.js';
import {WATERCOURT131} from './watercourt131.js';

// Whole-site ground hypothesis for ref08. Measurements constrain visible
// bank/rill contours; no photograph is sampled or loaded by this module.
const clamp=T.MathUtils.clamp;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const oldGround=z=>clamp((4-z)*.07,0,1.7);
function oldAnalytic(x,z){const channel=z>-7&&z<9?1-smooth(1.4,2,Math.abs(x-.8)):0,land=oldGround(z)-.08+.06*Math.sin(x*1.7+z*.9)*Math.sin(z*1.4-x*.6);return land*(1-channel)-.5*channel;}
function interpolateGrid(x,z,x0,z0,dx,dz,nx,nz,value){const u=clamp((x-x0)/dx,0,nx-.0000001),v=clamp((z-z0)/dz,0,nz-.0000001),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,aa=value(i,j),bb=value(i+1,j),cc=value(i,j+1),dd=value(i+1,j+1);return a+b<=1?aa*(1-a-b)+bb*a+cc*b:bb*(1-b)+cc*(1-a)+dd*(a+b-1);}
export const originalSoilHeight=(x,z)=>interpolateGrid(x,z,-28,-42,.56,.60,100,100,(i,j)=>oldAnalytic(-28+i*.56,-42+j*.60));
function spline(z,knots){for(let i=0;i<knots.length-1;i++){const[a,va]=knots[i],[b,vb]=knots[i+1];if(z<=b)return T.MathUtils.lerp(va,vb,smooth(a,b,z));}return knots.at(-1)[1];}
export function rearRill(z){if(z>=-2.8)return{centre:.8,halfWidth:1.6};return{centre:spline(z,[[-24,3.5],[-10,3.5],[-7.4,3.45],[-5.8,3.0],[-4.5,2.80],[-3.7,2.80],[-3.2,1.75],[-2.8,.8]]),halfWidth:spline(z,[[-24,.34],[-10,.34],[-7.4,.36],[-5.8,.40],[-4.5,.42],[-3.7,.42],[-3.2,.62],[-2.8,1.6]])};}
// The raised bridge and rear courts feed a descending rock rill, rather than
// a deep level trench cut through the whole site. Short sloping falls connect
// four real water shelves to the original foreground Y1 reach.
export function rillWaterY(z){return WATERCOURT131.waterY;}
// The original low galleries cannot be buried by the new site fill. Their
// floors rise while roof/eave world datums remain fixed; matching dry courts
// keep at least 1.8m below the lowest continuous room beams.
export const LEGACY_GALLERY_TERRACES=[];
function distanceToPlan(x,z,P){let d=Infinity;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],dx=b[0]-a[0],dz=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz));}return d;}
function courtLimit(x,z,height){for(const [P,soil]of[[CORRIDOR_SITE130.rightPlan,CORRIDOR_SITE130.rightSoil],[WATERCOURT131.westPlan,WATERCOURT131.westSoil]]){const inside=pointInPlan(x,z,P),d=inside?0:distanceToPlan(x,z,P),w=1-smooth(0,.55,d);height=T.MathUtils.lerp(height,Math.max(height,soil),w);}const B=WATERCOURT131.bridge.b,r=Math.hypot((x-B[0])/.9,(z-B[2])/.9);if(r<1)height=Math.min(height,T.MathUtils.lerp(3.70,height,smooth(.2,1,r)));return height;}
const verandaPlan=[[-2.61501,4.36844],[2.27798,8.44852],[3.2,18],[-3.2,18]];

function bankAnalytic(x,z){
 if(z>=-2.8){const old=originalSoilHeight(x,z),d=Math.abs(x-.8),shore=T.MathUtils.lerp(.42,1.05,smooth(1.4,2.25,d)),pit=Math.hypot((x+.75)/1.2,(z+.15)/1.35),blend=smooth(.75,1.35,pit);let h=T.MathUtils.lerp(old,Math.max(old,shore),blend);if(pointInPlan(x,z,verandaPlan))h=Math.min(h,.68);return h;}
 const C=rearRill(z),water=rillWaterY(z),dist=Math.abs(x-C.centre),west=x<C.centre,plateau=Math.max(water+.30,spline(z,[[-24,3.65],[-12,3.65],[-9,west?3.72:3.52],[-7,west?3.32:3.10],[-5.3,west?2.90:2.65],[-3.8,west?2.12:1.82],[-2.8,oldGround(-2.8)]]));
 let h;
 if(dist<C.halfWidth*.64)h=water-.34;
 else if(dist<C.halfWidth)h=T.MathUtils.lerp(water-.34,water+.03,smooth(C.halfWidth*.64,C.halfWidth,dist));
 else{
  const run=1.1+.1*Math.sin(z*.73),t=clamp((dist-C.halfWidth)/run,0,1),low=Math.min(plateau,water+.45),middle=Math.max(low,plateau-.62);
  h=t<.22?T.MathUtils.lerp(water+.03,low,smooth(0,.22,t)):t<.32?low:t<.62?T.MathUtils.lerp(low,middle,smooth(.32,.62,t)):t<.72?middle:T.MathUtils.lerp(middle,plateau,smooth(.72,1,t));
  // An actual rock/earth approach bank carries the unchanged low bridge
  // landing. Its boundary respects the water channel rather than masking it.
  const r=Math.hypot((x-1.45)/1.45,(z+4.05)/1.5),weight=(1-smooth(.45,1.15,r))*smooth(C.halfWidth,C.halfWidth+.24,dist);
  h=T.MathUtils.lerp(h,Math.max(h,2.30-.10*r),weight)+.065*Math.sin(x*4.3+z*1.9)*Math.sin(z*3.1-x*.8)*smooth(C.halfWidth,C.halfWidth+.45,dist);
 }
 const rearBlend=1-smooth(-3.45,-2.8,z),old=originalSoilHeight(x,z);
 return courtLimit(x,z,Math.max(old,T.MathUtils.lerp(old,h,rearBlend)));
}

export function createTerracedBanks(){
 const x0=-20,z0=-24,width=40,depth=33.5,nx=200,nz=202,dx=width/nx,dz=depth/nz,bottom=-1.6,heights=new Float64Array((nx+1)*(nz+1)),p=[],uv=[],ids=[],stride=(nx+1)*(nz+1);
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)heights[j*(nx+1)+i]=bankAnalytic(x0+i*dx,z0+j*dz);
 for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*dx,z=z0+j*dz;p.push(x,side?bottom:heights[j*(nx+1)+i],z);uv.push(x*.45,z*.45);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ids.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
 const edge=[...Array.from({length:nx},(_,i)=>i),...Array.from({length:nz},(_,j)=>j*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i),...Array.from({length:nz},(_,j)=>(nz-j)*(nx+1))];
 for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const body=new T.BufferGeometry();body.setAttribute('position',new T.Float32BufferAttribute(p,3));body.setAttribute('uv',new T.Float32BufferAttribute(uv,2));body.setIndex(ids);body.computeVertexNormals();body.name='terrain127-closed-terraced-earth-rock-volume';body.userData.terrain127={closed:true,footprint:[width,depth],heroScourPocketRetained:true,verandaSoilMaximum:.68};
 const mossP=[],mossUV=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const aa=j*(nx+1)+i,bb=aa+1,cc=aa+nx+1,dd=cc+1;for(const tri of [[aa,cc,bb],[bb,cc,dd]]){a.fromArray(p,tri[0]*3);b.fromArray(p,tri[1]*3);c.fromArray(p,tri[2]*3);const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();if(n.y<.70||Math.min(a.y,b.y,c.y)<1.04)continue;for(const q of[a,b,c]){const v=q.clone().addScaledVector(n,.007);mossP.push(...v.toArray());mossUV.push(v.x*.45,v.z*.45);}}}
 const moss=new T.BufferGeometry();moss.setAttribute('position',new T.Float32BufferAttribute(mossP,3));moss.setAttribute('uv',new T.Float32BufferAttribute(mossUV,2));moss.computeVertexNormals();moss.name='terrain127-soil-moss-on-real-benches';
 const heightAt=(x,z)=>z>9.5||x<x0||x>x0+width||z<z0?originalSoilHeight(x,z):interpolateGrid(x,z,x0,z0,dx,dz,nx,nz,(i,j)=>heights[j*(nx+1)+i]);
 const roots=[],rocks=[],relocations=[];
 const bridgePlan=(()=>{const A=WATERCOURT131.bridge.a,B=WATERCOURT131.bridge.b,dx=B[0]-A[0],dz=B[2]-A[2],run=Math.hypot(dx,dz),nx=-dz/run*.72,nz=dx/run*.72;return[[A[0]-nx,A[2]-nz],[B[0]-nx,B[2]-nz],[B[0]+nx,B[2]+nz],[A[0]+nx,A[2]+nz]];})();
 const buildings=[{name:'near-veranda',polygon:verandaPlan},{name:'bridge-clear-route',polygon:bridgePlan},{name:'west-bank-landing',polygon:WATERCOURT131.westPlan},{name:'fitted-hall',origin:L.hall.position,yaw:L.hall.yaw,w:L.hall.w,d:L.hall.d},{name:'wing-roof-and-attached-porch',polygon:CORRIDOR_SITE130.leftPlan},{name:'right-open-court',polygon:CORRIDOR_SITE130.rightPlan},{name:'pagoda',origin:L.pagoda.position,yaw:L.pagoda.yaw,w:5.8*L.pagoda.scale,d:5.8*L.pagoda.scale}];
 function clearSitePoint(type,x,z,margin=.2,crownClearance=Infinity){
  const foreground=z>=-2.8;
  const obstruction=(xx,zz)=>buildings.some(C=>{if(C.polygon)return pointInPlan(xx,zz,C.polygon)||distanceToPlan(xx,zz,C.polygon)<margin;const dx=xx-C.origin[0],dz=zz-C.origin[2],a=Math.cos(C.yaw)*dx-Math.sin(C.yaw)*dz,b=Math.sin(C.yaw)*dx+Math.cos(C.yaw)*dz;return Math.abs(a)<C.w*.46+margin&&Math.abs(b)<C.d*.445+margin;});
  const suitable=(xx,zz)=>{if((foreground?zz< -2.8:zz> -2.85)||obstruction(xx,zz))return false;const soil=heightAt(xx,zz),C=rearRill(zz);if(soil<WATERCOURT131.waterY+.06||zz>=-10&&zz<9.5&&Math.abs(xx-C.centre)<C.halfWidth+.10)return false;if(Number.isFinite(crownClearance))for(let i=0;i<12;i++){const a=i*Math.PI/6;if(heightAt(xx+Math.cos(a)*margin,zz+Math.sin(a)*margin)>soil+crownClearance)return false;}return true;};
  if(suitable(x,z))return[x,z];
  // Keep each already sampled assembly intact. A deterministic shortest local
  // move puts obstructed roots outside real floor plans; no resampling occurs.
  for(let step=1;step<=110;step++){const r=step*.15;for(let j=0;j<64;j++){const a=j*Math.PI*2/64,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;if(!suitable(xx,zz))continue;relocations.push({type,from:[x,z],to:[xx,zz],distance:r,margin,crownClearance:Number.isFinite(crownClearance)?crownClearance:null,reason:'Move intact assembly to clear dry soil; exclude buildings and a bank rising through its crown'});return[xx,zz];}}
  throw Error('No clear physical soil bed for '+type+' at '+x+','+z);
 }
 function rootY(type,x,z,legacyY,height,spread=0){const soil=heightAt(x,z),y=soil-.025;roots.push({type,x,z,soilY:soil,rootY:y,legacyY,height,spread});return y;}
 function rockY(geometry,x,z,sx,sy,sz,yaw,legacyY){
  const p=geometry.attributes.position,q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),v=new T.Vector3(),verts=[];let minY=Infinity,maxY=-Infinity;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).multiply(new T.Vector3(sx,sy,sz)).applyQuaternion(q);verts.push(v.clone());minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);}
  let contact=-Infinity;for(const v of verts)if(v.y<minY+(maxY-minY)*.25)contact=Math.max(contact,heightAt(x+v.x,z+v.z)-v.y);
  const embed=Math.min(.30*sy,(maxY-minY)*.25),y=contact-embed;rocks.push({x,z,legacyY,centreY:y,embed,lowestY:y+minY,highestY:y+maxY,soilY:heightAt(x,z)});return y;
 }
 const waterP=[],waterUV=[],waterI=[],waterRows=180,waterCols=8;
 for(let j=0;j<=waterRows;j++){const z=-10+j*18.7/waterRows,C=rearRill(z);for(let i=0;i<=waterCols;i++){const x=C.centre+(-1+2*i/waterCols)*C.halfWidth;waterP.push(x,-z,0);waterUV.push((x+.8)/3.2,(8.7-z)/15);if(j<waterRows&&i<waterCols){const a=j*(waterCols+1)+i,b=a+1,c=a+waterCols+1,d=c+1;waterI.push(a,c,b,b,c,d);}}}
 const waterGeometry=new T.BufferGeometry();waterGeometry.setAttribute('position',new T.Float32BufferAttribute(waterP,3));waterGeometry.setAttribute('uv',new T.Float32BufferAttribute(waterUV,2));waterGeometry.setIndex(waterI);waterGeometry.computeVertexNormals();waterGeometry.name='terrain127-winding-rill-continuous-to-original-foreground';
 const flowP=[],flowUV=[],flowI=[],flowRows=200;
 for(let j=0;j<=flowRows;j++){const z=-10+j*7.2/flowRows,C=rearRill(z);for(let i=0;i<=waterCols;i++){const x=C.centre+(-1+2*i/waterCols)*C.halfWidth;flowP.push(x,rillWaterY(z),z);flowUV.push((x+.8)/3.2,(8.7-z)/15);if(j<flowRows&&i<waterCols){const a=j*(waterCols+1)+i,b=a+1,c=a+waterCols+1,d=c+1;flowI.push(a,c,b,b,c,d);}}}
 const rearWaterGeometry=new T.BufferGeometry();rearWaterGeometry.setAttribute('position',new T.Float32BufferAttribute(flowP,3));rearWaterGeometry.setAttribute('uv',new T.Float32BufferAttribute(flowUV,2));rearWaterGeometry.setIndex(flowI);rearWaterGeometry.computeVertexNormals();rearWaterGeometry.name='terrain127-physical-stepped-rear-rill-water';
 return{body,moss,waterGeometry,rearWaterGeometry,heightAt,rootY,rockY,clearSitePoint,rill:rearRill,waterY:rillWaterY,info:()=>({revision:'scene08-continuous-watercourt-banks131',extent:{x:[x0,x0+width],z:[z0,9.5],bottom},grid:[nx,nz],heroScourPocketRetained:true,verandaSoilMaximum:.68,waterY:WATERCOURT131.waterY,rearWaterProfile:[-10,-6,-5.72,-4.8,-4.52,-3.7,-3.43,-3.19,-2.98,-2.8].map(z=>({z,y:rillWaterY(z)})),corridorCourts130:CORRIDOR_SITE130,legacyGalleryTerraces:LEGACY_GALLERY_TERRACES.map(C=>({...C,finishedFloor:C.origin[1]+C.raised,lowestContinuousBeam:C.eave-.93,roomClearance:C.h-.93})),rootContacts:roots,groundedRocks:rocks,assemblyRelocations:relocations,materialPolicy:'Existing rock/moss/water PBR materials retained',limits:'Terrace levels, winding shore and stepped rear hydraulic profile are inferred from one view; no photograph RGB or projection; photographic fidelity unaccepted',visualAccepted:false})};
}
