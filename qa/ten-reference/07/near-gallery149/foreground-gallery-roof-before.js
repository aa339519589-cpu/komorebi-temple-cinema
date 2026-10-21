import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const FOREGROUND_ROOF_REVISION='scene07-expanded-frame-roof-120';
// Fixed-camera fit of the whole foreground slope and its two edge families.
// World dimensions/depth are a metric hypothesis, not recovered photo depth.
// The photograph's near veranda roof is a large framing plane, not a small
// corner tile. Extend its distant ridge back while holding the near eave datum
// in the same projected place; slightly wider shoulders carry the roof into
// the lower-left foreground without covering the hall silhouette.
export const FOREGROUND_ROOF_LAYOUT=Object.freeze({position:Object.freeze([0.04,8.938616,29.73]),yaw:1.078179,ridgeHalf:4.4,eaveHalf:5.4,run:5.60,rise:1.114107,curl:.388020,tilePitch:.48,courses:8});
const TAU=Math.PI*2;
const hash=(x,y=0)=>{const q=Math.sin(x*127.1+y*311.7+83.7)*43758.5453;return q-Math.floor(q);};
const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const V=p=>new T.Vector3(...p);

export const foregroundSpan=t=>FOREGROUND_ROOF_LAYOUT.ridgeHalf+(FOREGROUND_ROOF_LAYOUT.eaveHalf-FOREGROUND_ROOF_LAYOUT.ridgeHalf)*t;
// Broad shallow face with a short hip shoulder, rather than the former steep
// wedge which doubled its width over a long near-camera run.
export function foregroundPoint(t,u){const {rise,curl,run}=FOREGROUND_ROOF_LAYOUT;return[u*foregroundSpan(t),rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,7)*(.2+.8*Math.pow(Math.abs(u),5)),run*t];}
function frameAt(t,u,parallel=false){
 const p=V(foregroundPoint(t,u)),e=.0001,ta=Math.max(0,t-e),tb=Math.min(1,t+e),x=p.x,a=V(foregroundPoint(ta,parallel?x/foregroundSpan(ta):u)),b=V(foregroundPoint(tb,parallel?x/foregroundSpan(tb):u)),forward=b.sub(a).normalize(),across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize();return{p,forward,across,up};
}

