import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceDetail} from './surface-detail.js';
import {createRanmaRelief138} from './ranma-relief138.js';
import {createRainCeramicField141} from './rain-ceramic141.js';

// Scene10's established roof outline and hall transform are retained. Only
// the hall owns this timber/metal palette and these physical assemblies.
export const HALL132_REVISION='scene10-solmax-supported-rain-court-r11-20261021';
export function createHall132Palette(original){
  const specs={red:['#71301f',.60,'wood'],cedar:['#62391f',.72,'wood'],darkwood:['#27190f',.80,'wood'],endwood:['#936138',.74,'wood'],gold:['#b38d50',.42,'gold'],oldgold:['#86673b',.58,'gold']};
  const palette={};
  for(const [key,[color,roughness,kind]]of Object.entries(specs)){
    const mat=original[key].clone();mat.name='hall132-'+key;mat.color.set(color);mat.roughness=roughness;
    if(kind==='gold')mat.metalness=key==='gold'?.86:.78;
    installSurfaceDetail(mat,kind);palette[key]=mat;
  }
  const recessedStone=original.stone.clone();recessedStone.name='hall132-shadowed-shoreline-foundation';recessedStone.color.set('#59605d');recessedStone.roughness=.91;installSurfaceDetail(recessedStone,'stone');palette.recessedStone=recessedStone;
  // Recessed timber-backed lattice bays keep independent warm interior light.
  for(let i=0;i<5;i++){const key='window'+i,mat=original[key].clone();mat.name='hall132-'+key;mat.color.set(['#372016','#573019','#78512a','#a37432','#c1954b'][i]);mat.emissiveIntensity=[.16,.32,.58,.90,1.20][i];palette[key]=mat;}
  palette.slate=new T.MeshPhysicalMaterial({name:'hall141-wet-blue-grey-ceramic',color:'#34434e',map:original.slate.map,bumpMap:original.slate.bumpMap,bumpScale:.0025,roughness:.38,metalness:0,clearcoat:.62,clearcoatRoughness:.115,vertexColors:true});
  installSurfaceDetail(palette.slate,'stone');
  palette.tileEdge=original.tileEdge.clone();palette.tileEdge.name='hall141-clay-cut-and-raised-seal';palette.tileEdge.color.set('#3a454b');palette.tileEdge.roughness=.53;
  return palette;
}

