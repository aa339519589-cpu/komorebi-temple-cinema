/** Additional reference-six cast-metal carving on the existing altar. No reference pixels enter the scene. */
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const TAU=Math.PI*2;
export function applySanctuaryCarvedDetail(world,{bevels=true}={}){
 const altar=world.scene.getObjectByName('restoration-reference6-altar'),pendants=world.scene.getObjectByName('restoration-reference6-side-pendants');
 if(!altar||!pendants)throw Error('Existing reference-six assemblies are required');
 if(altar.getObjectByName('reference6-detail-restoration'))throw Error('Detail already installed');
 const root=new T.Group();root.name='reference6-detail-restoration';altar.add(root);
 const hanging=new T.Group();hanging.name='reference6-dense-chased-pendants';pendants.add(hanging);
 const materials=new Map();altar.traverse(o=>{if(o.material&&!Array.isArray(o.material))materials.set(o.material.name,o.material)});
 const find=s=>[...materials.values()].find(m=>m.name.includes(s));
 const gold=(find('room-gold')||find('polished-gilt')).clone(),darkGold=(find('room-oldgold')||find('carved-gilt')).clone();
 gold.name='detail-warm-cast-gold';gold.color.set('#c9963f');gold.roughness=.31;gold.metalness=.92;
 darkGold.name='detail-patinated-gilt';darkGold.color.set('#875523');darkGold.roughness=.42;darkGold.metalness=.89;
 const ivory=new T.MeshStandardMaterial({name:'detail-ivory-offering-petals',color:'#e2d5bb',roughness:.62,side:T.DoubleSide});
 const leafMat=new T.MeshStandardMaterial({name:'detail-offering-leaf',color:'#35482b',roughness:.6,side:T.DoubleSide});
 const stalkMat=new T.MeshStandardMaterial({name:'detail-natural-stalk',color:'#4c4425',roughness:.73});
 const geometry=[],ownedMaterials=[gold,darkGold,ivory,leafMat,stalkMat],buckets=new Map(),dummy=new T.Object3D();
 const stats={castScrolls:0,carvedLeaves:0,pearlMouldings:0,blossomPetals:0,naturalLeaves:0,bevelledMeshes:0};
 function emit(g,m,x,y,z,sx=1,sy=sx,sz=sx,rz=0,parent=root,rx=0,ry=0){const key=g.uuid+':'+m.uuid+':'+parent.uuid;if(!buckets.has(key))buckets.set(key,{g,m,parent,matrices:[]});dummy.position.set(x,y,z);dummy.scale.set(sx,sy,sz);dummy.rotation.set(rx,ry,rz);dummy.updateMatrix();buckets.get(key).matrices.push(dummy.matrix.clone());}
 function own(g){geometry.push(g);return g;}
 const bead=own(new T.SphereGeometry(1,8,6));
 const scroll=own(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:40},(_,i)=>{const t=i/39,a=t*TAU*1.23,r=.052*(1-t)+.006;return new T.Vector3(Math.cos(a)*r,Math.sin(a)*r+.095*t,.0025*Math.sin(t*Math.PI));})),42,.0033,6,false));
 const leaf=own((()=>{const p=[],uv=[],ix=[];for(let j=0;j<=12;j++)for(let i=0;i<=8;i++){const t=j/12,u=i/8*2-1,w=Math.pow(Math.sin(Math.PI*t),.8)*.039;p.push(u*w,t*.135,.014*Math.sin(Math.PI*t)*(1-u*u)+.003*Math.sin(t*Math.PI*2)*u);uv.push((u+1)/2,t)}for(let j=0;j<12;j++)for(let i=0;i<8;i++){const a=j*9+i;ix.push(a,a+1,a+9,a+1,a+10,a+9)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;})());
 function stem(points,r,parent=root,material=gold){const g=own(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,6,false));const mesh=new T.Mesh(g,material);mesh.castShadow=mesh.receiveShadow=true;mesh.name='reference6-rooted-cast-stem';parent.add(mesh);stats.castScrolls++;}
 const tiers=[{y:.92,h:.197,w:5.28,z:1.543,weights:[1,1.8,.72,1.8,1]},{y:1.28,h:.167,w:5.58,z:1.393,weights:[2.7,.72,.95,.72,2.7]},{y:1.64,h:.157,w:5.97,z:1.243,weights:[1.05,.65,1.2,.85,1.2,.65,1.05]}];
 for(const t of tiers){
  const gap=.105,avail=t.w-.22-gap*(t.weights.length-1),sum=t.weights.reduce((s,x)=>s+x,0);let cursor=-t.w/2+.11;
  for(const [field,weight]of t.weights.entries()){
   const w=avail*weight/sum,cx=cursor+w/2;cursor+=w+gap;const n=Math.max(3,Math.round(w/.10));
   for(let k=0;k<n;k++){const x=cx-w*.45+(k/(n-1))*w*.9;for(const side of[-1,1]){emit(scroll,(k+field)%3?gold:darkGold,x,t.y+side*t.h*.22,t.z+.035,.55,.45,.72,side*Math.PI/2);stats.castScrolls++;emit(leaf,gold,x,t.y+side*t.h*.26,t.z+.034,.22,.29,.38,side*Math.PI/2);stats.carvedLeaves++;}}
   for(const side of[-1,1])for(let k=0;k<Math.round(w/.023);k++){const x=cx-w/2+.022+k*.023;emit(bead,gold,x,t.y+side*(t.h/2-.008),t.z+.034,.0047,.0050,.0038);stats.pearlMouldings++;}
  }
 }
 for(const side of[-1,1]){
  const x0=side*4.15,g=own(new RoundedBoxGeometry(.704,3.13,.020,3,.006)),backing=new T.Mesh(g,darkGold);backing.position.set(x0,4.70,2.046);backing.castShadow=backing.receiveShadow=true;backing.name='reference6-solid-chased-pendant';hanging.add(backing);
  for(let row=0;row<28;row++)for(let col=0;col<5;col++){
   const x=x0+(col-2)*.129+(row%2?.018:-.018),y=6.20-row*.108;
   for(const sign of[-1,1]){emit(scroll,gold,x+sign*.012,y,2.063,.63,.65,.8,sign*(row%2?.15:-.15),hanging);stats.castScrolls++;emit(leaf,gold,x,y+.034,2.063,.34,.45,.6,sign*.7,hanging);stats.carvedLeaves++;}
   emit(bead,gold,x,y+.026,2.075,.0043,.0043,.0035,0,hanging);stats.pearlMouldings++;
  }
  for(const edge of[-1,1])for(let n=0;n<154;n++){emit(bead,gold,x0+edge*.345,6.25-n*.0202,2.064,.004,.0052,.0037,0,hanging);stats.pearlMouldings++;}
 }
 for(const spec of[{x:0,y:1.40,z:-.79,s:.75,apex:6.65,wide:1.1},{x:-2.63,y:1.80,z:-.87,s:.52,apex:5.15,wide:.97},{x:2.63,y:1.80,z:-.87,s:.52,apex:5.15,wide:.97}]){
  const h=(spec.apex-spec.y)/spec.s-1.4;
  for(const side of[-1,1])for(let row=0;row<21;row++){
   const t=.12+row/20*.72,e=2.09*spec.wide*Math.pow(Math.sin(Math.PI*t),.72)*(1-.20*t),y=spec.y+(1.4+t*h)*spec.s,x=spec.x+side*(e-.23)*spec.s;
   for(let k=0;k<3;k++){const xx=x-side*k*.072,yy=y+k*.048;emit(scroll,k%2?darkGold:gold,xx,yy,spec.z+.08,spec.s*.85,spec.s*1.25,spec.s*.9,-side*.7);stats.castScrolls++;emit(leaf,gold,xx,yy+.03,spec.z+.085,spec.s*.52,spec.s*.7,spec.s*.8,-side*.7);stats.carvedLeaves++;}
  }
 }
 const petal=own(new T.SphereGeometry(1,10,7));
 const locations=[[-5.05,0,1.90,.82],[5.05,0,1.90,.82],[-3.52,2.175,.815,.49],[3.52,2.175,.815,.49]];
 for(const [vi,loc]of locations.entries()){
  const [x0,y0,z0,s]=loc;
  for(let branch=0;branch<9;branch++){
   const a=branch*2.39996+vi*.71,lean=.35+.22*Math.sin(branch*3.14),h=.96+.60*((branch*7)%11)/11;
   const tip=[x0+Math.cos(a)*lean*s,y0+(.60+h)*s,z0+Math.sin(a)*lean*s];
   stem([[x0,y0+.38*s,z0],[x0+Math.cos(a)*lean*s*.45,y0+(h*.6+.55)*s,z0+Math.sin(a)*lean*s*.25],tip],.006*s,root,stalkMat);
   for(let n=0;n<5;n++){const t=.28+n*.135,xx=x0+(tip[0]-x0)*t,yy=y0+(.6+h*t)*s,zz=z0+(tip[2]-z0)*t;emit(leaf,leafMat,xx,yy,zz,1.8*s,1.8*s,.6*s,(n%2?1:-1)*.9,root,.4,a);stats.naturalLeaves++;}
   for(let bloom=0;bloom<3;bloom++){
    const cx=tip[0]+Math.cos(a+bloom*2)*.105*s,cy=tip[1]-.04*bloom*s,cz=tip[2]+Math.sin(a+bloom*2)*.12*s;
    for(let ring=0;ring<2;ring++)for(let k=0;k<7;k++){const angle=k/7*TAU+ring*.44,r=(.026+ring*.020)*s;emit(petal,ivory,cx+Math.cos(angle)*r,cy+Math.sin(angle)*r,cz+ring*.012*s,.035*s,.058*s,.012*s,-angle,root,.35*Math.cos(a),.2*Math.sin(a));stats.blossomPetals++;}
    emit(bead,gold,cx,cy,cz+.025*s,.012*s,.012*s,.007*s);
   }
  }
 }
 const replaced=[];
 if(bevels){const rounded=own(new RoundedBoxGeometry(1,1,1,3,.025));altar.traverse(o=>{if(o.isMesh&&o.geometry?.type==='BoxGeometry'&&o.geometry.parameters?.width===1){replaced.push({mesh:o,geometry:o.geometry});o.geometry=rounded;stats.bevelledMeshes++;}});}
 for(const {g,m,parent,matrices}of buckets.values()){
  const mesh=new T.InstancedMesh(g,m,matrices.length);matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.name='reference6-cast-detail:'+m.name;parent.add(mesh);
 }
 root.updateMatrixWorld(true);hanging.updateMatrixWorld(true);
 const report={...stats,scope:'Secondary chased metal, edge radii, rooted offering sprays on the existing altar',referencePixelsInScene:false,originalFigureGeometryChanged:false,addedDrawBatches:buckets.size,revision:'detail-r12'};
 return {root,hanging,report,dispose(){root.removeFromParent();hanging.removeFromParent();for(const r of replaced)r.mesh.geometry=r.geometry;geometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
