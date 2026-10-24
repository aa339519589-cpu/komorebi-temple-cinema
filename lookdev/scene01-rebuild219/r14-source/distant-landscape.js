import * as T from 'three';
import {noise,rng} from './kernel.js';

// A continuous terrain surface carries both the foothills and the two
// left-biased mountain folds. Their displaced crest lines stay irregular from
// every camera, while the denser tree stands give the ridges a soft silhouette.
export function createDistantLandscape(){
 const group=new T.Group();group.name='three-dimensional-forested-distant-hills';
 const nx=288,nz=136,xMin=-120,xSpan=240,zMin=-186,zSpan=143,positions=[],colors=[],uv=[],indices=[];
 const haze=new T.Color(0xb0a38d);
 const height=(x,z)=>{
  const a=18*Math.exp(-(((x+29)/45)**2+((z+78)/24)**2));
  const b=22*Math.exp(-(((x-38)/50)**2+((z+113)/33)**2));
  const rearCenter=-140+5.8*Math.sin(x*.047)+1.8*(noise(x*.11,.37,923)-.5);
  const rearEnvelope=Math.exp(-(((x+87)/54)**4));
  const rear=14.2*rearEnvelope*Math.exp(-(((z-rearCenter)/15.5)**2))
   *(1+.15*Math.sin(x*.118+1.4)+.08*(noise(x*.15,.81,927)-.5));
  const middleCenter=-116+4.7*Math.sin(x*.052+.9)+1.4*(noise(x*.12,.24,929)-.5);
  const middleEnvelope=Math.exp(-(((x+78)/50)**4));
  const middle=8.2*middleEnvelope*Math.exp(-(((z-middleCenter)/18)**2))
   *(1+.17*Math.sin(x*.104-.8)+.08*(noise(x*.16,.63,931)-.5));
  const farCenter=-169+6.2*Math.sin(x*.041+.35)+2.2*(noise(x*.082,.16,937)-.5);
  const farEnvelope=Math.exp(-(((x+96)/40)**4));
  const far=39.5*farEnvelope*Math.exp(-(((z-farCenter)/21)**2))
   *(1+.16*Math.sin(x*.089+1.1)+.07*(noise(x*.13,.47,939)-.5));
  const ridges=2.7*(noise(x*.045,z*.055,918)-.5)+1.35*(noise(x*.17,z*.14,511)-.5)+.40*(noise(x*.49,z*.45,319)-.5);
  return Math.max(-1,a+b+rear+middle+far+ridges-1.1);
 };
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const x=xMin+xSpan*i/nx,z=zMin+zSpan*j/nz,h=height(x,z),n=noise(x*.18,z*.17,481);
  const c=new T.Color().setRGB(.095+.037*n,.118+.028*n,.055+.028*n);
  c.lerp(haze,T.MathUtils.smoothstep(-z,78,151)*.34);
  positions.push(x,h,z);uv.push(x*.07,z*.07);colors.push(c.r,c.g,c.b);
  if(i<nx&&j<nz){const a=j*(nx+1)+i;indices.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 }
 const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(positions,3));terrain.setAttribute('uv',new T.Float32BufferAttribute(uv,2));terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.setIndex(indices);terrain.computeVertexNormals();
 const terrainMaterial=new T.MeshStandardMaterial({name:'distant-forested-earth',vertexColors:true,roughness:1});
 const land=new T.Mesh(terrain,terrainMaterial);land.receiveShadow=true;group.add(land);

 // Keep the broad foreground foothills, then concentrate another stand over
 // the far-left ridge belt so the horizon reads as layered forested terrain.
 const crown=new T.SphereGeometry(1,7,5),bark=new T.CylinderGeometry(.10,.16,1,5);
 const baseCount=4500,ridgeCount=5200,count=baseCount+ridgeCount;
 const foliage=new T.InstancedMesh(crown,new T.MeshStandardMaterial({name:'distant-evergreen-crowns',color:0xffffff,roughness:1}),count*4);
 const trunks=new T.InstancedMesh(bark,new T.MeshStandardMaterial({name:'distant-evergreen-trunks',color:0xffffff,roughness:1}),count);
 const rand=rng(730619),dummy=new T.Object3D(),tint=new T.Color(),canopyColor=new T.Color(),barkColor=new T.Color();
 const canopyBase=new T.Color(0x41502b),canopyHaze=new T.Color(0x948b78);
 const barkBase=new T.Color(0x4b4030),barkHaze=new T.Color(0x948977);
 for(let k=0;k<count;k++){
  const ridgeTree=k>=baseCount;
  const x=ridgeTree?-118+rand()*94:-102+rand()*204;
  const z=ridgeTree?-152+rand()*61:-144+rand()*96;
  const base=height(x,z)-.08;
  const h=ridgeTree ? 1.35+rand()*2.25 : .55+rand()*1.0;
  const r=ridgeTree ? .38+rand()*.43 : .22+rand()*.27;
  const distant=T.MathUtils.smoothstep(-z,62,151);
  const hazeAmount=distant*(ridgeTree ? .34 : .19);
  const brightness=.78+rand()*.32;
  canopyColor.copy(canopyBase).lerp(canopyHaze,hazeAmount).multiplyScalar(brightness);
  barkColor.copy(barkBase).lerp(barkHaze,hazeAmount).multiplyScalar(.83+rand()*.28);
  dummy.position.set(x,base+h*.45,z);dummy.scale.set(1,h*.9,1);dummy.rotation.set(0,rand()*Math.PI*2,0);dummy.updateMatrix();trunks.setMatrixAt(k,dummy.matrix);trunks.setColorAt(k,barkColor);
  for(let j=0;j<4;j++){
   const a=j*2.399963+k*.31;dummy.position.set(x+Math.cos(a)*r*.28,base+h*(.45+j*.15),z+Math.sin(a)*r*.28);
   dummy.scale.set(r*(1.12-j*.15),h*.24,r*(.94-j*.12));dummy.rotation.set(.08*Math.sin(k),a,.09*Math.cos(k));dummy.updateMatrix();foliage.setMatrixAt(k*4+j,dummy.matrix);
   tint.copy(canopyColor).multiplyScalar(.87+rand()*.27);foliage.setColorAt(k*4+j,tint);
  }
 }
 foliage.instanceMatrix.needsUpdate=true;trunks.instanceMatrix.needsUpdate=true;foliage.receiveShadow=true;trunks.receiveShadow=true;foliage.castShadow=false;trunks.castShadow=false;group.add(foliage,trunks);
 return{group,dispose(){for(const o of[land,foliage,trunks]){o.geometry.dispose();o.material.dispose();}}};
}
