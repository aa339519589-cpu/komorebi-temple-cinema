from pathlib import Path
p=Path('reconstructions/scene-08/src/scene.js')
s=p.read_text().replace("from './courtyard-botany147.js'","from './courtyard-botany148.js'")
s=s.replace("material('red','#893524',.43)","material('red','#8c321b',.58)")
s=s.replace("material('redlight','#9d4026',.46)","material('redlight','#a04c28',.62)")
s=s.replace("material('tileedge','#50667e',.43,.05)","material('tileedge','#344857',.48,0)")
s=s.replace("material('gold','#d7a54c',.32,.68)","material('gold','#c99943',.38,.86)")
s=s.replace("material('oldgold','#a27b3b',.47,.5)","material('oldgold','#9b7539',.49,.78)")
a=s.index('// The original lacquer scan is very dark')
b=s.index('\nfor(const t of[graniteColor',a)
s=s[:a]+'''// Authored paint is baked as a portable PBR albedo from the independent scan.
// The physical grain remains visible without multiplying two dark pigments.
const paintedTimberMaps=new Map();
const scanCanvas=document.createElement('canvas');scanCanvas.width=1024;scanCanvas.height=1024;
const scanContext=scanCanvas.getContext('2d',{willReadFrequently:true});scanContext.drawImage(timberColor.image,0,0,1024,1024);const scanPixels=scanContext.getImageData(0,0,1024,1024).data;
const toLinear=q=>q<=.04045?q/12.92:Math.pow((q+.055)/1.055,2.4),toSRGB=q=>q<=.0031308?q*12.92:1.055*Math.pow(q,1/2.4)-.055;
function pigmentTimber(m,color){
 if(!paintedTimberMaps.has(color)){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const c=canvas.getContext('2d'),out=c.createImageData(1024,1024),paint=new T.Color(color),rgb=[paint.r,paint.g,paint.b];
  for(let i=0;i<scanPixels.length;i+=4){
   const l=.2126*toLinear(scanPixels[i]/255)+.7152*toLinear(scanPixels[i+1]/255)+.0722*toLinear(scanPixels[i+2]/255),grain=T.MathUtils.clamp(Math.pow(Math.max(.00001,l)/.015051207361250781,.42),.68,1.34);
   for(let k=0;k<3;k++)out.data[i+k]=Math.round(toSRGB(Math.min(.98,rgb[k]*grain))*255);out.data[i+3]=255;
  }
  c.putImageData(out,0,0);const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.MirroredRepeatWrapping;map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;textures.push(map);paintedTimberMaps.set(color,map);
 }
 m.map=paintedTimberMaps.get(color);m.color.set('#ffffff');m.onBeforeCompile=()=>{};m.customProgramCacheKey=()=> 'scene08-portable-pigment148';return m;
}
for(const name of['red','redlight','wood','dark'])pigmentTimber(mats[name],{red:'#8c321b',redlight:'#a04c28',wood:'#4d2e20',dark:'#241d16'}[name]);
''' +s[b:]
s=s.replace("materials.push(mats.gallerytile);","materials.push(mats.gallerytile);mats.ceramictile=mats.gallerytile.clone();mats.ceramictile.name='scene08-aged-closed-ceramic148';mats.ceramictile.color.set('#304457');mats.ceramictile.roughness=.46;mats.ceramictile.clearcoat=.18;materials.push(mats.ceramictile);")
s=s.replace("emit(clayCoverG,'gallerytile'","emit(clayCoverG,role==='left-grand-hall'?'gallerytile':'ceramictile'")
s=s.replace("emit(clayPanG,'gallerytile'","emit(clayPanG,role==='left-grand-hall'?'gallerytile':'ceramictile'")
s=s.replace("if(role==='left-grand-hall')ceramicTile(a,b,.107,.94+.055*Math.sin(i*1.33+j*2.71+side*.81));else{a[1]+=.025;b[1]+=.025;between(a,b,.085,'tileedge',true);}","ceramicTile(a,b,role==='left-grand-hall'?.107:.078,.91+.11*Math.sin(i*1.33+j*2.71+side*.81));")
s=s.replace("if(role==='left-grand-hall')for(let i=0;i<Math.ceil((side%2?d:w)/.34);i++){\n const n=Math.ceil((side%2?d:w)/.34)","for(let i=0;i<Math.ceil((side%2?d:w)/(role==='left-grand-hall'?.34:.24));i++){\n const n=Math.ceil((side%2?d:w)/(role==='left-grand-hall'?.34:.24))")
s=s.replace("m.name='grand-hall-'+name;m.color.set(color)","m.name='grand-hall-'+name;pigmentTimber(m,color)")
s=s.replace("{red:'#9b4627',redlight:'#ad572c',wood:'#56321e',dark:'#211d17'}","{red:'#984321',redlight:'#a94f24',wood:'#4e2f1d',dark:'#211a12'}")
s=s.replace("bw=3.50,bd=4.40,front=bd/2","bw=3.50,bd=6.40,front=bd/2")
s=s.replace("group(-.40,0,.60,0,()=>{","group(-.40,0,-.40,0,()=>{")
s=s.replace("for(const x of[-bw/2,bw/2])for(const z of[-1.45,0,1.45])","for(const x of[-bw/2,bw/2])for(const z of[-2.40,-1.20,0,1.20,2.40])")
s=s.replace("column(x,z,floor,lintel-floor-.10,.205)","column(x,z,floor,lintel-floor-.10,.245)")
s=s.replace("column(x,z,floor,lintel-floor-.10,.19)","column(x,z,floor,lintel-floor-.10,.225)")
s=s.replace("for(const z of[-front+.24,front-.26])for(let i=0;i<4;i++){","for(const z of[-front+.24,front-.52])for(let i=0;i<4;i++){")
s=s.replace("for(let j=0;j<4;j++){\n    const x=-1.65+j*1.10;box(x,floor+.30,-sign*.09,.96,.39,.12,'wood');lattice(x,floor+1.74,-sign*.09,.80,2.30);\n    box(x,lintel-.47,-sign*.09,.96,.42,.14,'wall');\n   }","for(let j=0;j<6;j++){\n    const x=-2.67+j*1.068;box(x,floor+.30,-sign*.32,.95,.39,.12,'wood');lattice(x,floor+1.74,-sign*.32,.80,2.30);\n    box(x,lintel-.47,-sign*.32,.95,.42,.14,'wall');\n    for(const yy of[floor+.12,floor+3.20])box(x,yy,-sign*.25,1.01,.12,.14,'red');\n   }")
s=s.replace("for(let j=0;j<4;j++)group(x+Math.sign(x)*.18,lintel-.83,-1.65+j*1.10","for(let j=0;j<6;j++)group(x+Math.sign(x)*.18,lintel-.83,-2.67+j*1.068")
s=s.replace("for(const sign of[-1,1])for(const z of[-1.45,0,1.45])","for(const sign of[-1,1])for(const z of[-2.40,-1.20,0,1.20,2.40])")
# Fit the measured front bearing unchanged, but add real occupied depth to the long return.
s=s.replace("return lx> -2.15-padding&&lx<1.35+padding&&lz> -1.60-padding&&lz<2.80+padding;","return lx> -2.15-padding&&lx<1.35+padding&&lz> -3.60-padding&&lz<2.80+padding;")
needle="  for(const x of[-1.55,1.55])lantern(x,lintel-.98,front+.30,.34);"
add='''  // The deep return contains occupied bays: a setback door wall, solid
  // sill decks and overhead timbers give the colonnade a measurable interior.
  for(let bay=0;bay<6;bay++){
   const zz=-2.67+bay*1.068;
   box(.91,floor+1.52,zz,.11,2.72,.92,'dark');
   group(1.00,0,zz,Math.PI/2,()=>{lattice(0,floor+1.69,0,.78,2.30);for(const yy of[floor+.30,floor+2.91])box(0,yy,.065,.93,.10,.13,'wood');});
   box(.46,lintel-.37,zz,2.22,.16,.17,'wood');
   for(let j=0;j<5;j++)box(.46,lintel-.29,zz-.42+j*.21,2.22,.055,.12,'dark');
  }
  // Secondary bearing tiers occupy the shadow beneath the eave. The lower
  // blocks seat on the actual ring beams instead of floating under the roof.
  for(const sign of[-1,1])for(let j=0;j<7;j++){
   const zz=-2.95+j*.985,xx=sign*2.20;
   group(xx,lintel+.60,zz,sign*Math.PI/2,()=>{
    emit(corbelG,'redlight',0,.10,0,.82,.70,.22);
    for(const dx of[-.27,.27])box(dx,.24,0,.13,.19,.28,'red');
    for(const p of relief.variants[j%4])emit(p.geometry,p.material,0,.16,.135,.64,.72,.72);
   });
  }
''' +needle
s=s.replace(needle,add)
# Connect extended receding canopy to actual sides with close-spaced roof timbers.
s=s.replace("roof(w,d,eave,rise,.45,.12,.32);","roof(w,d,eave,rise,.45,.12,.32);\n for(const sign of[-1,1])for(let j=0;j<9;j++){\n  const zz=-3.80+j*.95,path=[[sign*1.65,lintel+.95,zz],[sign*2.52,eave-.48,zz],[sign*3.25,eave-.31,zz],[sign*4.35,eave-.18,zz]];\n  emit(createContinuousTimber(path,.11,.18,.010),'wood');\n  box(sign*3.30,eave-.42,zz,.23,.20,.20,'red');\n  group(sign*3.30,eave-.42,zz,sign*Math.PI/2,()=>rosette(0,0,.105,.060));\n }")
# Replace the blank oversize right-hand frame with a lower, complete deep veranda.
a=s.index("role='layered-walkways';")
b=s.index("// A closed masonry platform",a)
s=s[:a]+'''role='layered-walkways';group(-4.0,.1,-13,.13,()=>hall(7.5,7.4,5.9),.82);group(-1.5,.0,-17,0,()=>hall(7.6,6.5,4.8),.80);
group(7.8,3.0,-14.2,-.15,()=>{
 const w=9.2,d=8.3,front=d*.37,raised=2.1,eave=10.70;
 hall(w,d,8.60,{raised,roofRise:4.45,roofCurl:1.02,roofHorn:.30,walls:false,frontOpening:false});
 box(0,raised-.17,0,w*.86,.28,d*.80,'hallFoundation');
 // Five separate doors occupy the back wall; the projecting veranda remains
 // open between its columns, with a coffered timber ceiling overhead.
 for(let bay=0;bay<5;bay++){
  const xx=-3.24+bay*1.62;
  box(xx,5.05,front-1.18,1.48,5.86,.18,'dark');
  lattice(xx,5.15,front-1.05,1.20,4.90);
  for(const yy of[2.48,7.82])box(xx,yy,front-.93,1.53,.18,.20,'red');
  for(const sx of[-1,1])box(xx+sx*.70,5.15,front-.92,.16,5.40,.25,'red');
  for(let k=0;k<5;k++)box(xx-.51+k*.255,3.70,front-.88,.036,2.18,.04,'wood');
  box(xx,7.40,front+.02,1.44,.37,.17,'wood');
  group(xx,7.40,front+.12,0,()=>{for(const p of relief.variants[bay%4])emit(p.geometry,p.material,0,0,0,1.63,1.25,1);});
 }
 for(const x of[-3.32,-1.66,0,1.66,3.32]){
  column(x,front+.13,raised,6.28,.225);brackets(x,8.36,front+.13,.91);
  box(x,8.88,front-.13,.18,.17,2.30,'wood');
 }
 for(const yy of[7.93,8.39,8.92])box(0,yy,front+.15,7.88,.22,.35,'red');
 for(let i=0;i<24;i++)box(-3.75+i*.326,8.83,front-.30,.14,.085,2.17,'wood');
 box(0,9.32,front-.32,7.8,.50,.14,'wall');
 for(let i=0;i<12;i++)group(-3.60+i*.655,9.36,front+.10,0,()=>brackets(0,0,0,.47));
 for(const x of[-2.51,.82,2.51])lantern(x,7.08,front-.17,.40);
 for(const side of[-1,1]){
  box(side*3.85,5.12,-.3,.20,6.02,6.02,'wall');
  for(const zz of[-2.45,-.90,.65,2.20])group(side*3.98,0,zz,side*Math.PI/2,()=>lattice(0,5.05,0,1.23,4.68));
 }
},.62);
group(2.0,3.5,-21,0,()=>hall(10.0,5.8,3.9),.93);
// The right court has a second low wing; its eave overlaps the tall veranda
// across a real return, rather than ending in a sheer open frame.
group(8.5,3.15,-20.0,-.12,()=>hall(8.3,5.9,4.65,{raised:.8,roofRise:2.15,roofCurl:.62,lanterns:true}),.82);
''' +s[b:]
# Foreground rail follows the measured reference span at two physical depths.
s=s.replace("railing([-2.30,5.7],[1.85,9.1],t=>1.25-.80*t,true);railing([-2.30,7.55],[-2.30,5.7],t=>1.20+.05*t,true);","railing([-2.20,5.70],[1.77,8.00],t=>.54-.26*t,true);railing([-2.30,7.55],[-1.05,6.72],t=>1.18-.12*t,true);")
# Lamp chamber and turned stone take physical surface displacement.
s=s.replace("function stoneLantern(x,z,y,scale){group(x,y,z,.08,()=>{","function agedStone(g,amount=.012){const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),q=amount*(Math.sin(x*39.1+y*31.7+z*17.3)*.38+Math.sin(x*17.3-y*23.1+z*43.7)*.34+Math.sin(x*71.7+y*89.1-z*57.3)*.28);p.setXYZ(i,x+n.getX(i)*q,y+n.getY(i)*q,z+n.getZ(i)*q);}g.computeVertexNormals();return g;}\nfunction stoneLantern(x,z,y,scale){group(x,y,z,.08,()=>{")
s=s.replace("24);emit(shaft,'carvedstone');","36,1,false,0,Math.PI*2);emit(agedStone(shaft,.024),'carvedstone');")
s=s.replace("box(0,1.98,0,.78,.82,.78,'carvedstone');","emit(agedStone(new T.BoxGeometry(.78,.82,.78,12,12,12),.014),'carvedstone',0,1.98,0);")
s=s.replace("yy=H(xx,zz)+.005*Math.sin(xx*47+zz*31)","yy=H(xx,zz)+.018*Math.sin(xx*47+zz*31)+.007*Math.sin(xx*91-zz*77)")
s=s.replace("emit(new T.LatheGeometry([[.20,3.0],[.26,3.09],[.24,3.18],[.16,3.29],[.19,3.40],[.15,3.51],[.06,3.60],[0,3.63]].map(p=>new T.Vector2(...p)),24),'carvedstone');","emit(agedStone(new T.LatheGeometry([[.16,3.0],[.20,3.07],[.18,3.15],[.12,3.23],[.18,3.31],[.20,3.40],[.17,3.51],[.09,3.59],[0,3.63]].map(p=>new T.Vector2(...p)),40),.018),'carvedstone');")
# Large reference tree on the right is a red broadleaf crown, not white blossom.
s=s.replace("tree(9.6,-11.4,9.2,2.4,'cherry')","tree(9.6,-11.4,9.2,2.4,'maple')")
# Add rooted middle storey crowns that cover the empty soil and retaining piers.
s=s.replace("role='scanned-bank-understory';{","for(const [x,z,r,h,kind]of[[-6.6,-3.7,1.75,2.20,'leaf'],[-4.4,-1.0,1.80,2.35,'leaflight'],[-2.1,2.8,1.45,1.50,'leaf'],[-5.4,4.1,1.70,1.80,'leaf'],[5.7,.8,1.65,1.85,'maple'],[3.9,-2.0,1.70,1.90,'leaf'],[2.3,-6.7,1.25,1.55,'leaf'],[6.7,-7.8,1.65,2.20,'maple'],[6.1,-16.0,1.50,2.30,'leaf']])shrub(x,.05,z,r,h,kind);\nrole='scanned-bank-understory';{")
# Dappled shadows are cast by genuine sunward leaves outside the gate.
s=s.replace("role='dense-layered-shrubs';","role='sunward-entry-canopy';\nfor(const [a,b,r]of[[[-8.2,4.7,14.0],[-6.3,6.2,13.1],.18],[[-6.3,6.2,13.1],[-4.1,7.1,12.2],.09],[[-4.1,7.1,12.2],[-2.9,7.3,10.8],.05]])between(a,b,r,'bark',true);\nleafyTwig([-6.1,6.2,13.1],[-3.1,7.2,11.1],1.25,'leaf',15500);\nleafyTwig([-5.2,6.8,12.2],[-3.6,7.3,14.1],1.05,'leaflight',8500);\nrole='dense-layered-shrubs';")
s=s.replace("scene.add(new T.HemisphereLight('#d4e1e8','#5c4e33',.48))","scene.add(new T.HemisphereLight('#d4e1e8','#6a4b29',.36))")
s=s.replace("new T.DirectionalLight('#ffce8f',.42)","new T.DirectionalLight('#ffce8f',.28)")
s=s.replace("revision:'scene08-solmax-calibrated-bearing-court147-r17-20261021'","revision:'scene08-monumental-occupied-court148-v2-r01-20261021'")
s=s.replace("description:'Coupled longer hall return and offset frame, single housed joinery and cast gilt relief, closed glazed pan/cover roof and finer rafters, six-step connected gallery, rooted bank and complete scanned broadleaf shoots, uniform scanned granite and calibrated measured timber/sky radiance.'","description:'Deep occupied hall return with robust columns and real inset doors, complete lower right veranda and linked wing, continuous eave bearings and closed ceramic pan/cover tiles on all roofs, portable pigmented scan albedos, mature physical leafy shrubs, carved weathered stone lantern and measured foreground rail span.'")
p.write_text(s)
