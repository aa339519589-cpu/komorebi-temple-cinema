import * as T from 'three';

// Scene08 / foundation126. True closed coursed stone and measured ground
// contacts. No reference image, RGB lookup or view-dependent geometry.
const hash=n=>{const q=Math.sin(n*127.1+39.7)*43758.5453;return q-Math.floor(q);};
const ring=(w,d,c=.025)=>[[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],[w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];

function solidRings(rings,name){
 const p=[],uv=[],ix=[],n=rings[0].length;
 for(let j=0;j<rings.length;j++)for(let i=0;i<n;i++){p.push(...rings[j][i]);uv.push(i/n,rings[j][i][1]*1.8);}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=a+n,d=b+n;ix.push(a,b,c,b,d,c);}
 for(const [j,reverse]of [[0,true],[rings.length-1,false]]){
  const centre=new T.Vector3();for(const q of rings[j])centre.add(new T.Vector3(...q));centre.multiplyScalar(1/n);
  const v=p.length/3;p.push(...centre.toArray());uv.push(.5,.5);
  for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n;ix.push(...(reverse?[v,b,a]:[v,a,b]));}
 }
 let volume=0;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<ix.length;i+=3){a.fromArray(p,ix[i]*3);b.fromArray(p,ix[i+1]*3);c.fromArray(p,ix[i+2]*3);volume+=a.dot(b.clone().cross(c))/6;}
 if(volume<0)for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.name=name;g.userData.foundation126={closed:true,authoring:'procedural-coursed-solid-stone',photoTexture:false};return g;
}

function course({y0,y1,w0,d0,w1=w0,d1=d0,cx=0,cz=0,seed=1,name='foundation126-stone-course'}){
 const bevel=Math.min(.008,(y1-y0)*.16),rows=[];
 for(const [y,t,inset]of [[y0,0,.007],[y0+bevel,0,0],[y1-bevel,1,0],[y1,1,.007]]){
  const w=T.MathUtils.lerp(w0,w1,t),d=T.MathUtils.lerp(d0,d1,t),r=ring(w-inset*2,d-inset*2,Math.min(.025,w*.06,d*.06));
  rows.push(r.map(([x,z],i)=>{const shrink=1-hash(seed*23+i*11)*.018;return[cx+x*shrink,y,cz+z*shrink];}));
 }
 return solidRings(rows,name);
}

// Preserve the identified wing pier's original Y0..2.36 bearing interval and
// .40×.44 contact envelope. Small real coursing replaces its single flat box.
export function createWingStoneCourses(height=2.36){
 const n=8,parts=[];for(let j=0;j<n;j++)parts.push(course({y0:height*j/n,y1:height*(j+1)/n,w0:.40,d0:.44,seed:710+j,name:'foundation126-wing-pier-course-'+j}));return parts;
}

