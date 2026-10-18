// Material successor prepared against the actually viewed reference-4 v3.
// Pure material/texture construction; no exposure, lighting, or geometry edits.
export function createReference4MaterialSet(T, options={}) {
  const palette={
    cedar:[0x6b3420,.78,0],red:[0x873c28,.72,0],endwood:[0x795334,.84,0],darkwood:[0x261b15,.88,0],
    gold:[0xc1a04b,.34,.78],oldgold:[0x926c2d,.57,.61],black:[0x272b29,.65,.08],
    slate:[0x424e59,.76,0],tileEdge:[0x717878,.81,0],stone:[0x8d8577,.95,0],
    granite:[0x9d9586,.89,0],plaster:[0xc4baa3,.92,0],paper:[0xb5aa8c,.97,0]
  };
  const materials=[],textures=[],mats={};
  for(const [key,[color,roughness,metalness]] of Object.entries(palette)) {
    const m=options.materials?.[key]||new T.MeshStandardMaterial({name:'reference4_'+key,color,roughness,metalness});
    mats[key]=m;if(!options.materials?.[key])materials.push(m);
  }
  const fract=x=>x-Math.floor(x), hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7+7.3)*43758.5453123);
  function noise(x,y) {
    const i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,u=a*a*(3-2*a),v=b*b*(3-2*b);
    return (1-v)*((1-u)*hash(i,j)+u*hash(i+1,j))+v*((1-u)*hash(i,j+1)+u*hash(i+1,j+1));
  }
  function tex(kind,height=false) {
    const n=256,data=new Uint8Array(n*n*4);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
      let q;
      if(kind==='wood') {
        const warp=2.2*Math.sin(y*.014)+2.8*(noise(x*.008,y*.025)-.5);
        q=.50+.17*Math.sin((x+warp)*.43)+.09*Math.sin((x+warp)*1.37)+.19*(noise(x*.14,y*.008)-.5)+.06*(hash(x,y)-.5);
      } else {
        q=.50+.24*(noise(x*.21,y*.21)-.5)+.18*(noise(x*.63,y*.63)-.5)+.08*(hash(x,y)-.5);
      }
      q=Math.max(0,Math.min(1,q));
      // A neutral modulation, not a second dark albedo multiplied into the base.
      const c=Math.round(255*(height?.25+.5*q:kind==='wood'?.66+.28*q:.72+.24*q)),i=(y*n+x)*4;
      data[i]=data[i+1]=data[i+2]=c;data[i+3]=255;
    }
    const t=new T.DataTexture(data,n,n);t.name='reference4-'+kind+(height?'-height':'-neutral-albedo');
    t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=height?T.NoColorSpace:T.SRGBColorSpace;
    t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.push(t);return t;
  }
  const wood=tex('wood'),woodHeight=tex('wood',true),stone=tex('stone'),stoneHeight=tex('stone',true);
  for(const key of ['red','cedar','endwood','darkwood'])if(materials.includes(mats[key])) {
    Object.assign(mats[key],{map:wood,bumpMap:woodHeight,bumpScale:key==='red'?.010:.018});
  }
  for(const key of ['stone','granite','slate'])if(materials.includes(mats[key])) {
    Object.assign(mats[key],{map:stone,bumpMap:stoneHeight,bumpScale:key==='slate'?.009:.027});
  }
  const tiles=mats.slate.clone();tiles.name='reference4_variegated_tiles';tiles.vertexColors=true;
  tiles.onBeforeCompile=mats.slate.onBeforeCompile;tiles.customProgramCacheKey=mats.slate.customProgramCacheKey;
  materials.push(tiles);mats.tiles=tiles;
  return {mats,materials,textures,palette};
}
