import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createRestorationArchitecture} from './architecture.js';
import {createReference4MaterialSet} from './materials.js';
import {buildMapleCanopy} from './foliage.js';
import {loadBlenderJoinery} from './blender-joinery.js';
import {installScannedTimber,assignMetricTimberUV} from './scanned-timber.js';
export const POSE={position:[11.87,1.02,12.94],target:[-3.64,14.93,0],fov:34};
export async function buildScene(){
 const scene=new T.Scene();scene.background=new T.Color('#79b8f2');
 const materialSet=createReference4MaterialSet(T),mats=materialSet.mats;
 mats.red.color.set('#aa5030');mats.cedar.color.set('#985430');mats.endwood.color.set('#c28545');
 mats.slate.color.set('#434c51');mats.tileEdge.color.set('#a3a69f');mats.darkwood.color.set('#555b4d');mats.paper.color.set('#282e25');
 mats.gold.color.set('#e1af46');mats.oldgold.color.set('#c79a43');
 mats.gold.roughness=.40;mats.oldgold.roughness=.48;
 mats.lanternPaper=mats.paper.clone();mats.lanternPaper.name='scene05-lantern-paper';mats.lanternPaper.color.set('#f2e5bb');mats.lanternPaper.emissive.set('#f7d792');mats.lanternPaper.emissiveIntensity=.12;
 // Private cap surfaces keep the glazed ceramic recess distinct from the roof.
 mats.tileEndCeramic=mats.slate.clone();mats.tileEndCeramic.name='scene05-dark-inset-tile-cap';mats.tileEndCeramic.color.set('#29343c');mats.tileEndCeramic.roughness=.62;
 mats.tileEndRelief=mats.slate.clone();mats.tileEndRelief.name='scene05-worn-ceramic-floral-relief';mats.tileEndRelief.color.set('#4b514b');mats.tileEndRelief.roughness=.73;

 const joineryKit=await loadBlenderJoinery();Object.assign(mats,joineryKit.materials);
 // Solid code-built geometry and the user-authorized image-assisted relief.
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
 const arch=createRestorationArchitecture({instance,group,box,materials:mats,columns,stack,joineryKit});
 mats.architecture_red.color.set('#b35c34');mats.architecture_cedar.color.set('#a9653d');mats.architecture_endwood.color.set('#b47538');mats.architecture_slate.color.set('#414747');mats.architecture_tileEdge.color.set('#a9aca4');mats.architecture_gold.color.set('#e8b84f');mats.architecture_oldgold.color.set('#c99c4e');mats.architecture_darkwood.color.set('#565d50');
 mats.windowBars=mats.architecture_darkwood.clone();mats.windowBars.name='scene05-weathered-gray-window-bars';mats.windowBars.color.set('#858b7c');mats.windowBars.roughnessMap=null;mats.windowBars.roughness=.87;mats.windowBars.envMapIntensity=.25;
 for(const [name,m]of Object.entries(mats)){
   if(['red','cedar','endwood','darkwood'].some(k=>name===k||name==='architecture_'+k)){
     m.roughnessMap=null;m.roughness=name.includes('endwood')?.84:.76;m.envMapIntensity=.28;m.bumpScale=.006;
     m.onBeforeCompile=shader=>{
       shader.vertexShader='varying vec2 vWearUv;\n'+shader.vertexShader;
       shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvWearUv=uv;');
       shader.fragmentShader='varying vec2 vWearUv;\n'+shader.fragmentShader;
       shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float warped=vWearUv.x*470.+sin(vWearUv.y*24.)*2.0+sin(vWearUv.y*57.+vWearUv.x*13.)*.7;
float grainFilter=1.-smoothstep(.65,2.5,fwidth(warped));
float grain=(sin(warped)*.055+sin(warped*2.31)*.032)*grainFilter;
float aged=sin(vWearUv.x*16.+sin(vWearUv.y*8.))*.065;
float split=pow(max(0.,sin(vWearUv.x*169.+sin(vWearUv.y*12.)*.4)),30.)*smoothstep(.0,.6,sin(vWearUv.y*14.+vWearUv.x*31.));
diffuseColor.rgb*=.94+grain+aged-split*.20;
`);
     };m.customProgramCacheKey=()=> 'scene05-aged-wood-grain-v3';
   }
   if(name==='gold'||name==='architecture_gold'){m.roughness=.50;m.envMapIntensity=1.2;}
   if(name==='oldgold'||name==='architecture_oldgold'){m.roughness=.58;m.envMapIntensity=.88;}
 }
 mats.lanternBronze=new T.MeshStandardMaterial({name:'scene05-lantern-aged-bronze',color:'#88602c',metalness:.86,roughness:.56,envMapIntensity:.65});
 const scannedTimber=await installScannedTimber(mats);
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
     for(const xx of [-w/3,0,w/3])arch.brackets(xx,frame.purlinTop-.13*scale-.82*.64*scale,w/2,.64*scale,{detail:true,interlocked:true,horizontalScale:1.12});
     for(const xx of [-w/2,w/2]){
       arch.squareFitting(xx,frame.shaftTop-.13,w/2+.243*scale,.36*scale,.39*scale,0,true);
     }
   });
   balcony(w,y+(level===0?.58:0),scale);
   cornerTails(w,y,scale);
   pentRoof(w,y+.32,scale);carvedWindowInserts(w,y,scale);
   // Four identical suspended lanterns, each is fixed to the outer hip beam.
   const r=(w+3.5*scale)/2;
   for(const sx of [-1,1])for(const sz of [-1,1])lantern(sx*r*1.025,y+2.60,sz*r*1.025,.76*scale);
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
     const start=new T.Vector3(sx*(w/2+1.65*s),y+3.95,sz*(w/2+1.65*s));
     const end=new T.Vector3(sx*(w/2+1.60*s),y+1.85,sz*(w/2+1.60*s));
     const mid=start.clone().lerp(end,.55).add(new T.Vector3(sx*.015,.025,sz*.015));
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
     function loft(profile,ma,segments=6){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[0]*s,p[1]*s)),segments,-Math.PI/6);instance(g.toNonIndexed(),ma);}
     function wire(points,r=.010,ma=gold){instance(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0]*s,p[1]*s,p[2]*s))),Math.max(12,points.length*3),r*s,6,false),ma);}
     function ring(y,r,t=.012,ma=gold){loft([[r-t,y-t],[r+t,y-t],[r+t,y+t],[r-t,y+t],[r-t,y-t]],ma);}
     const petalKey='scene05-pierced-lantern-petal';
     if(!geometryCache.has(petalKey)){
       const shape=new T.Shape();shape.moveTo(0,0);shape.bezierCurveTo(.035,.025,.050,.085,0,.135);shape.bezierCurveTo(-.050,.085,-.035,.025,0,0);
       const aperture=new T.Path();aperture.moveTo(0,.026);aperture.bezierCurveTo(-.021,.047,-.029,.080,0,.109);aperture.bezierCurveTo(.029,.080,.021,.047,0,.026);shape.holes.push(aperture);
       geometryCache.set(petalKey,new T.ExtrudeGeometry(shape,{depth:.012,steps:1,bevelEnabled:true,bevelThickness:.0025,bevelSize:.0025,bevelSegments:1,curveSegments:7}));
     }
     const petal=geometryCache.get(petalKey);
     const crownKey='scene05-pierced-lantern-crown';
     if(!geometryCache.has(crownKey)){
       const shape=new T.Shape();shape.moveTo(-.078,.825);shape.lineTo(.078,.825);shape.lineTo(.071,1.18);shape.quadraticCurveTo(0,1.245,-.071,1.18);shape.closePath();
       for(const cy of[.91,1.09]){const hole=new T.Path();hole.moveTo(0,cy-.071);hole.bezierCurveTo(-.049,cy-.030,-.049,cy+.030,0,cy+.071);hole.bezierCurveTo(.049,cy+.030,.049,cy-.030,0,cy-.071);shape.holes.push(hole);}
       geometryCache.set(crownKey,new T.ExtrudeGeometry(shape,{depth:.012,steps:1,bevelEnabled:true,bevelThickness:.0025,bevelSize:.0025,bevelSegments:1,curveSegments:7}));
     }
     const crownPanel=geometryCache.get(crownKey);

     // Closed stepped six-hip hood, rolled eave and an enclosed faceted bowl.
     // The shade seats on the top chassis ring; no open cylinder faces remain.
     loft([[0,.79],[.07,.79],[.13,.72],[.28,.58],[.46,.48],[.53,.49],[.54,.46],[.51,.425],[.37,.435],[.27,.49],[.12,.73],[.055,.755],[0,.755]],bronze);
     ring(.455,.525,.018,gold);ring(.50,.465,.009,gold);
     loft([[0,-.68],[.045,-.68],[.085,-.60],[.15,-.54],[.29,-.43],[.35,-.38],[.35,-.34],[.31,-.34],[.27,-.40],[.13,-.51],[.055,-.60],[0,-.61]],bronze);
     for(const yy of[-.36,.36])ring(yy,.342,.019,gold);
     ring(-.43,.282,.010,gold);
     for(let face=0;face<6;face++)group(0,0,0,face*Math.PI/3,()=>{
       // Recessed paper is behind a solid chased six-corner metal chassis.
       box(0,0,.277*s,.273*s,.716*s,.010*s,'lanternPaper');
       for(const side of[-1,1]){
         box(side*.157*s,0,.294*s,.024*s,.76*s,.038*s,bronze);
         box(side*.155*s,0,.316*s,.009*s,.73*s,.009*s,gold);
         for(const yy of[-.30,0,.30])instance('sphere',gold,side*.155*s,yy*s,.322*s,.015*s,.015*s,.008*s);
       }
       for(const yy of[-.35,.35])box(0,yy*s,.304*s,.31*s,.026*s,.025*s,bronze);
       // Every floral leaf is a closed extruded ribbon with a real aperture.
       // Two four-petal flowers and joining volutes replace the thin box grid.
       for(const yy of[-.175,.175]){
         for(let k=0;k<4;k++)instance(petal,k%2?gold:bronze,0,yy*s,.309*s,s,s,s,[0,0,k*Math.PI/2]);
         instance(new T.TorusGeometry(.028*s,.007*s,6,20),gold,0,yy*s,.324*s);
         for(const side of[-1,1])wire([[side*.145,yy+.12,.312],[side*.09,yy+.105,.319],[side*.13,yy+.045,.312]],.007,gold);
       }
       wire([[0,-.045,.316],[.085,0,.316],[0,.045,.316],[-.085,0,.316],[0,-.045,.316]],.007,bronze);
       // Scalloped pierced drum and rolled collars above the shade.
       instance(crownPanel,gold,0,0,.133*s,s,s,s);
       box(0,.985*s,.149*s,.012*s,.31*s,.016*s,bronze);
       for(const side of[-1,1]){
         wire([[side*.015,.84,.150],[side*.11,.90,.166],[side*.09,1.06,.160],[0,1.145,.150]],.012,gold);
         instance(petal,gold,side*.065*s,.855*s,.154*s,.68*s,1.35*s,.7*s,[0,0,side*.28]);
       }
       // Upturned hip tip and small stamped leaf remain attached to the hood.
       wire([[-.25,.465,.425],[0,.48,.490],[0,.535,.515]],.012,gold);
     });
     for(const yy of[.80,1.18])ring(yy,.16,.018,gold);
     loft([[0,1.18],[.12,1.18],[.105,1.23],[.065,1.27],[.045,1.33],[0,1.33]],gold,12);
     // Alternating oval links carry the cap to its retained real beam anchor.
     for(let j=0;j<5;j++)instance(new T.TorusGeometry(.029*s,.0075*s,6,18),j%2?gold:bronze,0,(1.34+j*.058)*s,0,.82,1.30,.82,[0,j%2?Math.PI/2:0,0]);
     wire([[-Math.sign(x)*.22/s,1.65,-Math.sign(z)*.22/s],[0,1.65,0]],.014,bronze);
     box(0,1.638*s,0,.085*s,.030*s,.085*s,bronze);
     // A linked hanging pendant and fluted finial close the lower cup.
     for(let j=0;j<3;j++)instance(new T.TorusGeometry(.023*s,.0055*s,6,16),gold,0,(-.69-j*.044)*s,0,.8,1.18,.8,[0,j%2?Math.PI/2:0,0]);
     loft([[0,-.97],[.023,-.97],[.055,-.92],[.064,-.875],[.043,-.83],[.015,-.815],[0,-.815]],gold,12);
     for(let k=0;k<6;k++){const a=k*Math.PI/3;wire([[Math.sin(a)*.025,-.95,Math.cos(a)*.025],[Math.sin(a)*.060,-.88,Math.cos(a)*.060],[Math.sin(a)*.025,-.83,Math.cos(a)*.025]],.0045,bronze);}
   });
 }
 // Sky: directional pale wisps are an analytic shader, with no image texture.
 const skyMaterial=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vDir;float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,91.3)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}void main(){vec3 d=normalize(vDir);vec3 c=mix(vec3(.70,.83,.96),vec3(.39,.64,.94),pow(max(0.,d.y),.4));vec3 p=d*17.;float n=noise(p)+.5*noise(p*2.1)+.24*noise(p*4.4)+.12*noise(p*8.8)+.065*noise(p*17.6);float cloud=smoothstep(1.08,1.37,n)*smoothstep(0.,.2,d.y);c=mix(c,vec3(1.),cloud*.85);vec3 desired=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));const mat3 inverseOutput=mat3(.64303825,.05926869,.00596190,.31118675,.93143649,.06392902,.04577546,.00929492,.93011838);const mat3 inverseInput=mat3(1.76474097,-.14702785,-.03633683,-.67577768,1.16025151,-.16243644,-.08896329,-.01322366,1.19877327);vec3 v=inverseOutput*desired;vec3 A=1.-.983729*v;vec3 B=.0245786-.432951*v;vec3 C=-.000090537-.238081*v;vec3 fitted=(-B+sqrt(B*B-4.*A*C))/(2.*A);vec3 radiance=max(vec3(0.),inverseInput*fitted)*(.6/.95);gl_FragColor=vec4(radiance,1.);}`});
 const sky=new T.Mesh(new T.SphereGeometry(120,32,16),skyMaterial);scene.add(sky);
 const hemi=new T.HemisphereLight('#cce5ff','#a3784c',.50);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff0ce',4.4);sun.position.set(-18,30,23);sun.target.position.set(0,9,0);sun.castShadow=true;
 sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-17,right:17,top:24,bottom:-12,near:1,far:85});sun.shadow.bias=-.000025;sun.shadow.normalBias=.006;sun.shadow.radius=1.2;sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;scene.add(sun,sun.target);
 const groundBounce=new T.DirectionalLight('#ffbf83',.20);groundBounce.position.set(2,.35,15);groundBounce.target.position.set(0,12,0);scene.add(groundBounce,groundBounce.target);
 // Procedural environment radiance provides directional metal reflections.
 const faces=[],sunDirection=new T.Vector3(-18,21,23).normalize();
 for(let face=0;face<6;face++){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(128,128);
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
     const u=(x+.5)/64-1,v=(y+.5)/64-1;
     const directions=[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]],d=new T.Vector3(...directions[face]).normalize();
     const t=T.MathUtils.smoothstep(d.y,-.12,.4),sun=Math.pow(Math.max(0,d.dot(sunDirection)),550)*.65;
     const foliage=.035*Math.sin(d.x*47+d.z*23)*Math.sin(d.z*37-d.y*17),i=(y*128+x)*4;
     const ground=[.55+foliage,.48+foliage,.34],sky=[.55+.2*d.y,.73+.1*d.y,.94];
     for(let k=0;k<3;k++)pixels.data[i+k]=Math.round(255*Math.min(1,ground[k]*(1-t)+sky[k]*t+sun));pixels.data[i+3]=255;
   }
   ctx.putImageData(pixels,0,0);faces.push(canvas);
 }
 const env=new T.CubeTexture(faces);env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.50;
 const canopy=buildMapleCanopy(scene);
 // Flatten static geometry by material: dense joinery remains real 3D but submission cost stays bounded.
 let triangles=0,parts=0;
 for(const [material,records]of bucket){
   const pieces=records.map(({geo,matrix,tint})=>{
     const g=geo.index?geo.toNonIndexed():geo.clone();
     if(material.userData.metricTimberGrain)assignMetricTimberUV(g,matrix);
     g.applyMatrix4(matrix);
     for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
     const n=g.attributes.position.count;if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));
     return g;
   });
   const geo=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());if(!geo)throw Error('Unable to merge '+material.name);
   const mesh=new T.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);triangles+=geo.attributes.position.count/3;parts+=records.length;
 }
 return {scene,info:()=>({reference:5,revision:'scene05-pierced-gilt-lantern-and-inset-ceramic-medallions-detail52',levels,triangles,parts,geometry:'Source-built beveled solid joinery, real half laps, displaced gilt fittings, ceramic rows and lobed leaves',joineryKit:joineryKit.info,timber:scannedTimber.info,canopy,cameraHeightRange:[.72,1.02]}),dispose(){scene.traverse(o=>{o.geometry?.dispose();});Object.values(mats).forEach(m=>m.dispose());joineryKit.dispose();scannedTimber.dispose();env.dispose();skyMaterial.dispose();}};
}
