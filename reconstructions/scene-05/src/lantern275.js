import * as T from 'three';
import {cast275,ring275,lathe275,ribbon275,leaf275,craftCollector275,closedWire190} from './corner-craft275.js';

// A complete six-sided hanging lantern. Every window, folded sheet, cast
// aperture and link is geometry; the reference is only a visual comparison.
export function createLantern275(){
 const craft=craftCollector275('scene05-six-sided-carved-lantern275'),add=craft.add,
  gold='lanternGilt275',edge='lanternEdge275',bronze='lanternFrame275',dark='lanternRecess275',paper='lanternPaper275';
 const box=(p,s,m=bronze,rot=[0,0,0])=>add(new T.BoxGeometry(...s),m,p,rot);
 const wire=(pts,r=.004,m=gold)=>add(closedWire190(pts,r,Math.max(24,pts.length*8),8),m);
 const lathe=(profile,m=bronze,n=6)=>add(lathe275(profile,n),m);
 const band=(y,r,h=.012,m=gold,n=6)=>lathe([[r-.009,y-h/2],[r+.009,y-h/2],[r+.009,y+h/2],[r-.009,y+h/2],[r-.009,y-h/2]],m,n);
 // Long narrow chamber. Six real 22mm rebated corner posts carry independent
 // sheet frames; thin ivory panels sit 17mm behind the pierced flower grids.
 const a=.226,half=a*Math.tan(Math.PI/6),bodyTop=.455,bodyBottom=-.465;
 for(let f=0;f<6;f++){
  const angle=f*Math.PI/3,face=(g,m,p=[0,0,0],rz=0)=>{g.rotateZ(rz);g.translate(...p);g.rotateY(angle);return add(g,m);};
  const crown=(g,m,p=[0,0,0],rz=0)=>{g.rotateZ(rz);g.translate(...p);const v=g.attributes.position;for(let i=0;i<v.count;i++){const y=v.getY(i),t=T.MathUtils.clamp((y-.797)/.416,0,1),gain=1+.060*Math.sin(t*Math.PI)-.060*t;v.setXYZ(i,v.getX(i)*gain,1.213-(1.213-y)*1.20,v.getZ(i)*gain);}g.computeVertexNormals();g.rotateY(angle);return add(g,m);};
  face(new T.BoxGeometry(half*2-.030,.875,.0016),paper,[0,-.005,a-.017]);
  for(const side of[-1,1]){
   face(new T.BoxGeometry(.022,.948,.028),bronze,[side*half,-.005,a]);
   face(new T.BoxGeometry(.0045,.930,.006),gold,[side*(half-.007),-.005,a+.018]);
   for(const y of[-.418,-.235,.004,.239,.418]){const pin=new T.SphereGeometry(1,10,6);pin.scale(.0055,.0055,.003);face(pin,edge,[side*half,y,a+.018]);}
  }
  for(const y of[bodyBottom,bodyTop]){face(new T.BoxGeometry(half*2,.022,.032),bronze,[0,y,a]);face(new T.BoxGeometry(half*2-.008,.004,.004),gold,[0,y+(y>0?-.005:.005),a+.020]);}
  for(const y of[-.358,-.245,-.124,.126,.247,.360])face(new T.BoxGeometry(half*2-.030,.0058,.009),bronze,[0,y,a+.008]);
  for(const x of[-.062,.062])face(new T.BoxGeometry(.0048,.882,.009),bronze,[x,-.005,a+.009]);
  // Six-lobed pierced flower windows replace the repeated heart diamonds.
  // Actual thin petal rings and seated radial veins leave the paper visible.
  for(const y of[-.300,0,.302]){
   const shape=new T.Shape(),hole=new T.Path(),size=y===0?.061:.052;
   for(let k=0;k<=72;k++){const q=k/72*Math.PI*2,r=size*(1+.17*Math.cos(q*6)),x=Math.sin(q)*r,yy=Math.cos(q)*r;k?shape.lineTo(x,yy):shape.moveTo(x,yy);}
   for(let k=0;k<=72;k++){const q=k/72*Math.PI*2,r=(size-.005)*(1+.17*Math.cos(q*6)),x=Math.sin(q)*r,yy=Math.cos(q)*r;k?hole.lineTo(x,yy):hole.moveTo(x,yy);}shape.closePath();hole.closePath();shape.holes.push(hole);face(cast275(shape,.005,.0006),gold,[0,y,a+.014]);
   const loop=ring275(.012,.012,y,a+.017,.0026,40);loop.rotateY(angle);add(loop,edge);
   for(let k=0;k<6;k++){const q=k*Math.PI/3,pts=[[Math.sin(q)*.012,y+Math.cos(q)*.012,a+.017],[Math.sin(q+.16)*size*.48,y+Math.cos(q+.16)*size*.48,a+.022],[Math.sin(q)*size*.99,y+Math.cos(q)*size*.99,a+.018]],rib=ribbon275(pts,.0052,.0035,{segments:24});rib.rotateY(angle);add(rib,gold);}
  }
  // Upper cage: full pierced panels sit in six shouldered corner pillars.
  // Broad S-scrolls and folded acanthus leaves grow into the panel border.
  const ca=.245,ch=.405,cy=1.005,cw=2*ca*Math.tan(Math.PI/6);
  for(const side of[-1,1]){
   crown(closedWire190([[side*cw/2,.797,ca],[side*cw/2,.90,ca],[side*cw/2,1.01,ca],[side*cw/2,1.12,ca],[side*cw/2,1.213,ca]],.010,60,8),bronze);
   crown(closedWire190([[side*(cw/2-.002),.802,ca+.015],[side*(cw/2-.002),1.005,ca+.015],[side*(cw/2-.002),1.208,ca+.015]],.0028,48,8),edge);
  }
  for(const y of[cy-ch/2,cy+ch/2])crown(new T.BoxGeometry(cw,.018,.027),bronze,[0,y,ca]);
  // A separate light receiver lies behind the cage; it does not fill the
  // metal apertures, whose thickness and shadow remain visible at the sides.
  crown(new T.BoxGeometry(cw-.029,ch-.020,.0015,1,16,1),paper,[0,cy,ca-.036]);
  for(const side of[-1,1]){
   const pts=[[side*.119,.815,.257],[side*.052,.858,.267],[side*.024,.941,.272],[side*.104,1.005,.265],[side*.111,1.090,.259],[side*.035,1.161,.269],[side*.106,1.195,.258]],r=ribbon275(pts,.026,.009,{segments:62,taper:.48});crown(r,gold);
   for(const [x,y,rz,l,w]of[[side*.060,.850,-side*.66,.134,.050],[side*.082,1.012,side*1.03,.129,.057],[side*.044,1.100,-side*.89,.112,.046]]){
    crown(leaf275(l,w,{hole:true,depth:.008,fold:.012}),gold,[x,y,.260],rz);
    crown(closedWire190([[0,.008,.270],[0,l*.37,.277],[0,l*.76,.274]],.0027,26,8),edge,[x,y,0],rz);
   }
   const curl=ring275(.030,.034,.968,.269,.0045,40);curl.translate(side*.064,0,0);crown(curl,edge);
  }
  const flower=new T.Shape();for(let k=0;k<=48;k++){const q=k/48*Math.PI*2,r=.040+.010*Math.cos(q*6);const x=Math.sin(q)*r,y=1.015+Math.cos(q)*r;k?flower.lineTo(x,y):flower.moveTo(x,y);}flower.closePath();const h=new T.Path();h.absarc(0,1.015,.013,0,Math.PI*2,true);flower.holes.push(h);crown(cast275(flower,.009,.001),edge,[0,0,.276]);
 }
 for(const y of[-.482,.470,.714,1.213]){band(y,y>.7?.281:.263,.020,bronze);band(y+.009,y>.7?.284:.266,.005,edge);}
 lathe([[0,.474],[.263,.474],[.263,.489],[0,.489]],bronze,6);
 for(let k=0;k<6;k++){const a=(k+.5)*Math.PI/3,r=.263;wire([[Math.sin(a)*r,.477,Math.cos(a)*r],[Math.sin(a)*r,.612,Math.cos(a)*r]],.010,bronze);}
 // Six individually closed 9mm hood panels. Real 1.6mm seams, folded corner
 // caps and rolled eaves replace the former one-piece broad polygon cone.
 const roofCurve=new T.CatmullRomCurve3([[.045,.724,0],[.145,.695,0],[.228,.610,0],[.303,.564,0],[.347,.575,0]].map(p=>new T.Vector3(...p))),rows=22,cols=12;
 for(let f=0;f<6;f++){
  const p=[],uv=[],ix=[],stride=(rows+1)*(cols+1),angle=f*Math.PI/3;
  for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
   const q=roofCurve.getPoint(j/rows),u=-1+2*k/cols,x=u*(q.x*Math.tan(Math.PI/6)-.0008),v=new T.Vector3(x,q.y-(side?.009:0),q.x).applyAxisAngle(new T.Vector3(0,1,0),angle);p.push(...v.toArray());uv.push(k/cols,j/rows);
  }
  for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){const a=j*(cols+1)+k,b=a+1,c=a+cols+1,d=c+1;ix.push(a,c,b,b,c,d,a+stride,b+stride,c+stride,b+stride,d+stride,c+stride);}
  const rim=[...Array.from({length:cols},(_,k)=>k),...Array.from({length:rows},(_,j)=>j*(cols+1)+cols),...Array.from({length:cols},(_,k)=>rows*(cols+1)+cols-k),...Array.from({length:rows},(_,j)=>(rows-j)*(cols+1))];for(let j=0;j<rim.length;j++){const a=rim[j],b=rim[(j+1)%rim.length];ix.push(a,b,a+stride,b,b+stride,a+stride);}
  const panel=new T.BufferGeometry();panel.setAttribute('position',new T.Float32BufferAttribute(p,3));panel.setAttribute('uv',new T.Float32BufferAttribute(uv,2));panel.setIndex(ix);panel.computeVertexNormals();add(panel,bronze);
  const edgePath=Array.from({length:23},(_,j)=>{const q=roofCurve.getPoint(j/22);return new T.Vector3(q.x*Math.tan(Math.PI/6),q.y+.008,q.x).applyAxisAngle(new T.Vector3(0,1,0),angle).toArray();});wire(edgePath,.0055,gold);
  const eavePath=Array.from({length:17},(_,j)=>new T.Vector3((-1+2*j/16)*.347*Math.tan(Math.PI/6),.573,.347).applyAxisAngle(new T.Vector3(0,1,0),angle).toArray());wire(eavePath,.006,edge);
  // Short corners carry a pierced cast pendant, rather than a thick teardrop.
  const corner=new T.Vector3(.347*Math.tan(Math.PI/6),.550,.347).applyAxisAngle(new T.Vector3(0,1,0),angle);
  for(let j=0;j<3;j++){const g=ring275(.009,.013,0,0,.0028,32);g.rotateY(angle+(j%2?Math.PI/2:0));add(g,gold,[corner.x,corner.y-j*.025,corner.z]);}
  const leaf=leaf275(.066,.027,{hole:true,depth:.004,fold:.003});leaf.rotateZ(Math.PI);leaf.rotateY(angle);add(leaf,edge,[corner.x,corner.y-.061,corner.z]);
 }
 // Rolled lower basket and twelve hollowed lotus tongues. The bowl has
 // depth and real seams, rather than one blank faceted triangular point.
 lathe([[0,-.725],[.050,-.725],[.090,-.686],[.168,-.620],[.244,-.548],[.268,-.491],[.268,-.477],[.245,-.477],[.224,-.534],[.152,-.599],[.076,-.671],[.040,-.697],[0,-.697]],bronze,12);
 const bowl=[[-.725,.050],[-.686,.090],[-.620,.168],[-.548,.244],[-.491,.268]],bowlRadius=y=>{let k=0;while(k<bowl.length-2&&y>bowl[k+1][0])k++;const a=bowl[k],b=bowl[k+1],t=(y-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;};
 for(let k=0;k<12;k++){
  const g=leaf275(.159,.046,{hole:true,depth:.007,fold:.010}),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=-.697+.170*p.getY(i)/.159;p.setXYZ(i,p.getX(i),y,bowlRadius(y)+p.getZ(i)+.0005);}g.computeVertexNormals();g.rotateY(k*Math.PI/6);add(g,gold);
  const vein=closedWire190(Array.from({length:12},(_,j)=>{const y=-.690+.155*j/11;return[0,y,bowlRadius(y)+.010];}),.0028,36,8);vein.rotateY(k*Math.PI/6);add(vein,edge);
 }
 band(-.507,.252,.012,edge,12);band(-.702,.060,.012,gold,12);
 // Scalloped crown dome and a true five-link oval chain retain the existing
 // beam anchor at1.64m while narrowing the light chamber/hood proportions.
 lathe([[0,1.274],[.050,1.274],[.123,1.255],[.202,1.224],[.275,1.215],[.280,1.229],[.252,1.248],[.175,1.277],[.085,1.296],[.033,1.305],[0,1.305]],gold,12);
 for(let f=0;f<6;f++){const q=f*Math.PI/3;wire([[0,1.303,.035],[Math.sin(q)*.10,1.285,Math.cos(q)*.10],[Math.sin(q)*.22,1.248,Math.cos(q)*.22],[Math.sin(q)*.275,1.230,Math.cos(q)*.275]],.004,edge);}
 for(let j=0;j<5;j++){const g=ring275(.022,.043,0,0,.005,48);g.rotateY(j%2?Math.PI/2:0);add(g,bronze,[0,1.315+j*.0675,0]);}
 for(let j=0;j<3;j++){const g=ring275(.015,.023,0,0,.004,36);g.rotateY(j%2?Math.PI/2:0);add(g,bronze,[0,-.742-j*.037,0]);}
 lathe([[0,-.990],[.014,-.986],[.034,-.961],[.049,-.925],[.041,-.884],[.020,-.861],[0,-.861]],gold,12);
 const result=craft.finish();return{...result,info:{revision:'corner275-r02',solidAudit:result.audit,construction:'Six independently closed folded hood sheets with rolled seams/eaves; deep shouldered corner posts, rebated long paper chamber and folded pierced grille; tall barrel-shaped acanthus upper cage with curved rebated pillars and actual leaf veins over a set-back shade; hollowed lotus leaves conformed to the actual bowl, scalloped dome, real oval links and corner pendant chains',bodyAcrossFlats:.452,bodyHeight:.920,crownAcrossFlats:.490,hoodAcrossFlats:.694,topLinkY:1.633,pendantBottomY:-.990,referencePhotographRuntimeUse:false,historicalIdentityClaimed:false,visualAccepted:false}};
}
