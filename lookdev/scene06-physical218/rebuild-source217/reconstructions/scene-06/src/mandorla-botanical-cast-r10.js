import * as T from 'three';

// Reference-led three-dimensional carved foliage, not a traced bright-pixel
// skeleton. A bearing trunk, broad primary scrolls, subordinate shoots, and
// lobed convex leaves each have an editable solid cross-section and real back.
const TAU=Math.PI*2,clamp=T.MathUtils.clamp;
function finish(p,uv,ix){
 const kept=[];
 for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,ab=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],ac=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]],area=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]);if(area>1e-12)kept.push(ix[i],ix[i+1],ix[i+2]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(kept);g.computeVertexNormals();
 const n=g.attributes.normal,groups=new Map();for(let i=0;i<p.length/3;i++){const key=[p[i*3],p[i*3+1],p[i*3+2]].map(v=>Math.round(v*1e7)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 for(const ids of groups.values())if(ids.length>1){const v=new T.Vector3();for(const i of ids)v.add(new T.Vector3().fromBufferAttribute(n,i));v.normalize();for(const i of ids)n.setXYZ(i,v.x,v.y,v.z);}
 g.userData={closedCarvedShell:true,coincidentNormalsSmoothed:true,mergeUniqueCarving:true,reference6Reconstruction:'r10-fine-curled-flame-palmate-solid-filigree'};return g;
}

function carvedBearing(points,width,depth,taper=.30){
 const c=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),p=[],uv=[],ix=[],rows=72,cols=14;
 for(let j=0;j<=rows;j++){
  const t=j/rows,q=c.getPoint(t),d=c.getTangent(t),len=Math.hypot(d.x,d.y)||1,nx=-d.y/len,ny=d.x/len;
  const cap=j===0||j===rows?0:Math.min(1,Math.sqrt(t/.035),Math.sqrt((1-t)/.035)),w=width*(1-(1-taper)*t)*cap;
  for(let i=0;i<=cols;i++){const a=i/cols*TAU;p.push(q.x+nx*Math.cos(a)*w,q.y+ny*Math.cos(a)*w,q.z+Math.sin(a)*depth*cap*(1-.35*t));uv.push(i/cols,t);if(j<rows&&i<cols){const k=j*(cols+1)+i;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);}}
 }
 return finish(p,uv,ix);
}

