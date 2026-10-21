import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const TAU=Math.PI*2;
const random=seed=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
function finish(p,uv=[]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));if(uv.length)g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;}
export function needleSpray(){const p=[];for(let k=0;k<31;k++){const a=k*2.39996,t=(k%9)/9,len=.18+(k%5)*.025,y=.015+t*.18,base=[Math.cos(a)*.035,y,Math.sin(a)*.035],tip=[Math.cos(a)*len,y+.055+(k%3)*.035,Math.sin(a)*len],w=.0085;const mid=[Math.cos(a)*len*.54,y+.045,Math.sin(a)*len*.54],side=[Math.cos(a+Math.PI/2)*w,0,Math.sin(a+Math.PI/2)*w];for(const q of[base,[mid[0]+side[0],mid[1],mid[2]+side[2]],tip,base,tip,[mid[0]-side[0],mid[1],mid[2]-side[2]]])p.push(...q);}return finish(p);}
// A small 3D fascicle built along an implied twig axis. Whorled, staggered
// needle groups keep it leafy while avoiding the single radial burst of a pad.
export function pineNeedleSpray(){
 const p=[],nodes=9,needlesPerNode=5;
 const add=(a,b,c)=>{p.push(...a,...b,...c);};
 for(let n=0;n<nodes;n++){
  const t=(n+.18+.10*Math.sin(n*2.3))/nodes,stemY=.04+t*.33,stemR=.012+.024*Math.sin(t*Math.PI),phase=n*1.27;
  for(let j=0;j<needlesPerNode;j++){
   const k=n*needlesPerNode+j,a=phase+j*TAU/needlesPerNode+.13*Math.sin(k*3.71),len=.17+.10*(.5+.5*Math.sin(k*4.13+1.2)),lean=.10+.24*(.5+.5*Math.sin(k*2.37)),
    base=[Math.cos(a)*stemR,stemY,Math.sin(a)*stemR],dir=[Math.cos(a)*Math.sqrt(1-lean*lean),lean,Math.sin(a)*Math.sqrt(1-lean*lean)],
    mid=[base[0]+dir[0]*len*.54,base[1]+dir[1]*len*.54+.006,base[2]+dir[2]*len*.54],tip=[base[0]+dir[0]*len,base[1]+dir[1]*len,base[2]+dir[2]*len],
    side=[-Math.sin(a),.12,Math.cos(a)],w=.0070+(k%5)*.0010;
   const offset=(c,s)=>[c[0]+side[0]*s*w,c[1]+side[1]*s*w,c[2]+side[2]*s*w],baseL=offset(base,1),baseR=offset(base,-1),midL=offset(mid,.62),midR=offset(mid,-.62),ridge=[mid[0]+dir[0]*.0025,mid[1]+.006,mid[2]+dir[2]*.0025];
   for(const tri of[[baseL,ridge,midL],[midL,ridge,tip],[ridge,baseR,midR],[midR,ridge,tip]])add(...tri);
  }
 }
 return finish(p);
}
function leaf(p,c,d,len,w){const v=new T.Vector3(...d).normalize(),side=new T.Vector3(v.z,.12,-v.x).normalize().applyAxisAngle(v,Math.sin(c[0]*13+c[1]*33+c[2]*19)*1.45),centre=new T.Vector3(...c),tip=centre.clone().addScaledVector(v,len),left=centre.clone().addScaledVector(v,len*.43).addScaledVector(side,w),right=centre.clone().addScaledVector(v,len*.43).addScaledVector(side,-w),ridge=centre.clone().addScaledVector(v,len*.46);ridge.y+=w*.26;for(const tri of[[centre,left,ridge],[left,tip,ridge],[tip,right,ridge],[right,centre,ridge]])for(const q of tri)p.push(...q.toArray());}
export function fern(){const p=[];for(let f=0;f<8;f++){const a=f*2.39996,len=.45+(f%3)*.13;for(let j=1;j<10;j++){const t=j/10,r=len*t,y=.1+.38*Math.sin(t*Math.PI*.8),c=[Math.cos(a)*r,y,Math.sin(a)*r];for(const s of[-1,1])leaf(p,c,[Math.cos(a+s*.95),.08,Math.sin(a+s*.95)],.15*(1-t)+.025,.027*(1-t)+.004);}}return finish(p);}
export function leafySprig(seed=1){const p=[],r=random(seed);for(let k=0;k<13;k++){const a=k*2.39996,y=k*.035,c=[Math.cos(a)*.04,y,Math.sin(a)*.04];leaf(p,c,[Math.cos(a),.3+r()*.5,Math.sin(a)],.12+r()*.12,.025+r()*.025);}return finish(p);}
// Arched, broad blades add an upright waterside layer between low moss and
// the tree canopy. Each instance remains one actual curved low-poly clump.
export function watersideReeds(seed=7){const p=[],r=random(seed);for(let k=0;k<24;k++){const a=k*2.39996+r()*.18,radius=.06+r()*.30,c=[Math.cos(a)*radius,.015+r()*.07,Math.sin(a)*radius],tilt=.25+r()*.55,d=[Math.cos(a)*tilt,.72+r()*.48,Math.sin(a)*tilt];leaf(p,c,d,.48+r()*.52,.052+r()*.044);if(k%3===0){const side=a+1.1,cc=[c[0]*.65,c[1]+.06,c[2]*.65];leaf(p,cc,[Math.cos(side)*.45,.46+r()*.28,Math.sin(side)*.45],.30+r()*.26,.036+r()*.024);}}return finish(p);}
// At forest distance the subpixel twig interiors must occlude one another.
// A closed, irregular broadleaf canopy interior sits under individual cupped
// leaves. It prevents the sparse former volume from reading as see-through
// stippling; the actual silhouette and light-facing facets remain geometric.
export function distantCrown(seed=3){
 const p=[],r=random(seed),core=new T.SphereGeometry(1,28,16).toNonIndexed();
 const a=core.attributes.position;
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),y=a.getY(i),z=a.getZ(i),t=(y+1)*.5,theta=Math.atan2(z,x),
   radius=.91*Math.sin(t*Math.PI)*(.88+.09*Math.sin(theta*5+seed)+.055*Math.sin(theta*11+t*17+seed*.7)+.035*Math.cos(theta*19-t*29)),
   radial=Math.hypot(x,z);
  p.push(radial>1e-6?x/radial*radius:0,t*2,radial>1e-6?z/radial*radius:0);
 }
 core.dispose();
 for(let k=0;k<390;k++){
  const theta=r()*TAU,t=.045+r()*.91,
   outline=Math.sin(t*Math.PI)*(.88+.09*Math.sin(theta*5+seed)+.055*Math.sin(theta*11+t*17+seed*.7)+.035*Math.cos(theta*19-t*29)),
   rho=.88+r()*.15,c=[Math.cos(theta)*rho*outline,t*2,Math.sin(theta)*rho*outline];
  leaf(p,c,[Math.cos(theta),r()*.7-.1,Math.sin(theta)],.12+r()*.12,.04+r()*.04);
 }
 // Weld the displaced core before computing its normals: the old unindexed
 // vertices gave each broad triangle a separate flat grey lighting facet.
 // The irregular silhouette and raised individual leaves remain geometric.
 const raw=finish(p);raw.deleteAttribute('normal');const g=mergeVertices(raw,.00001);raw.dispose();g.computeVertexNormals();return g;
}
// Solid ceramic half-shells have a real thickness and closed end lips.
export function halfBarrel(segments=12,span=Math.PI){const p=[],uv=[],normals=[];const P=(a,z,r)=>[Math.cos(a)*r,Math.sin(a)*r,z];function tri(a,b,c,mode){for(const q of[a,b,c]){p.push(...q);uv.push(q[0],q[2]);if(typeof mode==='number'){const r=Math.hypot(q[0],q[1]);normals.push(q[0]/r*mode,q[1]/r*mode,0);}else normals.push(...mode);}}const quad=(a,b,c,d,mode)=>{tri(a,b,c,mode);tri(c,b,d,mode);};for(let i=0;i<segments;i++){const a=i*span/segments,b=(i+1)*span/segments;quad(P(a,-.5,1),P(b,-.5,1),P(a,.5,1),P(b,.5,1),1);quad(P(a,.5,.80),P(b,.5,.80),P(a,-.5,.80),P(b,-.5,.80),-1);quad(P(a,-.5,.80),P(b,-.5,.80),P(a,-.5,1),P(b,-.5,1),[0,0,-1]);quad(P(a,.5,1),P(b,.5,1),P(a,.5,.80),P(b,.5,.80),[0,0,1]);}if(span<Math.PI*1.99)for(const a of[0,Math.PI])quad(P(a,-.5,.8),P(a,-.5,1),P(a,.5,.8),P(a,.5,1),[0,-1,0]);const g=finish(p,uv);g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;}
export function stoneLanternRoof(){const p=[],uv=[],n=48,rings=12;const point=(j,k)=>{const t=j/rings,a=k/n*TAU,r=.12+(1-t)*.94,y=.39*Math.pow(t,.8)+.11*Math.pow(1-t,8),square=(.90+.10*Math.cos(a*4));return[Math.cos(a)*r*square,y,Math.sin(a)*r*square];};for(let j=0;j<rings;j++)for(let k=0;k<n;k++){const a=point(j,k),b=point(j,k+1),c=point(j+1,k),d=point(j+1,k+1);for(const q of[a,c,b,b,c,d]){p.push(...q);uv.push(q[0],q[2]);}}return finish(p,uv);}
export function barkBranch(points,base=.3,tip=.05,seed=1){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),N=44,M=16,frames=curve.computeFrenetFrames(N,false),p=[],uv=[],ix=[];for(let j=0;j<=N;j++){const t=j/N,c=curve.getPointAt(t),r=base*Math.pow(1-t,.85)+tip*t;for(let k=0;k<=M;k++){const a=(k%M)*TAU/M,bark=1+.095*Math.sin(a*7+t*8+seed)+.04*Math.sin(a*13-t*29+seed);const q=c.clone().addScaledVector(frames.normals[j],Math.cos(a)*r*bark).addScaledVector(frames.binormals[j],Math.sin(a)*r*bark);p.push(...q.toArray());uv.push(k/M*3,t*8);}}for(let j=0;j<N;j++)for(let k=0;k<M;k++){const a=j*(M+1)+k;ix.push(a,a+1,a+M+1,a+1,a+M+2,a+M+1);}const g=finish(p,uv);g.setIndex(ix);g.computeVertexNormals();return g;}
