import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installSurfaceDetail} from './surface-detail.js';
import {createRanmaRelief138} from './ranma-relief138.js';
import {createRainCeramicField141} from './rain-ceramic141.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {clipRestorationRoofOpening,clipRestorationSolidRoofOpening} from './architecture.js';
import {createCarpentryMass183} from './carpentry-mass183.js';
import {buildHallFoundation207} from './support-route207.js';

// Scene10's established roof outline and hall transform are retained. Only
// the hall owns this timber/metal palette and these physical assemblies.
export const HALL132_REVISION='scene10-mass183-supported-carved-eave-course-r03';
export function createHall132Palette(original){
  const specs={red:['#7d3627',.69,'wood'],cedar:['#59331f',.82,'wood'],darkwood:['#1d1813',.88,'wood'],endwood:['#67492e',.81,'wood'],gold:['#b08a4c',.49,'gold'],oldgold:['#8e703f',.61,'gold']};
  const palette={};
  for(const [key,[color,roughness,kind]]of Object.entries(specs)){
    const source=original[key],mat=key==='red'?new T.MeshPhysicalMaterial({map:source.map,normalMap:source.normalMap,normalScale:source.normalScale.clone().multiplyScalar(1.8),roughnessMap:source.roughnessMap,roughness:.48,metalness:0,clearcoat:.55,clearcoatRoughness:.16}):source.clone();
    mat.name='hall183-'+key;mat.color.set(color);mat.roughness=key==='red'?.48:roughness;
    if(kind==='gold')mat.metalness=key==='gold'?.70:.53;
    installSurfaceDetail(mat,kind);palette[key]=mat;
  }
  const recessedStone=original.stone.clone();recessedStone.name='hall132-shadowed-shoreline-foundation';recessedStone.color.set('#59605d');recessedStone.roughness=.91;installSurfaceDetail(recessedStone,'stone');palette.recessedStone=recessedStone;
  // Recessed timber-backed lattice bays keep independent warm interior light.
  for(let i=0;i<5;i++){const key='window'+i,mat=original[key].clone();mat.name='hall142-recessed-window-'+i;mat.color.set(['#29241c','#48351f','#78512a','#a37432','#c1954b'][i]);mat.emissiveIntensity=[.012,.08,.36,.80,1.05][i];palette[key]=mat;}
  palette.slate=new T.MeshPhysicalMaterial({name:'hall142-rain-blue-grey-closed-ceramic',color:'#283945',map:original.slate.map,bumpMap:original.slate.bumpMap,bumpScale:.0025,roughness:.27,metalness:0,clearcoat:.78,clearcoatRoughness:.075,vertexColors:true});
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
  const {emit,box,group,between,tube,arch,lantern,R,scene,stack,emitRestoredBuddha,carvedCloud183}=api;
  RectAreaLightUniformsLib.init();
  const records={revision:HALL132_REVISION,scope:'Upper183carpentry and roof retained;207 hall undercroft uses actual pier/beam depth and a setback rear retaining body.',roofs:[],bearingRows:[],columns:[],eaveSupports:[],ornament:{giltWraps:0,volumetricLeaves:0,rosettes:0},photographSampled:false};
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
    const surf=surface(w,d,e,rise,curl),{at}=surf,pieces=new Map(),opening=label==='lower'?{minX:-9.25,maxX:9.25,minZ:-4.3,maxZ:4.3}:null;
    const draw=(g,ma,solid=true)=>{
      const clipped=opening?(solid?clipRestorationSolidRoofOpening(g,opening):[clipRestorationRoofOpening(g,opening)]):[g];
      if(!pieces.has(ma))pieces.set(ma,[]);for(const part of clipped)if(part.attributes.position.count)pieces.get(ma).push(part);
    };
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
      // The front's three full bearing purlins are emitted by frame() on
      // measured rafter undersides. Rear and hip faces retain their own
      // roof-local receivers. There is no second crossed front girt grid.
      if(face!==0)for(const t of[.53,.72,.88])draw(timber(curve(face,t,-.43,32),.20,.26),'darkwood');
      const n=Math.ceil((face%2?d:w)/.205);
      for(let i=0;i<=n;i++){
        const u=-1+2*i/n,main=Array.from({length:17},(_,j)=>at(face,.40+.615*j/16,u,-.24)),flying=Array.from({length:10},(_,j)=>at(face,.76+.277*j/9,u,-.14));
        draw(timber(main,.095,.125),'darkwood');draw(timber(flying,.070,.075),'cedar');sleeve(main.at(-1),main.at(-2),.095,.125,.075);sleeve(flying.at(-1),flying.at(-2),.070,.075,.055);rafters+=2;
      }
    }
    const ceramic=createRainCeramicField141({point:surf.point,w,d,rows:30,pitch:.235});draw(ceramic,'slate');
    records.ceramicField141=records.ceramicField141||[];records.ceramicField141.push({label,...ceramic.userData.rainCeramic141});
    draw(top.finish(),'slate',false);draw(deck.finish(),'darkwood');
    if(opening){
      const collar=builder(),edges=[[[-9.25,-4.3],[9.25,-4.3]],[[9.25,-4.3],[9.25,4.3]],[[9.25,4.3],[-9.25,4.3]],[[-9.25,4.3],[-9.25,-4.3]]];
      for(const [a,b]of edges)for(let k=0;k<48;k++){
        const t=k/48,u=(k+1)/48,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,xx=a[0]+(b[0]-a[0])*u,zz=a[1]+(b[1]-a[1])*u,y=surf.heightAt(x,z),yy=surf.heightAt(xx,zz);
        collar.quad([x,y-.18,z],[xx,yy-.18,zz],[xx,yy-.028,zz],[x,y-.028,z]);
      }
      if(!pieces.has('darkwood'))pieces.set('darkwood',[]);pieces.get('darkwood').push(collar.finish());
      records.annularRoof142={opening,upperFloorY:6.65,contact:'Closed main timbers and ceramic cuts, sealed deck edge, full upper floor and balcony; no roof passes through the inhabited upper storey.'};
    }
    for(const [ma,geometries]of pieces){
      const hasColor=geometries.some(g=>g.hasAttribute('color'));
      if(hasColor)for(const g of geometries)if(!g.hasAttribute('color'))g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3).fill(1),3));
      const merged=mergeGeometries(geometries.map(g=>g.index?g.toNonIndexed():g),false);emit(merged,ma);for(const g of geometries)g.dispose();
    }
    if(!opening)box(0,e+rise+.07,0,w*.53,.17,.19,'slate');records.roofs.push({label,w,d,e,rise,curl,closedTimberDepth:.152,deckTopOffset:-.028,deckBottomOffset:-.18,rafterTiers:2,rafters,outerProfile:'Source-led compact upper roof; same definition drives skin and bearing seats'});
    return surf;
  }
  // The rain reference reveals deep soffits and a compact upper pitch. A
  // 7.7 m roof rise created a dominant blank roof slope at this low camera.
  // One definition drives weather skin, bearing heights and all rafter seats.
  const roofDefinitions=[{w:23,d:13.6,e:6.05,rise:3.45,curl:1.1},{w:21.5,d:12.9,e:10.00,rise:6.50,curl:.85}];
  const profile=level=>{const r=roofDefinitions[level];return surface(r.w,r.d,r.e,r.rise,r.curl);};
  const carpentry=createCarpentryMass183({emit,box,group,carvedCloud:carvedCloud183,parentScale:L.hall.scale});
  records.mass183={revision:carpentry.revision,roofBearingPlane:'Front purlin top is the actual main-rafter underside, roof surface minus 0.303m; 0.24m closed purlin is carried by the post capital and paired cantilevers.',bayDepth:1.40,interior:'Hollow room with rear and side walls, fully supported upper floor, shrine and occupied side bays; the former shrine-occluding solid volume is removed.'};
  function frame(level){
    const base=level===1?6.65:1.3,surf=profile(level),primaryZ=4.30,capitalHeight=.60,capitalTopOffset=1.3195*capitalHeight;
    const roofY=(x,z)=>surf.heightAt(x,z-.2),purlinTop=(x,z)=>roofY(x,z)-.303,headAt=x=>purlinTop(x,primaryZ)-.24-capitalTopOffset;
    const headerY=headAt(0)-.04,frontAxes=Array.from({length:9},(_,i)=>-8.2+i*2.05);
    for(let i=0;i<frontAxes.length;i++){
      const x=frontAxes[i],columnTop=headAt(x),openColumn=level===0&&(i===2||i===3);
      if(!openColumn){
        carpentry.column(x,primaryZ,base,columnTop,level===0?.285:.255);
        const capitalTop=carpentry.capital(x,columnTop,primaryZ,{width:level===0?1.00:.94,height:capitalHeight,depth:1.10,scan:level===0?[4,6,8].includes(i):[2,5,8].includes(i)});
        records.columns.push({level,x,bottom:base+.30,shaftTop:columnTop,radius:level===0?.285:.255,bearingBeamCenter:columnTop,round:true});
        // Two full-section lever timbers grow out of the crossed capital.
        // Their outer ends bear directly under the outer purlin, whose curve
        // is sampled from the same roof as the ceramic and rafters.
        for(const side of[-1,1]){
          const xx=x+side*.33,outerZ=6.02,outerBottom=roofY(xx,outerZ)-1.0922;
          carpentry.strut([xx,capitalTop-.18,4.54],[xx,outerBottom-.10,outerZ],.19,.22,'cedar',outerBottom);
          carpentry.strut([xx,columnTop-.15,4.30],[xx,purlinTop(xx,5.25)-.35,5.25],.17,.22,'cedar',purlinTop(xx,5.25)-.24);

        }
        records.eaveSupports.push({level,columnX:x,shaftTop:columnTop,capitalTop,innerZ:primaryZ,outerZ:6.02,pairedCantilevers:2,pairedKneeBraces:2,loadPath:'Round shaft > broad daito > housed crossed arms > receiving timbers > paired full-depth cantilevers > purlins > rafters'});
      }
      // Interior columns carry the upper floor and the upper roof's inner
      // frame, with real depth behind the visible front gallery.
      for(const z of[-3.8,.15]){
        const innerHead=level===0?5.485:9.72;
        carpentry.column(x,z,base,innerHead,level===0?.25:.23);
        carpentry.capital(x,innerHead,z,{width:.79,height:.60,depth:.86,pendantFace:false});
      }
      if(i===frontAxes.length-1)continue;
      const xx=x+1.025,open=level===0&&(i===2||i===3),windowHeight=level===1?1.90:3.10,windowCentre=base+.40+windowHeight/2,windowTop=base+.40+windowHeight,friezeY=headerY-.48;
      if(!open){
        const material=level===1?'window0':'window'+([1,2,1,0,0,3,4,2][i]);
        // The window wall is a metre and a half behind the column face.
        // Closed jamb returns and deep sill sections reveal that distance.
        box(xx,windowCentre,2.84,1.62,windowHeight,.10,material);
        box(xx,base+.32,2.97,1.76,.56,.28,'red');
        for(const sign of[-1,1]){box(xx+sign*.84,windowCentre,2.98,.12,windowHeight+.16,.38,'cedar');box(xx+sign*.77,windowCentre,3.182,.025,windowHeight,.027,'oldgold');}
        for(const yy of[base+.40,windowTop])box(xx,yy,2.99,1.76,.11,.40,'red');
        for(let j=0;j<9;j++)box(xx-.8+j*.2,windowCentre,3.085,.032,windowHeight,.055,'darkwood');
        for(let j=0;j<Math.ceil(windowHeight/.225);j++)box(xx,base+.43+j*.225,3.115,1.64,.028,.055,'darkwood');
        if(friezeY-.20>windowTop){box(xx,(windowTop+friezeY-.20)/2,2.90,1.72,friezeY-.20-windowTop,.20,level===1?'plaster':'darkwood');}
      }
      const wallTop=level===0?6.435:roofY(xx,2.72)-.30,wallBottom=friezeY+.17;
      if(wallTop>wallBottom)box(xx,(wallTop+wallBottom)/2,2.72,1.76,wallTop-wallBottom,.22,'darkwood');
      carpentry.frieze(xx,friezeY,2.99,1.76,.34,{wood:level===1});
      // A separate deep curved transom stands on the column-side gallery.
      // Its carved underside is timber, with sparse fitted metal leaves.
      carpentry.arch(xx,headerY-.13,4.23,1.78,.43);
      for(const sx of[-.72,0,.72])box(xx+sx,headerY-.14,3.00,.10,.28,.26,'red');
      for(const sx of[-.70,.70])carpentry.strut([xx+sx,headerY+.02,3.04],[xx+sx,headerY+.20,4.15],.13,.19,'cedar');
    }
    box(0,headerY+.06,primaryZ,18.50,.28,.50,'red');
    box(0,base+.15,primaryZ,18.50,.22,.43,'darkwood');
    // Three curved purlins follow the physical roof underside. Their width
    // runs across the hall; all projection arms terminate under these solids.
    for(const [index,z]of[4.30,5.25,6.02].entries()){
      const limit=index===0?9.15:index===1?9.55:10.05,points=Array.from({length:65},(_,i)=>{const x=-limit+2*limit*i/64;return[x,purlinTop(x,z)-.12,z];});
      emit(timber(points,index===0?.32:.26,.24),'darkwood');
      records.bearingRows.push({level,index,z,topOffsetFromRoof:-.303,depth:.24,kind:'full-depth-continuous-roof-purlin',postAxes:frontAxes.filter((_,i)=>!(level===0&&(i===2||i===3)))});
    }
    // One secondary bearing course fills the depth below the outer purlin.
    // Every small daito stands on this closed curved girt. The primary
    // full-section cantilevers terminate under the girt, so the course has a
    // continuous load path back to the large column capitals.
    const outerZ=6.02,secondaryScale=.36,outerLimit=10.05,secondaryCount=Math.round(outerLimit*2/.6833),girtPoints=[];
    for(let j=0;j<=secondaryCount;j++){
      const x=-outerLimit+outerLimit*2*j/secondaryCount,roofHeight=roofY(x,outerZ),centre=roofHeight-.543-.82*secondaryScale;
      arch.brackets(x,centre,outerZ,secondaryScale,{interlocked:true,detail:true,material:'cedar'});
    }
    for(let j=0;j<=64;j++){const x=-outerLimit+outerLimit*2*j/64;girtPoints.push([x,roofY(x,outerZ)-.9922,outerZ]);}
    emit(timber(girtPoints,.32,.20),'cedar');
    for(const side of[-1,1])carpentry.strut([side*8.2,headAt(side*8.2)+.58,4.58],[side*9.95,roofY(side*9.95,outerZ)-1.2022,outerZ],.24,.22,'cedar',roofY(side*9.95,outerZ)-1.0922);
    records.bearingRows.push({level,index:3,z:outerZ,sets:secondaryCount+1,scale:secondaryScale,kind:'single-supported-secondary-capital-course',daitoBottomOffset:-.8922,girtBottomOffset:-1.0922,girtTopOffset:-.8922,purlinBottomOffset:-.543});
    // The large doorway span has a closed transfer girder over its actual
    // pair of jamb supports. Intermediate eave levers sit on that girder.
    if(level===0){
      const transferCentre=L.hall.entranceX,transferY=headerY-.08;
      box(transferCentre,transferY,4.13,4.48,.42,.62,'cedar');
      carpentry.frieze(transferCentre,transferY,4.46,4.37,.34);
      for(const xx of[transferCentre-1.80,transferCentre+1.80]){
        const jambTop=transferY-.21;carpentry.column(xx,4.07,base,jambTop,.215);
        carpentry.arch(xx,jambTop+.02,4.08,1.0,.48);
      }
      for(const xx of[-4.10,-2.05])for(const side of[-1,1]){
        const x=xx+side*.28;carpentry.strut([x,transferY+.20,4.24],[x,roofY(x,6.02)-1.2022,6.02],.18,.22,'cedar',roofY(x,6.02)-1.0922);
      }
    }
    if(level===1){
      box(0,base-.12,.2,18.5,.24,8.6,'darkwood');box(0,base-.05,4.83,18.5,.14,1.06,'darkwood');
      for(const x of frontAxes)box(x,base-.20,4.80,.24,.30,1.45,'cedar');
      railUpper(base);
    }
    for(const z of[-3.8,.15])box(0,level===0?6.405:10.64,z,18.50,.25,.34,'darkwood');
    const r=roofDefinitions[level];group(0,0,.2,0,()=>roof(r.w,r.d,r.e,r.rise,r.curl,level?'upper':'lower'));
  }
  function railUpper(base){for(let i=0;i<=17;i++){const x=-9+18*i/17;box(x,base+.73,5.05,.11,.86,.11,'red');emit(boss,'oldgold',x,base+1.21,5.05,.10,.09,.10);}for(const h of[.25,.65,.88])box(0,base+.3+h*.86,5.05,18,.075,.075,'red');}
  group(...L.hall.position,L.hall.yaw,()=>{
    records.foundation207=buildHallFoundation207({emit,box},L);
    for(let i=0;i<323;i++)R(.72,1.20); // Exact legacy replay protects later paving/rain.
    // A hollow, occupied room replaces the old 18.1 x 5.4 x 5.8 solid box,
    // whose front face hid the Buddha and filled the entire entrance view.
    box(0,3.98,-4.72,18.30,5.36,.24,'darkwood');
    for(const side of[-1,1])box(side*9.08,3.98,-.90,.24,5.36,7.40,'darkwood');
    box(0,1.40,-.75,18.30,.20,9.60,'darkwood');
    for(const side of[-1,1])box(side*9.08,8.13,-.72,.24,2.96,7.76,'darkwood');
    box(0,8.13,-4.72,18.30,2.96,.24,'darkwood');
    // A coffered ceiling is borne by the two deep interior column rows.
    box(0,6.485,-.48,18.32,.10,8.48,'darkwood');
    for(let j=0;j<12;j++)box(-8.6+j*1.56,6.34,-.48,.14,.20,8.40,'cedar');
    for(let j=0;j<6;j++)box(0,6.34,-4.0+j*1.40,18.30,.20,.14,'cedar');
    frame(0);frame(1);
    group(L.hall.entranceX,0,0,0,()=>{
      box(0,3.8,-1.40,3.5,4.5,.18,'darkwood');box(0,1.58,-1.1,3.3,.22,4.2,'darkwood');
      // Tangible side cabinets, altar tables, and finite lamps occupy the
      // depth beyond the doors. Their feet bear on the continuous hall floor.
      for(const side of[-1,1]){
        const x=side*2.52;
        box(x,2.58,-.30,1.42,2.34,.48,'darkwood');
        for(const xx of[-.61,.61])box(x+xx,2.58,-.035,.10,2.38,.10,'cedar');
        for(const yy of[1.46,3.70])box(x,yy,-.035,1.44,.11,.12,'oldgold');
        for(const yy of[2.15,2.93])carpentry.frieze(x,yy,-.024,1.20,.29,{wood:true});
        box(side*.94,2.24,1.14,.61,.13,.52,'cedar');
        for(const dx of[-.23,.23])for(const dz of[-.18,.18])box(side*.94+dx,1.80,1.14+dz,.085,.75,.085,'darkwood');
        lantern(side*.94,2.62,1.14,.32,false);
      }
      const burner=new T.LatheGeometry([[0,0],[.26,0],[.35,.10],[.39,.29],[.42,.33],[.42,.37],[.35,.38],[.34,.31],[.31,.16],[0,.12]].map(p=>new T.Vector2(...p)),36);
      emit(burner,'oldgold',0,1.72,1.95);
      for(let k=0;k<3;k++){const a=k*Math.PI*2/3;box(Math.cos(a)*.25,1.51,1.95+Math.sin(a)*.25,.10,.42,.10,'oldgold');}
      for(const x of[-.10,0,.10])between([x,2.02,1.95],[x+.015,2.48,1.95],.008,'endwood');
      // A stepped closed pedestal carries the lotus from the real hall floor.
      // Its top meets the lotus's y=2.02 underside; the figure sits at y=2.25.
      box(0,1.39,-.07,1.80,.18,1.65,'darkwood');
      box(0,1.655,-.07,1.55,.35,1.45,'darkwood');
      box(0,1.925,-.07,1.50,.19,1.42,'darkwood');
      for(const y of[1.47,1.82])box(0,y,-.07,1.60,.035,1.49,'oldgold');
      records.shrineSeatContact141={floorY:1.30,localCentreZ:-.07,recessedFigureCentreZ:-.07,pedestalTop:2.02,lotusBottom:2.02,lotusTop:2.26,figureSeatY:2.25,source:'Closed modeled bearing solids; no hovering plinth'};

      for(const sign of[-1,1]){arch.footColumn(sign*1.15,2.3,1.5,4,.13);for(let yy=2.2;yy<5.2;yy+=.35)box(sign*1.15,yy,2.32,.21,.07,.19,'oldgold');}
      // A recessed shrine sits beyond the real doorway. Gilded, half-open
      // solid door leaves give the entrance depth and occlude the figure.
      group(0,0,-1.55,0,()=>emitRestoredBuddha(emit,{x:0,y:2.25,z:1.48,scale:.42}));
      for(const sign of[-1,1])group(sign*1.42,0,3.1,sign*.48,()=>{
        box(0,3.35,0,.88,3.65,.14,'darkwood');
        for(const yy of[1.64,2.35,4.15,5.05])box(0,yy,.083,.93,.075,.045,'oldgold');
        for(const xx of[-.40,.40])box(xx,3.35,.083,.055,3.62,.045,'oldgold');
        for(const yy of[2.80,4.42])emit(ranmaRelief,'gold',0,yy,.084,.75,1.0,.42);
      });
      for(let k=0;k<6;k++){box(0,5.60,-.60+k*.62,3.4,.13,.14,'cedar');for(const sign of[-1,1])box(sign*1.53,3.6,-.6+k*.62,.18,4.3,.18,'red');}
      // A real carved shrine cabinet closes the formerly plain dark back wall.
      // The recessed figure stands before this gilt frame, beyond the doors.
      box(0,3.50,-1.20,2.05,3.05,.18,'darkwood');
      for(const x of[-.98,.98]){box(x,3.50,-1.085,.095,3.12,.09,'oldgold');for(let j=0;j<7;j++)foliate(x,2.2+j*.40,-1.020,.19);}
      for(const yy of[2.03,4.96])box(0,yy,-1.085,2.08,.10,.09,'oldgold');
      for(const x of[-.67,0,.67])emit(ranmaRelief,'oldgold',x,4.68,-1.065,.62,.40,.32);
      tube([[-1.05,4.98,-1.020],[-.70,5.25,-1.020],[0,5.42,-1.020],[.70,5.25,-1.020],[1.05,4.98,-1.020]],.055,'oldgold');

      emit(new T.LatheGeometry([[.52,0],[.64,.08],[.62,.16],[.48,.24]].map(p=>new T.Vector2(...p)),40),'oldgold',0,2.02,-.07);
      for(let i=0;i<20;i++){const a=i*Math.PI/10;emit(boss,'gold',Math.cos(a)*.54,2.15,-.07+Math.sin(a)*.4,.10,.16,.04,[0,-a,0]);}
      for(let k=0;k<12;k++){const a=k*Math.PI/6;tube([[Math.cos(a)*.68,4+Math.sin(a)*.78,-.17],[Math.cos(a)*.78,4+Math.sin(a)*.88,-.16]],.018,'oldgold');}
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
    for(const x of[-7,-3,5,8]){
      lantern(x,3.5,4.9,.62,true);
      // Existing lantern chain now reaches an actual eave receiving timber.
      const upperAnchor=profile(0).heightAt(x,4.70)-.58;
      between([x,4.58,4.9],[x,upperAnchor,4.9],.012,'black');
      box(x,upperAnchor,4.9,.16,.055,.24,'black');
    }
    records.mass183.parts=carpentry.parts;
    // Luminance originates on existing paper bays. These finite warm aperture
    // sources supply the room bounce absent from WebGL's one-bounce shading.
    // They point outward and remain on the real recessed glazing plane.
    records.windowApertureLights142=[];
    for(const [xx,intensity]of[[-5.125,3.2],[5.125,2.4]]){
      const aperture=new T.RectAreaLight('#ffca86',intensity,1.60,3.00);aperture.name='scene10-existing-paper-bay-finite-area-emission';aperture.position.set(xx,3.25,2.905);aperture.rotation.y=Math.PI;aperture.applyMatrix4(stack.at(-1));scene.add(aperture);records.windowApertureLights142.push({localCentre:[xx,3.25,2.905],width:1.60,height:3,intensity,source:'Existing paper bay; finite outward room radiance, no camera fill'});
    }

    const light=new T.PointLight('#ffbd75',10,22,2);light.name='scene10-shadowed-recessed-shrine-inverse-square-source';light.position.set(L.hall.entranceX,3,1.1).applyMatrix4(stack.at(-1));light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.near=.10;light.shadow.camera.far=45;light.shadow.bias=-.000025;light.shadow.normalBias=.005;scene.add(light);
  },L.hall.scale);
  return records;
}
