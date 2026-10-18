import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
import {buildMapleCanopy} from './foliage.js';
export const POSE={position:[11.87,1.02,12.94],target:[-3.64,14.93,0],fov:34};
export function buildScene(){
 const scene=new T.Scene();scene.background=new T.Color('#79b8f2');
 const materialSet=createReference4MaterialSet(T),mats=materialSet.mats;
 mats.red.color.set('#aa5030');mats.cedar.color.set('#985430');mats.endwood.color.set('#c28545');
 mats.slate.color.set('#434c51');mats.tileEdge.color.set('#a3a69f');mats.darkwood.color.set('#555b4d');mats.paper.color.set('#282e25');
 mats.gold.color.set('#e1af46');mats.oldgold.color.set('#c79a43');
 mats.gold.roughness=.40;mats.oldgold.roughness=.48;
 mats.lanternPaper=mats.paper.clone();mats.lanternPaper.name='scene05-lantern-paper';mats.lanternPaper.color.set('#efd59b');mats.lanternPaper.emissive.set('#f7d792');mats.lanternPaper.emissiveIntensity=.10;
 // All surfaces are geometry and procedural textures. Baked source photographs are never used.
 const stack=[new T.Matrix4()],bucket=new Map(),geometryCache=new Map(),columns=[];
 const primitive={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,16,10),cone:new T.ConeGeometry(1,1,16)};
 function instance(geo,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=null,tint=1){
   if(typeof geo==='string')geo=primitive[geo];if(!geo)throw Error('Unknown geometry');
   let material=mats[mat];if(!material)throw Error('Unknown material '+mat);
   const quaternion=rot?.isQuaternion?rot:new T.Quaternion().setFromEuler(new T.Euler(...(Array.isArray(rot)?rot:[0,0,0])));
   const matrix=stack.at(-1).clone().multiply(new T.Matrix4().compose(new T.Vector3(x,y,z),quaternion,new T.Vector3(sx,sy,sz)));
   if(!bucket.has(material))bucket.set(material,[]);bucket.get(material).push({geo,matrix,tint});
 }
 function group(x,y,z,angle,fn){stack.push(stack.at(-1).clone().multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationY(angle)));try{fn();}finally{stack.pop();}}
 function box(x,y,z,w,h,d,ma='cedar',rot=0,tint=1){
   if(['red','cedar','endwood','darkwood','architecture_red','architecture_cedar','architecture_endwood'].includes(ma)&&Math.min(w,h,d)>.045){
     const key=[w,h,d].map(n=>n.toFixed(5)).join(':');
     if(!geometryCache.has(key))geometryCache.set(key,new RoundedBoxGeometry(w,h,d,1,Math.min(.014,Math.min(w,h,d)*.10)));
     instance(geometryCache.get(key),ma,x,y,z,1,1,1,[0,rot,0],tint);
   }else instance('box',ma,x,y,z,w,h,d,[0,rot,0],tint);
 }
 const arch=createRestorationArchitecture({instance,group,box,materials:mats,columns,stack});
 mats.architecture_red.color.set('#b35c34');mats.architecture_cedar.color.set('#a9653d');mats.architecture_endwood.color.set('#b47538');mats.architecture_slate.color.set('#414c53');mats.architecture_tileEdge.color.set('#a9aca4');mats.architecture_gold.color.set('#e8b84f');mats.architecture_oldgold.color.set('#c99c4e');mats.architecture_darkwood.color.set('#565d50');
 for(const [name,m]of Object.entries(mats)){
   if(['red','cedar','endwood','darkwood'].some(k=>name===k||name==='architecture_'+k)){
     m.roughnessMap=null;m.roughness=name.includes('endwood')?.84:.76;m.envMapIntensity=.28;
     m.onBeforeCompile=shader=>{
       shader.vertexShader='varying vec2 vWearUv;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvWearUv=uv;');
       shader.fragmentShader='varying vec2 vWearUv;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float warped=vWearUv.x*470.+sin(vWearUv.y*24.)*2.0+sin(vWearUv.y*57.+vWearUv.x*13.)*.7;
float grain=sin(warped)*.055+sin(warped*2.31)*.032;
float aged=sin(vWearUv.x*16.+sin(vWearUv.y*8.))*.065;
float split=pow(max(0.,sin(vWearUv.x*169.+sin(vWearUv.y*12.)*.4)),30.)*smoothstep(.0,.6,sin(vWearUv.y*14.+vWearUv.x*31.));
diffuseColor.rgb*=.94+grain+aged-split*.20;
`);
     };m.customProgramCacheKey=()=> 'scene05-aged-wood-grain-v3';
   }
   if(name==='gold'||name==='architecture_gold'){m.roughness=.53;m.envMapIntensity=.64;}
   if(name==='oldgold'||name==='architecture_oldgold'){m.roughness=.63;m.envMapIntensity=.48;}
 }
 mats.lanternBronze=new T.MeshStandardMaterial({name:'scene05-lantern-aged-bronze',color:'#88602c',metalness:.86,roughness:.56,envMapIntensity:.65});
 // Lower story begins at 0.35 m; the low camera sees an architectural tower continuing beyond the top crop.
 mats.carvingGround=new T.MeshStandardMaterial({name:'scene05-dark-carved-ground',color:'#2b2116',roughness:.9});
 const leafShape=new T.Shape();leafShape.moveTo(-.5,0);leafShape.bezierCurveTo(-.15,.23,.29,.28,.5,0);leafShape.bezierCurveTo(.15,-.19,-.2,-.13,-.5,0);
 const carvedLeaf=new T.ExtrudeGeometry(leafShape,{depth:.025,steps:1,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:5});
 const levels=[];
 for(let level=0;level<5;level++){
   const scale=1-level*.075,w=8.8*scale,y=.35+level*4.75;
   box(0,y+.15,0,w+.5,.30,w+.5,'darkwood');
   const frame=arch.pagodaStoreyFrame({w,d:w,y,level,scale,roofWidth:w+3.5*scale,roofDepth:w+3.5*scale,roofRise:2.35*scale,roofY:y+3.55,windowMaterial:'paper',detail:true});
   arch.pagodaRoof({y:y+3.55,w:w+3.5*scale,d:w+3.5*scale,rise:2.35*scale,wallWidth:w,wallDepth:w,frameScale:scale,detail:true,soffitMaterial:'cedar'});
   levels.push({level,y,width:w,shaftTop:frame.shaftTop});
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     for(const xx of [-w/3,0,w/3])arch.brackets(xx,frame.bracketY,w/2,.72*scale,{detail:true,interlocked:true});
     for(const xx of [-w/2,w/2]){
       arch.squareFitting(xx,frame.shaftTop-.13,w/2+.243*scale,.36*scale,.39*scale,0,true);
     }
   });
   balcony(w,y+(level===0?.58:0),scale);
   cornerTails(w,y,scale);
   pentRoof(w,y+.32,scale);carvedWindowInserts(w,y,scale);
   // Four identical suspended lanterns, each is fixed to the outer hip beam.
   const r=(w+3.5*scale)/2;
   for(const sx of [-1,1])for(const sz of [-1,1])lantern(sx*r*.965,y+2.88,sz*r*.965,.68*scale);
   // Flanking upper ties and chased metal straps on the visible actual member ends.
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     for(let k=-1;k<=1;k++){
       const x=k*w/3;box(x,y+2.65,w/2+.026,w/3-.22,.26,.16,'red');
       arch.squareFitting(x,y+2.65,w/2+.114,.15,.15,0,true);
       if(level<4){
         box(x,y+2.65,w/2+.116,.72*scale,.205*scale,.014,'carvingGround');
         const stalk=[];for(let j=0;j<=24;j++){const q=-.32+j*.64/24;stalk.push(new T.Vector3(x+q*scale,y+2.65+Math.sin(q*11+level)*.025*scale,w/2+.132));}
         instance(new T.TubeGeometry(new T.CatmullRomCurve3(stalk),24,.007*scale,5,false),'oldgold');
         for(let j=0;j<7;j++){const q=-.28+j*.09,sgn=j%2?1:-1;instance(carvedLeaf,j%3?'oldgold':'gold',x+q*scale,y+2.65+sgn*.039*scale,w/2+.138,.13*scale,.18*scale,.13,[0,0,sgn*.65+Math.sin(level+j)*.15]);}
       }
     }
   });
 }
 function carvedWindowInserts(w,y,s){
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>group(0,y+1.57,w/2+.09,0,()=>{
     for(const side of [-1,1]){box(side*.47*s,0,0,.055*s,.72*s,.055*s,'red');box(0,side*.34*s,0,.94*s,.05*s,.055*s,'red');}
     for(let n=0;n<3;n++){
       const points=[];for(let j=0;j<=32;j++){const t=j/32,phase=t*Math.PI*2+n*Math.PI*.67;points.push(new T.Vector3((t-.5)*.86*s,Math.sin(phase)*(.19-.02*n)*s,.018+Math.sin(phase*.7)*.012));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.014*s,6,false),n%2?'oldgold':'cedar');
       for(let j=0;j<7;j++){const t=(j+.5)/7,p=points[Math.round(t*32)],sgn=j%2?1:-1;instance(carvedLeaf,j%3?'oldgold':'gold',p.x,p.y+sgn*.035*s,p.z+.014,.16*s,.22*s,.17,[0,0,sgn*.6+n*.23]);}
     }
     for(let k=0;k<5;k++){
       const cx=-.34+k*.17,points=[];for(let j=0;j<=28;j++){const a=j/28*Math.PI*1.85,r=.077*(1-j/40);points.push(new T.Vector3((cx+Math.cos(a)*r)*s,Math.sin(a)*r*s,.037));}
       instance(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.008*s,5,false),'oldgold');
     }
   }));
 }
 function cornerTails(w,y,s){
   for(const sx of [-1,1])for(const sz of [-1,1]){
     const start=new T.Vector3(sx*(w/2-.18),y+3.25,sz*(w/2-.18));
     const end=new T.Vector3(sx*(w/2+1.32*s),y+2.76,sz*(w/2+1.32*s));
     const mid=start.clone().lerp(end,.55).add(new T.Vector3(0,.06,0));
     const path=new T.CatmullRomCurve3([start,mid,end]),up=new T.Vector3(0,1,0),points=[];
     for(let j=0;j<=16;j++)points.push(path.getPoint(j/16).toArray());
     // Rectangular curved timber with real depth, connected to the crossing capital.
     const rim=new T.Shape();rim.moveTo(-.16*s,-.22*s);rim.lineTo(.16*s,-.22*s);rim.lineTo(.16*s,.22*s);rim.lineTo(-.16*s,.22*s);rim.closePath();
     const geometry=new T.ExtrudeGeometry(rim,{steps:20,bevelEnabled:false,extrudePath:path});instance(geometry,'red');
     const normal=end.clone().sub(mid).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),normal);
     const goldEnd=end.clone().addScaledVector(normal,.008);instance('box','oldgold',...goldEnd.toArray(),.317*s,.438*s,.014,q);
     group(goldEnd.x,goldEnd.y,goldEnd.z,Math.atan2(sx,sz),()=>{arch.squareFitting(0,0,.018,.30*s,.40*s,0,true);});
     // Small carved cheek leaves follow the load-bearing timber instead of floating in the bay.
     for(let j=0;j<4;j++){const p=path.getPoint(.30+j*.14);group(p.x,p.y,p.z,Math.atan2(sx,sz),()=>{instance(carvedLeaf,'oldgold',.165*s,0,0,.18*s,.14*s,.16,[0,Math.PI/2,j%2?.6:-.6]);});}
   }
 }
 function pentRoof(w,y,s){
   // A shallow annular ceramic waist eave: no roof surface exists inside the wall.
   const inner=w/2+.035,outer=w/2+.75*s;
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     const p=[],ids=[],rows=5,cols=Math.round(w/.19),profile=t=>.36*s*(1-t)**1.3+.16*s*t**5;
     for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){const t=j/rows,z=inner+(outer-inner)*t,x=(-1+2*k/cols)*(inner+(outer-inner)*t);p.push(x,y+profile(t)+.026*Math.cos(k*Math.PI*2),z);if(j<rows&&k<cols){const a=j*(cols+1)+k;ids.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}}
     const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();instance(g,'slate');
     box(0,y+.08*s,outer,w+1.50*s,.13*s,.15*s,'red');
     for(let j=0;j<=cols;j++){const x=-outer+2*outer*j/cols;arch.tileEnd(new T.Vector3(x,y+.17*s,outer+.018),0,.083*s,true);}
     for(let j=1;j<cols;j++){const x=-inner+2*inner*j/cols;box(x,y+.10*s,(inner+outer)/2,.075*s,.105*s,outer-inner,'cedar');}
   });
 }
 function balcony(w,y,s){
   const d=w+.72,base=y+.29,top=base+.82;
   for(let face=0;face<4;face++)group(0,0,0,face*Math.PI/2,()=>{
     box(0,base,d/2,d+.10,.15,.22,'red');box(0,base+.43,d/2,d+.10,.10,.14,'red');box(0,top,d/2,d+.18,.135,.19,'red');
     for(let i=0;i<=6;i++){
       const x=-d/2+i*d/6;box(x,(top+base)/2,d/2,.105,.95,.105,'red');
       if(i%2===0){instance(new T.LatheGeometry([[0,0],[.06,.015],[.09,.06],[.075,.14],[.025,.18],[0,.18]].map(p=>new T.Vector2(...p)),12),'gold',x,top+.02,d/2);
         for(let k=0;k<8;k++){const a=k*Math.PI/4;instance('sphere','oldgold',x+Math.sin(a)*.067,top+.10,d/2+Math.cos(a)*.067,.020,.074,.020);} arch.squareFitting(x,top-.09,d/2+.099,.085,.085,0,true);}
     }
   });
 }
 function lantern(x,y,z,s){
   group(x,y,z,0,()=>{
     const bronze='lanternBronze',gold='oldgold';
     function loft(profile,ma){instance(new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0]*s,p[1]*s)),12),ma);}
     function wire(points,r=.010,ma=gold){instance(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0]*s,p[1]*s,p[2]*s))),20,r*s,5,false),ma);}
     // Bottom and hood are distinct closed shells. There is no opaque wall behind the panes.
     loft([[0,-.58],[.055,-.58],[.10,-.53],[.20,-.47],[.32,-.40],[.34,-.34],[.30,-.34],[.30,-.38],[.18,-.44],[.055,-.52],[0,-.52]],bronze);
     loft([[.035,.69],[.13,.69],[.29,.50],[.49,.43],[.52,.45],[.49,.48],[.32,.55],[.15,.73],[.035,.73],[.035,.69]],bronze);
     for(const yy of [-.39,.35])loft([[.30,yy],[.35,yy],[.35,yy+.04],[.30,yy+.04],[.30,yy]],gold);
     for(let face=0;face<6;face++)group(0,0,0,face*Math.PI/3,()=>{
       box(0,-.01*s,.269*s,.29*s,.68*s,.009*s,'lanternPaper');
       for(const side of [-1,1])box(side*.157*s,-.01*s,.283*s,.024*s,.76*s,.030*s,bronze);
       for(const yy of [-.32,-.10,.14,.32])box(0,yy*s,.286*s,.31*s,.012*s,.015*s,bronze);
       box(0,-.01*s,.289*s,.010*s,.68*s,.014*s,bronze);
       // Curled leaf tracery has real holes through to luminous paper.
       for(const side of [-1,1])for(const yy of [-.21,.025,.24]){
         const pts=[];for(let j=0;j<=18;j++){const t=j/18*Math.PI*1.8,r=.038*(1-j/23);pts.push([side*(.075+Math.cos(t)*r),yy+Math.sin(t)*r,.299]);}wire(pts,.006,bronze);
       }
       // Six pierced crown petals grow between narrow rings instead of a smooth gold tube.
       for(const side of [-1,1]){
         const pts=[];for(let j=0;j<=24;j++){const a=j/24*Math.PI*2;pts.push([side*.075+.067*Math.sin(a),.96+.15*Math.cos(a),.123+.014*Math.sin(a*2)]);}wire(pts,.014,gold);
       }
       wire([[-.13,.79,.13],[-.10,1.08,.13],[0,1.22,.13],[.10,1.08,.13],[.13,.79,.13]],.012,bronze);
     });
     for(const yy of [.78,1.17])loft([[.105,yy],[.16,yy],[.16,yy+.026],[.105,yy+.026],[.105,yy]],gold);
     loft([[0,1.18],[.13,1.18],[.105,1.26],[.055,1.33],[0,1.33]],gold);
     instance(new T.CylinderGeometry(.014*s,.014*s,.34*s,8),bronze,0,1.48*s,0);
     wire([[0,-.58,0],[.02,-.64,0],[-.01,-.72,0],[0,-.78,0]],.009,gold);
     loft([[0,-.90],[.045,-.88],[.066,-.83],[.04,-.78],[0,-.77]],gold);
   });
 }
 // Sky: directional pale wisps are an analytic shader, with no image texture.
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDir;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,91.3)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 d=normalize(vDir);vec3 c=mix(vec3(.70,.83,.96),vec3(.39,.64,.94),pow(max(0.,d.y),.4));vec3 p=d*17.;float n=noise(p)+.5*noise(p*2.1)+.24*noise(p*4.4);float cloud=smoothstep(1.15,1.56,n)*smoothstep(0.,.2,d.y);c=mix(c,vec3(1.),cloud*.68);gl_FragColor=vec4(c,1.);}`});
 const sky=new T.Mesh(new T.SphereGeometry(120,32,16),skyMaterial);scene.add(sky);
 const hemi=new T.HemisphereLight('#cce5ff','#a3784c',1.12);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff0ce',4.4);sun.position.set(-18,30,23);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(3072,3072);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.00015;sun.shadow.normalBias=.025;sun.shadow.radius=1.5;scene.add(sun,sun.target);
 // Procedural environment radiance provides directional metal reflections.
 const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const cx=c.getContext('2d'),gr=cx.createLinearGradient(0,0,0,64);gr.addColorStop(0,'#c7defa');gr.addColorStop(.5,'#b4c2c2');gr.addColorStop(1,'#6b4b2c');cx.fillStyle=gr;cx.fillRect(0,0,64,64);faces.push(c);}
 const env=new T.CubeTexture(faces);env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.85;
 const canopy=buildMapleCanopy(scene);
 // Flatten static geometry by material: dense joinery remains real 3D but submission cost stays bounded.
 let triangles=0,parts=0;
 for(const [material,records]of bucket){
   const pieces=records.map(({geo,matrix,tint})=>{
     const g=geo.index?geo.toNonIndexed():geo.clone();g.applyMatrix4(matrix);
     for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
     const n=g.attributes.position.count;if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
     return g;
   });
   const geo=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geo)throw Error('Unable to merge '+material.name);
   const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);triangles+=geo.attributes.position.count/3;parts+=records.length;
 }
 return {scene,info:()=>({reference:5,revision:'scene05-upper-tier-low-ground-camera-v5',levels,triangles,parts,geometry:'True 3D four-sided joinery, ceramic rows, gilded metal fittings, lanterns, individual lobed leaves',canopy,cameraHeightRange:[.72,1.02]}),dispose(){scene.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());env.dispose();skyMaterial.dispose();}};
}
