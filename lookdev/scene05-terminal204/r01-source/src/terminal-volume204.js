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
const mirror=(s,p)=>[p[0]*s,p[1],p[2]];
const brows=[
 [[-.194,.310,.047],[-.133,.306,.070],[-.070,.287,.084],[-.022,.269,.071]],
 [[.020,.275,.071],[.073,.291,.084],[.136,.309,.070],[.192,.317,.044]]
];
const jaws=[-1,1].map(s=>[[.188,.155,.026],[.163,.071,.043],[.106,.013,.049],[.025,-.012,.034]].map(p=>mirror(s,p)));
const creases=[];for(const s of[-1,1])for(const row of[
 [[.051,.176,.088],[.106,.170,.058],[.184,.196,.038]],
 [[.047,.158,.078],[.112,.126,.052],[.174,.112,.032]],
 [[.036,.147,.079],[.079,.083,.051],[.130,.042,.024]]
])creases.push(row.map(p=>mirror(s,p)));
export function terminalDistance204(x,y,z){
 let d=ell(x,y,z,0,.205,-.005,.229,.242,.071);
 d=smin(d,ell(x,y,z,-.002,.348,.004,.162,.088,.065),.010);
 d=smin(d,ell(x,y,z,-.002,.247,.043,.034,.076,.052),.008);
 d=smin(d,ell(x,y,z,.002,.188,.085,.047,.034,.049),.009);
 for(const s of[-1,1]){
  d=smin(d,ell(x,y,z,s*.112,.169,.022,.077,.053,.052,s*.12),.010);
  for(const path of[brows[s<0?0:1],jaws[s<0?0:1]])for(let i=0;i<path.length-1;i++)d=smin(d,line(x,y,z,path[i],path[i+1],path===brows[0]||path===brows[1]?.0175:.021,.70),.008);
 }
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
 d=Math.max(d,-ell(x,y,z,-.026,.171,.118,.012,.008,.024,-.20));
 d=Math.max(d,-ell(x,y,z,.029,.174,.116,.012,.009,.024,.16));
 d=Math.max(d,-ell(x,y,z,0,.121,.068,.053,.007,.020));
 for(const path of creases)for(let i=0;i<path.length-1;i++)d=Math.max(d,-line(x,y,z,path[i],path[i+1],.0045));
 return d;
}
export const terminalVolume204={bounds:[[-.279,-.080,-.119],[.279,.490,.168]],gridStep:.0034,origin:'Explicit authored volumetric primitive/crease construction from visible HD05 features; hidden depth interpreted',photographPixelsUsed:false,externalScanUsed:false};
