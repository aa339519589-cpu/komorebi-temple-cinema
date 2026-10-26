import * as T from 'three';
import {PAGODA_FRAME143 as P} from './pagoda-frame143.js';
import {HALL_ENVELOPE143 as H,roofBearing143} from './hall-envelope143.js';
import {createGardenFern} from './garden-ferns.js';

export const NIGHT_GARDEN341_REVISION='scene09-seated-stone-and-rooted-bank-lanterns341-r04';
const V=a=>new T.Vector3(...a),hash=(a,b=0)=>{const q=Math.sin(a*127.1+b*311.7+341.19)*43758.5453;return q-Math.floor(q);};
const pose=S=>new T.Matrix4().compose(V(S.position),new T.Quaternion().setFromAxisAngle(V([0,1,0]),S.yaw),V(S.scale));
function triangle(pos,ix,a,b,c,side){
 const A=V(pos.slice(a*3,a*3+3)),B=V(pos.slice(b*3,b*3+3)),C=V(pos.slice(c*3,c*3+3)),n=B.clone().sub(A).cross(C.clone().sub(A));
 const inward=side==='up'?n.y<0:side==='down'?n.y>0:n.x*(A.x+B.x+C.x)+n.z*(A.z+B.z+C.z)<0;
 ix.push(a,inward?c:b,inward?b:c);
}
// A genuine curved four-sided metal/stone cap, with an independent concave
// underside and a closed thin rim. The corner upturn has finite thickness.
function hippedCap341(width,height,curl,thickness){
 const N=48,R=6,p=[],uv=[],ix=[],add=(x,y,z)=>{p.push(x,y,z);uv.push(x*2,z*2);return p.length/3-1;},top=add(0,height,0),rings=[];
 for(let j=1;j<=R;j++){const r=j/R,row=[];for(let k=0;k<N;k++){const a=k*Math.PI*2/N,c=Math.cos(a),s=Math.sin(a),m=Math.max(Math.abs(c),Math.abs(s)),x=c/m*width*.5*r,z=s/m*width*.5*r,corner=Math.min(Math.abs(c),Math.abs(s))/m,y=height*(1-r)**1.35+curl*r**9*(.16+.84*corner**5);row.push(add(x,y,z));}rings.push(row);}
 for(let k=0;k<N;k++)triangle(p,ix,top,rings[0][k],rings[0][(k+1)%N],'up');
 for(let j=0;j<R-1;j++)for(let k=0;k<N;k++){const q=(k+1)%N;triangle(p,ix,rings[j][k],rings[j+1][k],rings[j+1][q],'up');triangle(p,ix,rings[j][k],rings[j+1][q],rings[j][q],'up');}
 const bottom=p.length/3;for(let i=0;i<bottom;i++)add(p[i*3],p[i*3+1]-thickness,p[i*3+2]);
 const topCount=ix.length;for(let j=0;j<topCount;j+=3)ix.push(ix[j]+bottom,ix[j+2]+bottom,ix[j+1]+bottom);
 const rim=rings.at(-1);for(let k=0;k<N;k++){const a=rim[k],b=rim[(k+1)%N];triangle(p,ix,a,a+bottom,b,'side');triangle(p,ix,b,a+bottom,b+bottom,'side');}
 const g=new T.BufferGeometry();g.name='scene09-341-closed-curved-four-sided-cap';g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function mineralFoot341(rx,rz,index,top){
 const N=32,R=4,p=[0,top,0],uv=[0,0],ix=[],rows=[],add=(x,y,z)=>{p.push(x,y,z);uv.push(x*2,z*2);return p.length/3-1;};
 for(let j=1;j<=R;j++){const r=j/R,row=[];for(let k=0;k<N;k++){const a=k*Math.PI*2/N,q=1+.13*Math.sin(a*3+index)+.065*Math.cos(a*7-index),x=Math.cos(a)*rx*r*q,z=Math.sin(a)*rz*r*q,v=T.MathUtils.clamp((r-.56)/.44,0,1),y=-.045+(top+.045)*(1-v*v)**1.25+.009*Math.sin(k*1.7+index)*Math.max(0,r-.56);row.push(add(x,y,z));}rows.push(row);}
 for(let k=0;k<N;k++)triangle(p,ix,0,rows[0][k],rows[0][(k+1)%N],'up');
 for(let j=0;j<R-1;j++)for(let k=0;k<N;k++){const q=(k+1)%N;triangle(p,ix,rows[j][k],rows[j+1][k],rows[j+1][q],'up');triangle(p,ix,rows[j][k],rows[j+1][q],rows[j][q],'up');}
 const rim=rows.at(-1),bottom=rim.map(a=>add(p[a*3],-.24,p[a*3+2])),centre=add(0,-.24,0);
 for(let k=0;k<N;k++){const q=(k+1)%N;triangle(p,ix,rim[k],bottom[k],rim[q],'side');triangle(p,ix,rim[q],bottom[k],bottom[q],'side');triangle(p,ix,centre,bottom[k],bottom[q],'down');}
 const g=new T.BufferGeometry();g.name='scene09-341-closed-waterline-mineral-foot-'+index;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
// Query the actual Float32 top triangles, rather than the continuous design
// height. Scatter roots therefore remain seated on the authored low-poly bed.
function bedSurface341(g,x,z){
 const p=g.attributes.position,ix=g.index;let highest=-Infinity;
 for(let j=0;j<ix.count;j+=3){const a=ix.getX(j),b=ix.getX(j+1),c=ix.getX(j+2),ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-12)continue;const u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,v=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den,w=1-u-v;if(Math.min(u,v,w)<-1e-7)continue;highest=Math.max(highest,u*p.getY(a)+v*p.getY(b)+w*p.getY(c));}
 if(!Number.isFinite(highest))throw Error('Scatter341 is outside actual closed bed');return highest;
}
function scatterPoint341(g,rx,rz,index,a,r){const q=1+.13*Math.sin(a*3+index)+.065*Math.cos(a*7-index),x=Math.cos(a)*rx*r*q,z=Math.sin(a)*rz*r*q;return[x,bedSurface341(g,x,z),z];}
function audit341(g){
 const p=g.attributes.position,ix=g.index,verts=new Map(),ids=[],edges=new Map();let volume=0,degenerate=0;
 for(let i=0;i<p.count;i++){const a=[p.getX(i),p.getY(i),p.getZ(i)];if(a.some(x=>!Number.isFinite(x)))throw Error('Nonfinite341 vertex');const key=a.map(x=>Math.round(x*1e6)).join(',');if(!verts.has(key))verts.set(key,verts.size);ids.push(verts.get(key));}
 for(let j=0;j<ix.count;j+=3){const q=[0,1,2].map(k=>ix.getX(j+k)),A=V([p.getX(q[0]),p.getY(q[0]),p.getZ(q[0])]),B=V([p.getX(q[1]),p.getY(q[1]),p.getZ(q[1])]),C=V([p.getX(q[2]),p.getY(q[2]),p.getZ(q[2])]);volume+=A.dot(B.clone().cross(C))/6;if(B.clone().sub(A).cross(C.clone().sub(A)).lengthSq()<1e-18)degenerate++;
  for(let k=0;k<3;k++){const a=ids[q[k]],b=ids[q[(k+1)%3]],key=Math.min(a,b)+','+Math.max(a,b),e=edges.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edges.set(key,e);}
 }
 const boundary=[...edges.values()].filter(e=>e[0]!==2).length,inconsistent=[...edges.values()].filter(e=>e[1]!==0).length;g.computeBoundingBox();if(boundary||inconsistent||volume<=0||degenerate)throw Error('Nonclosed341 solid '+g.name+JSON.stringify({boundary,inconsistent,volume,degenerate}));return{name:g.name,vertices:p.count,triangles:ix.count/3,volume,boundary,inconsistent,degenerate,bounds:[g.boundingBox.min.toArray(),g.boundingBox.max.toArray()]};
}

export function buildNightGarden341(api,scans,ownedMaterials,fixtureLights){
 const{emit,group,box,between,light,materials:M}=api,prototypes=[],caseRecords=[],shoreRecords=[],sources=[],Pworld=pose(P),Hworld=pose(H);
 const metal=M.lanternMetal.clone();metal.name='scene09-341-chased-oxidised-bronze-case';metal.roughness=.46;
 const edge=M.lanternEdge.clone();edge.name='scene09-341-rubbed-case-bead-and-joint';edge.roughness=.39;
 const paper=M.paper.clone();paper.name='scene09-341-independent-washi-case-paper';paper.userData={...paper.userData,paperEmitter221:true,physicalEmitter203:true};
 const soil=M.cutStoneDark.clone();soil.name='scene09-341-waterline-mineral-bed';soil.color.setHex(0x595947);soil.roughness=.98;
 const dampStone=M.cutStone.clone();dampStone.name='scene09-341-damp-lantern-foot-stone';dampStone.color.setRGB(.60,.64,.57);dampStone.roughness=.89;
 const fernMaterial=new T.MeshStandardMaterial({name:'scene09-341-rooted-waterline-ferns',color:0x4b5e35,roughness:.95,vertexColors:true,side:T.DoubleSide});ownedMaterials.push(metal,edge,paper,soil,dampStone,fernMaterial);
 const cap=hippedCap341(.86,.17,.040,.031),bottomCap=hippedCap341(.60,.070,.006,.026),ring=new T.TorusGeometry(.034,.006,6,14),finial=new T.SphereGeometry(1,10,6),shaft=new T.CylinderGeometry(.080,.105,.28,8),chip=new T.IcosahedronGeometry(1,0);prototypes.push(cap,bottomCap);const ferns=[createGardenFern(3411),createGardenFern(3419),createGardenFern(3427)];for(const g of[...ferns,chip])g.computeBoundingBox();
 function case341({x,y,z,s,yaw=0,mountY=null,kind,power,reach,stone=false,worldMatrix=null,label}){
  const first=fixtureLights.length;
  group(x,y,z,yaw,()=>{
   // Four recessed thin paper panes have their own surrounding solid corner
   // posts, paired rabbets, glazing bars, diagonal bronze fret and cast bosses.
   for(let f=0;f<4;f++)group(0,0,0,f*Math.PI/2,()=>{
    box(0,0,.252,.505,.672,.009,paper);
    for(const xx of[-.267,.267]){box(xx,0,.278,.039,.750,.046,metal);box(xx+.008,0,.305,.012,.70,.014,edge);}
    for(const yy of[-.354,.354]){box(0,yy,.278,.576,.052,.048,metal);box(0,yy+.018,.307,.558,.012,.014,edge);}
    for(const xx of[-.124,.124])box(xx,0,.282,.015,.652,.023,metal);
    for(const yy of[-.19,.19])box(0,yy,.284,.498,.016,.026,metal);
    for(const yy of[-.09,.09])for(const sign of[-1,1])between([0,yy-.088,.302],[sign*.12,yy,.302],.010,.010,edge,true);
    for(const xx of[-.251,.251])for(const yy of[-.327,.327])emit(finial,edge,xx,yy,.311,.015,.015,.010);
    box(0,-.288,.287,.49,.015,.022,edge);
   });
   box(0,-.405,0,.626,.070,.626,stone?dampStone:metal);box(0,-.446,0,.568,.018,.568,edge);
   box(0,.405,0,.620,.070,.620,stone?dampStone:metal);box(0,.448,0,.572,.018,.572,edge);
   emit(cap,stone?dampStone:metal,0,.447,0);emit(bottomCap,metal,0,-.48,0,1,1,1,[Math.PI,0,0]);
   // Real hip seams and a socketed top finial, separate from the curved shell.
   for(const sx of[-1,1])for(const sz of[-1,1])between([sx*.021,.620,sz*.021],[sx*.418,.488,sz*.418],.012,.012,edge,true);
   emit(finial,edge,0,.657,0,.034,.057,.034);box(0,.612,0,.097,.026,.097,metal);
   for(const sx of[-1,1])for(const sz of[-1,1]){between([sx*.24,-.45,sz*.24],[sx*.16,-.58,sz*.16],.015,.015,metal,true);emit(finial,edge,sx*.16,-.60,sz*.16,.021,.035,.021);}
   if(mountY!==null){const top=(mountY-y)/s;between([0,.685,0],[0,top,0],.010,.010,metal,true);for(let k=0;k<Math.max(1,Math.floor((top-.715)/.052));k++)emit(ring,metal,0,.715+k*.052,0,1,1,1,[0,(k%2)*Math.PI/2,0]);box(0,top+.012,0,.15,.030,.15,metal);}
   light(0,0,0,power,reach,{kind});
  },s);
  const l=fixtureLights[first];if(!l||fixtureLights.length!==first+1)throw Error('Case source341 registration');l.name='scene09-341-'+label;l.userData.garden341={kind,reach,power,exitance:3.7,boxYaw341:yaw};sources.push(l);
  const world=worldMatrix?V([x,y,z]).applyMatrix4(worldMatrix).toArray():[x,y,z];caseRecords.push({label,kind,chamberWorld:world,assemblyScale:l.userData.source203.assemblyScale,paperBoxLocal:[.505,.672,.009],closedCap:true,realFourSidedFret:true,mountWorld:mountY===null?null:(worldMatrix?V([x,mountY,z]).applyMatrix4(worldMatrix).toArray():[x,mountY,z]),groundMounted:stone});
 }
 // Replace the old centre-face hexagonal lamps and four tiny detached roof
 // corner ornaments with twenty physically suspended square corner cases.
 const widths=[7.80,7.50,7.12,6.72,6.34];
 group(...P.position,P.yaw,()=>{for(let k=0;k<5;k++){
  const floor=P.floor+k*P.pitch,w=widths[k],r=w*.435,rise=k===4?P.topRise:1.72,t=.87,u=1,mount=floor+P.roofSeat+rise*(1-t)**1.49+P.curl*t**10*(.17+.83*u**8)-.62-.018;
  for(const sx of[-1,1])for(const sz of[-1,1])case341({x:sx*r,y:floor+1.51,z:sz*r,s:.72-k*.025,yaw:Math.PI/4,mountY:mount,kind:'pagoda-corner341',power:84-k*4,reach:4.2,worldMatrix:Pworld,label:'pagoda-tier-'+(k+1)+'-corner-'+sx+'-'+sz});
 }},P.scale);
 // Replacement upper-gallery lamps hang below the actual continuous10.03m
 // transom. Lower portal lights, roof envelope and gallery floor stay intact.
 group(...H.position,H.yaw,()=>{
  for(const x of[-9,-6,-3,3,6,9]){
   if(Math.abs(x)>8.35){const sign=Math.sign(x);box(sign*8.24,9.97,5.20,.12,.36,.16,metal);between([sign*8.24,10.035,5.20],[x,10.035,5.28],.047,.047,metal,true);between([sign*8.24,9.80,5.20],[x,10.035,5.28],.027,.027,metal,true);box(x,10.035,5.28,.15,.035,.15,edge);}
   case341({x,y:9.48,z:5.28,s:.68,yaw:0,mountY:10.03,kind:'hall-gallery341',power:68,reach:4.8,worldMatrix:Hworld,label:'hall-upper-gallery-'+x});
  }
  // The four courtyard-facing end cases replace the old unlit miniature
  // corner ornaments. Their screw plates enter the actual closed eave beams.
  for(const upper of[false,true]){const roof=upper?H.upper:H.lower;for(const sign of[-1,1]){
   const x=sign*roof.w*.465,z=roof.frontDepth*.985,mount=roofBearing143(x,z,upper)-.015;
   case341({x,y:mount-.73,z,s:.77,yaw:sign*.16,mountY:mount,kind:'hall-eave-corner341',power:76,reach:4.7,worldMatrix:Hworld,label:'hall-'+(upper?'upper':'lower')+'-front-eave-corner-'+sign});
  }}
 },H.scale);
 // Unequal low stone cases are seated in closed mineral pockets, with true
 // wet waterline rocks. Their sizes and spacing deliberately vary along banks.
 const anchors=[[-4.9,8.7,.75,.94,.60],[-3.3,13.7,.70,.86,.50],[-1.7,11.1,.52,.73,.46],[7.5,8.9,.85,1.00,.68],[8.3,14.5,.75,.96,.55],[6.9,16.7,.62,.82,.46]];
 for(const[index,p]of anchors.entries()){
  const[x,z,rx,rz,s]=p,root=Math.max(.16,(M.bankHeight139?.(x,z)??-.1)+.04),g=mineralFoot341(rx,rz,index,root);prototypes.push(g);emit(g,soil,x,0,z);
  box(x,root+.039,z,.48*s/.62,.080,.44*s/.62,dampStone);box(x,root+.101,z,.37*s/.62,.048,.35*s/.62,dampStone);emit(shaft,dampStone,x,root+.228,z,s/.62,1,s/.62);box(x,root+.365,z,.44*s/.62,.042,.43*s/.62,dampStone);
  case341({x,y:root+.365+.446*s,z,s,yaw:-.15+index*.31,kind:'waterline-stone341',power:46+index*3,reach:5.3,stone:true,label:'waterline-pocket-'+index});
  const rocks=[];for(let j=0;j<7;j++){const a=j*2.39996+index*.6,r=.69+.21*hash(j,index),point=scatterPoint341(g,rx,rz,index,a,r),xx=x+point[0],zz=z+point[2],v=scans.variants[(index*2+j)%scans.variants.length];v.geometry.computeBoundingBox();const size=v.geometry.boundingBox.getSize(new T.Vector3()),scale=(.30+.25*hash(j,index+9))/Math.max(size.x,size.z),yaw=a+.17*hash(j,31),surface=point[1],yy=surface-v.geometry.boundingBox.min.y*scale-.038;emit(v.geometry,v.material,xx,yy,zz,scale,scale,scale,yaw,.92);rocks.push({position:[xx,yy,zz],uniformScale:scale,embed:.038,actualTriangulatedSoilY:surface,lowestGeometryY:surface-.038});}
  const grains=[];for(let j=0;j<24;j++){const a=j*2.399+index,r=.43+.52*hash(j,index+21),point=scatterPoint341(g,rx,rz,index,a,r),xx=x+point[0],zz=z+point[2],rr=.016+.035*hash(j,index+23),rotation=new T.Euler(.2,a,.4),q=new T.Quaternion().setFromEuler(rotation),scale=new T.Vector3(rr,rr*.62,rr*.88),p=chip.attributes.position;let minY=Infinity;for(let k=0;k<p.count;k++)minY=Math.min(minY,new T.Vector3().fromBufferAttribute(p,k).multiply(scale).applyQuaternion(q).y);const yy=point[1]-minY-rr*.42;emit(chip,dampStone,xx,yy,zz,rr,rr*.62,rr*.88,[.2,a,.4],.80+.18*hash(j,19));grains.push({point:[xx,yy,zz],soilY:point[1],embed:rr*.42});}
  const fernRoots=[],fernRootContacts=[];for(let j=0;j<5;j++){const a=j*2.39996+index*.77,r=.58+.15*hash(j,index+53),point=scatterPoint341(g,rx,rz,index,a,r),xx=x+point[0],zz=z+point[2],ss=.18+.10*hash(j,index+61),form=ferns[(j+index)%3],yy=point[1]-form.boundingBox.min.y*ss-.012;emit(form,fernMaterial,xx,yy,zz,ss,ss,ss,a,.86+.12*hash(j,index+67));fernRoots.push([xx,yy,zz]);fernRootContacts.push({soilY:point[1],lowestStemY:yy+form.boundingBox.min.y*ss,embed:.012});}
  shoreRecords.push({centre:[x,z],radii:[rx,rz],closedBed:true,waterline:-.02,lampStoneSeatY:root+.365,waterlineRocks:rocks,grains:24,grainContacts:grains,rootedFerns:fernRoots,fernRootContacts,scatterContact:'Actual Float32 triangulated mineral top; no continuous-height approximation',contact:{footBottomY:root-.001,mineralFlatSeatY:root,footEmbeddedMetres:.001,tableTopY:root+.386,caseLowerRabbetY:root+.365,rabbetTableIntersection:.021},soilFlatSeatRadiusNormalized:.56});
 }
 const audits=prototypes.map(audit341),info={revision:NIGHT_GARDEN341_REVISION,cases:caseRecords,shore:shoreRecords,closedPrototypeAudit:audits,hallOuterGalleryMounts:{existingBeamEndX:8.35,outerCaseX:9,closedShortBronzeArms:2,diagonalReturnBrace:true},lights:[],existingAnchorsHeld:{hall:H.position,pagoda:P.position,referenceCamera:true,bridge:true,dolly:true},newExternalAssets:false,lighting:'Actual modeled washi sources; finite-footprint inverse-square native proxies, current-camera pond and veranda planar capture plus fixed spatial radiance cells',approximation:'New secondary sources have no per-lamp geometry shadow; existing ten shadow sources retained. No exact area-emitter transport or full diffuse path tracing is claimed.',visualAccepted:false};
 return{info,installAperture(scene,materials){
  // Source visibility through this modeled square case is limited to its four
  // paper faces. A centre-to-receiver ray meeting the opaque bottom/top first
  // must not shine straight through the real cap into the soil. This analytic
  // aperture uses the actual0.505x0.672m pane box and its world yaw; a20percent
  // angular penumbra approximates finite paper area. It is local chassis
  // visibility, not a shadow map or an image-space attenuation layer.
  const points=[];scene.traverseVisible(o=>{if(o.isPointLight)points.push(o);});points.sort((a,b)=>(b.castShadow?2:0)-(a.castShadow?2:0)+(b.map?1:0)-(a.map?1:0));
  const cases=points.map((l,index)=>({l,index})).filter(q=>q.l.userData.garden341?.kind==='waterline-stone341'),scalar=x=>Number(x).toFixed(9),halfRatio=.672/.505;
  const branches=cases.map(({l,index})=>{const a=l.userData.garden341.boxYaw341,c=scalar(Math.cos(a)),s=scalar(Math.sin(a)),ns=scalar(-Math.sin(a));return`if(lightIndex==${index}){vec3 xAxis=normalize((viewMatrix*vec4(${c},0.,${ns},0.)).xyz),zAxis=normalize((viewMatrix*vec4(${s},0.,${c},0.)).xyz);float side=max(abs(dot(delta,xAxis)),abs(dot(delta,zAxis)));return smoothstep(.80,1.20,side*${scalar(halfRatio)}/max(vertical,.00001));}`;}).join('\n');
  const sourceFunction=`\nfloat closedCaseExit341(int lightIndex,vec3 delta){vec3 up=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);float vertical=abs(dot(delta,up));${branches}return 1.;}\n`,marker='directLight.color*=finiteFalloff203(pointLight.position-geometryPosition,finiteRadius203[i]);';
  for(const m of materials){if(!m.isMeshStandardMaterial)continue;const old=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m);m.onBeforeCompile=shader=>{old.call(m,shader);if(!shader.fragmentShader.includes(marker))throw Error('Finite source aperture341 integration marker missing');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>'+sourceFunction).replace(marker,marker+'directLight.color*=closedCaseExit341(UNROLLED_LOOP_INDEX,pointLight.position-geometryPosition);');};m.customProgramCacheKey=()=>key()+'-closed-waterline-paper-exit341-r03-'+cases.map(q=>q.index).join('-');m.needsUpdate=true;}
  info.closedSourceApertures341={cases:cases.map(({l,index})=>({name:l.name,finitePointIndex:index,chamber:l.position.toArray(),worldYaw:l.userData.garden341.boxYaw341,localPaneBox:[.505,.672],opaqueTopAndBottom:true})),formula:'soft centre-ray intersection with four real paper faces before opaque top/bottom; actual world axes transformed by current capture viewMatrix',angularPenumbraRatio:[.80,1.20],finitePaperAreaApproximation:true,exactAreaTransport:false,newSamplers:0,newSourcePower:false,geometryAndWorldLightPositionsHeld:true};return info.closedSourceApertures341;
 },finalize({materials}){
  // Runs after source203/court221 calibration and BEFORE the finite point
  // array is installed, preserving native light ordering and sampler budget.
  paper.emissive.setRGB(1,.44,.11);paper.emissiveIntensity=3.7;
  for(const l of sources){const s=l.userData.source203,g=l.userData.garden341;l.intensity=g.power*s.assemblyScale*s.assemblyScale;l.distance=g.reach;l.decay=2;l.color.setRGB(1,g.kind==='waterline-stone341'?.52:.50,g.kind==='waterline-stone341'?.18:.16);l.castShadow=false;l.userData.pool203=g.kind;
   info.lights.push({name:l.name,chamber:l.position.toArray(),candela:l.intensity,reach:l.distance,kind:g.kind,shadow:false,geometryClosed:true});}
  for(const m of materials)if(m===M.pagodaPaper){m.emissiveIntensity=1.5;m.emissive.setRGB(1,.46,.12);}
  return{revision:NIGHT_GARDEN341_REVISION,sourceCount:sources.length,paperExitance:paper.emissiveIntensity,exposureChanged:false,shadowSourcesAdded:0,visualAccepted:false};
 }};
}
