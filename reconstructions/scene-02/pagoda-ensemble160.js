import {T,V,gridGeometry,mix} from './kernel.js';
import {layout} from './layout117.js';
import {buildTurnedSorin} from './sorin-solids.js';
import {createSorinRoofSeat170} from './roof-seat170.js';

// Five occupied timber storeys. The external silhouette retains the recovered
// tower envelope, while the wall, balcony, bracket cage and roof are separate
// connected depths. Roof units, cut faces and curved eave boards are closed.
export function buildPagodaEnsemble160({b,mats,column,carpentry}){
 const merged=new Map(),stats={enclosureSetbackFromHeldColumnLocal:.58,formerSetbackLocal:.23,revision:'scene02-recessed-occupied-five-storey-pagoda186-r01',storeys:5,roofUnits:0,bracketHeads:0,wallPanels:0,bells:0,photographicPixels:false};
 function shell(rows,thickness,material){
  const src=gridGeometry(rows),p=Array.from(src.attributes.position.array),uv=Array.from(src.attributes.uv.array),ids=Array.from(src.index.array),N=p.length/3,nx=rows[0].length,ny=rows.length;
  let meanY=0;for(let i=0;i<src.attributes.normal.count;i++)meanY+=src.attributes.normal.getY(i);if(meanY<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
  const top=ids.slice();for(let i=0;i<N;i++){p.push(p[i*3],p[i*3+1]-thickness,p[i*3+2]);uv.push(uv[i*2],uv[i*2+1]);}for(let i=0;i<top.length;i+=3)ids.push(top[i]+N,top[i+2]+N,top[i+1]+N);
  const ring=[];for(let i=0;i<nx;i++)ring.push(i);for(let j=1;j<ny;j++)ring.push(j*nx+nx-1);for(let i=nx-2;i>=0;i--)ring.push((ny-1)*nx+i);for(let j=ny-2;j>0;j--)ring.push(j*nx);if(meanY<0)ring.reverse();for(let i=0;i<ring.length;i++){const a=ring[i],c=ring[(i+1)%ring.length];ids.push(a,c,a+N,c,c+N,a+N);}
  let d=merged.get(material);if(!d){d={positions:[],uv:[],indices:[]};merged.set(material,d);}const offset=d.positions.length/3;d.positions.push(...p);d.uv.push(...uv);for(const n of ids)d.indices.push(n+offset);src.dispose();
 }
 const cutCap=new T.CylinderGeometry(.056,.056,.047,20);cutCap.rotateX(Math.PI/2);
 const bell=new T.LatheGeometry([[0,0],[.05,0],[.075,.035],[.07,.060],[.04,.10],[.035,.16],[0,.175]].map(a=>new T.Vector2(...a)),16);
 b.at(layout.pagoda.position,layout.pagoda.yaw,()=>{
  b.box(0,.30,0,7.6,.6,7.6,'stone');b.box(0,.65,0,8,.14,8,'lightstone');
  for(let level=0;level<5;level++){
   const floor=.8+level*layout.pagoda.tierPitch,w=9.4-level*.45,body=w*.48,h=w/2,eave=floor+2.10,rise=level===4?1.63:1.40,curl=.52;
   const P=(side,t,u)=>{let x,z;if(side<2){x=u*h*t;z=(side===0?1:-1)*h*t;}else{x=(side===2?1:-1)*h*t;z=u*h*t;}return[x,eave+rise*Math.pow(Math.max(0,1-t),1.46)+curl*Math.pow(t,7)*(.18+.82*Math.pow(Math.abs(u),8)),z];};
   // The porch is open in front of a recessed, opaque timber storey. Narrow
   // cream infill belongs inside the frame, never across a window or column.
   b.box(0,floor+.79,0,body-1.42,1.69,body-1.42,'pagodaShadow160');
   b.box(0,floor+.04,0,body+1.18,.24,body+1.18,'hallBearing');b.box(0,floor+.19,0,body+1.26,.075,body+1.26,'pagodaRed160');
   for(let side=0;side<4;side++)b.at([0,0,0],side*Math.PI/2,()=>{
    const wall=body/2-.48,columnPlane=body/2+.10,balcony=body/2+.59;
    for(let bay=0;bay<4;bay++){
     const pitch=body*.235,x=(bay-1.5)*pitch,panelW=pitch-.14;
     b.box(x,floor+.91,wall-.16,panelW,1.34,.10,'pagodaShadow160');
     for(const [yy,hh]of[[.59,.21],[1.18,.20]]){b.box(x,floor+yy,wall-.10,panelW,hh,.07,'pagodaPlaster160');stats.wallPanels++;}
     for(const yy of[.40,.78,1.00,1.38,1.58])b.box(x,floor+yy,wall+.02,pitch,.065,.10,'pagodaRed160');
     // Real wooden grille recesses sit between the two lime bands.
     for(let j=0;j<5;j++)b.box(x+(j-2)*panelW/5,floor+.90,wall-.035,.018,.19,.035,'hallBearing');
     if(level===0&&side===3&&bay===1){b.box(x,floor+.93,wall-.19,panelW*.82,1.15,.045,'paper');for(let j=0;j<5;j++)b.box(x+(j-2)*panelW*.16,floor+.93,wall-.12,.022,1.15,.045,'hallBearing');}
    }
    for(let i=0;i<5;i++){
     const x=(i-2)*body*.235;
     column(x,columnPlane,floor+.12,1.62,.145,'pagodaRed160');
     carpentry.head(x,floor+1.64,columnPlane-.01,.32,'tower');stats.bracketHeads++;
     // Housed fan levers receive the cantilevered eave purlin.
     b.line([x,floor+1.85,columnPlane+.01],[x,floor+2.03,h-.55],.105,'hallBearing',true,.145);
     b.line([x,floor+2.13,columnPlane+.12],[x,floor+2.16,h-.68],.095,'pagodaRed160',true,.11);
     b.box(x,floor+2.16,h-.68,.24,.17,.27,'hallBearing');
     carpentry.facePlate(x,floor+1.83,columnPlane+.17,.20,.15);
    }
    for(const [yy,dd]of[[1.55,.28],[1.79,.32],[2.08,.26]])b.box(0,floor+yy,columnPlane+.04,body+.43,.13,dd,'hallBearing');
    for(const yy of[.39,.67])b.box(0,floor+yy,balcony,body+1,.062,.085,'pagodaRed160');
    for(let i=0;i<=10;i++){const x=-(body+1)/2+(body+1)*i/10;b.box(x,floor+.48,balcony,.058,.52,.062,'pagodaRed160');b.box(x,floor+.755,balcony,.10,.043,.10,'oldgold');}
    for(let i=0;i<10;i++){const x=-(body+1)/2+(body+1)*(i+.5)/10;b.box(x,floor+.45,balcony-.025,(body+1)/10-.09,.08,.035,'pagodaRed160');}
   });
   // Corner diagonal braces land on the same column row as the straight arms.
   for(const sx of[-1,1])for(const sz of[-1,1]){
    const inner=body*.47,outer=h-.58;
    b.line([sx*inner,floor+1.76,sz*inner],[sx*outer,floor+2.12,sz*outer],.16,'hallBearing',true,.19);
    b.box(sx*outer,floor+2.18,sz*outer,.26,.18,.26,'oldgold');
    const corner=P(0,1,sx);corner[2]*=sz;
    b.line([corner[0],corner[1]-.16,corner[2]],[corner[0],corner[1]-.36,corner[2]],.009,'oldgold');b.put(bell,'oldgold',[corner[0],corner[1]-.51,corner[2]]);stats.bells++;
   }
   for(let side=0;side<4;side++){
    const runs=Math.round(w/.19),courses=10,mat=`ceramic160${(level+side)%6}`;
    shell(Array.from({length:19},(_,j)=>Array.from({length:49},(_,i)=>P(side,.002+.998*j/18,-1+2*i/48))),.12,mat);
    shell(Array.from({length:13},(_,j)=>Array.from({length:33},(_,i)=>{const p=P(side,.02+.98*j/12,-1+2*i/32);p[1]-=.18;return p;})),.04,'pagodaShadow160');
    for(let i=0;i<runs;i++){
     const u=-1+2*(i+.5)/runs,du=.98/runs;
     for(let j=0;j<courses;j++){
      const rows=Array.from({length:3},(_,a)=>Array.from({length:5},(_,k)=>{const q=-1+k*.5,t=mix((j+.016)/courses,Math.min(1,(j+1.08)/courses),a/2),p=P(side,t,u+q*du);p[1]+=.034-.021*(1-q*q)+.014*(1-a/2);return p;}));
      shell(rows,.028,`ceramic160${(i*7+j*3+level)%6}`);stats.roofUnits++;
     }
     const edge=-1+2*i/runs;for(let j=0;j<courses;j++){const a=P(side,(j+.005)/courses,edge),c=P(side,(j+1)/courses,edge);a[1]+=.060;c[1]+=.060;b.line(a,c,.043,`ceramic160${(i+level)%6}`);}
    }
    for(let i=0;i<=runs;i++){
     const u=-1+2*i/runs,p=P(side,1,u),yaw=side<2?side*Math.PI:(side===2?Math.PI/2:-Math.PI/2);p[1]+=.025;b.put(cutCap,'tileEnd',p,[1,1,1],[0,yaw,0]);
     for(let j=0;j<7;j++){const a=P(side,.43+.57*j/7,u),c=P(side,.43+.57*(j+1)/7,u);a[1]-=.26;c[1]-=.26;b.line(a,c,.062,'hallBearing',true,.083);}
    }
    const edge=Array.from({length:49},(_,j)=>P(side,1,-1+2*j/48));b.tube(edge.map(p=>[p[0],p[1]-.17,p[2]]),.095,'pagodaRed160',64);b.tube(edge.map(p=>[p[0],p[1]-.27,p[2]]),.025,'oldgold',64);
    for(const t of[.58,.77,.94])b.tube(Array.from({length:33},(_,j)=>{const p=P(side,t,-1+2*j/32);p[1]-=.36;return p;}),.062,'hallBearing',48);
    if(side<2)for(const sign of[-1,1])b.tube(Array.from({length:29},(_,j)=>{const p=P(side,.025+.995*j/28,sign);p[1]+=.085;return p;}),.072,'ceramic1602',40);
   }
   if(level===4){b.put(createSorinRoofSeat170({eave,rise,halfWidth:h,curl}),'sorinSeat170');stats.roofSeat170='Closed flared aged-bronze skirt follows actual roof and carries full metal boot footprint';}
   b.cyl(0,eave+rise+.055,0,.20,.11,'ceramic1602');
  }
  // Native/HD correspondence places only the top-roof apex about8px and
  // sorin tip about14px low. Hold allfive eave contours and the tower base;
  // raise the top roof crown0.23m, keep the boot seated, lengthen its metal
  // spindle/ring heights5% about the original14.9m foot. Radial sizes held.
  b.at([0,layout.pagoda.sorinYOffset+.23+14.9*(1-1.05),0],0,()=>{stats.sorin=buildTurnedSorin(b);},[1,1.05,1]);
  stats.finialFit170={topRoofRise:1.63,finialHeightScale:1.05,bootSeatLocalY:14.9+layout.pagoda.sorinYOffset+.23,unchanged:'All tower eaves, site/contact, plan widths and camera'};
  for(const[ma,d]of merged){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(d.positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(d.uv,2));g.setIndex(d.indices);g.computeVertexNormals();g.name='scene02-closed-pagoda-ceramic-and-soffit160-'+ma;b.put(g,ma);}
 },layout.pagoda.scale);
 return stats;
}
