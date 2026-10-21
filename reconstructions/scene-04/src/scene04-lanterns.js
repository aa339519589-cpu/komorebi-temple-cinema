import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {applyMetricUV} from './scene04-surfaces.js';
import {createNeutralScannedGranite04} from './scene04-scanned-stone.js';
const TAU=Math.PI*2;
function petalRelief(width=.16,length=.29,depth=.025){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width,.08,-width*.65,length*.9,0,length);s.bezierCurveTo(width*.7,length*.84,width,.10,0,0);
 return new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.007,bevelSegments:2,curveSegments:7});
}
function weatheredOctagonalShaft(seed=1){
 const p=[],uv=[],ix=[],vertical=48,across=24;
 for(let face=0;face<8;face++){
  const a=-Math.PI/8+face*TAU/8,b=a+TAU/8,mid=(a+b)/2,nx=Math.sin(mid),nz=Math.cos(mid),start=p.length/3;
  for(let j=0;j<=vertical;j++)for(let i=0;i<=across;i++){
   const t=j/vertical,u=i/across*2-1,y=.73+t*1.03,r=.370+.012*Math.sin(t*Math.PI)-.008*t,
    x=T.MathUtils.lerp(Math.sin(a)*r,Math.sin(b)*r,(u+1)/2),z=T.MathUtils.lerp(Math.cos(a)*r,Math.cos(b)*r,(u+1)/2),
    stem=.55*Math.sin(t*TAU+seed*.12+face*.31),edge=Math.max(0,1-u*u),
    channel=.022*Math.exp(-(((u-stem)/.11)**2))*Math.sin(Math.PI*t)**2;
   let cuts=0;for(let k=0;k<5;k++){const yy=.15+k*.155,side=k%2?1:-1,du=u-(.55*Math.sin(yy*TAU+seed*.12+face*.31)+side*.26),dt=t-yy,xx=du*.78-side*dt*2.0,zz=dt*1.1+side*du*.10;cuts+=.012*Math.exp(-((xx/.22)**2+(zz/.055)**2));}
   const wear=.003*Math.sin(x*43+y*37+seed)*Math.sin(z*39-y*29+seed),depth=(channel+cuts-wear)*edge*Math.sin(Math.PI*t)**2;
   p.push(x-nx*depth,y,z-nz*depth);uv.push(x*4,z*4+y*4);
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<across;i++){const q=start+j*(across+1)+i;ix.push(q,q+1,q+across+1,q+1,q+across+2,q+across+1);}
 }
 for(const top of[false,true]){const y=top?1.76:.73,t=top?1:0,r=.370+.012*Math.sin(t*Math.PI)-.008*t,center=p.length/3;p.push(0,y,0);uv.push(0,0);for(let j=0;j<8;j++){const a=-Math.PI/8+j*TAU/8;p.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(Math.sin(a)*r,Math.cos(a)*r);}for(let j=0;j<8;j++){const a=center+1+j,b=center+1+(j+1)%8;top?ix.push(center,a,b):ix.push(center,b,a);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function finialMossSkin(g,seed){
 const source=g.index?g.toNonIndexed():g,p=source.attributes.position,n=source.attributes.normal,positions=[],normals=[],uv=[],colors=[];
 const sample=i=>{const q=new T.Vector3().fromBufferAttribute(p,i),normal=new T.Vector3().fromBufferAttribute(n,i),growth=Math.sin(q.x*24+q.z*19+seed)+.6*Math.sin(q.y*31-q.x*17+seed*.71)+.10;return{q,normal,f:Math.min(growth,(normal.y+.45)*2)};};
 for(let i=0;i<p.count;i+=3){const tri=[0,1,2].map(k=>sample(i+k)),poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],aa=a.f>=0,bb=b.f>=0;if(aa)poly.push(a);if(aa!==bb){const t=a.f/(a.f-b.f);poly.push({q:a.q.clone().lerp(b.q,t),normal:a.normal.clone().lerp(b.normal,t).normalize(),f:0});}}for(let k=1;k<poly.length-1;k++)for(const v of[poly[0],poly[k],poly[k+1]]){const q=v.q.clone().addScaledVector(v.normal,.0045),tone=.78+.14*Math.sin(q.x*31+q.y*19+seed);positions.push(...q.toArray());normals.push(...v.normal.toArray());uv.push(q.x*4,q.z*4);colors.push(tone*.73,tone,tone*.47);}}
 if(source!==g)source.dispose();const out=new T.BufferGeometry();out.setAttribute('position',new T.Float32BufferAttribute(positions,3));out.setAttribute('normal',new T.Float32BufferAttribute(normals,3));out.setAttribute('uv',new T.Float32BufferAttribute(uv,2));out.setAttribute('color',new T.Float32BufferAttribute(colors,3));return out;
}
export function buildRestorationStoneLanterns({materials:borrowed={},options={}}={}){
 const group=new T.Group();group.name='reference04-rebuilt-carved-granite-lanterns';
 const stone=createNeutralScannedGranite04('metric-quartz-granite-lantern','#746d60',.80),capStone=createNeutralScannedGranite04('weather-aged-damp-toro-cap','#575b4f',.88),recess=createNeutralScannedGranite04('carved-granite-recess','#494a40',.65),moss=new T.MeshStandardMaterial({color:'#3c481f',roughness:1,vertexColors:true,side:T.DoubleSide}),paper=new T.MeshStandardMaterial({color:'#d6b477',emissive:'#ffb75a',emissiveIntensity:.30,roughness:.9,side:T.DoubleSide}),bronze=new T.MeshStandardMaterial({color:'#44351c',metalness:.45,roughness:.69});
 capStone.roughness=.84;capStone.clearcoat=.10;capStone.clearcoatRoughness=.34;
 const geometries=[],materials=[stone,capStone,recess,moss,paper,bronze],lanterns=[],emitters=[];let triangles=0;
 function addMerged(parts,mat,parent,name){if(!parts.length)return null;const clean=parts.map(g=>{g=g.index?g.toNonIndexed():g;for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));return g;}),g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());geometries.push(g);const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=mat!==paper;mesh.receiveShadow=mat!==paper;parent.add(mesh);triangles+=g.attributes.position.count/3;return mesh;}
 for(const [id,anchor]of(options.anchors??[]).entries()){
  const [x,y,z,oldScale]=anchor,scale=oldScale*3.34/4.4,width=id<2?(options.heroWidthFactor??1):1,body=new T.Group();body.position.set(x,y,z);body.scale.set(scale*width,scale,scale*width);if(id<2)body.rotation.y=-Math.sign(x)*(options.heroInwardYaw??0);group.add(body);lanterns.push(body);
  const stoneParts=[],capParts=[],darkParts=[],lightParts=[],bars=[],mossParts=[];
  function put(g,list,p=[0,0,0],rot=[0,0,0]){g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...p);list.push(applyMetricUV(g));}
  function box(size,p,list=stoneParts,bevel=.018){put(new RoundedBoxGeometry(...size,2,bevel),list,p);}
  // Low broad base, short substantial cut shaft, carved frieze, open light box.
  for(const [w,h,cy]of[[1.60,.19,.095],[1.46,.21,.295],[1.24,.20,.50],[1.04,.16,.70]])box([w*.99,h,w*.99],[0,cy,0],stoneParts,.031);
  put(weatheredOctagonalShaft(id+611),stoneParts);box([.90,.22,.90],[0,1.85,0]);
  box([1.32,.37,1.32],[0,2.135,0]);box([1.42,.10,1.42],[0,2.37,0]);
  for(const yy of[1.968,2.30])box([1.40,.055,1.40],[0,yy,0]);
  // Four recessed stone vine panels retain real relief depth and deep grooves.
  for(let f=0;f<4;f++){
   const a=f*Math.PI/2;
   const place=(g,list,xx,yy,zz)=>{g.translate(xx,yy,zz);g.rotateY(a);list.push(applyMetricUV(g));};
   for(const [yy,r]of[[.295,.16],[2.135,.17]])for(const xx of[-.43,0,.43]){
    for(let k=0;k<7;k++){const t=k*TAU/7,g=petalRelief(r*.4,r*.95,.048);g.rotateZ(-t);place(g,stoneParts,xx+Math.sin(t)*r*.16,yy+Math.cos(t)*r*.16,yy<1?.721:.658);}
   }
   // The stem is carved into a dark shallow channel; stone foliage projects 2 cm.
   const pts=[];for(let j=0;j<=20;j++){const t=j/20;pts.push(new T.Vector3(.077*Math.sin(t*TAU),.81+t*.94,.331));}
   const channel=new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.013,6,false);channel.rotateY(a);darkParts.push(applyMetricUV(channel));
   for(let k=0;k<5;k++){const t=.10+k*.17,cy=.81+t*.94,cx=.077*Math.sin(t*TAU),g=petalRelief(.067,.21,.040);g.rotateZ((k%2?1:-1)*.68);place(g,stoneParts,cx,cy,.337);}
  }
  // Actual window cavity: thick corner posts, inner stone reveals, fine bronze grid.
  box([1.12,.08,1.12],[0,2.40,0]);box([1.13,.10,1.13],[0,3.07,0]);
  for(const xx of[-.46,.46])for(const zz of[-.46,.46])box([.17,.65,.17],[xx,2.73,zz]);
  for(let f=0;f<4;f++){
   const yaw=f*Math.PI/2;
   const pane=new T.PlaneGeometry(.75,.62);pane.translate(0,2.70,.445);pane.rotateY(yaw);lightParts.push(pane);
   for(let k=-3;k<=3;k++){const b=new T.BoxGeometry(.011,.63,.022);b.translate(k*.105,2.70,.50);b.rotateY(yaw);bars.push(b);}
   for(let k=-2;k<=2;k++){const b=new T.BoxGeometry(.75,.011,.022);b.translate(0,2.70+k*.105,.505);b.rotateY(yaw);bars.push(b);}
  }
  // A real compression boss closes the roof-to-window support contact.
  put(new T.CylinderGeometry(.36,.56,.68,8),stoneParts,[0,3.38,0]);
  // Four real sloping roof faces meet at a small crown. The squared eaves
  // turn upward at the corners and carry a deep, continuous stone soffit.
  const capTop=new T.BufferGeometry(),capBottom=new T.BufferGeometry(),grid=44,verts=[],capIndices=[],phase=id*1.73+.41;
  const capAt=(x,z)=>{const edge=Math.max(Math.abs(x),Math.abs(z)),corner=Math.pow(Math.abs(x*z),4),warp=1-.14*Math.pow(Math.abs(x*z),3),angle=Math.atan2(z,x),wear=.029*Math.sin(x*5.8+phase)*Math.cos(z*4.7-phase)+.013*Math.sin(x*17.2+z*13.4+phase),ribs=.016*Math.cos(angle*8+phase*.14)*Math.sin(Math.PI*edge);return[x*1.13*warp,3.18+.58*Math.pow(1-edge,.91)+.065*corner+wear+ribs,z*1.13*warp];};
  for(let j=0;j<=grid;j++)for(let i=0;i<=grid;i++){
   const x=-1+2*i/grid,z=-1+2*j/grid;verts.push(...capAt(x,z));
  }
  for(let j=0;j<grid;j++)for(let i=0;i<grid;i++){const a=j*(grid+1)+i,b=a+1,c=a+grid+1,d=c+1;capIndices.push(a,c,d,a,d,b);}
  capTop.setAttribute('position',new T.Float32BufferAttribute(verts,3));capTop.setIndex(capIndices);capTop.computeVertexNormals();
  const bottomVerts=verts.flatMap((v,i)=>[v-(i%3===1?.13:0)]),bottomIndices=[];
  for(let i=0;i<capIndices.length;i+=3)bottomIndices.push(capIndices[i],capIndices[i+2],capIndices[i+1]);
  capBottom.setAttribute('position',new T.Float32BufferAttribute(bottomVerts,3));capBottom.setIndex(bottomIndices);capBottom.computeVertexNormals();
  const roofPositions=[],roofIndices=[];
  for(const g of[capTop,capBottom]){const offset=roofPositions.length/3,p=g.attributes.position;for(let i=0;i<p.count;i++)roofPositions.push(p.getX(i),p.getY(i),p.getZ(i));for(const i of g.index.array)roofIndices.push(offset+i);}
  const sideStride=grid+1,perimeter=[...Array.from({length:sideStride},(_,i)=>i),...Array.from({length:grid},(_,i)=>(i+1)*sideStride+grid),...Array.from({length:grid},(_,i)=>grid*sideStride+grid-1-i),...Array.from({length:grid-1},(_,i)=>(grid-1-i)*sideStride)];
  for(let i=0;i<perimeter.length;i++){const a=perimeter[i],b=perimeter[(i+1)%perimeter.length],lo=sideStride*sideStride;roofIndices.push(a,b,lo+b,a,lo+b,lo+a);}
  const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(roofPositions,3));roof.setIndex(roofIndices);roof.computeVertexNormals();capParts.push(applyMetricUV(roof));
  const cp=capTop.attributes.position,cn=capTop.attributes.normal,ci=capTop.index.array;
  for(let e=0;e<4;e++){
   const pts=Array.from({length:25},(_,i)=>{const t=-1+2*i/24,x=e<2?t:(e===2?1:-1),z=e<2?(e===0?1:-1):t;return new T.Vector3(...capAt(x,z));});
   const lip=new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.034,8,false);capParts.push(applyMetricUV(lip));
  }
  for(const sx of[-1,1])for(const sz of[-1,1]){
   const pts=[0,.32,.64,1].map(t=>new T.Vector3(...capAt(sx*t,sz*t)).add(new T.Vector3(0,.008,0)));
   capParts.push(applyMetricUV(new T.TubeGeometry(new T.CatmullRomCurve3(pts),30,.016,7,false)));
  }
  const mp=[],mc=[];
  const sample=k=>{const p=new T.Vector3().fromBufferAttribute(cp,k),n=new T.Vector3().fromBufferAttribute(cn,k),f=Math.sin(p.x*6.2+p.z*3.1+phase)+Math.sin(p.z*9-p.x*2-phase)+.5*Math.sin(p.x*23+p.z*31+phase)+.05;return{p,n,f:Math.min(f,(n.y-.25)*3,(p.y-3.26)*4)};};
  for(let k=0;k<ci.length;k+=3){const tri=[0,1,2].map(j=>sample(ci[k+j])),poly=[];for(let e=0;e<3;e++){const a=tri[e],b=tri[(e+1)%3],aa=a.f>=0,bb=b.f>=0;if(aa)poly.push(a);if(aa!==bb){const t=a.f/(a.f-b.f);poly.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),f:0});}}
   for(let j=1;j<poly.length-1;j++){
    for(const v of[poly[0],poly[j],poly[j+1]]){const q=v.p.clone().addScaledVector(v.n,.005),shade=.72+.13*Math.sin(q.x*17+q.z*19);mp.push(q.x,q.y,q.z);mc.push(shade*.72,shade,shade*.47);}
    const q=poly[0].p.clone().add(poly[j].p).add(poly[j+1].p).multiplyScalar(1/3),nn=poly[0].n.clone().add(poly[j].n).add(poly[j+1].n).normalize();q.addScaledVector(nn,.007);const w=.007,h=.014;
    for(const v of[[q.x-w,q.y,q.z],[q.x+w,q.y,q.z],[q.x+nn.x*h,q.y+nn.y*h,q.z+nn.z*h],[q.x,q.y,q.z-w],[q.x,q.y,q.z+w],[q.x+nn.x*h,q.y+nn.y*h,q.z+nn.z*h]]){mp.push(...v);mc.push(.62,.81,.40);}
   }
  }
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.Float32BufferAttribute(mp,3));mg.setAttribute('color',new T.Float32BufferAttribute(mc,3));mg.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(mp.length/3*2),2));mg.computeVertexNormals();mossParts.push(mg);capTop.dispose();capBottom.dispose();
  // Pagoda-like rounded lotus finial is two compact stones, not a tall cone.
  for(const [cy,rx,ry]of[[3.84,.27,.105],[4.04,.31,.19],[4.26,.115,.13]]){const g=new T.SphereGeometry(1,28,18),p=g.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j),z=p.getZ(j),r=1+.090*Math.sin(x*4.2+z*3.7+phase)*Math.cos(y*5.3-phase)+.025*Math.sin(x*11-y*9+z*7+phase);p.setXYZ(j,x*r*rx,y*r*ry,z*r*rx);}g.computeVertexNormals();put(finialMossSkin(g,phase+cy*3),mossParts,[0,cy,0]);put(g,capParts,[0,cy,0]);}
  const tip=new T.ConeGeometry(.055,.17,12);put(tip,capParts,[0,4.40-.085,0]);
  addMerged(stoneParts,stone,body,'carved-metric-granite-body');addMerged(capParts,capStone,body,'closed-weathered-toro-cap-and-finial');addMerged(darkParts,recess,body,'actual-carved-stone-grooves');const paperMesh=addMerged(lightParts,paper,body,'warm-recessed-paper');addMerged(bars,bronze,body,'fine-bronze-light-window-grid');addMerged(mossParts,moss,body,'surface-rooted-moss-fronds');
  const glow=new T.PointLight('#ffbd70',3.8,2.5,2);glow.position.set(0,2.70,0);body.add(glow);emitters.push({index:id,object:body,paperMesh,material:paper,localPosition:new T.Vector3(0,2.70,0)});
 }
 function getEmitterMetadata(){group.updateMatrixWorld(true);return emitters.map(e=>({...e,worldPosition:e.object.localToWorld(e.localPosition.clone()),worldCenter:e.object.localToWorld(e.localPosition.clone()),worldScale:e.object.getWorldScale(new T.Vector3()),windows:[]}));}
 return{group,lanterns,materials,stats:{triangles,lanterns:lanterns.length},bounds:new T.Box3().setFromObject(group),getEmitterMetadata,dispose(){for(const g of geometries)g.dispose();for(const m of materials){for(const v of Object.values(m.userData.maps??{}))v.dispose();m.dispose();}group.removeFromParent();}};
}
