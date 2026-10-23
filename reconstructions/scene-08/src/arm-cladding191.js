import * as T from 'three';

// Each closed sleeve is cut from its actual carried timber, including the
// curved underside and bevel. A small radial allowance keeps the cast skin
// outside the wood; no support or contact datum is altered.
function endSleeve(source,axis,sign){
 const p=source.attributes.position,n=source.attributes.normal,ix=source.index;
 source.computeBoundingBox();const bounds=source.boundingBox,centre=bounds.getCenter(new T.Vector3()),a=axis==='x'?0:2,other=a===0?[1,2]:[0,1],lo=bounds.min.getComponent(a),hi=bounds.max.getComponent(a),cut=sign>0?hi-.145:lo+.145;
 const out=[],normals=[],cap=new Map(),point=i=>{const q=new T.Vector3().fromBufferAttribute(p,i);for(const k of other)q.setComponent(k,centre.getComponent(k)+(q.getComponent(k)-centre.getComponent(k))*1.025);q.setComponent(a,q.getComponent(a)+sign*.003);return{p:q,n:new T.Vector3().fromBufferAttribute(n,i)};};
 const distance=q=>sign*(q.p.getComponent(a)-cut),append=(aa,bb,cc)=>{for(const q of[aa,bb,cc]){out.push(...q.p);normals.push(...q.n);}},remember=q=>{const key=q.p.toArray().map(v=>Math.round(v*1e6)).join(',');if(!cap.has(key))cap.set(key,q.p.clone());};
 for(let j=0;j<(ix?.count??p.count);j+=3){
  const tri=[0,1,2].map(k=>point(ix?ix.getX(j+k):j+k)),polygon=[];
  for(let k=0;k<3;k++){
   const aa=tri[k],bb=tri[(k+1)%3],da=distance(aa),db=distance(bb),inside=da>=0;
   if(inside)polygon.push(aa);
   if((da>=0)!==(db>=0)){const t=da/(da-db),q={p:aa.p.clone().lerp(bb.p,t),n:aa.n.clone().lerp(bb.n,t).normalize()};q.p.setComponent(a,cut);polygon.push(q);remember(q);}
  }
  for(let k=1;k+1<polygon.length;k++)append(polygon[0],polygon[k],polygon[k+1]);
 }
 const ring=[...cap.values()],c=ring.reduce((sum,v)=>sum.add(v),new T.Vector3()).multiplyScalar(1/ring.length),normal=new T.Vector3().setComponent(a,-sign);
 ring.sort((aa,bb)=>Math.atan2(aa.getComponent(other[1])-c.getComponent(other[1]),aa.getComponent(other[0])-c.getComponent(other[0]))-Math.atan2(bb.getComponent(other[1])-c.getComponent(other[1]),bb.getComponent(other[0])-c.getComponent(other[0])));
 if(sign>0)ring.reverse();
 for(let k=0;k<ring.length;k++)append({p:c,n:normal},{p:ring[k],n:normal},{p:ring[(k+1)%ring.length],n:normal});
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.name='scene08-191-closed-cast-arm-end-sleeve';g.userData={sourcePart:source.name||source.type,axis,sign,cut,actualSourceProfile:true,radialAllowance:1.025,endAllowance:.003};return g;
}

export function createArmCladding191(galleryJoinery){
 const parts=[];
 // The six actual crossed curved arms, excluding cushions, bearing beams
 // and their existing small face shoes. Their source geometry is untouched.
 for(const i of[1,2,7,8,9,10]){
  const source=galleryJoinery.parts[i].geometry;source.computeBoundingBox();const s=source.boundingBox.getSize(new T.Vector3()),axis=s.x>s.z?'x':'z';
  for(const sign of[-1,1])parts.push({geometry:endSleeve(source,axis,sign),material:'castgilt191',sourcePartIndex:i,axis,sign});
 }
 return{parts,info:{revision:'scene08-profile-fitted-cast-arm-cladding191-r04',sourceArmParts:[1,2,7,8,9,10],closedSleevesPerKit:parts.length,actualTimberProfile:true,memberGeometryAndContactDatumsUnchanged:true,scannedAssetsAdded:0,photographSampled:false,visualAccepted:false}};
}

export function createCantileverCladding191(source){return endSleeve(source,'x',1);}
