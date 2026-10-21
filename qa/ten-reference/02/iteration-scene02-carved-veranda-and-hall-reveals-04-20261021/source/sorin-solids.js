import * as T from 'three';

// Closed surfaces of revolution, with shared seam/pole indices. Each plate
// has a real annular web, thick rolled rim and a seated inner bore.
export function revolveProfile(profile,segments=96,name='turned-metal-solid'){
 const p=[],uv=[],ids=[],rings=[];
 for(let j=0;j<profile.length;j++){
  const [r,y]=profile[j],ring=[];
  if(Math.abs(r)<1e-9){ring.push(p.length/3);p.push(0,y,0);uv.push(.5,j/(profile.length-1));}
  else for(let k=0;k<segments;k++){const a=k/segments*Math.PI*2;ring.push(p.length/3);p.push(Math.cos(a)*r,y,Math.sin(a)*r);uv.push(k/segments,j/(profile.length-1));}
  rings.push(ring);
 }
 for(let j=0;j<rings.length;j++){
  const a=rings[j],b=rings[(j+1)%rings.length];if(a.length===1&&b.length===1)continue;
  for(let k=0;k<segments;k++){const n=(k+1)%segments;if(a.length===1)ids.push(a[0],b[n],b[k]);else if(b.length===1)ids.push(a[k],a[n],b[0]);else ids.push(a[k],a[n],b[k],a[n],b[n],b[k]);}
 }
 let volume=0;for(let i=0;i<ids.length;i+=3){const a=new T.Vector3(...p.slice(ids[i]*3,ids[i]*3+3)),b=new T.Vector3(...p.slice(ids[i+1]*3,ids[i+1]*3+3)),c=new T.Vector3(...p.slice(ids[i+2]*3,ids[i+2]*3+3));volume+=a.dot(b.cross(c))/6;}if(volume<0)for(let i=0;i<ids.length;i+=3)[ids[i+1],ids[i+2]]=[ids[i+2],ids[i+1]];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.name=name;g.userData={closedTurnedSolid:true,volumeMetresCubed:Math.abs(volume),photoTexture:false};return g;
}

export function buildTurnedSorin(b,{base=15.30,count=19}={}){
 const boot=[[0,14.90],[.54,14.90],[.60,14.94],[.58,15.02],[.42,15.08],[.41,15.16],[.29,15.21],[.25,15.27],[0,15.30]];
 b.put(revolveProfile(boot,96,'closed-stepped-sorin-boot'),'sorinBronze');
 b.put(revolveProfile([[0,base+.04],[.16,base+.04],[.18,base+.18],[.16,base+.30],[.14,base+1.0],[.10,base+4.38],[.095,base+4.62],[0,base+4.62]],96,'continuous-sorin-central-post'),'sorinGold');
 const rows=[];
 for(let j=0;j<count;j++){
  const t=j/(count-1),y=base+.38+4.06*(1-Math.pow(1-t,1.25)),r=.48-.216*t,h=.112-.030*t,inner=.080;
  const profile=[[inner,-h*.11],[r*.60,-h*.14],[r*.81,-h*.29],[r*.92,-h*.48],[r*.985,-h*.29],[r,0],[r*.985,h*.29],[r*.92,h*.48],[r*.81,h*.35],[r*.60,h*.14],[inner,h*.11]];
  b.put(revolveProfile(profile,96,`closed-sorin-flanged-plate-${j+1}`),'sorinGold',[0,y,0]);rows.push({height:y,outerRadius:r,rolledRimThickness:h*.96,webThickness:h*.22,boreRadius:inner});
 }
 b.ball(0,base+4.65,0,.17,.24,.17,'sorinGold');b.cyl(0,base+5.06,0,.025,.70,'sorinGold');
 return{kind:'closed lathe annular plates, rolled rims and continuous central post',plates:count,rows,baseSeat:14.90,bootTop:base,top:base+5.41,axisPreserved:true,referencePhotographUsedAsTexture:false};
}
