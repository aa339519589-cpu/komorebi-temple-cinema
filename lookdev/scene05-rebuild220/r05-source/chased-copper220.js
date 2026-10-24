import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

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
 const sleeve=ring(1,1,.018,.17);add(sleeve,'fittingCopper',[0,0,-.077]);
 let field;
 if(lower){field=new T.Shape();field.moveTo(-.32,-.085);field.bezierCurveTo(-.38,.04,-.23,.155,-.15,.075);field.bezierCurveTo(-.12,.26,.10,.28,.15,.10);field.bezierCurveTo(.25,.18,.39,.065,.32,-.07);field.bezierCurveTo(.18,-.15,.10,-.18,0,-.12);field.bezierCurveTo(-.13,-.18,-.23,-.14,-.32,-.085);field.closePath();}
 else field=rect(.944,.944,.027);
 add(cast(field,.020,.0015),'fittingPatina',[0,0,.004]);
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
  const count=small?8:16;
  for(let k=0;k<count;k++){
   const a=k*Math.PI*2/count,p=new T.Shape(),L=k%2?.265:.285,w=small?.022:.0145;
   p.moveTo(-w*.35,.058);p.bezierCurveTo(-w*1.25,.12,-w,.058+L*.72,0,.058+L);p.bezierCurveTo(w,.058+L*.72,w*1.25,.12,w*.35,.058);p.quadraticCurveTo(0,.082,-w*.35,.058);p.closePath();hole(mask,p,a);
  }
 }
 if(!lower&&!small)for(let k=0;k<4;k++){const a=k*Math.PI/2;hole(mask,scroll,a,.60,[.32*Math.cos(a)-.32*Math.sin(a),.32*Math.sin(a)+.32*Math.cos(a)]);}
 add(cast(mask,.010,.0008),'fittingEdge',[0,0,.019]);
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
  const band=rect(.90,.135,.006);
  for(const x of[-.30,-.10,.10,.30]){const cut=new T.Shape();cut.moveTo(-.020,-.032);cut.bezierCurveTo(-.040,-.005,-.015,.025,.014,.032);cut.lineTo(.022,.016);cut.quadraticCurveTo(-.014,.002,-.020,-.032);cut.closePath();hole(band,cut,0,1,[x,0]);}
  const g=cast(band,.009,.0008);g.rotateX(-Math.PI/2);g.translate(0,.502,-.068);g.rotateZ(side*Math.PI/2);add(g,'fittingCopper');
 }
 const parts=[];
 for(const [material,input]of bins){const copies=input.map(g=>g.index?g.toNonIndexed():g.clone()),geometry=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());owned.add(geometry);geometry.userData.chasedCopper220={type,variant,engraving:'Finite pierced face masks over finite floor; actual recessed channels, double rim, folded returns and struck rivets'};parts.push({geometry,material});}
 return{parts,info:{revision:'220-r05',type,variant,construction:'Authored chased metal with actual shallow incised fields, fine double border, riveted folded edges and engraved return plates. Lower cloud applique exposes actual timber end grain; no generic domed leaf cluster.',reference:'HD05 visible end-boot anatomy; motif details inferred, not a historical-pattern attribution',photoTexture:false,newExternalMesh:false},dispose(){for(const g of owned)g.dispose();}};
}

export function createPiercedStrap220(){
 const s=new T.Shape();s.moveTo(-.44,-.50);s.lineTo(.36,-.50);s.quadraticCurveTo(.49,-.46,.45,-.34);s.lineTo(.45,.46);s.quadraticCurveTo(.40,.50,.30,.48);s.lineTo(-.42,.48);s.closePath();
 const pockets=[[-.24,-.34,.18,.16],[-.22,-.04,.17,.19],[-.23,.27,.17,.17],[.20,-.31,.16,.18],[.22,.00,.18,.18],[.20,.29,.16,.16]];
 for(const [x,y,w,h]of pockets){const p=new T.Path();p.moveTo(x-w*.65,y-h*.72);p.bezierCurveTo(x-w,y+h*.45,x+w*.80,y+h,x+w*.55,y+.01);p.bezierCurveTo(x+w*.25,y-h*.65,x-w*.25,y-h*.60,x-w*.65,y-h*.72);p.closePath();s.holes.push(p);}
 const geometry=new T.ExtrudeGeometry(s,{depth:.010,steps:1,curveSegments:10,bevelEnabled:true,bevelThickness:.0015,bevelSize:.0015,bevelSegments:1});geometry.translate(0,0,-.005);geometry.userData.piercedStrap220={normalizedThickness:.010,construction:'Pierced flowing pockets and narrow surviving foliate strands in an actual thin metal sheet; visible wood through holes'};
 return{geometry,info:geometry.userData.piercedStrap220,dispose(){geometry.dispose();}};
}
