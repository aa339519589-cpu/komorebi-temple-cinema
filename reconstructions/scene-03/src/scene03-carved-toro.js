import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// A supported, thinly weathered granite toro. Every stone part has volume;
// the light chamber is genuinely open behind its mullions and stone piers.
export async function createCarvedToro03({emit,at,between,sweep,ell,mats,textures,moss,warm,woodDark}){
 const loader=new T.TextureLoader(),maps=await Promise.all(['diff','nor_gl','rough'].map(name=>loader.loadAsync(new URL(`../assets/granite-tile-04/granite-face-${name}.png`,import.meta.url).href)));
 maps.forEach((map,i)=>{map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.anisotropy=8;if(i===0)map.colorSpace=T.SRGBColorSpace;textures.add(map);});
 const stone=new T.MeshStandardMaterial({name:'scene03-carved-weathered-toro-granite',color:'#e0f0ff',map:maps[0],normalMap:maps[1],normalScale:new T.Vector2(.43,.43),roughnessMap:maps[2],roughness:.94,vertexColors:true});mats.toroGranite105=stone;
 const dark=stone.clone();dark.name='scene03-sheltered-carved-granite-recess';dark.color.set('#a4b9c3');mats.toroRecess105=dark;
 const geometryCache=new Map();
 function surface(g,tag){
  g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,uv=[],colors=[];
  for(let k=0;k<p.count;k++){
   const x=p.getX(k),y=p.getY(k),z=p.getZ(k),ax=[Math.abs(n.getX(k)),Math.abs(n.getY(k)),Math.abs(n.getZ(k))].indexOf(Math.max(Math.abs(n.getX(k)),Math.abs(n.getY(k)),Math.abs(n.getZ(k))));
   uv.push((ax===0?z:x)/.23,(ax===1?z:y)/.23);
   const age=.91+.045*Math.sin(x*9.1+y*3.3+z*6.7)+.025*Math.sin(x*27-y*19+z*21);colors.push(age*.99,age,age*.97);
  }
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.name=tag;return g;
 }
 function block(p,s,r=.008,m=stone){const key=s.join(':')+':'+r;let g=geometryCache.get(key);if(!g){g=surface(new RoundedBoxGeometry(...s,2,r),'toro-closed-chamfered-stone');geometryCache.set(key,g);}emit(g,m,p);}
 const roof=(()=>{
  const p=[],n=44,P=(i,j,down=false)=>{let x=-.72+1.44*i/n,z=-.72+1.44*j/n,t=Math.max(Math.abs(x),Math.abs(z))/.72;
   const edge=.006*Math.sin(x*27+z*19)+.003*Math.sin(z*41-x*33),y=down?-.09+.025*t*t:.365*Math.pow(Math.max(0,1-t),1.23)+.065*Math.pow(t,7)+edge*t**4;
   return[x,y,z];},tri=(a,b,c)=>p.push(...a,...b,...c);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const a=P(i,j),b=P(i+1,j),c=P(i,j+1),d=P(i+1,j+1),aa=P(i,j,true),bb=P(i+1,j,true),cc=P(i,j+1,true),dd=P(i+1,j+1,true);tri(a,c,b);tri(b,c,d);tri(aa,bb,cc);tri(bb,dd,cc);}
  for(let k=0;k<n;k++)for(let side=0;side<4;side++){const a=side===0?P(k,0):side===1?P(n,k):side===2?P(n-k,n):P(0,n-k),b=side===0?P(k+1,0):side===1?P(n,k+1):side===2?P(n-k-1,n):P(0,n-k-1),aa=[a[0],-.09+.025,a[2]],bb=[b[0],-.09+.025,b[2]];tri(a,b,aa);tri(b,bb,aa);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));return surface(g,'toro-closed-heavy-hipped-granite-cap105');
 })();
 const finial=new T.LatheGeometry([[0,0],[.17,0],[.19,.035],[.15,.09],[.13,.12],[.155,.17],[.15,.23],[.105,.29],[.06,.32],[.045,.36],[0,.40]].map(([x,y])=>new T.Vector2(x,y)),36);surface(finial,'toro-closed-lotus-bud-finial');
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
 const specs=[];
 function lantern(x,y,z,s=1,yaw=.04){
  specs.push({position:[x,y,z],scale:s,yaw,rootY:y,topY:y+3.10*s});
  at([x,y,z],yaw,()=>{
   // Nested footstones and a tapered square shaft. The recessed shaft
   // panels sit behind real chamfered borders and sparse shallow carvings.
   block([0,.075*s,0],[1.02*s,.15*s,1.02*s],.012*s);block([0,.215*s,0],[.74*s,.14*s,.74*s],.009*s);
   emit(surface(new T.CylinderGeometry(.245*s,.285*s,1.14*s,4,1), 'toro-tapered-square-shaft'),stone,[0,.85*s,0],[1,1,1],[0,Math.PI/4,0]);
   block([0,1.455*s,0],[.56*s,.10*s,.56*s],.008*s);block([0,1.555*s,0],[.84*s,.10*s,.84*s],.009*s);
   emit(coving,stone,[0,1.64*s,0],[s,s,s]);
   block([0,1.79*s,0],[.77*s,.115*s,.77*s],.009*s);
   block([0,2.09*s,0],[.34*s,.47*s,.34*s],.006*s,warm);
   for(let side=0;side<4;side++)at([0,0,0],side*Math.PI/2,()=>{
    // Frame a broad dark cavity, rather than a glowing cube face.
    for(const sign of[-1,1])block([sign*.324*s,2.09*s,.324*s],[.12*s,.56*s,.12*s],.008*s);
    for(const sign of[-1,1])block([0,(2.09+sign*.25)*s,.337*s],[.64*s,.085*s,.13*s],.006*s);
    for(let j=-1;j<=1;j++)block([j*.145*s,2.09*s,.359*s],[.024*s,.43*s,.025*s],.002*s,woodDark);
    for(const sign of[-1,1])block([0,(2.09+sign*.073)*s,.36*s],[.45*s,.022*s,.027*s],.002*s,woodDark);
    // Weathered, physically recessed shaft cartouche and side reveals.
    emit(wornPanel,stone,[0,.87*s,.203*s],[s,s,s]);
    for(const sign of[-1,1])block([sign*.124*s,.87*s,.207*s],[.023*s,.72*s,.023*s],.004*s);
    for(const sign of[-1,1])block([0,(.87+sign*.35)*s,.207*s],[.27*s,.025*s,.023*s],.004*s);
   });
   block([0,2.40*s,0],[.88*s,.10*s,.88*s],.008*s);emit(roof,stone,[0,2.47*s,0],[s,s,s]);
   emit(finial,stone,[0,2.70*s,0],[s,s,s]);
   // Moss follows the true cap surface in small broken patches.
   for(let j=0;j<22;j++){const a=j*2.39996,r=.30+.27*(.5+.5*Math.sin(j*5.13)),xx=Math.cos(a)*r,zz=Math.sin(a)*r,t=Math.max(Math.abs(xx),Math.abs(zz))/.72,yy=2.47+.365*(1-t)**1.23+.065*t**7;
    ell([xx*s,(yy+.005)*s,zz*s],[s*(.025+.02*(j%3)),.005*s,s*.027],moss,.88+.035*(j%5));for(let k=0;k<6;k++){const aa=k*2.39996,rr=.017+.006*(k%3);emit(mossSpray,moss,[(xx+Math.cos(aa)*rr)*s,(yy+.010)*s,(zz+Math.sin(aa)*rr)*s],[s*.7,s,s*.7],[.15*Math.cos(aa),aa,.15*Math.sin(aa)],.84+.04*(k%4));}}
  });
 }
 return{lantern,info(){return{construction:'Closed carved tapered shaft, recessed physical cartouches, heavy hipped cap, open chamber and timber mullions',instances:specs.map(s=>({...s})),independentGraniteMap:'Poly Haven granite_tile_04 / Amal Kumar / CC0',photographicAccepted:false};}};
}
