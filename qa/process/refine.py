from pathlib import Path
p=Path('src/world.js');s=p.read_text()
s=s.replace("import {mergeGeometries}","import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';\nimport {mergeGeometries}")
s=s.replace("sphere:new T.SphereGeometry(1,16,12),rock:new T.IcosahedronGeometry(1,1)","sphere:new T.SphereGeometry(1,32,24),paver:new RoundedBoxGeometry(1,1,1,2,.055),rock:new T.IcosahedronGeometry(1,2)")
s=s.replace("=>instance('box',ma,x,y,z,w,h,d,[0,rot,0],tint);", "=>instance((ma==='paving'||ma==='wetStone')?'paver':'box',ma,x,y,z,w,h,d,[0,rot,0],tint);")
s=s.replace("const waterGeo=new T.ShapeGeometry(pondShape,180);waterGeo.rotateX(-Math.PI/2);", "const waterGeo=new T.ShapeGeometry(pondShape,180);")
s=s.replace("water.position.y=-.12;", "water.position.y=-.12;water.rotation.x=-Math.PI/2;")
s=s.replace("v(-.72,.37,.51)","v(-.72,.17,.51)")
s=s.replace("turbidity.value=3.2","turbidity.value=5.2").replace("rayleigh.value=1.35","rayleigh.value=1.9")
s=s.replace("sky.material.uniforms.sunPosition.value.copy(sunDir);", "sky.material.uniforms.sunPosition.value.copy(sunDir);sky.material.uniforms.cloudCoverage.value=.28;sky.material.uniforms.cloudDensity.value=.33;")
s=s.replace("scene.environmentIntensity=.28","scene.environmentIntensity=.075")
s=s.replace("'#57472a',.28","'#57472a',.16").replace("'#ffdda1',3.55","'#ffcf8a',4.1")
s=s.replace("'#ffd28b',95","'#ffd28b',40").replace("'#e6a75f',32","'#e6a75f',8")
s=s.replace("Math.sin(t*Math.PI)*.34", "Math.pow(Math.sin(t*Math.PI),.72)*.38")
s=s.replace("const a=i/(row===2?6:9)*Math.PI*2", "const a=i/(row===2?10:16)*Math.PI*2")
s=s.replace("i<(row===2?6:9)","i<(row===2?10:16)")
s=s.replace("size*(.44-row*.08),size*(.35+row*.23),size*(.44-row*.08)","size*(.48-row*.08),size*(.30+row*.2),size*(.48-row*.08)")
s=s.replace(".17,.22,.17,'oldgold'", ".11,.15,.11,'oldgold'")
s=s.replace("mat('petal','#ecb1aa'", "mat('petal','#dc9fa8'")
# Shader-based, world-scale aging and microstructure. No downloaded texture maps.
pos=s.index('const unit=')
proc='''
const procNoise=`
varying vec3 vProc;
float phash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
float pnoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(phash(i),phash(i+vec3(1,0,0)),f.x),mix(phash(i+vec3(0,1,0)),phash(i+vec3(1,1,0)),f.x),f.y),mix(mix(phash(i+vec3(0,0,1)),phash(i+vec3(1,0,1)),f.x),mix(phash(i+vec3(0,1,1)),phash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float pfbm(vec3 p){return .57*pnoise(p)+.28*pnoise(p*2.03)+.15*pnoise(p*4.07);}`;
for(const name of ['stone','paving','wetStone','cedar','red','endwood','darkwood','gold','oldgold','buddha','slate']){
 const ma=materials[name],isStone=['stone','paving','wetStone','slate'].includes(name),isMetal=['gold','oldgold','buddha'].includes(name);
 if(isMetal){ma.bumpMap=stoneTex;ma.bumpScale=.004;ma.roughness=name==='oldgold'?.48:.34;}
 ma.onBeforeCompile=shader=>{
 shader.vertexShader='varying vec3 vProc;\\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec4 pp=vec4(position,1.0);
 #ifdef USE_INSTANCING
 pp=instanceMatrix*pp;
 #endif
 vProc=(modelMatrix*pp).xyz;`);
 shader.fragmentShader=procNoise+'\\n'+shader.fragmentShader;
 let surface=isStone?`float pat=pfbm(vProc*3.0);float fine=pnoise(vProc*90.0);diffuseColor.rgb*=mix(.61,1.17,pat)*mix(.92,1.05,fine);float age=smoothstep(.6,.78,pfbm(vProc*5.3));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.77,.91,.54),age*.38);`:
 isMetal?`float pat=pfbm(vProc*17.0);diffuseColor.rgb*=mix(.66,1.09,pat);`:
 `float grain=pfbm(vProc*vec3(18.0,.7,18.0));float grain2=sin((vProc.x+vProc.z*.17)*100.0+grain*11.0);diffuseColor.rgb*=mix(.71,1.1,grain)*(1.0+grain2*.025);`;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\\n'+surface);
 if(isStone)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 float bh=pfbm(vProc*28.0);normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(bh),dFdy(bh))*.24,faceDirection);`);
 };
 ma.customProgramCacheKey=()=>name;
}
'''
s=s[:pos]+proc+s[pos:]
# Slate needs a tiny bump map to provide derivative surface functions.
s=s.replace("const ma=materials[name],isStone", "const ma=materials[name];if(name==='slate'){ma.bumpMap=stoneTex;ma.bumpScale=.006;}const isStone")
# Replace decorative pseudo-characters with procedurally typeset real calligraphy.
a=s.index('function plaque(');b=s.index('function footColumn',a)
s=s[:a]+'''function plaque(x,y,z,w,h){box(x,y,z,w+.15,h+.15,.15,'darkwood');box(x,y,z+.09,w,h,.07,'oldgold');box(x,y,z+.14,w-.14,h-.14,.06,'black');const c=document.createElement('canvas');c.width=1024;c.height=320;const cx=c.getContext('2d');cx.fillStyle='#cfa85b';cx.font='220px "Songti SC",serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText('寂 光 院',512,173);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const ma=new T.MeshStandardMaterial({map:tex,transparent:true,roughness:.42,metalness:.6});const mesh=new T.Mesh(new T.PlaneGeometry(w*.9,h*.82),ma);mesh.position.set(x,y,z+.188);mesh.updateMatrix();mesh.applyMatrix4(stack[stack.length-1]);scene.add(mesh);}
'''+s[b:]
# Additional front lintel reliefs and diagonal carved scrolls.
pos=s.index('hipRoof(6,9.65')
s=s[:pos]+'''// Deep carved transoms, floral scrolls and joinery pins along all six bays.
for(let bx of [-.88,2.55,6,9.45,12.9])group(bx,7.9,-3.88,0,()=>{box(0,0,0,3.1,.55,.13,'darkwood');for(let side of [-1,1]){const pp=[];for(let j=0;j<=35;j++){let a=j/35*Math.PI*3.4,r=.22*(1-j/42);pp.push([side*(.35+j/35*.8+Math.cos(a)*r),Math.sin(a)*r,.09]);}line(pp,.018,'oldgold',42);}sphere(0,0,.12,.17,.12,.035,'oldgold');for(let k=0;k<8;k++){let a=k*Math.PI/4;line([[0,0,.14],[Math.cos(a)*.28,Math.sin(a)*.14,.17],[Math.cos(a)*.42,Math.sin(a)*.2,.12]],.015,'gold',8);}});
'''+s[pos:]
p.write_text(s)
