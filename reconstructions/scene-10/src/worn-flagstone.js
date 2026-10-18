// Metric solid flagstones. The top is a shared-edge triangulation, so its
// shallow crown, weathered hollows and chipped rim exist in the actual mesh.
export function createWornFlagstone(T,{points,topOffset=0,seed=1}={}){
 const fract=x=>x-Math.floor(x),hash=(x,z)=>fract(Math.sin(x*127.1+z*311.7+seed*17.13)*43758.5453);
 const noise=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,u=a*a*(3-2*a),v=b*b*(3-2*b);return(1-v)*((1-u)*hash(i,j)+u*hash(i+1,j))+v*((1-u)*hash(i,j+1)+u*hash(i+1,j+1));};
 const cx=points.reduce((s,p)=>s+p[0],0)/points.length,cz=points.reduce((s,p)=>s+p[1],0)/points.length;
 const edgeDistance=(x,z)=>{let d=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],q=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-a[0]-q*dx,z-a[1]-q*dz));}return d;};
 const crown=.004+.006*hash(7,9),tiltX=(hash(11,4)-.5)*.014,tiltZ=(hash(3,17)-.5)*.014;
 const top=(x,z)=>{
  const edge=edgeDistance(x,z),round=1-Math.exp(-edge/.075);
  const hollow=.0055*(noise(x*7.1,z*7.1)-.5)+.003*(noise(x*15.7,z*15.7)-.5);
  return .038+topOffset+crown*round+(x-cx)*tiltX+(z-cz)*tiltZ+hollow;
 };
 const inner=points.map(([x,z],i)=>{const dx=cx-x,dz=cz-z,l=Math.hypot(dx,dz),rim=.011+.013*hash(i,23);return[x+dx/l*rim,z+dz/l*rim];});
 const contour=inner.map(p=>new T.Vector2(...p)),vertices=inner.map(p=>[...p]);
 let faces=T.ShapeUtils.triangulateShape(contour,[]);
 const spacing=cz>7?.040:.065,limit=spacing*spacing;
 // Split shared edges as a batch; neighbouring triangles retain identical
 // midpoint vertices and cannot open cracks under the displacement field.
 for(let iteration=0;iteration<10;iteration++){
  const edges=new Map(),key=(a,b)=>a<b?a+':'+b:b+':'+a;
  for(const f of faces)for(let k=0;k<3;k++){
   const a=f[k],b=f[(k+1)%3],p=vertices[a],q=vertices[b];
   if((p[0]-q[0])**2+(p[1]-q[1])**2>limit){const id=key(a,b);if(!edges.has(id)){edges.set(id,vertices.length);vertices.push([(p[0]+q[0])*.5,(p[1]+q[1])*.5]);}}
  }
  if(!edges.size)break;
  const next=[];
  for(const f of faces){
   let[a,b,c]=f,ab=edges.get(key(a,b)),bc=edges.get(key(b,c)),ca=edges.get(key(c,a));
   const count=Number(ab!==undefined)+Number(bc!==undefined)+Number(ca!==undefined);
   if(!count){next.push(f);continue;}
   if(count===3){next.push([a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]);continue;}
   // Rotate the triangle to a single split AB, or the two splits AB and BC.
   if(count===1){if(bc!==undefined){[a,b,c]=[b,c,a];ab=bc;}else if(ca!==undefined){[a,b,c]=[c,a,b];ab=ca;}next.push([a,ab,c],[ab,b,c]);}
   else{if(ab===undefined){[a,b,c]=[b,c,a];[ab,bc]=[bc,ca];}else if(bc===undefined){[a,b,c]=[c,a,b];[ab,bc]=[ca,ab];}next.push([b,bc,ab],[a,ab,c],[ab,bc,c]);}
  }
  faces=next;
 }
 const pos=vertices.flatMap(([x,z])=>[x,top(x,z),z]),indices=[];
 for(let[a,b,c]of faces){const p=vertices[a],q=vertices[b],r=vertices[c];if((q[1]-p[1])*(r[0]-p[0])-(q[0]-p[0])*(r[1]-p[1])<0)[b,c]=[c,b];indices.push(a,b,c);}
 const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute(pos,3));cap.setIndex(indices);cap.computeVertexNormals();
 const positions=[],normals=[],uv=[];
 const append=(p,n)=>{positions.push(...p);normals.push(...n);uv.push(p[0],-p[2]);};
 for(const id of indices)append([pos[id*3],pos[id*3+1],pos[id*3+2]],[cap.attributes.normal.getX(id),cap.attributes.normal.getY(id),cap.attributes.normal.getZ(id)]);
 const triangle=(a,b,c,up=null)=>{let normal=new T.Vector3(...b).sub(new T.Vector3(...a)).cross(new T.Vector3(...c).sub(new T.Vector3(...a)));if(up&&normal.dot(up)<0){[b,c]=[c,b];normal.negate();}normal.normalize();for(const p of[a,b,c])append(p,normal.toArray());};
 for(let i=0;i<points.length;i++){
  const j=(i+1)%points.length,a=points[i],b=points[j],ia=inner[i],ib=inner[j];
  const ya=top(a[0],a[1])-.004-.005*hash(i,41),yb=top(b[0],b[1])-.004-.005*hash(j,41);
  const A=[a[0],ya,a[1]],B=[b[0],yb,b[1]],I=[ia[0],top(...ia),ia[1]],J=[ib[0],top(...ib),ib[1]],up=new T.Vector3(0,1,0);
  triangle(A,I,B,up);triangle(B,I,J,up);
  const lowerA=[a[0],-.09+topOffset,a[1]],lowerB=[b[0],-.09+topOffset,b[1]],out=new T.Vector3((a[0]+b[0])*.5-cx,0,(a[1]+b[1])*.5-cz);
  triangle(lowerA,A,lowerB,out);triangle(lowerB,A,B,out);
 }
 const bottomFaces=T.ShapeUtils.triangulateShape(points.map(p=>new T.Vector2(...p)),[]);
 for(const f of bottomFaces)triangle(...f.map(i=>[points[i][0],-.09+topOffset,points[i][1]]),new T.Vector3(0,-1,0));
 cap.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geometry.userData.surface='solid-worn-flagstone';geometry.userData.reliefMetres={crown:[.004,.010],hollows:.0085,bevel:[.011,.024],nearEdgeSpacing:.040};return geometry;
}
