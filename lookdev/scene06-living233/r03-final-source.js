import * as T from 'three';

// A single botanical construction replaces the superposed legacy bouquets.
// All locations remain the actual retained vase mouths, in altar metres.
// The flowers are inferred white lily/plum forms; no species identification
// or measured historical restoration is asserted from the reference image.
const TAU=Math.PI*2;
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};

function closeEdges(indices,rows,cols,stride){
 const pair=(a,b)=>indices.push(a,b,b+stride,a,b+stride,a+stride);
 for(let i=0;i<cols;i++){pair(i+1,i);pair(rows*(cols+1)+i,rows*(cols+1)+i+1);}
 for(let j=0;j<rows;j++){pair(j*(cols+1),(j+1)*(cols+1));pair((j+1)*(cols+1)+cols,j*(cols+1)+cols);}
}

function finishOrganicNormals(g){
 const p=g.attributes.position,n=g.attributes.normal,index=g.index,attributes=Object.fromEntries(Object.entries(g.attributes).map(([key,a])=>[key,Array.from(a.array)])),indices=Array.from(index.array);
 let splitCorners=0;
 for(let k=0;k<indices.length;k+=3){
  const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)],a=new T.Vector3().fromBufferAttribute(p,ids[0]),b=new T.Vector3().fromBufferAttribute(p,ids[1]),c=new T.Vector3().fromBufferAttribute(p,ids[2]);
  const normal=b.sub(a).cross(c.sub(a));if(normal.lengthSq()<1e-22)continue;normal.normalize();
  for(let j=0;j<3;j++){
   const id=ids[j],smooth=new T.Vector3().fromBufferAttribute(n,id);if(smooth.dot(normal)>1e-6)continue;
   const added=attributes.position.length/3;
   for(const [key,attribute]of Object.entries(g.attributes))for(let v=0;v<attribute.itemSize;v++)attributes[key].push(key==='normal'?normal.getComponent(v):attribute.array[id*attribute.itemSize+v]);
   indices[k+j]=added;splitCorners++;
  }
 }
 for(const [key,array]of Object.entries(attributes))g.setAttribute(key,new T.Float32BufferAttribute(array,g.attributes[key].itemSize));
 g.setIndex(indices);g.userData.finalSurfaceNormalsOutward=true;g.userData.organicCreaseCorners233=splitCorners;
 // In particular retain colour for every new corner. The older general
 // carving normal repair only knows position/normal/UV, so must not resplit
 // these coloured organs afterward.
}

