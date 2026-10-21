from pathlib import Path
p=Path('reconstructions/scene-08/src/scene.js');s=p.read_text()
a=s.index('function P(side,t,u){',s.index('function roof('));b=s.index('\nfor(let side=0;side<4;side++)',a)
s=s[:a]+'''// A single closed four-hip roof owns the continuous descending right eave.
// Its observed freeform plan is inferred in world metres; all four panels
// meet the same ridge and corner curves. No view-dependent deformation occurs.
const falling=role==='left-grand-hall',peak=eave+rise;
let returnCurve;
if(falling){
 const c=Math.cos(grandFrame.yaw),s=Math.sin(grandFrame.yaw),local=([x,y,z])=>{const dx=x-grandFrame.x,dz=z-grandFrame.z;return new T.Vector3(c*dx-s*dz,y,s*dx+c*dz);};
 returnCurve=new T.CatmullRomCurve3([new T.Vector3(hw,eave,hd),local([.0680408735,9.2007,-4.6033681302]),local([1.2912162936,8.6008,-6.4505251546]),local([2.9838880948,7.65,-8.4965345272])],false,'centripetal');
}
function P(side,t,u){
 if(falling){
  const far=returnCurve.getPoint(1);let edge,ridge;
  if(side===0){edge=new T.Vector3(u*hw,eave+.50*(1-u)/2,hd);ridge=new T.Vector3(u*rh,peak,0);}
  else if(side===1){edge=returnCurve.getPoint((1-u)/2);ridge=new T.Vector3(rh,peak,0);}
  else if(side===2){const f=(u+1)/2;edge=new T.Vector3(-hw+(far.x+hw)*f,eave+(far.y-eave)*f,-hd+(far.z+hd)*f);ridge=new T.Vector3(u*rh,peak,0);}
  else{edge=new T.Vector3(-hw,eave+.50*(u+1)/2,u*hd);ridge=new T.Vector3(-rh,peak,0);}
  const p=ridge.clone().lerp(edge,t);p.y=edge.y+(peak-edge.y)*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7));return p.toArray();
 }
 const span=rh+(hw-rh)*t;let x=side%2?(side===1?1:-1)*span:u*span,z=side%2?u*hd*t:(side===0?1:-1)*hd*t;
 return [x,eave+grade*x+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];
}''' +s[b:]
s=s.replace("  roof(run+.85,3.25,8.75,.86,.27,.28,.10,grade);","  // This bearing gallery is sheltered by the actual continuous main return\n  // roof above. It has no duplicate gabled canopy or floating ridge ornament.")
s=s.replace("mats.leaf.color.set('#3b4d1f');mats.leaflight.color.set('#667632')","mats.leaf.color.set('#526932');mats.leaflight.color.set('#879948')")
s=s.replace("material('pine','#2e512b',.82)","material('pine','#426330',.82)")
s=s.replace("scene.add(new T.HemisphereLight('#d4e1e8','#6a4b29',.36))","scene.add(new T.HemisphereLight('#d4e1e8','#6a4b29',.46))")
s=s.replace("revision:'scene08-monumental-layered-court148-v2-r04-20261021'","revision:'scene08-monumental-continuous-court148-v2-r05-20261021'")
p.write_text(s)
# Brighten only the actual green blade scan, keeping physically bounded albedo.
# Every source UV/normal/vertex-color attribute remains intact.
p=Path('reconstructions/scene-08/src/courtyard-botany148.js');s=p.read_text()
needle=' const leafMaterials={};'
add=''' const greenCanvas=document.createElement('canvas');greenCanvas.width=canvas.width;greenCanvas.height=canvas.height;const gc=greenCanvas.getContext('2d'),gi=gc.createImageData(greenCanvas.width,greenCanvas.height);
 for(let k=0;k<pixels.length;k+=4){for(let c=0;c<3;c++){const q=pixels[k+c]/255,v=q<=.04045?q/12.92:Math.pow((q+.055)/1.055,2.4),p=Math.min(.78,v*2.0);gi.data[k+c]=Math.round((p<=.0031308?p*12.92:1.055*Math.pow(p,1/2.4)-.055)*255);}gi.data[k+3]=255;}
 gc.putImageData(gi,0,0);const greenMap=new T.CanvasTexture(greenCanvas);greenMap.colorSpace=T.SRGBColorSpace;greenMap.flipY=map.flipY;greenMap.anisotropy=8;textures.add(greenMap);
''' +needle
s=s.replace(needle,add).replace("m.color.set(color);m.roughness=.61","m.color.set(color);m.map=greenMap;m.roughness=.61")
s=s.replace("revision:'scene08-mature-branched-crown148-v2'","revision:'scene08-mature-physical-albedo-crown148-v2-r05'")
p.write_text(s)
p=Path('reconstructions/scene-08/src/courtyard-radiance148.js');s=p.read_text().replace('scene.environmentIntensity=.28','scene.environmentIntensity=.48').replace('environmentIntensity:.28','environmentIntensity:.48');p.write_text(s)
