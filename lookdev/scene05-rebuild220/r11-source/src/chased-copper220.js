import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function chasedRibbon220(points,width=.025,thickness=.012,z=.022){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],p[1],p[2]??z))),N=36,K=7,pos=[],uv=[],ids=[];
 for(let j=0;j<=N;j++){
  const t=j/N,p=curve.getPoint(t),d=curve.getTangent(t).normalize(),n=new T.Vector3(-d.y,d.x,0).normalize(),w=width*(.40+.60*Math.sin(Math.PI*t)**.55),h=thickness,
   rim=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[w*.14,h/2],[0,h*.18],[-w*.14,h/2],[-w/2,h/2]];
  for(let k=0;k<K;k++){const v=p.clone().addScaledVector(n,rim[k][0]);v.z+=rim[k][1];pos.push(...v.toArray());uv.push(t,k/K);}
 }
 for(let j=0;j<N;j++)for(let k=0;k<K;k++){const a=j*K+k,b=j*K+(k+1)%K,c=a+K,d=b+K;ids.push(a,b,c,b,d,c);}
 for(const j of[0,N]){const p=curve.getPoint(j/N),c=pos.length/3;pos.push(...p.toArray());uv.push(.5,j/N);for(let k=0;k<K;k++){const a=j*K+k,b=j*K+(k+1)%K;ids.push(...(j?[c,a,b]:[c,b,a]));}}
 let volume=0;for(let i=0;i<ids.length;i+=3){const a=new T.Vector3(...pos.slice(ids[i]*3,ids[i]*3+3)),b=new T.Vector3(...pos.slice(ids[i+1]*3,ids[i+1]*3+3)),c=new T.Vector3(...pos.slice(ids[i+2]*3,ids[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}

// HD05 shows chased recesses and worked folded edges, rather than a few
// swollen leaves on a blank square. These are explicit shallow cut masks
// over finite metal floors. Motifs remain an authored interpretation.
export function createChasedEndBoot220({type='hip',variant=0}={}){
 const owned=new Set(),bins=new Map(),small=type==='small',lower=type==='lower';
 function add(g,material,p=[0,0,0],angle=0){g.rotateZ(angle);g.translate(...p);owned.add(g);if(!bins.has(material))bins.set(material,[]);bins.get(material).push(g);}
 function rect(w,h,r=.025){const x=w/2,y=h/2,s=new T.Shape();s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;}
 function cast(s,depth=.010,bevel=.0014){const g=new T.ExtrudeGeometry(s,{depth,steps:1,curveSegments:small?4:7,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1});g.translate(0,0,-depth/2);return g;}
 function hole(shape,path,angle=0,scale=1,offset=[0,0]){const c=Math.cos(angle),s=Math.sin(angle),pts=path.getPoints(small?6:12).map(p=>new T.Vector2(offset[0]+scale*(p.x*c-p.y*s),offset[1]+scale*(p.x*s+p.y*c)));shape.holes.push(new T.Path(pts));}
 function ring(w,h,border,depth=.012){const s=rect(w,h);hole(s,rect(w-border*2,h-border*2,.014));return cast(s,depth,.0012);}
 const returnDepth=type==='hip'?.34:.17,sleeve=ring(1,1,type==='hip'?.009:.014,returnDepth);add(sleeve,'fittingCopper',[0,0,-returnDepth/2+.008]);
 let field;
 if(lower){field=new T.Shape();field.moveTo(-.32,-.085);field.bezierCurveTo(-.38,.04,-.23,.155,-.15,.075);field.bezierCurveTo(-.12,.26,.10,.28,.15,.10);field.bezierCurveTo(.25,.18,.39,.065,.32,-.07);field.bezierCurveTo(.18,-.15,.10,-.18,0,-.12);field.bezierCurveTo(-.13,-.18,-.23,-.14,-.32,-.085);field.closePath();}
 else field=rect(.944,.944,.027);
 if(!lower)add(cast(field,.020,.0015),'fittingPatina',[0,0,.004]);
 const mask=field.clone();
 const scroll=new T.Shape();scroll.moveTo(-.12,-.052);scroll.bezierCurveTo(-.04,-.065,.005,.050,.085,.055);scroll.bezierCurveTo(.170,.058,.173,-.046,.105,-.053);scroll.bezierCurveTo(.052,-.059,.034,.004,.080,.012);scroll.lineTo(.087,-.006);scroll.bezierCurveTo(.064,-.018,.086,-.039,.108,-.031);scroll.bezierCurveTo(.145,-.017,.127,.040,.082,.034);scroll.bezierCurveTo(.020,.024,-.034,-.080,-.12,-.052);scroll.closePath();
 if(lower){
  hole(mask,scroll,variant?Math.PI:0,1.23,[0,.015]);
  const curl=new T.Shape();curl.moveTo(-.04,0);curl.quadraticCurveTo(-.115,.07,-.04,.13);curl.quadraticCurveTo(.045,.16,.060,.085);curl.quadraticCurveTo(.035,.045,.005,.08);curl.lineTo(.020,.097);curl.quadraticCurveTo(.020,.130,-.020,.105);curl.quadraticCurveTo(-.055,.065,-.04,0);curl.closePath();
  hole(mask,curl,variant?-.6:.5,.38,[-.265,-.015]);hole(mask,curl,variant?.6:-.5,.38,[.265,-.015]);
 }else if(type==='arm'){
  for(let k=0;k<4;k++)hole(mask,scroll,k*Math.PI/2,.90,[Math.cos(k*Math.PI/2)*.215,Math.sin(k*Math.PI/2)*.215]);
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,p=new T.Shape();p.moveTo(-.011,.065);p.bezierCurveTo(-.050,.12,-.030,.20,0,.255);p.bezierCurveTo(.030,.20,.050,.12,.011,.065);p.closePath();hole(mask,p,a);}
 }else{
  const circular=new T.Path();circular.absarc(0,0,small?.350:.375,0,Math.PI*2,false);mask.holes.push(circular);
 }
 if(!lower&&!small)for(let k=0;k<4;k++){const a=k*Math.PI/2;hole(mask,scroll,a,.60,[.32*Math.cos(a)-.32*Math.sin(a),.32*Math.sin(a)+.32*Math.cos(a)]);}
 if(!lower)add(cast(mask,.010,.0008),'fittingEdge',[0,0,.019]);
 if(lower){
  const cloud=[[-.28,-.10],[-.18,-.15],[-.055,-.04],[.035,.09],[.15,.14],[.22,.06],[.15,-.025],[.075,.015],[.11,.075]];
  const flip=variant?Math.PI:0;add(chasedRibbon220(cloud,.034,.014,.017),'fittingEdge',[0,0,0],flip);
  add(chasedRibbon220(cloud.map(([x,y])=>[-x*.68,-y*.68]),.026,.012,.018),'fittingCopper',[0,0,0],flip);
  add(chasedRibbon220([[-.16,-.025],[-.23,.08],[-.16,.18],[-.07,.14],[-.105,.095]],.025,.012,.018),'fittingEdge',[0,0,0],flip);
 }
 if(type==='hip'||small){
  function petal(length,width){
   const N=14,M=16,pos=[0,.052,.0158],uv=[.5,0],ids=[];
   for(let j=1;j<N;j++)for(let k=0;k<M;k++){
    const t=j/N,a=k/M*Math.PI*2,f=Math.sin(Math.PI*t),x=Math.sin(a)*width*f**.70,front=.023+.018*f,back=.0155,
     groove=.005*f*Math.exp(-Math.pow(x/.007,2))*Math.max(0,Math.cos(a));
    pos.push(x,.052+length*t,(front+back)/2+Math.cos(a)*(front-back)/2-groove);uv.push(k/M,t);
   }
   const end=pos.length/3;pos.push(0,.052+length,.018);uv.push(.5,1);
   for(let k=0;k<M;k++)ids.push(0,1+(k+1)%M,1+k);
   for(let j=0;j<N-2;j++)for(let k=0;k<M;k++){const a=1+j*M+k,b=1+j*M+(k+1)%M,c=a+M,d=b+M;ids.push(a,b,c,b,d,c);}
   const last=1+(N-2)*M;for(let k=0;k<M;k++)ids.push(end,last+k,last+(k+1)%M);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
  }
  const count=small?8:16;for(let k=0;k<count;k++)add(petal(k%2?.267:.292,small?.047:.038),'fittingEdge',[0,0,0],k*Math.PI*2/count);
  if(!small)for(let k=0;k<8;k++)add(petal(.115,.025),'fittingCopper',[0,0,.008],(k+.5)*Math.PI/4);
 }
 // Recess floors remain a continuous finite metal plate. Fine engraving
 // therefore has real shadow depth without an image or bump-only motif.
 if(!lower){
  add(ring(.988,.988,.015,.009),'fittingEdge',[0,0,.028]);add(ring(.905,.905,.009,.007),'fittingCopper',[0,0,.028]);
  if(type!=='arm'){const boss=new T.SphereGeometry(1,small?12:18,8);boss.scale(.040,.040,.010);add(boss,'fittingCopper',[0,0,.030]);}
 }
 const rivetPositions=small?[-.40,.40]:[-.438,0,.438];
 for(let edge=0;edge<4;edge++)for(const x of rivetPositions){
  if(small&&edge>1)continue;const stud=new T.SphereGeometry(1,8,6);stud.scale(.0095,.0105,.0055);const a=edge*Math.PI/2;add(stud,'fittingEdge',[Math.cos(a)*x-Math.sin(a)*.462,Math.sin(a)*x+Math.cos(a)*.462,.030],x*.17);
 }
 if(!small)for(let side=0;side<4;side++){
  const bandHeight=returnDepth-.035,band=rect(.90,bandHeight,.006);
  for(const y of(type==='hip'?[-.075,.075]:[0]))for(const x of[-.30,-.10,.10,.30]){const cut=new T.Shape();cut.moveTo(-.020,-.032);cut.bezierCurveTo(-.040,-.005,-.015,.025,.014,.032);cut.lineTo(.022,.016);cut.quadraticCurveTo(-.014,.002,-.020,-.032);cut.closePath();hole(band,cut,0,1,[x,y]);}
  const g=cast(band,.009,.0008);g.rotateX(-Math.PI/2);g.translate(0,.502,-returnDepth/2+.008);g.rotateZ(side*Math.PI/2);add(g,'fittingCopper');
 }
 const parts=[];
 for(const [material,input]of bins){const copies=input.map(g=>g.index?g.toNonIndexed():g.clone()),geometry=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());owned.add(geometry);geometry.userData.chasedCopper220={type,variant,engraving:'Finite pierced face masks over finite floor; actual recessed channels, double rim, folded returns and struck rivets'};parts.push({geometry,material});}
 return{parts,info:{revision:'220-r06',type,variant,construction:'Chased metal with actual incised fields, shallow ribbed repousse rosette in a dark coffer, fine double rim, struck rivets and engraved folded returns. Lower wood-cut faces carry narrow chased scroll ribbons instead of a solid cloud icon.',reference:'HD05 visible end-boot anatomy; motif details inferred, not a historical-pattern attribution',photoTexture:false,newExternalMesh:false},dispose(){for(const g of owned)g.dispose();}};
}

export function createPiercedStrap220(){
 const s=new T.Shape();s.moveTo(-.45,-.50);s.lineTo(.45,-.50);s.lineTo(.45,.50);s.lineTo(-.45,.50);s.closePath();const inner=new T.Path();inner.moveTo(-.425,-.475);inner.lineTo(-.425,.475);inner.lineTo(.425,.475);inner.lineTo(.425,-.475);inner.closePath();s.holes.push(inner);
 const frame=new T.ExtrudeGeometry(s,{depth:.010,steps:1,curveSegments:4,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1}),parts=[frame];frame.translate(0,0,-.005);
 parts.push(chasedRibbon220([[-.035,-.465],[.020,-.25],[-.015,0],[.025,.25],[-.020,.465]],.027,.012,.002));
 for(const y of[-.31,0,.31])for(const sign of[-1,1]){
  const curve=[[-.025,-.10],[-.25,-.125],[-.355,-.015],[-.245,.12],[-.115,.067],[-.16,-.015],[-.238,.014]].map(([x,q])=>[sign*x,y+q]);
  parts.push(chasedRibbon220(curve,.026,.012,.003));
  const vein=[[-.07,-.018],[-.16,.038],[-.245,.12]].map(([x,q])=>[sign*x,y+q]);parts.push(chasedRibbon220(vein,.017,.010,.004));
 }
 const copies=parts.map(g=>g.index?g.toNonIndexed():g.clone()),geometry=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());parts.forEach(g=>g.dispose());geometry.userData.piercedStrap220={normalizedThickness:.014,construction:'Narrow chased curled ribbons with a central flowing stem, six scroll lobes, fine branch veins and a thin open border. Open space shows actual timber; no coarse six-hole plate.'};
 return{geometry,info:geometry.userData.piercedStrap220,dispose(){geometry.dispose();}};
}
