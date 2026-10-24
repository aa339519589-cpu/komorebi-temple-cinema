// Angular granite mineral/patina variation in metric world space. It modifies
// physical diffuse reflectance, never the final rendered image or exposure.
export function applyStoneFinish212(material){
 if(material.userData.stoneFinish212)return material;
 const inherited=material.onBeforeCompile,key=material.customProgramCacheKey,dampCap=material.name.includes('hipped-stone-cap');
 material.onBeforeCompile=shader=>{
  inherited(shader);
  const pos=shader.fragmentShader.includes('varying vec3 r4StonePosition')?'r4StonePosition':shader.fragmentShader.includes('varying vec3 ssPosition')?'ssPosition':null;
  if(!pos||!shader.fragmentShader.includes('#include <color_fragment>'))throw Error('212 stone world-space material boundary changed');
  const normalName=pos==='r4StonePosition'?'r4StoneNormal':'ssWorldNormal';
  shader.fragmentShader=shader.fragmentShader.replace('mix(.53,1.04,smoothstep(.22,.73,damp))','mix(.82,1.04,smoothstep(.22,.73,damp))')
   .replace(/clamp\(pow\(max\(mineral,\.0001\)\/\.153180782734,\.(?:88|98)\),\.(?:38|25),1\.(?:65|95)\)/g,'clamp(pow(max(mineral,.0001)/.153180782734,.88),.72,1.26)')
   .replace('#include <common>',`#include <common>
   float stone212MicroHeight=0.;
   float stone212Hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float stone212Noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(stone212Hash(i),stone212Hash(i+vec3(1,0,0)),f.x),mix(stone212Hash(i+vec3(0,1,0)),stone212Hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(stone212Hash(i+vec3(0,0,1)),stone212Hash(i+vec3(1,0,1)),f.x),mix(stone212Hash(i+vec3(0,1,1)),stone212Hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
   vec3 stone212Clast(vec2 p){
    vec2 cell=floor(p);float nearest=9.,second=9.,pigment=.5;
    for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){
     vec2 c=cell+vec2(float(i),float(j));vec2 jitter=vec2(stone212Hash(vec3(c,1.7)),stone212Hash(vec3(c,7.1)));
     vec2 d=c+.12+.76*jitter-p;float metric=dot(d,d)+.18*abs(d.x*d.y);
     if(metric<nearest){second=nearest;nearest=metric;pigment=stone212Hash(vec3(c,19.3));}else second=min(second,metric);
    }
    return vec3(pigment,sqrt(second)-sqrt(nearest),sqrt(nearest));
   }
  `).replace('#include <color_fragment>',`#include <color_fragment>
   {vec3 mineralPoint=${pos},mineralWeight=pow(abs(normalize(${normalName})),vec3(6.));mineralWeight/=dot(mineralWeight,vec3(1.));
    vec3 mineralClast=stone212Clast(mineralPoint.zy*171.)*mineralWeight.x+stone212Clast(mineralPoint.xz*171.)*mineralWeight.y+stone212Clast(mineralPoint.xy*171.)*mineralWeight.z;
    float quartzClast=smoothstep(.73,.86,mineralClast.x),micaPocket=1.0-smoothstep(.12,.23,mineralClast.x);
    float fracture=1.-smoothstep(.012,.064,mineralClast.y),localPatina=stone212Noise(mineralPoint*3.6+vec3(3.1,11.7,8.9));
    float footprint=max(length(dFdx(mineralPoint)),length(dFdy(mineralPoint))),grainVisibility=.22+.78*(1.-smoothstep(.003,.012,footprint));
    float erodedPocket=1.-smoothstep(.29,.53,stone212Noise(mineralPoint*vec3(27.,19.,23.)+vec3(5.1,2.3,7.6)));
    diffuseColor.rgb*=.80+.24*localPatina;
    diffuseColor.rgb*=1.0-.28*micaPocket*grainVisibility-.06*fracture*grainVisibility-.24*erodedPocket;
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.27+vec3(.012,.011,.009),quartzClast*.40*grainVisibility);
    ${dampCap?'float capDamp=stone212Noise(mineralPoint*vec3(15.2,9.7,15.2)+vec3(4.1,8.3,3.9));diffuseColor.rgb*=mix(vec3(.63,.67,.53),vec3(1.02,1.00,.95),smoothstep(.42,.66,capDamp));':''}
    stone212MicroHeight=(.0012*(mineralClast.x-.5)-.00045*fracture)*grainVisibility;}
  `).replace('normal=normalize(mat3(viewMatrix)*normalize(ax*w.x+ay*w.y+az*w.z));',`normal=normalize(mat3(viewMatrix)*normalize(ax*w.x+ay*w.y+az*w.z));
    vec3 stone212Dpx=dFdx(-vViewPosition),stone212Dpy=dFdy(-vViewPosition),stone212R1=cross(stone212Dpy,normal),stone212R2=cross(normal,stone212Dpx);
    float stone212Det=dot(stone212Dpx,stone212R1);vec3 stone212Gradient=sign(stone212Det)*(dFdx(stone212MicroHeight)*stone212R1+dFdy(stone212MicroHeight)*stone212R2);
    normal=normalize(abs(stone212Det)*normal-stone212Gradient);
  `);
 };
 material.customProgramCacheKey=()=>key.call(material)+'-stone212-angular-metric-quartz-clasts-r04-'+dampCap;
 material.userData.stoneFinish212={mineralScaleMetres:[.003,.009],erosionPocketScaleMetres:[.018,.05],source:'CC0 granite scan retained; inferred filtered angular mineral albedo, metric microheight and irregular damp/erosion response',referenceImagePixelsUsed:false};return material;
}
