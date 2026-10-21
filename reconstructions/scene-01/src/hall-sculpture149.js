import * as T from 'three';

// Source-built solid carpentry and foliage carving. The HD photograph is a
// scale/composition reference only; no photograph, generated image or depth
// plate is sampled by this module. Distances are local hall metres.
export function createHallSculpture149(B){
 const owned=new Set(),cache=new Map();
 const keep=g=>{owned.add(g);B.resources.add(g);return g;};
 const sculpt=B.m.wood.clone();sculpt.onBeforeCompile=B.m.wood.onBeforeCompile;sculpt.customProgramCacheKey=B.m.wood.customProgramCacheKey;sculpt.name='wood';sculpt.color.multiplyScalar(.94);sculpt.normalScale.set(.16,.16);sculpt.roughness=.91;sculpt.clearcoat=.035;sculpt.clearcoatRoughness=.57;B.m.hall149CarvedWood=sculpt;
 const cut=sculpt.clone();cut.onBeforeCompile=sculpt.onBeforeCompile;cut.customProgramCacheKey=sculpt.customProgramCacheKey;cut.name='wood';cut.color.multiplyScalar(.73);cut.roughness=.98;cut.clearcoat=.012;B.m.hall149CutWood=cut;
 const end=sculpt.clone();end.onBeforeCompile=sculpt.onBeforeCompile;end.customProgramCacheKey=sculpt.customProgramCacheKey;end.name='wood';end.color.multiply(new T.Color().setRGB(1.12,1.10,.99));end.normalScale.set(.12,.12);B.m.hall149EndWood=end;
 // Old leaf is a mixed, worn metal/diffuse surface rather than the near-pure
 // metal of a polished finial. It keeps the same measured scene illumination.
 for(const [key,color,metalness,roughness]of[['hall149Gilt',0xc6a15d,.56,.48],['hall149OldGilt',0x947039,.47,.59]]){const material=B.m.gold.clone();material.name=key;material.color.setHex(color);material.metalness=metalness;material.roughness=roughness;B.m[key]=material;}
 const wood='hall149CarvedWood',dark='hall149CutWood';
 function mirrored(g){const key='mirror|'+g.uuid;if(!cache.has(key)){const q=g.clone();q.scale(-1,1,1);const ix=Array.from(q.index?.array??Array.from({length:q.attributes.position.count},(_,i)=>i));for(let j=0;j<ix.length;j+=3)[ix[j+1],ix[j+2]]=[ix[j+2],ix[j+1]];q.setIndex(ix);q.computeVertexNormals();cache.set(key,keep(q));}return cache.get(key);}
 function mirrorEmit(g,ma,x,y,z,sx,sy,sz,rot=0,tint=1){B.emit(sx<0?mirrored(g):g,ma,x,y,z,Math.abs(sx),sy,sz,rot,tint);}
 function solid(s,depth=.22,bevel=.008){const g=new T.ExtrudeGeometry(s,{depth,steps:1,curveSegments:20,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3});g.translate(0,0,-depth/2);return keep(g);}
 function octagon(w,h,inset=0){const s=new T.Shape(),x=w/2-inset,y=h/2-inset,c=Math.min(x,y)*.17;for(const [i,p]of [[-x+c,-y],[x-c,-y],[x,-y+c],[x,y-c],[x-c,y],[-x+c,y],[-x,y-c],[-x,-y+c]].entries())i?s.lineTo(...p):s.moveTo(...p);s.closePath();return s;}
 function beam(w,h,d,bevel=.009){const key=['beam',w,h,d,bevel].join('|');if(!cache.has(key)){const s=new T.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();cache.set(key,solid(s,d,bevel));}return cache.get(key);}
 function moulding(x,y,z,w,h,d,ma=wood){B.emit(beam(w,h,d,Math.min(.009,h*.12)),ma,x,y,z);}
 // The convex, lobed leaf has a closed back and a rounded central arris.
 // It is a sculpted volume, not a flat leaf image or a wire outline.
 function leaf(){const p=[],uv=[],ix=[],N=18,R=12;
  for(let i=0;i<=N;i++){const t=i/N,wa=Math.pow(Math.sin(Math.PI*t),.78)*(.79+.21*Math.cos(t*8*Math.PI)),width=.20*wa,thick=.058*Math.pow(Math.sin(Math.PI*t),.7)+.003;
   for(let j=0;j<R;j++){const a=j/R*Math.PI*2;p.push(t,width*Math.cos(a),.040*Math.sin(Math.PI*t)+thick*Math.sin(a));uv.push(t,j/R);}}
  for(let i=0;i<N;i++)for(let j=0;j<R;j++){const a=i*R+j,b=i*R+(j+1)%R,c=a+R,d=b+R;ix.push(a,b,c,b,d,c);}
  p.push(0,0,0,1,0,0);uv.push(0,.5,1,.5);const lo=p.length/3-2,hi=lo+1;for(let j=0;j<R;j++){ix.push(lo,(j+1)%R,j);ix.push(hi,N*R+j,N*R+(j+1)%R);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return keep(g);
 }
 const blade=leaf();
 const metal=ma=>ma==='gold'?'hall149Gilt':ma==='goldDark'?'hall149OldGilt':ma;
 function carveLeaf(x,y,z,length,width,angle,ma='gold',depth=1,tint=1){B.emit(blade,metal(ma),x,y,z,length,width,depth,[0,0,angle],tint);}
 function closedCurve(points,r=.012){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments=Math.max(20,points.length*5),R=8,g=new T.TubeGeometry(curve,segments,r,R,false),p=Array.from(g.attributes.position.array),uv=Array.from(g.attributes.uv.array),ix=Array.from(g.index.array);
  // Seal each exact end ring with correctly wound faces. No open tube end
  // or overlapping sphere is used as a substitute for the cap surface.
  for(const t of[0,1]){const centre=curve.getPoint(t),normal=curve.getTangent(t).multiplyScalar(t?1:-1),ci=p.length/3,offset=t?segments*(R+1):0;p.push(...centre.toArray());uv.push(.5,.5);
   for(let j=0;j<R;j++){const a=offset+j,b=a+1,va=new T.Vector3(...p.slice(a*3,a*3+3)).sub(centre),vb=new T.Vector3(...p.slice(b*3,b*3+3)).sub(centre);if(va.cross(vb).dot(normal)>0)ix.push(ci,a,b);else ix.push(ci,b,a);}}
  g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.deleteAttribute('normal');g.computeVertexNormals();g.userData.closedEndCaps=true;return keep(g);
 }
 const curl=closedCurve([[0,0,0],[.11,.015,.008],[.19,.10,.018],[.15,.19,.017],[.05,.20,.013],[-.006,.14,.014],[.03,.085,.022],[.095,.11,.024]],.013);
 function lotus(x,y,z,r,ma='gold',phase=0){for(let i=0;i<8;i++){const a=phase+i*Math.PI/4;carveLeaf(x+Math.cos(a)*r*.12,y+Math.sin(a)*r*.12,z,r*.84,r*1.55,a,ma,r*2.0);}B.sphere(x,y,z+.016,r*.22,r*.22,r*.15,metal(ma));}
 const rim=(()=>{const s=octagon(1,1),h=octagon(1,1,.075);h.curves.reverse();for(const c of h.curves){if(c.v1&&c.v2)[c.v1,c.v2]=[c.v2,c.v1];}s.holes.push(h);return solid(s,.045,.008);})();
 const plaqueBack=solid(octagon(1,1),.035,.014);
 function fitting(x,y,z,w,h,{old=false}={}){
  B.emit(plaqueBack,'goldDark',x,y,z,w,h,.42);B.emit(rim,old?'hall149OldGilt':'hall149Gilt',x,y,z+.018,w,h,.50);
  const q=Math.min(w,h);lotus(x,y,z+.025,q*.32,old?'goldDark':'gold',Math.PI/8);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;B.emit(curl,'hall149Gilt',x+Math.cos(a)*q*.20,y+Math.sin(a)*q*.20,z+.027,q*.48,q*.48,.65,[0,0,a],.85);}
  for(const sx of[-1,1])for(const sy of[-1,1])B.sphere(x+sx*w*.37,y+sy*h*.37,z+.035,.008,.008,.004,'goldDark');
 }
 function profileArm(length,depth,notches=[],top=.10,bottom=-.11){const s=new T.Shape(),h=length/2;
  s.moveTo(-h,top);const cuts=notches.filter(n=>n.side==='top').sort((a,b)=>a.x-b.x);for(const n of cuts){s.lineTo(n.x-depth/2,top);s.lineTo(n.x-depth/2,.005);s.lineTo(n.x+depth/2,.005);s.lineTo(n.x+depth/2,top);}s.lineTo(h,top);
  s.quadraticCurveTo(h+.016,.018,h-.04,-.015);
  const low=notches.filter(n=>n.side==='bottom'),xs=[...new Set([h-.04,-h+.04,...Array.from({length:49},(_,i)=>-h+.04+(2*h-.08)*i/48),...low.flatMap(n=>[n.x-depth/2,n.x+depth/2])])].sort((a,b)=>b-a),under=x=>bottom+(-.015-bottom)*Math.pow(Math.abs(x)/(h-.04),2.4);
  for(let j=0;j<xs.length-1;j++){const a=xs[j],b=xs[j+1],cut=low.some(n=>Math.abs((a+b)/2-n.x)<depth/2);s.lineTo(a,cut?.005:under(a));s.lineTo(b,cut?.005:under(b));}
  s.quadraticCurveTo(-h-.016,.018,-h,top);s.closePath();return solid(s,depth,.008);
 }
 function seat(w,d,h){const s=new T.Shape();s.moveTo(-w*.33,0);s.lineTo(w*.33,0);s.bezierCurveTo(w*.34,h*.32,w*.49,h*.42,w*.5,h*.78);s.lineTo(w*.5,h);s.lineTo(-w*.5,h);s.lineTo(-w*.5,h*.78);s.bezierCurveTo(-w*.49,h*.42,-w*.34,h*.32,-w*.33,0);s.closePath();return solid(s,d,.008);}
 const daito=seat(.70,.64,.22),makito=seat(.29,.29,.14),first=[profileArm(.94,.27,[{x:0,side:'top'}]),profileArm(.94,.27,[{x:0,side:'bottom'}])],second=[profileArm(1.24,.23,[-1,1].map(s=>({x:s*.30,side:'top'}))),profileArm(1.24,.23,[-1,1].map(s=>({x:s*.30,side:'bottom'})))];
 const receiver=profileArm(1.58,.26,[{x:0,side:'top'}],.12,-.11),cross=profileArm(1.40,.26,[-1,1].map(s=>({x:s*.30,side:'bottom'})),.12,-.11);
 const knee=(()=>{const s=new T.Shape();s.moveTo(0,0);s.lineTo(.76,.57);s.lineTo(.82,.72);s.bezierCurveTo(.58,.65,.56,.43,.37,.37);s.bezierCurveTo(.22,.34,.24,.18,0,0);s.closePath();return solid(s,.16,.009);})();
 function capital(x,y,z,{scale=1,height=1,depth=1,corner=false,headFitting=true}={}){B.with(x,y,z,0,()=>{
  B.emit(daito,wood);for(const axis of[0,1])B.emit(first[axis],wood,0,.33,0,1,1,1,axis*Math.PI/2);
  for(const sign of[-1,1]){B.emit(makito,wood,sign*.30,.43,0);B.emit(makito,wood,0,.43,sign*.30);}
  for(const sign of[-1,1]){B.emit(second[0],wood,0,.68,sign*.30);B.emit(second[1],wood,sign*.30,.68,0,1,1,1,Math.PI/2);}
  for(const sx of[-1,1])for(const sz of[-1,1])B.emit(makito,wood,sx*.30,.78,sz*.30);
  for(const sign of[-1,1])B.emit(receiver,wood,0,1.04,sign*.30);B.emit(cross,wood,0,1.04,0,1,1,1,Math.PI/2);
  // Small tenon cheeks and inserted hardwood keys explain each crossing.
  for(const sx of[-1,1])for(const sz of[-1,1]){moulding(sx*.30,.89,sz*.453,.072,.045,.016,dark);moulding(sx*.30,1.08,sz*.443,.075,.035,.016,dark);}
  moulding(0,1.185,0,1.58,.07,.28);for(const sx of[-1,1])moulding(sx*.30,1.185,0,.23,.07,1.40);
  // The reference's gilt plate belongs at the post head; arm cheeks stay
  // dark wood instead of the old repeated full-face yellow squares.
  if(headFitting)fitting(0,.06,.342,.32,.31);for(const sign of[-1,1])B.with(sign*.326,.07,0,sign*Math.PI/2,()=>fitting(0,0,0,.24,.24,{old:true}));
  for(const sign of[-1,1]){mirrorEmit(curl,wood,sign*.31,.63,.432,sign*.66,.55,1.6);carveLeaf(sign*.44,.61,.437,.22,.27,sign<0?Math.PI-.32:.32,wood,1.4);}
  if(corner)for(const sign of[-1,1])mirrorEmit(knee,wood,0,.27,.03,sign,1,1,sign*Math.PI/4);
 },[scale,scale*height,scale*depth]);}
 function reliefStrip(left,right,y,z,height=.28,{rich=true,phase=0,wooden=false}={}){const width=right-left,cx=(left+right)/2,h=height;
  moulding(cx,y,z,width,h,.32);moulding(cx,y,z+.170,width-.065,h-.052,.022,dark);
  for(const sign of[-1,1]){moulding(cx,y+sign*(h/2-.011),z+.198,width,.025,.034);moulding(cx,y+sign*(h/2-.038),z+.196,width-.025,.014,.017,'hall149OldGilt');}
  const count=Math.max(2,Math.round(width/.68)),step=(width-.12)/count,points=[];
  for(let j=0;j<=count*8;j++){const t=j/(count*8);points.push([left+.06+t*(width-.12),y+Math.sin(t*count*Math.PI*2+phase)*h*.17,z+.202+.008*Math.sin(t*Math.PI*4)]);}B.emit(closedCurve(points,.015),wooden?wood:'hall149OldGilt');
  for(let k=0;k<count;k++){const x=left+.06+(k+.5)*step,sign=k%2?-1:1,yy=y+sign*h*.05,angle=sign*.52,ma=wooden?wood:k%3?'gold':'goldDark';
   carveLeaf(x-step*.36,yy,z+.203,step*.50,h*1.85,angle,ma,.96,.89+(k%4)*.035);carveLeaf(x+step*.10,yy,z+.208,step*.44,h*1.55,Math.PI-angle,ma,1.06);
   B.emit(curl,metal(ma),x-step*.12,y-sign*h*.09,z+.211,step*.60,h*2.35,1.05,[0,0,sign<0?Math.PI:0]);
   if(rich&&k%2===0)lotus(x,y,z+.225,h*.37,wooden?wood:'gold',k*.31);
  }
 }
 function arch(left,right,y,z){const width=right-left-.30,cx=(left+right)/2,s=new T.Shape();s.moveTo(-width/2,.13);s.lineTo(width/2,.13);s.lineTo(width/2,.005);s.bezierCurveTo(width*.41,-.02,width*.36,-.22,width*.25,-.23);s.bezierCurveTo(width*.14,-.25,width*.13,-.09,0,-.10);s.bezierCurveTo(-width*.13,-.09,-width*.14,-.25,-width*.25,-.23);s.bezierCurveTo(-width*.36,-.22,-width*.41,-.02,-width/2,.005);s.closePath();B.emit(solid(s,.235,.011),wood,cx,y,z);
  // Broad carved leaves follow the member's shoulders; recessed margins
  // stay visible between the ornament and the curved timber silhouette.
  for(const sign of[-1,1]){mirrorEmit(curl,wood,cx+sign*width*.20,y-.025,z+.137,sign*width*.60,.47,1.2);carveLeaf(cx+sign*width*.08,y+.015,z+.135,width*.20,.24,sign<0?Math.PI-.10:.10,wood,1.25);carveLeaf(cx+sign*width*.30,y-.015,z+.139,width*.15,.22,sign<0?-.10:Math.PI+.10,'goldDark',.9);}
 }
 const shaft=keep(new T.CylinderGeometry(.93,1,1,48,1)),ring=keep(new T.TorusGeometry(1,.045,8,48));
 function column(x,z,base,top,r=.31,{headFittingHeight=.40}={}){
  B.cyl(x,base+.10,z,r*1.40,.20,'stoneLight');B.cyl(x,base+.25,z,r*1.20,.16,'stone');const start=base+.34;
  B.emit(shaft,'red',x,(start+top)/2,z,r,top-start,r);B.cyl(x,base+.39,z,r*1.04,.12,'goldDark');
  for(const yy of[base+.65,top-.15]){B.cyl(x,yy,z,r*1.015,.10,'goldDark');B.emit(ring,'goldDark',x,yy-.048,z,r,r,r,[Math.PI/2,0,0]);}
  fitting(x,top-.07,z+r*.96,r*1.50,headFittingHeight);
 }
 function portal(center=.6){B.label('hall149-sculpted-open-portal',()=>{
  for(const sign of[-1,1])B.with(center+sign*2.08,3.62,3.80,0,()=>{
   moulding(0,0,0,.36,4.65,.48,dark);moulding(0,0,.262,.30,4.57,.065,wood);
   // Turn a continuous carved member into a jamb; its backing is housed
   // in the original frame and each raised leaf has real undercut depth.
   B.with(0,0,.125,0,()=>{const mat=new T.Matrix4().makeRotationZ(Math.PI/2);B.stack.push(B.stack.at(-1).clone().multiply(mat));reliefStrip(-2.235,2.235,0,.16,.235,{rich:true,phase:sign*.7});B.stack.pop();});
   for(const side of[-1,1])moulding(side*.168,0,.265,.027,4.65,.044,'goldDark');
  });
  for(const yy of[1.40,5.97]){moulding(center,yy,3.80,4.50,.27,.47);reliefStrip(center-2.15,center+2.15,yy,3.89,.25,{rich:true,phase:yy});}
  // The long transom is framed as one relief panel, with separately cast
  // corner leaves. It does not introduce text or change the portal opening.
  for(const sign of[-1,1])B.with(center+sign*2.17,5.95,4.12,0,()=>{mirrorEmit(curl,'hall149Gilt',0,0,0,sign*.65,.65,1.1);carveLeaf(sign*.025,-.05,.018,.25,.32,sign<0?Math.PI+.65:-.65,'gold',1.1);});
 });}
 return {capital,fitting,frieze:reliefStrip,arch,column,portal,moulding,revision:'hall149-solid-carving-and-housed-cross-receivers',resources:owned};
}
