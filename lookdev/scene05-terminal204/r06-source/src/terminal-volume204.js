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
const leftBrow=[[-.207,.311],[-.187,.306],[-.151,.308],[-.115,.301],[-.080,.286],[-.042,.265],[-.023,.261],[-.026,.286],[-.055,.306],[-.092,.321],[-.139,.332],[-.179,.339],[-.207,.341]],rightBrow=leftBrow.map(([x,y],i)=>[-x,y+(i<6?.003:.006)]);
const jawCurves=[-1,1].map(s=>[[.188,.155,.014],[.163,.071,.018],[.106,.013,.017],[.025,-.012,.016]].map(([x,y,z])=>[x*s,y,z]));

const mirror=(s,p)=>[p[0]*s,p[1],p[2]],creases=[];for(const s of[-1,1])for(const row of[
 [[.032,.171,.079],[.095,.169,.042],[.183,.191,.024]],
 [[.033,.151,.064],[.101,.122,.040],[.170,.111,.022]],
 [[.025,.143,.063],[.074,.083,.038],[.130,.042,.027]]
])creases.push(row.map(p=>mirror(s,p)));
const fanFolds=[];for(const sign of[-1,1])for(const path of[
 [[.022,.188,.103],[.096,.186,.047],[.177,.220,.030]],
 [[.030,.183,.091],[.095,.141,.045],[.174,.159,.028]],
 [[.022,.172,.083],[.080,.100,.040],[.143,.074,.026]]
])fanFolds.push(path.map(([x,y,z])=>[x*sign,y,z]));
const centralFolds=[[[0,.171,.079],[-.012,.090,.043],[-.035,.030,.024]],[[0,.171,.079],[.013,.088,.042],[.037,.032,.024]]];
function terminalBaseDistance204(x,y,z){
 let d=ell(x,y,z,0,.205,-.014,.229,.242,.062);
 d=smin(d,ell(x,y,z,-.002,.348,0,.162,.088,.047),.010);
 d=smin(d,ell(x,y,z,-.002,.249,.038,.026,.071,.041),.008);
 d=smin(d,ell(x,y,z,.001,.188,.073,.036,.024,.037),.009);
 for(const poly of[leftBrow,rightBrow])d=smin(d,prism(x,y,z,poly,.055+.008*(1-clamp(Math.abs(x)/.21,0,1)),.024,.0043),.006);
 for(const path of jawCurves)for(let i=0;i<path.length-1;i++)d=smin(d,line(x,y,z,path[i],path[i+1],.012,.65),.007);

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

 for(const path of creases)for(let i=0;i<path.length-1;i++)d=Math.max(d,-line(x,y,z,path[i],path[i+1],.0045));
 return d;
}
// Relief is seated on the actual authored3D ground. This is a geometric
// surface query of the volume above, not a photograph-derived depth map.
const projectedFolds=[...fanFolds,...centralFolds].map(path=>{
 const points=[];for(let i=0;i<=32;i++){const t=i/32,u=1-t,x=u*u*path[0][0]+2*u*t*path[1][0]+t*t*path[2][0],y=u*u*path[0][1]+2*u*t*path[1][1]+t*t*path[2][1];let hi=.16,lo=hi,found=false;
  for(let z=.1585;z>=-.10;z-=.0015){if(terminalBaseDistance204(x,y,z)<=0){lo=z;found=true;break;}hi=z;}
  if(!found)throw Error('A carved fold lacks actual ceramic ground');for(let j=0;j<13;j++){const z=(lo+hi)/2;if(terminalBaseDistance204(x,y,z)<=0)lo=z;else hi=z;}
  points.push([x,y,(lo+hi)/2-.0015]);
 }
 const min=[0,1,2].map(a=>Math.min(...points.map(p=>p[a]))-.019),max=[0,1,2].map(a=>Math.max(...points.map(p=>p[a]))+.019);return{points,min,max};
});
export const terminalFoldSeats204=projectedFolds.flatMap((g,fold)=>g.points.map(p=>({fold,point:p,groundDistance:terminalBaseDistance204(...p)})));
export function terminalDistance204(x,y,z){
 let d=terminalBaseDistance204(x,y,z);
 for(const group of projectedFolds){if(x<group.min[0]||x>group.max[0]||y<group.min[1]||y>group.max[1]||z<group.min[2]||z>group.max[2])continue;for(let i=0;i<group.points.length-1;i++)d=smin(d,line(x,y,z,group.points[i],group.points[i+1],.0075,.95),.004);}
 // Preserve the actual nostril openings after the integral relief joins.
 d=Math.max(d,-ell(x,y,z,-.020,.176,.096,.010,.0075,.018,-.20));d=Math.max(d,-ell(x,y,z,.022,.178,.095,.0095,.008,.018,.16));return d;
}
export const terminalVolume204={bounds:[[-.279,-.080,-.119],[.279,.490,.168]],gridStep:.0034,origin:'Explicit authored volumetric primitive/crease construction from visible HD05 features; hidden depth interpreted',photographPixelsUsed:false,externalScanUsed:false};
