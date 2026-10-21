import {T,V} from './kernel.js';

// A bounded background foliage-shoot aggregate with real branch axes and
// closed pointed leaf sprays. The former smooth crown spheres are removed.
// This is authored distant geometry, not a screen-space leaf texture/card.
export function woodlandTerminal148(){
 const positions=[],uv=[],indices=[];let leafSprays=0;
 function pointedSpray(base,tip,radius){
  const d=tip.clone().sub(base).normalize(),side=V([0,1,0]).cross(d);if(side.lengthSq()<1e-8)side.set(1,0,0);side.normalize();const up=d.clone().cross(side).normalize(),first=positions.length/3;
  for(let j=0;j<3;j++){const a=j*Math.PI*2/3,p=base.clone().addScaledVector(side,Math.cos(a)*radius).addScaledVector(up,Math.sin(a)*radius);positions.push(...p.toArray());uv.push(j/2,0);}
  positions.push(...tip.toArray());uv.push(.5,1);indices.push(first,first+2,first+1,first,first+1,first+3,first+1,first+2,first+3,first+2,first,first+3);leafSprays++;
 }
 for(let branch=0;branch<6;branch++){
  const a=branch*2.399,tip=V([Math.cos(a)*(.76+.13*Math.sin(branch*2)),.04+.40*Math.sin(branch*1.7)**2,Math.sin(a)*(.72+.16*Math.cos(branch*3))]),axis=tip.clone().sub(V([0,-.25,0])),direction=axis.clone().normalize(),side=V([Math.cos(a+Math.PI/2),0,Math.sin(a+Math.PI/2)]);
  for(let j=0;j<4;j++){
   const t=.17+j*.225,base=V([0,-.25,0]).addScaledVector(axis,t);
   for(const sign of[-1,1]){
    const end=base.clone().addScaledVector(direction,.24+.12*(1-t)).addScaledVector(side,sign*(.28+.12*Math.sin(branch*3+j))).add(V([0,.13+.10*Math.sin(j+branch),0]));
    pointedSpray(base,end,.079+.020*Math.sin(j*4+branch)**2);
    // A third upward shoot closes the crown through depth; the rejected first
    // terminal was too open and exposed every branch axis against the hill.
    if(sign>0){const upper=base.clone().addScaledVector(direction,.25).add(V([Math.cos(a+.7)*.15,.37+Math.sin(j*2+branch)*.08,Math.sin(a+.7)*.15]));pointedSpray(base,upper,.068);}

   }
  }
  pointedSpray(V([0,-.25,0]),tip,.055);
 }
 const source=new T.BufferGeometry();source.setAttribute('position',new T.Float32BufferAttribute(positions,3));source.setAttribute('uv',new T.Float32BufferAttribute(uv,2));source.setIndex(indices);const geometry=source.toNonIndexed();source.dispose();geometry.computeVertexNormals();geometry.name='scene02-branched-closed-pointed-woodland-terminal148';geometry.userData={construction:'Six branching axes, attached closed pointed foliage sprays and irregular twig-tip silhouette',leafSprays,screenFacing:false};return geometry;
}