// Offset each skin along the true meridian normal, including the recurved tip.
// A fixed-depth extrusion would cross itself at that turn.
function thinOrgan(kind,variant){
 const rows=28,cols=12,stride=(rows+1)*(cols+1),p=[],uv=[],indices=[],colors=[];
 const leaf=kind==='leaf',length=leaf?1:.154;
 const center=t=>leaf?new T.Vector3(.027*Math.sin(Math.PI*t)*(variant-1),length*t,.095*Math.sin(Math.PI*t)+.12*t*t):new T.Vector3(.005*Math.sin(Math.PI*t)*(variant-1),length*(t-.19*t*t*t),.016+.10*t-.026*t*t-.047*t*t*t*t);
 const color=new T.Color();
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,wave=Math.sin(Math.PI*t),c=center(t);
  const tangent=center(Math.min(1,t+.0001)).sub(center(Math.max(0,t-.0001))).normalize();
  const normal=new T.Vector3(0,-tangent.z,tangent.y).normalize();
  const width=leaf?(.00035+.155*Math.pow(Math.max(0,wave),.80)*(1-.25*t)):(.00022+.039*Math.pow(Math.max(0,wave),.70));
  const fold=(leaf?.021:.0068)*Math.pow(Math.max(0,1-u*u),.7)*wave;
  const ripple=(leaf?.0012:.0010)*Math.sin(t*(leaf?29:21)+u*4+variant)*wave*Math.pow(Math.abs(u),4);
  const vein=(leaf?.0017:.0009)*Math.exp(-u*u/(leaf?.015:.045))*wave;
  const thickness=leaf?.00055:.00034;
  const twist=(variant-1)*(leaf?.07:.10)*t*t;
  const depth=fold+ripple+vein+(side===0?1:-1)*thickness;
  const point=c.add(new T.Vector3(u*width,0,0).applyAxisAngle(tangent,twist)).addScaledVector(normal,depth);
  p.push(...point.toArray());uv.push(i/cols,t);
  if(leaf){
   const mid=Math.exp(-u*u/.025),edge=Math.pow(Math.abs(u),6),along=.91+.09*Math.sin(t*8+variant);
   color.setRGB((.029+.009*mid+.009*edge)*along,(.075+.024*mid+.011*edge)*along,(.019+.004*edge)*along);
  }else{
   const throat=Math.exp(-Math.pow(t/.25,2)),veins=.025*Math.cos(u*23+t*3)*wave;
   color.setRGB(.78+.06*t+veins,.73+.095*t-.14*throat+veins,.58+.20*t-.23*throat+veins);
  }
  colors.push(color.r,color.g,color.b);
  if(j<rows&&i<cols){const a=side*stride+j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;side===0?indices.push(a,b,c,b,d,c):indices.push(a,c,b,b,c,d);}
 }
 closeEdges(indices,rows,cols,stride);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(p.length),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 finishOrganicNormals(g);
 g.userData.living233={kind,variant,closedTwoSkinOrgan:true,skinOffset:'meridian normal',units:'metres before declared instance scaling',referenceImagePixelsUsed:false};return g;
}

function installMaterials(b){
 b.materials.livingLeaf233=new T.MeshPhysicalMaterial({name:'scene06-living233-linear-green-leaf',color:0xffffff,vertexColors:true,roughness:.58,metalness:0,clearcoat:.055,clearcoatRoughness:.5});
 b.materials.livingPetal233=new T.MeshStandardMaterial({name:'scene06-living233-ivory-tepal-with-pale-throat',color:0xffffff,vertexColors:true,roughness:.63,metalness:0});
 b.materials.livingStem233=new T.MeshStandardMaterial({name:'scene06-living233-green-cut-stalk',color:'#4f5e2b',roughness:.78,metalness:0});
 b.materials.livingTwig233=new T.MeshStandardMaterial({name:'scene06-living233-dormant-brown-wood',color:'#584632',roughness:.92,metalness:0});
 b.materials.livingPollen233=new T.MeshStandardMaterial({name:'scene06-living233-brown-anther',color:'#8b6938',roughness:.90,metalness:0});
 b.materials.livingBud233=new T.MeshStandardMaterial({name:'scene06-living233-ivory-unopened-bud',color:'#d7d9aa',roughness:.75,metalness:0});
}

function stalk(b,key,points,radius,mat='livingStem233'){
 b.naturalCurve('living233-'+key,points,radius,mat,28);
 return new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
}

function placeLeaf(b,leaf,at,azimuth,length,width,lean,twist=0){
 b.withTransform(...at,1,()=>b.add(leaf,'livingLeaf233',0,0,0,width,length,length,lean,0,twist),azimuth);
}

function withPose(b,point,scale,rotation,fn){
 const matrix=new T.Matrix4().compose(new T.Vector3(...point),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(scale,scale,scale));
 b.stack.push(b.stack.at(-1).clone().multiply(matrix));
 try{fn();}finally{b.stack.pop();}
}

