import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2,REPEAT=2*650/4096;
const fract=x=>x-Math.floor(x),hash=(x,y=0)=>fract(Math.sin(x*127.17+y*311.71+91.23)*43758.5453);
export async function loadIslandLanternStone(){
 const loader=new T.TextureLoader(),names=['diff','nor_gl','rough'];
 const maps=await Promise.all(names.map(name=>loader.loadAsync(new URL(`../assets/island-lantern-granite/granite-face-${name}.png`,import.meta.url).href)));
 maps.forEach((map,i)=>{map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.anisotropy=8;if(i===0)map.colorSpace=T.SRGBColorSpace;});
 return {map:maps[0],normalMap:maps[1],roughnessMap:maps[2],textures:maps};
}

// Only the nearest island lantern. Nominal old local bounds are preserved:
// x/z±1.06, y0..4.05. The parent's garden transform includes Z compression.
// Stone04's detailed cap/cavity construction was inspected, not its proportions.
export function buildIslandStoneLantern({parentMatrix=new T.Matrix4(),maps=null,glowMaterial=null}={}){
 const root=new T.Group();root.name='scene07-nearest-island-carved-stone-lantern';root.matrixAutoUpdate=false;
 const scale=5.8/3.7;root.matrix.copy(parentMatrix).multiply(new T.Matrix4().makeTranslation(4.8,.2,14.2)).multiply(new T.Matrix4().makeScale(scale,scale,scale));
 const meters=new T.Vector3().setFromMatrixScale(root.matrix),bins=new Map(),ownedGeos=new Set(),ownedMaterials=new Set();
 function stone(name,color){
  const m=new T.MeshStandardMaterial({name,color,roughness:.94,metalness:0,map:maps?.map??null,normalMap:maps?.normalMap??null,roughnessMap:maps?.roughnessMap??null});m.normalScale.set(.28,.28);
  m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   vec3 aggregateTexel=texture2D(map,vMapUv).rgb;
   float aggregateY=dot(aggregateTexel,vec3(.2126,.7152,.0722));
   float relativeAggregate=clamp(pow(max(aggregateY,.0001)/0.153180782734,.55),.68,1.36);
   diffuseColor.rgb*=relativeAggregate;
   #endif`).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(.76+.20*roughnessFactor,.78,.95);`);};
  m.customProgramCacheKey=()=> 'scene07-island-granite-neutral-pigment-75b';ownedMaterials.add(m);return m;
 }
 const granite=stone('island-lantern-independent-mineral-granite','#878e84'),capStone=stone('island-lantern-weathered-kasa-stone','#68746d'),recess=stone('island-lantern-carved-stone-ground','#70796d'),bronze=new T.MeshStandardMaterial({name:'island-lantern-fine-weathered-window-grid',color:'#403c2e',roughness:.72,metalness:.28}),moss=new T.MeshStandardMaterial({name:'island-lantern-rooted-moss',color:'#4a502e',roughness:1,vertexColors:true});ownedMaterials.add(bronze);ownedMaterials.add(moss);
 if(!glowMaterial){glowMaterial=new T.MeshStandardMaterial({color:'#ffd183',emissive:'#ffa83d',emissiveIntensity:.4,roughness:.7});ownedMaterials.add(glowMaterial);}
 const prototypes=[];
 function add(geometry,material,matrix=new T.Matrix4()){
  const g=geometry.clone().applyMatrix4(matrix);if(!g.index)g.computeBoundingBox();
  const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){const nn=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))],axis=nn.indexOf(Math.max(...nn));uv[i*2]=(axis===0?p.getZ(i)*meters.z:p.getX(i)*meters.x)/REPEAT;uv[i*2+1]=(axis===1?p.getZ(i)*meters.z:p.getY(i)*meters.y)/REPEAT;}
  g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);prototypes.push(g);
 }
 const place=(g,m,p=[0,0,0],rotation=[0,0,0],s=[1,1,1])=>add(g,m,new T.Matrix4().compose(new T.Vector3(...p),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...s)));
 function box(size,p,m=granite,bevel=.006){const g=new RoundedBoxGeometry(...size,2,bevel);place(g,m,p);g.dispose();}
 function turn(profile,m=granite,segments=48){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments);add(g,m);g.dispose();}
 function face(g,m,x,y,z,yaw,rz=0){add(g,m,new T.Matrix4().makeRotationY(yaw).multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationZ(rz)));}
 // Separate broad foot courses and a substantial shaft support the platform.
 for(const [w,h,y]of[[1,.16,.08],[.90,.14,.23],[.76,.12,.36],[.66,.10,.47]])box([w,h,w],[0,y,0]);
 turn([[0,.50],[.30,.50],[.32,.57],[.28,.66],[.235,.72],[.22,1.53],[.26,1.69],[.34,1.82],[.36,1.91],[0,1.91]],granite,32);
 for(const [w,h,y]of[[.70,.10,.58],[.58,.09,1.28],[.78,.12,1.89],[1.00,.27,2.09],[1.10,.09,2.27],[1.14,.12,2.48]])box([w,h,w],[0,y,0]);
 // Recessed fields and closed raised stone petals create carved relief depth.
 const petalShape=new T.Shape();petalShape.moveTo(0,0);petalShape.bezierCurveTo(-.030,.027,-.026,.075,0,.095);petalShape.bezierCurveTo(.026,.075,.030,.027,0,0);
 const petal=new T.ExtrudeGeometry(petalShape,{depth:.012,steps:1,curveSegments:7,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:2});
 for(let f=0;f<4;f++){
  const a=f*Math.PI/2,field=new RoundedBoxGeometry(.80,.19,.020,2,.003);face(field,recess,0,2.09,.501,a);field.dispose();
  for(const x of[-.28,0,.28])for(let k=0;k<7;k++)face(petal,granite,x,2.09,.514,a,k*TAU/7);
  const stemField=new RoundedBoxGeometry(.25,.67,.080,2,.003);face(stemField,recess,0,1.19,.213,a);stemField.dispose();
  for(let k=0;k<4;k++)face(petal,granite,.035*Math.sin(k*2.1),.90+k*.17,.259,a,(k%2?1:-1)*.65);
 }
 petal.dispose();
 // A shorter open fire-bag retains the old luminous centre at localY2.84.
 box([1.08,.10,1.08],[0,2.59,0]);box([1.08,.10,1.08],[0,3.09,0]);
 for(const x of[-.43,.43])for(const z of[-.43,.43])box([.14,.60,.14],[x,2.84,z]);
 const vbar=new T.BoxGeometry(.012,.44,.018),hbar=new T.BoxGeometry(.70,.012,.018);
 for(let f=0;f<4;f++){
  const a=f*Math.PI/2;for(let k=-3;k<=3;k++)face(vbar,bronze,k*.095,2.84,.485,a);for(let k=-2;k<=2;k++)face(hbar,bronze,0,2.84+k*.086,.490,a);
  const side=new T.BoxGeometry(.018,.44,.025),lintel=new T.BoxGeometry(.71,.018,.025);
  for(const s of[-1,1]){face(side,bronze,s*.355,2.84,.490,a);face(lintel,bronze,0,2.84+s*.22,.490,a);}side.dispose();lintel.dispose();
 }
 vbar.dispose();hbar.dispose();
 const core=new T.CylinderGeometry(.275,.275,.44,24);place(core,glowMaterial,[0,2.84,0]);core.dispose();
 turn([[0,2.60],[.26,2.60],[.29,2.63],[.25,2.67],[0,2.67]],bronze,32);
 // Compression boss and a closed, thick curved kasa. Its rolled edge keeps
 // the exact old1.06m maximum half-width instead of a thin open roof sheet.
 turn([[0,3.14],[.43,3.14],[.40,3.21],[.32,3.31],[.25,3.45],[0,3.45]]);
 const topAt=r=>{const t=T.MathUtils.clamp(r/1.045,0,1);return 3.20+.44*(1-t)**1.35+.035*t**6;},warp=a=>.96+.04*Math.cos(4*a),curl=(r,a)=>.026*T.MathUtils.clamp(r/1.06,0,1)**6*(.35+.65*(.5+.5*Math.cos(4*a))**2);
 const profile=[[0,3.50],[.25,3.40],[.50,3.26],[.80,3.16],[1.045,3.135],[1.06,3.15],[1.06,3.22],[1.045,3.235]];
 for(let j=1;j<=30;j++){const r=1.045*(1-j/30);profile.push([r,topAt(r)]);}
 const roof=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64),rp=roof.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),z=rp.getZ(i),a=Math.atan2(z,x),w=warp(a);rp.setXYZ(i,x*w,rp.getY(i)+curl(Math.hypot(x,z),a),z*w);}roof.computeVertexNormals();add(roof,capStone);roof.dispose();
 const ring=new T.TorusGeometry(.16,.045,12,48);place(ring,capStone,[0,3.64,0],[Math.PI/2,0,0]);ring.dispose();
 turn([[0,3.65],[.13,3.65],[.18,3.68],[.18,3.70],[.14,3.72],[.105,3.74],[.125,3.755],[.145,3.775],[.153,3.80],[.148,3.825],[.130,3.85],[.10,3.87],[.06,3.89],[.065,3.92],[.05,3.95],[.032,3.98],[0,4.05]],capStone,40);
 // Closed thin moss cushions follow the actual upper stone surface. The
 // private seed avoids changing a single downstream garden random draw.
 const fibre=new T.SphereGeometry(1,6,4);fibre.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(fibre.attributes.position.count*3).fill(0).map((v,i)=>[.72,.86,.51][i%3]),3));
 function mossPatch(cx,cz,rx,rz,seed,heightAt){
  const p=[],ix=[],colors=[],N=28,M=4;
  p.push(cx,heightAt(cx,cz)+.008,cz);colors.push(.75,.88,.58);
  for(let j=1;j<=M;j++)for(let k=0;k<N;k++){const a=k/N*TAU,s=(1+.07*Math.sin(a*3+seed)+.07*Math.sin(a*7-seed)+.045*Math.sin(a*13+seed*.3))*j/M,x=cx+Math.cos(a)*rx*s,z=cz+Math.sin(a)*rz*s,h=.001+.007*(1-(j/M)**2);p.push(x,heightAt(x,z)+h,z);const tone=.76+.14*hash(seed,k);colors.push(tone*.80,tone,tone*.58);}
  for(let k=0;k<N;k++)ix.push(0,1+(k+1)%N,1+k);
  for(let j=0;j<M-1;j++)for(let k=0;k<N;k++){const a=1+j*N+k,b=1+j*N+(k+1)%N,c=a+N,d=b+N;ix.push(a,b,c,b,d,c);}
  const count=p.length/3;for(let i=0;i<count;i++){const x=p[i*3],z=p[i*3+2];p.push(x,heightAt(x,z)-.001,z);colors.push(.50,.62,.35);}
  const topFaces=[...ix];for(let i=0;i<topFaces.length;i+=3)ix.push(topFaces[i]+count,topFaces[i+2]+count,topFaces[i+1]+count);
  for(let k=0;k<N;k++){const a=1+(M-1)*N+k,b=1+(M-1)*N+(k+1)%N;ix.push(a,b,a+count,b,b+count,a+count);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();add(g,moss);g.dispose();
  for(let k=0;k<12;k++){const a=hash(seed,k+41)*TAU,r=Math.sqrt(hash(seed,k+67))*.72,x=cx+Math.cos(a)*r*rx,z=cz+Math.sin(a)*r*rz,h=.003+.003*hash(seed,k+91);place(fibre,moss,[x,heightAt(x,z)+.002+h,z],[0,a,.15*Math.sin(k)],[.002+.001*hash(seed,k+18),h,.002+.001*hash(seed,k+32)]);}
 }
 const roofY=(x,z)=>{const a=Math.atan2(z,x),r=Math.hypot(x,z)/warp(a);return topAt(r)+curl(r,a);};
 for(let j=0;j<5;j++){const a=j*1.71+.73,r=.62+.20*hash(j,3);mossPatch(Math.cos(a)*r,Math.sin(a)*r,.055+.045*hash(j,7),.045+.035*hash(j,9),j+73,roofY);}
 for(const s of[-1,1])for(let j=0;j<3;j++)mossPatch(s*.474,-.30+j*.30,.017,.08,111+j+(s+1)*3,()=>.16);
 fibre.dispose();

 let triangles=0;
 for(const [material,geometries]of bins){
  const clean=geometries.map(g=>{const q=g.index?g.toNonIndexed():g.clone();if(!q.attributes.color)q.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(q.attributes.position.count*3).fill(1),3));for(const name of Object.keys(q.attributes))if(!['position','normal','uv','color'].includes(name))q.deleteAttribute(name);return q;});
  const merged=mergeGeometries(clean,false);clean.forEach(g=>g.dispose());ownedGeos.add(merged);const mesh=new T.Mesh(merged,material);mesh.name=material.name||'island-lantern-original-glow';mesh.castShadow=mesh.receiveShadow=material!==glowMaterial;root.add(mesh);triangles+=merged.attributes.position.count/3;
 }
 root.updateMatrixWorld(true);
 const localBounds=new T.Box3();prototypes.forEach(g=>{g.computeBoundingBox();localBounds.union(g.boundingBox);});
 const info={anchorLocal:[4.8,.2,14.2],uniformLocalScale:scale,worldAnchor:new T.Vector3(4.8,.2,14.2).applyMatrix4(parentMatrix).toArray(),localBounds:{min:localBounds.min.toArray(),max:localBounds.max.toArray()},worldBounds:new T.Box3().setFromObject(root),fireBagCentreY:2.84,fireBagClearHeight:.40,verticalBarsPerFace:7,horizontalBarsPerFace:5,closedCurvedRoof:true,roofMaximumHalfWidth:1.06,mossPatches:11,mossFibreSolids:132,triangles,lightsAdded:0,originalGlowMaterialRetained:true,visualAccepted:false};
 return {group:root,prototypes,info,dispose(){for(const g of prototypes)g.dispose();for(const g of ownedGeos)g.dispose();for(const m of ownedMaterials)m.dispose();maps?.textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
