from pathlib import Path
p=Path('reconstructions/scene-08/src/courtyard-botany147.js')
s=p.read_text()
s=s.replace("leaves.push({geometry,material:sourcePart.material})","geometry.computeBoundingBox();const bladeSize=geometry.boundingBox.getSize(new T.Vector3());leaves.push({geometry,material:sourcePart.material,length:Math.max(bladeSize.x,bladeSize.y,bladeSize.z)})")
a=s.index(' let plantNumber=')
s=s[:a]+''' // A derived red albedo is a surface-pigment variant of the independent CC0
 // blade scan. It contains no reference-scene pixels and survives PBR export.
 const leafMaterials={};
 for(const [kind,color]of Object.entries({leaf:'#ffffff',leaflight:'#e8edba',azalea:'#e3e4b5'})){
  const m=sourcePart.material.clone();m.name='scene08-mature-'+kind+'-scanned-blade148';m.color.set(color);m.roughness=.61;m.metalness=0;m.aoMapIntensity=.55;m.normalScale.set(.32,.32);materials.add(m);leafMaterials[kind]=m;
 }
 const redCanvas=document.createElement('canvas');redCanvas.width=canvas.width;redCanvas.height=canvas.height;
 const redContext=redCanvas.getContext('2d'),redImage=redContext.createImageData(redCanvas.width,redCanvas.height),pigment=new T.Color('#96391d');
 for(let k=0;k<pixels.length;k+=4){
  const rgb=[pixels[k],pixels[k+1],pixels[k+2]].map(q=>T.SRGBToLinear(q/255)),l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2],grain=T.MathUtils.clamp(Math.pow(Math.max(.0001,l)/.07,.55),.50,1.55);
  for(let c=0;c<3;c++)redImage.data[k+c]=Math.round(T.LinearToSRGB(Math.min(.95,[pigment.r,pigment.g,pigment.b][c]*grain))*255);redImage.data[k+3]=255;
 }
 redContext.putImageData(redImage,0,0);const redMap=new T.CanvasTexture(redCanvas);redMap.colorSpace=T.SRGBColorSpace;redMap.flipY=map.flipY;redMap.anisotropy=8;textures.add(redMap);
 const redMaterial=sourcePart.material.clone();redMaterial.name='scene08-oxide-red-scanned-foliage148';redMaterial.map=redMap;redMaterial.vertexColors=false;redMaterial.color.set('#ffffff');redMaterial.roughness=.65;redMaterial.metalness=0;materials.add(redMaterial);leafMaterials.maple=redMaterial;
 let plantNumber=0,leafNumber=0,seed=814815;const R=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296),rr=(a,b)=>a+(b-a)*R();
 const stats={revision:'scene08-mature-branched-crown148-v2',shrubs:0,groundcover:0,scannedBlades:0,bladeVariants:leaves.length,bladeLengths:leaves.map(l=>l.length),bladeAttributes:Object.keys(source.attributes),variants:assets.map(a=>({asset:a.id,variants:a.variants.map(v=>({name:v.name,width:v.width,height:v.height}))})),construction:'Mature rooted multi-stem shrubs, physically forked lateral branches, clumped opposite/whorled scanned blades with measured physical length. Original source attributes retained; red foliage uses an independently pigmented original scan.',referenceSceneImageUsed:false};
 function place({emit,height,x,z,width,flower=false,index=plantNumber++,yaw=rr(0,Math.PI*2),yOffset=0}){
  const choices=assets[flower?1:0].variants,variant=choices[index%choices.length],s=width/variant.width,y=height(x,z)+yOffset-.012;
  for(const part of variant.parts)emit(part.geometry,part.material,x,y,z,s,s,s,[0,yaw,0],rr(.92,1.05));stats[flower?'groundcover':'shrubs']++;
 }
 function foliage({emit,between,start,end,kind,leafLength}){
  const branchRadius=Math.max(.0024,leafLength*.043);between(start,end,branchRadius,'bark',true);
  const material=leafMaterials[kind]||leafMaterials.leaf;
  for(let j=0;j<9;j++){
   const t=(j+.35+rr(-.18,.18))/9,root=start.map((v,c)=>v+(end[c]-v)*t),a=j*2.399963+rr(-.40,.40),length=leafLength*rr(.68,1.28),reach=length*rr(.18,.42);
   for(let n=0;n<3;n++){
    const angle=a+n*2.0944+rr(-.28,.28),tip=[root[0]+Math.cos(angle)*reach,root[1]+rr(-.016,.028),root[2]+Math.sin(angle)*reach];between(root,tip,branchRadius*.31,'bark',true);
    const blade=leaves[leafNumber++%leaves.length],s=length/blade.length,direction=new T.Vector3(Math.cos(angle),rr(-.17,.64),Math.sin(angle)).normalize(),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),rr(-.75,.75))),e=new T.Euler().setFromQuaternion(q);
    emit(blade.geometry,material,...tip,s*rr(.98,1.23),s,s,[e.x,e.y,e.z],rr(.69,1.16));stats.scannedBlades++;
   }
  }
 }
 function shrub({emit,between,height,x,z,r,h,kind='leaf'}){
  const y=height(x,z),primary=h<.85?5:8,rootWidth=Math.min(.095,.028+h*.019),leafLength=h<.85?rr(.066,.086):rr(.105,.145);
  stats.shrubs++;
  // Limbs begin at the rooted crown, divide at several heights and keep their
  // lower lateral branches. No detached sphere or clipped leaf shell is used.
  for(let j=0;j<primary;j++){
   const a=j*2.399963+rr(-.20,.20),crownRadius=r*rr(.46,.73),root=[x+rr(-.08,.08)*r,y,z+rr(-.08,.08)*r],elbow=[x+Math.cos(a)*r*.19,y+h*rr(.17,.32),z+Math.sin(a)*r*.19],fork=[x+Math.cos(a)*crownRadius,y+h*rr(.42,.69),z+Math.sin(a)*crownRadius];
   between(root,elbow,rootWidth*rr(.74,1.05),'bark',true);between(elbow,fork,rootWidth*.57,'bark',true);
   for(let k=0;k<5;k++){
    const aa=a+(k-2)*.53+rr(-.16,.16),branchOrigin=elbow.map((v,c)=>v+(fork[c]-v)*(.15+k*.16)),tip=[fork[0]+Math.cos(aa)*r*rr(.28,.47),y+h*rr(.61,.98),fork[2]+Math.sin(aa)*r*rr(.28,.47)];between(branchOrigin,tip,rootWidth*.24,'bark',true);
    for(let n=0;n<5;n++){
     const f=.10+n*.205,start=branchOrigin.map((v,c)=>v+(tip[c]-v)*f),angle=aa+(n-2)*.65+rr(-.30,.30),reach=r*rr(.19,.36),end=[start[0]+Math.cos(angle)*reach,start[1]+h*rr(.035,.17),start[2]+Math.sin(angle)*reach];
     foliage({emit,between,start,end,kind,leafLength:leafLength*rr(.82,1.14)});
    }
   }
  }
 }
 return {stats,place,shrub,dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
'''
s=s.replace('T.SRGBToLinear','T.ColorManagement.fromWorkingColorSpace') if False else s
# Three exposes color-space conversion through MathUtils? Use stable scalar sRGB transfer.
s=s.replace('T.SRGBToLinear(q/255)',"((q/255)<=.04045?(q/255)/12.92:Math.pow(((q/255)+.055)/1.055,2.4))")
s=s.replace('T.LinearToSRGB(Math.min(.95,[pigment.r,pigment.g,pigment.b][c]*grain))',"((v)=>v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055)(Math.min(.95,[pigment.r,pigment.g,pigment.b][c]*grain))")
Path('reconstructions/scene-08/src/courtyard-botany148.js').write_text(s)
