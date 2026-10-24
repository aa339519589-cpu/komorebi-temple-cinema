import * as T from 'three';
import {applyStoneFinish212} from './scene04-stone-finish212.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyMetricUV} from './scene04-surfaces.js';
import {createNeutralScannedGranite04} from './scene04-scanned-stone.js';
import {carvedStoneBand212} from './scene04-stone-relief212.js';
import {adheredMossGeometry212,createAdheredMossMaterial212} from './scene04-moss212.js';

// Scene04/212: full stone toro reconstruction from the reference silhouette.
// Metric stone solids, open recessed chambers and actual supported cap seats.
// The photograph is comparison input only; no photograph/colour projection.
const TAU=Math.PI*2,clamp=T.MathUtils.clamp;
const hash=(x,y,z,seed=1)=>{const q=Math.sin(x*127.1+y*311.7+z*74.7+seed*17.13)*43758.5453;return q-Math.floor(q);};
function noise(x,y,z,seed=1){const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),f=[x-i,y-j,z-k].map(t=>t*t*(3-2*t)),l=T.MathUtils.lerp;return l(l(l(hash(i,j,k,seed),hash(i+1,j,k,seed),f[0]),l(hash(i,j+1,k,seed),hash(i+1,j+1,k,seed),f[0]),f[1]),l(l(hash(i,j,k+1,seed),hash(i+1,j,k+1,seed),f[0]),l(hash(i,j+1,k+1,seed),hash(i+1,j+1,k+1,seed),f[0]),f[1]),f[2]);}
function closed212(p,ix){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);
  const welded=mergeVertices(g,1e-6);g.dispose();welded.computeVertexNormals();welded.userData.closedStone212=true;return welded;
}
function profileStone212(levels,seed,exponent=5,inscribed=false){
  const rings=[];
  for(let j=0;j<levels.length-1;j++){
    const [y,r]=levels[j],[y1,r1]=levels[j+1],n=Math.max(1,Math.ceil((y1-y)/.022));
    for(let k=0;k<n;k++){const u=k/n;rings.push([y+(y1-y)*u,r+(r1-r)*u]);}
  }
  rings.push(levels.at(-1));const N=192,p=[],ix=[],dense=[],arc=[0];
  for(let i=0;i<=4096;i++){const a=(i%4096)/4096*TAU,ss=Math.sin(a),cc=Math.cos(a),q=[Math.abs(ss)<1e-12?0:Math.sign(ss)*Math.pow(Math.abs(ss),2/exponent),Math.abs(cc)<1e-12?0:Math.sign(cc)*Math.pow(Math.abs(cc),2/exponent)];dense.push(q);if(i)arc.push(arc.at(-1)+Math.hypot(q[0]-dense[i-1][0],q[1]-dense[i-1][1]));}
  const unit=[];let cursor=1;for(let i=0;i<N;i++){const target=i/N*arc.at(-1);while(arc[cursor]<target)cursor++;const t=(target-arc[cursor-1])/(arc[cursor]-arc[cursor-1]||1);unit.push([T.MathUtils.lerp(dense[cursor-1][0],dense[cursor][0],t),T.MathUtils.lerp(dense[cursor-1][1],dense[cursor][1],t)]);}
  for(let j=0;j<rings.length;j++)for(let i=0;i<=N;i++){
    const [y,r]=rings[j],a=(i%N)/N*TAU,s=Math.sin(a),c=Math.cos(a);
    let x=unit[i%N][0]*r,z=unit[i%N][1]*r;
    const len=Math.hypot(x,z)||1,nx=x/len,nz=z/len,age=.006*(noise(x*13,y*11,z*13,seed)-.5)+.010*(noise(x*4,y*5,z*4,seed+11)-.5);
    let cut=0;
    if(inscribed&&y>2.005&&y<2.285){
      const u=(Math.abs(z)>Math.abs(x)?x:z),v=(y-2.04)/.20,gate=Math.sin(Math.PI*clamp((y-2.005)/.28,0,1))**2;
      const c1=Math.abs(Math.hypot((u+.26)*1.08,(v-.48)*.23)-.105),c2=Math.abs(Math.hypot((u-.18)*.90,(v-.57)*.24)-.092);
      cut=.030*Math.exp(-Math.min(c1*c1,c2*c2)/.00011)*gate;
    }
    x+=nx*(age-cut);z+=nz*(age-cut);p.push(x,y,z);
    if(j<rings.length-1&&i<N){const a=j*(N+1)+i,b=a+N+1;ix.push(a,a+1,b,a+1,b+1,b);}
  }
  for(const top of[false,true]){const j=top?rings.length-1:0,base=j*(N+1),center=p.length/3;p.push(0,rings[j][0],0);for(let i=0;i<N;i++)top?ix.push(center,base+i,base+i+1):ix.push(center,base+i+1,base+i);}
  const g=closed212(p,ix);g.userData.profileSeats=levels;return g;
}
function shaft212(seed){
  const p=[],ix=[],rows=56,cols=16,stride=cols+1;
  const strokes=[[-.13,.19,.08,.24],[.03,.25,.03,.47],[-.15,.44,.13,.41],[.11,.47,-.06,.64],[-.12,.65,.10,.73],[.05,.73,.01,.88]];
  for(let face=0;face<8;face++){
    const a=-Math.PI/8+face*TAU/8,b=a+TAU/8,normal=new T.Vector3(Math.sin((a+b)/2),0,Math.cos((a+b)/2)),base=p.length/3;
    for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
      const v=j/rows,u=i/cols,y=.74+1.09*v,r=.345+.010*Math.sin(Math.PI*v)-.012*v;
      let x=T.MathUtils.lerp(Math.sin(a)*r,Math.sin(b)*r,u),z=T.MathUtils.lerp(Math.cos(a)*r,Math.cos(b)*r,u);
      const lateral=(u-.5)*.34;let incision=0;
      for(const[x0,y0,x1,y1]of strokes){const dx=x1-x0,dy=y1-y0,t=clamp(((lateral-x0)*dx+(v-y0)*dy)/(dx*dx+dy*dy),0,1),d=Math.hypot(lateral-x0-dx*t,(v-y0-dy*t)*.44);incision=Math.max(incision,.021*Math.exp(-d*d/.000065)*(.68+.32*noise(lateral*37,v*24,face,seed)));}
      const fade=Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**2,weather=.012*(noise(x*15,y*19,z*15,seed+face)-.5),cut=(incision+weather)*fade;
      x-=normal.x*cut;z-=normal.z*cut;p.push(x,y,z);
      if(j<rows&&i<cols){const a=base+j*stride+i,b=a+stride;ix.push(a,a+1,b,a+1,b+1,b);}
    }
  }
  for(const top of[false,true]){const center=p.length/3,y=top?1.83:.74,r=top?.333:.345;p.push(0,y,0);for(let i=0;i<=8*cols;i++){const face=Math.floor((i%(8*cols))/cols),u=(i%cols)/cols,a=-Math.PI/8+face*TAU/8,b=a+TAU/8;p.push(T.MathUtils.lerp(Math.sin(a)*r,Math.sin(b)*r,u),y,T.MathUtils.lerp(Math.cos(a)*r,Math.cos(b)*r,u));}for(let i=0;i<8*cols;i++)top?ix.push(center,center+1+i,center+2+i):ix.push(center,center+2+i,center+1+i);}
  const g=closed212(p,ix);g.userData.inscription212='Abstract damaged incision traces; no legible historical text claimed';return g;
}
export function createToroCap212(seed){
  const N=192,M=48,p=[],ix=[],levels=[[0,3.500],[.20,3.490],[.42,3.430],[.67,3.250],[.86,3.145],[1,3.175]],sections=[];
  const height=u=>{let j=0;while(j<levels.length-2&&u>levels[j+1][0])j++;const a=levels[j],b=levels[j+1],before=levels[Math.max(0,j-1)],after=levels[Math.min(levels.length-1,j+2)],h=b[0]-a[0],t=(u-a[0])/h,ma=j?(b[1]-before[1])/(b[0]-before[0]):0,mb=(after[1]-a[1])/(after[0]-a[0]);return(2*t*t*t-3*t*t+1)*a[1]+(t*t*t-2*t*t+t)*h*ma+(-2*t*t*t+3*t*t)*b[1]+(t*t*t-t*t)*h*mb;};
  const top=(u,a)=>{const ss=Math.sin(a),cc=Math.cos(a),r=1.075/Math.pow(Math.pow(Math.abs(ss),6)+Math.pow(Math.abs(cc),6),1/6),corner=Math.pow(Math.sin(2*a),10),edge=T.MathUtils.smoothstep(u,.76,1),jitter=1+edge*(.006*Math.sin(a*13+.7)+.004*Math.sin(a*29+1.3)),x=ss*r*u*jitter,z=cc*r*u*jitter,radius=Math.hypot(x,z),seat=1-T.MathUtils.smoothstep(radius,.175,.225),age=(.013*(noise(x*11,0,z*11,seed)-.5)+.006*(noise(x*43,0,z*43,seed+13)-.5))*(1-seat),chip=.022*Math.pow(noise(x*38,0,z*38,seed+29),3)*edge,crown=.035*Math.exp(-Math.pow((radius-.27)/.075,2))*(1-seat);return[x,T.MathUtils.lerp(height(u)+.220*corner*Math.pow(u,5)+age-chip+crown,3.500,seat),z];};
  for(let j=1;j<=M;j++)sections.push({u:.92*j/M,kind:'top'});
  for(const[u,dy]of[[.965,.018],[.997,.018],[1.008,-.005],[1.010,-.055],[.994,-.095],[.962,-.128],[.940,-.138]])sections.push({u,dy,kind:'roll'});
  for(let j=M-1;j>=1;j--)sections.push({u:.94*j/M,kind:'bottom'});
  p.push(0,3.500,0);
  for(const section of sections)for(let i=0;i<N;i++){
   const a=i/N*TAU,q=top(section.u,a),edge=top(.92,a),rollDepth=.083+.080*Math.pow(Math.sin(2*a),8);
   if(section.kind==='roll')q[1]=edge[1]+section.dy*rollDepth/.138;
   if(section.kind==='bottom'){const radius=Math.hypot(q[0],q[2]),target=T.MathUtils.lerp(q[1]-.12,edge[1]-rollDepth,T.MathUtils.smoothstep(section.u,.80,.94));q[1]=T.MathUtils.lerp(3.068,target,T.MathUtils.smoothstep(radius,.47,.68));}
   p.push(...q);
  }
  const ring=(j,i)=>1+j*N+(i+N)%N;
  for(let i=0;i<N;i++)ix.push(0,ring(0,i),ring(0,i+1));
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<N;i++){const a=ring(j,i),b=ring(j,i+1),c=ring(j+1,i),d=ring(j+1,i+1);ix.push(a,c,b,b,c,d);}
  const pole=p.length/3;p.push(0,3.068,0);for(let i=0;i<N;i++)ix.push(pole,ring(sections.length-1,i+1),ring(sections.length-1,i));
  const g=closed212(p,ix);g.userData.seat212={lowerCentralFace:3.068,chamberLintelTop:3.075,overlap:.007,continuousStoneMass:true,eaveRollDepthRangeMetres:[.083,.163],eaveCrossSectionRings:7,roundedPlanExponent:6,curvedHipProfile:levels,source:'Authored radial stone hip, raised crown shoulder and thick rolled eroded eave after HD04/R14 review; no recovered metric claim'};return g;
}
export function createHoju212(seed){
  const control=[[0,3.495],[.150,3.495],[.230,3.535],[.310,3.620],[.335,3.705],[.295,3.790],[.175,3.845],[.120,3.890],[.180,3.935],[.255,4.005],[.290,4.105],[.265,4.205],[.205,4.275],[.115,4.315],[.060,4.355],[.045,4.385],[0,4.400]],ps=[];
  for(let j=0;j<control.length-1;j++)for(let k=0;k<8;k++){
   const a=control[j],b=control[j+1],before=control[Math.max(0,j-1)],after=control[Math.min(control.length-1,j+2)],t=k/8,h=b[1]-a[1],ma=j?(b[0]-before[0])/(b[1]-before[1]||1):0,mb=(after[0]-a[0])/(after[1]-a[1]||1),r=(2*t*t*t-3*t*t+1)*a[0]+(t*t*t-2*t*t+t)*h*ma+(-2*t*t*t+3*t*t)*b[0]+(t*t*t-t*t)*h*mb;
   ps.push(new T.Vector2(Math.max(0,r),T.MathUtils.lerp(a[1],b[1],t)));
  }
  ps.push(new T.Vector2(0,4.40));
  const raw=new T.LatheGeometry(ps,96),p=raw.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),angle=Math.atan2(x,z),flute=Math.sin(angle*8+.08*Math.sin(y*17)),r=1+.0075*flute*flute*Math.sin(Math.PI*clamp((y-3.745)/.55,0,1))+.014*(noise(x*41,y*37,z*41,seed)-.5);p.setXYZ(i,x*r,y,z*r);}
  raw.deleteAttribute('normal');raw.deleteAttribute('uv');const g=mergeVertices(raw,1e-6);raw.dispose();const q=g.attributes.position,ids=[];
  for(let i=0;i<g.index.count;i+=3){const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2),A=new T.Vector3().fromBufferAttribute(q,a),B=new T.Vector3().fromBufferAttribute(q,b),C=new T.Vector3().fromBufferAttribute(q,c);if(B.sub(A).cross(C.sub(A)).lengthSq()>1e-20)ids.push(a,b,c);}g.setIndex(ids);g.computeVertexNormals();g.userData.continuousHoju212=true;return g;
}
function moss212(g,seed){return adheredMossGeometry212(g,seed);}

