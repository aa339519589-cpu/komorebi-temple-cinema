import * as T from 'three';

// Original project sculpture, authored metres. No material is silently
// assigned. Host supplies gilt/body and rear-cut wood material roles.
const sha256=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
export function parseAuthoredCapital254(bytes,component){
 const h=new DataView(bytes),n=h.getUint32(4,true),ni=h.getUint32(8,true);
 if(h.getUint32(0,true)!==0x37304353||bytes.byteLength!==20+n*32+ni*4)throw Error('254 invalid authored SC07');
 const g=new T.BufferGeometry();let o=20;
 for(const [name,size]of[['position',3],['normal',3],['uv',2]]){g.setAttribute(name,new T.BufferAttribute(new Float32Array(bytes,o,n*size),size));o+=n*size*4;}
 g.setIndex(new T.BufferAttribute(new Uint32Array(bytes,o,ni),1));
 const roles=[];for(const group of component.materialGroups){let role=roles.indexOf(group.role);if(role<0){role=roles.length;roles.push(group.role);}g.addGroup(group.start,group.count,role);}
 g.computeBoundingBox();g.computeBoundingSphere();g.userData={authoredCapital254:true,closedCarvedShell:true,coincidentNormalsSmoothed:true,finalSurfaceNormalsOutward:true,sourceNormalProtection254:true,positionsNormalsUvMustRemainAligned:true,allAttributesExtendedTogether:true,originalSourceScan:false,referenceRasterSampled:false,authoredUV:true,materialRoles:roles};return g;
}
export async function loadAuthoredCapitals254({baseURL=new URL('./authored-r01b/',import.meta.url)}={}){
 const r=await fetch(new URL('manifest.json',baseURL));if(!r.ok)throw Error('254 authored manifest unavailable');const manifest=await r.json(),variants={};
 for(const component of manifest.components){const response=await fetch(new URL(component.file,baseURL));if(!response.ok)throw Error('254 authored component unavailable');const bytes=await response.arrayBuffer();if(await sha256(bytes)!==component.sha256)throw Error('254 authored geometry hash differs');const geometry=parseAuthoredCapital254(bytes,component);variants[component.variant]={geometry,component,roles:geometry.userData.materialRoles};}
 return{manifest,variants};
}
export function mirrorAuthoredCapital254(source){
 const g=source.clone(),p=g.attributes.position,n=g.attributes.normal,ix=g.index;
 for(let i=0;i<p.count;i++)p.setX(i,-p.getX(i));for(let i=0;i<n.count;i++)n.setX(i,-n.getX(i));
 for(let i=0;i<ix.count;i+=3){const b=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,b);}
 g.computeBoundingBox();g.computeBoundingSphere();g.userData={...g.userData,isometricXReflection254:true,negativeInstanceScale:false};return g;
}
export function capital254RoleParts(geometry){
 return geometry.groups.map(group=>{
  const remap=new Int32Array(geometry.attributes.position.count).fill(-1),used=[],indices=new Uint32Array(group.count);
  for(let k=0;k<group.count;k++){const source=geometry.index.array[group.start+k];if(remap[source]<0){remap[source]=used.length;used.push(source);}indices[k]=remap[source];}
  const g=new T.BufferGeometry();
  for(const [name,attribute]of Object.entries(geometry.attributes)){
   if(attribute.isInterleavedBufferAttribute)throw Error('254 role compaction requires aligned, noninterleaved source attributes');
   const array=new attribute.array.constructor(used.length*attribute.itemSize);
   for(let k=0;k<used.length;k++)for(let j=0;j<attribute.itemSize;j++)array[k*attribute.itemSize+j]=attribute.array[used[k]*attribute.itemSize+j];
   const compact=new T.BufferAttribute(array,attribute.itemSize,attribute.normalized);compact.name=attribute.name;compact.setUsage(attribute.usage);compact.gpuType=attribute.gpuType;g.setAttribute(name,compact);
  }
  g.setIndex(new T.BufferAttribute(indices,1));g.computeBoundingBox();g.computeBoundingSphere();
  g.userData={...geometry.userData,closedCarvedShell:false,assembledCapitalClosed:true,roleSubsetNotIndividuallyWatertight:true,roleUnusedVerticesRemoved:true,sourceMasterVertices:geometry.attributes.position.count,roleReferencedVertices:used.length,roleTriangleCornersUnchanged:true};
  return{geometry:g,role:geometry.userData.materialRoles[group.materialIndex]};
 });
}
export function fitAuthoredCapital254(component,{worldTarget,topWorldY=.604,rearWorldZ=3.000,parentScale=[.6216,.8,.74]}={}){
 const size=component.bounds.size,target=worldTarget||(component.variant==='inner'?[.274,.132,.064]:[.154,.064,.064]),s=Math.min(...size.map((x,i)=>target[i]/x));
 return{uniformWorldScale:s,worldSize:size.map(x=>x*s),positiveLocalScale:parentScale.map(x=>s/x),localTopY:(topWorldY-.036)/.8,localRearZ:2.53+(rearWorldZ-2.70)/.74,worldFront:rearWorldZ+component.bounds.max[2]*s,shapeNotForcedToAllBounds:true};
}
export function attachAuthoredCapital254(b,loaded,{variant='inner',x,postLocalZ,hand=1,materialKeys,topWorldY=.604,rearOffsetWorld=.0484,worldTarget}={}){
 const asset=loaded.variants[variant];if(!asset)throw Error('254 missing authored variant');if(!materialKeys)throw Error('254 host must explicitly choose material roles');
 const rearWorldZ=2.70+.74*(postLocalZ-2.53)+rearOffsetWorld,fit=fitAuthoredCapital254(asset.component,{worldTarget,topWorldY,rearWorldZ}),geometry=hand<0?mirrorAuthoredCapital254(asset.geometry):asset.geometry;
 if(fit.worldFront>3.0700001&&postLocalZ>2.5)throw Error('254 capital enters the preserved cushion clearance');
 const parts=capital254RoleParts(geometry);
 for(const [i,part]of parts.entries()){
  const key=materialKeys[part.role];if(!key)throw Error('254 unmapped material role '+part.role);
  b.add(b.geometry('capital254-'+loaded.manifest.revision+'-'+variant+'-'+hand+'-'+i,()=>part.geometry),key,x,fit.localTopY,fit.localRearZ,...fit.positiveLocalScale);
 }
 return{variant,hand,fit,source:loaded.manifest.revision,photographicAcceptance:false};
}