function lily(b,petals,key,point,scale,tilt,azimuth,random,counts){
 withPose(b,point,scale,[.34+.33*Math.sin(key*1.71)+tilt,azimuth,.22*Math.sin(key)],()=>{
  // Six distinct overlapping tepals in two whorls, a real calyx and six
  // free filaments; the flower is never a five-point camera-facing glyph.
  b.withTransform(0,0,0,1,()=>{
   b.ball(0,.004,0,.012,.025,.012,'livingStem233');
   for(let k=0;k<6;k++){
    const a=k*TAU/6,inner=k%2===1,lean=.88+(inner?-.14:.10)+.15*(random()-.5);
    // The radial yaw owns a parent transform. Euler XYZ(rx, ry, rz) would
    // yaw the unbent tepal first and then tip the entire whorl toward +Z,
    // collapsing all six petals into a common cup instead of opening them.
    b.withTransform(0,0,0,1,()=>b.add(petals[((k+key)%3+3)%3],'livingPetal233',0,inner?.003:0,0,inner?.93:1,1,1,lean,0,.025*Math.sin(k+key)),a);
    const reach=.020+(k%2)*.008,tip=[Math.sin(a)*reach,.083+.013*Math.sin(k+key),Math.cos(a)*reach];
    stalk(b,'filament-'+key+'-'+k,[[0,.013,0],[tip[0]*.4,.052,tip[2]*.4],tip],.0008,'livingBud233');
    b.ball(...tip,.0037,.0023,.0071,'livingPollen233');
   }
   stalk(b,'style-'+key,[[0,.014,0],[.002,.061,.002],[.004,.101,.003]],.0014,'livingBud233');
   b.ball(.004,.101,.003,.003,.002,.003,'livingBud233');
  });
 });
 counts.flowers++;
}

// Twig blossom: five compact, individually cupped petals around a recessed
// throat, held on a small green calyx. Each blossom gets a fixed 3D pose.
function blossom(b,petals,point,scale,pose,counts){
 withPose(b,point,scale,[.65+.16*Math.sin(pose),pose,.20*Math.sin(pose*2)],()=>{
  b.ball(0,0,0,.010,.010,.010,'livingStem233');
  for(let k=0;k<5;k++)b.withTransform(0,0,0,1,()=>b.add(petals[k%3],'livingPetal233',0,0,0,.50,.43,.60,1.02,0,.06*Math.sin(k)),k*TAU/5+pose);
  for(let k=0;k<7;k++){
   const a=k*TAU/7,tip=[Math.sin(a)*.013,.025+(k%2)*.006,Math.cos(a)*.013];
   stalk(b,'blossom-filament-'+counts.flowers+'-'+k,[[0,.002,0],tip],.0005,'livingBud233');b.ball(...tip,.0018,.0018,.0018,'livingPollen233');
  }
 });
 counts.flowers++;
}

