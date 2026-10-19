import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The two foreground veranda lamps reuse one closed metal assembly. Dimensions are
// authored construction estimates from comparison, not a measured historic lamp.
export const HERO_LANTERN_REVISION='scene09-two-bronze-pierced-hanging-lanterns-103b';
const V=a=>new T.Vector3(...a),hash=(x,y)=>{const q=Math.sin(x*127.1+y*311.7+79.3)*43758.5453;return q-Math.floor(q);};
const rect=(w,h)=>{const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();return s;};
function extrude(shape,depth,bevel=.001){const g=new T.ExtrudeGeometry(shape,{depth:depth-2*bevel,steps:1,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:1,curveSegments:6});g.translate(0,0,-depth/2+bevel);return g;}
function bar(w,h,d,b=.001){return extrude(rect(w-2*b,h-2*b),d,b);}
function squareRing(outer,inner,h){const s=rect(outer,outer),hole=new T.Path();hole.moveTo(-inner/2,-inner/2);hole.lineTo(-inner/2,inner/2);hole.lineTo(inner/2,inner/2);hole.lineTo(inner/2,-inner/2);hole.closePath();s.holes.push(hole);const g=extrude(s,h,.001);g.rotateX(-Math.PI/2);return g;}
function apron(){
  const s=rect(.740,.074);
  for(let j=-3;j<=3;j++){const h=new T.Path();for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,r=.0205+.0045*Math.cos(4*a),x=j*.095+Math.cos(a)*r*1.22,y=Math.sin(a)*r*.79;i?h.lineTo(x,y):h.moveTo(x,y);}h.closePath();s.holes.push(h);}
  return extrude(s,.015,.001);
}
function petalRing(){
  // Eight separate closed narrow petal rims meet a cast centre rosette. The
  // negative spaces between petals remain open, rather than a solid star plate.
  const s=new T.Shape();s.moveTo(0,.025);s.bezierCurveTo(-.075,.103,-.064,.229,0,.278);s.bezierCurveTo(.064,.229,.075,.103,0,.025);s.closePath();
  const h=new T.Path();h.moveTo(0,.049);h.bezierCurveTo(-.050,.120,-.046,.212,0,.258);h.bezierCurveTo(.046,.212,.050,.120,0,.049);h.closePath();s.holes.push(h);
  return extrude(s,.018,.0011);
}
function centreRosette(){const s=new T.Shape();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,r=.038+.006*Math.cos(8*a),x=Math.cos(a)*r,y=Math.sin(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();return extrude(s,.014,.001);}

function ribbon(curve,width=.010,depth=.014){
  const p=curve.getPoints(16),left=[],right=[];
  for(let i=0;i<p.length;i++){const t=p[Math.min(p.length-1,i+1)].clone().sub(p[Math.max(0,i-1)]).normalize(),n=new T.Vector2(-t.y,t.x).multiplyScalar(width/2);left.push(p[i].clone().add(n));right.push(p[i].clone().sub(n));}
  const s=new T.Shape();s.moveTo(left[0].x,left[0].y);for(const p of left.slice(1))s.lineTo(p.x,p.y);for(const p of right.reverse())s.lineTo(p.x,p.y);s.closePath();return extrude(s,depth,.0009);
}
function cornerStem(){return ribbon(new T.CubicBezierCurve(new T.Vector2(.185,.187),new T.Vector2(.285,.185),new T.Vector2(.300,.253),new T.Vector2(.333,.348)),.010,.014);}
function cornerCurl(){return ribbon(new T.CubicBezierCurve(new T.Vector2(.285,.277),new T.Vector2(.220,.317),new T.Vector2(.205,.250),new T.Vector2(.249,.253)),.008,.012);}
function canopy(){
  // Closed, shallow square bronze cap: a real rolled hem and pitched shoulder.
  const shape=[[.40,.555],[.411,.563],[.411,.577],[.37,.587],[.32,.621],[.25,.717],[.215,.733],[.215,.754],[.20,.764],[.20,.820]],p=[],uv=[],ix=[];
  for(const [r,y]of shape)for(const [x,z]of[[-1,-1],[-1,1],[1,1],[1,-1]]){p.push(x*r,y,z*r);uv.push(x*r+z*r,y);}
  for(let j=0;j<shape.length-1;j++)for(let i=0;i<4;i++){const a=j*4+i,b=j*4+(i+1)%4,c=a+4,d=b+4;ix.push(a,b,c,b,d,c);}
  const n=(shape.length-1)*4;ix.push(0,2,1,0,3,2,n,n+1,n+2,n,n+2,n+3);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
}
function turnedDrop(){return new T.LatheGeometry([[0,0],[.019,0],[.029,.016],[.026,.032],[.018,.043],[.034,.067],[.038,.085],[.030,.104],[.018,.119],[.016,.140],[0,.140]].map(p=>new T.Vector2(...p)),20);}

export function createHeroHangingLantern(M,materials,textures){
  const n=128,rough=new Uint8Array(n*n*4),bump=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,r=155+17*hash(x,y)+7*Math.sin(x*.17+y*.13),b=122+10*hash(x+39,y)+4*Math.sin(x*.29-y*.47);for(let c=0;c<3;c++){rough[i+c]=r;bump[i+c]=b;}rough[i+3]=bump[i+3]=255;}
  const tex=data=>{const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;textures.push(t);return t;};
  const patina=new T.MeshStandardMaterial({name:'scene09-hero-aged-cast-bronze',color:0x80633b,metalness:.80,roughness:.88,roughnessMap:tex(rough),bumpMap:tex(bump),bumpScale:.00022,envMapIntensity:1});
  const edge=patina.clone();edge.name='scene09-hero-rubbed-fine-brass-moulding';edge.color.setHex(0x9d7c46);edge.roughness=.83;edge.bumpScale=.00012;materials.push(patina,edge);
  const accum=[[],[]],prototypes=new Set(),placements=[];
  function put(g,bucket=0,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0]){
    prototypes.add(g);const m=new T.Matrix4().compose(V([x,y,z]),new T.Quaternion().setFromEuler(new T.Euler(...rot)),V([sx,sy,sz]));const c=g.clone().applyMatrix4(m);if(c.index){const q=c.toNonIndexed();c.dispose();accum[bucket].push(q);}else accum[bucket].push(c);placements.push({g,m});
  }
  const petal=petalRing(),centre=centreRosette(),stem=cornerStem(),curl=cornerCurl(),frameV=bar(.022,.865,.024),frameH=bar(.635,.023,.024),post=bar(.028,.99,.028),shoe=bar(.048,.040,.048),apronBand=apron();
  for(let face=0;face<4;face++){
    const a=face*Math.PI/2,rot=[0,a,0],f=(g,b,x,y,z,sx=1,sy=1,sz=1,r=0)=>{const p=V([x,y,z]).applyAxisAngle(V([0,1,0]),a);put(g,b,p.x,p.y,p.z,sx,sy,sz,[0,a,r]);};
    for(let k=0;k<8;k++)f(petal,0,0,0,.344,1,1,1,k*Math.PI/4);
    f(centre,1,0,0,.348);
    for(const xx of[-.321,.321])f(frameV,1,xx,0,.339);
    for(const yy of[-.421,.421])f(frameH,1,0,yy,.339);
    for(let k=0;k<4;k++){const r=k*Math.PI/2;f(stem,0,0,0,.344,1,1,1,r);f(curl,1,0,0,.348,1,1,1,r);}
    // The corner vines intersect the window frame and flower, so the pierced
    // eight-petal cast mask has visible physical support on all four corners.
    for(const yy of[-.500,.500])f(apronBand,0,0,yy,.365);
    for(const yy of[-.550,-.451,.451,.550])f(bar(.766,.014,.021),1,0,yy,.374);
    for(const xx of[-.35,.35]){f(post,0,xx,0,.35);for(const yy of[-.48,.48])f(shoe,1,xx,yy,.35);}
    const boss=new T.SphereGeometry(.026,12,8);f(boss,1,0,0,.354,1,1,.32);
    // Three small embossed beads per apron, kept subordinate to the bloom.
    for(const xx of[-.19,0,.19])for(const yy of[-.5,.5])f(new T.SphereGeometry(.012,8,6),1,xx,yy,.380,1,.7,.30);
  }
  put(canopy());
  put(squareRing(.802,.730,.014),1,0,.545,0);
  put(squareRing(.770,.654,.030),0,0,-.565,0);
  put(squareRing(.710,.653,.012),1,0,-.587,0);
  put(squareRing(.376,.310,.022),1,0,-.745,0);
  const rod=new T.CylinderGeometry(.010,.010,1,8),brace=new T.CylinderGeometry(.014,.014,1,8);
  function between(a,b,g,bucket){a=V(a);b=V(b);const v=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5),e=new T.Euler().setFromQuaternion(new T.Quaternion().setFromUnitVectors(V([0,1,0]),v.clone().normalize()));put(g,bucket,mid.x,mid.y,mid.z,1,v.length(),1,e.toArray().slice(0,3));}
  for(const x of[-1,1])for(const z of[-1,1]){
    between([x*.30,-.581,z*.30],[x*.163,-.745,z*.163],brace,0);
    between([x*.32,-.582,z*.32],[x*.32,-.760,z*.32],rod,1);
    put(turnedDrop(),1,x*.32,-.910,z*.32,.65,.98,.65);
  }
  put(squareRing(.300,.245,.015),0,0,-.769,0);
  put(turnedDrop(),1,0,-.940,0);
  for(let j=0;j<6;j++)put(new T.TorusGeometry(.049,.006,6,16),0,0,.87+j*.10,0,1,1,1,[0,j%2*Math.PI/2,0]);
  // Small cross-pins connect the underside collar; there is no solid black cone.
  for(const a of[0,Math.PI/2])put(bar(.32,.014,.014),0,0,-.783,0,1,1,1,[0,a,0]);
  const meshes=accum.map(list=>{const g=mergeGeometries(list,false);for(const q of list)q.dispose();return g;});
  const triangles=meshes.reduce((n,g)=>n+g.attributes.position.count/3,0),bounds=new T.Box3();for(const g of meshes){g.computeBoundingBox();bounds.union(g.boundingBox);}
  const info={revision:HERO_LANTERN_REVISION,anchor:[7.7,7.3,21.6],assemblyScale:1.35*.88,installations:[],localBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},triangles,closedMetalComponents:placements.length,metalMeshes:2,originalPaperSheets:4,originalLight:{color:0xffd39b,unscaledIntensity:38,unscaledDistance:7,decay:2},photoSampled:false,visualAccepted:false};
  function install(api,x=7.7,y=7.3,z=21.6,s=1.35){info.installations.push({position:[x,y,z],scale:s*.88});api.group(x,y,z,0,()=>{
    api.emit(meshes[0],patina);api.emit(meshes[1],edge);
    // Exact original paper transforms, material object, emissive attenuation and
    // local physical source. Other lamps and the external suspension stay intact.
    for(let face=0;face<4;face++)api.group(0,0,0,face*Math.PI/2,()=>api.box(0,0,.311,.612,.77,.009,M.paper));
    api.light(0,0,0,38,7.0);
  },s*.88);}
  return{install,info,meshes,prototypes:[...prototypes],placements};
}
