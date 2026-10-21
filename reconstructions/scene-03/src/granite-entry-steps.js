// Independent quarry blocks at the retained20 step elevations. Physical
// mineral maps are a CC0 single stone face, never reference-photo imagery.
export const GRANITE_REPEAT_METRES=2*650/4096;
const fract=x=>x-Math.floor(x),hash=(a,b=0)=>fract(Math.sin(a*127.13+b*311.79+73.14)*43758.5453);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};

export async function installEntryGranite(T,material){
 const loader=new T.TextureLoader(),names=['diff','nor_gl','rough'];
 const maps=await Promise.all(names.map(name=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${name}.png`,import.meta.url).href)));
 for(const [i,map]of maps.entries()){map.name='CC0-PolyHaven-granite-tile04-stair-'+names[i];map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.anisotropy=8;if(i===0)map.colorSpace=T.SRGBColorSpace;}
 material.map=maps[0];material.normalMap=maps[1];material.normalScale.set(.28,.28);material.roughnessMap=maps[2];material.bumpMap=null;
 material.color.set('#b4bdc1');material.roughness=.90;material.metalness=0;material.vertexColors=true;
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float graniteY=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb=mix(diffuseColor.rgb,graniteY*vec3(.97,1.,1.02),.82);`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(.70+.26*roughnessFactor,.74,.94);`);
 };
 material.customProgramCacheKey=()=> 'scene03-metric-granite-stair-72';material.needsUpdate=true;
 return {maps,info:{source:'Poly Haven Granite Tile04, CC0, independent face crop',repeatMetres:GRANITE_REPEAT_METRES,normalScale:.28,roughnessRange:[.74,.94],referencePhotoUsed:false},dispose(){for(const map of maps)map.dispose();}};
}

function stoneBlock(T,{x0,x1,z0,z1,top,thickness,row,index,seed,sheltered=false}){
 const width=x1-x0,depth=z1-z0,r=sheltered?.0025:.0045+.002*hash(seed,3),chips=[];
 if(!sheltered&&hash(seed,7)<.26){
  const count=hash(seed,8)>.88?2:1;
  for(let k=0;k<count;k++)chips.push({x:x0+.11+(width-.22)*hash(seed,k+11),halfWidth:.018+.026*hash(seed,k+14),depth:.003+.006*hash(seed,k+18),inset:.003+.005*hash(seed,k+24)});
 }
 const pit=!sheltered&&hash(seed,32)<.15?{x:x0+.15+(width-.30)*hash(seed,36),z:z0+.08+(depth-.16)*hash(seed,38),radius:.012+.012*hash(seed,41),depth:.001+.0012*hash(seed,44)}:null;
 const xs=[x0+r,x1-r],zs=[z0+r,z1-r];
 for(let k=1;k<Math.ceil(width/.085);k++)xs.push(x0+r+(width-2*r)*k/Math.ceil(width/.085));
 for(let k=1;k<6;k++)zs.push(z0+r+(depth-2*r)*k/6);
 for(const chip of chips)for(const u of[-1,-.55,0,.55,1])xs.push(Math.max(x0+r,Math.min(x1-r,chip.x+chip.halfWidth*u)));
 if(pit){for(const u of[-1,0,1]){xs.push(Math.max(x0+r,Math.min(x1-r,pit.x+pit.radius*u)));zs.push(Math.max(z0+r,Math.min(z1-r,pit.z+pit.radius*u)));}}
 const ordered=a=>[...new Set(a.map(v=>v.toFixed(7)))].map(Number).sort((a,b)=>a-b),xx=ordered(xs),zz=ordered(zs),nx=xx.length,nz=zz.length,positions=[],indices=[],hardFaces=[];
 const shape=(chip,x)=>{const u=(x-chip.x)/chip.halfWidth;return Math.abs(u)>=1?0:Math.pow(1-Math.abs(u),.62)*(1+.10*u);};
 function wear(x,z){
  if(sheltered)return 0;
  const t=(z-z0)/depth,lane=.12*Math.sin(row*1.71),basin=(.0012+.0014*hash(row,75))*Math.exp(-(((x-lane)/.94)**4))*Math.sin(Math.PI*t)**2;
  let result=-basin;
  for(const chip of chips)result-=chip.depth*shape(chip,x)*Math.max(0,1-(z1-z)/.035)**2;
  if(pit){const q=Math.hypot(x-pit.x,z-pit.z)/pit.radius;if(q<1)result-=pit.depth*(1-q*q)**2;}
  return result;
 }
 for(const z of zz)for(const x of xx)positions.push(x,top+wear(x,z),z);
 for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;indices.push(a,c,b,b,c,d);hardFaces.push(false,false);}
 const perimeter=[...Array(nx).keys(),...Array.from({length:nz-1},(_,k)=>(k+1)*nx+nx-1),...Array.from({length:nx-1},(_,k)=>(nz-1)*nx+nx-2-k),...Array.from({length:nz-2},(_,k)=>(nz-2-k)*nx)];
 const base=perimeter.map(id=>({x:positions[id*3],z:positions[id*3+2]}));
 let previous=perimeter;
 function ring(offset,drop,vertical=false,bottom=false){
  const current=[];
  for(const p of base){
   const left=Math.abs(p.x-xx[0])<1e-6,right=Math.abs(p.x-xx.at(-1))<1e-6,back=Math.abs(p.z-zz[0])<1e-6,front=Math.abs(p.z-zz.at(-1))<1e-6;
   const x=p.x+(right?offset:left?-offset:0);let z=p.z+(front?offset:back?-offset:0),y=top-drop;
   if(!vertical){y+=wear(x,z);if(front)for(const chip of chips)z-=chip.inset*shape(chip,x);}
   current.push(positions.length/3);positions.push(x,bottom?top-thickness:y,z);
  }
  for(let k=0;k<previous.length;k++){const n=(k+1)%previous.length,a=previous[k],b=previous[n],c=current[k],d=current[n];indices.push(a,b,c,b,d,c);hardFaces.push(vertical,vertical);}
  previous=current;return current;
 }
 for(const angle of[Math.PI/6,Math.PI/3,Math.PI/2])ring(r*Math.sin(angle),r*(1-Math.cos(angle)));
 ring(r,r+.020,true);
 const bottom=ring(r,thickness,true,true),centre=positions.length/3;positions.push((x0+x1)/2,top-thickness,(z0+z1)/2);
 for(let k=0;k<bottom.length;k++){indices.push(centre,bottom[k],bottom[(k+1)%bottom.length]);hardFaces.push(true);}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
 // Split the rendered wall/bottom vertices from the smooth top/arris field.
 // A flat bearing face never averages a bottom normal or the adjacent end
 // face across an85mm surface cell. Only the actual4.5–6.5mm rounded strip
 // keeps continuous normals. Chipped walls use their true triangle normals.
 const split=g.toNonIndexed();g.dispose();g=split;
 const np=g.attributes.position,nn=g.attributes.normal;
 for(let i=0;i<hardFaces.length;i++)if(hardFaces[i]){
  const a=new T.Vector3().fromBufferAttribute(np,i*3),b=new T.Vector3().fromBufferAttribute(np,i*3+1),c=new T.Vector3().fromBufferAttribute(np,i*3+2),normal=b.sub(a).cross(c.sub(a)).normalize();
  for(let k=0;k<3;k++)nn.setXYZ(i*3+k,normal.x,normal.y,normal.z);
 }
 const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2),colors=new Float32Array(p.count*3),shade=.91+.15*hash(seed,88),rotation=index%4,offsetU=hash(seed,91)*8,offsetV=hash(seed,92)*8;
 for(let i=0;i<p.count;i++){
  const a=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],axis=a.indexOf(Math.max(...a));
  let u=(axis===0?p.getZ(i):p.getX(i))/GRANITE_REPEAT_METRES,v=(axis===1?p.getZ(i):p.getY(i))/GRANITE_REPEAT_METRES;
  if(rotation===1)[u,v]=[v,-u];else if(rotation===2){u=-u;v=-v;}else if(rotation===3)[u,v]=[-v,u];
  uv[i*2]=u+offsetU;uv[i*2+1]=v+offsetV;colors.set([shade*.985,shade,shade*1.005],i*3);
 }
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 // Direct edge incidence and signed volume are inexpensive construction
 // checks, not acceptance of the rendered material or photographic match.
 const edges=new Map();let volume=0;
 for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3),vs=ids.map(k=>new T.Vector3(...positions.slice(k*3,k*3+3)));volume+=vs[0].dot(vs[1].clone().cross(vs[2]))/6;for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3],key=a<b?a+':'+b:b+':'+a;edges.set(key,(edges.get(key)||0)+1);}}
 const nonmanifold=[...edges.values()].filter(count=>count!==2).length;
 if(nonmanifold||volume<=0||!positions.every(Number.isFinite))throw Error('Invalid closed granite stair block: '+row+'/'+index);
 g.userData.stairStone={row,index,closedManifold:true,nonmanifoldEdges:nonmanifold,signedVolume:volume,roundedArrisMetres:r,chips:chips.length,pits:pit?1:0,chipDepthMax:Math.max(0,...chips.map(chip=>chip.depth)),wearDepthMax:sheltered?0:.0026,normalPolicy:'Hard actual wall/end/bottom faces; smooth only top and millimetre arris; closed indexed topology verified before normal split',referencePhotoUsed:false};
 return g;
}

export function createGraniteEntrySteps(T,{count=20,width=5.5,height=4,front=0,back=7.8,landingCapFront=.425,landingCapThickness=.13}={}){
 const slabs=[],rise=height/count,run=(back-front)/count;let chips=0,pits=0,triangles=0,index=0;
 for(let row=0;row<count;row++){
  const cuts=[-width/2,width/2];
  for(let k=1;k<5;k++)cuts.push(-width/2+k*width/5+(row%2?.18:-.12)+.07*(hash(row*7,k)-.5));
  cuts.sort((a,b)=>a-b);
  for(let k=0;k<cuts.length-1;k++){
   const seed=7219+row*197+k*53,joint=.004+.002*hash(seed,97),x0=cuts[k]+(k?joint/2:0),x1=cuts[k+1]-(k<cuts.length-2?joint/2:0);
   const g=stoneBlock(T,{x0,x1,z0:front+row*run+.0015,z1:front+(row+1)*run,top:height*(count-row)/count-(row===0?landingCapThickness:0),thickness:rise-(row===0?landingCapThickness:0),row,index,seed,sheltered:row===0});
   slabs.push(g);chips+=g.userData.stairStone.chips;pits+=g.userData.stairStone.pits;triangles+=g.attributes.position.count/3;index++;
   if(row===0){
    // The original central platform cap extends to z.425,35mm past the
    // first riser. Replace precisely that old pale cap, retaining its actual
    // top/bottom/front dimensions and the existing lower70mm riser below it.
    const cap=stoneBlock(T,{x0,x1,z0:front+.0015,z1:landingCapFront,top:height,thickness:landingCapThickness,row,index,seed:seed+17119});
    slabs.push(cap);chips+=cap.userData.stairStone.chips;pits+=cap.userData.stairStone.pits;triangles+=cap.attributes.position.count/3;index++;
   }
  }
 }
 return {slabs,info:{count,width,height,front,back,rise,run,blocks:slabs.length,landingCaps:5,originalLandingCapBounds:{frontZ:landingCapFront,backZ:front,topY:height,bottomY:height-landingCapThickness},jointsMetres:[.004,.006],roundedArrisMetres:[.0025,.0065],sparseChips:chips,isolatedMillimetrePits:pits,wearDepthMaxMetres:.0026,triangles,allClosedManifold:true,normalPolicy:'Hard bearing faces; continuous normals only across the physical millimetre arrises',photoUsed:false}};
}
