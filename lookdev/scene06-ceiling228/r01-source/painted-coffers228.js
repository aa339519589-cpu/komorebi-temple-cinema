import * as T from 'three';

let paintedSurface228;
export async function loadPaintedCofferSurface228(){
 if(paintedSurface228)return paintedSurface228;
 const map=await new T.TextureLoader().loadAsync(new URL('../assets/coffer228/coffer-painted-lotus-r02.png',import.meta.url).href);
 map.name='coffer228-independent-painted-lotus-basecolor';map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
 map.wrapS=map.wrapT=T.ClampToEdgeWrapping;
 paintedSurface228=new T.MeshStandardMaterial({name:'coffer228-ivory-mineral-paint-on-wood',color:0xffffff,map,roughness:.81,metalness:0});
 paintedSurface228.userData.coffer228={independentAuthoredBaseColor:true,referenceRGBUsed:false,paintedLighting:false,photographicAcceptance:false};
 return paintedSurface228;
}

function boardGeometry(width,depth,thickness,variant){
 const nx=12,nz=20,p=[],uv=[],index=[],skins=[];
 for(let side=0;side<2;side++){
  const skin=[];
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
   const u=i/nx,v=j/nz,x=(u-.5)*width,z=(v-.5)*depth;
   const bow=.0012*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*Math.sin(variant*.73+.4);
   const twist=.00035*(u-.5)*(v-.5)*Math.cos(variant*.91);
   skin.push(p.length/3);p.push(x,(side?1:-1)*thickness/2+bow+twist,z);
   // Alternate the complete panel orientation, never tile the flower over it.
   uv.push(variant%2?1-u:u,variant%2?1-v:v);
  }
  skins.push(skin);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const a=skin[j*(nx+1)+i],b=skin[j*(nx+1)+i+1],c=skin[(j+1)*(nx+1)+i],d=skin[(j+1)*(nx+1)+i+1];
   if(side)index.push(a,c,b,b,c,d);else index.push(a,b,c,b,d,c);
  }
 }
 const bottomCount=nx*nz*6,topCount=bottomCount;
 const rim=[];
 for(let i=0;i<=nx;i++)rim.push(i);
 for(let j=1;j<=nz;j++)rim.push(j*(nx+1)+nx);
 for(let i=nx-1;i>=0;i--)rim.push(nz*(nx+1)+i);
 for(let j=nz-1;j>0;j--)rim.push(j*(nx+1));
 for(let k=0;k<rim.length;k++){
  const a=skins[0][rim[k]],b=skins[0][rim[(k+1)%rim.length]],c=skins[1][rim[k]],d=skins[1][rim[(k+1)%rim.length]];
  index.push(a,c,b,b,c,d);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);
 g.addGroup(0,bottomCount,1);g.addGroup(bottomCount,topCount+rim.length*6,0);g.computeVertexNormals();
 g.userData.coffer228={closedWarpedTimber:true,thicknessMetres:thickness,paintedFaceMaterialIndex:1,maximumBowMetres:.0012,subdivisions:[nx,nz]};
 return g;
}

function frameGeometry(width,depth){
 const outer=new T.Shape();outer.moveTo(-width/2,-depth/2);outer.lineTo(width/2,-depth/2);outer.lineTo(width/2,depth/2);outer.lineTo(-width/2,depth/2);outer.closePath();
 const hole=new T.Path(),ix=width/2-.027,iz=depth/2-.027;
 hole.moveTo(-ix,-iz);hole.lineTo(-ix,iz);hole.lineTo(ix,iz);hole.lineTo(ix,-iz);hole.closePath();outer.holes.push(hole);
 const g=new T.ExtrudeGeometry(outer,{depth:.042,bevelEnabled:true,bevelSize:.0022,bevelThickness:.0022,bevelSegments:2,curveSegments:1,steps:1});
 g.rotateX(Math.PI/2);g.userData.coffer228={actualThroughOpening:true,closedRoutedFrame:true,frameWidthMetres:.027,roundedArrisMetres:.0022};return g;
}

export function buildPaintedCoffers228({mesh,box,materials}){
 if(!paintedSurface228)throw Error('Coffer228 surface must be loaded before room construction');
 const panelWidth=.762,panelDepth=1.274,frame=frameGeometry(.814,1.326),boards=Array.from({length:4},(_,i)=>boardGeometry(panelWidth,panelDepth,.034,i));
 const panels=[];
 for(const strip of[-5.55,-3.4,3.4,5.55])for(const dx of[-.42,.42])for(let row=0;row<10;row++){
  const x=strip+dx,z=-4.5+row*1.38,variant=(row+(strip<0?1:0)+(dx<0?2:0))%4;
  const board=mesh(boards[variant],[materials.ceilingWood,paintedSurface228],[x,7.101,z]);board.name='coffer228-closed-painted-timber-panel';
  const rim=mesh(frame,materials.ceilingLacquer,[x,7.105,z]);rim.name='coffer228-closed-recessed-lacquer-frame';
  // Small actual retaining clips connect the panel frame to the timber lane.
  for(const sx of[-1,1])for(const sz of[-1,1]){
   const clip=box([x+sx*.391,7.060,z+sz*.646],[.037,.014,.037],materials.oldgold);clip.name='coffer228-cast-corner-retaining-clip';
  }
  panels.push({center:[x,7.101,z],field:[panelWidth,panelDepth],thickness:.034,variant});
 }
 return {revision:'coffer228-r01',panels:panels.length,paintedSurface:'Independent generated mineral-paint base color on actual closed wood, no scene/reference RGB plate',closedFrames:panels.length,retainingClips:panels.length*4,photographicAcceptance:false};
}
