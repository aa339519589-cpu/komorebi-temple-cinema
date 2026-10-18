// Broad irregular evergreen crown layers for the new photo4 garden only.
// The actual branch/pad anchor is supplied by the complete tree; this is not a
// tree billboard, light emitter, camera-facing card or copied photograph.
const TAU=Math.PI*2;
function normalize(a){const n=Math.hypot(...a);return n?a.map(x=>x/n):[0,1,0];}
export function buildPrunedCrownData({radiusX=.75,radiusZ=.53,halfHeight=.23,phase=0,sectors=64,rings=22}={}){
 if(![radiusX,radiusZ,halfHeight].every(x=>Number.isFinite(x)&&x>0))throw Error('Positive finite crown dimensions are required.');
 const p=[],uv=[],colors=[],index=[];
 function add(x,y,z,u,v){const i=p.length/3;p.push(x,y,z);uv.push(u,v);const q=.88+.07*Math.sin(x*9+z*13+phase)+.035*Math.sin(y*23-z*7);colors.push(q*.97,q,q*.92);return i;}
 const levels=[];
 for(let j=1;j<rings;j++){const phi=-Math.PI/2+j/rings*Math.PI,t=Math.sin(phi),r=Math.cos(phi),row=[];for(let k=0;k<=sectors;k++){const a=(k===sectors?0:k/sectors)*TAU,lobe=1+.17*Math.sin(a*3+phase)+.065*Math.sin(a*7-phase)+.035*Math.sin(a*13+phase*.3),x=radiusX*r*lobe*Math.cos(a),z=radiusZ*r*lobe*Math.sin(a),rim=.025*Math.sin(a*5+phase)*r*r,texture=.018*Math.sin(x*14+phase)*Math.cos(z*17-phase)*r*Math.abs(t),y=Math.sign(t)*halfHeight*Math.pow(Math.abs(t),.72)+rim+texture;row.push(add(x,y,z,k/sectors,j/rings));}levels.push(row);}
 for(let j=0;j<levels.length-1;j++)for(let k=0;k<sectors;k++){const a=levels[j][k],b=levels[j][k+1],c=levels[j+1][k],d=levels[j+1][k+1];index.push(a,c,b,b,c,d);}
 for(let k=0;k<sectors;k++){const lo=add(0,-halfHeight,0,(k+.5)/sectors,0),hi=add(0,halfHeight,0,(k+.5)/sectors,1),end=levels.length-1;index.push(lo,levels[0][k],levels[0][k+1],hi,levels[end][k+1],levels[end][k]);}
 const keys=[],sum=new Map();for(let i=0;i<p.length;i+=3)keys.push(p.slice(i,i+3).map(x=>Math.round(x*1e8)).join(','));
 for(let i=0;i<index.length;i+=3){const ids=index.slice(i,i+3),a=ids.map(k=>p.slice(k*3,k*3+3)),b=a[1].map((x,k)=>x-a[0][k]),c=a[2].map((x,k)=>x-a[0][k]),n=[b[1]*c[2]-b[2]*c[1],b[2]*c[0]-b[0]*c[2],b[0]*c[1]-b[1]*c[0]];for(const k of ids){const q=sum.get(keys[k])??[0,0,0];for(let axis=0;axis<3;axis++)q[axis]+=n[axis];sum.set(keys[k],q);}}
 const normals=new Float32Array(p.length);for(let i=0;i<keys.length;i++)normals.set(normalize(sum.get(keys[i])),i*3);
 return{positions:new Float32Array(p),normals,uvs:new Float32Array(uv),colors:new Float32Array(colors),indices:new Uint32Array(index),dimensions:{radiusX,radiusZ,halfHeight},phase,scope:'Closed lobed green foliage aggregate attached to a real bough. Original-photo-informed volume, not a recovered botanical scan.'};
}
export function createPrunedCrownGeometry(T,options){const d=buildPrunedCrownData(options),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(d.positions,3));g.setAttribute('normal',new T.BufferAttribute(d.normals,3));g.setAttribute('uv',new T.BufferAttribute(d.uvs,2));g.setAttribute('color',new T.BufferAttribute(d.colors,3));g.setIndex(new T.BufferAttribute(d.indices,1));return g;}
