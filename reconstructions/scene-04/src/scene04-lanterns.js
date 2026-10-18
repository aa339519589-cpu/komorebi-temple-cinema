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
 const stone=stoneMaterial('metric-quartz-granite-lantern','#8d806c',{seed:611}),recess=stoneMaterial('carved-granite-recess','#786c58',{seed:612}),moss=new T.MeshStandardMaterial({color:'#465326',roughness:1,vertexColors:true,side:T.DoubleSide}),paper=new T.MeshStandardMaterial({color:'#e9c882',emissive:'#ffbe52',emissiveIntensity:.64,roughness:.9,side:T.DoubleSide}),bronze=new T.MeshStandardMaterial({color:'#44351c',metalness:.45,roughness:.69});
 const geometries=[],materials=[stone,recess,moss,paper,bronze],lanterns=[],emitters=[];let triangles=0;
 function addMerged(parts,mat,parent,name){if(!parts.length)return null;const clean=parts.map(g=>{g=g.index?g.toNonIndexed():g;for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);if(!g.attributes.color)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));return g;}),g=mergeGeometries(clean,false);clean.forEach(q=>q.dispose());geometries.push(g);const mesh=new T.Mesh(g,mat);mesh.name=name;mesh.castShadow=mat!==paper;mesh.receiveShadow=mat!==paper;parent.add(mesh);triangles+=g.attributes.position.count/3;return mesh;}
 for(const [id,anchor]of(options.anchors??[]).entries()){
  const [x,y,z,oldScale]=anchor,scale=oldScale*3.34/4.4,body=new T.Group();body.position.set(x,y,z);body.scale.setScalar(scale);group.add(body);lanterns.push(body);
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
  // Substantial sculpted cap: a wavy old stone hip, closed 12 cm thick rim.
  const N=32,positions=[],uv=[],indices=[],colors=[];
  const height=(xx,zz)=>{const r=Math.min(1,Math.max(Math.abs(xx),Math.abs(zz))/1.04),corner=Math.pow(Math.abs(xx*zz)/(1.04*1.04),3);return 3.30+.47*Math.pow(1-r,1.38)+.15*corner+.006*Math.sin(xx*14+zz*11);};
  for(let layer=0;layer<2;layer++)for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const xx=-1.04+i/N*2.08,zz=-1.04+j/N*2.08,yy=height(xx,zz)-(layer?.125:0);positions.push(xx,yy,zz);uv.push(xx*4,zz*4);colors.push(1,1,1);}
  const layerSize=(N+1)*(N+1);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;indices.push(a,b,a+1,a+1,b,b+1,a+layerSize,a+1+layerSize,b+layerSize,a+1+layerSize,b+1+layerSize,b+layerSize);}
  const rim=[...Array.from({length:N},(_,i)=>i),...Array.from({length:N},(_,j)=>j*(N+1)+N),...Array.from({length:N},(_,i)=>N*(N+1)+N-i),...Array.from({length:N},(_,j)=>(N-j)*(N+1))];
  for(let k=0;k<rim.length;k++){const a=rim[k],b=rim[(k+1)%rim.length];indices.push(a,a+layerSize,b,b,a+layerSize,b+layerSize);}
  const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(positions,3));cap.setAttribute('uv',new T.Float32BufferAttribute(uv,2));cap.setAttribute('color',new T.Float32BufferAttribute(colors,3));cap.setIndex(indices);cap.computeVertexNormals();stoneParts.push(cap);
  // Moss follows the true surface, with broken colony boundaries and tiny fronds.
  const mp=[],mc=[];for(let k=0;k<1450;k++){
   const xx=-1.01+2.02*((Math.sin(k*12.989+id)*43758.54)%1+1)%2,zz=Math.sin(k*7.113+id*2)*.99;
   const r=Math.max(Math.abs(xx),Math.abs(zz)),patch=Math.sin(xx*6.2+zz*3.1)+Math.sin(zz*9-xx*2)+.5*Math.sin(xx*23+zz*31);if(r<.22||patch<.35)continue;
   const yy=height(xx,zz)+.007,w=.013+.011*Math.abs(Math.sin(k*6.3)),h=.018+.025*Math.abs(Math.cos(k*3.1));
   for(const v of[[xx-w,yy,zz],[xx+w,yy,zz],[xx,yy+h,zz+.012],[xx,yy,zz-w],[xx,yy,zz+w],[xx+.012,yy+h,zz]]){mp.push(...v);const q=.68+.25*Math.abs(Math.sin(k));mc.push(q*.80,q,q*.61);}
  }
  // Continuous broken moss colonies lie on the stone, beneath the tiny fronds.
  const M=64,step=2.08/M;
  const colony=(xx,zz)=>Math.sin(xx*6.2+zz*3.1)+Math.sin(zz*9-xx*2)+.5*Math.sin(xx*23+zz*31);
  for(let j=0;j<M;j++)for(let i=0;i<M;i++){
   const xx=-1.04+i*step,zz=-1.04+j*step,cx=xx+step*.5,cz=zz+step*.5,r=Math.max(Math.abs(cx),Math.abs(cz));if(r<.24||colony(cx,cz)<-.05)continue;
   for(const v of[[xx,zz],[xx,zz+step],[xx+step,zz],[xx+step,zz],[xx,zz+step],[xx+step,zz+step]]){mp.push(v[0],height(v[0],v[1])+.004,v[1]);const q=.63+.12*Math.sin(v[0]*18+v[1]*19);mc.push(q*.72,q,q*.45);}
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
