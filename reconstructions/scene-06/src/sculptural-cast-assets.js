// Central source geometry and its adaptations: CC BY-NC-SA 4.0; see asset-specific license.
import * as T from 'three';
import {installRestoredBuddhaAssets} from './restoration-buddha.js';

// Actual indexed, lit 3D surfaces. The binary contains positions, normals,
// neutral object UVs, and triangle indices; it contains no captured pixels.
export async function loadSculpturalCastAssets(){
 // Connected source body: Scan-the-World Sainsbury Amida (NC-SA4).
 // Actual3D ray target: Buddha head by peel-3d.com (BY4), culture unspecified.
 // User authorized personal noncommercial adoption; this declared sculpture199
 // derivative keeps the R08a head/ears/scalp and original source indices;
 // its real left arm, neighboring garments and original hand are posed in the lap.
 // Original inputs retained. Both attributions in manifest. All
 // live/reference/free-camera/film views use the same indexed3D surfaces.
 const revision='r11';
 const base=new URL(`../assets/sculptural-cast-${revision}/`,import.meta.url),response=await fetch(new URL('manifest.json',base));
 if(!response.ok)throw Error('Physical cast manifest failed: '+response.status);
 const manifest=await response.json();if(manifest.revision!==`scene06-sculptural-cast-${revision}`)throw Error('Wrong cast asset revision');
 const foundationBase=new URL('../assets/centralpose295-r06-CC-BY-NC-SA-4.0/',import.meta.url),foundationResponse=await fetch(new URL('manifest.json',foundationBase));
 if(!foundationResponse.ok)throw Error('Paired-pose foundation manifest failed');
 const foundation=await foundationResponse.json();if(foundation.revision!=="scene06-centralpose295-r06-differential-left-arm-lap-pose")throw Error('Wrong NC actual-source revision');
 const sideBase=new URL('../assets/attendant-bearing-v4/',import.meta.url),sideResponse=await fetch(new URL('manifest.json',sideBase));
 if(!sideResponse.ok)throw Error('Closed attendant head manifest failed');
 const sideManifest=await sideResponse.json();if(sideManifest.revision!=='scene06-attendant-bearing-v4')throw Error('Wrong attendant head revision');
 const contactResponse=await fetch(new URL('../assets/lotus-contact179-r07/profiles.json',import.meta.url));if(!contactResponse.ok)throw Error('Measured lotus contact profiles failed');
 const contactProfiles=await contactResponse.json();if(contactProfiles.revision!=='scene06-lotus-contact179-r07')throw Error('Wrong measured contact profiles');
 const variants={};
 for(const variant of['central','left','right']){
  const current=variant==='central'?foundation:sideManifest,currentBase=variant==='central'?foundationBase:sideBase;
  variants[variant]=await Promise.all(current.variants[variant].map(async p=>{
  const response=await fetch(new URL(p.file,currentBase));if(!response.ok)throw Error('Physical cast mesh failed: '+p.file);
  const buffer=p.compression==='gzip'?await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():await response.arrayBuffer(),head=new DataView(buffer);
  if(head.getUint32(0,true)!==0x37304353)throw Error('Wrong physical cast format');
  const n=head.getUint32(4,true),ni=head.getUint32(8,true);if(n!==p.vertices||ni!==p.triangles*3||buffer.byteLength!==20+n*32+ni*4)throw Error('Physical cast mesh length mismatch');
  let offset=20;const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('uv',new T.BufferAttribute(new Float32Array(buffer,offset,n*2),2));offset+=n*8;
  g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,ni),1));g.computeBoundingBox();g.computeBoundingSphere();
  const coverage=variant==='central'?current.scalpMaterial?.coverage:null;
  if(coverage){const response=await fetch(new URL(coverage.file,currentBase));if(!response.ok)throw Error('Actual rooted-curl coverage failed');const bytes=await response.arrayBuffer(),h=new DataView(bytes);if(h.getUint32(0,true)!==0x37304d43||h.getUint32(4,true)!==n||bytes.byteLength!==20+n*2)throw Error('Wrong actual root coverage');const values=new Uint16Array(bytes,20,n),mask=new Float32Array(n);for(let v=0;v<n;v++)mask[v]=values[v]/65535;g.setAttribute('scalp199',new T.BufferAttribute(mask,1));}
  g.name=`${current.revision}-physical-cast-${variant}-${p.material}`;g.userData={variant,reconstruction:current.revision,generatedAsset:p.file,compression:p.compression??null,effectiveGeometrySha256:p.uncompressedSha256??p.sha256,topology:p.topology??null,nativeMaterial:current.materials?.[p.material]??null,nativeScalpMaterial:variant==='central'?current.scalpMaterial??null:null,license:current.license??null,attribution:current.attribution??null,visualAccepted:false};
  return{geometry:g,material:p.material};
  }));
 }
 installRestoredBuddhaAssets(variants);return{revision:`${foundation.revision}-with-${sideManifest.revision}`,foundation:foundation.revision,attendantFaces:sideManifest.revision,legacyAttendantBodies:manifest.revision,license:foundation.license,attribution:foundation.attribution,personalNoncommercialUseOnly:true,mainMetrics:{sourceContactProfiles:contactProfiles.profiles,sourceBearingOutline:foundation.sourceContactBearing?.outlineXZ,uniformWorldHeight:foundation.recommendedUniformWorldHeight,haloCenterModelY:foundation.recommendedCentralHaloCenterModelY,centralMandorlaZ:foundation.recommendedCentralMandorlaZ,mainLotusDepthAspect:foundation.recommendedMainLotusDepthAspect},visualAccepted:false};
}
