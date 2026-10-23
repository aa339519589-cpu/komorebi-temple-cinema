import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createRootMoss108} from './scene03-root-surfaces108.js';
import {createToroStoneRoof211} from './scene03-stone-lantern211.js';

// A supported, thinly weathered granite toro. Every stone part has volume;
// the light chamber is genuinely open behind its mullions and stone piers.
export async function createCarvedToro03({emit,at,between,sweep,ell,mats,textures,moss,warm,woodDark}){
 const loader=new T.TextureLoader(),maps=await Promise.all(['diff','nor_gl','rough'].map(name=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${name}.png`,import.meta.url).href)));
 maps.forEach((map,i)=>{map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.anisotropy=8;if(i===0)map.colorSpace=T.SRGBColorSpace;textures.add(map);});
 const stone=new T.MeshStandardMaterial({name:'scene03-carved-weathered-toro-granite',color:'#dce0dc',map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(.43,.43),roughnessMap:maps[2],roughness:.94,vertexColors:true});mats.toroGranite105=stone;
 const dark=stone.clone();dark.name='scene03-sheltered-carved-granite-recess';dark.color.set('#a4b9c3');mats.toroRecess105=dark;
 const geometryCache=new Map();
 const fract=x=>x-Math.floor(x),hash=(x,y,z)=>fract(Math.sin(x*127.1+y*311.7+z*73.1)*43758.5453),noise=(x,y,z)=>{
  const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),u=T.MathUtils.smoothstep(x-i,0,1),v=T.MathUtils.smoothstep(y-j,0,1),w=T.MathUtils.smoothstep(z-k,0,1),mix=T.MathUtils.lerp;
  return mix(mix(mix(hash(i,j,k),hash(i+1,j,k),u),mix(hash(i,j+1,k),hash(i+1,j+1,k),u),v),mix(mix(hash(i,j,k+1),hash(i+1,j,k+1),u),mix(hash(i,j+1,k+1),hash(i+1,j+1,k+1),u),v),w);
 };
 const capMoss=(x,z)=>{const f=.57*noise(x*6.3+3,.7,z*6.3)+.28*noise(x*14.2,1.8,z*14.2)+.15*noise(x*31.1,3.4,z*31.1);return T.MathUtils.smoothstep(f,.40,.61);};
 function surface(g,tag){
  g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,uv=[],colors=[];
  for(let k=0;k<p.count;k++){
   const x=p.getX(k),y=p.getY(k),z=p.getZ(k),ax=[Math.abs(n.getX(k)),Math.abs(n.getY(k)),Math.abs(n.getZ(k))].indexOf(Math.max(Math.abs(n.getX(k)),Math.abs(n.getY(k)),Math.abs(n.getZ(k))));
   uv.push((ax===0?z:x)/.23,(ax===1?z:y)/.23);
   const age=.70+.22*noise(x*5.2+3,y*4.9,z*5.2)+.10*noise(x*23,y*21+4,z*23),c=new T.Color().setRGB(age*.99,age,age*.97);
   if(tag.includes('heavy-hipped'))c.lerp(new T.Color().setRGB(.23,.37,.13),capMoss(x,z)*T.MathUtils.smoothstep(n.getY(k),.18,.7)*.88);
   colors.push(...c.toArray());
  }
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.name=tag;return g;
 }
 function block(p,s,r=.008,m=stone){const key=s.join(':')+':'+r;let g=geometryCache.get(key);if(!g){g=surface(new RoundedBoxGeometry(...s,2,r),'toro-closed-chamfered-stone');geometryCache.set(key,g);}emit(g,m,p);}
 const roofRecipe211=createToroStoneRoof211(T),roof=surface(roofRecipe211.geometry,'toro-closed-heavy-hipped-curved-kasa211-r08');
 const finial=new T.LatheGeometry([[0,0],[.13,0],[.18,.035],[.17,.07],[.10,.105],[.11,.13],[.16,.18],[.17,.24],[.145,.31],[.085,.37],[.045,.40],[0,.46]].map(([x,y])=>new T.Vector2(x,y)),36);surface(finial,'toro-closed-lotus-bud-finial');
 const coving=new T.LatheGeometry([[0,-.06],[.40,-.06],[.40,0],[.365,.045],[.315,.09],[.28,.14],[0,.14]].map(([x,y])=>new T.Vector2(x,y)),4);coving.rotateY(Math.PI/4);surface(coving,'toro-chamfered-lamp-bowl');
 const wornPanel=(()=>{
  // Fragmentary shallow chisel/erosion channels are actual depressions.
  // They do not purport to transcribe the obscured historical inscription.
  const nx=38,ny=96,p=[],ids=[],count=(nx+1)*(ny+1),strokes=[[-.046,.20,.024,.216,.0037],[-.010,.185,-.025,.123,.0025],[-.060,.055,.052,.090,.0032],[-.030,-.025,.038,-.003,.0038],[.015,-.095,.004,-.16,.0030],[-.050,-.245,.028,-.216,.0034]],
   depth=(x,y)=>{let d=0;for(const[ax,ay,bx,by,w]of strokes){const t=T.MathUtils.clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2),0,1),distance=Math.hypot(x-ax-t*(bx-ax),y-ay-t*(by-ay));d=Math.max(d,.0042*Math.exp(-((distance/w)**2)));}return d;};
  for(let side=0;side<2;side++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const x=-.1175+.235*i/nx,y=-.34+.68*j/ny;p.push(x,y,side?-.021:-depth(x,y)+.00025*Math.sin(x*93+y*77)*Math.sin(y*29));}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ids.push(a,b,c,b,d,c,c+count,b+count,a+count,c+count,d+count,b+count);}
  const rim=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:ny},(_,j)=>(j+1)*(nx+1)+nx),...Array.from({length:nx},(_,i)=>ny*(nx+1)+nx-1-i),...Array.from({length:ny-1},(_,j)=>(ny-1-j)*(nx+1))];
  for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];ids.push(b,a,a+count,b,a+count,b+count);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ids);surface(g,'toro-closed-shallow-chiselled-wear-panel105');g.userData={closedStonePanel:true,maximumCarvingDepthMetres:.0042,interpretation:'Non-textual fragmentary weathering, not an inscription transcription'};return g;
 })();
 const mossSpray=new T.ConeGeometry(.009,.024,5,1);
 const livingCapMoss=Array.from({length:4},(_,i)=>createRootMoss108(i+9));
 const specs=[];
 function lantern(x,y,z,s=1,yaw=.04,options={}){
  const shaftHeight=options.shaftHeight??1.14,shortening=1.14-shaftHeight,shaftRatio=shaftHeight/1.14,shaftCentre=.28+shaftHeight/2,capWidth=options.capWidth??1,Y=h=>h-shortening;
  if(!(shaftHeight>.25&&shaftHeight<=1.14))throw Error('Invalid supported stone shaft height');
  specs.push({position:[x,y,z],scale:s,yaw,rootY:y,topY:y+(3.16-shortening)*s,shaftHeightMetres:shaftHeight*s,capPlanWidthMetres:1.44*s*capWidth,foundationBottomY:y-(options.plinthDrop??0)});
  at([x,y,z],yaw,()=>{
   if(options.plinthDrop)block([0,-options.plinthDrop/2,0],[.86*s,options.plinthDrop,.86*s],.012*s);
   // Nested footstones and a tapered square shaft. The recessed shaft
   // panels sit behind real chamfered borders and sparse shallow carvings.
   block([0,.075*s,0],[1.02*s,.15*s,1.02*s],.012*s);block([0,.215*s,0],[.74*s,.14*s,.74*s],.009*s);
   emit(surface(new T.CylinderGeometry(.245*s,.285*s,shaftHeight*s,4,1), 'toro-tapered-square-shaft'),stone,[0,shaftCentre*s,0],[1,1,1],[0,Math.PI/4,0]);
   block([0,Y(1.455)*s,0],[.56*s,.10*s,.56*s],.008*s);block([0,Y(1.555)*s,0],[.84*s,.10*s,.84*s],.009*s);
   emit(coving,stone,[0,Y(1.64)*s,0],[s,s,s]);
   block([0,Y(1.79)*s,0],[.77*s,.115*s,.77*s],.009*s);
   block([0,Y(2.09)*s,0],[.34*s,.47*s,.34*s],.006*s,warm);
   for(let side=0;side<4;side++)at([0,0,0],side*Math.PI/2,()=>{
    // Frame a broad dark cavity, rather than a glowing cube face.
    for(const sign of[-1,1])block([sign*.324*s,Y(2.09)*s,.324*s],[.12*s,.56*s,.12*s],.008*s);
    for(const sign of[-1,1])block([0,Y(2.09+sign*.25)*s,.337*s],[.64*s,.085*s,.13*s],.006*s);
    for(let j=-1;j<=1;j++)block([j*.145*s,Y(2.09)*s,.359*s],[.024*s,.43*s,.025*s],.002*s,woodDark);
    for(const sign of[-1,1])block([0,Y(2.09+sign*.073)*s,.36*s],[.45*s,.022*s,.027*s],.002*s,woodDark);
    // Weathered, physically recessed shaft cartouche and side reveals.
    emit(wornPanel,stone,[0,shaftCentre*s,.203*s],[s,s*shaftRatio,s]);
    for(const sign of[-1,1])block([sign*.124*s,shaftCentre*s,.207*s],[.023*s,.72*s*shaftRatio,.023*s],.004*s);
    for(const sign of[-1,1])block([0,(shaftCentre+sign*.35*shaftRatio)*s,.207*s],[.27*s,.025*s,.023*s],.004*s);
   });
   block([0,Y(2.40)*s,0],[.88*s,.10*s,.88*s],.008*s);emit(roof,stone,[0,Y(2.47)*s,0],[s*capWidth,s,s*capWidth]);
   emit(finial,stone,[0,Y(2.70)*s,0],[s,s,s]);
   // Moss follows the true cap surface in small broken patches.
   for(let j=0;j<22;j++){const a=j*2.39996,r=.30+.27*(.5+.5*Math.sin(j*5.13)),xx=Math.cos(a)*r,zz=Math.sin(a)*r,t=Math.max(Math.abs(xx),Math.abs(zz))/.72,yy=Y(2.47)+roofRecipe211.heightAt(xx,zz);
    ell([xx*s*capWidth,(yy+.005)*s,zz*s*capWidth],[s*capWidth*(.025+.02*(j%3)),.005*s,s*capWidth*.027],moss,.88+.035*(j%5));for(let k=0;k<6;k++){const aa=k*2.39996,rr=.017+.006*(k%3);emit(mossSpray,moss,[(xx+Math.cos(aa)*rr)*s*capWidth,(yy+.010)*s,(zz+Math.sin(aa)*rr)*s*capWidth],[s*.7*capWidth,s,s*.7*capWidth],[.15*Math.cos(aa),aa,.15*Math.sin(aa)],.84+.04*(k%4));}}
   for(let j=0;j<108;j++){
    const a=j*2.399963,r=.13+.52*Math.sqrt((j*.61803398875)%1),xx=Math.cos(a)*r,zz=Math.sin(a)*r;if(capMoss(xx,zz)<.37)continue;
    const t=Math.max(Math.abs(xx),Math.abs(zz))/.72,yy=Y(2.47)+roofRecipe211.heightAt(xx,zz),sc=s*(.58+.25*(.5+.5*Math.sin(j*7.1)));
    emit(livingCapMoss[j%4],moss,[xx*s*capWidth,(yy+.002)*s,zz*s*capWidth],[sc*capWidth,sc*.68,sc*capWidth],[0,j*.87,0],.78+.12*(j%4));
   }
   // Broken root mats cling to the actual outer arris, not just the hidden
   // central top. Their lower fibres roll a few millimetres around the lip.
   for(let j=0;j<52;j++){
    const side=j%4,t=-.65+1.30*((j*.61803398875)%1),xx=side===0?.70:side===1?-.70:t,zz=side===2?.70:side===3?-.70:t;
    if(capMoss(xx,zz)<.24||j%7===0)continue;
    const yy=Y(2.47)+roofRecipe211.heightAt(xx,zz),sc=s*(.80+.35*(.5+.5*Math.sin(j*7.1)));
    emit(livingCapMoss[j%4],moss,[xx*s*capWidth,(yy-.002)*s,zz*s*capWidth],[sc*capWidth,sc*.72,sc*capWidth],[.18*Math.cos(j),j*.87,.18*Math.sin(j)],.86+.035*(j%4));
   }
   for(let j=0;j<12;j++){
    const a=j*2.39996,yy=Y(2.70)+.22+.055*Math.sin(j*5.3),rr=.153,sc=s*(.70+.15*(j%3));
    emit(livingCapMoss[j%4],moss,[Math.cos(a)*rr*s,yy*s,Math.sin(a)*rr*s],[sc,sc*.65,sc],[.90*Math.sin(a),a,-.90*Math.cos(a)],.84+.04*(j%3));
   }
  });
 }
 return{lantern,info(){return{construction:'Closed curved/chipped stone kasa, lifted corners, mottled metric granite, real open chamber, resized shaft cartouches and supported raised plinth for the near lantern',instances:specs.map(s=>({...s})),independentGraniteMap:'Poly Haven granite_tile_04 / Amal Kumar / CC0',photographicAccepted:false};}};
}
