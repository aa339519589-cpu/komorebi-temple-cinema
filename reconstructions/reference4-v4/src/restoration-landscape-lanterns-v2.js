import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { flowerCrest } from './ornaments.js';
import {buildBoulderMossData} from './reference4-weathered-boulder.js';

// Complete new photo4 carved lantern successor built from the recovered asset.
// Explicit anchors in the new garden; no renderer, lights or shared random stream.
export const RESTORATION_STONE_LANTERN_ANCHORS = Object.freeze([
  [-17,0,10,1.25],[15,0,7,1.2],[1.1,0,16,1.1],[10.9,0,16,1.1],
  [-19,0,-1,1.05],[18,0,-7,1.15],[-6,0,-7,.9],[22,0,14,1.2]
].map(p=>Object.freeze(p)));
const TAU=Math.PI*2;
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function mineralMaps(){
  const size=256,random=rng(461103),data=new Uint8Array(size*size*4),norm=new Uint8Array(size*size*4),height=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=y*size+x,grain=random(),cloud=.046*Math.sin(x*.083+y*.037)+.039*Math.cos(y*.11-x*.027),fleck=grain>.955?.11:grain<.065?-.12:0;
    const f=.80+cloud+fleck+(grain-.5)*.07;height[i]=.5+fleck*.9+(grain-.5)*.18;
    data[i*4]=Math.round(255*f);data[i*4+1]=Math.round(252*f);data[i*4+2]=Math.round(241*f);data[i*4+3]=255;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,dx=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size],dy=height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x],v=new T.Vector3(-dx*.75,-dy*.75,1).normalize();
    norm[i]=Math.round((v.x*.5+.5)*255);norm[i+1]=Math.round((v.y*.5+.5)*255);norm[i+2]=Math.round((v.z*.5+.5)*255);norm[i+3]=255;
  }
  const make=(d,srgb)=>{const t=new T.DataTexture(d,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=4;if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
  return{map:make(data,true),normal:make(norm,false)};
}
function profile(points,segments=8){const g=new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),segments);g.rotateY(Math.PI/segments);return g;}
function capHeight(x,z){const r=Math.max(Math.abs(x),Math.abs(z))/.655,u=Math.min(1,r),corner=Math.pow(Math.abs(x*z)/(.655*.655),5);return 2.525+.395*Math.pow(1-u,1.38)+.080*corner-.017*Math.sin(u*Math.PI);}
function curvedCap(){
  const p=[],uv=[],ids=[],n=32,half=.655,side=(n+1)*(n+1);
  for(let layer=0;layer<2;layer++)for(let z=0;z<=n;z++)for(let x=0;x<=n;x++){
    const xx=(x/n*2-1)*half,zz=(z/n*2-1)*half,yy=capHeight(xx,zz)-(layer?.085:0);
    p.push(xx,yy,zz);uv.push(xx+.5,zz+.5);
  }
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    const a=z*(n+1)+x,b=a+1,c=a+n+1,d=c+1;ids.push(a,c,b,b,c,d,a+side,b+side,c+side,b+side,d+side,c+side);
  }
  const edges=[Array.from({length:n+1},(_,i)=>i),Array.from({length:n+1},(_,i)=>i*(n+1)+n),Array.from({length:n+1},(_,i)=>n*(n+1)+n-i),Array.from({length:n+1},(_,i)=>(n-i)*(n+1))];
  for(const e of edges)for(let j=0;j<n;j++){const a=e[j],b=e[j+1];ids.push(a,b,a+side,b,b+side,a+side);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
// Attribute-only charts for the already non-indexed closed stone cap. Geometry,
// normals, colours and all non-cap parts retain their original bytes. The top
// and underside use one X/Z chart each; the rim uses a continuous eight-repeat
// perimeter phase with the same 1.5-unit/metre vertical scale as the stone maps.
function chartStoneCap(g){
  const p=g.attributes.position,uv=g.attributes.uv,half=.655,eps=2e-6;
  if(g.index||p.count!==4352*3)throw Error('Unexpected original stone-cap topology');
  for(let i=0;i<p.count;i+=3){
    const ids=[i,i+1,i+2],top=ids.every(k=>Math.abs(p.getY(k)-capHeight(p.getX(k),p.getZ(k)))<eps),bottom=ids.every(k=>Math.abs(p.getY(k)-(capHeight(p.getX(k),p.getZ(k))-.085))<eps);
    if(top||bottom){for(const k of ids)uv.setXY(k,p.getX(k)*1.5,p.getZ(k)*1.5);continue;}
    let side=-1;
    if(ids.every(k=>Math.abs(p.getZ(k)+half)<eps))side=0;
    else if(ids.every(k=>Math.abs(p.getX(k)-half)<eps))side=1;
    else if(ids.every(k=>Math.abs(p.getZ(k)-half)<eps))side=2;
    else if(ids.every(k=>Math.abs(p.getX(k)+half)<eps))side=3;
    if(side<0)throw Error('Unclassified original stone-cap rim triangle');
    for(const k of ids){const x=p.getX(k),z=p.getZ(k),along=side===0?x+half:side===1?2*half+z+half:side===2?4*half+half-x:6*half+half-z;const phase=along<eps?0:along>8*half-eps?8:along/half;uv.setXY(k,phase,p.getY(k)*1.5);}
  }
  return g;
}
// Closed stone mounting boss under the existing cap, confined to the original
// cap envelope. Its top follows actual emitted lower-cap grid vertices +3 mm;
// its .655-square bottom seats 5 mm into the existing upper frame's flat top.
// This is an authored physical join, not a dimension recovered from the photo.
function capBearing(cap){
  const source=cap.attributes.position,n=32,row=n+1,layer=row*row,lo=8,hi=24,m=hi-lo+1,p=[],ids=[];
  if(source.count!==layer*2)throw Error('Unexpected original cap vertex grid');
  for(let z=lo;z<=hi;z++)for(let x=lo;x<=hi;x++){const k=layer+z*row+x;p.push(source.getX(k),source.getY(k)+.003,source.getZ(k));}
  for(let z=0;z<m-1;z++)for(let x=0;x<m-1;x++){const a=z*m+x,b=a+1,c=a+m,d=c+1;ids.push(a,c,b,b,c,d);}
  const edge=[...Array.from({length:m-1},(_,i)=>i),...Array.from({length:m-1},(_,i)=>i*m+m-1),...Array.from({length:m-1},(_,i)=>(m-1)*m+m-1-i),...Array.from({length:m-1},(_,i)=>(m-1-i)*m)],base=p.length/3;
  for(const k of edge)p.push(p[k*3],2.535,p[k*3+2]);const centre=p.length/3;p.push(0,2.535,0);
  for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length,a=edge[i],b=edge[j],aa=base+i,bb=base+j;ids.push(a,b,aa,b,bb,aa,centre,aa,bb);}
  const indexed=new T.BufferGeometry();indexed.setAttribute('position',new T.Float32BufferAttribute(p,3));indexed.setIndex(ids);const g=indexed.toNonIndexed();indexed.dispose();g.computeVertexNormals();return g;
}
function surfaceMoss(g,seed){
 const d=buildBoulderMossData({positions:g.attributes.position.array,normals:g.attributes.normal.array,indices:g.index?.array??Uint32Array.from({length:g.attributes.position.count},(_,i)=>i),scale:[1,1,1],seed},{seed,offset:.0025}),out=new T.BufferGeometry();
 out.setAttribute('position',new T.BufferAttribute(d.positions,3));out.setAttribute('normal',new T.BufferAttribute(d.normals,3));out.setAttribute('uv',new T.BufferAttribute(d.uvs,2));out.setAttribute('color',new T.BufferAttribute(d.colors,3));return out;
}
function bakeStone(g,seed){
  const h=g.index?g.toNonIndexed():g.clone(),p=h.attributes.position,n=h.attributes.normal,uv=[],colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(ny>=nx&&ny>=nz)uv.push(x*1.5,z*1.5);else if(nx>=nz)uv.push(z*1.5,y*1.5);else uv.push(x*1.5,y*1.5);
    const m=.90+.044*Math.sin(x*17+y*13+seed)*Math.cos(z*19-y*7)+.025*Math.sin(y*49+z*23),base=y<.35?.88:1;colors.push(m*base,m*base,m*base);
  }
  h.setAttribute('uv',new T.Float32BufferAttribute(uv,2));h.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.dispose();return h;
}

