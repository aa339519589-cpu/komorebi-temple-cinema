// Small, advancing water-surface reliefs sit on the actual wet flagstones.
// Their centers, contact height and opacity come from the authored paving and
// its existing wetness atlas; no circle is drawn on dry ground.
export const WATER_RIPPLE135_REVISION='scene10-physical-captured-scene-rainwaves142';

export function createWaterFilmRipples135(T,{impacts,floorWetMap,floorPolygons,scene,filmY=.055}){
  const width=floorWetMap.image.width,height=floorWetMap.image.height,mask=floorWetMap.image.data;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const edgeDistance=(x,z,p)=>{let d=Infinity,inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
    const a=p[i],b=p[j],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t));
    if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside?-d:d;};
  function maskAt(x,z){
    const u=(x+4.6)/9.2,v=(z+2)/21.4;if(u<0||u>1||v<0||v>1)return 0;
    const ix=Math.min(width-1,Math.floor(u*width)),iy=Math.min(height-1,Math.floor(v*height)),k=(iy*width+ix)*4;
    return mask[k+2]/255*Math.min(1,mask[k]/255*1.7)*mask[k+1]/255*mask[k+3]/255;
  }
  const stones=floorPolygons.filter(p=>p.points?.length>=3&&p.wetness>.36);
  const candidates=impacts.map(q=>({...q}));
  // Fixed low-discrepancy continuation fills the visible wet path without
  // advancing the scene's procedural RNG stream or making a regular grid.
  const frac=x=>x-Math.floor(x);
  for(let i=0;i<48;i++){const q=impacts[i%impacts.length],u=frac((i+.5)*.7548776662466927),v=frac((i+.5)*.5698402909980532);candidates.push({x:-3.8+u*7.6,z:3+v*15.5,phase:frac(q.phase+.173+i*.037),radius:q.radius*(.72+.52*frac(i*.6180339887498949))});}
  const placements=[];
  for(let i=0;i<candidates.length;i++){
    const q=candidates[i];let best=null,bestCost=Infinity;
    for(const stone of stones){
      const d=edgeDistance(q.x,q.z,stone.points),cost=Math.max(0,d)+Math.max(0,-d)*.10+(1-stone.wetness)*.10;
      if(cost<bestCost){bestCost=cost;best=stone;}
      if(d<=-.095){best=stone;bestCost=-1;break;}
    }
    if(!best)continue;
    let x=q.x,z=q.z;
    if(edgeDistance(x,z,best.points)>.002){x=best.points.reduce((s,p)=>s+p[0],0)/best.points.length;z=best.points.reduce((s,p)=>s+p[1],0)/best.points.length;}
    const wet=maskAt(x,z);if(wet<.24)continue;
    // The existing bounded water film reflects at Y=.066 above the low
    // paving. Waves meet that measured surface; taller actual flagstones stay
    // above it rather than receiving an elevated scene-wide lid.
    const top=Math.max(filmY,Number.isFinite(best.topY)?best.topY:.044);
    placements.push({x,z,top,phase:q.phase,shape:q.radius,wet,seed:i,maxRadius:.038+q.radius*1.20});
  }
  // Resolve every crest with multiple native-output vertices. A thinner band
  // aliases away on the wet stone at the film camera's metre-per-pixel scale.
  const radial=20,angular=60,stride=(radial+1)*(angular+1),positions=new Float32Array(placements.length*stride*3),opacity=new Float32Array(placements.length*stride),indices=[];
  const vertexInfo=[];
  for(let e=0;e<placements.length;e++){
    const p=placements[e],rotation=p.phase*Math.PI*2;
    for(let r=0;r<=radial;r++)for(let a=0;a<=angular;a++){
      const index=e*stride+r*(angular+1)+a,theta=a/angular*Math.PI*2+rotation;
      const radius=p.maxRadius*1.22*r/radial;
      const irregular=1+.045*Math.sin(theta*3+p.phase*13)+.025*Math.sin(theta*7+p.seed*2.3);
      const x=p.x+Math.cos(theta)*radius*irregular,z=p.z+Math.sin(theta)*radius*irregular;
      positions.set([x,p.top+.0008,z],index*3);opacity[index]=maskAt(x,z);
    }
    for(let r=0;r<radial;r++)for(let a=0;a<angular;a++){
      const v=e*stride+r*(angular+1)+a,n=v+angular+1;indices.push(v,v+1,n,v+1,n+1,n);
    }
    vertexInfo.push({start:e*stride,event:p});
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('rippleCoverage',new T.BufferAttribute(opacity,1));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.name='time-varying-water-relief-grounded-in-real-paving';
  const material=new T.MeshPhysicalMaterial({name:'submillimetre-rain-water-on-wet-stone',color:0x29383a,roughness:.10,metalness:0,ior:1.333,clearcoat:0,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='attribute float rippleCoverage;varying float vRippleCoverage;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRippleCoverage=rippleCoverage;');
    shader.fragmentShader='varying float vRippleCoverage;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vRippleCoverage;');
  };
  material.customProgramCacheKey=()=>WATER_RIPPLE135_REVISION;
  const mesh=new T.Mesh(geometry,material);mesh.name='55-seeded-rain-impacts-on-existing-wet-flagstones';mesh.frustumCulled=false;mesh.renderOrder=2;scene.add(mesh);
  const ringWidth=.014;
  function update(time){
    for(const {start,event:p}of vertexInfo){
      const period=.62+1.15*(.15+.70*p.shape),age=(time/period+p.phase)%1,fade=age<.76?1:Math.max(0,1-(age-.76)/.24),front=p.maxRadius*Math.pow(Math.max(.001,age),.66),amplitude=(.00070+.0020*p.shape)*fade;
      for(let r=0;r<=radial;r++)for(let a=0;a<=angular;a++){
        const index=start+r*(angular+1)+a,oldX=positions[index*3],oldZ=positions[index*3+2],dx=oldX-p.x,dz=oldZ-p.z,d=Math.hypot(dx,dz),angle=Math.atan2(dz,dx);
        const warpedFront=front*(1+.045*Math.sin(angle*3+p.phase*13)+.025*Math.sin(angle*7+p.seed*2.3));
        const q=(d-warpedFront)/ringWidth,ring=Math.exp(-q*q),inner=Math.exp(-Math.pow((d-(warpedFront-ringWidth*2.15))/(ringWidth*.78),2));
        const trough=ring*Math.sin(q*Math.PI),puddle=-.16*Math.exp(-((d/Math.max(.025,front*.31))**2));
        positions[index*3+1]=p.top+.0008+amplitude*(trough-.24*inner+puddle);
        opacity[index]=maskAt(oldX,oldZ)*fade*(.72*ring+.12*inner);
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.rippleCoverage.needsUpdate=true;geometry.computeVertexNormals();
  }
  return{
    update,setEnvironment(texture){material.envMap=texture;material.envMapIntensity=1.4;material.needsUpdate=true;},dispose(){scene.remove(mesh);geometry.dispose();material.dispose();},
    info:{revision:WATER_RIPPLE135_REVISION,seeds:impacts.length,additionalDistributedPositions:candidates.length-impacts.length,groundedImpacts:placements.length,generatedVertices:positions.length/3,generatedTriangles:indices.length/3,waterSurfaceY:filmY,ringWidthMetres:ringWidth,peakWaveMetres:.0009,staticRNGDraws:0,ringMaterial:'Dark water absorption color with IOR 1.333 specular reflection; no emissive pale ring',contact:'Impact centers and every ripple vertex are gated by real paving coverage, narrow seams, wetness and the geometry-derived low-spot pool mask; crest relief stays below about 0.9 mm.',surface:'Thin shallow film at the low-spot waterline over actual authored flagstone geometry; no replacement ground sheet.'}
  };
}
