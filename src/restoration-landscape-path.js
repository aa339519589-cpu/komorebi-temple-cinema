import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Independent reference4 / reference10 candidate.
 * Does not import, mutate or replace the locked landscape-ref-v1.3 module.
 * No light, camera, reflection target or shader hook is installed here.
 */
const TAU = Math.PI * 2;
const rng = seed => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const clamp = T.MathUtils.clamp;
function hash(x,y,seed=0){const a=Math.sin(x*127.1+y*311.7+seed*19.17)*43758.5453123;return a-Math.floor(a);}
function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,a=u*u*(3-2*u),b=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy,seed),hash(ix+1,iy,seed),a),T.MathUtils.lerp(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),a),b);}
function stoneMaps(seed,size=192){
  const c=new Uint8Array(size*size*4),r=new Uint8Array(size*size*4),n=new Uint8Array(size*size*4),heights=new Float32Array(size*size);
  const h=(x,y)=>noise(x*13,y*13,seed)*.55+noise(x*47,y*47,seed+1)*.32+noise(x*131,y*131,seed+2)*.13;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/(size-1),v=y/(size-1),i=(y*size+x)*4;
    const broad=noise(u*3.5,v*3.5,seed+7),mineral=noise(u*69,v*69,seed+3),fleck=hash(x,y,seed),grain=h(u,v);
    const limestone=T.MathUtils.smoothstep(mineral,.67,.88),dark=1-.11*T.MathUtils.smoothstep(broad,.57,.76);
    const crackDistance=Math.abs((u-.5)*.72+(v-.5)*.44+.017*Math.sin(v*17+seed)-.11);
    const crack=seed%5===1?(1-T.MathUtils.smoothstep(crackDistance,.0018,.0045))*.45:0;
    const brightness=(.83+.24*grain+.10*(fleck-.5)+limestone*.10)*dark*(1-crack);
    c[i]=clamp(218*brightness,0,255);c[i+1]=clamp(220*brightness,0,255);c[i+2]=clamp(211*brightness,0,255);c[i+3]=255;
    const rough=153+90*noise(u*6,v*6,seed+29)+12*grain;
    r[i]=r[i+1]=r[i+2]=clamp(rough,0,255);r[i+3]=255;
    heights[y*size+x]=grain;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,x0=Math.max(0,x-1),x1=Math.min(size-1,x+1),y0=Math.max(0,y-1),y1=Math.min(size-1,y+1);
    const dx=(heights[y*size+x1]-heights[y*size+x0])*.30,dy=(heights[y1*size+x]-heights[y0*size+x])*.30;
    const normal=new T.Vector3(-dx,-dy,1).normalize();n[i]=Math.round((normal.x*.5+.5)*255);n[i+1]=Math.round((normal.y*.5+.5)*255);n[i+2]=Math.round((normal.z*.5+.5)*255);n[i+3]=255;
  }
  function tex(bytes,srgb=false){const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
  return {map:tex(c,true),roughnessMap:tex(r),normalMap:tex(n)};
}
function slabGeometry(width,depth,thickness,seed){
  const random=rng(seed),rand=(a,b)=>a+(b-a)*random(),hw=width*.5,hd=depth*.5;
  const cut=()=>rand(.012,.035);
  const boundary=[[-hw+cut(),-hd],[-hw*.55,-hd+rand(-.003,.004)],[hw*.32,-hd+rand(-.004,.004)],[hw-cut(),-hd],
    [hw,-hd+cut()],[hw+rand(-.003,.003),hd*.17],[hw,hd-cut()],[hw-cut(),hd],
    [hw*.31,hd+rand(-.003,.003)],[-hw*.42,hd+rand(-.003,.003)],[-hw+cut(),hd],[-hw,hd-cut()],
    [-hw+rand(-.003,.003),-hd*.14],[-hw,-hd+cut()]];
  const p=[0,-.0021,0],uv=[.5,.5],colors=[.96,.97,.95],ids=[],rings=7,count=boundary.length;
  for(let j=1;j<=rings;j++){
    const t=j/rings;
    for(let k=0;k<count;k++){
      const [bx,bz]=boundary[k],x=bx*t,z=bz*t;
      // A few millimetres of worn dish and edge rounding, not cobblestone bumps.
      const y=-.0034*(1-t*t)+.0011*Math.sin(x*7+seed)*Math.cos(z*8-seed)-.0018*Math.pow(t,10);
      p.push(x,y,z);uv.push(x/width+.5,z/depth+.5);
      const f=.94+.065*t+.035*Math.sin(x*13+z*17+seed);colors.push(f,f,f*.985);
      const index=1+(j-1)*count+k,next=1+(j-1)*count+(k+1)%count;
      if(j===1)ids.push(0,next,index);
      else{const prev=index-count,pnext=next-count;ids.push(prev,next,index,prev,pnext,next);}
    }
  }
  // Separate side vertices keep the chipped vertical arris sharp.
  for(let k=0;k<count;k++){
    const a=boundary[k],b=boundary[(k+1)%count],start=p.length/3;
    p.push(a[0],-.002,a[1],b[0],-.002,b[1],a[0],-thickness,a[1],b[0],-thickness,b[1]);
    uv.push(0,1,1,1,0,0,1,0);colors.push(.84,.87,.82,.84,.87,.82,.71,.74,.69,.71,.74,.69);ids.push(start,start+2,start+1,start+1,start+2,start+3);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(ids);g.computeVertexNormals();return g;
}
function fallenMaple(){
  const shape=new T.Shape(),rim=[[0,-.45],[-.10,-.23],[-.28,-.25],[-.21,-.07],[-.46,.02],[-.27,.15],[-.32,.43],[-.10,.26],[0,.57],[.10,.26],[.32,.43],[.27,.15],[.46,.02],[.21,-.07],[.28,-.25],[.10,-.23]];
  rim.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const g=new T.ShapeGeometry(shape,2);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,.026*Math.sin(p.getX(i)*5+p.getZ(i)*8));g.computeVertexNormals();return g;
}
function puddleShape(x,z,rx,rz,random){
  const sh=new T.Shape(),n=36,phase=random()*TAU;
  for(let i=0;i<=n;i++){const a=i/n*TAU,rad=.89+.065*Math.sin(a*3+phase)+.045*Math.sin(a*7-phase);const px=x+Math.cos(a)*rx*rad,pz=z+Math.sin(a)*rz*rad;i?sh.lineTo(px,-pz):sh.moveTo(px,-pz);}sh.closePath();return sh;
}