export function buildRestorationStoneLanterns({materials:source={},options={}}={}){
  const started=performance.now(),anchors=options.anchors??RESTORATION_STONE_LANTERN_ANCHORS;
  if(!Array.isArray(anchors)||anchors.some(p=>p.length!==4||!p.every(Number.isFinite)||p[3]<=0))throw Error('Stone lantern anchors must be [x,y,z,positiveScale].');
  const group=new T.Group();group.name='reference4-reauthored-carved-stone-lanterns';
  const maps=mineralMaps(),stone=new T.MeshStandardMaterial({name:'weathered-carved-stone-lantern',color:'#a5a392',roughness:.87,metalness:0,map:maps.map,normalMap:maps.normal,normalScale:new T.Vector2(.72,.72),vertexColors:true});
  const paper=source.paper??new T.MeshStandardMaterial({name:'unlit-lantern-paper-fallback',color:'#d9c797',roughness:.78,side:T.DoubleSide});
  const lattice=new T.MeshStandardMaterial({name:'dark-aged-lantern-window-grille',color:'#424337',roughness:.89,metalness:0});
  const shadow=new T.MeshStandardMaterial({name:'stone-lantern-recessed-interior',color:'#252b26',roughness:1});
  const moss=new T.MeshStandardMaterial({name:'stone-lantern-conforming-moss',color:'#657044',roughness:.99,vertexColors:true,map:maps.map});
  const materials={stone,paper,lattice,shadow,moss},lanterns=[],geometries=[],emitterRecords=[];
  function addMerged(parts,material,parent,name){
    if(!parts.length)return;const geometry=mergeGeometries(parts),mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.castShadow=material!==paper;mesh.receiveShadow=material!==paper;parent.add(mesh);geometries.push(geometry);parts.forEach(g=>g.dispose());return mesh;
  }
  for(let index=0;index<anchors.length;index++){
    const [x,y,z,s]=anchors[index],body=new T.Group();body.name=`existing-stone-lantern-${index}`;body.position.set(x,y,z);body.scale.setScalar(s);group.add(body);lanterns.push(body);
    const stoneParts=[],windowParts=[],barParts=[],shadowParts=[],mossParts=[],seed=37+index*11;
    const put=(g,parts,px=0,py=0,pz=0,yaw=0)=>{g.rotateY(yaw);g.translate(px,py,pz);parts.push(g);};
    const box=(w,h,d,parts,px,py,pz,yaw=0,bevel=.009)=>put(bevel?new RoundedBoxGeometry(w,h,d,2,bevel):new T.BoxGeometry(w,h,d),parts,px,py,pz,yaw);
    // A low octagonal three-step base and softly chamfered shaft, not stacked cubes.
    stoneParts.push(profile([[0,0],[.53,0],[.58,.045],[.58,.145],[.53,.195],[.49,.195],[.49,.30],[.44,.35],[.385,.385],[.35,.385],[.35,.44],[.292,.49],[.290,1.52],[.33,1.56],[.35,1.61],[.35,1.69],[.42,1.72],[.43,1.91],[.37,1.94],[0,1.94]],8));
    // Newly reauthored square carved window frieze and substantial shaft.
    box(.90,.255,.90,stoneParts,0,1.795,0,0,.020);
    for(let face=0;face<4;face++){const a=face*Math.PI/2,parts=[];box(.84,.035,.030,parts,0,1.891,.461,0,.005);box(.84,.035,.030,parts,0,1.698,.461,0,.005);for(const x of[-.40,.40])box(.035,.18,.030,parts,x,1.795,.461,0,.005);for(const x of[-.24,0,.24]){const crest=flowerCrest();crest.scale(.080,.080,.040);crest.translate(x,1.795,.455);parts.push(crest);}for(const g of parts){g.rotateY(a);stoneParts.push(g);}}
    // Carved shallow vine relief follows each existing shaft face. No golden scrolls.
    for(let face=0;face<8;face++){
      const a=face*TAU/8,rad=.290*Math.cos(Math.PI/8)+.004,curve=new T.CatmullRomCurve3(Array.from({length:13},(_,i)=>{const t=i/12;return new T.Vector3(.061*Math.sin(t*TAU*1.2),.57+t*.87,rad+.003);}));
      put(new T.TubeGeometry(curve,36,.010,7,false),stoneParts,0,0,0,a);
      for(let k=0;k<4;k++){
        const t=.12+k*.22,cy=.57+t*.87,cx=.061*Math.sin(t*TAU*1.2),sign=k%2?1:-1;
        const leaf=new T.Shape();leaf.moveTo(cx,cy);leaf.bezierCurveTo(cx+sign*.083,cy+.024,cx+sign*.083,cy+.106,cx+sign*.020,cy+.145);leaf.bezierCurveTo(cx-sign*.004,cy+.067,cx+sign*.012,cy+.025,cx,cy);
        const g=new T.ExtrudeGeometry(leaf,{depth:.012,steps:1,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:5});g.translate(0,0,rad);put(g,stoneParts,0,0,0,a);
      }
      const crest=flowerCrest();crest.scale(.074,.065,.027);crest.translate(0,.247,.49*Math.cos(Math.PI/8)+.003);put(crest,stoneParts,0,0,0,a);
    }
    // Four stone corner posts frame actual inset window openings; light is borrowed
    // from the EXISTING world's paper material so day/night controls remain valid.
    box(.725,.105,.725,stoneParts,0,1.965,0);box(.735,.10,.735,stoneParts,0,2.49,0);
    for(const xx of[-.308,.308])for(const zz of[-.308,.308])box(.106,.49,.106,stoneParts,xx,2.225,zz);
    // The old .43 x .48 x .43 black box enclosed the light source. Replace it
    // with actual shallow floor/ceiling liners and four narrow inner corners.
    // The centre and all four window apertures are now one connected cavity.
    box(.50,.014,.50,shadowParts,0,2.022,0,0,0);
    box(.50,.014,.50,shadowParts,0,2.433,0,0,0);
    for(const xx of[-.252,.252])for(const zz of[-.252,.252])box(.022,.404,.022,shadowParts,xx,2.228,zz,0,0);
    for(let face=0;face<4;face++){
      const a=face*Math.PI/2,faceParts=[],bars=[];
      box(.484,.431,.012,faceParts,0,2.228,.310,0,0);
      for(let k=-2;k<=2;k++)box(.013,.437,.020,bars,k*.081,2.228,.332,0,.002);
      for(let k=-1;k<=1;k++)box(.493,.012,.020,bars,0,2.228+k*.125,.334,0,.002);
      for(const g of faceParts){g.rotateY(a);windowParts.push(g);}for(const g of bars){g.rotateY(a);barParts.push(g);}
    }
    // Curved hipped stone cap with an intact thick rim, plus small raised hips.
    const roof=curvedCap();mossParts.push(surfaceMoss(roof,seed));stoneParts.push(roof);
    for(let q=0;q<4;q++){
      const a=Math.PI/4+q*Math.PI/2,pts=[];for(let i=0;i<=14;i++){const r=.06+i/14*.85,xx=Math.sin(a)*r,zz=Math.cos(a)*r;pts.push(new T.Vector3(xx,capHeight(xx,zz)+.011,zz));}
      stoneParts.push(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.014,6,false));
    }
    stoneParts.push(profile([[0,2.91],[.105,2.91],[.148,2.934],[.171,2.966],[.174,2.998],[.151,3.031],[.105,3.052],[.084,3.065],[.122,3.092],[.143,3.127],[.137,3.163],[.112,3.193],[.071,3.217],[.050,3.263],[.015,3.335],[0,3.34]],24));
    // Moss is extracted from the upper faces, never represented by floating balls.
    for(const g of stoneParts.slice(0,1))mossParts.push(surfaceMoss(g,seed+3));
    stoneParts.push(capBearing(roof));
    const baked=stoneParts.map(g=>{const baked=bakeStone(g,seed);return g===roof?chartStoneCap(baked):baked;});
    addMerged(baked,stone,body,'carved-shaft-window-stone-and-curved-cap');const paperMesh=addMerged(windowParts,paper,body,'existing-controlled-warm-paper-windows');addMerged(barParts,lattice,body,'fine-recessed-window-grilles');addMerged(shadowParts,shadow,body,'dark-interior-with-open-window-faces');addMerged(mossParts.filter(g=>g.attributes.position.count),moss,body,'surface-following-broken-moss');
    emitterRecords.push({index,object:body,localPosition:new T.Vector3(0,2.228,0),paperMesh,material:paper});
  }
  group.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(group),stats={version:'stone-lantern-ref4-exterior-v6-reauthored-carved-form',lanterns:anchors.length,meshes:0,triangles:0,buildMilliseconds:performance.now()-started};group.traverse(o=>{if(o.isMesh){stats.meshes++;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  function getEmitterMetadata(){
    group.updateMatrixWorld(true);
    return emitterRecords.map(record=>{
      const body=record.object,scale=body.getWorldScale(new T.Vector3()),worldPosition=body.localToWorld(record.localPosition.clone());
      const windows=Array.from({length:4},(_,face)=>{const a=face*Math.PI/2,localCentre=new T.Vector3(Math.sin(a)*.310,2.228,Math.cos(a)*.310),localNormal=new T.Vector3(Math.sin(a),0,Math.cos(a));return{face,localCentre,localNormal,worldCenter:body.localToWorld(localCentre.clone()),worldNormal:localNormal.clone().transformDirection(body.matrixWorld),worldUp:new T.Vector3(0,1,0).transformDirection(body.matrixWorld),worldWidth:.484*Math.abs(scale.x),worldHeight:.431*Math.abs(scale.y),paperMesh:record.paperMesh};});
      return{...record,worldCenter:worldPosition,worldPosition,worldScale:scale,windows,sourceCount:1};
    });
  }
  return{group,lanterns,materials,stats,bounds,emitters:getEmitterMetadata(),getEmitterMetadata,
    placement:{anchors:anchors.map(p=>[...p]),unitHeight:3.34,windowCentreY:2.228,capWidth:1.31,worldCoordinates:true,borrowedPaperMaterial:!!source.paper,shaftCircumradius:.290,baseCircumradius:.58,friezeWidth:.90},
    integrationStatus:'New photo4 exterior carved lantern form built from recovered 16e4 asset, not recovered c8a1 bytes. Explicit anchors. Paper aperture and real emitter unchanged; no new lights.',
    dispose(){for(const g of geometries)g.dispose();for(const m of[stone,lattice,shadow,moss])m.dispose();if(!source.paper)paper.dispose();maps.map.dispose();maps.normal.dispose();group.removeFromParent();}
  };
}
