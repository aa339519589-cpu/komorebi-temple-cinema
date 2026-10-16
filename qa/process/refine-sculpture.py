from pathlib import Path
p=Path('src/world.js');s=p.read_text()
s=s.replace("unit={box:","unit={box:")
s=s.replace("cylinder:new T.CylinderGeometry(.97,1,1,16)","cylinder:new T.CylinderGeometry(.97,1,1,32)")
s=s.replace("instance(square?'box':'thinCylinder',ma,mid.x,mid.y,mid.z,width||r*2,len,r*2,q);", "instance(square?'box':ma==='buddha'?'cylinder':'thinCylinder',ma,mid.x,mid.y,mid.z,width||r*2,len,r*2,q);if(ma==='buddha'){sphere(a.x,a.y,a.z,r,r,r,ma);sphere(b.x,b.y,b.z,r,r,r,ma);}")
a=s.index('// Gentle, forward-facing head.');b=s.index('// Resting left hand',a)
s=s[:a]+'''// A continuous sculpted face: cheeks, eye sockets, brow, nose and lips are relief in one mesh.
const head=new T.SphereGeometry(1,128,96),hp=head.attributes.position;
for(let i=0;i<hp.count;i++){let nx=hp.getX(i),ny=hp.getY(i),nz=hp.getZ(i),xx=nx*.43,yy=ny*.58,zz=nz*.39;const gauss=(x,y,sx,sy)=>Math.exp(-Math.pow((xx-x)/sx,2)-Math.pow((yy-y)/sy,2));if(nz>0){let relief=.057*gauss(0,.035,.065,.20)+.093*gauss(0,-.105,.083,.066)+.022*gauss(-.19,-.09,.14,.15)+.022*gauss(.19,-.09,.14,.15)-.019*gauss(-.18,.07,.12,.055)-.019*gauss(.18,.07,.12,.055)+.021*gauss(0,-.235,.135,.035)+.019*gauss(0,-.33,.17,.09);zz+=relief*Math.pow(nz,.5);}hp.setXYZ(i,xx,yy+4.2,zz);}
head.computeVertexNormals();instance(head,'buddha',0,0,0,1,1,1);
sphere(0,4.76,-.025,.20,.22,.20,'oldgold');sphere(0,4.96,-.025,.075,.12,.075,'buddha');
for(let side of [-1,1]){sphere(side*.43,4.09,-.015,.075,.24,.09,'buddha');line([[side*.45,4.28,.035],[side*.49,4.16,.065],[side*.47,3.94,.055],[side*.42,3.92,.055]],.018,'oldgold',20);line([[side*.075,4.28,.362],[side*.18,4.255,.365],[side*.275,4.275,.32]],.007,'oldgold',16);line([[side*.065,4.37,.365],[side*.18,4.39,.356],[side*.29,4.35,.31]],.008,'oldgold',16);}
line([[-.11,3.965,.368],[0,3.953,.397],[.11,3.965,.368]],.006,'oldgold',22);sphere(0,4.44,.358,.023,.023,.013,'gold');
// Tight curls are confined to the crown, keeping the face free of separate beads.
for(let row=0;row<6;row++){let yy=4.53+row*.047,rr=.439*Math.sqrt(Math.max(.01,1-Math.pow((yy-4.2)/.59,2))),count=Math.round(rr*95);for(let k=0;k<count;k++){let a=k/count*Math.PI*2+row*.12;sphere(Math.sin(a)*rr,yy,Math.cos(a)*rr-.014,.031,.027,.031,'oldgold',rand(.8,1.15));}}
for(const [xx,yy,zz,rr]of [[-.62,3.4,.08,.19],[-.95,2.65,.35,.16],[.66,3.4,.02,.19],[.92,2.75,.33,.16]])sphere(xx,yy,zz,rr,rr,rr,'buddha');
'''+s[b:]
s=s.replace(".012,'oldgold',24", ".005,'oldgold',24").replace(".013,'oldgold',30", ".006,'oldgold',30")
# Moss follows the sloping stone cap instead of floating above it.
s=s.replace("for(let i=0;i<6;i++)sphere(rand(-.4,.4)*s,2.78*s,rand(-.4,.4)*s,.1*s,.035*s,.12*s,'moss');", "for(let i=0;i<9;i++){let a=rand(0,6.28),r=rand(.2,.5);sphere(Math.cos(a)*r*s,(3.03-.62*r/.71+.018)*s,Math.sin(a)*r*s,.065*s,.015*s,.075*s,'moss');}")
p.write_text(s)
p=Path('src/main.js');s=p.read_text()
s=s.replace("to:[-9.5,3.9,23.5]", "to:[-9.5,4.8,28]").replace("look1:[1.8,6.2,-6]", "look1:[1.8,8.4,-7]")
s=s.replace("to:[-.8,9.3,7.5]", "to:[-.8,12.5,14]").replace("look1:[-12.8,13,-14.5]", "look1:[-12.8,15.5,-14.5]")
s=s.replace("from:[6,6.1,-10.8]", "from:[6.75,5.6,-7.8]").replace("look0:[6,6.55,-14.2]", "look0:[6,5.85,-14.2]")
p.write_text(s)
