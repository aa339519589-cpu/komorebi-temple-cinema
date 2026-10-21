from pathlib import Path
p=Path('reconstructions/scene-08/src/scene.js');s=p.read_text()
# Put the upper hall's bearing line behind its projecting veranda roof. This
# is real setback depth; it removes the erroneous row across the open garden.
s=s.replace("for(const z of[-.89,.89]){\n    column(x,z,fy,ey-fy-.83,.23);","for(const z of[-.89,-.30]){\n    column(x,z,fy,ey-fy-.83,.18);")
s=s.replace("roof(run+.85,3.25,8.75,1.27,.35,.28,.27,grade)","roof(run+.85,3.25,8.75,.86,.27,.28,.10,grade)")
s=s.replace("if(ridgeRatio>.1)for(const sx", "if(ridgeRatio>.1&&role!=='upper-descending-gallery')for(const sx")
# The old lower wing was behind the main bearing line and showed its soffit.
# Rebuild the actual lower gallery in the foreground, with an exposed tiled
# upper surface, two row colonnade, sheltered screens and independent footing.
a=s.index("group(wingX,wingGroupY,wingZ,wingYaw,()=>{const deckDepth=")
b=s.index("// The reference contains an intermediate upper gallery",a)
s=s[:a]+'''const lowerGalleryFrame={x:.0115,z:-9.342,yaw:.738,run:5.097,width:3.10};
role='layered-walkways';
group(lowerGalleryFrame.x,0,lowerGalleryFrame.z,lowerGalleryFrame.yaw,()=>{
 const run=lowerGalleryFrame.run,floorAt=x=>3.75-.50*x/run,eaveAt=x=>6.40-x/run;
 for(let i=0;i<30;i++){const x=-run/2+(i+.5)*run/30;box(x,floorAt(x)-.06,0,run/30-.009,.13,2.42,'wood');}
 for(const z of[-1.02,1.02])emit(createContinuousTimber([[-run/2,floorAt(-run/2)-.20,z],[run/2,floorAt(run/2)-.20,z]],.20,.25,.012),'wood');
 for(let j=0;j<6;j++){
  const x=-run*.46+j*run*.92/5,fy=floorAt(x),ey=eaveAt(x);
  for(const z of[-.92,.92]){
   column(x,z,fy,ey-fy-.67,.175);
   for(const q of galleryJoinery.parts)emit(q.geometry,q.material,x,ey-.61,z,.43,.60,.43);
  }
  if(j<5){const xx=x+run*.092;box(xx,floorAt(xx)+1.05,-.67,.84,2.04,.12,'dark');lattice(xx,floorAt(xx)+1.10,-.55,.65,1.70);box(xx,eaveAt(xx)-.82,-.52,.85,.26,.13,'wall');}
  box(x,ey-.31,0,.16,.18,2.55,'red');
 }
 for(const z of[-1.02,1.02])for(const dy of[-.25,-.51])emit(createContinuousTimber([[-run*.5,eaveAt(-run*.5)+dy,z],[run*.5,eaveAt(run*.5)+dy,z]],.18,.21,.011),'red');
 roof(run+.48,3.10,6.40,1.17,.29,.30,.20,-1/run);
 for(const x of[-1.48,1.48])lantern(x,eaveAt(x)-1.0,1.10,.28);
});
group(-2.20,0,-7.45,.12,()=>{for(let i=0;i<4;i++){const top=4.40-i*.105;box(-.30+i*.20,(3.88+top)/2,0,.23,top-3.88,1.16,'wood');}});
''' +s[b:]
# Replace all old-wing terrain piers with exact new lower-gallery post footings.
a=s.index("role='left-grand-hall';group(wingFrame.x",s.index("const stream=new Reflector"))
b=s.index("\nfunction riverRock",a)
s=s[:a]+'''role='lower-gallery-stone-bearing';group(lowerGalleryFrame.x,0,lowerGalleryFrame.z,lowerGalleryFrame.yaw,()=>{
 const f=lowerGalleryFrame;
 for(let j=0;j<6;j++)for(const z of[-.92,.92]){
  const x=-f.run*.46+j*f.run*.92/5,top=3.75-.50*x/f.run,wx=f.x+Math.cos(f.yaw)*x+Math.sin(f.yaw)*z,wz=f.z-Math.sin(f.yaw)*x+Math.cos(f.yaw)*z,bottom=terrainHeight(wx,wz)-.10;
  if(top>bottom+.06){box(x,(top+bottom)/2,z,.37,top-bottom,.40,'hallFoundation');box(x,top-.11,z,.57,.20,.62,'stone');}
 }
});
''' +s[b:]
# The native Reflector and the independent physical render share an actual
# source-authored water backing, at the same winding stream bounds.
needle="scene.add(stream);geometries.add(waterG);"
s=s.replace(needle,needle+"\nconst physicalWaterM=new T.MeshPhysicalMaterial({name:'scene08-physical-stream-water148',color:'#344a39',roughness:.055,metalness:0,ior:1.333,transmission:.10,clearcoat:.30,clearcoatRoughness:.06});materials.push(physicalWaterM);const physicalWater=new T.Mesh(waterG,physicalWaterM);physicalWater.rotation.x=-Math.PI/2;physicalWater.position.y=.515;physicalWater.name='scene08-physical-stream-backing148';physicalWater.receiveShadow=true;scene.add(physicalWater);")
s=s.replace("revision:'scene08-monumental-descending-court148-v2-r02-20261021'","revision:'scene08-monumental-layered-court148-v2-r03-20261021'")
p.write_text(s)
