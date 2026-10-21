import * as T from 'three';

// Closed terrain under the pagoda. The central plateau exactly receives the
// stone plinth at world Y5.72; plants and rock seats use the same height field.
export function buildPagodaBank139({emit,materials:M,scans,ownedMaterials}){
 const smooth=(v,a,b)=>T.MathUtils.smoothstep(v,a,b),height=(x,z)=>{
  const q=Math.max(Math.abs(x+13.6)/9,Math.abs(z+17)/9.5),edge=1-smooth(q,.46,1);
  let y=-.10+5.82*edge+.08*Math.sin(x*1.6+z*.7)*Math.sin(z*1.9)*edge*(1-edge);
  // The existing low corridor has its own cleared, supported terrace.
  const dx=x+7.5,dz=z+13,c=Math.cos(-.10),s=Math.sin(-.10),u=c*dx-s*dz,v=s*dx+c*dz,d=Math.hypot(Math.max(0,Math.abs(u)-3.9),Math.max(0,Math.abs(v)-2.6));
  y=Math.min(y,2.68+4.0*smooth(d,0,1.4));return y;
 };
 const soil=M.cutStoneDark.clone();soil.name='scene09-pagoda-terraced-loam-and-rock139';soil.color.setHex(0x30372b);soil.roughness=1;ownedMaterials.push(soil);
 const nx=80,nz=80,p=[],uv=[],ix=[],x0=-22.6,z0=-26.5;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*18/nx,z=z0+j*19/nz;p.push(x,height(x,z),z);uv.push(x,z);if(i<nx&&j<nz){const a=j*(nx+1)+i;ix.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}}
 const edge=[];for(let i=0;i<=nx;i++)edge.push(i);for(let j=1;j<=nz;j++)edge.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)edge.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)edge.push(j*(nx+1));
 const bottom=[];for(const a of edge){bottom.push(p.length/3);p.push(p[a*3],-.4,p[a*3+2]);uv.push(p[a*3],p[a*3+2]);}
 for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;ix.push(edge[i],edge[j],bottom[i],edge[j],bottom[j],bottom[i]);}const foot=p.length/3;p.push(-13.6,-.4,-17);uv.push(0,0);for(let i=0;i<bottom.length;i++)ix.push(foot,bottom[i],bottom[(i+1)%bottom.length]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(ix);geometry.computeVertexNormals();geometry.name='scene09-closed-pagoda-island-with-corridor-cut139';emit(geometry,soil);
 let stones=0;const roots=[];for(let i=0;i<96;i++){
  const a=i*2.399963,r=.60+.31*((Math.sin(i*9.17)+1)/2),x=-13.6+Math.cos(a)*9*r,z=-17+Math.sin(a)*9.5*r,y=height(x,z),scan=scans.variants[i%scans.variants.length],scale=.48+.25*((Math.sin(i*3.13)+1)/2);
  if(y<.08)continue;scan.geometry.computeBoundingBox();emit(scan.geometry,scan.material,x,y-scan.geometry.boundingBox.min.y*scale-.12,z,scale,scale*.88,scale,[.03,a,.02],.86);stones++;if(i%3===0)roots.push([x,y+.05,z]);
 }
 return{height,roots,info:{revision:'scene09-pagoda-ground139',plinthContactY:5.72,corridorFloorY:2.80,closedTerrain:true,stones,photoUsedAsSurface:false}};
}
