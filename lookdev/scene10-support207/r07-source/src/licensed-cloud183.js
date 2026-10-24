import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// An actual licensed carved source surface, uniformly normalized by lane176.
// Source topology and normals remain intact. Only deliberate planar mount
// cuts receive separately triangulated caps, including their nested hole.
export async function loadLicensedCloud183(){
 const base=new URL('../assets/cloud-scroll176/',import.meta.url),loader=new GLTFLoader();
 const [gltf,loopsResponse]=await Promise.all([loader.loadAsync(new URL('component-y-up-z-front.glb',base).href),fetch(new URL('measured-mount-loops.json',base))]);
 if(!loopsResponse.ok)throw Error('Carved cloud mount boundary did not load');
 const data=await loopsResponse.json();let surface;
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(o.isMesh){if(surface)throw Error('Expected one source cloud primitive');surface=o.geometry.clone();surface.applyMatrix4(o.matrixWorld);}});
 if(!surface||surface.attributes.position.count!==178930||surface.index?.count!==354787*3)throw Error('Licensed carved cloud source identity changed');
 const pointIn=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 const loops=data.loops.map(q=>{if(!q.closed||q.degreeAnomalies||q.mountPlane!=='left-x-cut')throw Error('Unexpected source mount boundary');return{points:q.points,poly:q.points.map(p=>[p[1],p[2]]),parent:null,depth:0};});
 for(const q of loops){const parents=loops.filter(p=>p!==q&&pointIn(q.poly[0],p.poly));q.depth=parents.length;q.parent=parents.find(p=>loops.filter(a=>a!==p&&pointIn(p.poly[0],a.poly)).length===q.depth-1)||null;}
 const pos=[],normals=[];
 for(const outer of loops.filter(q=>q.depth%2===0)){
  const holes=loops.filter(q=>q.parent===outer&&q.depth%2===1),all=[...outer.points,...holes.flatMap(q=>q.points)],triangles=T.ShapeUtils.triangulateShape(outer.poly.map(p=>new T.Vector2(...p)),holes.map(q=>q.poly.map(p=>new T.Vector2(...p))));
  for(let ids of triangles){const p=ids.map(i=>new T.Vector3(...all[i]));if(p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).x>0)ids=[ids[0],ids[2],ids[1]];for(const i of ids){pos.push(...all[i]);normals.push(-1,0,0);}}
 }
 const caps=new T.BufferGeometry();caps.setAttribute('position',new T.Float32BufferAttribute(pos,3));caps.setAttribute('normal',new T.Float32BufferAttribute(normals,3));caps.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(pos.length/3*2),2));
 caps.name='cloud183-separate-mount-caps-with-source-hole';
 function reflected(g){const q=g.clone();q.scale(-1,1,1);const indices=Array.from(q.index?.array??Array.from({length:q.attributes.position.count},(_,i)=>i));for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];q.setIndex(indices);return q;}
 return{surface,caps,reflectedSurface:reflected(surface),reflectedCaps:reflected(caps),info:{title:'Wood Carving of  Dragon',author:'SCANOLOGY_3D',source:'https://sketchfab.com/3d-models/wood-carving-of-dragon-1336fa1889cf4eba829594fa30edd6ff',license:'CC-BY-4.0',sourceTriangles:354787,sourceVertices:178930,mountLoops:loops.length,capTriangles:pos.length/9,preservedNestedMountHoles:loops.filter(q=>q.depth%2===1).length,sourcePositionsAndNormalsUnchanged:true,uniformPlacementOnly:true,visualAccepted:false}};
}
