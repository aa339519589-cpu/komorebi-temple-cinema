import * as T from 'three';
import {installRestoredBuddhaAssets} from './restoration-buddha.js';

// Actual indexed, lit 3D surfaces. The binary contains positions, normals,
// neutral object UVs, and triangle indices; it contains no captured pixels.
export async function loadSculpturalCastAssets(){
 // Promoted only after the actual upright full/native subfrustum inspection.
 // Live, reference, free camera, and film paths consume the same real mesh.
 const revision='r9';
 const base=new URL(`../assets/sculptural-cast-${revision}/`,import.meta.url),response=await fetch(new URL('manifest.json',base));
 if(!response.ok)throw Error('Physical cast manifest failed: '+response.status);
 const manifest=await response.json();if(manifest.revision!==`scene06-sculptural-cast-${revision}`)throw Error('Wrong cast asset revision');
 const variants={};
 for(const variant of['central','left','right'])variants[variant]=await Promise.all(manifest.variants[variant].map(async p=>{
  const response=await fetch(new URL(p.file,base));if(!response.ok)throw Error('Physical cast mesh failed: '+p.file);
  const buffer=await response.arrayBuffer(),head=new DataView(buffer);
  if(head.getUint32(0,true)!==0x37304353)throw Error('Wrong physical cast format');
  const n=head.getUint32(4,true),ni=head.getUint32(8,true);if(n!==p.vertices||ni!==p.triangles*3||buffer.byteLength!==20+n*32+ni*4)throw Error('Physical cast mesh length mismatch');
  let offset=20;const g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('normal',new T.BufferAttribute(new Float32Array(buffer,offset,n*3),3));offset+=n*12;
  g.setAttribute('uv',new T.BufferAttribute(new Float32Array(buffer,offset,n*2),2));offset+=n*8;
  g.setIndex(new T.BufferAttribute(new Uint32Array(buffer,offset,ni),1));g.computeBoundingBox();g.computeBoundingSphere();
  g.name=`scene06-${revision}-physical-cast-${variant}-${p.material}`;g.userData={variant,reconstruction:manifest.revision,generatedAsset:p.file,topology:p.topology??null,visualAccepted:false};
  return{geometry:g,material:p.material};
 }));
 installRestoredBuddhaAssets(variants);return manifest;
}
