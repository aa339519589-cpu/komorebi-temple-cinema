from pathlib import Path
p=Path('reconstructions/scene-08/src/scene.js')
s=p.read_text()
s=s.replace("ridgeRatio=.22,hornHeight=.52){const hw","ridgeRatio=.22,hornHeight=.52,grade=0){const hw")
s=s.replace("return [x,eave+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];","return [x,eave+grade*x+rise*Math.pow(Math.max(0,1-t),1.65)+curl*Math.pow(t,8)*(.22+.78*Math.pow(Math.abs(u),7)),z];")
s=s.replace("'arched-stream-bridge','gallery-stone-stair'","'arched-stream-bridge','gallery-stone-stair','upper-descending-gallery'")
# Delete naked roof joists added in R01; replace with a physically occupied
# intermediate gallery whose front eave follows the observed descending edge.
a=s.index(" for(const sign of[-1,1])for(let j=0;j<9;j++){",s.index('function monumentalHall'))
b=s.index(" for(const sx of[-1,1])for(const sz",a)
s=s[:a]+s[b:]
needle="role='layered-walkways';group(-4.0"
idx=s.index(needle)
add='''// The reference contains an intermediate upper gallery between the large
// near hall and the lower courtyard canopy. Its real pitched roof descends
// along the circulation route; it is not a flat extension of the main hip.
role='upper-descending-gallery';
{
 const a=[-2.09,-7.35],b=[2.24,-9.80],run=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=Math.atan2(-(b[1]-a[1]),b[0]-a[0]),grade=-1.30/run;
 group((a[0]+b[0])/2,0,(a[1]+b[1])/2,yaw,()=>{
  const floorAt=x=>4.10-.60*x/run,eaveAt=x=>8.75+grade*x;
  // Stone piers and individual deck members share the same sloping datum.
  for(let i=0;i<28;i++){
   const x=-run/2+(i+.5)*run/28,fy=floorAt(x);box(x,fy-.14,0,run/28-.008,.18,2.27,'wood');
   if(i%7===0)for(const z of[-.92,.92])box(x,(fy-1.4)/2+.7,z,.38,fy-1.40,.42,'hallFoundation');
  }
  for(const z of[-.96,.96])emit(createContinuousTimber([[-run/2,floorAt(-run/2)-.25,z],[run/2,floorAt(run/2)-.25,z]],.19,.27,.014),'wood');
  for(let i=0;i<5;i++){
   const x=-run*.46+i*run*.92/4,fy=floorAt(x),ey=eaveAt(x);
   for(const z of[-.89,.89]){
    column(x,z,fy,ey-fy-.83,.23);
    for(const q of galleryJoinery.parts)emit(q.geometry,q.material,x,ey-.75,z,.63,.80,.63);
    box(x,ey-.30,z,.19,.22,.65,'red');
   }
   box(x,ey-.38,0,.18,.20,2.48,'red');
   if(i<4){
    const xx=x+run*.115,doorY=floorAt(xx)+1.64;
    box(xx,doorY,-.57,run*.20,3.15,.15,'dark');lattice(xx,doorY,-.46,run*.16,2.64);
    box(xx,doorY+1.51,-.42,run*.205,.30,.19,'wall');
    group(xx,doorY+1.54,-.30,0,()=>{for(const q of relief.variants[i])emit(q.geometry,q.material,0,0,0,1.17,.85,1);});
   }
  }
  for(const z of[-1.04,1.04])for(const dy of[-.30,-.65])emit(createContinuousTimber([[-run*.49,eaveAt(-run*.49)+dy,z],[run*.49,eaveAt(run*.49)+dy,z]],.21,.22,.013),'red');
  roof(run+.85,3.25,8.75,1.27,.35,.28,.27,grade);
  for(const x of[-run*.36,run*.36])lantern(x,eaveAt(x)-1.29,1.13,.30);
 });
}
'''
s=s[:idx]+add+s[idx:]
# The upper pagoda roof edges are broad and shallow in the supplied reference;
# preserve the crown apex while moving real eave+bracket bearings upward.
s=s.replace("roof(w*.93,w*.84,floor+h+.15,level===4?2.71:1.40,.44,.028,.24);","for(const side of[-1,1])for(let j=0;j<7;j++){const x=-body*.48+j*body*.96/6;box(x,floor+h+.12,side*(hh+.44),.16,.37,.21,'red');brackets(x,floor+h-.10,side*(hh+.44),.42);}\n  roof(w*.96,w*.88,floor+h+.59,level===4?2.27:.96,.44,.028,.24);")
s=s.replace("emit(ballG,'gold',0,18.86,0,.115,.20,.115);","emit(new T.CylinderGeometry(.012,.038,.82,16),'oldgold',0,19.16,0);emit(ballG,'gold',0,19.60,0,.07,.105,.07);")
# Weathered carved stone stays closed while acquiring chipped stone edges and
# irregular mineral relief at actual millimetre/centimetre scale.
s=s.replace("const shaft=new T.LatheGeometry([[.48,0],[.51,.09],[.48,.19],[.36,.28],[.25,.36],[.23,.61],[.20,1.07],[.29,1.14],[.40,1.21],[.44,1.31],[.38,1.41]].map(p=>new T.Vector2(...p)),36);","const shaftProfile=[[.48,0],[.51,.09],[.48,.19],[.36,.28],[.25,.36],[.23,.61],[.20,1.07],[.29,1.14],[.40,1.21],[.44,1.31],[.38,1.41]],shaftPoints=[];for(let j=0;j<shaftProfile.length-1;j++)for(let k=0;k<6;k++){const t=k/6;shaftPoints.push(new T.Vector2(shaftProfile[j][0]*(1-t)+shaftProfile[j+1][0]*t,shaftProfile[j][1]*(1-t)+shaftProfile[j+1][1]*t));}shaftPoints.push(new T.Vector2(...shaftProfile.at(-1)));const shaft=new T.LatheGeometry(shaftPoints,48);")
s=s.replace("emit(agedStone(shaft,.024)","emit(agedStone(shaft,.036)")
s=s.replace("mats.carvedstone.color.set('#babeb4')","mats.carvedstone.color.set('#d4d1bb')")
# Replace enormous smooth acorn with an eroded three-part stupa finial.
s=s.replace("emit(agedStone(new T.LatheGeometry([[.16,3.0],[.20,3.07],[.18,3.15],[.12,3.23],[.18,3.31],[.20,3.40],[.17,3.51],[.09,3.59],[0,3.63]].map(p=>new T.Vector2(...p)),40),.018),'carvedstone');","emit(agedStone(new T.LatheGeometry([[.16,3.0],[.20,3.07],[.19,3.15],[.12,3.23],[.10,3.28]].map(p=>new T.Vector2(...p)),40),.022),'carvedstone');\n emit(agedStone(new T.SphereGeometry(.185,32,24),.023),'carvedstone',0,3.43,0);emit(agedStone(new T.CylinderGeometry(.035,.13,.12,32),.012),'carvedstone',0,3.61,0);")
# The near rail has no terminal post in the visible opening; its cap continues
# into the real right gate jamb rather than stopping short in open air.
s=s.replace("railing([-2.20,5.70],[1.77,8.00],t=>.54-.26*t,true)","railing([-2.20,5.70],[2.30,8.07],t=>.54-.27*t,true)")
s=s.replace("revision:'scene08-monumental-occupied-court148-v2-r01-20261021'","revision:'scene08-monumental-descending-court148-v2-r02-20261021'")
p.write_text(s)