export function buildRestorationWetPath({options={}}={}){
  const start=performance.now(),variant=options.variant??'procession',rain=variant==='rain-threshold';
  const width=options.width??5.02,length=options.length??24.44,origin=options.origin??[6,0,30.22],yaw=options.yaw??0,top=options.stoneTop??.05;
  const random=rng(options.seed??(rain?1010610:41016)),rr=(a,b)=>a+(b-a)*random();
  const group=new T.Group();group.name=`reference-${rain?'10':'4'}-wet-stone-path`;group.position.fromArray(origin);group.rotation.y=yaw;
  const surface=new T.Group(),joints=new T.Group(),edges=new T.Group(),drain=new T.Group(),leaves=new T.Group();
  surface.name='worn-granite-slabs';joints.name='sparse-joint-moss';edges.name='low-stone-edging';drain.name='reference10-linear-drain';leaves.name='fallen-maple-leaves';group.add(surface,joints,edges,drain,leaves);
  const dry=new T.Color('#a29a88'),wet=new T.Color('#737b72'),ownedMaterials=[],textures=[],maps=[];
  const stoneMaterials=Array.from({length:8},(_,i)=>{
    const m=stoneMaps(731+i*37);maps.push(m);textures.push(m.map,m.roughnessMap,m.normalMap);
    const mat=new T.MeshPhysicalMaterial({name:`wet-flagstone-${i}`,color:wet,map:m.map,roughnessMap:m.roughnessMap,normalMap:m.normalMap,normalScale:new T.Vector2(.28,.28),roughness:.25,metalness:0,clearcoat:.36,clearcoatRoughness:.13,vertexColors:true});ownedMaterials.push(mat);return mat;
  });
  const mossMat=new T.MeshStandardMaterial({name:'joint-moss-not-painted-lines',color:'#607242',roughness:.97});
  const soilMat=new T.MeshStandardMaterial({name:'recessed-joint-soil',color:'#30392c',roughness:.96});
  const ironMat=new T.MeshStandardMaterial({name:'rain-drain-oxidized-iron',color:'#252c28',roughness:.38,metalness:.48});
  const leafRed=new T.MeshStandardMaterial({name:'wet-fallen-maple-red',color:'#853b30',roughness:.34,side:T.DoubleSide});
  const leafGold=new T.MeshStandardMaterial({name:'wet-fallen-maple-gold',color:'#8e7743',roughness:.42,side:T.DoubleSide});
  ownedMaterials.push(mossMat,soilMat,ironMat,leafRed,leafGold);
  const box=new T.BoxGeometry(1,1,1),mossGeometry=new T.IcosahedronGeometry(1,1),leafGeometry=fallenMaple();
  const records=new Map(),d=new T.Object3D(),color=new T.Color(),stoneParts=stoneMaterials.map(()=>[]),curbParts=stoneMaterials.map(()=>[]),puddleParts=[],puddleDefinitions=[],slabs=[];
  function add(g,mat,parent,x,y,z,sx,sy,sz,ry=0,tint=1){
    d.position.set(x,y,z);d.scale.set(sx,sy,sz);d.rotation.set(0,ry,0);d.updateMatrix();const key=parent.name+'/'+g.uuid+'/'+mat.uuid;
    if(!records.has(key))records.set(key,{g,mat,parent,transforms:[],colors:[]});const b=records.get(key);b.transforms.push(d.matrix.clone());b.colors.push(tint);
  }
  function mossRun(x,z,along,length){
    // Colonies are broken into 3–20 cm runs and only 3–12 mm high.
    if(random()>.58)return;const n=3+Math.floor(random()*8),center=rr(-.35,.35)*length;
    for(let k=0;k<n;k++){const f=center+(k-n*.5)*.021,xx=x+(along==='x'?f:rr(-.008,.008)),zz=z+(along==='z'?f:rr(-.008,.008));
      add(mossGeometry,mossMat,joints,xx,top-.008+rr(0,.005),zz,rr(.009,.023),rr(.003,.009),rr(.009,.026),rr(0,TAU),rr(.69,1.2));
    }
  }
  const rows=Math.max(1,Math.round(length/.98)),step=length/rows;
  for(let row=0;row<rows;row++){
    const z=-length/2+(row+.5)*step,proportions=row%3===0?[.225,.267,.203,.305]:row%3===1?[.326,.207,.276,.191]:[.184,.294,.251,.271];
    let x=-width/2;
    for(let col=0;col<proportions.length;col++){
      const w=proportions[col]*width,gap=.025,matIndex=(row*3+col*5)%8,cx=x+w/2;
      const slab=slabGeometry(w-gap,step-.028,.16,123+row*19+col*7);slab.translate(cx,top,z);stoneParts[matIndex].push(slab);
      slabs.push({x:cx,z,width:w-gap,depth:step-.028,top});
      if(col>0)mossRun(x,z,'z',step);
      if(random()<.57)mossRun(cx,z+step/2,'x',w);
      // Kept inside the slab perimeter: no specular sheet erases mortar joints.
      if(random()<(rain?.88:.46)){
        const px=cx+rr(-.10,.10)*w,pz=z+rr(-.10,.10)*step;
        const rx=Math.min(w*rr(.27,.43),(w-gap)/2-Math.abs(px-cx)-.025),rz=Math.min(step*rr(.28,.44),(step-.028)/2-Math.abs(pz-z)-.025);
        const sh=puddleShape(px,pz,rx,rz,random),g=new T.ShapeGeometry(sh,1);puddleParts.push(g);
        puddleDefinitions.push({center:[px,pz],radius:[rx,rz],slab:[row,col]});
      }
      x+=w;
    }
  }
  // Recessed dark joints have depth. There is no fluorescent green grid.
  add(box,soilMat,joints,0,top-.13,0,width+.03,.12,length+.02);
  const curbs=options.curbs??!rain;
  if(curbs)for(const side of[-1,1])for(let row=0;row<rows;row++){
    const z=-length/2+(row+.5)*step,g=slabGeometry(.20,step-.025,.20,181+row*3+(side+1)*17);g.translate(side*(width/2+.13),top+.035,z);curbParts[row%8].push(g);
    if(row%2===0)mossRun(side*(width/2+.025),z,'z',step);
  }
  const drainSide=options.drainSide??(rain?-1:0),drainX=drainSide*(width/2+.095),drainWidth=.145;
  if(drainSide){
    // Reference10 shows an actual narrow slotted drain beside the wet slabs.
    add(box,soilMat,drain,drainX,top-.052,0,drainWidth,.11,length);
    for(const side of[-1,1])add(box,ironMat,drain,drainX+side*(drainWidth/2-.009),top-.002,0,.014,.018,length);
    const slots=Math.floor(length/.058);
    for(let i=0;i<slots;i++)add(box,ironMat,drain,drainX,top-.004,-length/2+(i+.5)*length/slots,drainWidth-.025,.013,.012);
    // Sparse leaves caught at the edge, not arbitrary litter across every stone.
    for(let i=0;i<Math.round(length*.7);i++){
      const sz=rr(.065,.115);add(leafGeometry,i%3?leafRed:leafGold,leaves,drainX+rr(-.06,.06),top+.004,rr(-length/2,length/2),sz,sz,sz,rr(0,TAU),rr(.8,1.15));
    }
  }
  const leafCount=Math.round(length*(rain?.95:.48));
  for(let i=0;i<leafCount;i++){
    const sz=rr(.065,.13),x=rr(-width/2+.12,width/2-.12),z=rr(-length/2+.12,length/2-.12);
    add(leafGeometry,i%3?leafRed:leafGold,leaves,x,top+.004,z,sz,sz,sz,rr(0,TAU),rr(.75,1.1));
  }
  for(const [parts,parent] of[[stoneParts,surface],[curbParts,edges]])for(let i=0;i<parts.length;i++)if(parts[i].length){const g=mergeGeometries(parts[i]),mesh=new T.Mesh(g,stoneMaterials[i]);mesh.name=`varied-${parent===edges?'curb':'flagstone'}-course-${i}`;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);parts[i].forEach(g=>g.dispose());}
  for(const b of records.values()){
    const mesh=new T.InstancedMesh(b.g,b.mat,b.transforms.length);mesh.name=b.mat.name;
    b.transforms.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,color.setRGB(b.colors[i],b.colors[i],b.colors[i]));});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;mesh.computeBoundingSphere();b.parent.add(mesh);
  }
  group.updateMatrixWorld(true);
  // Standard Reflector input: XY geometry, world x/-z, rotateX(-PI/2), y=puddlePlaneY.
  let puddleGeometry=puddleParts.length?mergeGeometries(puddleParts):new T.BufferGeometry();puddleParts.forEach(g=>g.dispose());
  if(puddleGeometry.attributes.position){const p=puddleGeometry.attributes.position;for(let i=0;i<p.count;i++){
    const lx=p.getX(i),lz=-p.getY(i),wx=origin[0]+Math.cos(yaw)*lx+Math.sin(yaw)*lz,wz=origin[2]-Math.sin(yaw)*lx+Math.cos(yaw)*lz;p.setXYZ(i,wx,-wz,0);
  }puddleGeometry.computeVertexNormals();}
  const stats={version:'wet-path-ref4-10-v1.1',variant,slabs:slabs.length,puddles:puddleDefinitions.length,meshes:0,instances:0,triangles:0,buildMilliseconds:performance.now()-start};
  group.traverse(o=>{if(!o.isMesh)return;stats.meshes++;stats.instances+=o.count??1;stats.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.count??1);});
  function setWetness(amount){const wetness=clamp(amount,0,1);for(const m of stoneMaterials){m.color.copy(dry).lerp(wet,wetness);m.roughness=T.MathUtils.lerp(.64,.24,wetness);m.clearcoat=wetness*.45;m.clearcoatRoughness=T.MathUtils.lerp(.29,.12,wetness);}return wetness;}
  setWetness(options.wetness??(rain?1:.45));
  return {group,groups:{surface,joints,edges,drain,leaves},materials:{stone:stoneMaterials,moss:mossMat,iron:ironMat},stats,
    puddleGeometry,puddlePlaneY:origin[1]+top+.004,puddleDefinitions,slabs,setWetness,
    replacementBounds:{origin:[...origin],width,length,yaw,localX:[-width/2,width/2],localZ:[-length/2,length/2]},
    dispose(){const gs=new Set();group.traverse(o=>{if(o.isMesh)gs.add(o.geometry);});gs.forEach(g=>g.dispose());puddleGeometry.dispose();ownedMaterials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());group.removeFromParent();}
  };
}
