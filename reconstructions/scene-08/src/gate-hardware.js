import * as T from 'three';

// Scene08-local cast metal hardware. All fields, rims, relief leaves, petals,
// rivets and corner shoes are closed solids; no photographed decoration.
const cache=new Map();
function roundRect(w,h,r){
 const s=new T.Shape(),x=w/2,y=h/2;r=Math.min(r,x*.8,y*.8);
 s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);
 s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);
 s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);s.closePath();return s;
}
function cast(shape,thickness=.018,bevel=.005){
 const g=new T.ExtrudeGeometry(shape,{depth:thickness,steps:1,curveSegments:12,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3});
 g.translate(0,0,-thickness/2);g.computeBoundingBox();return g;
}
function frame(w,h,border=.018,thickness=.014){
 const s=roundRect(w,h,Math.min(w,h)*.09),inner=roundRect(w-border*2,h-border*2,Math.min(w,h)*.055);
 const hole=new T.Path(inner.getPoints(12).reverse());s.holes.push(hole);return cast(s,thickness,.004);
}
function petal(length,width){
 const s=new T.Shape();s.moveTo(0,0);s.bezierCurveTo(-width*.60,length*.15,-width*.72,length*.75,0,length);
 s.bezierCurveTo(width*.72,length*.75,width*.60,length*.15,0,0);s.closePath();
 const g=cast(s,.007,.002),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),t=T.MathUtils.clamp(y/length,0,1),dome=Math.sin(t*Math.PI)*Math.max(0,1-(x/(width*.75))**2);p.setZ(i,p.getZ(i)+.005*dome);}
 g.computeVertexNormals();return g;
}
function leaf(length,width){
 const s=new T.Shape();s.moveTo(0,0);
 s.bezierCurveTo(-width*.40,length*.05,-width*.30,length*.22,-width*.80,length*.28);
 s.quadraticCurveTo(-width*.25,length*.28,-width*.62,length*.48);
 s.quadraticCurveTo(-width*.20,length*.44,-width*.43,length*.69);
 s.quadraticCurveTo(-width*.13,length*.66,0,length);
 s.quadraticCurveTo(width*.13,length*.66,width*.43,length*.69);
 s.quadraticCurveTo(width*.20,length*.44,width*.62,length*.48);
 s.quadraticCurveTo(width*.25,length*.28,width*.80,length*.28);
 s.bezierCurveTo(width*.30,length*.22,width*.40,length*.05,0,0);s.closePath();
 const g=cast(s,.008,.002),p=g.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),t=T.MathUtils.clamp(p.getY(i)/length,0,1);p.setZ(i,p.getZ(i)+.008*Math.sin(Math.PI*t)*Math.max(0,1-(x/width)**2));}
 g.computeVertexNormals();return g;
}
function ribbon(points,width=.008){
 const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p,0)),false,'centripetal'),s=new T.Shape(),a=[],b=[];
 for(let i=0;i<=28;i++){const t=i/28,p=c.getPoint(t),d=c.getTangent(t),r=width*(.35+.65*Math.sin(Math.PI*t));a.push([p.x-d.y*r,p.y+d.x*r]);b.push([p.x+d.y*r,p.y-d.x*r]);}
 [...a,...b.reverse()].forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return cast(s,.009,.002);
}
function makeParts(){const parts=[];return {parts,add(g,material='hardwarebrass',p=[0,0,0],rz=0,ry=0){g.rotateZ(rz);g.rotateY(ry);g.translate(...p);parts.push({geometry:g,material});return g;}};}
function rivet(b,x,y,z,r=.014){
 const washer=new T.CylinderGeometry(r*1.22,r*1.22,.006,20);washer.rotateX(Math.PI/2);b.add(washer,'hardwareRecess',[x,y,z]);
 const dome=new T.SphereGeometry(1,16,10);dome.scale(r,r,.007);b.add(dome,'hardwarebrass',[x,y,z+.006]);
}
function chrysanthemum(b,x,y,z,r){
 const seat=new T.CylinderGeometry(r,r,.008,48);seat.rotateX(Math.PI/2);b.add(seat,'hardwareRecess',[x,y,z]);
 const rim=new T.TorusGeometry(r*.97,.006,8,48);b.add(rim,'hardwarebrass',[x,y,z+.007]);
 for(let row=0;row<2;row++){
  const n=row?12:16,rr=row?r*.42:r*.76,base=row?r*.07:r*.13,w=row?r*.16:r*.145;
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(row?.12:0),g=petal(rr,w);b.add(g,'hardwarebrass',[x-Math.sin(a)*base,y+Math.cos(a)*base,z+.010+row*.006],a);}
 }
 const boss=new T.SphereGeometry(1,24,12);boss.scale(r*.20,r*.20,.010);b.add(boss,'hardwarebrass',[x,y,z+.023]);
}

