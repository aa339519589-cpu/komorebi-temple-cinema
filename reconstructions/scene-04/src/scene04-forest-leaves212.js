// A true volumetric distant leaf spray: individual bent lanceolate surfaces,
// no enclosing ellipsoid shell or scene-facing whole-tree card. Species and
// tiny hidden branching remain an authored forest LOD hypothesis.
export function createDistantLeafSpray212(T){
 let seed=721903;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),p=[],uv=[],c=[],ix=[],o=new T.Object3D(),v=new T.Vector3();
 for(let k=0;k<144;k++){
  const a=rand()*Math.PI*2,y=rand()*2-1,r=Math.cbrt(rand()),rr=Math.sqrt(1-y*y)*r,L=.30+.15*rand(),W=.055+.035*rand(),at=p.length/3;
  o.position.set(Math.cos(a)*rr,y*r*.82,Math.sin(a)*rr);o.rotation.set((rand()-.5)*1.8,rand()*Math.PI*2,(rand()-.5)*1.6);o.updateMatrix();
  const leaf=[[0,0,-L/2],[-W,.010,0],[0,.035,0],[W,.010,0],[0,-.008,L/2]],tex=[[.5,0],[0,.5],[.5,.5],[1,.5],[.5,1]],tone=.74+.34*rand();
  for(let j=0;j<leaf.length;j++){v.fromArray(leaf[j]).applyMatrix4(o.matrix);p.push(v.x,v.y,v.z);uv.push(...tex[j]);const q=tone*(j===2?1.05:1);c.push(q*.94,q,q*.77);}
  ix.push(at,at+2,at+1,at,at+3,at+2,at+2,at+4,at+1,at+3,at+4,at+2);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();g.userData.forest212={actualCurvedLeaves:144,enclosingShell:false,wholeTreeBillboard:false};return g;
}