function lobedLeaf(base,angle,length,width,bend=.12,depth=.025,lobes=3){
 // Fine flame/palmette carving: a broad keeled central tongue and subordinate
 // returning tongues share a root. Their voids and real rounded sections
 // replace the repeated serrated maple-like outline of R10-03.
 const p=[],uv=[],ix=[];
 const cubic=(a,b,c,d,t)=>{const q=1-t;return q*q*q*a+3*q*q*t*b+3*q*t*t*c+t*t*t*d;};
 function blade(origin,a,L,W,D,curve,turn,rows,cols){
  const direction=new T.Vector2(Math.sin(a),Math.cos(a)),normal=new T.Vector2(direction.y,-direction.x),start=p.length/3,stride=(rows+1)*(cols+1);
  function center(t){
   let forward=t,lateral=curve*Math.sin(Math.PI*t);
   if(t>.70){
    const u=(t-.70)/.30,f0=.70,n0=curve*Math.sin(.70*Math.PI),dy=curve*Math.PI*Math.cos(.70*Math.PI),len=Math.hypot(1,dy);
    forward=cubic(f0,f0+.15/len,.98,.81,u);
    lateral=cubic(n0,n0+.15*dy/len,turn*.22,turn*.24,u);
   }
   return new T.Vector2(origin[0]+L*(direction.x*forward+normal.x*lateral),origin[1]+L*(direction.y*forward+normal.y*lateral));
  }
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   const t=j/rows,u=i/cols*2-1,wave=Math.max(0,Math.sin(Math.PI*t)),cap=wave**.62,c=center(t);
   const ca=center(Math.max(0,t-.002)),cb=center(Math.min(1,t+.002)),tangent=cb.sub(ca).normalize(),across=new T.Vector2(tangent.y,-tangent.x);
   const w=W*cap*(1-.57*t),lens=Math.sqrt(Math.max(0,1-u*u)),thickness=D*cap*(.34+.66*lens),keel=Math.min(.003,W*.16)*Math.exp(-Math.pow(u/.23,2))*wave;
   const z=origin[2]+L*(.018*Math.sin(Math.PI*t)+.045*t*t)+(side===0?thickness*.82+keel:-thickness*.55);
   p.push(c.x+across.x*w*u,c.y+across.y*w*u,z);uv.push(i/cols,t);
   if(j<rows&&i<cols){const k=start+side*stride+j*(cols+1)+i;side===0?ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1):ix.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2);}
  }
  const loop=[];for(let i=0;i<cols;i++)loop.push(i);for(let j=0;j<rows;j++)loop.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)loop.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)loop.push(j*(cols+1));
  for(let k=0;k<loop.length;k++){const a=start+loop[k],b=start+loop[(k+1)%loop.length];ix.push(a,b+stride,b,a,a+stride,b+stride);}
 }
 const turn=Math.sign(bend)||1;
 blade(base,angle,length,width*.72,depth*.88,bend*.72,turn,22,10);
 const direction=new T.Vector2(Math.sin(angle),Math.cos(angle)),root=[base[0]+direction.x*length*.055,base[1]+direction.y*length*.055,base[2]-.002];
 for(const side of lobes>=3?[-1,1]:[turn]){
  blade(root,angle+side*(.44+.035*(lobes-2)),length*(side===turn?.60:.66),width*.40,depth*.72,bend*.45,-side,16,8);
 }
 return finish(p,uv,ix);
}

