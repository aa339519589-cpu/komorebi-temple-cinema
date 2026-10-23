// Central source geometry and its adaptations: CC BY-NC-SA 4.0; see asset-specific license.
import * as T from 'three';
import {installRestoredBuddhaAssets} from './restoration-buddha.js';

// Actual indexed, lit 3D surfaces. The binary contains positions, normals,
// neutral object UVs, and triangle indices; it contains no captured pixels.
export async function loadSculpturalCastAssets(){
 // Main body uses actual Scan-the-World Japanese Amida geometry (CC BY-NC-SA4).
 // User authorized personal noncommercial adoption; original face is unchanged. All
 // live/reference/free-camera/film views use the same indexed3D surfaces.
 const revision='r11';
 const base=new URL(`../assets/sculptural-cast-${revision}/`,import.meta.url),response=await fetch(new URL('manifest.json',base));
 if(!response.ok)throw Error('Physical cast manifest failed: '+response.status);
 const manifest=await response.json();if(manifest.revision!==`scene06-sculptural-cast-${revision}`)throw Error('Wrong cast asset revision');
 const foundationBase=new URL('../assets/nc-sainsbury-amida179-CC-BY-NC-SA-4.0/',import.meta.url),foundationResponse=await fetch(new URL('manifest.json',foundationBase));
 if(!foundationResponse.ok)throw Error('Paired-pose foundation manifest failed');
 const foundation=await foundationResponse.json();if(foundation.revision!=='scene06-nc-sainsbury-amida179-r01')throw Error('Wrong NC actual-source revision');
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
  const buffer=await response.arrayBuffer(),head=new DataView(buffer);
  if(head.getUint32(0,true)!==0x37304353)throw Error('Wrong physical cast format');
  const n=head.getUint32(4,true),ni=head.getUint32(8,true);if(n!==p.vertices||ni!==p.triangles*3||buffer.byteLength!==20+n*32+ni*4)throw Error('Physical cast mesh length mismatch');
  let offset=20;const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('uv',new T.BufferAttribute(new Float32Array(buffer,offset,n*2),2));offset+=n*8;
  g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,ni),1));g.computeBoundingBox();g.computeBoundingSphere();
  g.name=`${current.revision}-physical-cast-${variant}-${p.material}`;g.userData={variant,reconstruction:current.revision,generatedAsset:p.file,topology:p.topology??null,nativeMaterial:current.materials?.[p.material]??null,license:current.license??null,attribution:current.attribution??null,visualAccepted:false};
  return{geometry:g,material:p.material};
  }));
 }
 installRestoredBuddhaAssets(variants);return{revision:'scene06-nc-adoption179-r08-CC-BY-NC-SA4-with-v4-attendants',foundation:foundation.revision,attendantFaces:sideManifest.revision,legacyAttendantBodies:manifest.revision,license:foundation.license,attribution:foundation.attribution,personalNoncommercialUseOnly:true,mainMetrics:{sourceContactProfiles:contactProfiles.profiles,sourceBearingOutline:foundation.sourceContactBearing?.outlineXZ,uniformWorldHeight:foundation.recommendedUniformWorldHeight,haloCenterModelY:foundation.recommendedCentralHaloCenterModelY,centralMandorlaZ:foundation.recommendedCentralMandorlaZ,mainLotusDepthAspect:foundation.recommendedMainLotusDepthAspect},visualAccepted:false};
}
