// Hand-authored three-dimensional ceramic volume. Coordinates are explicit
// visible-feature hypotheses from HD05; no photograph pixel, depth image,
// scanned mesh or image-to-plane surface is an input to this evaluator.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return b+(a-b)*h-k*h*(1-h);};
function ell(x,y,z,cx,cy,cz,rx,ry,rz,angle=0){
 x-=cx;y-=cy;z-=cz;if(angle){const c=Math.cos(angle),s=Math.sin(angle),u=x*c+y*s;y=-x*s+y*c;x=u;}
 const k0=Math.sqrt((x/rx)**2+(y/ry)**2+(z/rz)**2),k1=Math.sqrt((x/(rx*rx))**2+(y/(ry*ry))**2+(z/(rz*rz))**2);return k1>1e-12?k0*(k0-1)/k1:-Math.min(rx,ry,rz);
}
function line(x,y,z,a,b,r,flatten=1){
 const px=x-a[0],py=y-a[1],pz=(z-a[2])/flatten,ax=b[0]-a[0],ay=b[1]-a[1],az=(b[2]-a[2])/flatten,h=clamp((px*ax+py*ay+pz*az)/(ax*ax+ay*ay+az*az),0,1);return Math.sqrt((px-ax*h)**2+(py-ay*h)**2+(pz-az*h)**2)-r;
}
function prism(x,y,z,poly,cz,depth,bevel=.0025){
 let inside=false,d2=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);d2=Math.min(d2,(x-a[0]-dx*t)**2+(y-a[1]-dy*t)**2);if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }const d=(inside?-1:1)*Math.sqrt(d2),q=Math.abs(z-cz)-depth/2;return Math.min(Math.max(d,q),0)+Math.hypot(Math.max(d,0),Math.max(q,0))-bevel;
}
const leftBrow=[[-.202,.329],[-.155,.330],[-.067,.304],[-.021,.280],[-.026,.255],[-.095,.280],[-.174,.291],[-.202,.302]],rightBrow=leftBrow.map(([x,y],i)=>[-x,y+(i<3?.006:.003)]);
const jawLeft=[[-.172,.145],[-.120,.075],[-.030,.035],[-.020,.012],[-.130,.032],[-.187,.098]],jawRight=jawLeft.map(([x,y])=>[-x,y+.003]);
const beard=[[-.025,.143],[0,.152],[.025,.143],[.048,.027],[0,.010],[-.048,.027]];
const mirror=(s,p)=>[p[0]*s,p[1],p[2]],creases=[];for(const s of[-1,1])for(const row of[
 [[.032,.171,.079],[.095,.169,.034],[.183,.191,.014]],
 [[.033,.151,.064],[.101,.122,.029],[.170,.111,.010]],
 [[.025,.143,.063],[.074,.083,.025],[.130,.042,.041]]
])creases.push(row.map(p=>mirror(s,p)));
export function terminalDistance204(x,y,z){
 let d=ell(x,y,z,0,.205,-.020,.229,.242,.056);
 d=smin(d,ell(x,y,z,-.002,.348,-.004,.162,.088,.041),.010);
 d=smin(d,ell(x,y,z,-.002,.249,.038,.026,.071,.041),.008);
 d=smin(d,ell(x,y,z,.001,.188,.073,.036,.024,.037),.009);
 for(const poly of[leftBrow,rightBrow])d=smin(d,prism(x,y,z,poly,.054,.030,.0025),.004);
 for(const poly of[jawLeft,jawRight])d=smin(d,prism(x,y,z,poly,.028,.025,.0025),.004);
 d=smin(d,prism(x,y,z,beard,.034,.025,.002),.004);
 // Broad, finite-depth annular return with a small real arris. The inner
 // lip intersects the face body and the outer band, not an applied wire.
 const rho=Math.sqrt((x/.239)**2+((y-.205)/.251)**2),radial=(rho-1)*.239;
 const qr=Math.abs(radial)-.017,qz=Math.abs(z-.005)-.041;
 const ring=Math.hypot(Math.max(qr,0),Math.max(qz,0))+Math.min(Math.max(qr,qz),0)-.003;
 d=smin(d,ring,.004);
 const innerRho=Math.sqrt((x/.219)**2+((y-.205)/.228)**2),inner=Math.hypot((innerRho-1)*.219,z-.049)-.006;
 d=smin(d,inner,.004);
 // True depressed orbital pockets cut into the thick facial ground.
 d=Math.max(d,-ell(x,y,z,-.105,.260,.070,.060,.026,.060,-.27));
 d=Math.max(d,-ell(x,y,z,.106,.266,.068,.058,.025,.058,.22));
 // The asymmetric nostril bores and small closed-mouth fold are cavities,
 // leaving finite ceramic behind each of them and a curved projecting nose.
 d=Math.max(d,-ell(x,y,z,-.020,.176,.096,.010,.0075,.018,-.20));
 d=Math.max(d,-ell(x,y,z,.022,.178,.095,.0095,.008,.018,.16));
 d=Math.max(d,-ell(x,y,z,0,.121,.048,.046,.007,.017));
 for(const path of creases)for(let i=0;i<path.length-1;i++)d=Math.max(d,-line(x,y,z,path[i],path[i+1],.0045));
 return d;
}
export const terminalVolume204={bounds:[[-.279,-.080,-.119],[.279,.490,.168]],gridStep:.0034,origin:'Explicit authored volumetric primitive/crease construction from visible HD05 features; hidden depth interpreted',photographPixelsUsed:false,externalScanUsed:false};
