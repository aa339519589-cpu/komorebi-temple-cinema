import * as T from 'three';

// Runtime botanical maps. No image, model, atlas, photograph or HDR file is loaded.
const rng = seed => () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
function leafTexture(kind, base, seed) {
  const random=rng(seed),c=document.createElement('canvas');c.width=c.height=512;
  const ctx=c.getContext('2d'),shape=new Path2D();
  if(kind==='maple') {
    // Seven tapering, serrated lobes around a petiole; a real silhouette rather than a star polygon.
    const pts=[[256,463],[225,386],[148,402],[166,343],[66,329],[126,282],[44,224],[151,229],[123,122],[213,196],[256,36],[299,196],[389,122],[361,229],[468,224],[386,282],[446,329],[346,343],[364,402],[287,386]];
    shape.moveTo(...pts[0]);
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.max(2,Math.floor(Math.hypot(dx,dy)/12));
      for(let j=1;j<=n;j++){const t=j/n,s=j%2?.018:0;shape.lineTo(a[0]+dx*t-dy*s,a[1]+dy*t+dx*s);}
    }
    shape.closePath();
  } else {
    shape.moveTo(256,475);shape.bezierCurveTo(90,400,84,180,250,38);shape.bezierCurveTo(407,161,425,387,256,475);shape.closePath();
  }
  ctx.save();ctx.clip(shape);
  const gradient=ctx.createLinearGradient(70,400,440,90);gradient.addColorStop(0,'#293a17');gradient.addColorStop(.27,base);gradient.addColorStop(.65,base);gradient.addColorStop(1,'#aab66a');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,512);
  const pixels=ctx.getImageData(0,0,512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const i=(y*512+x)*4;if(!pixels.data[i+3])continue;const n=(random()-.5)*17+Math.sin(x*.14+y*.027)*2;
    pixels.data[i]+=n;pixels.data[i+1]+=n;pixels.data[i+2]+=n*.6;
  }
  ctx.putImageData(pixels,0,0);ctx.clip(shape);
  ctx.lineCap='round';ctx.strokeStyle='rgba(204,209,137,.35)';ctx.lineWidth=2.6;
  const veins=kind==='maple'?[[65,226],[144,125],[256,43],[373,125],[449,226],[352,378],[160,378]]:[[256,43]];
  for(const tip of veins){ctx.beginPath();ctx.moveTo(256,457);ctx.quadraticCurveTo(256+(tip[0]-256)*.4,270,tip[0],tip[1]);ctx.stroke();}
  ctx.lineWidth=1;
  for(let y=150;y<426;y+=22){for(const side of [-1,1]){const ex=256+side*(110-Math.abs(y-280)*.24);ctx.beginPath();ctx.moveTo(256,y+30);ctx.quadraticCurveTo(256+side*50,y,ex,y-28);ctx.stroke();}}
  ctx.restore();
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=16;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;
  return tex;
}
function needleTexture(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),random=rng(8317);
  ctx.lineCap='round';ctx.strokeStyle='#645d32';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(256,470);ctx.quadraticCurveTo(240,260,258,80);ctx.stroke();
  for(let i=0;i<90;i++){let y=95+random()*344,side=i%2?1:-1,x=256+side*(24+random()*130),ey=y-40-random()*110;ctx.strokeStyle=i%3?'#61713c':'#a1a96b';ctx.lineWidth=1.2+random()*2.1;ctx.beginPath();ctx.moveTo(256+(random()-.5)*14,y);ctx.quadraticCurveTo((256+x)/2,y-40,x,ey);ctx.stroke();}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=16;return tex;
}
function barkTexture(){
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),random=rng(27303);ctx.fillStyle='#aaa494';ctx.fillRect(0,0,1024,1024);
 for(let i=0;i<1700;i++){const x=random()*1024,y=random()*1024,len=16+random()*170;ctx.strokeStyle=i%4?'rgba(48,42,29,.36)':'rgba(228,221,186,.38)';ctx.lineWidth=1+random()*5;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+random()*10-5,y+len*.3,x+random()*12-6,y+len*.7,x+random()*10-5,y+len);ctx.stroke();}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(3,3);t.colorSpace=T.SRGBColorSpace;t.anisotropy=16;return t;
}
export function createBotany(){
 const specs={foliageGreen:['oval','#4b7738',3147],foliageDark:['maple','#2b6032',7431],foliageGold:['maple','#b6a04e',10733],foliageRed:['maple','#a2452c',7703]},materials={};
 for(const [name,[kind,base,seed]] of Object.entries(specs)){
   const map=leafTexture(kind,base,seed);materials[name]=new T.MeshStandardMaterial({name,map,color:0xffffff,roughness:.78,side:T.DoubleSide,alphaTest:.18,alphaToCoverage:true,bumpMap:map,bumpScale:.0012,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.035});
 }
 const needles=needleTexture();materials.needleGreen=new T.MeshStandardMaterial({name:'needleGreen',map:needles,color:'#e7e8c6',roughness:.84,side:T.DoubleSide,alphaTest:.10,alphaToCoverage:true,emissive:'#a0b870',emissiveMap:needles,emissiveIntensity:.03});
 const bark=barkTexture();materials.bark=new T.MeshStandardMaterial({name:'bark',map:bark,bumpMap:bark,bumpScale:.048,color:'#78715c',roughness:.94});
 const card=new T.PlaneGeometry(1,1);card.rotateX(-Math.PI/2);
 return {materials,card,rng};
}

// A separate normal pass preserves the exact alpha-tested silhouette in AO and focus depth.
export function foliageNormalMaterial(source){
 const material=source.clone();material.emissiveIntensity=0;material.fog=false;material.toneMapped=false;
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','gl_FragColor = vec4(normal * .5 + .5, diffuseColor.a);');};
 material.customProgramCacheKey=()=> 'foliage-normal-alpha-v2';return material;
}