function bouquet(b,leaf,petals,origin,kind,side,counts){
 const random=rng(233610+side*61+(kind==='floor'?0:kind==='upper'?190:380));
 const floor=kind==='floor',upper=kind==='upper',rootY=floor?.984:upper?.407:.280;
 const rise=floor?1.10:upper?.46:.43,spread=floor?.44:upper?.23:.20;
 b.withTransform(...origin,1,()=>{
  // Cut stems enter the same retained mouth. Their leaves attach at true
  // spline parameters, with graded length and narrow petioles.
  const n=floor?9:upper?5:5;
  for(let k=0;k<n;k++){
   const a=(k*2.399963+side*.27),height=rise*(.62+.38*random()),r=spread*(.25+.75*random());
   const end=[Math.sin(a)*r,rootY+height,Math.cos(a)*r*.52];
   const curve=stalk(b,kind+'-'+side+'-'+k,[[0,rootY-.015,0],[end[0]*.16,rootY+height*.25,end[2]*.2],[end[0]*.66,rootY+height*.73,end[2]*.72],end],floor?.0045:.0031);
   for(let j=0;j<(floor?3:2);j++){
    const t=.08+j*.18+.08*random(),p=curve.getPoint(t),theta=a+(j%2?1:-1)*1.3,length=(floor?.39:upper?.25:.19)*(1-j*.17)*(.70+.45*random());
    const tip=[p.x+Math.sin(theta)*.015,p.y+.012,p.z+Math.cos(theta)*.015];
    stalk(b,'petiole-'+kind+'-'+side+'-'+k+'-'+j,[p.toArray(),tip],floor?.0018:.0011);
    placeLeaf(b,leaf[(k+j)%3],tip,theta,length,floor?.47:.34,.69+.40*random(),(random()-.5)*.12);counts.leaves++;
   }
   if(k%4===3){
    const bud=.75+.25*random();b.ball(end[0],end[1]+.032*bud,end[2],.014*bud,.044*bud,.014*bud,'livingBud233');counts.buds++;
   }else lily(b,petals,(floor?0:upper?100:200)+k+side*13,end,(floor?.95:upper?.67:.66)*(.85+.25*random()),(random()-.5)*.28,a,random,counts);
  }
  // Broad basal leaves curve away at different elevations; all have a real
  // stalk at the vase mouth instead of intersecting as a radial flat fan.
  for(let k=0;k<(floor?6:upper?4:4);k++){
   const a=k*2.399963+side*.71,p=[.006*Math.sin(a),rootY+.005,.006*Math.cos(a)];
   const length=(floor?.49:upper?.32:.23)*(.73+.27*random());
   placeLeaf(b,leaf[k%3],p,a,length,floor?.52:.43,.90+.62*random(),(random()-.5)*.28);counts.leaves++;
  }
  if(floor){
   const direction=side<0?1:-1;
   const trunk=[[0,rootY-.01,0],[-.035*direction,1.26,-.03],[-.17*direction,1.61,-.03],[-.25*direction,1.96,-.02],[-.31*direction,2.30,0]];
   const curve=stalk(b,'woody-trunk-'+side,trunk,.0065,'livingTwig233');
   for(let k=0;k<6;k++){
    const t=.28+k*.105,p=curve.getPoint(t),d=k%2?1:-1;
    const end=[p.x+d*(.22+.07*random()),p.y+.16+.08*random(),p.z+(random()-.5)*.18];
    const branch=stalk(b,'woody-branch-'+side+'-'+k,[p.toArray(),[p.x+(end[0]-p.x)*.56,p.y+.11,p.z],end],.0026,'livingTwig233');
    for(let j=0;j<3;j++){
     const q=branch.getPoint(.42+j*.25),az=j*2.3+k*.8,tip=[q.x+Math.sin(az)*.025,q.y+.025,q.z+Math.cos(az)*.025];
     stalk(b,'twig-pedicel-'+side+'-'+k+'-'+j,[q.toArray(),tip],.0010,'livingTwig233');
     if((k+j)%4===0){b.ball(tip[0],tip[1]+.009,tip[2],.007,.012,.007,'livingBud233');counts.buds++;}
     else blossom(b,petals,tip,.72+.24*random(),az,counts);
    }
   }
  }
 });
}

export function buildLivingOfferings233(b,layout){
 installMaterials(b);
 const leaf=[0,1,2].map(v=>b.geometry('living233-closed-lance-leaf-'+v,()=>thinOrgan('leaf',v)));
 const petals=[0,1,2].map(v=>b.geometry('living233-closed-recurved-tepal-'+v,()=>thinOrgan('petal',v)));
 const counts={flowers:0,leaves:0,buds:0};
 for(const side of[-1,1]){
  bouquet(b,leaf,petals,[side*layout.floorVaseX,layout.floorContactY,1.90],'floor',side,counts);
  bouquet(b,leaf,petals,[side*layout.upperVaseX,layout.upperVaseY,layout.upperVaseZ],'upper',side,counts);
  bouquet(b,leaf,petals,[side*.77,1.8295,1.168],'front',side,counts);
 }
 b.root.userData.livingOfferings233={revision:'r03',...counts,oneBotanicalSystem:true,retainedVessels:true,legacyFlowerGeneratorsInvoked:false,petals:'Closed open six-tepal flowers and separately cupped twig blossoms; each tepal bends in its own radial parent frame, with spline-rooted stems, calyces, styles, filaments and anthers',surface:'Ordinary opaque nonemissive PBR, linear vertex colour, actual two-skin leaf/petal thickness',referenceImagePixelsUsed:false,photographicAccepted:false};
}
