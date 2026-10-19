import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {stoneMaterial,applyMetricUV} from './scene04-surfaces.js';
const TAU=Math.PI*2;
function petalRelief(width=.16,length=.29,depth=.025){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width,.08,-width*.65,length*.9,0,length);s.bezierCurveTo(width*.7,length*.84,width,.10,0,0);
 return new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.008,bevelThickness:.007,bevelSegments:2,curveSegments:7});
}
export function buildRestorationStoneLanterns({materials:borrowed={},options={}}={}){
 const group=new T.Group();group.name='reference04-rebuilt-carved-granite-lanterns';
 const stone=stoneMaterial('metric-quartz-granite-lantern','#777b7e',{seed:611}),recess=stoneMaterial('carved-granite-recess','#515b65',{seed:612}),moss=new T.MeshStandardMaterial({color:'#465326',roughness:1,vertexColors:true,side:T.DoubleSide}),paper=new T.MeshStandardMaterial({color:'#c28e39',emissive:'#ffa527',emissiveIntensity:.5,roughness:.9,side:T.DoubleSide}),bronze=new T.MeshStandardMaterial({color:'#44351c',metalness:.45,roughness:.69});
 const geometries=[],materials=[stone,recess,moss,paper,bronze],lanterns=[],emitters=[];let triangles=0;
 function addMerged(parts,mat,parent,name){if(!parts.length)return null;const clean=parts.map(g=>{g=g.index?g.toNonIndexed():g;for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));return g;}),g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());geometries.push(g);const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=mat!==paper;mesh.receiveShadow=mat!==paper;parent.add(mesh);triangles+=g.attributes.position.count/3;return mesh;}
 for(const [id,anchor]of(options.anchors??[]).entries()){
  const [x,y,z,oldScale]=anchor,scale=oldScale*3.34/4.4,width=id<2?(options.heroWidthFactor??1):1,body=new T.Group();body.position.set(x,y,z);body.scale.set(scale*width,scale,scale*width);if(id<2)body.rotation.y=-Math.sign(x)*(options.heroInwardYaw??0);group.add(body);lanterns.push(body);
  const stoneParts=[],darkParts=[],lightParts=[],bars=[],mossParts=[];
  function put(g,list,p=[0,0,0],rot=[0,0,0]){g.rotateX(rot[0]);g.rotateY(rot[1]);g.rotateZ(rot[2]);g.translate(...p);list.push(applyMetricUV(g));}
  function box(size,p,list=stoneParts,bevel=.018){put(new RoundedBoxGeometry(...size,2,bevel),list,p);}
  // Low broad base, short substantial cut shaft, carved frieze, open light box.
  for(const [w,h,cy]of[[1.60,.19,.095],[1.46,.21,.295],[1.24,.20,.50],[1.04,.12,.66]])box([w,h,w],[0,cy,0]);
  box([.76,1.12,.76],[0,1.29,0]);box([.95,.12,.95],[0,1.89,0]);
  box([1.42,.37,1.42],[0,2.135,0]);box([1.55,.10,1.55],[0,2.37,0]);
  for(const yy of[1.968,2.30])box([1.49,.055,1.49],[0,yy,0]);
  // Four recessed stone vine panels retain real relief depth and deep grooves.
  for(let f=0;f<4;f++){
   const a=f*Math.PI/2;
   const place=(g,list,xx,yy,zz)=>{g.translate(xx,yy,zz);g.rotateY(a);list.push(applyMetricUV(g));};
   for(const [yy,r]of[[.295,.16],[2.135,.17]])for(const xx of[-.43,0,.43]){
    for(let k=0;k<7;k++){const t=k*TAU/7,g=petalRelief(r*.4,r*.95,.022);g.rotateZ(-t);place(g,stoneParts,xx+Math.sin(t)*r*.16,yy+Math.cos(t)*r*.16,yy<1?.744:.728);}
   }
   // The stem is carved into a dark shallow channel; stone foliage projects 2 cm.
   const pts=[];for(let j=0;j<=20;j++){const t=j/20;pts.push(new T.Vector3(.09*Math.sin(t*TAU),.81+t*.94,.388));}
   const channel=new T.TubeGeometry(new T.CatmullRomCurve3(pts),32,.013,6,false);channel.rotateY(a);darkParts.push(applyMetricUV(channel));
   for(let k=0;k<5;k++){const t=.10+k*.17,cy=.81+t*.94,cx=.09*Math.sin(t*TAU),g=petalRelief(.067,.21,.016);g.rotateZ((k%2?1:-1)*.68);place(g,stoneParts,cx,cy,.392);}
  }
  // Actual window cavity: thick corner posts, inner stone reveals, fine bronze grid.
  box([1.12,.12,1.12],[0,2.47,0]);box([1.13,.10,1.13],[0,3.19,0]);
  for(const xx of[-.46,.46])for(const zz of[-.46,.46])box([.17,.65,.17],[xx,2.82,zz]);
  for(let f=0;f<4;f++){
   const yaw=f*Math.PI/2;
   const pane=new T.PlaneGeometry(.75,.62);pane.translate(0,2.82,.445);pane.rotateY(yaw);lightParts.push(pane);
   for(let k=-3;k<=3;k++){const b=new T.BoxGeometry(.018,.63,.024);b.translate(k*.105,2.82,.50);b.rotateY(yaw);bars.push(b);}
   for(let k=-2;k<=2;k++){const b=new T.BoxGeometry(.75,.016,.025);b.translate(0,2.82+k*.116,.505);b.rotateY(yaw);bars.push(b);}
  }
  // A real compression boss closes the roof-to-window support contact.
  put(new T.CylinderGeometry(.43,.67,.36,8),stoneParts,[0,3.37,0]);
  // A thick octagonal/fluted stone cap, with a rolled lower lip rather than
  // four thin architectural wings. Moss is clipped from these actual faces.
  const profile=[[0,3.48],[.42,3.45],[.70,3.13],[1.04,3.10],[1.12,3.14],[1.13,3.30],[1.04,3.29],[.84,3.34],[.62,3.46],[.38,3.65],[.17,3.75],[0,3.78]],cap=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64),cp=cap.attributes.position;
  for(let k=0;k<cp.count;k++){const x=cp.getX(k),z=cp.getZ(k),a=Math.atan2(z,x),r=1+.055*Math.cos(a*4)+.018*Math.sin(a*11);cp.setXYZ(k,x*r,cp.getY(k)+.008*Math.sin(x*17+z*19),z*r);}cap.computeVertexNormals();stoneParts.push(applyMetricUV(cap));
  const mp=[],mc=[],cn=cap.attributes.normal,ci=cap.index.array;
  const sample=k=>{const p=new T.Vector3().fromBufferAttribute(cp,k),n=new T.Vector3().fromBufferAttribute(cn,k),f=Math.sin(p.x*6.2+p.z*3.1)+Math.sin(p.z*9-p.x*2)+.5*Math.sin(p.x*23+p.z*31)+.25;return{p,n,f:Math.min(f,(n.y-.25)*3,(p.y-3.30)*4)};};
  for(let k=0;k<ci.length;k+=3){const tri=[0,1,2].map(j=>sample(ci[k+j])),poly=[];for(let e=0;e<3;e++){const a=tri[e],b=tri[(e+1)%3],aa=a.f>=0,bb=b.f>=0;if(aa)poly.push(a);if(aa!==bb){const t=a.f/(a.f-b.f);poly.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),f:0});}}
   for(let j=1;j<poly.length-1;j++){
    for(const v of[poly[0],poly[j],poly[j+1]]){const q=v.p.clone().addScaledVector(v.n,.005),shade=.72+.13*Math.sin(q.x*17+q.z*19);mp.push(q.x,q.y,q.z);mc.push(shade*.72,shade,shade*.47);}
    const q=poly[0].p.clone().add(poly[j].p).add(poly[j+1].p).multiplyScalar(1/3),nn=poly[0].n.clone().add(poly[j].n).add(poly[j+1].n).normalize();q.addScaledVector(nn,.007);const w=.007,h=.014;
    for(const v of[[q.x-w,q.y,q.z],[q.x+w,q.y,q.z],[q.x+nn.x*h,q.y+nn.y*h,q.z+nn.z*h],[q.x,q.y,q.z-w],[q.x,q.y,q.z+w],[q.x+nn.x*h,q.y+nn.y*h,q.z+nn.z*h]]){mp.push(...v);mc.push(.62,.81,.40);}
   }
  }
  const mg=new T.BufferGeometry();mg.setAttribute('position',new T.Float32BufferAttribute(mp,3));mg.setAttribute('color',new T.Float32BufferAttribute(mc,3));mg.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(mp.length/3*2),2));mg.computeVertexNormals();mossParts.push(mg);
  // Pagoda-like rounded lotus finial is two compact stones, not a tall cone.
  for(const [cy,rx,ry]of[[3.84,.24,.105],[4.04,.26,.19],[4.26,.105,.13]]){const g=new T.SphereGeometry(1,20,12);g.scale(rx,ry,rx);put(g,stoneParts,[0,cy,0]);}
  const tip=new T.ConeGeometry(.055,.17,12);put(tip,stoneParts,[0,4.40-.085,0]);
  addMerged(stoneParts,stone,body,'carved-metric-granite-body');addMerged(darkParts,recess,body,'actual-carved-stone-grooves');const paperMesh=addMerged(lightParts,paper,body,'warm-recessed-paper');addMerged(bars,bronze,body,'fine-bronze-light-window-grid');addMerged(mossParts,moss,body,'surface-rooted-moss-fronds');
  const glow=new T.PointLight('#ffb75b',6,2.3,2);glow.position.set(0,2.82,0);body.add(glow);emitters.push({index:id,object:body,paperMesh,material:paper,localPosition:new T.Vector3(0,2.82,0)});
 }
 function getEmitterMetadata(){group.updateMatrixWorld(true);return emitters.map(e=>({...e,worldPosition:e.object.localToWorld(e.localPosition.clone()),worldCenter:e.object.localToWorld(e.localPosition.clone()),worldScale:e.object.getWorldScale(new T.Vector3()),windows:[]}));}
 return{group,lanterns,materials,stats:{triangles,lanterns:lanterns.length},bounds:new T.Box3().setFromObject(group),getEmitterMetadata,dispose(){for(const g of geometries)g.dispose();for(const m of materials){for(const v of Object.values(m.userData.maps??{}))v.dispose();m.dispose();}group.removeFromParent();}};
}
