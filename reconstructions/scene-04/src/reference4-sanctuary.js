import {emitRestoredBuddha} from './restoration-buddha.js';
// A small but fully three-dimensional sanctuary visible through the exterior
// doorway. No emissive background panel, image plane, or screen-facing proxy.
export function buildReference4Sanctuary(T,{floorY=1.8}={}){
 const group=new T.Group();group.name='reference4-physical-sanctuary-v4';group.position.set(0,floorY,-4.65);
 const materials={
  gold:new T.MeshStandardMaterial({name:'sanctuary-gilding',color:'#cfa647',metalness:.88,roughness:.34}),
  oldgold:new T.MeshStandardMaterial({name:'sanctuary-recessed-gilt',color:'#92713b',metalness:.78,roughness:.45}),
  lacquer:new T.MeshStandardMaterial({name:'sanctuary-black-lacquer',color:'#170e0a',roughness:.31,metalness:.12}),
  wood:new T.MeshStandardMaterial({name:'sanctuary-dark-wood',color:'#352015',roughness:.63}),
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
 for(const x of [-1.88,1.88])box('wood',[x,2.42,-.40],[.18,4.15,1.55]);
 for(const x of [-1.68,1.68]){box('oldgold',[x,2.46,-.98],[.18,3.97,.13]);box('gold',[x,2.46,-.90],[.035,3.97,.04]);for(let j=0;j<12;j++)rosette(x,.68+j*.315,-.89,.067);}
 for(let j=0;j<11;j++){const x=-1.45+j*.29;box('oldgold',[x,2.48,-.995],[.018,3.8,.023]);for(let k=0;k<10;k++)rosette(x,.76+k*.35,-.97,.035);}
 for(let k=0;k<4;k++){
  const w=3.18-k*.20,d=1.60-k*.11,y=.085+k*.17;
  box(k===2?'oldgold':'lacquer',[0,y,0],[w,.17,d]);
  box('gold',[0,y+.075,d/2+.012],[w,.033,.035]);for(const x of [-w/2,w/2])box('gold',[x,y+.075,0],[.035,.033,d]);
 }
 for(const x of [-1.18,-.59,0,.59,1.18]){box('gold',[x,.43,.67],[.48,.23,.06]);box('lacquer',[x,.43,.71],[.43,.185,.025]);spiral(x-.09,.43,.735,.07,1);spiral(x+.09,.43,.735,.07,-1);rosette(x,.43,.74,.052);}
 add(new T.CylinderGeometry(.91,1.04,.18,48),'oldgold',[0,.765,0]);
 for(let j=0;j<36;j++){const a=j*Math.PI/18;add(unit.sphere,'gold',[Math.cos(a)*.92,.79,Math.sin(a)*.74],[.10,.19,.055],[0,-a,Math.PI*.14]);}
 emitRestoredBuddha((geometry,key,x,y,z,sx,sy,sz)=>add(geometry,key==='oldgold'?'hair':'gold',[x,y,z],[sx,sy,sz]),{x:0,y:.86,z:.04,scale:.60,widthScale:1,depthScale:1,variant:'central'});
 for(const [rx,ry]of [[.94,1.31],[.82,1.19],[.72,1.07]]){
  const points=[];for(let j=0;j<=64;j++){const a=j/64*Math.PI*2;points.push([Math.sin(a)*rx,2.11+Math.cos(a)*ry,-.64]);}curve(points,rx>.9?.032:.017,'gold',72);
 }
 for(let j=0;j<44;j++){const a=j/44*Math.PI*2;add(unit.sphere,'gold',[Math.sin(a)*1.05,2.11+Math.cos(a)*1.40,-.64],[.045,.145,.036],[0,0,-a]);}
 for(const side of [-1,1])for(let j=0;j<9;j++)spiral(side*(.72+.15*Math.sin(j*.7)),1.13+j*.25,-.61,.15,side);
 for(let k=0;k<3;k++){
  const y=3.65+k*.22,w=2.70-k*.28,d=1.45-k*.15;
  box('oldgold',[0,y,-.36],[w,.12,d]);
  curve([[-w/2,y+.01,-.36+d/2],[-w*.25,y-.06,-.30+d/2],[0,y-.09,-.27+d/2],[w*.25,y-.06,-.30+d/2],[w/2,y+.01,-.36+d/2]],.025,'gold');
  for(let j=0;j<13;j++)rosette(-w*.46+j*w*.92/12,y,-.29+d/2,.056);
 }
 sphere('gold',[0,4.28,-.35],[.13,.22,.13]);
 for(let j=0;j<15;j++){
  const x=-1.28+j*.183,len=.18+.14*Math.sin(j*.7)**2;
  for(let k=0;k<6;k++)add(unit.torus,'gold',[x,3.59-k*len/6,.43],[.018,.030,.018],[0,k%2*Math.PI/2,0]);
  add(new T.CylinderGeometry(.022,.055,.065,10),'gold',[x,3.56-len,.43]);sphere('oldgold',[x,3.51-len,.43],[.013,.026,.013]);
 }
 for(const x of [-1.10,1.10]){
  add(new T.CylinderGeometry(.13,.17,.07,24),'oldgold',[x,.82,.49]);beam([x,.85,.49],[x,1.35,.49],.026);add(new T.CylinderGeometry(.13,.065,.08,24),'gold',[x,1.34,.49]);
  sphere('flame',[x,1.48,.49],[.018,.064,.018]);const light=new T.PointLight('#ffd195',1.8,4,2);light.position.set(x,1.48,.49);light.name='reference4-visible-oil-lamp';group.add(light);
 }
 for(const x of [-1.42,1.42]){
  sphere('oldgold',[x,.93,.10],[.12,.16,.11]);add(new T.CylinderGeometry(.065,.075,.13,16),'gold',[x,1.08,.10]);
  for(let j=0;j<7;j++){const a=j*.9,tip=[x+Math.sin(a)*.17,1.30+.16*Math.cos(a),.10+Math.cos(a)*.10];curve([[x,1.12,.10],[x+Math.sin(a)*.08,1.20,.10],tip],.008,'oldgold',10);rosette(...tip,.044);}
 }
 for(const [i,b]of [...buckets.values()].entries()){
  const mesh=new T.InstancedMesh(b.geometry,b.material,b.matrices.length);mesh.name='reference4-sanctuary-physical-part-'+i;b.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=mesh.receiveShadow=true;mesh.instanceMatrix.needsUpdate=true;group.add(mesh);
 }
 group.userData.reconstruction='New source rebuilt after reset from the full sanctuary design and source photographs; not a byte-identical v3 restoration.';
 return{group,materials,instances,limits:'Small-view complete geometric sanctuary. Hidden depth and detail interpretation are hypotheses; no photograph is used as a rendered surface.'};
}
