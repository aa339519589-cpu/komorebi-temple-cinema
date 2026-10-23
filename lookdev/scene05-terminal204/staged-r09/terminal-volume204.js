// Authored ceramic volume, with explicit three-dimensional craft sections.
// The photograph is a visual comparison input only: no RGB, inferred depth,
// image extrusion or external mesh is sampled by this field.
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
const bez=(path,t)=>{const u=1-t;return[0,1,2].map(a=>u*u*path[0][a]+2*u*t*path[1][a]+t*t*path[2][a]);};
const jawCurves=[-1,1].map(s=>[[.188,.155,.014],[.163,.071,.018],[.106,.013,.017],[.025,-.012,.016]].map(([x,y,z])=>[x*s,y,z]));
// Bent wedge brow sections: a small physical arris, tapered outer root,
// and a curved forward face that descends into the nose bridge.
const leftBrow=[[-.211,.350],[-.192,.352],[-.151,.334],[-.112,.306],[-.075,.278],[-.037,.248],[-.023,.242],[-.030,.268],[-.068,.301],[-.108,.329],[-.150,.352],[-.187,.372],[-.211,.371]],brows=[leftBrow,leftBrow.map(([x,y],i)=>[-x,y+(i<7?.003:.006)])];
const mouth=[[-.026,.128],[.026,.128],[.027,.121],[.019,.084],[-.018,.084],[-.027,.121]];
function terminalBaseDistance204(x,y,z){
 let d=ell(x,y,z,0,.205,-.008,.229,.242,.062);
 d=smin(d,ell(x,y,z,-.002,.348,.002,.162,.088,.047),.010);
 d=smin(d,ell(x,y,z,-.002,.249,.041,.024,.068,.041),.009);
 d=smin(d,ell(x,y,z,.001,.188,.074,.036,.025,.037),.009);
 if(Math.abs(x)<.221&&y>.235&&y<.383){const t=1-clamp(Math.abs(x)/.215,0,1),centre=.025+.043*t*t,depth=.026+.008*t;for(const b of brows)d=smin(d,prism(x,y,z,b,centre,depth,.0028),.005);}
 for(const path of jawCurves)for(let i=0;i<path.length-1;i++)d=smin(d,line(x,y,z,path[i],path[i+1],.012,.65),.007);
 // Short closed keystone mouth with a small carved lip. No chin ball.
 d=smin(d,prism(x,y,z,mouth,.036,.024,.0034),.005);
 const rho=Math.sqrt((x/.239)**2+((y-.205)/.251)**2),radial=(rho-1)*.239,qr=Math.abs(radial)-.017,qz=Math.abs(z-.005)-.041;
 d=smin(d,Math.hypot(Math.max(qr,0),Math.max(qz,0))+Math.min(Math.max(qr,qz),0)-.003,.004);
 const innerRho=Math.sqrt((x/.219)**2+((y-.205)/.228)**2);d=smin(d,Math.hypot((innerRho-1)*.219,z-.049)-.006,.004);
 // Shallow curved sockets retain finite ceramic behind the inset eyes.
 d=Math.max(d,-ell(x,y,z,-.105,.260,.071,.055,.023,.049,-.27));
 d=Math.max(d,-ell(x,y,z,.106,.266,.070,.053,.022,.047,.22));
 d=Math.max(d,-ell(x,y,z,-.024,.176,.097,.0065,.005,.012,-.20));
 d=Math.max(d,-ell(x,y,z,.025,.178,.096,.006,.005,.012,.16));
 d=Math.max(d,-line(x,y,z,[-.016,.119,.050],[.016,.119,.050],.003,.8));
 return d;
}
const paths=[];for(const sign of[-1,1])for(const path of[
 [[.030,.174,0],[.106,.168,0],[.177,.204,0]],
 [[.032,.151,0],[.108,.125,0],[.172,.126,0]],
 [[.026,.134,0],[.076,.084,0],[.134,.064,0]]
])paths.push(path.map(([x,y,z])=>[x*sign,y+(sign<0?-.002:0),z]));
// Broad whisker planes are sunk into the authored ground by 5mm. Only a
// few millimetres of rounded relief stand proud; no floating wire roots.
const projectedFolds=paths.map(path=>{
 const points=[];for(let i=0;i<=32;i++){const t=i/32,[x,y]=bez(path,t);let hi=.16,lo=hi,found=false;
  for(let z=.1585;z>=-.10;z-=.0015){if(terminalBaseDistance204(x,y,z)<=0){lo=z;found=true;break;}hi=z;}
  if(!found)throw Error('A carved fold lacks ceramic ground');for(let j=0;j<13;j++){const z=(lo+hi)/2;if(terminalBaseDistance204(x,y,z)<=0)lo=z;else hi=z;}
  points.push({p:[x,y,(lo+hi)/2-.005],r:.007+.006*Math.sin(Math.PI*t)**.7});
 }
 return{points,min:[0,1,2].map(a=>Math.min(...points.map(q=>q.p[a]))-.020),max:[0,1,2].map(a=>Math.max(...points.map(q=>q.p[a]))+.020)};
});
export const terminalFoldSeats204=projectedFolds.flatMap((g,fold)=>g.points.map(q=>({fold,point:q.p,groundDistance:terminalBaseDistance204(...q.p)})));
export function terminalDistance204(x,y,z){
 let d=terminalBaseDistance204(x,y,z);
 for(const group of projectedFolds){if(x<group.min[0]||x>group.max[0]||y<group.min[1]||y>group.max[1]||z<group.min[2]||z>group.max[2])continue;for(let i=0;i<group.points.length-1;i++)d=smin(d,line(x,y,z,group.points[i].p,group.points[i+1].p,(group.points[i].r+group.points[i+1].r)/2,.78),.005);}
 d=Math.max(d,-ell(x,y,z,-.024,.176,.097,.0065,.005,.012,-.20));d=Math.max(d,-ell(x,y,z,.025,.178,.096,.006,.005,.012,.16));
 return d;
}
export const terminalVolume204={bounds:[[-.279,-.080,-.119],[.279,.490,.168]],gridStep:.0026,origin:'Explicit authored bent-wedge3D brow, integral fan and keystone mouth sections from visible HD05 features; hidden depth interpreted',photographPixelsUsed:false,externalScanUsed:false};
