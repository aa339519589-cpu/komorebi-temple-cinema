import * as T from 'three';

const base='/reconstructions/scene-06/assets/carving176-altar198-CC-BY-4.0/';
const expected='6b88a3785d280d79b41c518dc1357cd4d6526b69164fc23a32f30f98c19b2fb3';
const sha=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');

// Read-only reuse of an existing authorised component, not another building.
// Positions/normals remain original; only material grouping and an isometric
// X reflection are prepared. The five documented mount cuts get planar caps.
export async function loadLicensedCloud220(){
 const [a,b]=await Promise.all([fetch(base+'cloud-scroll-sc07.bin'),fetch(base+'cloud-scroll-mount-loops.json')]);
 if(!a.ok||!b.ok)throw Error('Scene05 licensed cloud source failed');
 const buffer=await a.arrayBuffer(),mountBytes=await b.arrayBuffer(),actual=await sha(buffer);
 if(actual!==expected)throw Error('Scene05 licensed cloud source identity changed');
 const h=new DataView(buffer),n=h.getUint32(4,true),ni=h.getUint32(8,true);
 if(h.getUint32(0,true)!==0x37304353||buffer.byteLength!==20+n*32+ni*4)throw Error('Invalid source SC07');
 let offset=20;const p=new Float32Array(buffer,offset,n*3);offset+=n*12;const normals=new Float32Array(buffer,offset,n*3);offset+=n*12;const uv=new Float32Array(buffer,offset,n*2);offset+=n*8;const index=new Uint32Array(buffer,offset,ni),wood=[],gilt=[];
 for(let i=0;i<ni;i+=3){const depth=(p[index[i]*3+2]+p[index[i+1]*3+2]+p[index[i+2]*3+2])/3;(depth>.105?gilt:wood).push(index[i],index[i+1],index[i+2]);}
 const mirrorP=p.slice(),mirrorN=normals.slice();for(let i=0;i<n;i++){mirrorP[i*3]*=-1;mirrorN[i*3]*=-1;}
 const owned=[],variants=[];
 for(const mirror of[false,true]){
  const parts=[];
  for(const [ids,material]of[[wood,'scannedWood220'],[gilt,'scannedGilt220']]){
   const g=new T.BufferGeometry(),indices=new Uint32Array(ids);if(mirror)for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
   g.setAttribute('position',new T.BufferAttribute(mirror?mirrorP:p,3));g.setAttribute('normal',new T.BufferAttribute(mirror?mirrorN:normals,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(indices,1));g.computeBoundingBox();g.computeBoundingSphere();g.userData={licensedCarving220Shared:true,sourceVerticesAndNormalsRetained:true,isometricMirrorX:mirror,source:'SCANOLOGY/SCANTECH_3D actual carved cloud176',license:'CC-BY-4.0'};owned.push(g);parts.push({geometry:g,material});
  }
  variants.push(parts);
 }
 const mounts=JSON.parse(new TextDecoder().decode(mountBytes)),cp=[],cn=[],cu=[],ci=[];
 for(const loop of mounts.loops){
  if(!loop.closed||!loop.mountPlane.endsWith('x-cut'))throw Error('Unsupported actual carving mount cut');
  const contour=loop.points.map(p=>new T.Vector2(p[1],p[2])),triangles=T.ShapeUtils.triangulateShape(contour,[]),start=cp.length/3,sign=loop.mountPlane.startsWith('left')?-1:1;
  for(const p of loop.points){cp.push(...p.map(Math.fround));cn.push(sign,0,0);cu.push(p[1],p[2]);}
  for(const tri of triangles){const a=new T.Vector3(...loop.points[tri[0]]),b=new T.Vector3(...loop.points[tri[1]]),c=new T.Vector3(...loop.points[tri[2]]);if(b.sub(a).cross(c.sub(a)).x*sign<0)tri.reverse();ci.push(...tri.map(i=>i+start));}
 }
 for(const [mirror,parts]of variants.entries()){
  const g=new T.BufferGeometry(),pos=new Float32Array(cp),nor=new Float32Array(cn),ids=new Uint32Array(ci);if(mirror){for(let i=0;i<pos.length;i+=3){pos[i]*=-1;nor[i]*=-1;}for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];}
  g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('normal',new T.BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(cu,2));g.setIndex(new T.BufferAttribute(ids,1));g.computeBoundingBox();g.computeBoundingSphere();g.userData={licensedCarving220Shared:true,authoredExactMountCaps220:true,isometricMirrorX:!!mirror};owned.push(g);parts.push({geometry:g,material:'scannedWood220'});
 }
 const info={source:'Wood Carving of Dragon',creator:'SCANTECH_3D / stored package SCANOLOGY_3D (@3dscantech)',url:'https://sketchfab.com/3d-models/wood-carving-of-dragon-1336fa1889cf4eba829594fa30edd6ff',license:'CC-BY-4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',sourceSha256:actual,sourceVertices:n,sourceTriangles:ni/3,retainedOriginalTriangles:(wood.length+gilt.length)/3,mountClosures:mounts.loops.length,geometryChange:'No remesh, smoothing, compression, crop or deformation. Original176 extraction positions/normals and all triangles retained; reflected variant is an exact isometric mirror with corrected winding. Five existing planar source mount cuts receive authored caps.',finish:'Authored aged wood and a foreground-ridge gilt material; no source/reference RGB texture',scope:'Only the main occupied-storey central window carving, in a separate physical timber frame. Creator culture/era/original site unspecified; different artifact, not a recovered Japanese reference carving or replacement building.',rawAssetCopied:false,photographicAcceptance:false};
 return{variants,info,dispose(){for(const g of owned)g.dispose();}};
}
