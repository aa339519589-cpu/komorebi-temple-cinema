import * as T from 'three';

// Pierced cast bronze, rather than an open wire cage. The small flower holes
// pass through the curved wall and have real thickness and interior edges.
export function buildVerandaBell({emit,rod,box,mats}){
 const TAU=Math.PI*2,bronze=new T.MeshPhysicalMaterial({name:'scene07-pierced-cast-bronze-bell',color:0xb78a43,metalness:.96,roughness:.31,clearcoat:.10,clearcoatRoughness:.24}),dark=new T.MeshStandardMaterial({name:'scene07-bell-inner-aged-bronze',color:0x4d412b,metalness:.87,roughness:.47});
 mats.verandaBellBronze=bronze;mats.verandaBellDark=dark;
 const lathe=(profile,material=bronze)=>emit(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64),material,0,0,0);
 const count=18,radius=y=>.425+.105*Math.pow(Math.max(0,Math.min(1,(.055-y)/.65)),.75),panelWidth=TAU*.478/count-.0025;
 for(let panel=0;panel<count;panel++){
  const shape=new T.Shape();shape.moveTo(-panelWidth/2,-.59);shape.lineTo(panelWidth/2,-.59);shape.lineTo(panelWidth/2,.055);shape.lineTo(-panelWidth/2,.055);shape.closePath();
  for(const [cx,cy,size]of[[0,-.12,.030],[0,-.38,.031],[-.045,-.25,.014],[.045,-.25,.014],[0,-.51,.013]]){
   const path=new T.Path();for(let j=0;j<=48;j++){const a=-j/48*TAU,r=size*(.78+.22*Math.cos(a*5)),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(j)path.lineTo(x,y);else path.moveTo(x,y);}path.closePath();shape.holes.push(path);
  }
  const g=new T.ExtrudeGeometry(shape,{depth:.019,steps:1,bevelEnabled:true,bevelThickness:.0025,bevelSize:.0025,bevelSegments:2,curveSegments:10}),p=g.attributes.position;
  for(let j=0;j<p.count;j++){const y=p.getY(j),a=panel*TAU/count+p.getX(j)/.478,r=radius(y)+p.getZ(j)-.010;p.setXYZ(j,Math.sin(a)*r,y,Math.cos(a)*r);}g.computeVertexNormals();emit(g,bronze,0,0,0);
 }
 lathe([[.10,.11],[.16,.22],[.29,.29],[.35,.26],[.405,.13],[.431,.055],[.411,.055],[.385,.125],[.34,.24],[.29,.27],[.16,.20],[.10,.09],[.10,.11]]);
 lathe([[.51,-.57],[.54,-.62],[.585,-.66],[.591,-.70],[.576,-.738],[.540,-.75],[.500,-.727],[.486,-.685],[.493,-.63],[.51,-.57]]);
 for(const [y,r,t]of[[.055,.437,.025],[-.075,.454,.012],[-.31,.495,.010],[-.55,.535,.022],[-.71,.582,.013]])emit(new T.TorusGeometry(r,t,10,72),bronze,0,y,0,1,1,1,[Math.PI/2,0,0]);
 for(let j=0;j<9;j++){
  const a=j*TAU/9,pts=Array.from({length:16},(_,k)=>{const y=.045-k*.60/15,r=radius(y)+.012;return new T.Vector3(Math.sin(a)*r,y,Math.cos(a)*r);});emit(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.011,7,false),bronze,0,0,0);
 }
 // Alternating closed chain links reach the underside of the overhead eave.
 for(let j=0;j<13;j++)emit(new T.TorusGeometry(.064,.018,9,28),bronze,0,.31+j*.116,0,1,1,1,[0,j%2*Math.PI/2,0]);
 box(0,1.78,0,.18,.075,.18,'verandaBellDark');
 rod([0,.13,0],[0,-.88,0],.025,'verandaBellDark');emit(new T.SphereGeometry(1,24,16),dark,0,-.85,0,.105,.14,.105);emit(new T.SphereGeometry(1,20,12),bronze,0,-.925,0,.075,.055,.075);
 return {info:{revision:'scene07-pierced-bell130',curvedThickPanels:count,throughHoles:count*5,closedCastRim:true,chainLinks:13,visualAccepted:false},dispose(){bronze.dispose();dark.dispose();}};
}
