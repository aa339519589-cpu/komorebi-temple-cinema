// Authored closed ceramic sculpture. The photograph is inspected by eye only.
// Dimensions are interpreted in metres; there is no image/depth/scan sampling.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return b+(a-b)*h-k*h*(1-h);};
function ell(x,y,z,cx,cy,cz,rx,ry,rz,angle=0){
 x-=cx;y-=cy;z-=cz;const c=Math.cos(angle),s=Math.sin(angle),u=x*c+y*s;y=-x*s+y*c;x=u;
 const k0=Math.sqrt((x/rx)**2+(y/ry)**2+(z/rz)**2),k1=Math.sqrt((x/(rx*rx))**2+(y/(ry*ry))**2+(z/(rz*rz))**2);
 return k1>1e-12?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function segment(x,y,z,a,b,r,flatten=1){
 const px=x-a[0],py=y-a[1],pz=(z-a[2])/flatten,ax=b[0]-a[0],ay=b[1]-a[1],az=(b[2]-a[2])/flatten,t=clamp((px*ax+py*ay+pz*az)/(ax*ax+ay*ay+az*az),0,1);
 const across=Math.hypot(px-ax*t,py-ay*t),depth=Math.abs(pz-az*t);return flatten<.8?(across+depth-r)*.70710678:Math.hypot(across,depth)-r;
}
function curve(points,r,flatten=1,blend=.006){
 const path=[];for(let j=0;j<=20;j++){const t=j/20,u=1-t;path.push([0,1,2].map(k=>u*u*u*points[0][k]+3*u*u*t*points[1][k]+3*u*t*t*points[2][k]+t*t*t*points[3][k]));}
 return{path,r,flatten,blend,min:[0,1,2].map(k=>Math.min(...path.map(p=>p[k]))-r*1.8),max:[0,1,2].map(k=>Math.max(...path.map(p=>p[k]))+r*1.8)};
}
const ridges=[];
for(const s of[-1,1]){
 const p=a=>a.map(([x,y,z])=>[s*x,y+(s<0?-.002:0),z]);
 // Brows grow out of the temple and fold forward over deep almond sockets.
 // Two curved unequal rolls replace the former straight rectangular blades.
 ridges.push(curve(p([[.210,.331,.019],[.168,.337,.040],[.092,.284,.072],[.024,.247,.077]]),.015,.86,.008));
 ridges.push(curve(p([[.206,.347,.010],[.167,.361,.027],[.095,.315,.049],[.027,.269,.054]]),.008,.75,.007));
 // Lower lids, raised cheek root and full curved moustache folds.
 ridges.push(curve(p([[.045,.247,.056],[.080,.225,.062],[.135,.223,.052],[.178,.248,.034]]),.011,.70,.007));
 ridges.push(curve(p([[.035,.183,.071],[.080,.168,.064],[.139,.179,.040],[.195,.210,.018]]),.012,.72,.006));
 ridges.push(curve(p([[.029,.153,.064],[.069,.125,.060],[.128,.121,.041],[.180,.138,.025]]),.012,.74,.006));
 ridges.push(curve(p([[.027,.128,.052],[.061,.089,.054],[.102,.063,.035],[.143,.063,.020]]),.011,.73,.0055));
 // Return at the bottom of the sculpted cheek is intentionally asymmetric.
 ridges.push(curve(p([[.190,.177,.016],[.182,.102,.030],[.130,.039,.030],[.060,.010,.021]]),.011,.74,.009));
 // Forehead wrinkles belong to the clay ground rather than a separate crest.
 ridges.push(curve(p([[.018,.385,.039],[.061,.391,.034],[.109,.376,.030],[.151,.360,.025]]),.0055,.70,.006));
 ridges.push(curve(p([[.022,.367,.045],[.061,.373,.042],[.095,.357,.040],[.124,.344,.032]]),.0045,.70,.006));
}
const mouth=curve([[-.028,.105,.050],[-.019,.083,.062],[.016,.083,.063],[.030,.107,.050]],.008,.76,.006);
const lipCut=curve([[-.019,.111,.061],[-.010,.117,.071],[.012,.115,.070],[.020,.109,.061]],.004,1.0,.001);
function addCurve(d,g,x,y,z,subtract=false){
 if(x<g.min[0]||x>g.max[0]||y<g.min[1]||y>g.max[1]||z<g.min[2]||z>g.max[2])return d;
 let q=1;for(let j=0;j<g.path.length-1;j++)q=Math.min(q,segment(x,y,z,g.path[j],g.path[j+1],g.r*(.80+.20*Math.sin(Math.PI*(j+.5)/(g.path.length-1))),g.flatten));
 return subtract?Math.max(d,-q):smin(d,q,g.blend);
}
export function terminalDistance204(x,y,z){
 // Broad lobed face with low cheek planes and a shallow brow dome.
 let d=ell(x,y,z,-.001,.205,-.009,.224,.232,.067);
 d=smin(d,ell(x,y,z,-.002,.345,.005,.158,.083,.047),.015);
 d=smin(d,ell(x,y,z,-.107,.176,.021,.086,.100,.038,-.28),.014);
 d=smin(d,ell(x,y,z,.110,.179,.020,.083,.101,.038,.25),.014);
 d=smin(d,ell(x,y,z,-.001,.253,.048,.025,.060,.037),.014);
 d=smin(d,ell(x,y,z,0,.195,.078,.029,.026,.035),.011);
 for(const s of[-1,1])d=smin(d,ell(x,y,z,s*.024,.180,.076,.023,.013,.024,s*.19),.009);
 d=smin(d,ell(x,y,z,.001,.113,.038,.031,.033,.025),.012);
 for(const g of ridges)d=addCurve(d,g,x,y,z);
 d=addCurve(d,mouth,x,y,z);
 // Subtle asymmetric kiln deformation is in the rim's true solid section.
 const cy=.205,theta=Math.atan2((y-cy)/.244,x/.235),rx=.235*(1+.007*Math.sin(theta*3+.4)),ry=.244*(1+.005*Math.cos(theta*5));
 const radial=(Math.hypot(x/rx,(y-cy)/ry)-1)*.235;
 const qr=Math.abs(radial)-.0125,qz=Math.abs(z-.004)-.037;
 d=smin(d,Math.hypot(Math.max(qr,0),Math.max(qz,0))+Math.min(Math.max(qr,qz),0)-.005,.004);
 const inner=(Math.hypot(x/.219,(y-cy)/.227)-1)*.219;
 d=smin(d,Math.hypot(inner,z-.046)-.006,.004);
 d=Math.max(d,-ell(x,y,z,-.105,.264,.078,.057,.023,.045,-.24));
 d=Math.max(d,-ell(x,y,z,.108,.267,.077,.055,.021,.043,.23));
 d=Math.max(d,-ell(x,y,z,-.025,.174,.096,.007,.0048,.015,-.22));
 d=Math.max(d,-ell(x,y,z,.026,.176,.095,.007,.005,.014,.16));
 d=addCurve(d,lipCut,x,y,z,true);
 return d;
}
export const terminalFoldSeats204=[];
export const terminalVolume204={bounds:[[-.275,-.065,-.105],[.275,.482,.157]],gridStep:.00235,origin:'Hand-authored curved double brows, almond eye hollows, alar nasal tissue, undercut folded cheek planes, small closed lip and kiln-deformed ceramic rim; hidden depth interpreted',photographPixelsUsed:false,externalScanUsed:false};
