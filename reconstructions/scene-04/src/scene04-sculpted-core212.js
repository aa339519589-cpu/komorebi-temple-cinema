import * as T from 'three';

// Imagegen-authored nonmetric scalar guide -> real thick closed sculpture.
// Only this byte field is consumed. No guide RGB or photographic material.
let field=null;
export async function loadSculptedCore212(){
 if(field)return;
 const response=await fetch(new URL('../assets/sculpture212-r11/cloud-lotus-height.gray8.bin',import.meta.url));if(!response.ok)throw Error('212 independent scalar sculpture guide failed to load');
 const raw=new Uint8Array(await response.arrayBuffer());if(raw.length!==1024*224)throw Error('212 scalar guide dimensions changed');
 const w=1024,h=224,kernel=[1,4,6,4,1],temp=new Float32Array(raw.length),data=new Float32Array(raw.length);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){let q=0;for(let k=-2;k<=2;k++)q+=raw[j*w+T.MathUtils.clamp(i+k,0,w-1)]*kernel[k+2];temp[j*w+i]=q/16;}
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){let q=0;for(let k=-2;k<=2;k++)q+=temp[T.MathUtils.clamp(j+k,0,h-1)*w+i]*kernel[k+2];data[j*w+i]=q/16;}
 field={data,mask:raw,w,h};
}
export function sampleSculptedField212(u,v){
 if(!field)throw Error('Load212 scalar before carving a bearing');const{data,w,h}=field,x=T.MathUtils.clamp(u,0,1)*(w-1),y=T.MathUtils.clamp(1-v,0,1)*(h-1),i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,at=(a,b)=>data[Math.min(h-1,b)*w+Math.min(w-1,a)]/255;return T.MathUtils.lerp(T.MathUtils.lerp(at(i,j),at(i+1,j),fx),T.MathUtils.lerp(at(i,j+1),at(i+1,j+1),fx),fy);
}
export function createSculptedCloudBody212({width=5.40,height=.76,depth=.23,back=.11,y=8.85,z=.95,region=null,outline='source',frontFloor=.045}={}){
 if(!field)throw Error('Load the independent212 scalar sculpture before construction');
 let{data,mask,w,h}=field;
 if(region){const x0=Math.floor(region[0]*(w-1)),y0=Math.floor(region[1]*(h-1)),W=Math.max(2,Math.floor((region[2]-region[0])*(w-1))),H=Math.max(2,Math.floor((region[3]-region[1])*(h-1))),d=new Float32Array(W*H),m=new Uint8Array(W*H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){d[j*W+i]=data[(j+y0)*w+i+x0];m[j*W+i]=mask[(j+y0)*w+i+x0];}data=d;mask=m;w=W;h=H;}
 const nx=w-1,ny=h-1,active=new Uint8Array(nx*ny),labels=new Int32Array(nx*ny),queue=new Int32Array(nx*ny),front=new Int32Array(w*h).fill(-1),rear=new Int32Array(w*h).fill(-1),p=[],uv=[],gilding=[],ix=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*w+i,u=((i+.5)/nx-.5)/.49,v=((j+.5)/ny-.5)/.49,inside=outline!=='ellipse'||u*u+v*v<1;active[j*nx+i]=inside&&(mask[a]+mask[a+1]+mask[a+w]+mask[a+w+1])>4*22?1:0;}
 let largest=0,best=0,label=0;
 for(let start=0;start<active.length;start++)if(active[start]&&!labels[start]){
  label++;let head=0,tail=1;queue[0]=start;labels[start]=label;
  while(head<tail){const a=queue[head++],i=a%nx,j=Math.floor(a/nx);for(const b of[i? a-1:-1,i<nx-1?a+1:-1,j?a-nx:-1,j<ny-1?a+nx:-1])if(b>=0&&active[b]&&!labels[b]){labels[b]=label;queue[tail++]=b;}}
  if(tail>largest){largest=tail;best=label;}
 }
 if(!largest)throw Error('Empty independent sculpture region');for(let i=0;i<active.length;i++)active[i]=labels[i]===best?1:0;
 const vertex=(k,rearSide)=>{
  const map=rearSide?rear:front;if(map[k]>=0)return map[k];const i=k%w,j=Math.floor(k/w),q=data[k]/255,at=p.length/3;
  p.push((i/nx-.5)*width,(.5-j/ny)*height+y,z+(rearSide?-back:frontFloor+depth*Math.pow(q,.88)));uv.push(i/nx,j/ny);gilding.push(rearSide?0:.10+.90*T.MathUtils.smoothstep(q,.42,.80));map[k]=at;return at;
 };
 const side=(p0,p1,r0,r1)=>ix.push(p0,r0,p1,p1,r0,r1);let cells=0,edges=0;
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)if(active[j*nx+i]){
  const a=j*w+i,b=a+1,c=a+w,d=c+1,af=vertex(a,false),bf=vertex(b,false),cf=vertex(c,false),df=vertex(d,false),ar=vertex(a,true),br=vertex(b,true),cr=vertex(c,true),dr=vertex(d,true);ix.push(af,cf,bf,bf,cf,df,ar,br,cr,br,dr,cr);cells++;
  if(!j||!active[(j-1)*nx+i]){side(bf,af,br,ar);edges++;}if(j===ny-1||!active[(j+1)*nx+i]){side(cf,df,cr,dr);edges++;}
  if(!i||!active[j*nx+i-1]){side(af,cf,ar,cr);edges++;}if(i===nx-1||!active[j*nx+i+1]){side(df,bf,dr,br);edges++;}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('sculpt212Gilt',new T.Float32BufferAttribute(gilding,1));g.setIndex(ix);g.computeVertexNormals();g.userData.architectureMember='scene04-212-independent-sculpted-cloud-lotus-body';g.userData.sculpt212={source:'Built-in image_gen independent nonmetric grayscale guide',scalarGrid:[w,h],region,outline,activeCells:cells,closedBoundarySegments:edges,woodBackThickness:back,frontReliefDepth:depth,frontFloor,width,height,scalarSmoothing:'Separable5-tap Gaussian for geometry only; raw mask retains actual openings',guideRGBUsedAsMaterial:false,photographicDepthClaim:false,visualAccepted:false};return g;
}
export function createCarvedGiltWood212(){
 const m=new T.MeshPhysicalMaterial({name:'scene04-212-sculpted-worn-gilt-on-dark-timber',color:'#b28a43',roughness:.62,metalness:.73,clearcoat:.025,clearcoatRoughness:.60});
 m.onBeforeCompile=s=>{
  s.vertexShader='attribute float sculpt212Gilt;varying float vSculpt212Gilt;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSculpt212Gilt=sculpt212Gilt;');
  s.fragmentShader='varying float vSculpt212Gilt;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(vec3(.035,.015,.006),diffuseColor.rgb,vSculpt212Gilt);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.90,.62,vSculpt212Gilt);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=vSculpt212Gilt;');
 };
 m.customProgramCacheKey=()=> 'scene04-212-geometry-scalar-gilding-r12';m.userData.sculpt212={materialImageUsed:false,physicalGildedWood:true};return m;
}