const V=p=>new T.Vector3(...p);
function surface(w,d,e,rise,curl){
  const hw=w/2,hd=d/2,ridge=w*.25,span=t=>ridge+(hw-ridge)*t;
  const point=(face,t,u)=>{
    const y=e+rise*Math.pow(Math.max(0,1-t),1.6)+curl*Math.pow(t,8)*(.25+.75*Math.pow(Math.abs(u),8));
    return face%2?[face===1?span(t):-span(t),y,u*hd*t]:[u*span(t),y,face===0?hd*t:-hd*t];
  };
  const at=(face,t,u,dy=0)=>{const p=point(face,t,u);p[1]+=dy;return p;};
  const heightAt=(x,z)=>{let t=Math.abs(z)/hd,face=z>=0?0:2,u=x/span(t);if(Math.abs(x)>span(t)){t=(Math.abs(x)-ridge)/(hw-ridge);face=x>=0?1:3;u=z/(hd*t);}return point(face,t,u)[1];};
  return{point,at,heightAt};
}
function builder(){
  const positions=[],uv=[];
  function tri(a,b,c){if(V(b).sub(V(a)).cross(V(c).sub(V(a))).lengthSq()<1e-16)return;for(const p of[a,b,c]){positions.push(...p);uv.push(p[0]*.3,p[2]*.3);}}
  const quad=(a,b,c,d)=>{tri(a,b,c);tri(a,c,d);};
  function finish(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
  return{tri,quad,finish};
}
// Closed curved rectangular members, with physical end caps. Adapted from
// the project's scene07 construction method; scene10 keeps its own profile.
function timber(points,width,height){
  const b=builder(),rings=points.map((p,i)=>{
    const tangent=V(points[Math.min(points.length-1,i+1)]).sub(V(points[Math.max(0,i-1)])).normalize(),side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize();
    return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>V(p).addScaledVector(side,x*width/2).addScaledVector(up,y*height/2).toArray());
  });
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<4;j++){const k=(j+1)%4;b.quad(rings[i][k],rings[i+1][k],rings[i+1][j],rings[i][j]);}
  const a=rings[0],z=rings.at(-1);b.quad(a[3],a[2],a[1],a[0]);b.quad(z[0],z[1],z[2],z[3]);return b.finish();
}
function leafGeometry(){
  const b=builder(),n=8,m=8,rings=[];
  for(let i=0;i<=n;i++){const t=i/n,rad=Math.sin(Math.PI*t),ring=[];for(let j=0;j<m;j++){const a=j*Math.PI*2/m;ring.push([t-.5,Math.cos(a)*rad*.21,Math.sin(a)*rad*.095+.045*Math.sin(Math.PI*t)]);}rings.push(ring);}
  for(let i=0;i<n;i++)for(let j=0;j<m;j++)b.quad(rings[i][j],rings[i+1][j],rings[i+1][(j+1)%m],rings[i][(j+1)%m]);return b.finish();
}
function bilateralCloudBracketGeometry(){
  const shape=new T.Shape();shape.moveTo(-.17,0);shape.lineTo(.17,0);
  shape.bezierCurveTo(.31,.015,.32,.16,.46,.29);
  shape.bezierCurveTo(.61,.44,.78,.42,.84,.27);
  shape.bezierCurveTo(.90,.13,.86,.10,1.08,.10);
  shape.lineTo(1.10,.29);shape.lineTo(.91,.29);
  shape.bezierCurveTo(.70,.29,.71,.49,.57,.57);
  shape.bezierCurveTo(.42,.65,.27,.49,.21,.33);
  shape.lineTo(-.21,.33);
  shape.bezierCurveTo(-.27,.49,-.42,.65,-.57,.57);
  shape.bezierCurveTo(-.71,.49,-.70,.29,-.91,.29);
  shape.lineTo(-1.10,.29);shape.lineTo(-1.08,.10);
  shape.bezierCurveTo(-.86,.10,-.90,.13,-.84,.27);
  shape.bezierCurveTo(-.78,.42,-.61,.44,-.46,.29);
  shape.bezierCurveTo(-.32,.16,-.31,.015,-.17,0);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:.22,steps:1,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,bevelSegments:2,curveSegments:10});
  g.translate(0,0,-.11);g.name='closed-front-facing-bilateral-cloud-dougong';return g;
}

