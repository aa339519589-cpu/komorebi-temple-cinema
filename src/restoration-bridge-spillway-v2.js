import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {granite} from './natural-forms.js';
import {referenceExteriorPlan} from './restoration-landscape-layout.js';

// An opt-in replacement of the EXISTING east bridge abutment, not a new island.
// Original refs 1/8 show a short bank spill, not a waterfall in level pond water.
// Concealed recirculation is a physical inference, not photographed equipment.
const B=referenceExteriorPlan.bridge.anchor,theta=referenceExteriorPlan.bridge.yaw;
const halfSpan=referenceExteriorPlan.bridge.span/2,halfWidth=referenceExteriorPlan.bridge.width/2;
const end=(v)=>[B[0]+halfSpan*Math.cos(theta)+v*Math.sin(theta),B[2]-halfSpan*Math.sin(theta)+v*Math.cos(theta)];
const north=end(-halfWidth),south=end(halfWidth),deckTop=(.55+.105+.035/2)*.6;
const westX=z=>north[0]+(z-north[1])/(south[1]-north[1])*(south[0]-north[0]);
const channelZ=5.95,channelWidth=.60,waterWidth=.45;
export const restorationBridgeSpillwayPlan=Object.freeze({
  version:'east-bridge-abutment-spillway-candidate-2-metric-flow',
  bridgeContact:{north:[north[0],deckTop,north[1]],south:[south[0],deckTop,south[1]],walkingTop:deckTop},
  oldLanding:{min:[-4.255726762,-.12,4.959909604],max:[-2.965726762,.30,7.209909604]},
  source:{position:[-3.90,.11,channelZ],kind:'concealed recirculation outlet, inferred',boreRadius:.035},
  levels:{header:.18,middle:.03,pond:-.12,foundationBottom:-.42,existingSoilTop:-.40},
  flowStations:[[-3.90,.18,channelZ],[-4.72,.18,channelZ],[-4.80,.03,channelZ],[-5.06,.03,channelZ],[-5.13,-.118,channelZ],[-5.48,-.12,channelZ]],
  channelWidth,waterWidth,totalDrop:.30,
  replacement:'Only old bridge-head box(2.55,.15,11,2.15,.70,3.75) and its following three paving pieces. Keep bridge, main hall stairs, axis foundations, islands and old random stream.',
  evidenceLimit:'Physical candidate from original references and source geometry; not pixel acceptance or a uniquely recovered hydraulic layout.'
});
function prism(points,bottom,top,holes=[]){
  const s=new T.Shape();points.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();
  for(const [x,z,r]of holes){const h=new T.Path();h.absarc(x,-z,r,0,Math.PI*2,true);s.holes.push(h);}
  const g=new T.ExtrudeGeometry(s,{depth:top-bottom,steps:1,bevelEnabled:false,curveSegments:20});g.rotateX(-Math.PI/2);g.translate(0,bottom,0);return g;
}
function rectangle(x0,x1,z0,z1){return[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];}
function flowRibbon(points,width,seed=0,uvOffset=0){
  // Short gravity-drop profiles have a horizontal lip departure and increasing
  // downward slope. Each impact terminates into its real lower receiving pool.
  const vertices=[],uv=[],indices=[],samples=[];
  for(let segment=0;segment<points.length-1;segment++){
    const a=points[segment],b=points[segment+1],fall=a[1]-b[1]>.05,n=fall?14:8;
    for(let j=0;j<n;j++){
      const t=j/n,s=fall?t*t:t,x=T.MathUtils.lerp(a[0],b[0],t),y=T.MathUtils.lerp(a[1],b[1],s),z=T.MathUtils.lerp(a[2],b[2],t);
      samples.push([x,y,z]);
    }
  }
  samples.push(points.at(-1));
  let distance=uvOffset;
  for(let i=0;i<samples.length;i++){
    if(i)distance+=Math.hypot(...samples[i].map((v,k)=>v-samples[i-1][k]));
    const [x,y,z]=samples[i],t=i/(samples.length-1),w=width*(.97+.025*Math.sin(t*19+seed));
    vertices.push(x,y,z-w/2,x,y,z+w/2);uv.push(z-channelZ-w/2,distance,z-channelZ+w/2,distance);
    if(i<samples.length-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.userData.flowSamples=samples;g.userData.flowLength=distance-uvOffset;g.userData.uvOffset=uvOffset;return g;
}
export function buildRestorationBridgeSpillway({materials:source={},options={}}={}){
  const group=new T.Group();group.name='reference-short-spill-on-existing-east-bridge-abutment';
  const groups={landing:new T.Group(),weir:new T.Group(),water:new T.Group(),moss:new T.Group()};for(const[k,v]of Object.entries(groups)){v.name='bridge-spillway-'+k;group.add(v);}
  const stone=source.stone?.clone()??new T.MeshStandardMaterial({color:'#7a7d72'});stone.name='spillway-existing-abutment-stone';stone.roughness=.74;stone.metalness=0;stone.vertexColors=false;
  const wet=stone.clone();wet.name='spillway-wet-cut-stone';wet.color.multiplyScalar(.78);wet.roughness=.31;
  const water=source.flowWater??new T.MeshPhysicalMaterial({name:'restoration-short-flow-water',color:'#a6b8ad',roughness:.10,metalness:0,ior:1.333,clearcoat:0,emissive:0x000000,transparent:true,opacity:.34,depthWrite:false,side:T.DoubleSide});
  const moss=new T.MeshStandardMaterial({name:'spillway-stone-conforming-moss',color:'#667346',roughness:.97,vertexColors:true});
  const materials={stone,wet,water,moss},parts={landing:[],weir:[],water:[],moss:[]},geometries=[],flowPaths=[],flowDomains=[],walkSurfaces=[],solidVolumes=[],stoneFacings=[];
  const add=(where,poly,lo,hi,holes=[])=>{solidVolumes.push({group:where,polygon:poly,bottom:lo,top:hi,holes});parts[where].push(prism(poly,lo,hi,holes));};
  const za=north[1],zb=south[1],cx=-3.70,xEnd=-2.965726762,y0=-.42;
  // Three real descending treads replace the old two buried paving pieces.
  // They retain the bridge-head route and end at the actual old axis slab top.
  const levels=[deckTop,.024+(deckTop-.024)*2/3,.024+(deckTop-.024)/3,.024],run=(xEnd-cx)/3;
  const walkway=[[westX(za),za],[cx,za],[cx,zb],[westX(zb),zb]];
  walkSurfaces.push({polygon:walkway,y:levels[0]});
  // Solid flank pieces carry the cap around the covered water chamber.
  for(const [a,b]of[[za,channelZ-channelWidth/2],[channelZ+channelWidth/2,zb]])add('landing',[[westX(a),a],[cx,a],[cx,b],[westX(b),b]],y0,deckTop);
  const chamber=[[westX(channelZ-channelWidth/2),channelZ-channelWidth/2],[cx,channelZ-channelWidth/2],[cx,channelZ+channelWidth/2],[westX(channelZ+channelWidth/2),channelZ+channelWidth/2]];
  add('landing',chamber,.305,deckTop);
  // A real open supply bore passes through the load-bearing bottom. Its unseen
  // return pipe/pump is not invented as a visible garden object.
  add('weir',chamber,y0,.065,[[-3.90,channelZ,.035]]);
  add('landing',rectangle(-3.755,cx,channelZ-channelWidth/2,channelZ+channelWidth/2),.065,.305);
  for(let i=0;i<3;i++){const a=cx+i*run,b=cx+(i+1)*run,poly=rectangle(a,b,za,zb);add('landing',poly,y0,levels[i+1]);walkSurfaces.push({polygon:poly,y:levels[i+1]});}
  // Retain the existing south garden-side abutment footprint. It is not a
  // fabricated soil island and does not broaden the actual walking route.
  if(zb<7.209909604)add('landing',rectangle(-4.255726762,xEnd,zb,7.209909604),y0,.30);
  // Continuous stone support from the old abutment to the original pond bed.
  // The first lip is ~0.15m above the second, which falls ~0.15m to pond level.
  add('weir',rectangle(-4.72,-4.02,channelZ-.35,channelZ+.35),y0,.165);
  add('weir',rectangle(-5.06,-4.72,channelZ-.34,channelZ+.34),y0,.018);
  add('weir',rectangle(-5.60,-5.06,channelZ-.33,channelZ+.33),y0,-.18);
  for(const side of[-1,1]){
    const a=channelZ+side*.30,b=channelZ+side*.355,lo=Math.min(a,b),hi=Math.max(a,b);
    add('weir',rectangle(-4.78,-4.03,lo,hi),.165,.235);
    add('weir',rectangle(-5.09,-4.80,lo,hi),.018,.085);
  }
  // Broken granite facing is bonded to the already supported stone core.
  // It does not change the channel, crest heights, walking surfaces or island.
  for(const [i,x,yy,sx,sy,sz]of[[0,-4.91,.035,.13,.105,.060],[1,-5.16,-.045,.15,.13,.068],[2,-5.43,-.140,.16,.095,.072]])for(const side of[-1,1]){
    const z=channelZ+side*.325,g=granite(351+i*17+side*3);g.scale(sx,sy,sz);g.translate(x,yy,z);g.computeBoundingBox();
    stoneFacings.push({bounds:g.boundingBox.clone(),probePositions:new Float32Array(g.attributes.position.array),supportedByCore:true,seed:351+i*17+side*3});
    const p=g.attributes.position,n=g.attributes.normal,verts=[],cols=[];
    for(let j=0;j<p.count;j+=3){
      let cx=0,cy=0,cz=0,ny=0;for(let k=0;k<3;k++){cx+=p.getX(j+k)/3;cy+=p.getY(j+k)/3;cz+=p.getZ(j+k)/3;ny+=n.getY(j+k)/3;}
      if(ny<.30||cy<-.09||Math.sin(cx*31+cz*19+i)+.55*Math.cos(cz*43-cx*11)<.35)continue;
      for(let k=0;k<3;k++){const q=j+k;verts.push(p.getX(q)+n.getX(q)*.0015,p.getY(q)+n.getY(q)*.0015,p.getZ(q)+n.getZ(q)*.0015);const f=.76+.12*Math.sin(p.getX(q)*71+p.getZ(q)*63);cols.push(f*.84,f,f*.70);}
    }
    if(verts.length){const m=new T.BufferGeometry();m.setAttribute('position',new T.Float32BufferAttribute(verts,3));m.setAttribute('color',new T.Float32BufferAttribute(cols,3));m.computeVertexNormals();parts.moss.push(m);}parts.weir.push(g);
  }
  // Shallow header water is under the real cap, and the last vertices exactly
  // meet the retained pond height, not an unrelated floating reflective plane.
  const header=[[-3.88,.18,channelZ],[-4.20,.18,channelZ],[-4.67,.18,channelZ]];
  const headerGeometry=flowRibbon(header,waterWidth,3);parts.water.push(headerGeometry);flowPaths.push(headerGeometry.userData.flowSamples);const headerLength=headerGeometry.userData.flowLength;flowDomains.push({name:'header',uvOffset:0,length:headerLength,width:waterWidth});
  for(const [j,offset,width]of[[0,-.15,.086],[1,0,.105],[2,.15,.09]]){
    const points=[[-4.67,.18,channelZ+offset],[-4.72,.18,channelZ+offset],[-4.80,.03,channelZ+offset*.98],[-5.06,.03,channelZ+offset*.98],[-5.13,-.118,channelZ+offset*.93],[-5.48,-.12,channelZ+offset*.93]];
    const g=flowRibbon(points,width,j+9,headerLength);parts.water.push(g);flowPaths.push(g.userData.flowSamples);flowDomains.push({name:`falling-stream-${j}`,uvOffset:headerLength,length:g.userData.flowLength,width});
  }
  for(const key of Object.keys(parts)){
    if(!parts[key].length)continue;const geometry=mergeGeometries(parts[key]),m=new T.Mesh(geometry,key==='landing'?stone:key==='weir'?wet:key==='moss'?moss:water);m.name='closed-'+key+'-geometry';m.castShadow=key!=='water';m.receiveShadow=true;groups[key].add(m);geometries.push(geometry);parts[key].forEach(g=>g.dispose());
  }
  group.updateMatrixWorld(true);
  const stats={version:'bridge-spillway-physical-candidate-2-metric-flow',meshes:0,triangles:0,worldRandomCalls:0};group.traverse(m=>{if(m.isMesh){stats.meshes++;stats.triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3;}});
  const flowSurfaces=[{mesh:groups.water.children[0],material:water,worldFlowDirection:new T.Vector3(-1,0,0),worldLength:Math.max(...flowDomains.map(d=>d.uvOffset+d.length)),worldWidth:waterWidth,fallHeight:.30,uvMetersPerUnit:new T.Vector2(1,1),uvDomains:flowDomains,transparencyApproximation:'Single thin alpha-blended water skin; no background refraction buffer, no emissive foam or extra reflection target.'}];
  return{group,groups,materials,stats,flowSurfaces,plan:restorationBridgeSpillwayPlan,flowPaths,walkSurfaces,solidVolumes,stoneFacings,
    integration:{worldCoordinates:true,applySiteMatrixAgain:false,replaceOldLandingBox:true,replaceOldThreeApproachPavers:true,keepMainHallStairs:true,keepWaterPlane:true,requiresIndependentIntegration:true},
    dispose(){geometries.forEach(g=>g.dispose());stone.dispose();wet.dispose();moss.dispose();if(!source.flowWater)water.dispose();group.removeFromParent();}};
}
