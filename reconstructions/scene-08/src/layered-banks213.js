import * as T from 'three';

// One triangle sampler is shared by the actual ground mesh and every root,
// foundation and inserted rock. Analytic hills alone can leave plants above
// the coarse triangulated surface along a steep bank.
export function createGardenGround213(grandFrame){
 const nx=384,nz=384,x0=-28,z0=-42,sx=56/nx,sz=60/nz,c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw);
 const ground=z=>.50+Math.max(0,Math.min(3.50,(6-z)*.14));
 const land=(x,z)=>ground(z)-.08+.035*Math.sin(x*.43+z*.27)*Math.sin(z*.31-x*.22);
 const profile=[[-25,4.95],[-22,4.90],[-19,4.85],[-17,4.75],[-15,4.7],[-13,4.5],[-11,4.3],[-9,4.0],[-7,3.6],[-5,3.1],[-3,2.65],[-1,2.0],[0,1.75],[2,1.35],[4,1.05],[6,.85],[7.5,.75]];
 function riverX(z){if(z<=profile[0][0])return profile[0][1];if(z>=profile.at(-1)[0])return profile.at(-1)[1];for(let i=0;i+1<profile.length;i++)if(z>=profile[i][0]&&z<=profile[i+1][0])return T.MathUtils.lerp(profile[i][1],profile[i+1][1],(z-profile[i][0])/(profile[i+1][0]-profile[i][0]));}
 // Match the actual100-row water mesh's Catmull curve and changing width.
 // The old independent2m cut left a bare gap outside the much narrower water.
 const curve=new T.CatmullRomCurve3(profile.map(([z,x])=>new T.Vector3(x,.52,z)),false,'centripetal'),water=Array.from({length:101},(_,i)=>curve.getPoint(i/100)),halfWidth=t=>(.56+.32*T.MathUtils.smoothstep(t,.18,.78)+.26*T.MathUtils.smoothstep(t,.82,1))*T.MathUtils.smoothstep(t,0,.09);
 function closest(x,z){let best=Infinity,at=0,footX=0;for(let i=0;i<100;i++){const a=water[i],b=water[i+1],dx=b.x-a.x,dz=b.z-a.z,u=T.MathUtils.clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1),d=(x-a.x-dx*u)**2+(z-a.z-dz*u)**2;if(d<best){best=d;at=(i+u)/100;footX=a.x+dx*u;}}return{distance:Math.sqrt(best),t:at,east:x>=footX};}
 function analytic(x,z){const dx=x-grandFrame.x,dz=z-grandFrame.z,lx=c*dx-s*dz,lz=s*dx+c*dz,edge=Math.hypot(Math.max(0,Math.abs(lx+.40)-2.02),Math.max(0,Math.abs(lz+.40)-2.92)),platform=4.12*(1-T.MathUtils.smoothstep(edge,0,1.60)),pine=2.55*Math.exp(-((x-5.6)**2+(z+13.2)**2)/.62);let y=Math.max(land(x,z),.68*T.MathUtils.smoothstep(z,1,5));
  if(x>-10&&x<14&&z>-25.1&&z<7.7){const{distance:d,t,east}=closest(x,z),w=halfWidth(t),shore=.70+.35*(1-T.MathUtils.smoothstep(z,-8,1)),near=T.MathUtils.smoothstep(z,-7,2);y=Math.max(.68*near,y-.28*near*(1-T.MathUtils.smoothstep(d,w+1,w+3.5)));if(w>.025){if(east){const first=.70,outer=3.60-1.40*near,ledge=.92-.12*near;if(d<=w)y=T.MathUtils.lerp(-.30,.50,T.MathUtils.smoothstep(d,w*.54,w));else if(d<w+first)y=T.MathUtils.lerp(.50,ledge,T.MathUtils.smoothstep(d,w,w+first));else if(d<w+first+outer)y=T.MathUtils.lerp(ledge,y,T.MathUtils.smoothstep(d,w+first,w+first+outer));y+=.025*Math.sin(x*9.3+z*4.7)*Math.cos(z*7.9-x*2.2)*T.MathUtils.smoothstep(d,w+.15,w+.55)*(1-T.MathUtils.smoothstep(d,w+first+outer-.6,w+first+outer));}else if(d<w+shore)y=d<=w?T.MathUtils.lerp(-.30,.50,T.MathUtils.smoothstep(d,w*.54,w)):T.MathUtils.lerp(.50,y,T.MathUtils.smoothstep(d,w,w+shore));}}
  return Math.max(y,platform,pine);
 }
 const heights=new Float64Array((nx+1)*(nz+1));for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)heights[j*(nx+1)+i]=analytic(x0+i*sx,z0+j*sz);
 function sample(x,z){const gx=T.MathUtils.clamp((x-x0)/sx,0,nx-1e-8),gz=T.MathUtils.clamp((z-z0)/sz,0,nz-1e-8),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j,k=j*(nx+1)+i,a=heights[k],b=heights[k+1],c=heights[k+nx+1],d=heights[k+nx+2];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
 return{sample,analytic,waterSection:{curve,halfWidth},info:{revision:'scene08-continuous-inlet-bank213-r09',bounds:[x0,z0,56,60],divisions:[nx,nz],hallPlatformTracksRealLocalFootprint:true,originalChannelWaterlineHeld:true,downstreamChannelRebuilt:true,actualWaterCurveAndWidthCoupled:true,eastBankLowLedgeMetres:[.80,.92],eastBankOuterSlopeWidth:[2.20,3.60],waterEdgeTerrainY:.50,waterPlaneY:.52,nearLandMinimumY:.68,rootAndTerrainTrianglesIdentical:true,visualAccepted:false}};
}

