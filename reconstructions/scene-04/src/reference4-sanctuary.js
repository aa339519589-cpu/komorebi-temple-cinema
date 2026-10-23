import {createSanctuaryCarving164} from './scene04-porch-sculpture135.js';
import {emitRestoredBuddha} from './restoration-buddha.js';
// A small but fully three-dimensional sanctuary visible through the exterior
// doorway. No emissive background panel, image plane, or screen-facing proxy.
export function buildReference4Sanctuary(T,{floorY=1.8,spatial188=null}={}){
 const group=new T.Group();group.name='reference4-physical-sanctuary-v4';group.position.set(0,floorY+.55,-5.55);
 const materials={
  gold:new T.MeshStandardMaterial({name:'sanctuary-gilding',color:'#ad8743',metalness:.82,roughness:.54}),
  oldgold:new T.MeshStandardMaterial({name:'sanctuary-recessed-gilt',color:'#7c5d2d',metalness:.67,roughness:.59}),
  lacquer:new T.MeshStandardMaterial({name:'sanctuary-black-lacquer',color:'#170e0a',roughness:.31,metalness:.12}),
  wood:new T.MeshStandardMaterial({name:'sanctuary-dark-wood',color:'#27170e',roughness:.63}),
  hair:new T.MeshStandardMaterial({name:'sanctuary-hair',color:'#20170c',roughness:.63}),
  flame:new T.MeshStandardMaterial({name:'sanctuary-real-oil-flame',color:'#fff0ba',emissive:'#ffb54e',emissiveIntensity:2.3,roughness:.8})
 };
 const unit={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),cylinder:new T.CylinderGeometry(1,1,1,16),torus:new T.TorusGeometry(1,.055,6,28)};
 const buckets=new Map(),matrix=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3(),s=new T.Vector3();let instances=0;
 function add(geometry,material,pos,scale=[1,1,1],rotation=null){
  if(typeof material==='string')material=materials[material];
  const key=geometry.uuid+':'+material.uuid;let b=buckets.get(key);if(!b){b={geometry,material,matrices:[]};buckets.set(key,b);}
  q.identity();if(rotation?.isQuaternion)q.copy(rotation);else if(rotation)q.setFromEuler(new T.Euler(...rotation));
  matrix.compose(p.fromArray(pos),q,s.fromArray(scale));b.matrices.push(matrix.clone());instances++;
 }
 const box=(m,p,s)=>add(unit.box,m,p,s),sphere=(m,p,s)=>add(unit.sphere,m,p,s);
 function beam(a,b,r,m='gold'){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);add(unit.cylinder,m,av.add(bv).multiplyScalar(.5).toArray(),[r,d.length(),r],new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));}
 function curve(points,r=.018,m='gold',segments=28){const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));add(new T.TubeGeometry(c,segments,r,6,false),m,[0,0,0]);}
 function rosette(x,y,z,r=.07){sphere('oldgold',[x,y,z],[r*.45,r*.45,r*.19]);for(let j=0;j<8;j++){const a=j*Math.PI/4;add(unit.sphere,'gold',[x+Math.cos(a)*r*.53,y+Math.sin(a)*r*.53,z],[r*.52,r*.18,r*.15],[0,0,a]);}}
 function spiral(x,y,z,r=.12,sign=1){const a=[];for(let j=0;j<28;j++){const t=j/27*Math.PI*3.1,rr=r*(1-j/30);a.push([x+sign*Math.cos(t)*rr,y+Math.sin(t)*rr,z]);}curve(a,.012,'oldgold');}
 box('wood',[0,2.45,-1.10],[3.65,4.1,.16]);
 // The altar now stands on a continuous closed pedestal down to the
 // actual hall floor. The earlier raised shrine left a 0.55m open underside.
 box('wood',[0,-.275,0],[3.30,.55,1.72]);
 for(const yy of[-.47,-.10])box('lacquer',[0,yy,0],[3.38,.10,1.78]);
 for(const x of[-1.88,1.88]){box('wood',[x,2.065,-.40],[.18,5.23,1.55]);box('lacquer',[x,-.48,-.40],[.30,.14,1.60]);}
 box('wood',[0,4.80,-.40],[4.02,.24,1.72]);
 for(const x of[-1.68,1.68]){box('oldgold',[x,2.46,-.98],[.18,3.97,.13]);box('gold',[x,2.46,-.90],[.025,3.97,.04]);}
 if(spatial188){
  const sourceEmit=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rotation=0)=>add(g,m,[x,y,z],[sx,sy,sz],Array.isArray(rotation)?rotation:[0,rotation||0,0]);
  const sourceMaterial=spatial188.gilded.clone();sourceMaterial.name='spatial188-inner-shrine-source-carving';sourceMaterial.onBeforeCompile=spatial188.gilded.onBeforeCompile;sourceMaterial.customProgramCacheKey=spatial188.gilded.customProgramCacheKey;materials.sourceCarving=sourceMaterial;
  spatial188.panel(sourceEmit,{x:0,y:3.05,z:-.985,width:3.15,height:1.16,material:sourceMaterial,label:'recessed-real-carved-shrine-back'});
 }else for(let j=0;j<11;j++){const x=-1.45+j*.29;box('oldgold',[x,2.48,-.995],[.018,3.8,.023]);for(let k=0;k<10;k++)rosette(x,.76+k*.35,-.97,.035);}
 for(let k=0;k<4;k++){
  const w=3.18-k*.20,d=1.60-k*.11,y=.085+k*.17;
  box(k===2?'oldgold':'lacquer',[0,y,0],[w,.17,d]);
  box('gold',[0,y+.075,d/2+.012],[w,.033,.035]);for(const x of [-w/2,w/2])box('gold',[x,y+.075,0],[.035,.033,d]);
 }
 for(const x of [-1.18,-.59,0,.59,1.18]){box('gold',[x,.43,.67],[.48,.23,.06]);box('lacquer',[x,.43,.71],[.43,.185,.025]);spiral(x-.09,.43,.735,.07,1);spiral(x+.09,.43,.735,.07,-1);rosette(x,.43,.74,.052);}
 box('lacquer',[0,.77,0],[1.80,.39,1.13]);box('lacquer',[0,1.015,0],[1.80,.10,1.30]);box('oldgold',[0,1.025,.59],[1.84,.075,.075]);
 let originalAmidaMount=null;
 if(spatial188?.amida){
  const sourceEmit=(g,m,x,y,z,sx,sy,sz)=>add(g,m,[x,y,z],[sx,sy,sz]);
  originalAmidaMount=spatial188.amida.emitOnAltar(sourceEmit,materials.gold,{topY:1.065,height:1.60,centreZ:.04});
  // A separately authored lacquered collar contains the original source
  // plinth. The untouched scan still bears at1.065; the cornice below is a
  // closed100mm timber plate carried by the original altar core.
  const halfW=originalAmidaMount.sourcePlinthWidth/2,front=.04+originalAmidaMount.sourcePlinthDepth/2,back=.04-originalAmidaMount.sourcePlinthDepth/2,collarH=.185;
  box('lacquer',[0,1.065+collarH/2,front+.035],[originalAmidaMount.sourcePlinthWidth+.16,collarH,.07]);
  for(const side of[-1,1])box('lacquer',[side*(halfW+.035),1.065+collarH/2,.04],[.07,collarH,originalAmidaMount.sourcePlinthDepth]);
  for(const yy of[1.082,1.233])box('oldgold',[0,yy,front+.074],[originalAmidaMount.sourcePlinthWidth+.16,.014,.012]);
  for(const side of[-1,1])for(const yy of[1.082,1.233])box('oldgold',[side*(halfW+.074),yy,.04],[.012,.014,originalAmidaMount.sourcePlinthDepth]);
 }else{
  add(new T.CylinderGeometry(.91,1.04,.18,48),'oldgold',[0,1.10,0]);
  for(let j=0;j<36;j++){const a=j*Math.PI/18;add(unit.sphere,'gold',[Math.cos(a)*.92,1.125,Math.sin(a)*.74],[.10,.19,.055],[0,-a,Math.PI*.14]);}
  emitRestoredBuddha((geometry,key,x,y,z,sx,sy,sz)=>add(geometry,key==='oldgold'?'hair':'gold',[x,y,z],[sx,sy,sz]),{x:0,y:1.21,z:.04,scale:.50,widthScale:.80,depthScale:.94,variant:'central'});
 }
 for(const [rx,ry]of [[.80,1.14]]){
  const points=[];for(let j=0;j<=64;j++){const a=j/64*Math.PI*2;points.push([Math.sin(a)*rx,2.11+Math.cos(a)*ry,-.64]);}curve(points,rx>.9?.032:.017,'gold',72);
 }
 for(let j=0;j<24;j++){const a=j/24*Math.PI*2;add(unit.sphere,'gold',[Math.sin(a)*.94,2.11+Math.cos(a)*1.28,-.64],[.032,.085,.030],[0,0,-a]);}
 for(const side of[-1,1])for(let j=0;j<5;j++)spiral(side*(.72+.10*Math.sin(j*.7)),1.18+j*.43,-.61,.11,side);
 for(let k=0;k<3;k++){
  const y=3.65+k*.22,w=2.70-k*.28,d=1.45-k*.15;
  box('oldgold',[0,y,-.36],[w,.12,d]);
  for(const skin of[false,true]){
   const g=createSanctuaryCarving164({width:w*.96,height:.17,nx:360,ny:34,depth:.044,back:.014,uRepeat:2,v0:.28,v1:.72,skin});
   add(g,skin?'gold':'oldgold',[0,y,-.36+d/2+.015]);
  }

  curve([[-w/2,y+.01,-.36+d/2],[-w*.25,y-.06,-.30+d/2],[0,y-.09,-.27+d/2],[w*.25,y-.06,-.30+d/2],[w/2,y+.01,-.36+d/2]],.025,'gold');
  for(let j=0;j<5;j++)rosette(-w*.42+j*w*.84/4,y,-.29+d/2,.042);
 }
 sphere('gold',[0,4.28,-.35],[.13,.22,.13]);
 for(let j=0;j<15;j++){
  const x=-1.28+j*.183,len=.18+.14*Math.sin(j*.7)**2;
  for(let k=0;k<6;k++)add(unit.torus,'gold',[x,3.59-k*len/6,.43],[.018,.030,.018],[0,k%2*Math.PI/2,0]);
  add(new T.CylinderGeometry(.022,.055,.065,10),'gold',[x,3.56-len,.43]);sphere('oldgold',[x,3.51-len,.43],[.013,.026,.013]);
 }
 for(const x of [-1.10,1.10]){
  add(new T.CylinderGeometry(.13,.17,.07,24),'oldgold',[x,1.72,.49]);beam([x,1.75,.49],[x,2.25,.49],.026);add(new T.CylinderGeometry(.13,.065,.08,24),'gold',[x,2.24,.49]);
  for(const dx of[-.12,.12]){beam([x,2.12,.49],[x+dx,2.24,.49],.014,'oldgold');add(new T.CylinderGeometry(.077,.045,.050,20),'oldgold',[x+dx,2.24,.49]);sphere('flame',[x+dx,2.37,.49],[.014,.052,.014]);}
  sphere('flame',[x,2.38,.49],[.018,.064,.018]);const light=new T.PointLight('#ffd195',5.4,5,2);light.position.set(x,2.38,.49);light.name='spatial188-visible-shadowed-oil-lamp';light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.camera.near=.05;light.shadow.camera.far=8;light.shadow.bias=-.00005;light.shadow.normalBias=.003;group.add(light);
 }
 for(const x of [-1.42,1.42]){
  sphere('oldgold',[x,.93,.10],[.12,.16,.11]);add(new T.CylinderGeometry(.065,.075,.13,16),'gold',[x,1.08,.10]);
  for(let j=0;j<7;j++){const a=j*.9,tip=[x+Math.sin(a)*.17,1.30+.16*Math.cos(a),.10+Math.cos(a)*.10];curve([[x,1.12,.10],[x+Math.sin(a)*.08,1.20,.10],tip],.008,'oldgold',10);rosette(...tip,.044);}
 }
 // A real ritual table and bronze burner occupy the forepart of the
 // shrine. Feet bear on the hall floor; the objects do not form a screen.
 box('wood',[0,.21,1.68],[2.30,.14,.73]);
 for(const x of[-.96,.96])for(const z of[1.43,1.93])box('lacquer',[x,-.205,z],[.13,.69,.13]);
 for(const x of[-1.04,1.04])box('oldgold',[x,.13,1.68],[.10,.08,.78]);
 add(new T.LatheGeometry([[0,0],[.23,0],[.28,.10],[.30,.24],[.33,.27],[.33,.31],[.26,.32],[.25,.15],[0,.12]].map(p=>new T.Vector2(...p)),36),'oldgold',[0,.29,1.68]);
 for(let k=0;k<3;k++){const a=k*Math.PI*2/3;beam([Math.cos(a)*.21,.28,1.68+Math.sin(a)*.21],[Math.cos(a)*.22,.39,1.68+Math.sin(a)*.22],.034,'oldgold');}
 for(const x of[-.07,0,.07])beam([x,.54,1.68],[x+.008,.88,1.68],.006,'wood');
 for(const [i,b]of [...buckets.values()].entries()){
  const mesh=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);mesh.name='reference4-sanctuary-physical-part-'+i;b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
 }
 group.userData.reconstruction='New source rebuilt after reset from the full sanctuary design and source photographs; not a byte-identical v3 restoration.';
 return{group,materials,instances,spatial188:{altarFloorContactY:floorY,closedRaisedPedestalHeight:.55,shrineRecessZ:-5.55,realShadowedOilLamps:2,visibleOilFlames:6,originalAmidaMount,originalAmida:spatial188?.amida?.info()??null,ritualTableFeetOnHallFloor:true},limits:'Small-view complete geometric sanctuary. Hidden depth and detail interpretation are hypotheses; no photograph is used as a rendered surface.'};
}
