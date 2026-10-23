import * as T from 'three';

// Independently authored closed lotus carving. No source-statue vertex is edited.
function carvedPetal(kind){
 const rows=48,cols=28,stride=(rows+1)*(cols+1),positions=[],uv=[],indices=[];
 for(let skin=0;skin<2;skin++)for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  const t=j/rows,u=i/cols*2-1,w=Math.max(0,Math.sin(Math.PI*t));
  const envelope=Math.pow(w,.71)*(1-.30*t),width=(.225+kind*.010)*envelope;
  const turn=(kind-1)*.016*Math.sin(Math.PI*t)*t;
  const radius=.10+(.37-.015*kind)*Math.sin(Math.PI*t*.88)-.045*t;
  const cup=.054*Math.pow(w,.85)*Math.pow(Math.max(0,1-u*u),.62);
  const rib=.018*w*Math.exp(-Math.pow(u/.15,2));
  const chase=-.006*w*(Math.exp(-Math.pow((u-.56)/.07,2))+Math.exp(-Math.pow((u+.56)/.07,2)));
  const returnEdge=-.018*w*Math.pow(Math.abs(u),4);
  const thickness=.009+.006*w;
  positions.push(u*width+turn,t+.020*w*Math.pow(Math.abs(u),5),radius+(skin===0?thickness+cup+rib+chase+returnEdge:-thickness-.018*w));
  uv.push(i/cols,t);
  if(j<rows&&i<cols){const a=skin*stride+j*(cols+1)+i;skin===0?indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1):indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
 }
 const edges=[];for(let i=0;i<cols;i++)edges.push(i);for(let j=0;j<rows;j++)edges.push(j*(cols+1)+cols);for(let i=cols;i>0;i--)edges.push(rows*(cols+1)+i);for(let j=rows;j>0;j--)edges.push(j*(cols+1));
 for(let k=0;k<edges.length;k++){const a=edges[k],c=edges[(k+1)%edges.length];indices.push(a,c+stride,c,a,a+stride,c+stride);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 g.userData.closedCarvedShell=true;g.userData.reference6Reconstruction='adoption179-r02-solid-chased-lotus-petal';return g;
}

export function buildLayeredSourceLotus179(b,{radius,height}){
 const petals=[0,1,2].map(k=>b.geometry('adoption179-r02-chased-lotus-petal-'+k,()=>carvedPetal(k)));
 // Recessed wood core and broad solid top bearing support the complete real hem.
 b.lathe('adoption179-r02-lotus-core',[[0,0],[.58,0],[.69,.10],[.78,.32],[.79,.59],[.76,.83],[.79,.99],[0,.99]],0,0,0,radius,height,'lotusShadow',64);
 const rings=[{n:16,base:.015,r:.57,h:.78,phase:0},{n:16,base:.28,r:.53,h:.76,phase:.50},{n:18,base:.54,r:.45,h:.50,phase:.12}];
 for(const [row,ring]of rings.entries())for(let k=0;k<ring.n;k++){
  const a=(k+ring.phase)/ring.n*Math.PI*2,variation=1+.035*Math.sin(k*2.29+row*.91),kind=(k+row)%3;
  b.withTransform(Math.sin(a)*radius*ring.r,height*ring.base,Math.cos(a)*radius*ring.r,1,()=>{
   b.withTransform(0,0,0,1,()=>b.add(petals[kind],k%4===0?'lotusGiltSoft':'lotusGold',0,0,0,radius*(row===2?.88:1),height*ring.h*variation,radius*(row===2?.75:1),0,0,.021*Math.sin(k*1.7+row)),a);
  });
 }
 // Rounded lower torus and a restrained leaf-and-bead foot separate wood from gilt.
 b.lathe('adoption179-r02-lotus-lower-cast-moulding',[[.54,0],[.62,0],[.66,.018],[.66,.040],[.62,.060],[.55,.060],[.54,0]],0,0,0,radius,1,'lotusShadow',64);
 b.torus(0,.045,0,radius*.63,.009,'lotusEdge',Math.PI/2);
 b.lathe('adoption179-r02-source-bearing',[[0,-.012],[.76,-.012],[.81,-.006],[.81,.010],[.76,.018],[0,.018]],0,height-.015,0,radius,1,'lotusShadow',64);
 b.root.userData.sourceLotus179={revision:'r02',rows:3,petals:rings.reduce((n,r)=>n+r.n,0),height,radius,bearingRadius:radius*.81,sourceSculptureEdited:false,construction:'Closed front/back chased petal volumes with returned margins, layered overlap, recessed wood core and full-contact bearing.',visualAccepted:false};
}