// Closed clay shells, with a shallow bevel, millimetre pitting and a real
// lifted lap at the lower edge. All units are local building metres.
export function createGalleryTile(points,width=.32,{cover=true,variant=0,crown=.17,thickness=.025,bed=.24,lap=.028}={}){
 const curve=new T.CatmullRomCurve3(points.map(V)),rows=6,cols=cover?14:8,p=[],uv=[],colors=[],ids=[],stride=(rows+1)*(cols+1);
 for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++){
  const t=j/rows,c=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),across=new T.Vector3(0,1,0).cross(tangent).normalize(),up=tangent.clone().cross(across).normalize(),arr=smooth(0,.10,Math.min(t,1-t)),lip=lap*smooth(.0,1,t);
  for(let k=0;k<=cols;k++){
   const q=k/cols*2-1,inset=.004*(1-arr),x=q*(width/2-inset),height=cover?crown*Math.sqrt(Math.max(0,1-q*q)):crown*q*q,wear=.0016*Math.sin(q*7.3+variant*2.1+t*5.7)+.0008*Math.sin(q*17.1-t*9.3+variant),round=.004*(1-arr),v=c.clone().addScaledVector(across,x).addScaledVector(up,bed+height+lip+wear-round-layer*thickness);
   p.push(...v.toArray());uv.push(k/cols*.48+hash(variant)*7,t*.44+hash(variant,2)*11);const f=.90+.14*hash(variant,1)+.016*Math.sin(q*9+t*7+variant);colors.push(f,f,f);
  }
 }
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;tri(a,c,b);tri(b,c,d);}
 const edge=[...Array.from({length:cols},(_,k)=>k),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,k)=>rows*(cols+1)+cols-k),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();g.name=cover?'gallery-short-closed-cover':'gallery-short-closed-pan';g.userData={closedClay:true,thicknessMetres:thickness,arrisBevelMetres:.004,lapLiftMetres:lap,photoTexture:false};return g;
}
function closedDeck(){
 const nx=64,nz=32,p=[],uv=[],ids=[],stride=(nx+1)*(nz+1);
 for(let side=0;side<2;side++)for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const q=foregroundPoint(j/nz,-1+2*i/nx);p.push(q[0],q[1]+(side?-.04:.20),q[2]);uv.push(q[0],q[2]);}
 const tri=(a,b,c)=>ids.push(a,b,c,c+stride,b+stride,a+stride);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;tri(a,c,b);tri(b,c,d);}
 const edge=[...Array.from({length:nx},(_,i)=>i),...Array.from({length:nz},(_,j)=>j*(nx+1)+nx),...Array.from({length:nx},(_,i)=>nz*(nx+1)+nx-i),...Array.from({length:nz},(_,j)=>(nz-j)*(nx+1))];
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ids.push(a,b,a+stride,b,b+stride,a+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='gallery-closed-curved-bedding';return g;
}
function revolvedZ(profile,name){
 const n=64,p=[],uv=[],ids=[],rings=[];
 for(let j=0;j<profile.length;j++){const [r,z]=profile[j],ring=[];if(r===0){ring.push(p.length/3);p.push(0,0,z);uv.push(.5,.5);}else for(let i=0;i<n;i++){const a=i/n*TAU;ring.push(p.length/3);p.push(Math.cos(a)*r,Math.sin(a)*r,z);uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);}rings.push(ring);}
 for(let j=0;j<rings.length;j++){const a=rings[j],b=rings[(j+1)%rings.length];if(a.length===1&&b.length===1)continue;for(let i=0;i<n;i++){const k=(i+1)%n;if(a.length===1)ids.push(a[0],b[i],b[k]);else if(b.length===1)ids.push(a[i],b[0],a[k]);else ids.push(a[i],b[i],a[k],a[k],b[i],b[k]);}}
 let volume=0;for(let i=0;i<ids.length;i+=3){const a=V(p.slice(ids[i]*3,ids[i]*3+3)),b=V(p.slice(ids[i+1]*3,ids[i+1]*3+3)),c=V(p.slice(ids[i+2]*3,ids[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name=name;g.userData={closedCastMetal:true,photoTexture:false};return g;
}
function createEndParts(){
 const parts=[];
 parts.push({g:revolvedZ([[0,-.035],[.17,-.035],[.194,-.024],[.20,-.006],[.195,.014],[.17,.022],[0,.022]],'gallery-solid-ceramic-end-seal'),m:'ceramic'});
 parts.push({g:revolvedZ([[0,.018],[.132,.018],[.151,.026],[.151,.038],[.13,.045],[0,.045]],'gallery-cast-bronze-medallion'),m:'bronze'});
 parts.push({g:revolvedZ([[.134,.038],[.153,.038],[.165,.048],[.165,.060],[.155,.069],[.140,.064]],'gallery-thick-rolled-medallion-rim'),m:'gilt'});
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-.043,.035,-.035,.091,0,.111);s.bezierCurveTo(.042,.090,.031,.033,0,0);s.closePath();const hole=new T.Path();hole.moveTo(-.003,.025);hole.bezierCurveTo(.020,.048,.023,.071,.003,.086);hole.bezierCurveTo(-.012,.069,-.014,.043,-.003,.025);hole.closePath();s.holes.push(hole);
 const leaf=new T.ExtrudeGeometry(s,{depth:.015,steps:1,bevelEnabled:true,bevelSize:.004,bevelThickness:.005,bevelSegments:3,curveSegments:20});
 for(let j=0;j<5;j++){const g=leaf.clone();g.rotateZ(j*TAU/5);g.translate(0,0,.043);parts.push({g,m:'gilt'});}leaf.dispose();
 parts.push({g:revolvedZ([[0,.042],[.026,.042],[.031,.051],[.027,.065],[0,.069]],'gallery-raised-cast-centre'),m:'gilt'});return parts;
}
function makeMaterials(){
 const size=128,a=new Uint8Array(size*size*4),r=new Uint8Array(a.length),h=new Uint8Array(a.length);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const q=hash(x,y),b=.5+.25*Math.sin(x*.07+y*.023)+.25*Math.sin(x*.021-y*.09),i=(y*size+x)*4,c=224+10*b+7*(q-.5),rr=214+20*b+8*q,hh=128+45*(q-.5)+12*Math.sin(y*.63)-(hash(x+11,y+3)<.07?30:0);a[i]=a[i+1]=a[i+2]=c;a[i+3]=255;r[i]=r[i+1]=r[i+2]=rr;r[i+3]=255;h[i]=h[i+1]=h[i+2]=hh;h[i+3]=255;}
 const textures=[];function tex(p,color=false){const t=new T.DataTexture(p,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);return t;}
 const albedo=tex(a,true),rough=tex(r),bump=tex(h),ceramic=new T.MeshPhysicalMaterial({name:'foreground-neutral-blue-grey-rough-ceramic',color:'#4b5862',map:albedo,roughness:.88,roughnessMap:rough,bumpMap:bump,bumpScale:.003,metalness:0,clearcoat:.015,clearcoatRoughness:.78,specularIntensity:.28,vertexColors:true});
 const ceramicEnd=ceramic.clone();ceramicEnd.name='foreground-thick-ceramic-end';ceramicEnd.vertexColors=false;
 const bronze=new T.MeshPhysicalMaterial({name:'foreground-aged-cast-bronze',color:'#765930',metalness:.88,roughness:.54,bumpMap:bump,bumpScale:.00035});
 const gilt=new T.MeshPhysicalMaterial({name:'foreground-worn-embossed-gilt',color:'#b18d4c',metalness:.90,roughness:.44,bumpMap:bump,bumpScale:.0003});
 const deck=new T.MeshStandardMaterial({name:'foreground-dark-clay-bedding',color:'#20282b',roughness:.98});
 return{ceramic,ceramicEnd,bronze,gilt,deck,dispose(){for(const m of[ceramic,ceramicEnd,bronze,gilt,deck])m.dispose();for(const t of textures)t.dispose();}};
}
export function buildForegroundGalleryRoof(api){
 const {emit,rod,box}=api,materials=makeMaterials(),covers=[],pans=[],special=[],ends=createEndParts(),{ridgeHalf,eaveHalf,tilePitch:pitch,courses,run}=FOREGROUND_ROOF_LAYOUT,lanes=Math.round(2*eaveHalf/pitch),ridgeSegments=Math.ceil(2*ridgeHalf/pitch),counts={covers:0,pans:0,raisedTerminals:0,metalEnds:0};
 const add=(g,list)=>{list.push(g);};
 emit(closedDeck(),materials.deck,0,0,0);
 for(let i=0;i<=lanes;i++){
  const x=-eaveHalf+pitch*i,start=Math.max(0,(Math.abs(x)-ridgeHalf)/(eaveHalf-ridgeHalf));
  for(let j=0;j<courses;j++){
   const ta=Math.max(start,j/courses),tb=Math.min(1,(j+1)/courses+.008);if(tb<=ta+.001)continue;
   add(createGalleryTile(lin(ta,tb,6).map(t=>foregroundPoint(t,x/foregroundSpan(t))),.32,{variant:i*31+j*7}),covers);counts.covers++;
  }
  if(i<lanes){const xx=x+pitch/2,begin=Math.max(0,(Math.abs(xx)-ridgeHalf)/(eaveHalf-ridgeHalf));for(let j=0;j<courses;j++){const ta=Math.max(begin,j/courses),tb=Math.min(1,(j+1)/courses+.008);if(tb<=ta+.001)continue;add(createGalleryTile(lin(ta,tb,6).map(t=>foregroundPoint(t,xx/foregroundSpan(t))),.40,{cover:false,crown:.03,bed:.21,lap:.022,thickness:.022,variant:i*23+j*11}),pans);counts.pans++;}}
  // The photograph resolves broad terminals on alternate near-eave lanes.
  if(i%2===1||i===0||i===lanes)placeEnd(1,x/eaveHalf,.24);
  // Selected raised short terminal pieces preserve the reference's scattered
  // glazed/cast medallions without the former full rows of long round pipes.
  if(i%2===0)for(const t of[.20,.40])if(Math.abs(x)<foregroundSpan(t)-.16){const u=x/foregroundSpan(t),points=lin(t-.05,t,6).map((q,k)=>{const uq=x/foregroundSpan(q),f=frameAt(q,uq,true);return f.p.addScaledVector(f.up,.24+.19*(k/6)**1.3).toArray();});add(createGalleryTile(points,.40,{bed:0,crown:.20,lap:0,thickness:.028,variant:i*13+t*31}),special);counts.raisedTerminals++;const curve=new T.CatmullRomCurve3(points.map(V));placeEnd(t,u,.43,curve.getPoint(1),curve.getTangent(1));}
 }
 for(const sign of[-1,1])for(let j=0;j<courses;j++){const ta=j/courses,tb=Math.min(1,(j+1)/courses+.008);add(createGalleryTile(lin(ta,tb,6).map(t=>foregroundPoint(t,sign)),.34,{bed:.27,crown:.17,lap:.025,thickness:.027,variant:sign*53+j*19}),special);}
 for(let j=0;j<ridgeSegments;j++){const xa=-ridgeHalf+j*2*ridgeHalf/ridgeSegments,xb=-ridgeHalf+(j+1.08)*2*ridgeHalf/ridgeSegments;add(createGalleryTile(lin(xa,Math.min(ridgeHalf,xb),6).map(x=>[x,FOREGROUND_ROOF_LAYOUT.rise+.14,0]),.31,{bed:.035,crown:.17,lap:.025,thickness:.027,variant:j*29}),special);}
 for(const list of[covers,pans,special]){const g=mergeGeometries(list,false);g.name='foreground-lapped-ceramic-assembly';emit(g,materials.ceramic,0,0,0);for(const p of list)p.dispose();}
 // Rafters, fascia and ridge seat follow the rebuilt footprint/profile.
 for(let i=0;i<=23;i++){const u=-1+2*i/23,a=foregroundPoint(.82,u),b=foregroundPoint(1.035,u);a[1]-=.22;b[1]-=.22;rod(a,b,.065,'red');}
 for(let j=0;j<40;j++){const a=foregroundPoint(1,-1+j*.05),b=foregroundPoint(1,-1+(j+1)*.05);a[1]-=.14;b[1]-=.14;rod(a,b,.10,'wood');}
 box(0,FOREGROUND_ROOF_LAYOUT.rise+.13,0,2*ridgeHalf+.15,.25,.28,'tile');
 function placeEnd(t,u,lift,centre=null,tangent=null){const f=frameAt(t,u,true),forward=tangent?tangent.clone().normalize():f.forward,across=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(across).normalize(),p=(centre?centre.clone():f.p.clone().addScaledVector(f.up,lift)).addScaledVector(forward,.035),basis=new T.Matrix4().makeBasis(across,up,forward),e=new T.Euler().setFromRotationMatrix(basis),rot=[e.x,e.y,e.z];for(const part of ends)emit(part.g,part.m==='ceramic'?materials.ceramicEnd:materials[part.m],p.x,p.y,p.z,1,1,1,rot);counts.metalEnds++;}
 return{audit:{revision:FOREGROUND_ROOF_REVISION,footprint:[2*eaveHalf,2*run],visiblePitchFace:{ridgeWidth:2*ridgeHalf,eaveWidth:2*eaveHalf,run,rise:FOREGROUND_ROOF_LAYOUT.rise,curl:FOREGROUND_ROOF_LAYOUT.curl},oldLocalProfilePreserved:false,worldTransform:{position:[...FOREGROUND_ROOF_LAYOUT.position],yaw:FOREGROUND_ROOF_LAYOUT.yaw},tileLanes:lanes+1,courses,tilePitchMetres:pitch,coverWidthMetres:.32,panWidthMetres:.40,nominalCourseLengthMetres:run/courses,ceramicWallMetres:[.022,.028],arrisBevelMetres:.004,embossDepthMetres:.02,counts,metricScaleInferred:true,fitRmsPixels:9.801790877076128,photoTextureOrProjection:false,visualAccepted:false},dispose(){materials.dispose();}};
}
