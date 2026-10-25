import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Metric rush weave and wrapped textile edging. The reference supports the
// transverse mat band; thickness and concealed construction are inferred.
// No reference raster is sampled. All surfaces remain real shadow receivers.
function weaveTextures(border=false){
 const n=512,period=border?.064:.256,albedo=new Uint8Array(n*n*4),height=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
 const hash=(x,y)=>{let a=Math.imul(x+1973,374761393)^Math.imul(y+607,668265263);a=Math.imul(a^(a>>>13),1274126177);return((a^(a>>>16))>>>0)/4294967295;};
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const u=x/n*period,v=y/n*period,reedPitch=border?.0008:.002,warpPitch=border?.001:.010;
  const row=Math.floor(v/reedPitch),r=(v/reedPitch)%1,c=(u/warpPitch)%1;
  const crown=Math.pow(Math.max(0,Math.sin(Math.PI*r)),.6),strand=hash(row,17);
  const thread=Math.exp(-Math.pow((c-.5)/.075,2)),over=(row%2)*2-1;
  const grain=(hash(x,y)-.5)*2,along=Math.sin(u*890+strand*6.28);
  const value=border?(.70+.19*crown+.08*over*thread+.035*grain):(.91+.085*crown+.045*(strand-.5)+.012*along+.014*grain-.048*thread*(over*.4+.6));
  const base=border?[62,51,33]:[191,176,136],j=(y*n+x)*4;
  for(let k=0;k<3;k++)albedo[j+k]=Math.round(Math.min(255,base[k]*value));
  const h=Math.round(48+133*crown+22*over*thread+5*grain),q=border?229:218+13*strand;
  for(let k=0;k<3;k++){height[j+k]=h;rough[j+k]=q;}albedo[j+3]=height[j+3]=rough[j+3]=255;
 }
 function texture(bytes,color=false){const t=new T.DataTexture(bytes,n,n,T.RGBAFormat);if(color)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=16;t.needsUpdate=true;return t;}
 return{map:texture(albedo,true),bumpMap:texture(height),roughnessMap:texture(rough),period};
}

function metricUvs(g,period){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const up=Math.abs(n.getY(i))>.65;uv.setXY(i,p.getX(i)/period,up?p.getZ(i)/period:p.getY(i)/period);}return g;}

export function buildPrayerMats299(){
 const group=new T.Group();group.name='scene06-rush-mat-band299';const mats=[],blockers=[],rush=weaveTextures(),cloth=weaveTextures(true);
 const body=new T.MeshPhysicalMaterial({name:'scene06-metric-woven-rush299',color:'#ffffff',map:rush.map,bumpMap:rush.bumpMap,bumpScale:.00018,roughnessMap:rush.roughnessMap,roughness:.98,metalness:0,specularIntensity:.16,clearcoat:0});
 const binding=new T.MeshPhysicalMaterial({name:'scene06-wrapped-woven-cloth-border299',color:'#ffffff',map:cloth.map,bumpMap:cloth.bumpMap,bumpScale:.000065,roughnessMap:cloth.roughnessMap,roughness:1,metalness:0,specularIntensity:.12,clearcoat:0});
 const underside=new T.MeshStandardMaterial({name:'scene06-compressed-mat-edge299',color:'#8b784c',roughness:1,metalness:0});
 const emit=(g,m,position,name)=>{const o=new T.Mesh(g,m);o.position.fromArray(position);o.name=name;o.castShadow=o.receiveShadow=true;group.add(o);blockers.push(o);return o;};
 for(const [i,[x,z,w,d]]of[[0,5.20,4.00,.84],[-3.225,5.60,3.95,1.75],[3.225,5.60,3.95,1.75]].entries()){
  // A continuous compressed core supports the rounded rush surface; the
  // perimeter is fabric, not the previous raised clear-coated black timber.
  emit(new RoundedBoxGeometry(w-.004,.013,d-.004,3,.002),underside,[x,.0065,z],`mat299-${i}-compressed-core`);
  const g=metricUvs(new RoundedBoxGeometry(w,.008,d,4,.0028),rush.period),mat=emit(g,body,[x,.015,z],`mat299-${i}-woven-rush-top`);mats.push(mat);
  for(const side of[-1,1]){
   emit(metricUvs(new RoundedBoxGeometry(w-.002,.0018,.031,3,.0007),cloth.period),binding,[x,.0192,z+side*(d/2-.013)],`mat299-${i}-long-fabric-border-${side}`);
   emit(metricUvs(new RoundedBoxGeometry(w-.004,.013,.0017,3,.00065),cloth.period),binding,[x,.0105,z+side*(d/2-.0005)],`mat299-${i}-fabric-return-${side}`);
   emit(metricUvs(new RoundedBoxGeometry(.027,.0018,d-.058,3,.0007),cloth.period),binding,[x+side*(w/2-.012),.0192,z],`mat299-${i}-end-fabric-border-${side}`);
   emit(metricUvs(new RoundedBoxGeometry(.0017,.013,d-.006,3,.00065),cloth.period),binding,[x+side*(w/2-.0005),.0105,z],`mat299-${i}-end-return-${side}`);
  }
 }
 return{group,mats,blockers,details:{revision:'299-r01',actualMeshes:blockers.length,maximumY:.0201,rushPitchMetres:.002,border:'Woven cloth with real top overlap and downward edge returns, no glossy timber perimeter',layoutHeldFrom284:true,dimensionsInferred:true,photographicAccepted:false}};
}
