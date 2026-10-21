import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Source04 comparison supplies only numeric proportions. Every carving below
// is an authored, closed wood volume with an attached thin gilt skin.
const lin=(a,b,n)=>Array.from({length:n+1},(_,i)=>a+(b-a)*i/n);
const V=p=>new T.Vector3(...p);
function closedGeometry(p,id,tag){
 const edges=new Map(),count=id.length/3,adj=Array.from({length:count},()=>[]);
 for(let t=0;t<count;t++)for(let j=0;j<3;j++){const a=id[t*3+j],b=id[t*3+(j+1)%3],key=a<b?a+':'+b:b+':'+a,list=edges.get(key)??[];list.push({t,dir:a<b?1:-1});edges.set(key,list);}
 for(const list of edges.values()){if(list.length!==2)throw Error('Porch133 authored solid has an unclosed edge: '+tag);const[a,b]=list,flip=a.dir===b.dir?1:0;adj[a.t].push([b.t,flip]);adj[b.t].push([a.t,flip]);}
 const parity=new Int8Array(count).fill(-1);for(let first=0;first<count;first++)if(parity[first]<0){parity[first]=0;const queue=[first];for(let q=0;q<queue.length;q++){const t=queue[q];for(const [b,flip]of adj[t]){const value=parity[t]^flip;if(parity[b]<0){parity[b]=value;queue.push(b);}else if(parity[b]!==value)throw Error('Porch133 nonorientable solid: '+tag);}}}
 for(let t=0;t<count;t++)if(parity[t]){const k=t*3;[id[k+1],id[k+2]]=[id[k+2],id[k+1]];}
 let volume=0;for(let i=0;i<id.length;i+=3){const a=id[i]*3,b=id[i+1]*3,c=id[i+2]*3;volume+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}
 if(volume<0)for(let i=0;i<id.length;i+=3)[id[i+1],id[i+2]]=[id[i+2],id[i+1]];
 const uv=[];for(let i=0;i<p.length;i+=3)uv.push(p[i],p[i+1]);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(id);g.computeVertexNormals();g.userData.architectureMember=tag;g.userData.closedAuthoredSolid={pairedEdges:edges.size,absoluteVolume:Math.abs(volume)};return g;
}
// A thin coating follows the actual front of the carved substance. Its back
// sits 0.2mm in the wood; its outer face is 0.4mm above it, with closed edges.
function coating(grid,tag){
 const rows=grid.length,cols=grid[0].length,n=rows*cols,p=[],id=[];
 for(const dz of[-.0002,.0004])for(const row of grid)for(const q of row)p.push(q[0],q[1],q[2]+dz);
 const quad=(a,b,c,d)=>id.push(a,b,c,b,d,c);
 for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){const a=j*cols+i;quad(a,a+cols,a+1,a+cols+1);quad(a+n,a+1+n,a+cols+n,a+cols+1+n);}
 for(let i=0;i<cols-1;i++){quad(i,i+1,i+n,i+1+n);const a=(rows-1)*cols+i;quad(a,a+n,a+1,a+1+n);}
 for(let j=0;j<rows-1;j++){const a=j*cols,b=a+cols;quad(a,a+n,b,b+n);const c=a+cols-1,d=c+cols;quad(c,d,c+n,d+n);}
 return closedGeometry(p,id,tag);
}
function sweepSection(fn,x0,x1,section,tag){
 const xs=lin(x0,x1,160),p=[],id=[],m=section.length;
 for(const x of xs){const slope=(fn(x+.001)-fn(x-.001))/.002,n=1/Math.hypot(1,slope);for(const [dy,z]of section)p.push(x-dy*slope*n,fn(x)+dy*n,z);}
 for(let j=0;j<xs.length-1;j++)for(let i=0;i<m;i++){const k=(i+1)%m,a=j*m+i,b=j*m+k,c=(j+1)*m+i,d=(j+1)*m+k;id.push(a,c,b,b,c,d);}
 const cap=T.ShapeUtils.triangulateShape(section.map(q=>new T.Vector2(...q)),[]);
 for(const [a,b,c]of cap){id.push(a,b,c);const off=(xs.length-1)*m;id.push(a+off,c+off,b+off);}
 return closedGeometry(p,id,tag);
}
function leafVolume(length,width,depth,bend=.15){
 const rows=20,cols=14,p=[],id=[],sample=(t,theta)=>{
  const s=Math.sin(Math.PI*t),w=width*Math.pow(Math.max(0,s),.70)*(1+.065*Math.sin(t*7*Math.PI)),sy=Math.sin(theta);
  return[bend*length*t*t+Math.cos(theta)*w,t*length,depth*sy*(sy>=0?1:.32)*(.25+.75*s)+depth*.45*t*t];
 };
 p.push(...sample(0,0));for(let j=1;j<rows;j++)for(let i=0;i<cols;i++)p.push(...sample(j/rows,i*Math.PI*2/cols));const tip=p.length/3;p.push(...sample(1,0));
 for(let i=0;i<cols;i++)id.push(0,1+(i+1)%cols,1+i);
 for(let j=0;j<rows-2;j++)for(let i=0;i<cols;i++){const a=1+j*cols+i,b=1+j*cols+(i+1)%cols,c=a+cols,d=b+cols;id.push(a,b,c,b,d,c);}
 for(let i=0;i<cols;i++)id.push(tip,1+(rows-2)*cols+i,1+(rows-2)*cols+(i+1)%cols);
 return{wood:closedGeometry(p,id,'133-closed-lobed-carved-leaf'),gilt:coating(lin(.13,.91,14).map(t=>lin(Math.PI*.12,Math.PI*.88,10).map(a=>sample(t,a))),'133-seated-leaf-gilt-skin')};
}
function ribbonVolume(points,width,depth){
 const curve=new T.CatmullRomCurve3(points.map(V)),steps=54,cols=12,p=[],id=[];
 const sample=(t,a)=>{const q=curve.getPoint(t),tan=curve.getTangent(t),n=new T.Vector3(-tan.y,tan.x,0).normalize(),w=width*(.38+.62*Math.pow(Math.sin(Math.PI*t),.65));return[q.x+n.x*w*Math.cos(a),q.y+n.y*w*Math.cos(a),q.z+depth*Math.sin(a)];};
 for(let j=0;j<=steps;j++)for(let i=0;i<cols;i++)p.push(...sample(j/steps,i*Math.PI*2/cols));
 for(let j=0;j<steps;j++)for(let i=0;i<cols;i++){const a=j*cols+i,b=j*cols+(i+1)%cols,c=a+cols,d=b+cols;id.push(a,b,c,b,d,c);}
 for(const j of[0,steps]){const q=curve.getPoint(j/steps),centre=p.length/3;p.push(q.x,q.y,q.z);for(let i=0;i<cols;i++)id.push(centre,j*cols+i,j*cols+(i+1)%cols);}
 return{wood:closedGeometry(p,id,'133-closed-variable-section-volute'),gilt:coating(lin(.035,.965,40).map(t=>lin(Math.PI*.27,Math.PI*.73,6).map(a=>sample(t,a))),'133-volute-conforming-gilt-crest')};
}

