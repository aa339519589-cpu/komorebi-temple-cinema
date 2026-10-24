// Actual source ceramic geometry versus actual source weather triangles.
// Pure CPU mesh collision query; no scene rendering, export or new asset.
import fs from 'node:fs';
import * as T from 'three';
import {createContinuousTimber,createClayCoverTile,createClayPanTile} from '../../reconstructions/scene-08/src/gallery-joinery.js';
import {createGrandRoofProfile213} from '../../reconstructions/scene-08/src/fine-hall213.js';
import * as hall from '../../reconstructions/scene-08/src/hall-timber213.js';
import {reconstructionSourceIdentity} from '../../tools/reconstruction-source-identity.mjs';
const round=process.argv[2]??'r16',s=fs.readFileSync('reconstructions/scene-08/src/scene.js','utf8'),identity=await reconstructionSourceIdentity(process.cwd(),'08');
const frame=Function('return '+s.match(/const grandFrame=(\{[^;]+\});/)[1])(),P=createGrandRoofProfile213({frame,w:frame.w,d:frame.d,eave:frame.eave,rise:frame.rise,curl:.34,ridgeRatio:.20}).point;
const cover=createClayCoverTile(),pan=createClayPanTile(),tiles=[],surfaces=[],noop=()=>{};
function ceramicEmit(g,ma,x=0,y=0,z=0,sx=1,sy=1,sz=1,rot=[0,0,0]){
 tiles.push({g,matrix:new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(sx,sy,sz))});
}
const wrappers=Function('T','v','emit','clayCoverG','clayPanG','role',s.slice(s.indexOf('function ceramicTile('),s.indexOf('const tileEndG='))+'return{ceramicTile,ceramicPan};')(T,a=>new T.Vector3(...a),ceramicEmit,cover,pan,'left-grand-hall');
const begin=s.indexOf('for(let side=0;side<4;side++){const pp=[]'),end=s.indexOf('if(falling)emit(createContinuousTimber(Array.from');
Function('T','P','falling','role','mats','emit','createContinuousTimber','ceramicTile','ceramicPan','eaveTileEnd','bevelBox','boxG','between','line','w','d','hornHeight','surfaceNormal213','roofRowWidth213',s.slice(begin,end))(
 T,P,true,'left-grand-hall',{tile:{},wood:{},red:{}},(g,ma)=>{if(ma==='tile')surfaces.push(g)},createContinuousTimber,wrappers.ceramicTile,wrappers.ceramicPan,noop,(w,h,d)=>new T.BoxGeometry(w,h,d),new T.BoxGeometry(1,1,1),noop,noop,frame.w,frame.d,.30,hall.surfaceNormal213,hall.roofRowWidth213
);
const grid=new Map(),cell=.50,key=(x,z)=>Math.floor(x/cell)+','+Math.floor(z/cell);
for(const g of surfaces){const p=g.attributes.position;for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-10)continue;const tri={a,b,c,den};for(let x=Math.floor(Math.min(a.x,b.x,c.x)/cell);x<=Math.floor(Math.max(a.x,b.x,c.x)/cell);x++)for(let z=Math.floor(Math.min(a.z,b.z,c.z)/cell);z<=Math.floor(Math.max(a.z,b.z,c.z)/cell);z++){const k=x+','+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(tri);}}}
function height(x,z){let y=-Infinity;for(const{a,b,c,den}of grid.get(key(x,z))??[]){const A=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,B=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den,C=1-A-B;if(Math.min(A,B,C)>=-1e-6)y=Math.max(y,A*a.y+B*b.y+C*c.y);}return Number.isFinite(y)?y:null;}
const counts={cover:0,pan:0,verticesInRoof:0,verticesOutsideWeatherFootprint:0,belowSoffitVertices:0,penetratingTileBodies:0},bad=[];let min=Infinity;
for(let i=0;i<tiles.length;i++){
 const{g,matrix}=tiles[i],type=g===cover?'cover':'pan',p=g.attributes.position;counts[type]++;let localMin=Infinity,below=0;
 for(let k=0;k<p.count;k++){const v=new T.Vector3().fromBufferAttribute(p,k).applyMatrix4(matrix),h=height(v.x,v.z);if(h===null){counts.verticesOutsideWeatherFootprint++;continue;}counts.verticesInRoof++;const gap=v.y-(h-.14);min=Math.min(min,gap);localMin=Math.min(localMin,gap);if(gap<-.005){counts.belowSoffitVertices++;below++;}}
 if(below){counts.penetratingTileBodies++;if(bad.length<16)bad.push({instance:i,type,minimumSoffitClearance:localMin,belowSoffitVertices:below});}
}
const r={source:identity.hash,round,scope:'Pure CPU actual ceramic wrappers and source roof-authoring block, actual closed ceramic mesh vertices versus actual weather triangles shifted down .14m for the real soffit. No renderer/export.',counts,minimumSoffitClearanceMetres:min,firstViolations:bad,allSampledCeramicVerticesAboveSoffit:counts.belowSoffitVertices===0,visualAccepted:false};
fs.writeFileSync(`lookdev/scene08-rebuild213/ceramic-clearance-${round}.json`,JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r,null,2));