export function buildBotanicalMandorla(b,{height,halfWidth,headCenter,isMain}){
 const scale=height/4.52,stemDepth=.020*scale,add=(g,tag,mat='gold')=>b.add(b.geometry('r10-botanical:'+isMain+':'+tag,()=>g),mat);
 const outline=t=>halfWidth*Math.max(0,Math.sin(Math.PI*clamp(t,0,1)))**.72;
 add(carvedBearing([[0,.04,-.055],[0,height*.28,-.045],[.012*scale,height*.59,-.025],[0,height*.90,-.012],[0,height,0]],.050*scale,.028*scale,.26),'bearing-trunk','oldgold');
 let leaves=0,shoots=0;
 for(const side of[-1,1]){
  const levels=[.13,.25,.38,.51,.64,.76,.86];
  for(let k=0;k<levels.length;k++){
   const t=levels[k],end=Math.min(.965,t+.15),w=outline(end)*.84,y0=height*t,y1=height*end;
   const ps=[[side*.018*scale,y0,-.042],[side*w*.38,y0+height*.035,-.028],[side*w*.83,y0+height*.105,-.006],[side*w,y1,0]];
   if(t<.70)ps.push([side*w*.87,y1+height*.018,.018]);
   const branch=new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p)),false,'centripetal');
   add(carvedBearing(ps,(.040-.012*t)*scale,stemDepth,.37),'primary-scroll-'+side+'-'+k);
   for(let j=0;j<6;j++){
    const s=.16+j*.14,q=branch.getPoint(s),d=branch.getTangent(s),baseAngle=Math.atan2(d.x,d.y);
    const length=(.205+.060*Math.sin(k*1.3+j*.8))*scale*(1-.20*t),spread=(j===1?-.40:.58)*side;
    const a=baseAngle+spread,tip=[q.x+Math.sin(a)*length,q.y+Math.cos(a)*length,q.z+.028*scale];
    const curl=[[q.x,q.y,q.z-.006],[q.x+(tip[0]-q.x)*.62-side*.055*scale,q.y+(tip[1]-q.y)*.58,q.z+.005],[tip[0],tip[1],tip[2]],[tip[0]-side*.045*scale,tip[1]+.050*scale,tip[2]+.005]];
    add(carvedBearing(curl,.014*scale,.011*scale,.28),`shoot-${side}-${k}-${j}`);shoots++;
    for(const flip of[-1,1]){
     const anchor=[q.x+(tip[0]-q.x)*.52,q.y+(tip[1]-q.y)*.52,q.z+.010*scale],leafAngle=a+flip*.63;
     add(lobedLeaf(anchor,leafAngle,length*(.67+.06*j),(.035+.008*(j%2))*scale,flip*.14,.009*scale,3),`lobed-leaf-${side}-${k}-${j}-${flip}`);leaves++;
    }
    add(lobedLeaf(tip,a-side*.18,length*.65,.032*scale,-side*.12,.009*scale,2),`terminal-leaf-${side}-${k}-${j}`);leaves++;
   }
   const q=branch.getPoint(.91),a=Math.atan2(branch.getTangent(.91).x,branch.getTangent(.91).y)+side*.18;
   add(lobedLeaf(q.toArray(),a,.22*scale,.044*scale,-side*.10,.011*scale,4),`outer-flame-leaf-${side}-${k}`);leaves++;
  }
  // A coherent inner/outer foliate band fills the lateral almond field.
  // This is the carved openwork of the reference, rather than bare garden
  // branches carrying a few flowers at their ends.
  for(const f of[.60,.84]){
   const ps=[];for(let j=0;j<=24;j++){const t=.035+j/24*.94;ps.push([side*outline(t)*f,height*t,-.012]);}
   add(carvedBearing(ps,(f>.7?.023:.017)*scale,.014*scale,.65),'peripheral-bearing-'+side+'-'+f);
  }
  for(let k=0;k<16;k++){
   const t=.09+k*.052,at=(dy,f,z=.008)=>[side*outline(t+dy)*f,height*(t+dy),z*scale];
   const ps=[at(0,.82,-.008),at(.025,.97),at(.054,.92,.014),at(.059,.72,.020),at(.039,.68,.022)];
   const c=new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p)),false,'centripetal');
   add(carvedBearing(ps,.019*scale,.012*scale,.38),'foliate-volute-'+side+'-'+k);shoots++;
   for(let j=0;j<4;j++){
    const q=c.getPoint(.22+j*.21),d=c.getTangent(.22+j*.21),a=Math.atan2(d.x,d.y),size=scale*(.70+.30*outline(t)/halfWidth);
    for(const flip of[-1,1]){
     add(lobedLeaf(q.toArray(),a+flip*.57,(.14+.025*(j%2))*size,(.034+.006*(k%2))*size,flip*.15,.010*size,3),`peripheral-lobed-leaf-${side}-${k}-${j}-${flip}`);leaves++;
    }
   }
  }
 }
 // Small axial flame leaves join the upper scrolls into the pointed crown;
 // the reference has a continuous carved finial, not two bare antler loops.
 for(let k=0;k<7;k++)for(const side of[-1,1]){
  const t=.68+k*.043;
  add(lobedLeaf([side*.027*scale,height*t,-.004],side*(.25+.05*Math.sin(k)),(.22+.025*Math.sin(k*.9))*scale,.047*scale,-side*.10,.010*scale,3),'axial-finial-leaf-'+side+'-'+k);leaves++;
 }
 // At the apex the two foliate sides meet in a carved lotus/flame finial.
 for(let k=-2;k<=2;k++)add(lobedLeaf([k*.022*scale,height-.28*scale,.010],k*.24,.29*scale,.040*scale,-k*.035,.011*scale,3),'apex-leaf-'+k);
 b.root.userData.botanicalMandorlaR10??=[];b.root.userData.botanicalMandorlaR10.push({height,halfWidth,headCenter,isMain,primaryScrolls:14,secondaryShoots:shoots,lobedLeaves:leaves+5,realClosedVolumes:true,leafForm:'R10-04 fine keeled flame/palmette tongues with returning curled tips and real open voids on the retained bearing scaffold',source:'Source-photo botanical hierarchy, editable 3D interpretation; no traced pixel skeleton or surface image.',visualAccepted:false});
}
