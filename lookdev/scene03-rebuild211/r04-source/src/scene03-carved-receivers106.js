// Closed pierced leaf/cloud castings fitted to real beam/receiver faces.
// Motif names are an interpretation of the photograph, not an exact historic
// iconographic identification. No image/height bitmap enters these solids.
export function createCarvedReceivers106(T,{emit,keep}){
 let faces=0;const cuffCache=new Map();
 function closed(shape,depth,name){const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:16,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:3});g.name=name;g.userData={closedCastOrCarvedSolid:true,interpretiveMotif:'pierced foliate receiver',referenceRGB:false};keep(g);return g;}
 const outline=new T.Shape();for(let i=0;i<80;i++){const a=i/80*Math.PI*2,r=.415+.047*Math.cos(a*8)+.015*Math.sin(a*3),x=Math.cos(a)*r,y=Math.sin(a)*r;i?outline.lineTo(x,y):outline.moveTo(x,y);}outline.closePath();
 for(let j=0;j<4;j++){const a=j*Math.PI/2+Math.PI/4,hole=new T.Path();for(let i=0;i<32;i++){const b=-i/32*Math.PI*2,u=.048*Math.cos(b),v=.11*Math.sin(b),x=Math.cos(a)*(.255+v)-Math.sin(a)*u,y=Math.sin(a)*(.255+v)+Math.cos(a)*u;i?hole.lineTo(x,y):hole.moveTo(x,y);}hole.closePath();outline.holes.push(hole);}
 const plate=closed(outline,.052,'scene03-closed-pierced-foliate-receiver106');
 const s=new T.Shape();s.moveTo(0,-.105);s.bezierCurveTo(-.13,-.02,-.16,.10,-.065,.21);s.quadraticCurveTo(-.032,.31,0,.385);s.quadraticCurveTo(.032,.31,.065,.21);s.bezierCurveTo(.16,.10,.13,-.02,0,-.105);s.closePath();
 const slit=new T.Path();slit.moveTo(0,.025);slit.bezierCurveTo(.030,.085,.020,.18,0,.235);slit.bezierCurveTo(-.020,.18,-.030,.085,0,.025);slit.closePath();s.holes.push(slit);
 const petal=closed(s,.065,'scene03-closed-cupped-gilt-carved-leaf106'),p=petal.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i);if(z>0)p.setZ(i,z+.026*Math.sin(Math.PI*(y+.105)/.49));}petal.computeVertexNormals();
 const boss=new T.SphereGeometry(1,20,12);boss.name='scene03-closed-small-cast-receiver-boss106';keep(boss);
 function face(x,y,z,w,h,depth=.32){
  emit(plate,'oldgold',x,y,z+.008,w,h,depth);
  for(let j=0;j<4;j++){const a=j*Math.PI/2+.08;emit(petal,'bearingGilt',x,y,z+.046*depth,w*.78,h*.78,depth,[0,0,a]);}
  emit(boss,'bearingGilt',x,y,z+.082*depth,w*.105,h*.105,.024*depth);faces++;
 }
 function cuff(radius,height=.42){
  const key=radius+':'+height;if(cuffCache.has(key))return cuffCache.get(key);
  const pp=[],uv=[],N=48,inner=radius+.002,outer=radius+.009,P=(i,y,r)=>{const a=-.88+i/N*1.76;return[Math.sin(a)*r,y,Math.cos(a)*r];},tri=(a,b,c)=>{for(const v of[a,b,c]){pp.push(...v);uv.push(v[0],v[1]);}};
  for(let i=0;i<N;i++){
   const a=P(i,-height/2,outer),b=P(i+1,-height/2,outer),c=P(i,height/2,outer),d=P(i+1,height/2,outer),aa=P(i,-height/2,inner),bb=P(i+1,-height/2,inner),cc=P(i,height/2,inner),dd=P(i+1,height/2,inner);
   tri(a,b,c);tri(b,d,c);tri(aa,cc,bb);tri(bb,cc,dd);tri(c,d,cc);tri(d,dd,cc);tri(a,aa,b);tri(b,aa,bb);
  }
  for(const i of[0,N]){const a=P(i,-height/2,outer),b=P(i,height/2,outer),c=P(i,-height/2,inner),d=P(i,height/2,inner);if(i===0){tri(a,b,c);tri(b,d,c);}else{tri(a,c,b);tri(b,c,d);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pp,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();g.name='scene03-closed-hollow-curved-neck-sleeve106';g.userData={closedCastOrCarvedSolid:true,metalGaugeMetres:.007,shaftRadiusMetres:radius};keep(g);cuffCache.set(key,g);return g;
 }
 return{face,cuff,get count(){return faces;},prototypePolicy:'Closed beveled pierced plates, cupped slotted leaves, bosses and hollow curved sleeves fitted to actual receivers'};
}
