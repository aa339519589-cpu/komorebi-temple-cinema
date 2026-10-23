import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Existing shared, declared CC0 botanical asset: Amal Kumar / Poly Haven.
// Each variant keeps the photographed leaf albedo on its actual 3D stems and
// leaves. Ground contact and every placement remain authored scene geometry.
export async function loadLicensedGroundcover142(){
 const asset=await new GLTFLoader().loadAsync('/assets/polyhaven/periwinkle-plant/periwinkle_plant_4k.gltf'),variants=[],textures=new Set(),leaves=[];asset.scene.updateMatrixWorld(true);
 for(const root of asset.scene.children){
  const parts=[];root.traverse(o=>{if(o.isMesh)parts.push({geometry:o.geometry.clone().applyMatrix4(o.matrixWorld),original:o.material});});if(!parts.length)continue;
  const bounds=new T.Box3();for(const part of parts){part.geometry.computeBoundingBox();bounds.union(part.geometry.boundingBox);}
  const height=bounds.max.y-bounds.min.y,centre=bounds.getCenter(new T.Vector3());let triangles=0;
  for(const part of parts){
   part.geometry.translate(-centre.x,-bounds.min.y,-centre.z);part.geometry.scale(1/height,1/height,1/height);
   const src=part.original,ma=new T.MeshPhysicalMaterial({name:'scene10-licensed-groundcover142',map:src.map,normalMap:src.normalMap,normalScale:new T.Vector2(.68,.68),roughnessMap:src.roughnessMap,color:'#b8c7ad',roughness:.76,metalness:0,side:T.DoubleSide,clearcoat:.18,clearcoatRoughness:.22,alphaTest:.42,transparent:false});
   ma.emissive.set('#183411');ma.emissiveIntensity=.035;
   for(const key of['map','normalMap','roughnessMap'])if(ma[key])textures.add(ma[key]);part.material=ma;delete part.original;triangles+=(part.geometry.index?.count||part.geometry.attributes.position.count)/3;
   if(leaves.length<4){
    // Isolate complete connected green blades from the licensed model. Their
    // real curved mesh, normals and atlas coordinates remain intact; only a
    // rigid leaf basis and uniform length normalization are applied.
    const source=part.geometry,p=source.attributes.position,uv=source.attributes.uv,index=source.index,parent=Array.from({length:p.count},(_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
    for(let i=0;i<index.count;i+=3){parent[find(index.getX(i+1))]=find(index.getX(i));parent[find(index.getX(i+2))]=find(index.getX(i));}
    const connected=new Map();for(let i=0;i<p.count;i++){const root=find(i);if(!connected.has(root))connected.set(root,[]);connected.get(root).push(i);}
    for(const ids of connected.values()){
     if(leaves.length>=4)break;
     const uu=ids.map(i=>uv.getX(i)),vv=ids.map(i=>uv.getY(i));
     if(ids.length!==55||Math.min(...uu)<.59||Math.max(...uu)>.89||Math.min(...vv)<.78||Math.max(...vv)>.99)continue;
     const baseId=ids[uu.indexOf(Math.min(...uu))],tipId=ids[uu.indexOf(Math.max(...uu))],base=new T.Vector3().fromBufferAttribute(p,baseId),tip=new T.Vector3().fromBufferAttribute(p,tipId),length=base.distanceTo(tip),axisZ=tip.sub(base).normalize(),axisY=new T.Vector3();
     for(const id of ids)axisY.add(new T.Vector3().fromBufferAttribute(source.attributes.normal,id));axisY.normalize();
     const axisX=axisY.clone().cross(axisZ).normalize();axisY.copy(axisZ).cross(axisX).normalize();
     const positions=[],normals=[],coords=[],indices=[],remap=new Map(ids.map((id,i)=>[id,i]));
     for(const id of ids){
      const delta=new T.Vector3().fromBufferAttribute(p,id).sub(base),n=new T.Vector3().fromBufferAttribute(source.attributes.normal,id);positions.push(delta.dot(axisX)/length,delta.dot(axisY)/length,delta.dot(axisZ)/length);normals.push(n.dot(axisX),n.dot(axisY),n.dot(axisZ));coords.push(uv.getX(id),uv.getY(id));
     }
     for(let i=0;i<index.count;i+=3)if(remap.has(index.getX(i)))indices.push(remap.get(index.getX(i)),remap.get(index.getX(i+1)),remap.get(index.getX(i+2)));
     const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(coords,2));geometry.setIndex(indices);geometry.name='licensed-real-curved-green-leaf142-'+leaves.length;geometry.userData.source={asset:'periwinkle_plant',connectedVertices:55,originalAtlasUV:true,rigidBasisOnly:true};leaves.push({geometry,material:ma,sourceLength:length});
    }
   }
  }
  variants.push({parts,height,triangles,sourceName:root.name});
 }
 if(leaves.length!==4)throw Error('Expected four complete licensed green leaf components.');
 return{variants,leaves,info:{asset:'periwinkle_plant',author:'Amal Kumar',provider:'Poly Haven',license:'CC0-1.0',source:'https://polyhaven.com/a/periwinkle_plant',provenance:'assets/polyhaven/periwinkle-plant/provenance.json',use:'Whole three-dimensional groundcover and four complete curved green leaf components with unchanged source normals, topology and atlas UVs; no supplied scene photograph in radiance, backdrop or geometry.',leafComponents:leaves.map(l=>({vertices:l.geometry.attributes.position.count,triangles:l.geometry.index.count/3,originalAtlasUV:true})),variants:variants.map(v=>({name:v.sourceName,sourceHeight:v.height,triangles:v.triangles})),visualAccepted:false},dispose(){for(const v of variants)for(const p of v.parts){p.geometry.dispose();p.material.dispose();}for(const l of leaves)l.geometry.dispose();for(const t of textures)t.dispose();}};
}
