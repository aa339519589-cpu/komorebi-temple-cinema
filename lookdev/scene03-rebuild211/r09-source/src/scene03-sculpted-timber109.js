// Authored volumetric carving. No photograph, image-height field or texture
// replacement supplies these closed scroll-bearing and portal prototypes.
export function createSculptedTimber109(T,keep=g=>g){
 const cache=new Map();
 function solid(p,uv,ids,name,description){
  let volume=0;for(let i=0;i<ids.length;i+=3){const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}
  if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name=name;g.userData={closedWoodSolid:true,authoredRelief:true,referenceRGB:false,description};keep(g);return g;
 }
 // Lofted through forty-eight changing sections. The lower cheek is canted
 // inward and each tip swells after a narrow throat; no side is a flat
 // constant-depth extrusion. Shallow cheek channels are cut into the wood.
 function cantileverArm(length,depth,rank=0){
  const key=`arm-${length}-${depth}-${rank}`;if(cache.has(key))return cache.get(key);
  const rows=64,sides=32,p=[],uv=[],ids=[];
  for(let j=0;j<=rows;j++){
   const u=-1+2*j/rows,e=Math.abs(u),x=u*length/2,top=.135+.070*e**7;
   const bottom=-.385+.32*e**1.65-.065*Math.exp(-(((e-.73)/.12)**2))+.075*e**12;
   const half=(top-bottom)/2,mid=(top+bottom)/2;
   const dz=depth/2*(1-.24*Math.exp(-(((e-.68)/.20)**2))-.10*e**8);
   for(let k=0;k<sides;k++){
    const a=k/sides*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),v=Math.sign(sa)*Math.abs(sa)**.38;
    const yy=mid+half*v,cant=.83+.17*(v+1)/2;
    const chisel=.016*Math.sin((e-.16)*Math.PI*5.5+rank*.27)*Math.exp(-(((v+.14)/.62)**2))*(1-e**10);
    const zz=Math.sign(ca)*(dz*cant*Math.abs(ca)**.38+chisel*Math.abs(ca)**8);
    p.push(x,yy,zz);uv.push(x,k/sides);
   }
  }
  for(let j=0;j<rows;j++)for(let k=0;k<sides;k++){const a=j*sides+k,b=j*sides+(k+1)%sides,c=a+sides,d=b+sides;ids.push(a,b,c,b,d,c);}
  const n=p.length/3;
  for(const sign of[-1,1]){const e=1,top=.205,bottom=.010;p.push(sign*length/2,(top+bottom)/2,0);uv.push(sign,.5);}
  for(let k=0;k<sides;k++)ids.push(n,(k+1)%sides,k,n+1,rows*sides+k,rows*sides+(k+1)%sides);
  const g=solid(p,uv,ids,'scene03-canted-waisted-cloud-arm109-r02-'+rank,'Variable-depth load arm with rounded throat, swollen tip, underbelly and incised canted cheeks');g.userData.sectionVariationMetres=depth*.24;cache.set(key,g);return g;
 }
 function bearingHead(seed=0){
  const key='head-'+seed;if(cache.has(key))return cache.get(key);
  const sides=64,rings=18,p=[],uv=[],ids=[],spirals=[];
  for(const sign of[-1,1]){const path=[];for(let k=0;k<80;k++){const t=k/79,a=t*Math.PI*3.7,r=.24*(1-.78*t);path.push([sign*(.15+Math.cos(a)*r),.06+Math.sin(a)*r*.88]);}spirals.push(path);}
  function carved(x,y){let d=2;for(const path of spirals)for(let k=1;k<path.length;k++){const a=path[k-1],b=path[k],dx=b[0]-a[0],dy=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return .085*Math.exp(-((d/.042)**2))-.046*Math.exp(-(((d-.067)/.026)**2));}
  for(let side=0;side<2;side++){
   const center=p.length/3;p.push(0,0,side?-.30:.20+carved(0,0));uv.push(.5,.5);
   for(let j=1;j<=rings;j++)for(let k=0;k<sides;k++){
    const r=j/rings,a=k/sides*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
    const x=r*.5*Math.sign(ca)*Math.abs(ca)**.52*(1-.11*Math.max(0,-sa));
    const y=r*.48*Math.sign(sa)*Math.abs(sa)**.52*(sa<0?.85+.15*Math.cos(a*3)**2:1);
    const z=side?-.30+.09*r*r:.20+.060*(1-r*r)+carved(x,y)*(1-.35*r**6);
    p.push(x,y,z);uv.push(x+.5,y+.5);
   }
   for(let k=0;k<sides;k++){const a=center+1+k,b=center+1+(k+1)%sides;side?ids.push(center,b,a):ids.push(center,a,b);}
   for(let j=0;j<rings-1;j++)for(let k=0;k<sides;k++){const a=center+1+j*sides+k,b=center+1+j*sides+(k+1)%sides,c=a+sides,d=b+sides;side?ids.push(a,b,c,b,d,c):ids.push(a,c,b,b,c,d);}
  }
  const count=1+rings*sides,front=1+(rings-1)*sides,back=count+front;
  for(let k=0;k<sides;k++){const a=front+k,b=front+(k+1)%sides,c=back+k,d=back+(k+1)%sides;ids.push(a,c,b,b,c,d);}
  const g=solid(p,uv,ids,'scene03-scalloped-volute-bearing-head109-r02-'+seed,'Closed rounded cloud nose with modeled recessed channels and rolled volutes');cache.set(key,g);return g;
 }
 // A pierced structural floral bracket built from independently closed
 // swollen branches and curled leaf blades. The spaces between them remain
 // real apertures; a broad triangular backing never supplies its silhouette.
 function foliateStrut(){
  if(cache.has('foliate-strut'))return cache.get('foliate-strut');
  const p=[],uv=[],ids=[];
  function sweep(points,width,thickness,leaf=false){
   const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),rows=40,sides=16,start=p.length/3;
   for(let j=0;j<=rows;j++){
    const t=j/rows,c=curve.getPoint(t),tan=curve.getTangent(t).normalize(),across=new T.Vector3(-tan.y,tan.x,0).normalize();
    const w=width*(leaf?.015+.985*Math.sin(Math.PI*t)**.90*(1+.10*Math.sin(t*Math.PI*9)):.72+.28*Math.sin(Math.PI*t));
    for(let k=0;k<sides;k++){
     const a=k/sides*Math.PI*2,cc=Math.cos(a),ss=Math.sin(a),q=c.clone().addScaledVector(across,w*.5*cc);
     const ridge=leaf?.012*Math.sin(Math.PI*t)*Math.exp(-((cc/.27)**2)):.004*Math.sin(Math.PI*t);
     const grooves=leaf?.0045*Math.cos(cc*Math.PI*4+.45*Math.sin(t*Math.PI*3))*Math.sin(Math.PI*t):0;
     q.z+=thickness*.5*ss*(leaf?.28+.72*Math.sin(Math.PI*t):1)+(ridge+grooves)*Math.max(0,ss)**3;
     p.push(...q.toArray());uv.push(t,k/sides);
    }
   }
   for(let j=0;j<rows;j++)for(let k=0;k<sides;k++){const a=start+j*sides+k,b=start+j*sides+(k+1)%sides,c=a+sides,d=b+sides;ids.push(a,b,c,b,d,c);}
   const n=p.length/3;p.push(...curve.getPoint(0).toArray(),...curve.getPoint(1).toArray());uv.push(0,.5,1,.5);for(let k=0;k<sides;k++)ids.push(n,start+(k+1)%sides,start+k,n+1,start+rows*sides+k,start+rows*sides+(k+1)%sides);
  }
  sweep([[0,0,0],[0,.35,.025],[0,.72,.015],[0,1.10,.025]],.095,.14);
  for(const s of[-1,1]){
   sweep([[0,.09,0],[s*.35,.18,.01],[s*.73,.40,.025],[s*.78,.65,.025],[s*.58,.76,.04],[s*.46,.60,.065],[s*.60,.53,.075]],.085,.13);
   sweep([[0,.52,.02],[s*.21,.80,.03],[s*.28,1.07,.04],[s*.48,1.11,.045],[s*.54,.94,.07],[s*.40,.87,.08]],.070,.11);
   for(const [from,to,w]of[[[s*.23,.18,.05],[s*1.05,.18,.08],.27],[[s*.51,.34,.06],[s*.93,.55,.13],.24],[[s*.69,.60,.07],[s*.65,.91,.14],.21],[[s*.18,.70,.06],[s*.10,1.22,.09],.22],[[s*.34,.94,.09],[s*.66,1.17,.13],.19]]){
    const mid=[(from[0]+to[0])*.5+s*.035,(from[1]+to[1])*.5+.035,(from[2]+to[2])*.5+.015];sweep([from,mid,to],w,.038,true);
   }
  }
  const g=solid(p,uv,ids,'scene03-openwork-curled-acanthus-strut109-r03','Closed branching floral load strut with ten thin curled lobed leaf volumes, incised veins and four rolled branch tips');cache.set('foliate-strut',g);return g;
 }
 function scrollFace(seed=0){
  if(cache.has(seed))return cache.get(seed);
  const nx=44,ny=44,p=[],uv=[],ids=[],n=(nx+1)*(ny+1),curves=[];
  for(const sign of[-1,1]){const line=[];for(let k=0;k<91;k++){const t=k/90,a=t*Math.PI*3.8+seed*.11,r=.30*(1-.79*t);line.push([sign*(.15+Math.cos(a)*r),.045+Math.sin(a)*r*.91]);}curves.push(line);}
  function relief(x,y){let d=2;for(const line of curves)for(let j=1;j<line.length;j++){const a=line[j-1],b=line[j],dx=b[0]-a[0],dy=b[1]-a[1],t=T.MathUtils.clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}const rolled=.070*Math.exp(-((d/.043)**2))-.029*Math.exp(-(((d-.071)/.024)**2)),bevel=.045*(1-T.MathUtils.smoothstep(Math.max(Math.abs(x),Math.abs(y)),.40,.50));return rolled+bevel;}
  for(let side=0;side<2;side++)for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
   const y=-.5+j/ny,x=(-.5+i/nx)*(1-.07*T.MathUtils.smoothstep(Math.abs(y),.39,.5)),z=side?-.35:.17+relief(x,y);p.push(x,y,z);uv.push(x,y);
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;ids.push(a,b,c,b,d,c,c+n,b+n,a+n,c+n,d+n,b+n);}
  const rim=[...Array.from({length:nx+1},(_,i)=>i),...Array.from({length:ny},(_,j)=>(j+1)*(nx+1)+nx),...Array.from({length:nx},(_,i)=>ny*(nx+1)+nx-1-i),...Array.from({length:ny-1},(_,j)=>(ny-1-j)*(nx+1))];
  for(let i=0;i<rim.length;i++){const a=rim[i],b=rim[(i+1)%rim.length];ids.push(b,a,a+n,b,a+n,b+n);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name='scene03-closed-deep-volute-carved-timber109-'+seed;g.userData={closedWoodSolid:true,authoredRelief:true,referenceRGB:false,relief:'paired rolled volutes with recessed undercut-like chisel channels'};keep(g);cache.set(seed,g);return g;
 }
 function frogStrut(){
  const s=new T.Shape();s.moveTo(-1.1,0);s.lineTo(1.1,0);s.quadraticCurveTo(1.08,.19,.91,.25);s.bezierCurveTo(.75,.28,.79,.62,.51,.72);s.quadraticCurveTo(.30,.79,.24,1.03);s.quadraticCurveTo(0,1.20,-.24,1.03);s.quadraticCurveTo(-.30,.79,-.51,.72);s.bezierCurveTo(-.79,.62,-.75,.28,-.91,.25);s.quadraticCurveTo(-1.08,.19,-1.1,0);s.closePath();
  const h=new T.Path();h.moveTo(-.70,.15);h.quadraticCurveTo(-.63,.27,-.49,.29);h.bezierCurveTo(-.28,.31,-.38,.50,-.12,.59);h.quadraticCurveTo(0,.66,.12,.59);h.bezierCurveTo(.38,.50,.28,.31,.49,.29);h.quadraticCurveTo(.63,.27,.70,.15);h.lineTo(-.70,.15);h.closePath();s.holes.push(h);
  const g=new T.ExtrudeGeometry(s,{depth:.38,steps:1,curveSegments:22,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:3});g.translate(0,0,-.19);g.name='scene03-closed-pierced-frog-leg-gable-strut109';g.userData={closedWoodSolid:true,actualPiercing:true,referenceRGB:false};keep(g);return g;
 }
 return{scrollFace,frogStrut,cantileverArm,bearingHead,foliateStrut};
}