// A fixed physical waterline darkens the same mineral surface where it is
// damp. It follows world geometry in every camera, not a screen-space mask.
export function installDampStone213(material){
 const old=material.onBeforeCompile,key=material.customProgramCacheKey.bind(material);
 const mineralMap213=T.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',`float mineralLuma213=dot(sampledDiffuseColor.rgb,vec3(.2126,.7152,.0722));
 float sourceMoss213=smoothstep(.95,1.32,sampledDiffuseColor.g/max(.006,sampledDiffuseColor.r));
 sampledDiffuseColor.rgb=mix(mineralLuma213*vec3(1.05,1.04,.98),sampledDiffuseColor.rgb,sourceMoss213*.88);
 diffuseColor *= sampledDiffuseColor;`);
 material.onBeforeCompile=s=>{old.call(material,s);s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying float stoneWorldY213;').replace('#include <project_vertex>',`#include <project_vertex>
 vec4 stonePosition213=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 stonePosition213=instanceMatrix*stonePosition213;
 #endif
 stoneWorldY213=(modelMatrix*stonePosition213).y;`);s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float stoneWorldY213;').replace('#include <map_fragment>',mineralMap213).replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.61,1.,smoothstep(.55,1.00,stoneWorldY213));').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor*=mix(.60,1.,smoothstep(.55,1.00,stoneWorldY213));');};
 material.customProgramCacheKey=()=>key()+'-world-waterline213';material.needsUpdate=true;
}

function fernGeometry(){
 const p=[];function tri(a,b,c){p.push(...a,...b,...c);}const point=(a,t,L,h)=>new T.Vector3(Math.cos(a)*L*t,h*Math.sin(t*Math.PI*.82),Math.sin(a)*L*t);
 for(let f=0;f<9;f++){
  const a=f*2.399963,L=.28+.11*(.5+.5*Math.sin(f*1.73)),h=.21+.09*(.5+.5*Math.cos(f*2.3)),side=new T.Vector3(-Math.sin(a),0,Math.cos(a));
  for(let j=1;j<16;j++)for(const sign of[-1,1]){
   const t=j/17,c=point(a,t,L,h),reach=(.075*Math.sin(t*Math.PI)**.65+.008)*(1-.30*t),tip=c.clone().addScaledVector(side,sign*reach).add(new T.Vector3(Math.cos(a)*.026,.004,Math.sin(a)*.026)),half=.008*(1-.60*t),forward=new T.Vector3(Math.cos(a)*half,0,Math.sin(a)*half),mid=c.clone().lerp(tip,.54).add(new T.Vector3(0,.004,0)),l=mid.clone().sub(forward),r=mid.clone().add(forward);tri(c.toArray(),l.toArray(),tip.toArray());tri(c.toArray(),tip.toArray(),r.toArray());
  }
  for(let j=0;j<12;j++){const c=point(a,j/12,L,h),d=point(a,(j+1)/12,L,h),w=.0018*(1-j/15);tri(c.clone().addScaledVector(side,w).toArray(),c.clone().addScaledVector(side,-w).toArray(),d.clone().addScaledVector(side,w*.7).toArray());tri(c.clone().addScaledVector(side,-w).toArray(),d.clone().addScaledVector(side,-w*.7).toArray(),d.clone().addScaledVector(side,w*.7).toArray());}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}

export function dressLayeredBanks213({emit,scannedStones,botany,height,riverXAt,materials,grandFrame}){
 const fern=new T.MeshStandardMaterial({name:'scene08-213-fine-curved-fern-fronds',color:0x526e35,roughness:.86,metalness:0,side:T.DoubleSide}),fernG=fernGeometry();materials.push(fern);const rocks=[],shrubs=[],ferns=[];
 const stones=[[-1.35,.60,1.75,1.60,3],[-.55,-2.7,1.60,1.45,3],[-2.65,2.4,1.25,.80,0],[-3.05,-1.7,1.35,.90,2],[4.05,3.8,1.48,1.00,5],[3.8,1.3,1.20,.85,1],[4.65,-3.7,1.35,.90,3],[2.8,-6.5,1.15,.90,2]];
 for(const[x,z,width,h,index]of stones){scannedStones.place({emit,x,z,height:height(x,z),width,heightLimit:h,index,allowTall:true});rocks.push({x,z,width,heightLimit:h,index});}
 // Partially embedded original scan solids carry the cut platform edge.
 // Their lower faces intersect the actual slope; there is no facing rock
 // texture, and the occupied hall and its original post contacts stay clear.
 const c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw),retaining=[];
 for(const[lx,lz,width,index]of[[-1.90,3.35,1.60,3],[-.55,3.42,1.85,2],[.85,3.36,1.70,3],[1.95,2.90,1.60,5],[2.10,1.55,1.85,3],[2.02,.15,1.70,4],[2.05,-1.18,1.55,3],[-1.20,4.05,1.25,0],[.35,4.04,1.35,3],[2.70,3.65,1.20,5],[2.90,2.15,1.25,2],[2.92,.65,1.35,3],[2.85,-.85,1.20,4]]){
  const x=grandFrame.x+c*lx+s*lz,z=grandFrame.z-s*lx+c*lz,variant=scannedStones.info.variants[index%scannedStones.info.variants.length],bodyHeight=Math.min(width*variant.height/variant.width,1.70),y=height(x,z)-bodyHeight*.45;
  scannedStones.place({emit,x,z,height:y,width,heightLimit:1.70,index,allowTall:true});retaining.push({x,z,width,base:y,slopeAtCentre:height(x,z),bodyHeight,index,embeddedInTriangularTerrain:y<height(x,z)});
 }
 for(const[x,z,width,index]of[[-2.8,-.9,1.15,0],[-1.9,-2.8,1.05,2],[-3.7,1.6,.92,1],[-1.6,3.3,.85,3],[4.25,2.1,1.02,2],[4.8,-2.8,1.20,1],[3.7,-5.0,1.05,3],[1.8,-8.0,.82,0]]){botany.place({emit,height,x,z,width,flower:false,index,yaw:index*.71});shrubs.push({x,z,width,index});}
 // Low separate shore plants mark the newly open water edge. These are
 // rooted original scan solids, rather than another high shrub curtain.
 for(let i=0;i<7;i++){const z=-4.4+i*1.55,side=i%2?1:-1,x=riverXAt(z)+side*(1.84+.09*Math.sin(i*1.7)),width=.46+.10*(.5+.5*Math.sin(i*2.1));botany.place({emit,height,x,z,width,flower:false,index:i,yaw:i*1.13});shrubs.push({x,z,width,index:i,lowShoreIsland:true});}
 for(let i=0;i<36;i++){const z=-8.5+(i/35)*14.8,side=i%2?1:-1,x=riverXAt(z)+side*(1.50+.30*Math.sin(i*1.7)),scale=.62+.30*(.5+.5*Math.sin(i*2.13)),y=height(x,z)+.018;emit(fernG,fern,x,y,z,scale,scale,scale,[0,i*2.399,0]);ferns.push([x,y,z,scale]);}
 return{revision:'scene08-exposed-two-course-rock-bank213-r04',rocks,retaining,shrubs,fernRootCount:ferns.length,fernRoots:ferns,source:'Existing immutable CC0 moss-rock/shrub geometry; new actual curved fern leaflets and triangle-rooted placement',newExternalAssets:false,visualAccepted:false};
}
