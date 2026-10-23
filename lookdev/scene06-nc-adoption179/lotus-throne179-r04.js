import * as T from 'three';

// Closed thin carved plates, with the meridian opening out toward its point.
// Geometry is independently authored; the source statue is never edited here.
function turnedPetal(kind){
 const rows=56,cols=32,stride=(rows+1)*(cols+1),positions=[],uv=[],indices=[];
 for(let side=0;side<2;side++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,sine=Math.max(0,Math.sin(Math.PI*t));
  const envelope=Math.pow(sine,.82)*(.66+.72*t);
  const width=(.205+kind*.007)*envelope;
  const sweep=(kind-1)*.027*t*t*sine;
  // A narrow concave root opens into a flared point. There is no outward
  // sin(pi*t) belly returning inward at the tip, which produced pumpkin lobes.
  const meridian=.045+.17*t+.16*Math.pow(t,4)+.012*(kind-1)*t*t;
  const hollow=-.027*Math.exp(-Math.pow((t-.24)/.27,2))*Math.pow(Math.max(0,1-u*u),.8);
  const leafFace=.011*sine*Math.pow(Math.max(0,1-u*u),.7);
  const foldedEdge=.040*sine*Math.pow(Math.abs(u),6);
  const rib=.006*sine*Math.exp(-Math.pow(u/.15,2));
  const chasing=-.0035*sine*(Math.exp(-Math.pow((u-.55)/.065,2))+Math.exp(-Math.pow((u+.55)/.065,2)));
  const thickness=.005+.0025*sine;
  const y=t-.045*Math.pow(t,7)+.027*sine*Math.pow(Math.abs(u),4);
  const face=meridian+hollow+leafFace+foldedEdge+rib+chasing;
  positions.push(u*width+sweep,y,face+(side===0?thickness:-thickness));uv.push(i/cols,t);
  if(j<rows&&i<cols){const a=side*stride+j*(cols+1)+i;side===0?indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1):indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
 }
 const boundary=[];for(let i=0;i<cols;i++)boundary.push(i);for(let j=0;j<rows;j++)boundary.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)boundary.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)boundary.push(j*(cols+1));
 for(let k=0;k<boundary.length;k++){const a=boundary[k],c=boundary[(k+1)%boundary.length];indices.push(a,c+stride,c,a,a+stride,c+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 g.userData.closedCarvedShell=true;g.userData.reference6Reconstruction='adoption179-r04-thin-flared-concave-root-lotus-petal';return g;
}

export function buildLayeredSourceLotus179(b,{radius,height,depthAspect,sourceBearing}){
 const petals=[0,1,2].map(k=>b.geometry('adoption179-r04-turned-lotus-petal-'+k,()=>turnedPetal(k)));
 b.lathe('adoption179-r04-recessed-lotus-core',[[0,0],[.55,0],[.62,.12],[.68,.40],[.68,.73],[.65,.97],[0,.97]],0,0,0,radius,height,'lotusShadow',64);
 const rings=[{n:16,base:.015,r:.61,h:.77,phase:.12,w:1.03,d:1},{n:14,base:.29,r:.51,h:.73,phase:.61,w:1.05,d:.97},{n:16,base:.59,r:.43,h:.48,phase:.25,w:.92,d:.83}];
 for(const [row,ring]of rings.entries())for(let k=0;k<ring.n;k++){
  const a=(k+ring.phase)/ring.n*Math.PI*2,kind=(k+row)%3;
  const varHeight=1+.055*Math.sin(k*2.19+row*.87),varWidth=1+.045*Math.cos(k*1.71-row*.33);
  b.withTransform(Math.sin(a)*radius*ring.r,height*ring.base,Math.cos(a)*radius*ring.r,1,()=>{
   b.withTransform(0,0,0,1,()=>b.add(petals[kind],(k+row)%5===0?'lotusGiltSoft':'lotusGold',0,0,0,radius*ring.w*varWidth,height*ring.h*varHeight,radius*ring.d,0,0,.037*Math.sin(k*1.31+row*.68)),a);
  });
 }
 b.lathe('adoption179-r04-lotus-lower-beaded-foot',[[.52,0],[.59,0],[.62,.016],[.62,.035],[.59,.052],[.53,.052],[.52,0]],0,0,0,radius,1,'lotusShadow',64);
 b.torus(0,.035,0,radius*.595,.008,'lotusEdge',Math.PI/2);
 if(sourceBearing?.outline?.length){
  // The actual contact envelope is inset under the scanned hem. A dark solid
  // bearing intersects only the concealed underside; no broad gold front shelf.
  const bearing=b.geometry('adoption179-r04-inset-source-contact:'+sourceBearing.uniformScale+':'+depthAspect,()=>{
   const shape=new T.Shape(),scale=sourceBearing.uniformScale*.90;
   sourceBearing.outline.forEach(([x,z],i)=>{const p=[x*scale,-z*scale/depthAspect];i?shape.lineTo(...p):shape.moveTo(...p);});shape.closePath();
   const g=new T.ExtrudeGeometry(shape,{depth:.092,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:3,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);
   g.userData.sourceDerivedBearing={license:'CC-BY-NC-SA-4.0',method:'Actual hem contact hull inset10percent, deeply recessed dark physical bearing. Source body vertices remain unchanged.'};return g;
  });
  b.add(bearing,'lacquer',0,height-.075,0);
 }else{
  b.lathe('adoption179-r04-attendant-concealed-seat',[[0,-.035],[.48,-.035],[.57,-.020],[.57,.015],[.48,.024],[0,.024]],0,height-.018,0,radius,1,'lotusShadow',48);
 }
 b.root.userData.sourceLotus179??=[];b.root.userData.sourceLotus179.push({revision:'r04',rows:3,petals:rings.reduce((n,r)=>n+r.n,0),height,radius,sourceBearingInset:sourceBearing?.outline?.length ? .90 : null,sourceSculptureEdited:false,construction:'Thin closed concave-root petals with outward flared points and returned solid margins; staggered unequal rings on recessed core; bearing concealed inside source envelope.',visualAccepted:false});
}
