from pathlib import Path
p=Path('src/world.js');s=p.read_text()
s=s.replace("import {createBotany,foliageNormalMaterial} from './botany.js';", "import {createBotany,foliageNormalMaterial} from './botany.js';\nimport {carvedBracket,carvedLeaf,archHeight} from './ornaments.js';")
s=s.replace("    leafCard:botany.card,", "    leafCard:botany.card,\n    carvedBracket:carvedBracket(),\n    carvedLeaf:carvedLeaf(),")
a=s.index('  function brackets(');b=s.index('  function railing(',a)
s=s[:a]+'''  function brackets(x,y,z,s=1){
    group(x,y,z,0,()=>{
      for(let axis=0;axis<2;axis++)group(0,0,0,axis*Math.PI/2,()=>{
        for(let level=0;level<3;level++){
          const extent=(.45+level*.18)*s,cy=level*.24*s;
          instance('carvedBracket',level===1?'red':'cedar',0,cy,0,extent*2,.24*s,.29*s);
          for(const side of [-1,1]){
            box(side*extent,cy+.17*s,0,.22*s,.20*s,.35*s,'red');
            box(side*extent,cy+.28*s,0,.29*s,.06*s,.41*s,'oldgold');
            for(const front of [-1,1]){
              sphere(side*extent,cy+.17*s,front*.19*s,.057*s,.057*s,.013*s,'oldgold');
              instance('carvedLeaf','endwood',side*extent*.58,cy-.01*s,front*.157*s,.16*s,.18*s,.30*s,[0,front<0?Math.PI:0,side*.78]);
            }
          }
        }
      });
    });
  }
''' +s[b:]
a=s.index('  function gableRoof(');b=s.index('  // Terrain,',a)
s=s[:a]+'''  function gableRoof(x,y,z,w,d,rise){
    group(x,y,z,0,()=>{
      const profile=[];for(let i=0;i<=72;i++){const xx=-w/2+w*i/72;profile.push([xx,archHeight(xx/(w/2),rise),d/2]);}
      line(profile,.18,'darkwood',72);line(profile.map(p=>[p[0],p[1]+.09,p[2]+.05]),.115,'cedar',72);line(profile.map(p=>[p[0],p[1]+.20,p[2]+.09]),.027,'gold',72);line(profile.map(p=>[p[0],p[1]-.20,p[2]+.035]),.055,'oldgold',72);
      const pos=[],ids=[];
      for(let j=0;j<=24;j++)for(let i=0;i<=72;i++){const [xx,yy]=profile[i];pos.push(xx,yy+.09,-d/2+d*j/24);if(j<24&&i<72){const a=j*73+i;ids.push(a,a+73,a+1,a+1,a+73,a+74);}}
      const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(pos,3));roof.setIndex(ids);roof.computeVertexNormals();instance(roof,'slate',0,0,0,1,1,1);
      for(let j=0;j<=Math.ceil(d/.24);j++){const zz=-d/2+d*j/Math.ceil(d/.24);line(profile.map(p=>[p[0],p[1]+.13,zz]),.042,'tileEdge',56);}
      // Closed, heavy pediment carved in relief, with a central lotus crest.
      const sh=new T.Shape();sh.moveTo(-w/2,.03);sh.lineTo(w/2,.03);for(let i=72;i>=0;i--)sh.lineTo(profile[i][0],Math.max(.03,profile[i][1]-.24));sh.closePath();
      const back=new T.ExtrudeGeometry(sh,{depth:.20,bevelEnabled:true,bevelThickness:.018,bevelSize:.018,bevelSegments:2,curveSegments:8});instance(back,'darkwood',0,0,d/2-.24,1,1,1);
      box(0,.04,d/2,w,.20,.30,'red');box(0,-.11,d/2+.02,w*.96,.05,.36,'oldgold');
      const crest=Math.min(.55,w*.068),centerY=rise*.57;
      torus(0,centerY,d/2+.08,crest,.038,'oldgold');sphere(0,centerY,d/2+.09,crest*.25,crest*.25,.05,'gold');
      for(let k=0;k<12;k++){const a=k/12*Math.PI*2;instance('carvedLeaf','gold',Math.sin(a)*crest*.48,centerY+Math.cos(a)*crest*.48,d/2+.1,crest*.42,crest*.82,.50,[0,0,-a]);}
      for(const side of [-1,1]){
        const scroll=[];for(let j=0;j<=64;j++){const t=j/64,aa=t*Math.PI*3.8,r=(1-t)*crest*.6;scroll.push([side*(crest*.82+t*w*.30+Math.sin(aa)*r),rise*.16+Math.cos(aa)*r*.62,d/2+.085]);}
        line(scroll,.035,'endwood',60);line(scroll.map(p=>[p[0],p[1]+.025,p[2]+.045]),.012,'oldgold',60);
        for(let k=0;k<12;k++){const t=(k+.5)/12,xx=side*(crest+t*w*.30),yy=rise*.16+Math.sin(t*6.28)*crest*.20,available=archHeight(xx/(w/2),rise)-.32;if(available>yy+.12){instance('carvedLeaf',k%3?'endwood':'oldgold',xx,yy+.10,d/2+.07,.24,.31,.45,[0,0,side*(.7+Math.sin(k)*.4)]);}}
      }
      for(const side of [-1,1])for(let i=0;i<5;i++){const xx=side*w*(.12+i*.061),yy=archHeight(xx/(w/2),rise)-.38;if(yy>.2)instance('carvedLeaf','oldgold',xx,yy,d/2+.02,.15,.24,.30,[0,0,side*.9]);}
      sphere(0,rise+.21,0,.12,.19,.12,'oldgold');
    });
  }
''' +s[b:]
s=s.replace("  const pondRadius = a => 1 + .055 * Math.sin(a * 5) + .04 * Math.cos(a * 7);", "  const pondRadius = a => 1+.115*Math.sin(a*3)+.055*Math.cos(a*7)+.026*Math.sin(a*11);\n  const inPond=(x,z,margin=1)=>Math.hypot(x/22.3,(z-4.8)/14.2)<pondRadius(Math.atan2((z-4.8)/14.2,x/22.3))*margin;")
s=s.replace("let pond = x * x / (22 * 22) + (z - 4.8) * (z - 4.8) / (14.1 * 14.1) < 1.02;", "let pond=inPond(x,z,1.025);")
s=s.replace("const path = x > 2.1 && x < 9.7 || z > 17.5 || z < -7.8 || x > 21 || x < -23;", "const path=(x>3.4&&x<8.6)||(z>18&&Math.abs(x)<25)||(z<-20&&z>-28&&x>-24&&x<24)||(z<-7.8&&z>-10.5)||(x>20.8&&x<26.6)||(x<-24&&x>-29);")
s=s.replace("(!pond || x > 3.3 && x < 8.4 && z < 4.6)", "(!pond || x>3.4&&x<8.6&&z<20)")
s=s.replace("      box(3, .14, 17.8 - i * 1.07", "      box(3.3, .14, 17.8 - i * 1.07").replace("      box(9, .14, 17.8 - i * 1.07", "      box(8.7, .14, 17.8 - i * 1.07")
s=s.replace("  platform(6, -11, 20, 16, 1.7);", "  // A raised main terrace gives the hall a commanding mass above the garden.\n  platform(6,-11,20,16,2.7);")
s=s.replace("stairs(6, 5.2, 4.6, 11, .185, .67);", "stairs(6,5.2,4.6,15,.205,.52);")
s=s.replace("group(6, 2.1, -11", "group(6, 3.1, -11")
s=s.replace("group(bx, 7.9, -3.88", "group(bx, 8.9, -3.88")
s=s.replace("hipRoof(6, 9.65, -11", "hipRoof(6, 10.65, -11").replace("gableRoof(6, 9.1, -2.9", "gableRoof(6, 10.1, -2.9")
s=s.replace("pendant(x, 9.2, z, .8)", "pendant(x, 10.2, z, .8)")
s=s.replace("group(6, 2.48, -14.5", "group(6, 3.48, -14.5")
s=s.replace("let yy = 8.32 - k * .22", "let yy = 9.32 - k * .22")
s=s.replace("hangingLantern(x, 7.5, z, .65)", "hangingLantern(x, 8.5, z, .65)")
s=s.replace("altarLight.position.set(6, 7.5, -11.5)", "altarLight.position.set(6, 8.5, -11.5)").replace("fillLight.position.set(6, 4, -5)", "fillLight.position.set(6, 5, -5)")
s=s.replace("mesh.position.set(1 + i * 1.4, 5.2,", "mesh.position.set(1 + i * 1.4, 6.2,")
s=s.replace("[[-8, -3, 3.4, 2.2], [13, 3, 3.4, 2.4], [-18, 5, 2.8, 3]]", "[[-8,-3,3.4,2.2],[13,3,3.4,2.4],[-18,5,5.6,3.5],[1.1,10.5,2.0,2.7],[10.9,10.5,2.1,3.4]]")
s=s.replace("if (rr < .85 && !avoidBridge && !path)", "if(inPond(x,z,.86)&&!avoidBridge&&!path&&!(x>2.7&&x<9.3))")
pos=s.index('  // Approach inset pavers')
s=s[:pos]+'''  // Real masonry below the procession path, plus landings at both ends of the red bridge.
  box(6,-.33,12.0,5.0,.74,16.0,'stone');
  box(2.55,.15,4.6,2.15,.70,3.75,'stone');
  for(let i=0;i<3;i++)box(2.15+i*.48,.46-i*.13,4.6,.50,.18,3.1,'paving');
  for(let i=0;i<28;i++){const zz=5.8+i*.48;for(const side of [-1,1]){box(6+side*2.52,-.06,zz,.08,.28,.46,'stone',0,rand(.75,1.05));if(i%4===0)fern(6+side*2.7,.06,zz,.40);}}
''' +s[pos:]
# Plant a winding and layered garden to replace the empty paved apron.
pos=s.index('  // Layered distant hills')
s=s[:pos]+'''  // Three terraced banks behind the hall: planted retaining walls, rather than an empty flat apron.
  for(let course=0;course<3;course++)for(let i=0;i<66;i++){const xx=-33+i*1.02,zz=-23-course*.76+.5*Math.sin(xx*.17);rock(xx,course*.43,zz,rand(.42,.72));}
  box(0,.15,-31,65,1.8,15,'earth');
  for(let i=0;i<170;i++){const xx=rand(-32,32),zz=rand(-22,-36);sphere(xx,1.1,zz,rand(.4,1),.12,rand(.4,1),'moss',rand(.75,1.1));if(i%2===0)fern(xx,1.25,zz,rand(.65,1.4));}
  // Roof layers and a continuous enclosing wall make the garden read as a temple compound.
  group(0,1.10,0,0,()=>{smallShrine(17,-32,1.1,-.05);smallShrine(-18,-33,1.0,.05);});
  for(let i=0;i<24;i++){const xx=-34+i*3.0;box(xx,2.35,-40,2.94,2.7,.55,'plaster');box(xx,3.78,-40,3.0,.16,.74,'slate');footColumn(xx-1.5,-40,1,2.9,.12);}
''' +s[pos:]
p.write_text(s)
p=Path('src/main.js');s=p.read_text()
s=s.replace('look1: [-.2, 8, -10]','look1: [-.2, 9, -10]').replace('look1: [1.8, 8.4, -7]','look1: [1.8, 9.4, -7]').replace('look1: [6, 6.9, -10]','look1: [6, 8.4, -10]')
s=s.replace('from: [6.75, 5.6, -7.8]','from: [6.75, 6.6, -7.8]').replace('to: [6, 5.7, -1.5]','to: [6, 6.7, -1.5]').replace('look0: [6, 5.85, -14.2]','look0: [6, 6.85, -14.2]').replace('look1: [6, 5.95, -13.6]','look1: [6, 6.95, -13.6]')
s=s.replace('from: [19.6, 9.3, 1]','from: [19.6, 10.3, 1]').replace('to: [31, 25, 31]','to: [25, 17, 28]').replace('look0: [17.5, 8.56, -1.5]','look0: [17.5, 9.56, -1.5]').replace('look1: [0, 6.5, -8.5]','look1: [0, 9.5, -9]')
s=s.replace('look1: [-3.4, 8, -12]','look1: [-3.4, 9, -12]').replace('look1: [-1.2, 7.2, -10]','look1: [-1.2, 8.2, -10]')
p.write_text(s)