export function buildPorchJoinery133(mats,{C,profile}){
 const group=new T.Group();group.name='entrance-porch133-carved-bearing-hierarchy';const batches=new Map(),materials=[];
 const finish=(source,name,color,roughness)=>{const m=source.clone();m.name=name;m.color.setHex(color);m.roughness=roughness;if(m.isMeshPhysicalMaterial){m.clearcoat=.16;m.clearcoatRoughness=.30;m.bumpScale=.0017;}materials.push(m);return m;};
 const wood=finish(mats.cedar,'scene04-133-carved-lacquered-cedar',0x76391e,.46),red=finish(mats.red,'scene04-133-nuki-red-brown',0x80351f,.48),shade=finish(mats.darkwood,'scene04-133-carved-recess-wood',0x2b160c,.70),gilt=finish(mats.gold,'scene04-133-aged-gilt-skin',0xd3a33c,.31);gilt.metalness=.88;
 const stats={revision:'porch133-ensemble-depth134',fasciaNormalDepth:.292,giltSkinThicknessMetres:.0006,closedLeaves:0,closedVolutes:0,frontColumnBearingSets:0,visualAccepted:false};
 function put(g,ma,x=0,y=0,z=0,angle=0){if(angle)g.rotateZ(angle);g.translate(x,y,z);let a=batches.get(ma);if(!a){a=[];batches.set(ma,a);}a.push(g);}
 function solid(shape,depth,ma,x,y,z,tag){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.009,bevelThickness:.008,bevelSegments:3,curveSegments:20});g.userData.architectureMember=tag;put(g,ma,x,y,z);}
 function box(w,h,d,x,y,z,ma=wood){put(new T.BoxGeometry(w,h,d),ma,x,y,z);}
 function leaf(x,y,z,angle,len=.20,w=.042,deep=.027,coated=true,bend=.15){const l=leafVolume(len,w,deep,bend);put(l.wood,wood,x,y,z,angle);if(coated)put(l.gilt,gilt,x,y,z,angle);else l.gilt.dispose();stats.closedLeaves++;}
 function volute(points,w=.032,d=.022,coated=true,ma=wood){const s=ribbonVolume(points,w,d);put(s.wood,ma);if(coated)put(s.gilt,gilt);else s.gilt.dispose();stats.closedVolutes++;}
 function flower(x,y,z,r=.13,phase=0){for(let i=0;i<7;i++){const a=i*Math.PI*2/7+phase;leaf(x,y,z,a,r,.028,.018,true,.13);}put(new T.SphereGeometry(.029,12,8),gilt,x,y,z+.025);}
 function cartouche(x,y,z,w,h,phase=0){
  for(const side of[-1,1]){
   volute([[x,y-h*.12,z],[x+side*w*.20,y+h*.27,z],[x+side*w*.43,y+h*.08,z],[x+side*w*.38,y-h*.23,z],[x+side*w*.24,y-h*.18,z],[x+side*w*.22,y-h*.02,z]],.019,.016,true);
   for(let j=0;j<3;j++)leaf(x+side*w*(.16+j*.095),y-h*.12+Math.sin(j+phase)*h*.10,z-.003,-side*(.48+j*.44),h*(.46+j*.025),.021,.016,true,.18);
  }
  flower(x,y,z+.010,Math.min(.11,h*.40),phase);
 }
 const front=profile.front,at=x=>profile.canopy(x,front);
 // The old 460mm board, front blocks and nested face bands were one visual
 // stack. This 292mm normal section is a real timber with narrow rolled lips.
 const section=[[-.025,front-.075],[-.025,front+.048],[-.052,front+.082],[-.086,front+.099],[-.225,front+.088],[-.272,front+.064],[-.292,front+.032],[-.279,front+.008],[-.248,front+.018],[-.248,front-.075]];
 const fasciaGeometry=sweepSection(at,-profile.half,profile.half,section,'entrance-saddled-bargeboard');fasciaGeometry.userData.porch133='133-thin-closed-karahafu-fascia';
 const fasciaMesh=new T.Mesh(fasciaGeometry,wood);fasciaMesh.name='entrance-porch133-actual-suspended-lamp-fascia';fasciaMesh.castShadow=fasciaMesh.receiveShadow=true;group.add(fasciaMesh);
 for(const [drop,zFace]of[[-.065,.089],[-.255,.073]]){const ring=lin(0,Math.PI*2,10).slice(0,-1).map(a=>[drop+.0045*Math.cos(a),front+zFace+.003*Math.sin(a)]);put(sweepSection(at,-profile.half,profile.half,ring,'133-seated-gilt-fascia-fillet'),gilt);}
 for(const [i,x]of[-5.55,-3.0,0,3.0,5.55].entries()){
  const y=at(x)-.145,z=front+.091,s=i===2?1.35:.90,angle=Math.atan((at(x+.01)-at(x-.01))/.02);
  // Applied shallow, lobed strap carving follows the timber tangent.
  for(const side of[-1,1]){const xx=x+side*.12*s*Math.cos(angle),yy=y+side*.12*s*Math.sin(angle);leaf(xx,yy,z,Math.PI+angle-side*.50,.17*s,.035*s,.019,true,side*.12);}
  cartouche(x,y-.005,z,.50*s,.15*s,i*.31);
  if(i===2)for(let j=0;j<5;j++)leaf(x+(j-2)*.055,y-.12,z,Math.PI+(j-2)*.25,.17,.028,.022,true,.12);
 }
 function shapedBeam(width,height,y,frontZ,ma,bow=.07){
  const shape=new T.Shape(),xs=lin(-width/2,width/2,60),top=x=>height*.48+bow*(1-Math.pow(2*x/width,2)),bottom=x=>-height*.48-.026*Math.cos(x*3)+.07*Math.pow(Math.abs(2*x/width),5);
  shape.moveTo(xs[0],top(xs[0]));for(const x of xs.slice(1))shape.lineTo(x,top(x));for(const x of [...xs].reverse())shape.lineTo(x,bottom(x));shape.closePath();solid(shape,.36,ma,0,y,frontZ-.36,'133-sculpted-transfer-beam');
 }
 const upperY=C.capitalTop+.40,upperFront=.75,nukiY=C.capitalTop-.67,nukiFront=.61;
 shapedBeam(6.68,.43,upperY,upperFront,wood,.08);
 shapedBeam(6.76,.40,nukiY,nukiFront,red,.035);
 for(const [i,x]of[-2.45,-1.25,0,1.25,2.45].entries())cartouche(x,upperY+.015,upperFront+.006,i===2?1.05:.64,.23,i*.43);
 for(const [i,x]of[-2.55,-1.27,0,1.27,2.55].entries())cartouche(x,nukiY+.01,nukiFront+.006,i===2?1.10:.80,.23,i*.52);
 // A seated openwork frieze occupies the gap, instead of another rectangular
 // decorated band. Every branch grows from the lower nuki or a connected limb.
 const rootY=nukiY+.22,cz=.57;
 volute([[0,rootY,cz],[0,rootY+.19,cz],[0,rootY+.36,cz]],.036,.039,true,shade);
 for(const side of[-1,1]){
  const pts=[[0,rootY+.05,cz],[side*.57,rootY+.29,cz],[side*1.25,rootY+.31,cz],[side*1.54,rootY+.15,cz],[side*1.31,rootY+.06,cz],[side*1.03,rootY+.15,cz],[side*1.18,rootY+.25,cz]];
  volute(pts,.048,.040,true);
  const outer=[[side*1.1,rootY+.12,cz],[side*1.65,rootY+.24,cz],[side*2.23,rootY+.17,cz],[side*2.32,rootY+.04,cz],[side*2.13,rootY+.01,cz],[side*2.03,rootY+.10,cz]];
  volute(outer,.036,.035,true);
  for(const [points,count]of[[pts,16],[outer,10]]){const branch=new T.CatmullRomCurve3(points.map(V));for(let j=0;j<count;j++){const t=.035+.91*j/(count-1),q=branch.getPoint(t),tan=branch.getTangent(t),angle=Math.atan2(tan.y,tan.x)-Math.PI/2+side*(j%2?.65:-.65);leaf(q.x,q.y,q.z+.014,angle,.22+(j%3)*.029,.049,.042,j%6!==1,side*.20);}}
  // A second connected, folded leaf rank gives the photographed frieze real
  // relief mass. Each stem returns to the load-carrying lower nuki.
  for(let j=0;j<7;j++){const x=side*(.26+j*.29),y=rootY+.10+.08*Math.sin(j*.73);volute([[x,rootY-.02,cz-.015],[x-side*.045,y+.08,cz+.008],[x-side*.12,y+.15,cz+.032]],.024,.025,false);leaf(x-side*.11,y+.10,cz+.033,-side*(.70+j*.13),.23,.046,.040,true,side*.16);}
  flower(side*1.47,rootY+.16,cz+.085,.145,side*.19);
  volute([[side*2.16,rootY-.02,cz],[side*2.22,rootY+.08,cz],[side*2.08,rootY+.17,cz]],.032,.032,false);
 }
 flower(0,rootY+.20,cz+.070,.205,.18);
 // Paired cloud arms and actual receivers sit on the retained six shaft caps.
 const arm=new T.Shape();arm.moveTo(-.55,.07);arm.lineTo(.55,.07);arm.bezierCurveTo(.62,.035,.57,-.085,.46,-.10);arm.bezierCurveTo(.37,-.12,.34,-.01,.27,-.015);arm.bezierCurveTo(.13,-.02,.13,-.11,0,-.11);arm.bezierCurveTo(-.18,-.11,-.17,-.02,-.31,-.03);arm.bezierCurveTo(-.44,-.12,-.60,-.07,-.55,.07);arm.closePath();
 for(const x of C.columnAxes){
  const cap=Math.abs(x)<3.2?C.capitalTop:Math.abs(x)<5.5?C.capitalTop-.72:C.capitalTop-1.0;
  box(.54,.115,.48,x,cap+.0575,0,wood);
  solid(arm,.22,wood,x,cap+.155,-.11,'133-closed-cloud-hijiki');
  const fore=new T.ExtrudeGeometry(arm,{depth:.20,bevelEnabled:true,bevelSize:.010,bevelThickness:.008,bevelSegments:3,curveSegments:20});fore.rotateY(Math.PI/2);put(fore,wood,x-.10,cap+.155,.26);
  for(const sign of[-1,1])box(.18,.10,.25,x+sign*.39,cap+.195,.01,wood);
  box(.86,.085,.24,x,cap+.255,.40,red);
  // Smaller, joined cloud noses tie the lower nuki into each shaft.
  solid(arm,.28,wood,x,cap-.52,.19,'133-carved-column-nuki-kibana');
  cartouche(x,cap-.54,.478,.62,.19,x*.17);
  for(const side of[-1,1])leaf(x+side*.11,cap+.11,.125,-side*.85,.13,.026,.024,true,side*.15);
  stats.frontColumnBearingSets++;
  // Fine attached shaft fittings establish the column scale without fake
  // lettering. Their skins follow actual small closed carved wood leaves.
  const shaftFront=(Math.abs(x)<3.2?.327:.286)*1.025;
  for(let j=0;j<3;j++)leaf(x,cap-1.02-j*.27,shaftFront+.003,Math.PI,.11,.018,.006,true,.04);
 }
 // Side-bay shallow relief stays on the retained real crossbeam faces.
 for(const side of[-1,1])for(const [a,b,y]of[[C.columnAxes[3],C.columnAxes[4],C.capitalTop-.60],[C.columnAxes[4],C.columnAxes[5],C.capitalTop-.88]])cartouche(side*(a+b)/2,y,.268,(b-a)*.76,.20,a*.2);
 // The door lintel is retained as a real timber; its former solid gold plate
 // and repeated wire motifs are replaced by low conforming relief.
 for(const [i,x]of[-1.65,-.82,0,.82,1.65].entries())cartouche(x,C.stairTopY+4.38+.23,-.355,.70,.19,i*.37);
 for(const [ma,parts]of batches){const flat=parts.map(g=>g.index?g.toNonIndexed():g),g=mergeGeometries(flat,false);if(!g)throw Error('Porch133 geometry merge failed');const mesh=new T.Mesh(g,ma);mesh.name='entrance-porch133-'+ma.name;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);for(const q of parts)q.dispose();for(const q of flat)q.dispose();}
 group.userData.porch133=stats;return{group,materials,stats};
}
