import * as T from 'three';
import {sampleSculptedField212} from './scene04-sculpted-core212.js';
import {setTimberEndGrainAttributes212} from './scene04-timber-precision134.js';

// Sculpt the existing closed timber itself. Shared-edge subdivision carries
// every front split into its adjacent bevel face, avoiding an overlay panel.
export function carveBearingSolid212(raw,{shape,width,height,centres=[[-2.13,.34],[0,.52],[2.13,.34]],depth=.032,frontCove=0,continuous=0,grainAxis=0}={}){
 const p=raw.attributes.position,n=raw.attributes.normal,vertices=[],cache=new Map(),vertex=q=>{const key=q.x.toFixed(6)+':'+q.y.toFixed(6)+':'+q.z.toFixed(6);if(cache.has(key))return cache.get(key);const at=vertices.length;vertices.push(q);cache.set(key,at);return at;};
 let faces=[],front=-Infinity;for(let i=0;i<p.count;i++)front=Math.max(front,p.getZ(i));
 for(let i=0;i<p.count;i+=3)faces.push({v:[0,1,2].map(k=>vertex(new T.Vector3().fromBufferAttribute(p,i+k))),front:[0,1,2].every(k=>n.getZ(i+k)>.995)});
 const key=(a,b)=>a<b?a+':'+b:b+':'+a,spacing=.018;
 for(let level=0;level<12;level++){
  const split=new Map();for(const f of faces)if(f.front)for(let k=0;k<3;k++){const a=f.v[k],b=f.v[(k+1)%3];if(vertices[a].distanceToSquared(vertices[b])>spacing*spacing&&!split.has(key(a,b))){split.set(key(a,b),vertices.length);vertices.push(vertices[a].clone().add(vertices[b]).multiplyScalar(.5));}}
  if(!split.size)break;const next=[];
  for(const f of faces){let[a,b,c]=f.v,ab=split.get(key(a,b)),bc=split.get(key(b,c)),ca=split.get(key(c,a)),count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);const add=(...v)=>next.push({v,front:f.front});if(!count){next.push(f);continue;}if(count===3){add(a,ab,ca);add(ab,b,bc);add(ca,bc,c);add(ab,bc,ca);continue;}if(count===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}add(a,ab,c);add(ab,b,c);}else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}add(b,bc,ab);add(a,ab,c);add(ab,bc,c);}}
  faces=next;
 }
 const boundary=shape.extractPoints(18).shape,distance=(x,y)=>{let nearest=Infinity;for(let k=0;k<boundary.length;k++){const a=boundary[k],b=boundary[(k+1)%boundary.length],dx=b.x-a.x,dy=b.y-a.y,t=T.MathUtils.clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);nearest=Math.min(nearest,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));}return nearest;},gild=[];
 for(const q of vertices){const fore=T.MathUtils.smoothstep(q.z,front-.022,front-.002),gate=fore*T.MathUtils.smoothstep(distance(q.x,q.y),.046,.085),u=T.MathUtils.clamp(q.x/(width*.92)+.5,0,1),v=T.MathUtils.clamp((q.y/height+.58)/.96,0,1),s=sampleSculptedField212(u,v),cove=frontCove*Math.max(0,1-Math.pow((v-.5)*2,2));q.z+=(depth*(s-.45)-cove)*gate;let area=0;for(const[c,w]of centres)area=Math.max(area,Math.exp(-Math.pow((q.x-c)/w,4)));gild.push(gate*(continuous+(1-continuous)*area)*T.MathUtils.smoothstep(s,.55,.80));}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices.flatMap(q=>q.toArray()),3));g.setAttribute('uv',new T.Float32BufferAttribute(vertices.flatMap(q=>grainAxis===1?[q.y/1.45,q.x/.38]:[q.x/1.45,q.y/.38]),2));g.setAttribute('beam212Gilt',new T.Float32BufferAttribute(gild,1));g.setIndex(faces.flatMap(f=>f.v));g.computeVertexNormals();setTimberEndGrainAttributes212(g,grainAxis);g.userData.architectureMember='scene04-212-continuous-carved-closed-bearing-solid';g.userData.carvedBearing212={frontEdgeSpacingMetres:spacing,sculptDepthMetres:depth,recessedCoveMetres:frontCove,continuousGiltFraction:continuous,guide:'Independent nonmetric212 scalar; no guideRGB material',actualFrontSubstance:true,overlayMesh:false,conformingGildingOnSameVertices:true,visualAccepted:false};raw.dispose();return g;
}

export function createCarvedBeamMaterial212(source,name){
 const m=source.clone(),prior=source.onBeforeCompile;m.name=name;m.onBeforeCompile=(s,r)=>{prior.call(m,s,r);s.vertexShader='attribute float beam212Gilt;varying float vBeam212Gilt;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBeam212Gilt=beam212Gilt;');s.fragmentShader='varying float vBeam212Gilt;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.68,.46,.17),vBeam212Gilt);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.35,vBeam212Gilt);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(metalnessFactor,.90,vBeam212Gilt);');};m.customProgramCacheKey=()=> 'scene04-212-carved-solid-conforming-gold-r23-'+name;m.userData.carvedBearing212={actualVertexSubstance:true,localGildedWoodResponse:true,materialImageFromReference:false};return m;
}
