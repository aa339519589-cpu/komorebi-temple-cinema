import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Editable carved wood / gilt interpretation of the supplied sanctuary.
// The reliefs below are closed volumes with a back and convex carved face.
// No source photograph, image displacement or camera-facing surface is used.
const TAU=Math.PI*2, clamp=T.MathUtils.clamp;

function roundedSweep(points,radii,radial=10,segments=48,flatten=1){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal'),frames=curve.computeFrenetFrames(segments,false);
 const p=[],uv=[],ix=[];
 for(let j=0;j<=segments;j++){
  const t=j/segments,q=curve.getPoint(t),k=Math.min(radii.length-2,Math.floor(t*(radii.length-1))),f=t*(radii.length-1)-k,r=T.MathUtils.lerp(radii[k],radii[k+1],f);
  for(let i=0;i<=radial;i++){
   const a=i/radial*TAU,v=frames.normals[j].clone().multiplyScalar(Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r*flatten).add(q);
   p.push(v.x,v.y,v.z);uv.push(i/radial,t);
   if(j<segments&&i<radial){const a=j*(radial+1)+i,b=a+radial+1;ix.push(a,a+1,b,a+1,b+1,b);}
  }
 }
 for(const end of[0,1]){
  const q=curve.getPoint(end),ci=p.length/3,base=end*segments*(radial+1);p.push(q.x,q.y,q.z);uv.push(.5,end);
  for(let i=0;i<radial;i++)end?ix.push(ci,base+i,base+i+1):ix.push(ci,base+i+1,base+i);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.mergeUniqueCarving=true;return g;
}

// Folded flame/palmette leaf: lobed outside edge, deep central rib, returned
// hollow margins and a thick root. The backside is part of the same solid.
function flameBlade(lobes=3,turn=1){
 const rows=30,cols=14,p=[],uv=[],ix=[],stride=(rows+1)*(cols+1);
 for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,wave=Math.sin(Math.PI*t),envelope=Math.pow(Math.max(.0001,wave),.68);
  const lobing=1+.16*Math.sin((t*lobes-.12)*TAU)*Math.pow(Math.sin(Math.PI*t),.6);
  const w=.43*envelope*lobing*(1-.48*t),x=u*w+turn*.18*t*t*t;
  const y=t-.13*Math.pow(t,5)*Math.abs(u)+.025*Math.sin(t*9+turn)*u;
  const broad=.105*envelope*Math.pow(Math.max(0,1-u*u),.65),rib=.035*Math.exp(-Math.pow(u/.18,2))*wave;
  const curl=.09*t*t+.06*Math.pow(Math.abs(u),5)*wave;
  p.push(x,y,curl+(skin===0?broad+rib+.013:-.020-.033*envelope));uv.push(i/cols,t);
  if(j<rows&&i<cols){const a=skin*stride+j*(cols+1)+i;skin===0?ix.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1):ix.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
 }
 const edge=[];for(let i=0;i<cols;i++)edge.push(i);for(let j=0;j<rows;j++)edge.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)edge.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)edge.push(j*(cols+1));
 for(let k=0;k<edge.length;k++){const a=edge[k],b=edge[(k+1)%edge.length];ix.push(a,b+stride,b,a,a+stride,b+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();g.userData.closedCarvedShell=true;return g;
}

function addBlade(b,tag,p,length,width,angle,turn=1,material='gold',depth=1,lobes=3){
 const g=b.geometry('altar-v3-palmette-'+lobes+'-'+turn,()=>flameBlade(lobes,turn));
 b.add(g,material,...p,width,length,depth,0,0,-angle);
}
function addStem(b,tag,ps,r,material='gold',flatten=.68){
 b.add(b.geometry('altar-v3-stem:'+tag,()=>roundedSweep(ps,[r*.98,r,r*.76,r*.16],10,Math.max(20,ps.length*9),flatten)),material);
}

function palmette(b,tag,position,angle,length,width,turn=1,depth=.85){
 const direction=new T.Vector3(Math.sin(angle),Math.cos(angle),0),across=new T.Vector3(direction.y,-direction.x,0),origin=new T.Vector3(...position);
 const local=(s,q=0,z=0)=>origin.clone().addScaledVector(direction,s*length).addScaledVector(across,q*width).add(new T.Vector3(0,0,z)).toArray();
 addStem(b,tag,[[...position],local(.35,turn*.08,.014),local(.72,turn*.16,.027),local(.96,turn*.26,.038)],.022*width/.18,'gold',.62);
 addBlade(b,tag+'-tip',local(.42,turn*.06,.012),length*.62,width*.70,angle+turn*.14,turn,'gold',depth);
 for(let j=0;j<2;j++)for(const side of[-1,1]){
  const t=.08+j*.18;
  addBlade(b,tag+'-'+j+'-'+side,local(t,side*.035,.009),length*(.57-.075*j),width*(.61-.045*j),angle+side*(.61+.12*j),side,'gold',depth*(.92+.10*j));
 }
}

export function buildMonumentalMandorla(b,{height:H,halfWidth:W,headCenter:cy,isMain}){
 const s=H/4.52,outline=t=>W*Math.pow(Math.max(0,Math.sin(Math.PI*clamp(t,0,1))),.70);
 // Thick paired backing rails at three real depths. The central bearing
 // enters the lotus pedestal; the rear rail supports every openwork branch.
 addStem(b,'axial-'+isMain,[[0,0,-.12],[0,H*.36,-.10],[0,H*.73,-.08],[0,H,-.025]],.067*s,'oldgold');
 for(const side of[-1,1]){
  for(const [layer,f,z,r]of[[0,.82,-.11,.040],[1,.95,-.020,.029],[2,.60,.075,.028]]){
   const ps=[];for(let j=0;j<=32;j++){const t=.02+j/32*.965;ps.push([side*outline(t)*f,H*t,z+.016*Math.sin(t*7)]);}
   addStem(b,`rail-${isMain}-${side}-${layer}`,ps,r*s,layer===0?'oldgold':'gold');
  }
  // Rooted, curled scrolls. Each scroll returns to a bearing rail. The
  // changing leaf scale and over/under depth avoid a regular branch grid.
  for(let k=0;k<13;k++){
   const t=.070+k*.065,a=t+.056,w=outline(t),outer=outline(a),y=H*t,dy=H*.071;
   const z=.022+.024*Math.sin(k*1.7+side*.5),r=(.030-.006*t)*s;
   const ps=[[side*w*.60,y,-.03],[side*w*.90,y+dy*.20,z],[side*outer*1.015,y+dy*.79,z+.035],[side*outer*.91,y+dy*1.12,z+.065],[side*outer*.74,y+dy*.92,z+.072],[side*outer*.77,y+dy*.64,z+.062]];
   addStem(b,`volute-${isMain}-${side}-${k}`,ps,r,'gold',.67);
   const c=new T.CatmullRomCurve3(ps.map(p=>new T.Vector3(...p)),false,'centripetal');
   for(let j=0;j<3;j++){
    const q=c.getPoint(.18+j*.23),d=c.getTangent(.18+j*.23),theta=Math.atan2(d.x,d.y),L=(.24+.028*Math.sin(k*1.71+j*.8))*s;
    palmette(b,`${isMain}-${side}-${k}-${j}`,q.toArray(),theta+side*(j===0?.48:.17),L,.11*s,side,.56*s);
   }
   const q=c.getPoint(.84);addBlade(b,'outer-finial',q.toArray(),(.23+.055*Math.sin(k*.8))*s,.115*s,side*(.34+.3*t),side,'gold',.64*s,4);
  }
  // Broad lower inner scrolls are visible around shoulders and knees.
  // Their deep relief reads as carved wood rather than wire geometry.
  for(let k=0;k<6;k++){
   const t=.10+k*.104,y=H*t,edge=outline(t+.06)*.70;
   const ps=[[side*.035,y-.06,-.065],[side*edge*.32,y+.06,-.025],[side*edge*.82,y+.20,.10],[side*edge,y+.39,.13],[side*edge*.76,y+.43,.13],[side*edge*.68,y+.33,.11]];
   addStem(b,`inner-scroll-${isMain}-${side}-${k}`,ps,.039*s,'oldgold',.65);
   for(let j=0;j<3;j++)palmette(b,`inner-${isMain}-${side}-${k}-${j}`,[side*edge*(.30+j*.22),y+.06+j*.11,.12],side*(.7-j*.23),(.27+.04*(j%2))*s,.13*s,side,.68*s);
  }
  // A second, smaller scale of carved cloud spirals connects the large
  // volutes across the almond field. Each has an over/under depth and a
  // returned terminal, so the visible openwork is a network of real scrolls.
  for(let row=0;row<17;row++)for(let band=0;band<3;band++){
   const t=.095+row*.048+(band%2)*.014,xx=side*outline(t)*(.43+band*.23),yy=H*t,z=.015+band*.046;
   const L=(.19+.035*Math.sin(row*1.9+band+side*.3))*s,sg=(row+band)%2?side:-side;
   const ps=[[xx-side*.045*s,yy-.030*s,z-.035],[xx+side*L*.44,yy+L*.10,z],[xx+side*L*.52,yy+L*.74,z+.028],[xx-side*L*.14,yy+L*.97,z+.040],[xx-side*L*.32,yy+L*.43,z+.030],[xx+side*L*.04,yy+L*.34,z+.017]];
   addStem(b,`lace-${isMain}-${side}-${row}-${band}`,ps,.0125*s,band===0?'oldgold':'gold',.82);
   addBlade(b,'lace-terminal',[xx+side*L*.03,yy+L*.35,z+.025],L*.65,.070*s,sg*.70,sg,'gold',.44*s,3);
   addBlade(b,'lace-root',[xx+side*L*.30,yy+L*.10,z+.005],L*.62,.068*s,-side*.35,-side,'gold',.40*s,2);
  }
 }
 // Crown: seven pierced, interlocking tongues with a tall axial finial.
 for(let k=-3;k<=3;k++)palmette(b,'crown-'+isMain+'-'+k,[k*.065*s,H-(.37+.025*Math.abs(k))*s,.045],k*.27,(.36-.035*Math.abs(k))*s,.12*s,Math.sign(k)||1,.68*s);

 // A solid lacquered nimbus supports chased radial ornament. Only the
 // photographed head wheel has a dark backing; the outside stays open.
 const R=(isMain?.665:.37)*s,inner=R*.78;
 const nimbus=b.geometry('v3-nimbus-disk-'+isMain,()=>new T.CylinderGeometry(1,1,1,96).rotateX(Math.PI/2));
 b.add(nimbus,'haloLacquer',0,cy,-.035,R,R,.035);
 for(const [r,tube,z,mat]of[[R*.78,.013*s,.055,'gold'],[R*.94,.021*s,.056,'oldgold'],[R,.012*s,.071,'gold']])b.torus(0,cy,z,r,tube,mat);
 const spokes=isMain?72:48;
 for(let k=0;k<spokes;k++){
  const a=k/spokes*TAU,ps=[[Math.sin(a)*inner,cy+Math.cos(a)*inner,.062],[Math.sin(a+.008)*R*.92,cy+Math.cos(a+.008)*R*.92,.084],[Math.sin(a)*R*.985,cy+Math.cos(a)*R*.985,.070]];
  addStem(b,'wheel-chase-'+isMain+'-'+k,ps,.006*s,'gold',.8);
 }
 const fanR=R*(isMain?1.52:1.43),n=isMain?31:23;
 for(let k=0;k<n;k++){
  const a=-Math.PI*.58+k/(n-1)*Math.PI*1.16,ps=[[Math.sin(a)*R,cy+Math.cos(a)*R,.012],[Math.sin(a-.018)*fanR*.85,cy+Math.cos(a-.018)*fanR*.85,-.008],[Math.sin(a)*fanR,cy+Math.cos(a)*fanR,-.025]];
  addStem(b,'radial-'+isMain+'-'+k,ps,.014*s,'gold',.65);
  if(k%2===0)palmette(b,'wheel-flame-'+isMain+'-'+k,ps.at(-1),a,(isMain?.24:.17)*s,(isMain?.105:.085)*s,Math.sign(a)||1,.62*s);
 }
 const arc=[];for(let k=0;k<=64;k++){const a=-Math.PI*.58+k/64*Math.PI*1.16;arc.push([Math.sin(a)*fanR,cy+Math.cos(a)*fanR,-.025]);}addStem(b,'radial-outer-arch-'+isMain,arc,.018*s,'oldgold');
 b.root.userData.monumentalMandorlaV3??=[];b.root.userData.monumentalMandorlaV3.push({height:H,halfWidth:W,isMain,layers:3,construction:'Closed relief leaves, curled palmette volutes and three real-depth bearing rails; solid chased head wheel; rooted at pedestal.',visualAccepted:false});
}

export function sculptedDragonRelief(width,height,variant=0,direction=1){
 const parts=[],h=height,w=width,d=direction||1,originZ=.010;
 function ball(x,y,z,rx,ry,rz){parts.push(new T.SphereGeometry(1,18,12).scale(rx,ry,rz).translate(x*d,y,z));}
 function tube(ps,rr,flat=.72){parts.push(roundedSweep(ps.map(p=>[p[0]*d,p[1],p[2]]),rr,10,Math.max(24,ps.length*8),flat));}
 const phase=(variant%3-1)*.025;
 const body=[[-w*.40,-h*(.08+phase),originZ],[-w*.28,h*(.24+phase),h*.10],[-w*.10,-h*(.13-phase),h*.12],[w*.08,h*(.16+phase),h*.12],[w*.24,h*.12,h*.13]];
 tube(body,[h*.045,h*.115,h*.135,h*.14,h*.13],.90);
 // The snout, brow and cheek are actual projecting rounded carved forms.
 ball(w*.27,h*.15,h*.11,h*.19,h*.19,h*.115);ball(w*.38,h*.12,h*.12,h*.20,h*.10,h*.13);
 ball(w*.30,h*.25,h*.17,h*.10,h*.055,h*.07);ball(w*.32,h*.19,h*.23,h*.025,h*.027,h*.018);
 ball(w*.39,h*.08,h*.12,h*.13,h*.037,h*.07);
 tube([[w*.23,h*.30,h*.13],[w*.19,h*.43,h*.11],[w*.27,h*.37,h*.09]],[h*.035,h*.026,h*.004]);
 tube([[w*.31,h*.31,h*.13],[w*.34,h*.47,h*.10],[w*.39,h*.40,h*.08]],[h*.035,h*.024,h*.003]);
 for(const side of[-1,1])tube([[w*.38,h*.13,h*.19],[w*.45,h*(.14+side*.1),h*.20],[w*.47,h*(.31+side*.1),h*.17],[w*.41,h*(.35+side*.1),h*.15]],[h*.018,h*.016,h*.010,h*.002]);
 const curve=new T.CatmullRomCurve3(body.map(p=>new T.Vector3(...p)),false,'centripetal');
 for(let k=0;k<18;k++){
  const t=.10+k*.043,q=curve.getPoint(t),tg=curve.getTangent(t),a=Math.atan2(tg.x,tg.y);
  const scale=new T.SphereGeometry(1,10,6).scale(h*.065,h*.040,h*.025).rotateZ(-a+.3*Math.sin(k)).translate(q.x*d,q.y,q.z+h*.09);parts.push(scale);
  if(k%2===0){const blade=flameBlade(2,k%4?1:-1);blade.scale(h*.15,h*.20,h*.30);blade.rotateZ(-a-.8);blade.translate(q.x*d,q.y+h*.06,q.z);parts.push(blade);}
 }
 // Four joined clawed limbs curl away from the sinuous spine.
 for(let k=0;k<4;k++){
  const q=curve.getPoint(.18+k*.18),sign=k%2?1:-1,end=[q.x+w*.07,q.y+sign*h*.23,h*.07];
  tube([[q.x,q.y,q.z],[q.x+w*.035,q.y+sign*h*.12,h*.14],end],[h*.055,h*.043,h*.025]);
  for(let j=-1;j<=1;j++)tube([end,[end[0]+w*.035,end[1]+j*h*.045,h*.11],[end[0]+w*.07,end[1]+j*h*.07+sign*h*.04,h*.08]],[h*.023,h*.017,h*.002]);
 }
 // Pierced cloud scrolls around the creature, each with a convex leaf face.
 for(let k=0;k<7;k++){
  const cx=-w*.40+k*w*.12,cy=(k%2?-.30:.30)*h,sg=k%2?-1:1;
  tube([[cx-w*.045,cy-h*.05,h*.01],[cx,cy+sg*h*.09,h*.05],[cx+w*.060,cy+sg*h*.08,h*.07],[cx+w*.071,cy,h*.08],[cx+w*.035,cy-sg*h*.035,h*.06]],[h*.022,h*.029,h*.026,h*.004]);
  const leaf=flameBlade(3,sg);leaf.scale(h*.31,h*.43,h*.52);leaf.rotateZ(sg*.95);leaf.translate(cx*d,cy,h*.02);parts.push(leaf);
 }
 const normalized=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(normalized,false);for(const p of parts)p.dispose();for(const p of normalized)p.dispose();g.setIndex(Array.from({length:g.attributes.position.count},(_,i)=>i));g.userData.mergeUniqueCarving=true;g.userData.reference6Reconstruction='v3-sculpted-dragon-cloud-relief-closed-volumes';return g;
}

export function buildMonumentalAltarAccents(b,layout){
 // Deep gilt corner brackets wrap the cabinet returns and carry the ledges.
 const rows=[{y:.93,z:1.55,w:layout.carvedFrontWidths[0]},{y:1.29,z:1.40,w:layout.carvedFrontWidths[1]},{y:1.65,z:1.25,w:layout.carvedFrontWidths[2]}];
 for(const [rowIndex,row]of rows.entries())for(const side of[-1,1]){
  const x=side*(row.w/2-.11);
  addStem(b,'cabinet-knee-'+rowIndex+'-'+side,[[x,row.y-.15,row.z-.12],[x-side*.025,row.y-.08,row.z+.020],[x-side*.10,row.y+.045,row.z+.13],[x-side*.20,row.y+.09,row.z+.09]],.024,'gold',1.25);
  palmette(b,'cabinet-lobe-'+rowIndex+'-'+side,[x-side*.17,row.y-.07,row.z+.08],side*.85,.18,.095,side,.43);
 }
 // Sculpted lotus rosettes and rolled mouldings break the long cabinet bands.
 for(const side of[-1,1])for(let k=0;k<4;k++){
  const x=side*(.48+k*.48),y=2.21,z=.98;
  for(let j=0;j<7;j++){const a=j/7*TAU;addBlade(b,'altar-lotus-boss',[x+Math.sin(a)*.012,y+Math.cos(a)*.012,z+.016],.067,.034,a,j%2?1:-1,'gold',.30,2);}
  b.ball(x,y,z+.041,.020,.020,.015,'gold');
 }
 b.root.userData.monumentalAltarV3={deepCabinetBrackets:true,handAuthoredDragonReliefs:true,visualAccepted:false};
}

function naturalLeaf(){
 const g=new T.SphereGeometry(1,20,16),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const t=(p.getY(i)+1)/2,x=p.getX(i),z=p.getZ(i);
  p.setXYZ(i,x*.45*(1-.28*t),t,z*.021+.10*Math.sin(Math.PI*t)+.12*t*t);
 }
 g.computeVertexNormals();return g;
}
function fivePetalFlower(){
 const parts=[];
 for(let k=0;k<5;k++){
  const a=k/5*TAU,g=new T.SphereGeometry(1,14,10).scale(.024,.047,.010);
  g.rotateX(-.30);g.translate(0,.037,.012);g.rotateZ(a);parts.push(g);
 }
 const g=mergeGeometries(parts,false);for(const p of parts)p.dispose();return g;
}
export function buildMonumentalFlowers(b,layout){
 const leaf=b.geometry('v3-living-folded-offering-leaf',naturalLeaf),flower=b.geometry('v3-closed-five-cupped-white-petals',fivePetalFlower);
 const random=n=>{const q=Math.sin(n*127.1+42.7)*43758.5453;return q-Math.floor(q);};
 for(const side of[-1,1]){
  // A different handed fan on each side keeps the actual plants asymmetric.
  for(const [kind,x,y,z,L]of[['floor',side*layout.floorVaseX,layout.floorContactY+1.00,1.90,.65],['upper',side*layout.upperVaseX,layout.upperVaseY+.407,layout.upperVaseZ,.47]]){
   const count=kind==='floor'?45:33;
   for(let k=0;k<count;k++){
    const a=k*2.39996+side*.31,jitter=random(k*13+side*17+(kind==='floor'?91:13)),len=L*(.52+.48*jitter),lean=.55+random(k*29+side*7)*1.03;
    b.withTransform(x,y-.014,z,1,()=>{
     b.add(leaf,'foliage',0,0,0,.20+.10*jitter,len,len,lean,0,.05*Math.sin(k*1.7));
    },a);
   }
   const stems=kind==='floor'?11:5;
   for(let k=0;k<stems;k++){
    const r=random(k*19+side*31),a=k*2.39996+side*.4,spread=(kind==='floor'?.55:.29)*Math.sqrt(r),xx=x+Math.sin(a)*spread,zz=z+Math.cos(a)*spread*.43;
    const yy=y+(kind==='floor'?.60:.35)+(kind==='floor'?.98:.27)*random(k*17+side*23)+(side<0?.07:0);
    const ps=[[x,y-.025,z],[x+(xx-x)*.25,y+(yy-y)*.35,z+(zz-z)*.22],[xx-(xx-x)*.17,yy-.17,zz],[xx,yy,zz]];
    addStem(b,'living-flower-'+kind+'-'+side+'-'+k,ps,kind==='floor'?.0055:.0038,'flowerStem',1);
    const nodes=kind==='floor'?3:2;
    for(let j=0;j<nodes;j++){
     const f=.60+j*.12,px=T.MathUtils.lerp(x,xx,f),py=T.MathUtils.lerp(y,yy,f),pz=T.MathUtils.lerp(z,zz,f),sg=j%2?-1:1;
     const end=[px+side*sg*.10,py+.07,pz+.025];
     addStem(b,'living-bud-branch-'+kind+'-'+side+'-'+k+'-'+j,[[px,py,pz],[end[0],end[1]-.025,end[2]],end],.0027,'flowerStem',1);
     const sz=(kind==='floor'?.60:.46)+.30*random(k*41+j*17+side*3);
     b.add(flower,'ivory',...end,sz,sz,sz,.18*Math.sin(k),side*.32,.6*Math.sin(j+k*.8));
     b.ball(end[0],end[1],end[2]+.020,.010*sz,.010*sz,.008*sz,'pollen');
     if(j<2)b.withTransform(px,py-.12,pz,1,()=>b.add(leaf,'foliage',0,0,0,.18,.29,.30,.55,0,sg*.45),a+sg*.70);
    }
    b.add(flower,'ivory',xx,yy,zz,.78,.78,.78,0,side*.36,.6*Math.sin(k*1.6));
    b.ball(xx,yy,zz+.020,.009,.009,.007,'pollen');
   }
  }
 }
 b.root.userData.offeringFlowersV3={construction:'Closed bent leaves and cupped white flower petals on fully rooted, irregular branched stems; floor and upper vessels have different masses.',visualAccepted:false};
}
