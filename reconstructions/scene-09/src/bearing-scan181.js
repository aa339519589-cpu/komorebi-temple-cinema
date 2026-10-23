import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Actual CC BY sculpture component, already source-verified in library176.
// The component buffers and normals are retained. Only rigid placements and
// uniform physical fits are used; the open left cut is buried in a cheek.
export async function loadBearingScan181(materials){
 const loaded=await new GLTFLoader().loadAsync(new URL('../assets/carving176/cloud-scroll.glb',import.meta.url).href);let geometry;loaded.scene.traverse(o=>{if(o.isMesh){if(geometry)throw Error('Expected one verified176 carving primitive');geometry=o.geometry;}});if(!geometry)throw Error('Verified176 carving missing');
 const material=new T.MeshStandardMaterial({name:'scene09-181-source176-aged-gilt-carved-bearing',color:0xa68b55,roughness:.54,metalness:.81,envMapIntensity:.78});materials.push(material);
 const placements=[];
 return{mount(api){const {emit,box,materials:M}=api;
  for(const [row,xs,y,z,s]of[['lower',[-6.4,-3.2,0,3.2,6.4],6.81,6.13,.95],['upper',[-5.57,0,5.57],9.95,6.45,.85]])for(const x of xs){
   // Closed timber core, top receiver and side cheek support the actual
   // sculptural surface. The donor is an ornament, never a sole roof beam.
   box(x,y+s*.42,z-.16,s+.12,s*.94,.39,M.carvedTimber);box(x,y+s*.91,z-.12,s+.19,.14,.41,M.wood);
   box(x-s*.50-.012,y+s*.435,z+s*.135,.11,s*.95,s*.30,M.carvedTimber);
   emit(geometry,material,x,y,z,s,s,s);placements.push({row,position:[x,y,z],uniformScale:s,mount:'Closed timber core/top receiver and a left cheek bury the five measured source cut loops'});
  }
  return{revision:'scene09-source176-bounded-bearing-mount181-r04',source:'Wood Carving of Dragon by SCANOLOGY_3D / 3dscantech, CC BY4.0',sourceUrl:'https://sketchfab.com/3d-models/wood-carving-of-dragon-1336fa1889cf4eba829594fa30edd6ff',sourceComponentSha256:'0c693ba1108d00c08a8b76113998cfd498fef6cdd09ff4767d92b3a42825feee',trianglesPerComponent:geometry.index.count/3,placements,sourcePositionsNormalsAndIndicesUnchanged:true,physicalUnits:'Original source unit unknown; normalized width1 component fitted uniformly in metres',culture:'Unspecified by creator; not identified as a Japanese reference artifact',photoSampled:false,visualAccepted:false};
 }};
}