export function buildHall132(api,L){
  const {emit,box,group,between,tube,arch,lantern,R,scene,stack,emitRestoredBuddha}=api;
  const records={revision:HALL132_REVISION,scope:'Hall front and roof underside; full foundation footprint retained as side wings, sill and bearing lintel around a single shoreline underpass.',roofs:[],bearingRows:[],columns:[],eaveSupports:[],ornament:{giltWraps:0,volumetricLeaves:0,rosettes:0},photographSampled:false};
  const ranmaRelief=createRanmaRelief138();records.ornament.reliefPanels=0;records.ornament.reliefGeometry={triangles:ranmaRelief.userData.triangles,closedSolid:true,bitmapInMaterial:false,nonMetricGuide:true};
  const leaf=leafGeometry(),rosette=new T.TorusGeometry(.13,.022,7,20),boss=new T.SphereGeometry(1,12,8),eaveArm=bilateralCloudBracketGeometry();
  const foliate=(x,y,z,s=1)=>{
    emit(rosette,'oldgold',x,y,z,s,s,s);emit(boss,'gold',x,y,z+.022,.040*s,.040*s,.028*s);records.ornament.rosettes++;
    for(let k=0;k<8;k++){const a=k*Math.PI/4;emit(leaf,'gold',x+Math.cos(a)*.080*s,y+Math.sin(a)*.080*s,z+.027*s,.125*s,.17*s,.25*s,[0,0,a]);records.ornament.volumetricLeaves++;}
    for(const sign of[-1,1]){
      tube([[x+sign*.12*s,y,z],[x+sign*.28*s,y+.10*s,z+.025*s],[x+sign*.43*s,y+.015*s,z],[x+sign*.49*s,y+.07*s,z]],.018*s,'oldgold');
      for(const [dx,dy,a]of[[.17,-.07,-.72],[.24,.08,.60],[.31,.10,1.05],[.35,-.01,-.55],[.43,.05,.75]]){emit(leaf,'gold',x+sign*dx*s,y+dy*s,z+.022*s,.20*s,.20*s,.20*s,[0,0,sign===1?a:Math.PI-a]);records.ornament.volumetricLeaves++;}
    }
  };
  // Metal is a thin returned sheath around an existing timber section,
  // including its end face, rather than an oversized solid gilt block.
  function sleeve(end,prior,width,height,length=.11){
    const tangent=V(end).sub(V(prior)).normalize(),side=new T.Vector3(tangent.z,0,-tangent.x).normalize(),up=new T.Vector3().crossVectors(tangent,side).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(side,up,tangent));
    const part=(dx,dy,dz,w,h,d)=>{const p=V(end).addScaledVector(side,dx).addScaledVector(up,dy).addScaledVector(tangent,dz);emit('box','oldgold',p.x,p.y,p.z,w,h,d,q);};
    const thick=.007;
    for(const sign of[-1,1]){part(sign*(width/2+.004),0,-length/2,thick,height+.022,length);part(0,sign*(height/2+.004),-length/2,width,thick,length);}
    part(0,0,.003,width+.022,height+.022,thick);records.ornament.giltWraps++;
  }
  function roof(w,d,e,rise,curl,label){
    const surf=surface(w,d,e,rise,curl),{at}=surf,pieces=new Map(),draw=(g,ma)=>{if(!pieces.has(ma))pieces.set(ma,[]);pieces.get(ma).push(g);};
    const top=builder(),deck=builder();let rafters=0;
    const curve=(face,t,dy,n=48)=>Array.from({length:n+1},(_,i)=>at(face,t,-1+2*i/n,dy));
    for(let face=0;face<4;face++){
      const nu=50,nt=24;
      for(let j=0;j<nt;j++)for(let i=0;i<nu;i++){
        const ta=j/nt,tb=(j+1)/nt,ua=-1+2*i/nu,ub=-1+2*(i+1)/nu,a=at(face,ta,ua),b=at(face,ta,ub),c=at(face,tb,ub),q=at(face,tb,ua),aa=at(face,ta,ua,-.18),bb=at(face,ta,ub,-.18),cc=at(face,tb,ub,-.18),dd=at(face,tb,ua,-.18),isUp=V(b).sub(V(a)).cross(V(c).sub(V(a))).y>0;
        const da=at(face,ta,ua,-.028),db=at(face,ta,ub,-.028),dc=at(face,tb,ub,-.028),dq=at(face,tb,ua,-.028);
        if(isUp){top.quad(a,b,c,q);deck.quad(da,db,dc,dq);deck.quad(dd,cc,bb,aa);}else{top.quad(q,c,b,a);deck.quad(dq,dc,db,da);deck.quad(aa,bb,cc,dd);}
        if(j===0)deck.quad(aa,bb,db,da);if(j===nt-1)deck.quad(dq,dc,cc,dd);if(i===0)deck.quad(da,dq,dd,aa);if(i===nu-1)deck.quad(bb,cc,dc,db);
      }
      // Preserve the ceramic course rhythm and existing outer silhouette.
      const lanes=Math.ceil((face%2?d:w)/.235),angle=face===0?0:face===1?Math.PI/2:face===2?Math.PI:-Math.PI/2;
      for(let i=0;i<=lanes;i++)arch.tileEnd(V(at(face,1,-1+2*i/lanes,.032)),angle,.078,face===0);
      draw(new T.TubeGeometry(new T.CatmullRomCurve3(curve(face,1,0).map(V)),96,.12,7,false),'slate');
      for(const sign of[-1,1])draw(new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:20},(_,i)=>V(at(face,i/19,sign)))),57,.095,7,false),'slate');
      draw(timber(curve(face,1,-.20),.18,.16),'red');draw(timber(curve(face,1.009,-.29),.15,.065),'darkwood');draw(timber(curve(face,1.012,-.22),.022,.025),'oldgold');
      for(const t of[.53,.72,.88])draw(timber(curve(face,t,-.43,32),.20,.26),'cedar');
      const n=Math.ceil((face%2?d:w)/.205);
      for(let i=0;i<=n;i++){
        const u=-1+2*i/n,main=Array.from({length:17},(_,j)=>at(face,.40+.615*j/16,u,-.24)),flying=Array.from({length:10},(_,j)=>at(face,.76+.277*j/9,u,-.14));
        draw(timber(main,.095,.125),'cedar');draw(timber(flying,.070,.075),'red');sleeve(main.at(-1),main.at(-2),.095,.125,.075);sleeve(flying.at(-1),flying.at(-2),.070,.075,.055);rafters+=2;
      }
    }
    const ceramic=createRainCeramicField141({point:surf.point,w,d,rows:30,pitch:.235});draw(ceramic,'slate');
    records.ceramicField141=records.ceramicField141||[];records.ceramicField141.push({label,...ceramic.userData.rainCeramic141});
    draw(top.finish(),'slate');draw(deck.finish(),'cedar');
    for(const [ma,geometries]of pieces){
      const hasColor=geometries.some(g=>g.hasAttribute('color'));
      if(hasColor)for(const g of geometries)if(!g.hasAttribute('color'))g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));
      const merged=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g),false);emit(merged,ma);for(const g of geometries)g.dispose();
    }
    box(0,e+rise+.07,0,w*.53,.17,.19,'slate');records.roofs.push({label,w,d,e,rise,curl,closedTimberDepth:.152,deckTopOffset:-.028,deckBottomOffset:-.18,rafterTiers:2,rafters,outerProfile:'Source-led compact upper roof; same definition drives skin and bearing seats'});
    return surf;
  }
  // The rain reference reveals deep soffits and a compact upper pitch. A
  // 7.7 m roof rise created a dominant blank roof slope at this low camera.
  // One definition drives weather skin, bearing heights and all rafter seats.
  const roofDefinitions=[{w:23,d:13.6,e:6.05,rise:3.45,curl:1.1},{w:21.5,d:12.9,e:10.00,rise:5.65,curl:.85}];
  const profile=level=>{const r=roofDefinitions[level];return surface(r.w,r.d,r.e,r.rise,r.curl);};
  const rows=[{z:4.50,s:.72,pitch:1.025},{z:5.28,s:.48,pitch:.6833},{z:6.02,s:.42,pitch:.6833},{z:6.52,s:.34,pitch:.62}];
  function rowBase(surf,x,row){return surf.heightAt(x,row.z-.2)-.51-.97*row.s;}
  function frame(level){
    const base=1.3+level*4.4,surf=profile(level),first=rows[0],headerY=rowBase(surf,0,first)-.07,top=base+4.1;
    for(let i=0;i<9;i++){
      const x=-8.2+i*2.05,columnTop=rowBase(surf,x,first)-.07;
      if(!(level===0&&(i===2||i===3))){arch.footColumn(x,4.3,base,columnTop-base-.3,.22);box(x,base+.15,4.3,.51,.26,.51,'black');records.columns.push({level,x,bottom:base+.3,shaftTop:columnTop,bearingBeamCenter:columnTop});
        for(const sign of[-1,1]){box(x+sign*.238,columnTop-.13,4.3,.018,.22,.47,'oldgold');box(x,columnTop-.13,4.3+sign*.238,.47,.22,.018,'oldgold');}foliate(x,columnTop-.13,4.55,.35);
        const supportScale=level===0?1:.84;
        emit(eaveArm,'cedar',x,columnTop-.60*supportScale,4.43,1,.82*supportScale,supportScale);
        box(x,columnTop-.19*supportScale,4.48,.40*supportScale,.09*supportScale,.22,'darkwood');
        emit(eaveArm,'red',x,columnTop-.39*supportScale,4.53,.80*supportScale,.59*supportScale,.80*supportScale);
        for(const sign of[-1,1])emit(boss,'oldgold',x+sign*.82*supportScale,columnTop-.33*supportScale,4.65,.030,.024,.022);
        records.eaveSupports.push({level,columnX:x,frontZ:4.43,projectionWidth:2.20*supportScale,primaryScale:[1,.82*supportScale,supportScale],secondaryScale:[.80*supportScale,.59*supportScale,.80*supportScale],bearing:'stacked-on-post-cap-darkwood-shoe',giltPins:2});
      }
      for(const z of[-4,0]){arch.footColumn(x,z,base,4,.20);arch.brackets(x,top,z,.7,{detail:true});}
      if(i===8)continue;
      const xx=x+1.025,open=level===0&&(i===1||i===2||i===3),windowTop=base+3.50,friezeY=headerY-.48;
      if(!open){
        const material=level===1?'window'+(i%4===2?2:0):'window'+([1,2,1,0,0,3,4,2][i]);
        box(xx,base+1.95,3.28,1.62,3.1,.10,material);box(xx,base+.35,3.45,1.75,.65,.16,'red');
        for(let j=0;j<9;j++)box(xx-.8+j*.2,base+1.95,3.52,.032,3.1,.045,'darkwood');
        for(let j=0;j<14;j++)box(xx,base+.43+j*.225,3.55,1.7,.028,.045,'darkwood');
        if(friezeY-.34>windowTop)box(xx,(windowTop+friezeY-.34)/2,3.37,1.76,friezeY-.34-windowTop,.16,'darkwood');
      }
      // Deep carved beam band, moulded timber frame, and raised metal leaves.
      box(xx,friezeY,3.43,1.78,.64,.24,'darkwood');
      for(const sy of[-1,1]){box(xx,friezeY+sy*.32,3.50,1.84,.075,.23,'red');box(xx,friezeY+sy*.252,3.57,1.60,.025,.018,'oldgold');}
      for(const sx of[-1,1]){box(xx+sx*.875,friezeY,3.50,.085,.64,.23,'red');box(xx+sx*.81,friezeY,3.52,.025,.57,.12,'oldgold');}
      emit(ranmaRelief,'gold',xx,friezeY,3.554,1.62,.48,.56);records.ornament.reliefPanels++;
      for(const sx of[-1,1])box(xx+sx*.72,friezeY-.12,3.585,.030,.23,.022,'gold');
      // Short genuine posts tie the recessed carved band into the head beam.
      for(const sx of[-.75,0,.75])box(xx+sx,headerY-.22,3.48,.10,.28,.19,'red');
    }
    for(const yy of[base+.25,headerY])box(0,yy,4.3,18.5,.22,.34,'red');
    rows.forEach((row,index)=>{
      const limit=index===0?9.15:index===1?9.48:index===2?9.9:10.15,n=Math.floor(limit*2/row.pitch),points=[];
      for(let i=0;i<=n;i++){
        const x=-limit+2*limit*i/n,baseY=rowBase(surf,x,row),seat=baseY+.15*row.s,roofY=surf.heightAt(x,row.z-.2);
        arch.brackets(x,seat,row.z,row.s,{detail:true,interlocked:true,material:index%2?'cedar':'red'});
        const girtDepth=index===0?.14:.105;points.push([x,baseY-girtDepth/2,row.z]);
        // Receiver over the capital shares the rafter/purlin bearing plane.
        const receiverWidth=row.s*.90,receiverY=roofY-.42;
        box(x,receiverY,row.z,receiverWidth,.24,.23,'cedar');
        // A returned metal border follows the actual receiver end. Its open
        // timber centre and raised boss remain visible under the thin girts.
        const fz=row.z+.122;
        for(const sign of[-1,1]){box(x+sign*(receiverWidth/2-.009),receiverY,fz,.018,.18,.012,'oldgold');box(x,receiverY+sign*.083,fz,receiverWidth,.014,.012,'oldgold');box(x+sign*(receiverWidth/2+.003),receiverY,row.z+.075,.012,.18,.105,'oldgold');}
        emit(boss,'gold',x,receiverY,fz+.012,.025,.025,.014);
        records.ornament.giltWraps++;
      }
      emit(timber(points,index===0?.34:.18,index===0?.14:.105),index%2?'cedar':'red');
      if(index>0)for(let i=0;i<=16;i++){
        const x=-8.2+i*1.025,inner=rows[index-1],a=[x,rowBase(surf,x,inner)-.05,inner.z],b=[x,rowBase(surf,x,row)-.05,row.z];between(a,b,.12,'cedar',true);
      }
      records.bearingRows.push({level,index,z:row.z,sets:n+1,scale:row.s,capitalPrototype:{bottom:-.15,top:.82},receiverOffset:-.42,girtDepth:index===0?.14:.105});
    });
    if(level===1)railUpper(base);
    const r=roofDefinitions[level];group(0,0,.2,0,()=>roof(r.w,r.d,r.e,r.rise,r.curl,level?'upper':'lower'));
  }
  function railUpper(base){for(let i=0;i<=17;i++){const x=-9+18*i/17;box(x,base+.73,5.05,.11,.86,.11,'red');emit(boss,'oldgold',x,base+1.21,5.05,.10,.09,.10);}for(const h of[.25,.65,.88])box(0,base+.3+h*.86,5.05,18,.075,.075,'red');}
  group(...L.hall.position,L.hall.yaw,()=>{
    // Keep the foundation's 20×12 m plan and full-depth side wings. At the
    // entrance/shoreline, the broad face steps back into one shallow recessed
    // support bay; its back wall remains intact beneath the bearing lintel.
    const foundation={minX:-10,maxX:10,minY:-3.79,maxY:1.30,minZ:-6,maxZ:6};
    const opening={minX:L.hall.entranceX-6.0,maxX:L.hall.entranceX+2.55,minY:-2.65,maxY:.65,minZ:4.70,maxZ:6};
    box((foundation.minX+opening.minX)/2,(foundation.minY+foundation.maxY)/2,0,opening.minX-foundation.minX,foundation.maxY-foundation.minY,12,'stone');
    box((opening.maxX+foundation.maxX)/2,(foundation.minY+foundation.maxY)/2,0,foundation.maxX-opening.maxX,foundation.maxY-foundation.minY,12,'stone');
    box((opening.minX+opening.maxX)/2,(foundation.minY+foundation.maxY)/2,(foundation.minZ+opening.minZ)/2,opening.maxX-opening.minX,foundation.maxY-foundation.minY,opening.minZ-foundation.minZ,'recessedStone');
    box((opening.minX+opening.maxX)/2,(foundation.minY+opening.minY)/2,(opening.minZ+opening.maxZ)/2,opening.maxX-opening.minX,opening.minY-foundation.minY,opening.maxZ-opening.minZ,'stone');
    box((opening.minX+opening.maxX)/2,(opening.maxY+foundation.maxY)/2,(opening.minZ+opening.maxZ)/2,opening.maxX-opening.minX,foundation.maxY-opening.maxY,opening.maxZ-opening.minZ,'stone');
    records.foundationOpening={foundationFootprint:[20,12],opening:{centerX:(opening.minX+opening.maxX)/2,width:opening.maxX-opening.minX,bottom:opening.minY,top:opening.maxY,recessDepth:opening.maxZ-opening.minZ,backWallLocalZ:opening.minZ,through:false},bearing:'full-depth side wings and back wall, 0.65 m front lintel above a continuous sill under the hall floor',position:'Asymmetric recessed shoreline bay covers the bridge-side face while retaining the original hall foundation footprint and stair terrace'};
    // Preserve the exact 323 random draws while removing only stone courses
    // that physically intersect the new open passage.
    for(let j=0;j<17;j++)for(let k=0;k<19;k++){const x=-9.6+k*1.06+(j%2)*.45,y=-3.64+j*.30,tint=R(.72,1.20),inside=x+.505>opening.minX&&x-.505<opening.maxX&&y+.14>opening.minY&&y-.14<opening.maxY;if(!inside)box(x,y,6.025,1.01,.28,.18,'granite',0,tint);}
    box(0,4.1,-2,18.1,5.4,5.8,'darkwood');frame(0);frame(1);
    group(L.hall.entranceX,0,0,0,()=>{
      box(0,3.8,1,3.5,4.5,.18,'darkwood');box(0,1.58,0,3.3,.22,3.1,'darkwood');
      // A stepped closed pedestal carries the lotus from the real hall floor.
      // Its top meets the lotus's y=2.02 underside; the figure sits at y=2.25.
      box(0,1.39,1.48,1.80,.18,1.65,'darkwood');
      box(0,1.655,1.48,1.55,.35,1.45,'darkwood');
      box(0,1.925,1.48,1.50,.19,1.42,'darkwood');
      for(const y of[1.47,1.82])box(0,y,1.48,1.60,.035,1.49,'oldgold');
      records.shrineSeatContact141={floorY:1.30,pedestalTop:2.02,lotusBottom:2.02,lotusTop:2.26,figureSeatY:2.25,source:'Closed modeled bearing solids; no hovering plinth'};

      for(const sign of[-1,1]){arch.footColumn(sign*1.15,2.3,1.5,4,.13);for(let yy=2.2;yy<5.2;yy+=.35)box(sign*1.15,yy,2.32,.21,.07,.19,'oldgold');}
      emitRestoredBuddha(emit,{x:0,y:2.25,z:1.48,scale:.52});
      emit(new T.LatheGeometry([[.52,0],[.64,.08],[.62,.16],[.48,.24]].map(p=>new T.Vector2(...p)),40),'oldgold',0,2.02,1.48);
      for(let i=0;i<20;i++){const a=i*Math.PI/10;emit(boss,'gold',Math.cos(a)*.54,2.15,1.48+Math.sin(a)*.4,.10,.16,.04,[0,-a,0]);}
      for(let k=0;k<12;k++){const a=k*Math.PI/6;tube([[Math.cos(a)*.68,4+Math.sin(a)*.78,1.38],[Math.cos(a)*.78,4+Math.sin(a)*.88,1.39]],.018,'oldgold');}
      for(const x of[-1.8,1.8]){
        box(x,3.43,4,.28,3.86,.34,'red');
        for(const y of[1.65,4.98]){for(const sign of[-1,1]){box(x+sign*.151,y,4,.018,.28,.37,'oldgold');box(x,y,4+sign*.181,.31,.28,.018,'oldgold');}foliate(x,y,4.21,.52);}
        for(const sign of[-1,1])box(x+sign*.094,3.43,4.18,.022,3.2,.018,'gold');
      }
      box(0,5.44,4,3.90,.38,.42,'darkwood');
      for(const y of[5.26,5.62])box(0,y,4.22,4.02,.055,.075,'oldgold');
      for(const x of[-1.35,-.67,0,.67,1.35])foliate(x,5.44,4.25,.66);
      tube([[-2.0,5.36,4.23],[-1.25,5.75,4.23],[0,5.90,4.23],[1.25,5.75,4.23],[2.0,5.36,4.23]],.055,'oldgold');
      for(const sign of[-1,1])for(let k=0;k<5;k++){emit(leaf,'gold',sign*(.23+k*.27),5.79-k*.045,4.25,.32,.34,.30,[0,0,sign*(.40+k*.15)]);records.ornament.volumetricLeaves++;}
    });
    for(const x of[-7,-3,5,8])lantern(x,3.5,4.9,.62,true);
    const light=new T.PointLight('#ffbd75',32,0,2);light.name='scene10-existing-shrine-inverse-square-source';light.position.set(L.hall.entranceX,3,3).applyMatrix4(stack.at(-1));scene.add(light);
  },L.hall.scale);
  return records;
}
