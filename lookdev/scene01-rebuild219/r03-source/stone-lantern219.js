import * as T from 'three';
import {TAU,V,noise,rng} from './kernel.js';
import {mossSkin132} from './garden-surface132.js';

// Authored stone solids. The photograph is used for proportion review only.
// The shaft, bowl, firebox, thick stone roof and carved bud exist in every view.
export function buildStoneLantern219(B){
 const own=g=>{B.resources.add(g);g.userData.authored219=true;return g;},random=rng(2191901),rr=(a,b)=>a+(b-a)*random();
 const stone=new T.MeshStandardMaterial({name:'lantern219-fine-weathered-granite',color:0x787367,roughness:.94});
 const grain=`float gh(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}float gn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(gh(i),gh(i+vec3(1,0,0)),f.x),mix(gh(i+vec3(0,1,0)),gh(i+vec3(1,1,0)),f.x),f.y),mix(mix(gh(i+vec3(0,0,1)),gh(i+vec3(1,0,1)),f.x),mix(gh(i+vec3(0,1,1)),gh(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
 stone.onBeforeCompile=s=>{s.vertexShader='varying vec3 vGranite219;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGranite219=position;');s.fragmentShader='varying vec3 vGranite219;\n'+grain+'\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float broad=gn(vGranite219*vec3(8.,5.,8.)),mineral=gn(vGranite219*148.),quartz=gn(vGranite219*317.);float dark=smoothstep(.64,.79,mineral);diffuseColor.rgb*=.72+.32*broad+.18*quartz;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.065,.062,.052),dark*.28);diffuseColor.rgb+=vec3(.016,.014,.010)*smoothstep(.76,.88,quartz);`);s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 float graniteHeight=.0015*gn(vGranite219*87.)+.0005*gn(vGranite219*219.);vec3 surface219=-vViewPosition,q0=dFdx(surface219),q1=dFdy(surface219),r1=cross(q1,normal),r2=cross(normal,q0);float det219=dot(q0,r1);vec3 grad219=sign(det219)*(dFdx(graniteHeight)*r1+dFdy(graniteHeight)*r2);normal=normalize(abs(det219)*normal-grad219);`);};stone.customProgramCacheKey=()=> 'granite219-eroded-differential-mineral-r03';
 const edge=stone.clone();edge.name='lantern219-worn-granite-arrises';edge.color.setHex(0x888171);edge.onBeforeCompile=stone.onBeforeCompile;edge.customProgramCacheKey=stone.customProgramCacheKey;
 const roofStone=stone.clone();roofStone.name='lantern219-damp-ancient-roof';roofStone.color.setHex(0x514e43);roofStone.roughness=.88;roofStone.onBeforeCompile=stone.onBeforeCompile;roofStone.customProgramCacheKey=stone.customProgramCacheKey;
 const moss=B.m.moss.clone();moss.name='lantern219-ochre-olive-moss';moss.color.setHex(0x6b7735);moss.bumpScale=.010;moss.roughness=.99;
 Object.assign(B.m,{lantern219Stone:stone,lantern219Edge:edge,lantern219Roof:roofStone,lantern219Moss:moss});
 function turned(profile,name,lobed=0){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),r=Math.hypot(x,z);if(r>.001){const f=1+.008*noise(x*12+y*3,z*12,219)+lobed*Math.cos(a*12)*Math.sin(Math.PI*T.MathUtils.clamp((y-3.91)/.61,0,1));x*=f;z*=f;}p.setXYZ(i,x,y,z);}g.computeVertexNormals();g.name=name;return own(g);}
 const base=turned([[0,0],[.62,0],[.73,.06],[.77,.16],[.74,.25],[.63,.32],[.50,.36],[.45,.40],[.39,.49],[.36,.59],[.335,.70],[.33,1.35],[.35,1.45],[.44,1.52],[.57,1.58],[.64,1.66],[.69,1.76],[.67,1.88],[.59,1.94],[0,1.94]],'lantern219-rounded-foot-shaft-and-lotus-bowl');
 const sill=turned([[0,1.90],[.58,1.90],[.64,1.94],[.70,2.00],[.71,2.10],[.67,2.17],[0,2.17]],'lantern219-firebox-deep-sill');
 const crown=turned([[0,3.73],[.18,3.73],[.22,3.77],[.24,3.84],[.22,3.90],[.20,3.94],[.25,4.00],[.29,4.12],[.30,4.25],[.27,4.38],[.20,4.47],[.12,4.51],[.07,4.53],[0,4.54]],'lantern219-lobed-rounded-lotus-bud',.060);
 const roofPoint=(t,a)=>{const r=.99-.78*t,squircle=1/Math.pow(Math.abs(Math.cos(a))**4+Math.abs(Math.sin(a))**4,.25),rad=r*squircle*(1+.008*Math.sin(a*19)),x=Math.cos(a)*rad,z=Math.sin(a)*rad,corner=Math.abs(Math.sin(a*2))**8,y=3.16+.62*t**1.42+.14*(1-t)**7*corner+.012*Math.sin(a*11+t*8)+.016*noise(x*9,z*9,219);return[x,y,z];};
 const p=[],uv=[],ix=[],N=96,R=24,count=(N+1)*(R+1);for(const lower of[false,true])for(let j=0;j<=R;j++)for(let k=0;k<=N;k++){const [x,y,z]=roofPoint(j/R,k/N*TAU);p.push(x,y-(lower?.205-.060*j/R:0),z);uv.push(x,z);}for(let j=0;j<R;j++)for(let k=0;k<N;k++){const a=j*(N+1)+k,b=a+1,c=a+N+1,d=c+1;ix.push(a,c,b,b,c,d,count+a,count+b,count+c,count+b,count+d,count+c);}for(const ring of[0,R])for(let k=0;k<N;k++){const a=ring*(N+1)+k,b=a+1;if(!ring)ix.push(a,b,count+a,b,count+b,count+a);else ix.push(a,count+a,b,b,count+a,count+b);}const roof=own(new T.BufferGeometry());roof.name='lantern219-thick-closed-eroded-hipped-stone-roof';roof.setAttribute('position',new T.Float32BufferAttribute(p,3));roof.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roof.setIndex(ix);roof.computeVertexNormals();
 const scroll=own(new T.TubeGeometry(new T.CatmullRomCurve3([[-.25,-.025,0],[-.18,.045,0],[-.10,.060,0],[0,-.015,0],[.10,.060,0],[.18,.045,0],[.25,-.025,0]].map(V)),26,.012,5,false)),rosette=own(new T.SphereGeometry(1,10,6)),tuft=own(new T.ConeGeometry(.005,.023,4));
 const roofMoss=own(mossSkin132(roof));roofMoss.name='lantern219-closed-moss-carpet-conforming-to-stone-roof';
 B.label('garden219-complete-weathered-stone-lantern',()=>B.with(5.44,.30,6.16,.035,()=>{
  B.emit(base,'lantern219Stone');B.emit(sill,'lantern219Edge');B.emit(roof,'lantern219Roof');B.emit(roofMoss,'lantern219Moss');B.emit(crown,'lantern219Roof');
  // Low stone relief is continuous with the bowl. Its varying exposed depth
  // keeps the frieze legible in grazing light without a printed relief plane.
  for(let face=0;face<8;face++)B.with(0,0,0,face*TAU/8,()=>{B.emit(scroll,'lantern219Edge',0,1.82,.632);for(let pet=0;pet<6;pet++){const a=pet*TAU/6;B.emit(rosette,'lantern219Stone',Math.cos(a)*.075,1.82+Math.sin(a)*.055,.645,.044,.030,.016,[0,0,a]);}B.emit(rosette,'lantern219Edge',0,1.82,.66,.027,.027,.013);});
  // The four apertures open into the actual firebox. Recessed warm panels
  // are behind the carved stone lattice and corner jambs, never in front.
  for(const x of[-.55,.55])for(const z of[-.55,.55]){B.box(x,2.64,z,.165,.94,.165,'lantern219Edge');B.box(x,2.20,z,.195,.09,.195,'lantern219Stone');B.box(x,3.075,z,.195,.10,.195,'lantern219Stone');}
  B.box(0,3.10,0,1.32,.17,1.32,'lantern219Stone');
  for(let face=0;face<4;face++)B.with(0,0,0,face*Math.PI/2,()=>{
   B.box(0,2.64,.475,.945,.86,.018,'paperGlow');
   for(const x of[-.46,.46])B.box(x,2.64,.591,.075,.94,.10,'lantern219Stone');
   for(const y of[2.19,3.09])B.box(0,y,.589,1.02,.095,.11,'lantern219Edge');
   for(const x of[-.30,-.10,.10,.30])for(let row=0;row<4;row++){const y=2.30+row*.205,side=(row+Math.round((x+.3)*5))%2?1:-1;B.box(x,y+.055,.588,.026,.168,.058,'lantern219Roof');B.box(x+side*.045,y+.135,.588,.11,.024,.058,'lantern219Roof');}
   for(const y of[2.43,2.84])B.box(0,y,.588,.86,.026,.058,'lantern219Roof');
  });
  // Patch boundaries follow the stone roof in physical space. Small rooted
  // cushions break the old smooth black cap and the straight yellow outline.
  for(let k=0;k<1500;k++){const a=k*2.399963,t=rr(.025,.96),[x,y,z]=roofPoint(t,a),field=.62*noise(x*3.3,z*3.3,219)+.38*noise(x*12,z*12,221);if(field<.45)continue;B.emit(tuft,'lantern219Moss',x,y+.007,z,rr(.65,1.15),rr(.7,1.5),rr(.65,1.15),[rr(-.22,.22),a,rr(-.22,.22)],rr(.75,1.15));if(k%8===0)B.emit(rosette,'lantern219Moss',x,y+.006,z,rr(.025,.052),rr(.010,.022),rr(.025,.050),0,rr(.70,1.15));}
  for(let k=0;k<180;k++){const a=rr(0,TAU),y=rr(.04,.30),r=y<.16?.73+(y-.06)*.4:.77-(y-.16)*.8;B.emit(rosette,'lantern219Moss',Math.cos(a)*r,y,Math.sin(a)*r,rr(.025,.045),rr(.014,.025),rr(.025,.045),0,rr(.7,1.15));}
 }));
 return{revision:219,position:[5.44,.30,6.16],construction:'Rounded 64-sided granite foot and shaft, turned carved bowl, four recessed firebox apertures, closed .145-.205m stone roof and twelve-lobed rounded lotus bud; closed surface-conformed moss carpet plus attached volumetric cushions',newImageAssets:false};
}