export function buildRestorationStoneLanterns({options={}}={}){
  const group=new T.Group();group.name='scene04-212-rebuilt-granite-toro';const geometries=[],materials=[],lanterns=[],emitters=[],contacts=[];let triangles=0,mossTufts=0;
  const granite=(name,color,strength)=>{const m=createNeutralScannedGranite04(name,color,strength),compile=m.onBeforeCompile;m.clearcoat=0;m.roughness=.94;m.vertexColors=true;m.onBeforeCompile=shader=>{compile(shader);shader.fragmentShader=shader.fragmentShader.replace('clamp(pow(max(mineral,.0001)/.153180782734,.88),.38,1.65)','clamp(pow(max(mineral,.0001)/.153180782734,.98),.25,1.95)');};m.customProgramCacheKey=()=> 'scene04-212-carved-weathered-granite';applyStoneFinish212(m);materials.push(m);return m;};
  const stone=granite('scene04-212-weathered-quartz-granite','#938a76',1.05),capStone=granite('scene04-212-damp-hipped-stone-cap','#8a8574',1.15),finialStone=granite('scene04-212-eroded-hoju-granite','#6f6c58',.95),moss=createAdheredMossMaterial212(),paper=new T.MeshStandardMaterial({name:'scene04-212-recessed-warm-toro-light',color:'#e1c18b',emissive:'#ffb965',emissiveIntensity:.45,roughness:.94,side:T.DoubleSide}),bronze=new T.MeshStandardMaterial({name:'scene04-212-recessed-bronze-grid',color:'#372c1b',metalness:.45,roughness:.70});materials.push(moss,paper,bronze);
  function merge(parts,mat,parent,name){
    if(mat===moss)for(const g of parts)mossTufts+=g.userData.adheredMoss212?.tufts??0;
    if(!parts.length)return null;const clean=parts.map(g=>{const h=applyMetricUV(g);if(h!==g)g.dispose();if(!h.attributes.color){const p=h.attributes.position,colors=[];for(let i=0;i<p.count;i++){const age=.86+.21*noise(p.getX(i)*4.4,p.getY(i)*2.7,p.getZ(i)*4.4,237);colors.push(age,age,age*.98);}h.setAttribute('color',new T.Float32BufferAttribute(colors,3));}return h;});
    const g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());geometries.push(g);const m=new T.Mesh(g,mat);m.name=name;m.castShadow=mat!==paper;m.receiveShadow=mat!==paper;parent.add(m);triangles+=g.attributes.position.count/3;return m;
  }
  for(const [id,anchor]of(options.anchors??[]).entries()){
    const [x,y,z,oldScale]=anchor,scale=oldScale*3.34/4.4,width=id<2?(options.heroWidthFactor??1):1,body=new T.Group();body.position.set(x,y,z);body.scale.set(scale*width,scale,scale*width);if(id<2)body.rotation.y=-Math.sign(x)*(options.heroInwardYaw??0);group.add(body);lanterns.push(body);
    const parts=[],caps=[],growth=[],lights=[],bars=[];
    const box=(w,h,d,x,y,z,list=parts,bevel=.012)=>{const g=new RoundedBoxGeometry(w,h,d,3,bevel);g.translate(x,y,z);list.push(g);};
    parts.push(profileStone212([[0,.77],[.060,.82],[.160,.80],[.180,.75],[.400,.735],[.450,.75],[.505,.68],[.565,.54],[.625,.47],[.685,.45],[.745,.405]],id+51,16.0));
    parts.push(shaft212(id+161));
    parts.push(profileStone212([[1.79,.36],[1.835,.435],[1.895,.55],[1.960,.675],[2.015,.692],[2.305,.692],[2.355,.710],[2.405,.53]],id+73,16.0));
    for(let face=0;face<4;face++){
      const upper=carvedStoneBand212({width:1.20,height:.255,y:2.162,z:.678,seed:id*11+face,depth:.037});upper.rotateY(face*Math.PI/2);parts.push(upper);
      const lower=carvedStoneBand212({width:1.28,height:.210,y:.302,z:.727,seed:97+id*11+face,depth:.031});lower.rotateY(face*Math.PI/2);parts.push(lower);
    }
    box(1.02,.075,1.02,0,2.405,0);box(1.04,.105,1.04,0,3.0225,0);
    for(const xx of[-.4075,.4075])for(const zz of[-.4075,.4075])box(.135,.575,.135,xx,2.72,zz,parts,.015);
    for(let face=0;face<4;face++){
      const yaw=face*Math.PI/2,transform=(g,list)=>{g.rotateY(yaw);list.push(g);};
      const pane=new T.PlaneGeometry(.66,.51);pane.translate(0,2.70,.385);transform(pane,lights);
      for(const xx of[-.338,.338]){const g=new RoundedBoxGeometry(.034,.54,.085,2,.006);g.translate(xx,2.70,.407);transform(g,parts);}
      for(const yy of[2.435,2.965]){const g=new RoundedBoxGeometry(.71,.033,.085,2,.006);g.translate(0,yy,.407);transform(g,parts);}
      for(let k=-3;k<=3;k++){const g=new T.BoxGeometry(.008,.515,.015);g.translate(k*.083,2.70,.426);transform(g,bars);}
      for(let k=-2;k<=2;k++){const g=new T.BoxGeometry(.665,.008,.015);g.translate(0,2.70+k*.101,.428);transform(g,bars);}
    }
    const roof=createToroCap212(id+387),finial=createHoju212(id+617);growth.push(moss212(roof,id+31),moss212(finial,id+57));caps.push(roof);
    merge(parts,stone,body,'scene04-212-solid-profiled-stone-body');merge(caps,capStone,body,'scene04-212-closed-rolled-hipped-cap');merge([finial],finialStone,body,'scene04-212-eroded-gray-stone-hoju');const paperMesh=merge(lights,paper,body,'scene04-212-recessed-luminous-chamber');merge(bars,bronze,body,'scene04-212-fine-recessed-grid');merge(growth,moss,body,'scene04-212-surface-rooted-moss');
    const light=new T.PointLight('#ffbd70',id<2?1.1:3.8,2.5,2);light.position.set(0,2.70,0);
    if(id<2){body.traverse(o=>{if(o.isMesh)o.layers.enable(7);});light.castShadow=true;light.shadow.mapSize.set(256,256);light.shadow.camera.near=.02;light.shadow.camera.far=2.5;light.shadow.camera.layers.set(7);light.shadow.bias=-.00008;light.shadow.normalBias=.002;}body.add(light);emitters.push({index:id,object:body,paperMesh,material:paper,localPosition:new T.Vector3(0,2.70,0)});
    contacts.push({index:id,ground:anchor.slice(0,3),profileBaseY:0,shaftBase:.74,baseTop:.745,shaftTop:1.83,upperSeatBottom:1.79,chamberPostBottom:2.4325,chamberPostTop:3.0075,upperLintelBottom:2.97,upperLintelTop:3.075,roofSeat:3.068,finialBottom:3.495,roofCrown:3.500,finialFootRadius:.150,finialSeatRadius:.175,finialSeatOverlap:.005,allUnits:'unscaled local metres; inherited positive scale applies'});
  }
  group.userData.rebuild212={revision:'r18',scope:'Rebuilt radial curved-hip stone cap with superelliptic plan, concave weather slopes, raised crown shoulder, four swept corners and a thick rolled eroded eave; existing continuous finial/chamber seats retained. Stone body and real adhered moss remain independent geometry.',contacts,mossTufts,referencePhotoNotTexture:true,visualAccepted:false};
  function getEmitterMetadata(){group.updateMatrixWorld(true);return emitters.map(e=>({...e,worldPosition:e.object.localToWorld(e.localPosition.clone()),worldCenter:e.object.localToWorld(e.localPosition.clone()),worldScale:e.object.getWorldScale(new T.Vector3()),windows:[]}));}
  return{group,lanterns,materials,stats:{triangles,lanterns:lanterns.length,mossTufts},bounds:new T.Box3().setFromObject(group),getEmitterMetadata,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.removeFromParent();}};
}