export function buildGroundedFoundations({emit,landSurfaces},layout){
 const debugMaterial=new T.MeshBasicMaterial({side:T.DoubleSide}),surfaces=landSurfaces.map(({geometry,matrix})=>{const m=new T.Mesh(geometry,debugMaterial);m.matrixAutoUpdate=false;m.matrix.copy(matrix);m.matrixWorld.copy(matrix);return m;});
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0),0,120),supportSamples=[];
 function landY(x,z){ray.ray.origin.set(x,50,z);const hit=ray.intersectObjects(surfaces,false)[0];if(!hit)throw Error('Foundation126 has no actual terrain/rock support at '+x+','+z);return hit.point.y;}
 function frame(origin,yaw){return new T.Matrix4().makeTranslation(...origin).multiply(new T.Matrix4().makeRotationY(yaw));}
 function groundedFoot({label,origin,yaw,footW,footD,headW,headD,topY,capThickness=.10,embed=.08,seed=1}){
  const m=frame(origin,yaw),outline=ring(footW,footD),samples=outline.map(([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(m);return{local:[x,z],world:[p.x,p.z],groundY:landY(p.x,p.z)};}),centreGround=landY(origin[0],origin[2]),shoulderY=topY-capThickness;
  // A later genuine soil terrace may cover this original bearing. Keep an
  // embedded positive foundation below the unchanged cap; never invert it to
  // follow soil that now stands above the head.
  const minimumBodyDepth=.28,lower=samples.map(({local:[x,z],groundY})=>[x,Math.min(groundY-embed,shoulderY-minimumBodyDepth),z]);
  // Bottom is an actual terrain-following closed fan, with its centre sampled
  // separately rather than an invented flat .7m foundation datum.
  const upper=ring(headW,headD).map(([x,z])=>[x,shoulderY,z]);
  const g=solidRings([lower,upper],label+'-terrain-conforming-foot');
  // Replace the bottom fan centre with the real centre-bed height. The fan
  // centre follows the first8vertices in solidRings' fixed buffer layout.
  const centreIndex=16,position=g.attributes.position;position.setY(centreIndex,Math.min(centreGround-embed,shoulderY-minimumBodyDepth));g.computeVertexNormals();
  emit(g,'stone',...origin,1,1,1,[0,yaw,0]);
  const cap=course({y0:shoulderY,y1:topY,w0:headW,d0:headD,seed,name:label+'-bearing-cap'});emit(cap,'stone',...origin,1,1,1,[0,yaw,0]);
  const record={label,origin,yaw,foot:[footW,footD],head:[headW,headD],bearingTopY:topY,shoulderY,embedTargetMetres:embed,minimumBodyDepth,buriedByTerrace:centreGround>topY,centreGroundY:centreGround,centreFootY:position.getY(centreIndex),samples:samples.map((s,i)=>({...s,footY:lower[i][1],penetration:s.groundY-lower[i][1]}))};supportSamples.push(record);return record;
 }
 function column({label,origin,yaw,zOffset=0,bottomY,topY,footW,footD,headW,headD,seed=1}){
  if(!(topY>bottomY))throw Error('Foundation column must retain positive height: '+label);
  const n=Math.ceil((topY-bottomY)/.28);for(let j=0;j<n;j++){
   const t0=j/n,t1=(j+1)/n,g=course({y0:T.MathUtils.lerp(bottomY,topY,t0),y1:T.MathUtils.lerp(bottomY,topY,t1),w0:T.MathUtils.lerp(footW,headW,t0),d0:T.MathUtils.lerp(footD,headD,t0),w1:T.MathUtils.lerp(footW,headW,t1),d1:T.MathUtils.lerp(footD,headD,t1),cz:zOffset,seed:seed+j,name:label+'-course-'+j});emit(g,'stone',...origin,1,1,1,[0,yaw,0]);
  }return{label,bottomY,topY,courses:n,foot:[footW,footD],head:[headW,headD]};
 }

 const B=layout.bridge,dx=B.b[0]-B.a[0],dz=B.b[2]-B.a[2],yaw=Math.atan2(-dz,dx),bridgeOrigin=[B.a[0],0,B.a[2]],bridgeMatrix=frame(bridgeOrigin,yaw),capTop=2.80,capBottom=2.56,bridgePiers=[];
 // This cap retains the old low-abutment top/plan, preserving both the first
 // bridge-board and stair-stringer bearings. Its middle is genuinely open.
 const landingCap=course({y0:capBottom,y1:capTop,w0:1.05,d0:B.width+.2,seed:126,name:'foundation126-low-landing-stone-cap'});emit(landingCap,'stone',...bridgeOrigin,1,1,1,[0,yaw,0]);
 for(const [i,z]of [-.55,.55].entries()){
  const world=new T.Vector3(0,0,z).applyMatrix4(bridgeMatrix),footOrigin=[world.x,0,world.z],outline=ring(.76,.50),groundHeights=outline.map(([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(frame(footOrigin,yaw));return landY(p.x,p.z);}),footTop=Math.min(Math.max(...groundHeights)+.14,capBottom-.32);
  const foot=groundedFoot({label:'foundation126-bridge-flank-'+i,origin:footOrigin,yaw,footW:.76,footD:.50,headW:.70,headD:.46,topY:footTop,capThickness:.10,embed:.08,seed:1260+i});
  const pier=column({label:'foundation126-bridge-pier-'+i,origin:footOrigin,yaw,bottomY:footTop,topY:capBottom,footW:.70,footD:.46,headW:.62,headD:.38,seed:1270+i*20});bridgePiers.push({foot,pier});
 }
 const W=layout.wing,wingMatrix=frame([W.position[0],0,W.position[2]],W.yaw),wingFootings=[];
 // Replace only the independently identified broad lower foundation by six
 // individual feet. Existing upper-pier positions, spans and Y1.5 seats stay.
 if(layout.wingFoundationMode!=='annex130')for(const x of [-W.w*.35,W.w*.35])for(const z of [-W.d*.35,0,W.d*.35]){
  const p=new T.Vector3(x,0,z).applyMatrix4(wingMatrix);wingFootings.push(groundedFoot({label:'foundation126-wing-foot-'+wingFootings.length,origin:[p.x,0,p.z],yaw:W.yaw,footW:.76,footD:.80,headW:.62,headD:.66,topY:W.position[1],capThickness:.10,embed:.08,seed:1300+wingFootings.length}));
 }
 // The unchanged high abutment has a measured .22m centre gap above ground.
 // Add only a terrain-following sole beneath its existing Y.95 bottom; the
 // tall high-end body, gallery landing, materials and pose remain unchanged.
 const highEndFootingOnly=groundedFoot({label:'foundation126-high-end-sole-only',origin:[B.b[0],0,B.b[2]],yaw,footW:1.05,footD:B.width+.2,headW:1.05,headD:B.width+.2,topY:.95,capThickness:.08,embed:.08,seed:1400});
 debugMaterial.dispose();
 const firstT=.5/B.segments,firstBoardUnderside=B.a[1]+(B.b[1]-B.a[1])*firstT+B.arch*Math.sin(firstT*Math.PI)-.195;
 return{revision:'scene08-grounded-open-foundations126',bridge:{capTop,capBottom,capPlan:[1.05,B.width+.2],oldBottomY:.7,oldCentreGroundY:landY(B.a[0],B.a[2]),firstBoardUnderside,bearingOverlapMetres:capTop-firstBoardUnderside,piers:bridgePiers,minimumClearOpeningWidthMetres:1.10-.50,clearHeightAboveWaterMetres:capBottom-1.0,highEndFootingOnly},wing:{upperPierFeetY:W.position[1],upperPierHeadsY:W.position[1]+W.raised-.64,footings:wingFootings,identifiedMiddleRightPierCoursed:layout.wingFoundationMode!=='annex130',replacedByAttachedPorch130:layout.wingFoundationMode==='annex130'},groundSurfaceCount:landSurfaces.length,supportSamples,scope:layout.wingFoundationMode==='annex130'?'Bridge cap/flank feet and high-end sole retained. Old six wing feet disabled; attached porch130 reports its complete replacement load path.':'Only old low bridge abutment, separate broad wing lower foundation, identified middle-right wing stone-pier surface form, and measured gap-filling sole beneath unchanged high-end body. Middle-gallery supports/site/camera/lights/assets unchanged.',photoRGBOrProjection:false,visualAccepted:false};
}
