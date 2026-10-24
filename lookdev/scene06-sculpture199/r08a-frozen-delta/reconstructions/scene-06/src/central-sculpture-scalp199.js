import * as T from 'three';
// True 3D root-footprint color on the original standard metallic surface.
export function installCentralScalp199(material,geometry,definition){
 if(!definition)return;const mask=geometry.getAttribute('scalp199');if(!mask)throw Error('Sculpted root coverage missing');
 if(Math.abs(material.metalness-definition.metalness)>1e-12||Math.abs(material.roughness-definition.roughness)>1e-12)throw Error('Original gold response changed');
 const source=material.color.toArray(),ratio=definition.baseColorLinear.slice(0,3).map((v,c)=>v/source[c]),colors=new Float32Array(mask.count*3);
 for(let v=0;v<mask.count;v++){const w=mask.getX(v);for(let c=0;c<3;c++)colors[v*3+c]=1+w*(ratio[c]-1);}
 geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.deleteAttribute('scalp199');material.vertexColors=true;material.userData.scalpMaterial199=definition;material.needsUpdate=true;
}
