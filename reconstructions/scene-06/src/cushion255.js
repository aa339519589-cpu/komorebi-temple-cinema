import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Cushion255: a closed sewn rectangular pad and its actual lacquer tray.
// Only an independently generated flat cloth albedo is used. No scene photo
// is loaded, projected, converted to depth or used as a geometry substitute.
const TAU=Math.PI*2,CZ=3.28;
export const CUSHION255=Object.freeze({revision:'cushion255-r06-abf-sewn-side',localFloor:-.045,clothBearingY:.065,clothTopRimY:.490,clothWidth:1.68,clothDepth:.795,frameWidth:2.148,frameDepth:1.155,photographicAcceptance:false});
let surface255=null,sideChart255=null;
export function installCushionSideChart255(input){
 const bytes=input instanceof ArrayBuffer?input:input.buffer.slice(input.byteOffset,input.byteOffset+input.byteLength),d=new DataView(bytes),n=d.getUint32(4,true);
 if(d.getUint32(0,true)!==0x36555643||d.getUint32(8,true)!==128||d.getUint32(12,true)!==160||n!==129*161||bytes.byteLength!==20+n*8)throw Error('cushion255 ABF chart schema/vertex identity mismatch');
 sideChart255=new Float32Array(n*2);for(let i=0;i<n*2;i++){sideChart255[i]=d.getFloat32(20+i*4,true);if(!Number.isFinite(sideChart255[i]))throw Error('Nonfinite cushion255 ABF UV');}return{vertices:n,method:'ANGLE_BASED sewn back-seam side chart'};
}
export async function loadCushionSurface255(){
 const [map,uvResponse]=await Promise.all([new T.TextureLoader().loadAsync(new URL('../assets/cushion255/brocade255-flat-albedo-r02.png',import.meta.url).href),fetch(new URL('../assets/cushion255/cushion255-side-abf-r06.bin',import.meta.url))]);
 if(!uvResponse.ok)throw Error('cushion255 ABF side chart failed to load');installCushionSideChart255(await uvResponse.arrayBuffer());
 map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;map.magFilter=T.LinearFilter;map.anisotropy=8;
 surface255=map;return{revision:'brocade255-r02',role:'generated flat albedo only; no baked scene lighting',sourcePixels:[1254,1254],visualAccepted:false};
}
function weave255(){
 const n=128,a=new Uint8Array(n*n*4);let seed=255031;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  seed=(1664525*seed+1013904223)>>>0;
  const warp=Math.cos(x*TAU/4),weft=Math.cos(y*TAU/4),over=(Math.floor(x/4)+Math.floor(y/4))%2,thread=over?warp:weft,v=172+24*thread+3*(seed/4294967296-.5),i=(y*n+x)*4;
  a[i]=a[i+1]=a[i+2]=Math.round(v);a[i+3]=255;
 }
 const t=new T.DataTexture(a,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(48,48);t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.needsUpdate=true;return t;
}
function mats(b){
 if(b.materials.cushion255Cloth)return;
 if(!surface255)throw Error('cushion255 flat material was not loaded by the explicit198 loader hook.');
 Object.assign(b.materials,{
  cushion255Cloth:new T.MeshPhysicalMaterial({name:'cushion255-r05-soft-blue-grey-jacquard',map:surface255,color:'#ffffff',roughness:.86,metalness:0,specularIntensity:.20,sheen:.36,sheenColor:'#a9b4c4',sheenRoughness:.98,bumpMap:weave255(),bumpScale:.000014,envMapIntensity:1.0}),
  cushion255Piping:new T.MeshPhysicalMaterial({name:'cushion255-r01-folded-indigo-sewn-cord',color:'#111621',roughness:.90,metalness:0,specularIntensity:.22,sheen:.12,sheenColor:'#6b727d',sheenRoughness:.88}),
  cushion255Lacquer:new T.MeshPhysicalMaterial({name:'cushion255-r02-black-urushi-real-tray',color:'#030203',roughness:.34,metalness:0,clearcoat:.24,clearcoatRoughness:.30,specularIntensity:.32,envMapIntensity:.36}),
  cushion255LacquerRecess:new T.MeshPhysicalMaterial({name:'cushion255-r01-shadowed-rebates',color:'#010102',roughness:.43,metalness:0,clearcoat:.14,clearcoatRoughness:.34,specularIntensity:.24,envMapIntensity:.25}),
  cushion255Gilt:new T.MeshStandardMaterial({name:'cushion255-r01-small-aged-gilt-inlay',color:'#73592e',metalness:.83,roughness:.52,envMapIntensity:.48}),
 });
}
function box(b,key,x,y,z,w,h,d,mat='cushion255Lacquer',r=.006){b.add(b.geometry('255-'+key,()=>new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/5,h/5,d/5))),mat,x,y,z);}
// [height, half width, half depth, plan superellipse power]. A broad straight
// sidewall, a softly rolled shoulder and a wide compressed crown replace the
// old deformed sphere. The bottom is an actual flat cloth bearing surface.
const PROFILE=[[.065,.690,.310,5.4],[.112,.790,.365,5.2],[.185,.835,.395,5.0],[.285,.840,.3975,5.0],[.395,.820,.383,5.3],[.460,.760,.335,5.8],[.490,.680,.255,6.0]];
function monotone255(y,column){
 const n=PROFILE.length,d=Array.from({length:n-1},(_,i)=>(PROFILE[i+1][column]-PROFILE[i][column])/(PROFILE[i+1][0]-PROFILE[i][0])),m=new Array(n);m[0]=d[0];m[n-1]=d[n-2];
 for(let i=1;i<n-1;i++){if(d[i-1]*d[i]<=0)m[i]=0;else{const h0=PROFILE[i][0]-PROFILE[i-1][0],h1=PROFILE[i+1][0]-PROFILE[i][0],w0=2*h1+h0,w1=h1+2*h0;m[i]=(w0+w1)/(w0/d[i-1]+w1/d[i]);}}
 let i=0;while(i<n-2&&y>PROFILE[i+1][0])i++;const h=PROFILE[i+1][0]-PROFILE[i][0],t=T.MathUtils.clamp((y-PROFILE[i][0])/h,0,1),a=PROFILE[i][column],c=PROFILE[i+1][column];return(2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*h*m[i]+(-2*t*t*t+3*t*t)*c+(t*t*t-t*t)*h*m[i+1];
}
function atHeight(y){
 const value=[y,monotone255(y,1),monotone255(y,2),monotone255(y,3)];
 // An independently authored quarter-ellipse roll reaches the crown with
 // a horizontal tangent. The old zero-slope r(y) knots made hard ring bands.
 const a=PROFILE.at(-2),c=PROFILE.at(-1);if(y>=a[0]){const t=T.MathUtils.clamp((y-a[0])/(c[0]-a[0]),0,1),q=Math.sqrt(Math.max(0,1-t*t));value[1]=c[1]+(a[1]-c[1])*q;value[2]=c[2]+(a[2]-c[2])*q;}return value;
}
const signed=(v,p)=>Math.sign(v)*Math.pow(Math.abs(v),p),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function contour(phi,rx,rz,power){let c=Math.cos(phi),s=Math.sin(phi);if(Math.abs(c)<1e-12)c=0;if(Math.abs(s)<1e-12)s=0;return[rx*signed(c,2/power),rz*signed(s,2/power)];}
function clothPoint(y,phi){
 const [,rx,rz,power]=atHeight(y),[x,z]=contour(phi,rx,rz,power),t=(y-.065)/(.490-.065);
 let pinch=0;for(const center of[.47,.90,1.26,1.91,2.40,3.73,4.37,5.06,5.75])pinch+=Math.exp(-Math.pow(wrap(phi-center)/.028,2));
 const seamGather=.0065*pinch*Math.exp(-Math.pow((y-.135)/.069,2))*Math.sin(Math.PI*t),scale=1-seamGather/(Math.hypot(x,z)||1);
 const ripple=.0024*Math.sin(phi*15+.7*Math.sin(phi*3))*Math.sin(Math.PI*t)*Math.exp(-Math.pow((y-.155)/.14,2));
 return[x*scale,y+ripple,z*scale];
}
const worldDistance255=(a,c)=>Math.hypot((c[0]-a[0])*.6216,(c[1]-a[1])*.60,(c[2]-a[2])*.74);
function perimeterAngles255(cols){
 const samples=4096,phi=[-Math.PI/2],arc=[0],p=[contour(phi[0],.840,.3975,5)];
 for(let i=1;i<=samples;i++){phi.push(-Math.PI/2+i/samples*TAU);p.push(contour(phi[i],.840,.3975,5));arc.push(arc[i-1]+Math.hypot((p[i][0]-p[i-1][0])*.6216,(p[i][1]-p[i-1][1])*.74));}
 const result=[];let j=0;for(let k=0;k<=cols;k++){const target=arc.at(-1)*k/cols;while(j<samples-1&&arc[j+1]<target)j++;const f=(target-arc[j])/(arc[j+1]-arc[j]||1);result.push(phi[j]+(phi[j+1]-phi[j])*f);}result[0]=-Math.PI/2;result[cols]=Math.PI*1.5;return result;
}
function clothGeometry255(authoring=false){
 const cols=160,rows=128,stride=cols+1,p=[],uv=[],ix=[],lo=.065,hi=.490,grid=[],vArc=new Array(stride).fill(0);
 const angles=perimeterAngles255(cols);if(!authoring&&!sideChart255)throw Error('cushion255 final side chart was not installed');
 for(let j=0;j<=rows;j++){
  const y=j===0?lo:j===rows?hi:lo+(hi-lo)*j/rows;grid.push(Array.from({length:stride},(_,k)=>clothPoint(y,angles[k])));
 }
 for(let j=0;j<=rows;j++){
  const uArc=[0];for(let k=1;k<=cols;k++)uArc.push(uArc[k-1]+worldDistance255(grid[j][k-1],grid[j][k])/1.20);const phase=.50-uArc[cols/4];
  for(let k=0;k<=cols;k++){
   const point=grid[j][k];if(j>0)vArc[k]+=worldDistance255(grid[j-1][k],point)/1.20;
   p.push(point[0],point[1],CZ+point[2]);const n=j*stride+k;uv.push(sideChart255&&!authoring?sideChart255[n*2]:uArc[k]+phase,sideChart255&&!authoring?sideChart255[n*2+1]:vArc[k]+.17);
   if(j<rows&&k<cols){const a=j*stride+k,c=a+stride;ix.push(a,c,a+1,a+1,c,c+1);}
  }
 }
 // Wide crown panel with a gentle real pressure depression, complete back
 // and side continuity. UVs are a separate sewn planar panel in metric scale.
 const centerPressure=.012+.003*Math.exp(-1)+.0025*Math.exp(-1),center=p.length/3;p.push(0,hi-centerPressure,CZ);uv.push(.50,.38);
 const rings=32,topStart=p.length/3;
 for(let j=1;j<=rings;j++)for(let k=0;k<=cols;k++){
  const q=j/rings,phi=angles[k],[ex,ez]=contour(phi,.680,.255,6),x=q*ex,z=q*ez;
  const pressure=.012*Math.pow(1-q*q,2)+.003*Math.exp(-Math.pow((x-.22)/.22,2)-Math.pow(z/.17,2))*(1-q)+.0025*Math.exp(-Math.pow((x+.22)/.22,2)-Math.pow(z/.17,2))*(1-q);
  p.push(x,hi-pressure,CZ+z);uv.push(x*.6216/1.20+.50,z*.74/1.20+.38);
  if(j===1&&k<cols)ix.push(center,topStart+k+1,topStart+k);
  if(j>1&&k<cols){const a=topStart+(j-2)*stride+k,c=a+stride;ix.push(a,a+1,c,a+1,c+1,c);}
 }
 // The final crown ring is position-identical to the side's upper rim. Join
 // only through shared geometric seams, retaining the intentional UV cut.
 const bottomCenter=p.length/3;p.push(0,lo,CZ);uv.push(.2,.2);
 for(let k=0;k<cols;k++)ix.push(bottomCenter,k,k+1);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData={closedCarvedShell:true,cushion255:true,construction:'closed sewn loft, uniform perimeter samples, real shoulder roll and lightly pressed crown',uvMetric:'offline ANGLE_BASED conformal chart in physical world scale; one actual back seam, top/bottom separate sewn panels; no image sampling',sideRows:rows,sideCols:cols,clothBottomY:lo,clothTopRimY:hi,crownDepressionLocal:.01403};return g;
}
export function buildCushionAuthoringGeometry255(){return clothGeometry255(true);}
function piping255(b,key,y,radius=.0025){
 const pts=[],angles=perimeterAngles255(160);for(let k=0;k<160;k++){const a=angles[k],p=clothPoint(y,a),radial=Math.hypot(p[0],p[2])||1;pts.push(new T.Vector3(p[0]*(1+.0010/radial),p[1],CZ+p[2]*(1+.0010/radial)));}
 const g=b.geometry('255-closed-piping-'+key,()=>{const g=new T.TubeGeometry(new T.CatmullRomCurve3(pts,true),480,radius,8,true);g.userData={closedCarvedShell:true,cushion255:true,sewnCord:true};return g;});b.add(g,'cushion255Piping');
}
function backJoin255(b){
 const points=[];for(let j=0;j<=48;j++){const y=.135+(.490-.135)*j/48,p=clothPoint(y,-Math.PI/2),r=Math.hypot(p[0],p[2])||1;points.push(new T.Vector3(p[0]*(1+.001/r),p[1],CZ+p[2]*(1+.001/r)));}
 const g=b.geometry('255-real-closed-back-sewn-UV-join',()=>{
  const path=new T.CatmullRomCurve3(points),rows=192,cols=8,g=new T.TubeGeometry(path,rows,.0015,cols,false),p=Array.from(g.attributes.position.array),n=Array.from(g.attributes.normal.array),uv=Array.from(g.attributes.uv.array),ix=Array.from(g.index.array);
  for(const end of[0,1]){const axis=path.getTangentAt(end).normalize().multiplyScalar(end?1:-1),c=path.getPointAt(end),rim=(end?rows:0)*(cols+1),start=p.length/3;for(let k=0;k<=cols;k++){const v=new T.Vector3().fromBufferAttribute(g.attributes.position,rim+k);p.push(v.x,v.y,v.z);n.push(axis.x,axis.y,axis.z);uv.push(.5+.5*Math.cos(k/cols*TAU),.5+.5*Math.sin(k/cols*TAU));}const ci=p.length/3;p.push(c.x,c.y,c.z);n.push(axis.x,axis.y,axis.z);uv.push(.5,.5);for(let k=0;k<cols;k++){const a=new T.Vector3().fromArray(p,(start+k)*3).sub(c),d=new T.Vector3().fromArray(p,(start+k+1)*3).sub(c);if(a.cross(d).dot(axis)>0)ix.push(ci,start+k,start+k+1);else ix.push(ci,start+k+1,start+k);}}
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.userData={closedCarvedShell:true,cushion255:true,sewnCord:true,backPanelJoin:true};return g;
 });b.add(g,'cushion255Piping');
}
function turnedPost255(b,key,x,z,back=false){
 const profile=[[0,.043],[.070,.043],[.073,.062],[.055,.080],[.044,.104],[.056,.133],[.065,.158],[.059,.180],[.039,.204],[.033,.226],[.049,.244],[.047,.262],[.038,.279],[.044,.293],[.031,.307],[0,.316]];
 b.lathe('255-real-turned-corner-'+key,profile,x,0,z,1,back?.90:1,'cushion255Lacquer',64);
 b.torus(x,.103*(back?.90:1),z,.045,.0019,'cushion255Gilt',Math.PI/2);
 box(b,'corner-bearing-socket-'+key,x,.054,z,.143,.042,.143,'cushion255Lacquer',.009);
}
function inlay255(b,key,x,y,z){
 const shape=new T.Shape();shape.absellipse(0,0,.070,.026,0,TAU,false);const hole=new T.Path();hole.absellipse(0,0,.066,.0225,0,TAU,true);shape.holes.push(hole);
 const g=b.geometry('255-inset-oval-inlay',()=>{const g=new T.ExtrudeGeometry(shape,{depth:.0025,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.0007,bevelThickness:.0007,curveSegments:48});g.userData={closedCarvedShell:true,cushion255:true};return g;});b.add(g,'cushion255Gilt',x,y,z);
 const stem=b.geometry('255-inlay-folded-center',()=>{
  const s=new T.Shape();s.moveTo(-.003,-.010);s.bezierCurveTo(-.027,-.002,-.023,.010,-.011,.016);s.bezierCurveTo(-.007,.011,-.005,.004,0,.002);s.bezierCurveTo(.005,.004,.007,.011,.011,.016);s.bezierCurveTo(.023,.010,.027,-.002,.003,-.010);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.0025,bevelEnabled:true,bevelSize:.0006,bevelThickness:.0006,bevelSegments:2,curveSegments:14});g.userData={closedCarvedShell:true,cushion255:true};return g;
 });b.add(stem,'cushion255Gilt',x,y,z+.001);
}
function returnedEnd255(b,side){
 const s=new T.Shape();
 const p=(x,y)=>[side*x,y];s.moveTo(...p(-.122,-.039));s.lineTo(...p(.110,-.039));s.quadraticCurveTo(...p(.124,-.039),...p(.124,-.026));s.lineTo(...p(.124,.026));s.quadraticCurveTo(...p(.124,.041),...p(.107,.043));s.lineTo(...p(-.108,.040));s.quadraticCurveTo(...p(-.126,.035),...p(-.126,.019));s.lineTo(...p(-.126,-.024));s.quadraticCurveTo(...p(-.126,-.039),...p(-.122,-.039));s.closePath();
 const g=b.geometry('255-closed-curved-front-end-'+side,()=>{const g=new T.ExtrudeGeometry(s,{depth:.032,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:3,curveSegments:24});g.userData={closedCarvedShell:true,cushion255:true,actualSideReturns:true};return g;});
 b.add(g,'cushion255Lacquer',side*.950,.020,CZ+.609);
}
export function buildKneelingSeat255(b,layout,floorY){
 mats(b);
 // The low outer frame and its actual central bearing are separate levels.
 // The cloth's flat bottom is on the bearing, not floating above a black box.
 box(b,'full-floor-bearing-sole',0,floorY+.013,CZ+.060,2.12,.026,1.14,'cushion255LacquerRecess',.007);
 box(b,'lower-stepped-plinth',0,-.006,CZ+.060,2.14,.034,1.155,'cushion255Lacquer',.007);
 box(b,'upper-flat-tray',0,.032,CZ+.060,2.12,.044,1.135,'cushion255Lacquer',.006);
 box(b,'central-actual-cloth-bearing',0,.0525,CZ,1.46,.025,.620,'cushion255Lacquer',.006);
 // A real framed front: the panel is behind two mouldings and stiles,
 // instead of a dark rectangle pasted in front of one solid box.
 box(b,'front-panel-real-backboard',0,.020,CZ+.619,2.12,.046,.020,'cushion255LacquerRecess',.004);
 for(const yy of[-.011,.051])box(b,'front-moulded-rail-'+yy,0,yy,CZ+.625,2.14,.016,.032,'cushion255Lacquer',.005);
 for(const xx of[-.650,.650])box(b,'front-real-inner-stile-'+xx,xx,.020,CZ+.628,.018,.046,.026,'cushion255Lacquer',.003);
 for(const side of[-1,1]){
  box(b,'side-rim-'+side,side*1.030,.068,CZ+.060,.038,.042,1.108,'cushion255Lacquer',.006);
  returnedEnd255(b,side);
  turnedPost255(b,'front-'+side,side*.940,CZ+.400,false);turnedPost255(b,'rear-'+side,side*.940,CZ-.400,true);
  inlay255(b,'front-'+side,side*.950,.019,CZ+.6405);
 }
 // Subdued thin inlaid beads enter the real moulded rail faces.
 box(b,'front-fine-gilt-upper-edge',0,.060,CZ+.6415,2.11,.0024,.0035,'cushion255Gilt',.0005);
 box(b,'front-fine-gilt-lower-edge',0,-.016,CZ+.6415,2.11,.0018,.0035,'cushion255Gilt',.0004);
 for(const side of[-1,1])box(b,'gilt-side-return-'+side,side*1.049,.060,CZ+.060,.0025,.0025,1.12,'cushion255Gilt',.0005);
 const cloth=b.geometry('255-closed-soft-rectangular-sewn-cushion',()=>clothGeometry255(false));b.add(cloth,'cushion255Cloth');
 piping255(b,'lower-side-seam',.135,.0025);piping255(b,'upper-shoulder-seam',.490,.0020);backJoin255(b);
 b.root.userData.cushion255={...CUSHION255,authoring:'closed rectangular pad, uniform perimeter samples, soft shoulder roll and pressed crown; independent sewn panels',texture:'cushion255/brocade255-flat-albedo-r02.png',source:'built-in imagegen flat albedo; full prompts/provenance retained',texturePanelPeriodWorldMetres:1.20,textureUV:'queued Blender ANGLE_BASED back-seam chart, world-area density normalized; only UV bytes authored, no positional change in unwrap; corrected top panel center',sideChart:'cushion255/cushion255-side-abf-r06.bin',generatedImageIsMaterialOnly:true,noEmissiveOrLightChanges:true,base:'frozen R04 frame unchanged',clothBaseContactY:.065,bearingTopY:.065,worldClothBaseY:.066,worldCrownRimY:.321,table247AndCapital254Unchanged:true,ritualObjectsAndFocusUnchanged:true,visualAccepted:false};
 b.root.userData.kneelingSeat198=b.root.userData.cushion255;
}