export function createGatePlaque(w=.47,h=1.35){
 const key=`plaque-${w}-${h}`;if(cache.has(key))return cache.get(key);
 const b=makeParts();
 b.add(cast(roundRect(w,h,w*.11),.016,.0045),'hardwarebrass');
 b.add(cast(roundRect(w*.86,h*.94,w*.075),.008,.003),'hardwareRecess',[0,0,.013]);
 b.add(frame(w*.95,h*.975,.017,.010),'hardwarebrass',[0,0,.018]);
 // A narrow raised fillet bounds the cast field and makes the metal's
 // thickness legible at the near grazing camera angle.
 b.add(frame(w*.79,h*.87,.007,.006),'hardwarebrass',[0,0,.024]);
 const r=Math.min(w*.32,h*.20);chrysanthemum(b,0,0,.028,r);
 for(const sy of[-1,1])for(const sx of[-1,1]){
  const px=sx*w*.105,py=sy*h*.115,curve=[[px,py],[sx*w*.30,sy*h*.19],[sx*w*.23,sy*h*.32],[sx*w*.31,sy*h*.39]];
  b.add(ribbon(curve,.006),'hardwarebrass',[0,0,.029]);
  const a=sy<0?Math.PI-sx*.52:sx*.52;
  b.add(leaf(h*.18,w*.115),'hardwarebrass',[sx*w*.17,sy*h*.20,.031],a);
  b.add(leaf(h*.105,w*.075),'hardwarebrass',[sx*w*.28,sy*h*.33,.031],sy<0?Math.PI+sx*.35:-sx*.35);
  rivet(b,sx*w*.35,sy*h*.405,.033,.012);
 }
 for(const sy of[-1,1]){
  const end=new T.SphereGeometry(1,16,8);end.scale(w*.045,h*.026,.009);b.add(end,'hardwarebrass',[0,sy*h*.415,.031]);
 }
 cache.set(key,b.parts);return b.parts;
}

export function createGateColumnShoe(w=.61,d=.64,h=.24){
 const key=`shoe-${w}-${d}-${h}`;if(cache.has(key))return cache.get(key);
 const b=makeParts(),padW=w+.055,padD=d+.055;
 for(const side of[-1,1]){
  const panel=cast(roundRect(padW,h,.022),.016,.004);
  b.add(panel,'hardwarebrass',[0,0,side*(d/2+.012)],0,side<0?Math.PI:0);
  const sidePanel=cast(roundRect(padD,h,.022),.016,.004);
  b.add(sidePanel,'hardwarebrass',[side*(w/2+.012),0,0],0,side*Math.PI/2);
 }
 for(const sy of[-1,1]){
  const s=new T.Shape(),x=padW/2+.008,z=padD/2+.008,t=.013;
  s.moveTo(-x,-z);s.lineTo(x,-z);s.lineTo(x,z);s.lineTo(-x,z);s.closePath();
  const hole=new T.Path();hole.moveTo(-x+t,-z+t);hole.lineTo(-x+t,z-t);hole.lineTo(x-t,z-t);hole.lineTo(x-t,-z+t);hole.closePath();s.holes.push(hole);
  const lip=cast(s,.012,.003);lip.rotateX(Math.PI/2);b.add(lip,'hardwarebrass',[0,sy*h*.43,0]);
 }
 chrysanthemum(b,0,0,d/2+.034,h*.31);
 for(const sx of[-1,1])rivet(b,sx*w*.34,0,d/2+.041,.011);
 cache.set(key,b.parts);return b.parts;
}
