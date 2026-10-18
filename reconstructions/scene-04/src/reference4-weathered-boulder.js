// Original-photo4 foreground rock form. Pure geometry data can be inspected
// without THREE or a renderer; the thin wrappers allocate actual BufferGeometry.
// Planes describe irregular chipped faces. They are softened only at their joins,
// not rounded into a sphere. This is authored rock structure, not photogrammetry.
const TAU=Math.PI*2;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normalized=a=>{const d=Math.hypot(...a);return d?a.map(v=>v/d):[0,1,0];};
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const softMinimum=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export function buildWeatheredBoulderData({scale=[1,.7,1.1],seed=1703,sectors=64,rings=26}={}){
 if(scale.length!==3||!scale.every(v=>Number.isFinite(v)&&v>0)||!Number.isInteger(sectors)||sectors<12||!Number.isInteger(rings)||rings<6)throw Error('Invalid boulder scale or tessellation.');
 const random=rng(seed),rr=(a,b)=>a+(b-a)*random(),planes=[];
 for(let i=0;i<10;i++){const a=i/10*TAU+rr(-.16,.16);planes.push({n:normalized([Math.cos(a),rr(-.24,.32),Math.sin(a)]),d:rr(.78,1.02)});}
 for(let i=0;i<5;i++){const a=i/5*TAU+rr(-.3,.3);planes.push({n:normalized([Math.cos(a)*rr(.18,.55),1,Math.sin(a)*rr(.18,.55)]),d:rr(.68,.88)});}
 for(let i=0;i<3;i++){const a=i/3*TAU;planes.push({n:normalized([Math.cos(a)*.14,-1,Math.sin(a)*.14]),d:rr(.76,.88)});}
 function sample(dir){let r=1.08;for(const plane of planes){const q=dot(dir,plane.n);if(q>.05)r=softMinimum(r,plane.d/q,.035);}const [x,y,z]=dir;r*=1+.021*Math.sin(x*7+z*11+y*3+seed)+.013*Math.sin(y*19+x*11-seed);return dir.map((v,i)=>v*r*scale[i]);}
 const positions=[],uvs=[],indices=[];
 const add=(p,u,v)=>{const i=positions.length/3;positions.push(...p);uvs.push(u,v);return i;};
 const levels=[];for(let j=1;j<rings;j++){const phi=-Math.PI/2+j/rings*Math.PI,row=[];for(let k=0;k<=sectors;k++){const a=(k===sectors?0:k/sectors)*TAU;row.push(add(sample([Math.cos(phi)*Math.cos(a),Math.sin(phi),Math.cos(phi)*Math.sin(a)]),k/sectors,j/rings));}levels.push(row);}
 for(let j=0;j<levels.length-1;j++)for(let k=0;k<sectors;k++){const a=levels[j][k],b=levels[j][k+1],c=levels[j+1][k],d=levels[j+1][k+1];indices.push(a,c,b,b,c,d);}
 for(let k=0;k<sectors;k++){const lo=add(sample([0,-1,0]),(k+.5)/sectors,0),hi=add(sample([0,1,0]),(k+.5)/sectors,1),last=levels.length-1;indices.push(lo,levels[0][k],levels[0][k+1],hi,levels[last][k+1],levels[last][k]);}
 const normals=new Float32Array(positions.length),sums=new Map(),keys=[];
 for(let i=0;i<positions.length;i+=3)keys.push(positions.slice(i,i+3).map(v=>Math.round(v*1e8)).join(','));
 for(let i=0;i<indices.length;i+=3){const ids=indices.slice(i,i+3),p=ids.map(k=>positions.slice(k*3,k*3+3)),n=cross(sub(p[1],p[0]),sub(p[2],p[0]));for(const k of ids){const a=sums.get(keys[k])??[0,0,0];for(let c=0;c<3;c++)a[c]+=n[c];sums.set(keys[k],a);}}
 for(let i=0;i<keys.length;i++)normals.set(normalized(sums.get(keys[i])),i*3);
 return{positions:new Float32Array(positions),normals,uvs:new Float32Array(uvs),indices:new Uint32Array(indices),scale:scale.slice(),seed,planes,scope:'Closed irregular rock body; UV/pole seam positions coincide. No physical geology or recovered photo dimension is claimed.'};
}
export function buildBoulderMossData(rock,{seed=rock.seed,offset=.0035}={}){
 const positions=[],normals=[],uvs=[],colors=[],s=rock.scale,phase=seed*.013;
 function vertex(k){const p=Array.from(rock.positions.slice(k*3,k*3+3)),n=Array.from(rock.normals.slice(k*3,k*3+3)),x=p[0]/s[0],y=p[1]/s[1],z=p[2]/s[2],pattern=.55*Math.sin(x*4.3+z*1.6+phase)*Math.cos(z*3.8-x*.7-phase)+.27*Math.sin((x-z)*8+phase)-.36+.07*y;return{p,n,f:Math.min(pattern,(n[1]-.30)*2)};}
 for(let i=0;i<rock.indices.length;i+=3){const tri=[0,1,2].map(k=>vertex(rock.indices[i+k])),poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],aa=a.f>=0,bb=b.f>=0;if(aa)poly.push(a);if(aa!==bb){const t=a.f/(a.f-b.f);poly.push({p:a.p.map((v,c)=>v+(b.p[c]-v)*t),n:normalized(a.n.map((v,c)=>v+(b.n[c]-v)*t)),f:0});}}
  for(let k=1;k<poly.length-1;k++)for(const v of[poly[0],poly[k],poly[k+1]]){const p=v.p.map((q,c)=>q+v.n[c]*offset),shade=.83+.13*Math.sin(p[0]*17+p[2]*13+phase);positions.push(...p);normals.push(...v.n);uvs.push(p[0]*1.5,p[2]*1.5);colors.push(shade*.94,shade,shade*.83);}
 }
 return{positions:new Float32Array(positions),normals:new Float32Array(normals),uvs:new Float32Array(uvs),colors:new Float32Array(colors),scope:'Continuous limited moss colonies clipped to actual upward rock faces. Not a green hemisphere or billboard.'};
}
export function createWeatheredBoulderGeometry(T,options){const d=buildWeatheredBoulderData(options),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(d.positions,3));g.setAttribute('normal',new T.BufferAttribute(d.normals,3));g.setAttribute('uv',new T.BufferAttribute(d.uvs,2));g.setIndex(new T.BufferAttribute(d.indices,1));g.userData.boulderData=d;return g;}
export function createBoulderMossGeometry(T,geometry,options){const d=buildBoulderMossData(geometry.userData.boulderData,options),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(d.positions,3));g.setAttribute('normal',new T.BufferAttribute(d.normals,3));g.setAttribute('uv',new T.BufferAttribute(d.uvs,2));g.setAttribute('color',new T.BufferAttribute(d.colors,3));return g;}
